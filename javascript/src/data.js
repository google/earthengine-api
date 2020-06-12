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
goog.provide('ee.data.AuthPrivateKey');
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
goog.provide('ee.data.SYSTEM_ASSET_SIZE_PROPERTY');
goog.provide('ee.data.ShortAssetDescription');
goog.provide('ee.data.SystemPropertyPrefix');
goog.provide('ee.data.SystemTimeProperty');
goog.provide('ee.data.TableDescription');
goog.provide('ee.data.TableIngestionRequest');
goog.provide('ee.data.TableSource');
goog.provide('ee.data.TableTaskConfig');
goog.provide('ee.data.TaskListResponse');
goog.provide('ee.data.TaskStatus');
goog.provide('ee.data.TaskUpdateActions');
goog.provide('ee.data.ThumbnailId');
goog.provide('ee.data.Tileset');
goog.provide('ee.data.VideoTaskConfig');
goog.require('ee.Serializer');
goog.require('ee.rpc_convert');
goog.require('ee.rpc_convert_batch');
goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.json');
goog.require('goog.object');

goog.requireType('ee.Element');
goog.requireType('ee.Image');
goog.requireType('ee.Collection');
goog.require('proto.google.protobuf.Value');
goog.requireType('ee.data.images');
goog.require('ee.api');
goog.require('ee.apiclient');



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
  var scopes = [ee.apiclient.AUTH_SCOPE];
  if (ee.data.getCloudApiEnabled()) {
    scopes.push(ee.apiclient.CLOUD_PLATFORM_SCOPE);
  }
  if (opt_extraScopes) {
    goog.array.extend(scopes, opt_extraScopes);
    goog.array.removeDuplicates(scopes);
  }
  ee.apiclient.setAuthClient(clientId, scopes);

  if (clientId === null) {
    ee.apiclient.clearAuthToken();
    return;
  }

  // Start the authentication flow as soon as we have the auth library.
  ee.apiclient.ensureAuthLibLoaded(function() {
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
    'client_id': ee.apiclient.getAuthClientId(),
    'immediate': false,
    'scope': ee.apiclient.getAuthScopes().join(' ')
  }, goog.partial(ee.apiclient.handleAuthResult, opt_success, opt_error));
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

  var scopes = [ee.apiclient.AUTH_SCOPE, ee.apiclient.STORAGE_SCOPE];
  if (ee.data.getCloudApiEnabled()) {
    scopes.push(ee.apiclient.CLOUD_PLATFORM_SCOPE);
  }
  if (opt_extraScopes) {
    goog.array.extend(scopes, opt_extraScopes);
    goog.array.removeDuplicates(scopes);
  }
  ee.apiclient.setAuthClient(privateKey.client_email, scopes);

  // Initialize JWT client to authorize as service account.
  var jwtClient = new google.auth.JWT(
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


ee.data.setApiKey = ee.apiclient.setApiKey;
ee.data.setProject = ee.apiclient.setProject;
ee.data.getProject = ee.apiclient.getProject;
ee.data.setCloudApiEnabled = ee.apiclient.setCloudApiEnabled;
ee.data.getCloudApiEnabled = ee.apiclient.getCloudApiEnabled;


/** @const {string} */
ee.data.PROFILE_REQUEST_HEADER = ee.apiclient.PROFILE_REQUEST_HEADER;


/**
 * Sets a function used to transform expressions potentially adding metadata.
 *
 * @param {?function(!ee.api.Expression, !Object=): !ee.api.Expression}
 *     augmenter A function used to transform the expression parameters right
 *     before they are sent to the server.
 */
ee.data.setExpressionAugmenter = function(augmenter) {
  ee.data.expressionAugmenter_ = augmenter || goog.functions.identity;
};
goog.exportSymbol('ee.data.setExpressionAugmenter', ee.data.setExpressionAugmenter);

/**
 * A function used to transform expression right before they are sent to the
 * server. Takes in an expression to annotate and any extra metadata to attach
 * to the expression.
 * @private {function(?ee.api.Expression, !Object=):?ee.api.Expression}
 */
ee.data.expressionAugmenter_ = goog.functions.identity;

////////////////////////////////////////////////////////////////////////////////
//                  Re-exported imports from ee.apiclient                     //
////////////////////////////////////////////////////////////////////////////////

// The following symbols are exported for the benefit of users who create tokens
// server side but initialize the API client side.
ee.data.setAuthToken = ee.apiclient.setAuthToken;
goog.exportSymbol('ee.data.setAuthToken', ee.data.setAuthToken);
ee.data.refreshAuthToken = ee.apiclient.refreshAuthToken;
goog.exportSymbol('ee.data.refreshAuthToken', ee.data.refreshAuthToken);
ee.data.setAuthTokenRefresher = ee.apiclient.setAuthTokenRefresher;
goog.exportSymbol(
    'ee.data.setAuthTokenRefresher', ee.data.setAuthTokenRefresher);
ee.data.getAuthToken = ee.apiclient.getAuthToken;
goog.exportSymbol('ee.data.getAuthToken', ee.data.getAuthToken);
ee.data.clearAuthToken = ee.apiclient.clearAuthToken;
goog.exportSymbol('ee.data.clearAuthToken', ee.data.clearAuthToken);
ee.data.getAuthClientId = ee.apiclient.getAuthClientId;
goog.exportSymbol('ee.data.getAuthClientId', ee.data.getAuthClientId);
ee.data.getAuthScopes = ee.apiclient.getAuthScopes;
goog.exportSymbol('ee.data.getAuthScopes', ee.data.getAuthScopes);
ee.data.setDeadline = ee.apiclient.setDeadline;
goog.exportSymbol('ee.data.setDeadline', ee.data.setDeadline);

// The following symbol is exported because it is used in the Code Editor, much
// like ee.data.setExpressionAugmenter above is.
ee.data.setParamAugmenter = ee.apiclient.setParamAugmenter;
goog.exportSymbol('ee.data.setParamAugmenter', ee.data.setParamAugmenter);

// The following symbols are not exported because they are meant to be used via
// the wrapper functions in ee.js.
/** @type {function(?string=,?string=,?string=)} */
ee.data.initialize = ee.apiclient.initialize;
/** @type {function()} */
ee.data.reset = ee.apiclient.reset;

// The following symbols are not exported because they are meant for internal
// use only.
/** @const {string} */
ee.data.PROFILE_HEADER = ee.apiclient.PROFILE_HEADER;
ee.data.makeRequest_ = ee.apiclient.makeRequest;
ee.data.send_ = ee.apiclient.send;
ee.data.setupMockSend = ee.apiclient.setupMockSend;
ee.data.withProfiling = ee.apiclient.withProfiling;

////////////////////////////////////////////////////////////////////////////////
//                      Main computation entry points.                        //
////////////////////////////////////////////////////////////////////////////////

/**
 * Get the list of algorithms.
 *
 * @param {function(?ee.data.AlgorithmsRegistry, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.AlgorithmsRegistry} The list of algorithm
 *     signatures, or null if a callback is specified.
 */
ee.data.getAlgorithms = function(opt_callback) {
  if (ee.data.getCloudApiEnabled()) {
    const call = new ee.apiclient.Call(opt_callback);
    return call.handle(
        call.algorithms().list(call.projectsPath(), {prettyPrint: false})
        .then(ee.rpc_convert.algorithms));
  }
  const result = ee.data.send_('/algorithms', null, opt_callback, 'GET');
  if (!opt_callback) {
    return /** @type {!ee.data.AlgorithmsRegistry} */ (result);
  }

  return null;
};


/**
 * Get a Map ID for a given asset
 * @param {!ee.data.ImageVisualizationParameters} params
 *     The visualization parameters as a (client-side) JavaScript object.
 *     For Images and ImageCollections:
 *       - image (JSON string) The image to render.
 *       - version (number) Version number of image (or latest).
 *       - bands (comma-separated strings) Comma-delimited list of
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
 * @param {function(?ee.data.RawMapId, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.RawMapId} The mapId call results, which may be passed to
 *     ee.data.getTileUrl or ui.Map.addLayer. Null if a callback is specified.
 * @export
 */
ee.data.getMapId = function(params, opt_callback) {
  if (ee.data.getCloudApiEnabled()) {
    if (typeof params.image === 'string') {
      throw new Error('Image as JSON string not supported.');
    }
    if (params.version !== undefined) {
      throw new Error('Image version specification not supported.');
    }
    const map = new ee.api.EarthEngineMap({
      name: null,
      expression: ee.data.expressionAugmenter_(
          ee.Serializer.encodeCloudApiExpression(params.image)),
      fileFormat: ee.rpc_convert.fileFormat(params.format),
      bandIds: ee.rpc_convert.bandList(params.bands),
      visualizationOptions: ee.rpc_convert.visualizationOptions(params),
    });
    const fields = ['name'];
    const getResponse = (response) => ee.data.makeMapId_(response['name'], '');
    const call = new ee.apiclient.Call(opt_callback);
    return call.handle(
        call.maps().create(call.projectsPath(), map, {fields})
        .then(getResponse));
  }
  params = /** @type {!ee.data.ImageVisualizationParameters} */ (
      goog.object.clone(params));
  if (typeof params.image !== 'string') {
    params.image = params.image.serialize();
  }
  const makeMapId = (result) => ee.data.makeMapId_(
      result['mapid'], result['token']);
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
 * If formatTileUrl is not present, we generate it by using or guessing the
 * urlFormat string, and add urlFormat and formatTileUrl to `id` for future use.
 * @param {!ee.data.RawMapId} id The Map ID to generate tiles for.
 * @param {number} x The tile x coordinate.
 * @param {number} y The tile y coordinate.
 * @param {number} z The tile zoom level.
 * @return {string} The tile URL.
 * @export
 */
ee.data.getTileUrl = function(id, x, y, z) {
  if (!id.formatTileUrl) {
    // If formatTileUrl does not exist, the caller may have constructed mapid
    // explicitly (such as from a JSON response). Look for a url format string,
    // and finally fall back to setting the format string based on the current
    // API version.
    const newId = ee.data.makeMapId_(id.mapid, id.token, id.urlFormat);
    id.urlFormat = newId.urlFormat;  // Set for reference.
    id.formatTileUrl = newId.formatTileUrl;
  }
  return id.formatTileUrl(x, y, z);
};


/**
 * Constructs a RawMapId, generating formatTileUrl and urlFormat from mapid and
 * token.
 * @param {string} mapid Map ID.
 * @param {string} token Token.  Will only be non-empty when using legacy API.
 * @param {string=} opt_urlFormat Explicit URL format.  Overrides the format
 *    inferred from mapid and token.
 * @return {!ee.data.RawMapId}
 * @private
 */
ee.data.makeMapId_ = function(mapid, token, opt_urlFormat = '') {
  let urlFormat = opt_urlFormat;
  if (!urlFormat) {
    ee.apiclient.initialize();
    const base = ee.apiclient.getTileBaseUrl();
    const args = '{z}/{x}/{y}';  // Named substitutions for Python API parity.
    if (token) {
      // Legacy form where token is populated.
      urlFormat = `${base}/map/${mapid}/${args}?token=${token}`;
    } else {
      urlFormat = `${base}/${ee.apiclient.VERSION}/${mapid}/tiles/${args}`;
    }
  }
  const formatTileUrl = (x, y, z) => {
    const width = Math.pow(2, z);
    x = x % width;
    x = String(x < 0 ? x + width : x);  // JSCompiler: replace() needs string.
    return urlFormat.replace('{x}', x).replace('{y}', y).replace('{z}', z);
  };
  return {mapid, token, formatTileUrl, urlFormat};
};

/**
 * Sends a request to compute a value.
 * @param {*} obj
 * @param {function(*)=} opt_callback
 * @return {!proto.google.protobuf.Value|!Object|null} result
 * @export
 */
ee.data.computeValue = function(obj, opt_callback) {
  // TODO(user,user): Use Promises instead of callbacks.
  if (ee.data.getCloudApiEnabled()) {
    const expression = ee.data.expressionAugmenter_(
        ee.Serializer.encodeCloudApiExpression(obj));
    const call = new ee.apiclient.Call(opt_callback);
    return call.handle(
        call.value().compute(call.projectsPath(),
            new ee.api.ComputeValueRequest({expression}))
        .then(x => x['result']));
  }
  const params = {'json': ee.Serializer.toJSON(obj)};
  return ee.data.send_('/value', ee.data.makeRequest_(params), opt_callback);
};


/**
 * Get a Thumbnail Id for a given asset.
 * @param {!ee.data.ThumbnailOptions} params An object containing thumbnail
 *     options with the following possible values:
 *       - image (ee.Image) The image to make a thumbnail.
 *       - bands (array of strings) An array of band names.
 *       - format (string) The file format ("png", "jpg", "geotiff").
 *       - name (string): The base name.
 *     Use ee.Image.getThumbURL for region, dimensions, and visualization
 *     options support.
 * @param {function(?ee.data.ThumbnailId, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.ThumbnailId} The thumb ID and optional token, or null if a
 *     callback is specified.
 * @export
 */
ee.data.getThumbId = function(params, opt_callback) {
  if (ee.data.getCloudApiEnabled()) {
    // We only really support accessing this method via ee.Image.getThumbURL,
    // which folds almost all the parameters into the Image itself.
    if (typeof params.image === 'string') {
      throw new Error('Image as JSON string not supported.');
    }
    if (params.version !== undefined) {
      throw new Error('Image version specification not supported.');
    }
    if (params.region !== undefined) {
      throw new Error('"region" not supported in call to ee.data.getThumbId. ' +
          'Use ee.Image.getThumbURL.');
    }
    if (params.dimensions !== undefined) {
      throw new Error('"dimensions" is not supported in call to ' +
          'ee.data.getThumbId. Use ee.Image.getThumbURL.');
    }
    const thumbnail = new ee.api.Thumbnail({
      name: null,
      expression: ee.data.expressionAugmenter_(
          ee.Serializer.encodeCloudApiExpression(params.image)),
      fileFormat: ee.rpc_convert.fileFormat(params.format),
      filenamePrefix: params.name,
      bandIds: ee.rpc_convert.bandList(params.bands),
      visualizationOptions: ee.rpc_convert.visualizationOptions(params),
      grid: null,
    });
    const fields = ['name'];
    const getResponse = (response) => {
      /** @type {!ee.data.ThumbnailId} */
      const ret = {thumbid: response['name'], token: ''};
      return ret;
    };
    const call = new ee.apiclient.Call(opt_callback);
    return call.handle(
        call.thumbnails().create(call.projectsPath(), thumbnail, {fields})
        .then(getResponse));
  }
  params = /** @type {!ee.data.ThumbnailOptions} */ (goog.object.clone(params));
  if (Array.isArray(params.dimensions)) {
    params.dimensions = params.dimensions.join('x');
  }

  // The request accepts both serialized ee.Image and ee.ImageCollections, so
  // we remove the imageCollection field and insert it as the image instead,
  // if it exists.
  let image = params.image || params.imageCollection;
  if (typeof image !== 'string') {
    image = image.serialize();
  }
  params.image = image;
  delete params.imageCollection;

  var request = ee.data.makeRequest_(params).add('getid', '1');
  return /** @type {?ee.data.ThumbnailId} */(
      ee.data.send_('/thumb', request, opt_callback));
};


/**
 * Get a Video Thumbnail Id for a given asset.
 * @param {!ee.data.VideoThumbnailOptions} params Parameters to make the request
 *     with.
 * @param {function(?ee.data.ThumbnailId, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.ThumbnailId} The thumb ID and optional token, or null if a
 *     callback is specified.
 * @export
 */
ee.data.getVideoThumbId = function(params, opt_callback) {
  if (!ee.data.getCloudApiEnabled()) {
    throw new Error('getVideoThumbId is only supported in Cloud API mode.');
  }

  const videoOptions = new ee.api.VideoOptions({
    framesPerSecond: params.framesPerSecond || null,
    maxFrames: params.maxFrames || null,
    maxPixelsPerFrame: params.maxPixelsPerFrame || null,
  });

  const request = new ee.api.VideoThumbnail({
    name: null,
    expression: ee.data.expressionAugmenter_(
        ee.Serializer.encodeCloudApiExpression(params.imageCollection)),
    fileFormat: ee.rpc_convert.fileFormat(params.format),
    videoOptions: videoOptions,
    grid: null,
  });
  const fields = ['name'];
  const getResponse = (response) => {
    /** @type {!ee.data.ThumbnailId} */
    const ret = {thumbid: response['name'], token: ''};
    return ret;
  };
  const call = new ee.apiclient.Call(opt_callback);
  return call.handle(
      call.videoThumbnails().create(call.projectsPath(), request, {fields})
      .then(getResponse));
};


/**
 * Get a Filmstrip Thumbnail Id for a given asset.
 * @param {!ee.data.FilmstripThumbnailOptions} params Parameters to make the
 *     request with.
 * @param {function(?ee.data.ThumbnailId, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.ThumbnailId} The thumb ID and optional token, or null if a
 *     callback is specified.
 * @export
 */
ee.data.getFilmstripThumbId = function(params, opt_callback) {
  if (!ee.data.getCloudApiEnabled()) {
    throw new Error('getFilmstripThumbId is only supported in Cloud API mode.');
  }

  const request = new ee.api.FilmstripThumbnail({
    name: null,
    expression: ee.data.expressionAugmenter_(
        ee.Serializer.encodeCloudApiExpression(params.imageCollection)),
    fileFormat: ee.rpc_convert.fileFormat(params.format),
    orientation: ee.rpc_convert.orientation(params.orientation),
    grid: null,
  });
  const fields = ['name'];
  const getResponse = (response) => {
    /** @type {!ee.data.ThumbnailId} */
    const ret = {thumbid: response['name'], token: ''};
    return ret;
  };
  const call = new ee.apiclient.Call(opt_callback);
  return call.handle(
      call.filmstripThumbnails().create(call.projectsPath(), request, {fields})
      .then(getResponse));
};


/**
 * Create a thumbnail URL from a thumbid and token.
 * @param {!ee.data.ThumbnailId} id A thumbnail ID and token.
 * @return {string} The thumbnail URL.
 * @export
 */
ee.data.makeThumbUrl = function(id) {
  if (ee.data.getCloudApiEnabled()) {
    const base = ee.apiclient.getTileBaseUrl();
    return `${base}/${ee.apiclient.VERSION}/${id.thumbid}:getPixels`;
  }
  return `${ee.apiclient.getTileBaseUrl()}/api/thumb?thumbid=${id.thumbid}` +
      `&token=${id.token}`;
};


/**
 * Get a Download ID.
 *
 * @param {!Object} params An object containing download options with the
 *     following possible values:
 *   - image: The image to download.
 *   - name: a base name to use when constructing filenames.
 *   - bands: a description of the bands to download. Must be an array of
 *         dictionaries, each with the following keys:
 *     + id: the name of the band, a string, required.
 *     + crs: an optional CRS string defining the band projection.
 *     + crs_transform: an optional array of 6 numbers specifying an affine
 *           transform from the specified CRS, in row-major order:
 *           [xScale, xShearing, xTranslation, yShearing, yScale, yTranslation]
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
 *         ignored if dimensions is specified.
 *   - region: a polygon specifying a region to download.
 *   - filePerBand: Whether to produce a different GeoTIFF per band (boolean).
 *         Defaults to true. If false, a single GeoTIFF is produced and all
 *         band-level transformations will be ignored.
 *   - id: deprecated, use image: ee.Image(id)
 * @param {function(?ee.data.DownloadId, string=)=} opt_callback An optional
 *     callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.DownloadId} A download id and token, or null if a callback
 *     is specified.
 * @export
 */
ee.data.getDownloadId = function(params, opt_callback) {
  if (ee.data.getCloudApiEnabled()) {
    params = Object.assign({}, params);
    // Previously, the docs required an image ID parameter that was changed
    // to image, so we cast the ID to an ee.Image.
    if (params['id']) {
      // This resolves the circular dependency between data.js and image.js.
      const eeImage = goog.module.get('ee.Image');
      params['image'] = new eeImage(params['id']);
    }
    if (typeof params['image'] === 'string') {
      throw new Error('Image as serialized JSON string not supported.');
    }
    if (!params['image']) {
      throw new Error('Missing ID or image parameter.');
    }
    // The default is a zipped GeoTIFF per band if no format or filePerBand
    // parameter is specified.
    params['filePerBand'] = params['filePerBand'] !== false;
    params['format'] = params['format'] || (params['filePerBand'] ?
        'ZIPPED_GEO_TIFF_PER_BAND' :
        'ZIPPED_GEO_TIFF');
    if (params['region'] != null &&
        (params['scale'] != null || params['crs_transform'] != null) &&
        params['dimensions'] != null) {
      throw new Error(
          'Cannot specify (bounding region, crs_transform/scale, dimensions) ' +
          'simultaneously.');
    }
    if (typeof params['bands'] === 'string') {
      // Bands may be a stringified JSON string or a comma-separated string.
      try {
        params['bands'] = JSON.parse(params['bands']);
      } catch (e) {
        params['bands'] = ee.rpc_convert.bandList(params['bands']);
      }
    }
    if (params['bands'] && !Array.isArray(params['bands'])) {
      throw new Error('Bands parameter must be an array.');
    }
    if (params['bands'] &&
        params['bands'].every((band) => typeof band === 'string')) {
      // Support expressing the bands list as a list of strings.
      params['bands'] = params['bands'].map((band) => {
        return {id: band};
      });
    }
    if (params['bands'] && params['bands'].some(({id}) => id == null)) {
      throw new Error('Each band dictionary must have an id.');
    }
    if (typeof params['region'] === 'string') {
      params['region'] = JSON.parse(params['region']);
    }
    if (typeof params['crs_transform'] === 'string') {
      try {
        // Try parsing the list as a JSON.
        params['crs_transform'] = JSON.parse(params['crs_transform']);
      } catch (e) {} // Let the malformed string fall through.
    }
    const image = ee.data.images.buildDownloadIdImage(params['image'], params);
    const thumbnail = new ee.api.Thumbnail({
      name: null,
      expression: ee.data.expressionAugmenter_(
          ee.Serializer.encodeCloudApiExpression(image)),
      fileFormat: ee.rpc_convert.fileFormat(params['format']),
      filenamePrefix: params['name'],
      bandIds: params['bands'] &&
          ee.rpc_convert.bandList(params['bands'].map((band) => band.id)),
      grid: null,
    });
    const fields = ['name'];
    const getResponse = (response) => {
      /** @type {!ee.data.DownloadId} */
      const ret = {docid: response['name'], token: ''};
      return ret;
    };
    const call = new ee.apiclient.Call(opt_callback);
    return call.handle(call.thumbnails()
                           .create(call.projectsPath(), thumbnail, {fields})
                           .then(getResponse));
  }
  params = goog.object.clone(params);
  const id = /** @type {?ee.data.DownloadId} */ (ee.data.send_(
      '/download',
      ee.data.makeRequest_(params),
      opt_callback));
  return id;
};


/**
 * Create a download URL from a docid and token.
 *
 * @param {!ee.data.DownloadId} id A download id and token.
 * @return {string} The download URL.
 * @export
 */
ee.data.makeDownloadUrl = function(id) {
  ee.apiclient.initialize();
  const base = ee.apiclient.getTileBaseUrl();
  return ee.data.getCloudApiEnabled() ?
      `${base}/${ee.apiclient.VERSION}/${id.docid}:getPixels` :
      `${base}/api/download?docid=${id.docid}&token=${id.token}`;
};


/**
 * Get a download ID.
 * @param {Object} params An object containing table download options with the
 *     following possible values:
 *   - table: The feature collection to download.
 *   - format: The download format, CSV, JSON, KML, KMZ or TF_RECORD.
 *   - selectors: List of strings of selectors that can be used to
 *          determine which attributes will be downloaded.
 *   - filename: The name of the file that will be downloaded.
 * @param {function(?ee.data.DownloadId, string=)=} opt_callback An optional
 *     callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.DownloadId} A download id and token, or null if a
 *     callback is specified.
 * @export
 */
ee.data.getTableDownloadId = function(params, opt_callback) {
  if (ee.data.getCloudApiEnabled()) {
    const call = new ee.apiclient.Call(opt_callback);
    const fileFormat = ee.rpc_convert.tableFileFormat(params['format']);
    const expression = ee.data.expressionAugmenter_(
        ee.Serializer.encodeCloudApiExpression(params['table']));

    // Maybe convert selectors to an Array of strings.
    // Previously a string with commas delimiting each selector was supported.
    let selectors = null;
    if (params['selectors'] != null) {
      if (typeof params['selectors'] === 'string') {
        selectors = params['selectors'].split(',');
      } else if (
          Array.isArray(params['selectors']) &&
          params['selectors'].every((x) => typeof x === 'string')) {
        selectors = params['selectors'];
      } else {
        throw new Error('\'selectors\' parameter must be an array of strings.');
      }
    }
    const filename = params['filename'] || null;
    const table = new ee.api.Table({
      name: null,
      expression,
      fileFormat,
      selectors,
      filename,
    });
    const fields = ['name'];
    /** @type {function(!ee.api.Table): !ee.data.DownloadId} */
    const getResponse = (res) => {
      /** @type {!ee.data.DownloadId} */
      const ret = {docid: res.name || '', token: ''};
      return ret;
    };
    return call.handle(call.tables()
                           .create(call.projectsPath(), table, {fields})
                           .then(getResponse));
  }
  params = goog.object.clone(params);
  const id = /** @type {?ee.data.DownloadId} */ (ee.data.send_(
      '/table',
      ee.data.makeRequest_(params),
      opt_callback));

  return id;
};


/**
 * Create a table download URL from a docid and token.
 * @param {!ee.data.DownloadId} id A table download id and token.
 * @return {string} The download URL.
 * @export
 */
ee.data.makeTableDownloadUrl = function(id) {
  if (ee.data.getCloudApiEnabled()) {
    const base = ee.apiclient.getTileBaseUrl();
    return base + '/v1alpha/' + id.docid + ':getFeatures';
  }
  return ee.apiclient.getTileBaseUrl() + '/api/table?docid=' + id.docid +
      '&token=' + id.token;
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
  if (ee.data.getCloudApiEnabled()) {
    // From https://en.wikipedia.org/wiki/UUID#Version_4_(random)
    const rand = (n) => Math.floor(Math.random() * n);
    const hex = (d) => rand(Math.pow(2, d*4)).toString(16).padStart(d, '0');
    const variantPart = () => (8 + rand(4)).toString(16) + hex(3);
    const generateUUID =
        () => [hex(8), hex(4), '4' + hex(3), variantPart(), hex(12)].join('-');
    const uuids = goog.array.range(opt_count || 1).map(generateUUID);
    return opt_callback ? opt_callback(uuids) : uuids;
  }
  var params = {};
  if (typeof opt_count === 'number') {
    params['count'] = opt_count;
  }
  return /** @type {?Array.<string>} */ (
      ee.data.send_('/newtaskid', ee.data.makeRequest_(params), opt_callback));
};


/**
 * Retrieve status of one or more long-running tasks.
 *
 * @deprecated Use ee.data.getOperation().
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
  if (ee.data.getCloudApiEnabled()) {
    const opNames = ee.data.makeStringArray_(taskId).map(
        ee.rpc_convert.taskIdToOperationName);
    if (opNames.length === 1) {
      const getResponse = (op) => [ee.rpc_convert.operationToTask(op)];
      const call = new ee.apiclient.Call(opt_callback);
      return call.handle(call.operations().get(opNames[0]).then(getResponse));
    }
    const getResponse =
        (data) => opNames.map(id => ee.rpc_convert.operationToTask(data[id]));

    const call = new ee.apiclient.BatchCall(opt_callback);
    const operations = call.operations();
    return call.send(opNames.map(op => [op, operations.get(op)]), getResponse);
  }
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
  if (typeof value === 'string') {
    return [value];
  } else if (Array.isArray(value)) {
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
 * @deprecated Use ee.data.listOperations().
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
 * @deprecated Use ee.data.listOperations().
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
  if (ee.data.getCloudApiEnabled()) {
    /** @type {function(?Array<!ee.api.Operation>):!ee.data.TaskListResponse} */
    const convert = (ops) => ({tasks: ops.map(ee.rpc_convert.operationToTask)});
    if (opt_callback) {
      /** @type {function(?Array<?>=,string=)} */
      const callback = (v, e) => opt_callback(v ? convert(v) : null, e);
      ee.data.listOperations(opt_limit, callback);
      return null;
    }
    return convert(ee.data.listOperations(opt_limit));
  }
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
 * @param {number=} opt_limit Maximum number of results to return.
 * @param {function(?Array<!ee.api.Operation>=,string=)=} opt_callback
 * @return {?Array<!ee.api.Operation>}
 * @export
 */
ee.data.listOperations = function(opt_limit, opt_callback) {
  const ops = [];
  const truncatedOps = () => opt_limit ? ops.slice(0, opt_limit) : ops;
  /** @type {!ee.api.ProjectsOperationsListNamedParameters} */
  const params = {pageSize: ee.data.TASKLIST_PAGE_SIZE_};
  // Use tail recursion to fetch batches of operations.
  const getResponse = (response) => {
    goog.array.extend(ops, (response.operations || []));
    if (!response.nextPageToken || (opt_limit && ops.length >= opt_limit)) {
      // Recursion is done! Optionally run callback, and then exit all calls.
      if (opt_callback) {
        opt_callback(truncatedOps());
      }
    } else {
      params.pageToken = response.nextPageToken;
      call.handle(operations.list(call.projectsPath(), params)
          .then(getResponse));
    }
    return null;
  };
  // Provide an optional callback to enable async mode: it ignores the output
  // because getResponse will handle it, but handles errors.
  const errorCallback = opt_callback
      ? (value, err = undefined) => err && opt_callback(value, err)
      : undefined;

  const call = new ee.apiclient.Call(errorCallback);
  const operations = call.operations();
  call.handle(operations.list(call.projectsPath(), params).then(getResponse));

  return opt_callback ? null : truncatedOps();
};


/**
 * Cancels the given operation(s).
 *
 * @param {string|!Array<string>} operationName Operation name(s).
 * @param {function(?Object, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 *     The callback is passed an empty object.
 * @export
 */
ee.data.cancelOperation = function(operationName, opt_callback) {
  const opNames = ee.data.makeStringArray_(operationName);
  const request = new ee.api.CancelOperationRequest();  // Empty, but required.
  if (opNames.length === 1) {
    const call = new ee.apiclient.Call(opt_callback);
    call.handle(call.operations().cancel(opNames[0], request));
    return;
  }
  const call = new ee.apiclient.BatchCall(opt_callback);
  const operations = call.operations();
  call.send(opNames.map((op) => [op, operations.cancel(op, request)]));
};


/**
 * Gets information on an operation or list of operations.
 *
 * @param {string|!Array<string>} operationName Operation name(s).
 * @param {function(?Object, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.api.Operation|!Object<string,!ee.api.Operation>}
 *     Operation status, or a map from operation names to status. See
 *     https://cloud.google.com/apis/design/design_patterns#long_running_operations
 * @export
 */
ee.data.getOperation = function(operationName, opt_callback) {
  const opNames = ee.data.makeStringArray_(operationName).map(
      ee.rpc_convert.taskIdToOperationName);
  if (!Array.isArray(operationName)) {
    const call = new ee.apiclient.Call(opt_callback);
    return call.handle(call.operations().get(opNames[0]));
  }
  const call = new ee.apiclient.BatchCall(opt_callback);
  const operations = call.operations();
  return call.send(opNames.map(op => [op, operations.get(op)]));
};


/**
 * Cancels the task provided.
 *
 * @deprecated Use ee.data.cancelOperation().
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
  if (ee.data.getCloudApiEnabled()) {
    const operations = taskId.map(ee.rpc_convert.taskIdToOperationName);
    ee.data.cancelOperation(operations, /** @type {?} */ (opt_callback));
    return null;
  }

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
 *      type (string) Either 'EXPORT_IMAGE', 'EXPORT_FEATURES', 'EXPORT_VIDEO'
 * or 'EXPORT_TILES'. json (string) JSON description of the image.
 * @param {function(ee.data.ProcessingResponse, string=)=} opt_callback An
 *     optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.ProcessingResponse} May contain field 'note' with value
 *     'ALREADY_EXISTS' if an identical task with the same ID already exists.
 *     Null if a callback is specified.
 * @export
 */
