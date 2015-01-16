/**
 * @fileoverview A class to generate the ee.Terrain namespace.
 *
 */

goog.provide('ee.Terrain');

goog.require('ee.ApiFunction');


/**
 * @export
 */
ee.Terrain = {};


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.Terrain.initialized_ = false;


/** Imports API functions to this class. */
ee.Terrain.initialize = function() {
  if (!ee.Terrain.initialized_) {
    ee.ApiFunction.importApi(ee.Terrain, 'Terrain', 'Terrain');
    ee.Terrain.initialized_ = true;
  }
};


/** Removes imported API functions from this class. */
ee.Terrain.reset = function() {
  ee.ApiFunction.clearApi(ee.Terrain);
  ee.Terrain.initialized_ = false;
};
