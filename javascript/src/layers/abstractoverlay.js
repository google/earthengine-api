goog.provide('ee.layers.AbstractOverlay');
goog.provide('ee.layers.AbstractTile');
goog.provide('ee.layers.TileAbortEvent');
goog.provide('ee.layers.TileFailEvent');
goog.provide('ee.layers.TileLoadEvent');
goog.provide('ee.layers.TileStartEvent');
goog.provide('ee.layers.TileThrottleEvent');

goog.forwardDeclare('ee.data.PROFILE_REQUEST_HEADER');
goog.require('ee.data');
goog.require('ee.layers.AbstractOverlayStats');
goog.require('goog.array');
goog.require('goog.dispose');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.fs.FileReader');
goog.require('goog.net.EventType');
goog.require('goog.net.HttpStatus');
goog.require('goog.net.XhrIo');
goog.require('goog.object');
goog.require('goog.structs.Map');
goog.require('goog.style');
goog.requireType('ee.data.Profiler');



/**
 * An abstract class for use with the Maps API for displaying image tiles.
 * This class behaves much like the default Google Maps API's ImageMapType,
 * but it emits events when tiles load or fail.
 * @implements {google.maps.MapType}
 * @export
 * @ignore
 * @unrestricted
 */
ee.layers.AbstractOverlay = class extends goog.events.EventTarget {
  /**
   * @param {!ee.layers.AbstractTileSource} tileSource The source of tiles
   *     for this map layer.
   * @param {Object=} opt_options Initialization options, of the same form as a
   *     google.maps.ImageMapTypeOptions object.
   */
  constructor(tileSource, opt_options) {
    super();

    // Public options required by the Maps API.

    var options = opt_options || {};
    this.minZoom = options.minZoom || 0;
    this.maxZoom = options.maxZoom || 20;
    if (!window['google'] || !window['google']['maps']) {
      throw Error('Google Maps API hasn\'t been initialized.');
    }
    this.tileSize = options.tileSize ||
        new google.maps.Size(
            ee.layers.AbstractOverlay.DEFAULT_TILE_EDGE_LENGTH,
            ee.layers.AbstractOverlay.DEFAULT_TILE_EDGE_LENGTH);
    this.isPng = 'isPng' in options ? options.isPng : true;
    this.name = options.name;
    this.opacity = 'opacity' in options ? options.opacity : 1;

    // Protected internal members.

    /** @protected {!ee.layers.AbstractOverlayStats} */
    this.stats = new ee.layers.AbstractOverlayStats(tileSource.getUniqueId());

    /** @protected {goog.structs.Map<string, ee.layers.AbstractTile>} */
    this.tilesById = new goog.structs.Map();

    /** @protected {number} The count of tiles that have been requested. */
    this.tileCounter = 0;

    /** @protected {ee.layers.AbstractTileSource} The overlay's tile source. */
    this.tileSource = tileSource;

    /** @protected {goog.events.EventHandler} The overlay's event handler. */
    this.handler = new goog.events.EventHandler(this);

    // MapType options required by the compiler but which we don't support.

    /** @type {?} */
    this.projection;
    /** @type {?} */
    this.alt;
    this.radius = 0;
  }

  /**
   * Adds a callback to be fired each time a tile is loaded.
   * @param {function(ee.layers.TileLoadEvent)} callback The function to call.
   * @return {!Object} An ID which can be passed to removeTileCallback().
   * @export
   */
  addTileCallback(callback) {
    return /** @type {!Object} */ (goog.events.listen(
        this, ee.layers.AbstractOverlay.EventType.TILE_LOAD, callback));
  }

  /**
   * Removes the callback with the given ID.
   * @param {!Object} callbackId An ID returned by addTileCallback().
   * @export
   */
  removeTileCallback(callbackId) {
    goog.events.unlistenByKey(/** @type {goog.events.Key} */ (callbackId));
  }

  /**
   * @return {number} The number of tiles yet to be loaded. Includes tiles
   *     with the status NEW or LOADING or THROTTLED.
   */
  getLoadingTilesCount() {
    return (
        this.getTileCountForStatus_(ee.layers.AbstractTile.Status.THROTTLED) +
        this.getTileCountForStatus_(ee.layers.AbstractTile.Status.LOADING) +
        this.getTileCountForStatus_(ee.layers.AbstractTile.Status.NEW));
  }

  /** @return {number} The number of tiles which have failed. */
  getFailedTilesCount() {
    return this.getTileCountForStatus_(ee.layers.AbstractTile.Status.FAILED);
  }

  /**
   * @return {number} The number of tiles successfully loaded.
   */
  getLoadedTilesCount() {
    return this.getTileCountForStatus_(ee.layers.AbstractTile.Status.LOADED);
  }

  /**
   * Sets the layer's opacity.
   * @param {number} opacity The layer's new opacity.
   */
  setOpacity(opacity) {
    this.opacity = opacity;
    this.tilesById.forEach(function(tile) {
      goog.style.setOpacity(tile.div, this.opacity);
    }, this);
  }

  /**
   * @return {!ee.layers.AbstractOverlayStats} The stats for the layer
   */
  getStats() {
    return this.stats;
  }

  /** @override */
  getTile(coord, zoom, ownerDocument) {
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

    // Notify listeners when tile status changes.
    this.registerStatusChangeListener_(tile);

    // Notify listeners that the tile has been created.
    this.dispatchEvent(
        new ee.layers.TileStartEvent(this.getLoadingTilesCount()));

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
  }

  /** @override */
  releaseTile(tileDiv) {
    var tile = this.tilesById.get(tileDiv.id);
    this.tilesById.remove(tileDiv.id);
    if (tile) {
      tile.abort();
      goog.dispose(tile);
    }
  }

  /**
   * Listen for tile status changes and respond accordingly.
   * @param {ee.layers.AbstractTile} tile
   * @private
   */
  registerStatusChangeListener_(tile) {
    // Notify listeners when the tile has loaded.
    this.handler.listen(
        tile, ee.layers.AbstractTile.EventType.STATUS_CHANGED, function() {
          var Status = ee.layers.AbstractTile.Status;

          switch (tile.getStatus()) {
            case Status.LOADED:
              const endTs = new Date().getTime();
              this.stats.addTileStats(tile.loadingStartTs_, endTs, tile.zoom);
              this.dispatchEvent(
                  new ee.layers.TileLoadEvent(this.getLoadingTilesCount()));
              break;
            case Status.THROTTLED:
              this.stats.incrementThrottleCounter(tile.zoom);
              this.dispatchEvent(
                  new ee.layers.TileThrottleEvent(tile.sourceUrl));
              break;
            case Status.FAILED:
              this.stats.incrementErrorCounter(tile.zoom);
              this.dispatchEvent(new ee.layers.TileFailEvent(
                  tile.sourceUrl, tile.errorMessage_));
              break;
            case Status.ABORTED:
              this.dispatchEvent(
                  new ee.layers.TileAbortEvent(this.getLoadingTilesCount()));
              break;
          }
        });
  }

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
  getUniqueTileId_(coord, z) {
    var tileId = [coord.x, coord.y, z, this.tileCounter++].join('-');
    var sourceId = this.tileSource.getUniqueId();
    return [tileId, sourceId].join('-');
  }

  /** @override */
  disposeInternal() {
    super.disposeInternal();
    this.tilesById.forEach(goog.dispose);
    this.tilesById.clear();
    this.tilesById = null;
    goog.dispose(this.handler);
    this.handler = null;
    this.tileSource = null;
  }

  /**
   * Returns the count of tiles with the provided status.
   * @param {ee.layers.AbstractTile.Status} status The tile status.
   * @return {number} The count of tiles with the provided status.
   * @private
   */
  getTileCountForStatus_(status) {
    return goog.array.count(this.tilesById.getValues(), function(tile) {
      return tile.getStatus() == status;
    });
  }
};



