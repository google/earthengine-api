/**
 * @fileoverview Client code to connect to the EE API endpoint.
 */
goog.module('ee.apiclient');
goog.module.declareLegacyNamespace();

const GoogConst = goog.require('goog.string.Const');
const Throttle = goog.require('goog.async.Throttle');
const TrustedResourceUrl = goog.require('goog.html.TrustedResourceUrl');
const Uri = goog.require('goog.Uri');
const XhrIo = goog.require('goog.net.XhrIo');
const XhrLike = goog.requireType('goog.net.XhrLike');
const XmlHttp = goog.require('goog.net.XmlHttp');
const api = goog.require('ee.api');
const apiVersion = goog.require('ee.apiVersion');
const array = goog.require('goog.array');
const functions = goog.require('goog.functions');
const googObject = goog.require('goog.object');
const googString = goog.require('goog.string');
const jsloader = goog.require('goog.net.jsloader');
const {MakeRequestParams, processParams} = goog.require('eeapiclient.request_params');
const {NULL_VALUE, Serializable, SerializableCtor, deserialize, serialize} = goog.require('eeapiclient.domain_object');
const {PromiseRequestService} = goog.require('eeapiclient.promise_request_service');

/** @namespace */
const apiclient = {};

const API_CLIENT_VERSION = '0.1.298';

exports.VERSION = apiVersion.VERSION;
exports.API_CLIENT_VERSION = API_CLIENT_VERSION;
exports.NULL_VALUE = NULL_VALUE;
exports.PromiseRequestService = PromiseRequestService;
exports.MakeRequestParams = MakeRequestParams;
exports.deserialize = deserialize;
// Typecast to avoid a mismatch on the abstract getConstructor member.
exports.serialize = /** @type {function(!Serializable):!Object} */(serialize);


/**
 * Request manager for API requests.
 *
 * Typical usage:
 *   const call = apiclient.Call(optional_callback);
 *   return call.handle(
 *       call.algorithms().list(call.projectsPath(), {prettyPrint: false}));
 */
class Call {
  /**
   * Prepares a call which will call the given callback from the handle()
   * method.
   *
   * @param {function(?, string=)=} callback Callback to call.  If empty, the
   *     request will run in synchronous mode.
   * @param {number=} retries Overrides the default number of retries.
   */
  constructor(callback, retries) {
    apiclient.initialize();
    this.callback = callback;
    this.requestService = new EERequestService(!callback, retries);
  }

  /**
   * Wraps a promise returned by an API call, to call the configured callback.
   * Also handles the "fake promise" returned in synchronous mode.
   *
   * @template T
   * @param {!Promise<T>} response
   * @return {!T|!Promise<T>} Immediate value in sync mode (constructor called
   *   without callback), and otherwise a promise which will resolve to the
   *   value.
   */
  handle(response) {
    if (response instanceof Promise) {
      // Async mode: invoke the callback with the result of the promise.
      if (this.callback) {
        const callback = (result, error=undefined) => {
          try {
            return this.callback(result, /** @type {string} */ (error));
          } catch (callbackError) {
            setTimeout(() => {  // Do the throw outside the Promise handlers.
              throw callbackError;
            }, 0);
          }
        };
        response.then(callback, (error) => callback(undefined, error));
      }
      // We should not be running in async mode without a callback, but it is
      // still useful to return the promise.
    } else {
      // Sync mode: convert the fake "instant" promise to actual result.
      response.then((result) => { response = result; });
    }
    return response;
  }

  /**
   * Gets the currently active projects path.  This is a method on Call, to
   * ensure that initialize() has already been called.
   * @return {string}
   */
  projectsPath() {
    return 'projects/' + apiclient.getProject();
  }

  // Helper methods to construct the generated api client handlers.
  algorithms() {
    return new api.ProjectsAlgorithmsApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }

  projects() {
    return new api.ProjectsApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }

  assets() {
    return new api.ProjectsAssetsApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }

  operations() {
    return new api.ProjectsOperationsApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }

  value() {
    return new api.ProjectsValueApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }

  maps() {
    return new api.ProjectsMapsApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }

  map() {
    return new api.ProjectsMapApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }

  image() {
    return new api.ProjectsImageApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }

  table() {
    return new api.ProjectsTableApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }

  tables() {
    return new api.ProjectsTablesApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }

  video() {
    return new api.ProjectsVideoApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }
  featureView() {
    return new api.ProjectsFeatureViewApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }

  thumbnails() {
    return new api.ProjectsThumbnailsApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }

  videoThumbnails() {
    return new api.ProjectsVideoThumbnailsApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }

  filmstripThumbnails() {
    return new api.ProjectsFilmstripThumbnailsApiClientImpl(
        apiVersion.VERSION, this.requestService);
  }
}


/**
 * A request service that delegates to apiclient.send().
 *
 * This implements the PromiseRequestService interface needed by the handlers
 * for individual API calls.  The handlers themselves are auto-generated and
 * imported in the ee.api module.
 */
class EERequestService extends PromiseRequestService {
  /**
   * @param {boolean=} sync Run XmlHttpRequests in sync mode.  This blocks the
   *     main browser thread but is needed for legacy compatibility.
   * @param {number=} retries Overrides the default max retries value.
   */
  constructor(sync = false, retries = undefined) {
    super();
    this.sync = sync;

    if (retries != null) {
      this.retries = retries;
    } else if (sync) {
      this.retries = apiclient.MAX_SYNC_RETRIES_;
    } else {
      this.retries = apiclient.MAX_ASYNC_RETRIES_;
    }
  }

