#!/usr/bin/env python
"""Singleton for the library's communication with the Earth Engine API."""

from __future__ import print_function



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

# pylint: disable=g-bad-import-order
import contextlib
import json
import threading
import time
import uuid

import httplib2
import six


# pylint: disable=g-import-not-at-top
try:
  # Python 3.x
  import urllib.error
  import urllib.parse
  import urllib.request
except ImportError:
  # Python 2.x
  import urllib

from . import ee_exception

# OAuth2 credentials object.  This may be set by ee.Initialize().
_credentials = None

# The base URL for all data calls.  This is set by ee.Initialize().
_api_base_url = None

# The base URL for map tiles.  This is set by ee.Initialize().
_tile_base_url = None


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


# Asset types recognized by create_assets().
ASSET_TYPE_FOLDER = 'Folder'
ASSET_TYPE_IMAGE_COLL = 'ImageCollection'
# Max length of the above type names
MAX_TYPE_LENGTH = len(ASSET_TYPE_IMAGE_COLL)

# The maximum number of tasks to retrieve in each request to "/tasklist".
_TASKLIST_PAGE_SIZE = 500


def initialize(
    credentials=None,
    api_base_url=None,
    tile_base_url=None
):
  """Initializes the data module, setting credentials and base URLs.

  If any of the arguments are unspecified, they will keep their old values;
  the defaults if initialize() has never been called before.

  Args:
    credentials: The OAuth2 credentials.
    api_base_url: The EarthEngine REST API endpoint.
    tile_base_url: The EarthEngine REST tile endpoint.
  """
  global _api_base_url, _tile_base_url, _credentials, _initialized

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


  _initialized = True


def reset():
  """Resets the data module, clearing credentials and custom base URLs."""
  global _api_base_url, _tile_base_url, _credentials, _initialized
  _credentials = None
  _api_base_url = None
  _tile_base_url = None
  _initialized = False




def setDeadline(milliseconds):
  """Sets the timeout length for API requests.

  Args:
    milliseconds: The number of milliseconds to wait for a request
        before considering it timed out. 0 means no limit.
  """
  global _deadline_ms
  _deadline_ms = milliseconds


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




def getInfo(asset_id):
  """Load info for an asset, given an asset id.

  Args:
    asset_id: The asset to be retrieved.

  Returns:
    The value call results.
  """
  return send_('/info', {'id': asset_id})




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
  return send_('/list', params)




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
    A dictionary containing:
    - "mapid" and "token" strings: these identify the map.
    - "tile_fetcher": a TileFetcher which can be used to fetch the tile
      images, or to get a format for the tile URLs.
  """
  if not isinstance(params['image'], six.string_types):
    params['image'] = params['image'].serialize()
  params['json_format'] = 'v2'
  result = send_('/mapid', params)
  url_format = '%s/map/%s/{z}/{x}/{y}?token=%s' % (
      _tile_base_url, result['mapid'], result['token'])
  result['tile_fetcher'] = TileFetcher(url_format)
  return result


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

  def __init__(self, url_format):
    self._url_format = url_format

  @property
  def url_format(self):
    """Gets the URL format for this tile fetcher.

    Returns:
      A format string with {x}, {y}, and {z} placeholders.
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
    return send_(
        self.format_tile_url(x, y, z), {}, opt_method='GET', opt_raw=True)


def getValue(params):
  """Retrieve a processed value from the front end.

  Args:
    params: A dictionary containing:
        json - (String) A JSON object to be evaluated.

  Returns:
    The value call results.
  """
  params['json_format'] = 'v2'
  return send_('/value', params)


def computeValue(obj):
  """Sends a request to compute a value.

  Args:
    obj: A ComputedObject whose value is desired.

  Returns:
    The result of evaluating that object on the server.
  """
  return send_('/value', ({'json': obj.serialize(), 'json_format': 'v2'}))


def getThumbnail(params):
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

  Returns:
    A thumbnail image as raw PNG data.
  """
  return send_('/thumb', params, opt_method='GET', opt_raw=True)


def getThumbId(params):
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

  Returns:
    A thumbnail ID.
  """
  request = params.copy()
  request['getid'] = '1'
  request['json_format'] = 'v2'
  if not isinstance(request['image'], six.string_types):
    request['image'] = request['image'].serialize()
  if 'size' in request and isinstance(request['size'], (list, tuple)):
    request['size'] = 'x'.join(map(str, request['size']))
  return send_('/thumb', request)


