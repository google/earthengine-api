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
 * @param {Array.<string>|Object.<Function>} args The arguments to the function.
 *     If body is a JavaScript function, this must be a map from argument names
 *     to types (classes). Otherwise this is an array of names.
 * @param {Function?} returnType The expected return type of the
 *     function as a class constructor, if known.
 * @param {Function|*} body The expression to evaluate. Can be either:
 *     1. A JavaScript function, in which case the args argument must describe
 *        the types of this function's arguments.
 *     2. An expression made out of primitives (boolean, number, string, Date),
 *        data structures (array, object), ComputedObjects or variables
 *        (created by CustomFunction.variable()). Variables refer to the
 *        elements of args by names. Structures and ComputedObjects can
 *        recursively contain any of the above.
 * @constructor
 * @extends {ee.Function}
 */
ee.CustomFunction = function(args, returnType, body) {
  if (!(this instanceof ee.CustomFunction)) {
    return new ee.CustomFunction(args, returnType, body);
  }

  var argNames;
  var argTypes;
  if (goog.isFunction(body)) {
    if (goog.isArray(args) || !goog.isObject(args)) {
      throw Error('The "args" of a custom function created from a native JS ' +
                  'function must be a map from name to type.');
    }
    argNames = [];
    argTypes = [];
    var vars = [];
    for (var name in args) {
      var type = args[name];
      argNames.push(name);
      argTypes.push(type);
      vars.push(ee.CustomFunction.variable(type, name));
    }
    body = body.apply(null, vars);
  } else {
    if (!goog.isArray(args)) {
      throw Error('The "args" of a custom function created from an ' +
                  'expression must be an array of names.');
    }
    argNames = args;
    argTypes = goog.array.map(args, function() { return Object; });
  }

  /**
   * The names of the function arguments.
   * @type {Array.<string>}
   * @private
   */
  this.argNames_ = /** @type {Array.<string>} */(argNames);

  /**
   * The types of the function arguments.
   * @type {Array.<Function>}
   * @private
   */
  this.argTypes_ = /** @type {Array.<Function>} */(argTypes);

  /**
   * The return type of the function.
   * @type {Function}
   * @private
   */
  this.returnType_ = returnType || Object;

  /**
   * The expression to evaluate.
   * @type {*}
   * @private
   */
  this.body_ = body;
};
goog.inherits(ee.CustomFunction, ee.Function);


/** @inheritDoc */
ee.CustomFunction.prototype.encode = function(encoder) {
  return {
    'type': 'Function',
    'argumentNames': this.argNames_,
    'body': encoder(this.body_)
  };
};


/** @inheritDoc */
ee.CustomFunction.prototype.getSignature = function() {
  return {
    'name': '',
    'args': goog.array.map(this.argNames_, function(name, i) {
      return {
        'name': name,
        'type': ee.Types.classToName(this.argTypes_[i]),
        'optional': false
      };
    }, this),
    'returns': ee.Types.classToName(this.returnType_)
  };
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