  /**
   * Implements the JSON RPC using the logic in apiclient.send().
   * Handles both sync and async cases.  In sync mode the returned promise will
   * resolve immediately: this is unwrapped by Call.handle() above.
   *
   * @template T
   * @param {!MakeRequestParams} params Provided by the autogenerated client.
   * @param {!SerializableCtor<T>=} responseCtor Also provided by the generated
   *     code.  Will be a constructor for one of the ee.api.* response objects,
   *     which builds a Serializable type from a raw js object.
   * @return {!Promise<T>}
   * @override
   */
  send(params, responseCtor = undefined) {
    // Standard TS API Client preprocessing to drop undefined queryParams.
    processParams(params);

    const path = params.path || '';
    const url = apiclient.getSafeApiUrl() + path;
    const args = apiclient.makeRequest_(params.queryParams || {});
    const body = params.body ? JSON.stringify(params.body) : undefined;
    if (this.sync) {
      const raw = apiclient.send(
          url, args, undefined, params.httpMethod, body, this.retries);
      const value = responseCtor ? deserialize(responseCtor, raw) : raw;
      // Converts a value into an "instant" promise, with a then method that
      // immediately applies a function and builds a new thenable of the result.
      // Any errors will be thrown back to the original caller synchronously.
      const thenable = (v) => ({'then': (f) => thenable(f(v))});
      return /** @type {!Promise<T>} */(thenable(value));
    }
    const value = new Promise((resolve, reject) => {
      const resolveOrReject = (value, error = undefined) => {
        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      };
      apiclient.send(
          url, args, resolveOrReject, params.httpMethod, body, this.retries);
    });
    return value.then(r => responseCtor ? deserialize(responseCtor, r) : r);
  }

  /** @override abstract method, not used */ makeRequest(params) {}
}


/**
 * Request manager for batch requests.
 *
 * Typical usage:
 *  const getResponse = (data) => ops.map((op) => operationToTask(data[op]));
 *  const call = new ee.apiclient.BatchCall(optional_callback);
 *  return call.send(
 *      ops.map((op) => [op, call.operations().get(op)]), getResponse);
 */
class BatchCall extends Call {
  /**
   * Prepares a batch handler which will call the given callback when send()
   * completes.
   */
  constructor(callback) {
    super(callback);
    this.requestService = new BatchRequestService();
  }

  /**
   * Constructs a batch request from the part bodies, and calls getResponse
   * on the final composite response, providing a dictionary keyed by
   * part name.  An error will be thrown (or passed to the callback) if any part
   * has an error; successful responses will still be passed to the callback
   * even if there is an error.
   *
   * See https://www.w3.org/Protocols/rfc1341/7_2_Multipart.html
   *
   * @param {!Array<!Array<?>>} parts Array of [id, [body, ctor]] tuples. ID is
   *    a caller-determined ID for each part, and [body, ctor] should be created
   *    by calling BatchRequestService.send().
   * @param {function(!Object):T=} getResponse Optional post-processing step to
   *    transform the object of ID-keyed responses before calling the callback.
   * @return {?T} payload or null if callback is given.
   * @template T
   */
  send(parts, getResponse) {
    const batchUrl = apiclient.getSafeApiUrl() + '/batch';
    const boundary = 'batch_EARTHENGINE_batch';
    const multipart = `multipart/mixed; boundary=${boundary}`;

    const headers = 'Content-Type: application/http\r\n' +
        'Content-Transfer-Encoding: binary\r\nMIME-Version: 1.0\r\n';
    const build = ([id, [partBody, ctor]]) =>
        `--${boundary}\r\n${headers}Content-ID: <${id}>\r\n\r\n${partBody}\r\n`;
    const body = parts.map(build).join('') + `--${boundary}--\r\n`;

    const deserializeResponses = (response) => {
      const result = {};
      parts.forEach(([id, [partBody, ctor]]) => {
        if (response[id] != null) {
          result[id] = deserialize(ctor, response[id]);
        }
      });
      return getResponse ? getResponse(result) : result;
    };

    if (this.callback) {
      const callback = (result, err = undefined) =>
        this.callback(err ? result : deserializeResponses(result), err);
      apiclient.send(batchUrl, null, callback, multipart, body);
      return null;
    }
    return deserializeResponses(
        apiclient.send(batchUrl, null, undefined, multipart, body));
  }
}


class BatchRequestService extends PromiseRequestService {
  /**
   * Overrides the send method, but does not actually send a request.  Instead
   * it returns a tuple of [message, responseCtor] fields, so that
   * BatchCall.send can assemble the request and parse the replies.
   *
   * @param {!MakeRequestParams} params Provided by the autogenerated client.
   * @param {!SerializableCtor<T>=} responseCtor Also provided by the generated
   *     code.  Will be a constructor for one of the ee.api.* response objects,
   *     which builds a Serializable type from a raw js object.
   * @return {!Promise<!Object>} Declared as a promise to match the overridden
   *     interface, but will actually be a tuple.
   * @override
   */
  send(params, responseCtor = undefined) {
    const request = [`${params.httpMethod} ${params.path} HTTP/1.1`];
    request.push('Content-Type: application/json; charset=utf-8');
    const authToken = apiclient.getAuthToken();
    if (authToken != null) {
      request.push('Authorization: ' + authToken);
    }
    const body = params.body ? JSON.stringify(params.body) : '';
    const message = `${request.join('\r\n')}\r\n\r\n${body}`;
    return /** @type {?} */([message, responseCtor]);
  }

  /** @override abstract method, not used */ makeRequest(params) {}
}


/**
 * Processes a multipart reply by calling the handler with each part in turn.
 * @param {string} contentType
 * @param {string} responseText
 * @param {function(string,number,string)} handle Arguments: id, status, text.
 */
apiclient.parseBatchReply = function(contentType, responseText, handle) {
  const boundary = contentType.split('; boundary=')[1];
  for (let part of responseText.split('--' + boundary)) {
    const groups = part.split('\r\n\r\n');
    if (groups.length < 3) {
      continue;
    }
    const id = groups[0].match(/\r\nContent-ID: <response-([^>]*)>/)[1];
    const status = Number(groups[1].match(/^HTTP\S*\s(\d+)\s/)[1]);
    const text = groups.slice(2).join('\r\n\r\n');
    handle(id, status, text);
  }
};


/**
 * Sets the Cloud API key used when making requests.
 * @param {?string} apiKey The Google Cloud Platform API key to use for access
 *     and quota for the Earth Engine API.
 */
apiclient.setApiKey = function(apiKey) {
  apiclient.cloudApiKey_ = apiKey;
};

/**
 * Returns the current Cloud API key.
 * @return {?string}
 */
apiclient.getApiKey = function() {
  return apiclient.cloudApiKey_;
};

/** @private @const {string} */
apiclient.DEFAULT_PROJECT_ = 'earthengine-legacy';

/**
 * Sets the Cloud Project to use when making requests.
 * @param {string} project the user project to set.
 */
apiclient.setProject = function(project) {
  apiclient.project_ = project;
};

/**
 * Returns the currently selected project.
 * @return {string}
 */
apiclient.getProject = function() {
  return apiclient.project_;
};


