/**
 * @fileoverview Singleton for all of the library's communcation
 * with the Earth Engine API.
 */

goog.provide('ee.data');
goog.provide('ee.data.AbstractTaskConfig');
goog.provide('ee.data.AlgorithmArgument');
goog.provide('ee.data.AlgorithmSignature');
goog.provide('ee.data.AlgorithmsRegistry');
goog.provide('ee.data.AssetAcl');
goog.provide('ee.data.AssetAclUpdate');
goog.provide('ee.data.AssetDescription');
goog.provide('ee.data.AssetList');
goog.provide('ee.data.AssetType');
goog.provide('ee.data.Band');
goog.provide('ee.data.BandDescription');
goog.provide('ee.data.DownloadId');
goog.provide('ee.data.FeatureCollectionDescription');
goog.provide('ee.data.FeatureVisualizationParameters');
goog.provide('ee.data.FileSource');
goog.provide('ee.data.Fileset');
goog.provide('ee.data.FolderDescription');
goog.provide('ee.data.GMEProject');
goog.provide('ee.data.GeoJSONFeature');
goog.provide('ee.data.GeoJSONGeometry');
goog.provide('ee.data.ImageCollectionDescription');
goog.provide('ee.data.ImageDescription');
goog.provide('ee.data.ImageTaskConfig');
goog.provide('ee.data.ImageVisualizationParameters');
goog.provide('ee.data.IngestionRequest');
goog.provide('ee.data.MapId');
goog.provide('ee.data.PixelTypeDescription');
goog.provide('ee.data.ProcessingResponse');
goog.provide('ee.data.RawMapId');
goog.provide('ee.data.ShortAssetDescription');
goog.provide('ee.data.TableTaskConfig');
goog.provide('ee.data.TaskListResponse');
goog.provide('ee.data.TaskStatus');
goog.provide('ee.data.TaskUpdateActions');
goog.provide('ee.data.ThumbnailId');
goog.provide('ee.data.VideoTaskConfig');

goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.functions');
goog.require('goog.json');
goog.require('goog.net.XhrIo');
goog.require('goog.net.XmlHttp');
goog.require('goog.net.jsloader');
goog.require('goog.object');
goog.require('goog.string');

goog.forwardDeclare('ee.Image');


/**
 * @type {string?} The base URL for all API calls.
 * @private
 */
ee.data.apiBaseUrl_ = null;


/**
 * @type {string?} The base URL for map tiles.
 * @private
 */
ee.data.tileBaseUrl_ = null;


/**
 * @type {string?} A string to pass in the X-XSRF-Token header of XHRs.
 * @private
 */
ee.data.xsrfToken_ = null;


/**
 * @type {function(!goog.Uri.QueryData, string): !goog.Uri.QueryData} A function
 *     used to transform parameters right before they are sent to the server.
 *     Takes the URL of the request as the second argument.
 * @private
 */
ee.data.paramAugmenter_ = goog.functions.identity;


/**
 * @private {string?} An OAuth2 token to use for authenticating EE API calls.
 */
ee.data.authToken_ = null;


/**
 * @private {string?} The client ID used to retrieve OAuth2 tokens.
 */
ee.data.authClientId_ = null;


/**
 * @private {!Array<string>} The scopes to request when retrieving OAuth tokens.
 */
ee.data.authScopes_ = [];


/**
 * @private @const {string} The OAuth scope for the EE API.
 */
ee.data.AUTH_SCOPE_ = 'https://www.googleapis.com/auth/earthengine.readonly';


/**
 * @private @const {string} The URL of the Google APIs Client Library.
 */
ee.data.AUTH_LIBRARY_URL_ = 'https://apis.google.com/js/client.js';


/**
 * @type {boolean} Whether the library has been initialized.
 * @private
 */
ee.data.initialized_ = false;


/**
 * @type {number} The number of milliseconds to wait for each request before
 *     considering it timed out. 0 means no limit. Note that this is not
 *     supported by browsers for synchronous requests.
 * @private
 */
ee.data.deadlineMs_ = 0;


/**
 * @type {string} The default base URL for API calls.
 * @private
 * @const
 */
ee.data.DEFAULT_API_BASE_URL_ = 'https://earthengine.googleapis.com/api';


/**
 * @type {string} The default base URL for media/tile calls.
 * @private
 * @const
 */
ee.data.DEFAULT_TILE_BASE_URL_ = 'https://earthengine.googleapis.com';


/**
 * Actions that can update existing tasks.
 * @enum {string}
 */
ee.data.TaskUpdateActions = {
  CANCEL: 'CANCEL',
  UPDATE: 'UPDATE'
};


/**
 * Initializes the data module, setting base URLs.
 *
 * @param {string?=} opt_apiBaseUrl The (proxied) EarthEngine REST API
 *     endpoint.
 * @param {string?=} opt_tileBaseUrl The (unproxied) EarthEngine REST tile
 *     endpoint.
 * @param {string?=} opt_xsrfToken A string to pass in the X-XSRF-Token header
 *     of XHRs.
 */
ee.data.initialize = function(opt_apiBaseUrl, opt_tileBaseUrl, opt_xsrfToken) {
  // If already initialized, only replace the explicitly specified parts.

  if (goog.isDefAndNotNull(opt_apiBaseUrl)) {
    ee.data.apiBaseUrl_ = opt_apiBaseUrl;
  } else if (!ee.data.initialized_) {
    ee.data.apiBaseUrl_ = ee.data.DEFAULT_API_BASE_URL_;
  }
  if (goog.isDefAndNotNull(opt_tileBaseUrl)) {
    ee.data.tileBaseUrl_ = opt_tileBaseUrl;
  } else if (!ee.data.initialized_) {
    ee.data.tileBaseUrl_ = ee.data.DEFAULT_TILE_BASE_URL_;
  }
  if (goog.isDef(opt_xsrfToken)) {  // Passing an explicit null clears it.
    ee.data.xsrfToken_ = opt_xsrfToken;
  }
  ee.data.initialized_ = true;
};


/**
 * Resets the data module, clearing custom base URLs.
 */
ee.data.reset = function() {
  ee.data.apiBaseUrl_ = null;
  ee.data.tileBaseUrl_ = null;
  ee.data.xsrfToken_ = null;
  ee.data.initialized_ = false;
};


/**
 * Configures client-side authentication of EE API calls through the
 * Google APIs Client Library for JavaScript. The library will be loaded
 * automatically if it is not already loaded on the page. The user will be
 * asked to grant the application identified by clientId access to their EE
 * data if they have not done so previously.
 *
 * This should be called before the EE library is initialized.
 *
 * Note that if the user has not previously granted access to the application
 * identified by the client ID, by default this will try to pop up a dialog
 * window prompting the user to grant the required permission. However, this
 * popup can be blocked by the browser. To avoid this, specify the
 * opt_onImmediateFailed callback, and in it render an in-page login button,
 * then call ee.data.authenticateViaPopup() from the click event handler of
 * this button. This stops the browser from blocking the popup, as it is now the
 * direct result of a user action.
 *
 * @param {?string} clientId The application's OAuth client ID, or null to
 *     disable authenticated calls. This can be obtained through the Google
 *     Developers Console. The project must have a JavaScript origin that
 *     corresponds to the domain where the script is running.
 * @param {function()} success The function to call if authentication succeeded.
 * @param {function(string)=} opt_error The function to call if authentication
 *     failed, passed the error message. If authentication in immediate
 *     (behind-the-scenes) mode fails and opt_onImmediateFailed is specified,
 *     that function is called instead of opt_error.
 * @param {!Array<string>=} opt_extraScopes Extra OAuth scopes to request.
 * @param {function()=} opt_onImmediateFailed The function to call if
 *     automatic behind-the-scenes authentication fails. Defaults to
 *     ee.data.authenticateViaPopup(), bound to the passed callbacks.
 * @export
 */
