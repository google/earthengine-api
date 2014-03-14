// Copyright 2011 Google Inc. All Rights Reserved.

/**
 * @fileoverview Class implementing the google.maps.MapType interface
 * for display of a layer of rendered Earth Engine tiles. This class
 * behaves much like an ImageMapType, but adds events for knowing when
 * the tiles have finished loading.
 *
 * @ignore
 */

goog.provide('ee.MapLayerOverlay');

goog.require('ee.MapTileManager');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.iter');
goog.require('goog.net.EventType');
goog.require('goog.structs.Set');
goog.require('goog.style');



/**
 * Construct a MapLayerOverlay.
 * @param {string} url The url for fetching this layer's tiles.
 * @param {string} mapId The map ID for fetching this layer's tiles.
 * @param {string} token The temporary token for fetching tiles.
 * @param {Object} init Initialization options, of the same form as a
 *     google.maps.ImageMapTypeOptions object.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
ee.MapLayerOverlay = function(url, mapId, token, init) {
  goog.base(this);

  // Store mapId and token.
  this.mapId = mapId;
  this.token = token;

  // Set ImageMapTypeOptions properties.
  this.minZoom = init.minZoom || 0;
  this.maxZoom = init.maxZoom || 20;
  if (!window['google'] || !window['google']['maps']) {
    throw Error("Google Maps API hasn't been initialized.");
  }
  this.tileSize = init.tileSize || new google.maps.Size(256, 256);
  this.isPng = init.isPng || true;

  /**
   * Array representing the set of tiles that are currently being
   * loaded. They are added to this array by getTile() and removed
   * with handleImageCompleted_().
   * @type {Array.<string>}
   * @private
   */
  this.tilesLoading_ = [];

  /**
   * Set representing the loaded set of tiles.
   * @private
   */
  this.tiles_ = new goog.structs.Set();

  /**
   * Incrementing counter that helps make tile request ids unique.
   * @private
   * @type {number}
   */
  this.tileCounter_ = 0;

  /**
   * The url from which to fetch tiles.
   * @type {string}
   */
  this.url = url;

  /**
   * The layer's opacity setting.
   * @private
   */
  this.opacity_ = 1.0;

  this.visible_ = true;
};
goog.inherits(ee.MapLayerOverlay, goog.events.EventTarget);


/**
 * Send an event about a change in the number of outstanding tiles.
 * @private
 */
ee.MapLayerOverlay.prototype.dispatchTileEvent_ = function() {
  this.dispatchEvent(
      new ee.TileEvent_(this.tilesLoading_.length));
};


/**
 * Implements getTile() for the google.maps.MapType interface.
 * @param {google.maps.Point} coord Position of tile.
 * @param {number} zoom Zoom level.
 * @param {Node} ownerDocument Parent document.
 * @return {Node} Element to be displayed as a map tile.
 */
ee.MapLayerOverlay.prototype.getTile = function(
    coord, zoom, ownerDocument) {
  var result;
  var maxCoord = 1 << zoom;
  if (zoom < this.minZoom || coord.y < 0 || coord.y >= maxCoord) {
    // Construct and return the tile immediately.
    var img = ownerDocument.createElement('IMG');
    img.style.width = '0px';
    img.style.height = '0px';
    return img;
  }
  // Wrap longitude around.
  var x = coord.x % maxCoord;
  if (x < 0) {
    x += maxCoord;
  }

  var tileId = [this.mapId, zoom, x, coord.y].join('/');
  var src = [this.url, tileId].join('/') + '?token=' + this.token;

  // Append a unique string to the tileid to make sure that
  // repeated requests for the same tile and cancellations thereof
  // (which may occur if the user quickly moves the map around)
  // don't overwrite each other's state.
  var uniqueTileId = tileId + '/' + this.tileCounter_;
  this.tileCounter_ += 1;

  var div = goog.dom.createDom(
      'div', {
        'id': uniqueTileId
      });

  // Use the current time in seconds as the priority for the tile
  // loading queue. Smaller priorities move to the front of the queue,
  // which is what we want - the Maps API loads the tiles in a spiral
  // starting from the center, and we would like to preserve this order.
  // Requests for tiles that are no longer visible won't clog the queue:
  // if the map is moved around a lot, Maps API calls our releaseTile()
  // method, and the obsolete requests will be removed from the queue.
  var priority = new Date().getTime() / 1000;
  this.tilesLoading_.push(uniqueTileId);
  ee.MapTileManager.getInstance().send(
      uniqueTileId, src, priority,
      goog.bind(this.handleImageCompleted_, this, div, uniqueTileId));
  this.dispatchTileEvent_();
  result = div;
  return result;
};


/**
 * Implements releaseTile() for the google.maps.MapType
 * interface.
 * @param {Node} tileNode The tile that has been released.
 */
ee.MapLayerOverlay.prototype.releaseTile = function(tileNode) {
  ee.MapTileManager.getInstance().abort(tileNode.id);
  this.tiles_.remove(tileNode);
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
 * finished, dispatch a 'tileevent' event. Handle bookkeeping to keep
 * the tilesLoading_ array accurate.
 * @param {Node} div Tile div to which images should be appended.
 * @param {string} tileId The id of the tile that was requested.
 * @param {goog.events.Event} e Image loading event.
 * @private
 */
ee.MapLayerOverlay.prototype.handleImageCompleted_ = function(
    div, tileId, e) {
  if (e.type == goog.net.EventType.ERROR) {
    // Forward error events.
    this.dispatchEvent(e);
  } else {
    // Convert tile loading events to our own type.
    goog.array.remove(this.tilesLoading_, tileId);
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
};



/**
 * An event contaning the information about the tile status
 * @param {number} count The number of outstanding tile requests.
 * @constructor
 * @private
 * @extends {goog.events.Event}
 */
ee.TileEvent_ = function(count) {
  goog.events.Event.call(this, 'tileevent');
  this.count = count;
};
goog.inherits(ee.TileEvent_, goog.events.Event);
