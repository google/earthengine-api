#!/usr/bin/env python
"""Singleton for the library's communication with the Earth Engine API."""

from __future__ import print_function



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

# pylint: disable=g-bad-import-order
import contextlib
import json
import platform
import re
import threading
import uuid

import six
from google_auth_httplib2 import AuthorizedHttp

from . import __version__
from . import _cloud_api_utils
from . import deprecation
from . import encodable
from . import oauth
from . import serializer
import googleapiclient

from . import ee_exception

from google.oauth2.credentials import Credentials

# OAuth2 credentials object.  This may be set by ee.Initialize().
_credentials = None

# The base URL for all data calls.  This is set by ee.Initialize().
_api_base_url = None

# The base URL for map tiles.  This is set by ee.Initialize().
_tile_base_url = None

# The base URL for all Cloud API calls.  This is set by ee.Initialize().
_cloud_api_base_url = None

# Google Cloud API key.  This may be set by ee.Initialize().
_cloud_api_key = None

# A resource object for making Cloud API calls.
_cloud_api_resource = None

# A resource object for making Cloud API calls and receiving raw return types.
_cloud_api_resource_raw = None

# The default user project to use when making Cloud API calls.
_cloud_api_user_project = None

# The API client version number to send when making requests.
_cloud_api_client_version = None

# The http_transport to use.
_http_transport = None

# Whether the module has been initialized.
_initialized = False

# Sets the number of milliseconds to wait for a request before considering
# it timed out. 0 means no limit.
_deadline_ms = 0


class _ThreadLocals(threading.local):

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
    self.profile_hook = None


_thread_locals = _ThreadLocals()

# The HTTP header through which profile results are returned.
# Lowercase because that's how httplib2 does things.
_PROFILE_RESPONSE_HEADER_LOWERCASE = 'x-earth-engine-computation-profile'

# The HTTP header through which profiling is requested when using the Cloud API.
_PROFILE_REQUEST_HEADER = 'X-Earth-Engine-Computation-Profile'

# The HTTP header through which a user project override is provided.
_USER_PROJECT_OVERRIDE_HEADER = 'X-Goog-User-Project'

# The HTTP header used to indicate the version of the client library used.
_API_CLIENT_VERSION_HEADER = 'X-Goog-Api-Client'

# Maximum number of times to retry a rate-limited request.
MAX_RETRIES = 5

# Maximum time to wait before retrying a rate-limited request (in milliseconds).
MAX_RETRY_WAIT = 120000

# Base time (in ms) to wait when performing exponential backoff in request
# retries.
BASE_RETRY_WAIT = 1000

# The default base URL for API calls.
DEFAULT_API_BASE_URL = 'https://earthengine.googleapis.com/api'

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


