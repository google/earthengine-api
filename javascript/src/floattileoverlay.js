goog.provide('ee.FloatTileOverlay');

goog.require('ee.AbstractOverlay');
goog.require('goog.dom');
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
 */
ee.FloatTileOverlay = function(url, mapId, token) {
  goog.base(this, url, mapId, token);

  this.tileSize = new google.maps.Size(ee.FloatTileOverlay.TILE_EDGE_LENGTH_,
      ee.FloatTileOverlay.TILE_EDGE_LENGTH_);

  /**
   * The set of loaded floating point buffer tiles. The keys are the coordinates
   * of the tiles, and the values are the corresponding Float32Arrays.
   * @private {goog.structs.Map<!google.maps.Point, Float32Array>}
   */
  this.floatTiles_ = new goog.structs.Map();
};
goog.inherits(ee.FloatTileOverlay, ee.AbstractOverlay);


/** @override */
ee.FloatTileOverlay.prototype.getTile = function(coord, zoom, ownerDocument) {
  var tileId = this.getTileId(coord, zoom);
  var src = [this.url, tileId].join('/') + '?token=' + this.token;
  var floatTile = this.loadFloatTile_(src, coord);

  // The Maps API expects a div for the tile. We don't actually want to render
  // the floating point tiles as a visible layer, so we return an empty div.
  return goog.dom.createDom('div');
};


/**
 * The tile edge length of a float overlay tile.
 * @const @private {number}
 */
ee.FloatTileOverlay.TILE_EDGE_LENGTH_ = 256;


/**
 * Requests a floating point tile from the provided URL.
 * @param {string} tileUrl Tile URL
 * @param {google.maps.Point} coord Coordinates of the floating tile
 * @private
 */
ee.FloatTileOverlay.prototype.loadFloatTile_ = function(tileUrl, coord) {
  var tileRequest = goog.net.XmlHttp();
  tileRequest.open('GET', tileUrl, true);
  tileRequest.responseType = 'arraybuffer';
  tileRequest.onreadystatechange = goog.bind(function() {
    if (tileRequest.readyState === XMLHttpRequest.DONE &&
        tileRequest.status === 200) {
      var tileResponse = /** @type {Float32Array} */ (tileRequest.response);
      if (tileResponse) {
        var floatBuffer = new Float32Array(tileResponse);
        this.floatTiles_.set(coord, floatBuffer);
      } else {
        throw new Error('Unable to request floating point array buffers.');
      }
    }
  }, this);
  tileRequest.send();
};


/**
 * Returns the map of all visible floating tiles and the corresponding
 * coordinates.
 * @return {goog.structs.Map}
 */
ee.FloatTileOverlay.prototype.getAllFloatTiles = function() {
  return this.floatTiles_;
};


/** @override */
ee.FloatTileOverlay.prototype.disposeInternal = function() {
  this.floatTiles_ = null;

  goog.base(this, 'disposeInternal');
};
