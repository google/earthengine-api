"""Earth Engine helper functions for working with the Cloud API.

Many of the functions defined here are for mapping legacy calls in ee.data into
their new Cloud API equivalents. This generally requires remapping call
parameters and result values.
"""

import calendar
from collections.abc import Sequence
import copy
import datetime
import json
import os
import re
from typing import Any, Callable, Optional, Type, Union
import warnings

import google_auth_httplib2
from googleapiclient import discovery
from googleapiclient import http
from googleapiclient import model
import httplib2
import requests

from ee import ee_exception

# The Cloud API version.
VERSION = os.environ.get('EE_CLOUD_API_VERSION', 'v1')

PROJECT_ID_PATTERN = (r'^(?:\w+(?:[\w\-]+\.[\w\-]+)*?\.\w+\:)?'
                      r'[a-z][-a-z0-9]{4,28}[a-z0-9]$')
ASSET_NAME_PATTERN = (r'^projects/((?:\w+(?:[\w\-]+\.[\w\-]+)*?\.\w+\:)?'
                      r'[a-z][a-z0-9\-]{4,28}[a-z0-9])/assets/(.*)$')

ASSET_ROOT_PATTERN = (r'^projects/((?:\w+(?:[\w\-]+\.[\w\-]+)*?\.\w+\:)?'
                      r'[a-z][a-z0-9\-]{4,28}[a-z0-9])/assets/?$')

# The default user project to use when making Cloud API calls.
_cloud_api_user_project: Optional[str] = None


class _Http:
  """A httplib2.Http-like object based on requests."""
  _session: requests.Session
  _timeout: Optional[float]

  def __init__(
      self, session: requests.Session, timeout: Optional[float] = None
  ):
    self._timeout = timeout
    self._session = session

  def request(  # pylint: disable=invalid-name
      self,
      uri: str,
      method: str = 'GET',
      body: Optional[str] = None,
      headers: Optional[dict[str, str]] = None,
      redirections: Optional[int] = None,
      connection_type: Optional[type[Any]] = None,
  ) -> tuple[httplib2.Response, Any]:
    """Makes an HTTP request using httplib2 semantics."""
    del connection_type  # Ignored
    del redirections  # Ignored

    try:
      # googleapiclient is expecting an httplib2 object, and doesn't include
      # requests error in the list of transient errors. Therefore, transient
      # requests errors should be converted to kinds that googleapiclient
      # consider transient.
      response = self._session.request(
          method, uri, data=body, headers=headers, timeout=self._timeout
      )
    except requests.exceptions.ConnectionError as connection_error:
      raise ConnectionError(connection_error) from connection_error
    except requests.exceptions.ChunkedEncodingError as encoding_error:
      # This is not a one-to-one match, but it's close enough.
      raise ConnectionError(encoding_error) from encoding_error
    except requests.exceptions.Timeout as timeout_error:
      raise TimeoutError(timeout_error) from timeout_error
    headers = dict(response.headers)
    headers['status'] = response.status_code
    content = response.content
    return httplib2.Response(headers), content


def _wrap_request(
    headers_supplier: Callable[[], dict[str, Any]],
    response_inspector: Callable[[Any], None],
) -> Callable[..., http.HttpRequest]:
  """Builds a callable that wraps an API request.

  Args:
    headers_supplier: If not None, this will be called for each request and the
      resulting dict incorporated into that request's HTTP headers.
    response_inspector: If not None, this will be called with an
      httplib2.Response containing the HTTP response and body content.
      The call happens no matter what the HTTP response status was.

  Returns:
    Something that can be called in place of the http.HttpRequest constructor
    to build an HttpRequest.
  """
  if headers_supplier is None and response_inspector is None:
    return http.HttpRequest

  # pylint: disable=invalid-name
  def builder(
      http_transport: httplib2.Http,
      postproc: Callable[..., Any],
      uri: str,
      method: str = 'GET',
      body: Optional[Any] = None,
      headers: Optional[Any] = None,
      methodId: Optional[Any] = None,
      resumable: Optional[Any] = None,
  ) -> http.HttpRequest:
    """Builds an HttpRequest, adding headers and response inspection."""
    additional_headers = headers_supplier()
    if additional_headers:
      headers = headers.copy() if headers else {}
      headers.update(additional_headers)
    request = http.HttpRequest(
        http_transport,
        postproc,
        uri,
        method=method,
        body=body,
        headers=headers,
        methodId=methodId,
        resumable=resumable)
    if response_inspector:
      request.add_response_callback(response_inspector)
    return request

  return builder


