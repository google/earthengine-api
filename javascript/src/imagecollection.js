/**
 * @fileoverview Javascript representation for an Earth Engine ImageCollection.
 */

goog.provide('ee.ImageCollection');

goog.require('ee.ApiFunction');
goog.require('ee.Collection');
goog.require('ee.ComputedObject');
goog.require('ee.Image');
goog.require('ee.List');
goog.require('ee.Types');
goog.require('ee.arguments');
goog.require('ee.data');
goog.require('ee.data.images');
goog.require('goog.array');
goog.require('goog.string');



/**
 * ImageCollections can be constructed from the following arguments:
 *   - A string: assumed to be the name of a collection,
 *   - A list of images, or anything that can be used to construct an image.
 *   - A single image.
 *   - A computed object - reinterpreted as a collection.
 *
 * @param {string|Array.<*>|ee.Image|ee.ComputedObject} args
 *     The constructor arguments.
 * @constructor
 * @extends {ee.Collection}
 * @export
 */
ee.ImageCollection = function(args) {
  // Constructor safety.
  if (!(this instanceof ee.ImageCollection)) {
    return ee.ComputedObject.construct(ee.ImageCollection, arguments);
  } else if (args instanceof ee.ImageCollection) {
    return args;
  }

  if (arguments.length != 1) {
    throw Error('The ImageCollection constructor takes exactly 1 argument (' +
                arguments.length + ' given)');
  }

  ee.ImageCollection.initialize();

  // Wrap single images in an array.
  if (args instanceof ee.Image) {
    args = [args];
  }

  if (ee.Types.isString(args)) {
    // An ID.
    ee.ImageCollection.base(this, 'constructor', new ee.ApiFunction('ImageCollection.load'), {
      'id': args
    });
  } else if (Array.isArray(args)) {
    // A list of images.
    ee.ImageCollection.base(this, 'constructor', new ee.ApiFunction('ImageCollection.fromImages'), {
      'images': goog.array.map(args, function(elem) {
        return new ee.Image(elem);
      })
    });
  } else if (args instanceof ee.List) {
    // A computed list of image. This can't get the extra ee.Image().
    ee.ImageCollection.base(this, 'constructor', new ee.ApiFunction('ImageCollection.fromImages'), {
      'images': args
    });
  } else if (args instanceof ee.ComputedObject) {
    // A custom object to reinterpret as an ImageCollection.
    ee.ImageCollection.base(this, 'constructor', args.func, args.args, args.varName);
  } else {
    throw Error('Unrecognized argument type to convert to an ' +
                'ImageCollection: ' + args);
  }
};
goog.inherits(ee.ImageCollection, ee.Collection);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.ImageCollection.initialized_ = false;


/**
 * Imports API functions to this class.
 */
ee.ImageCollection.initialize = function() {
  if (!ee.ImageCollection.initialized_) {
    ee.ApiFunction.importApi(
        ee.ImageCollection, 'ImageCollection', 'ImageCollection');
    ee.ApiFunction.importApi(
        ee.ImageCollection, 'reduce', 'ImageCollection');
    ee.ImageCollection.initialized_ = true;
  }
};


/**
 * Removes imported API functions from this class.
 */
ee.ImageCollection.reset = function() {
  ee.ApiFunction.clearApi(ee.ImageCollection);
  ee.ImageCollection.initialized_ = false;
};


/**
 * Get the URL of a tiled thumbnail for this ImageCollection.
 * @param {!Object} params Parameters identical to ee.data.getMapId, plus,
 * optionally:
 *   - dimensions (a number or pair of numbers in format WIDTHxHEIGHT) Maximum
 *         dimensions of each thumbnail frame to render, in pixels. If only one
 *         number is passed, it is used as the maximum, and the other
 *         dimension is computed by proportional scaling.
 *   - region (E,S,W,N or GeoJSON) Geospatial region of the image
 *         to render. By default, the whole image.
 *   - format (string) Encoding format. Only 'png' or 'jpg' are accepted.
 * @param {function(string, string=)=} opt_callback An optional
 *     callback which handles the resulting URL string. If not supplied, the
 *     call is made synchronously.
 * @return {string|undefined} A thumbnail URL, or undefined if a callback
 *     was specified.
 * @export
 */
