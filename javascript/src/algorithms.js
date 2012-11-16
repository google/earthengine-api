// Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview Handle dynamically loaded algorithms.
 *
 * This file takes a list of algorithms available from Google Earth Engine and
 * generates corresponding javascript functions to make it easy to generate
 * calls for to those algorithms through the EE REST API.
 *
 * Earth Engine can dynamically produce a JSON array listing the
 * algorithms available to the user.  Each item in the dictionary identifies
 * the name and return type of the algorithm, the name and type of its
 * arguments, whether they're required or optional, default values and docs
 * for each argument and the algorithms as a whole.
 *
 * This file manages the algorithm dictionary and creates javascript functions
 * to help generate calls the JSON necessary to call each EE algorithm.
 *
 */
goog.provide('ee.Algorithms');

goog.require('ee.Collection');
goog.require('ee.Feature');
goog.require('ee.FeatureCollection');
goog.require('ee.Image');
goog.require('ee.ImageCollection');
goog.require('ee.Serializer');
goog.require('ee.data');
goog.require('goog.object');


/**
 * The signature of a single algorithm argument.
 * @typedef {{
 *   name: string,
 *   type: string,
 *   optional: boolean,
 *   default: *
 * }}
 */
ee.Algorithms.argument;


/**
 * The signature of an algorithm.
 *
 * @typedef {{
 *   name: string,
 *   args: Array.<ee.Algorithms.argument>,
 *   returns: string
 * }}
 */
ee.Algorithms.signature;


/**
 * A dictionary of signatures returned from the front end.
 *
 * @type {Object.<ee.Algorithms.signature>}
 */
ee.Algorithms.signatures;


/**
 * Initialize the list of signatures from the Earth Engine front-end.
 *
 * @param {function()=} opt_callback An optional callback.  If not
 *     supplied, the call is made synchronously.
 */
ee.Algorithms.init = function(opt_callback) {
  if (!ee.Algorithms.signatures) {
    if (opt_callback) {
      var callback = function(data) {
        ee.Algorithms.signatures = data;
        opt_callback();
      };
      ee.data.getAlgorithms(callback);
    } else {
      ee.Algorithms.signatures = ee.data.getAlgorithms();
    }
  }
};


/**
 * Get an algorithm by name.
 *
 * @param {string} name The name of the algorithm to get.
 * @return {ee.Algorithms.signature} The requested algorithm signature.
 */
ee.Algorithms.get = function(name) {
  ee.Algorithms.init();
  var algorithm = ee.Algorithms.signatures[name];
  if (!algorithm) {
    throw Error('Unknown algorithm');
  }
  if (!(name in algorithm)) {
    algorithm['name'] = name;
  }
  return algorithm;
};


/**
 * Call the given algorithm with the specified arguments.
 *
 * @param {ee.Algorithms.signature} signature The signature of the function.
 * @param {Array=} opt_posArgs Optional arguments to pre-bind to this call.
 * @param {Object=} opt_namedArgs Optional arguments to pre-bind to this call.
 *
 * @return {Object} An object representing the called algorithm.  If the
 *     signature specifies a recognized return type, the returned value will
 *     be wrapped in that type.  Otherwise, the return is just the JSON
 *     description of the algorithm invocation.
 * @private
 */
ee.Algorithms.applySignature_ = function(
    signature, opt_posArgs, opt_namedArgs) {
  // Combine the positional arguments with the named args.
  var positional = opt_posArgs || [];
  var parameters = opt_namedArgs || {};

  var args = signature['args'];

  // Verify there aren't too many arguments being passed.
  var nArgs = positional.length + parameters.length;
  if (nArgs > args.length) {
    throw Error(
        'Incorrect number of arguments: ' + signature['name'] +
        ' expects no more than ' + args.length + ' arguments, got ' +
        nArgs + '.');
  }

  // Check for unknown parameters.
  var argNames = {};
  for (var i = 0; i < args.length; i++) {
    argNames[args[i]['name']] = true;
  }
  var unknown = [];
  for (var name in parameters) {
    if (!(name in argNames)) {
      unknown.push(name);
    }
  }
  if (unknown.length > 0) {
    throw Error(
        'Unrecognized arguments: ' + signature['name'] + '(' + unknown + ')');
  }

  // Add positional arguments.
  for (var i = 0; i < positional.length; i++) {
    var name = args[i]['name'];
    if (name in parameters) {
      throw Error(
          'Argument already set: ' + signature['name'] + '(' + name + ')');
    } else {
      parameters[name] = positional[i];
    }
  }

  // Promote all arguments.
  for (var i = 0; i < args.length; i++) {
    var name = args[i]['name'];
    if (name in parameters) {
      parameters[name] = ee.Algorithms.promote_(args[i]['type'],
                                                parameters[name]);
    } else {
      if (!args[i]['optional']) {
        throw 'Missing required argument: ' + name;
      }
    }
  }

  parameters['algorithm'] = signature['name'];

  // Apply return type.
  // Wrap this call in the appropriate object type.
  return ee.Algorithms.promote_(signature['returns'], parameters);
};