def set_cloud_api_user_project(cloud_api_user_project: str) -> None:
  global _cloud_api_user_project
  _cloud_api_user_project = cloud_api_user_project


def build_cloud_resource(
    api_base_url: str,
    session: requests.Session,
    api_key: Optional[str] = None,
    credentials: Optional[Any] = None,
    timeout: Optional[float] = None,
    num_retries: int = 1,
    headers_supplier: Optional[Callable[[], dict[str, Any]]] = None,
    response_inspector: Optional[Callable[[Any], None]] = None,
    http_transport: Optional[Any] = None,
    raw: Optional[bool] = False,
) -> Any:
  """Builds an Earth Engine Cloud API resource.

  Args:
    api_base_url: The base URL of the cloud endpoints.
    session: The Requests session to issue all requests in. This manages
      shared resources, such as connection pools.
    api_key: An API key that's enabled for use with the Earth Engine Cloud API.
    credentials: OAuth2 credentials to use when authenticating to the API.
    timeout: How long a timeout to set on requests, in seconds.
    num_retries: The number of times to retry discovery with randomized
      exponential backoff, in case of intermittent/connection issues.
    headers_supplier: A callable that will return a set of headers to be applied
      to a request. Will be called once for each request.
    response_inspector: A callable that will be invoked with the raw
      httplib2.Response responses.
    http_transport: An optional custom http_transport to use.
    raw: Whether or not to return raw bytes when making method requests.

  Returns:
    A resource object to use to call the Cloud API.
  """
  discovery_service_url = (
      '{}/$discovery/rest?version={}&prettyPrint=false'
      .format(api_base_url, VERSION))
  if http_transport is None:
    http_transport = _Http(session, timeout)
  if credentials is not None:
    # Suppress the quota project, to avoid serviceUsage error from discovery.
    if credentials.quota_project_id:
      credentials = credentials.with_quota_project(None)
    http_transport = google_auth_httplib2.AuthorizedHttp(
        credentials, http=http_transport
    )
  request_builder = _wrap_request(headers_supplier, response_inspector)
  # Discovery uses json by default.
  if raw:
    alt_model = model.RawModel()
  else:
    alt_model = None

  def build(**kwargs):
    return discovery.build(
        'earthengine',
        VERSION,
        discoveryServiceUrl=discovery_service_url,
        developerKey=api_key,
        http=http_transport,
        requestBuilder=request_builder,
        model=alt_model,
        cache_discovery=False,
        num_retries=num_retries,
        **kwargs)  # pytype: disable=wrong-keyword-args

  resource = None
  try:
    # google-api-python-client made static_discovery the default in version 2,
    # but it's not backward-compatible. There's no reliable way to check the
    # package version, either.
    resource = build(static_discovery=False)
  except TypeError:
    pass  # Handle fallback case outside except block, for cleaner stack traces.
  if resource is None:
    resource = build()
  # pylint: disable-next=protected-access
  resource._baseUrl = api_base_url
  return resource


