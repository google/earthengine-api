/**
 * @fileoverview A wrapper for palettes.
 * @suppress {useOfGoogProvide}
 */

goog.provide('ee.Palette');

goog.require('ee.ApiFunction');
goog.require('ee.Color');
goog.require('ee.ComputedObject');



/**
 * An object to represent palettes.
 *
 * @param {string|!Array<string>|!ee.ComputedObject|!Object=} opt_colors
 *     A list of colors or the name of a predefined color palette.
 * @param {string=} opt_mode The colorspace in which to interpolate.
 * @param {number=} opt_min The minimum value of the palette.
 * @param {number=} opt_max The maximum value of the palette.
 * @param {!Array<number>=} opt_padding Shifts the color range by padding the
 *     end.
 * @param {number|!Array<number>=} opt_classes Create a palette representing
 *     discrete classes.
 * @param {!Array<number>=} opt_positions Set the positions for the colors.
 * @param {boolean=} opt_correctLightness Correct the color spacing to spread
 *     lightness range.
 * @param {number=} opt_gamma A gamma correction for the palette.
 * @param {boolean=} opt_bezier Sets the palette to use Bezier interpolation.
 * @constructor
 * @extends {ee.ComputedObject}
 * @export
 */
ee.Palette = function(
    opt_colors, opt_mode, opt_min, opt_max, opt_padding, opt_classes,
    opt_positions, opt_correctLightness, opt_gamma, opt_bezier) {
  if (!(this instanceof ee.Palette)) {
    return new ee.Palette(
        opt_colors, opt_mode, opt_min, opt_max, opt_padding, opt_classes,
        opt_positions, opt_correctLightness, opt_gamma, opt_bezier);
  }

  ee.Palette.initialize();

  if (opt_colors instanceof ee.ComputedObject && arguments.length == 1) {
    ee.Palette.base(
        this, 'constructor', opt_colors.func, opt_colors.args,
        opt_colors.varName);
  } else {
    ee.Palette.base(this, 'constructor', new ee.ApiFunction('Palette'), {
      'colors': opt_colors,
      'mode': opt_mode || 'RGB',
      'min': opt_min != null ? opt_min : 0.0,
      'max': opt_max != null ? opt_max : 1.0,
      'padding': opt_padding || null,
      'classes': opt_classes || null,
      'positions': opt_positions || null,
      'correctLightness': opt_correctLightness || false,
      'gamma': opt_gamma != null ? opt_gamma : 1.0,
      'bezier': opt_bezier || false
    });
  }
};
goog.inherits(ee.Palette, ee.ComputedObject);


/**
 * Whether the class has been initialized.
 * @type {boolean}
 * @private
 */
ee.Palette.initialized_ = false;


/**
 * Imports API functions to this class.
 */
ee.Palette.initialize = function() {
  if (!ee.Palette.initialized_) {
    ee.ApiFunction.importApi(ee.Palette, 'Palette', 'Palette');
    ee.Palette.initialized_ = true;
  }
};


/**
 * Removes imported API functions from this class.
 */
ee.Palette.reset = function() {
  ee.ApiFunction.clearApi(ee.Palette);
  ee.Palette.initialized_ = false;
};


/**
 * @override
 * @return {string}
 */
ee.Palette.prototype.name = function() {
  return 'Palette';
};


/**
 * Returns the color at the given value.
 *
 * @param {number|!ee.ComputedObject} value The value to look up.
 * @return {!ee.Color}
 * @export
 */
ee.Palette.prototype.getColor = function(value) {
  return /** @type {!ee.Color} */ (
      ee.ApiFunction._call('Palette.getColor', this, value));
};


/**
 * Get colors from this palette.
 *
 * @param {number|!ee.ComputedObject=} opt_nColors The number of equally
 *     spaced colors to retrieve.
 * @return {!ee.ComputedObject}
 * @export
 */
ee.Palette.prototype.getColors = function(opt_nColors) {
  return /** @type {!ee.ComputedObject} */ (
      ee.ApiFunction._call('Palette.getColors', this, opt_nColors));
};


/**
 * Set the colorspace interpolation mode.
 *
 * @param {string|!ee.ComputedObject} mode The colorspace mode.
 * @return {!ee.Palette}
 * @export
 */
ee.Palette.prototype.mode = function(mode) {
  return /** @type {!ee.Palette} */ (
      ee.ApiFunction._call('Palette.mode', this, mode));
};


/**
 * Set the minimum and maximum limits for the palette.
 *
 * @param {number|!ee.ComputedObject} min The minimum value.
 * @param {number|!ee.ComputedObject} max The maximum value.
 * @return {!ee.Palette}
 * @export
 */
ee.Palette.prototype.limits = function(min, max) {
  return /** @type {!ee.Palette} */ (
      ee.ApiFunction._call('Palette.limits', this, min, max));
};


/**
 * Set the position for each color in the palette.
 *
 * @param {!Array<number>|!ee.ComputedObject} positions A list of values
 *     specifying the position for each color.
 * @return {!ee.Palette}
 * @export
 */
ee.Palette.prototype.positions = function(positions) {
  return /** @type {!ee.Palette} */ (
      ee.ApiFunction._call('Palette.positions', this, positions));
};


/**
 * Use discrete classes as opposed to a continuous gradient.
 *
 * @param {number|!Array<number>|!ee.ComputedObject} classes
 *     Either a list of class break values, or a single number.
 * @return {!ee.Palette}
 * @export
 */
ee.Palette.prototype.classes = function(classes) {
  return /** @type {!ee.Palette} */ (
      ee.ApiFunction._call('Palette.classes', this, classes));
};


/**
 * Shifts the color range by padding the end of the color scale.
 *
 * @param {number|!ee.ComputedObject} left The left padding.
 * @param {number|!ee.ComputedObject=} opt_right The right padding.
 * @return {!ee.Palette}
 * @export
 */
ee.Palette.prototype.padding = function(left, opt_right) {
  return /** @type {!ee.Palette} */ (
      ee.ApiFunction._call('Palette.padding', this, left, opt_right));
};


/**
 * Apply a gamma correction to the palette.
 *
 * @param {number|!ee.ComputedObject} gamma The gamma value.
 * @return {!ee.Palette}
 * @export
 */
ee.Palette.prototype.gamma = function(gamma) {
  return /** @type {!ee.Palette} */ (
      ee.ApiFunction._call('Palette.gamma', this, gamma));
};


/**
 * Sets the palette to use bezier interpolation.
 *
 * @param {boolean|!ee.ComputedObject=} opt_interpolate Whether to use bezier
 *     interpolation.
 * @return {!ee.Palette}
 * @export
 */
ee.Palette.prototype.bezier = function(opt_interpolate) {
  return /** @type {!ee.Palette} */ (
      ee.ApiFunction._call('Palette.bezier', this, opt_interpolate));
};


/**
 * Correct the color spacing to spread lightness range evenly.
 *
 * @param {boolean|!ee.ComputedObject=} opt_correct Whether to correct
 *     lightness.
 * @return {!ee.Palette}
 * @export
 */
ee.Palette.prototype.correctLightness = function(opt_correct) {
  return /** @type {!ee.Palette} */ (
      ee.ApiFunction._call('Palette.correctLightness', this, opt_correct));
};
