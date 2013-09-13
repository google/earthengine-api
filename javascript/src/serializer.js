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
 * @hidden
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
   * @private
   */
  this.isCompound_ = opt_isCompound !== false;

  /**
   * A list of shared subtrees as [name, value] pairs.
   *
   * @type {Array}
   * @private
   */
  this.scope_ = [];

  /**
   * A lookup table from object hashes to {name, object} pairs, where
   * the name comes from the subtree stored in this.scope_.
   *
   * @type {{name: string, object: *}}
   * @private
   */
  this.encoded_ = /** @type {{name: string, object: *}} */ ({});
};


/**
 * A JSON serializer instance for this class
 * @private
 */
ee.Serializer.jsonSerializer_ = new goog.json.Serializer();


/**
 * A hash instance for this class
 * @private
 */
ee.Serializer.hash_ = new goog.crypt.Md5();


/**
 * Serialize an object to a JSON string appropriate for API calls.
 * @param {*} obj The object to Serialize.
 * @return {string} A JSON represenation of the input.
 */
ee.Serializer.toJSON = function(obj) {
  var eeSerializer = new ee.Serializer(true);
  return ee.Serializer.jsonSerializer_.serialize(eeSerializer.encode_(obj));
};


/**
 * Serialize an object to a human-friendly JSON string (if possible).
 * @param {*} obj The object to convert.
 * @return {string} A human-friendly JSON represenation of the input.
 */
ee.Serializer.toReadableJSON = function(obj) {
  var eeSerializer = new ee.Serializer(false);
  var encoded = eeSerializer.encode_(obj);
  if ('JSON' in window) {
    // All modern browsers; Pretty-print.
    return window['JSON']['stringify'](encoded, null, '  ');
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
    for (var hash in this.encoded_) {
      var item = this.encoded_[hash];
      delete item['object'][this.HASH_KEY];
    }
    this.encoded_ = /** @type {{name: string, object: *}} */ ({});
  }
  return value;
};


/**
 * Encodes a subtree as a Value in the EE API v2 (DAG) format. If isCompound_
 * is true, this will fill the {@code scope} and {@code encoded} properties.
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
      'value': this.encoded_[hash]['name']
    };
  } else if (object === null ||
      goog.isBoolean(object) ||
      goog.isNumber(object) ||
      goog.isString(object)) {
    // Primitives are encoded as is and not saved in the scope.
    return object;
  } else if (goog.isDateLike(object)) {
    // Dates are encoded as typed UTC microseconds since the Unix epoch.
    // They are returned directly and not saved in the scope either.
    return {
      'type': 'Date',
      'value': Math.floor(object.getTime() * 1000)
    };
  } else if (object instanceof ee.Encodable) {
    // Some objects know how to encode themselves.
    result = object.encode(goog.bind(this.encodeValue_, this));
    if (!goog.isObject(result) || result['type'] == 'ArgumentRef') {
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
    ee.Serializer.hash_.reset();
    ee.Serializer.hash_.update(ee.Serializer.jsonSerializer_.serialize(result));
    hash = ee.Serializer.hash_.digest();
    var name;
    if (this.encoded_[hash]) {
      name = this.encoded_[hash]['name'];
    } else {
      // We haven't seen this object or one like it yet, save it.
      name = String(this.scope_.length);
      this.scope_.push([name, result]);
      this.encoded_[hash] = {
        'name': name,
        'object': object
      };
    }
    object[this.HASH_KEY] = hash;
    return {
      'type': 'ValueRef',
      'value': name
    };
  } else {
    return result;
  }
};


goog.exportSymbol('ee.Serializer', ee.Serializer);
goog.exportSymbol('ee.Serializer.toJSON', ee.Serializer.toJSON);
goog.exportSymbol('ee.Serializer.toReadableJSON', ee.Serializer.toReadableJSON);