ee.data.authenticate = function(
    clientId, success, opt_error, opt_extraScopes, opt_onImmediateFailed) {
  // Remember the auth options.
  var scopes = [ee.data.AUTH_SCOPE_];
  if (opt_extraScopes) {
    goog.array.extend(scopes, opt_extraScopes);
    goog.array.removeDuplicates(scopes);
  }
  ee.data.authClientId_ = clientId;
  ee.data.authScopes_ = scopes;

  if (goog.isNull(clientId)) {
    ee.data.authToken_ = null;
    return;
  }

  // Start the authentication flow as soon as we have the auth library.
  ee.data.ensureAuthLibLoaded_(function() {
    var onImmediateFailed = opt_onImmediateFailed || goog.partial(
        ee.data.authenticateViaPopup, success, opt_error);
    ee.data.refreshAuthToken_(success, opt_error, onImmediateFailed);
  });
};


/**
 * Shows a popup asking for the user's permission. Should only be called if
 * ee.data.authenticate() called its opt_onImmediateFailed argument in the past.
 *
 * May be blocked by pop-up blockers if called outside a user-initiated handler.
 *
 * @param {function()=} opt_success The function to call if authentication
 *     succeeds.
 * @param {function(string)=} opt_error The function to call if authentication
 *     fails, passing the error message.
 * @export
 */
ee.data.authenticateViaPopup = function(opt_success, opt_error) {
  goog.global['gapi']['auth']['authorize']({
    'client_id': ee.data.authClientId_,
    'immediate': false,
    'scope': ee.data.authScopes_.join(' ')
  }, goog.partial(ee.data.handleAuthResult_, opt_success, opt_error));
};


/**
 * Configures client-side authentication of EE API calls by providing a
 * current OAuth2 token to use. This is a replacement for expected
 * ee.data.authenticate() when a token is already available.
 * @param {string} clientId The OAuth client ID associated with the token.
 * @param {string} tokenType The OAuth2 token type, e.g. "Bearer".
 * @param {string} accessToken The token string, typically looking something
 *     like "ya29.hgGGO...OtA".
 * @param {number} expiresIn The number of seconds after which this token
 *     expires.
 * @param {!Array<string>=} opt_extraScopes Extra OAuth scopes associated with
 *     the token.
 * @param {function()=} opt_callback A function to call when the token is set.
 * @param {boolean=} opt_updateAuthLibrary Whether to also update the token
 *     set in the Google API Client Library for JavaScript. Defaults to true.
 * @export
 */
ee.data.setAuthToken = function(clientId, tokenType, accessToken,
                                expiresIn, opt_extraScopes, opt_callback,
                                opt_updateAuthLibrary) {
  var scopes = [ee.data.AUTH_SCOPE_];
  if (opt_extraScopes) {
    goog.array.extend(scopes, opt_extraScopes);
    goog.array.removeDuplicates(scopes);
  }
  ee.data.authClientId_ = clientId;
  ee.data.authScopes_ = scopes;

  var tokenObject = {
    'token_type': tokenType,
    'access_token': accessToken,
    'state': scopes.join(' '),
    'expires_in': expiresIn
  };
  ee.data.handleAuthResult_(undefined, undefined, tokenObject);

  if (opt_updateAuthLibrary === false) {
    if (opt_callback) opt_callback();
  } else {
    ee.data.ensureAuthLibLoaded_(function() {
      goog.global['gapi']['auth']['setToken'](tokenObject);
      if (opt_callback) opt_callback();
    });
  }
};


/**
 * Sets the timeout length for asynchronous API requests.
 *
 * @param {number} milliseconds The number of milliseconds to wait for a
 *     request before considering it timed out. 0 means no limit.
 * @export
 */
ee.data.setDeadline = function(milliseconds) {
  ee.data.deadlineMs_ = milliseconds;
};


/**
 * Sets a function used to transform request parameters.
 *
 * @param {?function(!goog.Uri.QueryData, string): !goog.Uri.QueryData}
 *     augmenter A function used to transform request parameters right
 *     before they are sent to the server. Takes the URL of the request
 *     as the second argument.
 */
ee.data.setParamAugmenter = function(augmenter) {
  ee.data.paramAugmenter_ = augmenter || goog.functions.identity;
};
goog.exportSymbol('ee.data.setParamAugmenter', ee.data.setParamAugmenter);


/**
 * Returns the base URL used for API calls.
 *
 * @return {string?} The current API base URL.
 * @export
 */
ee.data.getApiBaseUrl = function() {
  return ee.data.apiBaseUrl_;
};


/**
 * Returns the base URL used for tiles.
 *
 * @return {string?} The current tile base URL.
 * @export
 */
ee.data.getTileBaseUrl = function() {
  return ee.data.tileBaseUrl_;
};


/**
 * Returns the current XSRF token.
 *
 * @return {string?} A string to pass in the X-XSRF-Token header of XHRs.
 * @export
 */
ee.data.getXsrfToken = function() {
  return ee.data.xsrfToken_;
};


/**
 * Returns the current OAuth token; null unless ee.data.setAuthToken() or
 * ee.data.authorize() previously suceeded.
 *
 * @return {?string} The string to pass in the Authorization header of XHRs.
 * @export
 */
ee.data.getAuthToken = function() {
  return ee.data.authToken_;
};


/**
 * Returns the current OAuth client ID; null unless ee.data.setAuthToken() or
 * ee.data.authorize() previously suceeded.
 *
 * @return {?string} The OAuth2 client ID for client-side authentication.
 * @export
 */
ee.data.getAuthClientId = function() {
  return ee.data.authClientId_;
};


/**
 * Returns the current OAuth scopes; empty unless ee.data.setAuthToken() or
 * ee.data.authorize() previously suceeded.
 *
 * @return {!Array<string>} The OAuth2 scopes for client-side authentication.
 * @export
 */
ee.data.getAuthScopes = function() {
  return ee.data.authScopes_;
};


/**
 * Load info for an asset, given an asset id.
 *
 * @param {string} id The asset to be retrieved.
 * @param {function(Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {?Object} The value call results, or null if a callback is specified.
 * @export
 */
ee.data.getInfo = function(id, opt_callback) {
  return ee.data.send_('/info',
                       new goog.Uri.QueryData().add('id', id),
                       opt_callback);
};


