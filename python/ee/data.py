"""Singleton for the library's communication with the Earth Engine API."""

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import contextlib
import json
import platform
import re
import sys
import threading
from typing import Any, Callable, Dict, Iterator, List, Optional, Sequence, Union
import uuid
import warnings

import google.auth
# Rename to avoid redefined-outer-name warning.
from google.oauth2 import credentials as credentials_lib
import google_auth_httplib2
import googleapiclient
import httplib2
import requests

from ee import _cloud_api_utils
from ee import _utils
from ee import computedobject
from ee import deprecation
from ee import ee_exception
from ee import encodable
from ee import image_converter
from ee import oauth
from ee import serializer
from ee import table_converter

from ee import __version__

# OAuth2 credentials object.  This may be set by ee.Initialize().
_credentials: Optional[credentials_lib.Credentials] = None

# The base URL for all data calls.  This is set by ee.Initialize().
_api_base_url: Optional[str] = None

# The base URL for map tiles.  This is set by ee.Initialize().
_tile_base_url: Optional[str] = None

# The base URL for all Cloud API calls.  This is set by ee.Initialize().
_cloud_api_base_url: Optional[str] = None

# Google Cloud API key.  This may be set by ee.Initialize().
_cloud_api_key: Optional[str] = None

# A Requests session.  This is set by ee.Initialize()
_requests_session: Optional[requests.Session] = None

# A resource object for making Cloud API calls.
_cloud_api_resource = None

# A resource object for making Cloud API calls and receiving raw return types.
_cloud_api_resource_raw = None

# The default user project to use when making Cloud API calls.
_cloud_api_user_project: Optional[str] = None

# The API client version number to send when making requests.
_cloud_api_client_version: Optional[str] = None

# The http_transport to use.
_http_transport = None

# Whether the module has been initialized.
_initialized: bool = False

# Sets the number of milliseconds to wait for a request before considering
# it timed out. 0 means no limit.
_deadline_ms: int = 0

# Maximum number of times to retry a rate-limited request.
_max_retries: int = 5

# User agent to indicate which application is calling Earth Engine
_user_agent: Optional[str] = None


class _ThreadLocals(threading.local):
  """Storage for thread local variables."""

  def __init__(self):
    # pylint: disable=super-init-not-called

    # A function called when profile results are received from the server. Takes
    # the profile ID as an argument. None if profiling is disabled.
    #
    # This is a thread-local variable because the alternative is to add a
    # parameter to ee.data.send_, which would then have to be propagated from
    # the assorted API call functions (ee.data.getInfo, ee.data.getMapId, etc.),
    # and the user would have to modify each call to profile, rather than
    # enabling profiling as a wrapper around the entire program (with
    # ee.data.profiling, defined below).
    self.profile_hook: Optional[Callable[[str], None]] = None


_thread_locals = _ThreadLocals()

# The HTTP header through which profile results are returned.
# Lowercase because that's how httplib2 does things.
_PROFILE_RESPONSE_HEADER_LOWERCASE = 'x-earth-engine-computation-profile'

# The HTTP header through which profiling is requested when using the Cloud API.
_PROFILE_REQUEST_HEADER = 'X-Earth-Engine-Computation-Profiling'

# The HTTP header through which a user project override is provided.
_USER_PROJECT_OVERRIDE_HEADER = 'X-Goog-User-Project'

# The HTTP header used to indicate the version of the client library used.
_API_CLIENT_VERSION_HEADER = 'X-Goog-Api-Client'

# The HTTP header used to indicate the user agent.
_USER_AGENT_HEADER = 'user-agent'

# Optional HTTP header returned to display initialization-time messages.
_INIT_MESSAGE_HEADER = 'x-earth-engine-init-message'  # lowercase for httplib2

# Maximum time to wait before retrying a rate-limited request (in milliseconds).
MAX_RETRY_WAIT = 120000

# Base time (in ms) to wait when performing exponential backoff in request
# retries.
BASE_RETRY_WAIT = 1000

# The default base URL for API calls.
DEFAULT_API_BASE_URL = 'https://earthengine.googleapis.com/api'
HIGH_VOLUME_API_BASE_URL = 'https://earthengine-highvolume.googleapis.com'

# The default base URL for media/tile calls.
DEFAULT_TILE_BASE_URL = 'https://earthengine.googleapis.com'

# The default base URL for Cloud API calls.
DEFAULT_CLOUD_API_BASE_URL = 'https://earthengine.googleapis.com'

# The default project to use for Cloud API calls.
DEFAULT_CLOUD_API_USER_PROJECT = 'earthengine-legacy'

# Asset types recognized by create_assets().
ASSET_TYPE_FOLDER = 'Folder'
ASSET_TYPE_IMAGE_COLL = 'ImageCollection'
# Cloud API versions of the asset types.
ASSET_TYPE_FOLDER_CLOUD = 'FOLDER'
ASSET_TYPE_IMAGE_COLL_CLOUD = 'IMAGE_COLLECTION'
# Max length of the above type names
MAX_TYPE_LENGTH = len(ASSET_TYPE_IMAGE_COLL_CLOUD)

# The maximum number of tasks to retrieve in each request to "/tasklist".
_TASKLIST_PAGE_SIZE = 500

# Next page token key for list endpoints.
_NEXT_PAGE_TOKEN_KEY = 'nextPageToken'

_NOT_INITIALIZED_MESSAGE = (
    'Earth Engine client library not initialized. See http://goo.gle/ee-auth.'
)


def initialize(
    credentials: Any = None,
    api_base_url: Optional[str] = None,
    tile_base_url: Optional[str] = None,
    cloud_api_base_url: Optional[str] = None,
    cloud_api_key: Optional[str] = None,
    project: Optional[str] = None,
    http_transport: Any = None,
) -> None:
  """Initializes the data module, setting credentials and base URLs.

  If any of the arguments are unspecified, they will keep their old values;
  the defaults if initialize() has never been called before.

  At least one of "credentials" and "cloud_api_key" must be provided. If both
  are provided, both will be used; in this case, the API key's project must
  match the credentials' project.

  Args:
    credentials: The OAuth2 credentials.
    api_base_url: The EarthEngine REST API endpoint.
    tile_base_url: The EarthEngine REST tile endpoint.
    cloud_api_base_url: The EarthEngine Cloud API endpoint.
    cloud_api_key: The API key to use with the Cloud API.
    project: The client project ID or number to use when making API calls.
    http_transport: The http transport to use
  """
  global _api_base_url, _tile_base_url, _credentials, _initialized
  global _requests_session
  global _cloud_api_base_url
  global _cloud_api_key
  global _cloud_api_user_project, _http_transport
  global _cloud_api_client_version

  # If already initialized, only replace the explicitly specified parts.

  if credentials is not None:
    _credentials = credentials

  if api_base_url is not None:
    _api_base_url = api_base_url
  elif not _initialized:
    _api_base_url = DEFAULT_API_BASE_URL

  if tile_base_url is not None:
    _tile_base_url = tile_base_url
  elif not _initialized:
    _tile_base_url = DEFAULT_TILE_BASE_URL

  if cloud_api_key is not None:
    _cloud_api_key = cloud_api_key

  if cloud_api_base_url is not None:
    _cloud_api_base_url = cloud_api_base_url
  elif not _initialized:
    _cloud_api_base_url = DEFAULT_CLOUD_API_BASE_URL

  if __version__ is not None:
    version = __version__
    _cloud_api_client_version = version

  _http_transport = http_transport

  if _requests_session is None:
    _requests_session = requests.Session()

  _install_cloud_api_resource()

  if project is not None:
    _cloud_api_user_project = project
    _cloud_api_utils.set_cloud_api_user_project(project)
  else:
    _cloud_api_utils.set_cloud_api_user_project(DEFAULT_CLOUD_API_USER_PROJECT)

  _initialized = True


def is_initialized() -> bool:
  return _initialized


def get_persistent_credentials() -> credentials_lib.Credentials:
  """Read persistent credentials from ~/.config/earthengine or ADC.

  Raises EEException with helpful explanation if credentials don't exist.

  Returns:
    OAuth2Credentials built from persistently stored refresh_token, containing
    the client project in the quota_project_id field, if available.
  """
  credentials = None
  args = {}
  try:
    args = oauth.get_credentials_arguments()
  except IOError:
    pass

  if args.get('refresh_token'):
    credentials = credentials_lib.Credentials(None, **args)
  else:
    # If EE credentials aren't available, try application default credentials.
    try:
      with warnings.catch_warnings():
        # _default.py gives incorrect advice here: gcloud config set project
        # sets the default resource project but we need the quota project.
        warnings.filterwarnings('ignore', '.*(No project ID|quota project).*')

        credentials, unused_project_id = google.auth.default()
    except google.auth.exceptions.DefaultCredentialsError:
      pass

  if credentials:
    # earthengine set_project always overrides gcloud set-quota-project
    project = args.get('quota_project_id') or oauth.get_appdefault_project()
    if project and project != credentials.quota_project_id:
      credentials = credentials.with_quota_project(project)
    if oauth.is_valid_credentials(credentials):
      return credentials
  raise ee_exception.EEException(  # pylint: disable=raise-missing-from
      'Please authorize access to your Earth Engine account by '
      'running\n\nearthengine authenticate\n\n'
      'in your command line, or ee.Authenticate() in Python, and then retry.'
  )


def reset() -> None:
  """Resets the data module, clearing credentials and custom base URLs."""
  global _api_base_url, _tile_base_url, _credentials, _initialized
  global _requests_session, _cloud_api_resource, _cloud_api_resource_raw
  global _cloud_api_base_url, _cloud_api_user_project
  global _cloud_api_key, _http_transport
  _credentials = None
  _api_base_url = None
  _tile_base_url = None
  if _requests_session is not None:
    _requests_session.close()
    _requests_session = None
  _cloud_api_base_url = None
  _cloud_api_key = None
  _cloud_api_resource = None
  _cloud_api_resource_raw = None
  _cloud_api_user_project = None
  _cloud_api_utils.set_cloud_api_user_project(DEFAULT_CLOUD_API_USER_PROJECT)
  _http_transport = None
  _initialized = False


