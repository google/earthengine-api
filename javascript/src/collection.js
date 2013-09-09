/**
 * @fileoverview Base class for ImageCollection and FeatureCollection.
 * This class is never intended to be instantiated by the user.
 *
 */

goog.provide('ee.Collection');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.CustomFunction');
goog.require('ee.Filter');
goog.require('ee.Function');
goog.require('ee.Types');
goog.require('goog.object');



/**
 * Constructs a base collection by passing the representaion up to
 * ComputedObject.
 * @param {ee.Function} func The same argument as in ee.ComputedObject().
 * @param {Object} args The same argument as in ee.ComputedObject().
 * @constructor
 * @extends {ee.ComputedObject}
 * @hidden
 */
ee.Collection = function(func, args) {
  goog.base(this, func, args);
  ee.Collection.initialize();
};
goog.inherits(ee.Collection, ee.ComputedObject);


/**
 * The serial number of the next mapping variable.
 * @type {number}
 * @private
 */
ee.Collection.serialMappingId_ = 0;


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.Collection.initialized_ = false;


/**
 * Imports API functions to this class.
 * @hidden
 */
ee.Collection.initialize = function() {
  if (!ee.Collection.initialized_) {
    ee.ApiFunction.importApi(ee.Collection, 'Collection', 'Collection');
    ee.ApiFunction.importApi(ee.Collection,
                             'AggregateFeatureCollection',
                             'Collection',
                             'aggregate_');
    ee.Collection.initialized_ = true;
  }
};


/**
 * Removes imported API functions from this class and resets the serial ID
 * used for mapping JS functions to 0.
 * @hidden
 */
ee.Collection.reset = function() {
  ee.ApiFunction.clearApi(ee.Collection);
  ee.Collection.initialized_ = false;
  ee.Collection.serialMappingId_ = 0;
};


/**
 * Apply a filter to this collection.
 *
 * Collection filtering is done by wrapping a collection in a filter
 * algorithm.  As additional filters are applied to a collection, we
 * try to avoid adding more wrappers and instead search for a wrapper
 * we can add to, however if the collection doesn't have a filter, this
 * will wrap it in one.
 *
 * @param {ee.Filter} newFilter - A filter to add to this collection.
 * @return {ee.Collection} The filtered collection.
 */
ee.Collection.prototype.filter = function(newFilter) {
  if (!newFilter) {
    throw new Error('Empty filters.');
  }
  return this.cast_(ee.ApiFunction._call('Collection.filter', this, newFilter));
};


/**
 * Shortcuts to filter a collection by metadata.  This is equivalent
 * to this.filter(ee.Filter.metadata(...)).
 *
 * @param {string} name The name of a property to filter.
 * @param {string} operator The name of a comparison operator.
 *     Possible values are: "equals", "less_than", "greater_than",
 *     "not_equals", "not_less_than", "not_greater_than", "starts_with",
 *     "ends_with", "not_starts_with", "not_ends_with", "contains",
 *     "not_contains".
 * @param {*} value - The value to compare against.
 * @return {ee.Collection} The filtered collection.
 */
ee.Collection.prototype.filterMetadata = function(name, operator, value) {
  return this.filter(ee.Filter.metadata(name, operator, value));
};


/**
 * Shortcut to filter a collection by geometry.  Items in the
 * collection with a footprint that fails to intersect the bounds
 * will be excluded when the collection is evaluated.
 *
 * This is equivalent to this.filter(ee.Filter.bounds(...)).
 * @param {ee.Feature|ee.Geometry} geometry The geometry to filter to.
 * @return {ee.Collection} The filtered collection.
 */
ee.Collection.prototype.filterBounds = function(geometry) {
  return this.filter(ee.Filter.bounds(geometry));
};


/**
 * Shortcut to filter a collection by a date range.  Items in the
 * collection with a time_start property that doesn't fall between the
 * start and end dates will be excluded.
 *
 * This is equivalent to this.filter(ee.Filter.date(...)).
 *
 * @param {Date|string|number} start The start date as a Date object,
 *     a string representation of a date, or milliseconds since epoch.
 * @param {Date|string|number} end The end date as a Date object,
 *     a string representation of a date, or milliseconds since epoch.
 * @return {ee.Collection} The filtered collection.
 */
ee.Collection.prototype.filterDate = function(start, end) {
  return this.filter(ee.Filter.date(start, end));
};


/**
 * An imperative function that returns all the known information about this
 * collection via a synchronous AJAX call.
 *
 * @param {function(Object)=} opt_callback An optional callback.  If not
 *     supplied, the call is made synchronously.
 * @return {Object|undefined} An object whose attributes vary but include:
 *     - features: an array containing metadata about the items in the
 *           collection that passed all filters.
 *     - properties: a dictionary containing the collection's metadata
 *           properties.
 */
ee.Collection.prototype.getInfo = function(opt_callback) {
  return /** @type {Object|undefined} */(
      goog.base(this, 'getInfo', opt_callback));
};


/**
 * Limit a collection to the specified number of elements, optionally
 * sorting them by a specified property first.
 *
 * @param {number} max - The number to limit the collection to.
 * @param {string=} opt_property - The property to sort by, if sorting.
 * @param {boolean=} opt_ascending - Whether to sort in ascending or
 *     descending order.  The default is true (ascending).
 * @return {ee.Collection} The limited collection.
 */
ee.Collection.prototype.limit = function(max, opt_property, opt_ascending) {
  return this.cast_(ee.ApiFunction._call(
      'Collection.limit', this, max, opt_property, opt_ascending));
};


