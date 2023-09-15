/**
 * @fileoverview A wrapper for Date.
 *
 * We don't autogenerate this class because we want the constructor
 * to promote by pushing things through the server-side Date() function.
 */

goog.provide('ee.Date');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.Types');
goog.require('ee.arguments');



/**
 * Constructs a new Date object.
 *
 * @param {number|String|ee.ComputedObject|Date} date The date to convert,
 *     one of:
 *     a number (number of milliseconds since the epoch),
 *     an ISO Date string,
 *     a JavaScript Date
 *     or a ComputedObject.
 * @param {string=} opt_tz An optional timezone only to be used with a
 *    string date.
 *
 * @constructor
 * @extends {ee.ComputedObject}
 * @export
 */
ee.Date = function(date, opt_tz) {
  // Note: We don't autoconstruct this class because we want all objects to go
  // through the server-side constructor.

  // Constructor safety.
  if (!(this instanceof ee.Date)) {
    return ee.ComputedObject.construct(ee.Date, arguments);
  } else if (date instanceof ee.Date) {
    return date;
  }

  ee.Date.initialize();

  var jsArgs = ee.arguments.extractFromFunction(ee.Date, arguments);
  date = jsArgs['date'];
  var tz = jsArgs['tz'];

  var func = new ee.ApiFunction('Date');
  var args = {};
  var varName = null;
  if (ee.Types.isString(date)) {
    args['value'] = date;
    if (tz) {
      if (ee.Types.isString(tz)) {
        args['timeZone'] = tz;
      } else {
        throw Error(
            'Invalid argument specified for ee.Date(..., opt_tz): ' + tz);
      }
    }
  } else if (ee.Types.isNumber(date)) {
    args['value'] = date;
  } else if (goog.isDateLike(date)) {
    args['value'] = Math.floor(/** @type {Date} */(date).getTime());
  } else if (date instanceof ee.ComputedObject) {
    if (date.func && date.func.getSignature()['returns'] == 'Date') {
      // If it's a call that's already returning a Date, just cast.
      func = date.func;
      args = date.args;
      varName = date.varName;
    } else {
      args['value'] = date;
    }
  } else {
    throw Error('Invalid argument specified for ee.Date(): ' + date);
  }
  ee.Date.base(this, 'constructor', func, args, varName);
};
goog.inherits(ee.Date, ee.ComputedObject);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.Date.initialized_ = false;


/** Imports API functions to this class. */
ee.Date.initialize = function() {
  if (!ee.Date.initialized_) {
    ee.ApiFunction.importApi(ee.Date, 'Date', 'Date');
    ee.Date.initialized_ = true;
  }
};


/** Removes imported API functions from this class. */
ee.Date.reset = function() {
  ee.ApiFunction.clearApi(ee.Date);
  ee.Date.initialized_ = false;
};


/**
 * @override
 */
ee.Date.prototype.name = function() {
  return 'Date';
};
