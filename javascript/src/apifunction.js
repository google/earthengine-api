/**
 * @fileoverview A class for representing built-in EE API Function.
 *
 * Earth Engine can dynamically produce a JSON array listing the
 * algorithms available to the user.  Each item in the dictionary identifies
 * the name and return type of the algorithm, the name and type of its
 * arguments, whether they're required or optional, default values and docs
 * for each argument and the algorithms as a whole.
 *
 * This class manages the algorithm dictionary and creates JavaScript functions
 * to apply each EE algorithm.
 */

goog.provide('ee.ApiFunction');

goog.require('ee.ComputedObject');
goog.require('ee.Function');
goog.require('ee.Types');
goog.require('ee.data');
goog.require('ee.rpc_node');
goog.require('goog.object');
goog.requireType('ee.Encodable');
goog.requireType('ee.api');



/**
 * Creates a function defined by the EE API.
 * @param {string} name The name of the function.
 * @param {!ee.Function.Signature|!ee.data.AlgorithmSignature=} opt_signature
 *     The signature of the function. If unspecified, looked up dynamically.
 * @constructor
 * @extends {ee.Function}
 */
ee.ApiFunction = function(name, opt_signature) {
  if (opt_signature === undefined) {
    return ee.ApiFunction.lookup(name);
  } else if (!(this instanceof ee.ApiFunction)) {
    return ee.ComputedObject.construct(ee.ApiFunction, arguments);
  }

  /**
   * The signature of this API function.
   * @type {!ee.Function.Signature}
   * @private
   */
  this.signature_ = /** @type {!ee.Function.Signature} */ (
      goog.object.unsafeClone(opt_signature));
  this.signature_['name'] = name;
};
goog.inherits(ee.ApiFunction, ee.Function);
// Exporting manually to avoid marking the class public in the docs.
goog.exportSymbol('ee.ApiFunction', ee.ApiFunction);


/**
 * Calls a named API function with the given positional arguments.
 *
 * @param {string} name The name of the API function to call.
 * @param {...*} var_args Positional arguments to pass to the function.
 * @return {!ee.ComputedObject} An object representing the called function.
 *     If the signature specifies a recognized return type, the returned
 *     value will be cast to that type.
 * @export
 */
ee.ApiFunction._call = function(name, var_args) {
  return ee.Function.prototype.call.apply(
      ee.ApiFunction.lookup(name), Array.prototype.slice.call(arguments, 1));
};


/**
 * Call a named API function with a dictionary of named arguments.
 *
 * @param {string} name The name of the API function to call.
 * @param {!Object} namedArgs A dictionary of arguments to the function.
 * @return {!ee.ComputedObject} An object representing the called function.
 *     If the signature specifies a recognized return type, the returned
 *     value will be cast to that type.
 * @export
 */
ee.ApiFunction._apply = function(name, namedArgs) {
  return ee.ApiFunction.lookup(name).apply(namedArgs);
};


/** @override */
ee.ApiFunction.prototype.encode = function(encoder) {
  return this.signature_['name'];
};


/** @override @return {!ee.api.ValueNode} */
ee.ApiFunction.prototype.encodeCloudInvocation = function(
    /** !ee.Encodable.Serializer */ serializer, /** ? */ args) {
  return ee.rpc_node.functionByName(this.signature_['name'], args);
};


/** @override */
ee.ApiFunction.prototype.getSignature = function() {
  return this.signature_;
};


/**
 * A dictionary of functions defined by the API server.
 *
 * @type {?Object.<!ee.ApiFunction>}
 * @private
 */
ee.ApiFunction.api_ = null;


/**
 * A set of algorithm names containing all algorithms that have been bound to
 * a function so far using importApi().
 *
 * @type {!Object.<boolean>}
 * @private
 */
ee.ApiFunction.boundSignatures_ = {};


/**
 * @return {!Object.<!ee.Function.Signature>} A map from the name to signature
 *     for all API functions.
 */
ee.ApiFunction.allSignatures = function() {
  ee.ApiFunction.initialize();
  return goog.object.map(ee.ApiFunction.api_, function(func) {
    return func.getSignature();
  });
};


/**
 * Returns the functions that have not been bound using importApi() yet.
 *
 * @return {!Object.<ee.ApiFunction>} A map from name to function.
 */
ee.ApiFunction.unboundFunctions = function() {
  ee.ApiFunction.initialize();
  return goog.object.filter(ee.ApiFunction.api_, function(func, name) {
    return !ee.ApiFunction.boundSignatures_[name];
  });
};


/**
 * Looks up an API function by name.
 *
 * @param {string} name The name of the function to get.
 * @return {!ee.ApiFunction} The requested function.
 * @export
 */