def build_cloud_resource_from_document(
    discovery_document: Any,
    http_transport: Optional[httplib2.Http] = None,
    headers_supplier: Optional[Callable[..., Any]] = None,
    response_inspector: Optional[Callable[..., Any]] = None,
    raw: bool = False,
) -> discovery.Resource:
  """Builds an Earth Engine Cloud API resource from a description of the API.

  This version is intended for use in tests.

  Args:
    discovery_document: The description of the API.
    http_transport: An HTTP transport object to use for the call.
    headers_supplier: A callable that will return a set of headers to be applied
      to a request. Will be called once for each request.
    response_inspector: A callable that will be invoked with the raw
      httplib2.Response responses.
    raw: Whether to return raw bytes when making method requests.

  Returns:
    A resource object to use to call the Cloud API.
  """
  request_builder = _wrap_request(headers_supplier, response_inspector)
  if http_transport is None:
    http_transport = _Http(requests.Session())
  alt_model = model.RawModel() if raw else None
  return discovery.build_from_document(
      discovery_document,
      http=http_transport,
      requestBuilder=request_builder,
      model=alt_model,
  )


def _convert_dict(
    to_convert: dict[str, Any],
    conversions: dict[str, Any],
    defaults: Optional[dict[str, Any]] = None,
    key_warnings: bool = False,
    retain_keys: bool = False,
) -> dict[str, Any]:
  """Applies a set of conversion rules to a dict.

  Args:
    to_convert: A dictionary of key/value pairs to convert.
    conversions: A dictionary giving the mapping from key names in "to_convert"
      to how those keys and their values will be handled. Key/value pairs in
      "to_convert" will be modified in a way that depends on how the key
      appears in "conversions". If "to_convert" contains a key/value mapping
      of "k"->"v", then:
      - If "conversions" contains "k"->"X" then the result will contain
        "X"->"v".
      - If "conversions" contains "k"->None then the result will not contain an
        entry for "k".
      - If "conversions" contains "k"->("X", f) then the result will contain
        "X"->f("v")
      - If "conversions" does not contain an entry for "k" then the result
        will not contain an entry for "k" unless retain_keys is true;
        if key_warnings is True then a warning will be printed.
      - If two or more distinct input keys are converted to the same output key,
        one of the resulting values will appear in the result, the others
        will be dropped, and a warning will be printed.
    defaults: Values to insert in the result if the result of conversion does
      not contain these keys.
    key_warnings: Whether to print warnings for input keys that are not mapped
      to anything in the output.
    retain_keys: Whether or not to retain the state of dict.  If false, any keys
      that don't show up in the conversions dict will be dropped from result.

  Returns:
    The "to_convert" dict with keys renamed, values converted, and defaults
    added.
  """
  result: dict[str, Any] = {}
  for key, value in to_convert.items():
    if key in conversions:
      conversion = conversions[key]
      if conversion is not None:
        if isinstance(conversion, tuple):
          key = conversion[0]
          value = conversion[1](value)
        else:
          key = conversion
        if key in result:
          warnings.warn(f'Multiple request parameters converted to {key}')
        result[key] = value
    elif retain_keys:
      result[key] = value
    elif key_warnings:
      warnings.warn(f'Unrecognized key {key} ignored')
  if defaults:
    for default_key, default_value in defaults.items():
      if default_key not in result:
        result[default_key] = default_value
  return result


def _convert_value(
    value: str, conversions: dict[str, Any], default: Any) -> Any:
  """Converts a value using a set of value mappings.

  Args:
    value: The value to convert.
    conversions: A dict giving the desired output for each of a set of possible
      input values.
    default: The value to return if the input value is not one of the ones
      listed in "conversions".

  Returns:
    The converted value.
  """
  return conversions.get(value, default)


def _convert_msec_to_timestamp(time_msec: float) -> str:
  """Converts a time value to a google.protobuf.Timestamp's string form.

  Args:
    time_msec: A time in msec since the Unix epoch.

  Returns:
    A string formatted like '2003-09-07T19:30:12.345Z', which is the expected
    form of google.protobuf.Timestamp values.
  """
  return (
      datetime.datetime.fromtimestamp(time_msec / 1000.0, datetime.timezone.utc)
      .replace(tzinfo=None)
      .isoformat()
      + 'Z'
  )


