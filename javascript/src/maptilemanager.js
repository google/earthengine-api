/**
 * @fileoverview Manages a pool of ImageLoaders. This handles all the details of
 * dealing with ImageLoaders and provides a simple interface for sending
 * requests and managing events.
 *
 * This class supports queueing of requests (by putting tokens into TokenPool)
 * and retrying of requests. An image request is only dispatched if the pool
 * releases a free token. This class has to handle four workflows:
 *
 * 1. An image loads successfully. The caller has to receive the image load
 *    event, then the token instance has to be returned to the pool,
 *    and the request should be deleted.
 * 2. An image does not load. The caller has to receive the error event,
 *    then the token instance has to be returned to the pool,
 *    and the request should be deleted.
 * 3. A request that is still in the queue is canceled by the caller.
 *    The caller has to to receive an abort event, and the request should be
 *    deleted. The token instance has not been allocated to the request
 *    yet, so there's nothing to return to the pool.
 * 4. A request that has been sent out is canceled by the caller.
 *    The caller has to to receive an abort event, and the request should be
 *    marked inactive. When the request returns, it has to be immediately
 *    deleted, and the token instance has to be returned to the pool.
 *
 * Based on goog.net.xhrmanager.js
 *
 * @ignore
 */

goog.provide('ee.MapTileManager');

goog.require('ee.data');
goog.require('goog.Disposable');
goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.html.SafeUrl');
goog.require('goog.net.EventType');
goog.require('goog.net.ImageLoader');
goog.require('goog.net.XhrIo');
goog.require('goog.structs.Map');
goog.require('goog.structs.PriorityPool');



/**
 * A manager of a TokenPool.
 * @constructor
 * @extends {goog.events.EventTarget}
 * @export
 */
ee.MapTileManager = function() {
  ee.MapTileManager.base(this, 'constructor');

  /**
   * The pool of tokens.
   * @type {ee.MapTileManager.TokenPool_}
   * @private
   */
  this.tokenPool_ = new ee.MapTileManager.TokenPool_(0, 60);

  /**
   * Map of IDs to requests.
   * @type {goog.structs.Map}
   * @private
   */
  this.requests_ = new goog.structs.Map();
};
goog.inherits(ee.MapTileManager, goog.events.EventTarget);
goog.addSingletonGetter(ee.MapTileManager);


/**
 * Maximum number of retries for a given request.
 * @type {number}
 */
ee.MapTileManager.MAX_RETRIES = 1;


/**
 * Error to throw when a send is attempted with an ID that the manager already
 * has registered for another request.
 * @type {string}
 * @private
 */
ee.MapTileManager.ERROR_ID_IN_USE_ = '[ee.MapTileManager] ID in use';


/**
 * Returns the number of requests either in flight, or waiting to be sent.
 * @return {number} The number of requests in flight or pending send.
 */
ee.MapTileManager.prototype.getOutstandingCount = function() {
  return this.requests_.getCount();
};


/**
 * Registers the given request to be sent. Throws an error if a request
 * already exists with the given ID.
 * NOTE: It is not sent immediately. It is queued and will be sent when an
 * ImageLoader object becomes available, taking into account the request's
 * priority.
 * @param {string} id The id of the request.
 * @param {string} url Uri to make the request to.
 * @param {number=} opt_priority The priority of the request.
 * @param {function(!goog.events.Event, ?string)=} opt_imageCompletedCallback
 *     Callback function for when request is complete. Second param is the
 *     profile ID, if any.
 * @param {number=} opt_maxRetries The maximum number of times the request
 *     should be retried.
 * @return {ee.MapTileManager.Request_} The queued request object.
 */
ee.MapTileManager.prototype.send = function(
    id,
    url,
    opt_priority,
    opt_imageCompletedCallback,
    opt_maxRetries) {

  // Check if there is already a request with the given id.
  if (this.requests_.get(id)) {
    throw Error(ee.MapTileManager.ERROR_ID_IN_USE_);
  }
  // Make the Request object.
  var request = new ee.MapTileManager.Request_(
      id, url,
      opt_imageCompletedCallback,
      goog.bind(this.releaseRequest_, this),
      goog.isDef(opt_maxRetries) ?
          opt_maxRetries : ee.MapTileManager.MAX_RETRIES);
  this.requests_.set(id, request);

  // Setup the callback for the pool.
  var callback = goog.bind(this.handleAvailableToken_, this, request);
  this.tokenPool_.getObject(callback, opt_priority);

  return request;
};