def _get_projects_path() -> str:
  """Returns the projects path to use for constructing a request."""
  if _cloud_api_user_project is not None:
    return 'projects/' + _cloud_api_user_project
  else:
    return 'projects/' + DEFAULT_CLOUD_API_USER_PROJECT


def _install_cloud_api_resource() -> None:
  """Builds or rebuilds the Cloud API resource object, if needed."""
  global _cloud_api_resource, _cloud_api_resource_raw

  timeout = (_deadline_ms / 1000.0) or None
  assert _requests_session is not None
  _cloud_api_resource = _cloud_api_utils.build_cloud_resource(
      _cloud_api_base_url,
      _requests_session,
      credentials=_credentials,
      api_key=_cloud_api_key,
      timeout=timeout,
      headers_supplier=_make_request_headers,
      response_inspector=_handle_profiling_response,
      http_transport=_http_transport,
  )

  _cloud_api_resource_raw = _cloud_api_utils.build_cloud_resource(
      _cloud_api_base_url,
      _requests_session,
      credentials=_credentials,
      api_key=_cloud_api_key,
      timeout=timeout,
      headers_supplier=_make_request_headers,
      response_inspector=_handle_profiling_response,
      http_transport=_http_transport,
      raw=True,
  )


def _get_cloud_projects() -> Any:
  if _cloud_api_resource is None:
    raise ee_exception.EEException(_NOT_INITIALIZED_MESSAGE)
  return _cloud_api_resource.projects()


def _get_cloud_projects_raw() -> Any:
  if _cloud_api_resource_raw is None:
    raise ee_exception.EEException(_NOT_INITIALIZED_MESSAGE)
  return _cloud_api_resource_raw.projects()


def _make_request_headers() -> Optional[Dict[str, Any]]:
  """Adds headers based on client context."""
  headers: Dict[str, Any] = {}
  client_version_header_values: List[Any] = []
  if _cloud_api_client_version is not None:
    client_version_header_values.append('ee-py/' + _cloud_api_client_version)
  if _user_agent is not None:
    headers[_USER_AGENT_HEADER] = _user_agent
  client_version_header_values.append('python/' + platform.python_version())
  headers[_API_CLIENT_VERSION_HEADER] = ' '.join(client_version_header_values)
  if _thread_locals.profile_hook:
    headers[_PROFILE_REQUEST_HEADER] = '1'
  if _cloud_api_user_project is not None:
    headers[_USER_PROJECT_OVERRIDE_HEADER] = _cloud_api_user_project
  if headers:
    return headers
  return None


def _handle_profiling_response(response: httplib2.Response) -> None:
  """Handles profiling annotations on Cloud API responses."""
  # Call the profile hook if present. Note that this is done before we handle
  # the content, so that profiles are reported even if the response is an error.
  if (_thread_locals.profile_hook and
      _PROFILE_RESPONSE_HEADER_LOWERCASE in response):
    _thread_locals.profile_hook(response[_PROFILE_RESPONSE_HEADER_LOWERCASE])


def _execute_cloud_call(
    call: googleapiclient.http.HttpRequest, num_retries: Optional[int] = None
) -> Any:
  """Executes a Cloud API call and translates errors to EEExceptions.

  Args:
    call: The Cloud API call, with all parameters set, ready to have execute()
      called on it.
    num_retries: How many times retryable failures should be retried.

  Returns:
    The value returned by executing that call.

  Raises:
    EEException if the call fails.
  """
  num_retries = _max_retries if num_retries is None else num_retries
  try:
    return call.execute(num_retries=num_retries)
  except googleapiclient.errors.HttpError as e:
    raise _translate_cloud_exception(e)  # pylint: disable=raise-missing-from


def _translate_cloud_exception(
    http_error: googleapiclient.errors.HttpError,
) -> ee_exception.EEException:
  """Translates a Cloud API exception into an EEException.

  Args:
    http_error: A googleapiclient.errors.HttpError.

  Returns:
    An EEException bearing the error message from http_error.
  """
  # The only sane way to get a message out of an HttpError is to use a protected
  # method.
  return ee_exception.EEException(http_error._get_reason())  # pylint: disable=protected-access


def _maybe_populate_workload_tag(body: Dict[str, Any]) -> None:
  """Populates the workload tag on the request body passed in if applicable.

  Defaults to the workload tag set by ee.data.setWorkloadTag() or related
  methods. A workload tag already set on the body takes precedence. The workload
  tag will not be set if it's an empty string.

  Args:
    body: The request body.
  """
  if 'workloadTag' not in body:
    workload_tag = getWorkloadTag()
    if workload_tag:
      body['workloadTag'] = workload_tag
  elif not body['workloadTag']:
    del body['workloadTag']


def setCloudApiKey(cloud_api_key: str) -> None:
  """Sets the Cloud API key parameter ("api_key") for all requests."""
  global _cloud_api_key
  _cloud_api_key = cloud_api_key
  _install_cloud_api_resource()


def setCloudApiUserProject(cloud_api_user_project: str) -> None:
  global _cloud_api_user_project
  _cloud_api_user_project = cloud_api_user_project
  _cloud_api_utils.set_cloud_api_user_project(_cloud_api_user_project)


def setUserAgent(user_agent: str) -> None:
  global _user_agent
  _user_agent = user_agent


def getUserAgent() -> Optional[str]:
  return _user_agent


def setDeadline(milliseconds: float) -> None:
  """Sets the timeout length for API requests.

  Args:
    milliseconds: The number of milliseconds to wait for a request
        before considering it timed out. 0 means no limit.
  """
  global _deadline_ms
  _deadline_ms = milliseconds
  _install_cloud_api_resource()


def setMaxRetries(max_retries: int) -> None:
  """Sets the maximum number of retries for API requests.

  Args:
    max_retries: The maximum number of retries for a request.
  """
  if max_retries < 0:
    raise ValueError('max_retries must be non-negative')
  if max_retries >= 100:
    raise ValueError('Too many retries')
  global _max_retries
  _max_retries = max_retries


@contextlib.contextmanager
def profiling(hook: Any) -> Iterator[None]:
  # pylint: disable=g-doc-return-or-yield
  """Returns a context manager which enables or disables profiling.

  If hook is not None, enables profiling for all API calls in its scope and
  calls the hook function with all resulting profile IDs. If hook is null,
  disables profiling (or leaves it disabled).

  Args:
    hook: A function of one argument which is called with each profile
        ID obtained from API calls, just before the API call returns.
  """
  saved_hook = _thread_locals.profile_hook
  _thread_locals.profile_hook = hook
  try:
    yield
  finally:
    _thread_locals.profile_hook = saved_hook


@deprecation.Deprecated('Use getAsset')
def getInfo(asset_id: str) -> Optional[Any]:
  """Load info for an asset, given an asset id.

  Args:
    asset_id: The asset to be retrieved.

  Returns:
    The value call results, or None if the asset does not exist.
  """
  # Don't use getAsset as it will translate the exception, and we need
  # to handle 404s specially.
  try:
    name = _cloud_api_utils.convert_asset_id_to_asset_name(asset_id)
    return (
        _get_cloud_projects()
        .assets()
        .get(name=name, prettyPrint=False)
        .execute(num_retries=_max_retries)
    )
  except googleapiclient.errors.HttpError as e:
    if e.resp.status == 404:
      return None
    else:
      raise _translate_cloud_exception(e)  # pylint: disable=raise-missing-from


def getAsset(asset_id: str) -> Any:
  """Loads info for an asset, given an asset id.

  Args:
    asset_id: The asset to be retrieved.

  Returns:
    The asset's information, as an EarthEngineAsset.
  """
  name = _cloud_api_utils.convert_asset_id_to_asset_name(asset_id)
  return _execute_cloud_call(
      _get_cloud_projects().assets().get(name=name, prettyPrint=False)
  )


@deprecation.Deprecated('Use listAssets or listImages')
def getList(params: Dict[str, Any]) -> Any:
  """Get a list of contents for a collection asset.

  Args:
    params: An object containing request parameters with the possible values:
      id - (string) The asset id of the collection to list, required.
      starttime - (number) Start time, in msec since the epoch.
      endtime - (number) End time, in msec since the epoch.

  Returns:
    The list call results.
  """
  result = listAssets(
      _cloud_api_utils.convert_get_list_params_to_list_assets_params(params))
  result = _cloud_api_utils.convert_list_assets_result_to_get_list_result(
      result)

  return result


def listImages(
    params: Union[str, Dict[str, Any]],
) -> Dict[str, Optional[List[Any]]]:
  """Returns the images in an image collection or folder.

  Args:
    params: Either a string representing the ID of the image collection to list,
      or an object containing request parameters with the following possible
      values, all but 'parent` are optional:
      parent - (string) The ID of the image collection to list, required.
      pageSize - (string) The number of results to return. If not specified, all
        results are returned.
      pageToken - (string) The token page of results to return.
      startTime - (ISO 8601 string): The minimum start time (inclusive).
      endTime - (ISO 8601 string): The maximum end time (exclusive).
      region - (GeoJSON or WKT string): A region to filter on.
      properties - (list of strings): A list of property filters to apply, for
        example, ["classification=urban", "size>=2"].
      filter - (string) An additional filter query to apply. Example query:
          `properties.my_property>=1 AND properties.my_property<2 AND
          startTime >= "2019-01-01T00:00:00.000Z" AND
          endTime < "2020-01-01T00:00:00.000Z" AND
          intersects("{'type':'Point','coordinates':[0,0]}")`
        See https://google.aip.dev/160 for how to construct a query.
      view - (string) Specifies how much detail is returned in the list. Either
        "FULL" (default) for all image properties or "BASIC".
  """
  # Allow the user to pass a single string, interpreted as 'parent'
  if isinstance(params, str):
    params = {'parent': params}
  assets = listAssets(
      _cloud_api_utils.convert_list_images_params_to_list_assets_params(params))
  images = {'images': []}
  images['images'].extend(assets.get('assets', []))
  if _NEXT_PAGE_TOKEN_KEY in assets:
    images[_NEXT_PAGE_TOKEN_KEY] = assets.get(_NEXT_PAGE_TOKEN_KEY)
  return images


