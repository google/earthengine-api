goog.provide('ee.layers.AbstractTileSource');

goog.require('goog.Disposable');



/**
 * An abstract class for a layer tile source.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @package
 * @ignore
 */
ee.layers.AbstractTileSource = function() {
  goog.base(this);
};
goog.inherits(ee.layers.AbstractTileSource, goog.Disposable);


/**
 * Asynchronously loads the tile's source data.
 * @param {ee.layers.AbstractTile} tile The tile to load.
 * @param {number=} opt_priority The priority of the tile. May be ignored.
 * @package
 */
ee.layers.AbstractTileSource.prototype.loadTile = goog.abstractMethod;


/**
 * @return {string} A unique ID for this tile source.
 * @package
 */
ee.layers.AbstractTileSource.prototype.getUniqueId = goog.abstractMethod;