ee.ApiFunction.lookup = function(name) {
  const func = ee.ApiFunction.lookupInternal(name);
  if (!func) {
    throw Error('Unknown built-in function name: ' + name);
  }
  return func;
};


/**
 * Looks up an API function by name, but doesn't throw an error.
 *
 * @param {string} name The name of the function to get.
 * @return {!ee.ApiFunction} The requested function or null if it's not found.
 */
ee.ApiFunction.lookupInternal = function(name) {
  ee.ApiFunction.initialize();
  return ee.ApiFunction.api_[name] || null;
};


/**
 * Initializes the list of signatures from the Earth Engine front-end.
 *
 * @param {function()=} opt_successCallback An optional success callback.
 *     If not supplied, the call is made synchronously.
 * @param {function(!Error)=} opt_failureCallback An optional failure callback.
 *     Only valid if opt_successCallback is specified.
 */
ee.ApiFunction.initialize = function(opt_successCallback, opt_failureCallback) {
  if (!ee.ApiFunction.api_) {
    /**
     * @param {?ee.data.AlgorithmsRegistry} data
     * @param {string=} opt_error
     */
    const callback = function(data, opt_error) {
      if (opt_error) {
        if (opt_failureCallback) {
          opt_failureCallback(Error(opt_error));
        }
        return;
      }

      ee.ApiFunction.api_ = goog.object.map(data, function(sig, name) {
        // Strip type parameters.
        sig.returns = sig.returns.replace(/<.*>/, '');
        for (let i = 0; i < sig.args.length; i++) {
          sig.args[i].type = sig.args[i].type.replace(/<.*>/, '');
        }
        return new ee.ApiFunction(name, sig);
      });
      if (opt_successCallback) opt_successCallback();
    };
    if (opt_successCallback) {
      ee.data.getAlgorithms(callback);
    } else {
      callback(
          /** @type {!ee.data.AlgorithmsRegistry} */ (ee.data.getAlgorithms()));
    }
  } else if (opt_successCallback) {
    // The API signatures have previously been initialized by some
    // other means. Immediately execute the callback.
    opt_successCallback();
  }
};


/**
 * Clears the API functions list so it will be reloaded from the server.
 */
ee.ApiFunction.reset = function() {
  ee.ApiFunction.api_ = null;
  ee.ApiFunction.boundSignatures_ = {};
};


/**
 * Adds all API functions that begin with a given prefix to a target class.
 *
 * @param {!Function|!Object} target The class to add to.
 * @param {string} prefix The prefix to search for in the signatures.
 * @param {string} typeName The name of the object's type. Functions whose
 *     first argument matches this type are bound as instance methods, and
 *     those whose first argument doesn't match are bound as static methods.
 * @param {string=} opt_prepend An optional string to prepend to the names
 *     of the added functions.
 */
ee.ApiFunction.importApi = function(target, prefix, typeName, opt_prepend) {
  ee.ApiFunction.initialize();
  const prepend = opt_prepend || '';
  goog.object.forEach(ee.ApiFunction.api_, function(apiFunc, name) {
    const parts = name.split('.');
    if (parts.length == 2 && parts[0] == prefix) {
      const fname = prepend + parts[1];
      const signature = apiFunc.getSignature();

      // Mark signatures as used.
      ee.ApiFunction.boundSignatures_[name] = true;

      // Decide whether this is a static or an instance function.
      let isInstance = false;
      if (signature['args'].length) {
        const firstArgType = signature['args'][0]['type'];
        isInstance = firstArgType != 'Object' &&
                     ee.Types.isSubtype(firstArgType, typeName);
      }
      // Assume we have a constructor Function if we get an instance method.
      const destination =
          isInstance ? /** @type {!Function} */(target).prototype : target;

      if (fname in destination && !destination[fname]['signature']) {
        // Don't overwrite client-defined functions.
        return;
      }

      // Add the actual function
      /**
       * @param {*} var_args
       * @return {!ee.ComputedObject}
       * @this {*}
       **/
      destination[fname] = function(var_args) {
        return apiFunc.callOrApply(
            isInstance ? this : undefined,
            Array.prototype.slice.call(arguments, 0));
      };
      // Add a friendly formatting.
      destination[fname].toString =
          goog.bind(apiFunc.toString, apiFunc, fname, isInstance);
      // Attach the signature object for documentation generators.
      destination[fname]['signature'] = signature;
    }
  });
};


/**
 * Removes all methods added by importApi() from a target class.
 * @param {!Function|!Object} target The class to remove from.
 */
ee.ApiFunction.clearApi = function(target) {
  const clear = function(target) {
    for (const name in target) {
      if (typeof target[name] === 'function' && target[name]['signature']) {
        delete target[name];
      }
    }
  };
  clear(target);
  clear(/** @type {!Function} */ (target).prototype || {});
};
