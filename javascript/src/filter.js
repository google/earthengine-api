// Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview Collection filters.
 *
 * new Filter('time', low, high)
 *    .bounds(ring)
 *    .eq('time', value)
 *    .lt('time', value)
 */

goog.provide('ee.Filter');

goog.require('ee');
goog.require('ee.Serializer');
goog.require('goog.array');
goog.require('goog.object');

/**
 * Construct a new filter.  This constuctor accepts the following args:
 *    1) Another filter.
 *    2) An array of filters (which are implicitly ANDed together)
 *    3) A JSON representation of a filter.   Users shouldn't be making these,
 *       they're produced by the generator functions below.
 *
 * @param {ee.Filter|Array.<*>|Object=} newFilter Optional filter to add.
 * @constructor
 */
ee.Filter = function(newFilter) {
  // Constructor safety.
  if (!(this instanceof ee.Filter)) {
    return new ee.Filter(newFilter);
  }
  ee.initialize();

  // If we've been passed another filter, just return it.
  if (newFilter instanceof ee.Filter) {
    return newFilter;
  }

  /**
   * The internal rerpresentation of this filter.  This is
   * an array of filter objects which are implicitly ANDed together.
   *
   * @type {Array.<*>}
   * @private;
   */
  this.filter_;

  if (newFilter instanceof Array) {
    this.filter_ = newFilter;
  } else {
    this.filter_ = newFilter ? [newFilter] : [];
  }
};


/**
 * Filter operators.
 * @enum {string}
 */
ee.Filter.Operators = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  LESS_THAN: 'less_than',
  LESS_THAN_OR_EQUAL: 'not_greater_than',
  GREATER_THAN: 'greater_than',
  GREATER_THAN_OR_EQUAL: 'not_less_than',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  STARTS_WITH: 'starts_with',
  NOT_STARTS_WITH: 'not_starts_with',
  ENDS_WITH: 'ends_with',
  NOT_ENDS_WITH: 'not_ends_with',
  OR: 'or',
  AND: 'and'
};

/**
 * @return {number} The number of predicates that have been added to this
 * filter.  This does not count nested predicates.
 */
ee.Filter.prototype.length = function() {
  return this.filter_.length;
};

/**
 * Append a predicate to a filter.  These are implicitly ANDed.
 *
 * @param {ee.Filter|Array.<ee.Filter|Object>|Object=} newFilter The filter
 *     to append.  Possible types are:
 *     1) another fully constructed ee.Filter,
 *     2) a JSON representation of a filter,
 *     3) an array of 1 or 2.
 * @return {ee.Filter} A new filter that is the combination of both.
 * @private
 */
ee.Filter.prototype.append_ = function(newFilter) {
  // Make a copy of the previous filter.
  var prev = this.filter_.slice(0);
  if (newFilter instanceof ee.Filter) {
    goog.array.extend(prev, newFilter.filter_);
  } else if (newFilter instanceof Array) {
    goog.array.extend(prev, newFilter);
  } else {
    prev.push(newFilter);
  }
  return new ee.Filter(prev);
};

/**
 * Filter on metadata.
 *
 * @param {string} name The property name to filter on.
 * @param {string} operator The type of comparison.  One of:
 *    "equals", "less_than", "greater_than", "contains", "begins_with",
 *    "ends_with", or any of these prefixed with "not_".
 * @param {*} value The value to compare against.
 * @return {ee.Filter} The modified filter.
 * @private
 */
ee.Filter.metadata_ = function(name, operator, value) {
  return new ee.Filter(goog.object.create('property', name, operator, value));
};