/**
 * Aborts the request associated with id.
 * @param {string} id The id of the request to abort.
 */
ee.MapTileManager.prototype.abort = function(id) {
  var request = /** @type {ee.MapTileManager.Request_} */
      (this.requests_.get(id));
  if (request) {
    request.setAborted(true);
    this.releaseRequest_(request);
  }
};


/**
 * Handles a Token object that became available. Sets up the callback,
 * and starts the process to send the request.
 * @param {ee.MapTileManager.Request_} request A request to associate
 *     the token with.
 * @param {ee.MapTileManager.Token_} token The available Token_ object.
 * @private
 */
ee.MapTileManager.prototype.handleAvailableToken_ = function(
    request, token) {
  if (request.getImageLoader() || request.getAborted()) {
    this.releaseObject_(token);
    return;
  }

  // Associate the request with the token.
  request.setToken(token);
  token.setActive(true);

  // Add an ImageLoader object to the request.
  // TODO(user): consider using goog.labs.net.image, which is simpler.
  request.setImageLoader(new goog.net.ImageLoader());

  // Send the request.
  if (!request.retry()) {
    throw Error('Cannot dispatch first request!');
  }
};


/**
 * Finishes processing of a request and releases its token if possible.
 * @param {ee.MapTileManager.Request_} request The object to process.
 * @private
 */
ee.MapTileManager.prototype.releaseRequest_ = function(request) {
  this.requests_.remove(request.getId());
  if (request.getImageLoader()) {
    this.releaseObject_(request.getToken());
    request.getImageLoader().dispose();
  }
  request.fireImageEventCallback();
};


/**
 * Returns the token back to the pool.
 * @param {ee.MapTileManager.Token_} token The object to release.
 * @private
 */
ee.MapTileManager.prototype.releaseObject_ = function(token) {
  token.setActive(false);
  if (!this.tokenPool_.releaseObject(token)) {
    throw Error('Object not released');
  }
};


/** @override */
ee.MapTileManager.prototype.disposeInternal = function() {
  ee.MapTileManager.superClass_.disposeInternal.call(this);

  this.tokenPool_.dispose();
  this.tokenPool_ = null;

  // Call dispose on each request.
  var requests = this.requests_;
  goog.array.forEach(requests.getValues(), function(value) {
    value.dispose();
  });
  requests.clear();
  this.requests_ = null;
};



/**
 * An encapsulation of everything needed to make a Xhr request.
 * NOTE: This is used internal to the MapTileManager.
 *
 * @param {string} id Unique id for the request.
 * @param {string} url Uri to make the request too.
 * @param {Function=} opt_imageEventCallback Callback attached to the events
       of the ImageLoader object of the request.
 * @param {Function=} opt_requestCompleteCallback Callback function for when
       request is complete. NOTE: Only 1 callback supported across all events.
 * @param {number=} opt_maxRetries The maximum number of times the request
 *     should be retried (Default: 1).
 *
 * @constructor
 * @private
 * @extends {goog.Disposable}
 */
ee.MapTileManager.Request_ = function(
    id, url, opt_imageEventCallback, opt_requestCompleteCallback,
    opt_maxRetries) {
  goog.Disposable.call(this);

  this.id_ = id;

  /**
   * Uri to make the request too.
   * @type {string}
   * @private
   */
  this.url_ = url;

  /**
   * The maximum number of times the request should be retried.
   * @type {number}
   * @private
   */
  this.maxRetries_ = goog.isDef(opt_maxRetries) ?
      opt_maxRetries : ee.MapTileManager.MAX_RETRIES;

  /**
   * Callback attached to the events of the ImageLoader object.
   * @type {Function|undefined}
   * @private
   */
  this.imageEventCallback_ = opt_imageEventCallback;

  /**
   * Callback function called when request is complete.
   * @type {Function|undefined}
   * @private
   */
  this.requestCompleteCallback_ = opt_requestCompleteCallback;
};
goog.inherits(ee.MapTileManager.Request_, goog.Disposable);