// Public interface.


/** @enum {string} The event types dispatched by AbstractOverlay. */
ee.layers.AbstractOverlay.EventType = {
  TILE_FAIL: 'tile-fail',
  TILE_ABORT: 'tile-abort',
  TILE_THROTTLE: 'tile-throttle',
  TILE_LOAD: 'tile-load',
  TILE_START: 'tile-start',
};


/** @const {number} */
ee.layers.AbstractOverlay.DEFAULT_TILE_EDGE_LENGTH = 256;



// Interface for the Google Maps API.



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



// Events.



/**
 * An event dispatched when a tile is loaded.
 * @unrestricted
 */
ee.layers.TileLoadEvent = class extends goog.events.Event {
  /**
   * @param {number} loadingTileCount The number of outstanding tile requests.
   */
  constructor(loadingTileCount) {
    super(ee.layers.AbstractOverlay.EventType.TILE_LOAD);

    /** @const {number} The number of outstanding tile requests. */
    this.loadingTileCount = loadingTileCount;
  }
};



/**
 * An event dispatched when a tile is created.
 * @unrestricted
 */
ee.layers.TileStartEvent = class extends goog.events.Event {
  /**
   * @param {number} loadingTileCount The number of outstanding tile requests.
   */
  constructor(loadingTileCount) {
    super(ee.layers.AbstractOverlay.EventType.TILE_START);

    /** @const {number} The number of outstanding tile requests. */
    this.loadingTileCount = loadingTileCount;
  }
};



/**
 * An event dispatched when a tile fails to load due to throttling.
 * @unrestricted
 */
