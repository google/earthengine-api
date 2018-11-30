/**
 * @fileoverview Initialization and convenience functions for the EE library.
 */

goog.provide('ee');
goog.provide('ee.Algorithms');
goog.provide('ee.InitState');

goog.require('ee.ApiFunction');
goog.require('ee.Collection');
goog.require('ee.ComputedObject');
goog.require('ee.CustomFunction');
goog.require('ee.Date');
goog.require('ee.Dictionary');
goog.require('ee.Element');
goog.require('ee.Encodable');
goog.require('ee.Feature');
goog.require('ee.FeatureCollection');
goog.require('ee.Filter');
goog.require('ee.Function');
goog.require('ee.Geometry');
goog.require('ee.Image');
goog.require('ee.ImageCollection');
goog.require('ee.List');
goog.require('ee.Number');
goog.require('ee.String');
goog.require('ee.Terrain');
goog.require('ee.Types');
/** @suppress {extraRequire} */
goog.require('ee.batch');
goog.require('ee.data');
goog.require('goog.array');
goog.require('goog.object');


/**
 * Initialize the library.  If this hasn't been called by the time any
 * object constructor is used, it will be called then.  If this is called
 * a second time with a different baseurl or tileurl, this doesn't do an
 * un-initialization of e.g.: the previously loaded Algorithms, but will
 * overwrite them and let point at alternate servers.
 *
 * If initialize() is first called in asynchronous mode (by passing a success
 * callback), any future asynchronous mode calls will add their callbacks to a
 * queue and all the callbacks will be run together.
 *
 * If a synchronous mode call is made after any number of asynchronous calls,
 * it will block and execute all the previously supplied callbacks before
 * returning.
 *
 * In most cases, an authorization token should be set before the library
 * is initialized, either with ee.data.authorize() or ee.data.setAuthToken().
 * When a proxy is used, an auth token may not be required.
 *
 * @param {string?=} opt_baseurl The (proxied) EarthEngine REST API endpoint.
 * @param {string?=} opt_tileurl The (unproxied) EarthEngine REST tile endpoint.
 * @param {function()?=} opt_successCallback An optional callback to be invoked
 *     when the initialization is successful. If not provided, the
 *     initialization is done synchronously.
 * @param {function(Error)?=} opt_errorCallback An optional callback to be
 *     invoked with an error if the initialization fails.
 * @param {string?=} opt_xsrfToken A string to pass in the "xsrfToken"
 *     parameter of EE API XHRs.
 * @export
 */
ee.initialize = function(
    opt_baseurl, opt_tileurl, opt_successCallback, opt_errorCallback,
    opt_xsrfToken) {
  // If we're already initialized and not getting new parameters, just return.
  if (ee.ready_ == ee.InitState.READY && !opt_baseurl && !opt_tileurl) {
    if (opt_successCallback) {
      opt_successCallback();
    }
    return;
  }

  var isAsynchronous = goog.isDefAndNotNull(opt_successCallback);

  // Register the error callback.
  if (opt_errorCallback) {
    if (isAsynchronous) {
      ee.errorCallbacks_.push(opt_errorCallback);
    } else {
      throw Error('Can\'t pass an error callback without a success callback.');
    }
  }

  // If we're already loading, and this is asynchronous, register the success
  // callback and return. Synchronous initialization runs immediately,
  // effectively overriding the currently running asynchronous one.
  if (ee.ready_ == ee.InitState.LOADING && isAsynchronous) {
    ee.successCallbacks_.push(opt_successCallback);
    return;
  }

  ee.ready_ = ee.InitState.LOADING;
  ee.data.initialize(opt_baseurl, opt_tileurl, opt_xsrfToken);

  if (isAsynchronous) {
    ee.successCallbacks_.push(opt_successCallback);
    ee.ApiFunction.initialize(
        ee.initializationSuccess_, ee.initializationFailure_);
  } else {
    try {
      ee.ApiFunction.initialize();
      ee.initializationSuccess_();
    } catch (e) {
      ee.initializationFailure_(e);
      throw e;
    }
  }
};


/**
 * Reset the library to its base state. Useful for re-initializing to a
 * different server.
 * @export
 */
