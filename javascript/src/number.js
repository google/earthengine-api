/**
 * @fileoverview A wrapper for numbers.
 */

goog.provide('ee.Number');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.rpc_node');
goog.requireType('ee.Encodable');
goog.requireType('ee.api');



/**
 * Constructs a new Number.
 *
 * @param {number|!Object} number A number or a computed object.
 *
 * @constructor
 * @extends {ee.ComputedObject}
 * @export
 */
ee.Number = function(number) {
  // Constructor safety.
  if (!(this instanceof ee.Number)) {
    return ee.ComputedObject.construct(ee.Number, arguments);
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

  if (typeof number === 'number') {
    ee.Number.base(this, 'constructor', null, null);
    this.number_ = /** @type {number} */ (number);
  } else if (number instanceof ee.ComputedObject) {
    ee.Number.base(this, 'constructor', number.func, number.args, number.varName, number.unbound);
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
 * @override
 */
ee.Number.prototype.encode = function(encoder) {
  if (typeof this.number_ === 'number') {
    return this.number_;
  } else {
    return ee.Number.base(this, 'encode', encoder);
  }
};


/** @override @return {!ee.api.ValueNode} */
ee.Number.prototype.encodeCloudValue = function(
    /** !ee.Encodable.Serializer */ serializer) {
  if (typeof this.number_ === 'number') {
    return ee.rpc_node.reference(serializer.makeReference(this.number_));
  } else {
    return ee.Number.base(this, 'encodeCloudValue', serializer);
  }
};


/**
 * @override
 */
ee.Number.prototype.name = function() {
  return 'Number';
};
