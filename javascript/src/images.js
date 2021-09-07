/**
 * @fileoverview Functions for manipulating image objects and requests for
 * raster visualization.
 */

goog.provide('ee.data.images');

goog.require('ee.ApiFunction');
goog.require('ee.Geometry');
goog.require('goog.array');
goog.require('goog.object');

goog.requireType('ee.Image');
goog.requireType('ee.data');



/**
 * Encodes region, scale, affine transform, clipping, etc. to the server
 * image task config.
 *
 * @param {!Object} taskConfig Export parameters, some of
 *     which may be baked into the source image.
 * @return {!Object} the taskConfig with clipping/scale params baked into
 *     the image expression and removed from the task config.
 */
ee.data.images.applyTransformsToImage = function(taskConfig) {
  const resultParams = {};
  let image =
      ee.data.images.applyCrsAndTransform(taskConfig['element'], taskConfig);
  image =
      ee.data.images.applySelectionAndScale(image, taskConfig, resultParams);
  resultParams['element'] = image;
  return resultParams;
};

/**
 * Encodes region, scale, affine transform, clipping, etc. to the video
 * server task config.
 *
 * @param {!Object} taskConfig Export parameters, some of
 *     which may be baked into the source image.
 * @return {!Object} the taskConfig with clipping/scale params baked into
 *     the collection expression and removed from the task config.
 */
ee.data.images.applyTransformsToCollection = function(taskConfig) {
  const resultParams = {};
  const collection = taskConfig['element'].map(function(image) {
    const projected = ee.data.images.applyCrsAndTransform(
        /** @type {!ee.Image} */ (image), taskConfig);
    const scaled = ee.data.images.applySelectionAndScale(
        projected, taskConfig, resultParams);
    return scaled;
  });
  resultParams['element'] = collection;
  return resultParams;
};


/**
 * Applies region selection and scaling parameters to an image.
 * Wraps an image in a call to clipToBoundsAndScale() if any recognized
 * parameters were provided.  Returns the (possibly) transformed image and sets
 * outParams to the remaining parameters.
 *
 * @param {!ee.Image} image The image to include in the request.
 * @param {!ee.data.ThumbnailOptions} params The
 *    visualization parameters.
 * @param {!ee.data.ImageVisualizationParameters} outParams Will hold remaining
 *    visualization parameters not processed here.
 * @return {!ee.Image} The original or transformed image.
 */
ee.data.images.applySelectionAndScale = function(image, params, outParams) {
  const clipParams = {};
  let dimensions_consumed = false;
  const SCALING_KEYS = ['maxDimension', 'width', 'height', 'scale'];
  goog.object.forEach(params, (value, key) => {
    if (value == null) {
      return;
    }
    switch (key) {
      case 'dimensions':
        const dims = (typeof value === 'string') ?
            value.split('x').map(Number) :
            Array.isArray(value) ? value :
                                   typeof value === 'number' ? [value] : [];
        if (dims.length === 1) {
          clipParams['maxDimension'] = dims[0];
        } else if (dims.length === 2) {
          clipParams['width'] = dims[0];
          clipParams['height'] = dims[1];
        } else {
          throw new Error('Invalid dimensions ' + value);
        }
        break;
      // parameter that is added from applyCrsAndTransform to indicate
      // that we used the dimensions parameter previously and want to
      // use clipToBoundsAndScale to prevent off-by-one pixel errors as
      // seen in b/169860472 and b/141672871
      case 'dimensions_consumed':
        dimensions_consumed = true;
        break;
      // bbox is a undocumented param but is used sometimes for
      // thumbnail examples...
      case 'bbox':
        if (clipParams['geometry'] != null) {
          console.warn('Multiple request parameters converted to region.');
        }
        clipParams['geometry'] = ee.data.images.bboxToGeometry(value);
        break;
      case 'region':
        if (clipParams['geometry'] != null) {
          console.warn('Multiple request parameters converted to region.');
        }
        // Could be a Geometry, a GeoJSON struct, a GeoJSON string, or a list of
        // coordinates.
        clipParams['geometry'] = ee.data.images.regionToGeometry(value);
        break;
      case 'scale':
        clipParams['scale'] = Number(value);
        break;
      default:
        (/** @type {!Object} */(outParams))[key] = value;
    }
  });

  if (!goog.object.isEmpty(clipParams)) {
    clipParams['input'] = image;
    if (SCALING_KEYS.some(key => key in clipParams) || dimensions_consumed) {
      image = /** @type {!ee.Image} */ (
          ee.ApiFunction._apply('Image.clipToBoundsAndScale', clipParams));
    } else {
      image = /** @type {!ee.Image} */ (
          ee.ApiFunction._apply('Image.clip', clipParams));
    }
  }
  return image;
};