def _convert_timestamp_to_msec(timestamp: str) -> int:
  """Converts a google.protobuf.Timestamp's string form to a time in msec.

  Args:
    timestamp: A string formatted like '2003-09-07T19:30:12.345Z', which is the
      expected form of google.protobuf.Timestamp values.

  Returns:
    A time in msec since the Unix epoch.
  """
  # The fractional second part is optional. Sigh.
  if '.' in timestamp:
    parsed_timestamp = datetime.datetime.strptime(
        timestamp, '%Y-%m-%dT%H:%M:%S.%fZ')
  else:
    parsed_timestamp = datetime.datetime.strptime(
        timestamp, '%Y-%m-%dT%H:%M:%SZ')
  return (calendar.timegm(parsed_timestamp.utctimetuple()) * 1000 +
          int(parsed_timestamp.microsecond / 1000))


def _convert_bounding_box_to_geo_json(bbox: Sequence[float]) -> str:
  """Converts a lng/lat bounding box to a GeoJSON string."""
  lng_min, lat_min, lng_max, lat_max = bbox
  return ('{{"type":"Polygon","coordinates":'
          '[[[{0},{1}],[{2},{1}],[{2},{3}],[{0},{3}],[{0},{1}]]]}}'.format(
              lng_min, lat_min, lng_max, lat_max))


def convert_get_list_params_to_list_assets_params(params) -> dict[str, Any]:
  """Converts a getList params dict to something usable with listAssets."""
  params = _convert_dict(
      params, {
          'id': ('parent', convert_asset_id_to_asset_name),
          'num': 'pageSize',
          'starttime': ('startTime', _convert_msec_to_timestamp),
          'endtime': ('endTime', _convert_msec_to_timestamp),
          'bbox': ('region', _convert_bounding_box_to_geo_json),
          'region': 'region',
          'filter': 'filter'
      },
      key_warnings=True)
  # getList returns minimal information; we can filter unneeded stuff out
  # server-side.
  params['view'] = 'BASIC'
  return convert_list_images_params_to_list_assets_params(params)


def convert_list_assets_result_to_get_list_result(result) -> list[Any]:
  """Converts a listAssets result to something getList can return."""
  if 'assets' not in result:
    return []
  return [_convert_asset_for_get_list_result(i) for i in result['assets']]


def _convert_list_images_filter_params_to_list_assets_params(params) -> str:
  """Converts a listImages params dict to something usable with listAssets."""
  query_strings = []
  if 'startTime' in params:
    query_strings.append('startTime >= "{}"'.format(params['startTime']))
    del params['startTime']

  if 'endTime' in params:
    query_strings.append('endTime < "{}"'.format(params['endTime']))
    del params['endTime']

  region_error = 'Filter parameter "region" must be a GeoJSON or WKT string.'
  if 'region' in params:
    region = params['region']
    if isinstance(region, dict):
      try:
        region = json.dumps(region)
      except TypeError as e:
        raise Exception(region_error) from e  # pylint:disable=broad-exception-raised
    elif not isinstance(region, str):
      raise Exception(region_error)  # pylint:disable=broad-exception-raised

    # Double quotes are not valid in the GeoJSON strings, since we wrap the
    # query in a set of double quotes. We trivially avoid doubly-escaping the
    # quotes by replacing double quotes with single quotes.
    region = region.replace('"', "'")
    query_strings.append(f'intersects("{region}")')
    del params['region']
  if 'properties' in params:
    if isinstance(params['properties'], list) and any(
        not isinstance(p, str) for p in params['properties']):
      raise Exception(  # pylint:disable=broad-exception-raised
          'Filter parameter "properties" must be an array of strings')

    for property_query in params['properties']:
      # Property filtering requires that properties be prefixed by "properties."
      prop = re.sub(r'^(properties\.)?', 'properties.', property_query.strip())
      query_strings.append(prop)

    del params['properties']
  return ' AND '.join(query_strings)