ee.data.startProcessing = function(taskId, params, opt_callback) {
  if (ee.data.getCloudApiEnabled()) {
    params['id'] = taskId;
    const taskType = params['type'];
    const metadata = (params['sourceUrl'] != null) ?
        {'__source_url__': params['sourceUrl']} :
        {};
    const call = new ee.apiclient.Call(opt_callback);
    const handle = (response) => call.handle(
        response.then(ee.rpc_convert.operationToProcessingResponse));
    switch (taskType) {
      case ee.data.ExportType.IMAGE:
        const imageRequest =
            ee.data.prepareExportImageRequest_(params, metadata);
        return handle(call.image().export(call.projectsPath(), imageRequest));
      case ee.data.ExportType.TABLE:
        const tableRequest =
            ee.rpc_convert_batch.taskToExportTableRequest(params);
        tableRequest.expression =
            ee.data.expressionAugmenter_(tableRequest.expression, metadata);
        return handle(call.table().export(call.projectsPath(), tableRequest));
      case ee.data.ExportType.VIDEO:
        const videoRequest =
            ee.data.prepareExportVideoRequest_(params, metadata);
        return handle(call.video().export(call.projectsPath(), videoRequest));
      case ee.data.ExportType.MAP:
        const mapRequest = ee.data.prepareExportMapRequest_(params, metadata);
        return handle(call.map().export(call.projectsPath(), mapRequest));
      default:
        throw new Error(
            `Unable to start processing for task of type ${taskType}`);
    }
  }
  params = goog.object.clone(params);
  if (params['element'] != null) {
    params['json'] = params['element'].serialize();
    delete params['element'];
  }
  if (Array.isArray(params['crs_transform'])) {
    params['crs_transform'] = params['crs_transform'].toString();
  }
  params['id'] = taskId;
  return /** @type {?ee.data.ProcessingResponse} */ (ee.data.send_(
      '/processingrequest', ee.data.makeRequest_(params), opt_callback));
};

