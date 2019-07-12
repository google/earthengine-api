goog.provide('ee.layers.BinaryOverlay');
goog.provide('ee.layers.BinaryTile');

goog.require('ee.layers.AbstractOverlay');
goog.require('ee.layers.AbstractTile');
goog.require('goog.fs.FileReader');
goog.require('goog.structs.Map');


/**
 * A Google Maps API overlay class for binary data tiles.
 * @export
 * @ignore
 */
ee.layers.BinaryOverlay = class extends ee.layers.AbstractOverlay {
  /**
   * @param {!ee.layers.AbstractTileSource} tileSource The source of tiles
   *     for this map layer.
   * @param {Object=} opt_options Initialization options, of the same form as a
   *     google.maps.ImageMapTypeOptions object.
   */
  constructor(tileSource, opt_options) {
    super(tileSource, opt_options);

    /**
     * The set of loaded floating point buffers. The keys are the coordinates
     * of the tiles, and the values are the corresponding Float32Arrays.
     * @private {goog.structs.Map<!google.maps.Point, !Float32Array>}
     */
    this.buffersByCoord_ = new goog.structs.Map();

    /**
     * The floating point buffer tile DIV elements returned by getTile().
     * The keys are the coordinates of the tiles, and the values are the
     * corresponding DIV elements.
     * @private {goog.structs.Map<!google.maps.Point, !Element>}
     */
    this.divsByCoord_ = new goog.structs.Map();
  }

  /** @override */
  createTile(coord, zoom, ownerDocument, uniqueId) {
    var tile = new ee.layers.BinaryTile(coord, zoom, ownerDocument, uniqueId);

    // Store the binary buffer and div in Maps when the tile loads.
    this.handler.listen(
        tile, ee.layers.AbstractTile.EventType.STATUS_CHANGED, function() {
          if (tile.getStatus() == ee.layers.AbstractTile.Status.LOADED) {
            var sourceData = tile.buffer_;
            this.buffersByCoord_.set(coord, new Float32Array(sourceData));
            this.divsByCoord_.set(coord, tile.div);
          }
        });

    return tile;
  }

  /**
   * @return {goog.structs.Map<!google.maps.Point, !Float32Array>} The binary
   *     buffer data for each tile, keyed by coordinate within the map.
   */
  getBuffersByCoord() {
    return this.buffersByCoord_;
  }

  /**
   * @return {goog.structs.Map<!google.maps.Point, !Element>} The DIVs for each
   *     tile, keyed by coordinate within the map.
   */
  getDivsByCoord() {
    return this.divsByCoord_;
  }

  /** @override */
  disposeInternal() {
    super.disposeInternal();
    this.buffersByCoord_ = null;
    this.divsByCoord_ = null;
  }
};


/**
 * A wrapper class for binary data tiles.
 * @ignore
 */
ee.layers.BinaryTile = class extends ee.layers.AbstractTile {
  /**
   * @param {!google.maps.Point} coord The position of the tile.
   * @param {number} zoom The zoom level of the tile.
   * @param {Node} ownerDocument The owner document of the tile.
   * @param {string} uniqueId The tile's unique ID.
   */
  constructor(coord, zoom, ownerDocument, uniqueId) {
    super(coord, zoom, ownerDocument, uniqueId);

    /** @private {!Float32Array} The binary buffer data for this tile. */
    this.buffer_;
  }

  /** @override */
  finishLoad() {
    var reader = new goog.fs.FileReader();
    reader.listen(goog.fs.FileReader.EventType.LOAD_END, function() {
      this.buffer_ = /** @type {!Float32Array} */ (reader.getResult());
      // Note: We cannot use .base() here because this happens inside
      // a callback rather than directly in the overridden method.
      ee.layers.AbstractTile.prototype.finishLoad.call(this);
    }, undefined, this);
    reader.readAsArrayBuffer(this.sourceData);
  }
};
