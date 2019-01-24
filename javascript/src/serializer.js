/**
 * @fileoverview A serializer that encodes EE object trees as JSON DAGs.
 *
 */

goog.provide('ee.Serializer');

goog.require('ee.Encodable');
goog.require('goog.array');
goog.require('goog.crypt.Md5');
goog.require('goog.json.Serializer');
goog.require('goog.object');



/**
 * A serializer for EE object trees.
 *
 * @param {boolean=} opt_isCompound Whether the encoding should factor out
 *     shared subtrees. Defaults to true.
 * @constructor
 */
ee.Serializer = function(opt_isCompound) {
  /**
   * The name of the hash key we insert into objects.
   */
  this.HASH_KEY = '__ee_hash__';

  /**
   * Whether the encoding should factor out shared subtrees.
   *
   * @type {boolean}
   * @private @const
   */
  this.isCompound_ = opt_isCompound !== false;

  /**
   * A list of shared subtrees as [name, value] pairs.
   *
   * @type {!Array}
   * @private
   */
  this.scope_ = [];

  /**
   * A lookup table from object hashes to {name, object} pairs, where
   * the name comes from the subtree stored in this.scope_.
   *
   * @type {!Object.<string, string>}
   * @private
   */
  this.encoded_ = /** @type {!Object.<string, string>} */ ({});

  /**
   * A list of objects that have to be cleared of hashes.
   *
   * @type {!Array}
   * @private
   */
  this.withHashes_ = [];
};
// Exporting manually to avoid marking the class public in the docs.
goog.exportSymbol('ee.Serializer', ee.Serializer);


/**
 * A JSON serializer instance for this class
 * @private @const
 */
ee.Serializer.jsonSerializer_ = new goog.json.Serializer();


/**
 * A hash instance for this class
 * @private @const
 */
ee.Serializer.hash_ = new goog.crypt.Md5();


/**
 * Serialize an object to a JSON representation appropriate for API calls.
 * @param {*} obj The object to Serialize.
 * @param {boolean=} opt_isCompound Whether the encoding should factor out
 *     shared subtrees. Defaults to true.
 * @return {*} A JSON-compatible structure representing the input.
 * @export
 */
ee.Serializer.encode = function(obj, opt_isCompound) {
  var compound = goog.isDef(opt_isCompound) ? opt_isCompound : true;
  return new ee.Serializer(compound).encode_(obj);
};


/**
 * Serialize an object to a JSON string appropriate for API calls.
 * @param {*} obj The object to Serialize.
 * @return {string} A JSON representation of the input.
 * @export
 * @suppress {checkPrototypalTypes}
 */
ee.Serializer.toJSON = function(obj) {
  return ee.Serializer.jsonSerializer_.serialize(ee.Serializer.encode(obj));
};


/**
 * Serialize an object to a human-friendly JSON string (if possible).
 * @param {*} obj The object to convert.
 * @return {string} A human-friendly JSON representation of the input.
 * @export
 */
ee.Serializer.toReadableJSON = function(obj) {
  return ee.Serializer.stringify(ee.Serializer.encode(obj, false));
};


/**
 * @param {*} encoded
 * @return {string} A human-friendly JSON representation of the input.
 */
ee.Serializer.stringify = function(encoded) {
  if ('JSON' in goog.global) {
    // All modern browsers; Pretty-print.
    return goog.global['JSON']['stringify'](encoded, null, '  ');
  } else {
    // Fall back to the non-pretty Closure serializer.
    return ee.Serializer.jsonSerializer_.serialize(encoded);
  }
};


/**
 * Encodes a top level object in the EE API v2 (DAG) format.
 *
 * @param {*} object The object to encode.
 * @return {*} The encoded object.
 * @private
 */