ee.ImageCollection.prototype.getFilmstripThumbURL = function(params, opt_callback) {
  const args = ee.arguments.extractFromFunction(
      ee.ImageCollection.prototype.getFilmstripThumbURL, arguments);
  return ee.ImageCollection.prototype.getThumbURL_(
      this, args, ['png', 'jpg', 'jpeg'],
      ee.ImageCollection.ThumbTypes.FILMSTRIP, opt_callback);
};


/**
 * Get the URL of an animated thumbnail for this ImageCollection.
 * @param {!Object} params Parameters identical to ee.data.getMapId, plus,
 * optionally:
 *   - dimensions (a number or pair of numbers in format WIDTHxHEIGHT) Maximum
 *         dimensions of the thumbnail to render, in pixels. If only one
 *         number is passed, it is used as the maximum, and the other
 *         dimension is computed by proportional scaling.
 *   - region (E,S,W,N or GeoJSON) Geospatial region of the image
 *         to render. By default, the whole image.
 *   - format (string) Encoding format. Only 'gif' is accepted.
 *   - framesPerSecond (number) Animation speed.
 * @param {function(string, string=)=} opt_callback An optional
 *     callback which handles the resulting URL string. If not supplied, the
 *     call is made synchronously.
 * @return {string|undefined} A thumbnail URL, or undefined if a callback
 *     was specified.
 * @export
 */
ee.ImageCollection.prototype.getVideoThumbURL = function(params, opt_callback) {
  const args = ee.arguments.extractFromFunction(
      ee.ImageCollection.prototype.getVideoThumbURL, arguments);
  return ee.ImageCollection.prototype.getThumbURL_(
      this, args, ['gif'], ee.ImageCollection.ThumbTypes.VIDEO, opt_callback);
};

/**
 * Valid thumbnail types.
 * @enum {string}
 */
ee.ImageCollection.ThumbTypes = {
  FILMSTRIP: 'filmstrip',
  VIDEO: 'video',
  IMAGE: 'image',
};

/**
 * Get a thumbnail URL for this image.
 * @param {!ee.ImageCollection} collection The collection to export.
 * @param {!Object} args Visualization arguments.
 * @param {!Array<string>} validFormats A nonempty list of valid formats.
 * @param {!ee.ImageCollection.ThumbTypes=} opt_thumbType The type of
 *     thumbnail.
 * @param {function(string, string=)=} opt_callback An optional
 *     callback which handles the resulting URL string. If not supplied, the
 *     call is made synchronously.
 * @return {string|undefined} A thumbnail URL, or undefined if a callback
 *     was specified.
 * @private
 */
