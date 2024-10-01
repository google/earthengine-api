/**
 * @fileoverview A representation of a computed earthengine object.
 */

goog.provide('ee.ComputedObject');

goog.require('ee.Encodable');
goog.require('ee.Serializer');
goog.require('ee.api');
goog.require('ee.data');
goog.require('ee.rpc_node');
goog.requireType('ee.Function');

/**
 * An object to represent a computed Earth Engine object, a base for most
 * API objects.
 *
 * This is used to wrap the return values of algorithms that produce
 * unrecognized types with the minimal functionality necessary to
 * interact well with the rest of the API.
 *
 * ComputedObjects come in two flavors:
 * 1. If func != null and args != null, the ComputedObject is encoded as an
 *    invocation of func with args.
 * 2. If func == null and args == null, the ComputedObject is a variable
 *    reference. The variable name is stored in its varName member. Note that
 *    in this case, varName may still be null; this allows the name to be
 *    deterministically generated at a later time. This is used to generate
 *    deterministic variable names for mapped functions, ensuring that nested
 *    mapping calls do not use the same variable name.
 *
 * @param {?ee.Function} func The function called to compute this
 *     object, either as an Algorithm name or an ee.Function object.
 * @param {?Object} args A dictionary of arguments to pass to the specified
 *     function. Note that the caller is responsible for promoting the
 *     arguments to the correct types.
 * @param {?string=} opt_varName A variable name. If not null, the object will
 *     be encoded as a reference to a CustomFunction variable of this name,
 *     and both 'func' and 'args' must be null. If all arguments are null, the
 *     object is considered an unnamed variable, and a name will be generated
 *     when it is included in an ee.CustomFunction.
 * @param {?boolean=} opt_unbound Whether the object is unbound, i.e., called
 *     from a mapped or iterated function.
 * @constructor
 * @extends {ee.Encodable}
 * @template T
 */
ee.ComputedObject = function(func, args, opt_varName, opt_unbound) {
  // Constructor safety.
  if (!(this instanceof ee.ComputedObject)) {
    return ee.ComputedObject.construct(ee.ComputedObject, arguments);
  }

  if (opt_varName && (func || args)) {
    throw Error('When "opt_varName" is specified, ' +
                '"func" and "args" must be null.');
  } else if (func && !args) {
    throw Error('When "func" is specified, "args" must not be null.');
  }

  /**
   * The Function called to compute this object.
   * @type {?ee.Function}
   * @protected
   */
  this.func = func;

  /**
   * The arguments passed to the function.
   * @type {?Object}
   * @protected
   */
  this.args = args;

  /**
   * The name of the variable which this ComputedObject represents.
   * @type {?string}
   * @protected
   */
  this.varName = opt_varName || null;

  /**
   * Whether the computed object is an unbound variable.
   * @type {boolean}
   */
  this.unbound = !!opt_unbound;
};
goog.inherits(ee.ComputedObject, ee.Encodable);
// Exporting manually to avoid marking the class public in the docs.
goog.exportSymbol('ee.ComputedObject', ee.ComputedObject);


/**
 * Asynchronously retrieves the value of this object from the server and
 * passes it to the provided callback function.
 *
 * @param {function (T, string=)} callback A function of the form
 *     function(success, failure), called when the server returns an answer.
 *     If the request succeeded, the success argument contains the evaluated
 *     result.  If the request failed, the failure argument will contains an
 *     error message.
 * @export
 */
ee.ComputedObject.prototype.evaluate = function(callback) {
  if (!callback || typeof callback !== 'function') {
    throw Error('evaluate() requires a callback function.');
  }
  ee.data.computeValue(this, callback);
};


/**
 * Retrieves the value of this object from the server.
 *
 * If no callback function is provided, the request is made synchronously. If
 * a callback is provided, the request is made asynchronously.
 *
 * The asynchronous mode is preferred because the synchronous mode stops all
 * other code (for example, the EE Code Editor UI) while waiting for the server.
 * To make an asynchronous request, evaluate() is preferred over getInfo().
 *
 * @param {function (T, string=): ?=} opt_callback An optional
 *     callback. If not supplied, the call is made synchronously.
 * @return {T} The computed value of this object.
 * @export
 */
ee.ComputedObject.prototype.getInfo = function(opt_callback) {
  return ee.data.computeValue(this, opt_callback);
};


/** @override */
ee.ComputedObject.prototype.encode = function(encoder) {
  if (this.isVariable()) {
    return {
      'type': 'ArgumentRef',
      'value': this.varName
    };
  } else {
    var encodedArgs = {};
    for (var name in this.args) {
      if (this.args[name] !== undefined) {
        encodedArgs[name] = encoder(this.args[name]);
      }
    }
    var result = {
      'type': 'Invocation',
      'arguments': encodedArgs
    };
    var func = encoder(this.func);
    result[typeof func === 'string' ? 'functionName' : 'function'] = func;
    return result;
  }
};