ee.Serializer.prototype.encode_ = function(object) {
  var value = this.encodeValue_(object);
  if (this.isCompound_) {
    if (goog.isObject(value) &&
        value['type'] == 'ValueRef' &&
        this.scope_.length == 1) {
      // Just one value. No need for complex structure.
      value = this.scope_[0][1];
    } else {
      // Wrap the scopes and final value with a CompoundValue.
      value = {
        'type': 'CompoundValue',
        'scope': this.scope_,
        'value': value
      };
    }
    // Clear state in case of future encoding.
    this.scope_ = [];
    goog.array.forEach(this.withHashes_, goog.bind(function(obj) {
      delete obj[this.HASH_KEY];
    }, this));
    this.withHashes_ = [];
    this.encoded_ = /** @type {!Object.<string, string>} */ ({});
  }
  return value;
};


/**
 * Encodes a subtree as a Value in the EE API v2 (DAG) format. If isCompound_
 * is true, this will fill the `scope` and `encoded` properties.
 *
 * @param {*} object The object to encode.
 * @return {*} The encoded object.
 * @private
 */
ee.Serializer.prototype.encodeValue_ = function(object) {
  if (!goog.isDef(object)) {
    throw Error('Can\'t encode an undefined value.');
  }

  var result;

  var hash = goog.isObject(object) ? object[this.HASH_KEY] : null;
  if (this.isCompound_ && hash != null && this.encoded_[hash]) {
    // Any object that's already been encoded should have a hash on it.
    // If we find one and it's in the map of encoded values,
    // return a value ref instead.
    return {
      'type': 'ValueRef',
      'value': this.encoded_[hash]
    };
  } else if (object === null ||
      goog.isBoolean(object) ||
      goog.isNumber(object) ||
      goog.isString(object)) {
    // Primitives are encoded as is and not saved in the scope.
    return object;
  } else if (goog.isDateLike(object)) {
    // A raw date slipped through. Wrap it. Calling ee.Date from here would
    // cause a circular dependency, so we encode it manually.
    return {
      'type': 'Invocation',
      'functionName': 'Date',
      'arguments': {'value': Math.floor(/** @type {!Date} */(object).getTime())}
    };
  } else if (object instanceof ee.Encodable) {
    // Some objects know how to encode themselves.
    result = object.encode(goog.bind(this.encodeValue_, this));
    if (!goog.isArray(result) &&
        (!goog.isObject(result) || result['type'] == 'ArgumentRef')) {
      // Optimization: simple enough that adding it to the scope is probably
      // not worth it.
      return result;
    }
  } else if (goog.isArray(object)) {
    // Arrays are encoded recursively.
    result = goog.array.map(object, function(element) {
      return this.encodeValue_(element);
    }, this);
  } else if (goog.isObject(object) && !goog.isFunction(object)) {
    // Regular objects are encoded recursively and wrapped in a type specifier.
    var encodedObject = goog.object.map(object, function(element) {
      if (!goog.isFunction(element)) {
        return this.encodeValue_(element);
      }
    }, this);
    // Remove any hash values introduced by encoding.
    goog.object.remove(encodedObject, this.HASH_KEY);
    result = {
      'type': 'Dictionary',
      'value': encodedObject
    };
  } else {
    throw Error('Can\'t encode object: ' + object);
  }

  if (this.isCompound_) {
    hash = ee.Serializer.computeHash(result);
    var name;
    if (this.encoded_[hash]) {
      name = this.encoded_[hash];
    } else {
      // We haven't seen this object or one like it yet, save it.
      name = String(this.scope_.length);
      this.scope_.push([name, result]);
      this.encoded_[hash] = name;
    }
    object[this.HASH_KEY] = hash;
    this.withHashes_.push(object);
    return {
      'type': 'ValueRef',
      'value': name
    };
  } else {
    return result;
  }
};


/**
 * @param {*} obj An object to hash. Any JSON-serializable type is acceptable.
 * @return {string}
 */
ee.Serializer.computeHash = function(obj) {
  ee.Serializer.hash_.reset();
  ee.Serializer.hash_.update(ee.Serializer.jsonSerializer_.serialize(obj));
  return ee.Serializer.hash_.digest().toString();
};