ee.reset = function() {
  ee.ready_ = ee.InitState.NOT_READY;
  ee.data.reset();
  ee.ApiFunction.reset();
  ee.Date.reset();
  ee.Dictionary.reset();
  ee.Element.reset();
  ee.Image.reset();
  ee.Feature.reset();
  ee.Collection.reset();
  ee.ImageCollection.reset();
  ee.FeatureCollection.reset();
  ee.Filter.reset();
  ee.Geometry.reset();
  ee.List.reset();
  ee.Number.reset();
  ee.String.reset();
  ee.Terrain.reset();
  ee.resetGeneratedClasses_();
  // Can't simply reassign ee.Algorithms to {} since it's been exported by
  // reference.
  goog.object.clear(ee.Algorithms);
};


/**
 * The possible states for the library initialization function.  We want
 * to prohibit multiple overlapping calls, and allow the user a way to poll
 * to see what the state is.
 *
 * @enum {string}
 * @export
 */
ee.InitState = {
  NOT_READY: 'not_ready',
  LOADING: 'loading',
  READY: 'ready'
};
// @export does not work on enum properties.
goog.exportSymbol('ee.InitState.NOT_READY', ee.InitState.NOT_READY);
goog.exportSymbol('ee.InitState.LOADING', ee.InitState.LOADING);
goog.exportSymbol('ee.InitState.READY', ee.InitState.READY);


/**
 * A flag to indicate the initialization state.
 * @type {ee.InitState}
 * @private
 */
ee.ready_ = ee.InitState.NOT_READY;


/**
 * The list of callbacks to call on successful initialization. Added by
 * initialize() and cleared by initializationSuccess_() and
 * initializationFailure_().
 * @type {Array.<function()?>}
 * @private
 */
ee.successCallbacks_ = [];


/**
 * The list of callbacks to call on failed initialization. Added by
 * initialize() and cleared by initializationSuccess_() and
 * initializationFailure_().
 * @type {Array.<function(Error)>}
 * @private
 */
ee.errorCallbacks_ = [];


/**
 * @type {number} The size of a tile generated by the /map servlet.
 * @const
 * @export
 */
ee.TILE_SIZE = 256;


/**
 * The list of auto-generated class names.
 * @type {Array.<string>}
 * @private
 */
ee.generatedClasses_ = [];


/**
 * A dictionary of algorithms that are not bound to a specific class. Can
 * contain nested namespaces (e.g. ee.Algorithms.Landsat.SimpleComposite).
 * @type {Object.<Object|Function>}
 * @export
 */
ee.Algorithms = {};


/**
 * @return {ee.InitState} The initialization status.
 */
ee.ready = function() {
  return ee.ready_;
};


/**
 * Call a function with the given positional arguments.
 *
 * @param {ee.Function|string} func The function to call. Either an
 *     ee.Function object or the name of an API function.
 * @param {...*} var_args Positional arguments to pass to the function.
 * @return {ee.ComputedObject} An object representing the called function.
 *     If the signature specifies a recognized return type, the returned
 *     value will be cast to that type.
 * @export
 */
ee.call = function(func, var_args) {
  if (goog.isString(func)) {
    func = new ee.ApiFunction(func);
  }
  // Extract var_args.
  var args = Array.prototype.slice.call(arguments, 1);
  // Call func.call with the extracted agrs.
  return ee.Function.prototype.call.apply(func, args);
};


/**
 * Call a function with a dictionary of named arguments.
 *
 * @param {ee.Function|string} func The function to call. Either an
 *     ee.Function object or the name of an API function.
 * @param {Object} namedArgs A dictionary of arguments to the function.
 * @return {ee.ComputedObject} An object representing the called function.
 *     If the signature specifies a recognized return type, the returned
 *     value will be cast to that type.
 * @export
 */
ee.apply = function(func, namedArgs) {
  if (goog.isString(func)) {
    func = new ee.ApiFunction(func);
  }
  return func.apply(namedArgs);
};


/**
 * Finishes the initialization of the library, assuming ApiFunction has been
 * initialized successfully.
 * @private
 */