def listAssets(params: Union[str, Dict[str, Any]]) -> Dict[str, List[Any]]:
  """Returns the assets in a folder.

  Args:
    params: Either a string representing the ID of the collection or folder to
      list, or an object containing request parameters with the following
      possible values, all but 'parent` are optional:
      parent - (string) The ID of the collection or folder to list, required.
      pageSize - (string) The number of results to return. If not specified, all
        results are returned.
      pageToken - (string) The token page of results to return.
      filter - (string) An additional filter query to apply. Example query:
        '''properties.my_property>=1 AND properties.my_property<2 AND
           startTime >= "2019-01-01T00:00:00.000Z" AND
           endTime < "2020-01-01T00:00:00.000Z" AND
           intersects("{'type':'Point','coordinates':[0,0]}")'''
        See https://google.aip.dev/160 for how to construct a query.
      view - (string) Specifies how much detail is returned in the list. Either
        "FULL" (default) for all image properties or "BASIC".
  """
  # Allow the user to pass a single string, interpreted as 'parent'
  if isinstance(params, str):
    params = {'parent': params}
  if 'parent' in params:
    params['parent'] = _cloud_api_utils.convert_asset_id_to_asset_name(
        params['parent'])
  if 'parent' in params and _cloud_api_utils.is_asset_root(params['parent']):
    # If the asset name is 'projects/my-project/assets' we assume a user
    # wants to list their cloud assets, to do this we call the alternative
    # listAssets method and remove the trailing '/assets/?'
    params['parent'] = re.sub('/assets/?$', '', params['parent'])
    cloud_resource_root = _get_cloud_projects()
  else:
    cloud_resource_root = _get_cloud_projects().assets()
  request = cloud_resource_root.listAssets(**params)
  response = None
  assets = {'assets': []}
  while request is not None:
    response = _execute_cloud_call(request)
    assets['assets'].extend(response.get('assets', []))
    request = cloud_resource_root.listAssets_next(request, response)
    # We currently treat pageSize as a cap on the results, if this param was
    # provided we should break fast and not return more than the asked for
    # amount.
    if 'pageSize' in params:
      break
  # A next page token should only be present if pageSize is set, but populate it
  # on the return value if a token is present in the last response.
  if response and _NEXT_PAGE_TOKEN_KEY in response:
    assets[_NEXT_PAGE_TOKEN_KEY] = response.get(_NEXT_PAGE_TOKEN_KEY)
  return assets


def listBuckets(project: Optional[str] = None) -> Any:
  """Returns top-level assets and folders for the Cloud Project or user.

  Args:
    project: Project to query, e.g., "projects/my-project". Defaults to current
      project. Use "projects/earthengine-legacy" for user home folders.

  Returns:
    A dictionary with a list of top-level assets and folders like:
      {"assets": [
          {"type": "FOLDER", "id": "projects/my-project/assets/my-folder", ...},
          {"type": "IMAGE", "id": "projects/my-project/assets/my-image", ...},
      ]}
  """
  if project is None:
    project = _get_projects_path()
  return _execute_cloud_call(_get_cloud_projects().listAssets(parent=project))


def getMapId(params: Dict[str, Any]) -> Dict[str, Any]:
  """Get a Map ID for a given asset.

  Args:
    params: An object containing visualization options with the
            following possible values:
      image - The image to render, as an Image or a JSON string.
          The JSON string format is deprecated.
      version - (number) Version number of image (or latest).
      bands - (comma-separated strings) Comma-delimited list of
          band names to be mapped to RGB.
      min - (comma-separated numbers) Value (or one per band)
          to map onto 00.
      max - (comma-separated numbers) Value (or one per band)
          to map onto FF.
      gain - (comma-separated numbers) Gain (or one per band)
          to map onto 00-FF.
      bias - (comma-separated numbers) Offset (or one per band)
          to map onto 00-FF.
      gamma - (comma-separated numbers) Gamma correction
          factor (or one per band).
      palette - (comma-separated strings) A string of comma-separated
          CSS-style color strings (single-band previews only). For example,
          'FF0000,000000'.
      format - (string) The desired map tile image format. If omitted, one is
          chosen automatically. Can be 'jpg' (does not support transparency)
          or 'png' (supports transparency).

  Returns:
    A map ID dictionary containing:
    - "mapid" and optional "token" strings: these identify the map.
    - "tile_fetcher": a TileFetcher which can be used to fetch the tile
      images, or to get a format for the tile URLs.
  """
  if isinstance(params['image'], str):
    raise ee_exception.EEException('Image as JSON string not supported.')
  if 'version' in params:
    raise ee_exception.EEException(
        'Image version specification not supported.')
  request = {
      'expression':
          serializer.encode(params['image'], for_cloud_api=True),
      'fileFormat':
          _cloud_api_utils.convert_to_image_file_format(params.get('format')),
      'bandIds':
          _cloud_api_utils.convert_to_band_list(params.get('bands')),
  }
  # Only add visualizationOptions to the request if it's non-empty, as
  # specifying it affects server behaviour.
  visualizationOptions = _cloud_api_utils.convert_to_visualization_options(
      params)
  if visualizationOptions:
    request['visualizationOptions'] = visualizationOptions
  # Returns only the `name` field, otherwise it echoes the entire request, which
  # might be large.
  queryParams = {
      'fields': 'name',
      'body': request,
  }
  _maybe_populate_workload_tag(queryParams)
  result = _execute_cloud_call(
      _get_cloud_projects()
      .maps()
      .create(parent=_get_projects_path(), **queryParams)
  )
  map_name = result['name']
  url_format = '%s/%s/%s/tiles/{z}/{x}/{y}' % (
      _tile_base_url, _cloud_api_utils.VERSION, map_name)
  if _cloud_api_key:
    url_format += '?key=%s' % _cloud_api_key

  return {'mapid': map_name, 'token': '',
          'tile_fetcher': TileFetcher(url_format, map_name=map_name)}


def getFeatureViewTilesKey(params: Dict[str, Any]) -> Dict[str, Any]:
  """Get a tiles key for a given map or asset.

  Args:
    params: An object containing parameters with the following possible values:
      assetId - The asset ID for which to obtain a tiles key.
      visParams - The visualization parameters for this layer.

  Returns:
    A dictionary containing:
    - "token" string: this identifies the FeatureView.
  """
  request = {
      'asset':
          _cloud_api_utils.convert_asset_id_to_asset_name(
              params.get('assetId'))
  }
  # Only include visParams if it's non-empty.
  if params.get('visParams'):
    request['visualizationExpression'] = serializer.encode(
        params.get('visParams'), for_cloud_api=True)
  # Returns only the `name` field, otherwise it echoes the entire request, which
  # might be large.
  result = _execute_cloud_call(
      _get_cloud_projects()
      .featureView()
      .create(parent=_get_projects_path(), fields='name', body=request)
  )
  name = result['name']
  version = _cloud_api_utils.VERSION
  format_tile_url = (
      lambda x, y, z: f'{_tile_base_url}/{version}/{name}/tiles/{z}/{x}/{y}')
  token = name.rsplit('/', 1).pop()
  return {
      'token': token,
      'formatTileUrl': format_tile_url,
  }


def _extract_table_converter(params: Dict[str, Any]) -> Optional[Any]:
  if 'fileFormat' in params:
    file_format = params.get('fileFormat')
    converter = table_converter.from_file_format(file_format)
    if converter:
      return converter
    raise ValueError('Invalid table file format: ', file_format)
  return None


def _extract_image_converter(
    params: Dict[str, Any]
) -> image_converter.ImageConverter:
  file_format = params.get('fileFormat')
  converter = image_converter.from_file_format(file_format)
  if converter:
    return converter
  return image_converter.IdentityImageConverter(file_format)


def _generate(func, list_key: str, **kwargs) -> Iterator[Any]:
  """Returns a generator for list methods that contain a next page token."""
  args = kwargs.copy()
  while True:
    response = func(**args)
    for obj in response.get(list_key, []):
      yield obj
    if _NEXT_PAGE_TOKEN_KEY not in response:
      break
    args['params'].update({'pageToken': response[_NEXT_PAGE_TOKEN_KEY]})


def listFeatures(params: Dict[str, Any]) -> Any:
  """List features for a given table or FeatureView asset.

  Args:
    params: An object containing parameters with the following possible values:
      assetId - The asset ID for which to list features.
      pageSize - An optional max number of results per page, default is 1000.
      pageToken - An optional token identifying a new page of results the server
                  should return, usually taken from the response object.
      region - If present, a geometry defining a query region, specified as a
               GeoJSON geometry string (see RFC 7946).
      filter - If present, specifies additional simple property filters
               (see https://google.aip.dev/160).
      fileFormat - If present, specifies an output format for the tabular data.
          The function makes a network request for each page until the entire
          table has been fetched. The number of fetches depends on the number of
          rows in the table and pageSize. pageToken is ignored. Supported
          formats are: PANDAS_DATAFRAME for a Pandas DataFrame and
          GEOPANDAS_GEODATAFRAME for a GeoPandas GeoDataFrame.

  Returns:
    A Pandas DataFrame, GeoPandas GeoDataFrame, or a dictionary containing:
    - "type": always "FeatureCollection" marking this object as a GeoJSON
              feature collection.
    - "features": a list of GeoJSON features.
    - "next_page_token": A token to retrieve the next page of results in a
                         subsequent call to this function.
  """
  params = params.copy()
  params['asset'] = _cloud_api_utils.convert_asset_id_to_asset_name(
      params.get('assetId'))
  del params['assetId']

  def call(params):
    return _execute_cloud_call(
        _get_cloud_projects().assets().listFeatures(**params)
    )

  converter = _extract_table_converter(params)
  params.pop('fileFormat', None)
  if converter:
    return converter.do_conversion(_generate(call, 'features', params=params))
  return call(params)


