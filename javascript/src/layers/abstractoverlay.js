goog.provide('ee.layers.AbstractOverlay');
goog.provide('ee.layers.AbstractTile');
goog.provide('ee.layers.TileFailEvent');
goog.provide('ee.layers.TileLoadEvent');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.fs.FileReader');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('goog.object');
goog.require('goog.structs.Map');
goog.require('goog.style');

goog.forwardDeclare('ee.data.Profiler');



/**
 * An abstract class for use with the Maps API for displaying image tiles.
 *
 * This class behaves much like the default Google Maps API's ImageMapType,
 * but it emits events when tiles load or fail.
 *
 * @param {!ee.layers.AbstractTileSource} tileSource The source of tiles
 *     for this map layer.
 * @param {Object=} opt_options Initialization options, of the same form as a
 *     google.maps.ImageMapTypeOptions object.
 * @constructor
 * @extends {goog.events.EventTarget}
 * @implements {google.maps.MapType}
 * @export
 * @ignore
 */
ee.layers.AbstractOverlay = function(tileSource, opt_options) {
  goog.base(this);

  // Public options required by the Maps API.

  var options = opt_options || {};
  this.minZoom = options.minZoom || 0;
  this.maxZoom = options.maxZoom || 20;
  if (!window['google'] || !window['google']['maps']) {
    throw Error('Google Maps API hasn\'t been initialized.');
  }
  this.tileSize = options.tileSize || new google.maps.Size(
      ee.layers.AbstractOverlay.DEFAULT_TILE_EDGE_LENGTH,
      ee.layers.AbstractOverlay.DEFAULT_TILE_EDGE_LENGTH);
  this.isPng = 'isPng' in options ? options.isPng : true;
  this.name = options.name;
  this.opacity = 'opacity' in options ? options.opacity : 1;

  // Protected internal members.

  /** @protected {goog.structs.Map<string, ee.layers.AbstractTile>} */
  this.tilesById = new goog.structs.Map();

  /** @protected {number} The count of tiles that have been requested. */
  this.tileCounter = 0;

  /** @protected {ee.layers.AbstractTileSource} The overlay's tile source. */
  this.tileSource = tileSource;

  /** @protected {goog.events.EventHandler} The overlay's event handler. */
  this.handler = new goog.events.EventHandler(this);

  // MapType options required by the compiler but which we don't support.

  this.projection = undefined;
  this.radius = undefined;
  this.alt = undefined;
};
goog.inherits(ee.layers.AbstractOverlay, goog.events.EventTarget);



// Public interface.


/** @enum {string} The event types dispatched by AbstractOverlay. */
ee.layers.AbstractOverlay.EventType = {
  TILE_FAIL: 'tile-fail',
  TILE_LOAD: 'tile-load'
};


/** @const {number} */
ee.layers.AbstractOverlay.DEFAULT_TILE_EDGE_LENGTH = 256;


/**
 * Adds a callback to be fired each time a tile is loaded.
 * @param {function(ee.layers.TileLoadEvent)} callback The function to call.
 * @return {!Object} An ID which can be passed to removeTileCallback().
 * @export
 */
ee.layers.AbstractOverlay.prototype.addTileCallback = function(callback) {
  return /** @type {!Object} */ (goog.events.listen(
      this, ee.layers.AbstractOverlay.EventType.TILE_LOAD, callback));
};


/**
 * Removes the callback with the given ID.
 * @param {!Object} callbackId An ID returned by addTileCallback().
 * @export
 */
ee.layers.AbstractOverlay.prototype.removeTileCallback = function(callbackId) {
  goog.events.unlistenByKey(/** @type {goog.events.Key} */ (callbackId));
};


/**
 * @return {number} The number of tiles yet to be loaded. Includes tiles
 *     with the status NEW or LOADING.
 */
ee.layers.AbstractOverlay.prototype.getLoadingTilesCount = function() {
  return (
      this.getTileCountForStatus_(ee.layers.AbstractTile.Status.LOADING) +
      this.getTileCountForStatus_(ee.layers.AbstractTile.Status.NEW));
};


/** @return {number} The number of tiles which have failed. */
ee.layers.AbstractOverlay.prototype.getFailedTilesCount = function() {
  return this.getTileCountForStatus_(ee.layers.AbstractTile.Status.FAILED);
};


/**
 * @return {number} The number of tiles successfully loaded.
 */
ee.layers.AbstractOverlay.prototype.getLoadedTilesCount = function() {
  return this.getTileCountForStatus_(ee.layers.AbstractTile.Status.LOADED);
};