ee.layers.TileThrottleEvent = class extends goog.events.Event {
  /**
   * @param {string} tileUrl The URL of the throttled tile.
   */
  constructor(tileUrl) {
    super(ee.layers.AbstractOverlay.EventType.TILE_THROTTLE);

    /** @const {string} The URL of the throttled tile. */
    this.tileUrl = tileUrl;
  }
};



/**
 * An event dispatched when a tile fails.
 * @unrestricted
 */
ee.layers.TileFailEvent = class extends goog.events.Event {
  /**
   * @param {string} tileUrl The URL of the failed tile.
   * @param {string=} opt_errorMessage A message describing the error that
   *     caused the tile to fail, if any.
   */
  constructor(tileUrl, opt_errorMessage) {
    super(ee.layers.AbstractOverlay.EventType.TILE_FAIL);

    /** @const {string} The URL of the failed tile. */
    this.tileUrl = tileUrl;

    /**
     * A message describing the error that caused the tile to fail, if any.
     * @const {string|undefined}
     */
    this.errorMessage = opt_errorMessage;
  }
};



/**
 * An event dispatched when a tile is aborted (because the layer is removed
 * from the map or the tile is panned/zoomed out of view on the map) before it
 * finished loading.
 * @unrestricted
 */
ee.layers.TileAbortEvent = class extends goog.events.Event {
  /**
   * @param {number} loadingTileCount The number of outstanding tile requests.
   */
  constructor(loadingTileCount) {
    super(ee.layers.AbstractOverlay.EventType.TILE_ABORT);

    /** @const {number} The number of outstanding tile requests. */
    this.loadingTileCount = loadingTileCount;
  }
};



////////////////////////////////////////////////////////////////////////////////
//                          Map tile wrapper class.                           //
////////////////////////////////////////////////////////////////////////////////



/**
 * An abstract individual map layer tile.
 * @package
 * @ignore
 * @unrestricted
 */