def getPixels(params: Dict[str, Any]) -> Any:
  """Fetches pixels from an image asset.

  Args:
    params: An object containing parameters with the following possible values:
      assetId - The asset ID for which to get pixels. Must be an image asset.
      fileFormat - The resulting file format. Defaults to png. See
          https://developers.google.com/earth-engine/reference/rest/v1/ImageFileFormat
          for the available formats. There are additional formats that convert
          the downloaded object to a Python data object. These include:
          NUMPY_NDARRAY, which converts to a structured NumPy array.
      grid - Parameters describing the pixel grid in which to fetch data.
          Defaults to the native pixel grid of the data.
      region - If present, the region of data to return, specified as a GeoJSON
          geometry object (see RFC 7946).
      bandIds - If present, specifies a specific set of bands from which to get
          pixels.
      visualizationOptions - If present, a set of visualization options to apply
          before the pixels are returned. See
          https://developers.google.com/earth-engine/reference/rest/v1/VisualizationOptions
          for details.

  Returns:
    The pixels as raw image data.
  """
  params = params.copy()
  name = _cloud_api_utils.convert_asset_id_to_asset_name(params.get('assetId'))
  del params['assetId']
  converter = _extract_image_converter(params)
  params['fileFormat'] = _cloud_api_utils.convert_to_image_file_format(
      converter.expected_data_format()
  )
  _maybe_populate_workload_tag(params)
  data = _execute_cloud_call(
      _get_cloud_projects_raw()
      .assets()
      .getPixels(name=name, body=params)
  )
  if converter:
    return converter.do_conversion(data)
  return data


def computePixels(params: Dict[str, Any]) -> Any:
  """Computes a tile by performing an arbitrary computation on image data.

  Args:
    params: An object containing parameters with the following possible values:
      expression - The expression to compute.
      fileFormat - The resulting file format. Defaults to png. See
          https://developers.google.com/earth-engine/reference/rest/v1/ImageFileFormat
          for the available formats. There are additional formats that convert
          the downloaded object to a Python data object. These include:
          NUMPY_NDARRAY, which converts to a structured NumPy array.
      grid - Parameters describing the pixel grid in which to fetch data.
          Defaults to the native pixel grid of the data.
      bandIds - If present, specifies a specific set of bands from which to get
          pixels.
      visualizationOptions - If present, a set of visualization options to apply
          before the pixels are computed and returned. See
          https://developers.google.com/earth-engine/reference/rest/v1/VisualizationOptions
          for details.

  Returns:
    The pixels as raw image data.
  """
  params = params.copy()
  params['expression'] = serializer.encode(params['expression'])
  converter = _extract_image_converter(params)
  params['fileFormat'] = _cloud_api_utils.convert_to_image_file_format(
      converter.expected_data_format()
  )
  _maybe_populate_workload_tag(params)
  data = _execute_cloud_call(
      _get_cloud_projects_raw()
      .image()
      .computePixels(project=_get_projects_path(), body=params)
  )
  if converter:
    return converter.do_conversion(data)
  return data


def computeImages(params: Dict[str, Any]) -> Any:
  """Computes a list of images by applying a computation to features.

  Args:
    params: An object containing parameters with the following possible values:
      expression - The expression to compute.
      pageSize - The maximum number of results per page. The server may return
          fewer images than requested. If unspecified, the page size default is
          1000 results per page.
      pageToken - A token identifying a page of results the server should
                  return.
      workloadTag - User supplied tag to track this computation.

  Returns:
    A list with the results of the computation.
  """
  params = params.copy()
  params['expression'] = serializer.encode(params['expression'])
  _maybe_populate_workload_tag(params)
  return _execute_cloud_call(
      _get_cloud_projects()
      .imageCollection()
      .computeImages(project=_get_projects_path(), body=params)
  )


def computeFeatures(params: Dict[str, Any]) -> Any:
  """Computes a list of features by applying a computation to features.

  Args:
    params: An object containing parameters with the following possible values:
      expression - The expression to compute.
      pageSize - The maximum number of results per page. The server may return
          fewer images than requested. If unspecified, the page size default is
          1000 results per page.
      pageToken - A token identifying a page of results the server should
                  return.
      fileFormat - If present, specifies an output format for the tabular data.
          The function makes a network request for each page until the entire
          table has been fetched. The number of fetches depends on the number of
          rows in the table and pageSize. pageToken is ignored. Supported
          formats are: PANDAS_DATAFRAME for a Pandas DataFrame and
          GEOPANDAS_GEODATAFRAME for a GeoPandas GeoDataFrame.
      workloadTag - User supplied tag to track this computation.

  Returns:
    A Pandas DataFrame, GeoPandas GeoDataFrame, or a dictionary containing:
    - "type": always "FeatureCollection" marking this object as a GeoJSON
          feature collection.
    - "features": a list of GeoJSON features reprojected to EPSG:4326 with
          planar edges.
    - "next_page_token": A token to retrieve the next page of results in a
          subsequent call to this function.
  """
  params = params.copy()
  params['expression'] = serializer.encode(params['expression'])
  _maybe_populate_workload_tag(params)

  def call(params):
    return _execute_cloud_call(
        _get_cloud_projects()
        .table()
        .computeFeatures(project=_get_projects_path(), body=params)
    )

  converter = _extract_table_converter(params)
  params.pop('fileFormat', None)
  if converter:
    return converter.do_conversion(_generate(call, 'features', params=params))
  return call(params)


def getTileUrl(mapid: Dict[str, Any], x: float, y: float, z: float) -> str:
  """Generate a URL for map tiles from a Map ID and coordinates.

  Args:
    mapid: The Map ID to generate tiles for, a dictionary returned
        by getMapId.
    x: The tile x coordinate.
    y: The tile y coordinate.
    z: The tile zoom level.

  Returns:
    The tile URL.
  """
  return mapid['tile_fetcher'].format_tile_url(x, y, z)


class TileFetcher:
  """A helper class to fetch image tiles."""
  _url_format: str
  _map_name: str

  def __init__(self, url_format, map_name=None):
    self._url_format = url_format
    self._map_name = map_name

  @property
  def url_format(self) -> str:
    """Gets the URL format for this tile fetcher.

    Returns:
      A format string with {x}, {y}, and {z} placeholders.
      If you are using the Cloud API, and have not provided an API
      key, then this URL will require authorization. Use the credentials
      provided to ee.Initialize() to provide this authorization. Alternatively,
      use "fetch_tile" to fetch the tile data, which will handle the
      authorization for you.
    """
    return self._url_format

  def format_tile_url(self, x: float, y: float, z: float) -> str:
    """Generates the URL for a particular tile.

    Args:
      x: The tile x coordinate.
      y: The tile y coordinate.
      z: The tile zoom level.

    Returns:
      The tile's URL.
    """
    width = 2**z
    x %= width
    if x < 0:
      x += width
    return self.url_format.format(x=x, y=y, z=z)

  def fetch_tile(self, x: float, y: float, z: float) -> Any:
    """Fetches the map tile specified by (x, y, z).

    This method uses any credentials that were specified to ee.Initialize().

    Args:
      x: The tile x coordinate.
      y: The tile y coordinate.
      z: The tile zoom level.

    Returns:
      The map tile image data bytes.

    Raises:
      EEException if the fetch fails.
    """
    return _execute_cloud_call(
        _get_cloud_projects_raw()
        .maps()
        .tiles()
        .get(parent=self._map_name, x=x, y=y, zoom=z)
    )


def computeValue(obj: computedobject.ComputedObject) -> Any:
  """Sends a request to compute a value.

  Args:
    obj: A ComputedObject whose value is desired.

  Returns:
    The result of evaluating that object on the server.
  """
  body = {'expression': serializer.encode(obj, for_cloud_api=True)}
  _maybe_populate_workload_tag(body)

  return _execute_cloud_call(
      _get_cloud_projects()
      .value()
      .compute(body=body, project=_get_projects_path(), prettyPrint=False)
  )['result']


@deprecation.Deprecated('Use getThumbId and makeThumbUrl')
def getThumbnail(
    params: Dict[str, Any], thumbType: Optional[str] = None
) -> Any:
  """Get a Thumbnail for a given asset.

  Args:
    params: Parameters identical to getMapId, plus:
        size - (a number or pair of numbers in format WIDTHxHEIGHT) Maximum
          dimensions of the thumbnail to render, in pixels. If only one number
          is passed, it is used as the maximum, and the other dimension is
          computed by proportional scaling.
        region - (E,S,W,N or GeoJSON) Geospatial region of the image
          to render. By default, the whole image.
        format - (string) Either 'png' (default) or 'jpg'.
     thumbType: Thumbnail type to get. Only valid values are
        'video' or 'filmstrip' otherwise the request is treated as a
        regular thumbnail.
  Returns:
    A thumbnail image as raw PNG data.
  """
  thumbid = params['image'].getThumbId(params)['thumbid']
  if thumbType == 'video':
    return _execute_cloud_call(
        _get_cloud_projects_raw().videoThumbnails().getPixels(name=thumbid)
    )
  elif thumbType == 'filmstrip':
    return _execute_cloud_call(
        _get_cloud_projects_raw().filmstripThumbnails().getPixels(name=thumbid)
    )
  else:
    return _execute_cloud_call(
        _get_cloud_projects_raw().thumbnails().getPixels(name=thumbid)
    )


