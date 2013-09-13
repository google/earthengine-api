/**
 * @fileoverview An object representing a custom EE Function.
 */

goog.provide('ee.CustomFunction');

goog.require('ee.Encodable');
goog.require('ee.Function');
goog.require('ee.Types');
goog.require('goog.array');



/**
 * Creates a function defined by a given expression with unbound variables.
 * The expression is created by evaluating the given javascript function
 * using variables as placeholders.
 *
 * @param {ee.Function.Signature} signature The function's signature.
 * @param {Function} body The JavaScript function to evaluate.
 *
 * @constructor
 * @extends {ee.Function}
 * @hidden
 */
ee.CustomFunction = function(signature, body) {
  if (!(this instanceof ee.CustomFunction)) {
    return new ee.CustomFunction(signature, body);
  }

  var vars = [];
  var args = signature['args'];
  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    var type = ee.Types.nameToClass(arg['type']);
    vars.push(ee.CustomFunction.variable(type, arg['name']));
  }

  /**
   * The signature of the function.
   * @type {ee.Function.Signature}
   * @private
   */
  this.signature_ = signature;

  /**
   * The function evaluated using placeholders.
   * @type {*}
   * @private
   */
  this.body_ = body.apply(null, vars);
};
goog.inherits(ee.CustomFunction, ee.Function);


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
 * @param {string} name The name of the variable as it will appear in the
 *     arguments of the custom functions that use this variable.
 * @return {*} A variable with the given name implementing the given type.
 */
ee.CustomFunction.variable = function(type, name) {
  /** @constructor */
  var Variable = function() {};
  var proto;
  type = type || Object;
  if (type.prototype instanceof ee.Encodable) {
    proto = type.prototype;
  } else {
    proto = ee.Encodable.prototype;
  }
  Variable.prototype = proto;
  var instance = new Variable();
  instance.encode = function(encoder) {
    return {
      'type': 'ArgumentRef',
      'value': name
    };
  };
  instance[ee.Types.VAR_TYPE_KEY] = type;
  return instance;
};
