/** @fileoverview An interface to the Earth Engine batch processing system. */

goog.provide('ee.batch');
goog.provide('ee.batch.Export');
goog.provide('ee.batch.ExportTask');

goog.require('ee.ComputedObject');
goog.require('ee.Element');
goog.require('ee.FeatureCollection');
goog.require('ee.Geometry');
goog.require('ee.Image');
goog.require('ee.ImageCollection');
goog.require('ee.arguments');
goog.require('ee.data');
goog.require('ee.data.ExportDestination');
goog.require('ee.data.ExportType');
goog.require('goog.Promise');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.json');
goog.require('goog.object');

const ComputedObject = ee.ComputedObject;
const ExportDestination = ee.data.ExportDestination;
const ExportType = ee.data.ExportType;
const GoogPromise = goog.Promise;
const googArray = goog.array;
const googObject = goog.object;
const json = goog.json;


ee.batch.Export = {
  image: {},
  map: {},
  table: {},
  video: {},
};



/**
 * ExportTask
 */
ee.batch.ExportTask = class {
  /** @param {!ee.data.AbstractTaskConfig} config */
  constructor(config) {
    /** @const @private {!ee.data.AbstractTaskConfig} */
    this.config_ = config;
    /** @export {?string} Task ID, initialized after task starts. */
    this.id = null;
  }

  /**
   * Creates a task.
   *
   * @param {!Object} exportArgs The export task arguments.
   * @return {!ee.batch.ExportTask}
   * @package
   */
  static create(exportArgs) {
    // Extract the EE element from the exportArgs.

    const eeElement = ee.batch.Export.extractElement(exportArgs);
    // Construct a configuration object for the server.
    let config = {'element': eeElement};
    Object.assign(config, exportArgs);
    // The config is some kind of task configuration.
    config = /** @type {!ee.data.AbstractTaskConfig} */ (
        googObject.filter(config, goog.isDefAndNotNull));

    return new ee.batch.ExportTask(config);
  }

  /**
   * Starts processing of the task.
   *
   * @param {function()=} opt_success An optional success callback, to be
   *     invoked after processing begins. If no success callback is supplied,
   *     the call is made synchronously and will throw in case of an error.
   * @param {function(string=)=} opt_error An optional error callback, invoked
   *     with an error message if the task fails to start. If no success
   *     callback is provided, the error callback is ignored.
   * @export
   */
  start(opt_success, opt_error) {
    goog.asserts.assert(
        this.config_, 'Task config must be specified for tasks to be started.');

    // Synchronous task start.
    if (!opt_success) {
      this.id = this.id || ee.data.newTaskId(1)[0];
      goog.asserts.assertString(this.id, 'Failed to obtain task ID.');
      ee.data.startProcessing(this.id, this.config_);
      return;
    }

    // Asynchronous task start.
    const startProcessing = () => {
      goog.asserts.assertString(this.id);
      ee.data.startProcessing(this.id, this.config_, (_, error) => {
        if (error) {
          opt_error(error);
        } else {
          opt_success();
        }
      });
    };

    if (this.id) {
      startProcessing();
      return;
    }

    ee.data.newTaskId(1, (ids) => {
      const id = ids && ids[0];
      if (id) {
        this.id = id;
        startProcessing();
      } else {
        opt_error('Failed to obtain task ID.');
      }
    });
  }
};


////////////////////////////////////////////////////////////////////////////////
//                               Public API.                                  //
////////////////////////////////////////////////////////////////////////////////

// Public API for exports in the JS client library.
//


/**
 * @param {!ee.Image} image
 * @param {string=} opt_description
 * @param {string=} opt_assetId
 * @param {?Object=} opt_pyramidingPolicy
 * @param {number|string=} opt_dimensions
 * @param {?ee.Geometry.LinearRing|?ee.Geometry.Polygon|string=} opt_region
 * @param {number=} opt_scale
 * @param {string=} opt_crs
 * @param {string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @return {!ee.batch.ExportTask}
 * @export
 */
