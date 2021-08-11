/**
 * @fileoverview A wrapper for Lists.
 */

goog.provide('ee.List');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.rpc_node');
goog.require('goog.array');
goog.requireType('ee.Encodable');
goog.requireType('ee.api');


/**
 * Constructs a new list.
 *
 * @param {!IArrayLike|!Object} list A list or a computed object.
 * @constructor
 * @extends {ee.ComputedObject<!Array<T>>}
 * @template T
 * @export
 */
ee.List = function(list) {
  // Constructor safety.
  if (!(this instanceof ee.List)) {
    return ee.ComputedObject.construct(ee.List, arguments);
  } else if (arguments.length > 1) {
    throw Error('ee.List() only accepts 1 argument.');
  } else if (list instanceof ee.List) {
    return list;
  }

  ee.List.initialize();

  /**
   * The internal rerpresentation of this list.
   *
   * @type {IArrayLike?}
   * @private
   */
  this.list_;

  if (Array.isArray(list)) {
    ee.List.base(this, 'constructor', null, null);
    this.list_ = /** @type {IArrayLike} */ (list);
  } else if (list instanceof ee.ComputedObject) {
    ee.List.base(this, 'constructor', list.func, list.args, list.varName);
    this.list_ = null;
  } else {
    throw Error('Invalid argument specified for ee.List(): ' + list);
  }
};
goog.inherits(ee.List, ee.ComputedObject);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.List.initialized_ = false;


/** Imports API functions to this class. */
ee.List.initialize = function() {
  if (!ee.List.initialized_) {
    ee.ApiFunction.importApi(ee.List, 'List', 'List');
    ee.List.initialized_ = true;
  }
};


/** Removes imported API functions from this class. */
ee.List.reset = function() {
  ee.ApiFunction.clearApi(ee.List);
  ee.List.initialized_ = false;
};


/**
 * @override
 */
ee.List.prototype.encode = function(encoder) {
  if (Array.isArray(this.list_)) {
    return goog.array.map(this.list_, function(elem) {
      return encoder(elem);
    });
  } else {
    return ee.List.base(this, 'encode', encoder);
  }
};

/** @override @return {!ee.api.ValueNode} */
ee.List.prototype.encodeCloudValue = function(
    /** !ee.Encodable.Serializer */ serializer) {
  if (Array.isArray(this.list_)) {
    return ee.rpc_node.reference(serializer.makeReference(this.list_));
  } else {
    return ee.List.base(this, 'encodeCloudValue', serializer);
  }
};


/**
 * @override
 */
ee.List.prototype.name = function() {
  return 'List';
};