def makeThumbUrl(thumbId):
  """Create a thumbnail URL from the given thumbid and token.

  Args:
    thumbId: An object containing a thumbnail thumbid and token.

  Returns:
    A URL from which the thumbnail can be obtained.
  """
  return '%s/api/thumb?thumbid=%s&token=%s' % (
      _tile_base_url, thumbId['thumbid'], thumbId['token'])


def getDownloadId(params):
  """Get a Download ID.

  Args:
    params: An object containing visualization options with the following
      possible values:
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

  Returns:
    A dict containing a docid and token.
  """
  params['json_format'] = 'v2'
  if 'bands' in params and not isinstance(params['bands'], six.string_types):
    params['bands'] = json.dumps(params['bands'])
  return send_('/download', params)


def makeDownloadUrl(downloadId):
  """Create a download URL from the given docid and token.

  Args:
    downloadId: An object containing a download docid and token.

  Returns:
    A URL from which the download can be obtained.
  """
  return '%s/api/download?docid=%s&token=%s' % (
      _tile_base_url, downloadId['docid'], downloadId['token'])


def getTableDownloadId(params):
  """Get a Download ID.

  Args:
    params: An object containing table download options with the following
      possible values:
        format - The download format, CSV or JSON.
        selectors - Comma separated string of selectors that can be used to
            determine which attributes will be downloaded.
        filename - The name of the file that will be downloaded.

  Returns:
    A dict containing a docid and token.
  """
  params['json_format'] = 'v2'
  return send_('/table', params)


def makeTableDownloadUrl(downloadId):
  """Create a table download URL from a docid and token.

  Args:
    downloadId: A table download id and token.

  Returns:
    A Url from which the download can be obtained.
  """
  return '%s/api/table?docid=%s&token=%s' % (
      _tile_base_url, downloadId['docid'], downloadId['token'])


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
  return send_('/algorithms', {}, 'GET')


def createAsset(value, opt_path=None, opt_force=False, opt_properties=None):
  """Creates an asset from a JSON value.

  To create an empty image collection or folder, pass in a "value" object
  with a "type" key whose value is "ImageCollection" or "Folder".

  Args:
    value: An object describing the asset to create or a JSON string
        with the already-serialized value for the new asset.
    opt_path: An optional desired ID, including full path.
    opt_force: True if asset overwrite is allowed
    opt_properties: The keys and values of the properties to set
        on the created asset.

  Returns:
    A description of the saved asset, including a generated ID.
  """
  if not isinstance(value, six.string_types):
    value = json.dumps(value)
  args = {'value': value, 'json_format': 'v2'}
  if opt_path is not None:
    args['id'] = opt_path
  args['force'] = opt_force
  if opt_properties is not None:
    args['properties'] = json.dumps(opt_properties)
  return send_('/create', args)


def copyAsset(sourceId, destinationId, allowOverwrite=False
             ):
  """Copies the asset from sourceId into destinationId.

  Args:
    sourceId: The ID of the asset to copy.
    destinationId: The ID of the new asset created by copying.
    allowOverwrite: If True, allows overwriting an existing asset.
  """
  request = {
      'sourceId': sourceId,
      'destinationId': destinationId,
      'allowOverwrite': allowOverwrite,
      }
  send_('/copy', request)


def renameAsset(sourceId, destinationId):
  """Renames the asset from sourceId to destinationId.

  Args:
    sourceId: The ID of the asset to rename.
    destinationId: The new ID of the asset.
  """
  send_('/rename', {
      'sourceId': sourceId,
      'destinationId': destinationId,
  })


def deleteAsset(assetId):
  """Deletes the asset with the given id.

  Args:
    assetId: The ID of the asset to delete.
  """
  send_('/delete', {'id': assetId})


def newTaskId(count=1):
  """Generate an ID for a long-running task.

  Args:
    count: Optional count of IDs to generate, one by default.

  Returns:
    A list containing generated ID strings.
  """
  args = {'count': count}
  return send_('/newtaskid', args)