def convert_list_images_params_to_list_assets_params(
    params: dict[str, Any]
) -> dict[str, Any]:
  """Converts a listImages params dict to something usable with listAssets."""
  params = params.copy()
  extra_filters = _convert_list_images_filter_params_to_list_assets_params(
      params)
  if extra_filters:
    if 'filter' in params:
      params['filter'] = '{} AND {}'.format(params['filter'], extra_filters)
    else:
      params['filter'] = extra_filters
  return params


def is_asset_root(asset_name: str) -> bool:
  return bool(re.match(ASSET_ROOT_PATTERN, asset_name))


def convert_list_images_result_to_get_list_result(result) -> list[Any]:
  """Converts a listImages result to something getList can return."""
  if 'images' not in result:
    return []
  return [_convert_image_for_get_list_result(i) for i in result['images']]


def _convert_asset_for_get_list_result(asset) -> dict[str, Any]:
  """Converts an EarthEngineAsset to the format returned by getList."""
  result = _convert_dict(
      asset, {
          'name': 'id',
          'type': ('type', _convert_asset_type_for_get_list_result)
      },
      defaults={'type': 'Unknown'})
  return result


def _convert_image_for_get_list_result(asset) -> dict[str, Any]:
  """Converts an Image to the format returned by getList."""
  result = _convert_dict(
      asset, {
          'name': 'id',
      }, defaults={'type': 'Image'})
  return result


def _convert_asset_type_for_get_list_result(asset_type: str) -> str:
  """Converts an EarthEngineAsset.Type to the format returned by getList."""
  return _convert_value(
      asset_type, {
          'IMAGE': 'Image',
          'IMAGE_COLLECTION': 'ImageCollection',
          'TABLE': 'Table',
          'FOLDER': 'Folder'
      }, 'Unknown')


def convert_asset_type_for_create_asset(asset_type: str) -> str:
  """Converts a createAsset asset type to an EarthEngineAsset.Type."""
  return _convert_value(
      asset_type, {
          'Image': 'IMAGE',
          'ImageCollection': 'IMAGE_COLLECTION',
          'Table': 'TABLE',
          'Folder': 'FOLDER'
      }, asset_type)


def convert_asset_id_to_asset_name(asset_id: str) -> str:
  """Converts an internal asset ID to a Cloud API asset name.

  If asset_id already matches the format 'projects/*/assets/**', it is returned
  as-is.

  Args:
    asset_id: The asset ID to convert.

  Returns:
    An asset name string in the format 'projects/*/assets/**'.
  """
  if re.match(ASSET_NAME_PATTERN, asset_id) or is_asset_root(asset_id):
    return asset_id
  elif asset_id.split('/')[0] in ['users', 'projects']:
    return f'projects/earthengine-legacy/assets/{asset_id}'
  else:
    return f'projects/earthengine-public/assets/{asset_id}'


def split_asset_name(asset_name: str) -> tuple[str, str]:
  """Splits an asset name into the parent and ID parts.

  Args:
    asset_name: The asset ID to split, in the form 'projects/*/assets/**'.

  Returns:
    The parent ('projects/*') and ID ('**') parts of the name.
  """
  projects, parent, assets, remainder = asset_name.split('/', 3)
  del assets  # Unused.
  return projects + '/' + parent, remainder


def convert_operation_name_to_task_id(operation_name: str) -> str:
  """Converts an Operation name to a task ID."""
  found = re.search(r'^.*operations/(.*)$', operation_name)
  return found.group(1) if found else operation_name


def convert_task_id_to_operation_name(task_id: str) -> str:
  """Converts a task ID to an Operation name."""
  return f'projects/{_cloud_api_user_project}/operations/{task_id}'


def convert_params_to_image_manifest(params: dict[str, Any]) -> dict[str, Any]:
  """Converts params to an ImageManifest for ingestion."""
  return _convert_dict(
      params, {
          'id': ('name', convert_asset_id_to_asset_name),
          'tilesets': ('tilesets', convert_tilesets_to_one_platform_tilesets)
      },
      retain_keys=True)


