/** @fileoverview Utilities for processing arguments to JavaScript functions. */

goog.provide('ee.arguments');

goog.require('ee.ComputedObject');
goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.structs.Set');

ee.arguments.extractFromFunction = function(fn, originalArgs) {
  return ee.arguments.extractImpl_(
      fn, originalArgs, ee.arguments.JS_PARAM_DECL_MATCHER_FUNCTION_);
};

/**
 * Extracts arguments for the passed-in class constructor (has to be defined
 * with the 'class' and 'constructor' keywords) from originalArgs, which could
 * either be an array of many sequenced arguments OR contain a single argument
 * dictionary. See extractFromFunction() and extractFromClassMethod() for other
 * cases.
 *
 * This helper allows users to call JS functions with argument
 * dictionaries, for example:
 *
 *     AnimatedLine({assetId: 'users/foo/bar'});
 *
 * EXAMPLE USAGE:
 *
 *   class AnimatedLine {
 *     constructor(param1, opt_param2) {
 *       args = ee.arguments.extractFromClassConstructor(
 *           AnimatedLine, arguments);
 *       doSomethingWith(args[param1], args[param2]);
 *     }
 *   }
 *
 * Note: args only contains parameters that are provided.
 *
 * USAGE WARNING:
 *
 *   extractFromClassConstructor() finds the first occurrence of keyword
 *   'constructor' inside class definition, then extracts the parameters for
 *   that function. If there is a function whose name is also 'constructor'
 *   defined or called before the constructor, then the parameter list returned
 *   shall coorespond to that function instead of the class constructor. For
 *   example:
 *
*      class Animation {
 *       // This is fine.
 *       oneconstructor(param1, param2) {...}
 *       // This is also fine.
 *       anotherConstructor(param3, param4) {...}
 *       B () {
 *         return class C {
 *           // 'param5, param6' will be returned!
 *           constructor(param5, param6) {}
 *         };
 *       }
 *       constructor(map, shape, frames) {...}
 *     }
 *
 * Please see the USAGE WARNING, USAGE WARNING EXPLANATION, and COMPILATION
 * WARNING sections of extractFromFunction() for further discussions of how
 * extraction works before using extractFromClassConstructor().
 *
 * @param {!Function} fn The function for which to extract arguments.
 * @param {!Arguments} originalArgs The original arguments to the function.
 * @return {!Object} A mapping from parameter names to defined argument values,
 *     if any. The keys are unobfuscated.
 * @throws {!Error} If a required parameter is not specified, an unexpected
 *     parameter is provided, too many arguments are provided in sequence, or
 *     fails to extract parameter names.
 */
ee.arguments.extractFromClassConstructor = function(fn, originalArgs) {
  return ee.arguments.extractImpl_(
      fn, originalArgs, ee.arguments.JS_PARAM_DECL_MATCHER_CLASS_CONSTRUCTOR_);
};

/**
 * Extracts arguments for the passed-in class methods (other than class
 * constructor, the class has to be defined with the 'class' keyword) from
 * originalArgs, which could either be an array of many sequenced arguments OR
 * contain a single argument dictionary. See extractFromFunction() and
 * extractFromClassConstructor() for other cases.
 *
 * This helper allows users to call JS functions with argument
 * dictionaries, for example:
 *
 *     animatedLine.setColor({assetId: 'users/foo/bar'});
 *
 * EXAMPLE USAGE:
 *
 *   class AnimatedLine {
 *     setColor(param1, opt_param2) {
 *       args = ee.arguments.extractFromClassMethod(
 *           AnimatedLine.prototype.setColor, arguments);
 *       doSomethingWith(args[param1], args[param2]);
 *     }
 *   }
 * or
 *   class AnimatedLine {
 *     static setColor(param1, opt_param2) {
 *       args = ee.arguments.extractFromClassMethod(
 *           AnimatedLine.setColor, arguments);
 *       doSomethingWith(args[param1], args[param2]);
 *     }
 *   }
 *
 *
 * Note: args only contains parameters that are provided.
 *
 * Please see the USAGE WARNING, USAGE WARNING EXPLANATION, and COMPILATION
 * WARNING sections of extractFromFunction() for further discussions of how
 * extraction works before using extractFromClassMethod().
 *
 * @param {!Function} fn The function for which to extract arguments.
 * @param {!Arguments} originalArgs The original arguments to the function.
 * @return {!Object} A mapping from parameter names to defined argument values,
 *     if any. The keys are unobfuscated.
 * @throws {!Error} If a required parameter is not specified, an unexpected
 *     parameter is provided, too many arguments are provided in sequence, or
 *     fails to extract parameter names.
 */