/**
 * Returns a list of the contents in an asset collection or folder.
 * @param {Object} params An object containing request parameters with
 *     the following possible values:
 *       - id (string) The asset id of the collection to list.
 *       - starttime (number) Start time, in msec since the epoch.
 *       - endtime (number) End time, in msec since the epoch.
 *       - fields (comma-separated strings) Field names to return.
 * @param {function(ee.data.AssetList, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.AssetList} The list call results,
 *     or null if a callback
 *     is specified.
 * @export
 */
ee.data.getList = function(params, opt_callback) {
  var request = ee.data.makeRequest_(params);
  return /** @type {?ee.data.AssetList} */ (
      ee.data.send_('/list', request, opt_callback));
};


/**
 * Get a Map ID for a given asset
 * @param {ee.data.ImageVisualizationParameters} params
 *     The visualization parameters. For Images and ImageCollections:
 *       - image (JSON string) The image to render.
 *       - version (number) Version number of image (or latest).
 *       - bands (comma-seprated strings) Comma-delimited list of
 *             band names to be mapped to RGB.
 *       - min (comma-separated numbers) Value (or one per band)
 *             to map onto 00.
 *       - max (comma-separated numbers) Value (or one per band)
 *             to map onto FF.
 *       - gain (comma-separated numbers) Gain (or one per band)
 *             to map onto 00-FF.
 *       - bias (comma-separated numbers) Offset (or one per band)
 *             to map onto 00-FF.
 *       - gamma (comma-separated numbers) Gamma correction
 *             factor (or one per band)
 *       - palette (comma-separated strings) List of CSS-style color
 *             strings (single-band previews only).
 *       - opacity (number) a number between 0 and 1 for opacity.
 *       - format (string) Either "jpg" or "png".
 * @param {function(ee.data.RawMapId, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.RawMapId} The mapId call results, or null if a callback
 *     is specified.
 * @export
 */
ee.data.getMapId = function(params, opt_callback) {
  params = /** @type {ee.data.ImageVisualizationParameters} */ (
      goog.object.clone(params));
  return /** @type {?ee.data.RawMapId} */ (
      ee.data.send_('/mapid', ee.data.makeRequest_(params), opt_callback));
};


/**
 * Generate a URL for map tiles from a Map ID and coordinates.
 * @param {ee.data.RawMapId} mapid The mapid to generate tiles for.
 * @param {number} x The tile x coordinate.
 * @param {number} y The tile y coordinate.
 * @param {number} z The tile zoom level.
 * @return {string} The tile URL.
 * @export
 */
ee.data.getTileUrl = function(mapid, x, y, z) {
  var width = Math.pow(2, z);
  x = x % width;
  if (x < 0) {
    x += width;
  }
  return [ee.data.tileBaseUrl_, 'map', mapid['mapid'], z, x, y].join('/') +
      '?token=' + mapid['token'];
};


/**
 * Retrieve a processed value from the front end.
 * @param {Object} params The value to be evaluated, with the following
 *     possible values:
 *      - json (String) A JSON object to be evaluated.
 * @param {function(?, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {?} The value call results, or null if a callback is specified.
 * @export
 */
ee.data.getValue = function(params, opt_callback) {
  params = goog.object.clone(params);
  return ee.data.send_('/value', ee.data.makeRequest_(params), opt_callback);
};


/**
 * Get a Thumbnail Id for a given asset.
 * @param {Object} params Parameters identical to those for the visParams for
 *     getMapId with the following additions:
 *       - size (a number or pair of numbers in format WIDTHxHEIGHT) Maximum
 *             dimensions of the thumbnail to render, in pixels. If only one
 *             number is passed, it is used as the maximum, and the other
 *             dimension is computed by proportional scaling.
 *       - region (E,S,W,N or GeoJSON) Geospatial region of the image
 *             to render. By default, the whole image.
 *       - format (string) Either 'png' (default) or 'jpg'.
 * @param {function(ee.data.ThumbnailId, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.ThumbnailId} The thumb ID and token, or null if a
 *     callback is specified.
 * @export
 */
ee.data.getThumbId = function(params, opt_callback) {
  params = goog.object.clone(params);
  if (goog.isArray(params['size'])) {
    params['size'] = params['size'].join('x');
  }
  var request = ee.data.makeRequest_(params).add('getid', '1');
  return /** @type {?ee.data.ThumbnailId} */(
      ee.data.send_('/thumb', request, opt_callback));
};


/**
 * Create a thumbnail URL from a thumbid and token.
 * @param {ee.data.ThumbnailId} id A thumbnail ID and token.
 * @return {string} The thumbnail URL.
 * @export
 */
ee.data.makeThumbUrl = function(id) {
  return ee.data.tileBaseUrl_ + '/api/thumb?thumbid=' + id['thumbid'] +
      '&token=' + id['token'];
};


/**
 * Get a Download ID.
 * @param {Object} params An object containing download options with the
 *     following possible values:
 *   - id: The ID of the image to download.
 *   - name: a base name to use when constructing filenames.
 *   - bands: a description of the bands to download. Must be an array of
 *         dictionaries, each with the following keys:
 *     + id: the name of the band, a string, required.
 *     + crs: an optional CRS string defining the band projection.
 *     + crs_transform: an optional array of 6 numbers specifying an affine
 *           transform from the specified CRS, in the order: xScale, yShearing,
 *           xShearing, yScale, xTranslation and yTranslation.
 *     + dimensions: an optional array of two integers defining the width and
 *           height to which the band is cropped.
 *     + scale: an optional number, specifying the scale in meters of the band;
 *              ignored if crs and crs_transform is specified.
 *   - crs: a default CRS string to use for any bands that do not explicitly
 *         specify one.
 *   - crs_transform: a default affine transform to use for any bands that do
 *         not specify one, of the same format as the crs_transform of bands.
 *   - dimensions: default image cropping dimensions to use for any bands that
 *         do not specify them.
 *   - scale: a default scale to use for any bands that do not specify one;
 *         ignored if crs and crs_transform is specified.
 *   - region: a polygon specifying a region to download; ignored if crs
 *         and crs_transform is specified.
 * @param {function(ee.data.DownloadId, string=)=} opt_callback An optional
 *     callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.DownloadId} A download id and token, or null if a callback
 *     is specified.
 * @export
 */
ee.data.getDownloadId = function(params, opt_callback) {
  // TODO(user): Redirect to getImageDownloadId.
  params = goog.object.clone(params);
  return /** @type {?ee.data.DownloadId} */ (ee.data.send_(
      '/download',
      ee.data.makeRequest_(params),
      opt_callback));
};


/**
 * Create a download URL from a docid and token.
 * @param {ee.data.DownloadId} id A download id and token.
 * @return {string} The download URL.
 * @export
 */
ee.data.makeDownloadUrl = function(id) {
  // TODO(user): Redirect to makeImageDownloadUrl.
  return ee.data.tileBaseUrl_ + '/api/download?docid=' + id['docid'] +
      '&token=' + id['token'];
};


