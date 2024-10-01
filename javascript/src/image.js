/**
 * @fileoverview A representation of an earth engine image.
 * See: https://developers.google.com/earth-engine/apidocs/ee-image for more
 * details.
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
goog.require('ee.rpc_node');
goog.require('goog.array');
goog.require('goog.object');



/**
 * An object to represent an Earth Engine image. This constructor accepts a
 * variety of arguments:
 *   - A string: an EarthEngine asset id,
 *   - A string and a number: an EarthEngine asset id and version,
 *   - A number or ee.Array: creates a constant image,
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

  const argCount = arguments.length;
  if (argCount == 0 || (argCount == 1 && opt_args === undefined)) {
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
    } else if (Array.isArray(opt_args)) {
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
        ee.Image.base(this, 'constructor', opt_args.func, opt_args.args, opt_args.varName, opt_args.unbound);
      }
    } else {
      throw Error('Unrecognized argument type to convert to an Image: ' +
                  opt_args);
    }
  } else if (argCount == 2) {
    // An ID and version.
    const id = arguments[0];
    const version = arguments[1];
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
 * @override
 */
ee.Image.prototype.getInfo = function(opt_callback) {
  return /** @type {ee.data.ImageDescription} */(
      ee.Image.base(this, 'getInfo', opt_callback));
};


/**
 * An imperative function that returns a map ID and optional token, suitable for
 * generating a Map overlay.
 *
 * @param {!ee.data.ImageVisualizationParameters=} opt_visParams
 *     The visualization parameters.
 * @param {function(!ee.data.MapId, string=)=} opt_callback An async callback.
 *     If not supplied, the call is made synchronously.
 * @return {!ee.data.MapId|undefined} An object which may be passed to
 *     ee.data.getTileUrl or ui.Map.addLayer. Undefined if a callback was
 *     specified.
 * @export
 */
ee.Image.prototype.getMapId = function(opt_visParams, opt_callback) {
  const args = ee.arguments.extractFromFunction(
      ee.Image.prototype.getMap, arguments);

  const request = ee.data.images.applyVisualization(this, args['visParams']);

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
    const response =
        /** @type {!ee.data.MapId} */ (ee.data.getMapId(request));
    response.image = this;
    return response;
  }
};

/**
 * An imperative function that returns a map ID and optional token, suitable for
 * generating a Map overlay.
 *
 * @deprecated Use getMapId() instead.
 * @param {!ee.data.ImageVisualizationParameters=} opt_visParams
 *     The visualization parameters.
 * @param {function(!ee.data.MapId, string=)=} opt_callback An async callback.
 *     If not supplied, the call is made synchronously.
 * @return {!ee.data.MapId|undefined} An object which may be passed to
 *     ee.data.getTileUrl or ui.Map.addLayer. Undefined if a callback was
 *     specified.
 * @export
 */
ee.Image.prototype.getMap = ee.Image.prototype.getMapId;


/**
 * Get a download URL for small chunks of image data in GeoTIFF or NumPy
 * format. Maximum request size is 32 MB, maximum grid dimension is
 * 10000.
 *
 * Use getThumbURL for RGB visualization formats PNG and JPG.
 * @param {Object} params An object containing download options with the
 *     following possible values:
 *   <table>
 *     <tr>
 *       <td><code> name: </code> a base name to use when constructing
 *         filenames. Only applicable when format is "ZIPPED_GEO_TIFF" (default)
 *         or filePerBand is true. Defaults to the image id (or "download" for
 *         computed images) when format is "ZIPPED_GEO_TIFF" or filePerBand is
 *         true, otherwise a random character string is generated. Band names
 *         are appended when filePerBand is true.</td>
 *     </tr>
 *     <tr>
 *       <td><code> bands: </code> a description of the bands to download. Must
 *         be an array of band names or an array of dictionaries, each with the
 *         following keys (optional parameters apply only when filePerBand is
 *         true):<ul style="list-style-type:none;">
 *           <li><code> id: </code> the name of the band, a string, required.
 *           <li><code> crs: </code> an optional CRS string defining the
 *             band projection.</li>
 *           <li><code> crs_transform: </code> an optional array of 6 numbers
 *             specifying an affine transform from the specified CRS, in
 *             row-major order: [xScale, xShearing, xTranslation, yShearing,
 *             yScale, yTranslation]</li>
 *           <li><code> dimensions: </code> an optional array of two integers
 *             defining the width and height to which the band is cropped.</li>
 *           <li><code> scale: </code> an optional number, specifying the scale
 *             in meters of the band; ignored if crs and crs_transform are
 *             specified.</li></ul></td>
 *     </tr>
 *     <tr>
 *       <td><code> crs: </code> a default CRS string to use for any bands that
 *         do not explicitly specify one.</td>
 *     </tr>
 *     <tr>
 *       <td><code> crs_transform: </code> a default affine transform to use for
 *         any bands that do not specify one, of the same format as the
 *         <code>crs_transform</code> of bands.</td>
 *     </tr>
 *     <tr>
 *       <td><code> dimensions: </code> default image cropping dimensions to use
 *         for any bands that do not specify them.</td>
 *     </tr>
 *     <tr>
 *       <td><code> scale: </code> a default scale to use for any bands that do
 *         not specify one; ignored if <code>crs</code> and
 *         <code>crs_transform</code> are specified.</td>
 *     </tr>
 *     <tr>
 *       <td><code> region: </code> a polygon specifying a region to download;
 *         ignored if <code>crs</code> and <code>crs_transform</code> is
 *         specified.</td>
 *     </tr>
 *     <tr>
 *       <td><code> filePerBand: </code> whether to produce a separate GeoTIFF
 *         per band (boolean). Defaults to true. If false, a single GeoTIFF is
 *         produced and all band-level transformations will be ignored.</td>
 *     </tr>
 *     <tr>
 *       <td><code> format: </code> the download format. One of:
 *         <ul style="list-style-type:none;">
 *           <li> "ZIPPED_GEO_TIFF" (GeoTIFF file(s) wrapped in a zip file,
 *             default)</li>
 *           <li> "GEO_TIFF" (GeoTIFF file)</li>
 *           <li> "NPY" (NumPy binary format)</li>
 *         </ul>
 *         If "GEO_TIFF" or "NPY", filePerBand and all band-level transformations
 *         will be ignored. Loading a NumPy output results in a structured
 *         array.</td>
 *     </tr>
 *   </table>
 * @param {function(string?, string=)=} opt_callback An optional
 *     callback. If not supplied, the call is made synchronously.
 * @return {string|undefined} Returns a download URL, or undefined if a callback
 *     was specified.
 * @export
 */
