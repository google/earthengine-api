/**
 * @fileoverview Functions for manipulating image objects and requests for
 * raster visualization.
 */

goog.provide('ee.data.images');

goog.require('ee.ApiFunction');
goog.require('ee.Geometry');
goog.require('ee.data');
goog.require('goog.array');
goog.require('goog.object');

goog.forwardDeclare('ee.Image');




/**
 * Wraps an image in a call to visualize() if any parameters used by
 * visualize() were provided.  Generates a request object containing
 * the serialized image and any remaining parameters (e.g.: fileFormat)
 *
 * @param {!ee.Image} image The image to include in the request.
 * @param {!ee.data.ImageVisualizationParameters} params The
 *    visualization parameters.
 * @return {!Object} A completed request object.
 */
ee.data.images.applyVisualization = function(image, params) {
  // Split the parameters into those handled handled by visualize()
  // and those that aren't.
  var request = {};
  var visParams = ee.data.images.extractVisParams(params, request);
  if (!goog.object.isEmpty(visParams)) {
    visParams.image = image;
    image = /** @type {!ee.Image} */ (
        ee.ApiFunction._apply('Image.visualize', visParams));
  }
  request.image = image;
  return request;
};


/**
 * Splits the parameters into those which are handled by visualize() and those
 * which aren't.
 * @param {!Object} params The original input parameters
 * @param {!Object} outParams Will hold the visualization parameters which
 * aren't related to visualize()
 * @return {!ee.data.ImageVisualizationParameters} Params for visualize()
 */
ee.data.images.extractVisParams = function(params, outParams) {
  var keysToExtract = ["bands", "gain", "bias", "min", "max",
      "gamma", "palette", "opacity", "forceRgbOutput"];
  var visParams = {};
  goog.object.forEach(params, function(value, key) {
    if (goog.array.contains(keysToExtract, key)) {
      visParams[key] = value;
    } else {
      outParams[key] = value;
    }
  });
  return visParams;
};
