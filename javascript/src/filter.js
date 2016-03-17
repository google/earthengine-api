/**
 * @fileoverview Collection filters.
 *
 * new Filter('time', low, high)
 *    .bounds(ring)
 *    .eq('time', value)
 *    .lt('time', value)
 */

goog.provide('ee.Filter');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.arguments');
goog.require('goog.array');
goog.require('goog.string');



/**
 * Constructs a new filter. This constuctor accepts the following args:
 *    - Another filter.
 *    - A list of filters (which are implicitly ANDed together).
 *    - A ComputedObject returning a filter. Users shouldn't be making these;
 *       they're produced by the generator functions below.
 *
 * @param {ee.Filter|Array.<*>|Object=} opt_filter Optional filter to add.
 * @constructor
 * @extends {ee.ComputedObject}
 * @export
 */
ee.Filter = function(opt_filter) {
  // Constructor safety.
  if (!(this instanceof ee.Filter)) {
    return ee.ComputedObject.construct(ee.Filter, arguments);
  } else if (opt_filter instanceof ee.Filter) {
    // If we've been passed another filter, just return it.
    return opt_filter;
  }

  ee.Filter.initialize();

  /**
   * The internal rerpresentation of this filter.  This is
   * a list of filter objects which are implicitly ANDed together.
   *
   * @type {Array.<*>}
   * @private
   */
  this.filter_;

  if (goog.isArray(opt_filter)) {
    if (opt_filter.length == 0) {
      throw Error('Empty list specified for ee.Filter().');
    } else if (opt_filter.length == 1) {
      return new ee.Filter(opt_filter[0]);
    } else {
      // AND filters together.
      goog.base(this, new ee.ApiFunction('Filter.and'), {
        'filters': opt_filter
      });
      this.filter_ = opt_filter;
    }
  } else if (opt_filter instanceof ee.ComputedObject) {
    // Actual filter object.
    goog.base(this, opt_filter.func, opt_filter.args, opt_filter.varName);
    this.filter_ = [opt_filter];
  } else if (!goog.isDef(opt_filter)) {
    // A silly call with no arguments left for backward-compatibility.
    // Encoding such a filter is expected to fail, but it can be composed
    // by calling the various methods that end up in append_().
    goog.base(this, null, null);
    this.filter_ = [];
  } else {
    throw Error('Invalid argument specified for ee.Filter(): ' + opt_filter);
  }
};
goog.inherits(ee.Filter, ee.ComputedObject);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.Filter.initialized_ = false;


/** Imports API functions to this class. */
ee.Filter.initialize = function() {
  if (!ee.Filter.initialized_) {
    ee.ApiFunction.importApi(ee.Filter, 'Filter', 'Filter');
    ee.Filter.initialized_ = true;
  }
};


/** Removes imported API functions from this class. */
ee.Filter.reset = function() {
  ee.ApiFunction.clearApi(ee.Filter);
  ee.Filter.initialized_ = false;
};


/**
 * A map from the deprecated old-style comparison operator names to API
 * function names, implicitly prefixed with "Filter.". Negative operators
 * (those starting with "not_") are not included.
 * @type {Object.<string>}
 * @const
 * @private
 */
ee.Filter.functionNames_ = {
  'equals': 'equals',
  'less_than': 'lessThan',
  'greater_than': 'greaterThan',
  'contains': 'stringContains',
  'starts_with': 'stringStartsWith',
  'ends_with': 'stringEndsWith'
};


/**
 * Append a predicate to a filter.  These are implicitly ANDed.
 *
 * @param {ee.Filter|Array.<ee.Filter|Object>|Object} newFilter The filter
 *     to append.  Possible types are:
 *     - another fully constructed ee.Filter,
 *     - a ComputedObject producing a filter,
 *     - a list of 1 or 2.
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
 * Returns the opposite of this filter, i.e. a filter that will match iff
 * this filter doesn't.
 * @return {ee.Filter} The negated filter.
 * @export
 */
ee.Filter.prototype.not = function() {
  return /** @type {ee.Filter} */ (ee.ApiFunction._call('Filter.not', this));
};


/**
 * Filter to metadata equal to the given value.
 *
 * @param {string} name The property name to filter on.
 * @param {*} value The value to compare against.
 * @return {ee.Filter} The constructed filter.
 * @export
 */
