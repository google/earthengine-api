/**
 * @fileoverview Singleton for all of the library's communication
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
goog.provide('ee.data.AssetDetailsProperty');
goog.provide('ee.data.AssetList');
goog.provide('ee.data.AssetQuotaDetails');
goog.provide('ee.data.AssetType');
goog.provide('ee.data.AuthArgs');
goog.provide('ee.data.AuthPrivateKey');
goog.provide('ee.data.AuthResponse');
goog.provide('ee.data.Band');
goog.provide('ee.data.BandDescription');
goog.provide('ee.data.DownloadId');
goog.provide('ee.data.ExportDestination');
goog.provide('ee.data.ExportState');
goog.provide('ee.data.ExportType');
goog.provide('ee.data.FeatureCollectionDescription');
goog.provide('ee.data.FeatureVisualizationParameters');
goog.provide('ee.data.FileBand');
goog.provide('ee.data.FileSource');
goog.provide('ee.data.FolderDescription');
goog.provide('ee.data.GeoJSONFeature');
goog.provide('ee.data.GeoJSONGeometry');
goog.provide('ee.data.ImageCollectionDescription');
goog.provide('ee.data.ImageDescription');
goog.provide('ee.data.ImageTaskConfig');
goog.provide('ee.data.ImageVisualizationParameters');
goog.provide('ee.data.IngestionRequest');
goog.provide('ee.data.MapId');
goog.provide('ee.data.MapTaskConfig');
goog.provide('ee.data.MapZoomRange');
goog.provide('ee.data.MissingData');
goog.provide('ee.data.PixelTypeDescription');
goog.provide('ee.data.ProcessingResponse');
goog.provide('ee.data.PyramidingPolicy');
goog.provide('ee.data.RawMapId');
goog.provide('ee.data.ShortAssetDescription');
goog.provide('ee.data.SystemTimeProperty');
goog.provide('ee.data.TableDescription');
goog.provide('ee.data.TableTaskConfig');
goog.provide('ee.data.TaskListResponse');
goog.provide('ee.data.TaskStatus');
goog.provide('ee.data.TaskUpdateActions');
goog.provide('ee.data.ThumbnailId');
goog.provide('ee.data.Tileset');
goog.provide('ee.data.VideoTaskConfig');
goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.async.Throttle');
goog.require('goog.functions');
goog.require('goog.html.TrustedResourceUrl');
goog.require('goog.json');
goog.require('goog.net.XhrIo');
goog.require('goog.net.XmlHttp');
goog.require('goog.net.jsloader');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.string.Const');
goog.forwardDeclare('ee.Element');
goog.forwardDeclare('ee.Image');



////////////////////////////////////////////////////////////////////////////////
//                       Authentication token management.                     //
////////////////////////////////////////////////////////////////////////////////


/**
 * Configures client-side authentication of EE API calls through the
 * Google APIs Client Library for JavaScript. The library will be loaded
 * automatically if it is not already loaded on the page. The user will be
 * asked to grant the application identified by clientId access to their EE
 * data if they have not done so previously.
 *
 * This or another authentication method should be called before
 * ee.initialize().
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
 * The auth token will be refreshed automatically when possible. You can safely
 * assume that all async calls will be sent with the appropriate credentials.
 * For synchronous calls, however, you should check for an auth token with
 * ee.data.getAuthToken() and call ee.data.refreshAuthToken() manually if there
 * is none. The token refresh operation is asynchronous and cannot be performed
 * behind-the-scenes on-demand prior to synchronous calls.
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
ee.data.authenticateViaOauth = function(
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
    ee.data.refreshAuthToken(success, opt_error, onImmediateFailed);
  });
};


/**
 * Configures client-side OAuth authentication. Alias of
 * ee.data.authenticateViaOauth().
 *
 * @deprecated Use ee.data.authenticateViaOauth().
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
  ee.data.authenticateViaOauth(
      clientId, success, opt_error, opt_extraScopes, opt_onImmediateFailed);
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
 * Configures server-side authentication of EE API calls through the
 * Google APIs Node.js Client. Private key authentication is strictly for
 * server-side API calls: for browser-based applications, use
 * ee.data.authenticateViaOauth(). No user interaction (e.g. authentication
 * popup) is necessary when using server-side authentication.
 *
 * This or another authentication method should be called before
 * ee.initialize().
 *
 * The auth token will be refreshed automatically when possible. You can safely
 * assume that all async calls will be sent with the appropriate credentials.
 * For synchronous calls, however, you should check for an auth token with
 * ee.data.getAuthToken() and call ee.data.refreshAuthToken() manually if there
 * is none. The token refresh operation is asynchronous and cannot be performed
 * behind-the-scenes, on demand, prior to synchronous calls.
 *
 * @param {!ee.data.AuthPrivateKey} privateKey JSON content of private key.
 * @param {function()=} opt_success The function to call if authentication
 *     succeeded.
 * @param {function(string)=} opt_error The function to call if authentication
 *     failed, passed the error message.
 * @param {!Array<string>=} opt_extraScopes Extra OAuth scopes to request.
 * @export
 */
