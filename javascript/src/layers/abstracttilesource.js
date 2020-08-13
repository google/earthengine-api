goog.provide('ee.layers.AbstractTileSource');

goog.require('ee.layers.AbstractTile');
goog.require('goog.Disposable');



/**
 * An abstract class for a layer tile source.
 * @package
 * @ignore
 * @unrestricted
 */
ee.layers.AbstractTileSource = class extends goog.Disposable {
  constructor() {
    super();
  }
};



/**
 * Asynchronously loads the tile's source data.
 * @param {!ee.layers.AbstractTile} tile The tile to load.
 * @param {number=} opt_priority The priority of the tile. May be ignored.
 * @package
 */
ee.layers.AbstractTileSource.prototype.loadTile = goog.abstractMethod;


/**
 * @return {string} A unique ID for this tile source.
 * @package
 */
ee.layers.AbstractTileSource.prototype.getUniqueId = goog.abstractMethod;
