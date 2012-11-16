// Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview Representation of an Earth Engine FeatureCollection.
 */

goog.provide('ee.FeatureCollection');

goog.require('ee');
goog.require('ee.Collection');
goog.require('ee.Feature');
goog.require('ee.Image');
goog.require('ee.Serializer');
goog.require('goog.array');

/**
 * FeatureCollections can be constructed from the following arguments:
 *   1) A string - assumed to be the name of a collection.
 *   2) A number - assumed to be the id of a Fusion Table.
 *   3) A feature.
 *   4) An array of features.
 *   5) An object - Assumed to be a collections's JSON description.
 *
 * @constructor
 * @extends {ee.Collection}
 * @param {string|number|Array.<*>|Object|ee.Feature|ee.FeatureCollection} args
 *     The constructor arguments.
 * @param {string=} opt_column The name of the geometry column to use.  Only
 *     useful with constructor types 1 and 2.
 */
ee.FeatureCollection = function(args, opt_column) {
  // Constructor safety.
  if (!(this instanceof ee.FeatureCollection)) {
    return new ee.FeatureCollection(args, opt_column);
  }
  ee.initialize();

  if (args instanceof ee.Feature) {
    args = [args];
  }

  if (goog.isString(args)) {
    args = {'type': 'FeatureCollection', 'id': args};
    if (opt_column) {
      args['geo_column'] = opt_column;
    }
  } else if (goog.isNumber(args)) {
    args = {'type': 'FeatureCollection', 'table_id': args};
    if (opt_column) {
      args['geo_column'] = opt_column;
    }
  } else if (goog.isArray(args)) {
    var newArgs = {
      'type': 'FeatureCollection',
      'features': goog.array.map(args, function(elem) {
        return new ee.Feature(elem);
      })
    };
    args = newArgs;
  } else if (args instanceof ee.FeatureCollection) {
    return args;
  }

  /**
   * The internal representation of this collection.
   * @type {*}
   * @private
   */
  this.description_ = args;
};
goog.inherits(ee.FeatureCollection, ee.Collection);

/**
 * An imperative function that returns a map id and token, suitable for
 * generating a Map overlay.
 *
 * @param {Object?=} opt_visParams The visualization parameters. Currently only
 *     one parameter, 'color', containing an RGB color string is allowed.  If
 *     vis_params isn't specified, then the color #000000 is used.
 * @param {function(Object, string=)=} opt_callback An async callback.
 *
 * @return {ee.data.mapid} An object containing a mapid string, an access
 *     token, plus a DrawVector image wrapping this collection.
 */
ee.FeatureCollection.prototype.getMap = function(opt_visParams, opt_callback) {
  var painted = new ee.Image({
    'algorithm': 'DrawVector',
    'collection': this,
    'color': (opt_visParams || {})['color'] || '000000'
  });

  if (opt_callback) {
    painted.getMap(null, opt_callback);
  } else {
    return painted.getMap();
  }
};

/**
 * @return {string} The collection as a human-readable string.
 */
ee.FeatureCollection.prototype.toString = function() {
  var json = ee.Serializer.toReadableJSON(this.description_);
  return 'ee.FeatureCollection(' + json + ')';
};


/**
 * Maps an algorithm over a collection.
 *
 * @param {string|function(ee.Feature):ee.Feature} algorithm The operation to
 *     map over the features of the collection. Either an algorithm name as a
 *     string, or a JavaScript function that receives a feature and returns a
 *     feature. In the latter case, the function is called only once and the
 *     result is captured as a description, so it cannot perform imperative
 *     operations or rely on external state.
 * @param {Object.<string,*>?=} opt_dynamicArgs A map specifying which
 *     properties of the input objects to pass to each argument of the
 *     algorithm. This maps from argument names to selector strings. Selector
 *     strings are property names, optionally concatenated into chains separated
 *     by a period to access properties-of-properties. To pass the whole object,
 *     use the special selector string '.all', and to pass the geometry, use
 *     '.geo'. If this argument is not specified, the names of the arguments
 *     will be matched exactly to the properties of the input object. If
 *     algorithm is a JavaScript function, this must be null or undefined as
 *     the feature will always be the only dynamic argument.
 * @param {Object.<string,*>?=} opt_constantArgs A map from argument names to
 *     constant values to be passed to the algorithm on every invocation.
 * @param {string=} opt_destination The property where the result of the
 *     algorithm will be put. If this is null or undefined, the result of the
 *     algorithm will replace the input, as is the usual behavior of a mapping
 *     opeartion.
 * @return {ee.FeatureCollection} The mapped collection.
 */
ee.FeatureCollection.prototype.map = function(
    algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination) {
  var args;
  if (goog.isFunction(algorithm)) {
    if (opt_dynamicArgs) {
      throw Error('Can\'t use dynamicArgs with a mapped JS function.');
    }
    var mapper = ee.lambda(
        ['FC_GEN_VAR'], algorithm(
            /** @type {ee.Feature} */ (ee.variable(ee.Feature, 'FC_GEN_VAR'))));
    args = [mapper, {'FC_GEN_VAR': '.all'}, opt_constantArgs, opt_destination];
  } else {
    args = arguments;
  }
  return ee.Collection.prototype['map'].apply(this, args);
};

// Explicit exports.  It's sad that we have to know what Collection contains.
goog.exportSymbol('ee.FeatureCollection', ee.FeatureCollection);
goog.exportProperty(ee.FeatureCollection.prototype, 'filter',
                    ee.FeatureCollection.prototype.filter);
goog.exportProperty(ee.FeatureCollection.prototype, 'filterDate',
                    ee.FeatureCollection.prototype.filterDate);
goog.exportProperty(ee.FeatureCollection.prototype, 'filterMetadata',
                    ee.FeatureCollection.prototype.filterMetadata);
goog.exportProperty(ee.FeatureCollection.prototype, 'filterBounds',
                    ee.FeatureCollection.prototype.filterBounds);
goog.exportProperty(ee.FeatureCollection.prototype, 'getInfo',
                    ee.FeatureCollection.prototype.getInfo);
goog.exportProperty(ee.FeatureCollection.prototype, 'limit',
                    ee.FeatureCollection.prototype.limit);
goog.exportProperty(ee.FeatureCollection.prototype, 'serialize',
                    ee.FeatureCollection.prototype.serialize);
goog.exportProperty(ee.FeatureCollection.prototype, 'sort',
                    ee.FeatureCollection.prototype.sort);
goog.exportProperty(ee.FeatureCollection.prototype, 'geometry',
                    ee.FeatureCollection.prototype.geometry);
goog.exportProperty(ee.FeatureCollection.prototype, 'getMap',
                    ee.FeatureCollection.prototype.getMap);
goog.exportProperty(ee.FeatureCollection.prototype, 'toString',
                    ee.FeatureCollection.prototype.toString);