ee.data.authenticateViaPrivateKey = function(
    privateKey, opt_success, opt_error, opt_extraScopes) {

  // Verify that the context is Node.js, not a web browser.
  if ('window' in goog.global) {
    throw new Error(
        'Use of private key authentication in the browser is insecure. ' +
        'Consider using OAuth, instead.');
  }

  var scopes = [ee.data.AUTH_SCOPE_, ee.data.STORAGE_SCOPE_];
  if (opt_extraScopes) {
    goog.array.extend(scopes, opt_extraScopes);
    goog.array.removeDuplicates(scopes);
  }
  ee.data.authClientId_ = privateKey.client_email;
  ee.data.authScopes_ = scopes;

  // Initialize JWT client to authorize as service account.
  var jwtClient = new googleapis.auth.JWT(
      privateKey.client_email, null, privateKey.private_key, scopes, null);

  // Configure authentication refresher to use JWT client.
  ee.data.setAuthTokenRefresher(function(authArgs, callback) {
    jwtClient.authorize(function(error, token) {
      if (error) {
        callback({'error': error});
      } else {
        callback({
          'access_token': token.access_token,
          'token_type': token.token_type,
          'expires_in': (token.expiry_date - Date.now()) / 1000,
        });
      }
    });
  });

  ee.data.refreshAuthToken(opt_success, opt_error);
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
    if (opt_callback) {
      opt_callback();
    }
  } else {
    ee.data.ensureAuthLibLoaded_(function() {
      goog.global['gapi']['auth']['setToken'](tokenObject);
      if (opt_callback) {
        opt_callback();
      }
    });
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
 */
ee.data.refreshAuthToken = function(
    opt_success, opt_error, opt_onImmediateFailed) {
  if (!ee.data.isAuthTokenRefreshingEnabled_()) {
    return;
  }

  // Set up auth options.
  var authArgs = {
    'client_id': String(ee.data.authClientId_),
    'immediate': true,
    'scope': ee.data.authScopes_.join(' ')
  };

  // Start the authorization flow, first trying immediate mode, which tries to
  // get the token behind the scenes, with no UI shown.
  ee.data.authTokenRefresher_(authArgs, function(result) {
    if (result.error == 'immediate_failed' && opt_onImmediateFailed) {
      opt_onImmediateFailed();
    } else {
      ee.data.handleAuthResult_(opt_success, opt_error, result);
    }
  });
};


/**
 * Sets the current OAuth token refresher. By default, automatically set to
 * gapi.auth.authorize() after the auth library loads. Set to null to disable
 * token refreshing.
 *
 * @param {?function(!ee.data.AuthArgs, function(!ee.data.AuthResponse))}
 *     refresher A function that takes as input 1) auth arguments and
 *     2) a callback to which it passes an auth response object upon
 *     completion.
 * @export
 */
ee.data.setAuthTokenRefresher = function(refresher) {
  ee.data.authTokenRefresher_ = refresher;
};


/**
 * Returns the current valid OAuth token, if any.
 *
 * Use ee.data.setAuthToken() or ee.data.authenticate() to set an auth token.
 *
 * @return {?string} The string to pass in the Authorization header of XHRs.
 * @export
 */
ee.data.getAuthToken = function() {
  var isExpired = ee.data.authTokenExpiration_ &&
                  (goog.now() - ee.data.authTokenExpiration_) >= 0;
  if (isExpired) {
    ee.data.clearAuthToken();
  }
  return ee.data.authToken_;
};


/**
 * Clears the current OAuth token by setting it to null.
 *
 * @export
 */
ee.data.clearAuthToken = function() {
  ee.data.authToken_ = null;
  ee.data.authTokenExpiration_ = null;
};


/**
 * Returns the current OAuth client ID; null unless ee.data.setAuthToken() or
 * ee.data.authenticate() previously suceeded.
 *
 * @return {?string} The OAuth2 client ID for client-side authentication.
 * @export
 */
ee.data.getAuthClientId = function() {
  return ee.data.authClientId_;
};


/**
 * Returns the current OAuth scopes; empty unless ee.data.setAuthToken() or
 * ee.data.authenticate() previously suceeded.
 *
 * @return {!Array<string>} The OAuth2 scopes for client-side authentication.
 * @export
 */
ee.data.getAuthScopes = function() {
  return ee.data.authScopes_;
};


////////////////////////////////////////////////////////////////////////////////
//                                Initialization.                             //
////////////////////////////////////////////////////////////////////////////////


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
 * @export
 */
ee.data.setParamAugmenter = function(augmenter) {
  ee.data.paramAugmenter_ = augmenter || goog.functions.identity;
};


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
 * Get the list of algorithms.
 *
 * @param {function(!ee.data.AlgorithmsRegistry, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.AlgorithmsRegistry} The list of algorithm
 *     signatures, or null if a callback is specified.
 */
ee.data.getAlgorithms = function(opt_callback) {
  const result = ee.data.send_('/algorithms', null, opt_callback, 'GET');
  if (!opt_callback) {
    return /** @type {!ee.data.AlgorithmsRegistry} */ (result);
  }

  return null;
};


////////////////////////////////////////////////////////////////////////////////
//                      Main computation entry points.                        //
////////////////////////////////////////////////////////////////////////////////


/**
 * Get a Map ID for a given asset
 * @param {!ee.data.ImageVisualizationParameters} params
 *     The visualization parameters as a (client-side) JavaScript object.
 *     For Images and ImageCollections:
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
 * @param {function(!ee.data.RawMapId, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.RawMapId} The mapId call results, or null if a callback
 *     is specified.
 * @export
 */
ee.data.getMapId = function(params, opt_callback) {
  params = /** @type {!ee.data.ImageVisualizationParameters} */ (
      goog.object.clone(params));
  if (!goog.isString(params.image)) {
    params.image = params.image.serialize();
  }
  const makeMapId = (result) => ee.data.makeMapId_(
      result['mapid'], result['token'], '/map/{}', '?token={}');
  if (opt_callback) {
    ee.data.send_('/mapid', ee.data.makeRequest_(params),
        (result, err) => opt_callback(result && makeMapId(result), err));
    return null;
  } else {
    return makeMapId(ee.data.send_('/mapid', ee.data.makeRequest_(params)));
  }
};


/**
 * Generate a URL for map tiles from a Map ID and coordinates.
 * @param {!ee.data.RawMapId} mapid The mapid to generate tiles for.
 * @param {number} x The tile x coordinate.
 * @param {number} y The tile y coordinate.
 * @param {number} z The tile zoom level.
 * @return {string} The tile URL.
 * @export
 */
ee.data.getTileUrl = function(mapid, x, y, z) {
  return mapid.formatTileUrl(x, y, z);
};


/**
 * Constructs a RawMapId, with formatTileUrl configured by path and suffix.
 * @param {string} mapid Map ID.
 * @param {string} token Token.
 * @param {string} path appended to tileBaseUrl. {} is replaced by mapid.
 * @param {string} suffix appended after tile coordinates. {} replaced by token.
 * @return {!ee.data.RawMapId}
 * @private
 */
ee.data.makeMapId_ = function(mapid, token, path, suffix) {
  path = ee.data.tileBaseUrl_ + path.replace('{}', mapid);
  suffix = suffix.replace('{}', token);
  // Builds a URL of the form {tileBaseUrl}{path}/{z}/{x}/{y}{suffix}
  const formatTileUrl = (x, y, z) => {
    const width = Math.pow(2, z);
    x = x % width;
    if (x < 0) {
      x += width;
    }
    return [path, z, x, y].join('/') + suffix;
  };
  return {mapid, token, formatTileUrl};
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
 * Sends a request to compute a value.
 * @param {*} obj
 * @param {function(*)=} opt_callback
 */
ee.data.computeValue = function(obj, opt_callback) {
  const params = {'json': ee.Serializer.toJSON(obj)};
  return ee.data.send_('/value', ee.data.makeRequest_(params), opt_callback);
};


/**
 * Get a Thumbnail Id for a given asset.
 * @param {!ee.data.ThumbnailOptions} params Parameters identical to those for
 *     the visParams for getMapId with the following additions:
 *       - dimensions (a number or pair of numbers in format WIDTHxHEIGHT)
 *             Maximum dimensions of the thumbnail to render, in pixels. If
 *             only one number is passed, it is used as the maximum, and
 *             the other dimension is computed by proportional scaling.
 *       - region (E,S,W,N or GeoJSON) Geospatial region of the image
 *             to render. By default, the whole image.
 *       - format (string) Either 'png' (default) or 'jpg'.
 * @param {function(!ee.data.ThumbnailId, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.ThumbnailId} The thumb ID and token, or null if a
 *     callback is specified.
 * @export
 */
ee.data.getThumbId = function(params, opt_callback) {
  params = goog.object.clone(params);
  if (!goog.isString(params['image'])) {
    params['image'] = params['image'].serialize();
  }
  if (goog.isArray(params['dimensions'])) {
    params['dimensions'] = params['dimensions'].join('x');
  }
  var request = ee.data.makeRequest_(params).add('getid', '1');
  return /** @type {?ee.data.ThumbnailId} */(
      ee.data.send_('/thumb', request, opt_callback));
};


/**
 * Create a thumbnail URL from a thumbid and token.
 * @param {!ee.data.ThumbnailId} id A thumbnail ID and token.
 * @return {string} The thumbnail URL.
 * @export
 */
ee.data.makeThumbUrl = function(id) {
  return ee.data.tileBaseUrl_ + '/api/thumb?thumbid=' + id.thumbid +
      '&token=' + id.token;
};


/**
 * Get a Download ID.
 * @param {!Object} params An object containing download options with the
 *     following possible values:
 *   - id: The ID of the image to download.
 *   - name: a base name to use when constructing filenames.
 *   - bands: a description of the bands to download. Must be an array of
 *         dictionaries, each with the following keys:
 *     + id: the name of the band, a string, required.
 *     + crs: an optional CRS string defining the band projection.
 *     + crs_transform: an optional array of 6 numbers specifying an affine
 *           transform from the specified CRS, in the order: xScale, xShearing,
 *           xTranslation, yShearing, yScale, and yTranslation.
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
 * @param {function(?ee.data.DownloadId, string=)=} opt_callback An optional
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
 * @param {!ee.data.DownloadId} id A download id and token.
 * @return {string} The download URL.
 * @export
 */
ee.data.makeDownloadUrl = function(id) {
  // TODO(user): Redirect to makeImageDownloadUrl.
  return ee.data.tileBaseUrl_ + '/api/download?docid=' + id.docid +
      '&token=' + id.token;
};


/**
 * Get a download ID.
 * @param {Object} params An object containing table download options with the
 *     following possible values:
 *   - format: The download format, CSV or JSON.
 *   - selectors: Comma separated string of selectors that can be used to
 *          determine which attributes will be downloaded.
 *   - filename: The name of the file that will be downloaded.
 * @param {function(!ee.data.DownloadId, string=)=} opt_callback An optional
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
 * @param {!ee.data.DownloadId} id A table download id and token.
 * @return {string} The download URL.
 * @export
 */
ee.data.makeTableDownloadUrl = function(id) {
  return ee.data.tileBaseUrl_ + '/api/table?docid=' + id.docid +
      '&token=' + id.token;
};


/**
 * If hook is not null, enables profiling for all API calls begun during the
 * execution of the body function and call the hook function with all resulting
 * profile IDs. If hook is null, disables profiling (or leaves it disabled).
 *
 * @param {?function(string)} hook
 *     A function to be called whenever there is new profile data available,
 *     with the profile ID as an argument.
 * @param {function():*} body Will be called once, with profiling enabled for
 *     all API calls made by it.
 * @param {*=} opt_this
 * @return {*}
 * @export
 */
ee.data.withProfiling = function(hook, body, opt_this) {
  var saved = ee.data.profileHook_;
  try {
    ee.data.profileHook_ = hook;
    return body.call(opt_this);
  } finally {
    ee.data.profileHook_ = saved;
  }
};


////////////////////////////////////////////////////////////////////////////////
//                              Task management.                              //
////////////////////////////////////////////////////////////////////////////////


/**
 * Generate an ID for a long-running task.
 *
 * @param {number=} opt_count The number of IDs to generate, one by default.
 * @param {function(Array.<string>, string=)=} opt_callback An optional
 *     callback. If not supplied, the call is made synchronously.
 * @return {?Array.<string>} An array containing generated ID strings, or null
 *     if a callback is specified.
 * @export
 */
ee.data.newTaskId = function(opt_count, opt_callback) {
  var params = {};
  if (goog.isNumber(opt_count)) {
    params['count'] = opt_count;
  }
  return /** @type {?Array.<string>} */ (
      ee.data.send_('/newtaskid', ee.data.makeRequest_(params), opt_callback));
};


/**
 * Retrieve status of one or more long-running tasks.
 *
 * @param {string|!Array.<string>} taskId ID of the task or an array of
 *     multiple task IDs.
 * @param {function(?Array.<!ee.data.TaskStatus>, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?Array.<!ee.data.TaskStatus>} Null if a callback isn't specified,
 *     otherwise an array containing one object for each queried task, in the
 *     same order as the input array.
 * @export
 */
ee.data.getTaskStatus = function(taskId, opt_callback) {
  var url = '/taskstatus?q=' + ee.data.makeStringArray_(taskId).join();
  return /** @type {?Array.<!ee.data.TaskStatus>} */ (
      ee.data.send_(url, null, opt_callback, 'GET'));
};


/**
 * @param {string|!Array<string>} value
 * @return {!Array<string>} Unchanged if already an array, else [value].
 * @private
 */
ee.data.makeStringArray_ = function(value) {
  if (goog.isString(value)) {
    return [value];
  } else if (goog.isArray(value)) {
    return value;
  }
  throw new Error('Invalid value: expected a string or an array of strings.');
};


/**
 * The maximum number of tasks to retrieve in each request to "/tasklist".
 * @private @const {number}
 */
ee.data.TASKLIST_PAGE_SIZE_ = 500;


/**
 * Retrieve a list of the users tasks.
 *
 * @param {?function(?ee.data.TaskListResponse, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is
 *     made synchronously.
 * @return {?ee.data.TaskListResponse} An array of existing tasks,
 *     or null if a callback is specified.
 * @export
 */
ee.data.getTaskList = function(opt_callback) {
  return ee.data.getTaskListWithLimit(undefined, opt_callback);
};


/**
 * Retrieve a list of the users tasks.
 *
 * @param {number=} opt_limit An optional limit to the number of tasks returned.
 *     If not supplied, all tasks are returned.
 * @param {?function(?ee.data.TaskListResponse, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is
 *     made synchronously.
 * @return {?ee.data.TaskListResponse} An array of existing tasks,
 *     or null if a callback is specified.
 * @export
 */
ee.data.getTaskListWithLimit = function(opt_limit, opt_callback) {
  var url = '/tasklist';
  var taskListResponse = {'tasks': []};

  // buildParams returns a configured params object.
  function buildParams(pageToken) {
    const params = {'pagesize': ee.data.TASKLIST_PAGE_SIZE_};
    if (opt_limit) {
      // pagesize is the lesser of TASKLIST_PAGE_SIZE_ and the number of
      // remaining tasks to retrieve.
      params['pagesize'] = Math.min(
          params['pagesize'], opt_limit - taskListResponse.tasks.length);
    }
    if (pageToken) {
      params['pagetoken'] = pageToken;
    }
    return params;
  }

  // inner retrieves the task list asynchronously and calls callback with a
  // response/error when done.
  function inner(callback, opt_pageToken) {
    const params = buildParams(opt_pageToken);
    ee.data.send_(url, ee.data.makeRequest_(params), function(resp, err) {
      if (err) {
        callback(taskListResponse, err);
        return;
      }
      goog.array.extend(taskListResponse.tasks, resp.tasks);
      if (!resp.next_page_token ||
          (opt_limit && taskListResponse.tasks.length >= opt_limit)) {
        callback(taskListResponse);
      } else {
        inner(callback, resp.next_page_token);
      }
    }, 'GET');
  }

  if (opt_callback) {
    // Handle the asynchronous case.
    inner(opt_callback);
    return null;
  } else {
    // Handle the synchronous case.
    let nextPageToken = '';
    while (true) {
      const params = buildParams(nextPageToken);
      const resp = /** @type {?ee.data.TaskListResponse} */ (
          ee.data.send_(url, ee.data.makeRequest_(params), undefined, 'GET'));
      goog.array.extend(taskListResponse.tasks, resp.tasks);
      nextPageToken = resp.next_page_token;

      if (!resp.next_page_token ||
          (opt_limit && taskListResponse.tasks.length >= opt_limit)) {
        break;
      }
    }
  }
  return /** @type {?ee.data.TaskListResponse} */ (taskListResponse);
};


/**
 * Cancels the task provided.
 *
 * @param {string} taskId ID of the task.
 * @param {function(ee.data.ProcessingResponse, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?Array.<ee.data.TaskStatus>} An array of updated tasks, or null
 *     if a callback is specified.
 * @export
 */
ee.data.cancelTask = function(taskId, opt_callback) {
  return ee.data.updateTask(
      taskId, ee.data.TaskUpdateActions.CANCEL, opt_callback);
};


/**
 * Update one or more tasks' properties. For now, only the following properties
 * may be updated: State (to CANCELLED)
 * @param {string|!Array.<string>} taskId ID of the task or an array of
 *     multiple task IDs.
 * @param {!ee.data.TaskUpdateActions} action Action performed on tasks.
 * @param {function(?ee.data.ProcessingResponse, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?Array.<!ee.data.TaskStatus>} An array of updated tasks, or null
 *     if a callback is specified.
 * @export
 */
ee.data.updateTask = function(taskId, action, opt_callback) {
  if (!goog.object.containsValue(ee.data.TaskUpdateActions, action)) {
    var errorMessage = 'Invalid action: ' + action;
    throw new Error(errorMessage);
  }
  taskId = ee.data.makeStringArray_(taskId);

  var url = '/updatetask';
  var params = {
    'id': taskId,
    'action': action
  };

  return /** @type {?Array.<!ee.data.TaskStatus>} */ (
      ee.data.send_(url, ee.data.makeRequest_(params), opt_callback, 'POST'));
};


/**
 * Create processing task that exports or pre-renders an image.
 *
 * @param {string} taskId ID for the task (obtained using newTaskId).
 * @param {Object} params The object that describes the processing task;
 *    only fields that are common for all processing types are documented here.
 *      type (string) Either 'EXPORT_IMAGE', 'EXPORT_FEATURES',
 *      'EXPORT_VIDEO', 'EXPORT_VIDEO_MAP' or 'EXPORT_TILES'.
 *      json (string) JSON description of the image.
 * @param {function(ee.data.ProcessingResponse, string=)=} opt_callback An
 *     optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.ProcessingResponse} May contain field 'note' with value
 *     'ALREADY_EXISTS' if an identical task with the same ID already exists.
 *     Null if a callback is specified.
 * @export
 */
ee.data.startProcessing = function(taskId, params, opt_callback) {
  params = goog.object.clone(params);
  if (goog.isDefAndNotNull(params['element'])) {
    params['json'] = params['element'].serialize();
    delete params['element'];
  }
  params['id'] = taskId;
  return /** @type {?ee.data.ProcessingResponse} */ (ee.data.send_(
      '/processingrequest', ee.data.makeRequest_(params), opt_callback));
};


/**
 * Creates an image asset ingestion task.
 *
 * @param {string} taskId ID for the task (obtained using newTaskId).
 * @param {!ee.data.IngestionRequest} request The object that describes the
 *     ingestion.
 * @param {function(?ee.data.ProcessingResponse, string=)=} opt_callback An
 *     optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.ProcessingResponse} May contain field 'note' with value
 *     'ALREADY_EXISTS' if an identical task with the same ID already exists.
 *     Null if a callback is specified.
 * @export
 */
ee.data.startIngestion = function(taskId, request, opt_callback) {
  var params = {
    'id': taskId,
    'request': goog.json.serialize(request)
  };
  return /** @type {?ee.data.ProcessingResponse} */ (ee.data.send_(
      '/ingestionrequest', ee.data.makeRequest_(params), opt_callback));
};


////////////////////////////////////////////////////////////////////////////////
//                             Asset management.                              //
////////////////////////////////////////////////////////////////////////////////


/**
 * Load info for an asset, given an asset id.
 *
 * @param {string} id The asset to be retrieved.
 * @param {function(!Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {?Object} The value call results, or null if a callback is specified.
 * @export
 */
ee.data.getAsset = function(id, opt_callback) {
  return ee.data.send_('/info',
                       new goog.Uri.QueryData().add('id', id),
                       opt_callback);
};
ee.data.cloudApiSymbols.push('getAsset');

/**
 * Load info for an asset, given an asset id.
 *
 * @param {string} id The asset to be retrieved.
 * @param {function(!Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {?Object} The value call results, or null if a callback is specified.
 * @export
 */
ee.data.getInfo = ee.data.getAsset;


/**
 * Returns a list of the contents in an asset collection or folder.
 *
 * @param {!Object} params An object containing request parameters with
 *     the following possible values:
 *       - id (string) The asset id of the collection to list.
 *       - starttime (number) Start time, in msec since the epoch.
 *       - endtime (number) End time, in msec since the epoch.
 *       - fields (comma-separated strings) Field names to return.
 * @param {function(?ee.data.AssetList, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.AssetList} The list call results, or null if a callback
 *     is specified.
 * @export
 */
ee.data.getList = function(params, opt_callback) {
  var request = ee.data.makeRequest_(params);
  return /** @type {?ee.data.AssetList} */ (
      ee.data.send_('/list', request, opt_callback));
};


/**
 * Returns the list of the root folders the user owns. The "id" values for roots
 * are two levels deep, e.g. "users/johndoe" not "users/johndoe/notaroot".
 *
 * @param {function(?Array<!ee.data.FolderDescription>, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?Array<!ee.data.FolderDescription>} The list of writable folders.
 *     Null if a callback is specified.
 * @export
 */
ee.data.getAssetRoots = function(opt_callback) {
  return /** @type {?Array<!ee.data.FolderDescription>} */ (ee.data.send_(
      '/buckets', null, opt_callback, 'GET'));
};


/**
 * Attempts to create a home root folder (e.g. "users/joe") for the current
 * user. This results in an error if the user already has a home root folder or
 * the requested ID is unavailable.
 *
 * @param {string} requestedId The requested ID of the home folder
 *     (e.g. "users/joe").
 * @param {function(?Array<!ee.data.FolderDescription>, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @export
 */
ee.data.createAssetHome = function(requestedId, opt_callback) {
  var request = ee.data.makeRequest_({'id': requestedId});
  ee.data.send_('/createbucket', request, opt_callback);
};


/**
 * Creates an asset from a JSON value. To create an empty image collection
 * or folder, pass in a "value" object with a "type" key whose value is
 * one of ee.data.AssetType.* (i.e. "ImageCollection" or "Folder").
 *
 * @param {!Object|string} value An object describing the asset to create or
 *     a JSON string with the already-serialized value for the new asset.
 * @param {string=} opt_path An optional desired ID, including full path.
 * @param {boolean=} opt_force Force overwrite.
 * @param {!Object=} opt_properties The keys and values of the properties to set
       on the created asset.
 * @param {function(?Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {?Object} A description of the saved asset, including a generated
 *     ID, or null if a callback is specified.
 * @export
 */
ee.data.createAsset = function(
    value, opt_path, opt_force, opt_properties, opt_callback) {
  if (!goog.isString(value)) {
    value = goog.json.serialize(value);
  }
  var args = {'value': value};
  if (opt_path !== undefined) {
    args['id'] = opt_path;
  }
  args['force'] = opt_force || false;
  if (opt_properties != undefined) {
    args['properties'] = goog.json.serialize(opt_properties);
  }
  return ee.data.send_('/create',
                       ee.data.makeRequest_(args),
                       opt_callback);
};


/**
 * Creates an asset folder.
 *
 * @param {string} path The path of the folder to create.
 * @param {boolean=} opt_force Force overwrite.
 * @param {function(!Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {?Object} A description of the newly created folder.
 * @export
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


/**
 * Retrieves a list of public assets matching a query.
 *
 * @param {string} query Search query for assets.
 * @param {function(?Array, string=)=} opt_callback An optional
 *     callback. If not supplied, the callback is made synchronously.
 * @return {!Array.<!ee.data.AssetDescription>} An array of data set indices.
 */
ee.data.search = function(query, opt_callback) {
  var params = {'q': query};
  return /** @type {!Array.<!ee.data.AssetDescription>} */ (
      ee.data.send_('/search', ee.data.makeRequest_(params), opt_callback));
};


/**
 * Renames the asset from sourceId to destinationId.
 *
 * @param {string} sourceId The ID of the asset to rename.
 * @param {string} destinationId The new ID of the asset.
 * @param {function(!Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously. The callback is
 *     passed an empty object and an error message, if any.
 * @export
 */
ee.data.renameAsset = function(sourceId, destinationId, opt_callback) {
  var params = {'sourceId': sourceId, 'destinationId': destinationId};
  ee.data.send_('/rename', ee.data.makeRequest_(params), opt_callback);
};


/**
 * Copies the asset from sourceId into destinationId.
 *
 * @param {string} sourceId The ID of the asset to copy.
 * @param {string} destinationId The ID of the new asset created by copying.
 * @param {function(?Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously. The callback is
 *     passed an empty object and an error message, if any.
 * @export
 */
ee.data.copyAsset = function(sourceId, destinationId, opt_callback) {
  var params = {'sourceId': sourceId, 'destinationId': destinationId};
  ee.data.send_('/copy', ee.data.makeRequest_(params), opt_callback);
};


/**
 * Deletes the asset with the given id.
 *
 * @param {string} assetId The ID of the asset to delete.
 * @param {function(?Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously. The callback is
 *     passed an empty object and an error message, if any.
 * @export
 */
ee.data.deleteAsset = function(assetId, opt_callback) {
  var params = {'id': assetId};
  ee.data.send_('/delete', ee.data.makeRequest_(params), opt_callback);
};


/**
 * Returns the access control list of the asset with the given ID.
 *
 * The authenticated user must be a writer or owner of an asset to see its ACL.
 *
 * @param {string} assetId The ID of the asset to check.
 * @param {function(!ee.data.AssetAcl, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.AssetAcl} The asset's ACL. Null if a callback is specified.
 * @export
 */
ee.data.getAssetAcl = function(assetId, opt_callback) {
  return /** @type {?ee.data.AssetAcl} */ (ee.data.send_(
      '/getacl', ee.data.makeRequest_({'id': assetId}), opt_callback, 'GET'));
};


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
 * @param {!ee.data.AssetAclUpdate} aclUpdate The updated ACL.
 * @param {function(?Object, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 *     The callback is passed an empty object.
 * @export
 */
ee.data.setAssetAcl = function(assetId, aclUpdate, opt_callback) {
  var request = {
    'id': assetId,
    'value': goog.json.serialize(aclUpdate)
  };
  ee.data.send_('/setacl', ee.data.makeRequest_(request), opt_callback);
};


/**
 * Sets metadata properties of the asset with the given ID.
 * To delete a property, set its value to null.
 * The authenticated user must be a writer or owner of the asset.
 *
 * @param {string} assetId The ID of the asset to update.
 * @param {!Object} properties The keys and values of the properties to update.
 * @param {function(?Object, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 *     The callback is passed an empty object.
 * @export
 */
ee.data.setAssetProperties = function(assetId, properties, opt_callback) {
  var request = {
    'id': assetId,
    'properties': goog.json.serialize(properties)
  };
  ee.data.send_('/setproperties', ee.data.makeRequest_(request), opt_callback);
};


/**
 * Returns quota usage details for the asset root with the given ID.
 *
 * Usage notes:
 *
 *   - The id *must* be a root folder like "users/foo" (not "users/foo/bar").
 *   - The authenticated user must own the asset root to see its quota usage.
 *
 * @param {string} rootId The ID of the asset root to check, e.g. "users/foo".
 * @param {function(!ee.data.AssetQuotaDetails, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.AssetQuotaDetails} The asset root's quota usage details.
 *     Null if a callback is specified.
 * @export
 */
ee.data.getAssetRootQuota = function(rootId, opt_callback) {
  return /** @type {?ee.data.AssetQuotaDetails} */ (ee.data.send_(
      '/quota',
      ee.data.makeRequest_({'id': rootId}),
      opt_callback,
      'GET'));
};


////////////////////////////////////////////////////////////////////////////////
//                               Types and enums.                             //
////////////////////////////////////////////////////////////////////////////////


/**
 * The types of assets. Note that the server describes table assets as
 * feature collections, though they should be described to users as tables.
 * @enum {string}
 */
ee.data.AssetType = {
  ALGORITHM: 'Algorithm',
  FOLDER: 'Folder',
  IMAGE: 'Image',
  IMAGE_COLLECTION: 'ImageCollection',
  TABLE: 'Table',
  UNKNOWN: 'Unknown'
};


/** @enum {string} The types of export. */
ee.data.ExportType = {
  IMAGE: 'EXPORT_IMAGE',
  MAP: 'EXPORT_TILES',
  TABLE: 'EXPORT_FEATURES',
  VIDEO: 'EXPORT_VIDEO',
  VIDEO_MAP: 'EXPORT_VIDEO_MAP'
};

/** @enum {string} The status of the export. */
ee.data.ExportState = {
  UNSUBMITTED: 'UNSUBMITTED',
  READY: 'READY',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCEL_REQUESTED: 'CANCEL_REQUESTED',
  CANCELLED: 'CANCELLED',
};

/** @enum {string} The destination of the export. */
ee.data.ExportDestination = {
  DRIVE: 'DRIVE',
  GCS: 'GOOGLE_CLOUD_STORAGE',
  ASSET: 'ASSET',
};


/** @enum {string} The names of the EE system time asset properties. */
ee.data.SystemTimeProperty = {
  'START': 'system:time_start',
  'END': 'system:time_end'
};


/** @const {string} The name of the EE system asset size property. */
ee.data.SYSTEM_ASSET_SIZE_PROPERTY = 'system:asset_size';


/**
 * @enum {string} The names of the editable EE system asset properties.
 *   The title property contains the human readable name of the asset, e.g.
 *     "My Map Asset 2016".
 *   The description property contains an HTML description of the asset.
 *     Should be sanitized before being rendered.
 *   The provider_url contains a url to more info about the asset/provider,
 *     e.g. "http://www.providerwebsite.com"
 *   The tags property contains a list of tags relevant to the asset, e.g.
 *     "landcover, global" etc.
 */
ee.data.AssetDetailsProperty = {
  TITLE: 'system:title',
  DESCRIPTION: 'system:description',
  TAGS: 'system:tags'
};


ee.data.ALLOWED_DESCRIPTION_HTML_TABLE_ELEMENTS_ = [
  'col', 'colgroup', 'caption', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead',
  'tr'
];


/**
 * The HTML element names that should be allowed in asset descriptions.
 * @const {!Array<string>}
 */
ee.data.ALLOWED_DESCRIPTION_HTML_ELEMENTS =
    ee.data.ALLOWED_DESCRIPTION_HTML_TABLE_ELEMENTS_.concat([
      'a', 'code', 'em', 'i', 'li', 'ol', 'p', 'strong', 'sub', 'sup', 'ul'
    ]);


/**
 * An entry in a list returned by the /list servlet.
 * @record @struct
 */
ee.data.ShortAssetDescription = class {
  constructor() {
    /**
     * @export {!ee.data.AssetType}
     */
    this.type;

    /**
     * @export {string}
     */
    this.id;

    /**
     * @export {!Object|undefined}
     */
    this.properties;
  }
};


/**
 * A list returned by the /list servlet.
 * @typedef {!Array<!ee.data.ShortAssetDescription>}
 */
ee.data.AssetList;


/**
 * An access control list for an asset. The strings are all email addresses (for
 * either individuals or groups).
 * @record @struct
 */
ee.data.AssetAcl = class {
  constructor() {
    /**
     * @export {!Array<string>}
     */
    this.owners;

    /**
     * @export {!Array<string>}
     */
    this.writers;

    /**
     * @export {!Array<string>}
     */
    this.readers;

    /**
     * @export {undefined|boolean}
     */
    this.all_users_can_read;
  }
};


/**
 * An update to an access control list for an asset. Owners cannot be changed.
 * @record @struct
 */
ee.data.AssetAclUpdate = class {
  constructor() {
    /**
     * @export {!Array<string>}
     */
    this.writers;

    /**
     * @export {!Array<string>}
     */
    this.readers;

    /**
     * @export {boolean|undefined}
     */
    this.all_users_can_read;
  }
};

/**
 * A limit for an asset quota entry.
 * @record @struct
 */
ee.data.AssetQuotaEntry = class {
  constructor() {
    /**
     * @export {number}
     */
    this.usage;

    /**
     * @export {number}
     */
    this.limit;
  }
};

/**
 * Details about an asset root folder's quota usage and limits.
 * Asset size values are in bytes. Negative limit means "unlimited".
 * @record @struct
 */
ee.data.AssetQuotaDetails = class {
  constructor() {
    /**
     * @export {!ee.data.AssetQuotaEntry}
     */
    this.asset_count;

    /**
     * @export {!ee.data.AssetQuotaEntry}
     */
    this.asset_size;
  }
};


/**
 * A description of a folder. The type value is always ee.data.AssetType.FOLDER.
 * @record @struct
 */
ee.data.FolderDescription = class {
  constructor() {
    /**
     * @export {!ee.data.AssetType}
     */
    this.type;

    /**
     * @export {string}
     */
    this.id;
  }
};


/**
 * An object describing a FeatureCollection, as returned by getValue.
 * Compatible with GeoJSON. The type field is always "FeatureCollection".
 * @record @struct
 */
ee.data.FeatureCollectionDescription = class {
  constructor() {
    /**
     * @export {!ee.data.AssetType}
     */
    this.type;

    /**
     * @export {!Object<string, string>}
     */
    this.columns;

    /**
     * @export {string|undefined}
     */
    this.id;

    /**
     * @export {!Array<!ee.data.GeoJSONFeature>|undefined}
     */
    this.features;

    /**
     * @export {!Object|undefined}
     */
    this.properties;
  }
};


/**
 * An object describing ee.Feature visualization parameters. Color is
 * a 6-character hex string in the RRGGBB format.
 * @record @struct
 */
ee.data.FeatureVisualizationParameters = class {
  constructor() {
    /**
     * @export {string|undefined}
     */
    this.color;
  }
};


/**
 * An object describing a Feature, as returned by getValue.
 * Compatible with GeoJSON. The type field is always "Feature".
 * @record @struct
 */
ee.data.GeoJSONFeature = class {
  constructor() {
    /**
     * @export {string}
     */
    this.type;

    /**
     * @export {undefined|string}
     */
    this.id;

    /**
     * @export {!ee.data.GeoJSONGeometry}
     */
    this.geometry;

    /**
     * @export {!Object|undefined}
     */
    this.properties;
  }
};


/**
 * An object describing a GeoJSON Geometry, as returned by getValue.
 * @record @struct
 */
ee.data.GeoJSONGeometry = class {
  constructor() {
    /**
     * @export {string}
     */
    this.type;

    /**
     * The coordinates, with the appropriate level of nesting for the given type
     * of geometry.
     * @export {!Array<number>|
     *          !Array<!Array<number>>|
     *          !Array<!Array<!Array<number>>>|
     *          !Array<!Array<!Array<!Array<number>>>>}
     */
    this.coordinates;

    /**
     * @export {!ee.data.GeoJSONGeometryCrs|undefined}
     */
    this.crs;

    /**
     * @export {boolean|undefined}
     */
    this.geodesic;

    /**
     * @export {boolean|undefined}
     */
    this.evenOdd;

    /**
     * @export {!Array<!ee.data.GeoJSONGeometry>|undefined}
     */
    this.geometries;
  }
};


/**
 * The properties of a GeoJSON geometry's "crs" property, which represents the
 * geometry's coordinate reference system.
 * @record @struct
 */
ee.data.GeoJSONGeometryCrs = class {
  constructor() {
    /**
     * @export {string}
     */
    this.type;

    /**
     * @export {!ee.data.GeoJSONGeometryCrsProperties}
     */
    this.properties;
  }
};


/**
 * The properties of a GeoJSON geometry's coordinate reference system.
 * @record @struct
 */
ee.data.GeoJSONGeometryCrsProperties = class {
  constructor() {
    /**
     * The name of the coordinate reference system.
     * @export {string}
     */
    this.name;
  }
};


/**
 * An object describing an ImageCollection, as returned by getValue.
 * @record @struct
 */
ee.data.ImageCollectionDescription = class {
  constructor() {
    /**
     * This field is always "ImageCollection".
     * @export {!ee.data.AssetType}
     */
    this.type;

    /**
     * @export {string|undefined}
     */
    this.id;

    /**
     * @export {number|undefined}
     */
    this.version;

    /**
     * @export {!Array<!ee.data.BandDescription>}
     */
    this.bands;

    /**
     * @export {!Object|undefined}
     */
    this.properties;

    /**
     * @export {!Array<!ee.data.ImageDescription>|undefined}
     */
    this.features;
  }
};


/**
 * An object describing an Image, as returned by getValue.
 * @record @struct
 */
ee.data.ImageDescription = class {
  constructor() {
    /**
     * This field is always "Image".
     * @export {!ee.data.AssetType}
     */
    this.type;

    /**
     * @export {string|undefined}
     */
    this.id;

    /**
     * @export {number|undefined}
     */
    this.version;

    /**
     * @export {!Array<!ee.data.BandDescription>}
     */
    this.bands;

    /**
     * @export {!Object|undefined}
     */
    this.properties;
  }
};


/**
 * An object describing a Table asset, as returned by getValue.
 * Compatible with GeoJSON.
 * @record @struct
 */
ee.data.TableDescription = class {
  constructor() {
    /**
     * This field is always "Table."
     * @export {!ee.data.AssetType}
     */
    this.type;

    /**
     * @export {!Object<string, string>}
     */
    this.columns;

    /**
     * @export {string|undefined}
     */
    this.id;

    /**
     * @export {!Array<!ee.data.GeoJSONFeature>|undefined}
     */
    this.features;

    /**
     * @export {!Object|undefined}
     */
    this.properties;

    /**
     * @export {number|undefined}
     */
    this.version;
  }
};


/**
 * An object containing table download options.
 * @record @struct
 */
ee.data.TableDownloadParameters = class {
  constructor() {
    /**
     * The download format, one of either "CSV" or "JSON."
     * @export {string}
     */
    this.format;

    /**
     * A comma separated string of selectors that can be used to determine which
     * attributes will be downloaded.
     * @export {string}
     */
    this.selectors;

    /**
     * The name of the file that will be downloaded.
     * @export {string}
     */
    this.filename;
  }
};


/**
 * An object describing ee.Image visualization parameters.
 * @see ee.data.getMapId
 * @record @struct
 */
ee.data.ImageVisualizationParameters = class {
  constructor() {
    /**
     * The image to render, represented as a JSON string.
     * @export {!ee.Image|string|undefined}
     */
    this.image;

    /**
     * Version number of image (or latest).
     * @export {number|undefined}
     */
    this.version;

    /**
     * Comma-delimited list of band names to be mapped to RGB.
     * @export {string|!Array<string>|undefined}
     */
    this.bands;

    /**
     * Gain (or one per band) to map onto 00-FF.
     * @export {number|!Array<number>|undefined}
     */
    this.gain;

    /**
     * Offset (or one per band) to map onto 00-FF.
     * @export {number|!Array<number>|undefined}
     */
    this.bias;

    /**
     * Value (or one per band) to map onto 00.
     * @export {number|!Array<number>|undefined}
     */
    this.min;

    /**
     * Value (or one per band) to map onto FF.
     * @export {number|!Array<number>|undefined}
     */
    this.max;

    /**
     * Gamma correction factor (or one per band)
     * @export {number|!Array<number>|undefined}
     */
    this.gamma;

    /**
     * List of CSS-style color strings (single-band previews only).
     * @export {string|!Array<string>|undefined}
     */
    this.palette;

    /**
     * A number between 0 and 1 for opacity.
     * @export {number|undefined}
     */
    this.opacity;

    /**
     * Either "jpg" or "png".
     * @export {string|undefined}
     */
    this.format;
  }
};


/**
 * An object describing the parameters for generating a thumbnail image.
 * Consists of all parameters of ee.data.ImageVisualizationParameters as well as
 * additional fields.
 * @see ee.data.ImageVisualizationParameters
 * @record @struct
 */
ee.data.ThumbnailOptions = class extends ee.data.ImageVisualizationParameters {
  constructor() {
    super();

    /**
     * The maximum dimensions of the thumbnail to render, in pixels. If only one
     * number is passed, it is used as the maximum, and the other dimension is
     * computed by proportional scaling. Otherwise, a pair of numbers in the
     * format [width, height].
     * @export {number|!Array<number>|undefined}
     */
    this.dimensions;

    /**
     * The geospatial region of the image to render. By default, the whole
     * image. If defined, either an array in the format [east, south, west,
     * north] or else a GeoJSON geometry.
     * @export {!Array<number>|!ee.data.GeoJSONGeometry|undefined}
     */
    this.region;
  }
};


/**
 * An object describing an Image band, as returned by getValue.
 * @record @struct
 */
ee.data.BandDescription = class {
  constructor() {
    /**
     * @export {string}
     */
    this.id;

    /**
     * @export {!ee.data.PixelTypeDescription}
     */
    this.data_type;

    /**
     * This field is [width, height].
     * @export {!Array<number>|undefined}
     */
    this.dimensions;

    /**
     * @export {string}
     */
    this.crs;

    /**
     * @export {!Array<number>|undefined}
     */
    this.crs_transform;

    /**
     * @export {string|undefined}
     */
    this.crs_transform_wkt;

    /**
     * @export {!Object|undefined}
     */
    this.properties;
  }
};


/**
 * An object describing a PixelType, as returned by getValue.
 * @record @struct
 */
ee.data.PixelTypeDescription = class {
  constructor() {
    /**
     * This field is always "PixelType."
     * @export {string}
     */
    this.type;

    /**
     * This field is "int," "float," or "double."
     * @export {string}
     */
    this.precision;

    /**
     * @export {number|undefined}
     */
    this.min;

    /**
     * @export {number|undefined}
     */
    this.max;

    /**
     * @export {number|undefined}
     */
    this.dimensions;
  }
};


/**
 * The registry of EE algorithms.
 * @typedef {!Object<string, !ee.data.AlgorithmSignature>}
 */
ee.data.AlgorithmsRegistry;


/**
 * The signature of an algorithm.
 * @record @struct
 */
ee.data.AlgorithmSignature = class {
  constructor() {
    /**
     * @export {!Array<!ee.data.AlgorithmArgument>}
     */
    this.args;

    /**
     * @export {string}
     */
    this.returns;

    /**
     * @export {string}
     */
    this.description;

    /**
     * @export {string|undefined}
     */
    this.deprecated;
  }
};


/**
 * The signature of a single algorithm argument.
 * @record @struct
 */
ee.data.AlgorithmArgument = class {
  constructor() {
    /**
     * @export {string}
     */
    this.name;

    /**
     * @export {string}
     */
    this.type;

    /**
     * @export {boolean}
     */
    this.optional;

    /**
     * @export {string|undefined}
     */
    this.description;

    /**
     * @export {*}
     */
    this.default;
  }
};


/**
 * An identifier and security token for a thumbnail image.
 * @record @struct
 */
ee.data.ThumbnailId = class {
  constructor() {
    /**
     * @export {string}
     */
    this.thumbid;

    /**
     * @export {string}
     */
    this.token;
  }
};


/**
 * An identifier and security token for an image or table to download.
 * @record @struct
 */
ee.data.DownloadId = class {
  constructor() {
    /**
     * @export {string}
     */
    this.docid;

    /**
     * @export {string}
     */
    this.token;
  }
};


/**
 * An identifier and security token for a tiled map.
 * @record @struct
 */
ee.data.RawMapId = class {
  constructor() {
    /**
     * @export {string}
     */
    this.mapid;

    /**
     * @export {string}
     */
    this.token;

    /**
     * @export {function(number,number,number):string}
     */
    this.formatTileUrl;
  }
};


/**
 * A raw map ID together with the image from which it was generated.
 * @record @struct
 */
ee.data.MapId = class extends ee.data.RawMapId {
  constructor() {
    super();

    /**
     * @export {!ee.Image}
     */
    this.image;
  }
};


/**
 * The range of zoom levels for our map tiles.
 * @enum {number}
 */
ee.data.MapZoomRange = {
  MIN: 0,
  // Keep this in sync with the definition of MAX_ZOOM in MapTileServlet.java.
  MAX: 24
};


/**
 * An object to specifying common user preferences for the creation of a new
 * task.
 *
 * @typedef {{
 *   id: (undefined|string),
 *   type: string,
 *   description: (undefined|string),
 *   sourceURL: (undefined|string),
 *   element: (undefined|!ee.Element)
 * }}
 */
ee.data.AbstractTaskConfig;

/**
 * An object for specifying configuration of a task to export an image
 * substuting a format options dictionary for format-specific options.
 *
 * @typedef {{
 *   id: string,
 *   type: string,
 *   description: (undefined|string),
 *   sourceURL: (undefined|string),
 *   element: (undefined|!ee.Element),
 *   crs: (undefined|string),
 *   crs_transform: (undefined|string),
 *   dimensions: (undefined|string),
 *   scale: (undefined|number),
 *   region: (undefined|string),
 *   maxPixels: (undefined|number),
 *   shardSize: (undefined|number),
 *   fileDimensions: (undefined|string|number|?Array<number>),
 *   skipEmptyTiles: (undefined|boolean),
 *   fileFormat: (undefined|string),
 *   formatOptions: (undefined|!ee.data.ImageExportFormatConfig),
 *   driveFolder: (undefined|string),
 *   driveFileNamePrefix: (undefined|string),
 *   outputBucket: (undefined|string),
 *   outputPrefix: (undefined|string),
 *   assetId: (undefined|string),
 *   pyramidingPolicy: (undefined|string)
 * }}
 */
ee.data.ImageTaskConfigUnformatted;

/**
 * An object for specifying configuration of a task to export an image.
 * See com.google.earthengine.service.frontend.ProcessingInput.
 *
 * @typedef {{
 *   id: string,
 *   type: string,
 *   description: (undefined|string),
 *   sourceURL: (undefined|string),
 *   element: (undefined|!ee.Element),
 *   crs: (undefined|string),
 *   crs_transform: (undefined|string),
 *   dimensions: (undefined|string),
 *   scale: (undefined|number),
 *   region: (undefined|string),
 *   maxPixels: (undefined|number),
 *   shardSize: (undefined|number),
 *   fileDimensions: (undefined|string|number|Array<number>),
 *   skipEmptyTiles: (undefined|boolean),
 *   fileFormat: (undefined|string),
 *   tiffCloudOptimized: (undefined|boolean),
 *   tiffFileDimensions: (undefined|string),
 *   tfrecordPatchDimensions: (undefined|string),
 *   tfrecordKernelSize: (undefined|string),
 *   tfrecordCompressed: (undefined|boolean),
 *   tfrecordMaxFileSize: (undefined|number),
 *   tfrecordDefaultValue: (undefined|number),
 *   tfrecordTensorDepths: (undefined|string),
 *   tfrecordSequenceData: (undefined|boolean),
 *   tfrecordCollapseBands: (undefined|boolean),
 *   tfrecordMaskedThreshold: (undefined|number),
 *   driveFolder: (undefined|string),
 *   driveFileNamePrefix: (undefined|string),
 *   outputBucket: (undefined|string),
 *   outputPrefix: (undefined|string),
 *   assetId: (undefined|string),
 *   pyramidingPolicy: (undefined|string)
 * }}
 */
ee.data.ImageTaskConfig;


/**
 * An object for specifying format specific image export options.
 *
 * @typedef {{
 *   cloudOptimized: (undefined|boolean),
 *   fileDimensions: (undefined|!Array<number>),
 *   patchDimensions: (undefined|!Array<number>),
 *   kernelSize: (undefined|!Array<number>),
 *   compressed: (undefined|boolean),
 *   maxFileSize: (undefined|number),
 *   defaultValue: (undefined|number),
 *   tensorDepths: (undefined|!Array<number>|!Object),
 *   sequenceData: (undefined|boolean),
 *   collapseBands: (undefined|boolean),
 *   maskedThreshold: (undefined|number)
 * }}
 */
ee.data.ImageExportFormatConfig;


/**
 * An object for specifying configuration of a task to export an image as
 * Maps Mercator map tiles or a VideoMap to Cloud Storage.
 *
 * @typedef {{
 *   id: string,
 *   type: string,
 *   sourceUrl: (undefined|string),
 *   description: (undefined|string),
 *   element: (undefined|!ee.Element),
 *   minZoom: (undefined|number),
 *   maxZoom: (undefined|number),
 *   region: (undefined|string),
 *   scale: (undefined|number),
 *   fileFormat: (undefined|string),
 *   skipEmptyTiles: (undefined|boolean),
 *   writePublicTiles: (undefined|boolean),
 *   outputBucket: (undefined|string),
 *   outputPrefix: (undefined|string),
 *   mapsApiKey: (undefined|string),
 *   generateEarthHtml: (undefined|boolean)
 * }}
 */
ee.data.MapTaskConfig;


/**
 * An object for specifying configuration of a task to export feature
 * collections.
 *
 * @typedef {{
 *   id: string,
 *   type: string,
 *   description: (undefined|string),
 *   element: (undefined|!ee.Element),
 *   fileFormat: (undefined|string),
 *   sourceUrl: (undefined|string),
 *   driveFolder: (undefined|string),
 *   driveFileNamePrefix: (undefined|string),
 *   outputBucket: (undefined|string),
 *   outputPrefix: (undefined|string),
 *   assetId: (undefined|string)
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
 *   sourceUrl: (undefined|string),
 *   description: (undefined|string),
 *   element: (undefined|!ee.Element),
 *   framesPerSecond: (undefined|number),
 *   crs: (undefined|string),
 *   crs_transform: (undefined|string),
 *   dimensions: (undefined|number|string),
 *   region: (undefined|string),
 *   scale: (undefined|number),
 *   maxPixels: (undefined|number),
 *   maxFrames: (undefined|number),
 *   driveFolder: (undefined|string),
 *   driveFileNamePrefix: (undefined|string),
 *   outputBucket: (undefined|string),
 *   outputPrefix: (undefined|string)
 * }}
 */
ee.data.VideoTaskConfig;


/**
 * A description of the status of a long-running tasks. See the Task
 * proto for a description of these fields.
 * @record @struct
 */
ee.data.TaskStatus = class {
  constructor() {
    /**
     * @export {string|undefined}
     */
    this.id;

    /**
     * @export {string|undefined}
     */
    this.task_type;

    /**
     * @export {number|undefined}
     */
    this.creation_timestamp_ms;

    /**
     * @export {number|undefined}
     */
    this.update_timestamp_ms;

    /**
     * @export {string|undefined}
     */
    this.description;

    /**
     * @export {number|undefined}
     */
    this.priority;

    /**
     * @export {number|undefined}
     */
    this.progress;

    /**
     * @export {string|undefined}
     */
    this.source_url;

    /**
     * @export {!Array<string>|undefined}
     */
    this.output_url;

    /**
     * @export {string|undefined}
     */
    this.state;

    /**
     * @export {string|undefined}
     */
    this.internal_error_info;

    /**
     * @export {string|undefined}
     */
    this.error_message;
  }
};


/**
 * A response for a call to start a batch process.
 * @record @struct
 */
ee.data.ProcessingResponse = class {
  constructor() {
    /**
     * This field is always "OK".
     * @export {string}
     */
    this.started;
    /**
     * This field is either "ALREADY_EXISTS" or missing.
     * @export {string|undefined}
     */
    this.note;
    /**
     * The task ID or missing.
     * @export {string|undefined}
     */
    this.taskId;
  }
};


/**
 * A response for a call to get task status data.
 * @record @struct
 */
ee.data.TaskListResponse = class {
  constructor() {
    /**
     * @export {!Array<!ee.data.TaskStatus>}
     */
    this.tasks;

    /**
     * @export {string|undefined}
     */
    this.next_page_token;
  }
};


/**
 * Actions that can update existing tasks.
 * @enum {string}
 */
ee.data.TaskUpdateActions = {
  CANCEL: 'CANCEL',
  UPDATE: 'UPDATE'
};


/**
 * A public asset description.
 * @record @struct
 */
ee.data.AssetDescription = class {
  constructor() {
    /**
     * @export {!Array<number>|undefined}
     */
    this.date_range;

    /**
     * @export {string}
     */
    this.description;

    /**
     * @export {string}
     */
    this.id;

    /**
     * @export {number}
     */
    this.period;

    /**
     * @export {!Array<number>|undefined}
     */
    this.period_mapping;

    /**
     * @export {string}
     */
    this.provider;

    /**
     * @export {string}
     */
    this.provider_url;

    /**
     * @export {string}
     */
    this.sample;

    /**
     * @export {!Array<string>|undefined}
     */
    this.tags;

    /**
     * @export {string|undefined}
     */
    this.thumb;

    /**
     * @export {string}
     */
    this.title;

    /**
     * @export {!ee.data.AssetType}
     */
    this.type;
  }
};


/**
 * A request to import an image asset.
 * @record @struct
 */
ee.data.IngestionRequest = class {
  constructor() {
    /**
     * The destination asset ID (e.g. "users/yourname/assetname").
     * @export {string}
     */
    this.id;

    /**
     * The list of source files for the asset, clustered by tile.
     * @export {!Array<!ee.data.Tileset>}
     */
    this.tilesets;

    /**
     * @export {!Array<!ee.data.Band>|undefined}
     */
    this.bands;

    /**
     * A mapping from metadata property names to values.
     * @export {!Object|undefined}
     */
    this.properties;

    /**
     * @export {!ee.data.PyramidingPolicy|undefined}
     */
    this.pyramidingPolicy;

    /**
     * @export {!ee.data.MissingData|undefined}
     */
    this.missingData;
  }
};


/**
 * An object describing which value to treat as (fill, nodata) in an asset.
 * @record @struct
 */
ee.data.MissingData = class {
  constructor() {
    /**
     * @export {number}
     */
    this.value;
  }
};


/** @enum {string} The pyramiding policy choices for newly uploaded assets. */
ee.data.PyramidingPolicy = {
  MEAN: 'MEAN',
  MODE: 'MODE',
  MIN: 'MIN',
  MAX: 'MAX',
  SAMPLE: 'SAMPLE'
};


/**
 * An object describing properties of a single raster band.
 * @record @struct
 */
ee.data.Band = class {
  constructor() {
    /**
     * @export {string}
     */
    this.id;
  }
};


/**
 * An object describing a single tileset.
 * @record @struct
 */
ee.data.Tileset = class {
  constructor() {
    /**
     * @export {!Array<!ee.data.FileSource>}
     */
    this.sources;

    /**
     * @export {!Array<!ee.data.FileBand>|undefined}
     */
    this.fileBands;
  }
};


/**
 * An object describing properties of a file band within a tileset.
 * @record @struct
 */
ee.data.FileBand = class {
  constructor() {
    /**
     * A 0-based index of a band in a GDAL file.
     * Currently can only be -1 to indicate treating last band as mask band.
     * @export {number}
     */
    this.fileBandIndex;

    /**
     * Indicates whether the specified file band should be treated as mask band.
     * @export {boolean}
     */
    this.maskForAllBands;
  }
};


/**
 * An object describing properties of a single raster.
 *
 * For requests sent directly through the API, paths should be Google Cloud
 * Storage object names (e.g. 'gs://bucketname/filename'). In manifests uploaded
 * through the Playground IDE, paths should be relative file names (e.g.
 * 'file1.tif').
 * @record @struct
 */
ee.data.FileSource = class {
  constructor() {
    /**
     * The path of the primary file from which to import the asset.
     * @export {string}
     */
    this.primaryPath;

    /**
     * A list of paths for additional files to use in importing the asset.
     * @export {!Array<string>|undefined}
     */
    this.additionalPaths;
  }
};


/**
 * The authentication arguments passed the token refresher when the token
 * needs to be refreshed.
 * @record @struct
 */
ee.data.AuthArgs = class {
  constructor() {
    /**
     * @export {string}
     */
    this.client_id;

    /**
     * @export {boolean}
     */
    this.immediate;

    /**
     * @export {string}
     */
    this.scope;
  }
};


/**
 * The result of a token refresh. Passed by the token refresher to the callback
 * passed to it when it was called. 'expires_in' is in seconds.
 * @record @struct
 */
ee.data.AuthResponse = class {
  constructor() {
    /**
     * @export {string|undefined}
     */
    this.access_token;

    /**
     * @export {string|undefined}
     */
    this.token_type;

    /**
     * @export {number|undefined}
     */
    this.expires_in;

    /**
     * @export {string|undefined}
     */
    this.error;
  }
};


/**
 * Private key JSON object, provided by Google Cloud Console.
 * @record @struct
 */
ee.data.AuthPrivateKey = class {
  constructor() {
    /**
     * @export {string}
     */
    this.private_key;

    /**
     * @export {string}
     */
    this.client_email;
  }
};


////////////////////////////////////////////////////////////////////////////////
//                               Private helpers.                             //
////////////////////////////////////////////////////////////////////////////////


/**
 * Sends an API call.
 * @param {string} path The API endpoint to call.
 * @param {?goog.Uri.QueryData} params The call parameters.
 * @param {function(?, string=)=} opt_callback An optional callback.
 *     If not specified, the call is made synchronously and the response
 *     is returned. If specified, the call will be made asynchronously and
 *     may be queued to avoid exceeding server queries-per-seconds quota.
 * @param {string=} opt_method The HTTPRequest method (GET or POST), default
 *     is POST.
 * @return {?Object} The data object returned by the API call, or null if a
 *     callback was specified.
 * @private
 */
ee.data.send_ = function(path, params, opt_callback, opt_method) {
  // Make sure we never perform API calls before initialization.
  ee.data.initialize();

  // Snapshot the profile hook so we don't depend on its state during async
  // operations.
  var profileHookAtCallTime = ee.data.profileHook_;

  // WARNING: The content-type header here must use this exact capitalization
  // to remain compatible with the Node.JS environment. See:
  // https://github.com/driverdan/node-XMLHttpRequest/issues/20
  var headers = {'Content-Type': 'application/x-www-form-urlencoded'};

  // Set up client-side authorization.
  var authToken = ee.data.getAuthToken();
  if (goog.isDefAndNotNull(authToken)) {
    headers['Authorization'] = authToken;
  } else if (opt_callback && ee.data.isAuthTokenRefreshingEnabled_()) {
    // If the authToken is null, the call is asynchronous, and token refreshing
    // is enabled, refresh the auth token before making the call.
    ee.data.refreshAuthToken(function() {
      ee.data.withProfiling(profileHookAtCallTime, function() {
        ee.data.send_(path, params, opt_callback, opt_method);
      });
    });
    return null;
  }

  var method = opt_method || 'POST';

  // Set up request parameters.
  params = params ? params.clone() : new goog.Uri.QueryData();
  if (profileHookAtCallTime) {
    params.add('profiling', '1');  // Request profiling results.
  }

  params = ee.data.paramAugmenter_(params, path);  // Apply custom augmentation.

  // XSRF protection for a server-side API proxy.
  if (goog.isDefAndNotNull(ee.data.xsrfToken_)) {
    headers['X-XSRF-Token'] = ee.data.xsrfToken_;
  }


  // Encode the request params in the URL if the request is a GET request.
  var requestData = params ? params.toString() : '';
  if (method == 'GET' && !goog.string.isEmptyOrWhitespace(requestData)) {
    path += goog.string.contains(path, '?') ? '&' : '?';
    path += requestData;
    requestData = null;
  }

  var url = ee.data.apiBaseUrl_ + path;
  if (opt_callback) {
    // Send an asynchronous request.
    var request =
        ee.data.buildAsyncRequest_(
            url, opt_callback, method, requestData, headers);

    ee.data.requestQueue_.push(request);
    ee.data.RequestThrottle_.fire();
    return null;
  } else {
    // Send a synchronous request.
    /**
     * Wrapper around xmlHttp.setRequestHeader to be useable with parameter
     * order of goog.object.forEach
     * @this {!goog.net.XhrLike.OrNative}
     * @param {string} value The value of the header.
     * @param {string} key The key of the header;
     */
    var setRequestHeader = function(value, key) {
      if (this.setRequestHeader) {
        this.setRequestHeader(key, value);
      }
    };

    // Retry 429 responses with exponential backoff.
    var xmlHttp;
    var retries = 0;
    while (true) {
      xmlHttp = goog.net.XmlHttp();
      xmlHttp.open(method, url, false);
      goog.object.forEach(headers, setRequestHeader, xmlHttp);
      xmlHttp.send(requestData);
      if (xmlHttp.status != 429 || retries > ee.data.MAX_SYNC_RETRIES_) {
        break;
      }
      ee.data.sleep_(ee.data.calculateRetryWait_(retries++));
    }

    return ee.data.handleResponse_(
        xmlHttp.status,
        function getResponseHeaderSafe(header) {
          try {
            return xmlHttp.getResponseHeader(header);
          } catch (e) {
            // Workaround for a non-browser XMLHttpRequest shim that doesn't
            // implement getResponseHeader when synchronous.
            return null;
          }
        },
        xmlHttp.responseText,
        profileHookAtCallTime);
  }
};


/**
 * Creates an aync network request object using the specified parameters.
 * The callback is wrapped so that exponential backoff is used in response to
 * 429 errors.
 * @param {string} url The request's URL.
 * @param {function(?, string=)} callback The callback to execute when the
 *     request gets a response.
 * @param {string} method The request's HTTP method.
 * @param {?string} content The content of the request.
 * @param {!Object<string,string>} headers The headers to send with the request.
 * @return {!ee.data.NetworkRequest_} The async request.
 * @private
 */
ee.data.buildAsyncRequest_ = function(url, callback, method, content, headers) {
  var retries = 0;
  var request = {
    url: url,
    method: method,
    content: content,
    headers: headers
  };
  var profileHookAtCallTime = ee.data.profileHook_;
  var wrappedCallback = function(e) {
    var xhrIo = e.target;

    if (xhrIo.getStatus() == 429 && retries < ee.data.MAX_ASYNC_RETRIES_) {
      retries++;
      setTimeout(function() {
        ee.data.requestQueue_.push(request);
        ee.data.RequestThrottle_.fire();
      }, ee.data.calculateRetryWait_(retries));
      return null;
    }

    return ee.data.handleResponse_(
        xhrIo.getStatus(),
        goog.bind(xhrIo.getResponseHeader, xhrIo),
        xhrIo.getResponseText(),
        profileHookAtCallTime,
        callback);
  };
  request.callback = wrappedCallback;

  return request;
};


/**
 * Handles processing and dispatching a callback response.
 * @param {number} status The status code of the response.
 * @param {function(string):string?} getResponseHeader A function for getting
 *     the value of a response headers for a given header name.
 * @param {string} responseText The text of the response.
 * @param {?function(string)} profileHook The profile hook at the time the
 *     request was created.
 * @param {function(?,string=)=} opt_callback An optional callback to execute if
 *     the request is asynchronous.
 * @param {function(!Object):!Object=} opt_getData A function to extract the
 *     data payload from the response.  Defaults to using the 'data' field.
 * @return {Object} The response data, if the request is synchronous, otherwise
 *     null, if the request is asynchronous.
 * @private
 */
ee.data.handleResponse_ = function(
    status, getResponseHeader, responseText, profileHook, opt_callback,
    opt_getData = (response) => response['data']) {
  var profileId = getResponseHeader(ee.data.PROFILE_HEADER);
  if (profileId && profileHook) {
    profileHook(profileId);
  }

  var response, data, errorMessage;
  var contentType = getResponseHeader('Content-Type');
  contentType = contentType ?
      contentType.replace(/;.*/, '') : 'application/json';
  if (contentType == 'application/json' || contentType == 'text/json') {
    try {
      response = JSON.parse(responseText);
      data = opt_getData(response);
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
    } else if (data === undefined) {
      errorMessage = 'Malformed response: ' + responseText;
    }
  } else if (status === 0) {
    errorMessage = 'Failed to contact Earth Engine servers. Please check ' +
        'your connection, firewall, or browser extension settings.';
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


/**
 * Ensures that the Google API Client Library for JavaScript is loaded.
 * @param {function()} callback The function to call when the library is ready.
 * @private
 */
ee.data.ensureAuthLibLoaded_ = function(callback) {
  var done = function() {
    // Speed up auth request by using CORS instead of an iframe.
    goog.global['gapi']['config']['update']('client/cors', true);
    if (!ee.data.authTokenRefresher_) {
      ee.data.setAuthTokenRefresher(goog.global['gapi']['auth']['authorize']);
    }
    callback();
  };
  if (goog.isObject(goog.global['gapi']) &&
      goog.isObject(goog.global['gapi']['auth']) &&
      goog.isFunction(goog.global['gapi']['auth']['authorize'])) {
    done();
  } else {
    // The library is not loaded; load it now.
    var callbackName = goog.now().toString(36);
    while (callbackName in goog.global) {
      callbackName += '_';
    }
    goog.global[callbackName] = function() {
      delete goog.global[callbackName];
      done();
    };
    goog.net.jsloader.safeLoad(goog.html.TrustedResourceUrl.format(
        ee.data.AUTH_LIBRARY_URL_, {'onload': callbackName}));
  }
};


/**
 * Handles the result of gapi.auth.authorize(), storing the auth token on
 * success and setting up a refresh timeout.
 *
 * @param {function()|undefined} success The function to call if token refresh
 *     succeeds.
 * @param {function(string)|undefined} error The function to call if auth fails,
 *     passing the error message.
 * @param {!ee.data.AuthResponse} result The result object produced by
 *     a token refresher such as gapi.auth.authorize().
 * @private
 */
ee.data.handleAuthResult_ = function(success, error, result) {
  if (result.access_token) {
    var token = result.token_type + ' ' + result.access_token;
    if (result.expires_in || result.expires_in === 0) {
      // Conservatively consider tokens expired slightly before actual expiry.
      var expiresInMs = result.expires_in * 1000 * 0.9;

      // Set up a refresh timer. This is necessary because we cannot refresh
      // synchronously, but since we want to allow synchronous API requests,
      // something must ensure that the auth token is always valid. However,
      // this approach fails if the user is offline or suspends their computer,
      // so in addition to this timeout, invalid tokens are detected and
      // autorefreshed on demand prior to async calls. Prior to sync calls,
      // users are advised to check ee.data.getAuthToken() and manually refresh
      // the token if needed. See ee.data.authenticate() docs for more info.
      // Note that we multiply by .9 *again* to prevent simultaneous
      // on-demand-refresh and timer-refresh.
      setTimeout(ee.data.refreshAuthToken, expiresInMs * 0.9);

      ee.data.authTokenExpiration_ = goog.now() + expiresInMs;
    }
    ee.data.authToken_ = token;
    if (success) {
      success();
    }
  } else if (error) {
    error(result.error || 'Unknown error.');
  }
};


/**
 * Convert an object into a goog.Uri.QueryData. Parameters that are of type
 * array or object are serialized to JSON.
 * @param {!Object} params The params to convert.
 * @return {!goog.Uri.QueryData} The converted parameters.
 * @private
 */
ee.data.makeRequest_ = function(params) {
  var request = new goog.Uri.QueryData();
  for (let [name, item] of Object.entries(params)) {
    request.set(name, item);
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

  // We don't use ee.data.apiBaseUrl_ directly because it may be cleared by
  // ee.reset() in a test tearDown() before all queued asynchronous requests
  // finish. Further, we cannot spanshot it here because tests may call
  // setupMockSend() before ee.initialize(). So we snapshot it when the first
  // request is made below.
  var apiBaseUrl;

  // If the mock is set up with a string for this URL, return that.
  // If it's a function, call the function and use its return value.
  // If it's an object it has fields specifying more details.
  // If there's nothing set for this url, throw.
  function getResponse(url, method, data) {
    url = url.replace(apiBaseUrl, '');
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

    if (!goog.isNumber(response.status) && !goog.isFunction(response.status)) {
      throw new Error(url + ' mock response missing/invalid status');
    }
    return response;
  }

  // Mock XhrIo.send for async calls.
  goog.net.XhrIo.send = function(url, callback, method, data) {
    apiBaseUrl = apiBaseUrl || ee.data.apiBaseUrl_;
    var responseData = getResponse(url, method, data);
    // An anonymous class to simulate an event.  Closure doesn't like this.
    /** @constructor */
    var fakeEvent = function() {
      /** @type {!goog.net.XhrIo} */ this.target = /** @type {?} */({});
    };
    var e = new fakeEvent();
    e.target.getResponseText = function() {
      return responseData.text;
    };
    e.target.getStatus = goog.isFunction(responseData.status) ?
        responseData.status :
        function() {
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
  var fakeXmlHttp = function() {
    /** @type {string} */ this.url;
    /** @type {string} */ this.method;
    /** @type {string} */ this.contentType_;
    /** @type {string} */ this.responseText;
    /** @type {number} */ this.status;
  };
  fakeXmlHttp.prototype.open = function(method, urlIn) {
    apiBaseUrl = apiBaseUrl || ee.data.apiBaseUrl_;
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
    this.status = goog.isFunction(responseData.status) ?
        responseData.status() : responseData.status;
    this.contentType_ = responseData.contentType;
  };
  goog.net.XmlHttp = function() {
    return /** @type {?} */ (new fakeXmlHttp());
  };
};


/**
 * @return {boolean} Whether auth token refreshing is enabled.
 * @private
 */
ee.data.isAuthTokenRefreshingEnabled_ = function() {
  return Boolean(ee.data.authTokenRefresher_ && ee.data.authClientId_);
};


/**
 * @param {number} retryCount The number of retries attempted including the
 *     current one.
 * @return {number} The time to wait before retrying a request.
 * @private
 */
ee.data.calculateRetryWait_ = function(retryCount) {
  return Math.min(ee.data.MAX_RETRY_WAIT_,
                  Math.pow(2, retryCount) * ee.data.BASE_RETRY_WAIT_);
};


/**
 * Block all script execution for a given period of time.
 * @param {number} timeInMs The amount of time to sleep (in milliseconds).
 * @private
 */
ee.data.sleep_ = function(timeInMs) {
  var end = new Date().getTime() + timeInMs;
  while (new Date().getTime() < end) {}
};

////////////////////////////////////////////////////////////////////////////////
//                     Private variables and types.                           //
////////////////////////////////////////////////////////////////////////////////


/**
 * A data model for a network request.
 * @record @struct
 * @private
 */
ee.data.NetworkRequest_ = class {
  constructor() {
    /**
     * @type {string}
     */
    this.url;

    /**
     * @type {function(?, string=)}
     */
    this.callback;

    /**
     * @type {string}
     */
    this.method;

    /**
     * @type {?string}
     */
    this.content;

    /**
     * @type {!Object<string, string>}
     */
    this.headers;
  }
};


/**
 * A list of queued network requests.
 * @private {!Array<!ee.data.NetworkRequest_>}
 */
ee.data.requestQueue_ = [];


/**
 * The network request throttle interval in milliseconds. The server permits ~3
 * QPS https://developers.google.com/earth-engine/usage.
 * @private @const {number}
 */
ee.data.REQUEST_THROTTLE_INTERVAL_MS_ = 350;


/**
 * A throttle for sending network requests.
 * @private {!goog.async.Throttle}
 */
ee.data.RequestThrottle_ = new goog.async.Throttle(function() {
  var request = ee.data.requestQueue_.shift();
  if (request) {
    goog.net.XhrIo.send(
        request.url, request.callback, request.method, request.content,
        request.headers, ee.data.deadlineMs_);
  }
  if (!goog.array.isEmpty(ee.data.requestQueue_)) {
    ee.data.RequestThrottle_.fire();
  }
}, ee.data.REQUEST_THROTTLE_INTERVAL_MS_);


/**
 * The base URL for all API calls.
 * @private {?string}
 */
ee.data.apiBaseUrl_ = null;


/**
 * The base URL for map tiles.
 * @private {?string}
 */
ee.data.tileBaseUrl_ = null;


/**
 * A string to pass in the X-XSRF-Token header of XHRs.
 * @private {?string}
 */
ee.data.xsrfToken_ = null;


/**
 * A function used to transform parameters right before they are sent to the
 * server. Takes the URL of the request as the second argument.
 * @private {function(!goog.Uri.QueryData, string): !goog.Uri.QueryData}
 */
ee.data.paramAugmenter_ = goog.functions.identity;


/**
 * An OAuth2 token to use for authenticating EE API calls.
 * @private {?string}
 */
ee.data.authToken_ = null;


/**
 * The milliseconds in epoch time when the token expires.
 * @private {?number}
 */
ee.data.authTokenExpiration_ = null;


/**
 * The client ID used to retrieve OAuth2 tokens.
 * @private {?string}
 */
ee.data.authClientId_ = null;


/**
 * The scopes to request when retrieving OAuth tokens.
 * @private {!Array<string>}
 */
ee.data.authScopes_ = [];


/**
 * A function that takes as input 1) auth arguments and 2) a callback to which
 * it passes an auth response object upon completion.
 * @private {?function(!ee.data.AuthArgs, function(!ee.data.AuthResponse))}
 */
ee.data.authTokenRefresher_ = null;


/**
 * The OAuth scope for the EE API.
 * @private @const {string}
 */
ee.data.AUTH_SCOPE_ = 'https://www.googleapis.com/auth/earthengine';


/**
 * The URL of the Google APIs Client Library.
 * @private @const {!goog.string.Const}
 */
ee.data.AUTH_LIBRARY_URL_ = goog.string.Const.from(
    'https://apis.google.com/js/client.js?onload=%{onload}');


/**
 * The OAuth scope for Cloud Storage.
 * @private @const {string}
 */
ee.data.STORAGE_SCOPE_ =
    'https://www.googleapis.com/auth/devstorage.read_write';


/**
 * Whether the library has been initialized.
 * @private {boolean}
 */
ee.data.initialized_ = false;


/**
 * The number of milliseconds to wait for each request before considering it
 * timed out. 0 means no limit. Note that this is not supported by browsers for
 * synchronous requests.
 * @private {number}
 */
ee.data.deadlineMs_ = 0;


/**
 * A function called when profile results are received from the server. Takes
 * the profile ID as an argument. Null if profiling is disabled.
 * @private {?function(string)}
 */
ee.data.profileHook_ = null;


/**
 * The minimum increment of time (in milliseconds) to wait before retrying a
 * request in response to a 429 response.
 * @private @const {number}
 */
ee.data.BASE_RETRY_WAIT_ = 1000;


/**
 * The minimum increment of time (in milliseconds) to wait before retrying a
 * request in response to a 429 response.
 * @private @const {number}
 */
ee.data.MAX_RETRY_WAIT_ = 120000;


/**
 * The maximum number of times to retry an asynchronous request if it is
 * rate-limited.
 * @private @const {number}
 */
ee.data.MAX_ASYNC_RETRIES_ = 10;


/**
 * The maximum number of times to retry a synchronous request if it is
 * rate-limited.
 * @private @const {number}
 */
ee.data.MAX_SYNC_RETRIES_ = 5;


/**
 * The HTTP header through which profile results are returned.
 * @const {string}
 */
ee.data.PROFILE_HEADER = 'X-Earth-Engine-Computation-Profile';


/**
 * The default base URL for API calls.
 * @private @const {string}
 */
ee.data.DEFAULT_API_BASE_URL_ = 'https://earthengine.googleapis.com/api';


/**
 * The default base URL for media/tile calls.
 * @private @const {string}
 */
ee.data.DEFAULT_TILE_BASE_URL_ = 'https://earthengine.googleapis.com';