ee.arguments.extractFromClassMethod = function(fn, originalArgs) {
  return ee.arguments.extractImpl_(
      fn, originalArgs, ee.arguments.JS_PARAM_DECL_MATCHER_CLASS_METHOD_);
};

/**
 * extract() is deprecated. New code should use extractFromFunction(),
 * extractFromClassConstructor(), or extractFromClassMethod() instead.
 * @param {!Function} fn The function for which to extract arguments.
 * @param {!Arguments} originalArgs The original arguments to the function.
 * @return {!Object} A mapping from parameter names to defined argument values,
 *     if any. The keys are unobfuscated.
 * @throws {!Error} If a required parameter is not specified, an unexpected
 *     parameter is provided, too many arguments are provided in sequence, or
 *     fails to extract parameter names.
 * @deprecated
 */
ee.arguments.extract = ee.arguments.extractFromFunction;

/**
 * The inner implementation for extracting arguments for the passed-in function
 * from originalArgs, which could either be an array of many sequenced arguments
 * OR contain a single argument dictionary. See the comments for
 * extractFromFunction(), extractFromClassConstructor(), and
 * extractFromClassMethod() for further details.
 *
 * @param {!Function} fn The function for which to extract arguments.
 * @param {!Arguments} originalArgs The original arguments to the function.
 * @param {!RegExp} parameterMatcher Regular expression used to match the
 *     parameter list of a function.
 * @return {!Object} A mapping from parameter names to defined argument values,
 *     if any. The keys are unobfuscated.
 * @throws {!Error} If a required parameter is not specified, an unexpected
 *     parameter is provided, too many arguments are provided in sequence, or
 *     fails to extract parameter names.
 * @private
 */
