goog.module('ee.layers.AbstractTileSource');
const AbstractTile = goog.require('ee.layers.AbstractTile');
const Disposable = goog.require('goog.Disposable');

/**
 * An abstract class for a layer tile source.
 * @package
 * @ignore
 * @unrestricted
 */
const AbstractTileSource = class extends Disposable {
  constructor() {
    super();
  }
};

/**
 * Asynchronously loads the tile's source data.
 * @param {!AbstractTile} tile The tile to load.
 * @param {number=} opt_priority The priority of the tile. May be ignored.
 * @package
 */
AbstractTileSource.prototype.loadTile = goog.abstractMethod;

/**
 * @return {string} A unique ID for this tile source.
 * @package
 */
AbstractTileSource.prototype.getUniqueId = goog.abstractMethod;

exports = AbstractTileSource;