def initialize(credentials=None,
               api_base_url=None,
               tile_base_url=None,
               cloud_api_base_url=None,
               cloud_api_key=None,
               project=None,
               http_transport=None):
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
    project: The default cloud project associated with the user.
    http_transport: The http transport to use
  """
  global _api_base_url, _tile_base_url, _credentials, _initialized
  global _cloud_api_base_url
  global _cloud_api_resource, _cloud_api_resource_raw, _cloud_api_key
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

  _install_cloud_api_resource()

  if project is not None:
    _cloud_api_user_project = project
    _cloud_api_utils.set_cloud_api_user_project(project)
  else:
    _cloud_api_utils.set_cloud_api_user_project(DEFAULT_CLOUD_API_USER_PROJECT)

  _initialized = True


def get_persistent_credentials():
  """Read persistent credentials from ~/.config/earthengine.

  Raises EEException with helpful explanation if credentials don't exist.

  Returns:
    OAuth2Credentials built from persistently stored refresh_token
  """
  try:
    tokens = json.load(open(oauth.get_credentials_path()))
    refresh_token = tokens['refresh_token']
    return Credentials(
        None,
        refresh_token=refresh_token,
        token_uri=oauth.TOKEN_URI,
        client_id=oauth.CLIENT_ID,
        client_secret=oauth.CLIENT_SECRET,
        scopes=oauth.SCOPES)
  except IOError:
    raise ee_exception.EEException(
        'Please authorize access to your Earth Engine account by '
        'running\n\nearthengine authenticate\n\nin your command line, and then '
        'retry.')


def reset():
  """Resets the data module, clearing credentials and custom base URLs."""
  global _api_base_url, _tile_base_url, _credentials, _initialized
  global _cloud_api_base_url
  global _cloud_api_resource, _cloud_api_resource_raw
  global _cloud_api_key, _http_transport
  _credentials = None
  _api_base_url = None
  _tile_base_url = None
  _cloud_api_base_url = None
  _cloud_api_key = None
  _cloud_api_resource = None
  _cloud_api_resource_raw = None
  _http_transport = None
  _initialized = False


def _get_projects_path():
  """Returns the projects path to use for constructing a request."""
  if _cloud_api_user_project is not None:
    return 'projects/' + _cloud_api_user_project
  else:
    return 'projects/' + DEFAULT_CLOUD_API_USER_PROJECT


def _install_cloud_api_resource():
  """Builds or rebuilds the Cloud API resource object, if needed."""
  global _cloud_api_resource, _cloud_api_resource_raw
  global _http_transport

  timeout = (_deadline_ms / 1000.0) or None
  _cloud_api_resource = _cloud_api_utils.build_cloud_resource(
      _cloud_api_base_url,
      credentials=_credentials,
      api_key=_cloud_api_key,
      timeout=timeout,
      headers_supplier=_make_request_headers,
      response_inspector=_handle_profiling_response,
      http_transport=_http_transport)

  _cloud_api_resource_raw = _cloud_api_utils.build_cloud_resource(
      _cloud_api_base_url,
      credentials=_credentials,
      api_key=_cloud_api_key,
      timeout=timeout,
      headers_supplier=_make_request_headers,
      response_inspector=_handle_profiling_response,
      http_transport=_http_transport,
      raw=True)


def _get_cloud_api_resource():
  if _cloud_api_resource is None:
    raise ee_exception.EEException(
        'Earth Engine client library not initialized. Run `ee.Initialize()`')
  return _cloud_api_resource


def _make_request_headers():
  """Adds headers based on client context."""
  headers = {}
  client_version_header_values = []
  if _cloud_api_client_version is not None:
    client_version_header_values.append('ee-py/' + _cloud_api_client_version)
  client_version_header_values.append('python/' + platform.python_version())
  headers[_API_CLIENT_VERSION_HEADER] = ' '.join(client_version_header_values)
  if _thread_locals.profile_hook:
    headers[_PROFILE_REQUEST_HEADER] = '1'
  if _cloud_api_user_project is not None:
    headers[_USER_PROJECT_OVERRIDE_HEADER] = _cloud_api_user_project
  if headers:
    return headers
  return None


def _handle_profiling_response(response):
  """Handles profiling annotations on Cloud API responses."""
  # Call the profile hook if present. Note that this is done before we handle
  # the content, so that profiles are reported even if the response is an error.
  if (_thread_locals.profile_hook and
      _PROFILE_RESPONSE_HEADER_LOWERCASE in response):
    _thread_locals.profile_hook(response[_PROFILE_RESPONSE_HEADER_LOWERCASE])


def _execute_cloud_call(call, num_retries=MAX_RETRIES):
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
  try:
    return call.execute(num_retries=num_retries)
  except googleapiclient.errors.HttpError as e:
    raise _translate_cloud_exception(e)


def _translate_cloud_exception(http_error):
  """Translates a Cloud API exception into an EEException.

  Args:
    http_error: A googleapiclient.errors.HttpError.

  Returns:
    An EEException bearing the error message from http_error.
  """
  # The only sane way to get a message out of an HttpError is to use a protected
  # method.
  return ee_exception.EEException(http_error._get_reason())  # pylint: disable=protected-access


def setCloudApiKey(cloud_api_key):
  """Sets the Cloud API key parameter ("api_key") for all requests."""
  global _cloud_api_key
  _cloud_api_key = cloud_api_key
  _install_cloud_api_resource()


def setCloudApiUserProject(cloud_api_user_project):
  global _cloud_api_user_project
  _cloud_api_user_project = cloud_api_user_project
  _cloud_api_utils.set_cloud_api_user_project(_cloud_api_user_project)


def setDeadline(milliseconds):
  """Sets the timeout length for API requests.

  Args:
    milliseconds: The number of milliseconds to wait for a request
        before considering it timed out. 0 means no limit.
  """
  global _deadline_ms
  _deadline_ms = milliseconds
  _install_cloud_api_resource()


@contextlib.contextmanager
def profiling(hook):
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
def getInfo(asset_id):
  """Load info for an asset, given an asset id.

  Args:
    asset_id: The asset to be retrieved.

  Returns:
    The value call results, or None if the asset does not exist.
  """
  # Don't use getAsset as it will translate the exception, and we need
  # to handle 404s specially.
  try:
    return _get_cloud_api_resource().projects().assets().get(
        name=_cloud_api_utils.convert_asset_id_to_asset_name(asset_id),
        prettyPrint=False).execute(num_retries=MAX_RETRIES)
  except googleapiclient.errors.HttpError as e:
    if e.resp.status == 404:
      return None
    else:
      raise _translate_cloud_exception(e)


def getAsset(asset_id):
  """Loads info for an asset, given an asset id.

  Args:
    asset_id: The asset to be retrieved.

  Returns:
    The asset's information, as an EarthEngineAsset.
  """
  return _execute_cloud_call(_get_cloud_api_resource().projects().assets().get(
      name=_cloud_api_utils.convert_asset_id_to_asset_name(asset_id),
      prettyPrint=False))


@deprecation.Deprecated('Use listAssets or listImages')
def getList(params):
  """Get a list of contents for a collection asset.

  Args:
    params: An object containing request parameters with the
        following possible values:
            id (string) The asset id of the collection to list.
            starttime (number) Start time, in msec since the epoch.
            endtime (number) End time, in msec since the epoch.
            fields (comma-separated strings) Field names to return.

  Returns:
    The list call results.
  """
  # Translate the parameter list to use listAssets or listImages. If it
  # doesn't specify anything other than the ID and "num", use listAssets.
  # Otherwise, use listImages.
  if six.viewkeys(params) - set(['id', 'num']):
    result = listImages(
        _cloud_api_utils.convert_get_list_params_to_list_images_params(
            params))
    result = _cloud_api_utils.convert_list_images_result_to_get_list_result(
        result)
  else:
    result = listAssets(
        _cloud_api_utils.convert_get_list_params_to_list_assets_params(
            params))
    result = _cloud_api_utils.convert_list_assets_result_to_get_list_result(
        result)

  return result


def listImages(params):
  """Returns the images in an image collection or folder."""
  images = {'images': []}
  request = _get_cloud_api_resource().projects().assets().listImages(**params)
  while request is not None:
    response = _execute_cloud_call(request)
    images['images'].extend(response.get('images', []))
    request = _cloud_api_resource.projects().assets().listImages_next(
        request, response)
    # We currently treat pageSize as a cap on the results, if this param was
    # provided we should break fast and not return more than the asked for
    # amount.
    if 'pageSize' in params:
      break
  return images


def listAssets(params):
  """Returns the assets in a folder."""
  assets = {'assets': []}
  if 'parent' in params and _cloud_api_utils.is_asset_root(params['parent']):
    # If the asset name is 'projects/my-project/assets' we assume a user
    # wants to list their cloud assets, to do this we call the alternative
    # listAssets method and remove the trailing '/assets/?'
    params['parent'] = re.sub('/assets/?$', '', params['parent'])
    cloud_resource_root = _get_cloud_api_resource().projects()
  else:
    cloud_resource_root = _get_cloud_api_resource().projects().assets()
  request = cloud_resource_root.listAssets(**params)
  while request is not None:
    response = _execute_cloud_call(request)
    assets['assets'].extend(response.get('assets', []))
    request = cloud_resource_root.listAssets_next(request, response)
    # We currently treat pageSize as a cap on the results, if this param was
    # provided we should break fast and not return more than the asked for
    # amount.
    if 'pageSize' in params:
      break
  return assets


def listBuckets(project=None):
  if project is None:
    project = _get_projects_path()
  return _execute_cloud_call(
      _get_cloud_api_resource().projects().listAssets(parent=project))


def getMapId(params):
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
  if isinstance(params['image'], six.string_types):
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
  # Make it return only the name field, as otherwise it echoes the entire
  # request, which might be large.
  result = _execute_cloud_call(
      _get_cloud_api_resource().projects().maps().create(
          parent=_get_projects_path(), fields='name', body=request))
  map_name = result['name']
  url_format = '%s/%s/%s/tiles/{z}/{x}/{y}' % (
      _tile_base_url, _cloud_api_utils.VERSION, map_name)
  if _cloud_api_key:
    url_format += '?key=%s' % _cloud_api_key

  return {'mapid': map_name, 'token': '',
          'tile_fetcher': TileFetcher(url_format, map_name=map_name)}


def getTileUrl(mapid, x, y, z):
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


class TileFetcher(object):
  """A helper class to fetch image tiles."""

  def __init__(self, url_format, map_name=None):
    self._url_format = url_format
    self._map_name = map_name

  @property
  def url_format(self):
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

  def format_tile_url(self, x, y, z):
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

  def fetch_tile(self, x, y, z):
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
        _cloud_api_resource_raw.projects().maps().tiles().get(
            parent=self._map_name, x=x, y=y, zoom=z,
        ), num_retries=MAX_RETRIES
    )


def computeValue(obj):
  """Sends a request to compute a value.

  Args:
    obj: A ComputedObject whose value is desired.

  Returns:
    The result of evaluating that object on the server.
  """
  return _execute_cloud_call(
      _get_cloud_api_resource().projects().value().compute(
          body={'expression': serializer.encode(obj, for_cloud_api=True)},
          project=_get_projects_path(),
          prettyPrint=False))['result']


@deprecation.Deprecated('Use getThumbId and makeThumbUrl')
def getThumbnail(params, thumbType=None):
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
        _cloud_api_resource_raw.projects().videoThumbnails().getPixels(
            name=thumbid
        ), num_retries=MAX_RETRIES
    )
  elif thumbType == 'filmstrip':
    return _execute_cloud_call(
        _cloud_api_resource_raw.projects().filmstripThumbnails().getPixels(
            name=thumbid
        ), num_retries=MAX_RETRIES
    )
  else:
    return _execute_cloud_call(
        _cloud_api_resource_raw.projects().thumbnails().getPixels(
            name=thumbid
        ), num_retries=MAX_RETRIES
    )


def getThumbId(params, thumbType=None):
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
  if isinstance(params['image'], six.string_types):
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
  # Make it return only the name field, as otherwise it echoes the entire
  # request, which might be large.
  if thumbType == 'video':
    if 'framesPerSecond' in params:
      request['videoOptions'] = {
          'framesPerSecond': params.get('framesPerSecond')
      }
    result = _execute_cloud_call(
        _get_cloud_api_resource().projects().videoThumbnails().create(
            parent=_get_projects_path(), fields='name', body=request))
  elif thumbType == 'filmstrip':
    # Currently only 'VERTICAL' thumbnails are supported.
    request['orientation'] = 'VERTICAL'
    result = _execute_cloud_call(
        _get_cloud_api_resource().projects().filmstripThumbnails().create(
            parent=_get_projects_path(), fields='name', body=request))
  else:
    request['filenamePrefix'] = params.get('name')
    request['bandIds'] = _cloud_api_utils.convert_to_band_list(
        params.get('bands'))
    result = _execute_cloud_call(
        _get_cloud_api_resource().projects().thumbnails().create(
            parent=_get_projects_path(), fields='name', body=request))
  return {'thumbid': result['name'], 'token': ''}


def makeThumbUrl(thumbId):
  """Create a thumbnail URL from the given thumbid and token.

  Args:
    thumbId: An object containing a thumbnail thumbid and token.

  Returns:
    A URL from which the thumbnail can be obtained.
  """
  url = '%s/%s/%s:getPixels' % (_tile_base_url, _cloud_api_utils.VERSION,
                                thumbId['thumbid'])
  if _cloud_api_key:
    url += '?key=%s' % _cloud_api_key
  return url


def getDownloadId(params):
  """Get a Download ID.

  Args:
    params: An object containing visualization options with the following
      possible values:
        image - The image to download.
        name - a base name to use when constructing filenames.
        bands - a description of the bands to download. Must be an array of
            dictionaries, each with the following keys:
          id - the name of the band, a string, required.
          crs - an optional CRS string defining the band projection.
          crs_transform - an optional array of 6 numbers specifying an affine
              transform from the specified CRS, in the order: xScale,
              yShearing, xShearing, yScale, xTranslation and yTranslation.
          dimensions - an optional array of two integers defining the width and
              height to which the band is cropped.
          scale - an optional number, specifying the scale in meters of the
                 band; ignored if crs and crs_transform is specified.
        crs - a default CRS string to use for any bands that do not explicitly
            specify one.
        crs_transform - a default affine transform to use for any bands that do
            not specify one, of the same format as the crs_transform of bands.
        dimensions - default image cropping dimensions to use for any bands
            that do not specify them.
        scale - a default scale to use for any bands that do not specify one;
            ignored if crs and crs_transform is specified.
        region - a polygon specifying a region to download; ignored if crs
            and crs_transform is specified.
        filePerBand - whether to produce a different GeoTIFF per band (boolean).
            Defaults to true. If false, a single GeoTIFF is produced and all
            band-level transformations will be ignored.

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
                                   '(e.g. ee.Image(id)) and use '
                                   'ee.Image.getDownloadURL instead.')
  if 'image' not in params:
    raise ee_exception.EEException('Missing image parameter.')
  if isinstance(params['image'], six.string_types):
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
    if isinstance(bands, six.string_types):
      bands = _cloud_api_utils.convert_to_band_list(bands)
    if not isinstance(bands, list):
      raise ee_exception.EEException('Bands parameter must be a list.')
    if all(isinstance(band, six.string_types) for band in bands):
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
  result = _execute_cloud_call(
      _get_cloud_api_resource().projects().thumbnails().create(
          parent=_get_projects_path(), fields='name', body=request))
  return {'docid': result['name'], 'token': ''}


