/** @fileoverview An interface to the Earth Engine batch processing system. */

goog.module('ee.batch');
goog.module.declareLegacyNamespace();

const ComputedObject = goog.require('ee.ComputedObject');
const Element = goog.require('ee.Element');
const ExportDestination = goog.require('ee.data.ExportDestination');
const ExportType = goog.require('ee.data.ExportType');
const FeatureCollection = goog.require('ee.FeatureCollection');
const Geometry = goog.require('ee.Geometry');
const GoogPromise = goog.require('goog.Promise');
const Image = goog.require('ee.Image');
const ImageCollection = goog.require('ee.ImageCollection');
const data = goog.require('ee.data');
const eeArguments = goog.require('ee.arguments');
const googArray = goog.require('goog.array');
const googAsserts = goog.require('goog.asserts');
const googObject = goog.require('goog.object');

/** @namespace */
const Export = {};

/** @const */
Export.image = {};

/** @const */
Export.map = {};

/** @const */
Export.table = {};

/** @const */
Export.video = {};

/**
 * ExportTask
 */
class ExportTask {
  /** @param {!data.AbstractTaskConfig} config */
  constructor(config) {
    /** @const @private {!data.AbstractTaskConfig} */
    this.config_ = config;
    /** @export {?string} Task ID, initialized after task starts. */
    this.id = null;
  }

