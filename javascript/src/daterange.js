/**
 * @fileoverview A wrapper for DateRange.
 */

goog.provide('ee.DateRange');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.Date');
goog.require('ee.arguments');



/**
 * Creates a DateRange with the given start (inclusive) and end (exclusive),
 * which may be Dates, numbers (interpreted as milliseconds since
 * 1970-01-01T00:00:00Z), or strings (such as '1996-01-01T08:00').
 * If 'end' is not specified, a 1-millisecond range starting at 'start' is
 * created.
 *
 * @param {number|string|!ee.ComputedObject|!ee.Date} start The start date.
 * @param {number|string|!ee.ComputedObject|!ee.Date=} opt_end The end date,
 *     exclusive.
 * @param {string=} opt_tz An optional timezone only to be used
 *     with a string date.
 * @constructor
 * @extends {ee.ComputedObject}
 * @export
 */
ee.DateRange = function(start, opt_end, opt_tz) {

  // Constructor safety.
  if (!(this instanceof ee.DateRange)) {
    return ee.ComputedObject.construct(ee.DateRange, arguments);
  } else if (start instanceof ee.DateRange) {
    return start;
  }

  ee.DateRange.initialize();

  const jsArgs = ee.arguments.extractFromFunction(ee.DateRange, arguments);
  const func = new ee.ApiFunction('DateRange');
  const varName = null;

  ee.DateRange.base(this, 'constructor', func, jsArgs, varName);
};
goog.inherits(ee.DateRange, ee.ComputedObject);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.DateRange.initialized_ = false;


/** Imports API functions to this class. */
ee.DateRange.initialize = function() {
  if (!ee.DateRange.initialized_) {
    ee.ApiFunction.importApi(ee.DateRange, 'DateRange', 'DateRange');
    ee.DateRange.initialized_ = true;
  }
};


/** Removes imported API functions from this class. */
ee.DateRange.reset = function() {
  ee.ApiFunction.clearApi(ee.DateRange);
  ee.DateRange.initialized_ = false;
};


/**
 * @override
 */
ee.DateRange.prototype.name = function() {
  return 'DateRange';
};