/**
 * Get a download ID.
 * @param {Object} params An object containing table download options with the
 *     following possible values:
 *   - format: The download format, CSV or JSON.
 *   - selectors: Comma separated string of selectors that can be used to
 *          determine which attributes will be downloaded.
 *   - filename: The name of the file that will be downloaded.
 * @param {function(ee.data.DownloadId, string=)=} opt_callback An optional
 *     callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.DownloadId} A download id and token, or null if a
 *     callback is specified.
 * @export
 */
ee.data.getTableDownloadId = function(params, opt_callback) {
  params = goog.object.clone(params);
  return /** @type {?ee.data.DownloadId} */ (ee.data.send_(
      '/table',
      ee.data.makeRequest_(params),
      opt_callback));
};


/**
 * Create a table download URL from a docid and token.
 * @param {ee.data.DownloadId} id A table download id and token.
 * @return {string} The download URL.
 * @export
 */
ee.data.makeTableDownloadUrl = function(id) {
  return ee.data.tileBaseUrl_ + '/api/table?docid=' + id['docid'] +
      '&token=' + id['token'];
};


/**
 * Get the list of algorithms.
 *
 * @param {function(ee.data.AlgorithmsRegistry, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.AlgorithmsRegistry} The list of algorithm
 *     signatures, or null if a callback is specified.
 */
ee.data.getAlgorithms = function(opt_callback) {
  return /** @type {?ee.data.AlgorithmsRegistry} */ (
      ee.data.send_('/algorithms', null, opt_callback, 'GET'));
};


/**
 * Get the list of GME projects for the current user.
 *
 * @param {function(Array.<ee.data.GMEProject>, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?Array.<ee.data.GMEProject>} Null if a callback isn't specified,
 *     otherwise an array containing one object for each GME project.
 */
ee.data.getGMEProjects = function(opt_callback) {
  return /** @type {?Array.<ee.data.GMEProject>} */ (
      ee.data.send_('/gmeprojects', null, opt_callback, 'GET'));
};


/**
 * Save an asset.
 *
 * @param {string} value The JSON-serialized value of the asset.
 * @param {string=} opt_path An optional desired ID, including full path.
 * @param {boolean=} opt_force Force overwrite.
 * @param {function(Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {?Object} A description of the saved asset, including a generated
 *     ID, or null if a callback is specified.
 */
ee.data.createAsset = function(value, opt_path, opt_force, opt_callback) {
  var args = {'value': value};
  if (opt_path !== undefined) {
    args['id'] = opt_path;
  }
  args['force'] = opt_force || false;
  return ee.data.send_('/create',
                       ee.data.makeRequest_(args),
                       opt_callback);
};
goog.exportSymbol('ee.data.createAsset', ee.data.createAsset);


/**
 * Create a folder.
 *
 * @param {string} path The path of the folder to create.
 * @param {boolean=} opt_force Force overwrite.
 * @param {function(Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {?Object} A description of the newly created folder.
 */
ee.data.createFolder = function(path, opt_force, opt_callback) {
  var args = {
    'id': path,
    'force': opt_force || false
  };
  return ee.data.send_('/createfolder',
                       ee.data.makeRequest_(args),
                       opt_callback);
};
goog.exportSymbol('ee.data.createFolder', ee.data.createFolder);


/**
 * Retrieve a list of Asset snippets matching a query.
 * @param {string} query Search query for assets.
 * @param {function(?Array, string=)=} opt_callback An optional
 *     callback. If not supplied, the callback is made synchronously.
 * @return {Array.<ee.data.AssetDescription>} An array of data set indices.
 */
ee.data.search = function(query, opt_callback) {
  var params = {'q': query};
  return /** @type {Array.<ee.data.AssetDescription>} */ (
      ee.data.send_('/search', ee.data.makeRequest_(params), opt_callback));
};


/**
 * Generate an ID for a long-running task.
 *
 * @param {number=} opt_count Number of IDs to generate, one by default.
 * @param {function(Array.<string>, string=)=} opt_callback An optional
 *     callback. If not supplied, the call is made synchronously.
 * @return {?Array.<string>} An array containing generated ID strings, or null
 *     if a callback is specified.
 */
ee.data.newTaskId = function(opt_count, opt_callback) {
  var params = {};
  if (goog.isNumber(opt_count)) {
    params['count'] = opt_count;
  }
  return /** @type {?Array.<string>} */ (
      ee.data.send_('/newtaskid', ee.data.makeRequest_(params), opt_callback));
};
goog.exportSymbol('ee.data.newTaskId', ee.data.newTaskId);


/**
 * Retrieve status of one or more long-running tasks.
 *
 * @param {string|!Array.<string>} taskId ID of the task or an array of
 *     multiple task IDs.
 * @param {function(Array.<ee.data.TaskStatus>, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?Array.<ee.data.TaskStatus>} Null if a callback isn't specified,
 *     otherwise an array containing one object for each queried task, in the
 *     same order as the input array.
 */
ee.data.getTaskStatus = function(taskId, opt_callback) {
  if (goog.isString(taskId)) {
    taskId = [taskId];
  } else if (!goog.isArray(taskId)) {
    throw new Error('Invalid taskId: expected a string or ' +
        'an array of strings.');
  }
  var url = '/taskstatus?q=' + taskId.join();
  return /** @type {?Array.<ee.data.TaskStatus>} */ (
      ee.data.send_(url, null, opt_callback, 'GET'));
};
goog.exportSymbol('ee.data.getTaskStatus', ee.data.getTaskStatus);


/**
 * Retrieve a list of the users tasks.
 *
 * @param {function(ee.data.TaskListResponse, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is
 *     made synchronously.
 * @return {ee.data.TaskListResponse} An array of existing tasks,
 *     or null if a callback is specified.
 */
ee.data.getTaskList = function(opt_callback) {
  var url = '/tasklist';
  return /** @type {ee.data.TaskListResponse} */ (
      ee.data.send_(url, null, opt_callback, 'GET'));
};
goog.exportSymbol('ee.data.getTaskList', ee.data.getTaskList);


/**
 * Cancels the task provided.
 *
 * @param {string} taskId ID of the task.
 * @param {function(ee.data.ProcessingResponse, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?Array.<ee.data.TaskStatus>} An array of updated tasks, or null
 *     if a callback is specified.
 */
ee.data.cancelTask = function(taskId, opt_callback) {
  return ee.data.updateTask(
      taskId, ee.data.TaskUpdateActions.CANCEL, opt_callback);
};
goog.exportSymbol('ee.data.cancelTask', ee.data.cancelTask);


/**
 * Update one or more tasks' properties. For now, only the following properties
 * may be updated: State (to CANCELLED)
 * @param {string|!Array.<string>} taskId ID of the task or an array of
 *     multiple task IDs.
 * @param {ee.data.TaskUpdateActions} action Action performed on tasks.
 * @param {function(ee.data.ProcessingResponse, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?Array.<ee.data.TaskStatus>} An array of updated tasks, or null
 *     if a callback is specified.
 */