ee.batch.Export.image.toAsset = function(
    image, opt_description, opt_assetId, opt_pyramidingPolicy, opt_dimensions,
    opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels) {
  const clientConfig = ee.arguments.extractFromFunction(
      ee.batch.Export.image.toAsset, arguments);
  const serverConfig = ee.batch.Export.convertToServerParams(
      clientConfig, ExportDestination.ASSET, ExportType.IMAGE);
  return ee.batch.ExportTask.create(serverConfig);
};


/**
 * @param {!ee.Image} image
 * @param {string=} opt_description
 * @param {string=} opt_bucket
 * @param {string=} opt_fileNamePrefix
 * @param {number|string=} opt_dimensions
 * @param {?ee.Geometry.LinearRing|?ee.Geometry.Polygon|string=} opt_region
 * @param {number=} opt_scale
 * @param {string=} opt_crs
 * @param {string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @param {number=} opt_shardSize
 * @param {number|?Array<number>=} opt_fileDimensions
 * @param {boolean=} opt_skipEmptyTiles
 * @param {string=} opt_fileFormat
 * @param {?ee.data.ImageExportFormatConfig=} opt_formatOptions
 * @return {!ee.batch.ExportTask}
 * @export
 */
ee.batch.Export.image.toCloudStorage = function(
    image, opt_description, opt_bucket, opt_fileNamePrefix, opt_dimensions,
    opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels,
    opt_shardSize, opt_fileDimensions, opt_skipEmptyTiles, opt_fileFormat,
    opt_formatOptions) {
  const clientConfig = ee.arguments.extractFromFunction(
      ee.batch.Export.image.toCloudStorage, arguments);
  const serverConfig = ee.batch.Export.convertToServerParams(
      clientConfig, ExportDestination.GCS, ExportType.IMAGE);
  return ee.batch.ExportTask.create(serverConfig);
};


/**
 * @param {!ee.Image} image
 * @param {string=} opt_description
 * @param {string=} opt_folder
 * @param {string=} opt_fileNamePrefix
 * @param {number|string=} opt_dimensions
 * @param {?ee.Geometry.LinearRing|?ee.Geometry.Polygon|string=} opt_region
 * @param {number=} opt_scale
 * @param {string=} opt_crs
 * @param {string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @param {number=} opt_shardSize
 * @param {number|?Array<number>=} opt_fileDimensions
 * @param {boolean=} opt_skipEmptyTiles
 * @param {string=} opt_fileFormat
 * @param {?ee.data.ImageExportFormatConfig=} opt_formatOptions
 * @return {!ee.batch.ExportTask}
 * @export
 */
ee.batch.Export.image.toDrive = function(
    image, opt_description, opt_folder, opt_fileNamePrefix, opt_dimensions,
    opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels,
    opt_shardSize, opt_fileDimensions, opt_skipEmptyTiles, opt_fileFormat,
    opt_formatOptions) {
  const clientConfig = ee.arguments.extractFromFunction(
      ee.batch.Export.image.toDrive, arguments);
  const serverConfig = ee.batch.Export.convertToServerParams(
      clientConfig, ExportDestination.DRIVE, ExportType.IMAGE);
  return ee.batch.ExportTask.create(serverConfig);
};


/**
 * @param {!ee.Image} image
 * @param {string=} opt_description
 * @param {string=} opt_bucket
 * @param {string=} opt_fileFormat
 * @param {string=} opt_path
 * @param {boolean=} opt_writePublicTiles
 * @param {number=} opt_scale
 * @param {number=} opt_maxZoom
 * @param {number=} opt_minZoom
 * @param {?ee.Geometry.LinearRing|?ee.Geometry.Polygon|string=} opt_region
 * @param {boolean=} opt_skipEmptyTiles
 * @param {string=} opt_mapsApiKey
 * @return {!ee.batch.ExportTask}
 * @export
 */