def makeDownloadUrl(downloadId):
  """Create a download URL from the given docid and token.

  Args:
    downloadId: An object containing a download docid and token.

  Returns:
    A URL from which the download can be obtained.
  """
  return '%s/%s/%s:getPixels' % (_tile_base_url, _cloud_api_utils.VERSION,
                                 downloadId['docid'])


def getTableDownloadId(params):
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
    if isinstance(selectors, six.string_types):
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
  result = _execute_cloud_call(
      _get_cloud_api_resource().projects().tables().create(
          parent=_get_projects_path(), fields='name', body=request))
  return {'docid': result['name'], 'token': ''}


def makeTableDownloadUrl(downloadId):
  """Create a table download URL from a docid and token.

  Args:
    downloadId: A table download id and token.

  Returns:
    A Url from which the download can be obtained.
  """
  return '%s/%s/%s:getFeatures' % (
      _tile_base_url, _cloud_api_utils.VERSION, downloadId['docid'])


def getAlgorithms():
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
    call = _get_cloud_api_resource().projects().algorithms().list(
        parent=_get_projects_path(), prettyPrint=False)
  except TypeError:
    call = _get_cloud_api_resource().projects().algorithms().list(
        project=_get_projects_path(), prettyPrint=False)
  return _cloud_api_utils.convert_algorithms(_execute_cloud_call(call))


