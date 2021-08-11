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
goog.require('ee.api');
goog.require('ee.apiclient');
goog.require('ee.rpc_node');
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
 * @param {string} json The JSON representation of the input.
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
  if (('result' in json) && ('values' in json)) {
    return ee.Deserializer.decodeCloudApi(json);
  }
  const namedValues = {};

  // Incrementally decode scope entries if there are any.
  if (goog.isObject(json) && json['type'] === 'CompoundValue') {
    const scopes = json['scope'];
    for (let i = 0; i < scopes.length; i++) {
      const key = scopes[i][0];
      const value = scopes[i][1];
      if (key in namedValues) {
        throw new Error(`Duplicate scope key "${key}" in scope #${i}.`);
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
 * @param {!Object} namedValues The objects that can be referenced by ValueRefs.
 * @return {*} The decoded object.
 * @private
 */
ee.Deserializer.decodeValue_ = function(json, namedValues) {
  // Check for primitive values.
  if (json === null || typeof json === 'number' || typeof json === 'boolean' ||
      typeof json === 'string') {
    return json;
  }

  // Check for array values.
  if (Array.isArray(json)) {
    return goog.array.map(json, function(element) {
      return ee.Deserializer.decodeValue_(element, namedValues);
    });
  }

  // Ensure that we've got a proper object at this point.
  if (!goog.isObject(json) || typeof json === 'function') {
    throw new Error('Cannot decode object: ' + json);
  }

  // Check for explicitly typed values.
  const typeName = json['type'];
  switch (typeName) {
    case 'ValueRef':
      if (json['value'] in namedValues) {
        return namedValues[json['value']];
      } else {
        throw new Error('Unknown ValueRef: ' + json);
      }
    case 'ArgumentRef':
      const varName = json['value'];
      if (typeof varName !== 'string') {
        throw new Error('Invalid variable name: ' + varName);
      }
      return ee.CustomFunction.variable(Object, varName);
    case 'Date':
      const microseconds = json['value'];
      if (typeof microseconds !== 'number') {
        throw new Error('Invalid date value: ' + microseconds);
      }
      return new ee.Date(microseconds / 1000);
    case 'Bytes':
      const bytes = /** @type {string} */(json);
      return ee.Deserializer.roundTrip_(
          new ee.api.ValueNode({bytesValue: bytes}), bytes);
    case 'Invocation':
      let func;
      if ('functionName' in json) {
        func = ee.ApiFunction.lookup(json['functionName']);
      } else {
        func = ee.Deserializer.decodeValue_(json['function'], namedValues);
      }
      const args = goog.object.map(json['arguments'], function(element) {
        return ee.Deserializer.decodeValue_(element, namedValues);
      });
      return ee.Deserializer.invocation_(func, args);
    case 'Dictionary':
      return goog.object.map(json['value'], function(element) {
        return ee.Deserializer.decodeValue_(element, namedValues);
      });
    case 'Function':
      const body = ee.Deserializer.decodeValue_(json['body'], namedValues);
      const signature = {
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
      throw new Error('Nested CompoundValues are disallowed.');
    default:
      throw new Error('Unknown encoded object type: ' + typeName);
  }
};


/**
 * Ensures that values can still be round-tripped, for cases that are never
 * generated by production client code.
 * @param {!ee.api.ValueNode} node Node in the serialized object tree.
 * @param {string} value JSON representation of the value.
 * @return {!ee.Encodable}
 * @private
 */
ee.Deserializer.roundTrip_ = function(node, value) {
  class Reencoder extends ee.Encodable {
    /** @override */ encode(encoder) {
      return value;
    }
    /** @override */ encodeCloudValue(encoder) {
      return node;
    }
  }
  return new Reencoder();
};


/**
 * Creates an EE object that represents the application of `func` to `args`.
 * @param {*} func Object to be treated as a callable.
 * @param {!Object<string, *>} args Key-value map of arguments.
 * @return {!ee.ComputedObject}
 * @private
 */
ee.Deserializer.invocation_ = function(func, args) {
  if (func instanceof ee.Function) {
    return func.apply(args);  // Returns ComputedObject
  } else if (func instanceof ee.ComputedObject) {
    // We have to allow ComputedObjects for cases where invocations
    // return a function, e.g. Image.parseExpression().
    const funcComputed = /** @type {!ee.ComputedObject} */(func);
    class ComputedFunction extends ee.Function {
      /** @override @return {*} */
      encode(/** function(*):* */ encoder) {
        return funcComputed.encode(encoder);
      }
      /** @override @return {!ee.api.ValueNode} */
      encodeCloudInvocation(
          /** !ee.Encodable.Serializer */ serializer, /** ? */ args) {
        return ee.rpc_node.functionByReference(
            serializer.makeReference(funcComputed), args);
      }
    }
    // Don't need to set function signature, since we don't have to re-promote.
    return new ee.ComputedObject(new ComputedFunction(), args);
  }
  throw new Error('Invalid function value');
};


/**
 * Deserializes an object from the JSON string used in Cloud API calls.
 * @param {string} json The JSON representation of the input.
 * @return {*} The deserialized object.
 * @export
 */
ee.Deserializer.fromCloudApiJSON = function(json) {
  return ee.Deserializer.decodeCloudApi(JSON.parse(json));
};


/**
 * Decodes an object previously encoded using the EE Cloud API format.
 * @param {*} json The serialized object to decode.
 * @return {*} The decoded object.
 * @export
 */
ee.Deserializer.decodeCloudApi = function(json) {
  const expression = ee.apiclient.deserialize(ee.api.Expression, json);

  const decoded = {};
  const lookup = (reference, kind) => {
    if (!(reference in decoded)) {
      if (!(reference in expression.values)) {
        throw new Error(`Cannot find ${kind} ${reference}`);
      }
      decoded[reference] = decode(expression.values[reference]);
    }
    return decoded[reference];
  };

  const decode = (node) => {
    if (node.constantValue !== null) {
      return node.constantValue;
    } else if (node.arrayValue !== null) {
      return node.arrayValue.values.map(decode);
    } else if (node.dictionaryValue !== null) {
      return goog.object.map(node.dictionaryValue.values, decode);
    } else if (node.argumentReference !== null) {
      return ee.CustomFunction.variable(Object, node.argumentReference);
    } else if (node.functionDefinitionValue !== null) {
      return decodeFunctionDefinition(node.functionDefinitionValue);
    } else if (node.functionInvocationValue !== null) {
      return decodeFunctionInvocation(node.functionInvocationValue);
    } else if (node.bytesValue !== null) {
      return ee.Deserializer.roundTrip_(
          new ee.api.ValueNode({bytesValue: node.bytesValue}), node.bytesValue);
    } else if (node.integerValue !== null) {
      return ee.Deserializer.roundTrip_(
          new ee.api.ValueNode({integerValue: node.integerValue}),
          node.integerValue);
    } else if (node.valueReference !== null) {
      return lookup(node.valueReference, 'reference');
    }
    return null;  // From the null constantValue
  };

  const decodeFunctionDefinition = (defined) => {
    const body = lookup(defined.body, 'function body');
    const args = defined.argumentNames.map(
        name => ({name, type: 'Object', optional: false}));
    const signature = {args, name: '', returns: 'Object'};
    return new ee.CustomFunction(signature, () => body);
  };

  const decodeFunctionInvocation = (invoked) => {
    const func = invoked.functionReference ?
        lookup(invoked.functionReference, 'function') :
        ee.ApiFunction.lookup(invoked.functionName);
    const args = goog.object.map(invoked.arguments, decode);
    return ee.Deserializer.invocation_(func, args);
  };

  return lookup(expression.result, 'result value');
};