/**
 * Filter to metadata equal to the given value.
 *
 * @param {string} name The property name to filter on.
 * @param {*} value The value to compare against.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.eq = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.EQUALS, value);
};

/**
 * Filter to metadata not equal to the given value.
 *
 * @param {string} name The property name to filter on.
 * @param {*} value The value to compare against.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.neq = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.NOT_EQUALS, value);
};

/**
 * Filter to metadata less than the given value.
 *
 * @param {string} name The property name to filter on.
 * @param {*} value The value to compare against.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.lt = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.LESS_THAN, value);
};

/**
 * Filter on metadata greater than or equal to the given value.
 *
 * @param {string} name The property name to filter on.
 * @param {*} value The value to compare against.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.gte = function(name, value) {
  return ee.Filter.metadata_(
      name, ee.Filter.Operators.GREATER_THAN_OR_EQUAL, value);
};

/**
 * Filter on metadata greater than the given value.
 *
 * @param {string} name The property name to filter on.
 * @param {*} value The value to compare against.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.gt = function(name, value) {
  return ee.Filter.metadata_(
      name, ee.Filter.Operators.GREATER_THAN, value);
};

/**
 * Filter on metadata less than or equal to the given value.
 *
 * @param {string} name The property name to filter on.
 * @param {*} value The value to compare against.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.lte = function(name, value) {
  return ee.Filter.metadata_(
      name, ee.Filter.Operators.LESS_THAN_OR_EQUAL, value);
};

/**
 * Filter on metadata containing the given string.
 *
 * @param {string} name The property name to filter on.
 * @param {string} value The value to compare against.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.contains = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.CONTAINS, value);
};

/**
 * Filter on metadata not containing the given string.
 *
 * @param {string} name The property name to filter on.
 * @param {string} value The value to compare against.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.not_contains = function(name, value) {
  return ee.Filter.metadata_(
      name, ee.Filter.Operators.NOT_CONTAINS, value);
};

/**
 * Filter on metadata begining with the given string.
 *
 * @param {string} name The property name to filter on.
 * @param {string} value The value to compare against.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.starts_with = function(name, value) {
  return ee.Filter.metadata_(
      name, ee.Filter.Operators.STARTS_WITH, value);
};

/**
 * Filter on metadata not begining with the given string.
 *
 * @param {string} name The property name to filter on.
 * @param {string} value The value to compare against.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.not_starts_with = function(name, value) {
  return ee.Filter.metadata_(
      name, ee.Filter.Operators.NOT_STARTS_WITH, value);
};

/**
 * Filter on metadata ending with the given string.
 *
 * @param {string} name The property name to filter on.
 * @param {string} value The value to compare against.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.ends_with = function(name, value) {
  return ee.Filter.metadata_(name, ee.Filter.Operators.ENDS_WITH, value);
};

/**
 * Filter on metadata not ending with the given string.
 *
 * @param {string} name The property name to filter on.
 * @param {string} value The value to compare against.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.not_ends_with = function(name, value) {
  return ee.Filter.metadata_(
      name, ee.Filter.Operators.NOT_ENDS_WITH, value);
};

/**
 * Combine two or more filters using boolean AND.
 *
 * @param {...ee.Filter} var_args The filters to combine.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.and = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  return new ee.Filter({'and': args});
};

/**
 * Combine two or more filters using boolean OR.
 *
 * @param {...ee.Filter} var_args The filters to combine.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.or = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  return new ee.Filter({'or': args});
};

/**
 * Filter images by date.
 *
 * @param {Date|string|number} start The start date.
 * @param {Date|string|number=} opt_end The end date.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.date = function(start, opt_end) {
  var normalizeDate = function(d) {
    return (d instanceof Date ? d.getTime() :
            (typeof(d) == 'string' ? new Date(d).getTime() : d));
  };

  var newFilter = {
    'property': 'system:time_start',
    'not_less_than': normalizeDate(start)
  };

  if (opt_end) {
    newFilter = [newFilter, {
      'property': 'system:time_start',
      'not_greater_than': normalizeDate(opt_end)
      }];
  }
  return new ee.Filter(newFilter);
};

/**
 * Filter on bounds.
 *
 * @param {Object|ee.FeatureCollection} geometry The geometry to filter to.
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.bounds = function(geometry) {
  if (geometry instanceof ee.FeatureCollection) {
    geometry = {
      'algorithm': 'ExtractGeometry',
      'collection': geometry
    };
  }
  return new ee.Filter({'geometry': geometry});
};

/**
 * Prototyped versions of all filter operators.
 */

/**
 * @see ee.Filter.eq
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.eq = function() {
  return this.append_(ee.Filter.eq.apply(null, [].slice.call(arguments)));
};

/**
 * @see ee.Filter.neq
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.neq = function() {
  return this.append_(ee.Filter.neq.apply(null, [].slice.call(arguments)));
};

/**
 * @see ee.Filter.lt
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.lt = function() {
  return this.append_(ee.Filter.lt.apply(null, [].slice.call(arguments)));
};

/**
 * @see ee.Filter.gte
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.gte = function() {
  return this.append_(ee.Filter.gte.apply(null, [].slice.call(arguments)));
};

/**
 * @see ee.Filter.gt
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.gt = function() {
  return this.append_(ee.Filter.gt.apply(null, [].slice.call(arguments)));
};

/**
 * @see ee.Filter.lte
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.lte = function() {
  return this.append_(ee.Filter.lte.apply(null, [].slice.call(arguments)));
};

/**
 * @see ee.Filter.contains
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.contains = function() {
  return this.append_(ee.Filter.contains.apply(null, [].slice.call(arguments)));
};

/**
 * @see ee.Filter.not_contains
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.not_contains = function() {
  return this.append_(
      ee.Filter.not_contains.apply(null, [].slice.call(arguments)));
};

/**
 * @see ee.Filter.starts_with
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.starts_with = function() {
  return this.append_(
      ee.Filter.starts_with.apply(null, [].slice.call(arguments)));
};

/**
 * @see ee.Filter.not_starts_with
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.not_starts_with = function() {
  return this.append_(
      ee.Filter.not_starts_with.apply(null, [].slice.call(arguments)));
};

/**
 * @see ee.Filter.ends_with
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.ends_with = function() {
  return this.append_(
      ee.Filter.ends_with.apply(null, [].slice.call(arguments)));
};

/**
 * @see ee.Filter.not_ends_with
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.not_ends_with = function() {
  return this.append_(
      ee.Filter.not_ends_with.apply(null, [].slice.call(arguments)));
};

/**
 * @see ee.Filter.and
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.and = function() {
  return this.append_(ee.Filter.and.apply(null, [].slice.call(arguments)));
};

/**
 * There is no prototype version of 'or', to avoid the abiguous syntax.
 * Example:  a.or(b), doesn't do what it looks like it would; it appends
 * "or(b)" to the list of filters that includes a, which is equal
 * to "and(a, b)", not "or(a,b)".
 */