def getThumbId(
    params: Dict[str, Any], thumbType: Optional[str] = None
) -> Dict[str, str]:
  """Get a Thumbnail ID for a given asset.

  Args:
    params: Parameters identical to getMapId, plus:
        size - (a number or pair of numbers in format WIDTHxHEIGHT) Maximum
          dimensions of the thumbnail to render, in pixels. If only one number
          is passed, it is used as the maximum, and the other dimension is
          computed by proportional scaling.
        region - (E,S,W,N or GeoJSON) Geospatial region of the image
          to render. By default, the whole image.
        format - (string) Either 'png' (default) or 'jpg'.
    thumbType: Type of thumbnail to create an ID for, the values
        'video' or 'filmstrip' will create filmstrip/video ids.

  Returns:
    A dictionary containing "thumbid" and "token" strings, which identify the
    thumbnail.
  """
  # We only really support accessing this method via ee.Image.getThumbURL,
  # which folds almost all the parameters into the Image itself.
  if isinstance(params['image'], str):
    raise ee_exception.EEException('Image as JSON string not supported.')
  if 'version' in params:
    raise ee_exception.EEException(
        'Image version specification not supported.')
  if 'size' in params:
    raise ee_exception.EEException(
        '"size" not supported. Use "dimensions" and ee.Image.getThumbURL.')
  if 'region' in params:
    raise ee_exception.EEException(
        '"region" not supported in call to ee.data.getThumbId. Use '
        'ee.Image.getThumbURL.')
  request = {
      'expression':
          serializer.encode(params['image'], for_cloud_api=True),
      'fileFormat':
          _cloud_api_utils.convert_to_image_file_format(params.get('format')),
  }
  # Only add visualizationOptions to the request if it's non-empty, as
  # specifying it affects server behaviour.
  visualizationOptions = _cloud_api_utils.convert_to_visualization_options(
      params)
  if visualizationOptions:
    request['visualizationOptions'] = visualizationOptions
  # Returns only the `name` field, otherwise it echoes the entire request, which
  # might be large.
  queryParams = {
      'fields': 'name',
      'body': request,
  }
  _maybe_populate_workload_tag(queryParams)
  if thumbType == 'video':
    if 'framesPerSecond' in params:
      request['videoOptions'] = {
          'framesPerSecond': params.get('framesPerSecond')
      }
    result = _execute_cloud_call(
        _get_cloud_projects()
        .videoThumbnails()
        .create(parent=_get_projects_path(), **queryParams)
    )
  elif thumbType == 'filmstrip':
    # Currently only 'VERTICAL' thumbnails are supported.
    request['orientation'] = 'VERTICAL'
    result = _execute_cloud_call(
        _get_cloud_projects()
        .filmstripThumbnails()
        .create(parent=_get_projects_path(), **queryParams)
    )
  else:
    request['filenamePrefix'] = params.get('name')
    request['bandIds'] = _cloud_api_utils.convert_to_band_list(
        params.get('bands')
    )
    result = _execute_cloud_call(
        _get_cloud_projects()
        .thumbnails()
        .create(parent=_get_projects_path(), **queryParams)
    )
  return {'thumbid': result['name'], 'token': ''}


def makeThumbUrl(thumbId: Dict[str, str]) -> str:
  """Create a thumbnail URL from the given thumbid.

  Args:
    thumbId: A dictionary containing a thumbnail thumbid.

  Returns:
    A URL from which the thumbnail can be obtained.
  """
  url = '%s/%s/%s:getPixels' % (_tile_base_url, _cloud_api_utils.VERSION,
                                thumbId['thumbid'])
  if _cloud_api_key:
    url += '?key=%s' % _cloud_api_key
  return url


def getDownloadId(params: Dict[str, Any]) -> Dict[str, str]:
  """Get a Download ID.

  Args:
    params: An object containing visualization options with the following
      possible values:
        image - The image to download.
        - name: a base name to use when constructing filenames. Only applicable
            when format is "ZIPPED_GEO_TIFF" (default),
            "ZIPPED_GEO_TIFF_PER_BAND", or filePerBand is true. Defaults to the
            image id (or "download" for computed images) when format is
            "ZIPPED_GEO_TIFF", "ZIPPED_GEO_TIFF_PER_BAND", or filePerBand is
            true, otherwise a random character string is generated. Band names
            are appended when filePerBand is true.
        - bands: a description of the bands to download. Must be an array of
            band names or an array of dictionaries, each with the
            following keys:
          + id: the name of the band, a string, required.
          + crs: an optional CRS string defining the band projection.
          + crs_transform: an optional array of 6 numbers specifying an affine
              transform from the specified CRS, in the order:
              [xScale, yShearing, xShearing, yScale, xTranslation, yTranslation]
          + dimensions: an optional array of two integers defining the width and
              height to which the band is cropped.
          + scale: an optional number, specifying the scale in meters of the
                 band; ignored if crs and crs_transform are specified.
        - crs: a default CRS string to use for any bands that do not explicitly
            specify one.
        - crs_transform: a default affine transform to use for any bands that do
            not specify one, of the same format as the crs_transform of bands.
        - dimensions: default image cropping dimensions to use for any bands
            that do not specify them.
        - scale: a default scale to use for any bands that do not specify one;
            ignored if crs and crs_transform is specified.
        - region: a polygon specifying a region to download; ignored if crs
            and crs_transform are specified.
        - filePerBand: whether to produce a separate GeoTIFF per band (boolean).
            Defaults to true. If false, a single GeoTIFF is produced and all
            band-level transformations will be ignored. Note that this is
            ignored if the format is "ZIPPED_GEO_TIFF" or
            "ZIPPED_GEO_TIFF_PER_BAND".
        - format: the download format. One of:
            "ZIPPED_GEO_TIFF" (GeoTIFF file wrapped in a zip file, default),
            "ZIPPED_GEO_TIFF_PER_BAND" (Multiple GeoTIFF files wrapped in a
            zip file), "GEO_TIFF" (GeoTIFF file), "NPY" (NumPy binary format).
            If "GEO_TIFF" or "NPY", filePerBand and all band-level
            transformations will be ignored. Loading a NumPy output results in
            a structured array.
        - id: deprecated, use image parameter.

  Returns:
    A dict containing a docid and token.
  """
  params = params.copy()
  # Previously, the docs required an image ID parameter that was changed
  # to image. Due to the circular dependency, we raise an error and ask the
  # user to supply an ee.Image directly.
  if 'id' in params:
    raise ee_exception.EEException('Image ID string is not supported. '
                                   'Construct an image with the ID '
                                   '(e.g., ee.Image(id)) and use '
                                   'ee.Image.getDownloadURL instead.')
  if 'image' not in params:
    raise ee_exception.EEException('Missing image parameter.')
  if isinstance(params['image'], str):
    raise ee_exception.EEException('Image as JSON string not supported.')
  params.setdefault('filePerBand', True)
  params.setdefault(
      'format', 'ZIPPED_GEO_TIFF_PER_BAND'
      if params['filePerBand'] else 'ZIPPED_GEO_TIFF')
  if 'region' in params and ('scale' in params or 'crs_transform' in params
                            ) and 'dimensions' in params:
    raise ee_exception.EEException(
        'Cannot specify (bounding region, crs_transform/scale, dimensions) '
        'simultaneously.'
    )
  bands = None
  if 'bands' in params:
    bands = params['bands']
    if isinstance(bands, str):
      bands = _cloud_api_utils.convert_to_band_list(bands)
    if not isinstance(bands, list):
      raise ee_exception.EEException('Bands parameter must be a list.')
    if all(isinstance(band, str) for band in bands):
      # Support expressing the bands list as a list of strings.
      bands = [{'id': band} for band in bands]
    if not all('id' in band for band in bands):
      raise ee_exception.EEException('Each band dictionary must have an id.')
    params['bands'] = bands
  request = {
      'expression':
          serializer.encode(
              params['image']._build_download_id_image(params),  # pylint: disable=protected-access
              for_cloud_api=True),
      'fileFormat':
          _cloud_api_utils.convert_to_image_file_format(params.get('format')),
  }
  request['filenamePrefix'] = params.get('name')
  if bands:
    request['bandIds'] = _cloud_api_utils.convert_to_band_list(
        [band['id'] for band in bands])
  # Returns only the `name` field, otherwise it echoes the entire request, which
  # might be large.
  queryParams = {
      'fields': 'name',
      'body': request,
  }
  _maybe_populate_workload_tag(queryParams)
  result = _execute_cloud_call(
      _get_cloud_projects()
      .thumbnails()
      .create(parent=_get_projects_path(), **queryParams)
  )
  return {'docid': result['name'], 'token': ''}


def makeDownloadUrl(downloadId: Dict[str, str]) -> str:
  """Create a download URL from the given docid.

  Args:
    downloadId: A dictionary containing a download docid.

  Returns:
    A URL from which the download can be obtained.
  """
  return '%s/%s/%s:getPixels' % (_tile_base_url, _cloud_api_utils.VERSION,
                                 downloadId['docid'])


def getTableDownloadId(params: Dict[str, Any]) -> Dict[str, str]:
  """Get a Download ID.

  Args:
    params: An object containing table download options with the following
      possible values:
        table - The feature collection to download.
        format - The download format, CSV, JSON, KML, KMZ, or TF_RECORD.
        selectors - Comma separated string of selectors that can be used to
            determine which attributes will be downloaded.
        filename - The name of the file that will be downloaded.
  Returns:
    A dict containing a docid and token.
  Raises:
    KeyError: if "table" is not specified.
  """
  if 'table' not in params:
    raise KeyError('"table" must be specified.')
  table = params['table']
  selectors = None
  if 'selectors' in params:
    selectors = params['selectors']
    if isinstance(selectors, str):
      selectors = selectors.split(',')
  filename = None
  if 'filename' in params:
    filename = params['filename']
  request = {
      'expression': serializer.encode(table, for_cloud_api=True),
      'fileFormat':
          _cloud_api_utils.convert_to_table_file_format(params.get('format')),
      'selectors': selectors,
      'filename': filename,
  }
  # Returns only the `name` field, otherwise it echoes the entire request, which
  # might be large.
  queryParams = {
      'fields': 'name',
      'body': request,
  }
  _maybe_populate_workload_tag(queryParams)
  result = _execute_cloud_call(
      _get_cloud_projects()
      .tables()
      .create(parent=_get_projects_path(), **queryParams)
  )
  return {'docid': result['name'], 'token': ''}


def makeTableDownloadUrl(downloadId: Dict[str, str]) -> str:
  """Create a table download URL from a docid.

  Args:
    downloadId: A dictionary with a table download docid.

  Returns:
    A Url from which the download can be obtained.
  """
  return '%s/%s/%s:getFeatures' % (
      _tile_base_url, _cloud_api_utils.VERSION, downloadId['docid'])


def getAlgorithms() -> Any:
  """Get the list of algorithms.

  Returns:
    The dictionary of algorithms.  Each algorithm is a dictionary containing
    the following fields:
        "description" - (string) A text description of the algorithm.
        "returns" - (string) The return type of the algorithm.
        "args" - An array of arguments.  Each argument specifies the following:
            "name" - (string) The name of the argument.
            "description" - (string) A text description of the argument.
            "type" - (string) The type of the argument.
            "optional" - (boolean) Whether the argument is optional or not.
            "default" - A representation of the default value if the argument
                is not specified.
  """
  try:
    call = (
        _get_cloud_projects()
        .algorithms()
        .list(parent=_get_projects_path(), prettyPrint=False)
    )
  except TypeError:
    call = (
        _get_cloud_projects()
        .algorithms()
        .list(project=_get_projects_path(), prettyPrint=False)
    )

  def inspect(response):
    if _INIT_MESSAGE_HEADER in response:
      print(
          '*** Earth Engine ***',
          response[_INIT_MESSAGE_HEADER],
          file=sys.stderr)
  call.add_response_callback(inspect)
  return _cloud_api_utils.convert_algorithms(_execute_cloud_call(call))


