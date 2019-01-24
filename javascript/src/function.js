/**
 * @fileoverview A base class for EE Functions.
 */

goog.provide('ee.Function');
goog.provide('ee.Function.Signature');

goog.require('ee.ComputedObject');
goog.require('ee.Encodable');
goog.require('ee.Serializer');
goog.require('ee.Types');
goog.require('goog.array');
goog.require('goog.functions');
goog.require('goog.object');



/**
 * An abstract base class for functions callable by the EE API. Subclasses
 * must implement encode() and getSignature().
 *
 * TODO(user): Implement Function.bind() while supporting both positional
 *              and named args and avoiding dependendency on CustomFunction.
 *
 * @constructor
 * @extends {ee.Encodable}
 */
ee.Function = function() {
  if (!(this instanceof ee.Function)) {
    return new ee.Function();
  }
};
goog.inherits(ee.Function, ee.Encodable);
// Exporting manually to avoid marking the class public in the docs.
goog.exportSymbol('ee.Function', ee.Function);


/**
 * A function used to type-coerce arguments and return values.
 * @type {function(*, string): *}
 * @private
 */
ee.Function.promoter_ = goog.functions.identity;


/**
 * Register a function used to type-coerce arguments and return values.
 * @param {function(*, string): *} promoter A function used to type-coerce
 *     arguments and return values. Passed a value as the first parameter
 *     and a type name as the second. Can be used, for example, promote
 *     numbers or strings to Images. Should return the input promoted if
 *     the type is recognized, otherwise the original input.
 */
ee.Function.registerPromoter = function(promoter) {
  ee.Function.promoter_ = promoter;
};


/**
 * Returns a description of the interface provided by this function.
 *
 * @return {ee.Function.Signature}
 */
ee.Function.prototype.getSignature = goog.abstractMethod;


/**
 * Call the function with the given positional arguments.
 *
 * @param {...*} var_args Positional arguments to pass to the function.
 * @return {!ee.ComputedObject} An object representing the called function.
 *     If the signature specifies a recognized return type, the returned
 *     value will be cast to that type.
 * @export
 */
ee.Function.prototype.call = function(var_args) {
  return this.apply(this.nameArgs(Array.prototype.slice.call(arguments, 0)));
};


/**
 * Call the function with a dictionary of named arguments.
 *
 * @param {Object} namedArgs A dictionary of arguments to the function.
 * @return {!ee.ComputedObject} An object representing the lazy result of
 *     the called function. If the signature specifies a recognized return
 *     type, the returned value will be cast to that type.
 * @export
 */
ee.Function.prototype.apply = function(namedArgs) {
  var result = new ee.ComputedObject(this, this.promoteArgs(namedArgs));
  return /** @type {!ee.ComputedObject} */(
      ee.Function.promoter_(result, this.getReturnType()));
};


/**
 * Call the function automatically deciding whether to interpret the arguments
 * as positional ones or as a dictionary of named ones.
 *
 * @param {*|undefined} thisValue The "this" value on which the function was
 *     called. If defined, interpreted as the first argument.
 * @param {Array<*>} args A list containing either positional args or a
 *    keyword arg dictionary.
 * @return {!ee.ComputedObject} An object representing the called function.
 *     If the signature specifies a recognized return type, the returned
 *     value will be cast to that type.
 * @package
 */
ee.Function.prototype.callOrApply = function(thisValue, args) {
  var isInstance = goog.isDef(thisValue);
  var signature = this.getSignature();

  // Assume keyword arguments if we get a single dictionary.
  var useKeywordArgs = false;
  if (args.length == 1 && ee.Types.isRegularObject(args[0])) {
    // Decide whether the algorithm expects a dictionary as an only arg.
    var params = signature['args'];
    if (isInstance) {
      params = params.slice(1);
    }
    if (params.length) {
      var requiresOneArg = (params.length == 1 || params[1]['optional']);
      var aSingleDictionaryIsValid =
          (requiresOneArg && params[0]['type'] == 'Dictionary');
      useKeywordArgs = !aSingleDictionaryIsValid;
    }
  }

  // Convert positional to named args.
  var namedArgs;
  if (useKeywordArgs) {
    namedArgs = goog.object.clone(/** @type {Object} */ (args[0]));
    if (isInstance) {
      var firstArgName = signature['args'][0]['name'];
      if (firstArgName in namedArgs) {
        throw Error('Named args for ' + signature['name'] +
                    ' can\'t contain keyword ' + firstArgName);
      }
      namedArgs[firstArgName] = thisValue;
    }
  } else {
    namedArgs = this.nameArgs(isInstance ? [thisValue].concat(args) : args);
  }

  return this.apply(namedArgs);
};