ee.arguments.extractImpl_ = function(fn, originalArgs, parameterMatcher) {
  var paramNamesWithOptPrefix =
      ee.arguments.getParamNames_(fn, parameterMatcher);
  var paramNames = goog.array.map(paramNamesWithOptPrefix, function(param) {
    return param.replace(/^opt_/, '');
  });

  var fnName = ee.arguments.getFnName_(fn);
  var fnNameSnippet = fnName ? ' to function ' + fnName : '';

  var args = {};
  var firstArg = originalArgs[0];
  var firstArgCouldBeDictionary = goog.isObject(firstArg) &&
      !goog.isFunction(firstArg) && !goog.isArray(firstArg) &&
      !(firstArg instanceof ee.ComputedObject);

  // Parse the arguments by inferring how they were passed in.
  if (originalArgs.length > 1 || !firstArgCouldBeDictionary) {
    // The arguments passed by the user were definitely intended as a sequence.
    if (originalArgs.length > paramNames.length) {
      throw new Error(
          'Received too many arguments' + fnNameSnippet + '. ' +
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
        throw new Error(
            'Unexpected arguments' + fnNameSnippet + ': ' +
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
    throw new Error(
        'Missing required arguments' + fnNameSnippet + ': ' +
        missing.getValues().join(', '));
  }

  return args;
};


/**
 * Returns the names of the parameters expected by the passed-in function.
 * Throws an error if no match was found. The "opt_" prefix is not stripped.
 * @param {!Function} fn A function for which to retrieve the parameters.
 * @param {!RegExp} parameterMatcher Regular expression used to match the
 *     parameter list of a function.
 * @return {!Array} An array of the expected parameter names.
 * @throws {!Error} If parameter list could not be found.
 * @private
 */
ee.arguments.getParamNames_ = function(fn, parameterMatcher) {
  var paramNames = [];
  if (goog.global['EXPORTED_FN_INFO']) {
    // For pre-minified builds, use a global map of function metadata, keyed by
    // the toString() value of the function body.
    var exportedFnInfo = goog.global['EXPORTED_FN_INFO'][fn.toString()];
    if (!goog.isObject(exportedFnInfo)) {
      ee.arguments.throwMatchFailedError_();
    }
    paramNames = exportedFnInfo['paramNames'];
    if (!goog.isArray(paramNames)) {
      ee.arguments.throwMatchFailedError_();
    }
  } else {
    // For un-compiled code, infer parameter names directly from the function
    // body. Inspired by Angular's inferInjectionArgs():
    var fnStr = fn.toString().replace(ee.arguments.JS_COMMENT_MATCHER_, '');
    const fnMatchResult = fnStr.match(parameterMatcher);
    if (fnMatchResult === null) {
      ee.arguments.throwMatchFailedError_();
    }
    var fnParamDecl = fnMatchResult[1];
    var fnParamList = fnParamDecl.split(',') || [];
    paramNames = fnParamList.map(
        /**
         * Removes defaulted values from the parameters if present.
         * @param {string} p The parameter name with possible default value.
         * @return {string} The parameter name with any default value removed.
         * @see ee.arguments.JS_PARAM_DEFAULT_MATCHER
         */
        (p) => p.replace(ee.arguments.JS_PARAM_DEFAULT_MATCHER_, ''));
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
  if (goog.global['EXPORTED_FN_INFO']) {
    var entireName = goog.global['EXPORTED_FN_INFO'][fn.toString()]['name'];
    return entireName.split('.').pop() + '()';
  } else {
    return null;  // We cannot use reflection to determine the function name.
  }
};

/**
 * Helper used to throw an error when function parameters match is failed.
 * @private
 * @throws {!Error}
 */
ee.arguments.throwMatchFailedError_ = function() {
  throw new Error('Failed to locate function parameters.');
};

/**
 * Matches comments and whitespaces ([\r\n\t\f\v ]) within fn.toString()
 * output. Used with replace() to remove all comments and whitespaces from
 * fn.toString() output.
 * @const @private {!RegExp}
 */
ee.arguments.JS_COMMENT_MATCHER_ = /((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg;

/**
 * Matches a parameter list declaration within fn.toString() output. This
 * regular expression only works for functions defined with the 'function'
 * keyword. For example:
 *     setColor = function(color1, color2, color3) {...};
 * or: function setColor(color1, color2, color3) {...}
 * See below for the regular expression thats works for other cases. Note: the
 * original version includes whitespaces but they should already be removed by
 * replace(JS_COMMENT_MATCHER_), so \s is not needed here and therefore removed.
 * Original version, for your reference: /^function\s*[^\(]*\(\s*([^\)]*)\)/m
 * @const @private
 * @type {!RegExp}
 */
ee.arguments.JS_PARAM_DECL_MATCHER_FUNCTION_ = /^function[^\(]*\(([^\)]*)\)/m;

/**
 * Matches the parameter list declaration in a class constructor. This regular
 * expression only works for the class constructor that is defined with keywords
 * 'class' and 'constructor'. For example:
 *     class Animation {
 *       constructor(map, shape, frames) {...}
 *     }
 * Note: this regular expression finds the first occurrence of keyword
 * 'constructor' inside class definition, then extracts the parameters for that
 * function. If there is a function whose name is also 'constructor' defined or
 * called before the constructor, then the parameter list returned shall
 * coorespond to that function instead of the class constructor. For
 * example:
 *     class Animation {
 *       // This is fine.
 *       oneconstructor(param1, param2) {...}
 *       // This is also fine.
 *       anotherConstructor(param3, param4) {...}
 *       B () {
 *         return class C {
 *           // 'param5, param6' will be returned!
 *           constructor(param5, param6) {}
 *         };
 *       }
 *       constructor(map, shape, frames) {...}
 *    }
 * @const @private
 * @type {!RegExp}
 */
ee.arguments.JS_PARAM_DECL_MATCHER_CLASS_CONSTRUCTOR_ =
    /^class[^\{]*{\S*?\bconstructor\(([^\)]*)\)/m;

/**
 * Matches the parameter list declaration in a class method. This regular
 * expression only works for methods (other than class constructor) of a class
 * that is defined with the 'class' keyword. For example:
 *     class Animation {
 *       setColor(color1, color2, color3) {...}
 *     }
 * In the example above, we have Animation.prototype.setColor.toString() ==
 * 'setColor(color1, color2, color3) {...}'. This regular expression simply
 * extracts the string insides the first parentheses of toString()'s output.
 * @const @private
 * @type {!RegExp}
 */
ee.arguments.JS_PARAM_DECL_MATCHER_CLASS_METHOD_ = /[^\(]*\(([^\)]*)\)/m;

/**
 * Matches a default value within a function parameter. This is used to remove
 * argument defaults when parsing parameter names.
 * For example, fn(myparam = undefined) should have its parameter name parsed as
 * "myparam" rather than "myparam=undefined".
 * @const @private {!RegExp}
 */
ee.arguments.JS_PARAM_DEFAULT_MATCHER_ = /=.*$/;