ee.data.updateTask = function(taskId, action, opt_callback) {
  //also cancel
  if (goog.isString(taskId)) {
    taskId = [taskId];
  } else if (!goog.isArray(taskId)) {
    throw new Error('Invalid taskId: expected a string or ' +
        'an array of strings.');
  }
  if (!goog.object.containsValue(ee.data.TaskUpdateActions, action)) {
    var errorMessage = 'Invalid action: ' + action;
    throw new Error(errorMessage);
  }

  var url = '/updatetask';
  var params = {
    'id': taskId,
    'action': action
  };

  return /** @type {?Array.<ee.data.TaskStatus>} */ (
      ee.data.send_(url, ee.data.makeRequest_(params), opt_callback, 'POST'));
};
goog.exportSymbol('ee.data.updateTask', ee.data.updateTask);


/**
 * Create processing task which computes a value.
 *
 * @param {string} taskId ID for the task (obtained using newTaskId).
 * @param {Object} params The value to be evaluated, with the following
 *     possible values:
 *        json (string) A JSON object to be evaluated.
 * @param {function(ee.data.ProcessingResponse, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.ProcessingResponse} May contain field 'note' with value
 *     'ALREADY_EXISTS' if an identical task with the same ID already exists.
 *     Null if a callback is specified.
 */
ee.data.prepareValue = function(taskId, params, opt_callback) {
  params = goog.object.clone(params);
  params['tid'] = taskId;
  return /** @type {?ee.data.ProcessingResponse} */ (
      ee.data.send_('/prepare', ee.data.makeRequest_(params), opt_callback));
};
goog.exportSymbol('ee.data.prepareValue', ee.data.prepareValue);


/**
 * Create processing task that exports or pre-renders an image.
 *
 * @param {string} taskId ID for the task (obtained using newTaskId).
 * @param {Object} params The object that describes the processing task;
 *    only fields that are common for all processing types are documented here.
 *      type (string) Either 'EXPORT_IMAGE', 'EXPORT_FEATURES' or
 *      'EXPORT_VIDEO'.
 *      json (string) JSON description of the image.
 * @param {function(ee.data.ProcessingResponse, string=)=} opt_callback An
 *     optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.ProcessingResponse} May contain field 'note' with value
 *     'ALREADY_EXISTS' if an identical task with the same ID already exists.
 *     Null if a callback is specified.
 */
ee.data.startProcessing = function(taskId, params, opt_callback) {
  params = goog.object.clone(params);
  params['id'] = taskId;
  return /** @type {?ee.data.ProcessingResponse} */ (ee.data.send_(
      '/processingrequest', ee.data.makeRequest_(params), opt_callback));
};
goog.exportSymbol('ee.data.startProcessing', ee.data.startProcessing);


/**
 * Creates an asset ingestion task.
 *
 * @param {string} taskId ID for the task (obtained using newTaskId).
 * @param {ee.data.IngestionRequest} request The object that describes the
 *     ingestion.
 * @param {function(ee.data.ProcessingResponse, string=)=} opt_callback An
 *     optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.ProcessingResponse} May contain field 'note' with value
 *     'ALREADY_EXISTS' if an identical task with the same ID already exists.
 *     Null if a callback is specified.
 */
ee.data.startIngestion = function(taskId, request, opt_callback) {
  var params = {
    'id': taskId,
    'request': goog.json.serialize(request)
  };
  return /** @type {?ee.data.ProcessingResponse} */ (ee.data.send_(
      '/ingestionrequest', ee.data.makeRequest_(params), opt_callback));
};
goog.exportSymbol('ee.data.startIngestion', ee.data.startIngestion);


/**
 * Attempts to create a home root folder (e.g. "users/joe") for the current
 * user. This results in an error if the user already has a home root folder or
 * the requested ID is unavailable.
 *
 * @param {string} requestedId The requested ID of the home folder
 *     (e.g. "users/joe").
 * @param {function(!Array<ee.data.FolderDescription>, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 */
ee.data.createAssetHome = function(requestedId, opt_callback) {
  var request = ee.data.makeRequest_({'id': requestedId});
  ee.data.send_('/createbucket', request, opt_callback);
};
goog.exportSymbol('ee.data.createAssetHome', ee.data.createAssetHome);


/**
 * Returns the list of the root folders the user owns. The "id" values for roots
 * are two levels deep, e.g. "users/johndoe" not "users/johndoe/notaroot".
 *
 * @param {function(!Array<ee.data.FolderDescription>, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {Array<ee.data.FolderDescription>} The list of writable folders.
 *     Null if a callback is specified.
 */
ee.data.getAssetRoots = function(opt_callback) {
  return /** @type {Array<ee.data.FolderDescription>} */ (ee.data.send_(
      '/buckets', null, opt_callback, 'GET'));
};
goog.exportSymbol('ee.data.getAssetRoots', ee.data.getAssetRoots);


/**
 * Returns the access control list of the asset with the given ID.
 *
 * The authenticated user must be a writer or owner of an asset to see its ACL.
 *
 * @param {string} assetId The ID of the asset to check.
 * @param {function(ee.data.AssetAcl, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.AssetAcl} The asset's ACL. Null if a callback is specified.
 */
ee.data.getAssetAcl = function(assetId, opt_callback) {
  return /** @type {?ee.data.AssetAcl} */ (ee.data.send_(
      '/getacl', ee.data.makeRequest_({'id': assetId}), opt_callback, 'GET'));
};
goog.exportSymbol('ee.data.getAssetAcl', ee.data.getAssetAcl);


/**
 * Sets the access control list of the asset with the given ID.
 *
 * The owner ACL cannot be changed, and the final ACL of the asset
 * is constructed by merging the OWNER entries of the old ACL with
 * the incoming ACL record.
 *
 * The authenticated user must be a writer or owner of an asset to set its ACL.
 *
 * @param {string} assetId The ID of the asset to set the ACL on.
 * @param {ee.data.AssetAclUpdate} aclUpdate The updated ACL.
 * @param {function(Object, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 *     The callback is passed an empty object.
 */
ee.data.setAssetAcl = function(assetId, aclUpdate, opt_callback) {
  var request = {
    'id': assetId,
    'value': goog.json.serialize(aclUpdate)
  };
  ee.data.send_('/setacl', ee.data.makeRequest_(request), opt_callback);
};
goog.exportSymbol('ee.data.setAssetAcl', ee.data.setAssetAcl);


/**
 * Send an API call.
 *
 * @param {string} path The API endpoint to call.
 * @param {?goog.Uri.QueryData} params The call parameters.
 * @param {function(?, string=)=} opt_callback An optional callback.
 *     If not specified, the call is made synchronously and the response
 *     is returned.
 * @param {string=} opt_method The HTTPRequest method (GET or POST), default
 *     is POST.
 *
 * @return {?Object} The data object returned by the API call, or null if a
 *     callback was specified.
 * @private
 */
