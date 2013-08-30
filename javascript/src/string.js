/**
 * @fileoverview A wrapper for strings.
 */

goog.provide('ee.String');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('goog.array');
goog.require('goog.string');



/**
 * Constructs a new String.
 *
 * @param {string|Object=} string A string or a computed object.
 *
 * @constructor
 * @extends {ee.ComputedObject}
 */
ee.String = function(string) {
  // Constructor safety.
  if (!(this instanceof ee.String)) {
    return new ee.String(string);
  } else if (string instanceof ee.String) {
    return string;
  }

  ee.String.initialize();

  if (goog.isString(string)) {
    goog.base(this, null, null);
  } else if (string instanceof ee.ComputedObject) {
    goog.base(this, string.func, string.args);
  } else {
    throw Error('Invalid argument specified for ee.String(): ' + string);
  }

  /**
   * The internal rerpresentation of this string.
   *
   * @type {string|Object}
   * @private
   */
  this.string_ = string;
};
goog.inherits(ee.String, ee.ComputedObject);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.String.initialized_ = false;


/** Imports API functions to this class. */
ee.String.initialize = function() {
  if (!ee.String.initialized_) {
    ee.ApiFunction.importApi(ee.String, 'String', 'String');
    ee.String.initialized_ = true;
  }
};


/** Removes imported API functions from this class. */
ee.String.reset = function() {
  ee.ApiFunction.clearApi(ee.String);
  ee.String.initialized_ = false;
};


/**
 * @param {function(*): *} encoder A function that can be called to encode
 *    the components of an object.
 * @return {string|Object} A representation of the string.
 */
ee.String.prototype.encode = function(encoder) {
  if (goog.isString(this.string_)) {
    return this.string_;
  } else {
    return /** @type ee.ComputedObject */(this.string_).encode(encoder);
  }
};


/**
 * @return {string} The name of the object, used in toString().
 * @protected
 */
ee.String.prototype.name = function() {
  return 'String';
};


// Exported symbols
goog.exportSymbol('ee.String', ee.String);
goog.exportProperty(ee.String.prototype, 'encode',
                    ee.String.prototype.encode);
