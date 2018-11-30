goog.provide('ee.FloatTileOverlay');

goog.require('ee.AbstractOverlay');
goog.require('ee.TileEvent');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.net.XmlHttp');
goog.require('goog.structs.Map');



/**
 * A google.maps.MapType implementation used to display Earth Engine tiles in
 * Float32Array format.
 *
 * @param {string} url The URL for fetching floating point tiles.
 * @param {string} mapId The map ID for fetching floating point tiles.
 * @param {string} token The temporary token for fetching tiles.
 * @constructor
 * @extends {ee.AbstractOverlay}
 * @export
 * @ignore
 * @deprecated Use ee.layers.BinaryOverlay instead.
 */
ee.FloatTileOverlay = function(url, mapId, token) {
  ee.FloatTileOverlay.base(this, 'constructor', url, mapId, token);

  this.tileSize = new google.maps.Size(
      ee.FloatTileOverlay.TILE_EDGE_LENGTH,

      ee.FloatTileOverlay.TILE_EDGE_LENGTH);

  /**
   * The set of loaded floating point buffer tiles. The keys are the coordinates
   * of the tiles, and the values are the corresponding Float32Arrays.
   * @private {goog.structs.Map<!google.maps.Point, Float32Array>}
   */
  this.floatTiles_ = new goog.structs.Map();

  /**
   * The floating point buffer tile DIV elements returned by getTile().
   * The keys are the coordinates of the tiles, and the values are the
   * corresponding DIV elements.
   * @private {goog.structs.Map<!google.maps.Point, !Element>}
   */
  this.floatTileDivs_ = new goog.structs.Map();
};
goog.inherits(ee.FloatTileOverlay, ee.AbstractOverlay);


/** @override */
ee.FloatTileOverlay.prototype.getTile = function(coord, zoom, ownerDocument) {
  var tileId = this.getTileId(coord, zoom);
  var src = [this.url, tileId].join('/') + '?token=' + this.token;
  var uniqueTileId = [tileId, this.tileCounter, this.token].join('/');
  this.tilesLoading.push(uniqueTileId);
  this.tileCounter += 1;

  var div = goog.dom.createDom(goog.dom.TagName.DIV);

  var floatTile = this.loadFloatTile_(src, coord, uniqueTileId, div);
  this.dispatchTileEvent_();

  // The Maps API expects a div for the tile. We don't actually want to render
  // the floating point tiles as a visible layer, so we return an empty div.
  return div;
};


/**
 * The tile edge length of a float overlay tile.
 * @const {number}
 */
ee.FloatTileOverlay.TILE_EDGE_LENGTH = 256;


/**
 * Requests a floating point tile from the provided URL.
 * @param {string} tileUrl Tile URL
 * @param {google.maps.Point} coord Coordinates of the floating tile
 * @param {string} tileId Unique tile ID
 * @param {!Element} div The corresponding DIV element.
 * @private
 */
ee.FloatTileOverlay.prototype.loadFloatTile_ = function(
    tileUrl, coord, tileId, div) {
  var tileRequest = goog.net.XmlHttp();
  tileRequest.open('GET', tileUrl, true);
  tileRequest.responseType = 'arraybuffer';
  tileRequest.onreadystatechange = goog.bind(function() {
    if (tileRequest.readyState === XMLHttpRequest.DONE &&
        tileRequest.status === 200) {
      var tileResponse = /** @type {Float32Array} */ (tileRequest.response);
      if (tileResponse) {
        var floatBuffer = new Float32Array(tileResponse);
        this.handleFloatTileLoaded_(floatBuffer, coord, tileId, div);
      } else {
        this.tilesFailed.add(tileId);
        throw new Error('Unable to request floating point array buffers.');
      }
    }
  }, this);
  tileRequest.send();
};


/**
 * Handles float tile loaded events by storing the tile data and dispatching
 * a tile event.
 * @param {Float32Array} floatTile Successfully requested float tile
 * @param {google.maps.Point} coord Coordinate of the floating tile
 * @param {string} tileId Unique tile ID
 * @param {!Element} div The corresponding DIV element.
 * @private
 */
ee.FloatTileOverlay.prototype.handleFloatTileLoaded_ = function(
    floatTile, coord, tileId, div) {
  this.floatTiles_.set(coord, floatTile);
  this.floatTileDivs_.set(coord, div);
  goog.array.remove(this.tilesLoading, tileId);
  this.dispatchTileEvent_();
};


/**
 * Returns the map of all visible floating tiles and the corresponding
 * coordinates.
 * @return {goog.structs.Map}
 */
ee.FloatTileOverlay.prototype.getAllFloatTiles = function() {
  return this.floatTiles_;
};


/**
 * Returns the map of all the floating tile divs that are visible and
 * the corresponding coordinates.
 * @return {goog.structs.Map}
 */
ee.FloatTileOverlay.prototype.getAllFloatTileDivs = function() {
  return this.floatTileDivs_;
};


/** @return {number} The number of tiles successfully loaded. */
ee.FloatTileOverlay.prototype.getLoadedFloatTilesCount = function() {
  return this.floatTiles_.getCount();
};


/**
 * Dispatches an event about a change in the number of outstanding tiles.
 * @private
 */
ee.FloatTileOverlay.prototype.dispatchTileEvent_ = function() {
  this.dispatchEvent(new ee.TileEvent(this.tilesLoading.length));
};


/** @override */
ee.FloatTileOverlay.prototype.disposeInternal = function() {
  this.floatTiles_ = null;
  this.floatTileDivs_ = null;

  ee.FloatTileOverlay.base(this, 'disposeInternal');
};
