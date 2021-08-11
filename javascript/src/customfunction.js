/**
 * @fileoverview An object representing a custom EE Function.
 */

goog.provide('ee.CustomFunction');

goog.require('ee.ComputedObject');
goog.require('ee.Function');
goog.require('ee.Number');
goog.require('ee.Serializer');
goog.require('ee.String');
goog.require('ee.Types');
goog.require('ee.rpc_node');
goog.require('goog.array');
goog.requireType('ee.Encodable');
goog.requireType('ee.api');



/**
 * Creates a function defined by a given expression with unbound variables.
 * The expression is created by evaluating the given JavaScript function
 * using variables as placeholders.
 *
 * @param {ee.Function.Signature} signature The function's signature. If any of
 *     the argument names are null, their names will be generated
 *     deterministically, based on the body.
 * @param {Function} body The JavaScript function to evaluate.
 *
 * @constructor
 * @extends {ee.Function}
 */
ee.CustomFunction = function(signature, body) {
  if (!(this instanceof ee.CustomFunction)) {
    return ee.ComputedObject.construct(ee.CustomFunction, arguments);
  }

  var vars = [];
  var args = signature['args'];
  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    var type = ee.Types.nameToClass(arg['type']);
    vars.push(ee.CustomFunction.variable(type, arg['name']));
  }

  // Check that the method returns something, before we try
  // encoding it in resolveNamelessArgs_().
  if (body.apply(null, vars) === undefined) {
    throw Error('User-defined methods must return a value.');
  }

  /**
   * The signature of the function.
   * @type {ee.Function.Signature}
   * @private
   */
  this.signature_ = ee.CustomFunction.resolveNamelessArgs_(
      signature, vars, body);

  /**
   * The function evaluated using placeholders.
   * @type {*}
   * @private
   */
  this.body_ = body.apply(null, vars);
};
goog.inherits(ee.CustomFunction, ee.Function);
// Exporting manually to avoid marking the class public in the docs.
goog.exportSymbol('ee.CustomFunction', ee.CustomFunction);


/** @override */
ee.CustomFunction.prototype.encode = function(encoder) {
  return {
    'type': 'Function',
    'argumentNames': goog.array.map(
        this.signature_['args'], function(arg) { return arg['name']; }),
    'body': encoder(this.body_)
  };
};


/** @override @return {!ee.api.ValueNode} */
ee.CustomFunction.prototype.encodeCloudValue = function(
    /** !ee.Encodable.Serializer */ serializer) {
  return ee.rpc_node.functionDefinition(
      this.signature_['args'].map(arg => arg['name']),
      serializer.makeReference(this.body_));
};


/** @override @return {!ee.api.ValueNode} */
ee.CustomFunction.prototype.encodeCloudInvocation = function(
    /** !ee.Encodable.Serializer */ serializer, /** ? */ args) {
  return ee.rpc_node.functionByReference(serializer.makeReference(this), args);
};


/** @override */
ee.CustomFunction.prototype.getSignature = function() {
  return this.signature_;
};


/**
 * Returns a placeholder variable with a given name that implements a given
 * EE type.
 *
 * @param {Function} type A type to mimic.
 * @param {string?} name The name of the variable as it will appear in the
 *     arguments of the custom functions that use this variable. If null, a
 *     name will be auto-generated in resolveNamelessArgs_().
 * @return {*} A variable with the given name implementing the given type.
 */
ee.CustomFunction.variable = function(type, name) {
  type = type || Object;
  if (!(type.prototype instanceof ee.ComputedObject)) {
    // Try to convert to an EE type.
    if (!type || type == Object) {
      type = ee.ComputedObject;
    } else if (type == String) {
      type = ee.String;
    } else if (type == Number) {
      type = ee.Number;
    } else if (type == Array) {
      type = goog.global['ee']['List'];
    } else {
      throw Error('Variables must be of an EE type, ' +
                  'e.g. ee.Image or ee.Number.');
    }
  }

  /**
   * Avoid Object.create() for backwards compatibility.
   * @constructor
   */
  var klass = function(name) {
    this.func = null;
    this.args = null;
    this.varName = name;
  };
  klass.prototype = type.prototype;
  return new klass(name);
};


