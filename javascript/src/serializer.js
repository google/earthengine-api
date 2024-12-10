/**
 * @fileoverview A serializer that encodes EE object trees as JSON DAGs.
 */

goog.provide('ee.Serializer');

goog.require('ee.Encodable');
goog.require('ee.api');
goog.require('ee.apiclient');
goog.require('ee.rpc_node');
goog.require('goog.array');
goog.require('goog.crypt.Md5');
goog.require('goog.json');
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
   * A list of shared subtrees as [reference name, encoded value] pairs.
   *
   * @type {!Array<?>}
   * @private
   */
  this.scope_ = [];

  /**
   * A lookup table from object hashes to reference names. The name is paired
   * with an encoded value subtree in this.scope_.
   *
   * @type {!Object<string, string>}
   * @private
   */
  this.encoded_ = /** @type {!Object<string, string>} */ ({});

  /**
   * A list of objects that have to be cleared of hashes.
   *
   * @type {!Array<!Object>}
   * @private
   */
  this.withHashes_ = [];

  /**
   * Hashes of all objects known by serialize.
   * @private
   */
  this.hashes_ = new WeakMap();

  /**
   * A map of ValueNodes to SourceFrames.
   * @private @const
   */
  this.sourceNodeMap_ = new WeakMap();

  /**
   * Provides a name for unbound variables in objects.  Unbound variables are
   * otherwise disallowed.  See Count Functions usage in customfunction.js.
   *
   * @type {string|undefined}
   */
  this.unboundName = undefined;
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
  const compound = (opt_isCompound !== undefined) ? opt_isCompound : true;
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
  let value = this.encodeValue_(object);
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
    this.encoded_ = /** @type {!Object<string, string>} */ ({});
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
  if (object === undefined) {
    throw Error('Can\'t encode an undefined value.');
  }

  let result;

  let hash = goog.isObject(object) ? object[this.HASH_KEY] : null;
  if (this.isCompound_ && hash != null && this.encoded_[hash]) {
    // Any object that's already been encoded should have a hash on it.
    // If we find one and it's in the map of encoded values,
    // return a value ref instead.
    return {
      'type': 'ValueRef',
      'value': this.encoded_[hash]
    };
  } else if (
      object === null || typeof object === 'boolean' ||
      typeof object === 'number' || typeof object === 'string') {
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
    if (!Array.isArray(result) &&
        (!goog.isObject(result) || result['type'] == 'ArgumentRef')) {
      // Optimization: simple enough that adding it to the scope is probably
      // not worth it.
      return result;
    }
  } else if (Array.isArray(object)) {
    // Arrays are encoded recursively.
    result = goog.array.map(object, function(element) {
      return this.encodeValue_(element);
    }, this);
  } else if (goog.isObject(object) && typeof object !== 'function') {
    // Regular objects are encoded recursively and wrapped in a type specifier.
    const encodedObject = goog.object.map(object, function(element) {
      if (typeof element !== 'function') {
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
    let name;
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


/**
 * Serializes an object into the JSON-encodable form sent in Cloud API calls.
 * @param {*} obj The object to Serialize.
 * @return {!Object} The encoded object.
 * @export
 */
ee.Serializer.encodeCloudApi = function(obj) {
  return ee.apiclient.serialize(ee.Serializer.encodeCloudApiExpression(obj));
};


/**
 * Serializes an object into an Expression for Cloud API calls.
 * @param {*} obj The object to Serialize.
 * @param {string=} unboundName Name for unbound variables in computed objects.
 * @return {!ee.api.Expression} The encoded object.
 */
ee.Serializer.encodeCloudApiExpression = function(
    obj, unboundName = undefined) {
  const serializer = new ee.Serializer(true);
  return ee.Serializer.encodeCloudApiExpressionWithSerializer(
      serializer, obj, unboundName);
};


/**
 * Serializes an object into an Expression for Cloud API calls with a
 * Serializer.
 * @param {!ee.Serializer} serializer The Serializer.
 * @param {*} obj The object to Serialize.
 * @param {string=} unboundName Name for unbound variables in computed objects.
 * @return {!ee.api.Expression} The encoded object.
 */
ee.Serializer.encodeCloudApiExpressionWithSerializer = function(
    serializer, obj, unboundName = undefined) {
  serializer.unboundName = unboundName;
  return serializer.encodeForCloudApi_(obj);
};

/**
 * Serializes an object to a "pretty" JSON representation, in Cloud API format.
 * @param {*} obj The object to Serialize.
 * @return {*} A JSON-compatible structure representing the input.
 * @export
 * @suppress {missingProperties} object.Serializable$values
 */
ee.Serializer.encodeCloudApiPretty = function(obj) {
  const encoded = new ee.Serializer(false).encodeForCloudApi_(obj);
  const values = encoded.values;
  // The remaining references are the top-level result, and in function
  // definitions and invocations.  These violate the Expression type, so we
  // walk the tree as a raw object and return a raw object.
  const walkObject = function(object) {
    if (!goog.isObject(object)) return object;
    const ret = Array.isArray(object) ? [] : {};
    const isNode = object instanceof Object.getPrototypeOf(ee.api.ValueNode);
    const valueTable = isNode ? object.Serializable$values : object;
    for (const [key, val] of Object.entries(valueTable)) {
      if (!isNode) {
        ret[key] = walkObject(val);  // Always walk literal objects.
      } else if (val === null) {
        continue;  // Serializable always skips null values.
      } else if (key === 'functionDefinitionValue' && val.body != null) {
        ret[key] = {
          'argumentNames': val.argumentNames,
          'body': walkObject(values[val.body])
        };
      } else if (
          key === 'functionInvocationValue' && val.functionReference != null) {
        ret[key] = {
          'arguments': goog.object.map(val.arguments, walkObject),
          'functionReference': walkObject(values[val.functionReference])
        };
      } else if (key === 'constantValue') {
        // Do not recurse into constants.
        ret[key] = val === ee.apiclient.NULL_VALUE ? null : val;
      } else {
        ret[key] = walkObject(val);  // Walk other ValueNode subtrees.
      }
    }
    return ret;
  };
  return encoded.result && walkObject(values[encoded.result]);
};


/**
 * Serializes an object to a JSON string appropriate for Cloud API calls.
 * @param {*} obj The object to Serialize.
 * @return {string} A JSON representation of the input.
 * @export
 */
ee.Serializer.toCloudApiJSON = function(obj) {
  return ee.Serializer.jsonSerializer_.serialize(
      ee.Serializer.encodeCloudApi(obj));
};


/**
 * Serializes an object to a human-friendly JSON string (if possible), using
 * the Cloud API representation.
 * @param {*} obj The object to convert.
 * @return {string} A human-friendly JSON representation of the input.
 * @export
 */
ee.Serializer.toReadableCloudApiJSON = function(obj) {
  return ee.Serializer.stringify(ee.Serializer.encodeCloudApiPretty(obj));
};


/**
 * Encodes a top level object in the EE Cloud API format.
 *
 * @param {*} obj The object to encode.
 * @return {!ee.api.Expression} The encoded object.
 * @private
 */
ee.Serializer.prototype.encodeForCloudApi_ = function(obj) {
  try {
    // Encode the object tree, storing each node in the scope table.
    const result = this.makeReference(obj);
    // Lift constants, and expand references.
    return new ExpressionOptimizer(
               result, this.scope_, this.isCompound_, this.sourceNodeMap_)
        .optimize();
  } finally {
    // Clear state in case of future encoding.
    this.hashes_ = new WeakMap();
    this.encoded_ = {};
    this.scope_ = [];
  }
};


/**
 * Encodes an object Cloud API format and returns a reference into this.scope_.
 *
 * @param {*} obj The object to encode.
 * @return {string} A reference to the encoded object.
 */
ee.Serializer.prototype.makeReference = function(obj) {
  /**
   * @param {!ee.api.ValueNode} result
   * @return {string}
   */
  const makeRef = (result) => {
    const hash = ee.Serializer.computeHash(result);
    // Set first: we may have named this hash already, but not seen this obj.
    if (goog.isObject(obj)) {
      this.hashes_.set(obj, hash);
    }
    if (this.encoded_[hash]) {
      return this.encoded_[hash];
    }
    // We haven't seen this object or one like it yet, so save it.
    const name = String(this.scope_.length);
    this.scope_.push([name, result]);
    this.encoded_[hash] = name;
    return name;
  };
  if (goog.isObject(obj) && this.encoded_[this.hashes_.get(obj)]) {
    return this.encoded_[this.hashes_.get(obj)];
  } else if (
      obj === null || typeof obj === 'boolean' || typeof obj === 'string' ||
      typeof obj === 'number') {
    // Do not use integerValue here: the type is inferred on the server. We only
    // use integerValue when the number cannot be cast into a double, but
    // JavaScript numbers always fit into doubles.
    return makeRef(ee.rpc_node.constant(obj));
  } else if (goog.isDateLike(obj)) {
    // A raw date slipped through. Wrap it. Calling ee.Date from here would
    // cause a circular dependency, so we encode it manually.
    const millis = Math.floor(/** @type {!Date} */(obj).getTime());
    return makeRef(ee.rpc_node.functionByName(
        'Date', {'value': ee.rpc_node.constant(millis)}));
  } else if (obj instanceof ee.Encodable) {
    // Some objects know how to encode themselves.
    const value = obj.encodeCloudValue(this);
    return makeRef(value);
  } else if (Array.isArray(obj)) {
    // Convince the type checker that the array is actually an array.
    const asArray = /** @type {!Array} */(/** @type {*} */(obj));
    return makeRef(ee.rpc_node.array(asArray.map(
        (x) => ee.rpc_node.reference(this.makeReference(x)))));
  } else if (goog.isObject(obj) && typeof obj !== 'function') {
    const asObject = /** @type {!Object} */(/** @type {*} */(obj));
    /** @type {!Object<string,!ee.api.ValueNode>} */
    const values = {};
    // Sort to make the ordering in the scope table deterministic.
    Object.keys(asObject).sort().forEach((k) => {
      values[k] = ee.rpc_node.reference(this.makeReference(obj[k]));
    });
    return makeRef(ee.rpc_node.dictionary(values));
  }
  throw Error('Can\'t encode object: ' + obj);
};


/**
 * The optimizer walks an expression tree, and "lifts" constant values: for
 * example, an array of constants becomes a constant array. By default, all
 * references are expanded; in Compound mode, repeated references are kept as
 * references.
 * @private
 */
class ExpressionOptimizer {
  /**
   * @param {string} rootReference
   * @param {!Array<!Array<string|!ee.api.ValueNode|?>>} values
   * @param {boolean} isCompound If true, optimize shared references;
   *     otherwise, expand all references.
   * @param {!WeakMap} sourceNodeMap A map of ValueNodes to SourceFrames.
   */
  constructor(rootReference, values, isCompound, sourceNodeMap) {
    /** @type {string} */
    this.rootReference = rootReference;

    /** @type {!Object<string, !ee.api.ValueNode>} */
    this.values = {};
    values.forEach((tuple) => this.values[tuple[0]] = tuple[1]);

    /** @type {?Object<string, number>} */
    this.referenceCounts = isCompound ? this.countReferences() : null;

    /** @type {!Object<string, !ee.api.ValueNode>} */
    this.optimizedValues = {};

    /** @type {!Object<string, string>} */
    this.referenceMap = {};

    /** @type {number} */
    this.nextMappedRef = 0;

    /** @type {!WeakMap} */
    this.sourceNodeMap = sourceNodeMap;
  }

  /**
   * @return {!ee.api.Expression}
   */
  optimize() {
    const result = this.optimizeReference(this.rootReference);
    return new ee.api.Expression({
      result,
      values: this.optimizedValues,
    });
  }

  /**
   * @param {string} ref
   * @return {string}
   */
  optimizeReference(ref) {
    if (ref in this.referenceMap) {
      return this.referenceMap[ref];
    }
    const mappedRef = String(this.nextMappedRef++);
    this.referenceMap[ref] = mappedRef;
    this.optimizedValues[mappedRef] = this.optimizeValue(this.values[ref], 0);
    return mappedRef;
  }

  /**
   * @param {!ee.api.ValueNode} value
   * @param {number} depth
   * @return {!ee.api.ValueNode}
   */
  optimizeValue(value, depth) {
    // Don't generate very deep expressions, as the backend rejects them.
    // The backend's limit is 100, and we want to stay well away from that
    // as a few extra levels of wrapping are always added.
    const DEPTH_LIMIT = 50;

    const isConst = (v) => v.constantValue !== null;
    const serializeConst = (v) => v === ee.apiclient.NULL_VALUE ? null : v;
    // Ensure that any derived ValueNode from a parent node is associated with
    // its parent's source frame, if available, in order to make sure that the
    // final, top-level ValueNodes in the expression are contained in the
    // sourceNodeMap. If the optimizer encounters duplicate ValueNodes, it will
    // retain the reference to the first one found.
    const storeInSourceMap = (parentValue, valueNode) => {
      if (this.sourceNodeMap && this.sourceNodeMap.has(parentValue) &&
          !this.sourceNodeMap.has(valueNode)) {
        this.sourceNodeMap.set(valueNode, this.sourceNodeMap.get(parentValue));
      }
      return valueNode;
    };

    if (isConst(value) || value.integerValue != null ||
        value.bytesValue != null || value.argumentReference != null) {
      return value;
    } else if (value.valueReference != null) {
      const referencedValue = this.values[value.valueReference];

      if (this.referenceCounts === null || (depth < DEPTH_LIMIT &&
          this.referenceCounts[value.valueReference] === 1)) {
        const optimized = this.optimizeValue(referencedValue, depth);
        return storeInSourceMap(value, optimized);
      } else if (ExpressionOptimizer.isAlwaysLiftable(referencedValue)) {
        return storeInSourceMap(value, referencedValue);
      } else {
        const optimized =
            ee.rpc_node.reference(this.optimizeReference(value.valueReference));
        return storeInSourceMap(value, optimized);
      }
    } else if (value.arrayValue != null) {
      const arr = value.arrayValue.values.map(
          v => this.optimizeValue(v, depth + 3));
      const optimized =
          (arr.every(isConst) ? ee.rpc_node.constant(arr.map(
                                    v => serializeConst(v.constantValue))) :
                                ee.rpc_node.array(arr));
      return storeInSourceMap(value, optimized);
    } else if (value.dictionaryValue != null) {
      const values = {};
      let constantValues = {};
      for (const [k, v] of Object.entries(value.dictionaryValue.values || {})) {
        values[k] = this.optimizeValue(
            /** @type {!ee.api.ValueNode} */ (v), depth + 3);
        if (constantValues !== null && isConst(values[k])) {
          constantValues[k] = serializeConst(values[k].constantValue);
        } else {
          constantValues = null;
        }
      }
      if (constantValues !== null) {
        return storeInSourceMap(value, ee.rpc_node.constant(constantValues));
      } else {
        return storeInSourceMap(values, ee.rpc_node.dictionary(values));
      }
    } else if (value.functionDefinitionValue != null) {
      const def = value.functionDefinitionValue;
      const optimized = ee.rpc_node.functionDefinition(
          def.argumentNames || [], this.optimizeReference(def.body || ''));
      return storeInSourceMap(value, optimized);
    } else if (value.functionInvocationValue != null) {
      const inv = value.functionInvocationValue;
      const args = {};
      for (const k of Object.keys(inv.arguments || {})) {
        args[k] = this.optimizeValue(inv.arguments[k], depth + 3);
      }
      const optimized =
          (inv.functionName ?
               ee.rpc_node.functionByName(inv.functionName, args) :
               ee.rpc_node.functionByReference(
                   this.optimizeReference(inv.functionReference || ''), args));
      return storeInSourceMap(value, optimized);
    }
    throw Error('Can\'t optimize value: ' + value);
  }

  /**
   * @param {!ee.api.ValueNode} value
   * @return {boolean}
   */
  static isAlwaysLiftable(value) {
    const constant = value.constantValue;
    if (constant !== null) {
      return constant === ee.apiclient.NULL_VALUE ||
          typeof constant === 'number' || typeof constant === 'boolean';
    }
    return value.argumentReference != null;
  };

  /** @return {!Object<string,number>} counts for each reference in the tree. */
  countReferences() {
    const counts = {};
    const visitReference = (reference) => {
      if (counts[reference]) {
        counts[reference]++;
      } else {
        counts[reference] = 1;
        visitValue(this.values[reference]);
      }
    };
    const visitValue = (value) => {
      if (value.arrayValue != null) {
        value.arrayValue.values.forEach(visitValue);
      } else if (value.dictionaryValue != null) {
        Object.values(value.dictionaryValue.values).forEach(visitValue);
      } else if (value.functionDefinitionValue != null) {
        visitReference(value.functionDefinitionValue.body);
      } else if (value.functionInvocationValue != null) {
        const inv = value.functionInvocationValue;
        if (inv.functionReference != null) {
          visitReference(inv.functionReference);
        }
        Object.values(inv.arguments).forEach(visitValue);
      } else if (value.valueReference != null) {
        visitReference(value.valueReference);
      }
    };
    visitReference(this.rootReference);
    return counts;
  }
}
