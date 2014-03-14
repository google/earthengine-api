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
 * The expression is created by evaluating the given javascript function
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

  /**
   * The function evaluated using placeholders.
   * @type {*}
   * @private
   */
  this.body_ = body.apply(null, vars);

  /**
   * The signature of the function.
   * @type {ee.Function.Signature}
   * @private
   */
  this.signature_ = ee.CustomFunction.resolveNamelessArgs_(
      signature, vars, this.body_);
};
goog.inherits(ee.CustomFunction, ee.Function);
// Exporting manually to avoid marking the class public in the docs.
goog.exportSymbol('ee.CustomFunction', ee.CustomFunction);


/** @inheritDoc */
ee.CustomFunction.prototype.encode = function(encoder) {
  return {
    'type': 'Function',
    'argumentNames': goog.array.map(
        this.signature_['args'], function(arg) { return arg['name']; }),
    'body': encoder(this.body_)
  };
};


/** @inheritDoc */
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
  var klass = function() {};
  klass.prototype = type.prototype;
  var obj = new klass();
  obj.func = null;
  obj.args = null;
  obj.varName = name;
  return obj;
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
 * @param {*} body The body of the function.
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

  // Generate the name base by counting the number of named variable
  // references within the body.
  var countVariables = function(expression) {
    var count = 0;
    if (goog.isObject(expression) && !goog.isFunction(expression)) {
      if (expression['type'] == 'ArgumentRef' &&
          !goog.isNull(expression['value'])) {
        // Technically this allows false positives if one of the user
        // dictionaries contains type=ArgumentRef, but that does not matter
        // for this use case, as we only care about determinism.
        count++;
      } else {
        goog.object.forEach(expression, function(subExpression) {
          count += countVariables(subExpression);
        });
      }
    }
    return count;
  };
  var serializedBody = ee.Serializer.encode(body);
  var baseName = '_MAPPING_VAR_' + countVariables(serializedBody) + '_';

  // Update the vars and signature by the name.
  for (var i = 0; i < namelessArgIndices.length; i++) {
    var index = namelessArgIndices[i];
    var name = baseName + i;
    vars[index].varName = name;
    signature['args'][index]['name'] = name;
  }

  return signature;
};
