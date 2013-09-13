/**
 * @fileoverview Javascript representation for an Earth Engine ImageCollection.
 */

goog.provide('ee.ImageCollection');

goog.require('ee.ApiFunction');
goog.require('ee.Collection');
goog.require('ee.ComputedObject');
goog.require('ee.Image');
goog.require('ee.Types');
goog.require('goog.array');



/**
 * ImageCollections can be constructed from the following arguments:
 *   - A string: assumed to be the name of a collection,
 *   - An array of images, or anything that can be used to construct an image.
 *   - A single image.
 *   - A computed object - reinterpreted as a collection.
 *
 * @param {string|Array.<*>|ee.Image|ee.ComputedObject} args
 *     The constructor arguments.
 * @constructor
 * @extends {ee.Collection}
 */
ee.ImageCollection = function(args) {
  // Constructor safety.
  if (!(this instanceof ee.ImageCollection)) {
    return new ee.ImageCollection(args);
  } else if (args instanceof ee.ImageCollection) {
    return args;
  }

  if (arguments.length != 1) {
    throw Error('The ImageCollection constructor takes exactly 1 argument (' +
                arguments.length + ' given)');
  }

  ee.ImageCollection.initialize();

  // Wrap single images in an array.
  if (args instanceof ee.Image) {
    args = [args];
  }

  if (ee.Types.isString(args)) {
    // An ID.
    goog.base(this, new ee.ApiFunction('ImageCollection.load'), {
      'id': args
    });
  } else if (goog.isArray(args)) {
    // A list of images.
    goog.base(this, new ee.ApiFunction('ImageCollection.fromImages'), {
      'images': goog.array.map(args, function(elem) {
        return new ee.Image(elem);
      })
    });
  } else if (args instanceof ee.ComputedObject) {
    // A custom object to reinterpret as an ImageCollection.
    goog.base(this, args.func, args.args);
  } else {
    throw Error('Unrecognized argument type to convert to an ' +
                'ImageCollection: ' + args);
  }
};
goog.inherits(ee.ImageCollection, ee.Collection);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.ImageCollection.initialized_ = false;


/**
 * Imports API functions to this class.
 * @hidden
 */
ee.ImageCollection.initialize = function() {
  if (!ee.ImageCollection.initialized_) {
    ee.ApiFunction.importApi(
        ee.ImageCollection, 'ImageCollection', 'ImageCollection');
    ee.ApiFunction.importApi(
        ee.ImageCollection, 'reduce', 'ImageCollection');
    ee.Collection.createAutoMapFunctions(ee.ImageCollection, ee.Image);
    ee.ImageCollection.initialized_ = true;
  }
};


/**
 * Removes imported API functions from this class.
 * @hidden
 */
ee.ImageCollection.reset = function() {
  ee.ApiFunction.clearApi(ee.ImageCollection);
  ee.ImageCollection.initialized_ = false;
};


/**
 * An imperative function that returns a mapid via a synchronous AJAX call.
 *
 * This mosaics the collection to a single image and return a mapid suitable
 * for building a Google Maps overlay.
 *
 * @param {Object?=} opt_visParams The visualization parameters.
 * @param {function(Object, string=)=} opt_callback An async callback.
 * @return {ee.data.MapId} A mapid and token.
 */
ee.ImageCollection.prototype.getMap = function(opt_visParams, opt_callback) {
  var mosaic = ee.ApiFunction._call('ImageCollection.mosaic', this);
  if (opt_callback) {
    mosaic.getMap(opt_visParams, opt_callback);
  } else {
    return mosaic.getMap(opt_visParams);
  }
};


/**
 * An imperative function that returns all the known information about this
 * collection via an AJAX call.
 *
 * @param {function(ee.data.ImageCollectionDescription)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {ee.data.ImageCollectionDescription} A collection description
 *     whose fields include:
 *     - features: an array containing metadata about the images in the
 *           collection.
 *     - bands: a dictionary describing the bands of the images in this
 *           collection.
 *     - properties: an optional dictionary containing the collection's
 *           metadata properties.
 */
ee.ImageCollection.prototype.getInfo = function(opt_callback) {
  return /** @type {ee.data.ImageCollectionDescription} */(
      goog.base(this, 'getInfo', opt_callback));
};


/** @inheritDoc */
ee.ImageCollection.prototype.map = function(
    algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination) {
  return /** @type {ee.ImageCollection} */(this.mapInternal(
      ee.Image, algorithm,
      opt_dynamicArgs, opt_constantArgs, opt_destination));
};


/** @inheritDoc */
ee.ImageCollection.prototype.name = function() {
  return 'ImageCollection';
};


goog.exportSymbol('ee.ImageCollection', ee.ImageCollection);
goog.exportProperty(ee.ImageCollection.prototype, 'map',
                    ee.ImageCollection.prototype.map);
goog.exportProperty(ee.ImageCollection.prototype, 'getMap',
                    ee.ImageCollection.prototype.getMap);
