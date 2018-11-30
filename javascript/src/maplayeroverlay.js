goog.provide('ee.MapLayerOverlay');

goog.require('ee.AbstractOverlay');
goog.require('ee.MapTileManager');
goog.require('ee.TileEvent');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.iter');
goog.require('goog.net.EventType');
goog.require('goog.structs.Set');
goog.require('goog.style');

goog.forwardDeclare('ee.data.Profiler');



/**
 * A google.maps.MapType implementation used to display Earth Engine tiles.
 * This class behaves much like an ImageMapType, but emits events when tiles
 * are loaded.
 * @param {string} url The url for fetching this layer's tiles.
 * @param {string} mapId The map ID for fetching this layer's tiles.
 * @param {string} token The temporary token for fetching tiles.
 * @param {Object} init Initialization options, of the same form as a
 *     google.maps.ImageMapTypeOptions object.
 * @param {ee.data.Profiler=} opt_profiler Map tile calculation cost will be
 *     sent to this profiler, if its enabled flag is set.
 * @constructor
 * @extends {ee.AbstractOverlay}
 * @export
 * @ignore
 * @deprecated Use ee.layers.ImageOverlay instead.
 */
ee.MapLayerOverlay = function(url, mapId, token, init, opt_profiler) {
  ee.MapLayerOverlay.base(this, 'constructor', url, mapId, token, init, opt_profiler);

  // Set ImageMapTypeOptions properties.
  this.minZoom = init.minZoom || 0;
  this.maxZoom = init.maxZoom || 20;
  if (!window['google'] || !window['google']['maps']) {
    throw Error('Google Maps API hasn\'t been initialized.');
  }
  this.tileSize = init.tileSize || new google.maps.Size(256, 256);
  this.isPng = goog.isDef(init.isPng) ? init.isPng : true;
  this.name = init.name;

  /** @private {goog.structs.Set} The set of loaded tiles. */
  this.tiles_ = new goog.structs.Set();

  /** @private {number} The layer's opacity. */
  this.opacity_ = 1.0;

  /** @private {boolean} Whether the layer is currently visible. */
  this.visible_ = true;

  /**
   * Map tile calculation cost will be sent to this profiler, if its enabled
   * flag is set.
   * @private {?ee.data.Profiler}
   */
  this.profiler_ = opt_profiler || null;
};
goog.inherits(ee.MapLayerOverlay, ee.AbstractOverlay);


/**
 * Adds a callback to be fired each time a tile is loaded.
 * @param {function(ee.TileEvent)} callback The function to call when a
 *     tile has loaded.
 * @return {!Object} An ID which can be passed to removeTileCallback() to
 *     remove the callback.
 * @export
 */
ee.MapLayerOverlay.prototype.addTileCallback = function(callback) {
  return /** @type {!Object} */ (goog.events.listen(
      this, ee.AbstractOverlay.EventType.TILE_LOADED, callback));
};


/**
 * Removes the callback with the given ID.
 * @param {!Object} callbackId The ID returned by addTileLoaded()
 *     when the callback was registered.
 * @export
 */
ee.MapLayerOverlay.prototype.removeTileCallback = function(callbackId) {
  goog.events.unlistenByKey(/** @type {goog.events.Key} */ (callbackId));
};


/**
 * Send an event about a change in the number of outstanding tiles.
 * @private
 */
ee.MapLayerOverlay.prototype.dispatchTileEvent_ = function() {
  this.dispatchEvent(new ee.TileEvent(this.tilesLoading.length));
};


/**
 * Implements getTile() for the google.maps.MapType interface.
 * @param {!google.maps.Point} coord Position of tile.
 * @param {number} zoom Zoom level.
 * @param {Node} ownerDocument Parent document.
 * @return {Node} Element to be displayed as a map tile.
 */