/**
 * Creates an ExportImageRequest for a given ImageTaskConfig.
 *
 * The ImageTaskConfig has some parameters which have no equivalent in the
 * Cloud API and need to be applied directly to the underlying expression here.
 * This is the best place to do it to avoid circular dependencies.
 *
 * @param {!Object} taskConfig image task configuration params.
 * @param {!Object} metadata associated with the export request.
 * @return {!ee.api.ExportImageRequest}
 * @private
 */
ee.data.prepareExportImageRequest_ = function(taskConfig, metadata) {
  const imageTask = ee.data.images.applyTransformsToImage(taskConfig);
  const imageRequest = ee.rpc_convert_batch.taskToExportImageRequest(imageTask);
  imageRequest.expression =
      ee.data.expressionAugmenter_(imageRequest.expression, metadata);
  return imageRequest;
};


/**
 * Creates an ExportVideoRequest for a given VideoTaskConfig.
 *
 * The VideoTaskConfig has some parameters which have no equivalent in the
 * Cloud API and need to be applied directly to the underlying expression here.
 * This is the best place to do it to avoid circular dependencies.
 *
 * @param {!Object} taskConfig video task configuration params.
 * @param {!Object} metadata associated with the export request.
 * @return {!ee.api.ExportVideoRequest}
 * @private
 */