/**
 * Converts a bbox parameter into a planar rectangle.
 *
 * @param {!ee.Geometry.Rectangle|!Array<number>|string|undefined} bbox to
 *     convert.
 * @return {!ee.Geometry.Rectangle} the resulting parsed object.
 */
ee.data.images.bboxToGeometry = function(bbox) {
  // If we have a rectangle, trust the client and use that rectangle.
  if (bbox instanceof ee.Geometry.Rectangle) {
    return bbox;
  }
  /** @type{*} */
  let bboxArray = bbox;
  if (typeof bbox === 'string') {
    try {
      bboxArray = JSON.parse(bbox);
    } catch {
      bboxArray = bbox.split(/\s*,\s*/).map(Number);
    }
  }
  if (Array.isArray(bboxArray)) {
    if (bboxArray.some(isNaN)) {
      throw new Error(
          'Invalid bbox `{bboxArray}`, please specify a list of numbers.');
    }
    return new ee.Geometry.Rectangle(
        bboxArray, /* crs= */ null, /* geodesic= */ false);
  }
  throw new Error(`Invalid bbox "{bbox}" type, must be of type Array<number>`);
};

/**
 * Converts a given region parameter into a Geometry object.
 *
 * @param {!ee.Geometry|!Object|!Array|string|undefined} region to convert.
 * @return {!ee.Geometry} the resulting parsed object.
 */
ee.data.images.regionToGeometry = function(region) {
  // If we have a Geometry object, trust the client and use the region.
  if (region instanceof ee.Geometry) {
    return region;
  }
  /** @type{*} */
  let regionObject = region;
  // If we have a string attempt to parse it to GeoJSON.
  if (typeof region === 'string') {
    try {
      regionObject = JSON.parse(region);
    } catch (e) {
      throw new Error(`Region string "${region}" is not valid GeoJSON.`);
    }
  }
  // At this point we will construct a planar object from the region.
  if (Array.isArray(regionObject)) {
    // Could be an array of points.
    return new ee.Geometry.Polygon(
        regionObject, /* crs= */ null, /* geodesic= */ false);
  } else if (goog.isObject(regionObject)) {
    return new ee.Geometry(
        regionObject, /* crs= */ null, /* geodesic= */ false);
  } else {
    throw new Error(`Region {region} was not convertible to an ee.Geometry.`);
  }
};


/**
 * Applies crs and affine transform parameters to an image.
 * Wraps an image in a call to reproject() if any recognized
 * parameters were provided.
 *
 * @param {!ee.Image} image The image to include in the request.
 * @param {!Object} params Parameters containing the crs, crs affine
 *    and other scale/transform parameters. The parameters may be modified.
 * @return {!ee.Image} The original or transformed image.
 */
ee.data.images.applyCrsAndTransform = function(image, params) {
  const crs = /** @type {string} */ (params['crs'] || '');
  let crsTransform = params['crsTransform'] || params['crs_transform'];
  if (crsTransform != null) {
    crsTransform =
        ee.data.images.maybeConvertCrsTransformToArray_(crsTransform);
  }
  // No-op since no crs or crs_transform are specified.
  if (!crs && !crsTransform) {
    return image;
  }
  if (crsTransform && !crs) {
    throw Error('Must specify "crs" if "crsTransform" is specified.');
  }
  if (crsTransform) {
    const reprojectArgs = {
      'image': image,
      'crs': crs,
      'crsTransform': crsTransform
    };
    image = /** @type {!ee.Image} */ (
        ee.ApiFunction._apply('Image.reproject', reprojectArgs));
    /**
     * Special case here: If they specified "crs", "crs_transform", and a
     * two-element "dimensions", but not a region or other parameters such
     * as "scale", then the desired operation is to extract an exact
     * rectangle in that exact projection, not what we'd otherwise
     * interpret this as ("reproject to that projection, then resize to
     * those dimensions"). Detect this and convert the dimensions to a
     * Geometry: a Rectangle in that Projection.
     **/
    if (params['dimensions'] != null && params['scale'] == null &&
        params['region'] == null) {
      let dimensions = params['dimensions'];

      if (typeof dimensions === 'string') {
        dimensions = dimensions.split('x').map(Number);
      }
      if (dimensions.length === 2) {
        delete params['dimensions'];
        // Parameter to be consumed by "applySelectionAndScale"
        params['dimensions_consumed'] = true;
        /** @type {!ee.Projection} */
        const projection =
            new ee.ApiFunction('Projection').call(crs, crsTransform);
        params['region'] = new ee.Geometry.Rectangle(
            [0, 0, dimensions[0], dimensions[1]], projection,
            /* geodesic= */ false);
      }
    }
  } else {
    /*
     * CRS but no CRS transform means that we reproject to that CRS using a
     * default transform (with the Y coordinate flipped as we usually do) but
     * don't resample after the reprojection, so that later operations can
     * alter the image scale.
     **/
    image = /** @type {!ee.Image} */ (ee.ApiFunction._apply(
        'Image.setDefaultProjection',
        // Quotes are necessary to avoid minification.
        {'image': image, 'crs': crs, 'crsTransform': [1, 0, 0, 0, -1, 0]}));
  }
  return image;
};


