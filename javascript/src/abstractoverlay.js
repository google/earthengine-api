goog.provide('ee.AbstractOverlay');
goog.provide('ee.TileEvent');

goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.structs.Set');

goog.requireType('ee.data.Profiler');



/**
 * An abstract class that is used to display Earth Engine tiles.
 * @param {string} url The url for fetching this layer's tiles.
 * @param {string} mapId The map ID for fetching this layer's tiles.
 * @param {string} token The temporary token for fetching tiles.
 * @param {Object=} opt_init Initialization options, of the same form as a
 *     google.maps.ImageMapTypeOptions object.
 * @param {ee.data.Profiler=} opt_profiler Map tile calculation cost will be
 *     sent to this profiler, if its enabled flag is set.
 * @constructor
 * @extends {goog.events.EventTarget}
 * @export
 * @ignore
 */
ee.AbstractOverlay = function(url, mapId, token, opt_init, opt_profiler) {
  ee.AbstractOverlay.base(this, 'constructor');

  // Store mapId and token.
  this.mapId = mapId;
  this.token = token;

  /** @protected {!Array<string>} The list of tiles currently being loaded. */
  this.tilesLoading = [];

  /** @protected {goog.structs.Set} The set of failed tile IDs. */
  this.tilesFailed = new goog.structs.Set();

  /** @protected {number} The count of tiles that have been loaded. */
  this.tileCounter = 0;

  /** @protected {string} The URL from which to fetch tiles. */
  this.url = url;
};
goog.inherits(ee.AbstractOverlay, goog.events.EventTarget);


/** @enum {string} The event types dispatched by AbstractOverlay. */
ee.AbstractOverlay.EventType = {
  TILE_LOADED: 'tileevent'
};


/**
 * Implements getTile() for the google.maps.MapType interface.
 * @param {!google.maps.Point} coord Position of tile.
 * @param {number} zoom Zoom level.
 * @param {Node} ownerDocument Parent document.
 * @return {Node} Element or binary data to be displayed as a map
 *     tile.
 */
ee.AbstractOverlay.prototype.getTile = goog.abstractMethod;


/**
 * Constructs a tile ID.
 * @param {!google.maps.Point} coord The position of tile.
 * @param {number} zoom The zoom level.
 * @return {string} The ID of the tile.
 */
ee.AbstractOverlay.prototype.getTileId = function(coord, zoom) {
  var maxCoord = 1 << zoom;

  // Wrap longitude around.
  var x = coord.x % maxCoord;
  if (x < 0) {
    x += maxCoord;
  }
  return [this.mapId, zoom, x, coord.y].join('/');
};


/** @return {number} The number of tiles currently loading. */
ee.AbstractOverlay.prototype.getLoadingTilesCount = function() {
  return this.tilesLoading.length;
};


/** @return {number} The number of tiles which have failed. */
ee.AbstractOverlay.prototype.getFailedTilesCount = function() {
  return this.tilesFailed.getCount();
};



/**
 * An event dispatched when a tile is loaded.
 * @param {number} count The number of outstanding tile requests.
 * @constructor
 * @extends {goog.events.Event}
 */
ee.TileEvent = function(count) {
  goog.events.Event.call(this, ee.AbstractOverlay.EventType.TILE_LOADED);
  this.count = count;
};
goog.inherits(ee.TileEvent, goog.events.Event);