/**
 * @override @type {function(this:ee.ComputedObject,!ee.Encodable.Serializer)}
 */
ee.ComputedObject.prototype.encodeCloudValue = function(serializer) {
  if (this.isVariable()) {
    const name = this.varName || serializer.unboundName;
    if (!name) {
      if (this.unbound) {
        // We are trying to call getInfo() or make some other server call inside
        // a function passed to collection.map() or .iterate(), and the call
        // uses one of the function arguments. The argument will be unbound
        // outside of the map operation and cannot be evaluated. See the Count
        // Functions case in customfunction.js for details on the unboundName
        // mechanism.
        // TODO(user): Report the name of the offending argument.
        throw new Error(`A mapped function's arguments (${
            this.name()}) cannot be used in client-side operations.`);
      } else {
        throw new Error(
            `Invalid cast to ${this.name()} from a client-side object.`);
      }
    }
    return ee.rpc_node.argumentReference(name);
  } else {
    /** @type {!Object<string,!ee.api.ValueNode>} */
    const encodedArgs = {};
    for (const name in this.args) {
      if (this.args[name] !== undefined) {
        encodedArgs[name] =
            ee.rpc_node.reference(serializer.makeReference(this.args[name]));
      }
    }
    return typeof this.func === 'string' ?
        ee.rpc_node.functionByName(String(this.func), encodedArgs) :
        this.func.encodeCloudInvocation(serializer, encodedArgs);
  }
};


/**
 * @return {string} The serialized representation of this object.
 * @param {boolean=} legacy Enables legacy format.
 * @export
 */
ee.ComputedObject.prototype.serialize = function(legacy = false) {
  return legacy ? ee.Serializer.toJSON(this) :
                  ee.Serializer.toCloudApiJSON(this);
};


/**
 * @return {string} A human-readable representation of the object.
 * @override
 */
ee.ComputedObject.prototype.toString = function() {
  return 'ee.' + this.name() + '(' + ee.Serializer.toReadableJSON(this) + ')';
};
// Exporting manually to avoid marking the method public in the docs.
goog.exportSymbol('ee.ComputedObject.prototype.toString',
                  ee.ComputedObject.prototype.toString);


/**
 * @return {boolean} Whether this computed object is a variable reference.
 */
ee.ComputedObject.prototype.isVariable = function() {
  // We can't just check for varName != null, since we allow that
  // to remain null until for CustomFunction.resolveNamelessArgs_().
  return this.func === null && this.args === null;
};


/**
 * @return {string} The name of the object, used in toString().
 */
ee.ComputedObject.prototype.name = function() {
  return 'ComputedObject';
};


/**
 * Calls a function passing this object as the first argument, and returning
 * itself. Convenient e.g. when debugging:
 *
 * var c = ee.ImageCollection('foo').aside(print)
 *   .filterDate('2001-01-01', '2002-01-01').aside(print, 'In 2001')
 *   .filterBounds(geom).aside(print, 'In region')
 *   .aside(Map.addLayer, {min: 0, max: 142}, 'Filtered')
 *   .select('a', 'b');
 *
 * @param {Function} func The function to call.
 * @param {...*} var_args Any extra arguments to pass to the function.
 * @return {!ee.ComputedObject} The same object, for chaining.
 * @export
 */
ee.ComputedObject.prototype.aside = function(func, var_args) {
  var args = Array.from(arguments);
  args[0] = this;
  func.apply(goog.global, args);
  return this;
};


/**
 * Cast a ComputedObject to a new instance of the same class as this.
 * @param {ee.ComputedObject} obj The object to cast.
 * @return {?} The converted instance.
 * @protected
 */
ee.ComputedObject.prototype.castInternal = function(obj) {
  if (obj instanceof this.constructor) {
    return obj;
  } else {
    /**
     * Avoid Object.create() for browser compatibility.
     * @constructor
     */
    var klass = function() {};
    klass.prototype = this.constructor.prototype;
    var result = new klass();
    result.func = obj.func;
    result.args = obj.args;
    result.varName = obj.varName;
    return result;
  }
};


/**
 * A helper function to construct a class with variable args.
 *
 * @param {Function} constructor The constructor to construct.
 * @param {IArrayLike} argsArray The args array.
 * @return {!Object} The newly constructed object.
 */
ee.ComputedObject.construct = function(constructor, argsArray) {
  /** @constructor */
  function F() {
    return constructor.apply(this, argsArray);
  }
  F.prototype = constructor.prototype;
  return new F;
};
