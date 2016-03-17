/** @fileoverview Utilities for processing arguments to JavaScript functions. */


goog.provide('ee.arguments');

goog.require('ee.ComputedObject');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.structs.Set');


/**
 * Extracts arguments for the passed-in function from originalArgs,
 * which could either be an array of many sequenced arguments OR
 * contain a single argument dictionary.
 *
 * This helper allows users to call JS functions with argument
 * dictionaries, for example:
 *
 *     ee.data.getAssetAcl({assetId: 'users/foo/bar'});
 *
 * EXAMPLE USAGE:
 *
 *   ee.exampleFn = function(param1, opt_param2) {
 *     args = ee.arguments.extract(ee.exampleFn, arguments);
 *     doSomethingWith(args[param1], args[param2]);
 *   }
 *
 * USAGE WARNING:
 *
 *   This helper is safe to use only in functions that meet at least one
 *   of the following conditions:
 *
 *      A) The function requires two or more arguments.
 *      B) The function takes only an ee.ComputedObject as its first argument.
 *      C) The function does not accept a "normal" object (i.e. a JavaScript
 *         Object that's not an Array or Function) as its first argument.
 *      D) The function accepts a "normal" object as its first argument, and
 *             i)  this object can only contain a limited set of possible keys
 *         AND ii) the intersection between possible keys and the function's
 *                 expected params names is empty.
 *         A visParam object is an example.
 *
 * USAGE WARNING EXPLANATION:
 *
 *   If these constraints are unmet, this helper cannot always tell whether
 *   the user intended to:
 *
 *      1) Pass a dictionary of keyed arguments
 *         e.g. ee.Dictionary({dict: {myKey: 'myValue'}});
 *   or 2) Just pass a single object as a normal argument in sequence
 *         e.g. ee.Dictionary({myKey: 'myValue'});
 *
 *   To try to differentiate the two, we test whether all of the keys in the
 *   first argument match the expected parameter names. This is guaranteed to
 *   work for case (D) above. In other cases, there MAY be mistakes,
 *   for example if the user wanted "myKey" above to have the value "dict",
 *   we might mistakenly think the user intended #1 when in fact they wanted #2.
 *
 * COMPILATION WARNING:
 *
 *   This helper relies on the function prototype's toString() method to
 *   extract expected parameter names. When the client library is compiled
 *   with variable name obfuscation enabled, parameter names may not match the
 *   keys given in named argument dictionaries, and this function will not
 *   work UNLESS a goog.global.EXPORTED_FN_INFO map is provided. Within this
 *   map, the value of goog.global.EXPORTED_FN_INFO[fn.toString()] should be
 *   an object containing two unobfuscated keys:
 *
 *     - 'name': The original unobfuscated name of fn.
 *     - 'paramNames': A list of unobfuscated parameter names expected by fn,
 *                     with optional parameters prefixed by "opt_".
 *
 *   The map should contain an entry for each that uses this helper.
 *   Typically that means public, exported, non-deprecated functions.
 *
 * @param {!Function} fn The function for which to extract arguments.
 * @param {!Arguments} originalArgs The original arguments to the function.
 * @return {!Object} A mapping from parameter names to defined argument values,
 *     if any. The keys are unobfuscated.
 * @throws If a required parameter is not specified, an unexpected parameter
 *     is provided, or too many arguments are provided in sequence.
 */
