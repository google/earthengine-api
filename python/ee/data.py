# Copyright 2012 Google Inc. All Rights Reserved.

"""Singleton for all of the library's communcation with the EE API.

This manages the data and API communication.
"""



# Using old-style python function naming on purpose to match the
# javascript version's naming.
# pylint: disable-msg=C6003,C6409

import json
import urllib
import urllib2

import httplib2

import ee_exception

# The base URL for all data calls.  This is set by ee.initialize().
BASE_URL = 'https://earthengine.googleapis.com/api'

# The base URL for map tiles.  This is set by ee.initialize().
TILE_BASE = 'https://earthengine.googleapis.com'

# The default deadline.
DEFAULT_DEADLINE = 30

# OAuth2 credentials object.  This may be set by ee.Initialize().
CREDENTIALS = None

# ClientLogin authorization token.  This may be set by ee.Initialize().
CLIENT_LOGIN_TOKEN = None


def getInfo(asset_id):
  """Load info for an asset, given an asset id.

  Args:
    asset_id: The asset to be retrieved.

  Returns:
    The value call results.
  """
  return send_('/info', {'id': asset_id})


def getList(asset_id):
  """Get a list of contents for a collection asset.

  Args:
    asset_id: The collection to be examined.

  Returns:
    The list call results.
  """
  return send_('/list', {'asset_id': asset_id})


def getMapId(params):
  """Get a Map Id for a given asset.

  Args:
    params: An object containing visualization options with the
            following possible values:
      version - (number) Version number of image (or latest).
      bands - (comma-seprated strings) Comma-delimited list of
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
          factor (or one per band)
      palette - (comma-separated strings) List of CSS-style color
          strings (single-band previews only).
      format (string) Either 'jpg' or 'png'.

  Returns:
    A dictionary containing "mapid" and "token" strings, which can
    be combined to retrieve tiles from the /map service.
  """
  return send_('/mapid', params)


def getValue(params):
  """Retrieve a processed value from the front end.

  Args:
    params: A dictionary containing:
        json - (String) A JSON object to be evaluated.

  Returns:
    The value call results.
  """
  return send_('/value', params)


def getThumbnail(params):
  """Get a Thumbnail for a given asset.

  Args:
    params: Parameters identical to those for the vizOptions for getMapId
        with the following additions:
      width - (number) Width of the thumbnail to render, in pixels.
      height - (number) Height of the thumbnail to render, in pixels.
      region - (E,S,W,N or GeoJSON) Geospatial region of the image
          to render (or all).
      pixel_bb - (X,Y,WIDTH,HEIGHT) Exact pixel region of the image
          to render (or all).
      format - (string) Either 'png' (default) or 'jpg'.

  Returns:
    A thumbnail image as raw PNG data.
  """
  return send_('/thumb', params, opt_method='GET', opt_raw=True)


def getThumbId(params):
  """Get a Thumbnail ID for a given asset.

  Args:
    params: Parameters identical to those for the vizOptions for getMapId
        with the following additions:
      width - (number) Width of the thumbnail to render, in pixels.
      height - (number) Height of the thumbnail to render, in pixels.
      region - (E,S,W,N or GeoJSON) Geospatial region of the image
          to render (or all).
      pixel_bb - (X,Y,WIDTH,HEIGHT) Exact pixel region of the image
          to render (or all).
      format - (string) Either 'png' (default) or 'jpg'.

  Returns:
    A thumbnail ID.
  """
  request = params.copy()
  request['getid'] = '1'
  return send_('/thumb', request)


def getDownloadId(params):
  """Get a Download Id.

  Args:
    params: An object containing visualization options with the following
      possible values:
        name: a base name to use when constructing filenames.
        bands: a description of the bands to download. Must be an array of
            dictionaries, each with the following keys:
          id: the name of the band, a string, required.
          crs: an optional CRS string defining the band projection.
          crs_transform: an optional array of 6 numbers specifying an affine
              transform from the specified CRS, in the order: xScale, yShearing,
              xShearing, yScale, xTranslation and yTranslation.
          dimensions: an optional array of two integers defining the width and
              height to which the band is cropped.
          scale: an optional number, specifying the scale in meters of the band;
                 ignored if crs and crs_transform is specified.
        crs: a default CRS string to use for any bands that do not explicitly
            specify one.
        crs_transform: a default affine transform to use for any bands that do
            not specify one, of the same format as the crs_transform of bands.
        dimensions: default image cropping dimensions to use for any bands that
            do not specify them.
        scale: a default scale to use for any bands that do not specify one;
            ignored if crs and crs_transform is specified.
        region: a polygon specifying a region to download; ignored if crs
            and crs_transform is specified.

  Returns:
    A dict containing a docid and token.
  """
  return send_('/download', params)


def makeDownloadUrl(downloadId):
  """Create a download URL from the given docid and token.

  Args:
    downloadId: An object containing a download docid and token.

  Returns:
    A URL from which the download can be obtained.
  """
  return (BASE_URL + '/download?docid=' + downloadId['docid'] +
          '&token=' + downloadId['token'])


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


def send_(path, params, opt_method='POST', opt_raw=False):
  """Send an API call.

  Args:
    path: The API endpoint to call.
    params: The call parameters.
    opt_method: The HTTPRequest method (GET or POST).
    opt_raw: Whether the data should be returned raw, without attempting
        to decode it as JSON.

  Returns:
    The data object returned by the API call.

  Raises:
    EEException: For malformed requests or errors from the server.
  """
  url = BASE_URL + path
  deadline = float(params.pop('deadline', DEFAULT_DEADLINE))
  payload = urllib.urlencode(params)
  http = httplib2.Http(timeout=deadline)

  headers = {}
  if CLIENT_LOGIN_TOKEN:
    headers['Authorization'] = 'GoogleLogin auth=' + CLIENT_LOGIN_TOKEN
  elif CREDENTIALS:
    http = CREDENTIALS.authorize(http)

  if opt_method == 'GET':
    url = url + '?' + payload
    payload = None
  elif opt_method == 'POST':
    headers['Content-type'] = 'application/x-www-form-urlencoded'
  else:
    raise ee_exception.EEException('Unexpected request method: ' + opt_method)

  try:
    response, content = http.request(url, opt_method, payload, headers)
  except httplib2.HttpLib2Error, e:
    raise ee_exception.EEException(
        'Unexpected HTTP error: %s' % e.message)

  if response.status != 200:
    raise ee_exception.EEException('Server returned HTTP code: %d' %
                                   response.status)

  if opt_raw:
    return content
  else:
    content = json.loads(content)
    if 'error' in content:
      raise ee_exception.EEException(content['error'])
    if not 'data' in content:
      raise ee_exception.EEException('Missing data in response: ' + content)
    return content['data']
