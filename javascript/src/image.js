// Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview A representation of an earth engine image.
 *
 * See: https://sites.google.com/site/earthengineapidocs for more details.
 */
goog.provide('ee.Image');

goog.require('ee');
goog.require('ee.Collection');
goog.require('ee.Serializer');
goog.require('ee.data');
goog.require('goog.Uri.QueryData');



/**
 * An object to represent an Earth Engine image. This constructor accepts a
 * variety of arguments:
 *   1) A string - an EarthEngine asset id,
 *   2) A number - creates a constant image,
 *   3) An array - creates an image out of each element of the array and
 *      combines them into a single image,
 *   4) An ee.Image - returns the argument,
 *   5) A structure - Assumed to be an image's JSON description.
 *
 * @constructor
 * @param {number|string|Array.<*>|ee.Image|Object} args Constructor argument.
 */
ee.Image = function(args) {
  // Constructor safety.
  if (!(this instanceof ee.Image)) {
    return new ee.Image(args);
  }
  ee.initialize();

  if (goog.isNumber(args)) {
    // Make a constant image.
    args = {
      'algorithm': 'Constant',
      'value': args
    };
  } else if (goog.isString(args)) {
    args = {
      'type': 'Image',
      'id': args
    };
  } else if (goog.isArray(args)) {
    // Make an image out of each element.
    return ee.Image.combine_(goog.array.map(
        (/** @type {Array.<*>} */ args),
        function(elem) {
          return new ee.Image(/** @type {?} */ (elem));
        }));
  } else if (args instanceof ee.Image) {
    // The arguments are already an image. Just return it.
    return args;
  }

  /**
   * The internal representation of this image.
   *
   * @type {Object}
   * @private
   */
  this.description_ = /** @type {Object} */ (args);
};


/**
 * An imperative function that returns information about this image via a
 * synchronous AJAX call.
 *
 * @return {Object} The return contents vary but will include at least:
 *   bands - an array containing metadata about the bands in the collection,
 *   properties - a dictionary containing the image's metadata properties.
 */
ee.Image.prototype.getInfo = function() {
  return ee.data.getValue({
    'json': this.serialize()
  });
};


/**
 * An imperative function that returns a map id and token, suitable for
 * generating a Map overlay.
 *
 * @param {Object?=} opt_visParams The visualization parameters.
 *     See ee.data.getMapId.
 * @param {function(Object, string=)=} opt_callback An async callback.
 * @return {ee.data.mapid} An object containing a mapid string, an access token,
 *     plus this object, or an error message.
 */
ee.Image.prototype.getMap = function(opt_visParams, opt_callback) {
  var request = opt_visParams || {};
  request['image'] = this.serialize();

  if (opt_callback) {
    ee.data.getMapId(
        request,
        // Put the image object into the response from getMapId.
        goog.bind(function(data, error) {
          if (data) {
            data['image'] = this;
          }
          opt_callback(data, error);
        }, this));
  } else {
    var response = ee.data.getMapId(request);
    response['image'] = this;
    return response;
  }
};


/**
 * Get a Download URL
 * @param {Object} params An object containing download options with the
 *   following possible values:
 *     name: a base name to use when constructing filenames.
 *     bands: a description of the bands to download. Must be an array of
 *         dictionaries, each with the following keys:
 *       id: the name of the band, a string, required.
 *       crs: an optional CRS string defining the band projection.
 *       crs_transform: an optional array of 6 numbers specifying an affine
 *           transform from the specified CRS, in the order: xScale, yShearing,
 *           xShearing, yScale, xTranslation and yTranslation.
 *       dimensions: an optional array of two integers defining the width and
 *           height to which the band is cropped.
 *       scale: an optional number, specifying the scale in meters of the band;
 *              ignored if crs and crs_transform is specified.
 *     crs: a default CRS string to use for any bands that do not explicitly
 *         specify one.
 *     crs_transform: a default affine transform to use for any bands that do
 *         not specify one, of the same format as the crs_transform of bands.
 *     dimensions: default image cropping dimensions to use for any bands that
 *         do not specify them.
 *     scale: a default scale to use for any bands that do not specify one;
 *         ignored if crs and crs_transform is specified.
 *     region: a polygon specifying a region to download; ignored if crs
 *         and crs_transform is specified.
 * @return {string} A download URL.
 */
