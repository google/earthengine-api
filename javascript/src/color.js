/**
 * @fileoverview A wrapper for colors.
 */

goog.provide('ee.Color');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.Types');



/**
 * An object to represent colors.
 *
 * @param {string|!Array<number>|!ee.ComputedObject} color
 *    1) A W3C compatible color string.
 *    2) A list of RGBA values in the range of [0:1].
 *    3) A ComputedObject returning a color.
 * @constructor
 * @extends {ee.ComputedObject}
 * @export
 */
ee.Color = function(color) {
  if (!(this instanceof ee.Color)) {
    return new ee.Color(color);
  }

  ee.Color.initialize();

  if (color instanceof ee.ComputedObject) {
    ee.Color.base(this, 'constructor', color.func, color.args, color.varName);
  } else {
    ee.Color.base(
        this, 'constructor', new ee.ApiFunction('Color'),
        {'input': color});
  }
};
goog.inherits(ee.Color, ee.ComputedObject);


/**
 * Whether the class has been initialized.
 * @type {boolean}
 * @private
 */
ee.Color.initialized_ = false;


/**
 * Imports API functions to this class.
 */
ee.Color.initialize = function() {
  if (!ee.Color.initialized_) {
    ee.ApiFunction.importApi(ee.Color, 'Color', 'Color');
    ee.Color.initialized_ = true;
  }
};


/**
 * Removes imported API functions from this class.
 */
ee.Color.reset = function() {
  ee.ApiFunction.clearApi(ee.Color);
  ee.Color.initialized_ = false;
};


/** @override */
ee.Color.prototype.name = function() {
  return 'Color';
};


/**
 * Creates a Color given a list of HSV values.
 *
 * @param {!Array<number>|!ee.List} hsv A list of HSV (hue, saturation, value)
 *     values in the range [0:1].
 * @return {!ee.Color}
 * @export
 */
ee.Color.fromHsv = function(hsv) {
  return /** @type {!ee.Color} */ (
      ee.ApiFunction._call('Color.fromHsv', hsv));
};


/**
 * Creates a Color given a list of HSL values.
 *
 * @param {!Array<number>|!ee.List} hsl A list of HSL (hue, saturation,
 *     luminosity) values in the range [0:1].
 * @return {!ee.Color}
 * @export
 */
ee.Color.fromHsl = function(hsl) {
  return /** @type {!ee.Color} */ (
      ee.ApiFunction._call('Color.fromHsl', hsl));
};


/**
 * Creates a Color given a list of CIE-LAB values.
 *
 * @param {!Array<number>|!ee.List} lab A list of CIE-LAB values.
 * @return {!ee.Color}
 * @export
 */
ee.Color.fromLab = function(lab) {
  return /** @type {!ee.Color} */ (
      ee.ApiFunction._call('Color.fromLab', lab));
};


/**
 * Creates a Color given a list of CIE-LCH values.
 *
 * @param {!Array<number>|!ee.List} lch A list of CIE-LCH (lightness, chroma,
 *     hue) values.
 * @return {!ee.Color}
 * @export
 */
ee.Color.fromLch = function(lch) {
  return /** @type {!ee.Color} */ (
      ee.ApiFunction._call('Color.fromLch', lch));
};


/**
 * Creates a gray color.
 *
 * @param {number|!ee.Number} value The gray value in the range [0:1].
 * @param {(number|!ee.Number)=} opt_alpha The alpha value in the range [0:1].
 * @return {!ee.Color}
 * @export
 */
ee.Color.gray = function(value, opt_alpha) {
  return /** @type {!ee.Color} */ (
      ee.ApiFunction._call('Color.gray', value, opt_alpha));
};


/**
 * Mixes two colors.
 *
 * @param {!ee.Color} start The starting color.
 * @param {!ee.Color} end The ending color.
 * @param {(number|!ee.Number)=} opt_ratio The mix ratio.
 * @param {(string|!ee.String)=} opt_colorspace The colorspace to mix in.
 * @return {!ee.Color}
 * @export
 */
ee.Color.mix = function(start, end, opt_ratio, opt_colorspace) {
  return /** @type {!ee.Color} */ (
      ee.ApiFunction._call('Color.mix', start, end, opt_ratio, opt_colorspace));
};


/**
 * Scale each of the RGB channels to produce a brighter color.
 *
 * @param {(number|!ee.Number)=} opt_scale The scale factor.
 * @return {!ee.Color}
 * @export
 */
ee.Color.prototype.brighter = function(opt_scale) {
  return /** @type {!ee.Color} */ (
      ee.ApiFunction._call('Color.brighter', this, opt_scale));
};


/**
 * Scale each of the RGB channels to produce a darker color.
 *
 * @param {(number|!ee.Number)=} opt_scale The scale factor.
 * @return {!ee.Color}
 * @export
 */
ee.Color.prototype.darker = function(opt_scale) {
  return /** @type {!ee.Color} */ (
      ee.ApiFunction._call('Color.darker', this, opt_scale));
};


/**
 * Convert a color to HSL.
 *
 * @return {!ee.List}
 * @export
 */
ee.Color.prototype.toHsl = function() {
  return /** @type {!ee.List} */ (
      ee.ApiFunction._call('Color.toHsl', this));
};


/**
 * Convert a color to HSV.
 *
 * @return {!ee.List}
 * @export
 */
ee.Color.prototype.toHsv = function() {
  return /** @type {!ee.List} */ (
      ee.ApiFunction._call('Color.toHsv', this));
};


/**
 * Convert a color to CIE-Lab.
 *
 * @return {!ee.List}
 * @export
 */
ee.Color.prototype.toLab = function() {
  return /** @type {!ee.List} */ (
      ee.ApiFunction._call('Color.toLab', this));
};


/**
 * Convert a color to CIE-LCH.
 *
 * @return {!ee.List}
 * @export
 */
ee.Color.prototype.toLch = function() {
  return /** @type {!ee.List} */ (
      ee.ApiFunction._call('Color.toLch', this));
};


/**
 * Convert a color to RGB.
 *
 * @return {!ee.List}
 * @export
 */
ee.Color.prototype.toRgb = function() {
  return /** @type {!ee.List} */ (
      ee.ApiFunction._call('Color.toRGB', this));
};


/**
 * Returns value of a color as an RGBA hex string.
 *
 * @return {!ee.String}
 * @export
 */
ee.Color.prototype.toHexString = function() {
  return /** @type {!ee.String} */ (
      ee.ApiFunction._call('Color.toHexString', this));
};
