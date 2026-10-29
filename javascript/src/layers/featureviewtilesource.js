goog.module('ee.layers.FeatureViewTileSource');

const AbstractTile = goog.require('ee.layers.AbstractTile');
const AbstractTileSource = goog.require('ee.layers.AbstractTileSource');
const {FeatureViewTilesKey} = goog.requireType('ee.data');

/**
 * A tile source for FeatureView tiles.
 *
 * @ignore
 * @unrestricted
 */
const FeatureViewTileSource = class extends AbstractTileSource {
  /**
   * @param {!FeatureViewTilesKey} tilesKey FeatureView tiles key for
   *     fetching this layer's tiles.
   */
  constructor(tilesKey) {
    super();
    this.tilesKey_ = tilesKey;
  }

  /**
   * Asynchronously loads the tile's source data.
   * @param {!AbstractTile} tile The tile to load.
   * @param {number=} opt_priority The priority of the tile.
   * @override
   */
  loadTile(tile, opt_priority) {
    tile.sourceUrl =
        this.tilesKey_.formatTileUrl(tile.coord.x, tile.coord.y, tile.zoom);
    tile.startLoad();
  }

  /**
   * @return {string} A unique ID for this tile source.
   * @override
   */
  getUniqueId() {
    return this.tilesKey_.token;
  }
};
goog.exportSymbol('ee.layers.FeatureViewTileSource', FeatureViewTileSource);

exports = {FeatureViewTileSource};