/**
 * Create a function that applies the given algorithm, with an optional set of
 * values to pre-bind to some of the algorithm parameters.
 *
 * @param {ee.Algorithms.signature} signature The signature of the algorithm.
 * @param {Object=} opt_boundArgs Optional arguments to pre-bind to this call.
 *
 * @return {Function} The bound function.
 */
ee.Algorithms.makeFunction = function(signature, opt_boundArgs) {
  /**
   * @this {Object}
   * @return {?} The result of the signature application.
   */
  var func = function() {
    // Add the parent object as the first arg.
    var argsIn = Array.prototype.slice.call(arguments, 0);
    argsIn.unshift(this);
    return ee.Algorithms.applySignature_(signature, argsIn, opt_boundArgs);
  };
  ee.Algorithms.document_(func, signature);
  return func;
};


/**
 * Create an aggregation function that not only constructs the JSON
 * for an algorithm call but actually runs it. The produced function accepts
 * an optional callback as its last argument.
 *
 * @param {ee.Algorithms.signature} signature The signature of the algorithm.
 * @param {Object=} opt_boundArgs Optional arguments to pre-bind to this call.
 *
 * @return {Function} The bound function.
 */
ee.Algorithms.makeAggregateFunction = function(signature, opt_boundArgs) {
  var func = ee.Algorithms.makeFunction(signature, opt_boundArgs);
  /**
   * @this {Object}
   * @return {?} The result of the signature application.
   */
  var newFunc = function() {
    var args = arguments;
    var callback = undefined;
    var lastArg = arguments[arguments.length - 1];
    if (lastArg && goog.isFunction(lastArg)) {
      callback = lastArg;
      args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
    }
    // This function is being added to the prototype of an object.  In that
    // context, 'this' in the next line will end up being that object.
    var description = func.apply(this, args);
    return ee.data.getValue(
        {'json': ee.Serializer.toJSON(description)}, callback);
  };
  newFunc['signature'] = func['signature'];
  newFunc.toString = func.toString;
  return newFunc;
};


/**
 * Create a mapping function for the given signature, with an optional set of
 * values to pre-bind to some of the function arguments.
 *
 * @param {ee.Algorithms.signature} signature The signature of the function.
 * @param {Object=} opt_boundArgs Optional arguments to pre-bind to this call.
 *
 * @return {Function} The bound function.
 */
ee.Algorithms.makeMapFunction = function(signature, opt_boundArgs) {
  /**
   * @this {Object}
   * @return {?} The result of the signature application.
   */
  var func = function() {
    var argsIn = Array.prototype.slice.call(arguments, 0);
    // Make a copy of the signature that we can munge up.
    var copy = (
        /** @type {ee.Algorithms.signature} */ goog.object.clone(signature));
    copy['returns'] = null;

    // Pop off the first argument; it's the mapping argument and wont be used.
    copy['args'] = signature['args'].slice(1);
    var parameters = /** @type {Object} */
        (ee.Algorithms.applySignature_(copy, argsIn, opt_boundArgs));
    goog.object.remove(/** @type {Object} */ (parameters), 'algorithm');

    var dynamicArgs = {};
    dynamicArgs[signature['args'][0]['name']] = '.all';
    var collectionClass = signature['returns'] == 'Image' ?
        ee.ImageCollection : ee.FeatureCollection;
    var description = {
      'constantArgs': parameters,
      'baseAlgorithm': signature['name'],
      'collection': this,
      'dynamicArgs': dynamicArgs,
      'algorithm': 'MapAlgorithm'
    };
    if (!(signature['returns'] == 'Image' ||
          signature['returns'] == 'EEObject' ||
          signature['returns'] == 'Feature')) {
      description['destination'] = signature['name'].split('.').pop();
    }
    return new collectionClass(description);
  };
  // Make a copy of the signature with the name and the first argument's type
  // updated to reflect the fact that this is a mapping function.
  var sig = /** @type {ee.Algorithms.signature} */ (goog.object.clone(
      signature));
  sig['name'] = 'Map(' + signature['name'] + ', this)';
  sig['args'] = sig['args'].slice();
  sig['args'][0] = goog.object.clone(sig['args'][0]);
  sig['args'][0]['name'] = '[' + sig['args'][0]['name'] + ']';
  sig['args'][0]['type'] = sig['args'][0]['type'] + 'Collection';
  ee.Algorithms.document_(func, sig);
  return func;
};