/**
 * Constructs a URL for API requests that is safe to use in both browser and
 * server contexts.
 * @return {string}
 */
apiclient.getSafeApiUrl = function() {
  const url = apiclient.apiBaseUrl_.replace(/\/api$/, '');
  if ('window' in goog.global && !url.match(/^https?:\/\/content-/)) {
    // Prepend hostname with content- to ensure browser-safe responses.
    return url.replace(/^(https?:\/\/)(.*\.googleapis\.com)$/, '$1content-$2');
  }
  return url;
};


/**
 * Merges default, storage, and additional auth scopes into a single list,
 * removing duplicates.
 * @param {boolean} includeDefaultScopes Whether to include the default set of
 *   API scopes normally requested during sign in.
 * @param {boolean} includeStorageScope Whether to include the Cloud Storage
 *   scope.
 * @param {!Array<string>} extraScopes A list of additional scopes to be
 *   included in the final list.
 * @return {!Array<string>} The resulting list of unique auth scopes.
 * @private
 */
apiclient.mergeAuthScopes_ = function(
    includeDefaultScopes, includeStorageScope, extraScopes) {
  let scopes = [];
  if (includeDefaultScopes) {
    scopes = scopes.concat(apiclient.DEFAULT_AUTH_SCOPES_);
  }
  if (includeStorageScope) {
    scopes.push(apiclient.STORAGE_SCOPE_);
  }
  scopes = scopes.concat(extraScopes);
  array.removeDuplicates(scopes);
  return scopes;
};


/**
 * Configures client-side authentication of EE API calls by providing a
 * current OAuth2 token to use. This is a replacement for expected
 * ee.data.authenticate() when a token is already available.
 * @param {string} clientId The OAuth client ID associated with the token.
 * @param {string} tokenType The OAuth2 token type, e.g. "Bearer".
 * @param {string} accessToken The token string, typically looking something
 *     like "ya28.hgGGO...OtA".
 * @param {number} expiresIn The number of seconds after which this token
 *     expires.
 * @param {!Array<string>=} extraScopes Extra OAuth scopes associated with
 *     the token.
 * @param {function()=} callback A function to call when the token is set.
 * @param {boolean=} updateAuthLibrary Whether to also update the token
 *     set in the Google API Client Library for JavaScript. Defaults to true.
 * @param {boolean=} suppressDefaultScopes When true, only scopes in extraScopes
 *     are requested. Default scopes are not requested unless explicitly
 *     specified in extraScopes.
 */
apiclient.setAuthToken = function(
    clientId, tokenType, accessToken, expiresIn, extraScopes, callback,
    updateAuthLibrary, suppressDefaultScopes) {
  const scopes = apiclient.mergeAuthScopes_(
      /* includeDefaultScopes= */ !suppressDefaultScopes,
      /* includeStorageScope= */ false,
      extraScopes || []);
  apiclient.authClientId_ = clientId;
  apiclient.authScopes_ = scopes;

  const tokenObject = {
    'token_type': tokenType,
    'access_token': accessToken,
    'state': scopes.join(' '),
    'expires_in': expiresIn
  };
  apiclient.handleAuthResult_(undefined, undefined, tokenObject);

  if (updateAuthLibrary === false) {
    if (callback) {
      callback();
    }
  } else {
    apiclient.ensureAuthLibLoaded_(function() {
      goog.global['gapi']['auth']['setToken'](tokenObject);
      if (callback) {
        callback();
      }
    });
  }
};


/**
 * Retrieves a new OAuth2 token for the currently configured ID and scopes.
 *
 * @param {function()=} success The function to call if token refresh
 *     succeeds.
 * @param {function(string)=} error The function to call if token refresh
 *     fails, passing the error message.
 * @param {function()=} onImmediateFailed The function to call if
 *     automatic behind-the-scenes authentication fails.
 */
apiclient.refreshAuthToken = function(success, error, onImmediateFailed) {
  if (!apiclient.isAuthTokenRefreshingEnabled_()) {
    return;
  }

  // Set up auth options.
  const authArgs = {
    'client_id': String(apiclient.authClientId_),
    'immediate': true,
    'scope': apiclient.authScopes_.join(' ')
  };

  // Start the authorization flow, first trying immediate mode, which tries to
  // get the token behind the scenes, with no UI shown.
  apiclient.authTokenRefresher_(authArgs, function(result) {
    if (result.error == 'immediate_failed' && onImmediateFailed) {
      onImmediateFailed();
    } else {
      if ('window' in goog.global) {
        try {
          // Refresh the library auth token and handle error propagation.
          apiclient.ensureAuthLibLoaded_(function() {
            try {
              goog.global['gapi']['auth']['setToken'](result);
              apiclient.handleAuthResult_(success, error, result);
            } catch (e) {
              error(e.toString());
            }
          });
        } catch (e) {
          error(e.toString());
        }
        return;
      }
      apiclient.handleAuthResult_(success, error, result);
    }
  });
};


/**
 * Sets the current OAuth token refresher. By default, automatically set to
 * gapi.auth.authorize() after the auth library loads. Set to null to disable
 * token refreshing.
 *
 * @param {?function(!apiclient.AuthArgs, function(!apiclient.AuthResponse))}
 *     refresher A function that takes as input 1) auth arguments and
 *     2) a callback to which it passes an auth response object upon
 *     completion.
 */
apiclient.setAuthTokenRefresher = function(refresher) {
  apiclient.authTokenRefresher_ = refresher;
};


/**
 * Returns the current valid OAuth token, if any.
 *
 * Use apiclient.setAuthToken() or ee.data.authenticate() to set an auth token.
 *
 * @return {?string} The string to pass in the Authorization header of XHRs.
 */
apiclient.getAuthToken = function() {
  const isExpired = apiclient.authTokenExpiration_ &&
                  (Date.now() - apiclient.authTokenExpiration_) >= 0;
  if (isExpired) {
    apiclient.clearAuthToken();
  }
  return apiclient.authToken_;
};


/**
 * Clears the current OAuth token by setting it to null.
 */
apiclient.clearAuthToken = function() {
  apiclient.authToken_ = null;
  apiclient.authTokenExpiration_ = null;
};


/**
 * Returns the current OAuth client ID; null unless apiclient.setAuthToken() or
 * ee.data.authenticate() previously succeeded.
 *
 * @return {?string} The OAuth2 client ID for client-side authentication.
 */
