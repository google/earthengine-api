/**
 * @fileoverview An object representing a saved function.
 *
 */

goog.provide('ee.SavedFunction');

goog.require('ee.ApiFunction');
goog.require('ee.Function');



/**
 * Creates a function representing a saved function.
 *
 * @param {string} path The function's full path.
 * @param {ee.Function.Signature} signature The function's signature.
 *
 * @constructor
 * @extends {ee.Function}
 * @export
 */
ee.SavedFunction = function(path, signature) {
  if (!(this instanceof ee.SavedFunction)) {
    return new ee.SavedFunction(path, signature);
  }

  /**
   * The path of the function.
   * @type {string}
   * @private
   */
  this.path_ = path;

  /**
   * The signature of the function.
   * @type {ee.Function.Signature}
   * @private
   */
  this.signature_ = signature;
};
goog.inherits(ee.SavedFunction, ee.Function);


/** @inheritDoc */
ee.SavedFunction.prototype.encode = function(encoder) {
  var body = ee.ApiFunction._call('LoadAlgorithmById', this.path_);
  return body.encode(encoder);
};


/**
 * @inheritDoc
 * @export
 */
ee.SavedFunction.prototype.getSignature = function() {
  return this.signature_;
};

goog.exportProperty(ee.SavedFunction, 'getSignature',
    ee.SavedFunction.prototype.getSignature);