def createAsset(
    value,
    opt_path=None,
    opt_properties=None):
  """Creates an asset from a JSON value.

  To create an empty image collection or folder, pass in a "value" object
  with a "type" key whose value is "ImageCollection" or "Folder".
  If you are using the Cloud API, use "IMAGE_COLLECTION" or "FOLDER".

  Args:
    value: An object describing the asset to create or a JSON string
        with the already-serialized value for the new asset.
    opt_path: An optional desired ID, including full path.
    opt_properties: The keys and values of the properties to set
        on the created asset.

  Returns:
    A description of the saved asset, including a generated ID.
  """
  if not isinstance(value, dict):
    raise ee_exception.EEException('Asset cannot be specified as string.')
  asset = value.copy()
  if 'name' not in asset:
    if not opt_path:
      raise ee_exception.EEException(
          'Either asset name or opt_path must be specified.')
    asset['name'] = _cloud_api_utils.convert_asset_id_to_asset_name(opt_path)
  if 'properties' not in asset and opt_properties:
    asset['properties'] = opt_properties
  asset['type'] = _cloud_api_utils.convert_asset_type_for_create_asset(
      asset['type'])
  parent, asset_id = _cloud_api_utils.split_asset_name(asset.pop('name'))
  return _execute_cloud_call(
      _get_cloud_api_resource().projects().assets().create(
          parent=parent,
          assetId=asset_id,
          body=asset,
          prettyPrint=False))