/**
 * Creates a CustomFunction calling a given native function with the specified
 * return type and argument types and auto-generated argument names.
 *
 * @param {Function} func The native function to wrap.
 * @param {string|Function} returnType The type of the return value, either
 *     as a string or a constructor/class reference.
 * @param {Array.<string|Function>} arg_types The types of the arguments,
 *     either as strings or constructor/class references.
 * @return {!ee.CustomFunction} The constructed CustomFunction.
 */
ee.CustomFunction.create = function(func, returnType, arg_types) {
  var stringifyType = function(type) {
    if (typeof type === 'string') {
      return type;
    } else {
      return ee.Types.classToName(type);
    }
  };
  var args = goog.array.map(arg_types, function(argType) {
    return {
      'name': null,
      'type': stringifyType(argType)
    };
  });
  var signature = {
    'name': '',
    'returns': stringifyType(returnType),
    'args': args
  };
  return new ee.CustomFunction(signature, func);
};


/**
 * Deterministically generates names for the unnamed variables, based on the
 * body.
 *
 * @param {!ee.Function.Signature} signature The signature which may contain
 *     null argument names.
 * @param {!Array<!ee.ComputedObject>} vars A list of variables, some of which
 *     may be nameless. These will be updated to include names when this
 *     method returns.
 * @param {!Function} body The JavaScript function to evaluate.
 * @return {!ee.Function.Signature} The signature with null arg names resolved.
 * @private
 * @suppress {accessControls} We are accessing the protected varName.
 */
ee.CustomFunction.resolveNamelessArgs_ = function(signature, vars, body) {
  const namelessArgIndices = [];
  for (let i = 0; i < vars.length; i++) {
    if (vars[i].varName === null) {
      namelessArgIndices.push(i);
    }
  }

  // Do we have any nameless arguments at all?
  if (namelessArgIndices.length === 0) {
    return signature;
  }

  // Generate the name base by counting the number of custom functions
  // within the body.
  const countFunctions = (expression) => {
    const countNodes = (nodes) =>
        nodes.map(countNode).reduce((a, b) => a + b, 0);
    const countNode = (node) => {
      if (node.functionDefinitionValue) {
        return 1;
      } else if (node.arrayValue) {
        return countNodes(node.arrayValue.values);
      } else if (node.dictionaryValue) {
        return countNodes(Object.values(node.dictionaryValue.values));
      } else if (node.functionInvocationValue) {
        const fn = node.functionInvocationValue;
        return countNodes(Object.values(fn.arguments));
      }
      return 0;
    };
    return countNodes(Object.values(expression.values));
  };

  // There are three function building phases, which each call body.apply:
  // 1 - Check Return.  The constructor verifies that body.apply returns a
  // result, but does not try to serialize the result. If the function tries to
  // use unbound variables (eg, using .getInfo() or print()), ComputedObject
  // will throw an exception when these calls try to serialize themselves, so
  // that unbound variables are not passed in server calls.
  // 2 - Count Functions.  We serialize the result here. At this point all
  // variables must have names for serialization to succeed, but we don't yet
  // know the correct function depth. So we serialize with unboundName set to
  // '<unbound>', which should silently succeed. If this does end up in server
  // calls, the function is very unusual: the first call doesn't use unbound
  // variables but the second call does. In this rare case we will return server
  // errors complaining about <unbound>.
  // 3 - Final Serialize.  Finally, the constructor calls body.apply with the
  // correct, depth-dependent names, which are used when the CustomFunction
  // is serialized and sent to the server.
  const serializedBody = ee.Serializer.encodeCloudApiExpression(
      body.apply(null, vars), '<unbound>');
  const baseName = `_MAPPING_VAR_${countFunctions(serializedBody)}_`;

  // Update the vars and signature by the name.
  for (let i = 0; i < namelessArgIndices.length; i++) {
    const index = namelessArgIndices[i];
    const name = baseName + i;
    vars[index].varName = name;
    signature['args'][index]['name'] = name;
  }

  return signature;
};
