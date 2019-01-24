/**
 * @fileoverview An interface implemented by serializable objects.
 */

goog.provide('ee.Encodable');



/**
 * An interface implemented by objects that know how to serialize themselves.
 * Not an actual Closure interface because we need instanceof to work.
 * @constructor
 */
ee.Encodable = function() {};


/**
 * Encodes an object in a format compatible with ee.Serializer.encode().
 * @param {function(*): *} encoder A function that can be called to encode
 *    the components of an object.
 * @return {*} The encoded form of the object.
 */
ee.Encodable.prototype.encode = goog.abstractMethod;