ee.Image.prototype.getDownloadURL = function(params) {
  var request = params || {};
  request['image'] = this.serialize();
  var downloadId = ee.data.getDownloadId(request);
  return ee.data.makeDownloadUrl(downloadId);
};


/**
 * JSON serializer.
 *
 * @return {string} The serialized representation of this object.
 */
ee.Image.prototype.serialize = function() {
  return ee.Serializer.toJSON(this.description_);
};

// ///////////////////////////////////////////////////////////////
// Static functions that aren't defined by the REST service
// ///////////////////////////////////////////////////////////////


/**
 * Create a 3-band image specifically for visualization. This uses the first
 * band in each image.
 *
 * @param {ee.Image} r The red image.
 * @param {ee.Image} g The green image.
 * @param {ee.Image} b The blue image.
 * @return {ee.Image} The combined image.
 */
ee.Image.rgb = function(r, g, b) {
  return ee.Image.combine_([r, g, b], ['vis-red', 'vis-green', 'vis-blue']);
};


/**
 * Concatenate the given images together into a single image.
 *
 * @param {...ee.Image} var_args The images to be combined.
 * @return {ee.Image} The combined image.
 */
ee.Image.cat = function(var_args) {
  var args = Array.prototype.slice.call(arguments);
  return ee.Image.combine_(args, null);
};


/**
 * Combine all the bands from the given images into a single image, with
 * optional renaming.
 *
 * @param {Array.<ee.Image>} images The images to be combined.
 * @param {Array.<string>=} opt_names An array of names for the output bands.
 * @return {ee.Image} The combined image.
 * @private
 */
ee.Image.combine_ = function(images, opt_names) {
  if (images.length == 0) {
    throw Error('Can\'t combine 0 images.');
  }

  // Append all the bands.
  var result = new ee.Image(images[0]);
  for (var i = 1; i < images.length; i++) {
    result = new ee.Image({
      'algorithm': 'Image.addBands',
      'dstImg': result,
      'srcImg': new ee.Image(images[i])
    });
  }

  // Optionally, rename the bands of the result.
  if (opt_names) {
    result = result.select(['.*'], opt_names);
  }

  return result;
};


/**
 * Select bands from an image.  This is an override to the normal
 * Image.select function to allow varargs usage.
 *
 * @param {Array.<string|number>} selectors An array of names,
 *     regexes or numeric indicies specifying the bands to select.
 * @param {Array.<string>=} opt_names Array of new names for the output bands.
 *     Must match the number of bands selected.
 * @return {ee.Image} The image.
 */
ee.Image.prototype.select = function(selectors, opt_names) {
  // If the user didn't pass an array as the first argument, assume
  // that everything in the arguments array is actually a selector.
  var call = {
    'algorithm': 'Image.select',
    'input': this,
    'bandSelectors': selectors
  };
  if (!goog.isArray(selectors)) {
    selectors = Array.prototype.slice.call(arguments);
    // Verify we didn't get anything unexpected.
    for (var i = 0; i < selectors.length; i++) {
      if (!goog.isString(selectors[i]) && !goog.isNumber(selectors[i])) {
        throw Error('Illegal argument to select(): ' + selectors[i]);
      }
    }
    call['bandSelectors'] = selectors;
  } else if (opt_names) {
    call['newNames'] = opt_names;
  }
  return new ee.Image(call);
};


/**
 * @return {string} The image as a human-readable string.
 */
ee.Image.prototype.toString = function() {
  return 'ee.Image(' + ee.Serializer.toReadableJSON(this.description_) + ')';
};

// Explicit exports.
goog.exportSymbol('ee.Image', ee.Image);
goog.exportProperty(ee.Image.prototype, 'getInfo', ee.Image.prototype.getInfo);
goog.exportProperty(ee.Image.prototype, 'getDownloadURL',
                    ee.Image.prototype.getDownloadURL);
goog.exportProperty(ee.Image.prototype, 'getMap', ee.Image.prototype.getMap);
goog.exportProperty(ee.Image.prototype, 'select', ee.Image.prototype.select);
goog.exportProperty(ee.Image.prototype, 'serialize',
                    ee.Image.prototype.serialize);
goog.exportProperty(ee.Image, 'cat', ee.Image.cat);
goog.exportProperty(ee.Image, 'combine_', ee.Image.combine_);
goog.exportProperty(ee.Image, 'rgb', ee.Image.rgb);
goog.exportProperty(ee.Image, 'toString', ee.Image.toString);