ee.data.send_ = function(path, params, opt_callback, opt_method) {
  // Make sure we never perform API calls before initialization.
  ee.data.initialize();

  var method = opt_method || 'POST';
  // WARNING: The content-type header here must use this exact capitalization
  // to remain compatible with the Node.JS environment. See:
  // https://github.com/driverdan/node-XMLHttpRequest/issues/20
  var headers = {'Content-Type': 'application/x-www-form-urlencoded'};

  // Client-side authorization.
  if (goog.isDefAndNotNull(ee.data.authToken_)) {
    headers['Authorization'] = ee.data.authToken_;
  }

  // Apply any custom param augmentation.
  params = ee.data.paramAugmenter_(params || new goog.Uri.QueryData(), path);

  // XSRF protection for a server-side API proxy.
  if (goog.isDefAndNotNull(ee.data.xsrfToken_)) {
    headers['X-XSRF-Token'] = ee.data.xsrfToken_;
  }

  // Handle processing and dispatching a callback response.
  var handleResponse = function(
      status, contentType, responseText, opt_callback) {
    var response, data, errorMessage;
    contentType = contentType ?
        contentType.replace(/;.*/, '') : 'application/json';
    if (contentType == 'application/json' || contentType == 'text/json') {
      try {
        response = goog.json.unsafeParse(responseText);
        data = response['data'];
      } catch (e) {
        errorMessage = 'Invalid JSON: ' + responseText;
      }
    } else {
      errorMessage = 'Response was unexpectedly not JSON, but ' + contentType;
    }

    // Totally malformed, with either invalid JSON or JSON with
    // neither a data nor an error property.
    if (goog.isObject(response)) {
      if ('error' in response && 'message' in response['error']) {
        errorMessage = response['error']['message'];
      } else if (!('data' in response)) {
        errorMessage = 'Malformed response: ' + responseText;
      }
    } else if (status < 200 || status >= 300) {
      errorMessage = 'Server returned HTTP code: ' + status;
    }

    if (opt_callback) {
      opt_callback(data, errorMessage);
      return null;
    } else {
      if (!errorMessage) {
        return data;
      }
      throw new Error(errorMessage);
    }
  };

  // Encode the request params in the URL if the request is a GET request.
  var requestData = params ? params.toString() : '';
  if (method == 'GET' && !goog.string.isEmpty(requestData)) {
    path += goog.string.contains(path, '?') ? '&' : '?';
    path += requestData;
    requestData = null;
  }

  var url = ee.data.apiBaseUrl_ + path;
  if (opt_callback) {
    // Send an asynchronous request.
    goog.net.XhrIo.send(
        url,
        function(e) {
          var xhrIo = e.target;

          return handleResponse(
              xhrIo.getStatus(),
              xhrIo.getResponseHeader('Content-Type'),
              xhrIo.getResponseText(),
              opt_callback);
        },
        method,
        requestData,
        headers,
        ee.data.deadlineMs_);
    return null;
  } else {
    // Send a synchronous request.
    var xmlHttp = goog.net.XmlHttp();
    xmlHttp.open(method, url, false);
    goog.object.forEach(headers, function(value, key) {
      xmlHttp.setRequestHeader(key, value);
    });
    xmlHttp.send(requestData);
    var contentType;
    try {
      contentType = xmlHttp.getResponseHeader('Content-Type');
    } catch (e) {
      // Workaround for a non-browser XMLHttpRequest shim that doesn't implement
      // getResponseHeader when synchronous.
      contentType = 'application/json';
    }
    return handleResponse(
        xmlHttp.status,
        contentType,
        xmlHttp.responseText,
        null);
  }
};


/**
 * Ensures that the Google API Client Library for JavaScript is loaded.
 * @param {function()} callback The function to call when the library is ready.
 * @private
 */
ee.data.ensureAuthLibLoaded_ = function(callback) {
  var done = function() {
    // Speed up auth request by using CORS instead of an iframe.
    goog.global['gapi']['config']['update']('client/cors', true);
    callback();
  };
  if (goog.isObject(goog.global['gapi']) &&
      goog.isObject(goog.global['gapi']['auth']) &&
      goog.isFunction(goog.global['gapi']['auth']['authorize'])) {
    done();
  } else {
    // The library is not loaded; load it now.
    var callbackName = goog.now().toString(36);
    while (callbackName in goog.global) callbackName += '_';
    goog.global[callbackName] = function() {
      delete goog.global[callbackName];
      done();
    };
    goog.net.jsloader.load(
        ee.data.AUTH_LIBRARY_URL_ + '?onload=' + callbackName);
  }
};


/**
 * Retrieves a new OAuth2 token for the currently configured ID and scopes.
 *
 * @param {function()=} opt_success The function to call if token refresh
 *     succeeds.
 * @param {function(string)=} opt_error The function to call if token refresh
 *     fails, passing the error message.
 * @param {function()=} opt_onImmediateFailed The function to call if
 *     automatic behind-the-scenes authentication fails.
 * @private
 */
ee.data.refreshAuthToken_ = function(
    opt_success, opt_error, opt_onImmediateFailed) {
  // Set up auth options.
  var authArgs = {
    'client_id': ee.data.authClientId_,
    'immediate': true,
    'scope': ee.data.authScopes_.join(' ')
  };

  // Start the authorization flow, first trying immediate mode, which tries to
  // get the token behind the scenes, with no UI shown.
  goog.global['gapi']['auth']['authorize'](authArgs, function(result) {
    if (result['error'] == 'immediate_failed' && opt_onImmediateFailed) {
      opt_onImmediateFailed();
    } else {
      ee.data.handleAuthResult_(opt_success, opt_error, result);
    }
  });
};


/**
 * Handles the result of gapi.auth.authorize(), filling ee.data.authToken_ on
 * success and setting up a refresh timeout.
 *
 * @param {function()|undefined} success The function to call if token refresh
 *     succeeds.
 * @param {function(string)|undefined} error The function to call if auth fails,
 *     passing the error message.
 * @param {Object} result The result object produced by gapi.auth.authorize().
 * @private
 */
ee.data.handleAuthResult_ = function(success, error, result) {
  if (result['access_token']) {
    ee.data.authToken_ = result['token_type'] + ' ' + result['access_token'];
    // Set up a refresh timer. This is necessary because we cannot refresh
    // synchronously, but since we want to allow synchronous API requests,
    // something must ensure that the auth token is always valid.
    if (isFinite(result['expires_in'])) {
      setTimeout(ee.data.refreshAuthToken_, result['expires_in'] * 1000 / 2);
    }
    if (success) success();
  } else if (error) {
    error(result['error'] || 'Unknown error.');
  }
};


/**
 * Convert an object into a goog.Uri.QueryData.
 *
 * @param {Object} params The params to convert.
 * @return {goog.Uri.QueryData} The converted parameters.
 * @private
 */
ee.data.makeRequest_ = function(params) {
  var request = new goog.Uri.QueryData();
  for (var item in params) {
    request.set(item, params[item]);
  }
  return request;
};


/**
 * Mock the networking calls used in send_.
 *
 * TODO(user): Make the global patching done here reversible.
 *
 * @param {Object=} opt_calls A dictionary containing the responses to return
 *     for each URL, keyed to URL.
 */
