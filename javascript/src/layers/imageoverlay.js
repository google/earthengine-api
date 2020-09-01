goog.provide('ee.layers.ImageOverlay');
goog.provide('ee.layers.ImageTile');

goog.require('ee.layers.AbstractOverlay');
goog.require('ee.layers.AbstractTile');
goog.require('goog.dispose');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.html.SafeUrl');
goog.require('goog.net.EventType');
goog.require('goog.net.ImageLoader');




/**
 * A Google Maps API overlay class for image tiles.
 * @implements {google.maps.MapType}
 * @export
 * @ignore
 */
ee.layers.ImageOverlay = class extends ee.layers.AbstractOverlay {
  /**
   * @param {!ee.layers.AbstractTileSource} tileSource The source of tiles
   *     for this map layer.
   * @param {Object=} opt_options Initialization options, of the same form as a
   *     google.maps.ImageMapTypeOptions object.
   */
  constructor(tileSource, opt_options) {
    super(tileSource, opt_options);
  }

  /** @override */
  createTile(coord, zoom, ownerDocument, uniqueId) {
    return new ee.layers.ImageTile(coord, zoom, ownerDocument, uniqueId);
  }
};


/**
 * A wrapper class for image map tiles.
 * @ignore
 */
ee.layers.ImageTile = class extends ee.layers.AbstractTile {
  /**
   * @param {!google.maps.Point} coord The position of the tile.
   * @param {number} zoom The zoom level of the tile.
   * @param {Node} ownerDocument The owner document of the tile.
   * @param {string} uniqueId The tile's unique ID.
   */
  constructor(coord, zoom, ownerDocument, uniqueId) {
    super(coord, zoom, ownerDocument, uniqueId);

    /**
     * The default image tile renderer.
     * @type {function(!ee.layers.AbstractTile):undefined}
     */
    this.renderer = ee.layers.ImageTile.defaultRenderer_;

    /** @type {?HTMLImageElement} The image element.*/
    this.imageEl = null;

    /**
     * The ImageLoader instance handling the load request.
     * @private {?goog.net.ImageLoader}
     */
    this.imageLoader_ = null;

    /** @private {?goog.events.Key} The image loader listener key. */
    this.imageLoaderListenerKey_ = null;

    /**
     * The URL, representing a Blob object, used as the image source with the
     * ImageLoader.
     * @private {string}
     */
    this.objectUrl_ = '';
  }

  /** @override */
  finishLoad() {
    var imageUrl;
    try {
      const safeUrl = goog.html.SafeUrl.fromBlob(this.sourceData);
      this.objectUrl_ = goog.html.SafeUrl.unwrap(safeUrl);
      const ok = (this.objectUrl_ !== goog.html.SafeUrl.INNOCUOUS_STRING);
      imageUrl = ok ? this.objectUrl_ : this.sourceUrl;
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
        ee.layers.ImageTile.IMAGE_LOADER_EVENTS_, function(event) {
          if (event.type == goog.events.EventType.LOAD) {
            this.imageEl = event.target;
            // Note: We cannot use .base() here because this happens inside
            // a callback rather than directly in the overridden method.
            ee.layers.AbstractTile.prototype.finishLoad.call(this);
          } else {
            this.retryLoad();
          }
        }, undefined, this);
    this.imageLoader_.start();
  }

  /** @override */
  cancelLoad() {
    super.cancelLoad();
    if (this.imageLoader_) {
      goog.events.unlistenByKey(this.imageLoaderListenerKey_);
      goog.dispose(this.imageLoader_);
    }
  }

  /** @override */
  disposeInternal() {
    super.disposeInternal();
    if (this.objectUrl_) {
      // See notes section of
      // https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
      URL.revokeObjectURL(this.objectUrl_);
    }
  }

  /**
   * The default image tile renderer.
   * @param {!ee.layers.AbstractTile} tile
   */
  static defaultRenderer_(tile) {
    tile.div.appendChild(tile.imageEl);
  }
};


/** @private @const {!Array<string>} The image loader events. */
ee.layers.ImageTile.IMAGE_LOADER_EVENTS_ = [
  goog.events.EventType.LOAD,
  goog.net.EventType.ABORT,
  goog.net.EventType.ERROR
];