/**
 * Adds a toString() method for a function from a signature.
 *
 * @param {Function} func The function to document.
 * @param {ee.Algorithms.signature} signature The description of the function.
 * @param {string=} opt_name An optional override of the function name.
 * @private
 */
ee.Algorithms.document_ = function(func, signature, opt_name) {
  func['signature'] = signature;
  func.toString = function() {
    var buffer = [];
    buffer.push(opt_name || signature['name']);
    buffer.push('(');
    buffer.push(goog.array.map(signature['args'].slice(1), function(elem) {
      return elem['name'];
    }).join(', '));
    buffer.push(')\n\n');
    buffer.push(signature['description']);
    buffer.push('\n\nArgs:\n');
    for (var i = 0; i < signature['args'].length; i++) {
      if (i == 0) {
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
      buffer.push(arg['description']);
    }
    return buffer.join('');
  };
};


/**
 * Add all the functions that begin with "prefix" to the given target class.
 *
 * @param {*} target The class to add to.
 * @param {string} prefix The prefix to search for in the signatures.
 * @param {string=} opt_prepend An optional string to prepend to the names
 *     of the added functions.
 * @param {function(ee.Algorithms.signature): Function=} opt_wrapper
 *     The function to use for converting a signature into a function.
 */
ee.Algorithms.addFunctions = function(
    target, prefix, opt_prepend, opt_wrapper) {
  ee.Algorithms.init();
  var prepend = opt_prepend || '';
  var wrapper = opt_wrapper || ee.Algorithms.makeFunction;

  for (var name in ee.Algorithms.signatures) {
    var parts = name.split('.');
    if (parts.length == 2 && parts[0] == prefix) {
      var fname = prepend + parts[1];
      var signature = ee.Algorithms.signatures[name];
      signature.name = name;
      if (fname in target.prototype) {
        // Don't overwrite existing functions; suffix them with '_'.
        fname = fname + '_';
      }
      target.prototype[fname] = wrapper(signature);
    }
  }
};


/**
 * Wrap an argument or result in an object of the specified type.  This is used
 * to, for example, promote numbers or strings to Images and arrays to
 * Collections.
 *
 * @param {string} type The expected type.
 * @param {*} arg The object to promote.
 * @return {Object} The argument promoted if the type is recognized, otherwise
 *     the original argument.
 * @private
 */
ee.Algorithms.promote_ = function(type, arg) {
  switch (type) {
    case 'Image':
      return new ee.Image(/** @type {Object} */ (arg));
    case 'ImageCollection':
      return new ee.ImageCollection(/** @type {Object} */ (arg));
    case 'Feature':
    case 'EEObject':
      if (arg instanceof ee.Collection) {
        return {
          'type': 'Feature',
          'geometry': arg.geometry(),
          'properties': {}
        };
      } else {
        return new ee.Feature(/** @type {Object} */ (arg));
      }
    case 'FeatureCollection':
    case 'EECollection':
      return new ee.FeatureCollection(/** @type {Object} */ (arg));
    case 'ErrorMargin':
      if (goog.isNumber(arg)) {
        return {
          'type': 'ErrorMargin',
          'unit': 'meters',
          'value': /** @type {number} */ (arg)
        };
      } else {
        return /** @type {Object} */ (arg);
      }
    default:
      return /** @type {Object} */ (arg);
  }
};

// These are exported for testing.
// TODO(user): Move all the test code into its own file and remove these.
goog.exportSymbol('ee.Algorithms', ee.Algorithms);
goog.exportSymbol('ee.Algorithms.addFunctions', ee.Algorithms.addFunctions);
goog.exportSymbol('ee.Algorithms.applySignature_',
                  ee.Algorithms.applySignature_);
goog.exportSymbol('ee.Algorithms.init', ee.Algorithms.init);
goog.exportSymbol('ee.Algorithms.get', ee.Algorithms.get);