ee.Filter.eq = function(name, value) {
  var args = ee.arguments.extract(ee.Filter.eq, arguments);
  return /** @type {ee.Filter} */(
      ee.ApiFunction._call('Filter.equals', args['name'], args['value']));
};


/**
 * Filter to metadata not equal to the given value.
 *
 * @param {string} name The property name to filter on.
 * @param {*} value The value to compare against.
 * @return {ee.Filter} The constructed filter.
 * @export
 */
ee.Filter.neq = function(name, value) {
  var args = ee.arguments.extract(ee.Filter.neq, arguments);
  return ee.Filter.eq(args['name'], args['value']).not();
};


/**
 * Filter to metadata less than the given value.
 *
 * @param {string} name The property name to filter on.
 * @param {*} value The value to compare against.
 * @return {ee.Filter} The constructed filter.
 * @export
 */
ee.Filter.lt = function(name, value) {
  var args = ee.arguments.extract(ee.Filter.lt, arguments);
  return /** @type {ee.Filter} */(
      ee.ApiFunction._call('Filter.lessThan', args['name'], args['value']));
};


/**
 * Filter on metadata greater than or equal to the given value.
 *
 * @param {string} name The property name to filter on.
 * @param {*} value The value to compare against.
 * @return {ee.Filter} The constructed filter.
 * @export
 */
ee.Filter.gte = function(name, value) {
  var args = ee.arguments.extract(ee.Filter.gte, arguments);
  return ee.Filter.lt(args['name'], args['value']).not();
};


/**
 * Filter on metadata greater than the given value.
 *
 * @param {string} name The property name to filter on.
 * @param {*} value The value to compare against.
 * @return {ee.Filter} The constructed filter.
 * @export
 */
ee.Filter.gt = function(name, value) {
  var args = ee.arguments.extract(ee.Filter.gt, arguments);
  return /** @type {ee.Filter} */(
      ee.ApiFunction._call('Filter.greaterThan', args['name'], args['value']));
};


/**
 * Filter on metadata less than or equal to the given value.
 *
 * @param {string} name The property name to filter on.
 * @param {*} value The value to compare against.
 * @return {ee.Filter} The constructed filter.
 * @export
 */
ee.Filter.lte = function(name, value) {
  var args = ee.arguments.extract(ee.Filter.lte, arguments);
  return ee.Filter.gt(args['name'], args['value']).not();
};


/**
 * Combine two or more filters using boolean AND.
 *
 * @param {...ee.Filter} var_args The filters to combine.
 * @return {ee.Filter} The constructed filter.
 * @export
 */
ee.Filter.and = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  return /** @type {ee.Filter} */(ee.ApiFunction._call('Filter.and', args));
};


/**
 * Combine two or more filters using boolean OR.
 *
 * @param {...ee.Filter} var_args The filters to combine.
 * @return {ee.Filter} The constructed filter.
 * @export
 */
ee.Filter.or = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  return /** @type {ee.Filter} */(ee.ApiFunction._call('Filter.or', args));
};


/**
 * Filter images by date. The start and end may be a Date, numbers
 * (interpreted as milliseconds since 1970-01-01T00:00:00Z), or strings (such
 * as '1996-01-01T08:00').
 *
 * @param {Date|string|number} start The inclusive start date.
 * @param {Date|string|number=} opt_end The optional exclusive end date. If not
 *     specified, a 1-millisecond range starting at 'start' is created.
 * @return {ee.Filter} The constructed filter.
 * @export
 */
ee.Filter.date = function(start, opt_end) {
  var args = ee.arguments.extract(ee.Filter.date, arguments);
  var range = ee.ApiFunction._call('DateRange', args['start'], args['end']);
  var filter = ee.ApiFunction._apply('Filter.dateRangeContains', {
    'leftValue': range,
    'rightField': 'system:time_start'
  });
  return /** @type {ee.Filter} */ (filter);
};


/**
 * Filter on metadata contained in a list.
 *
 * @param {string=} opt_leftField A selector for the left operand.
 *     Should not be specified if leftValue is specified.
 * @param {Array|Object=} opt_rightValue The value of the right operand.
 *     Should not be specified if rightField is specified.
 * @param {string=} opt_rightField A selector for the right operand.
 *     Should not be specified if rightValue is specified.
 * @param {Array|Object=} opt_leftValue The value of the left operand.
 *     Should not be specified if leftField is specified.
 * @return {ee.Filter} The constructed filter.
 * @export
 */
