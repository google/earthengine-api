//Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview Javascript representation for an Earth Engine ImageCollection.
 *
 */
goog.provide('ee.ImageCollection');

goog.require('ee');
goog.require('ee.Collection');
goog.require('ee.Image');
goog.require('ee.Serializer');
goog.require('goog.array');

/**
 * ImageCollections can be constructed from the following arguments:
 *   1) A string: assumed to be the name of a collection,
 *   2) An array of images, or anything that can be used to construct an image.
 *   3) A single image.
 *   4) An Object: assumed to be a collections's JSON description.
 *
 * @constructor
 * @extends {ee.Collection}
 * @param {string|Array.<*>|Object} args The constructor arguments.
 */
ee.ImageCollection = function(args) {
  // Constructor safety.
  if (!(this instanceof ee.ImageCollection)) {
    return new ee.ImageCollection(args);
  }
  ee.initialize();

  if (args instanceof ee.Image) {
    args = [args];
  }

  if (goog.isString(args)) {
    args = {'type': 'ImageCollection', 'id': args};
  } else if (goog.isArray(args)) {
    // A manually created collection.
    args = {
      'type': 'ImageCollection',
      'images': goog.array.map((/** @type {Array.<*>} */ args), function(elem) {
        return new ee.Image(/** @type {?} */ (elem));
      })
    };
  } else if (args instanceof ee.ImageCollection) {
    return args;
  }

  /**
   * The internal representation of this collection.
   * @type {Object}
   * @private
   */
  this.description_ = /** @type {Object} */ (args);
};
goog.inherits(ee.ImageCollection, ee.Collection);

/**
 * An imperative function that returns a mapid via a synchronous AJAX call.
 *
 * This mosaics the collection to a single image and return a mapid suitable
 * for building a Google Maps overlay.
 *
 * @param {Object?=} opt_visParams The visualization parameters.
 * @param {function(Object, string=)=} opt_callback An async callback.
 *
 * @return {ee.data.mapid} A mapid and token.
 */
ee.ImageCollection.prototype.getMap = function(opt_visParams, opt_callback) {
  var mosaic = this.mosaic();

  if (opt_callback) {
    mosaic.getMap(opt_visParams, opt_callback);
  } else {
    return mosaic.getMap(opt_visParams);
  }
};

/**
 * Wrap this collection in a SimpleMosaic function.
 * @return {ee.Image} The mosaiced image.
 */
ee.ImageCollection.prototype.mosaic = function() {
  return new ee.Image({'creator': 'SimpleMosaic', 'args': [this]});
};

/**
 * Combine two ImageCollections by ID, merging bands.  The new collection
 * contains one image for each image in this collection merged with the
 * bands from any matching images in the other collection.
 *
 * @param {ee.ImageCollection} other The second collection.
 * @return {ee.ImageCollection} The new collection.
 */
ee.ImageCollection.prototype.combine = function(other) {
  return new ee.ImageCollection({
    'algorithm': 'CombineCollectionBands',
    'primary': this,
    'secondary': other
  });
};

/**
 * @return {string} The collection as a human-readable string.
 */
ee.ImageCollection.prototype.toString = function() {
  var json = ee.Serializer.toReadableJSON(this.description_);
  return 'ee.ImageCollection(' + json + ')';
};

/**
 * Maps an algorithm over a collection.
 *
 * @param {string|function(ee.Image):ee.Image} algorithm The operation to map
 *     over the images of the collection. Either an algorithm name as a string,
 *     or a JavaScript function that receives an image and returns an image. In
 *     the latter case, the function is called only once and the result is
 *     captured as a description, so it cannot perform imperative operations
 *     or rely on external state.
 * @param {Object.<string,*>?=} opt_dynamicArgs A map specifying which
 *     properties of the input objects to pass to each argument of the
 *     algorithm. This maps from argument names to selector strings. Selector
 *     strings are property names, optionally concatenated into chains separated
 *     by a period to access properties-of-properties. To pass the whole object,
 *     use the special selector string '.all', and to pass the geometry, use
 *     '.geo'. If this argument is not specified, the names of the arguments
 *     will be matched exactly to the properties of the input object. If
 *     algorithm is a JavaScript function, this must be null or undefined as
 *     the image will always be the only dynamic argument.
 * @param {Object.<string,*>?=} opt_constantArgs A map from argument names to
 *     constant values to be passed to the algorithm on every invocation.
 * @param {string=} opt_destination The property where the result of the
 *     algorithm will be put. If this is null or undefined, the result of the
 *     algorithm will replace the input, as is the usual behavior of a mapping
 *     opeartion.
 * @return {ee.ImageCollection} The mapped collection.
 */
ee.ImageCollection.prototype.map = function(
    algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination) {
  var args;
  if (goog.isFunction(algorithm)) {
    if (opt_dynamicArgs) {
      throw Error('Can\'t use dynamicArgs with a mapped JS function.');
    }
    var mapper = ee.lambda(
        ['IC_GEN_VAR'], algorithm(
            /** @type {ee.Image} */ (ee.variable(ee.Image, 'FC_GEN_VAR'))));
    args = [mapper, {'IC_GEN_VAR': '.all'}, opt_constantArgs, opt_destination];
  } else {
    args = arguments;
  }
  return new ee.ImageCollection(
      ee.Collection.prototype['map'].apply(this, args).description_);
};

// Explicit exports
goog.exportSymbol('ee.ImageCollection', ee.ImageCollection);
goog.exportProperty(ee.ImageCollection.prototype, 'getMap',
                    ee.ImageCollection.prototype.getMap);
goog.exportProperty(ee.ImageCollection.prototype, 'mosaic',
                    ee.ImageCollection.prototype.mosaic);
goog.exportProperty(ee.ImageCollection.prototype, 'combine',
                    ee.ImageCollection.prototype.combine);
goog.exportProperty(ee.ImageCollection.prototype, 'filter',
                    ee.ImageCollection.prototype.filter);
goog.exportProperty(ee.ImageCollection.prototype, 'filterDate',
                    ee.ImageCollection.prototype.filterDate);
goog.exportProperty(ee.ImageCollection.prototype, 'filterMetadata',
                    ee.ImageCollection.prototype.filterMetadata);
goog.exportProperty(ee.ImageCollection.prototype, 'filterBounds',
                    ee.ImageCollection.prototype.filterBounds);
goog.exportProperty(ee.ImageCollection.prototype, 'getInfo',
                    ee.ImageCollection.prototype.getInfo);
goog.exportProperty(ee.ImageCollection.prototype, 'limit',
                    ee.ImageCollection.prototype.limit);
goog.exportProperty(ee.ImageCollection.prototype, 'serialize',
                    ee.ImageCollection.prototype.serialize);
goog.exportProperty(ee.ImageCollection.prototype, 'sort',
                    ee.ImageCollection.prototype.sort);
goog.exportProperty(ee.ImageCollection.prototype, 'toString',
                    ee.ImageCollection.prototype.toString);