ee.initializationSuccess_ = function() {
  if (ee.ready_ != ee.InitState.LOADING) {
    // We have already been called. Can happen if a blocking initialization is
    // started while an asynchronous one is in progress. The asynchronous one
    // will report success after the synchronous one has already reported
    // success or failure.
    return;
  }

  try {
    // Update classes with bound methods.
    ee.Date.initialize();
    ee.Dictionary.initialize();
    ee.Element.initialize();
    ee.Image.initialize();
    ee.Feature.initialize();
    ee.Collection.initialize();
    ee.ImageCollection.initialize();
    ee.FeatureCollection.initialize();
    ee.Filter.initialize();
    ee.Geometry.initialize();
    ee.List.initialize();
    ee.Number.initialize();
    ee.String.initialize();
    ee.Terrain.initialize();

    // Generate trivial classes.
    ee.initializeGeneratedClasses_();
    ee.initializeUnboundMethods_();
  } catch (e) {
    ee.initializationFailure_(e);
    return;
  }

  // Declare ourselves ready.
  ee.ready_ = ee.InitState.READY;

  // Clear failure callbacks.
  ee.errorCallbacks_ = [];

  // Call success callbacks.
  while (ee.successCallbacks_.length > 0) {
    // If one of these throws an exception, we explode. Maybe we should ignore
    // it and continue?
    ee.successCallbacks_.shift()();
  }
};


/**
 * Reports initialization failure.
 * @param {Error} e The cause of the failure.
 * @private
 */
ee.initializationFailure_ = function(e) {
  if (ee.ready_ != ee.InitState.LOADING) {
    // Duplicate call. See reasoning in ee.initializationSuccess_.
    return;
  }

  // Declare ourselves unready.
  ee.ready_ = ee.InitState.NOT_READY;

  // Clear success callbacks.
  ee.successCallbacks_ = [];

  // Call failure callbacks.
  while (ee.errorCallbacks_.length > 0) {
    // If one of these throws an exception, we explode. Maybe we should ignore
    // it and continue?
    ee.errorCallbacks_.shift()(e);
  }
};


/**
 * Wrap an argument in an object of the specified class. This is used to
 * e.g.: promote numbers or strings to Images and arrays to Collections.
 *
 * @param {?} arg The object to promote.
 * @param {string} klass The expected type.
 * @return {?} The argument promoted if the class is recognized, otherwise the
 *     original argument.
 * @private
 * @suppress {accessControls} We are calling functions with partial promotion.
 */
