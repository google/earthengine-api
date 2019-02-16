/**
 * @fileoverview A representation of an earth engine image.
 * See: https://sites.google.com/site/earthengineapidocs for more details.
 */

goog.provide('ee.Image');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.Element');
goog.require('ee.Feature');
goog.require('ee.Function');
goog.require('ee.Geometry');
goog.require('ee.Types');
goog.require('ee.arguments');
goog.require('ee.data');
goog.require('ee.data.images');
goog.require('goog.array');
goog.require('goog.json');
goog.require('goog.object');



/**
 * An object to represent an Earth Engine image. This constructor accepts a
 * variety of arguments:
 *   - A string: an EarthEngine asset id,
 *   - A string and a number - an EarthEngine asset id and version,
 *   - A number or EEArray: creates a constant image,
 *   - A list: creates an image out of each list element and combines them
 *     into a single image,
 *   - An ee.Image: returns the argument,
 *   - Nothing: results in an empty transparent image.
 *
 * @param {number|string|Array.<*>|ee.Image|Object=} opt_args
 *     Constructor argument.
 * @constructor
 * @extends {ee.Element}
 * @export
 */
ee.Image = function(opt_args) {
  // Constructor safety.
  if (!(this instanceof ee.Image)) {
    return ee.ComputedObject.construct(ee.Image, arguments);
  } else if (opt_args instanceof ee.Image) {
    return opt_args;
  }

  ee.Image.initialize();

  var argCount = arguments.length;
  if (argCount == 0 || (argCount == 1 && !goog.isDef(opt_args))) {
    ee.Image.base(this, 'constructor', new ee.ApiFunction('Image.mask'), {
      'image': new ee.Image(0),
      'mask': new ee.Image(0)
    });
  } else if (argCount == 1) {
    if (ee.Types.isNumber(opt_args)) {
      // A constant image.
      ee.Image.base(this, 'constructor', new ee.ApiFunction('Image.constant'),
                {'value': opt_args});
    } else if (ee.Types.isString(opt_args)) {
      // An ID.
      ee.Image.base(this, 'constructor', new ee.ApiFunction('Image.load'), {'id': opt_args});
    } else if (goog.isArray(opt_args)) {
      // Make an image out of each element.
      return ee.Image.combine_(goog.array.map(
          /** @type {Array.<*>} */ (opt_args),
          function(elem) {
            return new ee.Image(/** @type {?} */ (elem));
          }));
    } else if (opt_args instanceof ee.ComputedObject) {
      if (opt_args.name() == 'Array') {
        // A constant array image.
        ee.Image.base(this, 'constructor', new ee.ApiFunction('Image.constant'),
                  {'value': opt_args});
      } else {
        // A custom object to reinterpret as an Image.
        ee.Image.base(this, 'constructor', opt_args.func, opt_args.args, opt_args.varName);
      }
    } else {
      throw Error('Unrecognized argument type to convert to an Image: ' +
                  opt_args);
    }
  } else if (argCount == 2) {
    // An ID and version.
    var id = arguments[0];
    var version = arguments[1];
    if (ee.Types.isString(id) && ee.Types.isNumber(version)) {
      ee.Image.base(this, 'constructor', new ee.ApiFunction('Image.load'), {
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
goog.inherits(ee.Image, ee.Element);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.Image.initialized_ = false;


/**
 * Imports API functions to this class.
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
 */
ee.Image.reset = function() {
  ee.ApiFunction.clearApi(ee.Image);
  ee.Image.initialized_ = false;
};


/**
 * An imperative function that returns information about this image via an
 * AJAX call.
 *
 * @param {function(ee.data.ImageDescription, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 *     If supplied, will be called with the first parameter if successful and
 *     the second if unsuccessful.
 * @return {ee.data.ImageDescription} A description of the image. Includes:
 *     - bands - a list containing metadata about the bands in the collection.
 *     - properties - a dictionary containing the image's metadata properties.
 * @export
 */
ee.Image.prototype.getInfo = function(opt_callback) {
  return /** @type {ee.data.ImageDescription} */(
      ee.Image.base(this, 'getInfo', opt_callback));
};


/**
 * An imperative function that returns a map id and token, suitable for
 * generating a Map overlay.
 *
 * @param {!ee.data.ImageVisualizationParameters=} opt_visParams
 *     The visualization parameters.
 * @param {function(!ee.data.MapId, string=)=} opt_callback An async callback.
 *     If not supplied, the call is made synchronously.
 * @return {!ee.data.MapId|undefined} An object containing a mapid string, an
 *     access token plus this object, or an error message. Or undefined if a
 *     callback was specified.
 * @export
 */
ee.Image.prototype.getMap = function(opt_visParams, opt_callback) {
  var args = ee.arguments.extractFromFunction(
      ee.Image.prototype.getMap, arguments);

  var request = ee.data.images.applyVisualization(this, args['visParams']);

  if (args['callback']) {
    const callback =
        /** @type {function(!ee.data.MapId=, string=)} */ (args['callback']);
    ee.data.getMapId(
        request,
        // Put the image object into the response from getMapId.
        (data, error) => {
          const mapId = data ?
              /** @type {!ee.data.MapId} */ (
                  Object.assign(data, {image: this})) :
              undefined;
          callback(mapId, error);
        });
  } else {
    var response =
        /** @type {!ee.data.MapId} */ (ee.data.getMapId(request));
    response.image = this;
    return response;
  }
};

/**
 * Get a Download URL
 * @param {Object} params An object containing download options with the
 *     following possible values:
 *   - name: a base name to use when constructing filenames.
 *   - bands: a description of the bands to download. Must be a list of
 *         dictionaries, each with the following keys:
 *     + id: the name of the band, a string, required.
 *     + crs: an optional CRS string defining the band projection.
 *     + crs_transform: an optional list of 6 numbers specifying an affine
 *           transform from the specified CRS, in row-major order:
 *           [xScale, xShearing, xTranslation, yShearing, yScale, yTranslation]
 *     + dimensions: an optional list of two integers defining the width and
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
 * @param {function(string?, string=)=} opt_callback An optional
 *     callback. If not supplied, the call is made synchronously.
 * @return {string|undefined} Returns a download URL, or undefined if a callback
 *     was specified.
 * @export
 */
ee.Image.prototype.getDownloadURL = function(params, opt_callback) {
  var args = ee.arguments.extractFromFunction(
      ee.Image.prototype.getDownloadURL, arguments);
  var request = args['params'] ? goog.object.clone(args['params']) : {};
  request['image'] = this.serialize();
  if (args['callback']) {
    var callback = args['callback'];
    ee.data.getDownloadId(request, function(downloadId, error) {
      if (downloadId) {
        callback(ee.data.makeDownloadUrl(downloadId));
      } else {
        callback(null, error);
      }
    });
  } else {
    return ee.data.makeDownloadUrl(
        /** @type {!ee.data.DownloadId} */ (ee.data.getDownloadId(request)));
  }
};


/**
 * Get a thumbnail URL for this image.
 * @param {!Object} params Parameters identical to ee.data.getMapId, plus,
 * optionally:
 *   - dimensions (a number or pair of numbers in format WIDTHxHEIGHT) Maximum
 *         dimensions of the thumbnail to render, in pixels. If only one
 *         number is passed, it is used as the maximum, and the other
 *         dimension is computed by proportional scaling.
 *   - region (E,S,W,N or GeoJSON) Geospatial region of the image
 *         to render. By default, the whole image.
 *   - format (string) Either 'png' or 'jpg'.
 * @param {function(string, string=)=} opt_callback An optional
 *     callback. If not supplied, the call is made synchronously.
 * @return {string|undefined} A thumbnail URL, or undefined if a callback
 *     was specified.
 * @export
 */
ee.Image.prototype.getThumbURL = function(params, opt_callback) {
  const args = ee.arguments.extractFromFunction(
      ee.Image.prototype.getThumbURL, arguments);
  const
  request = ee.data.images.applyVisualization(this, args['params']);
  if (request['region']) {
    if (goog.isArray(request['region']) ||
        ee.Types.isRegularObject(request['region'])) {
      request['region'] = goog.json.serialize(request['region']);
    } else if (!goog.isString(request['region'])) {
      // TODO(user): Support ee.Geometry.
      throw Error('The region parameter must be an array or a GeoJSON object.');
    }
  }
  if (args['callback']) {
    const callbackWrapper = function(thumbId, opt_error) {
      let thumbUrl = '';
      if (!goog.isDef(opt_error)) {
        try {
          thumbUrl = ee.data.makeThumbUrl(thumbId);
        } catch (e) {
          opt_error = String(e.message);
        }
      }
      args['callback'](thumbUrl, opt_error);
    };
    ee.data.getThumbId(request, callbackWrapper);
  } else {
    return ee.data.makeThumbUrl(
        /** @type {!ee.data.ThumbnailId} */ (ee.data.getThumbId(request)));
  }
};


///////////////////////////////////////////////////////////
// Static functions that aren't defined by the REST service
///////////////////////////////////////////////////////////


/**
 * Create a 3-band image specifically for visualization. This uses the first
 * band in each image.
 *
 * @param {ee.Image} r The red image.
 * @param {ee.Image} g The green image.
 * @param {ee.Image} b The blue image.
 * @return {ee.Image} The combined image.
 * @export
 */
ee.Image.rgb = function(r, g, b) {
  var args = ee.arguments.extractFromFunction(ee.Image.rgb, arguments);
  return ee.Image.combine_(
      [args['r'], args['g'], args['b']],
      ['vis-red', 'vis-green', 'vis-blue']);
};


/**
 * Concatenate the given images together into a single image.
 *
 * @param {...ee.Image} var_args The images to be combined.
 * @return {ee.Image} The combined image.
 * @export
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
 * @param {Array.<string>=} opt_names A list of names for the output bands.
 * @return {ee.Image} The combined image.
 * @private
 */
ee.Image.combine_ = function(images, opt_names) {
  if (images.length == 0) {
    return /** @type {ee.Image} */ (ee.ApiFunction._call('Image.constant', []));
  }

  // Append all the bands.
  var result = new ee.Image(images[0]);
  for (var i = 1; i < images.length; i++) {
    result = /** @type {!ee.Image} */ (
        ee.ApiFunction._call('Image.addBands', result, images[i]));
  }

  // Optionally, rename the bands of the result.
  if (opt_names) {
    result = result.select(['.*'], opt_names);
  }

  return result;
};


/**
 * Selects bands from an image.
 *
 * @param {...*} var_args One of two possibilities:
 * - Any number of non-list arguments. All of these will be interpreted as band
 *   selectors. These can be band names, regexes, or numeric indices. E.g.
 *   selected = image.select('a', 'b', 3, 'd');
 * - Two lists. The first will be used as band selectors and the second
 *   as new names for the selected bands. The number of new names must match
 *   the number of selected bands. E.g.
 *   selected = image.select(['a', 4], ['newA', 'newB']);
 *
 * @return {ee.Image} An image with the selected bands.
 * @export
 */
ee.Image.prototype.select = function(var_args) {
  var args = Array.prototype.slice.call(arguments);

  var algorithmArgs = {
    'input': this,
    'bandSelectors': args[0] || []
  };

  // If the user didn't pass an array as the first argument, assume
  // that everything in the arguments array is actually a selector.
  if (args.length > 2 ||
      ee.Types.isString(args[0]) ||
      ee.Types.isNumber(args[0])) {
    // Varargs inputs.
    var selectors = args;
    // Verify we didn't get anything unexpected.
    for (var i = 0; i < selectors.length; i++) {
      if (!ee.Types.isString(selectors[i]) &&
          !ee.Types.isNumber(selectors[i]) &&
          !(selectors[i] instanceof ee.ComputedObject)) {
        throw Error('Illegal argument to select(): ' + selectors[i]);
      }
    }
    algorithmArgs['bandSelectors'] = selectors;
  } else if (args[1]) {
    algorithmArgs['newNames'] = args[1];
  }
  return /** @type {ee.Image} */ (
      ee.ApiFunction._apply('Image.select', algorithmArgs));
};


/**
 * Evaluates an arithmetic expression on an image, possibly involving additional
 * images.
 *
 * The bands of the primary input image are available using the built-in
 * function b(), as b(0) or b('band_name').
 *
 * Variables in the expression are interpreted as additional image parameters
 * which must be supplied in opt_map. The bands of each such image can be
 * accessed like image.band_name or image[0].
 *
 * Both b() and image[] allow multiple arguments, to specify multiple bands,
 * such as b(1, 'name', 3).  Calling b() with no arguments, or using a variable
 * by itself, returns all bands of the image.
 *
 * @param {string} expression The expression to evaluate.
 * @param {Object.<ee.Image>=} opt_map A map of input images available by name.
 * @return {!ee.Image} The image computed by the provided expression.
 * @export
 */
ee.Image.prototype.expression = function(expression, opt_map) {
  var originalArgs = ee.arguments.extractFromFunction(
      ee.Image.prototype.expression, arguments);

  var eeArgName = 'DEFAULT_EXPRESSION_IMAGE';
  var vars = [eeArgName];
  var eeArgs = goog.object.create(eeArgName, this);

  // Add custom arguments, promoting them to Images manually.
  if (originalArgs['map']) {
    var map = originalArgs['map'];
    for (var name in map) {
      vars.push(name);
      eeArgs[name] = new ee.Image(map[name]);
    }
  }

  var body = ee.ApiFunction._call('Image.parseExpression',
      originalArgs['expression'], eeArgName, vars);

  // Reinterpret the body call as an ee.Function by hand-generating the
  // signature so the computed function knows its input and output types.
  var func = new ee.Function();
  func.encode = function(encoder) {
    return body.encode(encoder);
  };
  /**
   * @this {ee.Function}
   * @return {ee.Function.Signature}
   */
  func.getSignature = function() {
    return {
      'name': '',
      'args': goog.array.map(vars, function(name) {
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
  return /** @type {!ee.Image} */ (func.apply(eeArgs));
};


/**
 * Clips an image to a Geometry or Feature.
 *
 * The output bands correspond exactly the input bands, except data not
 * covered by the geometry is masked. The output image retains the
 * metadata of the input image.
 *
 * Use clipToCollection to clip an image to a FeatureCollection.
 *
 * @param {ee.Geometry|ee.Feature|Object} geometry
 *     The Geometry or Feature to clip to.
 * @return {ee.Image} The clipped image.
 * @export
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


/**
 * Rename the bands of an image.
 *
 * @param {...string|Object|Array<string>} var_args The new names for the bands.
 *    Must match the number of bands in the Image.
 * @return {ee.Image} The renamed image.
 * @export
 */
ee.Image.prototype.rename = function(var_args) {
  var names;
  if (arguments.length == 1 && !ee.Types.isString(arguments[0])) {
    // An array.
    names = arguments[0];
  } else {
    // Varargs list of strings.
    names = goog.array.clone(arguments);
  }
  return /** @type {ee.Image} */(
      ee.ApiFunction._call('Image.rename', this, names));
};


/** @override */
ee.Image.prototype.name = function() {
  return 'Image';
};