def getTaskList():
  """Retrieves a list of the user's tasks.

  Returns:
    A list of task status dictionaries, one for each task submitted to EE by
    the current user. These include currently running tasks as well as recently
    canceled or failed tasks.
  """
  params = {'pagesize': _TASKLIST_PAGE_SIZE}
  tasks = []
  while True:
    r = send_('/tasklist', params, 'GET')
    tasks.extend(r['tasks'])
    next_page_token = r.get('next_page_token', '')
    if not next_page_token:
      break
    params['pagetoken'] = next_page_token
  return tasks




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
  args = {'q': ','.join(taskId)}
  return send_('/taskstatus', args, 'GET')




def cancelTask(taskId):
  """Cancels a batch task."""
  send_('/updatetask', {'id': taskId, 'action': 'CANCEL'})




def startProcessing(taskId, params):
  """Create processing task that exports or pre-renders an image.

  Args:
    taskId: ID for the task (obtained using newTaskId).
    params: The object that describes the processing task; only fields
      that are common for all processing types are documented below.
        type (string) Either 'EXPORT_IMAGE', 'EXPORT_FEATURES',
          'EXPORT_VIDEO' or 'EXPORT_TILES'.
        json (string) JSON description of the image.

  Returns:
    A dict with optional notes about the created task.
  """

  args = params.copy()
  args['id'] = taskId
  return send_('/processingrequest', args)


def startIngestion(request_id, params, allow_overwrite=False):
  """Creates an image asset import task.

  Args:
    request_id (string): A unique ID for the ingestion, from newTaskId.
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
    allow_overwrite: Whether the ingested image can overwrite an
        existing version.

  Returns:
    A dict with notes about the created task. This will include the ID for the
    import task (under 'id'), which may be different from request_id.
  """
  args = {
      'id': request_id,
      'request': json.dumps(params),
      'allowOverwrite': allow_overwrite
  }
  result = send_('/ingestionrequest', args)
  result['id'] = request_id
  return result