ee.Filter.inList = function(
    opt_leftField, opt_rightValue, opt_rightField, opt_leftValue) {
  var args = ee.arguments.extract(ee.Filter.inList, arguments);
  // Implement this in terms of listContains, with the arguments switched.
  // In listContains the list is on the left side, while in inList it's on
  // the right.
  var filter = ee.ApiFunction._apply('Filter.listContains', {
    'leftField': args['rightField'],
    'rightValue': args['leftValue'],
    'rightField': args['leftField'],
    'leftValue': args['rightValue']
  });
  return /** @type {ee.Filter} */ (filter);
};


/**
 * Filter on bounds.
 *
 * @param {ee.Geometry|ee.ComputedObject|ee.FeatureCollection} geometry
 *     The geometry, feature or collection to filter to.
 * @param {number|ee.ComputedObject=} opt_errorMargin An optional error margin.
 *     If a number, interpreted as sphere surface meters.
 * @return {ee.Filter} The modified filter.
 * @export
 */
ee.Filter.bounds = function(geometry, opt_errorMargin) {
  // Invoke geometry promotion then manually promote to a Feature.
  // TODO(user): Discuss whether filters should go back to working
  //              directly on geometries.
  return /** @type {ee.Filter} */ (
      ee.ApiFunction._apply('Filter.intersects', {
        'leftField': '.all',
        'rightValue': ee.ApiFunction._call('Feature', geometry),
        'maxError': opt_errorMargin
      }));
};


/** @override */
ee.Filter.prototype.name = function() {
  return 'Filter';
};


////////////////////////////////////////////////////////////////////////////////
//                             Deprecated methods.                            //
////////////////////////////////////////////////////////////////////////////////


/**
 * Filter on metadata.
 *
 * @param {string} name The property name to filter on.
 * @param {string} operator The type of comparison.  One of:
 *    "equals", "less_than", "greater_than", "contains", "begins_with",
 *    "ends_with", or any of these prefixed with "not_".
 * @param {*} value The value to compare against.
 * @return {ee.Filter} The constructed filter.
 * @export
 * @deprecated Use ee.Filter.eq(), ee.Filter.gte(), etc.
 */
ee.Filter.metadata = function(name, operator, value) {
  operator = operator.toLowerCase();

  // Check for negated filters.
  var negated = false;
  if (goog.string.startsWith(operator, 'not_')) {
    negated = true;
    operator = operator.substring(4);
  }

  // Convert the operator to a function.
  if (!(operator in ee.Filter.functionNames_)) {
    throw Error('Unknown filtering operator: ' + operator);
  }
  var funcName = 'Filter.' + ee.Filter.functionNames_[operator];
  var filter = /** @type {ee.Filter} */(
      ee.ApiFunction._call(funcName, name, value));

  return negated ? filter.not() : filter;
};


/**
 * Filter on metadata containing the given string.
 *
 * @param {string} name The property name to filter on.
 * @param {string} value The value to compare against.
 * @return {ee.Filter} The constructed filter.
 * @export
 * @deprecated Use ee.Filter.stringContains().
 */
ee.Filter.contains = function(name, value) {
  return /** @type {ee.Filter} */(
      ee.ApiFunction._call('Filter.stringContains', name, value));
};


/**
 * Filter on metadata not containing the given string.
 *
 * @param {string} name The property name to filter on.
 * @param {string} value The value to compare against.
 * @return {ee.Filter} The constructed filter.
 * @export
 * @deprecated Use ee.Filter.stringStartsWith(...).not().
 */
ee.Filter.not_contains = function(name, value) {
  return ee.Filter.contains(name, value).not();
};


/**
 * Filter on metadata begining with the given string.
 *
 * @param {string} name The property name to filter on.
 * @param {string} value The value to compare against.
 * @return {ee.Filter} The constructed filter.
 * @export
 * @deprecated Use ee.Filter.stringStartsWith().
 */
ee.Filter.starts_with = function(name, value) {
  return /** @type {ee.Filter} */(
      ee.ApiFunction._call('Filter.stringStartsWith', name, value));
};


/**
 * Filter on metadata not begining with the given string.
 *
 * @param {string} name The property name to filter on.
 * @param {string} value The value to compare against.
 * @return {ee.Filter} The constructed filter.
 * @export
 * @deprecated Use ee.Filter.stringStartsWith(...).not().
 */
ee.Filter.not_starts_with = function(name, value) {
  return ee.Filter.starts_with(name, value).not();
};