ee.data.setupMockSend = function(opt_calls) {
  var calls = opt_calls ? goog.object.clone(opt_calls) : {};

  // If the mock is set up with a string for this URL, return that.
  // If it's a function, call the function and use its return value.
  // If it's an object it has fields specifying more details.
  // If there's nothing set for this url, throw.
  function getResponse(url, method, data) {
    url = url.replace(ee.data.apiBaseUrl_, '');
    var response;
    if (url in calls) {
      response = calls[url];
    } else {
      throw new Error(url + ' mock response not specified');
    }
    if (goog.isFunction(response)) {
      response = response(url, method, data);
    }
    if (goog.isString(response)) {
      response = {
        'text': response,
        'status': 200,
        'contentType': 'application/json; charset=utf-8'
      };
    }
    if (!goog.isString(response.text)) {
      throw new Error(url + ' mock response missing/invalid text');
    }
    if (!goog.isNumber(response.status)) {
      throw new Error(url + ' mock response missing/invalid status');
    }
    return response;
  }

  // Mock XhrIo.send for async calls.
  goog.net.XhrIo.send = function(url, callback, method, data) {
    var responseData = getResponse(url, method, data);
    // An anonymous class to simulate an event.  Closure doesn't like this.
    /** @constructor */
    var fakeEvent = function() {};
    var e = new fakeEvent();
    e.target = {};
    e.target.getResponseText = function() {
      return responseData.text;
    };
    e.target.getStatus = function() {
      return responseData.status;
    };
    e.target.getResponseHeader = function(header) {
      if (header === 'Content-Type') {
        return responseData.contentType;
      } else {
        return null;
      }
    };
    // Call the callback in a timeout to simulate asynchronous behavior.
    setTimeout(goog.bind(/** @type {function()} */ (callback), e, e), 0);
    return new goog.net.XhrIo(); // Expected to be unused.
  };

  // Mock goog.net.XmlHttp for sync calls.
  /** @constructor */
  var fakeXmlHttp = function() {};
  var method = null;
  fakeXmlHttp.prototype.open = function(method, urlIn) {
    this.url = urlIn;
    this.method = method;
  };
  fakeXmlHttp.prototype.setRequestHeader = function() {};
  fakeXmlHttp.prototype.getResponseHeader = function(header) {
    if (header === 'Content-Type') {
      return this.contentType_ || null;
    } else {
      return null;
    }
  };
  fakeXmlHttp.prototype.send = function(data) {
    var responseData = getResponse(this.url, this.method, data);
    this.responseText = responseData.text;
    this.status = responseData.status;
    this.contentType_ = responseData.contentType;
  };
  goog.net.XmlHttp = function() {
    return /** @type {?} */ (new fakeXmlHttp());
  };
};


/** @enum {string} The types of assets. */
ee.data.AssetType = {
  IMAGE: 'Image',
  IMAGE_COLLECTION: 'ImageCollection',
  FOLDER: 'Folder',
  ALGORITHM: 'Algorithm',
  UNKNOWN: 'Unknown'
};


/**
 * An entry in a list returned by the /list servlet.
 * @typedef {{
 *   type: ee.data.AssetType,
 *   id: string,
 *   properties: (undefined|Object)
 * }}
 */
ee.data.ShortAssetDescription;


/**
 * A list returned by the /list servlet.
 * @typedef {Array<ee.data.ShortAssetDescription>}
 */
ee.data.AssetList;


/**
 * An access control list for an asset. The strings are all email addresses (for
 * either individuals or groups).
 * @typedef {{
 *   owners: !Array<string>,
 *   writers: !Array<string>,
 *   readers: !Array<string>,
 *   all_users_can_read: (undefined|boolean)
 * }}
 */
ee.data.AssetAcl;


/**
 * An update to an access control list for an asset. Owners cannot be changed.
 * @typedef {{
 *   writers: !Array<string>,
 *   readers: !Array<string>,
 *   all_users_can_read: (undefined|boolean)
 * }}
 */
ee.data.AssetAclUpdate;


/**
 * A description of a folder. The type value is always ee.data.AssetType.FOLDER.
 * @typedef {{
 *   type: ee.data.AssetType,
 *   id: string
 * }}
 */
ee.data.FolderDescription;


/**
 * An object describing a FeatureCollection, as returned by getValue.
 * Compatible with GeoJSON. The type field is always "FeatureCollection".
 * @typedef {{
 *   type: string,
 *   features: Array.<ee.data.GeoJSONFeature>
 * }}
 */
ee.data.FeatureCollectionDescription;


/**
 * An object describing ee.Feature visualization parameters. Color is
 * a 6-character hex string in the RRGGBB format.
 * @typedef {{
 *   color: (string|undefined)
 * }}
 */
ee.data.FeatureVisualizationParameters;


/**
 * An object that depicts a GME Project that the user may export to with
 * attribution ids for each project.
 * @typedef {{
 *   id: string,
 *   name: string,
 *   attributions: Array.<Object>
 * }}
 */
ee.data.GMEProject;


/**
 * An object describing a Feature, as returned by getValue.
 * Compatible with GeoJSON. The type field is always "Feature".
 * @typedef {{
 *   type: string,
 *   id: (undefined|string),
 *   geometry: ?ee.data.GeoJSONGeometry,
 *   properties: (undefined|Object)
 * }}
 */
ee.data.GeoJSONFeature;


/**
 * An object describing a GeoJSON Geometry, as returned by getValue.
 * @typedef {{
 *   type: string,
 *   coordinates: Array.<number|Array.<number|Array.<number|Array.<number>>>>,
 *   crs: (undefined|{
 *     type: string,
 *     properties: {
 *       name: string
 *     }
 *   }),
 *   geodesic: boolean,
 *   geometries: (undefined|Array.<ee.data.GeoJSONGeometry>)
 * }}
 */
ee.data.GeoJSONGeometry;


/**
 * An object describing an ImageCollection, as returned by getValue.
 * The type field is always "ImageCollection".
 * @typedef {{
 *   type: string,
 *   id: (undefined|string),
 *   version: (undefined|number),
 *   bands: Array.<ee.data.BandDescription>,
 *   properties: (undefined|Object),
 *   features: Array.<ee.data.ImageDescription>
 * }}
 */
ee.data.ImageCollectionDescription;


/**
 * An object describing an Image, as returned by getValue.
 * The type field is always "Image".
 * @typedef {{
 *   type: string,
 *   id: (undefined|string),
 *   version: (undefined|number),
 *   bands: Array.<ee.data.BandDescription>,
 *   properties: (undefined|Object)
 * }}
 */
ee.data.ImageDescription;


/**
 * An object describing ee.Image visualization parameters. See ee.data.getMapId.
 * @typedef {{
 *   image: ee.Image,
 *   bands: (string|Array<string>|undefined),
 *   gain: (number|Array<number>|undefined),
 *   bias: (number|Array<number>|undefined),
 *   min: (number|Array<number>|undefined),
 *   max: (number|Array<number>|undefined),
 *   gamma: (number|Array<number>|undefined),
 *   palette: (string|Array<string>|undefined),
 *   opacity: (number|undefined),
 *   format: (string|undefined)
 * }}
 */
ee.data.ImageVisualizationParameters;


/**
 * An object describing an Image band, as returned by getValue.
 * The dimensions field is [width, height].
 * @typedef {{
 *   id: string,
 *   data_type: ee.data.PixelTypeDescription,
 *   dimensions: (undefined|Array.<number>),
 *   crs: string,
 *   crs_transform: (undefined|Array.<number>),
 *   crs_transform_wkt: (undefined|string),
 *   properties: (undefined|Object)
 * }}
 */
