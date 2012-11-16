// Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview  A patched version of goog.json.Serializer.
 *
 * This version of goog.json.Serializer checks each object to see if it has
 * a serialize method.  If so, it uses that to do the serialization.
 * Otherwise, it uses the default serialization.
 *
 */

goog.provide('ee.Serializer');

goog.require('goog.json.Serializer');

/**
 * Class that isused to serialize JSON objects to a string.
 *
 * @param {?goog.json.Replacer=} opt_replace A JSON replacer.
 * @constructor
 * @extends {goog.json.Serializer}
 */
ee.Serializer = function(opt_replace) {
  goog.base(this, opt_replace);
};
goog.inherits(ee.Serializer, goog.json.Serializer);

/**
 * Convert an object to JSON.
 * @param {*} obj The object to Serialize.
 * @return {string} A JSON represenation of the input.
 */
ee.Serializer.toJSON = function(obj) {
  return (new ee.Serializer()).serialize(obj);
};

/**
 * Convert an object to human-friendly JSON, if possible.
 * @param {*} obj The object to convert.
 * @return {string} A human-friendly JSON represenation of the input.
 */
ee.Serializer.toReadableJSON = function(obj) {
  var json = ee.Serializer.toJSON(obj);
  if ('JSON' in window) {
    // All modern browsers; beautify.
    return window['JSON'].stringify(
        window['JSON'].parse(json), null, '  ');
  }
  return json;
};

/**
 * A monkey patch for goog.json.serialize, so it will respect an object's
 * serialize() method.
 * @param {Object} obj The object to serialize.
 * @param {Array} sb Array used as a string builder.
 * @private
 * @override
 * @suppress {accessControls}
 */
ee.Serializer.prototype.serializeObject_ = function(obj, sb) {
  if ('serialize' in obj) {
    sb.push(obj.serialize());
  } else {
    goog.base(this, 'serializeObject_', obj, sb);
  }
};

goog.exportSymbol('ee.Serializer', ee.Serializer);
goog.exportSymbol('ee.Serializer.toJSON', ee.Serializer.toJSON);
goog.exportSymbol('ee.Serializer.toReadableJSON', ee.Serializer.toReadableJSON);