apiclient.getAuthClientId = function() {
  return apiclient.authClientId_;
};


/**
 * Returns the current OAuth scopes; empty unless apiclient.setAuthToken() or
 * ee.data.authenticate() previously succeeded.
 *
 * @return {!Array<string>} The OAuth2 scopes for client-side authentication.
 */
apiclient.getAuthScopes = function() {
  return apiclient.authScopes_;
};


/**
 * Configures the authentication client and scopes.
 * @param {?string} clientId OAuth2 client ID for client-side authentication.
 * @param {!Array<string>} scopes OAuth2 scopes for client-side authentication.
 */
apiclient.setAuthClient = function(clientId, scopes) {
  apiclient.authClientId_ = clientId;
  apiclient.authScopes_ = scopes;
};


/**
 * Sets the token of the app ID making the requests.
 * @param {string} token the EE App ID token to set.
 */
apiclient.setAppIdToken = function(token) {
  apiclient.appIdToken_ = token;
};


////////////////////////////////////////////////////////////////////////////////
//                                Initialization.                             //
////////////////////////////////////////////////////////////////////////////////


/**
 * Initializes the data module, setting base URLs.
 *
 * @param {?string=} apiBaseUrl The (proxied) EarthEngine REST API
 *     endpoint.
 * @param {?string=} tileBaseUrl The (unproxied) EarthEngine REST tile
 *     endpoint.
 * @param {?string=} xsrfToken A string to pass in the X-XSRF-Token header
 *     of XHRs.
 * @param {?string=} project Optional Google Cloud project ID or number
 *     to use when making API calls.
 */
apiclient.initialize = function(apiBaseUrl, tileBaseUrl, xsrfToken, project) {
  // If already initialized, only replace the explicitly specified parts.

  if (apiBaseUrl != null) {
    apiclient.apiBaseUrl_ = apiBaseUrl;
  } else if (!apiclient.initialized_) {
    apiclient.apiBaseUrl_ = apiclient.DEFAULT_API_BASE_URL_;
  }
  if (tileBaseUrl != null) {
    apiclient.tileBaseUrl_ = tileBaseUrl;
  } else if (!apiclient.initialized_) {
    apiclient.tileBaseUrl_ = apiclient.DEFAULT_TILE_BASE_URL_;
  }
  if (xsrfToken !== undefined) {  // Passing an explicit null clears it.
    apiclient.xsrfToken_ = xsrfToken;
  }
  if (project != null) {
    apiclient.setProject(project);
  } else {
    apiclient.setProject(apiclient.getProject() || apiclient.DEFAULT_PROJECT_);
  }
  apiclient.initialized_ = true;
};


/**
 * Resets the data module, clearing custom base URLs.
 */
apiclient.reset = function() {
  apiclient.apiBaseUrl_ = null;
  apiclient.tileBaseUrl_ = null;
  apiclient.xsrfToken_ = null;
  apiclient.initialized_ = false;
};


/**
 * Sets the timeout length for asynchronous API requests.
 *
 * @param {number} milliseconds The number of milliseconds to wait for a
 *     request before considering it timed out. 0 means no limit.
 */
apiclient.setDeadline = function(milliseconds) {
  apiclient.deadlineMs_ = milliseconds;
};


/**
 * Sets a function used to transform request parameters.
 *
 * @param {?function(!Uri.QueryData, string): !Uri.QueryData}
 *     augmenter A function used to transform request parameters right
 *     before they are sent to the server. Takes the URL of the request
 *     as the second argument.
 */
apiclient.setParamAugmenter = function(augmenter) {
  apiclient.paramAugmenter_ = augmenter || functions.identity;
};


/**
 * Returns the base URL used for API calls.
 *
 * @return {?string} The current API base URL.
 */
apiclient.getApiBaseUrl = function() {
  return apiclient.apiBaseUrl_;
};


/**
 * Returns the base URL used for tiles.
 *
 * @return {?string} The current tile base URL.
 */
apiclient.getTileBaseUrl = function() {
  return apiclient.tileBaseUrl_;
};


/**
 * Returns the current XSRF token.
 *
 * @return {?string} A string to pass in the X-XSRF-Token header of XHRs.
 */
apiclient.getXsrfToken = function() {
  return apiclient.xsrfToken_;
};


/**
 * Returns the current XSRF token.
 *
 * @return {boolean}
 */
apiclient.isInitialized = function() {
  return apiclient.initialized_;
};



/**
 * Sends an API call.
 * @param {string} path The API endpoint to call.
 * @param {?Uri.QueryData} params The call parameters.
 * @param {function(?, string=)=} callback An optional callback.
 *     If not specified, the call is made synchronously and the response
 *     is returned. If specified, the call will be made asynchronously and
 *     may be queued to avoid exceeding server queries-per-seconds quota.
 * @param {string=} method The HTTPRequest method (GET or POST), default
 *     is POST.  If this starts with 'multipart', used as content type instead.
 * @param {string=} body The payload for POST or multipart requests.
 * @param {number=} retries Overrides the default max retries value.
 * @return {?Object} The data object returned by the API call, or null if a
 *     callback was specified.
 */