ee.batch.Export.map.toCloudStorage = function(
    image, opt_description, opt_bucket, opt_fileFormat, opt_path,
    opt_writePublicTiles, opt_scale, opt_maxZoom, opt_minZoom, opt_region,
    opt_skipEmptyTiles, opt_mapsApiKey) {
  const clientConfig = ee.arguments.extractFromFunction(
      ee.batch.Export.map.toCloudStorage, arguments);
  const serverConfig = ee.batch.Export.convertToServerParams(
      clientConfig, ExportDestination.GCS, ExportType.MAP);
  return ee.batch.ExportTask.create(serverConfig);
};


/**
 * @param {!ee.FeatureCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_bucket
 * @param {string=} opt_fileNamePrefix
 * @param {string=} opt_fileFormat
 * @param {string|!Array<string>=} opt_selectors
 * @return {!ee.batch.ExportTask}
 * @export
 */
ee.batch.Export.table.toCloudStorage = function(
    collection, opt_description, opt_bucket, opt_fileNamePrefix, opt_fileFormat,
    opt_selectors) {
  const clientConfig = ee.arguments.extractFromFunction(
      ee.batch.Export.table.toCloudStorage, arguments);
  const serverConfig = ee.batch.Export.convertToServerParams(
      clientConfig, ExportDestination.GCS, ExportType.TABLE);
  return ee.batch.ExportTask.create(serverConfig);
};


/**
 * @param {!ee.FeatureCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_folder
 * @param {string=} opt_fileNamePrefix
 * @param {string=} opt_fileFormat
 * @param {string|!Array<string>=} opt_selectors
 * @return {!ee.batch.ExportTask}
 * @export
 */
ee.batch.Export.table.toDrive = function(
    collection, opt_description, opt_folder, opt_fileNamePrefix, opt_fileFormat,
    opt_selectors) {
  const clientConfig = ee.arguments.extractFromFunction(
      ee.batch.Export.table.toDrive, arguments);
  clientConfig['type'] = ExportType.TABLE;
  const serverConfig = ee.batch.Export.convertToServerParams(
      clientConfig, ExportDestination.DRIVE, ExportType.TABLE);
  return ee.batch.ExportTask.create(serverConfig);
};


/**
 * @param {!ee.FeatureCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_assetId
 * @return {!ee.batch.ExportTask}
 * @export
 */
ee.batch.Export.table.toAsset = function(
    collection, opt_description, opt_assetId) {
  const clientConfig = ee.arguments.extractFromFunction(
      ee.batch.Export.table.toAsset, arguments);
  const serverConfig = ee.batch.Export.convertToServerParams(
      clientConfig, ExportDestination.ASSET, ExportType.TABLE);
  return ee.batch.ExportTask.create(serverConfig);
};


/**
 * @param {!ee.ImageCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_bucket
 * @param {string=} opt_fileNamePrefix
 * @param {number=} opt_framesPerSecond
 * @param {number|string=} opt_dimensions
 * @param {?ee.Geometry.LinearRing|?ee.Geometry.Polygon|string=} opt_region
 * @param {number=} opt_scale Resolution
 * @param {string=} opt_crs
 * @param {string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @param {number=} opt_maxFrames
 * @return {!ee.batch.ExportTask}
 * @export
 */
ee.batch.Export.video.toCloudStorage = function(
    collection, opt_description, opt_bucket, opt_fileNamePrefix,
    opt_framesPerSecond, opt_dimensions, opt_region, opt_scale, opt_crs,
    opt_crsTransform, opt_maxPixels, opt_maxFrames) {
  const clientConfig = ee.arguments.extractFromFunction(
      ee.batch.Export.video.toCloudStorage, arguments);
  const serverConfig = ee.batch.Export.convertToServerParams(
      clientConfig, ExportDestination.GCS, ExportType.VIDEO);
  return ee.batch.ExportTask.create(serverConfig);
};