/**
 * Sets the layer's opacity.
 * @param {number} opacity The layer's new opacity.
 */
ee.layers.AbstractOverlay.prototype.setOpacity = function(opacity) {
  this.opacity = opacity;
  this.tilesById.forEach(function(tile) {
    goog.style.setOpacity(tile.div, this.opacity);
  }, this);
};


// Interface for the Google Maps API.


/** @override */
ee.layers.AbstractOverlay.prototype.getTile = function(
    coord, zoom, ownerDocument) {
  var maxCoord = 1 << zoom;

  // If the position is out of bounds, return an empty tile immediately.
  if (zoom < this.minZoom || coord.y < 0 || coord.y >= maxCoord) {
    return ownerDocument.createElement('div');
  }

  // Wrap longitude around.
  var x = coord.x % maxCoord;
  if (x < 0) {
    x += maxCoord;
  }
  var normalizedCoord = new google.maps.Point(x, coord.y);

  // Create the tile.
  var uniqueId = this.getUniqueTileId_(coord, zoom);
  var tile = this.createTile(normalizedCoord, zoom, ownerDocument, uniqueId);
  tile.tileSize = this.tileSize;
  goog.style.setOpacity(tile.div, this.opacity);
  this.tilesById.set(uniqueId, tile);

  // Notify listeners when the tile has loaded.
  this.handler.listen(
      tile, ee.layers.AbstractTile.EventType.STATUS_CHANGED, function() {
        if (tile.getStatus() == ee.layers.AbstractTile.Status.LOADED) {
          this.dispatchEvent(
              new ee.layers.TileLoadEvent(this.getLoadingTilesCount()));
        }
        if (tile.getStatus() == ee.layers.AbstractTile.Status.FAILED) {
          this.dispatchEvent(
              new ee.layers.TileFailEvent(tile.sourceUrl, tile.errorMessage_));
        }
      });


  // Use the current time in seconds as the priority for the tile
  // loading queue. Smaller priorities move to the front of the queue,
  // which is what we want - the Maps API loads the tiles in a spiral
  // starting from the center, and we would like to preserve this order.
  // Requests for tiles that are no longer visible won't clog the queue:
  // if the map is moved around a lot, Maps API calls our releaseTile()
  // method, and the obsolete requests will be removed from the queue.
  var priority = new Date().getTime() / 1000;

  this.tileSource.loadTile(tile, priority);

  // Return the tile's DIV, which is expected by the Maps API.
  return tile.div;
};


/** @override */
ee.layers.AbstractOverlay.prototype.releaseTile = function(tileDiv) {
  var tile = this.tilesById.get(tileDiv.id);
  this.tilesById.remove(tileDiv.id);
  if (tile) {
    tile.abort();
    goog.dispose(tile);
  }
};


// Internals.


/**
 * Factory method to create a tile for this overlay.
 * @param {!google.maps.Point} coord The position of the tile.
 * @param {number} zoom The zoom level of the tile.
 * @param {Node} ownerDocument The owner document.
 * @param {string} uniqueId
 * @return {ee.layers.AbstractTile}
 * @protected
 */
ee.layers.AbstractOverlay.prototype.createTile = goog.abstractMethod;


/**
 * Generates a unique for this tile from the tile source. It includes:
 *
 * 1) A unique counter string to the tileid to make sure that
 *    repeated requests for the same tile and cancellations thereof
 *    (which may occur if the user quickly moves the map around)
 *    don't overwrite each other's state.
 * 2) A unique token for this overlay's source to differentiate its tile
 *    requests from other tile requests for other layers with the same map ID.
 *
 * @param {!google.maps.Point} coord The position of the tile.
 * @param {number} z The zoom level of the tile.
 * @return {string} A unique tile ID.
 * @private
 */
ee.layers.AbstractOverlay.prototype.getUniqueTileId_ = function(coord, z) {
  var tileId = [coord.x, coord.y, z, this.tileCounter].join('-');
  var sourceId = this.tileSource.getUniqueId();
  return [tileId, sourceId].join('-');
};


/** @override */
ee.layers.AbstractOverlay.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  this.tilesById.forEach(goog.dispose);
  this.tilesById.clear();
  this.tilesById = null;
  goog.dispose(this.handler);
  this.handler = null;
  // TODO(user): Dispose the tile source?
  this.tileSource = null;
};


