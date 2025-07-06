/**
 * @fileoverview A wrapper for strings.
 */

goog.provide('ee.String');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.rpc_node');
goog.requireType('ee.Encodable');
goog.requireType('ee.api');



/**
 * Constructs a new String.
 *
 * @param {string|!Object} string A string or a computed object.
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

  if (typeof (string) === 'string') {
    ee.String.base(this, 'constructor', null, null);
    this.string_ = /** @type {string} */ (string);
  } else if (string instanceof ee.ComputedObject) {
    this.string_ = null;
    if (string.func && string.func.getSignature()['returns'] == 'String') {
      // If it's a call that's already returning a String, just cast.
      ee.String.base(this, 'constructor', string.func, string.args, string.varName, string.unbound);
    } else {
      ee.String.base(this, 'constructor', new ee.ApiFunction('String'), {'input': string}, null, string.unbound);
    }
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


/** @override */
ee.String.prototype.encode = function(encoder) {
  if (typeof (this.string_) === 'string') {
    return this.string_;
  } else {
    return ee.String.base(this, 'encode', encoder);
  }
};


/** @override @return {!ee.api.ValueNode} */
ee.String.prototype.encodeCloudValue = function(
    /** !ee.Encodable.Serializer */ serializer) {
  if (typeof (this.string_) === 'string') {
    return ee.rpc_node.reference(serializer.makeReference(this.string_));
  } else {
    return ee.String.base(this, 'encodeCloudValue', serializer);
  }
};


/** @override */
ee.String.prototype.name = function() {
  return 'String';
};
