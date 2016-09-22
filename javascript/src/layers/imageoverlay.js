goog.provide('ee.layers.ImageOverlay');
goog.provide('ee.layers.ImageTile');

goog.require('ee.layers.AbstractOverlay');
goog.require('ee.layers.AbstractTile');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.net.EventType');
goog.require('goog.net.ImageLoader');

goog.forwardDeclare('ee.data.Profiler');



/**
 * A Google Maps API overlay class for image tiles.
 *
 * @param {!ee.layers.AbstractTileSource} tileSource The source of tiles
 *     for this map layer.
 * @param {Object=} opt_options Initialization options, of the same form as a
 *     google.maps.ImageMapTypeOptions object.
 * @constructor
 * @extends {ee.layers.AbstractOverlay}
 * @implements {google.maps.MapType}
 * @export
 * @ignore
 */
ee.layers.ImageOverlay = function(tileSource, opt_options) {
  goog.base(this, tileSource, opt_options);
};
goog.inherits(ee.layers.ImageOverlay, ee.layers.AbstractOverlay);


/** @override */
ee.layers.ImageOverlay.prototype.createTile = function(
    coord, zoom, ownerDocument, uniqueId) {
  return new ee.layers.ImageTile(coord, zoom, ownerDocument, uniqueId);
};



/**
 * A wrapper class for image map tiles.
 *
 * @param {!google.maps.Point} coord The position of the tile.
 * @param {number} zoom The zoom level of the tile.
 * @param {Node} ownerDocument The owner document of the tile.
 * @param {string} uniqueId The tile's unique ID.
 * @constructor
 * @extends {ee.layers.AbstractTile}
 * @ignore
 */
ee.layers.ImageTile = function(coord, zoom, ownerDocument, uniqueId) {
  goog.base(this, coord, zoom, ownerDocument, uniqueId);
  this.imageLoader_ = null;
  this.imageLoaderListenerKey_ = null;
};
goog.inherits(ee.layers.ImageTile, ee.layers.AbstractTile);


/** @override */
ee.layers.ImageTile.prototype.finishLoad = function() {
  var imageUrl;
  try {
    imageUrl = URL.createObjectURL(this.sourceData);
  } catch (e) {
    // Browser did not support blob response, or browser did not support
    // createObjectURL, or we made a mistake. We will fall back to
    // re-requesting the tile as an image by using the original source URL.
    imageUrl = this.sourceUrl;
  }

  // Request the image.
  this.imageLoader_ = new goog.net.ImageLoader();
  this.imageLoader_.addImage(this.div.id + '-image', imageUrl);
  this.imageLoaderListenerKey_ = goog.events.listenOnce(
      this.imageLoader_,
      ee.layers.ImageTile.IMAGE_LOADER_EVENTS_,
      function(event) {
        if (event.type == goog.events.EventType.LOAD) {
          this.div.appendChild(event.target);
          // Note: We cannot use goog.base() here because this happens inside
          // a callback rather than directly in the overridden method.
          ee.layers.AbstractTile.prototype.finishLoad.call(this);
        } else {
          this.retryLoad();
        }
      },
      undefined,
      this);
  this.imageLoader_.start();
};


/** @override */
ee.layers.ImageTile.prototype.cancelLoad = function() {
  goog.base(this, 'cancelLoad');
  if (this.imageLoader_) {
    goog.events.unlistenByKey(this.imageLoaderListenerKey_);
    goog.dispose(this.imageLoader_);
  }
};


/** @private @const {!Array<string>} The image loader events. */
ee.layers.ImageTile.IMAGE_LOADER_EVENTS_ = [
  goog.events.EventType.LOAD,
  goog.net.EventType.ABORT,
  goog.net.EventType.ERROR
];