ee.Image.prototype.getDownloadURL = function(params, opt_callback) {
  const args = ee.arguments.extractFromFunction(
      ee.Image.prototype.getDownloadURL, arguments);
  const request = args['params'] ? goog.object.clone(args['params']) : {};
  request['image'] = this;
  if (args['callback']) {
    const callback = args['callback'];
    ee.data.getDownloadId(request, (downloadId, error) => {
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
 * Applies transformations and returns the thumbId.
 * @param {!Object} params Parameters identical to ee.data.getMapId, plus,
 * optionally:
 *   <table>
 *     <tr>
 *       <td><code> dimensions </code> (a number or pair of numbers in format
 *         WIDTHxHEIGHT) Maximum dimensions of the thumbnail to render, in
 *         pixels. If only one number is passed, it is used as the maximum,
 *         and the other dimension is computed by proportional scaling.</td>
 *     </tr>
 *     <tr>
 *       <td><code> region </code> Geospatial region of the image to render,
 *         it may be an ee.Geometry, GeoJSON, or an array of lat/lon
 *         points (E,S,W,N). If not set the default is the bounds image.</td>
 *     </tr>
 *   </table>
 * @param {function(?ee.data.ThumbnailId, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 * @return {?ee.data.ThumbnailId} The thumb ID and optional token, or null if a
 *     callback is specified.
 * @export
 */
ee.Image.prototype.getThumbId = function(params, opt_callback) {
  const args = ee.arguments.extractFromFunction(
      ee.Image.prototype.getDownloadURL, arguments);
  let request = args['params'] ? goog.object.clone(args['params']) : {};
  const extra = {};
  let image = ee.data.images.applyCrsAndTransform(this, request);
  image = ee.data.images.applySelectionAndScale(image, request, extra);
  request = ee.data.images.applyVisualization(image, extra);
  if (args['callback']) {
    ee.data.getThumbId(request, args['callback']);
    return null;
  } else {
    return ee.data.getThumbId(request);
  }
};


/**
 * Get a thumbnail URL for this image.
 * @param {!Object} params Parameters identical to ee.data.getMapId, plus,
 * optionally:
 *   <table>
 *     <tr>
 *       <td><code> dimensions </code> (a number or pair of numbers in format
 *         WIDTHxHEIGHT) Maximum dimensions of the thumbnail to render, in
 *         pixels. If only one number is passed, it is used as the maximum,
 *         and the other dimension is computed by proportional scaling.</td>
 *     </tr>
 *     <tr>
 *       <td><code> region </code> Geospatial region of the image to render,
 *         it may be an ee.Geometry, GeoJSON, or an array of lat/lon
 *         points (E,S,W,N). If not set the default is the bounds image.</td>
 *     </tr>
 *     <tr>
 *       <td><code> format </code> (string) Either 'png' or 'jpg'.</td>
 *     </tr>
 *   </table>
 * @param {function(string, string=)=} opt_callback An optional
 *     callback. If not supplied, the call is made synchronously.
 * @return {string|undefined} A thumbnail URL, or undefined if a callback
 *     was specified.
 * @export
 */
ee.Image.prototype.getThumbURL = function(params, opt_callback) {
  const args = ee.arguments.extractFromFunction(
      ee.Image.prototype.getThumbURL, arguments);
  if (args['callback']) {
    const callbackWrapper = (thumbId, opt_error) => {
      let thumbUrl = '';
      if (opt_error === undefined) {
        try {
          thumbUrl = ee.data.makeThumbUrl(thumbId);
        } catch (e) {
          opt_error = String(e.message);
        }
      }
      args['callback'](thumbUrl, opt_error);
    };
    this.getThumbId(args['params'], callbackWrapper);
  } else {
    return ee.data.makeThumbUrl(
        /** @type {!ee.data.ThumbnailId} */ (this.getThumbId(args['params'])));
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
  const args = ee.arguments.extractFromFunction(ee.Image.rgb, arguments);
  return ee.Image.combine_(
      [args['r'], args['g'], args['b']],
      ['vis-red', 'vis-green', 'vis-blue']);
};


/**
 * Combines the given images into a single image which contains all bands from
 * all of the images.
 *
 * If two or more bands share a name, they are suffixed with an incrementing
 * index.
 *
 * The resulting image will have the metadata from the first input image, only.
 *
 * This function will promote constant values into constant images.
 *
 * @param {...ee.Image} var_args The images to be combined.
 * @return {ee.Image} The combined image.
 * @export
 */
ee.Image.cat = function(var_args) {
  const args = Array.prototype.slice.call(arguments);
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
  let result = new ee.Image(images[0]);
  for (let i = 1; i < images.length; i++) {
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
 * <ul>
 *   <li> Any number of non-list arguments. All of these will be interpreted as
 *     band selectors. These can be band names, regexes, or numeric indices.
 *     E.g. selected = image.select('a', 'b', 3, 'd');</li>
 *   <li> Two lists. The first will be used as band selectors and the second
 *     as new names for the selected bands. The number of new names must match
 *     the number of selected bands. E.g.
 *     selected = image.select(['a', 4], ['newA', 'newB']);</li>
 * </ul>
 * @return {!ee.Image} An image with the selected bands.
 * @export
 */
ee.Image.prototype.select = function(var_args) {
  const args = Array.prototype.slice.call(arguments);

  const algorithmArgs = {
    'input': this,
    'bandSelectors': args[0] || []
  };

  // If the user didn't pass an array as the first argument, assume
  // that everything in the arguments array is actually a selector.
  if (args.length > 2 ||
      ee.Types.isString(args[0]) ||
      ee.Types.isNumber(args[0])) {
    // Varargs inputs.
    const selectors = args;
    // Verify we didn't get anything unexpected.
    for (let i = 0; i < selectors.length; i++) {
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
  return /** @type {!ee.Image} */ (
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
 * If the result of an expression is a single band, it can be assigned a name
 * using the '=' operator (e.g.: x = a + b).
 *
 * @param {string} expression The expression to evaluate.
 * @param {Object.<ee.Image>=} opt_map A map of input images available by name.
 * @return {!ee.Image} The image computed by the provided expression.
 * @export
 */
ee.Image.prototype.expression = function(expression, opt_map) {
  const originalArgs = ee.arguments.extractFromFunction(
      ee.Image.prototype.expression, arguments);

  const eeArgName = 'DEFAULT_EXPRESSION_IMAGE';
  const vars = [eeArgName];
  const eeArgs = goog.object.create(eeArgName, this);

  // Add custom arguments, promoting them to Images manually.
  if (originalArgs['map']) {
    const map = originalArgs['map'];
    for (const name in map) {
      vars.push(name);
      eeArgs[name] = new ee.Image(map[name]);
    }
  }

  const body = ee.ApiFunction._call('Image.parseExpression',
      originalArgs['expression'], eeArgName, vars);

  // Reinterpret the body call as an ee.Function by hand-generating the
  // signature so the computed function knows its input and output types.
  const func = new ee.Function();
  func.encode = function(encoder) {
    return body.encode(encoder);
  };

  func.encodeCloudInvocation = function(serializer, args) {
    return ee.rpc_node.functionByReference(
        serializer.makeReference(body), args);
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
 * The output bands correspond exactly to the input bands, except data not
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
  let names;
  if (arguments.length == 1 && !ee.Types.isString(arguments[0])) {
    // An array.
    names = arguments[0];
  } else {
    // Varargs list of strings.
    names = Array.from(arguments);
  }
  return /** @type {ee.Image} */(
      ee.ApiFunction._call('Image.rename', this, names));
};


/** @override */
ee.Image.prototype.name = function() {
  return 'Image';
};