/**
 * Promotes arguments to their types based on the function's signature and
 * verifies that all required arguments are provided and no unknown arguments
 * are present.
 *
 * @param {Object} args Keyword arguments to the function.
 * @return {Object} The promoted arguments.
 * @protected
 */
ee.Function.prototype.promoteArgs = function(args) {
  var specs = this.getSignature()['args'];

  // Promote all recognized args.
  var promotedArgs = {};
  var known = {};
  for (var i = 0; i < specs.length; i++) {
    var name = specs[i]['name'];
    if (name in args && goog.isDef(args[name])) {
      promotedArgs[name] = ee.Function.promoter_(args[name], specs[i]['type']);
    } else if (!specs[i]['optional']) {
      throw Error('Required argument (' + name + ') missing to function: ' +
                  this);
    }
    known[name] = true;
  }

  // Check for unknown arguments.
  var unknown = [];
  for (var argName in args) {
    if (!known[argName]) {
      unknown.push(argName);
    }
  }
  if (unknown.length > 0) {
    throw Error('Unrecognized arguments (' + unknown + ') to function: ' +
                this);
  }

  return promotedArgs;
};


/**
 * Converts a list of positional arguments to a map of keyword arguments
 * using the function's signature. Note that this does not check whether
 * the list contains enough arguments to satisfy the call.
 *
 * @param {Array} args Positional arguments to the function.
 * @return {Object} Keyword arguments to the function.
 * @protected
 */
ee.Function.prototype.nameArgs = function(args) {
  var specs = this.getSignature()['args'];
  if (specs.length < args.length) {
    throw Error('Too many (' + args.length + ') arguments to function: ' +
                this);
  }
  var namedArgs = {};
  for (var i = 0; i < args.length; i++) {
    namedArgs[specs[i]['name']] = args[i];
  }
  return namedArgs;
};


/**
 * @return {string} The name of the return type of the function.
 * @protected
 */
ee.Function.prototype.getReturnType = function() {
  return this.getSignature()['returns'];
};


/**
 * @param {string=} opt_name An optional override of the function name.
 * @param {boolean=} opt_isInstance If true, the first argument is documented
 *     to be "this".
 * @return {string} A user-friendly formatted description of the function based
 *     on its signature.
 * @override
 */
ee.Function.prototype.toString = function(opt_name, opt_isInstance) {
  var signature = this.getSignature();
  var buffer = [];
  buffer.push(opt_name || signature['name']);
  buffer.push('(');
  buffer.push(goog.array.map(signature['args'].slice(opt_isInstance ? 1 : 0),
      function(elem) {
        return elem['name'];
      }).join(', '));
  buffer.push(')\n');
  buffer.push('\n');
  if (signature['description']) {
    buffer.push(signature['description']);
  } else {
    buffer.push('Undocumented.');
  }
  buffer.push('\n');
  if (signature['args'].length) {
    buffer.push('\nArgs:\n');
    for (var i = 0; i < signature['args'].length; i++) {
      if (opt_isInstance && i == 0) {
        buffer.push('  this:');
      } else {
        buffer.push('\n  ');
      }
      var arg = signature['args'][i];
      buffer.push(arg['name']);
      buffer.push(' (');
      buffer.push(arg['type']);
      if (arg['optional']) {
        buffer.push(', optional');
      }
      buffer.push('): ');
      if (arg['description']) {
        buffer.push(arg['description']);
      } else {
        buffer.push('Undocumented.');
      }
    }
  }
  return buffer.join('');
};


/**
 * @return {string} The serialized representation of this object.
 */
ee.Function.prototype.serialize = function() {
  return ee.Serializer.toJSON(this);
};


/**
 * The signature of a function.
 *
 * @typedef {{
 *   name: string,
 *   args: !Array.<ee.data.AlgorithmArgument>,
 *   returns: string,
 *   description: (string|undefined),
 *   deprecated: (string|undefined)
 * }}
 */
ee.Function.Signature;