/**
 * The number of attempts  so far.
 * @type {number}
 * @private
 */
ee.MapTileManager.Request_.prototype.attemptCount_ = 0;


/**
 * Whether the request has been aborted.
 * @type {boolean}
 * @private
 */
ee.MapTileManager.Request_.prototype.aborted_ = false;


/**
 * The ImageLoader instance handling this request.
 * Set in handleAvailableImageLoader.
 * @type {goog.net.ImageLoader}
 * @private
 */
ee.MapTileManager.Request_.prototype.imageLoader_ = null;


/**
 * The token that should be released when the request has finished.
 * @type {ee.MapTileManager.Token_}
 * @private
 */
ee.MapTileManager.Request_.prototype.token_ = null;


/**
 * An event that will be sent to the listeners.
 * @type {goog.events.Event}
 * @private
 */
ee.MapTileManager.Request_.prototype.event_ = null;


/**
 * After the request has finished, the profile ID returned by the server, if
 * any.
 * @type {?string}
 * @private
 */
ee.MapTileManager.Request_.prototype.profileId_ = null;


/**
 * The goog.net.EventType's to listen/unlisten for on the ImageLoader object.
 * @type {Array.<goog.net.EventType>}
 * @private
 */
ee.MapTileManager.Request_.IMAGE_LOADER_EVENT_TYPES_ = [
  goog.events.EventType.LOAD,
  goog.net.EventType.ABORT,
  goog.net.EventType.ERROR
];


/**
 * Returns the ImageLoader instance handling this request.
 * @return {goog.net.ImageLoader} The ImageLoader instance
 *    handling this request.
 */
ee.MapTileManager.Request_.prototype.getImageLoader = function() {
  return this.imageLoader_;
};


/**
 * Sets the ImageLoader instance handling this request.
 * @param {goog.net.ImageLoader} imageLoader The ImageLoader
 *    instance handling this request.
 */
ee.MapTileManager.Request_.prototype.setImageLoader = function(imageLoader) {
  this.imageLoader_ = imageLoader;
};


/**
 * Returns the Token_ instance guarding this request.
 * @return {ee.MapTileManager.Token_} The Token_ instance
 *    guarding this request.
 */
ee.MapTileManager.Request_.prototype.getToken = function() {
  return this.token_;
};


/**
 * Sets the Token_ instance handling this request.
 * @param {ee.MapTileManager.Token_} token The Token_ instance
 *    guarding this request.
 */
ee.MapTileManager.Request_.prototype.setToken = function(token) {
  this.token_ = token;
};


/**
 * Adds an event handler listening for image loading events.
 */
ee.MapTileManager.Request_.prototype.addImageEventListener = function() {
  var types = ee.MapTileManager.Request_.IMAGE_LOADER_EVENT_TYPES_;
  goog.events.listenOnce(
      this.imageLoader_, types, goog.bind(this.handleImageEvent_, this));
};


/**
 * Dispatches the image event callback and marks the request completed.
 */
ee.MapTileManager.Request_.prototype.fireImageEventCallback = function() {
  if (this.imageEventCallback_) {
    this.imageEventCallback_(this.event_, this.profileId_);
  }
};


/**
 * Gets the request id.
 * @return {string} The id of the request.
 */
ee.MapTileManager.Request_.prototype.getId = function() {
  return this.id_;
};


/**
 * Gets the uri.
 * @return {string} The uri to make the request to.
 */
ee.MapTileManager.Request_.prototype.getUrl = function() {
  return this.url_;
};


/**
 * Gets the maximum number of times the request should be retried.
 * @return {number} The maximum number of times the request should be retried.
 */
ee.MapTileManager.Request_.prototype.getMaxRetries = function() {
  return this.maxRetries_;
};