ee.data.prepareExportVideoRequest_ = function(taskConfig, metadata) {
  // Save and remove scale so we use it in our request, and not apply it to
  // the expression.
  const videoTask = ee.data.images.applyTransformsToCollection(taskConfig);
  const videoRequest = ee.rpc_convert_batch.taskToExportVideoRequest(videoTask);
  videoRequest.expression =
      ee.data.expressionAugmenter_(videoRequest.expression, metadata);
  return videoRequest;
};

/**
 * Creates an ExportMapRequest for a given MapTaskConfig.
 *
 * The MapTaskConfig has some parameters which have no equivalent in the
 * Cloud API and need to be applied directly to the underlying expression here.
 * This is the best place to do it to avoid circular dependencies.
 *
 * @param {!Object} taskConfig map task configuration params.
 * @param {!Object} metadata associated with the export request.
 * @return {!ee.api.ExportMapRequest}
 * @private
 */
ee.data.prepareExportMapRequest_ = function(taskConfig, metadata) {
  // Save and remove scale so we use it in our request, and not apply it to
  // the expression.
  const scale = taskConfig['scale'];
  delete taskConfig['scale'];
  const mapTask = ee.data.images.applyTransformsToImage(taskConfig);
  mapTask['scale'] = scale;
  const mapRequest = ee.rpc_convert_batch.taskToExportMapRequest(mapTask);
  mapRequest.expression =
      ee.data.expressionAugmenter_(mapRequest.expression, metadata);
  return mapRequest;
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
  if (ee.data.getCloudApiEnabled()) {
    const manifest = ee.rpc_convert.toImageManifest(request);
    const convert = (arg) => /** @type {?ee.data.ProcessingResponse} */ (
        arg ? ee.rpc_convert.operationToProcessingResponse(arg) : null);
    const wrappedCallback = /** @type {?} */ (
        opt_callback && ((arg, err) => opt_callback(convert(arg), err)));
    // Convert return value in sync mode and callback argument in async mode.
    return convert(ee.data.ingestImage(taskId, manifest, wrappedCallback));
  }
  var params = {
    'id': taskId,
    'request': goog.json.serialize(request)
  };
  return /** @type {?ee.data.ProcessingResponse} */ (ee.data.send_(
      '/ingestionrequest', ee.data.makeRequest_(params), opt_callback));
};


