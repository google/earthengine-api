/**
 * @fileoverview A set of utilities to work with EE types.
 */

goog.provide('ee.Types');

goog.require('ee.ComputedObject');

goog.requireType('ee.Function');


/**
 * A dictionary of the ee classes. Not technically needed in the JavaScript
 *   library, but it matches what we have to do in the Python library. The keys
 *   are the names of the ee classes. The values the class objects.
 *
 * @type {Object}
 * @private
 */
ee.Types.registeredClasses_ = {};


/**
 * Register the classes available in the ee object for lookup.
 *
 * @param {Object} classes The classes available in the ee object for lookup.
 */
ee.Types.registerClasses = function(classes) {
  ee.Types.registeredClasses_ = classes;
};


/**
 * Converts a type name to a class constructor.
 *
 * @param {string} name The class name.
 * @return {Function|null} The constructor for the named class or null if it's
 *   not an ee class.
 */
ee.Types.nameToClass = function(name) {
  if (name in ee.Types.registeredClasses_) {
    return ee.Types.registeredClasses_[name];
  }

  return null;
};


/**
 * Converts a class constructor to the API-friendly type name.
 *
 * @param {Function} klass The class constructor.
 * @return {string} The name of the class, or "Object" if not recognized.
 */
ee.Types.classToName = function(klass) {
  if (klass.prototype instanceof ee.ComputedObject) {
    // Assume that name() does not care about the instance.
    return klass.prototype.name.call(null);
  }

  if ([Number, String, Array, Date].includes(klass)) {
    return klass.name
  }

  return 'Object';
};


/**
 * Checks whether a type is a subtype of another.
 *
 * @param {string} firstType The first type name.
 * @param {string} secondType The second type name.
 * @return {boolean} Whether secondType is a subtype of firstType.
 */
ee.Types.isSubtype = function(firstType, secondType) {
  if (secondType === firstType) {
    return true;
  }

  switch (firstType) {
    case 'Element':
      return [
        'Element',
        'Image',
        'Feature',
        'Collection',
        'ImageCollection',
        'FeatureCollection'
      ].includes(secondType);

    case 'Collection':
    case 'FeatureCollection':
      return [
        'Collection',
        'ImageCollection',
        'FeatureCollection'
      ].includes(secondType);

    case 'Object':
      return true;

    default:
      return false;
  }
};


/**
 * Returns true if this object is a number or number variable.
 *
 * @param {*} obj The object to check.
 * @return {boolean} Whether the object is a number or number variable.
 */
ee.Types.isNumber = function(obj) {
  return typeof obj === 'number' ||
    (obj instanceof ee.ComputedObject && obj.name() === 'Number');
};


/**
 * Returns true if this object is a string or string variable.
 *
 * @param {*} obj The object to check.
 * @return {boolean} Whether the object is a string or string variable.
 */
ee.Types.isString = function(obj) {
  return typeof obj === 'string' ||
    (obj instanceof ee.ComputedObject && obj.name() === 'String');
};


/**
 * Returns true if this object is an array or array variable.
 *
 * @param {*} obj The object to check.
 * @return {boolean} Whether the object is an array or array variable.
 */
ee.Types.isArray = function(obj) {
  return Array.isArray(obj) ||
    (obj instanceof ee.ComputedObject && obj.name() === 'List');
};


/**
 * Returns true if this the object is a regular, non-prototyped, non-function
 *   Object.
 *
 * @param {*} obj The object to check.
 * @return {boolean} Whether the object is a regular, non-prototyped,
 *   non-function Object.
 */
ee.Types.isRegularObject = function(obj) {
  if (goog.isObject(obj) && typeof obj !== 'function') {
    const proto = Object.getPrototypeOf(obj);

    return proto !== null && Object.getPrototypeOf(proto) === null;
  }

  return false;
};

/**
 * Assume keyword arguments if we get a single dictionary.
 *
 * @param {!Array<?>} args actual arguments to function call.
 * @param {!ee.Function.Signature} signature.
 * @param {boolean=} isInstance true if function is invoked on existing instance.
 * @return {boolean} true if the first element of args should be treated as a
 *   dictionary of keyword arguments.
 */
ee.Types.useKeywordArgs = function(args, signature, isInstance = false) {
  if (args.length === 1 && ee.Types.isRegularObject(args[0])) {
    const formalArgs = isInstance ? formalArgs.slice(1) : signature.args;

    if (formalArgs.length) {
      return formalArgs.length === 1
        ? formalArgs[0].type !== 'Dictionary'
        : formalArgs[1].optional
    }
  }

  return false;
};