/**
 * Sort a collection by the specified property.
 *
 * @param {string} property - The property to sort by.
 * @param {boolean=} opt_ascending - Whether to sort in ascending or descending
 *     order.  The default is true (ascending).
 * @return {ee.Collection} The sorted collection.
 */
ee.Collection.prototype.sort = function(property, opt_ascending) {
  return this.cast_(ee.ApiFunction._call(
      'Collection.limit', this, undefined, property, opt_ascending));
};


/**
 * Cast a ComputedObject to a new instance of the same class as this.
 * @param {ee.ComputedObject} obj The object to cast.
 * @return {ee.Collection} The cast instance.
 * @private
 */
ee.Collection.prototype.cast_ = function(obj) {
  if (obj instanceof this.constructor) {
    return obj;
  } else {
    // Assumes all subclass constructors can be called with a
    // ComputedObject as their first parameter.
    return new this.constructor(obj);
  }
};


/** @inheritDoc */
ee.Collection.prototype.name = function() {
  return 'Collection';
};


/**
 * Maps an algorithm over a collection. @see ee.Collection.map() for details.
 *
 * @param {function(new:Object, ...[?])} type The collection elements' type.
 * @param {string|Object|function(*):Object} algorithm
 * @param {Object.<string,*>?=} opt_dynamicArgs
 * @param {Object.<string,*>?=} opt_constantArgs
 * @param {string=} opt_destination
 * @return {ee.Collection}
 * @protected
 */
ee.Collection.prototype.mapInternal = function(
    type, algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination) {
  if (goog.isFunction(algorithm)) {
    if (opt_dynamicArgs) {
      // TODO(user): Remove this once we have a getProperty() algorithm.
      throw Error('Can\'t use dynamicArgs with a mapped JS function.');
    }
    var varName = '_MAPPING_VAR_' + ee.Collection.serialMappingId_++;
    algorithm = new ee.CustomFunction(
        goog.object.create(varName, type), type, algorithm);
  } else if (goog.isString(algorithm)) {
    algorithm = new ee.ApiFunction(algorithm);
  } else if (!(algorithm instanceof ee.Function)) {
    throw Error('Can\'t map non-callable object: ' + algorithm);
  }
  var args = {
    'collection': this,
    'baseAlgorithm': algorithm
  };
  if (opt_dynamicArgs) {
    args['dynamicArgs'] = opt_dynamicArgs;
  } else {
    // Use the function's first argument.
    var varName = algorithm.getSignature()['args'][0]['name'];
    args['dynamicArgs'] = goog.object.create(varName, '.all');
  }
  if (opt_constantArgs) { args['constantArgs'] = opt_constantArgs; }
  if (opt_destination) { args['destination'] = opt_destination; }
  return this.cast_(ee.ApiFunction._apply('Collection.map', args));
};


/**
 * Maps an algorithm over a collection.
 *
 * @param {string|Object|function(*):Object} algorithm The operation to map over
 *     the images or features of the collection. Either an algorithm name as a
 *     string, or a JavaScript function that receives an image or features and
 *     returns one. If a function is passed, it is called only once and the
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
 *     the image will always be the only dynamic argument.
 * @param {Object.<string,*>?=} opt_constantArgs A map from argument names to
 *     constant values to be passed to the algorithm on every invocation.
 * @param {string=} opt_destination The property where the result of the
 *     algorithm will be put. If this is null or undefined, the result of the
 *     algorithm will replace the input, as is the usual behavior of a mapping
 *     opeartion.
 * @return {ee.Collection} The mapped collection.
 */
ee.Collection.prototype.map = function(
    algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination) {
  return this.mapInternal(
      ee.ComputedObject, algorithm,
      opt_dynamicArgs, opt_constantArgs, opt_destination);
};


/**
 * Creates a map_* method on collectionClass for each generated instance
 * method on elementClass that maps that method over the collection.
 *
 * @param {function(new:ee.Collection, ?): ee.Collection} collectionClass
 *     The collection type.
 * @param {function(new:Object, ?): Object} elementClass
 *     The collection elements' type.
 * @protected
 * TODO(user): Deprecate these.
 */
ee.Collection.createAutoMapFunctions = function(collectionClass, elementClass) {
  goog.object.forEach(elementClass.prototype, function(method, name) {
    if (goog.isFunction(method) && method['signature']) {
      collectionClass.prototype['map_' + name] = function() {
        var destination = null;
        if (!ee.Types.isSubtype('EEObject', method['signature']['returns'])) {
          destination = name;
        }
        var constArgs = Array.prototype.slice.call(arguments, 0);
        return this.mapInternal(elementClass, function(elem) {
          return method.apply(elem, constArgs);
        }, null, null, destination);
      };
    }
  });
};


goog.exportSymbol('ee.Collection', ee.Collection);
goog.exportProperty(ee.Collection.prototype, 'filter',
                    ee.Collection.prototype.filter);
goog.exportProperty(ee.Collection.prototype, 'filterMetadata',
                    ee.Collection.prototype.filterMetadata);
goog.exportProperty(ee.Collection.prototype, 'filterBounds',
                    ee.Collection.prototype.filterBounds);
goog.exportProperty(ee.Collection.prototype, 'filterDate',
                    ee.Collection.prototype.filterDate);
goog.exportProperty(ee.Collection.prototype, 'limit',
                    ee.Collection.prototype.limit);
goog.exportProperty(ee.Collection.prototype, 'sort',
                    ee.Collection.prototype.sort);