@_utils.accept_opt_prefix('opt_path', 'opt_force', 'opt_properties')
def createAsset(
    value: Dict[str, Any],
    path: Optional[str] = None,
    properties: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
  """Creates an asset from a JSON value.

  To create an empty image collection or folder, pass in a "value" object
  with a "type" key whose value is "ImageCollection" or "Folder".
  If you are using the Cloud API, use "IMAGE_COLLECTION" or "FOLDER".

  Args:
    value: An object describing the asset to create.
    path: An optional desired ID, including full path.
    properties: The keys and values of the properties to set on the created
      asset.

  Returns:
    A description of the saved asset, including a generated ID.
  """
  if not isinstance(value, dict):
    raise ee_exception.EEException('Asset cannot be specified as string.')
  asset = value.copy()
  if 'name' not in asset:
    if not path:
      raise ee_exception.EEException(
          'Either asset name or path must be specified.'
      )
    asset['name'] = _cloud_api_utils.convert_asset_id_to_asset_name(path)
  if 'properties' not in asset and properties:
    asset['properties'] = properties
  # Make sure title and description are loaded in as properties.
  move_to_properties = ['title', 'description']
  for prop in move_to_properties:
    if prop in asset:
      if 'properties' not in asset or not isinstance(asset['properties'], dict):
        asset['properties'] = {prop: asset[prop]}
      else:
        properties = asset['properties'].copy()
        properties.setdefault(prop, asset[prop])
        asset['properties'] = properties
      del asset[prop]
  if 'gcs_location' in asset and 'cloud_storage_location' not in asset:
    asset['cloud_storage_location'] = asset['gcs_location']
    del asset['gcs_location']
  asset['type'] = _cloud_api_utils.convert_asset_type_for_create_asset(
      asset['type'])
  parent, asset_id = _cloud_api_utils.split_asset_name(asset.pop('name'))
  return _execute_cloud_call(
      _get_cloud_projects()
      .assets()
      .create(
          parent=parent,
          assetId=asset_id,
          body=asset,
          prettyPrint=False,
      )
  )


def createFolder(path: str) -> Dict[str, Any]:
  """Creates an asset folder.

  Returns a description of the newly created folder.

  Args:
    path: The path to the folder to create.

  Returns:
    A description of the newly created folder.
  """
  return createAsset({'type': 'FOLDER'}, path)


def copyAsset(
    sourceId: str,
    destinationId: str,
    allowOverwrite: bool = False
) -> None:
  """Copies the asset from sourceId into destinationId.

  Args:
    sourceId: The ID of the asset to copy.
    destinationId: The ID of the new asset created by copying.
    allowOverwrite: If True, allows overwriting an existing asset.
  """
  request = {
      'destinationName':
          _cloud_api_utils.convert_asset_id_to_asset_name(destinationId),
      'overwrite':
          allowOverwrite
  }
  name = _cloud_api_utils.convert_asset_id_to_asset_name(sourceId)
  _execute_cloud_call(
      _get_cloud_projects().assets().copy(sourceName=name, body=request)
  )


def renameAsset(sourceId: str, destinationId: str) -> None:
  """Renames the asset from sourceId to destinationId.

  Args:
    sourceId: The ID of the asset to rename.
    destinationId: The new ID of the asset.
  """
  src_name = _cloud_api_utils.convert_asset_id_to_asset_name(sourceId)
  dest_name = _cloud_api_utils.convert_asset_id_to_asset_name(destinationId)
  _execute_cloud_call(
      _get_cloud_projects()
      .assets()
      .move(sourceName=src_name, body={'destinationName': dest_name})
  )


def deleteAsset(assetId: str) -> None:
  """Deletes the asset with the given id.

  Args:
    assetId: The ID of the asset to delete.
  """
  name = _cloud_api_utils.convert_asset_id_to_asset_name(assetId)
  _execute_cloud_call(_get_cloud_projects().assets().delete(name=name))


def newTaskId(count: int = 1) -> List[str]:
  """Generate an ID for a long-running task.

  Args:
    count: Optional count of IDs to generate, one by default.

  Returns:
    A list containing generated ID strings.
  """
  return [str(uuid.uuid4()) for _ in range(count)]


@deprecation.Deprecated('Use listOperations')
def getTaskList() -> List[Any]:
  """Retrieves a list of the user's tasks.

  Returns:
    A list of task status dictionaries, one for each task submitted to EE by
    the current user. These include currently running tasks as well as recently
    canceled or failed tasks.
  """
  return [_cloud_api_utils.convert_operation_to_task(o)
          for o in listOperations()]


def listOperations(project: Optional[str] = None) -> List[Any]:
  """Retrieves a list of the user's tasks.

  Args:
    project: The project to list operations for, uses the default set project
      if none is provided.
  Returns:
    A list of Operation status dictionaries, one for each task submitted to EE
    by the current user. These include currently running tasks as well as
    recently canceled or failed tasks.
  """
  if project is None:
    project = _get_projects_path()
  operations = []
  request = (
      _get_cloud_projects()
      .operations()
      .list(pageSize=_TASKLIST_PAGE_SIZE, name=project)
  )
  while request is not None:
    response = _execute_cloud_call(request)
    operations += response.get('operations', [])
    request = _get_cloud_projects().operations().list_next(request, response)
  return operations


@deprecation.Deprecated('Use getOperation')
def getTaskStatus(taskId: Union[List[str], str]) -> List[Any]:
  """Retrieve status of one or more long-running tasks.

  Args:
    taskId: ID of the task or a list of multiple IDs.

  Returns:
    List containing one object for each queried task, in the same order as
    the input array, each object containing the following values:
      id (string) ID of the task.
      state (string) State of the task, one of READY, RUNNING, COMPLETED,
        FAILED, CANCELLED; or UNKNOWN if the task with the specified ID
        doesn't exist.
      error_message (string) For a FAILED task, a description of the error.
  """
  if isinstance(taskId, str):
    taskId = [taskId]
  result = []
  for one_id in taskId:
    try:
      # Don't use getOperation as it will translate the exception, and we need
      # to handle 404s specially.
      operation = (
          _get_cloud_projects()
          .operations()
          .get(name=_cloud_api_utils.convert_task_id_to_operation_name(one_id))
          .execute(num_retries=_max_retries)
      )
      result.append(_cloud_api_utils.convert_operation_to_task(operation))
    except googleapiclient.errors.HttpError as e:
      if e.resp.status == 404:
        result.append({'id': one_id, 'state': 'UNKNOWN'})
      else:
        raise _translate_cloud_exception(e)  # pylint: disable=raise-missing-from
  return result


def getOperation(operation_name: str) -> Any:
  """Retrieves the status of a long-running operation.

  Args:
    operation_name: The name of the operation to retrieve, in the format
      operations/AAAABBBBCCCCDDDDEEEEFFFF.

  Returns:
    An Operation status dictionary for the requested operation.
  """
  return _execute_cloud_call(
      _get_cloud_projects().operations().get(name=operation_name)
  )


@deprecation.Deprecated('Use cancelOperation')
def cancelTask(taskId: str) -> None:
  """Cancels a batch task."""
  cancelOperation(_cloud_api_utils.convert_task_id_to_operation_name(taskId))


def cancelOperation(operation_name: str) -> None:
  _execute_cloud_call(
      _get_cloud_projects().operations().cancel(name=operation_name, body={})
  )


def exportImage(request_id: str, params: Dict[str, Any]) -> Any:
  """Starts an image export task running.

  This is a low-level method. The higher-level ee.batch.Export.image object
  is generally preferred for initiating image exports.

  Args:
    request_id (string): A unique ID for the task, from newTaskId.
      If you are using the cloud API, this does not need to be from newTaskId,
      (though that's a good idea, as it's a good source of unique strings).
      It can also be empty, but in that case the request is more likely to
      fail as it cannot be safely retried.
    params: The object that describes the export task.
      If you are using the cloud API, this should be an ExportImageRequest.
      However, the "expression" parameter can be the actual Image to be
      exported, not its serialized form.

  Returns:
    A dict with information about the created task.
    If you are using the cloud API, this will be an Operation.
  """
  params = params.copy()
  return _prepare_and_run_export(
      request_id, params, _get_cloud_projects().image().export
  )


def exportTable(request_id: str, params: Dict[str, Any]) -> Any:
  """Starts a table export task running.

  This is a low-level method. The higher-level ee.batch.Export.table object
  is generally preferred for initiating table exports.

  Args:
    request_id (string): A unique ID for the task, from newTaskId. If you are
      using the cloud API, this does not need to be from newTaskId, (though
      that's a good idea, as it's a good source of unique strings). It can also
      be empty, but in that case the request is more likely to fail as it cannot
      be safely retried.
    params: The object that describes the export task. If you are using the
      cloud API, this should be an ExportTableRequest. However, the "expression"
      parameter can be the actual FeatureCollection to be exported, not its
      serialized form.

  Returns:
    A dict with information about the created task.
    If you are using the cloud API, this will be an Operation.
  """
  params = params.copy()
  return _prepare_and_run_export(
      request_id, params, _get_cloud_projects().table().export
  )


def exportVideo(request_id: str, params: Dict[str, Any]) -> Any:
  """Starts a video export task running.

  This is a low-level method. The higher-level ee.batch.Export.video object
  is generally preferred for initiating video exports.

  Args:
    request_id (string): A unique ID for the task, from newTaskId.
      If you are using the cloud API, this does not need to be from newTaskId,
      (though that's a good idea, as it's a good source of unique strings).
      It can also be empty, but in that case the request is more likely to
      fail as it cannot be safely retried.
    params: The object that describes the export task.
      If you are using the cloud API, this should be an ExportVideoRequest.
      However, the "expression" parameter can be the actual ImageCollection
      to be exported, not its serialized form.

  Returns:
    A dict with information about the created task.
    If you are using the cloud API, this will be an Operation.
  """
  params = params.copy()
  return _prepare_and_run_export(
      request_id, params, _get_cloud_projects().video().export
  )


def exportMap(request_id: str, params: Dict[str, Any]) -> Any:
  """Starts a map export task running.

  This is a low-level method. The higher-level ee.batch.Export.map object
  is generally preferred for initiating map tile exports.

  Args:
    request_id (string): A unique ID for the task, from newTaskId.
      If you are using the cloud API, this does not need to be from newTaskId,
      (though that's a good idea, as it's a good source of unique strings).
      It can also be empty, but in that case the request is more likely to
      fail as it cannot be safely retried.
    params: The object that describes the export task.
      If you are using the cloud API, this should be an ExportMapRequest.
      However, the "expression" parameter can be the actual Image to be
      exported, not its serialized form.

  Returns:
    A dict with information about the created task.
    If you are using the cloud API, this will be an Operation.
  """
  params = params.copy()
  return _prepare_and_run_export(
      request_id, params, _get_cloud_projects().map().export
  )


def exportClassifier(request_id: str, params: Dict[str, Any]) -> Any:
  """Starts a classifier export task.

  This is a low-level method. The higher-level ee.batch.Export.classifier
  object is generally preferred for initiating classifier exports.

  Args:
    request_id (string): A unique ID for the task, from newTaskId. If you are
      using the cloud API, this does not need to be from newTaskId, (though
      that's a good idea, as it's a good source of unique strings). It can also
      be empty, but in that case the request is more likely to fail as it cannot
      be safely retried.
    params: The object that describes the export task. If you are using the
      cloud API, this should be an ExportClassifierRequest. However, the
      "expression" parameter can be the actual Classifier to be exported, not
      its serialized form.

  Returns:
    A dict with information about the created task.
    If you are using the cloud API, this will be an Operation.
  """
  params = params.copy()
  return _prepare_and_run_export(
      request_id, params, _get_cloud_projects().classifier().export
  )


def _prepare_and_run_export(
    request_id: str, params: Dict[str, Any], export_endpoint: Any
) -> Any:
  """Starts an export task running.

  Args:
    request_id (string): An optional unique ID for the task.
    params: The object that describes the export task. The "expression"
      parameter can be the actual object to be exported, not its serialized
      form. This may be modified.
    export_endpoint: A callable representing the export endpoint to invoke
      (e.g., _get_cloud_api_resource().image().export).

  Returns:
    An Operation with information about the created task.
  """
  _maybe_populate_workload_tag(params)
  if request_id:
    if isinstance(request_id, str):
      params['requestId'] = request_id
    # If someone passes request_id via newTaskId() (which returns a list)
    # try to do the right thing and use the first entry as a request ID.
    elif (isinstance(request_id, list) and len(request_id) == 1 and
          isinstance(request_id[0], str)):
      params['requestId'] = request_id[0]
    else:
      raise ValueError('"requestId" must be a string.')
  if isinstance(params['expression'], encodable.Encodable):
    params['expression'] = serializer.encode(
        params['expression'], for_cloud_api=True)
  num_retries = _max_retries if request_id else 0
  return _execute_cloud_call(
      export_endpoint(project=_get_projects_path(), body=params),
      num_retries=num_retries)

# TODO(user): use StrEnum when 3.11 is the min version
_INTERNAL_IMPORT = 'INTERNAL_IMPORT'


def _startIngestion(
    request_id: Any,
    params: Dict[str, Any],
    allow_overwrite: bool = False,
    import_mode: Optional[str] = _INTERNAL_IMPORT,
) -> Dict[str, Any]:
  """Starts an ingestion task or creates an external image."""
  request = {
      'imageManifest':
          _cloud_api_utils.convert_params_to_image_manifest(params),
      'overwrite':
          allow_overwrite
  }

  # It's only safe to retry the request if there's a unique ID to make it
  # idempotent.
  num_retries = _max_retries if request_id else 0

  image = _get_cloud_projects().image()
  if import_mode == _INTERNAL_IMPORT:
    import_request = image.import_(project=_get_projects_path(), body=request)
  else:
    raise ee_exception.EEException(
        '{} is not a valid import mode'.format(import_mode)
    )

  result = _execute_cloud_call(
      import_request,
      num_retries=num_retries,
  )

  if import_mode == _INTERNAL_IMPORT:
    return {
        'id': _cloud_api_utils.convert_operation_name_to_task_id(
            result['name']
        ),
        'name': result['name'],
        'started': 'OK',
    }
  else:
    return {'name': request['imageManifest']['name']}


def startIngestion(
    request_id: Any,
    params: Dict[str, Any],
    allow_overwrite: bool = False,
) -> Dict[str, Any]:
  """Creates an image asset import task.

  Args:
    request_id (string): A unique ID for the ingestion, from newTaskId.
      If you are using the Cloud API, this does not need to be from newTaskId,
      (though that's a good idea, as it's a good source of unique strings).
      It can also be empty, but in that case the request is more likely to
      fail as it cannot be safely retried.
    params: The object that describes the import task, which can
        have these fields:
          name (string) The destination asset id (e.g.,
             "projects/myproject/assets/foo/bar").
          tilesets (array) A list of Google Cloud Storage source file paths
            formatted like:
              [{'sources': [
                  {'uris': ['foo.tif', 'foo.prj']},
                  {'uris': ['bar.tif', 'bar.prj']},
              ]}]
            Where path values correspond to source files' Google Cloud Storage
            object names, e.g., 'gs://bucketname/filename.tif'
          bands (array) An optional list of band names formatted like:
            [{'id': 'R'}, {'id': 'G'}, {'id': 'B'}]
        In general, this is a dict representation of an ImageManifest.
    allow_overwrite: Whether the ingested image can overwrite an
        existing version.

  Returns:
    A dict with notes about the created task. This will include the ID for the
    import task (under 'id'), which may be different from request_id.
  """
  return _startIngestion(request_id, params, allow_overwrite, _INTERNAL_IMPORT)


def startTableIngestion(
    request_id: str, params: Dict[str, Any], allow_overwrite: bool = False
) -> Dict[str, Any]:
  """Creates a table asset import task.

  Args:
    request_id (string): A unique ID for the ingestion, from newTaskId.
      If you are using the Cloud API, this does not need to be from newTaskId,
      (though that's a good idea, as it's a good source of unique strings).
      It can also be empty, but in that case the request is more likely to
      fail as it cannot be safely retried.
    params: The object that describes the import task, which can
        have these fields:
          name (string) The destination asset id (e.g.,
             "projects/myproject/assets/foo/bar").
          sources (array) A list of GCS (Google Cloud Storage) file paths
            with optional character encoding formatted like this:
            "sources":[{"uris":["gs://bucket/file.shp"],"charset":"UTF-8"}]
            Here 'charset' refers to the character encoding of the source file.
        In general, this is a dict representation of a TableManifest.
    allow_overwrite: Whether the ingested image can overwrite an
        existing version.
  Returns:
    A dict with notes about the created task. This will include the ID for the
    import task (under 'id'), which may be different from request_id.
  """
  request = {
      'tableManifest':
          _cloud_api_utils.convert_params_to_table_manifest(params),
      'requestId':
          request_id,
      'overwrite':
          allow_overwrite
  }
  # It's only safe to retry the request if there's a unique ID to make it
  # idempotent.
  num_retries = _max_retries if request_id else 0
  operation = _execute_cloud_call(
      _get_cloud_projects()
      .table()
      .import_(project=_get_projects_path(), body=request),
      num_retries=num_retries,
  )
  return {
      'id':
          _cloud_api_utils.convert_operation_name_to_task_id(
              operation['name']),
      'name': operation['name'],
      'started': 'OK'
  }


def getAssetRoots() -> Any:
  """Returns a list of top-level assets and folders for the current project.

  Note: The "id" values for Cloud Projects are
        "projects/my-project/assets/my-asset", where legacy assets (if the
        current project is set to "earthengine-legacy") are "users/my-username",
        not "users/my-username/my-asset".

  Returns:
    The list of top-level assets and folders like:
      [
          {"id": "users/foo", "type": "Folder", ...},
          {"id": "projects/bar", "type": "Folder", ...},
      ]
  """
  return _cloud_api_utils.convert_list_assets_result_to_get_list_result(
      listBuckets())


def getAssetRootQuota(rootId: str) -> Dict[str, Any]:
  """Returns quota usage details for the asset root with the given ID.

  Usage notes:

    - The id *must* be a root folder like "users/foo" (not "users/foo/bar").
    - The authenticated user must own the asset root to see its quota usage.

  Args:
    rootId: The ID of the asset to check.

  Returns:
    A dict describing the asset's quota usage. Looks like, with size in bytes:
      {
          asset_count: {usage: number, limit: number},
          asset_size: {usage: number, limit: number},
      }
  """
  asset = getAsset(rootId)
  if 'quota' not in asset:
    raise ee_exception.EEException('{} is not a root folder.'.format(rootId))
  quota = asset['quota']
  # The quota fields are int64s, and int64s are represented as strings in
  # JSON. Turn them back.
  return {
      'asset_count': {
          'usage': int(quota.get('assetCount', 0)),
          'limit': int(quota.get('maxAssets', quota.get('maxAssetCount', 0)))
      },
      'asset_size': {
          'usage': int(quota.get('sizeBytes', 0)),
          'limit': int(quota.get('maxSizeBytes', 0))
      }
  }


@deprecation.Deprecated('Use getIamPolicy')
def getAssetAcl(assetId: str) -> Any:
  """Returns the access control list of the asset with the given ID.

  Args:
    assetId: The ID of the asset to check.

  Returns:
    A dict describing the asset's ACL. Looks like:
      {
         "owners" : ["user@domain1.com"],
         "writers": ["user2@domain1.com", "user3@domain1.com"],
         "readers": ["some_group@domain2.com"],
         "all_users_can_read" : True
      }
    If you are using the cloud API, then the entities in the ACL will
    be prefixed by a type tag, such as "user:" or "group:".
  """
  policy = getIamPolicy(assetId)
  return _cloud_api_utils.convert_iam_policy_to_acl(policy)


def getIamPolicy(asset_id: str) -> Any:
  """Loads ACL info for an asset, given an asset id.

  Args:
    asset_id: The asset to be retrieved.

  Returns:
    The asset's ACL, as an IAM Policy.
  """
  name = _cloud_api_utils.convert_asset_id_to_asset_name(asset_id)
  return _execute_cloud_call(
      _get_cloud_projects()
      .assets()
      .getIamPolicy(resource=name, body={}, prettyPrint=False)
  )


@deprecation.Deprecated('Use setIamPolicy')
def setAssetAcl(assetId: str, aclUpdate: Union[str, Dict[str, Any]]) -> None:
  """Sets the access control list of the asset with the given ID.

  The owner ACL cannot be changed, and the final ACL of the asset
  is constructed by merging the OWNER entries of the old ACL with
  the incoming ACL record.

  Args:
    assetId: The ID of the asset to set the ACL on.
    aclUpdate: The updated ACL.
  """
  # The ACL may be a string by the time it gets to us. Sigh.
  if isinstance(aclUpdate, str):
    aclUpdate = json.loads(aclUpdate)
  setIamPolicy(assetId, _cloud_api_utils.convert_acl_to_iam_policy(aclUpdate))


def setIamPolicy(asset_id: str, policy: Any) -> None:
  """Sets ACL info for an asset.

  Args:
    asset_id: The asset to set the ACL policy on.
    policy: The new Policy to apply to the asset. This replaces
      the current Policy.

  Returns:
    The new ACL, as an IAM Policy.
  """
  name = _cloud_api_utils.convert_asset_id_to_asset_name(asset_id)
  return _execute_cloud_call(
      _get_cloud_projects()
      .assets()
      .setIamPolicy(resource=name, body={'policy': policy}, prettyPrint=False)
  )

@deprecation.Deprecated('Use ee.data.updateAsset().')
def setAssetProperties(assetId: str, properties: Dict[str, Any]) -> None:
  """Sets metadata properties of the asset with the given ID.

  To delete a property, set its value to None.
  The authenticated user must be a writer or owner of the asset.

  Args:
    assetId: The ID of the asset to set the ACL on.
    properties: A dictionary of keys and values for the properties to update.
  """
  def FieldMaskPathForKey(key):
    return 'properties.\"%s\"' % key
  # Specifying an update mask of 'properties' results in full replacement,
  # which isn't what we want. Instead, we name each property that we'll be
  # updating.
  update_mask = [FieldMaskPathForKey(key) for key in properties]
  updateAsset(assetId, {'properties': properties}, update_mask)


def updateAsset(asset_id: str, asset: Any, update_mask: Sequence[str]) -> None:
  """Updates an asset.

  Args:
    asset_id: The ID of the asset to update.
    asset: The updated version of the asset, containing only the new values of
      the fields to be updated. Only the "start_time", "end_time", and
      "properties" fields can be updated. If a value is named in "update_mask",
      but is unset in "asset", then that value will be deleted from the asset.
    update_mask: A list of the values to update. This should contain the strings
      "start_time" or "end_time" to update the corresponding timestamp. If
      a property is to be updated or deleted, it should be named here as
      "properties.THAT_PROPERTY_NAME". If the entire property set is to be
      replaced, this should contain the string "properties". If this list is
      empty, all properties and both timestamps will be updated.
  """
  name = _cloud_api_utils.convert_asset_id_to_asset_name(asset_id)
  _execute_cloud_call(
      _get_cloud_projects()
      .assets()
      .patch(
          name=name, body={'updateMask': {'paths': update_mask}, 'asset': asset}
      )
  )


def createAssetHome(requestedId: str) -> None:
  """Attempts to create a home root folder for the current user ("users/joe").

  Results in an error if the user already has a home root folder or the
  requested ID is unavailable.

  Args:
    requestedId: The requested ID of the home folder (e.g., "users/joe").
  """
  # This is just a special case of folder creation.
  createAsset({
      'name': _cloud_api_utils.convert_asset_id_to_asset_name(requestedId),
      'type': 'FOLDER'
  })


def _get_config_path() -> str:
  return f'{_get_projects_path()}/config'


def getProjectConfig() -> Dict[str, Any]:
  """Gets the project config for the current project.

  Returns:
    The project config as a dictionary.
  """
  return _execute_cloud_call(
      _get_cloud_projects().getConfig(name=_get_config_path())
  )


def updateProjectConfig(
    project_config: Dict[str, Any], update_mask: Optional[Sequence[str]] = None
) -> Dict[str, Any]:
  """Updates the project config for the current project.

  Args:
    project_config: The new project config as a dictionary.
    update_mask: A list of the values to update. The only supported values right
      now are: "max_concurrent_exports". If the list is empty or None, all
      values will be updated.

  Returns:
    The updated project config as a dictionary.
  """
  if not update_mask:
    update_mask = ['max_concurrent_exports']

  update_mask = ','.join(update_mask)
  if update_mask != 'max_concurrent_exports':
    raise ValueError('Only "max_concurrent_exports" is supported right now.')

  config = _get_config_path()
  return _execute_cloud_call(
      _get_cloud_projects().updateConfig(
          name=config, body=project_config, updateMask=update_mask
      )
  )


def authorizeHttp(http: Any) -> Any:
  if _credentials:
    return google_auth_httplib2.AuthorizedHttp(_credentials)
  else:
    return http


def create_assets(
    asset_ids: Sequence[str], asset_type: str, mk_parents: bool
) -> None:
  """Creates the specified assets if they do not exist."""
  for asset_id in asset_ids:
    if getInfo(asset_id):
      print('Asset %s already exists.' % asset_id)
      continue
    if mk_parents:
      parts = asset_id.split('/')
      # We don't need to create the namespace and the user's/project's folder.
      if len(parts) > 2:
        path = parts[0] + '/' + parts[1] + '/'
        for part in parts[2:-1]:
          path += part
          if getInfo(path) is None:
            createAsset({'type': ASSET_TYPE_FOLDER_CLOUD}, path)
          path += '/'
    createAsset({'type': asset_type}, asset_id)


def convert_asset_id_to_asset_name(asset_id: str) -> str:
  """Converts an internal asset ID to a Cloud API asset name.

  If asset_id already matches the format 'projects/*/assets/**', it is returned
  as-is.

  Args:
    asset_id: The asset ID to convert.

  Returns:
    An asset name string in the format 'projects/*/assets/**'.
  """
  return _cloud_api_utils.convert_asset_id_to_asset_name(asset_id)


def getWorkloadTag() -> Optional[Union[int, str]]:
  """Returns the currently set workload tag."""
  return _workloadTag.get()


def setWorkloadTag(tag: Optional[Union[int, str]]) -> None:
  """Sets the workload tag, used to label computation and exports.

  Workload tag must be 1 - 63 characters, beginning and ending with an
  alphanumeric character ([a-z0-9A-Z]) with dashes (-), underscores (_), dots
  (.), and alphanumerics between, or an empty string to clear the workload tag.

  Args:
    tag: The tag to set.
  """
  _workloadTag.set(tag)


@contextlib.contextmanager
def workloadTagContext(tag: Optional[Union[int, str]]) -> Iterator[None]:
  """Produces a context manager which sets the workload tag, then resets it.

  Workload tag must be 1 - 63 characters, beginning and ending with an
  alphanumeric character ([a-z0-9A-Z]) with dashes (-), underscores (_), dots
  (.), and alphanumerics between, or an empty string to clear the workload tag.

  Args:
    tag: The tag to set.

  Yields:
    None.
  """
  setWorkloadTag(tag)
  try:
    yield
  finally:
    resetWorkloadTag()


def setDefaultWorkloadTag(tag: Optional[Union[int, str]]) -> None:
  """Sets the workload tag, and as the default for which to reset back to.

  For example, calling `ee.data.resetWorkloadTag()` will reset the workload tag
  back to the default chosen here. To reset the default back to none, pass in
  an empty string or pass in true to `ee.data.resetWorkloadTag(true)`, like so.

  Workload tag must be 1 - 63 characters, beginning and ending with an
  alphanumeric character ([a-z0-9A-Z]) with dashes (-), underscores (_), dots
  (.), and alphanumerics between, or an empty string to reset the default back
  to none.

  Args:
    tag: The tag to set.
  """
  _workloadTag.setDefault(tag)
  _workloadTag.set(tag)


@_utils.accept_opt_prefix('opt_resetDefault')
def resetWorkloadTag(resetDefault: bool = False) -> None:
  """Sets the default tag for which to reset back to.

  If resetDefault parameter is set to true, the default will be set to empty
  before resetting. Defaults to False.

  Args:
    resetDefault: Whether to reset the default back to empty.
  """
  if resetDefault:
    _workloadTag.setDefault('')
  _workloadTag.reset()


# TODO(user): Consider only returning str even for ints.
class _WorkloadTag:
  """A helper class to manage the workload tag."""
  _tag: Optional[Union[int, str]]
  _default: Optional[Union[int, str]]

  def __init__(self):
    # TODO(user): Consider using None as default and setting them above.
    self._tag = ''
    self._default = ''

  def get(self) -> Union[int, str, None]:
    return self._tag

  def set(self, tag: Optional[Union[int, str]]) -> None:
    self._tag = self.validate(tag)

  def setDefault(self, newDefault: Optional[Union[int, str]]) -> None:
    self._default = self.validate(newDefault)

  def reset(self) -> None:
    self._tag = self._default

  def validate(self, tag: Optional[Union[int, str]]) -> str:
    """Throws an error if setting an invalid tag.

    Args:
      tag: the tag to validate.

    Returns:
      The validated tag.

    Raises:
      ValueError if the tag does not match the expected format.
    """
    if not tag and tag != 0:
      return ''
    tag = str(tag)
    if not re.fullmatch(r'([a-z0-9]|[a-z0-9][-_a-z0-9]{0,61}[a-z0-9])', tag):
      validationMessage = (
          'Tags must be 1-63 characters, '
          'beginning and ending with a lowercase alphanumeric character '
          '([a-z0-9]) with dashes (-), underscores (_), '
          'and lowercase alphanumerics between.')
      raise ValueError(f'Invalid tag, "{tag}". {validationMessage}')
    return tag


# Tracks the currently set workload tag.
_workloadTag = _WorkloadTag()