/**
 * Gets the number of attempts so far.
 * @return {number} The number of attempts so far.
 */
ee.MapTileManager.Request_.prototype.getAttemptCount = function() {
  return this.attemptCount_;
};


/**
 * Increases the number of attempts so far.
 */
ee.MapTileManager.Request_.prototype.increaseAttemptCount = function() {
  this.attemptCount_++;
};


/**
 * Returns whether the request has reached the maximum number of retries.
 * @return {boolean} Whether the request has reached the maximum number of
 *     retries.
 */
ee.MapTileManager.Request_.prototype.hasReachedMaxRetries = function() {
  return this.attemptCount_ > this.maxRetries_;
};


/**
 * Sets the aborted status.
 * @param {boolean} aborted True if the request was aborted, otherwise False.
 */
ee.MapTileManager.Request_.prototype.setAborted = function(aborted) {
  if (aborted && !this.aborted_) {
    this.aborted_ = aborted;
    this.event_ = new goog.events.Event(goog.net.EventType.ABORT);
  }
};


/**
 * Gets the aborted status.
 * @return {boolean} True if request was aborted, otherwise False.
 */
ee.MapTileManager.Request_.prototype.getAborted = function() {
  return this.aborted_;
};


/**
 * Handles all events fired by the ImageLoader object for a given request.
 * @param {goog.events.Event} e The event.
 * @private
 */
ee.MapTileManager.Request_.prototype.handleImageEvent_ = function(e) {
  if (this.getAborted()) {
    this.markCompleted_();
    return;
  }
  switch (e.type) {
    case goog.events.EventType.LOAD:
      this.handleSuccess_(e);
      this.markCompleted_();
      break;

    case goog.net.EventType.ERROR:
    case goog.net.EventType.ABORT:
      this.handleError_(e);
      break;
  }
};


/**
 * Handles the success of a request. Dispatches the SUCCESS event and marks the
 * the request as completed.
 * @private
 */
ee.MapTileManager.Request_.prototype.markCompleted_ = function() {
  if (this.requestCompleteCallback_) {
    this.requestCompleteCallback_(this);
  }
};


/**
 * Handles the success of a request. Dispatches the SUCCESS event.
 * @param {goog.events.Event} e An event to handle.
 * @private
 */
ee.MapTileManager.Request_.prototype.handleSuccess_ = function(e) {
  this.event_ = e;
};


/**
 * Handles the error of a request. If the request has not reach its maximum
 * number of retries, then it lets the request retry naturally (will let the
 * request hit the READY state). Else, it dispatches the ERROR event.
 * @param {goog.events.Event} e An event to handle.
 * @private
 */
ee.MapTileManager.Request_.prototype.handleError_ = function(e) {
  // If the maximum number of retries has been reached.
  if (!this.retry()) {
    this.event_ = e;
    this.markCompleted_();
  }
};


/** @override */
ee.MapTileManager.Request_.prototype.disposeInternal = function() {
  ee.MapTileManager.Request_.superClass_.disposeInternal.call(this);
  delete this.imageEventCallback_;
  delete this.requestCompleteCallback_;
};


/**
 * Sets up a request to fetch images if the retry count has not been reached.
 * @return {boolean} Whether a retry attempt was started.
 */
ee.MapTileManager.Request_.prototype.retry = function() {
  if (!this.hasReachedMaxRetries()) {
    this.increaseAttemptCount();
    this.imageLoader_.removeImage(this.id_);
    // Postpone starting a new request in case we are within an event handler
    // for an image load error.
    setTimeout(goog.bind(this.start_, this), 0);
    return true;
  } else {
    return false;
  }
};


/**
 * Sends a request to fetch images
 * @private
 */