/**
 * Returns the count of tiles with the provided status.
 * @param {ee.layers.AbstractTile.Status} status The tile status.
 * @return {number} The count of tiles with the provided status.
 * @private
 */
ee.layers.AbstractOverlay.prototype.getTileCountForStatus_ = function(status) {
  return goog.array.count(this.tilesById.getValues(), function(tile) {
    return tile.getStatus() == status;
  });
};


// Events.



/**
 * An event dispatched when a tile is loaded.
 * @param {number} loadingTileCount The number of outstanding tile requests.
 * @constructor
 * @extends {goog.events.Event}
 */
ee.layers.TileLoadEvent = function(loadingTileCount) {
  goog.events.Event.call(this, ee.layers.AbstractOverlay.EventType.TILE_LOAD);

  /** @const {number} The number of outstanding tile requests. */
  this.loadingTileCount = loadingTileCount;
};
goog.inherits(ee.layers.TileLoadEvent, goog.events.Event);



/**
 * An event dispatched when a tile fails.
 * @param {string} tileUrl The URL of the failed tile.
 * @param {string=} opt_errorMessage A message describing the error that
 *     caused the tile to fail, if any.
 * @constructor
 * @extends {goog.events.Event}
 */
ee.layers.TileFailEvent = function(tileUrl, opt_errorMessage) {
  goog.events.Event.call(this, ee.layers.AbstractOverlay.EventType.TILE_FAIL);

  /** @const {string} The URL of the failed tile. */
  this.tileUrl = tileUrl;

  /**
   * A message describing the error that caused the tile to fail, if any.
   * @const {string|undefined}
   */
  this.errorMessage = opt_errorMessage;
};
goog.inherits(ee.layers.TileFailEvent, goog.events.Event);



////////////////////////////////////////////////////////////////////////////////
//                          Map tile wrapper class.                           //
////////////////////////////////////////////////////////////////////////////////



/**
 * An abstract individual map layer tile.
 *
 * @param {!google.maps.Point} coord The position of the tile.
 * @param {number} zoom The zoom level of the tile.
 * @param {Node} ownerDocument The tile's owner document.
 * @param {string} uniqueId A unique ID for the tile.
 * @constructor
 * @extends {goog.events.EventTarget}
 * @package
 * @ignore
 */
ee.layers.AbstractTile = function(coord, zoom, ownerDocument, uniqueId) {
  goog.base(this);

  /** @package @const {!google.maps.Point} The position of the tile. */
  this.coord = coord;

  /** @package @const {number} The zoom level of the tile. */
  this.zoom = zoom;

  /** @package @const {!Element} The tile's DIV element. */
  this.div = ownerDocument.createElement('div');
  this.div.id = uniqueId;

  /** @package {number} The maximum number of tile load retries. */
  this.maxRetries = ee.layers.AbstractTile.DEFAULT_MAX_LOAD_RETRIES_;

  /** @package {google.maps.Size} The size of the tile. */
  this.tileSize;

  /** @package {string} The URL of the tile's source data. */
  this.sourceUrl;

  /** @package {!Blob} The source data for the tile. */
  this.sourceData;

  /** @package {Object} The response headers from the source data request. */
  this.sourceResponseHeaders;

  /** @private {goog.net.XhrIo} The request for the tile's source data. */
  this.xhrIo_;

  /** @private {ee.layers.AbstractTile.Status} The tile's current status. */
  this.status_ = ee.layers.AbstractTile.Status.NEW;

  /** @private {number} The current load retry attempt. */
  this.retryAttemptCount_ = 0;

  /** @private {boolean} Where the tile load is currently be retried. */
  this.isRetrying_ = false;

  /**
   * A message describing the error that caused the tile to fail, if any.
   * @private {string|undefined}
   */
  this.errorMessage_;
};
goog.inherits(ee.layers.AbstractTile, goog.events.EventTarget);


/** @enum {string} The event types dispatched by AbstractTile. */
ee.layers.AbstractTile.EventType = {
  STATUS_CHANGED: 'status-changed'
};


/**
 * The statuses of an AbstractTile.
 *
 *   - NEW after instantiation until startLoad() is invoked.
 *   - LOADING once the network request for source data is dispatched.
 *   - LOADED once the source data has been received and tile's been rendered.
 *   - FAILED if the maximum retry limit is exceeded.
 *   - ABORTED if abort() is invoked.
 *
 * @package @enum {string}
 */
ee.layers.AbstractTile.Status = {
  NEW: 'new',
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed',
  ABORTED: 'aborted'
};