/**
 * @see ee.Filter.date
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.date = function() {
  return this.append_(ee.Filter.date.apply(null, [].slice.call(arguments)));
};

/**
 * @see ee.Filter.bounds
 * @return {ee.Filter} The modified filter.
 */
ee.Filter.prototype.bounds = function() {
  return this.append_(ee.Filter.bounds.apply(null, [].slice.call(arguments)));
};

/**
 * JSON serializer.
 * @return {string} The serialized representation of this object.
 */
ee.Filter.prototype.serialize = function() {
  return ee.Serializer.toJSON(this.filter_);
};

/**
 * @return {string} The filter as a human-readable string.
 */
ee.Filter.prototype.toString = function() {
  return 'ee.Filter(' + ee.Serializer.toReadableJSON(this.filter_) + ')';
};

// Exported symbols
goog.exportSymbol('ee.Filter', ee.Filter);
goog.exportProperty(ee.Filter.prototype, 'length', ee.Filter.prototype.length);
goog.exportProperty(ee.Filter.prototype, 'and', ee.Filter.prototype.and);
goog.exportProperty(ee.Filter.prototype, 'eq', ee.Filter.prototype.eq);
goog.exportProperty(ee.Filter.prototype, 'neq', ee.Filter.prototype.neq);
goog.exportProperty(ee.Filter.prototype, 'lt', ee.Filter.prototype.lt);
goog.exportProperty(ee.Filter.prototype, 'gte', ee.Filter.prototype.gte);
goog.exportProperty(ee.Filter.prototype, 'gt', ee.Filter.prototype.gt);
goog.exportProperty(ee.Filter.prototype, 'lte', ee.Filter.prototype.lte);
goog.exportProperty(ee.Filter.prototype, 'contains',
                    ee.Filter.prototype.contains);
goog.exportProperty(ee.Filter.prototype, 'not_contains',
                    ee.Filter.prototype.not_contains);
goog.exportProperty(ee.Filter.prototype, 'starts_with',
                    ee.Filter.prototype.starts_with);
goog.exportProperty(ee.Filter.prototype, 'not_starts_with',
                    ee.Filter.prototype.not_starts_with);
goog.exportProperty(ee.Filter.prototype, 'ends_with',
                    ee.Filter.prototype.ends_with);
goog.exportProperty(ee.Filter.prototype, 'not_ends_with',
                    ee.Filter.prototype.not_ends_with);
goog.exportProperty(ee.Filter.prototype, 'bounds',
                    ee.Filter.prototype.bounds);
goog.exportProperty(ee.Filter.prototype, 'date',
                    ee.Filter.prototype.date);
goog.exportProperty(ee.Filter.prototype, 'serialize',
                    ee.Filter.prototype.serialize);
goog.exportProperty(ee.Filter.prototype, 'toString',
                    ee.Filter.prototype.toString);

// Static versions.
goog.exportProperty(ee.Filter, 'and', ee.Filter.and);
goog.exportProperty(ee.Filter, 'or', ee.Filter.or);
goog.exportProperty(ee.Filter, 'eq', ee.Filter.eq);
goog.exportProperty(ee.Filter, 'neq', ee.Filter.neq);
goog.exportProperty(ee.Filter, 'lt', ee.Filter.lt);
goog.exportProperty(ee.Filter, 'gte', ee.Filter.gte);
goog.exportProperty(ee.Filter, 'gt', ee.Filter.gt);
goog.exportProperty(ee.Filter, 'lte', ee.Filter.lte);
goog.exportProperty(ee.Filter, 'contains', ee.Filter.contains);
goog.exportProperty(ee.Filter, 'not_contains', ee.Filter.not_contains);
goog.exportProperty(ee.Filter, 'starts_with', ee.Filter.starts_with);
goog.exportProperty(ee.Filter, 'not_starts_with', ee.Filter.not_starts_with);
goog.exportProperty(ee.Filter, 'ends_with', ee.Filter.ends_with);
goog.exportProperty(ee.Filter, 'not_ends_with', ee.Filter.not_ends_with);
goog.exportProperty(ee.Filter, 'bounds', ee.Filter.bounds);
goog.exportProperty(ee.Filter, 'date', ee.Filter.date);
