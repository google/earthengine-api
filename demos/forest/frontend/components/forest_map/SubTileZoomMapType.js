/**
 * @fileoverview
 * @suppress {missingProperties} See: b/33430503
 */
goog.provide('forest.SubTileZoomMapType');



/**
 * A custom Google Maps API map type that allows sub-tile zooming at zoom
 * levels greater than the maximum zoom level for which full-res tiles
 * are available. Tiles must be square. Also, if the user zooms out such
 * that multiple instances of the world are visible, longitudes will be
 * normalized (i.e. wrapped).
 *
 * @param {forest.SubTileZoomMapType.Options} options
 *     The initialization options for the map type.
 * @constructor
 * @implements {google.maps.MapType}
 */
forest.SubTileZoomMapType = function(options) {

  // Private options.

  /**
   * The function used to generate tile URLS.
   * @private @const {(function(google.maps.Point,number):string)}
   */
  this.getTileUrl_ = options.getTileUrl;

  /**
   * The maximum zoom level for which full-res tiles are available.
   * @private @const {number}
   */
  this.maxTileZoom_ =
      options.maxTileZoom || forest.SubTileZoomMapType.DEFAULT_MAX_ZOOM_;

  /** @private {number} The map type's opacity. */
  this.opacity_ = goog.isDef(options.opacity) ?  options.opacity : 1;

  // Public options required by the Maps API.

  /**
   * The size of tiles returned by tile URLs.
   * @const {google.maps.Size}
   */
  this.tileSize = options.tileSize;

  /**
   * The maximum zoom level permitted at all.
   * @const {number}
   */
  this.maxZoom =
      options.maxZoom || forest.SubTileZoomMapType.DEFAULT_MAX_ZOOM_;


  // Public options optional for the Maps API.

  /**
   * @const {number|undefined} The minimum permitted zoom level.
   * @suppress {checkTypes} overridden interface property is non-undefined.
   */
  this.minZoom = options.minZoom;

  /**
   * @const {string|undefined} The name of the map type instance.
   * @suppress {checkTypes} overridden interface property is non-undefined.
   */
  this.name = options.name;


  // Public options required by the compiler but which we don't support.

  this.projection = null;
  this.radius = 0;
  this.alt = null;


  // Private implementation details.

  /**
   * The tiles we've provided to the Maps API but not yet released.
   * @private {!Object<string, Element>}
   */
  this.tileDivsByKey_ = {};
};


////////////////////
// Public interface.
////////////////////


/**
 * The options to initialize a sub-tile zoom map type.
 * maxTileZoom is the highest zoom level that has full-resolution tiles.
 * Beyond it, sub-tile pixelated zooming will be used.
 * @typedef {{
 *   getTileUrl: (function(google.maps.Point,number):string),
 *   tileSize: google.maps.Size,
 *   opacity: (number|undefined),
 *   maxTileZoom: (number|undefined),
 *   maxZoom: (number|undefined),
 *   minZoom: (number|undefined),
 *   name: (string|undefined)
 * }}
 */
forest.SubTileZoomMapType.Options;


/**
 * Sets the opacity of the map type.
 * @param {number} opacity The opacity, between 0 (fully transparent) and 1.
 * @export
 */
forest.SubTileZoomMapType.prototype.setOpacity = function(opacity) {
  this.opacity_ = opacity;
  for (var tileDiv in this.tileDivsByKey_) {
    tileDiv.style.opacity = opacity;
  }
};


//////////////////////////////
// Interface used by Maps API.
//////////////////////////////


/** @override */
forest.SubTileZoomMapType.prototype.getTile = function(
    coord, zoom, ownerDocument) {
  // Wrap longitude around.
  var maxCoord = 1 << zoom;
  var x = coord.x % maxCoord;
  if (x < 0) {
    x += maxCoord;
  }

  var tileDiv;
  var wrappedCoord = new google.maps.Point(x, coord.y);
  if (zoom <= this.maxTileZoom_) {
    var img = document.createElement('img');
    img.setAttribute('src', this.getTileUrl_(wrappedCoord, zoom));
    tileDiv = document.createElement('div');
    tileDiv.appendChild(img);
  } else {
    tileDiv = this.getSubTileZoomDiv_(wrappedCoord, zoom);
  }

  tileDiv.style.opacity = this.opacity_;

  // Store the tile so we can update its opacity later if needed.
  tileDiv.tileKey = [wrappedCoord.x, wrappedCoord.y, zoom].join('-');
  this.tileDivsByKey_[tileDiv.tileKey] = tileDiv;

  return tileDiv;
};


/** @override */
forest.SubTileZoomMapType.prototype.releaseTile = function(tileDiv) {
  delete this.tileDivsByKey_[tileDiv.tileKey];
};


//////////////////
// Implementation.
//////////////////


/**
 * Generates a pixel-zoomed canvas tile.
 * @param {google.maps.Point} coord The tile coordinates.
 * @param {number} zoom The zoom level.
 * @return {Element} The div for the tile.
 * @private
 */
forest.SubTileZoomMapType.prototype.getSubTileZoomDiv_ = function(coord, zoom) {
  var zoomSteps = zoom - this.maxTileZoom_;
  var zoomFactor = Math.pow(2, zoomSteps);

  var upperCoord = new google.maps.Point(
      Math.floor(coord.x / zoomFactor),
      Math.floor(coord.y / zoomFactor));

  var upperTileSrcUrl = this.getTileUrl_(upperCoord, zoom - zoomSteps);

  var tileSideLength = this.tileSize.width;  // Tiles must be square.

  var canv = document.createElement('canvas');
  canv.setAttribute('width', tileSideLength);
  canv.setAttribute('height', tileSideLength);

  var tileDiv = document.createElement('div');
  tileDiv.appendChild(canv);

  var context = canv.getContext('2d');
  var img = document.createElement('img');
  img.setAttribute('src', upperTileSrcUrl);
  context['imageSmoothingEnabled'] = false;
  context['mozImageSmoothingEnabled'] = false;
  context['webkitImageSmoothingEnabled'] = false;

  img.onload = function() {
    var srcX = tileSideLength / zoomFactor * (coord.x % zoomFactor);
    var srcY = tileSideLength / zoomFactor * (coord.y % zoomFactor);
    var srcW = tileSideLength / zoomFactor;
    var srcH = tileSideLength / zoomFactor;
    context.drawImage(
        img, srcX, srcY, srcW, srcH, 0, 0, tileSideLength, tileSideLength);
  };

  return tileDiv;
};


/** @private @const {number} The default max zoom level. */
forest.SubTileZoomMapType.DEFAULT_MAX_ZOOM_ = 24;