/**
 * Converts a crs transform to an array of numbers if crs transform is a string.
 *
 * @param {!Array<number>|string} crsTransform
 * @return {!Array<number>}
 * @private
 */
ee.data.images.maybeConvertCrsTransformToArray_ = function(crsTransform) {
  let transformArray = crsTransform;
  if (typeof transformArray === 'string') {
    try {
      transformArray = JSON.parse(transformArray);
    } catch (e) {
      // Do nothing since it means that the given crs transform wasn't parsable.
    }
  }
  if (Array.isArray(transformArray)) {
    if (transformArray.length === 6 &&
        goog.array.every(transformArray, x => typeof x === 'number')) {
      return transformArray;
    } else {
      throw new Error(
          'Invalid argument, crs transform must be a list of 6 numbers.');
    }
  }
  throw new Error('Invalid argument, crs transform was not a string or array.');
};


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
  const request = {};
  const visParams = ee.data.images.extractVisParams(params, request);
  const shouldApplyVizParams = !goog.object.isEmpty(visParams);
  if (shouldApplyVizParams) {
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

/**
 * Processes the ee.data.getDownloadId parameters and returns the built image
 * based on the given transformation parameters (crs, crs_transform, dimensions,
 * scale, and region). Band level parameters override the parameters
 * specified in the top level. If both dimensions and scale parameters are
 * present, the scale parameter is always ignored.
 *
 * Image transformations will be applied on a per band basis if the
 * format parameter is ZIPPED_GEO_TIFF_PER_BAND and there are bands in the bands
 * list. Otherwise, the transformations will be applied on the entire image and
 * the band transformation parameters will be ignored.
 *
 * @param {!ee.Image} image The image to include in the request.
 * @param {!Object} params The getDownloadId parameters.
 * @return {!ee.Image} The image filtered to the given bands and the associated
 *     transformations applied.
 */
ee.data.images.buildDownloadIdImage = function(image, params) {
  params = Object.assign({}, params);
  const extractAndValidateTransforms = (obj) => {
    const extracted = {};
    ['crs', 'crs_transform', 'dimensions', 'region'].forEach((key) => {
      if (key in obj) {
        extracted[key] = obj[key];
      }
    });
    // Since dimensions and scale are mutually exclusive, we ignore scale
    // if dimensions are specified.
    if (obj['scale'] != null && obj['dimensions'] == null) {
      extracted['scale'] = obj['scale'];
    }
    return extracted;
  };
  const buildImagePerBand = (band) => {
    const bandId = band.id;
    if (bandId === undefined) {
      throw new Error('Each band dictionary must have an id.');
    }
    let bandImage = image.select(bandId);
    // Override the existing top level params with the band level params.
    let copyParams = extractAndValidateTransforms(params);
    let bandParams = extractAndValidateTransforms(band);
    bandParams =
        extractAndValidateTransforms(Object.assign(copyParams, bandParams));
    bandImage = ee.data.images.applyCrsAndTransform(bandImage, bandParams);
    bandImage =
        ee.data.images.applySelectionAndScale(bandImage, bandParams, {});
    return bandImage;
  };
  if (params['format'] === 'ZIPPED_GEO_TIFF_PER_BAND' && params['bands'] &&
      params['bands'].length) {
    // Build a new image based on the constituent band images.
    const images = params['bands'].map(buildImagePerBand);
    image = images.reduce(
        (result, bandImage) => /** @type {!ee.Image} */ (ee.ApiFunction._call(
            'Image.addBands', result, bandImage, null, true)),
        images.shift());
  } else {
    // Apply transformations directly onto the image, ignoring any band params.
    const copyParams = extractAndValidateTransforms(params);
    image = ee.data.images.applyCrsAndTransform(image, copyParams);
    image = ee.data.images.applySelectionAndScale(image, copyParams, {});
  }
  return image;
};
