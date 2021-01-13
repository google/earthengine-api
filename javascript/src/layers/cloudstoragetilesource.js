goog.module('ee.layers.CloudStorageTileSource');
goog.module.declareLegacyNamespace();

const AbstractTile = goog.require('ee.layers.AbstractTile');
const AbstractTileSource = goog.require('ee.layers.AbstractTileSource');
const ImageTile = goog.require('ee.layers.ImageTile');
const googString = goog.require('goog.string');
const stringPath = goog.require('goog.string.path');

/**
 * A layer tile source for tiles served by Google Cloud Storage.
 *
 * @ignore
 * @unrestricted
 */
const CloudStorageTileSource = class extends AbstractTileSource {
  /**
   * @param {string} bucket The bucket that contains the tiles.
   * @param {string} path The path within the bucket to the tiles.
   *     A trailing "/" is optional.
   * @param {number} maxZoom The maximum zoom level for which there are tiles.
   * @param {string=} opt_suffix The tile source file suffix, if any.
   */
  constructor(bucket, path, maxZoom, opt_suffix) {
    super();

    this.bucket_ = bucket;
    this.path_ = path;
    this.suffix_ = opt_suffix || '';
    this.maxZoom_ = maxZoom;
  }

  /** @override */
  loadTile(tile, opt_priority) {
    // Ensure tiles beyond the maximum zoom level are rendered properly.
    if (tile.zoom <= this.maxZoom_) {
      tile.sourceUrl = this.getTileUrl_(tile.coord, tile.zoom);
    } else {
      var zoomSteps = tile.zoom - this.maxZoom_;
      var zoomFactor = Math.pow(2, zoomSteps);
      var upperCoord = new google.maps.Point(
          Math.floor(tile.coord.x / zoomFactor),
          Math.floor(tile.coord.y / zoomFactor));
      tile.sourceUrl = this.getTileUrl_(upperCoord, tile.zoom - zoomSteps);
      tile.renderer =
          /** @type {function(!AbstractTile)} */ (goog.partial(
              CloudStorageTileSource.zoomTileRenderer_, this.maxZoom_));
    }

    // If the tile is missing, just show an empty DIV.
    var originalRetryLoad = goog.bind(tile.retryLoad, tile);
    tile.retryLoad = goog.bind(function(opt_errorMessage) {
      if (opt_errorMessage &&
          (opt_errorMessage.includes(
               CloudStorageTileSource.MISSING_TILE_ERROR_) ||
           opt_errorMessage.includes(
               CloudStorageTileSource.ACCESS_DENIED_ERROR_))) {
        tile.setStatus(AbstractTile.Status.LOADED);
      } else {
        originalRetryLoad(opt_errorMessage);
      }
    }, tile);

    tile.startLoad();
  }

  /** @override */
  getUniqueId() {
    return [this.bucket_, this.path_, this.maxZoom_, this.suffix_].join('-');
  }

  /**
   * Generates the Cloud Storage URL for the tile at the given location and
   * zoom.
   * @param {!google.maps.Point} coord The position of the tile.
   * @param {number} zoom The zoom level of the tile.
   * @return {string} The tile URL.
   * @private
   */
  getTileUrl_(coord, zoom) {
    var url = stringPath.join(
        CloudStorageTileSource.BASE_URL, this.bucket_, this.path_, String(zoom),
        String(coord.x), String(coord.y));
    if (this.suffix_) {
      url += this.suffix_;
    }
    return url;
  }

  /**
   * Renders a tile with client-side zooming beyond the maximum zoom level for
   * which full-size tile images are available.
   * @param {number} maxZoom The maximum zoom level at which tiles are
   *     available.
   * @param {!ImageTile} tile The tile to render.
   * @private
   */
  static zoomTileRenderer_(maxZoom, tile) {
    if (!tile.imageEl) {
      throw new Error('Tile must have an image element to be rendered.');
    }
    var zoomSteps = tile.zoom - maxZoom;
    var zoomFactor = Math.pow(2, zoomSteps);
    var sideLength = tile.tileSize.width;  // Tiles must be square.

    var canv = tile.div.ownerDocument.createElement('canvas');
    canv.setAttribute('width', sideLength);
    canv.setAttribute('height', sideLength);

    tile.div.appendChild(canv);

    var context = canv.getContext('2d');
    context['imageSmoothingEnabled'] = false;
    context['mozImageSmoothingEnabled'] = false;
    context['webkitImageSmoothingEnabled'] = false;

    var srcX = sideLength / zoomFactor * (tile.coord.x % zoomFactor);
    var srcY = sideLength / zoomFactor * (tile.coord.y % zoomFactor);
    var srcW = sideLength / zoomFactor;
    var srcH = sideLength / zoomFactor;
    context.drawImage(
        tile.imageEl, srcX, srcY, srcW, srcH, 0, 0, sideLength, sideLength);
  }
};
goog.exportSymbol('ee.layers.CloudStorageTileSource', CloudStorageTileSource);

/** @const {string} The Cloud Storage content base URL. */
CloudStorageTileSource.BASE_URL = 'https://storage.googleapis.com';

/**
 * @const @private {string} The error message when a tile is missing and the
 * cloud bucket is world readable. Corresponds to a 404 error.
 * https://cloud.google.com/iam/docs/overview#allusers
 */
CloudStorageTileSource.MISSING_TILE_ERROR_ =
    'The specified key does not exist.';

/**
 * @const @private {string} The error message when a tile is missing but the
 * cloud bucket is readable only to "authenticated users." This corresponds to a
 * 403 error. https://cloud.google.com/iam/docs/overview#allauthenticatedusers.
 */
CloudStorageTileSource.ACCESS_DENIED_ERROR_ = 'AccessDenied';

exports = CloudStorageTileSource;
