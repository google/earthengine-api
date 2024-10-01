/**
 * @fileoverview Base class for ImageCollection and FeatureCollection.
 * This class is never intended to be instantiated by the user.
 */

goog.provide('ee.Collection');

goog.require('ee.ApiFunction');
goog.require('ee.Element');
goog.require('ee.Filter');
goog.require('ee.arguments');

goog.requireType('ee.ComputedObject');
goog.requireType('ee.FeatureCollection');
goog.requireType('ee.Function');
goog.requireType('ee.Geometry');


/**
 * Constructs a base collection by passing the representation up to Element.
 * @param {ee.Function} func The same argument as in ee.ComputedObject().
 * @param {Object} args The same argument as in ee.ComputedObject().
 * @param {string?=} opt_varName The same argument as in ee.ComputedObject().
 * @param {boolean?=} opt_unbound The same argument as in ee.ComputedObject().
 * @constructor
 * @extends {ee.Element}
 */
ee.Collection = function(func, args, opt_varName, opt_unbound) {
  ee.Collection.base(this, 'constructor', func, args, opt_varName, opt_unbound);
  ee.Collection.initialize();
};
goog.inherits(ee.Collection, ee.Element);
// Exporting manually to avoid marking the class public in the docs.
goog.exportSymbol('ee.Collection', ee.Collection);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.Collection.initialized_ = false;


/**
 * Imports API functions to this class.
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
 */
ee.Collection.reset = function() {
  ee.ApiFunction.clearApi(ee.Collection);
  ee.Collection.initialized_ = false;
};


/**
 * Apply a filter to this collection.
 *
 * @param {ee.Filter} filter A filter to apply to this collection.
 * @return {ee.Collection} The filtered collection.
 * @export
 */
ee.Collection.prototype.filter = function(filter) {
  var args = ee.arguments.extractFromFunction(
      ee.Collection.prototype.filter, arguments);
  filter = args['filter'];
  if (!filter) {
    throw new Error('Empty filters.');
  }
  return this.castInternal(ee.ApiFunction._call(
      'Collection.filter', this, filter));
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
 * @export
 * @deprecated Use filter() with ee.Filter.eq(), ee.Filter.gte(), etc.
 */
ee.Collection.prototype.filterMetadata = function(name, operator, value) {
  var args = ee.arguments.extractFromFunction(
      ee.Collection.prototype.filterMetadata, arguments);
  return this.filter(ee.Filter.metadata(
      args['name'], args['operator'], args['value']));
};


/**
 * Shortcut to filter a collection by intersection with geometry. Items in the
 * collection with a footprint that fails to intersect the given geometry
 * will be excluded.
 *
 * This is equivalent to this.filter(ee.Filter.bounds(...)).
 *
 * Caution: providing a large or complex collection as the `geometry` argument
 * can result in poor performance. Collating the geometry of collections does
 * not scale well; use the smallest collection (or geometry) that is required to
 * achieve the desired outcome.
 * @param {!ee.Geometry|!ee.ComputedObject|!ee.FeatureCollection} geometry
 *     The geometry, feature or collection to intersect with.
 * @return {ee.Collection} The filtered collection.
 * @export
 */
ee.Collection.prototype.filterBounds = function(geometry) {
  return this.filter(ee.Filter.bounds(geometry));
};


/**
 * Shortcut to filter a collection by a date range. The start and end may be
 * Dates, numbers (interpreted as milliseconds since 1970-01-01T00:00:00Z), or
 * strings (such as '1996-01-01T08:00'). Based on 'system:time_start'.
 *
 * This is equivalent to this.filter(ee.Filter.date(...)); see the ee.Filter
 * type for other date filtering options.
 *
 * @param {!Date|string|number} start The start date (inclusive).
 * @param {?Date|string|number=} opt_end The end date (exclusive). Optional. If
 *     not specified, a 1-millisecond range starting at 'start' is created.
 * @return {?ee.Collection} The filtered collection.
 * @export
 */
ee.Collection.prototype.filterDate = function(start, opt_end) {
  var args = ee.arguments.extractFromFunction(
      ee.Collection.prototype.filterDate, arguments);
  return this.filter(ee.Filter.date(args['start'], args['end']));
};


/**
 * Limit a collection to the specified number of elements, optionally
 * sorting them by a specified property first.
 *
 * @param {number} max The number to limit the collection to.
 * @param {string=} opt_property The property to sort by, if sorting.
 * @param {boolean=} opt_ascending Whether to sort in ascending or
 *     descending order.  The default is true (ascending).
 * @return {ee.Collection} The limited collection.
 * @export
 */
ee.Collection.prototype.limit = function(max, opt_property, opt_ascending) {
  var args = ee.arguments.extractFromFunction(
      ee.Collection.prototype.limit, arguments);
  return this.castInternal(ee.ApiFunction._call(
      'Collection.limit', this,
      args['max'], args['property'], args['ascending']));
};


/**
 * Sort a collection by the specified property.
 *
 * @param {string} property The property to sort by.
 * @param {boolean=} opt_ascending Whether to sort in ascending or descending
 *     order.  The default is true (ascending).
 * @return {ee.Collection} The sorted collection.
 * @export
 */
ee.Collection.prototype.sort = function(property, opt_ascending) {
  var args = ee.arguments.extractFromFunction(
      ee.Collection.prototype.sort, arguments);
  return this.castInternal(ee.ApiFunction._call(
      'Collection.limit', this,
      undefined, args['property'], args['ascending']));
};


/** @override */
ee.Collection.prototype.name = function() {
  return 'Collection';
};


/**
 * Returns the type constructor of the collection's elements.
 * @return {function(new:Object, ...?)}
 * @protected
 */
ee.Collection.prototype.elementType = function() {
  return ee.Element;
};


/**
 * Maps an algorithm over a collection.
 *
 * @param {function(Object):Object} algorithm The operation to map over
 *     the images or features of the collection. A JavaScript function that
 *     receives an image or features and returns one. The function is called
 *     only once and the result is captured as a description, so it cannot
 *     perform imperative operations or rely on external state.
 * @param {boolean=} opt_dropNulls If true, the mapped algorithm is allowed
 *     to return nulls, and the elements for which it returns nulls will be
 *     dropped.
 * @return {ee.Collection} The mapped collection.
 * @export
 */
ee.Collection.prototype.map = function(algorithm, opt_dropNulls) {
  var elementType = this.elementType();
  var withCast = function(e) { return algorithm(new elementType(e)); };
  return this.castInternal(ee.ApiFunction._call(
      'Collection.map', this, withCast, opt_dropNulls));
};


/**
 * Applies a user-supplied function to each element of a collection. The
 * user-supplied function is given two arguments: the current element, and
 * the value returned by the previous call to iterate() or the first argument,
 * for the first iteration. The result is the value returned by the final
 * call to the user-supplied function.
 *
 * @param {function(Object, Object):Object} algorithm The function to apply
 *     to each element. Must take two arguments: an element of the collection
 *     and the value from the previous iteration.
 * @param {*=} opt_first The initial state.
 * @return {!ee.ComputedObject} The result of the Collection.iterate() call.
 * @export
 */
ee.Collection.prototype.iterate = function(algorithm, opt_first) {
  var first = (opt_first !== undefined) ? opt_first : null;
  var elementType = this.elementType();
  var withCast = function(e, p) { return algorithm(new elementType(e), p); };
  return ee.ApiFunction._call('Collection.iterate', this, withCast, first);
};