/**
 * @param {!ee.ImageCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_folder
 * @param {string=} opt_fileNamePrefix
 * @param {number=} opt_framesPerSecond
 * @param {number|string=} opt_dimensions
 * @param {?ee.Geometry.LinearRing|?ee.Geometry.Polygon|string=} opt_region
 * @param {number=} opt_scale
 * @param {string=} opt_crs
 * @param {string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @param {number=} opt_maxFrames
 * @return {!ee.batch.ExportTask}
 * @export
 */
ee.batch.Export.video.toDrive = function(
    collection, opt_description, opt_folder, opt_fileNamePrefix,
    opt_framesPerSecond, opt_dimensions, opt_region, opt_scale, opt_crs,
    opt_crsTransform, opt_maxPixels, opt_maxFrames) {
  const clientConfig = ee.arguments.extractFromFunction(
      ee.batch.Export.video.toDrive, arguments);
  const serverConfig = ee.batch.Export.convertToServerParams(
      clientConfig, ExportDestination.DRIVE, ExportType.VIDEO);
  return ee.batch.ExportTask.create(serverConfig);
};




////////////////////////////////////////////////////////////////////////////////
//                          Internal validation.                              //
////////////////////////////////////////////////////////////////////////////////


/**
 * A task descriptor whose parameters have been converted from the user-facing
 * syntax to a server-compatible representation. For the user-facing
 * equivalent parameters, see the Public API section above.
 *
 * @typedef {!ee.data.ImageTaskConfig|!ee.data.MapTaskConfig|
 *     !ee.data.TableTaskConfig|!ee.data.VideoTaskConfig}
 */
ee.batch.ServerTaskConfig = {};

const REGION_ERROR = 'Invalid format for region property. Region must be ' +
    'GeoJSON LinearRing or Polygon specified as actual coordinates or ' +
    'serialized as a string. See Export documentation.';

/**
 * Serializes a 'region' value. Region may be a Geometry, a GeoJSON string, or a
 * GeoJSON object. Only client-side validation is applied; this method does not
 * support computed objects.
 *
 * @param {!ee.Geometry|!Object|string} region
 * @return {string}
 * #visibleForTesting
 */
ee.batch.Export.serializeRegion = function(region) {
  // Convert region to a GeoJSON object.
  if (region instanceof ee.Geometry) {
    region = region.toGeoJSON();
  } else if (goog.isString(region)) {
    try {
      region = goog.asserts.assertObject(JSON.parse(region));
    } catch (x) {
      throw Error(REGION_ERROR);
    }
  }

  // Ensure locally that the region is a valid LineString or Polygon geometry.
  if (!goog.isObject(region) || !('type' in region)) {
    try {
      new ee.Geometry.LineString(/** @type {?} */ (region));
    } catch (e) {
      try {
        new ee.Geometry.Polygon(/** @type {?} */ (region));
      } catch (e2) {
        throw Error(REGION_ERROR);
      }
    }
  }

  return json.serialize(region);
};

/**
 * Replaces the 'region' value, if any, with a valid region string. The backend
 * verifies the region, but this tries to catch errors early on. Throws errors
 * if the region is not valid GeoJSON.
 *
 * @param {!Object} params The parameters with the region to validate.
 * @return {!GoogPromise<!Object>} A promise that resolves to a copy of the
 *     parameters with a known-to-be valid region.
 */
ee.batch.Export.resolveRegionParam = function(params) {
  params = googObject.clone(params);

  if (!params['region']) return GoogPromise.resolve(params);

  let region = params['region'];

  if (region instanceof ComputedObject) {
    if (region instanceof ee.Element) {
      region = region['geometry']();
    }
    return new GoogPromise(function(resolve, reject) {
      region.getInfo(function(regionInfo, error) {
        if (error) {
          reject(error);
        } else {
          params['region'] = ee.batch.Export.serializeRegion(regionInfo);
          resolve(params);
        }
      });
    });
  }

  params['region'] = ee.batch.Export.serializeRegion(region);
  return GoogPromise.resolve(params);
};