def convert_params_to_table_manifest(params: dict[str, Any]) -> dict[str, Any]:
  """Converts params to a TableManifest for ingestion."""
  return _convert_dict(
      params, {
          'id': ('name', convert_asset_id_to_asset_name),
          'sources': ('sources', convert_sources_to_one_platform_sources),
      },
      retain_keys=True)


def convert_tilesets_to_one_platform_tilesets(tilesets: list[Any]) -> list[Any]:
  """Converts a tileset to a one platform representation of a tileset."""
  converted_tilesets = []
  for tileset in tilesets:
    converted_tileset = _convert_dict(
        tileset,
        {'sources': ('sources', convert_sources_to_one_platform_sources)},
        retain_keys=True)
    converted_tilesets.append(converted_tileset)
  return converted_tilesets


def convert_sources_to_one_platform_sources(sources: list[Any]) -> list[Any]:
  """Converts the sources to one platform representation of sources."""
  converted_sources = []
  for source in sources:
    converted_source = copy.deepcopy(source)
    if 'primaryPath' in converted_source:
      file_sources = [converted_source['primaryPath']]
      if 'additionalPaths' in converted_source:
        file_sources += converted_source['additionalPaths']
        del converted_source['additionalPaths']
      del converted_source['primaryPath']
      converted_source['uris'] = file_sources
    if 'maxError' in converted_source:
      converted_source['maxErrorMeters'] = converted_source['maxError']
      del converted_source['maxError']
    converted_sources.append(converted_source)
  return converted_sources


def encode_number_as_cloud_value(number: float) -> dict[str, Union[float, str]]:
  # Numeric values in constantValue-style nodes end up stored in doubles. If the
  # input is an integer that loses precision as a double, use the int64 slot
  # ("integerValue") in ValueNode.
  if (isinstance(number, int) and float(number) != number):
    return {'integerValue': str(number)}
  else:
    return {'constantValue': number}


def convert_algorithms(algorithms) -> dict[str, Any]:
  """Converts a ListAlgorithmsResult to the internal format.

  The internal code expects a dict mapping each algorithm's name to a dict
  containing:
  - description: string
  - returns: string
  - arguments: list of dicts, each containing
    - name: argument name
    - type: argument type
    - description: argument description (optional)
    - optional: bool (optional)
    - default: default value (optional)
  - hidden: bool (optional)
  - preview: bool (optional)
  - deprecated: string containing deprecation reason (optional)

  Args:
    algorithms: A ListAlgorithmResult.

  Returns:
    A version of that algorithms list that can be interpreted by
    apifunction.initialize().
  """
  algs = algorithms.get('algorithms', [])
  return dict(_convert_algorithm(algorithm) for algorithm in algs)


def _convert_algorithm(algorithm: dict[str, Any]) -> tuple[str, dict[str, Any]]:
  """Converts an Algorithm to the internal format."""
  # Strip leading 'algorithms/' from the name.
  algorithm_name = algorithm['name'][11:]
  converted_algorithm = _convert_dict(
      algorithm,
      {
          'description': 'description',
          'returnType': 'returns',
          'arguments': ('args', _convert_algorithm_arguments),
          'hidden': 'hidden',
          'preview': 'preview'
      },
      defaults={
          'description': '',
          'returns': '',
          'args': []
      })
  if algorithm.get('deprecated'):
    converted_algorithm['deprecated'] = algorithm.get('deprecationReason', '')
  return algorithm_name, converted_algorithm


def _convert_algorithm_arguments(
    args: list[dict[str, Any]]) -> list[dict[str, Any]]:
  return [_convert_algorithm_argument(arg) for arg in args]


def _convert_algorithm_argument(arg: dict[str, Any]) -> dict[str, Any]:
  return _convert_dict(
      arg, {
          'argumentName': 'name',
          'type': 'type',
          'description': 'description',
          'optional': 'optional',
          'defaultValue': 'default'
      },
      defaults={
          'description': '',
          'type': ''
      })