apiclient.send = function(
    path, params, callback, method, body, retries) {
  // Make sure we never perform API calls before initialization.
  apiclient.initialize();

  // Snapshot the profile hook so we don't depend on its state during async
  // operations.
  const profileHookAtCallTime = apiclient.profileHook_;

  let contentType = 'application/x-www-form-urlencoded';
  if (body) {
    contentType = 'application/json';
    if (method && method.startsWith('multipart')) {
      contentType = method;
      method = 'POST';
    }
  }
  method = method || 'POST';

  // WARNING: The content-type header here must use this exact capitalization
  // to remain compatible with the Node.JS environment. See:
  // https://github.com/driverdan/node-XMLHttpRequest/issues/20
  const headers = {
    'Content-Type': contentType,
  };
  if (API_CLIENT_VERSION) {
    let version = API_CLIENT_VERSION;
    headers[apiclient.API_CLIENT_VERSION_HEADER] = 'ee-js/' + version;
  }

  // Set up client-side authorization.
  const authToken = apiclient.getAuthToken();
  if (authToken != null) {
    headers['Authorization'] = authToken;
  } else if (callback && apiclient.isAuthTokenRefreshingEnabled_()) {
    // If the authToken is null, the call is asynchronous, and token refreshing
    // is enabled, refresh the auth token before making the call.
    apiclient.refreshAuthToken(function() {
      apiclient.withProfiling(profileHookAtCallTime, function() {
        apiclient.send(path, params, callback, method);
      });
    });
    return null;
  }

  // Set up request parameters.
  params = params ? params.clone() : new Uri.QueryData();
  if (apiclient.cloudApiKey_ != null) {
    params.add('key', apiclient.cloudApiKey_);
  }

  if (profileHookAtCallTime) {
    headers[apiclient.PROFILE_REQUEST_HEADER] = '1';
  }
  if (apiclient.getProject() &&
      apiclient.getProject() !== apiclient.DEFAULT_PROJECT_) {
    headers[apiclient.USER_PROJECT_OVERRIDE_HEADER_] = apiclient.getProject();
  }

  params = apiclient.paramAugmenter_(params, path);

  // XSRF protection for a server-side API proxy.
  if (apiclient.xsrfToken_ != null) {
    headers['X-XSRF-Token'] = apiclient.xsrfToken_;
  }

  if (apiclient.appIdToken_ != null) {
    headers[apiclient.APP_ID_TOKEN_HEADER_] = apiclient.appIdToken_;
  }

  // Encode the request params in the URL and set requestData to the body.
  // In the special case of form mode, when no body is given, pass the params in
  // requestData instead.
  let requestData = body || null;
  const paramString = params ? params.toString() : '';
  if (method === 'POST' && body === undefined) {
    requestData = paramString;
  } else if (!googString.isEmptyOrWhitespace(paramString)) {
    path += googString.contains(path, '?') ? '&' : '?';
    path += paramString;
  }

  const url = path.startsWith('/') ? apiclient.apiBaseUrl_ + path : path;
  if (callback) {
    // Send an asynchronous request.
    const request =
        apiclient.buildAsyncRequest_(
            url, callback, method, requestData, headers, retries);

    apiclient.requestQueue_.push(request);
    apiclient.RequestThrottle_.fire();
    return null;
  } else {
    // Send a synchronous request.
    /**
     * Wrapper around xmlHttp.setRequestHeader to be usable with parameter
     * order of goog.object.forEach
     * @this {!XhrLike.OrNative}
     * @param {string} value The value of the header.
     * @param {string} key The key of the header;
     */
    const setRequestHeader = function(value, key) {
      if (this.setRequestHeader) {
        this.setRequestHeader(key, value);
      }
    };

    // Retry 429 responses with exponential backoff.
    let xmlHttp;
    let retryCount = 0;
    const maxRetries =
        (retries != null) ? retries : apiclient.MAX_SYNC_RETRIES_;
    while (true) {
      xmlHttp = XmlHttp();
      xmlHttp.open(method, url, false);
      googObject.forEach(headers, setRequestHeader, xmlHttp);
      xmlHttp.send(requestData);
      if (xmlHttp.status != 429 || retryCount > maxRetries) {
        break;
      }
      apiclient.sleep_(apiclient.calculateRetryWait_(retryCount++));
    }

    return apiclient.handleResponse_(
        xmlHttp.status, function getResponseHeaderSafe(header) {
          try {
            return xmlHttp.getResponseHeader(header);
          } catch (e) {
            // Workaround for a non-browser XMLHttpRequest shim that doesn't
            // implement getResponseHeader when synchronous.
            return null;
          }
        }, xmlHttp.responseText, profileHookAtCallTime, undefined, url, method);
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
 * @param {number=} retries Overrides the default max retries value.
 * @return {!apiclient.NetworkRequest_} The async request.
 * @private
 */
apiclient.buildAsyncRequest_ = function(
    url, callback, method, content, headers, retries) {
  let retryCount = 0;
  const request = {
    url: url,
    method: method,
    content: content,
    headers: headers
  };
  const profileHookAtCallTime = apiclient.profileHook_;
  const maxRetries = (retries != null) ? retries : apiclient.MAX_ASYNC_RETRIES_;
  const wrappedCallback = function(e) {
    const xhrIo = e.target;

    if (xhrIo.getStatus() == 429 && retryCount < maxRetries) {
      retryCount++;
      setTimeout(function() {
        apiclient.requestQueue_.push(request);
        apiclient.RequestThrottle_.fire();
      }, apiclient.calculateRetryWait_(retryCount));
      return null;
    }

    return apiclient.handleResponse_(
        xhrIo.getStatus(), goog.bind(xhrIo.getResponseHeader, xhrIo),
        xhrIo.getResponseText(), profileHookAtCallTime, callback, url, method);
  };
  request.callback = wrappedCallback;

  return request;
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
 * @param {*=} thisObject
 * @return {*}
 */
apiclient.withProfiling = function(hook, body, thisObject) {
  const saved = apiclient.profileHook_;
  try {
    apiclient.profileHook_ = hook;
    return body.call(thisObject);
  } finally {
    apiclient.profileHook_ = saved;
  }
};


/**
 * Handles processing and dispatching a callback response.
 * @param {number} status The status code of the response.
 * @param {function(string):?string} getResponseHeader A function for
 *     getting the value of a response headers for a given header name.
 * @param {string} responseText The text of the response.
 * @param {?function(string)} profileHook The profile hook at the time the
 *     request was created.
 * @param {function(?,string=)=} callback An optional callback to
 *     execute if the request is asynchronous.
 * @param {string=} url The request's URL.
 * @param {string=} method The request's HTTP method.
 * @return {?Object} The response data, if the request is synchronous,
 *     otherwise null, if the request is asynchronous.
 * @private
 */
apiclient.handleResponse_ = function(
    status, getResponseHeader, responseText, profileHook, callback, url,
    method) {
  // Only attempt to get the profile response header if we have a hook.
  const profileId =
      profileHook ? getResponseHeader(apiclient.PROFILE_HEADER) : '';
  if (profileId && profileHook) {
    profileHook(profileId);
  }
  const parseJson = (body) => {
    try {
      const response = JSON.parse(body);
      if (goog.isObject(response)) {
        if ('error' in response && 'message' in response['error']) {
          return response['error']['message'];
        }
      }
      return {parsed: response};
    } catch (e) {
      return 'Invalid JSON: ' + body;
    }
  };
  const statusError = (status) => {
    if (status === 0) {
      return 'Failed to contact Earth Engine servers. Please check ' +
          'your connection, firewall, or browser extension settings.';
    } else if (status < 200 || status >= 300) {
      return 'Server returned HTTP code: ' + status + ' for ' + method + ' ' +
          url;
    }
  };

  let errorMessage, data, typeError;
  const typeHeader = getResponseHeader('Content-Type') || 'application/json';
  const contentType = typeHeader.replace(/;.*/, '');
  if (contentType === 'application/json' || contentType === 'text/json') {
    const response = parseJson(responseText);
    if (response.parsed) {
      data = response.parsed;
      if (data === undefined) {
        errorMessage = 'Malformed response: ' + responseText;
      }
    } else {
      errorMessage = response;
    }
  } else if (contentType === 'multipart/mixed') {
    data = {};
    const errors = [];
    apiclient.parseBatchReply(typeHeader, responseText, (id, status, text) => {
      const response = parseJson(text);
      if (response.parsed) {
        data[id] = response.parsed;
      }
      const error = (response.parsed ? '' : response) || statusError(status);
      if (error) {
        errors.push(`${id}: ${error}`);
      }
    });
    if (errors.length) {
      errorMessage = errors.join('\n');
    }
  } else {
    typeError = 'Response was unexpectedly not JSON, but ' + contentType;
  }

  errorMessage = errorMessage || statusError(status) || typeError;

  if (callback) {
    callback(data, errorMessage);
    return null;
  } else {
    if (!errorMessage) {
      return /** @type {?Object} */ (data);
    }
    throw new Error(errorMessage);
  }
};


/**
 * Ensures that the Google API Client Library for JavaScript is loaded.
 * @param {function()} callback The function to call when the library is ready.
 * @private
 */
apiclient.ensureAuthLibLoaded_ = function(callback) {
  const done = function() {
    // Speed up auth request by using CORS instead of an iframe.
    goog.global['gapi']['config']['update']('client/cors', true);
    if (!apiclient.authTokenRefresher_) {
      apiclient.setAuthTokenRefresher(goog.global['gapi']['auth']['authorize']);
    }
    callback();
  };
  if (goog.isObject(goog.global['gapi']) &&
      goog.isObject(goog.global['gapi']['auth']) &&
      typeof goog.global['gapi']['auth']['authorize'] === 'function') {
    done();
  } else {
    // The library is not loaded; load it now.
    let callbackName = Date.now().toString(36);
    while (callbackName in goog.global) {
      callbackName += '_';
    }
    goog.global[callbackName] = function() {
      delete goog.global[callbackName];
      done();
    };
    jsloader.safeLoad(TrustedResourceUrl.format(
        apiclient.AUTH_LIBRARY_URL_, {'onload': callbackName}));
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
 * @param {!apiclient.AuthResponse} result The result object produced by
 *     a token refresher such as gapi.auth.authorize().
 * @private
 */
apiclient.handleAuthResult_ = function(success, error, result) {
  if (result.access_token) {
    const token = result.token_type + ' ' + result.access_token;
    if (result.expires_in || result.expires_in === 0) {
      // Conservatively consider tokens expired slightly before actual expiry.
      const expiresInMs = result.expires_in * 1000 * 0.9;

      // Set up a refresh timer. This is necessary because we cannot refresh
      // synchronously, but since we want to allow synchronous API requests,
      // something must ensure that the auth token is always valid. However,
      // this approach fails if the user is offline or suspends their computer,
      // so in addition to this timeout, invalid tokens are detected and
      // autorefreshed on demand prior to async calls. Prior to sync calls,
      // users are advised to check apiclient.getAuthToken() and manually
      // refresh the token if needed. See ee.data.authenticate() docs for more
      // info.  Note that we multiply by .9 *again* to prevent simultaneous
      // on-demand-refresh and timer-refresh.
      const timeout = setTimeout(apiclient.refreshAuthToken, expiresInMs * 0.9);

      // In Node.js environments, we don't want these timeouts to keep a
      // completed process from exiting. To avoid this, explicitly tell the
      // process not to wait for this timeout.
      // See: https://nodejs.org/api/timers.html#timers_class_timeout
      if (timeout['unref'] !== undefined) {
        timeout['unref']();
      }

      apiclient.authTokenExpiration_ = Date.now() + expiresInMs;
    }
    apiclient.authToken_ = token;
    if (success) {
      success();
    }
  } else if (error) {
    error(result.error || 'Unknown error.');
  }
};


/**
 * Convert an object into a Uri.QueryData. Parameters that are of type
 * array or object are serialized to JSON.
 * @param {!Object} params The params to convert.
 * @return {!Uri.QueryData} The converted parameters.
 * @private
 */
apiclient.makeRequest_ = function(params) {
  const request = new Uri.QueryData();
  for (let [name, item] of Object.entries(params)) {
    request.set(name, item);
  }
  return request;
};


/**
 * Mock the networking calls used in send.
 *
 * TODO(user): Make the global patching done here reversible.
 *
 * @param {!Object=} calls A dictionary containing the responses to return
 *     for each URL, keyed to URL.
 */
apiclient.setupMockSend = function(calls) {
  calls = calls ? googObject.clone(calls) : {};

  // We don't use apiclient.apiBaseUrl_ directly because it may be cleared by
  // ee.reset() in a test tearDown() before all queued asynchronous requests
  // finish. Further, we cannot snapshot it here because tests may call
  // setupMockSend() before ee.initialize(). So we snapshot it when the first
  // request is made below.
  let apiBaseUrl;

  // If the mock is set up with a string for this URL, return that.
  // If it's a function, call the function and use its return value.
  // If it's an object it has fields specifying more details.
  // If there's nothing set for this url, throw.
  function getResponse(url, method, data) {
    url =
        url.replace(apiBaseUrl, '')
            .replace(
                `${apiVersion.VERSION}/projects/${apiclient.DEFAULT_PROJECT_}/`,
                '');
    let response;
    if (url in calls) {
      response = calls[url];
    } else {
      throw new Error(url + ' mock response not specified');
    }
    if (typeof response === 'function') {
      response = response(url, method, data);
    }
    if (typeof response === 'string') {
      response = {
        'text': response,
        'status': 200,
        'contentType': 'application/json; charset=utf-8'
      };
    }
    if (typeof response.text !== 'string') {
      throw new Error(url + ' mock response missing/invalid text');
    }

    if (typeof response.status !== 'number' &&
        typeof response.status !== 'function') {
      throw new Error(url + ' mock response missing/invalid status');
    }
    return response;
  }

  // Mock XhrIo.send for async calls.
  XhrIo.send = function(url, callback, method, data) {
    apiBaseUrl = apiBaseUrl || apiclient.apiBaseUrl_;
    const responseData = getResponse(url, method, data);
    // An anonymous class to simulate an event.  Closure doesn't like this.
    /** @constructor */
    const fakeEvent = function() {
      /** @type {!XhrIo} */ this.target = /** @type {?} */({});
    };
    const e = new fakeEvent();
    e.target.getResponseText = function() {
      return responseData.text;
    };
    e.target.getStatus = typeof responseData.status === 'function' ?
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
    return new XhrIo(); // Expected to be unused.
  };

  // Mock goog.net.XmlHttp for sync calls.
  /** @constructor */
  const fakeXmlHttp = function() {
    /** @type {string} */ this.url;
    /** @type {string} */ this.method;
    /** @type {string} */ this.contentType_;
    /** @type {string} */ this.responseText;
    /** @type {number} */ this.status;
  };
  fakeXmlHttp.prototype.open = function(method, urlIn) {
    apiBaseUrl = apiBaseUrl || apiclient.apiBaseUrl_;
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
    const responseData = getResponse(this.url, this.method, data);
    this.responseText = responseData.text;
    this.status = typeof responseData.status === 'function' ?
        responseData.status() :
        responseData.status;
    this.contentType_ = responseData.contentType;
  };
  XmlHttp.setGlobalFactory(/** @type {?} */({
    createInstance() { return new fakeXmlHttp(); },
    getOptions() { return {}; }
  }));
};


/**
 * @return {boolean} Whether auth token refreshing is enabled.
 * @private
 */
apiclient.isAuthTokenRefreshingEnabled_ = function() {
  return Boolean(apiclient.authTokenRefresher_ && apiclient.authClientId_);
};


/**
 * @param {number} retryCount The number of retries attempted including the
 *     current one.
 * @return {number} The time to wait before retrying a request.
 * @private
 */
apiclient.calculateRetryWait_ = function(retryCount) {
  return Math.min(apiclient.MAX_RETRY_WAIT_,
                  Math.pow(2, retryCount) * apiclient.BASE_RETRY_WAIT_);
};


/**
 * Block all script execution for a given period of time.
 * @param {number} timeInMs The amount of time to sleep (in milliseconds).
 * @private
 */
apiclient.sleep_ = function(timeInMs) {
  const end = new Date().getTime() + timeInMs;
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
apiclient.NetworkRequest_ = class {
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
 * @private {!Array<!apiclient.NetworkRequest_>}
 */
apiclient.requestQueue_ = [];


/**
 * The network request throttle interval in milliseconds. The server permits ~3
 * QPS https://developers.google.com/earth-engine/usage.
 * @private @const {number}
 */
apiclient.REQUEST_THROTTLE_INTERVAL_MS_ = 350;


/**
 * A throttle for sending network requests.
 * @private {!Throttle}
 */
apiclient.RequestThrottle_ = new Throttle(function() {
  const request = apiclient.requestQueue_.shift();
  if (request) {
    XhrIo.send(
        request.url, request.callback, request.method, request.content,
        request.headers, apiclient.deadlineMs_);
  }
  if (!array.isEmpty(apiclient.requestQueue_)) {
    apiclient.RequestThrottle_.fire();
  }
}, apiclient.REQUEST_THROTTLE_INTERVAL_MS_);


/**
 * The base URL for all API calls.
 * @private {?string}
 */
apiclient.apiBaseUrl_ = null;


/**
 * The base URL for map tiles.
 * @private {?string}
 */
apiclient.tileBaseUrl_ = null;


/**
 * A string to pass in the X-XSRF-Token header of XHRs.
 * @private {?string}
 */
apiclient.xsrfToken_ = null;


/**
 * A string to pass in the X-Earth-Engine-App-ID-Token header of XHRs.
 * @private {?string}
 */
apiclient.appIdToken_ = null;


/**
 * A function used to transform parameters right before they are sent to the
 * server. Takes the URL of the request as the second argument.
 * @private {function(!Uri.QueryData, string): !Uri.QueryData}
 */
apiclient.paramAugmenter_ = functions.identity;


/**
 * An OAuth2 token to use for authenticating EE API calls.
 * @private {?string}
 */
apiclient.authToken_ = null;


/**
 * The milliseconds in epoch time when the token expires.
 * @private {?number}
 */
apiclient.authTokenExpiration_ = null;


/**
 * The client ID used to retrieve OAuth2 tokens.
 * @private {?string}
 */
apiclient.authClientId_ = null;


/**
 * The scopes to request when retrieving OAuth tokens.
 * @private {!Array<string>}
 */
apiclient.authScopes_ = [];


/**
 * A function that takes as input 1) auth arguments and 2) a callback to which
 * it passes an auth response object upon completion.
 * @private {?function(!apiclient.AuthArgs, function(!apiclient.AuthResponse))}
 */
apiclient.authTokenRefresher_ = null;


/**
 * The OAuth scope for the EE API.
 * @private @const {string}
 */
apiclient.AUTH_SCOPE_ = 'https://www.googleapis.com/auth/earthengine';

/**
 * The OAuth scope used to perform computation without writing user assets or
 * other resources.
 * @private @const {string}
 */
apiclient.READ_ONLY_AUTH_SCOPE_ = 'https://www.googleapis.com/auth/earthengine.readonly';

/**
 * The OAuth scope for Cloud Platform.
 * @private @const {string}
 */
apiclient.CLOUD_PLATFORM_SCOPE_ =
    'https://www.googleapis.com/auth/cloud-platform';

/**
 * The OAuth scopes automatically requested unless explicitly suppressed via the
 * relevant API auth call.
 * @private @const {!Array<string>}
 */
apiclient.DEFAULT_AUTH_SCOPES_ =
    [apiclient.AUTH_SCOPE_, apiclient.CLOUD_PLATFORM_SCOPE_];

/**
 * The URL of the Google APIs Client Library.
 * @private @const {!GoogConst}
 */
apiclient.AUTH_LIBRARY_URL_ = GoogConst.from(
    'https://apis.google.com/js/client.js?onload=%{onload}');


/**
 * The OAuth scope for Cloud Storage.
 * @private @const {string}
 */
apiclient.STORAGE_SCOPE_ =
    'https://www.googleapis.com/auth/devstorage.read_write';


/**
 * The Google Cloud Platform API key optionally used for quota and API access.
 * The Cloud Project associated with the API key must have the Earth Engine API
 * enabled.
 * @private {?string}
 */
apiclient.cloudApiKey_ = null;


/**
 * Whether the library has been initialized.
 * @private {boolean}
 */
apiclient.initialized_ = false;


/**
 * The number of milliseconds to wait for each request before considering it
 * timed out. 0 means no limit. Note that this is not supported by browsers for
 * synchronous requests.
 * @private {number}
 */
apiclient.deadlineMs_ = 0;


/**
 * A function called when profile results are received from the server. Takes
 * the profile ID as an argument. Null if profiling is disabled.
 * @private {?function(string)}
 */
apiclient.profileHook_ = null;


/**
 * The minimum increment of time (in milliseconds) to wait before retrying a
 * request in response to a 429 response.
 * @private @const {number}
 */
apiclient.BASE_RETRY_WAIT_ = 1000;


/**
 * The minimum increment of time (in milliseconds) to wait before retrying a
 * request in response to a 429 response.
 * @private @const {number}
 */
apiclient.MAX_RETRY_WAIT_ = 120000;


/**
 * The maximum number of times to retry an asynchronous request if it is
 * rate-limited.
 * @private @const {number}
 */
apiclient.MAX_ASYNC_RETRIES_ = 10;


/**
 * The maximum number of times to retry a synchronous request if it is
 * rate-limited.
 * @private @const {number}
 */
apiclient.MAX_SYNC_RETRIES_ = 5;


/**
 * The HTTP header through which the app ID token is provided.
 * @const {string}
 * @private
 */
apiclient.APP_ID_TOKEN_HEADER_ = 'X-Earth-Engine-App-ID-Token';


/**
 * The HTTP header through which profile results are returned.
 * @const {string}
 */
apiclient.PROFILE_HEADER = 'X-Earth-Engine-Computation-Profile';

/**
 * The HTTP header indicating what the client library version is.
 * @const {string}
 */
apiclient.API_CLIENT_VERSION_HEADER = 'x-goog-api-client';


/**
 * The default base URL for API calls.
 * @private @const {string}
 */
apiclient.DEFAULT_API_BASE_URL_ = 'https://earthengine.googleapis.com/api';


/**
 * The default base URL for media/tile calls.
 * @private @const {string}
 */
apiclient.DEFAULT_TILE_BASE_URL_ = 'https://earthengine.googleapis.com';


/**
 * The authentication arguments passed the token refresher when the token
 * needs to be refreshed.
 * @record @struct
 */
apiclient.AuthArgs = class {
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
apiclient.AuthResponse = class {
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


////////////////////////////////////////////////////////////////////////////////
//                                   Exports.                                 //
////////////////////////////////////////////////////////////////////////////////

exports.Call = Call;
exports.BatchCall = BatchCall;

exports.setApiKey = apiclient.setApiKey;
exports.getApiKey = apiclient.getApiKey;
exports.setProject = apiclient.setProject;
exports.getProject = apiclient.getProject;
exports.DEFAULT_PROJECT = apiclient.DEFAULT_PROJECT_;
exports.PROFILE_HEADER = apiclient.PROFILE_HEADER;
exports.PROFILE_REQUEST_HEADER = apiclient.PROFILE_REQUEST_HEADER;
exports.API_CLIENT_VERSION_HEADER = apiclient.API_CLIENT_VERSION_HEADER;
exports.send = apiclient.send;

exports.AUTH_SCOPE = apiclient.AUTH_SCOPE_;
exports.READ_ONLY_AUTH_SCOPE = apiclient.READ_ONLY_AUTH_SCOPE_;
exports.CLOUD_PLATFORM_SCOPE = apiclient.CLOUD_PLATFORM_SCOPE_;
exports.STORAGE_SCOPE = apiclient.STORAGE_SCOPE_;
exports.DEFAULT_AUTH_SCOPES = apiclient.DEFAULT_AUTH_SCOPES_;

exports.makeRequest = apiclient.makeRequest_;
exports.reset = apiclient.reset;
exports.initialize = apiclient.initialize;
exports.setDeadline = apiclient.setDeadline;
exports.isInitialized = apiclient.isInitialized;

exports.ensureAuthLibLoaded = apiclient.ensureAuthLibLoaded_;
exports.handleAuthResult = apiclient.handleAuthResult_;
exports.refreshAuthToken = apiclient.refreshAuthToken;
exports.setAuthClient = apiclient.setAuthClient;
exports.getAuthScopes = apiclient.getAuthScopes;
exports.getAuthClientId = apiclient.getAuthClientId;
exports.getAuthToken = apiclient.getAuthToken;
exports.setAuthToken = apiclient.setAuthToken;
exports.clearAuthToken = apiclient.clearAuthToken;
exports.setAuthTokenRefresher = apiclient.setAuthTokenRefresher;
exports.setAppIdToken = apiclient.setAppIdToken;
exports.mergeAuthScopes = apiclient.mergeAuthScopes_;

exports.setupMockSend = apiclient.setupMockSend;
exports.setParamAugmenter = apiclient.setParamAugmenter;
exports.withProfiling = apiclient.withProfiling;
exports.getApiBaseUrl = apiclient.getApiBaseUrl;
exports.getTileBaseUrl = apiclient.getTileBaseUrl;

exports.AuthArgs = apiclient.AuthArgs;
exports.AuthResponse = apiclient.AuthResponse;

exports.RequestThrottle = apiclient.RequestThrottle_;
exports.calculateRetryWait = apiclient.calculateRetryWait_;
exports.MAX_ASYNC_RETRIES = apiclient.MAX_ASYNC_RETRIES_;
exports.REQUEST_THROTTLE_INTERVAL_MS = apiclient.REQUEST_THROTTLE_INTERVAL_MS_;
exports.isAuthTokenRefreshingEnabled = apiclient.isAuthTokenRefreshingEnabled_;

// Expose Earth Engine API data types that are returned by the client
// library methods visible to user code.
goog.exportSymbol('ee.api.ListAssetsResponse', api.ListAssetsResponse);
goog.exportSymbol('ee.api.EarthEngineAsset', api.EarthEngineAsset);
goog.exportSymbol('ee.api.ListImagesResponse', api.ListImagesResponse);
goog.exportSymbol('ee.api.Image', api.Image);
goog.exportSymbol('ee.api.Operation', api.Operation);