/**
 * Encodes region, scale, affine transform, clipping, etc. to the server task
 * config.
 *
 * @param {!ee.batch.ServerTaskConfig} taskConfig Export parameters, some of
 *     which may be baked into the source image.
 * @return {!ee.batch.ServerTaskConfig}
 */
ee.batch.Export.applyTransformsToImage = function(taskConfig) {
  const resultParams = {};
  let image =
      ee.data.images.applyCrsAndTransform(taskConfig['image'], taskConfig);
  image =
      ee.data.images.applySelectionAndScale(image, taskConfig, resultParams);
  resultParams['image'] = image;
  return /** @type {!ee.batch.ServerTaskConfig} */ (resultParams);
};


/**
 * Extracts the EE element from a given task config.
 * @param {!Object} exportArgs
 * @return {!ee.Image|!ee.FeatureCollection|!ee.ImageCollection|!ee.Element}
 */
ee.batch.Export.extractElement = function(exportArgs) {
  // Extract the EE element from the exportArgs.
  const isInArgs = (key) => key in exportArgs;
  const eeElementKey = ee.batch.Export.EE_ELEMENT_KEYS.find(isInArgs);
  // Sanity check that the Image/Collection/Table was provided.
  goog.asserts.assert(
      googArray.count(ee.batch.Export.EE_ELEMENT_KEYS, isInArgs) === 1,
      'Expected a single "image" or "collection" key.');
  const element = exportArgs[eeElementKey];
  let result;
  if (element instanceof ee.Image) {
    result = /** @type {!ee.Image} */ (element);
  } else if (element instanceof ee.FeatureCollection) {
    result = /** @type {!ee.FeatureCollection} */ (element);
  } else if (element instanceof ee.ImageCollection) {
    result = /** @type {!ee.ImageCollection} */ (element);
  } else if (element instanceof ee.Element) {
    result = /** @type {!ee.Element} */ (element);
  } else {
    throw new Error(
        'Unknown element type provided: ' + typeof (element) + '. Expected: ' +
        ' ee.Image, ee.ImageCollection, ee.FeatureCollection or ee.Element.');
  }
  delete exportArgs[eeElementKey];
  return result;
};


/**
 * Extracts task arguments into a backend friendly format.
 * Sets corresponding destination configuration values to empty strings.
 *
 * @param {!Object} originalArgs The original arguments to the function.
 * @param {!ee.data.ExportDestination} destination Destination of the export.
 * @param {!ee.data.ExportType} exportType The type of the export.
 * @param {boolean=} serializeRegion enables serializing the region param.
 * @return {!ee.batch.ServerTaskConfig} A server-friendly task configuration.
 */
ee.batch.Export.convertToServerParams = function(
    originalArgs, destination, exportType, serializeRegion = true) {
  let taskConfig =
      /** @type {!ee.batch.ServerTaskConfig} */ ({type: exportType});
  Object.assign(taskConfig, originalArgs);

  switch (exportType) {
    case ExportType.IMAGE:
      taskConfig =
          ee.batch.Export.image.prepareTaskConfig_(taskConfig, destination);
      break;
    case ExportType.MAP:
      taskConfig =
          ee.batch.Export.map.prepareTaskConfig_(taskConfig, destination);
      break;
    case ExportType.TABLE:
      taskConfig =
          ee.batch.Export.table.prepareTaskConfig_(taskConfig, destination);
      break;
    case ExportType.VIDEO:
      taskConfig =
          ee.batch.Export.video.prepareTaskConfig_(taskConfig, destination);
      break;
    case ExportType.VIDEO_MAP:
      taskConfig =
          ee.batch.Export.videoMap.prepareTaskConfig_(taskConfig, destination);
      break;
    default:
      throw Error('Unknown export type: ' + taskConfig['type']);
  }
  if (serializeRegion && goog.isDefAndNotNull(taskConfig['region'])) {
    taskConfig['region'] =
        ee.batch.Export.serializeRegion(taskConfig['region']);
  }
  return /** {!ee.batch.ServerTaskConfig} */ (taskConfig);
};

