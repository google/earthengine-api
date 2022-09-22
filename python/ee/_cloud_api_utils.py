#!/usr/bin/env python
"""Earth Engine helper functions for working with the Cloud API.

Many of the functions defined here are for mapping legacy calls in ee.data into
their new Cloud API equivalents. This generally requires remapping call
parameters and result values.
"""

import calendar
import copy
import datetime
import json

import os
import re
import sys
import warnings

from . import ee_exception
from google_auth_httplib2 import AuthorizedHttp
from google_auth_httplib2 import Request
from googleapiclient import discovery
from googleapiclient import http
from googleapiclient import model

# We use the urllib3-aware shim if it's available and supported.
# It is not compatible with Python 3.10 or newer.
# pylint: disable=g-bad-import-order,g-import-not-at-top
if sys.version_info >= (3, 10):
  import httplib2
else:
  try:
    import httplib2shim as httplib2
  except ImportError:
    import httplib2
import six
# pylint: enable=g-bad-import-order,g-import-not-at-top

# The Cloud API version.
VERSION = os.environ.get('EE_CLOUD_API_VERSION', 'v1alpha')

PROJECT_ID_PATTERN = (r'^(?:\w+(?:[\w\-]+\.[\w\-]+)*?\.\w+\:)?'
                      r'[a-z][-a-z0-9]{4,28}[a-z0-9]$')
ASSET_NAME_PATTERN = (r'^projects/((?:\w+(?:[\w\-]+\.[\w\-]+)*?\.\w+\:)?'
                      r'[a-z][a-z0-9\-]{4,28}[a-z0-9])/assets/(.*)$')

ASSET_ROOT_PATTERN = (r'^projects/((?:\w+(?:[\w\-]+\.[\w\-]+)*?\.\w+\:)?'
                      r'[a-z][a-z0-9\-]{4,28}[a-z0-9])/assets/?$')

# The default user project to use when making Cloud API calls.
_cloud_api_user_project = None


def _wrap_request(headers_supplier, response_inspector):
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
  def builder(http_transport,
              postproc,
              uri,
              method='GET',
              body=None,
              headers=None,
              methodId=None,
              resumable=None):
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


def set_cloud_api_user_project(cloud_api_user_project):
  global _cloud_api_user_project
  _cloud_api_user_project = cloud_api_user_project