ee.ImageCollection.prototype.getThumbURL_ = function(
    collection, args, validFormats, opt_thumbType, opt_callback) {
  const extraParams = {};
  const clippedCollection = collection.map(
      (image) => {
        const projected = ee.data.images.applyCrsAndTransform(
            /** @type {!ee.Image} */ (image), args['params']);
        const scaled = ee.data.images.applySelectionAndScale(
            projected, args['params'], extraParams);
        return scaled;
      });

  /** @type {!ee.data.ThumbnailOptions} */
  const request = {};
  const visParams = ee.data.images.extractVisParams(extraParams, request);

  request.imageCollection =
      /** @type {!ee.ImageCollection} */ (clippedCollection.map((image) => {
        visParams.image = /** @type {!ee.Image} */ (image);
        return ee.ApiFunction._apply('Image.visualize', visParams);
      }));
  if (args['params']['dimensions'] != null) {
    request.dimensions = args['params']['dimensions'];
  }
  // Only allow valid formats, using the first of `validFormats` as a default.
  // The server may support other formats.
  // TODO(user): remove this once separate backend endpoints do this check.
  if (request.format) {
    const matchesRequest = (format) => goog.string.caseInsensitiveEquals(
        format, /** @type {string} */ (request.format));
    if (!goog.array.some(validFormats, matchesRequest)) {
      throw Error('Invalid format specified.');
    }
  } else {
    request.format = validFormats[0];
  }

  let getThumbId = ee.data.getThumbId;
  switch (opt_thumbType) {
    case ee.ImageCollection.ThumbTypes.VIDEO:
      getThumbId = ee.data.getVideoThumbId;
      break;
    case ee.ImageCollection.ThumbTypes.FILMSTRIP:
      getThumbId = ee.data.getFilmstripThumbId;
      break;
  }

  if (args['callback']) {
    const callbackWrapper = function(thumbId, opt_error) {
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
    getThumbId(request, callbackWrapper);
  } else {
    return ee.data.makeThumbUrl(
        /** @type {!ee.data.ThumbnailId} */ (getThumbId(request)));
  }
};


/**
 * An imperative function that returns a mapid via a synchronous AJAX call.
 *
 * This mosaics the collection to a single image and return a mapid suitable
 * for building a Google Maps overlay.
 *
 * @param {?Object=} opt_visParams The visualization parameters.
 * @param {function(!Object, string=)=} opt_callback An async callback.
 *     If not supplied, the call is made synchronously.
 * @return {!ee.data.MapId|undefined} Returns a mapid and optional token, which
 *     may be passed to ee.data.getTileUrl or ui.Map.addLayer. Undefined if
 *     a callback was specified.
 * @export
 */
ee.ImageCollection.prototype.getMap = function(opt_visParams, opt_callback) {
  var args = ee.arguments.extractFromFunction(
      ee.ImageCollection.prototype.getMap, arguments);
  var mosaic = /** @type {!ee.Image} */(
      ee.ApiFunction._call('ImageCollection.mosaic', this));
  if (args['callback']) {
    mosaic.getMap(args['visParams'], args['callback']);
  } else {
    return mosaic.getMap(args['visParams']);
  }
};


/**
 * An imperative function that returns all the known information about this
 * collection via an AJAX call.
 *
 * @param {function(!ee.data.ImageCollectionDescription, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 *     If supplied, will be called with the first parameter if successful and
 *     the second if unsuccessful.
 * @return {!ee.data.ImageCollectionDescription} A collection description
 *     whose fields include:
 *     - features: a list containing metadata about the images in the
 *           collection.
 *     - bands: a dictionary describing the bands of the images in this
 *           collection.
 *     - properties: an optional dictionary containing the collection's
 *           metadata properties.
 * @export
 */
ee.ImageCollection.prototype.getInfo = function(opt_callback) {
  return /** @type {!ee.data.ImageCollectionDescription} */(
      ee.ImageCollection.base(this, 'getInfo', opt_callback));
};


/**
 * Select bands from each image in a collection.
 *
 * @param {!Array.<string|number>} selectors A list of names,
 *     regexes or numeric indices specifying the bands to select.
 * @param {!Array.<string>=} opt_names A list of new names for the output bands.
 *     Must match the number of bands selected.
 * @return {!ee.ImageCollection} The image collection with selected bands.
 * @export
 */
ee.ImageCollection.prototype.select = function(selectors, opt_names) {
  var varargs = arguments;
  return /** @type {!ee.ImageCollection} */(this.map(function(obj) {
    var img = /** @type {!ee.Image} */(obj);
    return img.select.apply(img, varargs);
  }));
};

/**
 * Returns the first entry from a given collection.
 *
 * @return {!ee.Image} The collection from which to select the first entry.
 * @export
 */
ee.ImageCollection.prototype.first = function() {
  return new ee.Image(ee.ApiFunction._call('Collection.first', this));
};


/** @override */
ee.ImageCollection.prototype.name = function() {
  return 'ImageCollection';
};


/** @override */
ee.ImageCollection.prototype.elementType = function() {
  return ee.Image;
};