/**
 * Starts the tile's load by kicking off a request for source data and setting
 * its status to LOADING.
 * @package
 */
ee.layers.AbstractTile.prototype.startLoad = function() {
  if (!this.isRetrying_ &&
      this.getStatus() == ee.layers.AbstractTile.Status.LOADING) {
    throw new Error(
        'startLoad() can only be invoked once. ' +
        'Use retryLoad() after the first attempt.');
  }
  this.setStatus(ee.layers.AbstractTile.Status.LOADING);

  this.xhrIo_ = new goog.net.XhrIo();
  this.xhrIo_.setResponseType(goog.net.XhrIo.ResponseType.BLOB);
  this.xhrIo_.listen(goog.net.EventType.COMPLETE, function(event) {
    var blob = /** @type {!Blob} */ (this.xhrIo_.getResponse());
    if (this.xhrIo_.getStatus() >= 200 && this.xhrIo_.getStatus() < 300) {
      this.sourceResponseHeaders = this.xhrIo_.getResponseHeaders();
      this.sourceData = blob;
      this.finishLoad();
    } else {
      var reader = new goog.fs.FileReader();
      reader.listen(goog.fs.FileReader.EventType.LOAD_END, function() {
        this.retryLoad(/** @type {string} */ (reader.getResult()));
      }, undefined, this);
      reader.readAsText(blob);
    }
  }, false, this);
  this.xhrIo_.listenOnce(
      goog.net.EventType.READY, goog.partial(goog.dispose, this.xhrIo_));
  this.xhrIo_.send(this.sourceUrl, 'GET');
};


/**
 * Finishes the load, possibly asynchronously. Subclasses can override this
 * to render the tile or cast the format of the source data.
 * @protected
 */
ee.layers.AbstractTile.prototype.finishLoad = function() {
  this.setStatus(ee.layers.AbstractTile.Status.LOADED);
};


/**
 * Cancels the current tile load in progress, if any. Doesn't change status.
 * @package
 */
ee.layers.AbstractTile.prototype.cancelLoad = function() {
  goog.dispose(this.xhrIo_);
};


/**
 * Retries the tile load. If the maximum number of attempts has already been
 * reached, then the status is set to failed and the retry is not attempted.
 * @param {string=} opt_errorMessage The message of the error that triggered
 *     the retry, if any.
 * @return {boolean} Whether the retry was attempted.
 * @package
 */
ee.layers.AbstractTile.prototype.retryLoad = function(opt_errorMessage) {
  if (this.retryAttemptCount_ >= this.maxRetries) {
    this.errorMessage_ = opt_errorMessage;
    this.setStatus(ee.layers.AbstractTile.Status.FAILED);
    return false;
  }
  this.retryAttemptCount_++;
  this.isRetrying_ = true;
  this.cancelLoad();
  this.startLoad();
  this.isRetrying_ = false;
  return true;
};


/**
 * Aborts the tile.
 * @package
 */
ee.layers.AbstractTile.prototype.abort = function() {
  this.cancelLoad();
  this.setStatus(ee.layers.AbstractTile.Status.ABORTED);
};


/** @return {boolean} Whether the tile is done: failed, aborted, or loaded. */
ee.layers.AbstractTile.prototype.isDone = function() {
  return this.status_ in ee.layers.AbstractTile.DONE_STATUSES_;
};


/** @package @return {ee.layers.AbstractTile.Status} The tile's status. */
ee.layers.AbstractTile.prototype.getStatus = function() {
  return this.status_;
};


/**
 * Sets the tile's status.
 * @param {ee.layers.AbstractTile.Status} status The new status.
 * @protected
 */
ee.layers.AbstractTile.prototype.setStatus = function(status) {
  var Status = ee.layers.AbstractTile.Status;
  this.status_ = status;
  this.dispatchEvent(ee.layers.AbstractTile.EventType.STATUS_CHANGED);
};


/** @private @const {!Object<ee.layers.AbstractTile.Status>} */
ee.layers.AbstractTile.DONE_STATUSES_ = goog.object.createSet(
    ee.layers.AbstractTile.Status.ABORTED,
    ee.layers.AbstractTile.Status.FAILED,
    ee.layers.AbstractTile.Status.LOADED);


/** @override */
ee.layers.AbstractTile.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  this.cancelLoad();
  this.div.remove();
};


/** @private {number} The default number of maximum tile load attempts. */
ee.layers.AbstractTile.DEFAULT_MAX_LOAD_RETRIES_ = 1;
