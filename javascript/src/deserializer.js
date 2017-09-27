/**
 * @fileoverview A deserializer that decodes EE object trees from JSON DAGs.
 *
 */

goog.provide('ee.Deserializer');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.CustomFunction');
goog.require('ee.Date');
goog.require('ee.Encodable');
goog.require('ee.Function');
goog.require('ee.Geometry');
goog.require('goog.array');
goog.require('goog.object');



/**
 * A deserializer for EE object trees.
 * @constructor
 */
ee.Deserializer = function() {};
// Exporting manually to avoid marking the class public in the docs.
goog.exportSymbol('ee.Deserializer', ee.Deserializer);


/**
 * Deserialize an object from a JSON string appropriate for API calls.
 * @param {string} json The JSON represenation of the input.
 * @return {*} The deserialized object.
 * @export
 */
ee.Deserializer.fromJSON = function(json) {
  return ee.Deserializer.decode(JSON.parse(json));
};


/**
 * Decodes an object previously encoded using the EE API v2 (DAG) format.
 *
 * @param {*} json The serialied object to decode.
 * @return {*} The decoded object.
 * @export
 */
ee.Deserializer.decode = function(json) {
  var namedValues = {};

  // Incrementally decode scope entries if there are any.
  if (goog.isObject(json) && json['type'] == 'CompoundValue') {
    var scopes = json['scope'];
    for (var i = 0; i < scopes.length; i++) {
      var key = scopes[i][0];
      var value = scopes[i][1];
      if (key in namedValues) {
        throw Error('Duplicate scope key "' + key + '" in scope #' + i + '.');
      }
      namedValues[key] = ee.Deserializer.decodeValue_(value, namedValues);
    }
    json = json['value'];
  }

  // Decode the final value.
  return ee.Deserializer.decodeValue_(json, namedValues);
};


/**
 * Decodes an object previously encoded using the EE API v2 (DAG) format. This
 * uses a provided scopre for ValueRef lookup and does not not allow the input
 * to be a CompoundValue.
 *
 * @param {*} json The serialied object to decode.
 * @param {Object} namedValues The objects that can be referenced by ValueRefs.
 * @return {*} The decoded object.
 * @private
 */
ee.Deserializer.decodeValue_ = function(json, namedValues) {
  // Check for primitive values.
  if (goog.isNull(json) ||
      goog.isNumber(json) ||
      goog.isBoolean(json) ||
      goog.isString(json)) {
    return json;
  }

  // Check for array values.
  if (goog.isArray(json)) {
    return goog.array.map(json, function(element) {
      return ee.Deserializer.decodeValue_(element, namedValues);
    });
  }

  // Ensure that we've got a proper object at this point.
  if (!goog.isObject(json) || goog.isFunction(json)) {
    throw Error('Cannot decode object: ' + json);
  }

  // Check for explicitly typed values.
  var typeName = json['type'];
  switch (typeName) {
    case 'ValueRef':
      if (json['value'] in namedValues) {
        return namedValues[json['value']];
      } else {
        throw Error('Unknown ValueRef: ' + json);
      }
    case 'ArgumentRef':
      var varName = json['value'];
      if (!goog.isString(varName)) {
        throw Error('Invalid variable name: ' + varName);
      }
      return ee.CustomFunction.variable(Object, varName);
    case 'Date':
      var microseconds = json['value'];
      if (!goog.isNumber(microseconds)) {
        throw Error('Invalid date value: ' + microseconds);
      }
      return new ee.Date(microseconds / 1000);
    case 'Bytes':
      var result = new ee.Encodable();
      result.encode = function(encoder) { return json; };
      return result;
    case 'Invocation':
      var func;
      if ('functionName' in json) {
        func = ee.ApiFunction.lookup(json['functionName']);
      } else {
        func = ee.Deserializer.decodeValue_(json['function'], namedValues);
      }
      var args = goog.object.map(json['arguments'], function(element) {
        return ee.Deserializer.decodeValue_(element, namedValues);
      });
      if (func instanceof ee.Function) {
        return func.apply(args);
      } else if (func instanceof ee.ComputedObject) {
        // We have to allow ComputedObjects for cases where invocations
        // return a function, e.g. Image.parseExpression().
        return new ee.ComputedObject(/** @type {?} */(func), args);
      } else {
        throw Error('Invalid function value: ' + json['function']);
      }
    case 'Dictionary':
      return goog.object.map(json['value'], function(element) {
        return ee.Deserializer.decodeValue_(element, namedValues);
      });
    case 'Function':
      var body = ee.Deserializer.decodeValue_(json['body'], namedValues);
      var signature = {
        'name': '',
        'args': goog.array.map(json['argumentNames'], function(argName) {
          return {
            'name': argName,
            'type': 'Object',
            'optional': false
          };
        }),
        'returns': 'Object'
      };
      return new ee.CustomFunction(signature, function() { return body; });
    case 'Point':
    case 'MultiPoint':
    case 'LineString':
    case 'MultiLineString':
    case 'Polygon':
    case 'MultiPolygon':
    case 'LinearRing':
    case 'GeometryCollection':
      return new ee.Geometry(json);
    case 'CompoundValue':
      throw Error('Nested CompoundValues are disallowed.');
    default:
      throw Error('Unknown encoded object type: ' + typeName);
  }
};