ee.layers.AbstractTile = class extends goog.events.EventTarget {
  /**
   * @param {!google.maps.Point} coord The position of the tile.
   * @param {number} zoom The zoom level of the tile.
   * @param {Node} ownerDocument The tile's owner document.
   * @param {string} uniqueId A unique ID for the tile.
   */
  constructor(coord, zoom, ownerDocument, uniqueId) {
    super();

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

    /**
     * A function that renders the tile into its DIV using the source data.
     * @package {?function(!ee.layers.AbstractTile):undefined}
     */
    this.renderer = function() {};  // No-op by default.

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

    /**
     * Loading start time.
     * @private {number}
     */
    this.loadingStartTs_;
  }

  /**
   * Starts the tile's load by kicking off a request for source data and setting
   * its status to LOADING.
   * @package
   */
  startLoad() {
    if (!this.isRetrying_ &&
        this.getStatus() == ee.layers.AbstractTile.Status.LOADING) {
      throw new Error(
          'startLoad() can only be invoked once. ' +
          'Use retryLoad() after the first attempt.');
    }
    this.setStatus(ee.layers.AbstractTile.Status.LOADING);
    this.loadingStartTs_ = new Date().getTime();

    this.xhrIo_ = new goog.net.XhrIo();
    this.xhrIo_.setResponseType(goog.net.XhrIo.ResponseType.BLOB);
    this.xhrIo_.listen(goog.net.EventType.COMPLETE, (event) => {
      const blob = /** @type {!Blob} */ (this.xhrIo_.getResponse());
      const status = this.xhrIo_.getStatus();
      const HttpStatus = goog.net.HttpStatus;
      if (status == HttpStatus.TOO_MANY_REQUESTS) {
        this.setStatus(ee.layers.AbstractTile.Status.THROTTLED);
      }

      if (HttpStatus.isSuccess(status)) {
        // Normalize case in headers so lookups can be naïve — XhrIo does not.
        const sourceResponseHeaders = {};
        goog.object.forEach(this.xhrIo_.getResponseHeaders(), (value, name) => {
          sourceResponseHeaders[name.toLowerCase()] = value;
        });
        this.sourceResponseHeaders = sourceResponseHeaders;

        this.sourceData = blob;
        this.finishLoad();
      } else if (blob) {
        const reader = new goog.fs.FileReader();
        reader.listen(goog.fs.FileReader.EventType.LOAD_END, () => {
          this.retryLoad(/** @type {string} */ (reader.getResult()));
        }, undefined);
        reader.readAsText(blob);
      } else {
        this.retryLoad('Failed to load tile.');
      }
    }, false);
    this.xhrIo_.listenOnce(
        goog.net.EventType.READY, goog.partial(goog.dispose, this.xhrIo_));

    if (this.sourceUrl && this.sourceUrl.endsWith('&profiling=1')) {
      this.sourceUrl = this.sourceUrl.replace('&profiling=1', '');
      this.xhrIo_.headers.set(ee.data.PROFILE_REQUEST_HEADER, '1');
    }
    this.xhrIo_.send(this.sourceUrl, 'GET');
  }

  /**
   * Finishes the load, possibly asynchronously. Subclasses can override this
   * to render the tile or cast the format of the source data.
   * @protected
   */
  finishLoad() {
    this.renderer(this);
    this.setStatus(ee.layers.AbstractTile.Status.LOADED);
  }

  /**
   * Cancels the current tile load in progress, if any. Doesn't change status.
   * @package
   */
  cancelLoad() {
    goog.dispose(this.xhrIo_);
  }

  /**
   * Retries the tile load using exponential backoff. If the maximum number of
   * attempts has already been reached, then the status is set to failed and the
   * retry is not attempted.
   * @param {string=} opt_errorMessage The message of the error that triggered
   *     the retry, if any.
   * @package
   */
  retryLoad(opt_errorMessage) {
    var parseError = function(error) {
      try {
        error = JSON.parse(error);
        if (error['error'] && error['error']['message']) {
          return error['error']['message'];
        }
      } catch (e) {
        // The response isn't JSON.
      }

      return error;
    };

    if (this.retryAttemptCount_ >= this.maxRetries) {
      this.errorMessage_ = parseError(opt_errorMessage);
      this.setStatus(ee.layers.AbstractTile.Status.FAILED);
      return;
    }
    this.cancelLoad();
    setTimeout(goog.bind(function() {
      if (!this.isDisposed()) {
        this.isRetrying_ = true;
        this.startLoad();
        this.isRetrying_ = false;
      }
    }, this), 1000 * Math.pow(2, this.retryAttemptCount_++));
  }

  /**
   * Aborts the tile. Sets status to REMOVED if already done or ABORTED if not.
   * @package
   */
  abort() {
    this.cancelLoad();
    if (this.getStatus() != ee.layers.AbstractTile.Status.ABORTED &&
        this.getStatus() != ee.layers.AbstractTile.Status.REMOVED) {
      this.setStatus(
          this.isDone() ? ee.layers.AbstractTile.Status.REMOVED :
                          ee.layers.AbstractTile.Status.ABORTED);
    }
  }

  /**
   * @return {boolean} Whether the tile is done: failed, aborted, loaded, or
   * removed.
   */
  isDone() {
    return this.status_ in ee.layers.AbstractTile.DONE_STATUS_SET_;
  }

  /** @package @return {ee.layers.AbstractTile.Status} The tile's status. */
  getStatus() {
    return this.status_;
  }

  /**
   * Sets the tile's status.
   * @param {ee.layers.AbstractTile.Status} status The new status.
   * @package
   */
  setStatus(status) {
    this.status_ = status;
    this.dispatchEvent(ee.layers.AbstractTile.EventType.STATUS_CHANGED);
  }

  /** @override */
  disposeInternal() {
    super.disposeInternal();
    this.cancelLoad();
    this.div.remove();
    this.renderer = null;
  }
};



/** @enum {string} The event types dispatched by AbstractTile. */
ee.layers.AbstractTile.EventType = {
  STATUS_CHANGED: 'status-changed'
};


/**
 * The statuses of an AbstractTile.
 *
 *   - NEW after instantiation until startLoad() is invoked.
 *   - LOADING once the network request for source data is dispatched.
 *   - THROTTLED if the tile is waiting to retry after the concurrent tile
 *     request limit has been exceeded.
 *   - LOADED once the source data has been received and tile's been rendered.
 *   - FAILED if the maximum retry limit is exceeded.
 *   - ABORTED if abort() is invoked before the tile finished loading.
 *   - REMOVED if abort() is invoked after the tile loaded or failed to load.
 *
 * @package @enum {string}
 */
ee.layers.AbstractTile.Status = {
  NEW: 'new',
  LOADING: 'loading',
  THROTTLED: 'throttled',
  LOADED: 'loaded',
  FAILED: 'failed',
  ABORTED: 'aborted',
  REMOVED: 'removed',
};



/** @private @const {!Object<ee.layers.AbstractTile.Status>} */
ee.layers.AbstractTile.DONE_STATUS_SET_ = goog.object.createSet(
    ee.layers.AbstractTile.Status.ABORTED, ee.layers.AbstractTile.Status.FAILED,
    ee.layers.AbstractTile.Status.LOADED,
    ee.layers.AbstractTile.Status.REMOVED);



/** @private {number} The default number of maximum tile load attempts. */
ee.layers.AbstractTile.DEFAULT_MAX_LOAD_RETRIES_ = 5;
