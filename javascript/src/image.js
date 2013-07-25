/**
 * @fileoverview A representation of an earth engine image.
 * See: https://sites.google.com/site/earthengineapidocs for more details.
 */

goog.provide('ee.Image');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.CustomFunction');
goog.require('ee.Geometry');
goog.require('ee.Types');
goog.require('ee.data');
goog.require('goog.array');
goog.require('goog.object');



/**
 * An object to represent an Earth Engine image. This constructor accepts a
 * variety of arguments:
 *   - A string: an EarthEngine asset id,
 *   - A string and a number - an EarthEngine asset id and version,
 *   - A number: creates a constant image,
 *   - An array: creates an image out of each element of the array and
 *     combines them into a single image,
 *   - An ee.Image: returns the argument,
 *   - Nothing: results in an empty transparent image.
 *
 * @param {number|string|Array.<*>|ee.Image|Object} args Constructor argument.
 * @constructor
 * @extends {ee.ComputedObject}
 */
ee.Image = function(args) {
  // Constructor safety.
  if (!(this instanceof ee.Image)) {
    return new ee.Image(args);
  } else if (args instanceof ee.Image) {
    return args;
  }

  ee.Image.initialize();

  var argCount = arguments.length;
  if (argCount == 0) {
    goog.base(this, new ee.ApiFunction('Image.mask'), {
      'image': ee.Image(0),
      'mask': ee.Image(0)
    });
  } else if (argCount == 1) {
    if (ee.Types.isNumber(args)) {
      // A constant image.
      goog.base(this, new ee.ApiFunction('Image.constant'), {'value': args});
    } else if (ee.Types.isString(args)) {
      // An ID.
      goog.base(this, new ee.ApiFunction('Image.load'), {'id': args});
    } else if (goog.isArray(args)) {
      // Make an image out of each element.
      return ee.Image.combine_(goog.array.map(
          /** @type {Array.<*>} */ (args),
          function(elem) {
            return new ee.Image(/** @type {?} */ (elem));
          }));
    } else if (args instanceof ee.ComputedObject) {
      // A custom object to reinterpret as an Image.
      goog.base(this, args.func, args.args);
    } else {
      throw Error('Unrecognized argument type to convert to an Image: ' + args);
    }
  } else if (argCount == 2) {
    // An ID and version.
    var id = arguments[0];
    var version = arguments[1];
    if (ee.Types.isString(id) && ee.Types.isNumber(version)) {
      goog.base(this, new ee.ApiFunction('Image.load'), {
        'id': id,
        'version': version
      });
    } else {
      throw Error('Unrecognized argument types to convert to an Image: ' +
                  arguments);
    }
  } else {
    throw Error('The Image constructor takes at most 2 arguments (' +
                argCount + ' given)');
  }
};
goog.inherits(ee.Image, ee.ComputedObject);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.Image.initialized_ = false;


/**
 * Imports API functions to this class.
 * @hidden
 */
ee.Image.initialize = function() {
  if (!ee.Image.initialized_) {
    ee.ApiFunction.importApi(ee.Image, 'Image', 'Image');
    ee.ApiFunction.importApi(ee.Image, 'Window', 'Image', 'focal_');
    ee.Image.initialized_ = true;
  }
};


/**
 * Removes imported API functions from this class.
 * @hidden
 */
ee.Image.reset = function() {
  ee.ApiFunction.clearApi(ee.Image);
  ee.Image.initialized_ = false;
};


/**
 * An imperative function that returns information about this image via a
 * synchronous AJAX call.
 *
 * @param {function(Object)=} opt_callback An optional callback.  If not
 *     supplied, the call is made synchronously.
 * @return {Object|undefined} An object whose attributes vary but include:
 *     - bands - an array containing metadata about the bands in the collection.
 *     - properties - a dictionary containing the image's metadata properties.
 */
