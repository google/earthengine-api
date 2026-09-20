/**
 * @fileoverview A wrapper for Bytes.
 *
 */

goog.provide('ee.Bytes');

goog.require('ee.Encodable');
goog.require('ee.api');

/**
 * A wrapper for Bytes.
 * @param {string|!ee.Bytes} base64String The base64 string to wrap.
 * @constructor
 * @extends {ee.Encodable}
 * @export
 */
ee.Bytes = function(base64String) {
  if (!(this instanceof ee.Bytes)) {
    return new ee.Bytes(base64String);
  } else if (base64String instanceof ee.Bytes) {
    return base64String;
  }
  /** @export {string} */
  this.value = base64String;
};

goog.inherits(ee.Bytes, ee.Encodable);

/**
 * @override
 * @param {function(*): *} encoder The serializer to use.
 * @return {!Object} The encoded object.
 */
ee.Bytes.prototype.encode = function(encoder) {
  return {
    'type': 'Bytes',
    'value': this.value
  };
};

/**
 * @override
 * @param {!ee.Encodable.Serializer} serializer The serializer to use.
 * @return {!ee.api.ValueNode} The encoded object.
 */
ee.Bytes.prototype.encodeCloudValue = function(serializer) {
  return new ee.api.ValueNode({'bytesValue': this.value});
};