def startTableIngestion(request_id, params, allow_overwrite=False):
  """Creates a table asset import task.

  Args:
    request_id (string): A unique ID for the ingestion, from newTaskId.
    params: The object that describes the import task, which can
        have these fields:
          id (string) The destination asset id (e.g. users/foo/bar).
          sources (array) A list of CNS source file paths with optional
            character encoding formatted like:
            "sources": [{ "primaryPath": "states.shp", "charset": "UTF-8" }]
            Where path values correspond to source files' CNS locations,
            e.g. 'googlefile://namespace/foobar.shp', and 'charset' refers to
            the character encoding of the source file.
    allow_overwrite: Whether the ingested image can overwrite an
        existing version.
  Returns:
    A dict with notes about the created task. This will include the ID for the
    import task (under 'id'), which may be different from request_id.
  """
  args = {
      'id': request_id,
      'tableRequest': json.dumps(params),
      'allowOverwrite': allow_overwrite
  }
  result = send_('/ingestionrequest', args)
  result['id'] = request_id
  return result


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
  return send_('/buckets', {}, 'GET')


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
  return send_('/quota', {'id': rootId}, 'GET')


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
  """
  return send_('/getacl', {'id': assetId}, 'GET')




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
  send_('/setacl', {'id': assetId, 'value': aclUpdate})


def setAssetProperties(assetId, properties):
  """Sets metadata properties of the asset with the given ID.

  To delete a property, set its value to null.
  The authenticated user must be a writer or owner of the asset.

  Args:
    assetId: The ID of the asset to set the ACL on.
    properties: A dictionary of keys and values for the properties to update.
  """
  send_('/setproperties', {'id': assetId, 'properties': json.dumps(properties)})


def createAssetHome(requestedId):
  """Attempts to create a home root folder for the current user ("users/joe").

  Results in an error if the user already has a home root folder or the
  requested ID is unavailable.

  Args:
    requestedId: The requested ID of the home folder (e.g. "users/joe").
  """
  send_('/createbucket', {'id': requestedId})


def authorizeHttp(http):
  if _credentials:
    return _credentials.authorize(http)
  else:
    return http


def send_(path, params, opt_method='POST', opt_raw=False):
  """Send an API call.

  Args:
    path: The API endpoint to call, or a full URL.
    params: The call parameters.
    opt_method: The HTTPRequest method (GET or POST).
    opt_raw: Whether the data should be returned raw, without attempting
        to decode it as JSON.

  Returns:
    The data object returned by the API call.

  Raises:
    EEException: For malformed requests or errors from the server.
  """
  # Make sure we never perform API calls before initialization.
  initialize()

  if _thread_locals.profile_hook:
    params = params.copy()
    params['profiling'] = '1'


  if not path.startswith('http'):
    url = _api_base_url + path
  else:
    url = path
  headers = {}


  try:
    payload = urllib.parse.urlencode(params)  # Python 3.x
  except AttributeError:
    payload = urllib.urlencode(params)  # Python 2.x
  http = httplib2.Http(timeout=(_deadline_ms / 1000.0) or None)
  http = authorizeHttp(http)

  if opt_method == 'GET':
    url = url + ('&' if '?' in url else '?') + payload
    payload = None
  elif opt_method == 'POST':
    headers['Content-type'] = 'application/x-www-form-urlencoded'
  else:
    raise ee_exception.EEException('Unexpected request method: ' + opt_method)

  def send_with_backoff(retries=0):
    """Send an API call with backoff.

    Attempts an API call. If the server's response has a 429 status, retry the
    request using an incremental backoff strategy.

    Args:
      retries: The number of retries that have already occurred.

    Returns:
      A tuple of response, content returned by the API call.

    Raises:
      EEException: For errors from the server.
    """
    try:
      response, content = http.request(
          url, method=opt_method, body=payload, headers=headers)
      if response.status == 429:
        if retries < MAX_RETRIES:
          time.sleep(min(2**retries * BASE_RETRY_WAIT, MAX_RETRY_WAIT) / 1000)
          response, content = send_with_backoff(retries + 1)
    except httplib2.HttpLib2Error as e:
      raise ee_exception.EEException('Unexpected HTTP error: %s' % e.message)
    return response, content

  response, content = send_with_backoff()

  # Call the profile hook if present. Note that this is done before we handle
  # the content, so that profiles are reported even if the response is an error.
  if (_thread_locals.profile_hook and
      _PROFILE_RESPONSE_HEADER_LOWERCASE in response):
    _thread_locals.profile_hook(response[_PROFILE_RESPONSE_HEADER_LOWERCASE])

  # Whether or not the response is an error, it may be JSON.
  content_type = (response['content-type'] or 'application/json').split(';')[0]
  if content_type in ('application/json', 'text/json') and not opt_raw:
    try:
      try:
        # Python 3.x
        try:
          content = content.decode()
        except AttributeError:
          pass
      except UnicodeDecodeError:
        # Python 2.x
        content = content
      json_content = json.loads(content)
    except Exception:
      raise ee_exception.EEException('Invalid JSON: %s' % content)
    if 'error' in json_content:
      raise ee_exception.EEException(json_content['error']['message'])
    if 'data' not in content:
      raise ee_exception.EEException('Malformed response: ' + str(content))
  else:
    json_content = None

  if response.status < 100 or response.status >= 300:
    # Note if the response is JSON and contains an error value, we raise that
    # error above rather than this generic one.
    raise ee_exception.EEException(
        'Server returned HTTP code: %d' % response.status)

  # Now known not to be an error response...
  if opt_raw:
    return content
  elif json_content is None:
    raise ee_exception.EEException(
        'Response was unexpectedly not JSON, but %s' % response['content-type'])
  else:
    return json_content['data']


def create_assets(asset_ids, asset_type, mk_parents):
  """Creates the specified assets if they do not exist."""
  for asset_id in asset_ids:
    if getInfo(asset_id):
      print('Asset %s already exists' % asset_id)
      continue
    if mk_parents:
      parts = asset_id.split('/')
      # Don't check the top level - for some users, the 'users' meta-folder is
      # invisible.
      path = parts[0] + '/'
      for part in parts[1:-1]:
        path += part
        if getInfo(path) is None:
          createAsset({'type': ASSET_TYPE_FOLDER}, path)
        path += '/'
    createAsset({'type': asset_type}, asset_id)
