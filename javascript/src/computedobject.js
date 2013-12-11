/**
 * @fileoverview A representation of a computed earthengine object.
 *
 */

goog.provide('ee.ComputedObject');

goog.require('ee.Encodable');
goog.require('ee.Serializer');
goog.require('ee.data');



/**
 * An object to represent a computed Earth Engine object, a base for most
 * API objects.
 *
 * This exists to wrap the return values of algorithms that produce
 * unrecognized types with the minimal functionality necessary to
 * interact well with the rest of the API.
 *
 * @param {ee.Function} func The function called to compute this
 *     object, either as an Algorithm name or an ee.Function object.
 * @param {Object} args A dictionary of arguments to pass to the specified
 *     function. Note that the caller is responsible for promoting the
 *     arguments to the correct types.
 * @constructor
 * @extends {ee.Encodable}
 */
ee.ComputedObject = function(func, args) {
  // Constructor safety.
  if (!(this instanceof ee.ComputedObject)) {
    return new ee.ComputedObject(func, args);
  }

  /**
   * The Function called to compute this object.
   * @type {ee.Function}
   * @protected
   */
  this.func = func;

  /**
   * The arguments passed to the function.
   * @type {Object}
   * @protected
   */
  this.args = args;
};
goog.inherits(ee.ComputedObject, ee.Encodable);
// Exporting manually to avoid marking the class public in the docs.
goog.exportSymbol('ee.ComputedObject', ee.ComputedObject);


/**
 * An imperative function that returns information about this object (usually
 * the value) via a synchronous AJAX call.
 *
 * @param {function(?)=} opt_callback An optional callback.  If not
 *     supplied, the call is made synchronously.
 * @return {*} The computed value of this object.
 * @export
 */
ee.ComputedObject.prototype.getInfo = function(opt_callback) {
  return ee.data.getValue({
    'json': this.serialize()
  }, opt_callback);
};


/** @inheritDoc */
ee.ComputedObject.prototype.encode = function(encoder) {
  var encodedArgs = {};
  for (var name in this.args) {
    if (goog.isDef(this.args[name])) {
      encodedArgs[name] = encoder(this.args[name]);
    }
  }
  var result = {
    'type': 'Invocation',
    'arguments': encodedArgs
  };
  var func = encoder(this.func);
  result[goog.isString(func) ? 'functionName' : 'function'] = func;
  return result;
};


/**
 * @return {string} The serialized representation of this object.
 * @export
 */
ee.ComputedObject.prototype.serialize = function() {
  return ee.Serializer.toJSON(this);
};


/**
 * @return {string} A human-readable representation of the object.
 * @export
 */
ee.ComputedObject.prototype.toString = function() {
  return 'ee.' + this.name() + '(' + ee.Serializer.toReadableJSON(this) + ')';
};


/**
 * @return {string} The name of the object, used in toString().
 * @protected
 */
ee.ComputedObject.prototype.name = function() {
  return 'ComputedObject';
};


/**
 * Cast a ComputedObject to a new instance of the same class as this.
 * @param {ee.ComputedObject} obj The object to cast.
 * @return {?} The converted instance.
 * @protected
 */
ee.ComputedObject.prototype.cast = function(obj) {
  if (obj instanceof this.constructor) {
    return obj;
  } else {
    // Assumes all subclass constructors can be called with a
    // ComputedObject as their first parameter.
    return new this.constructor(obj);
  }
};
