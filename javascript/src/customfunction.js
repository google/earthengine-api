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
goog.require('goog.array');
goog.require('goog.object');



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
  if (!goog.isDef(body.apply(null, vars))) {
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
    // Try co convert to an EE type.
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
 * @return {ee.CustomFunction} The constructed CustomFunction.
 */
ee.CustomFunction.create = function(func, returnType, arg_types) {
  var stringifyType = function(type) {
    if (goog.isString(type)) {
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
 * @param {ee.Function.Signature} signature The signature which may contain
 *     null argument names.
 * @param {Array.<ee.ComputedObject>} vars A list of variables, some of which
 *     may be nameless. These will be updated to include names when this
 *     method returns.
 * @param {Function} body The JavaScript function to evaluate.
 * @return {ee.Function.Signature} The signature with null arg names resolved.
 * @private
 * @suppress {accessControls} We are accessing the protected varName.
 */
ee.CustomFunction.resolveNamelessArgs_ = function(signature, vars, body) {
  var namelessArgIndices = [];
  for (var i = 0; i < vars.length; i++) {
    if (goog.isNull(vars[i].varName)) {
      namelessArgIndices.push(i);
    }
  }

  // Do we have any nameless arguments at all?
  if (namelessArgIndices.length == 0) {
    return signature;
  }

  // Generate the name base by counting the number of custom functions
  // within the body.
  var countFunctions = function(expression) {
    var count = 0;
    if (goog.isObject(expression) && !goog.isFunction(expression)) {
      if (expression['type'] == 'Function') {
        // Technically this allows false positives if one of the user
        // dictionaries contains type=Function, but that does not matter
        // for this use case, as we only care about determinism.
        count++;
      }
      goog.object.forEach(expression, function(subExpression) {
        count += countFunctions(subExpression);
      });
    }
    return count;
  };
  var serializedBody = ee.Serializer.encode(body.apply(null, vars));
  var baseName = '_MAPPING_VAR_' + countFunctions(serializedBody) + '_';

  // Update the vars and signature by the name.
  for (var i = 0; i < namelessArgIndices.length; i++) {
    var index = namelessArgIndices[i];
    var name = baseName + i;
    vars[index].varName = name;
    signature['args'][index]['name'] = name;
  }

  return signature;
};