def convert_to_image_file_format(format_str: Optional[str]) -> str:
  """Converts a legacy file format string to an ImageFileFormat enum value.

  Args:
    format_str: A string describing an image file format that was passed to
      one of the functions in ee.data that takes image file formats.

  Returns:
    A best guess at the corresponding ImageFileFormat enum name.
  """
  if format_str is None:
    return 'AUTO_JPEG_PNG'
  format_str = format_str.upper()
  if format_str == 'JPG':
    return 'JPEG'
  elif format_str == 'AUTO':
    return 'AUTO_JPEG_PNG'
  elif format_str == 'GEOTIFF':
    return 'GEO_TIFF'
  elif format_str == 'TFRECORD':
    return 'TF_RECORD_IMAGE'
  else:
    # It's probably "JPEG" or "PNG", but might be some other supported format.
    # Let the server validate it.
    return format_str


def convert_to_table_file_format(format_str: Optional[str]) -> str:
  """Converts a legacy file format string to a TableFileFormat enum value.

  Args:
    format_str: A string describing a table file format that was passed to
      one of the functions in ee.data that takes table file formats.

  Returns:
    A best guess at the corresponding TableFileFormat enum name.
  """
  if format_str is None:
    return 'CSV'
  format_str = format_str.upper()
  if format_str == 'GEOJSON':
    return 'GEO_JSON'
  elif format_str == 'TFRECORD':
    return 'TF_RECORD_TABLE'
  else:
    # It's probably "CSV" or "KML" or one of the others.
    # Let the server validate it.
    return format_str


def convert_to_band_list(bands: Union[list[str], None, str]) -> list[str]:
  """Converts a band list, possibly as CSV, to a real list of bands.

  Args:
    bands: A list of strings containing band names, or a string containing
      a comma-separated list of band names, or None.

  Returns:
    A list of band names.
  """
  if bands is None:
    return []
  elif isinstance(bands, str):
    return bands.split(',')
  elif isinstance(bands, list):
    return bands
  else:
    raise ee_exception.EEException('Invalid band list ' + bands)


def convert_to_visualization_options(params: dict[str, Any]) -> dict[str, Any]:
  """Extracts a VisualizationOptions from a param dict.

  Args:
    params: See ee.data.getMapId() for the description of the keys and values
      that might appear here.

  Returns:
    A VisualizationOptions proto, in dict form.
  """
  result = {}
  if 'palette' in params:
    palette = params['palette']
    if isinstance(palette, str):
      palette = palette.split(',')
    result['paletteColors'] = palette
    value_range = len(palette) - 1
  else:
    value_range = 255
  ranges = []
  if 'gain' in params or 'bias' in params:
    if 'min' in params or 'max' in params:
      raise ee_exception.EEException(
          'Gain and bias cannot be specified together with min and max')
    # The Cloud API doesn't support gain/bias, only min/max. Extract and
    # convert.
    gains = _convert_csv_numbers_to_list(params.get('gain'))
    biases = _convert_csv_numbers_to_list(params.get('bias'))
    if not gains:
      gains = [1.0] * len(biases)
    elif not biases:
      biases = [0.0] * len(gains)
    elif len(gains) != len(biases):
      raise ee_exception.EEException('Length of gain and bias must match.')
    for gain, bias in zip(gains, biases):
      # The transformation equations are
      # x -> x * gain + bias
      # x -> range * (x - min) / (max - min)
      # Solving for (min, max) given (gain, bias) gives:
      range_min = -bias / gain
      range_max = value_range / gain + range_min
      ranges.append({'min': range_min, 'max': range_max})
  elif 'min' in params or 'max' in params:
    mins = _convert_csv_numbers_to_list(params.get('min'))
    maxes = _convert_csv_numbers_to_list(params.get('max'))
    if not mins:
      mins = [0.0] * len(maxes)
    elif not maxes:
      maxes = [1.0] * len(mins)
    elif len(mins) != len(maxes):
      raise ee_exception.EEException('Length of min and max must match.')
    for range_min, range_max in zip(mins, maxes):
      ranges.append({'min': range_min, 'max': range_max})
  if ranges:
    result['ranges'] = ranges
  gammas = _convert_csv_numbers_to_list(params.get('gamma'))
  if len(gammas) > 1:
    raise ee_exception.EEException('Only one gamma value is supported.')
  elif gammas:
    result['gamma'] = {'value': gammas[0]}
  return result