ee.MapLayerOverlay.prototype.getTile = function(
    coord, zoom, ownerDocument) {
  var maxCoord = 1 << zoom;
  if (zoom < this.minZoom || coord.y < 0 || coord.y >= maxCoord) {
    // Construct and return the tile immediately.
    var img = ownerDocument.createElement('IMG');
    img.style.width = '0px';
    img.style.height = '0px';
    return img;
  }

  var profiling = this.profiler_ && this.profiler_.isEnabled();
  var tileId = this.getTileId(coord, zoom);
  var src = [this.url, tileId].join('/') + '?token=' + this.token;
  if (profiling) {
    src += '&profiling=1';
  }

  // Append 1) a unique counter string to the tileid to make sure that
  // repeated requests for the same tile and cancellations thereof
  // (which may occur if the user quickly moves the map around)
  // don't overwrite each other's state, and 2) the unique token for this
  // layer to differentiate its tile requests from other tile requests
  // for other layers with the same map ID.
  var uniqueTileId = [tileId, this.tileCounter, this.token].join('/');
  this.tileCounter += 1;

  // Holds the <img> element created asynchronously.
  var div = goog.dom.createDom(goog.dom.TagName.DIV, {'id': uniqueTileId});

  // Use the current time in seconds as the priority for the tile
  // loading queue. Smaller priorities move to the front of the queue,
  // which is what we want - the Maps API loads the tiles in a spiral
  // starting from the center, and we would like to preserve this order.
  // Requests for tiles that are no longer visible won't clog the queue:
  // if the map is moved around a lot, Maps API calls our releaseTile()
  // method, and the obsolete requests will be removed from the queue.
  var priority = new Date().getTime() / 1000;
  this.tilesLoading.push(uniqueTileId);

  ee.MapTileManager.getInstance().send(
      uniqueTileId, src, priority,
      goog.bind(this.handleImageCompleted_, this, div, uniqueTileId));
  this.dispatchTileEvent_();
  return div;
};


/** @return {number} The number of tiles successfully loaded. */
ee.MapLayerOverlay.prototype.getLoadedTilesCount = function() {
  return this.tiles_.getCount();
};


/** @return {number} The number of tiles currently loading. */
ee.MapLayerOverlay.prototype.getLoadingTilesCount = function() {
  return this.tilesLoading.length;
};


/**
 * Implements releaseTile() for the google.maps.MapType
 * interface.
 * @param {Node} tileDiv The tile that has been released.
 */
ee.MapLayerOverlay.prototype.releaseTile = function(tileDiv) {
  ee.MapTileManager.getInstance().abort(tileDiv.id);
  var tileImg = goog.dom.getFirstElementChild(tileDiv);
  this.tiles_.remove(tileImg);
  if (tileDiv.id !== '') {  // Out-of-bounds tiles have no ID.
    this.tilesFailed.remove(tileDiv.id);
    if (this.profiler_) {
      this.profiler_.removeTile(tileDiv.id);
    }
  }
};


/**
 * Implements setOpacity() for the google.maps.MapType interface.
 * @param {number} opacity The opacity to set this layer to.
 */
ee.MapLayerOverlay.prototype.setOpacity = function(opacity) {
  this.opacity_ = opacity;
  var iter = this.tiles_.__iterator__();
  goog.iter.forEach(iter, function(tile) {
    goog.style.setOpacity(tile, opacity);
  });
};

// Export getTile and removeTile so they are not eliminated by dead
// code removal during compilation
goog.exportProperty(
    ee.MapLayerOverlay.prototype,
    'getTile',
    ee.MapLayerOverlay.prototype.getTile);
goog.exportProperty(
    ee.MapLayerOverlay.prototype,
    'setOpacity',
    ee.MapLayerOverlay.prototype.setOpacity);
goog.exportProperty(
    ee.MapLayerOverlay.prototype,
    'releaseTile',
    ee.MapLayerOverlay.prototype.releaseTile);


/**
 * Handle image 'load' and 'error' events. When the last one has
 * finished, dispatch an ee.AbstractOverlay.EventType.TILE_LOADED event.
 * Handle bookkeeping to keep the tilesLoading array accurate.
 * @param {Node} div Tile div to which images should be appended.
 * @param {string} tileId The id of the tile that was requested.
 * @param {!goog.events.Event} e Image loading event.
 * @param {?string} profileId If profiling, profile ID for the tile.
 * @private
 */
ee.MapLayerOverlay.prototype.handleImageCompleted_ = function(
    div, tileId, e, profileId) {
  if (e.type == goog.net.EventType.ERROR) {
    // Forward error events.
    goog.array.remove(this.tilesLoading, tileId);
    this.tilesFailed.add(tileId);
    this.dispatchEvent(e);
  } else {
    // Convert tile loading events to our own type.
    goog.array.remove(this.tilesLoading, tileId);
    var tile;
    if (e.target && (e.type == goog.events.EventType.LOAD)) {
      tile = /** @type {Node} */ (e.target);
      this.tiles_.add(tile);
      if (this.opacity_ != 1.0) {
        goog.style.setOpacity(/** @type {Element} */ (tile), this.opacity_);
      }
      div.appendChild(tile);
    }
    this.dispatchTileEvent_();
  }

  if (this.profiler_ && !goog.isNull(profileId)) {
    this.profiler_.addTile(tileId, profileId);
  }
};