def copyAsset(sourceId, destinationId, allowOverwrite=False
             ):
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
  _execute_cloud_call(_get_cloud_api_resource().projects().assets().copy(
      sourceName=_cloud_api_utils.convert_asset_id_to_asset_name(sourceId),
      body=request))

  return


def renameAsset(sourceId, destinationId):
  """Renames the asset from sourceId to destinationId.

  Args:
    sourceId: The ID of the asset to rename.
    destinationId: The new ID of the asset.
  """
  _execute_cloud_call(_get_cloud_api_resource().projects().assets().move(
      sourceName=_cloud_api_utils.convert_asset_id_to_asset_name(sourceId),
      body={
          'destinationName':
              _cloud_api_utils.convert_asset_id_to_asset_name(destinationId)
      }))
  return


def deleteAsset(assetId):
  """Deletes the asset with the given id.

  Args:
    assetId: The ID of the asset to delete.
  """
  _execute_cloud_call(_get_cloud_api_resource().projects().assets().delete(
      name=_cloud_api_utils.convert_asset_id_to_asset_name(assetId)))
  return


def newTaskId(count=1):
  """Generate an ID for a long-running task.

  Args:
    count: Optional count of IDs to generate, one by default.

  Returns:
    A list containing generated ID strings.
  """
  return [str(uuid.uuid4()) for _ in six.moves.xrange(count)]