ee.promote_ = function(arg, klass) {
  if (goog.isNull(arg)) {
    return null;
  } else if (!goog.isDef(arg)) {
    return undefined;
  }

  var exportedEE = goog.global['ee'];

  switch (klass) {
    case 'Image':
      return new ee.Image(/** @type {Object} */ (arg));
    case 'Feature':
      if (arg instanceof ee.Collection) {
        // TODO(user): Decide whether we want to leave this in. It can be
        //              quite dangerous on large collections.
        return ee.ApiFunction._call(
            'Feature', ee.ApiFunction._call('Collection.geometry', arg));
      } else {
        return new ee.Feature(/** @type {Object} */ (arg));
      }
    case 'Element':
      if (arg instanceof ee.Element) {
        // Already an Element.
        return arg;
      } else if (arg instanceof ee.Geometry) {
        // Geometries get promoted to Features.
        return new ee.Feature(/** @type {ee.Geometry} */ (arg));
      } else if (arg instanceof ee.ComputedObject) {
        // Try a cast.
        var co = /** @type {ee.ComputedObject} */ (arg);
        return new ee.Element(co.func, co.args, co.varName);
      } else {
        // No way to convert.
        throw Error('Cannot convert ' + arg + ' to Element.');
      }
    case 'Geometry':
      if (arg instanceof ee.FeatureCollection) {
        return ee.ApiFunction._call('Collection.geometry', arg);
      } else {
        return new ee.Geometry(/** @type {?} */ (arg));
      }
    case 'FeatureCollection':
    case 'Collection':  // For now this is synonymous with FeatureCollection.
      if (arg instanceof ee.Collection) {
        return arg;
      } else {
        return new ee.FeatureCollection(/** @type {?} */ (arg));
      }
    case 'ImageCollection':
      return new ee.ImageCollection(/** @type {?} */ (arg));
    case 'Filter':
      return new ee.Filter(/** @type {Object} */ (arg));
    case 'Algorithm':
      if (goog.isString(arg)) {
        // An API function name.
        return new ee.ApiFunction(arg);
      } else if (goog.isFunction(arg)) {
        // A native function that needs to be wrapped.
        return ee.CustomFunction.create(
            arg, 'Object', goog.array.repeat('Object', arg.length));
      } else if (arg instanceof ee.Encodable) {
        // An ee.Function or a computed function like the return value of
        // Image.parseExpression().
        return arg;
      } else {
        throw Error('Argument is not a function: ' + arg);
      }
    case 'String':
      if (ee.Types.isString(arg) ||
          arg instanceof ee.String ||
          arg instanceof ee.ComputedObject) {
        return new ee.String(arg);
      } else {
        return arg;
      }
    case 'Dictionary':
      if (ee.Types.isRegularObject(arg)) {
        return arg;
      } else {
        return new ee.Dictionary(/** @type {?} */ (arg));
      }
    case 'List':
      return new ee.List(/** @type {?} */ (arg));
    case 'Number':
    case 'Float':
    case 'Long':
    case 'Integer':
    case 'Short':
    case 'Byte':
      return new ee.Number(/** @type {?} */ (arg));
    default:
      // Handle dynamically generated classes.
      if (klass in exportedEE) {
        var ctor = ee.ApiFunction.lookupInternal(klass);
        if (arg instanceof exportedEE[klass]) {
          // Return unchanged.
          return arg;
        } else if (ctor) {
          // The client-side constructor will call the server-side constructor.
          return new exportedEE[klass](arg);
        } else if (goog.isString(arg)) {
          if (arg in exportedEE[klass]) {
            // arg is the name of a method on klass.
            return exportedEE[klass][arg].call();
          } else {
            throw new Error('Unknown algorithm: ' + klass + '.' + arg);
          }
        } else {
          // Client-side cast.
          return new exportedEE[klass](arg);
        }
      } else {
        // Don't know.
        return arg;
      }
  }
};


/**
 * Puts any unbound API methods on ee.Algorithms.
 *
 * @private
 */
ee.initializeUnboundMethods_ = function() {
  var unbound = ee.ApiFunction.unboundFunctions();
  goog.object.getKeys(unbound).sort().forEach(function(name) {
    var func = unbound[name];
    var signature = func.getSignature();
    if (signature['hidden']) {
      return;
    }

    // Create nested objects as needed.
    var nameParts = name.split('.');
    var target = ee.Algorithms;
    target['signature'] = {};
    while (nameParts.length > 1) {
      var first = nameParts[0];
      if (!(first in target)) {
        // We must add a signature property so the playground docbox recognizes
        // these objects as parts of the API.
        target[first] = {'signature': {}};
      }
      target = target[first];
      nameParts = goog.array.slice(nameParts, 1);
    }

    // Attach the function.
    var bound = function(var_args) {
      return func.callOrApply(
          undefined, Array.prototype.slice.call(arguments, 0));
    };
    bound['signature'] = signature;
    bound.toString = goog.bind(func.toString, func);
    target[nameParts[0]] = bound;
  });
};


/**
 * Autogenerate any classes that meet the following criteria:
 *   - There's 1 or more functions named TYPE.*
 *   - There's 1 or more functions that return that type.
 *   - The class doesn't already exist as an ee.TYPE.
 *
 * @private
 * @suppress {accessControls} We update ApiFunction.boundSignatures_.
 */