/**
 * Ingests an image asset.
 *
 * @param {string} taskId ID for the task (obtained using newTaskId).
 * @param {!ee.api.ImageManifest} imageManifest The object that
 *     describes the ingestion.
 * @param {function(?ee.api.Operation, string=)} callback
 * @return {?ee.api.Operation}
 */
ee.data.ingestImage = function(taskId, imageManifest, callback) {
  const request = new ee.api.ImportImageRequest({
    imageManifest,
    requestId: taskId,
    overwrite: null,
    description: null,
  });
  const retries = taskId ? undefined : 0;  // Cannot retry if server provides ID
  const call = new ee.apiclient.Call(callback, retries);
  return call.handle(call.image().import(call.projectsPath(), request));
};


/**
 * Ingests a table asset.
 *
 * @param {string} taskId ID for the task (obtained using newTaskId).
 * @param {!ee.api.TableManifest} tableManifest The object that
 *     describes the ingestion.
 * @param {function(?ee.api.Operation, string=)} callback
 * @return {?ee.api.Operation}
 */
ee.data.ingestTable = function(taskId, tableManifest, callback) {
  const request = new ee.api.ImportTableRequest({
    tableManifest,
    requestId: taskId,
    overwrite: null,
    description: null,
  });
  const retries = taskId ? undefined : 0;  // Cannot retry if server provides ID
  const call = new ee.apiclient.Call(callback, retries);
  return call.handle(call.table().import(call.projectsPath(), request));
};