ee.arguments.extract = function(fn, originalArgs) {
  var paramNamesWithOptPrefix = ee.arguments.getParamNames_(fn);
  var paramNames = goog.array.map(paramNamesWithOptPrefix, function(param) {
    return param.replace(/^opt_/, '');
  });

  var fnName = ee.arguments.getFnName_(fn);
  var fnNameSnippet = fnName ? ' to function ' + fnName : '';

  var args = {};
  var firstArg = originalArgs[0];
  var firstArgCouldBeDictionary = goog.isObject(firstArg) &&
                                  !goog.isFunction(firstArg) &&
                                  !goog.isArray(firstArg) &&
                                  !(firstArg instanceof ee.ComputedObject);

  // Parse the arguments by inferring how they were passed in.
  if (originalArgs.length > 1 || !firstArgCouldBeDictionary) {
    // The arguments passed by the user were definitely intended as a sequence.
    if (originalArgs.length > paramNames.length) {
      throw Error('Received too many arguments' + fnNameSnippet + '. ' +
                  'Expected at most ' + paramNames.length + ' but ' +
                  'got ' + originalArgs.length + '.');
    }
    for (var i = 0; i < originalArgs.length; i++) {
      args[paramNames[i]] = originalArgs[i];
    }
  } else {
    // Could be either case #1 or case #2 described in the JsDocs above.
    var seen = new goog.structs.Set(goog.object.getKeys(firstArg));
    var expected = new goog.structs.Set(paramNames);
    var anyExpected = !expected.intersection(seen).isEmpty();
    if (anyExpected) {
      // Case #1 above.
      var unexpected = seen.difference(expected);
      if (!unexpected.isEmpty()) {
        throw new Error('Unexpected arguments' + fnNameSnippet + ': ' +
                        unexpected.getValues().join(', '));
      }
      args = goog.object.clone(firstArg);
    } else {
      // Case #2 above.
      args[paramNames[0]] = originalArgs[0];
    }
  }

  // Ensure that all the required parameters are present.
  var provided = new goog.structs.Set(goog.object.getKeys(args));
  var required = new goog.structs.Set(
      goog.array.filter(paramNamesWithOptPrefix, function(param) {
        return !goog.string.startsWith(param, 'opt_');
      }));
  var missing = required.difference(provided);
  if (!missing.isEmpty()) {
    throw new Error('Missing required arguments' + fnNameSnippet + ': ' +
                    missing.getValues().join(', '));
  }

  return args;
};


/**
 * Returns the names of the parameters expected by the passed-in function.
 * The "opt_" prefix is not stripped.
 * @param {!Function} fn A function for which to retrieve the parameters.
 * @return {!Array} An array of the expected parameter names.
 * @private
 */
ee.arguments.getParamNames_ = function(fn) {
  var paramNames = [];
  if (goog.global.EXPORTED_FN_INFO) {
    var exportedFnInfo = goog.global.EXPORTED_FN_INFO[fn.toString()];
    goog.asserts.assertObject(exportedFnInfo);
    paramNames = exportedFnInfo['paramNames'];
    goog.asserts.assertArray(paramNames);
  } else {
    // Note: This is inspired by Angular's inferInjectionArgs().
    var fnStr = fn.toString().replace(ee.arguments.JS_COMMENT_MATCHER_, '');
    var fnParamDecl = fnStr.match(ee.arguments.JS_PARAM_DECL_MATCHER_)[1];
    var fnParamList = fnParamDecl.split(',');
    paramNames = fnParamList || [];
  }
  return paramNames;
};


/**
 * Returns the original (uncompiled) name of the passed-in function
 * or null if unknown.
 * @param {!Function} fn The function to get the name of.
 * @return {?string} The original name of the function or null if unknown.
 * @private
 */
ee.arguments.getFnName_ = function(fn) {
  if (goog.global.EXPORTED_FN_INFO) {
    var entireName = goog.global.EXPORTED_FN_INFO[fn.toString()]['name'];
    return entireName.split('.').pop() + '()';
  } else {
    return null;  // We cannot use reflection to determine the function name.
  }
};


/** @const @private {RegExp} Matches comments within fn.toString() output. */
ee.arguments.JS_COMMENT_MATCHER_ = /((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg;


/**
 * Matches a parameter list declaration within fn.toString() output.
 * @const @private {RegExp}
 */
ee.arguments.JS_PARAM_DECL_MATCHER_ = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