/**
 * Consolidates various options into a standard representation for the
 * top-level ServerTaskConfig.
 *
 * @param {!ee.batch.ServerTaskConfig} taskConfig Task config to prepare.
 * @param {!ee.data.ExportDestination} destination Export destination.
 * @return {!ee.batch.ServerTaskConfig}
 * @private
 */
ee.batch.Export.prepareDestination_ = function(taskConfig, destination) {
  // Convert to deprecated backend keys or fill with empty strings.
  switch (destination) {
    case ExportDestination.GCS:
      taskConfig['outputBucket'] = taskConfig['bucket'] || '';
      taskConfig['outputPrefix'] =
          (taskConfig['fileNamePrefix'] || taskConfig['path'] || '');
      delete taskConfig['fileNamePrefix'];
      delete taskConfig['path'];
      delete taskConfig['bucket'];
      break;
    case ExportDestination.ASSET:
      taskConfig['assetId'] = taskConfig['assetId'] || '';
      break;
    // The default is to drive.
    case ExportDestination.DRIVE:
    default:
      // Catch legacy function signature for toDrive calls.
      const allowedFolderType = ['string', 'undefined'];
      const folderType = goog.typeOf(taskConfig['folder']);
      if (!googArray.contains(allowedFolderType, folderType)) {
        throw Error(
            'Error: toDrive "folder" parameter must be a string, but is ' +
            'of type ' + folderType + '.');
      }
      taskConfig['driveFolder'] = taskConfig['folder'] || '';
      taskConfig['driveFileNamePrefix'] = taskConfig['fileNamePrefix'] || '';
      delete taskConfig['folder'];
      delete taskConfig['fileNamePrefix'];
      break;
  }
  return taskConfig;
};

/**
 * Adapts a ServerTaskConfig into a ImageTaskConfig normalizing any parameters.
 *
 * @param {!ee.batch.ServerTaskConfig} taskConfig Image export config to
 *     prepare.
 * @param {!ee.data.ExportDestination} destination Export destination.
 * @return {!ee.data.ImageTaskConfig}
 * @private
 */
ee.batch.Export.image.prepareTaskConfig_ = function(taskConfig, destination) {
  // Set the file format to GeoTiff if not set.
  if (!goog.isDefAndNotNull(taskConfig['fileFormat'])) {
    taskConfig['fileFormat'] = 'GeoTIFF';
  }
  // Handle format-specific options.
  taskConfig = ee.batch.Export.reconcileImageFormat(taskConfig);
  // Add top-level destination fields.
  taskConfig = ee.batch.Export.prepareDestination_(taskConfig, destination);
  // Fix the CRS transform key.
  if (goog.isDefAndNotNull(taskConfig['crsTransform'])) {
    taskConfig[ee.batch.Export.CRS_TRANSFORM_KEY] = taskConfig['crsTransform'];
    delete taskConfig['crsTransform'];
  }
  return /** @type {!ee.data.ImageTaskConfig} */ (taskConfig);
};


/**
 * Adapts a ServerTaskConfig into a TableTaskConfig normalizing any parameters.
 *
 * @param {!ee.batch.ServerTaskConfig} taskConfig Table export config to
 *     prepare.
 * @param {!ee.data.ExportDestination} destination Export destination.
 * @return {!ee.data.TableTaskConfig}
 * @private
 */
ee.batch.Export.table.prepareTaskConfig_ = function(taskConfig, destination) {
  // Convert array-valued selectors to a comma-separated string.
  if (goog.isArray(taskConfig['selectors'])) {
    taskConfig['selectors'] = taskConfig['selectors'].join();
  }
  taskConfig = ee.batch.Export.prepareDestination_(taskConfig, destination);
  return /** @type {!ee.data.TableTaskConfig} */ (taskConfig);
};


/**
 * Adapts a ServerTaskConfig into a MapTaskConfig normalizing any parameters.
 *
 * @param {!ee.batch.ServerTaskConfig} taskConfig Map export config to
 *     prepare.
 * @param {!ee.data.ExportDestination} destination Export destination.
 * @return {!ee.data.MapTaskConfig}
 * @private
 */