def build_cloud_resource(api_base_url,
                         api_key=None,
                         credentials=None,
                         timeout=None,
                         headers_supplier=None,
                         response_inspector=None,
                         http_transport=None,
                         raw=False):
  """Builds an Earth Engine Cloud API resource.

  Args:
    api_base_url: The base URL of the cloud endpoints.
    api_key: An API key that's enabled for use with the Earth Engine Cloud API.
    credentials: OAuth2 credentials to use when authenticating to the API.
    timeout: How long a timeout to set on requests, in seconds.
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
    http_transport = httplib2.Http(timeout=timeout)
  if credentials is not None:
    http_transport = AuthorizedHttp(credentials, http=http_transport)
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
  resource._baseUrl = api_base_url
  return resource


def build_cloud_resource_from_document(discovery_document,
                                       http_transport=None,
                                       headers_supplier=None,
                                       response_inspector=None):
  """Builds an Earth Engine Cloud API resource from a description of the API.

  This version is intended for use in tests.

  Args:
    discovery_document: The description of the API.
    http_transport: An HTTP transport object to use for the call.
    headers_supplier: A callable that will return a set of headers to be applied
      to a request. Will be called once for each request.
    response_inspector: A callable that will be invoked with the raw
      httplib2.Response responses.

  Returns:
    A resource object to use to call the Cloud API.
  """
  request_builder = _wrap_request(headers_supplier, response_inspector)
  return discovery.build_from_document(
      discovery_document,
      http=http_transport,
      requestBuilder=request_builder)


def _convert_dict(to_convert,
                  conversions,
                  defaults=None,
                  key_warnings=False,
                  retain_keys=False):
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
  result = {}
  for key, value in six.iteritems(to_convert):
    if key in conversions:
      conversion = conversions[key]
      if conversion is not None:
        if isinstance(conversion, tuple):
          key = conversion[0]
          value = conversion[1](value)
        else:
          key = conversion
        if key in result:
          warnings.warn(
              'Multiple request parameters converted to {}'.format(key))
        result[key] = value
    elif retain_keys:
      result[key] = value
    elif key_warnings:
      warnings.warn('Unrecognized key {} ignored'.format(key))
  if defaults:
    for default_key, default_value in six.iteritems(defaults):
      if default_key not in result:
        result[default_key] = default_value
  return result


def _convert_value(value, conversions, default):
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


def _convert_msec_to_timestamp(time_msec):
  """Converts a time value to a google.protobuf.Timestamp's string form.

  Args:
    time_msec: A time in msec since the Unix epoch.

  Returns:
    A string formatted like '2003-09-07T19:30:12.345Z', which is the expected
    form of google.protobuf.Timestamp values.
  """
  return datetime.datetime.utcfromtimestamp(
      time_msec / 1000.0).isoformat() + 'Z'


def _convert_timestamp_to_msec(timestamp):
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


def _convert_bounding_box_to_geo_json(bbox):
  """Converts a lng/lat bounding box to a GeoJSON string."""
  lng_min = bbox[0]
  lat_min = bbox[1]
  lng_max = bbox[2]
  lat_max = bbox[3]
  return ('{{"type":"Polygon","coordinates":'
          '[[[{0},{1}],[{2},{1}],[{2},{3}],[{0},{3}],[{0},{1}]]]}}'.format(
              lng_min, lat_min, lng_max, lat_max))


def convert_get_list_params_to_list_assets_params(params):
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


def convert_list_assets_result_to_get_list_result(result):
  """Converts a listAssets result to something getList can return."""
  if 'assets' not in result:
    return []
  return [_convert_asset_for_get_list_result(i) for i in result['assets']]


def _convert_list_images_filter_params_to_list_assets_params(params):
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
        raise Exception(region_error) from e
    elif not isinstance(region, six.string_types):
      raise Exception(region_error)

    # Double quotes are not valid in the GeoJSON strings, since we wrap the
    # query in a set of double quotes. We trivially avoid doubly-escaping the
    # quotes by replacing double quotes with single quotes.
    region = region.replace('"', "'")
    query_strings.append('intersects("{}")'.format(region))
    del params['region']
  if 'properties' in params:
    if isinstance(params['properties'], list) and any(
        not isinstance(p, six.string_types) for p in params['properties']):
      raise Exception(
          'Filter parameter "properties" must be an array of strings')

    for property_query in params['properties']:
      # Property filtering requires that properties be prefixed by "properties."
      prop = re.sub(r'^(properties\.)?', 'properties.', property_query.strip())
      query_strings.append(prop)

    del params['properties']
  return ' AND '.join(query_strings)


def convert_list_images_params_to_list_assets_params(params):
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


def is_asset_root(asset_name):
  return bool(re.match(ASSET_ROOT_PATTERN, asset_name))


def convert_list_images_result_to_get_list_result(result):
  """Converts a listImages result to something getList can return."""
  if 'images' not in result:
    return []
  return [_convert_image_for_get_list_result(i) for i in result['images']]


def _convert_asset_for_get_list_result(asset):
  """Converts an EarthEngineAsset to the format returned by getList."""
  result = _convert_dict(
      asset, {
          'name': 'id',
          'type': ('type', _convert_asset_type_for_get_list_result)
      },
      defaults={'type': 'Unknown'})
  return result


def _convert_image_for_get_list_result(asset):
  """Converts an Image to the format returned by getList."""
  result = _convert_dict(
      asset, {
          'name': 'id',
      }, defaults={'type': 'Image'})
  return result


def _convert_asset_type_for_get_list_result(asset_type):
  """Converts an EarthEngineAsset.Type to the format returned by getList."""
  return _convert_value(
      asset_type, {
          'IMAGE': 'Image',
          'IMAGE_COLLECTION': 'ImageCollection',
          'TABLE': 'Table',
          'FOLDER': 'Folder'
      }, 'Unknown')


def convert_asset_type_for_create_asset(asset_type):
  """Converts a createAsset asset type to an EarthEngineAsset.Type."""
  return _convert_value(
      asset_type, {
          'Image': 'IMAGE',
          'ImageCollection': 'IMAGE_COLLECTION',
          'Table': 'TABLE',
          'Folder': 'FOLDER'
      }, asset_type)


def convert_asset_id_to_asset_name(asset_id):
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
    return 'projects/earthengine-legacy/assets/{}'.format(asset_id)
  else:
    return 'projects/earthengine-public/assets/{}'.format(asset_id)


def split_asset_name(asset_name):
  """Splits an asset name into the parent and ID parts.

  Args:
    asset_name: The asset ID to split, in the form 'projects/*/assets/**'.

  Returns:
    The parent ('projects/*') and ID ('**') parts of the name.
  """
  projects, parent, _, remainder = asset_name.split('/', 3)
  return projects + '/' + parent, remainder


def convert_operation_name_to_task_id(operation_name):
  """Converts an Operation name to a task ID."""
  found = re.search(r'^.*operations/(.*)$', operation_name)
  return found.group(1) if found else operation_name


def convert_task_id_to_operation_name(task_id):
  """Converts a task ID to an Operation name."""
  return 'projects/{}/operations/{}'.format(_cloud_api_user_project, task_id)


def convert_params_to_image_manifest(params):
  """Converts params to an ImageManifest for ingestion."""
  return _convert_dict(
      params, {
          'id': ('name', convert_asset_id_to_asset_name),
          'tilesets': ('tilesets', convert_tilesets_to_one_platform_tilesets)
      },
      retain_keys=True)


def convert_params_to_table_manifest(params):
  """Converts params to a TableManifest for ingestion."""
  return _convert_dict(
      params, {
          'id': ('name', convert_asset_id_to_asset_name),
          'sources': ('sources', convert_sources_to_one_platform_sources),
      },
      retain_keys=True)


def convert_tilesets_to_one_platform_tilesets(tilesets):
  """Converts a tileset to a one platform representation of a tileset."""
  converted_tilesets = []
  for tileset in tilesets:
    converted_tileset = _convert_dict(
        tileset,
        {'sources': ('sources', convert_sources_to_one_platform_sources)},
        retain_keys=True)
    converted_tilesets.append(converted_tileset)
  return converted_tilesets


def convert_sources_to_one_platform_sources(sources):
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


def encode_number_as_cloud_value(number):
  # Numeric values in constantValue-style nodes end up stored in doubles. If the
  # input is an integer that loses precision as a double, use the int64 slot
  # ("integerValue") in ValueNode.
  if (isinstance(number, six.integer_types) and float(number) != number):
    return {'integerValue': str(number)}
  else:
    return {'constantValue': number}


def convert_algorithms(algorithms):
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


def _convert_algorithm(algorithm):
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


def _convert_algorithm_arguments(args):
  return [_convert_algorithm_argument(arg) for arg in args]


def _convert_algorithm_argument(arg):
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


def convert_to_image_file_format(format_str):
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


def convert_to_table_file_format(format_str):
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


def convert_to_band_list(bands):
  """Converts a band list, possibly as CSV, to a real list of bands.

  Args:
    bands: A list of strings containing band names, or a string containing
      a comma-separated list of band names, or None.

  Returns:
    A list of band names.
  """
  if bands is None:
    return []
  elif isinstance(bands, six.string_types):
    return bands.split(',')
  elif isinstance(bands, list):
    return bands
  else:
    raise ee_exception.EEException('Invalid band list ' + bands)


def convert_to_visualization_options(params):
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
    if isinstance(palette, six.string_types):
      palette = palette.split(',')
    result['paletteColors'] = palette
    value_range = len(palette) - 1
  else:
    value_range = 255
  ranges = []
  if 'gain' in params or 'bias' in params:
    if 'min' in params or 'max' in params:
      raise ee_exception.EEException(
          'Gain and bias can\'t be specified together with min and max')
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


def _convert_csv_numbers_to_list(value):
  """Converts a string containing CSV numbers to a list."""
  if not value:
    return []
  return [float(x) for x in value.split(',')]


def convert_operation_to_task(operation):
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
          })
  if operation.get('done'):
    if 'error' in operation:
      result['error_message'] = operation['error']['message']
  result['id'] = convert_operation_name_to_task_id(operation['name'])
  result['name'] = operation['name']
  return result


def _convert_operation_state_to_task_state(state):
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


def convert_iam_policy_to_acl(policy):
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


def convert_acl_to_iam_policy(acl):
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


def convert_to_grid_dimensions(dimensions):
  """Converts an input value to GridDimensions.

  Args:
    dimensions: May specify a single number to indicate a square shape,
      or a tuple of two dimensions to indicate (width,height).

  Returns:
    A GridDimensions as a dict.
  """
  if isinstance(dimensions, six.integer_types):
    return {'width': dimensions, 'height': dimensions}
  elif len(dimensions) == 1:
    return {'width': dimensions[0], 'height': dimensions[0]}
  else:
    return {'width': dimensions[0], 'height': dimensions[1]}