/**
 * Creates a table asset ingestion task.
 *
 * @param {string} taskId ID for the task (obtained using newTaskId).
 * @param {!ee.data.TableIngestionRequest} request The object that describes the
 *     ingestion.
 * @param {function(?ee.data.ProcessingResponse, string=)=} opt_callback An
 *     optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.ProcessingResponse} May contain field 'note' with value
 *     'ALREADY_EXISTS' if an identical task with the same ID already exists.
 *     Null if a callback is specified.
 * @export
 */
ee.data.startTableIngestion = function(taskId, request, opt_callback) {
  if (ee.data.getCloudApiEnabled()) {
    const manifest = ee.rpc_convert.toTableManifest(request);
    const convert = (arg) => /** @type {?ee.data.ProcessingResponse} */ (
        arg ? ee.rpc_convert.operationToProcessingResponse(arg) : null);
    const wrappedCallback = /** @type {?} */ (
        opt_callback && ((arg, err) => opt_callback(convert(arg), err)));
    // Convert return value in sync mode and callback argument in async mode.
    return convert(ee.data.ingestTable(taskId, manifest, wrappedCallback));
  }
  var params = {
    'id': taskId,
    'tableRequest': goog.json.serialize(request)
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
 * @param {function(?Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {?Object} The value call results, or null if a callback is specified.
 * @export
 */
ee.data.getAsset = function(id, opt_callback) {
  if (ee.data.getCloudApiEnabled()) {
    const call = new ee.apiclient.Call(opt_callback);
    const name = ee.rpc_convert.assetIdToAssetName(id);
    return call.handle(
        call.assets().get(name, {prettyPrint: false})
        .then(ee.rpc_convert.assetToLegacyResult));
  }
  return ee.data.send_('/info',
                       new goog.Uri.QueryData().add('id', id),
                       opt_callback);
};


/**
 * Load info for an asset, given an asset id.
 *
 * @deprecated Use ee.data.getAsset().
 * @param {string} id The asset to be retrieved.
 * @param {function(?Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {?Object} The value call results, or null if a callback is specified.
 * @export
 */
ee.data.getInfo = ee.data.getAsset;


/**
 * Returns a list of the contents in an asset collection or folder.
 *
 * @deprecated Use ee.data.listAssets() or ee.data.listImages().
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
  if (ee.data.getCloudApiEnabled()) {
    const call = new ee.apiclient.Call(opt_callback);
    let methodRoot = call.assets();
    let parent = ee.rpc_convert.assetIdToAssetName(params['id']);
    const isProjectAssetRoot =
        ee.rpc_convert.CLOUD_ASSET_ROOT_RE.test(params['id']);
    if (isProjectAssetRoot) {
      // Use call.projects() for project asset root calls instead of
      // call.assets().
      methodRoot = call.projects();
      parent = ee.rpc_convert.projectParentFromPath(params['id']);
    }
    // If the parameters don't specify anything other than the ID and "num",
    // then assets.listImages will be called instead of assets.listAssets.
    // TODO(user): Add support for page tokens for listImages and listAssets.
    if (Object.keys(params).every(k => k === 'id' || k === 'num')) {
      return call.handle(
          methodRoot.listAssets(parent, {pageSize: params['num']})
          .then(ee.rpc_convert.listAssetsToGetList));
    } else {
      if (isProjectAssetRoot) {
        throw new Error(
            'getList on a project does not support filtering options. Please ' +
            'provide a full asset path. Got: ' + params['id']);
      }
      const body = ee.rpc_convert.getListToListImages(params);
      return call.handle(methodRoot.listImages(parent, body)
                             .then(ee.rpc_convert.listImagesToGetList));
    }
  }
  const request = ee.data.makeRequest_(params);
  return /** @type {?ee.data.AssetList} */ (
      ee.data.send_('/list', request, opt_callback));
};


/**
 * Returns a list of the contents in an asset collection or folder.
 *
 * @param {string} parent
 * @param {!ee.api.ProjectsAssetsListAssetsNamedParameters=} params
 * @param {function(?ee.api.ListAssetsResponse, string=)=}
 *     opt_callback  If not supplied, the call is made synchronously.
 * @return {?ee.api.ListAssetsResponse}
 *     Results, or null if a callback is specified.
 * @export
 */
ee.data.listAssets = function(parent, params = {}, opt_callback = undefined) {
  // Detect project asset root call.
  const isProjectAssetRoot = ee.rpc_convert.CLOUD_ASSET_ROOT_RE.test(parent);
  const call = new ee.apiclient.Call(opt_callback);
  const methodRoot = isProjectAssetRoot ? call.projects() : call.assets();
  parent = isProjectAssetRoot ? ee.rpc_convert.projectParentFromPath(parent) :
                                ee.rpc_convert.assetIdToAssetName(parent);
  return call.handle(methodRoot.listAssets(parent, params));
};


/**
 * Returns a list of the contents in an asset collection or folder.
 *
 * @param {string} parent
 * @param {!ee.api.ProjectsAssetsListImagesNamedParameters=} params
 * @param {function(?ee.api.ListImagesResponse, string=)=}
 *     opt_callback  If not supplied, the call is made synchronously.
 * @return {?ee.api.ListImagesResponse}
 *     Results, or null if a callback is specified.
 * @export
 */
ee.data.listImages = function(parent, params = {}, opt_callback = undefined) {
  const call = new ee.apiclient.Call(opt_callback);
  return call.handle(call.assets().listImages(parent, params));
};


/**
 * Returns a list of the contents in an asset collection or folder.
 *
 * @param {string=} project Project to query. Defaults to current project.
 * @param {function(?ee.api.ListAssetsResponse, string=)=}
 *     opt_callback  If not supplied, the call is made synchronously.
 * @return {?ee.api.ListAssetsResponse}
 *     Results, or null if a callback is specified.
 * @export
 */
ee.data.listBuckets = function(project, opt_callback) {
  const call = new ee.apiclient.Call(opt_callback);
  return call.handle(
      call.projects().listAssets(project || call.projectsPath()));
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
  if (ee.data.getCloudApiEnabled()) {
    const call = new ee.apiclient.Call(opt_callback);
    return call.handle(
        call.projects().listAssets(call.projectsPath())
        .then(ee.rpc_convert.listAssetsToGetList));
  }
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
  if (ee.data.getCloudApiEnabled()) {
    const parent = ee.rpc_convert.projectParentFromPath(requestedId);
    const assetId = (parent === 'projects/' + ee.apiclient.DEFAULT_PROJECT)
        ? requestedId : undefined;
    const asset = new ee.api.EarthEngineAsset({type: 'Folder'});
    const call = new ee.apiclient.Call(opt_callback);
    call.handle(
        call.assets().create(parent, asset, {assetId})
        .then(ee.rpc_convert.assetToLegacyResult));
    return;
  }
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
  if (ee.data.getCloudApiEnabled()) {
    if (opt_force) {
      throw new Error('Asset overwrite not supported.');
    }
    if (typeof value === 'string') {
      throw new Error('Asset cannot be specified as string.');
    }
    const name = value['name'] || (
        opt_path && ee.rpc_convert.assetIdToAssetName(opt_path));
    if (!name) {
      throw new Error('Either asset name or opt_path must be specified.');
    }
    const split = name.indexOf('/assets/');
    if (split === -1) {
      throw new Error('Asset name must contain /assets/.');
    }
    const asset = new ee.api.EarthEngineAsset(value);
    const parent = name.slice(0, split);
    const assetId = name.slice(split + 8);
    asset.id = null;
    asset.name = null;
    if (opt_properties && !asset.properties) {
      asset.properties = opt_properties;
    }
    asset.type = ee.rpc_convert.assetTypeForCreate(asset.type);
    const call = new ee.apiclient.Call(opt_callback);
    return call.handle(
        call.assets().create(parent, asset, {assetId})
        .then(ee.rpc_convert.assetToLegacyResult));
  }
  if (typeof value !== 'string') {
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
 * @param {function(?Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously.
 * @return {?Object} A description of the newly created folder.
 * @export
 */
ee.data.createFolder = function(path, opt_force, opt_callback) {
  if (ee.data.getCloudApiEnabled()) {
    return ee.data.createAsset(
        {type: 'Folder'}, path, opt_force, undefined, opt_callback);
  }
  var args = {
    'id': path,
    'force': opt_force || false
  };
  return ee.data.send_('/createfolder',
                       ee.data.makeRequest_(args),
                       opt_callback);
};


/**
 * Renames the asset from sourceId to destinationId.
 *
 * @param {string} sourceId The ID of the asset to rename.
 * @param {string} destinationId The new ID of the asset.
 * @param {function(?Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously. The callback is
 *     passed an empty object and an error message, if any.
 * @export
 */
ee.data.renameAsset = function(sourceId, destinationId, opt_callback) {
  if (ee.data.getCloudApiEnabled()) {
    const sourceName = ee.rpc_convert.assetIdToAssetName(sourceId);
    const destinationName = ee.rpc_convert.assetIdToAssetName(destinationId);
    const request = new ee.api.MoveAssetRequest({destinationName});
    const call = new ee.apiclient.Call(opt_callback);
    call.handle(
        call.assets().move(sourceName, request)
        .then(ee.rpc_convert.assetToLegacyResult));
    return;
  }
  var params = {'sourceId': sourceId, 'destinationId': destinationId};
  ee.data.send_('/rename', ee.data.makeRequest_(params), opt_callback);
};


/**
 * Copies the asset from sourceId into destinationId.
 *
 * @param {string} sourceId The ID of the asset to copy.
 * @param {string} destinationId The ID of the new asset created by copying.
 * @param {boolean=} opt_overwrite Overwrite any existing destination asset ID.
 * @param {function(?Object, string=)=} opt_callback An optional callback.
 *     If not supplied, the call is made synchronously. The callback is
 *     passed an empty object and an error message, if any.
 * @export
 */
ee.data.copyAsset = function(
    sourceId, destinationId, opt_overwrite, opt_callback) {
  if (ee.data.getCloudApiEnabled()) {
    const sourceName = ee.rpc_convert.assetIdToAssetName(sourceId);
    const destinationName = ee.rpc_convert.assetIdToAssetName(destinationId);
    const overwrite = (opt_overwrite != null) ? opt_overwrite : null;
    const request = new ee.api.CopyAssetRequest({destinationName, overwrite});
    const call = new ee.apiclient.Call(opt_callback);
    call.handle(
        call.assets().copy(sourceName, request)
        .then(ee.rpc_convert.assetToLegacyResult));
    return;
  }
  var params = {'sourceId': sourceId, 'destinationId': destinationId};
  if (opt_overwrite) {
    params['allowOverwrite'] = opt_overwrite;
  }
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
  if (ee.data.getCloudApiEnabled()) {
    const call = new ee.apiclient.Call(opt_callback);
    call.handle(
        call.assets().delete(ee.rpc_convert.assetIdToAssetName(assetId)));
    return;
  }
  var params = {'id': assetId};
  ee.data.send_('/delete', ee.data.makeRequest_(params), opt_callback);
};


/**
 * Returns the access control list of the asset with the given ID.
 *
 * The authenticated user must be a writer or owner of an asset to see its ACL.
 *
 * @param {string} assetId The ID of the asset to check.
 * @param {function(?ee.data.AssetAcl, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.AssetAcl} The asset's ACL. Null if a callback is specified.
 * @export
 */
ee.data.getAssetAcl = function(assetId, opt_callback) {
  if (ee.data.getCloudApiEnabled()) {
    const resource = ee.rpc_convert.assetIdToAssetName(assetId);
    const request = new ee.api.GetIamPolicyRequest();
    const call = new ee.apiclient.Call(opt_callback);
    return call.handle(
        call.assets().getIamPolicy(resource, request, {prettyPrint: false})
        .then(ee.rpc_convert.iamPolicyToAcl));
  }
  return /** @type {?ee.data.AssetAcl} */ (ee.data.send_(
      '/getacl', ee.data.makeRequest_({'id': assetId}), opt_callback, 'GET'));
};


/**
 * Returns the access control list of the asset with the given ID.
 *
 * The authenticated user must be a writer or owner of an asset to see its ACL.
 *
 * @param {string} assetId The ID of the asset to check.
 * @param {function(?ee.api.Policy, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.api.Policy}
 */
ee.data.getIamPolicy = function(assetId, opt_callback) {
  const resource = ee.rpc_convert.assetIdToAssetName(assetId);
  const request = new ee.api.GetIamPolicyRequest();
  const call = new ee.apiclient.Call(opt_callback);
  return call.handle(
      call.assets().getIamPolicy(resource, request, {prettyPrint: false}));
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
 * @param {string} assetId The ID of the asset to check.
 * @param {!ee.api.Policy} policy actually google.iam.v1.Policy
 * @param {function(?Object, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.api.Policy} the policy
 */
ee.data.setIamPolicy = function(assetId, policy, opt_callback) {
  const resource = ee.rpc_convert.assetIdToAssetName(assetId);
  const request = new ee.api.SetIamPolicyRequest({policy});
  const call = new ee.apiclient.Call(opt_callback);
  return call.handle(
      call.assets().setIamPolicy(resource, request, {prettyPrint: false}));
};


/**
 * Updates an asset.
 *
 * The authenticated user must be a writer or owner of the asset.
 *
 * @param {string} assetId The ID of the asset to update.
 * @param {!ee.api.EarthEngineAsset} asset The updated version of the asset,
 *     containing only the new values of the fields to be updated. Only the
 *     "start_time", "end_time", and "properties" fields can be updated. If a
 *     value is named in "updateMask", but is unset in "asset", then that value
 *     will be deleted from the asset.
 * @param {?Array<string>} updateFields A list of the field names to update.
 *     This may contain:
 *       "start_time" or "end_time" to update the corresponding timestamp,
 *       "properties.PROPERTY_NAME" to update a given property, or
 *       "properties" to update all properties.
 *     If the list is empty, all properties and both timestamps will be updated.
 * @param {function(?Object, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?Object}
 * @export
 */
ee.data.updateAsset = function(assetId, asset, updateFields, opt_callback) {
  const updateMask = (updateFields || []).join(",");
  const request = new ee.api.UpdateAssetRequest({asset, updateMask});
  const call = new ee.apiclient.Call(opt_callback);
  return call.handle(
      call.assets().patch(ee.rpc_convert.assetIdToAssetName(assetId), request)
      .then(ee.rpc_convert.assetToLegacyResult));
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
  if (ee.data.getCloudApiEnabled()) {
    const resource = ee.rpc_convert.assetIdToAssetName(assetId);
    const policy = ee.rpc_convert.aclToIamPolicy(aclUpdate);
    const request = new ee.api.SetIamPolicyRequest({policy});
    const call = new ee.apiclient.Call(opt_callback);
    call.handle(
        call.assets().setIamPolicy(resource, request, {prettyPrint: false}));
    return;
  }
  // Delete the groups field, as it is only needed for conversion from ACLs to
  // IamPolicy.
  aclUpdate = {
    readers: aclUpdate.readers,
    writers: aclUpdate.writers,
    all_users_can_read: aclUpdate.all_users_can_read,
  };
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
 * @deprecated Use ee.data.updateAsset().
 * @param {string} assetId The ID of the asset to update.
 * @param {!Object} properties The keys and values of the properties to update.
 * @param {function(?Object, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 *     The callback is passed an empty object.
 * @export
 */
ee.data.setAssetProperties = function(assetId, properties, opt_callback) {
  if (ee.data.getCloudApiEnabled()) {
    const asset = ee.rpc_convert.legacyPropertiesToAssetUpdate(properties);
    const camelToSnake = (str) =>
        str.replace(/([A-Z])/g, (all, cap) => '_' + cap.toLowerCase());
    const updateFields =
          asset.getClassMetadata().keys
          // First filter on top-level properties and convert the keys.
          .filter((k) => k !== 'properties' && asset.Serializable$has(k))
          // Update masks use snake case for declared fields.
          .map(camelToSnake)
          // then append the other asset properties escaping the keys
          // so we update them as-is.
          .concat(Object.keys(asset.properties || {})
                        .map((k) => `properties."${k}"`));
    ee.data.updateAsset(assetId, asset, updateFields, opt_callback);
    return;
  }
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
 * @param {function(?ee.data.AssetQuotaDetails, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.AssetQuotaDetails} The asset root's quota usage details.
 *     Null if a callback is specified.
 * @export
 */
ee.data.getAssetRootQuota = function(rootId, opt_callback) {
  if (ee.data.getCloudApiEnabled()) {
    const name = ee.rpc_convert.assetIdToAssetName(rootId);
    /** @type {function(!Object):!ee.data.AssetQuotaDetails} */
    const getResponse = (asset) => {
      if (!(asset instanceof ee.api.EarthEngineAsset) || !asset.quota) {
        throw new Error(rootId + ' is not a root folder.');
      }
      /** @type {!ee.api.FolderQuota} */
      const quota = asset.quota;
      const toNumber = (field) => Number(field || 0);
      return {
        asset_count: {
          usage: toNumber(quota.assetCount),
          limit: toNumber(quota.maxAssetCount),
        },
        asset_size: {
          usage: toNumber(quota.sizeBytes),
          limit: toNumber(quota.maxSizeBytes),
        }
      };
    };
    const call = new ee.apiclient.Call(opt_callback);
    // TODO(b/141623314): Undo this when the getAssets call accepts /assets/,
    // as currently, the request must have a full asset path, e.g. /assets/foo.
    const assetsCall = call.assets();
    const validateParams = assetsCall.$apiClient.$validateParameter;
    assetsCall.$apiClient.$validateParameter = (param, pattern) => {
      if (pattern.source === '^projects\\/[^/]+\\/assets\\/.+$') {
        // Allow the regex to accept an empty string after the last slash.
        pattern = new RegExp('^projects\/[^/]+\/assets\/.*$');
      }
      return validateParams(param, pattern);
    };
    const getAssetRequest = assetsCall.get(name, {prettyPrint: false});
    return call.handle(getAssetRequest.then(getResponse));
  }
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
  FEATURE_COLLECTION: 'FeatureCollection',
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
     * Owners, writer, and reader email addresses that are known to be groups.
     * @export {!Set<string>|undefined}
     */
    this.groups;

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
     * Owners, writer, and reader email addresses that are known to be groups.
     * @export {!Set<string>|undefined}
     */
    this.groups;

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

    /**
     * @export {number|undefined}
     */
    this.version;
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
     * This field is always "Table".
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
     * The image to render, represented as an ee.Image or JSON string.
     * @export {!ee.Image|string|undefined}
     */
    this.image;

    /**
     * The image collection to render.
     * @export {!ee.Collection|undefined}
     */
    this.imageCollection;

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
     * @export {number|string|!Array<number>|undefined}
     */
    this.dimensions;

    /**
     * The geospatial region of the image to render. By default, the whole
     * image. If defined, either an array in the format [east, south, west,
     * north] or else a GeoJSON geometry.
     * @export {!Array<number>|!ee.data.GeoJSONGeometry|undefined}
     */
    this.region;

    /**
     * The base name of the thumbnail, only used for zipped GeoTIFF.
     * @export {string|undefined}
     */
    this.name;
  }
};


/**
 * An object describing the parameters for generating a video thumbnail.
 * @record @struct
 */
ee.data.VideoThumbnailOptions = class extends ee.data.ThumbnailOptions {
  constructor() {
    super();

    /**
     * Animation speed.
     * @export {number|undefined}
     */
    this.framesPerSecond;

    /**
     * The maximum number of video frames to compute and export.
     * @export {number|undefined}
     */
    this.maxFrames;

    /**
     * The maximum number of pixels to compute and export per frame.
     * @export {string|undefined}
     */
    this.maxPixelsPerFrame;

    /**
     * The output file format.
     * @export {string|undefined}
     */
    this.format;
  }
};


/**
 * An object describing the parameters for generating a filmstrip thumbnail.
 * @record @struct
 */
ee.data.FilmstripThumbnailOptions = class extends ee.data.ThumbnailOptions {
  constructor() {
    super();

    /**
     * The orientation of the filmstrip: horizontal or vertical.
     * @export {string|undefined}
     */
    this.orientation;

    /**
     * The output file format.
     * @export {string|undefined}
     */
    this.format;
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

    /**
     * @export {boolean|undefined}
     */
    this.preview;

    /**
     * @export {string|undefined}
     */
    this.sourceCodeUri;
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

    /**
     * @export {string}
     */
    this.urlFormat;
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
 *   crs_transform: (undefined|!Array<number>|string),
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
 *   crs_transform: (undefined|!Array<number>|string),
 *   dimensions: (undefined|string),
 *   scale: (undefined|number),
 *   region: (undefined|string),
 *   maxPixels: (undefined|number),
 *   maxWorkers: (undefined|number),
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
 * Maps Mercator map tiles to Cloud Storage.
 *
 * @typedef {{
 *   id: string,
 *   type: string,
 *   sourceUrl: (undefined|string),
 *   description: (undefined|string),
 *   element: (undefined|!ee.Element),
 *   minZoom: (undefined|number),
 *   maxZoom: (undefined|number),
 *   maxWorkers: (undefined|number),
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
 *   assetId: (undefined|string),
 *   maxWorkers: (undefined|number)
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
 *   crs_transform: (undefined|!Array<number>|string),
 *   dimensions: (undefined|number|string),
 *   region: (undefined|string),
 *   scale: (undefined|number),
 *   maxPixels: (undefined|number),
 *   maxFrames: (undefined|number),
 *   maxWorkers: (undefined|number),
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
 * A request to import a table asset.
 * @record @struct
 */
ee.data.TableIngestionRequest = class {
  constructor() {
    /**
     * The ID to give the imported table asset (e.g., "users/yourname/tableid").
     * @export {string}
     */
    this.id;

    /**
     * The sources from which to construct the table. Currently, it is only
     * possible to use a single shapefile in uploading a table.
     * @see ee.data.TableSource
     * @export {!Array<!ee.data.TableSource>}
     */
    this.sources;
  }
};


/**
 * The properties of a table file to import. Extends ee.data.FileSource.
 * @see ee.data.FileSource
 * @record @struct
 */
ee.data.TableSource = class extends ee.data.FileSource {
  constructor() {
    super();

    /**
     * The character encoding of the uploaded file. Defaults to "UTF-8" if not
     * defined.
     * @export {string|undefined}
     */
    this.charset;

    /**
     * The maximum error in meters when transforming a geometry between
     * coordinate systems as part of the ingestion process.
     * @export {number|undefined}
     */
    this.maxError;

    /**
     * If set, any geometry with more than this many vertices will be spatially
     * cut into multiple pieces, with other properties copied onto each piece.
     * @export {number|undefined}
     */
    this.maxVertices;

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