@deprecation.Deprecated('Use listOperations')
def getTaskList():
  """Retrieves a list of the user's tasks.

  Returns:
    A list of task status dictionaries, one for each task submitted to EE by
    the current user. These include currently running tasks as well as recently
    canceled or failed tasks.
  """
  return [_cloud_api_utils.convert_operation_to_task(o)
          for o in listOperations()]


def listOperations(project=None):
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
  request = _get_cloud_api_resource().projects().operations().list(
      pageSize=_TASKLIST_PAGE_SIZE, name=project)
  while request is not None:
    try:
      response = request.execute(num_retries=MAX_RETRIES)
      operations += response.get('operations', [])
      request = _cloud_api_resource.projects().operations().list_next(
          request, response)
    except googleapiclient.errors.HttpError as e:
      raise _translate_cloud_exception(e)
  return operations


@deprecation.Deprecated('Use getOperation')
def getTaskStatus(taskId):
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
  if isinstance(taskId, six.string_types):
    taskId = [taskId]
  result = []
  for one_id in taskId:
    try:
      # Don't use getOperation as it will translate the exception, and we need
      # to handle 404s specially.
      operation = _get_cloud_api_resource().projects().operations().get(
          name=_cloud_api_utils.convert_task_id_to_operation_name(
              one_id)).execute(num_retries=MAX_RETRIES)
      result.append(_cloud_api_utils.convert_operation_to_task(operation))
    except googleapiclient.errors.HttpError as e:
      if e.resp.status == 404:
        result.append({'id': one_id, 'state': 'UNKNOWN'})
      else:
        raise _translate_cloud_exception(e)
  return result


def getOperation(operation_name):
  """Retrieves the status of a long-running operation.

  Args:
    operation_name: The name of the operation to retrieve, in the format
      operations/AAAABBBBCCCCDDDDEEEEFFFF.

  Returns:
    An Operation status dictionary for the requested operation.
  """
  return _execute_cloud_call(
      _get_cloud_api_resource().projects().operations().get(
          name=operation_name))


@deprecation.Deprecated('Use cancelOperation')
def cancelTask(taskId):
  """Cancels a batch task."""
  cancelOperation(_cloud_api_utils.convert_task_id_to_operation_name(taskId))
  return


def cancelOperation(operation_name):
  _execute_cloud_call(_get_cloud_api_resource().projects().operations().cancel(
      name=operation_name, body={}))


def exportImage(request_id, params):
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
      request_id, params,
      _get_cloud_api_resource().projects().image().export)


def exportTable(request_id, params):
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
      request_id, params,
      _get_cloud_api_resource().projects().table().export)


def exportVideo(request_id, params):
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
      request_id, params,
      _get_cloud_api_resource().projects().video().export)


def exportMap(request_id, params):
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
      request_id, params,
      _get_cloud_api_resource().projects().map().export)