ee.batch.Export.map.prepareTaskConfig_ = function(taskConfig, destination) {
  taskConfig = ee.batch.Export.prepareDestination_(taskConfig, destination);
  return /** @type {!ee.data.MapTaskConfig} */ (taskConfig);
};


/**
 * Adapts a ServerTaskConfig into a VideoTaskConfig normalizing any params.
 *
 * @param {!ee.batch.ServerTaskConfig} taskConfig Video export config to
 *     prepare.
 * @param {!ee.data.ExportDestination} destination Export destination.
 * @return {!ee.data.VideoTaskConfig}
 * @private
 */
ee.batch.Export.video.prepareTaskConfig_ = function(taskConfig, destination) {
  taskConfig = ee.batch.Export.reconcileVideoFormat_(taskConfig);
  taskConfig = ee.batch.Export.prepareDestination_(taskConfig, destination);
  if (goog.isDefAndNotNull(taskConfig['crsTransform'])) {
    taskConfig[ee.batch.Export.CRS_TRANSFORM_KEY] = taskConfig['crsTransform'];
    delete taskConfig['crsTransform'];
  }
  return /** @type {!ee.data.VideoTaskConfig} */ (taskConfig);
};

/**
 * Adapts a ServerTaskConfig into a MapTaskConfig normalizing any params
 * for a video map task.
 *
 * @param {!ee.batch.ServerTaskConfig} taskConfig VideoMap export config to
 *     prepare.
 * @param {!ee.data.ExportDestination} destination Export destination.
 * @return {!ee.data.MapTaskConfig}
 * @private
 */
ee.batch.Export.videoMap.prepareTaskConfig_ = function(
    taskConfig, destination) {
  taskConfig = ee.batch.Export.reconcileVideoFormat_(taskConfig);
  taskConfig = ee.batch.Export.prepareDestination_(taskConfig, destination);
  return /** @type {!ee.data.MapTaskConfig} */ (taskConfig);
};


/**
 * @enum {string} The valid image formats supported by export.
 */
ee.batch.VideoFormat = {
  MP4: 'MP4',
};

/**
 * @enum {string} The valid image formats supported by export.
 */
ee.batch.ImageFormat = {
  JPEG: 'JPEG',
  PNG: 'PNG',
  AUTO_PNG_JPEG: 'AUTO_PNG_JPEG',
  NPY: 'NPY',
  GEO_TIFF: 'GEO_TIFF',
  TF_RECORD_IMAGE: 'TF_RECORD_IMAGE',
};

/** @type {!Object<string, !Array<string>>} */
const FORMAT_OPTIONS_MAP = {
  'GEO_TIFF': [
    'cloudOptimized',
    'fileDimensions',
  ],
  'TF_RECORD_IMAGE': [
    'patchDimensions',
    'kernelSize',
    'compressed',
    'maxFileSize',
    'defaultValue',
    'tensorDepths',
    'sequenceData',
    'collapseBands',
    'maskedThreshold',
  ]
};


/** @type {!Object<string, string>} */
const FORMAT_PREFIX_MAP = {
  'GEO_TIFF': 'tiff',
  'TF_RECORD_IMAGE': 'tfrecord'
};

/**
 * Parses video specific config options.
 *
 * @param {!ee.batch.ServerTaskConfig} taskConfig
 * @return {!ee.batch.ServerTaskConfig} parsedConfig with video options set.
 * @private
 **/
ee.batch.Export.reconcileVideoFormat_ = function(taskConfig) {
  taskConfig['videoOptions'] = taskConfig['framesPerSecond'] || 5.0;
  taskConfig['maxFrames'] = taskConfig['maxFrames'] || 1000;
  taskConfig['maxPixels'] = taskConfig['maxPixels'] || 1e8;
  // Only one file format currently supported.
  taskConfig['fileFormat'] = ee.batch.VideoFormat.MP4;
  return taskConfig;
};

