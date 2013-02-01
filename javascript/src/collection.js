//Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview Base class for ImageCollection and FeatureCollection.
 * This class is never intended to be instantiated by the user.
 *
 */
goog.provide('ee.Collection');

goog.require('ee.Filter');
goog.require('ee.Serializer');
goog.require('ee.data');
goog.require('goog.object');

/**
 * @param {Object} args - A representation of the collection.
 * @constructor
 *
 * TODO(user): Add some runtime type checking.
 */
ee.Collection = function(args) {
  /**
   * The internal representation of this collection.
   * @type {Object}
   * @private
   */
  this.description_ = args;
};


/**
 * Add a new filter to this collection.
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

  var description;
  // Check if this collection already has a filter.
  if (ee.Collection.isFilterFeatureCollection_(this)) {
    description = this.description_['collection'];
    newFilter = this.description_['filters'].append_(newFilter);
  } else {
    description = this.description_;
  }

  // This assumes all collection subclasses can be constructed from JSON.
  return new this.constructor({
    'algorithm': 'FilterFeatureCollection',
    'collection': description,
    'filters': newFilter
  });
};

/**
 * Returns true iff the collection is wrapped with a filter.
 *
 * @param {ee.Collection} collection - The collection to check.
 * @return {boolean} True if the collection is wrapped with a filter.
 * @private
 */
ee.Collection.isFilterFeatureCollection_ = function(collection) {
  return (collection.description_['algorithm'] == 'FilterFeatureCollection');
};

/**
 * Shortcuts to filter a collection by metadata.  This is equivalent
 * to this.filter(new ee.Filter().metadata(...)).
 *
 * @param {string} name - name of a property to filter.
 * @param {string} operator - Name of a comparison operator as defined
 *     by FilterCollection.  Possible values are: "equals", "less_than",
 *     "greater_than", "not_equals", "not_less_than", "not_greater_than",
 *     "starts_with", "ends_with", "not_starts_with", "not_ends_with",
 *     "contains", "not_contains".
 *
 * @param {*} value - The value to compare against.
 * @return {ee.Collection} The filtered collection.
 */
ee.Collection.prototype.filterMetadata = function(name, operator, value) {
  return this.filter(ee.Filter.metadata_(name, operator, value));
};

/**
 * Shortcut to filter a collection by geometry.  Items in the
 * collection with a footprint that fails to intersect the bounds
 * will be excluded when the collection is evaluated.
 *
 * This is equivalent to this.filter(new ee.Filter().bounds(...)).
 * @param {ee.Feature|ee.Geometry} geometry - The geometry to filter to.
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
 * This is equivalent to this.filter(new ee.Filter().date(...)).
 *
 * @param {Date|string|number} start - The start date as a Date object,
 *     a string representation of a date, or milliseconds since epoch.
 * @param {Date|string|number} end - The end date as a Date object,
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
 *
 * @return {Object} The return contents vary but will include at least:
 *     features - an array containing metadata about the items in the
 *                collection that passed all filters.
 *     properties - a dictionary containing the collection's metadata
 *                  properties.
 */
ee.Collection.prototype.getInfo = function(opt_callback) {
  return ee.data.getValue(
      {'json': this.serialize()},
      opt_callback);
};

/**
 * JSON serializer.
 *
 * @return {string} The serialized representation of this object.
 */
ee.Collection.prototype.serialize = function() {
  // Pop off any unused filter wrappers that might have been added by filter.
  //
  // We copy the object here, otherwise we might accidentally knock off a
  // filter in progress.
  var item = this;
  while (ee.Collection.isFilterFeatureCollection_(item) &&
         item.description_['filters'].length == 0) {
    item = item.description_['collection'];
  }
  return ee.Serializer.toJSON(item.description_);
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
  var args = {
    'algorithm': 'LimitFeatureCollection',
    'collection': this,
    'limit': max
  };
  if (opt_property) {
    args['key'] = opt_property;
    if (opt_ascending) {
      args['ascending'] = opt_ascending;
    }
  }
  return new this.constructor(args);
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
  var args = {
    'algorithm': 'LimitFeatureCollection',
    'collection': this,
    'key': property
  };
  if (opt_ascending) {
    args['ascending'] = opt_ascending;
  }
  return new this.constructor(args);
};

/**
 * Run an algorithm to extract the geometry from this collection.
 *
 * @return {Object} A JSON object representing the algorithm call.
 * TODO(user): Maybe this becomes a Feature?
 */
ee.Collection.prototype.geometry = function() {
  return {
    'algorithm': 'ExtractGeometry',
    'collection': this
  };
};

/**
 * Maps an algorithm over a collection.
 *
 * @param {function(new:Object, ?): Object} type The collection elements' type.
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
 * @protected
 */
ee.Collection.prototype.mapInternal = function(
    type, algorithm, opt_dynamicArgs, opt_constantArgs, opt_destination) {
  var args;
  if (goog.isFunction(algorithm)) {
    if (opt_dynamicArgs) {
      throw Error('Can\'t use dynamicArgs with a mapped JS function.');
    }
    var varName = '_MAPPING_VAR_' + ee.Collection.serialMappingId_++;
    algorithm = ee.lambda([varName], algorithm(ee.variable(type, varName)));
    opt_dynamicArgs = goog.object.create(varName, '.all');
  }
  var description = {
    'algorithm': 'Collection.map',
    'collection': this,
    'baseAlgorithm': algorithm
  };
  if (opt_dynamicArgs) { description['dynamicArgs'] = opt_dynamicArgs; }
  if (opt_constantArgs) { description['constantArgs'] = opt_constantArgs; }
  if (opt_destination) { description['destination'] = opt_destination; }
  return new this.constructor(description);
};


/**
 * The serial number of the next mapping variable.
 * @type {number}
 * @private
 */
ee.Collection.serialMappingId_ = 0;

goog.exportSymbol('ee.Collection', ee.Collection);
goog.exportProperty(ee.Collection.prototype, 'filter',
                    ee.Collection.prototype.filter);
goog.exportProperty(ee.Collection.prototype, 'filterMetadata',
                    ee.Collection.prototype.filterMetadata);
goog.exportProperty(ee.Collection.prototype, 'filterBounds',
                    ee.Collection.prototype.filterBounds);
goog.exportProperty(ee.Collection.prototype, 'filterDate',
                    ee.Collection.prototype.filterDate);
goog.exportProperty(ee.Collection.prototype, 'getInfo',
                    ee.Collection.prototype.getInfo);
goog.exportProperty(ee.Collection.prototype, 'serialize',
                    ee.Collection.prototype.serialize);
goog.exportProperty(ee.Collection.prototype, 'limit',
                    ee.Collection.prototype.limit);
goog.exportProperty(ee.Collection.prototype, 'sort',
                    ee.Collection.prototype.sort);

// Exported for testing.
goog.exportProperty(ee.Collection, 'isFilterFeatureCollection_',
                    ee.Collection.isFilterFeatureCollection_);