ee.initializeGeneratedClasses_ = function() {
  var signatures = ee.ApiFunction.allSignatures();

  // Collect all the type names from functions, and all the return types.
  var names = {};
  var returnTypes = {};
  for (var sig in signatures) {
    var type;
    if (sig.indexOf('.') != -1) {
      type = sig.slice(0, sig.indexOf('.'));
    } else {
      type = sig;
    }
    names[type] = true;
    // Strip off extra type info.  e.g.: Dictionary<Object>
    var rtype = signatures[sig]['returns'].replace(/<.*>/, '');
    returnTypes[rtype] = true;
  }

  // Create classes with names in both, excluding any types that already exist.
  var exportedEE = goog.global['ee'];
  for (var name in names) {
    if (name in returnTypes && !(name in exportedEE)) {
      exportedEE[name] = ee.makeClass_(name);
      ee.generatedClasses_.push(name);
      // Mark this class as a constructor if it is.
      if (signatures[name]) {
        exportedEE[name]['signature'] = signatures[name];
        exportedEE[name]['signature']['isConstructor'] = true;
        ee.ApiFunction.boundSignatures_[name] = true;
      } else {
        exportedEE[name]['signature'] = {};
      }
    }
  }
  ee.Types.registerClasses(exportedEE);
};


/**
 * Remove the classes added by initializeGeneratedClasses.
 * @private
 */
ee.resetGeneratedClasses_ = function() {
  var exportedEE = goog.global['ee'];
  for (var i = 0; i < ee.generatedClasses_.length; i++) {
    var name = ee.generatedClasses_[i];
    ee.ApiFunction.clearApi(exportedEE[name]);
    delete exportedEE[name];
  }
  ee.generatedClasses_ = [];
  ee.Types.registerClasses(exportedEE);
};


/**
 * Dynamically make an ee helper class.
 *
 * @param {string} name The name of the class to create.
 * @return {Function} The generated class.
 * @private
 * @suppress {accessControls}
 */
ee.makeClass_ = function(name) {
  /**
   * Construct a new instance of the given class.
   *
   * @param {...*} var_args The constructor args.  Can be one of:
   *   1) A computed value to be promoted to this type.
   *   2) Arguments to be passed to the algorithm with the same name as
   *      this class.
   *
   * @return {*} The newly created class.
   *
   * @constructor
   * @extends {ee.ComputedObject}
   *
   * TODO(user): Generate docs for these classes.
   */
  var target = function(var_args) {
    var klass = goog.global['ee'][name];
    var args = Array.prototype.slice.call(arguments);
    var onlyOneArg = (args.length == 1);

    // Are we trying to cast something that's already of the right class?
    if (onlyOneArg && args[0] instanceof klass) {
      return args[0];
    }

    // Constructor safety.
    if (!(this instanceof klass)) {
      return ee.ComputedObject.construct(klass, args);
    }

    // Decide whether to call a server-side constructor or just do a
    // client-side cast.
    var ctor = ee.ApiFunction.lookupInternal(name);
    var firstArgIsPrimitive = !(args[0] instanceof ee.ComputedObject);
    var shouldUseConstructor = false;
    if (ctor) {
      if (!onlyOneArg) {
        // Can't client-cast multiple arguments.
        shouldUseConstructor = true;
      } else if (firstArgIsPrimitive) {
        // Can't cast a primitive.
        shouldUseConstructor = true;
      } else if (args[0].func != ctor) {
        // We haven't already called the constructor on this object.
        shouldUseConstructor = true;
      }
    }

    // Apply our decision.
    if (shouldUseConstructor) {
      // Call manually to avoid having promote() called on the output.
      target.base(this, 'constructor',
          ctor, ctor.promoteArgs(ctor.nameArgs(args)));
    } else {
      // Just cast and hope for the best.
      if (!onlyOneArg) {
        // We don't know what to do with multiple args.
        throw Error('Too many arguments for ee.' + name + '(): ' + args);
      } else if (firstArgIsPrimitive) {
        // Can't cast a primitive.
        throw Error('Invalid argument for ee.' + name + '(): ' + args +
                    '. Must be a ComputedObject.');
      }
      var theOneArg = args[0];
      target.base(this, 'constructor',
          theOneArg.func, theOneArg.args, theOneArg.varName);
    }
  };
  goog.inherits(target, ee.ComputedObject);
  target.prototype.name = function() { return name; };
  ee.ApiFunction.importApi(target, name, name);
  return target;
};

// Set up type promotion rules as soon the library is loaded.
ee.Function.registerPromoter(ee.promote_);
