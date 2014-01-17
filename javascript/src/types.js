/**
 * @fileoverview A set of utilities to work with EE types.
 */

goog.provide('ee.Types');

goog.require('ee.ComputedObject');
goog.require('ee.Encodable');


/**
 * The name of the property inserted into objects created by
 * ee.CustomFunction.variable() whose value is the type (class) of the
 * variable.
 * @type {string}
 * @const
 */
ee.Types.VAR_TYPE_KEY = '__EE_VAR_TYPE';


/**
 * A dictionary of the ee classes.
 * Not technically needed in the JavaScript library, but it matches what
 * we have to do in the Python library.
 * The keys are the names of the ee classes.  The values the class objects.
 * @type {Object}
 * @private
 */
ee.Types.registeredClasses_ = {};


/**
 * Register the classes available in the ee object for lookup.
 * @param {Object} classes The classes available in the ee object for lookup.
 */
ee.Types.registerClasses = function(classes) {
  ee.Types.registeredClasses_ = classes;
};


/**
 * Converts a type name to a class constructor.
 *
 * @param {string} name The class name.
 * @return {Function} The constructor for the named class or null if it's not an
 *     ee class.
 * @export
 */
ee.Types.nameToClass = function(name) {
  if (name in ee.Types.registeredClasses_) {
    return ee.Types.registeredClasses_[name];
  } else {
    return null;
  }
};


/**
 * Converts a class constructor to the API-friendly type name.
 * @param {Function} klass The class constructor.
 * @return {string} The name of the class, or "Object" if not recognized.
 * @export
 */
ee.Types.classToName = function(klass) {
  if (klass.prototype instanceof ee.ComputedObject) {
    // Assume that name() does not care about the instance.
    return klass.prototype.name.call(null);
  } else if (klass == Number) {
    return 'Number';
  } else if (klass == String) {
    return 'String';
  } else if (klass == Array) {
    return 'Array';
  } else if (klass == Date) {
    return 'Date';
  } else {
    return 'Object';
  }
};


/**
 * Checks whether a type is a subtype of another.
 *
 * @param {string} firstType The first type name.
 * @param {string} secondType The second type name.
 * @return {boolean} Whether secondType is a subtype of firstType.
 */
ee.Types.isSubtype = function(firstType, secondType) {
  if (secondType == firstType) {
    return true;
  }

  switch (firstType) {
    // TODO(user): Remove 'EEObject' once the server is updated.
    case 'Element':
    case 'EEObject':
      return secondType == 'EEObject' ||
             secondType == 'Element' ||
             secondType == 'Image' ||
             secondType == 'Feature' ||
             secondType == 'Collection' ||
             secondType == 'ImageCollection' ||
             secondType == 'FeatureCollection';
    case 'FeatureCollection':
    case 'Collection':
      return secondType == 'Collection' ||
             secondType == 'ImageCollection' ||
             secondType == 'FeatureCollection';
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
  return goog.isNumber(obj) || ee.Types.isVarOfType(obj, Number);
};


/**
 * Returns true if this object is a string or string variable.
 *
 * @param {*} obj The object to check.
 * @return {boolean} Whether the object is a string or string variable.
 */
ee.Types.isString = function(obj) {
  // We can't check for ee.String types here due to circular dependencies.
  // In theory, the only place this matters is in promote, where we do
  // all these tests explicitly.
  return (goog.isString(obj) || ee.Types.isVarOfType(obj, String));
};


/**
 * Returns true if this object is an array or array variable.
 *
 * @param {*} obj The object to check.
 * @return {boolean} Whether the object is an array or array variable.
 */
ee.Types.isArray = function(obj) {
  return goog.isArray(obj) || ee.Types.isVarOfType(obj, Array);
};


/**
 * Returns true if this object is an EE variable with the given type.
 *
 * @param {*} obj The object to check.
 * @param {Function} klass The class constructor to check against.
 * @return {boolean} Whether the object is a variable of the given type.
 */
ee.Types.isVarOfType = function(obj, klass) {
  if (obj instanceof ee.Encodable) {
    var type = obj[ee.Types.VAR_TYPE_KEY];
    return type && (type == klass || type.prototype instanceof klass);
  } else {
    return false;
  }
};


/**
 * @param {*} obj The object to check.
 * @return {boolean} Whether the object is a regular, non-prototyped,
 *     non-function Object.
 */
ee.Types.isRegularObject = function(obj) {
  if (goog.isObject(obj) && !goog.isFunction(obj)) {
    var proto = Object.getPrototypeOf(obj);
    return !goog.isNull(proto) && goog.isNull(Object.getPrototypeOf(proto));
  } else {
    return false;
  }
};
