/**
 * @fileoverview A wrapper for dicts.
 */

goog.provide('ee.Dictionary');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.Types');



/**
 * Constructs a new Dictionary.
 *
 * @param {Object|ee.ComputedObject=} opt_dict An object to convert to
 *    a dictionary. This constructor accepts the following types:
 *      1) Another dictionary.
 *      2) A list of key/value pairs.
 *      3) A null or no argument (producing an empty dictionary)
 *
 * @constructor
 * @extends {ee.ComputedObject}
 * @export
 */
ee.Dictionary = function(opt_dict) {
  // Constructor safety.
  if (!(this instanceof ee.Dictionary)) {
    return ee.ComputedObject.construct(ee.Dictionary, arguments);
  } else if (opt_dict instanceof ee.Dictionary) {
    return opt_dict;
  }

  ee.Dictionary.initialize();

  /**
   * The internal rerpresentation of this dictionary.
   *
   * @type {Object}
   * @private
   */
  this.dict_;

  if (ee.Types.isRegularObject(opt_dict)) {
    // Cast to a dictionary.
    ee.Dictionary.base(this, 'constructor', null, null);
    this.dict_ = /** @type {Object} */ (opt_dict);
  } else {
    if (opt_dict instanceof ee.ComputedObject && opt_dict.func &&
        opt_dict.func.getSignature()['returns'] == 'Dictionary') {
      // If it's a call that's already returning a Dictionary, just cast.
      ee.Dictionary.base(this, 'constructor', opt_dict.func, opt_dict.args, opt_dict.varName);
    } else {
      // Delegate everything else to the server-side constructor.
      ee.Dictionary.base(
          this, 'constructor', new ee.ApiFunction('Dictionary'), {'input': opt_dict}, null);
    }
    this.dict_ = null;
  }
};
goog.inherits(ee.Dictionary, ee.ComputedObject);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.Dictionary.initialized_ = false;


/** Imports API functions to this class. */
ee.Dictionary.initialize = function() {
  if (!ee.Dictionary.initialized_) {
    ee.ApiFunction.importApi(ee.Dictionary, 'Dictionary', 'Dictionary');
    ee.Dictionary.initialized_ = true;
  }
};


/** Removes imported API functions from this class. */
ee.Dictionary.reset = function() {
  ee.ApiFunction.clearApi(ee.Dictionary);
  ee.Dictionary.initialized_ = false;
};


/**
 * @override
 */
ee.Dictionary.prototype.encode = function(encoder) {
  if (!goog.isNull(this.dict_)) {
    return encoder(this.dict_);
  } else {
    return ee.Dictionary.base(this, 'encode', encoder);
  }
};


/**
 * @override
 */
ee.Dictionary.prototype.name = function() {
  return 'Dictionary';
};