  /**
   * Creates a task.
   *
   * @param {!Object} exportArgs The export task arguments.
   * @return {!ExportTask}
   * @package
   */
  static create(exportArgs) {
    // Extract the EE element from the exportArgs.

    const eeElement = Export.extractElement(exportArgs);
    // Construct a configuration object for the server.
    let config = {'element': eeElement};
    Object.assign(config, exportArgs);
    // The config is some kind of task configuration.
    config = /** @type {!data.AbstractTaskConfig} */ (
        googObject.filter(config, x => x != null));

    return new ExportTask(config);
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
    googAsserts.assert(
        this.config_, 'Task config must be specified for tasks to be started.');

    // Synchronous task start.
    if (!opt_success) {
      this.id = this.id || data.newTaskId(1)[0];
      googAsserts.assertString(this.id, 'Failed to obtain task ID.');
      data.startProcessing(this.id, this.config_);
      return;
    }

    // Asynchronous task start.
    const startProcessing = () => {
      googAsserts.assertString(this.id);
      data.startProcessing(this.id, this.config_, (_, error) => {
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

    data.newTaskId(1, (ids) => {
      const id = ids && ids[0];
      if (id) {
        this.id = id;
        startProcessing();
      } else {
        opt_error('Failed to obtain task ID.');
      }
    });
  }
}


////////////////////////////////////////////////////////////////////////////////
//                               Public API.                                  //
////////////////////////////////////////////////////////////////////////////////

// Public API for exports in the JS client library.


/**
 * @param {!Image} image
 * @param {string=} opt_description
 * @param {string=} opt_assetId
 * @param {?Object=} opt_pyramidingPolicy
 * @param {number|string=} opt_dimensions
 * @param {?Geometry.LinearRing|?Geometry.Polygon|string=} opt_region
 * @param {number=} opt_scale
 * @param {string=} opt_crs
 * @param {!Array<number>|string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @param {number=} opt_shardSize
 * @return {!ExportTask}
 * @export
 */
Export.image.toAsset = function(
    image, opt_description, opt_assetId, opt_pyramidingPolicy, opt_dimensions,
    opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels,
    opt_shardSize) {
  const clientConfig =
      eeArguments.extractFromFunction(Export.image.toAsset, arguments);
  const serverConfig = Export.convertToServerParams(
      clientConfig, ExportDestination.ASSET, ExportType.IMAGE);
  return ExportTask.create(serverConfig);
};


/**
 * @param {!Image} image
 * @param {string=} opt_description
 * @param {string=} opt_bucket
 * @param {string=} opt_fileNamePrefix
 * @param {number|string=} opt_dimensions
 * @param {?Geometry.LinearRing|?Geometry.Polygon|string=} opt_region
 * @param {number=} opt_scale
 * @param {string=} opt_crs
 * @param {!Array<number>|string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @param {number=} opt_shardSize
 * @param {number|?Array<number>=} opt_fileDimensions
 * @param {boolean=} opt_skipEmptyTiles
 * @param {string=} opt_fileFormat
 * @param {?data.ImageExportFormatConfig=} opt_formatOptions
 * @return {!ExportTask}
 * @export
 */
Export.image.toCloudStorage = function(
    image, opt_description, opt_bucket, opt_fileNamePrefix, opt_dimensions,
    opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels,
    opt_shardSize, opt_fileDimensions, opt_skipEmptyTiles, opt_fileFormat,
    opt_formatOptions) {
  const clientConfig =
      eeArguments.extractFromFunction(Export.image.toCloudStorage, arguments);
  const serverConfig = Export.convertToServerParams(
      clientConfig, ExportDestination.GCS, ExportType.IMAGE);
  return ExportTask.create(serverConfig);
};


/**
 * @param {!Image} image
 * @param {string=} opt_description
 * @param {string=} opt_folder
 * @param {string=} opt_fileNamePrefix
 * @param {number|string=} opt_dimensions
 * @param {?Geometry.LinearRing|?Geometry.Polygon|string=} opt_region
 * @param {number=} opt_scale
 * @param {string=} opt_crs
 * @param {!Array<number>|string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @param {number=} opt_shardSize
 * @param {number|?Array<number>=} opt_fileDimensions
 * @param {boolean=} opt_skipEmptyTiles
 * @param {string=} opt_fileFormat
 * @param {?data.ImageExportFormatConfig=} opt_formatOptions
 * @return {!ExportTask}
 * @export
 */
Export.image.toDrive = function(
    image, opt_description, opt_folder, opt_fileNamePrefix, opt_dimensions,
    opt_region, opt_scale, opt_crs, opt_crsTransform, opt_maxPixels,
    opt_shardSize, opt_fileDimensions, opt_skipEmptyTiles, opt_fileFormat,
    opt_formatOptions) {
  const clientConfig =
      eeArguments.extractFromFunction(Export.image.toDrive, arguments);
  const serverConfig = Export.convertToServerParams(
      clientConfig, ExportDestination.DRIVE, ExportType.IMAGE);
  return ExportTask.create(serverConfig);
};


/**
 * @param {!Image} image
 * @param {string=} opt_description
 * @param {string=} opt_bucket
 * @param {string=} opt_fileFormat
 * @param {string=} opt_path
 * @param {boolean=} opt_writePublicTiles
 * @param {number=} opt_scale
 * @param {number=} opt_maxZoom
 * @param {number=} opt_minZoom
 * @param {?Geometry.LinearRing|?Geometry.Polygon|string=} opt_region
 * @param {boolean=} opt_skipEmptyTiles
 * @param {string=} opt_mapsApiKey
 * @param {?Array<string>=} opt_bucketCorsUris
 * @return {!ExportTask}
 * @export
 */
Export.map.toCloudStorage = function(
    image, opt_description, opt_bucket, opt_fileFormat, opt_path,
    opt_writePublicTiles, opt_scale, opt_maxZoom, opt_minZoom, opt_region,
    opt_skipEmptyTiles, opt_mapsApiKey, opt_bucketCorsUris) {
  const clientConfig =
      eeArguments.extractFromFunction(Export.map.toCloudStorage, arguments);
  const serverConfig = Export.convertToServerParams(
      clientConfig, ExportDestination.GCS, ExportType.MAP);
  return ExportTask.create(serverConfig);
};


/**
 * @param {!FeatureCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_bucket
 * @param {string=} opt_fileNamePrefix
 * @param {string=} opt_fileFormat
 * @param {string|!Array<string>=} opt_selectors
 * @param {number=} opt_maxVertices
 * @return {!ExportTask}
 * @export
 */
Export.table.toCloudStorage = function(
    collection, opt_description, opt_bucket, opt_fileNamePrefix, opt_fileFormat,
    opt_selectors, opt_maxVertices) {
  const clientConfig =
      eeArguments.extractFromFunction(Export.table.toCloudStorage, arguments);
  const serverConfig = Export.convertToServerParams(
      clientConfig, ExportDestination.GCS, ExportType.TABLE);
  return ExportTask.create(serverConfig);
};


/**
 * @param {!FeatureCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_folder
 * @param {string=} opt_fileNamePrefix
 * @param {string=} opt_fileFormat
 * @param {string|!Array<string>=} opt_selectors
 * @param {number=} opt_maxVertices
 * @return {!ExportTask}
 * @export
 */
Export.table.toDrive = function(
    collection, opt_description, opt_folder, opt_fileNamePrefix, opt_fileFormat,
    opt_selectors, opt_maxVertices) {
  const clientConfig =
      eeArguments.extractFromFunction(Export.table.toDrive, arguments);
  clientConfig['type'] = ExportType.TABLE;
  const serverConfig = Export.convertToServerParams(
      clientConfig, ExportDestination.DRIVE, ExportType.TABLE);
  return ExportTask.create(serverConfig);
};


/**
 * @param {!FeatureCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_assetId
 * @param {number=} opt_maxVertices
 * @return {!ExportTask}
 * @export
 */
Export.table.toAsset = function(
    collection, opt_description, opt_assetId, opt_maxVertices) {
  const clientConfig =
      eeArguments.extractFromFunction(Export.table.toAsset, arguments);
  const serverConfig = Export.convertToServerParams(
      clientConfig, ExportDestination.ASSET, ExportType.TABLE);
  return ExportTask.create(serverConfig);
};


/**
 * @param {!FeatureCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_assetId
 * @param {number=} opt_maxFeaturesPerTile
 * @param {string=} opt_thinningStrategy
 * @param {string|!Array<string>=} opt_thinningRanking
 * @param {string|!Array<string>=} opt_zOrderRanking
 * @return {!ExportTask}
 * @export
 */
Export.table.toFeatureView = function(
    collection, opt_description, opt_assetId, opt_maxFeaturesPerTile,
    opt_thinningStrategy, opt_thinningRanking, opt_zOrderRanking) {
  const clientConfig =
      eeArguments.extractFromFunction(Export.table.toFeatureView, arguments);
  const serverConfig = Export.convertToServerParams(
      clientConfig, ExportDestination.FEATURE_VIEW, ExportType.TABLE);
  return ExportTask.create(serverConfig);
};


/**
 * @param {!ImageCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_bucket
 * @param {string=} opt_fileNamePrefix
 * @param {number=} opt_framesPerSecond
 * @param {number|string=} opt_dimensions
 * @param {?Geometry.LinearRing|?Geometry.Polygon|string=} opt_region
 * @param {number=} opt_scale Resolution
 * @param {string=} opt_crs
 * @param {!Array<number>|string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @param {number=} opt_maxFrames
 * @return {!ExportTask}
 * @export
 */
Export.video.toCloudStorage = function(
    collection, opt_description, opt_bucket, opt_fileNamePrefix,
    opt_framesPerSecond, opt_dimensions, opt_region, opt_scale, opt_crs,
    opt_crsTransform, opt_maxPixels, opt_maxFrames) {
  const clientConfig =
      eeArguments.extractFromFunction(Export.video.toCloudStorage, arguments);
  const serverConfig = Export.convertToServerParams(
      clientConfig, ExportDestination.GCS, ExportType.VIDEO);
  return ExportTask.create(serverConfig);
};


/**
 * @param {!ImageCollection} collection
 * @param {string=} opt_description
 * @param {string=} opt_folder
 * @param {string=} opt_fileNamePrefix
 * @param {number=} opt_framesPerSecond
 * @param {number|string=} opt_dimensions
 * @param {?Geometry.LinearRing|?Geometry.Polygon|string=} opt_region
 * @param {number=} opt_scale
 * @param {string=} opt_crs
 * @param {!Array<number>|string=} opt_crsTransform
 * @param {number=} opt_maxPixels
 * @param {number=} opt_maxFrames
 * @return {!ExportTask}
 * @export
 */
Export.video.toDrive = function(
    collection, opt_description, opt_folder, opt_fileNamePrefix,
    opt_framesPerSecond, opt_dimensions, opt_region, opt_scale, opt_crs,
    opt_crsTransform, opt_maxPixels, opt_maxFrames) {
  const clientConfig =
      eeArguments.extractFromFunction(Export.video.toDrive, arguments);
  const serverConfig = Export.convertToServerParams(
      clientConfig, ExportDestination.DRIVE, ExportType.VIDEO);
  return ExportTask.create(serverConfig);
};

////////////////////////////////////////////////////////////////////////////////
//                          Internal validation.                              //
////////////////////////////////////////////////////////////////////////////////

/**
 * A task descriptor whose parameters have been converted from the user-facing
 * syntax to a server-compatible representation. For the user-facing
 * equivalent parameters, see the Public API section above.
 *
 * @typedef {!data.ImageTaskConfig|!data.MapTaskConfig|
 *     !data.TableTaskConfig|!data.FeatureViewTaskConfig|!data.VideoTaskConfig|
 *     !data.VideoMapTaskConfig|!data.ClassifierTaskConfig}
 */
const ServerTaskConfig = {};

const REGION_ERROR = 'Invalid format for region property. Region must be ' +
    'GeoJSON LinearRing or Polygon specified as actual coordinates or ' +
    'serialized as a string. See Export documentation.';

/**
 * Serializes a 'region' value. Region may be a Geometry, a GeoJSON string, or a
 * GeoJSON object. Only client-side validation is applied; this method does not
 * support computed objects.
 *
 * @param {!Geometry|!Object|string} region
 * @return {string}
 * #visibleForTesting
 */
Export.serializeRegion = function(region) {
  // Convert region to a GeoJSON object.
  if (region instanceof Geometry) {
    region = region.toGeoJSON();
  } else if (typeof region === 'string') {
    try {
      region = googAsserts.assertObject(JSON.parse(region));
    } catch (x) {
      throw Error(REGION_ERROR);
    }
  }

  // Ensure locally that the region is a valid LineString or Polygon geometry.
  if (!goog.isObject(region) || !('type' in region)) {
    try {
      new Geometry.LineString(/** @type {?} */ (region));
    } catch (e) {
      try {
        new Geometry.Polygon(/** @type {?} */ (region));
      } catch (e2) {
        throw Error(REGION_ERROR);
      }
    }
  }

  return JSON.stringify(region);
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
Export.resolveRegionParam = function(params) {
  params = googObject.clone(params);

  if (!params['region']) return GoogPromise.resolve(params);

  let region = params['region'];

  if (region instanceof ComputedObject) {
    if (region instanceof Element) {
      region = region['geometry']();
    }
    return new GoogPromise(function(resolve, reject) {
      region.getInfo(function(regionInfo, error) {
        if (error) {
          reject(error);
        } else {
          if (params['type'] === ExportType.IMAGE) {
            params['region'] = new Geometry(regionInfo);
          } else {
            params['region'] = Export.serializeRegion(regionInfo);
          }
          resolve(params);
        }
      });
    });
  }
  if (params['type'] === ExportType.IMAGE) {
    params['region'] = new Geometry(region);
  } else {
    params['region'] = Export.serializeRegion(region);
  }
  return GoogPromise.resolve(params);
};



/**
 * Extracts the EE element from a given task config.
 * @param {!Object} exportArgs
 * @return {!Image|!FeatureCollection|!ImageCollection|!Element|!ComputedObject}
 */
Export.extractElement = function(exportArgs) {
  // Extract the EE element from the exportArgs.
  const isInArgs = (key) => key in exportArgs;
  const eeElementKey = Export.EE_ELEMENT_KEYS.find(isInArgs);
  // Sanity check that the Image/Collection/Table was provided.
  googAsserts.assert(
      googArray.count(Export.EE_ELEMENT_KEYS, isInArgs) === 1,
      'Expected a single "image", "collection" or "classifier" key.');
  const element = exportArgs[eeElementKey];
  let result;
  if (element instanceof Image) {
    result = /** @type {!Image} */ (element);
  } else if (element instanceof FeatureCollection) {
    result = /** @type {!FeatureCollection} */ (element);
  } else if (element instanceof ImageCollection) {
    result = /** @type {!ImageCollection} */ (element);
  } else if (element instanceof Element) {
    result = /** @type {!Element} */ (element);
  } else if (element instanceof ComputedObject) {
    result = /** @type {!ComputedObject} */ (element);
  } else {
    throw new Error(
        'Unknown element type provided: ' + typeof (element) + '. Expected: ' +
        ' ee.Image, ee.ImageCollection, ee.FeatureCollection,  ee.Element' +
        ' or ee.ComputedObject.');
  }
  delete exportArgs[eeElementKey];
  return result;
};


/**
 * Extracts task arguments into a backend friendly format.
 * Sets corresponding destination configuration values to empty strings.
 *
 * @param {!Object} originalArgs The original arguments to the function.
 * @param {!data.ExportDestination} destination Destination of the export.
 * @param {!data.ExportType} exportType The type of the export.
 * @param {boolean=} serializeRegion enables serializing the region param.
 * @return {!ServerTaskConfig} A server-friendly task configuration.
 */
Export.convertToServerParams = function(
    originalArgs, destination, exportType, serializeRegion = true) {
  let taskConfig =
      /** @type {!ServerTaskConfig} */ ({type: exportType});
  Object.assign(taskConfig, originalArgs);

  switch (exportType) {
    case ExportType.IMAGE:
      taskConfig = Export.image.prepareTaskConfig_(taskConfig, destination);
      break;
    case ExportType.MAP:
      taskConfig = Export.map.prepareTaskConfig_(taskConfig, destination);
      break;
    case ExportType.TABLE:
      taskConfig = Export.table.prepareTaskConfig_(taskConfig, destination);
      break;
    case ExportType.VIDEO:
      taskConfig = Export.video.prepareTaskConfig_(taskConfig, destination);
      break;
    case ExportType.VIDEO_MAP:
      taskConfig = Export.videoMap.prepareTaskConfig_(taskConfig, destination);
      break;
    case ExportType.CLASSIFIER:
      taskConfig =
          Export.classifier.prepareTaskConfig_(taskConfig, destination);
      break;
    default:
      throw Error('Unknown export type: ' + taskConfig['type']);
  }
  if (serializeRegion && taskConfig['region'] != null) {
    taskConfig['region'] = Export.serializeRegion(taskConfig['region']);
  }
  return /** {!ServerTaskConfig} */ (taskConfig);
};

/**
 * Consolidates various options into a standard representation for the
 * top-level ServerTaskConfig.
 *
 * @param {!ServerTaskConfig} taskConfig Task config to prepare.
 * @param {!data.ExportDestination} destination Export destination.
 * @return {!ServerTaskConfig}
 * @private
 */
Export.prepareDestination_ = function(taskConfig, destination) {
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
    case ExportDestination.FEATURE_VIEW:
      taskConfig['mapName'] = taskConfig['mapName'] || '';
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
 * @param {!ServerTaskConfig} taskConfig Image export config to
 *     prepare.
 * @param {!data.ExportDestination} destination Export destination.
 * @return {!data.ImageTaskConfig}
 * @private
 */
Export.image.prepareTaskConfig_ = function(taskConfig, destination) {
  // Set the file format to GeoTiff if not set.
  if (taskConfig['fileFormat'] == null) {
    taskConfig['fileFormat'] = 'GeoTIFF';
  }
  // Handle format-specific options.
  taskConfig = Export.reconcileImageFormat(taskConfig);
  // Add top-level destination fields.
  taskConfig = Export.prepareDestination_(taskConfig, destination);
  // Fix the CRS transform key.
  if (taskConfig['crsTransform'] != null) {
    taskConfig[Export.CRS_TRANSFORM_KEY] = taskConfig['crsTransform'];
    delete taskConfig['crsTransform'];
  }
  return /** @type {!data.ImageTaskConfig} */ (taskConfig);
};


/**
 * Adapts a ServerTaskConfig into a TableTaskConfig normalizing any parameters.
 *
 * @param {!ServerTaskConfig} taskConfig Table export config to
 *     prepare.
 * @param {!data.ExportDestination} destination Export destination.
 * @return {!data.TableTaskConfig|!data.FeatureViewTaskConfig}
 * @private
 */
Export.table.prepareTaskConfig_ = function(taskConfig, destination) {
  // Convert array-valued selectors to a comma-separated string.
  if (Array.isArray(taskConfig['selectors'])) {
    taskConfig['selectors'] = taskConfig['selectors'].join();
  }
  // Handle format-specific options.
  taskConfig = Export.reconcileTableFormat(taskConfig);
  // Add top-level destination fields.
  taskConfig = Export.prepareDestination_(taskConfig, destination);
  return /** @type {!data.TableTaskConfig|!data.FeatureViewTaskConfig} */ (
      taskConfig);
};


/**
 * Adapts a ServerTaskConfig into a MapTaskConfig normalizing any parameters.
 *
 * @param {!ServerTaskConfig} taskConfig Map export config to
 *     prepare.
 * @param {!data.ExportDestination} destination Export destination.
 * @return {!data.MapTaskConfig}
 * @private
 */
Export.map.prepareTaskConfig_ = function(taskConfig, destination) {
  taskConfig = Export.prepareDestination_(taskConfig, destination);
  // Handle format-specific options.
  taskConfig = Export.reconcileMapFormat(taskConfig);
  return /** @type {!data.MapTaskConfig} */ (taskConfig);
};


/**
 * Adapts a ServerTaskConfig into a VideoTaskConfig normalizing any params.
 *
 * @param {!ServerTaskConfig} taskConfig Video export config to
 *     prepare.
 * @param {!data.ExportDestination} destination Export destination.
 * @return {!data.VideoTaskConfig}
 * @private
 */
Export.video.prepareTaskConfig_ = function(taskConfig, destination) {
  taskConfig = Export.reconcileVideoFormat_(taskConfig);
  taskConfig = Export.prepareDestination_(taskConfig, destination);
  if (taskConfig['crsTransform'] != null) {
    taskConfig[Export.CRS_TRANSFORM_KEY] = taskConfig['crsTransform'];
    delete taskConfig['crsTransform'];
  }
  return /** @type {!data.VideoTaskConfig} */ (taskConfig);
};

/**
 * Adapts a ServerTaskConfig into a VideoMapTaskConfig normalizing any params
 * for a video map task.
 *
 * @param {!ServerTaskConfig} taskConfig VideoMap export config to
 *     prepare.
 * @param {!data.ExportDestination} destination Export destination.
 * @return {!data.VideoMapTaskConfig}
 * @private
 */
Export.videoMap.prepareTaskConfig_ = function(taskConfig, destination) {
  taskConfig = Export.reconcileVideoFormat_(taskConfig);
  taskConfig['version'] = taskConfig['version'] || VideoMapVersion.V1;
  taskConfig['stride'] = taskConfig['stride'] || 1;
  const width = taskConfig['tileWidth'] || 256,
        height = taskConfig['tileHeight'] || 256;
  taskConfig['tileDimensions'] = {width: width, height: height};
  taskConfig = Export.prepareDestination_(taskConfig, destination);
  return /** @type {!data.VideoMapTaskConfig} */ (taskConfig);
};

/**
 * Adapts a ServerTaskConfig into a ClassifierTaskConfig normalizing any params
 * for a classifier task.
 *
 * @param {!ServerTaskConfig} taskConfig VideoMap export config to
 *     prepare.
 * @param {!data.ExportDestination} destination Export destination.
 * @return {!data.ClassifierTaskConfig}
 * @private
 */
Export.classifier.prepareTaskConfig_ = function(taskConfig, destination) {
  taskConfig = Export.prepareDestination_(taskConfig, destination);
  return /** @type {!data.ClassifierTaskConfig} */ (taskConfig);
};


/**
 * @enum {string} The valid video formats supported by export.
 */
const VideoFormat = {
  MP4: 'MP4',  // Default.
  GIF: 'GIF',
  VP9: 'VP9',
};

/**
 * @enum {string} The valid map formats supported by export.
 */
const MapFormat = {
  AUTO_JPEG_PNG: 'AUTO_JPEG_PNG',  // Default.
  JPEG: 'JPEG',
  PNG: 'PNG',
};

/**
 * @enum {string} The valid image formats supported by export.
 */
const ImageFormat = {
  GEO_TIFF: 'GEO_TIFF',  // Default.
  TF_RECORD_IMAGE: 'TF_RECORD_IMAGE',
};

/**
 * @enum {string} The valid table formats supported by export.
 */
const TableFormat = {
  CSV: 'CSV',  // Default.
  GEO_JSON: 'GEO_JSON',
  KML: 'KML',
  KMZ: 'KMZ',
  SHP: 'SHP',
  TF_RECORD_TABLE: 'TF_RECORD_TABLE',
};

/** @type {!Object<string, !Array<string>>} */
const FORMAT_OPTIONS_MAP = {
  'GEO_TIFF': [
    'cloudOptimized',
    'fileDimensions',
    'shardSize',
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
 * @param {!ServerTaskConfig} taskConfig
 * @return {!ServerTaskConfig} parsedConfig with video options set.
 * @private
 **/
Export.reconcileVideoFormat_ = function(taskConfig) {
  taskConfig['videoOptions'] = taskConfig['framesPerSecond'] || 5.0;
  taskConfig['maxFrames'] = taskConfig['maxFrames'] || 1000;
  taskConfig['maxPixels'] = taskConfig['maxPixels'] || 1e8;
  // Parse the video file format from the given task config.
  let formatString = taskConfig['fileFormat'];
  // If not specified assume the format is MP4.
  if (formatString == null) {
    formatString = VideoFormat.MP4;
  }
  formatString = formatString.toUpperCase();
  switch (formatString) {
    case 'MP4':
      formatString = VideoFormat.MP4;
      break;
    case 'GIF':
    case 'JIF':
      formatString = VideoFormat.GIF;
      break;
    case 'VP9':
    case 'WEBM':
      formatString = VideoFormat.VP9;
      break;
    default:
      throw new Error(
          `Invalid file format ${formatString}. ` +
          `Supported formats are: 'MP4', 'GIF', and 'WEBM'.`);
  }
  taskConfig['fileFormat'] = formatString;
  return taskConfig;
};

/**
 * Validates any format specific options, and converts said options to a
 * backend friendly format.
 * @param {!ServerTaskConfig} taskConfig Arguments
 *     passed to an image export "toDrive" or "toCloudStorage" request.
 * @return {!ServerTaskConfig}
 */
Export.reconcileImageFormat = function(taskConfig) {
  // Parse the image file format from the given task config.
  let formatString = taskConfig['fileFormat'];
  // If not specified assume the format is geotiff.
  if (formatString == null) {
    formatString = ImageFormat.GEO_TIFF;
  }
  formatString = formatString.toUpperCase();
  switch (formatString) {
    case 'TIFF':
    case 'TIF':
    case 'GEO_TIFF':
    case 'GEOTIFF':
      formatString = ImageFormat.GEO_TIFF;
      break;
    case 'TF_RECORD':
    case 'TF_RECORD_IMAGE':
    case 'TFRECORD':
      formatString = ImageFormat.TF_RECORD_IMAGE;
      break;
    default:
      throw new Error(
          `Invalid file format ${formatString}. ` +
          `Supported formats are: 'GEOTIFF', 'TFRECORD'.`);
  }
  taskConfig['fileFormat'] = formatString;

  if (taskConfig['formatOptions'] != null) {
    // Add the prefix to the format-specific options.
    const formatOptions =
        Export.prefixImageFormatOptions_(taskConfig, formatString);
    delete taskConfig['formatOptions'];
    // Assign the format options into the top-level request.
    Object.assign(taskConfig, formatOptions);
  }
  return taskConfig;
};


/**
 * Validates any format specific options, and converts said options to a
 * backend friendly format.
 * @param {!ServerTaskConfig} taskConfig Arguments
 *     passed to an map export "toCloudStorage" request.
 * @return {!ServerTaskConfig}
 */
Export.reconcileMapFormat = function(taskConfig) {
  // Parse the image file format from the given task config.
  let formatString = taskConfig['fileFormat'];
  // If not specified assume the format is auto.
  if (formatString == null) {
    formatString = MapFormat.AUTO_JPEG_PNG;
  }
  formatString = formatString.toUpperCase();
  switch (formatString) {
    case 'AUTO':
    case 'AUTO_JPEG_PNG':
    case 'AUTO_JPG_PNG':
      formatString = MapFormat.AUTO_JPEG_PNG;
      break;
    case 'JPG':
    case 'JPEG':
      formatString = MapFormat.JPEG;
      break;
    case 'PNG':
      formatString = MapFormat.PNG;
      break;
    default:
      throw new Error(
          `Invalid file format ${formatString}. ` +
          `Supported formats are: 'AUTO', 'PNG', and 'JPEG'.`);
  }
  taskConfig['fileFormat'] = formatString;

  return taskConfig;
};


/**
 * Validates any format specific options, and converts said options to a
 * backend friendly format.
 * @param {!ServerTaskConfig} taskConfig Arguments
 *     passed to a table export "toDrive" or "toCloudStorage" request.
 * @return {!ServerTaskConfig}
 */
Export.reconcileTableFormat = function(taskConfig) {
  // Parse the image file format from the given task config.
  let formatString = taskConfig['fileFormat'];
  // If not specified assume the format is CSV.
  if (formatString == null) {
    formatString = TableFormat.CSV;
  }
  formatString = formatString.toUpperCase();
  switch (formatString) {
    case 'CSV':
      formatString = TableFormat.CSV;
      break;
    case 'JSON':
    case 'GEOJSON':
    case 'GEO_JSON':
      formatString = TableFormat.GEO_JSON;
      break;
    case 'KML':
      formatString = TableFormat.KML;
      break;
    case 'KMZ':
      formatString = TableFormat.KMZ;
      break;
    case 'SHP':
      formatString = TableFormat.SHP;
      break;
    case 'TF_RECORD':
    case 'TF_RECORD_TABLE':
    case 'TFRECORD':
      formatString = TableFormat.TF_RECORD_TABLE;
      break;
    default:
      throw new Error(
          `Invalid file format ${formatString}. ` +
          `Supported formats are: 'CSV', 'GeoJSON', 'KML', ` +
          `'KMZ', 'SHP', and 'TFRecord'.`);
  }
  taskConfig['fileFormat'] = formatString;
  return taskConfig;
};


/**
 * Ensures the provided arguments and format options can be successfully
 * combined into top level parameters passed to the server, and returns a task
 * configuration with such a combination.
 * @param {!ServerTaskConfig} taskConfig Config
 * @param {!ImageFormat} imageFormat Well known image format.
 * @return {!Object} A potentially only partially correct task config that may
 *     need field type conversion to be conformant with ImageTaskConfig.
 * @private
 */
Export.prefixImageFormatOptions_ = function(taskConfig, imageFormat) {
  let formatOptions = taskConfig['formatOptions'];
  // No-op if no format options are provided.
  if (formatOptions == null) {
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
    if (Array.isArray(value)) {
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
Export.CRS_TRANSFORM_KEY = 'crs_transform';


/**
 * The keys in user argument dictionaries of EE elements to export.
 * @const {!Array<string>}
 */
Export.EE_ELEMENT_KEYS = ['image', 'collection', 'classifier'];

exports.Export = Export;
exports.ExportTask = ExportTask;
exports.ImageFormat = ImageFormat;
exports.MapFormat = MapFormat;
exports.ServerTaskConfig = ServerTaskConfig;
exports.TableFormat = TableFormat;
exports.VideoFormat = VideoFormat;