ee.MapTileManager.Request_.prototype.start_ = function() {
  if (this.getAborted()) {
    return;
  }

  var actuallyLoadImage = goog.bind(function(imageUrl) {
    if (this.getAborted()) {
      return;
    }
    this.imageLoader_.addImage(this.id_, imageUrl);
    this.addImageEventListener();
    this.imageLoader_.start();
  }, this);

  var sourceUrl = this.getUrl();
  // Parsing the URL here isn't all that great. It's just a way to not have to
  // pass another parameter from MapLayerOverlay to here containing the same
  // information.
  if (goog.Uri.parse(sourceUrl).getQueryData().containsKey('profiling')) {

    // Fetch the image using XHR so that we can obtain the profile ID from the
    // response headers. Then construct an object URL for the response (possible
    // because we specified 'blob' response type) so that we can load it as an
    // image for the actual map tile display.
    var xhrIo = new goog.net.XhrIo();
    xhrIo.setResponseType(goog.net.XhrIo.ResponseType.BLOB);
    xhrIo.listen(goog.net.EventType.COMPLETE, goog.bind(function(event) {
      this.profileId_ = xhrIo.getResponseHeader(ee.data.PROFILE_HEADER) || null;

      // Store the response, but only if it is not an error, because if we did
      // then we would attempt to interpret the error response as an image.
      // This also ensures that the Code Editor can display the error message.
      var objectUrl, ok;
      if (xhrIo.getStatus() >= 200 && xhrIo.getStatus() < 300) {
        try {
          objectUrl = goog.html.SafeUrl.unwrap(goog.html.SafeUrl.fromBlob(
              /** @type {!Blob} */ (xhrIo.getResponse())));
          ok = (objectUrl !== goog.html.SafeUrl.INNOCUOUS_STRING);
        } catch (e) {
          // Browser did not support blob response, or we made a mistake. We
          // will fall back to re-requesting the tile as an image since ok is
          // still null.
        }
      }

      actuallyLoadImage(ok ? objectUrl : sourceUrl);
    }, this));
    xhrIo.listenOnce(goog.net.EventType.READY, goog.bind(xhrIo.dispose, xhrIo));
    xhrIo.send(sourceUrl, 'GET');
    // TODO(user): xhrIo.dispose() sooner if this Request_ is aborted
  } else {
    actuallyLoadImage(sourceUrl);
  }
};



/**
 * An object that we put into a PriorityPool to throttle requests.
 *
 * @constructor
 * @private
 * @extends {goog.Disposable}
 */
ee.MapTileManager.Token_ = function() {

  /**
   * Whether the current object is used by a request.
   * @type {boolean}
   * @private
   */
  this.active_ = false;
};
goog.inherits(ee.MapTileManager.Token_, goog.Disposable);


/**
 * Sets the active state of this object
 * @param {boolean} val Boolean value indicating business.
 */
ee.MapTileManager.Token_.prototype.setActive = function(val) {
  this.active_ = val;
};


/**
 * Returns true if the current object is busy
 * @return {boolean} Whether this object is busy.
 */
ee.MapTileManager.Token_.prototype.isActive = function() {
  return this.active_;
};



/**
 * A pool of Token objects.
 * @param {number=} opt_minCount Minimum number of objects (Default: 1).
 * @param {number=} opt_maxCount Maximum number of objects (Default: 10).
 * @constructor
 * @private
 * @extends {goog.structs.PriorityPool}
 */
ee.MapTileManager.TokenPool_ = function(opt_minCount, opt_maxCount) {
  goog.structs.PriorityPool.call(this, opt_minCount, opt_maxCount);
};
goog.inherits(ee.MapTileManager.TokenPool_, goog.structs.PriorityPool);


/**
 * Creates an instance of an ImageLoader object to use in the pool.
 * @return {ee.MapTileManager.Token_} The created object.
 * @override
 */
ee.MapTileManager.TokenPool_.prototype.createObject = function() {
  return new ee.MapTileManager.Token_();
};


/**
 * Should be overridden to dispose of an object, default implementation is to
 * remove all its members which should render it useless.
 * @param {!ee.MapTileManager.Token_} obj The object to dispose of.
 * @override
 */
ee.MapTileManager.TokenPool_.prototype.disposeObject = function(obj) {
  obj.dispose();
};


/** @override */
ee.MapTileManager.TokenPool_.prototype.objectCanBeReused = function(obj) {
  // An active ImageLoader object should never be used.
  return !obj.isDisposed() && !obj.isActive();
};