ee.Image.prototype.getInfo = function(opt_callback) {
  return /** @type {Object|undefined} */(
      goog.base(this, 'getInfo', opt_callback));
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
 *     following possible values:
 *   - name: a base name to use when constructing filenames.
 *   - bands: a description of the bands to download. Must be an array of
 *         dictionaries, each with the following keys:
 *     + id: the name of the band, a string, required.
 *     + crs: an optional CRS string defining the band projection.
 *     + crs_transform: an optional array of 6 numbers specifying an affine
 *           transform from the specified CRS, in the order: xScale, yShearing,
 *           xShearing, yScale, xTranslation and yTranslation.
 *     + dimensions: an optional array of two integers defining the width and
 *           height to which the band is cropped.
 *     + scale: an optional number, specifying the scale in meters of the band;
 *              ignored if crs and crs_transform is specified.
 *   - crs: a default CRS string to use for any bands that do not explicitly
 *         specify one.
 *   - crs_transform: a default affine transform to use for any bands that do
 *         not specify one, of the same format as the crs_transform of bands.
 *   - dimensions: default image cropping dimensions to use for any bands that
 *         do not specify them.
 *   - scale: a default scale to use for any bands that do not specify one;
 *         ignored if crs and crs_transform is specified.
 *   - region: a polygon specifying a region to download; ignored if crs
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
 * Get a thumbnail URL for this image.
 * @param {Object} params Parameters identical to getMapId, plus:
 *   - size (a number or pair of numbers in format WIDTHxHEIGHT) Maximum
 *         dimensions of the thumbnail to render, in pixels. If only one
 *         number is passed, it is used as the maximum, and the other
 *         dimension is computed by proportional scaling.
 *   - region (E,S,W,N or GeoJSON) Geospatial region of the image
 *         to render. By default, the whole image.
 *   - format (string) Either 'png' (default) or 'jpg'.
 * @return {string} A thumbnail URL.
 */
ee.Image.prototype.getThumbURL = function(params) {
  var request = params || {};
  request['image'] = this.serialize();
  return ee.data.makeThumbUrl(ee.data.getThumbId(request));
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
    result = ee.ApiFunction._call('Image.addBands', result, images[i]);
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
  var args = {
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
    args['bandSelectors'] = selectors;
  } else if (opt_names) {
    args['newNames'] = opt_names;
  }
  return /** @type {ee.Image} */(ee.ApiFunction._apply('Image.select', args));
};


/**
 * Evaluates an expression on an image.
 *
 * @see ee.Image.parseExpression()
 * @param {string} expression The expression to evaluate.
 * @param {Object.<ee.Image>=} opt_map A map of input images available by name.
 * @return {ee.Image} The image created by the provided expression.
 */
ee.Image.prototype.expression = function(expression, opt_map) {
  var argName = 'DEFAULT_EXPRESSION_IMAGE';
  var body = ee.ApiFunction._call('Image.parseExpression', expression, argName);
  var argNames = [argName];
  var args = goog.object.create(argName, this);

  // Add custom arguments, promoting them to Images manually.
  if (opt_map) {
    for (var name in opt_map) {
      argNames.push(name);
      args[name] = new ee.Image(opt_map[name]);
    }
  }

  // Reinterpret the body call as an ee.Function by hand-generating the
  // signature so the computed function knows its input and output types.
  var func = new ee.Function();
  func.encode = function(encoder) {
    return body.encode(encoder);
  };
  func.getSignature = function(encoder) {
    return {
      'name': '',
      'args': goog.array.map(argNames, function(name) {
        return {
          'name': name,
          'type': 'Image',
          'optional': false
        };
      }, this),
      'returns': 'Image'
    };
  };

  // Perform the call.
  return /** @type {ee.Image} */(func.apply(args));
};


/**
 * Clips an image by a Geometry, Feature or FeatureCollection.
 *
 * @param {ee.Geometry|ee.Feature|ee.FeatureCollection|Object} geometry
 *     The Geometry, Feature or FeatureCollection to clip to.
 * @return {ee.Image} The clipped image.
 */
ee.Image.prototype.clip = function(geometry) {
  try {
    // Need to manually promote GeoJSON, because the signature does not
    // specify the type so auto promotion won't work.
    geometry = new ee.Geometry(geometry);
  } catch (e) {
    // Not an ee.Geometry or GeoJSON. Just pass it along.
  }
  return /** @type {ee.Image} */(
      ee.ApiFunction._call('Image.clip', this, geometry));
};


/** @inheritDoc */
ee.Image.prototype.name = function() {
  return 'Image';
};


// Explicit exports.
goog.exportSymbol('ee.Image', ee.Image);
goog.exportProperty(ee.Image.prototype, 'getInfo',
                    ee.Image.prototype.getInfo);
goog.exportProperty(ee.Image.prototype, 'getDownloadURL',
                    ee.Image.prototype.getDownloadURL);
goog.exportProperty(ee.Image.prototype, 'getThumbURL',
                    ee.Image.prototype.getThumbURL);
goog.exportProperty(ee.Image.prototype, 'getMap',
                    ee.Image.prototype.getMap);
goog.exportProperty(ee.Image.prototype, 'select',
                    ee.Image.prototype.select);
goog.exportProperty(ee.Image.prototype, 'expression',
                    ee.Image.prototype.expression);
goog.exportProperty(ee.Image.prototype, 'clip',
                    ee.Image.prototype.clip);
goog.exportProperty(ee.Image, 'cat', ee.Image.cat);
goog.exportProperty(ee.Image, 'rgb', ee.Image.rgb);
goog.exportProperty(ee.Image, 'toString', ee.Image.toString);