def _prepare_and_run_export(request_id, params, export_endpoint):
  """Starts an export task running.

  Args:
    request_id (string): An optional unique ID for the task.
    params: The object that describes the export task.
      The "expression" parameter can be the actual object
      to be exported, not its serialized form. This may be modified.
    export_endpoint: A callable representing the export endpoint
      to invoke (e.g., _cloud_api_resource.image().export).

  Returns:
    An Operation with information about the created task.
  """
  if request_id:
    if isinstance(request_id, six.string_types):
      params['requestId'] = request_id
    # If someone passes request_id via newTaskId() (which returns a list)
    # try to do the right thing and use the first entry as a request ID.
    elif (isinstance(request_id, list)
          and len(request_id) == 1
          and isinstance(request_id[0], six.string_types)):
      params['requestId'] = request_id[0]
    else:
      raise ValueError('"requestId" must be a string.')
  if isinstance(params['expression'], encodable.Encodable):
    params['expression'] = serializer.encode(
        params['expression'], for_cloud_api=True)
  num_retries = MAX_RETRIES if request_id else 0
  return _execute_cloud_call(
      export_endpoint(project=_get_projects_path(), body=params),
      num_retries=num_retries)


def startIngestion(request_id, params, allow_overwrite=False):
  """Creates an image asset import task.

  Args:
    request_id (string): A unique ID for the ingestion, from newTaskId.
      If you are using the Cloud API, this does not need to be from newTaskId,
      (though that's a good idea, as it's a good source of unique strings).
      It can also be empty, but in that case the request is more likely to
      fail as it cannot be safely retried.
    params: The object that describes the import task, which can
        have these fields:
          id (string) The destination asset id (e.g. users/foo/bar).
          tilesets (array) A list of Google Cloud Storage source file paths
            formatted like:
              [{'sources': [
                  {'primaryPath': 'foo.tif', 'additionalPaths': ['foo.prj']},
                  {'primaryPath': 'bar.tif', 'additionalPaths': ['bar.prj'},
              ]}]
            Where path values correspond to source files' Google Cloud Storage
            object names, e.g. 'gs://bucketname/filename.tif'
          bands (array) An optional list of band names formatted like:
            [{'id': 'R'}, {'id': 'G'}, {'id': 'B'}]
        If you are using the Cloud API, this object must instead be a dict
        representation of an ImageManifest.
    allow_overwrite: Whether the ingested image can overwrite an
        existing version.

  Returns:
    A dict with notes about the created task. This will include the ID for the
    import task (under 'id'), which may be different from request_id.
  """
  request = {
      'imageManifest':
          _cloud_api_utils.convert_params_to_image_manifest(params),
      'requestId':
          request_id,
      'overwrite':
          allow_overwrite
  }
  # It's only safe to retry the request if there's a unique ID to make it
  # idempotent.
  num_retries = MAX_RETRIES if request_id else 0
  operation = _execute_cloud_call(
      _get_cloud_api_resource().projects().image().import_(
          project=_get_projects_path(), body=request),
      num_retries=num_retries)
  return {
      'id':
          _cloud_api_utils.convert_operation_name_to_task_id(
              operation['name']),
      'name': operation['name'],
      'started': 'OK',
  }