/**
 * Filter on metadata ending with the given string.
 *
 * @param {string} name The property name to filter on.
 * @param {string} value The value to compare against.
 * @return {ee.Filter} The constructed filter.
 * @export
 * @deprecated Use ee.Filter.stringEndsWith().
 */
ee.Filter.ends_with = function(name, value) {
  return /** @type {ee.Filter} */(
      ee.ApiFunction._call('Filter.stringEndsWith', name, value));
};


/**
 * Filter on metadata not ending with the given string.
 *
 * @param {string} name The property name to filter on.
 * @param {string} value The value to compare against.
 * @return {ee.Filter} The constructed filter.
 * @export
 * @deprecated Use ee.Filter.stringEndsWith(...).not().
 */
ee.Filter.not_ends_with = function(name, value) {
  return ee.Filter.ends_with(name, value).not();
};


/**
 * @see ee.Filter.eq
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.eq = function(var_args) {
  return this.append_(ee.Filter.eq.apply(null, [].slice.call(arguments)));
};


/**
 * @return {number} The number of predicates that have been added to this
 * filter. This does not count nested predicates.
 * @export
 * @deprecated This is an implementation detail that is subject to change.
 */
ee.Filter.prototype.length = function() {
  return this.filter_.length;
};


/**
 * @see ee.Filter.neq
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.neq = function(var_args) {
  return this.append_(ee.Filter.neq.apply(null, [].slice.call(arguments)));
};


/**
 * @see ee.Filter.lt
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.lt = function(var_args) {
  return this.append_(ee.Filter.lt.apply(null, [].slice.call(arguments)));
};


/**
 * @see ee.Filter.gte
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.gte = function(var_args) {
  return this.append_(ee.Filter.gte.apply(null, [].slice.call(arguments)));
};


/**
 * @see ee.Filter.gt
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.gt = function(var_args) {
  return this.append_(ee.Filter.gt.apply(null, [].slice.call(arguments)));
};


/**
 * @see ee.Filter.lte
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.lte = function(var_args) {
  return this.append_(ee.Filter.lte.apply(null, [].slice.call(arguments)));
};


/**
 * @see ee.Filter.contains
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.contains = function(var_args) {
  return this.append_(ee.Filter.contains.apply(null, [].slice.call(arguments)));
};


/**
 * @see ee.Filter.not_contains
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.not_contains = function(var_args) {
  return this.append_(
      ee.Filter.not_contains.apply(null, [].slice.call(arguments)));
};


/**
 * @see ee.Filter.starts_with
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.starts_with = function(var_args) {
  return this.append_(
      ee.Filter.starts_with.apply(null, [].slice.call(arguments)));
};


/**
 * @see ee.Filter.not_starts_with
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.not_starts_with = function(var_args) {
  return this.append_(
      ee.Filter.not_starts_with.apply(null, [].slice.call(arguments)));
};


/**
 * @see ee.Filter.ends_with
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.ends_with = function(var_args) {
  return this.append_(
      ee.Filter.ends_with.apply(null, [].slice.call(arguments)));
};


/**
 * @see ee.Filter.not_ends_with
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.not_ends_with = function(var_args) {
  return this.append_(
      ee.Filter.not_ends_with.apply(null, [].slice.call(arguments)));
};


/**
 * @see ee.Filter.and
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.and = function(var_args) {
  return this.append_(ee.Filter.and.apply(null, [].slice.call(arguments)));
};


/*
 * There is no prototype version of 'or', to avoid the abiguous syntax.
 * Example:  a.or(b), doesn't do what it looks like it would; it appends
 * "or(b)" to the list of filters that includes a, which is equal
 * to "and(a, b)", not "or(a,b)".
 */


/**
 * @see ee.Filter.date
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.date = function(var_args) {
  return this.append_(ee.Filter.date.apply(null, [].slice.call(arguments)));
};


/**
 * @see ee.Filter.inList
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.inList = function(var_args) {
  return this.append_(ee.Filter.inList.apply(null, [].slice.call(arguments)));
};


/**
 * @see ee.Filter.bounds
 * @param {...?} var_args
 * @return {ee.Filter} The modified filter.
 * @export
 * @deprecated Use the static version of this method.
 */
ee.Filter.prototype.bounds = function(var_args) {
  return this.append_(ee.Filter.bounds.apply(null, [].slice.call(arguments)));
};