/**
 * Validates any format specific options, and converts said options to a
 * backend friendly format.
 * @param {!ee.batch.ServerTaskConfig} taskConfig Arguments
 *     passed to an image export to drive or cloud storage
 * @return {!ee.batch.ServerTaskConfig}
 */
ee.batch.Export.reconcileImageFormat = function(taskConfig) {
  // Parse the image format key from the given fileFormat.
  let formatString = taskConfig['fileFormat'];
  // If not specified assume the format is geotiff.
  if (!goog.isDefAndNotNull(formatString)) {
    formatString = 'GEO_TIFF';
  }
  formatString = formatString.toUpperCase();
  switch (formatString) {
    case 'TIFF':
    case 'TIF':
    case 'GEO_TIFF':
    case 'GEOTIFF':
      formatString = ee.batch.ImageFormat.GEO_TIFF;
      break;
    case 'TF_RECORD':
    case 'TF_RECORD_IMAGE':
    case 'TFRECORD':
      formatString = ee.batch.ImageFormat.TF_RECORD_IMAGE;
      break;
    default:
      throw new Error(
          `Invalid file format ${formatString}. ` +
          `Supported formats are: 'GEOTIFF', 'TFRECORD'.`);
  }

  if (goog.isDefAndNotNull(taskConfig['formatOptions'])) {
    // Add the prefix to the format-specific options.
    const formatOptions =
        ee.batch.Export.prefixImageFormatOptions_(taskConfig, formatString);
    delete taskConfig['formatOptions'];
    // Assign the format options into the top-level request.
    Object.assign(taskConfig, formatOptions);
  }
  return taskConfig;
};


/**
 * Ensures the provided arguments and format options can be sucessfully
 * combined into top level parameters passed to the server, and returns a task
 * configuration with such a combination.
 * @param {!ee.batch.ServerTaskConfig} taskConfig Config
 * @param {!ee.batch.ImageFormat} imageFormat Well known image format.
 * @return {!Object} A potentially only partially correct task config that may
 *     need field type conversion to be conformant with ImageTaskConfig.
 * @private
 */
ee.batch.Export.prefixImageFormatOptions_ = function(taskConfig, imageFormat) {
  let formatOptions = taskConfig['formatOptions'];
  // No-op if no format options are provided.
  if (!goog.isDefAndNotNull(formatOptions)) {
    return {};
  }
  // Verify that any formatOptions are not already specified in the
  // top-level config.
  if (Object.keys(taskConfig)
          .some((key) => googObject.containsKey(formatOptions, key))) {
    throw new Error(
        'Parameter specified at least twice: once in config, and once in ' +
        'config format options.');
  }
  const prefix = FORMAT_PREFIX_MAP[imageFormat];
  const validOptionKeys = FORMAT_OPTIONS_MAP[imageFormat];
  const prefixedOptions = {};
  for (const [key, value] of Object.entries(formatOptions)) {
    if (!(googArray.contains(validOptionKeys, key))) {
      const validKeysMsg = validOptionKeys.join(', ');
      throw new Error(
          `"${key}" is not a valid option, the image format "${imageFormat}"` +
          `"may have the following options: ${validKeysMsg}".`);
    }
    const prefixedKey = prefix + key[0].toUpperCase() + key.substring(1);
    if (goog.isArray(value)) {
      // Legacy format options are comma delimited strings.
      prefixedOptions[prefixedKey] = value.join();
    } else {
      prefixedOptions[prefixedKey] = value;
    }
  }
  return prefixedOptions;
};


/**
 * The server-side key for configuring a CRS transform.
 * @const {string}
 */
ee.batch.Export.CRS_TRANSFORM_KEY = 'crs_transform';


/**
 * The keys in user argument dictionaries of EE elements to export.
 * @const {!Array<string>}
 */
ee.batch.Export.EE_ELEMENT_KEYS = ['image', 'collection'];