ee.data.BandDescription;


/**
 * An object describing a PixelType, as returned by getValue.
 * The type field is always "PixelType". The precision field is
 * "int", "float" or "double".
 * @typedef {{
 *   type: string,
 *   precision: string,
 *   min: (undefined|number),
 *   max: (undefined|number),
 *   dimensions: (undefined|number)
 * }}
 */
ee.data.PixelTypeDescription;


/**
 * The registry of EE algorithms.
 *
 * @typedef {Object.<ee.data.AlgorithmSignature>}
 */
ee.data.AlgorithmsRegistry;


/**
 * The signature of an algorithm.
 *
 * @typedef {{
 *   args: Array.<ee.data.AlgorithmArgument>,
 *   returns: string,
 *   description: string,
 *   deprecated: (string|undefined)
 * }}
 */
ee.data.AlgorithmSignature;


/**
 * The signature of a single algorithm argument.
 * @typedef {{
 *   name: string,
 *   type: string,
 *   optional: boolean,
 *   default: *
 * }}
 */
ee.data.AlgorithmArgument;


/**
 * An identifier and security token for a thumbnail image.
 * @typedef {{
 *   thumbid: string,
 *   token: string
 * }}
 */
ee.data.ThumbnailId;


/**
 * An identifier and security token for an image or table to download.
 * @typedef {{
 *   docid: string,
 *   token: string
 * }}
 */
ee.data.DownloadId;


/**
 * An identifier and security token for a tiled map.
 * @typedef {{
 *     mapid: string,
 *     token: string
 * }}
 */
ee.data.RawMapId;


/**
 * A RawMapID together with the image from which it was generated.
 * @typedef {{
 *     mapid: string,
 *     token: string,
 *     image: ee.Image
 * }}
 */
ee.data.MapId;


/**
 * An object to specifying common user preferences for the creation of a new
 * task.
 *
 * @typedef {{
 *   id: (undefined|string),
 *   type: string,
 *   description: (undefined|string),
 *   sourceURL: (undefined|string),
 *   json: (undefined|string)
 * }}
 */
ee.data.AbstractTaskConfig;


/**
 * An object for specifying user preferences for the creation of a new
 * task. See com.google.earthengine.service.frontend.ProcessingInput.
 *
 * @typedef {{
 *   id: string,
 *   type: string,
 *   json: string,
 *   description: (undefined|string),
 *   sourceURL: (undefined|string),
 *   crs: (undefined|string),
 *   crs_transform: (undefined|string),
 *   dimensions: (undefined|string),
 *   scale: (undefined|number),
 *   region: (undefined|string),
 *   maxPixels: (undefined|number),
 *   gmeProjectId: (undefined|string),
 *   gmeAttributionName: (undefined|string),
 *   gmeMosaic: (undefined|string),
 *   gmeTerrain: (undefined|boolean),
 *   driveFolder: (undefined|string),
 *   driveFileNamePrefix: (undefined|string)
 * }}
 */
ee.data.ImageTaskConfig;


/**
 * An object for specifying configuration of a task to export feature
 * collections.
 *
 * @typedef {{
 *   id: string,
 *   type: string,
 *   json: string,
 *   description: (undefined|string),
 *   driveFolder: (undefined|string),
 *   driveFileNamePrefix: (undefined|string),
 *   fileFormat: (undefined|string),
 *   sourceUrl: (undefined|string),
 *   gmeProjectId: (undefined|string),
 *   gmeAttributionName: (undefined|string),
 *   gmeAssetName: (undefined|string)
 * }}
 */
ee.data.TableTaskConfig;


/**
 * An object for specifying configuration of a task to export image
 * collections as video.
 *
 * @typedef {{
 *   id: string,
 *   type: string,
 *   json: string,
 *   sourceUrl: (undefined|string),
 *   description: (undefined|string),
 *   driveFolder: (undefined|string),
 *   driveFileNamePrefix: (undefined|string),
 *   framesPerSecond: (undefined|number),
 *   crs: (undefined|string),
 *   crs_transform: (undefined|string),
 *   dimensions: (undefined|number|string),
 *   region: (undefined|string),
 *   scale: (undefined|number)
 * }}
 */
ee.data.VideoTaskConfig;


/**
 * A description of the status of a long-running tasks. See the Task
 * proto for a description of these fields.
 * @typedef {{
 *   id: (undefined|string),
 *   task_type: (undefined|string),
 *   creation_timestamp_ms: (undefined|number),
 *   update_timestamp_ms: (undefined|number),
 *   description: (undefined|string),
 *   priority: (undefined|number),
 *   progress: (undefined|number),
 *   source_url: (undefined|string),
 *   output_url: (undefined|Array.<string>),
 *   state: (undefined|string),
 *   internal_error_info: (undefined|string),
 *   error_message: (undefined|string)
 * }}
 */
ee.data.TaskStatus;


/**
 * A response for a call to start a batch process.
 * The "started" field is always "OK".
 * The note field is either "ALREADY_EXISTS" or missing.
 * @typedef {{
 *   started: string,
 *   note: (undefined|string)
 * }}
 */
ee.data.ProcessingResponse;


/**
 * A response for a call to get task status data.
 * @typedef {{
 *   tasks: Array.<ee.data.TaskStatus>
 * }}
 */
ee.data.TaskListResponse;


/**
 * A public asset description.
 * @typedef {{
 *   tags: (undefined|Array.<string>),
 *   thumb: (undefined|string),
 *   title: string,
 *   provider: string,
 *   type: string,
 *   period: number,
 *   period_mapping: (undefined|Array.<number>),
 *   description: string,
 *   id: string
 * }}
 */
ee.data.AssetDescription;


/**
 * A request to import an asset. "name" is the destination asset ID
 * (e.g. "users/yourname/assetname"). "filesets" is the list of source
 * filesets for the asset.
 *
 * @typedef {{
 *   'name': string,
 *   'filesets': !Array<ee.data.Fileset>,
 *   'bands': (undefined|!Array<ee.data.Band>)
 * }}
 */
ee.data.IngestionRequest;


/**
 * An object describing properties of a single raster band.
 * @typedef {{
 *   'name': string
 * }}
 */
ee.data.Band;


/**
 * An object describing properties of a single fileset.
 * @typedef {{
 *   'sources': !Array<ee.data.FileSource>
 * }}
 */
ee.data.Fileset;


/**
 * An object describing properties of a single raster.
 *
 * For requests sent directly through the API, paths should be Google Cloud
 * Storage object names (e.g. 'gs://bucketname/filename'). In manifests
 * uploaded through the Playground IDE, paths should be relative file
 * names (e.g. 'file1.tif').
 *
 * Extensions are the file extensions as strings and must be in order,
 * with the primary file's extension first.
 *
 * @typedef {{
 *   'primaryPath': string,
 *   'additionalPaths': (undefined|!Array<string>),
 *   'fileExtensions': (undefined|!Array<string>)
 * }}
 */
ee.data.FileSource;
