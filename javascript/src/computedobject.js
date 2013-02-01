/**
 * @fileoverview A representation of a computed earthengine object.
 *
 */
goog.provide('ee.ComputedObject');

goog.require('ee');
goog.require('ee.Serializer');
goog.require('ee.data');



/**
 * An object to represent a computed Earth Engine object.
 *
 * This exists to wrap the return values of algorithms that produce
 * unrecognized types with the minimal functionality necessary to
 * interact well with the rest of the API.
 *
 * @constructor
 * @param {*} args A block of JSON typically produced by another EE object.
 *     In most cases, this will be the result of a call to an EE algorithm
 *     that returns a type other than those recognized by algorithms.promote.
 */
ee.ComputedObject = function(args) {
  // Constructor safety.
  if (!(this instanceof ee.ComputedObject)) {
    return new ee.ComputedObject(args);
  }
  ee.initialize();

  if (args instanceof ee.ComputedObject) {
    // The arguments are already an object. Just return it.
    return args;
  }
  this.description_ = /** @type {Object} */ (args);
};


/**
 * An imperative function that returns information about this object
 * (usually the value) via a synchronous AJAX call.
 *
 * @return {*} The object can evaluate to anything.
 */
ee.ComputedObject.prototype.getInfo = function() {
  return ee.data.getValue({
    'json': this.serialize()
  });
};


/**
 * JSON serializer.
 *
 * @return {string} The serialized representation of this object.
 */
ee.ComputedObject.prototype.serialize = function() {
  return ee.Serializer.toJSON(this.description_);
};


/**
 * @return {string} The object's JSON as a human-readable string.
 */
ee.ComputedObject.prototype.toString = function() {
  var json = ee.Serializer.toReadableJSON(this.description_);
  return 'ee.ComputedObject(' + json + ')';
};

// Explicit exports.
goog.exportSymbol('ee.ComputedObject', ee.ComputedObject);
goog.exportProperty(ee.ComputedObject.prototype,
                    'getInfo', ee.ComputedObject.prototype.getInfo);
goog.exportProperty(ee.ComputedObject.prototype,
                    'serialize', ee.ComputedObject.prototype.serialize);
goog.exportProperty(ee.ComputedObject,
                    'toString', ee.ComputedObject.toString);
