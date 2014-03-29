/**
 * @fileoverview A wrapper for strings.
 */

goog.provide('ee.String');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');



/**
 * Constructs a new String.
 *
 * @param {string|Object} string A string or a computed object.
 *
 * @constructor
 * @extends {ee.ComputedObject}
 * @export
 */
ee.String = function(string) {
  // Constructor safety.
  if (!(this instanceof ee.String)) {
    return ee.ComputedObject.construct(ee.String, arguments);
  } else if (string instanceof ee.String) {
    return string;
  }

  ee.String.initialize();

  /**
   * The internal rerpresentation of this string.
   *
   * @type {string?}
   * @private
   */
  this.string_;

  if (goog.isString(string)) {
    goog.base(this, null, null);
    this.string_ = /** @type {string} */ (string);
  } else if (string instanceof ee.ComputedObject) {
    goog.base(this, string.func, string.args, string.varName);
    this.string_ = null;
  } else {
    throw Error('Invalid argument specified for ee.String(): ' + string);
  }
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


/** @inheritDoc */
ee.String.prototype.encode = function(encoder) {
  if (goog.isString(this.string_)) {
    return this.string_;
  } else {
    return goog.base(this, 'encode', encoder);
  }
};


/** @inheritDoc */
ee.String.prototype.name = function() {
  return 'String';
};