def startTableIngestion(request_id, params, allow_overwrite=False):
  """Creates a table asset import task.

  Args:
    request_id (string): A unique ID for the ingestion, from newTaskId.
      If you are using the Cloud API, this does not need to be from newTaskId,
      (though that's a good idea, as it's a good source of unique strings).
      It can also be empty, but in that case the request is more likely to
      fail as it cannot be safely retried.
    params: The object that describes the import task, which can
        have these fields:
          id (string) The destination asset id (e.g. users/foo/bar).
          sources (array) A list of GCS (Google Cloud Storage) file paths
            with optional character encoding formatted like this:
            "sources":[{"primaryPath":"gs://bucket/file.shp","charset":"UTF-8"}]
            Here 'charset' refers to the character encoding of the source file.
        If you are using the Cloud API, this object must instead be a dict
        representation of a TableManifest.
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
  num_retries = MAX_RETRIES if request_id else 0
  operation = _execute_cloud_call(
      _get_cloud_api_resource().projects().table().import_(
          project=_get_projects_path(), body=request),
      num_retries=num_retries)
  return {
      'id':
          _cloud_api_utils.convert_operation_name_to_task_id(
              operation['name']),
      'name': operation['name'],
      'started': 'OK'
  }


def getAssetRoots():
  """Returns the list of the root folders the user owns.

  Note: The "id" values for roots are two levels deep, e.g. "users/johndoe"
        not "users/johndoe/notaroot".

  Returns:
    A list of folder descriptions formatted like:
      [
          {"type": "Folder", "id": "users/foo"},
          {"type": "Folder", "id": "projects/bar"},
      ]
  """
  return _cloud_api_utils.convert_list_assets_result_to_get_list_result(
      listBuckets())


def getAssetRootQuota(rootId):
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
          'limit': int(quota.get('maxAssetCount', 0))
      },
      'asset_size': {
          'usage': int(quota.get('sizeBytes', 0)),
          'limit': int(quota.get('maxSizeBytes', 0))
      }
  }


@deprecation.Deprecated('Use getIamPolicy')
def getAssetAcl(assetId):
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


def getIamPolicy(asset_id):
  """Loads ACL info for an asset, given an asset id.

  Args:
    asset_id: The asset to be retrieved.

  Returns:
    The asset's ACL, as an IAM Policy.
  """
  return _execute_cloud_call(
      _get_cloud_api_resource().projects().assets().getIamPolicy(
          resource=_cloud_api_utils.convert_asset_id_to_asset_name(asset_id),
          body={},
          prettyPrint=False))


@deprecation.Deprecated('Use setIamPolicy')
def setAssetAcl(assetId, aclUpdate):
  """Sets the access control list of the asset with the given ID.

  The owner ACL cannot be changed, and the final ACL of the asset
  is constructed by merging the OWNER entries of the old ACL with
  the incoming ACL record.

  Args:
    assetId: The ID of the asset to set the ACL on.
    aclUpdate: The updated ACL for the asset. Must be formatted like the
        value returned by getAssetAcl but without "owners".
  """
  # The ACL may be a string by the time it gets to us. Sigh.
  if isinstance(aclUpdate, six.string_types):
    aclUpdate = json.loads(aclUpdate)
  setIamPolicy(assetId, _cloud_api_utils.convert_acl_to_iam_policy(aclUpdate))
  return


def setIamPolicy(asset_id, policy):
  """Sets ACL info for an asset.

  Args:
    asset_id: The asset to set the ACL policy on.
    policy: The new Policy to apply to the asset. This replaces
      the current Policy.

  Returns:
    The new ACL, as an IAM Policy.
  """
  return _execute_cloud_call(
      _get_cloud_api_resource().projects().assets().setIamPolicy(
          resource=_cloud_api_utils.convert_asset_id_to_asset_name(asset_id),
          body={'policy': policy},
          prettyPrint=False))


@deprecation.Deprecated('Use updateAsset')
def setAssetProperties(assetId, properties):
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
  return


def updateAsset(asset_id, asset, update_mask):
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
  _execute_cloud_call(_get_cloud_api_resource().projects().assets().patch(
      name=name, body={
          'updateMask': {
              'paths': update_mask
          },
          'asset': asset
      }))


def createAssetHome(requestedId):
  """Attempts to create a home root folder for the current user ("users/joe").

  Results in an error if the user already has a home root folder or the
  requested ID is unavailable.

  Args:
    requestedId: The requested ID of the home folder (e.g. "users/joe").
  """
  # This is just a special case of folder creation.
  createAsset({
      'name': _cloud_api_utils.convert_asset_id_to_asset_name(requestedId),
      'type': 'FOLDER'
  })
  return


def authorizeHttp(http):
  if _credentials:
    return AuthorizedHttp(_credentials)
  else:
    return http


def create_assets(asset_ids, asset_type, mk_parents):
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


def convert_asset_id_to_asset_name(asset_id):
  """Converts an internal asset ID to a Cloud API asset name.

  If asset_id already matches the format 'projects/*/assets/**', it is returned
  as-is.

  Args:
    asset_id: The asset ID to convert.

  Returns:
    An asset name string in the format 'projects/*/assets/**'.
  """
  return _cloud_api_utils.convert_asset_id_to_asset_name(asset_id)
