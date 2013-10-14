/**
 * @fileoverview A wrapper for numbers.
 */

goog.provide('ee.Number');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');



/**
 * Constructs a new Number.
 *
 * @param {number|Object} number A number or a computed object.
 *
 * @constructor
 * @extends {ee.ComputedObject}
 * @export
 */
ee.Number = function(number) {
  // Constructor safety.
  if (!(this instanceof ee.Number)) {
    return new ee.Number(number);
  } else if (number instanceof ee.Number) {
    return number;
  }

  ee.Number.initialize();

  /**
   * The internal rerpresentation of this number.
   *
   * @type {number?}
   * @private
   */
  this.number_;

  if (goog.isNumber(number)) {
    goog.base(this, null, null);
    this.number_ = /** @type {number} */ (number);
  } else if (number instanceof ee.ComputedObject) {
    goog.base(this, number.func, number.args);
    this.number_ = null;
  } else {
    throw Error('Invalid argument specified for ee.Number(): ' + number);
  }
};
goog.inherits(ee.Number, ee.ComputedObject);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.Number.initialized_ = false;


/** Imports API functions to this class. */
ee.Number.initialize = function() {
  if (!ee.Number.initialized_) {
    ee.ApiFunction.importApi(ee.Number, 'Number', 'Number');
    ee.Number.initialized_ = true;
  }
};


/** Removes imported API functions from this class. */
ee.Number.reset = function() {
  ee.ApiFunction.clearApi(ee.Number);
  ee.Number.initialized_ = false;
};


/**
 * @inheritDoc
 */
ee.Number.prototype.encode = function(encoder) {
  if (goog.isNumber(this.number_)) {
    return this.number_;
  } else {
    return goog.base(this, 'encode', encoder);
  }
};


/**
 * @inheritDoc
 */
ee.Number.prototype.name = function() {
  return 'Number';
};