def _convert_csv_numbers_to_list(value: str) -> list[float]:
  """Converts a string containing CSV numbers to a list."""
  if not value:
    return []
  return [float(x) for x in value.split(',')]


def convert_operation_to_task(operation: dict[str, Any]) -> dict[str, Any]:
  """Converts an Operation to a legacy Task."""
  result = _convert_dict(
      operation['metadata'], {
          'createTime': ('creation_timestamp_ms', _convert_timestamp_to_msec),
          'updateTime': ('update_timestamp_ms', _convert_timestamp_to_msec),
          'startTime': ('start_timestamp_ms', _convert_timestamp_to_msec),
          'attempt': 'attempt',
          'state': ('state', _convert_operation_state_to_task_state),
          'description': 'description',
          'type': 'task_type',
          'destinationUris': 'destination_uris',
          'batchEecuUsageSeconds': 'batch_eecu_usage_seconds',
          'priority': 'priority',
          })
  if operation.get('done'):
    if 'error' in operation:
      result['error_message'] = operation['error']['message']
  result['id'] = convert_operation_name_to_task_id(operation['name'])
  result['name'] = operation['name']
  return result


def _convert_operation_state_to_task_state(state: str) -> str:
  """Converts a state string from an Operation to the Task equivalent."""
  return _convert_value(
      state, {
          'PENDING': 'READY',
          'RUNNING': 'RUNNING',
          'CANCELLING': 'CANCEL_REQUESTED',
          'SUCCEEDED': 'COMPLETED',
          'CANCELLED': 'CANCELLED',
          'FAILED': 'FAILED'
      }, 'UNKNOWN')


def convert_iam_policy_to_acl(policy: dict[str, Any])  -> dict[str, Any]:
  """Converts an IAM Policy proto to the legacy ACL format."""
  bindings = {
      binding['role']: binding.get('members', [])
      for binding in policy.get('bindings', [])
  }
  owners = bindings.get('roles/owner', [])
  readers = bindings.get('roles/viewer', [])
  writers = bindings.get('roles/editor', [])
  if 'allUsers' in readers:
    all_users_can_read = True
    readers.remove('allUsers')
  else:
    all_users_can_read = False
  result = {'owners': owners, 'readers': readers, 'writers': writers}
  if all_users_can_read:
    result['all_users_can_read'] = True
  return result


def convert_acl_to_iam_policy(acl: dict[str, Any]) -> dict[str, Any]:
  """Converts the legacy ACL format to an IAM Policy proto."""
  owners = acl.get('owners', [])
  readers = acl.get('readers', [])
  if acl.get('all_users_can_read', False):
    readers.append('allUsers')
  writers = acl.get('writers', [])
  bindings = []
  if owners:
    bindings.append({'role': 'roles/owner', 'members': owners})
  if readers:
    bindings.append({'role': 'roles/viewer', 'members': readers})
  if writers:
    bindings.append({'role': 'roles/editor', 'members': writers})
  return {'bindings': bindings}


def convert_to_grid_dimensions(
    dimensions: Union[float, Sequence[float]]
) -> dict[str, float]:
  """Converts an input value to GridDimensions.

  Args:
    dimensions: May specify a single number to indicate a square shape,
      or a tuple of two dimensions to indicate (width,height).

  Returns:
    A GridDimensions as a dict.
  """
  if isinstance(dimensions, int):
    return {'width': dimensions, 'height': dimensions}
  elif len(dimensions) == 1:
    return {'width': dimensions[0], 'height': dimensions[0]}
  else:
    return {'width': dimensions[0], 'height': dimensions[1]}
