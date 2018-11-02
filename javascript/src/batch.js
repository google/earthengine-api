/** @fileoverview An interface to the Earth Engine batch processing system. */

goog.provide('ee.batch');
goog.provide('ee.batch.Export');
goog.provide('ee.batch.ExportTask');

goog.require('ee.ComputedObject');
goog.require('ee.Element');
goog.require('ee.Geometry');
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
const googAsserts = goog.asserts;
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
   * @param {string} exportType The type of export to be run.
   * @return {!ee.batch.ExportTask}
   * @package
   */
  static create(exportArgs, exportType) {
    // Extract the EE element from the exportArgs.
    const ELEMENT_KEYS = ee.batch.Export.EE_ELEMENT_KEYS;
    const isInArgs = (key) => key in exportArgs;
    const eeElementKey = ELEMENT_KEYS.find(isInArgs);
    googAsserts.assert(googArray.count(ELEMENT_KEYS, isInArgs) === 1);
    const eeElement = exportArgs[eeElementKey];
    delete exportArgs[eeElementKey];

    // Construct a configuration object for the server.
    let config = {'json': eeElement.serialize(), 'type': exportType};
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
    googAsserts.assert(
        this.config_, 'Task config must be specified for tasks to be started.');

    // Synchronous task start.
    if (!opt_success) {
      this.id = this.id || ee.data.newTaskId(1)[0];
      googAsserts.assertString(this.id, 'Failed to obtain task ID.');
      ee.data.startProcessing(this.id, this.config_);
      return;
    }

    // Asynchronous task start.
    const startProcessing = () => {
      googAsserts.assertString(this.id);
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
      clientConfig, ExportDestination.ASSET);
  serverConfig['region'] =
      ee.batch.Export.serializeRegion(serverConfig['region']);
  return ee.batch.ExportTask.create(serverConfig, ExportType.IMAGE);
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
  let serverConfig = ee.batch.Export.convertToServerParams(
      clientConfig, ExportDestination.GCS);
  serverConfig = ee.batch.Export.reconcileImageFormat(
      /** @type {!ee.data.ImageTaskConfigUnformatted} */ (serverConfig));
  serverConfig['region'] =
      ee.batch.Export.serializeRegion(serverConfig['region']);
  return ee.batch.ExportTask.create(serverConfig, ExportType.IMAGE);
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
  let serverConfig = ee.batch.Export.convertToServerParams(
      clientConfig, ExportDestination.DRIVE);
  serverConfig = ee.batch.Export.reconcileImageFormat(
      /** @type {!ee.data.ImageTaskConfigUnformatted} */ (serverConfig));
  serverConfig['region'] =
      ee.batch.Export.serializeRegion(serverConfig['region']);
  return ee.batch.ExportTask.create(serverConfig, ExportType.IMAGE);
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
 * @return {!ee.batch.ExportTask}
 * @export
 */
ee.batch.Export.map.toCloudStorage = function(
    image, opt_description, opt_bucket, opt_fileFormat, opt_path,
    opt_writePublicTiles, opt_scale, opt_maxZoom, opt_minZoom, opt_region,
    opt_skipEmptyTiles) {
  const clientConfig = ee.arguments.extractFromFunction(
      ee.batch.Export.map.toCloudStorage, arguments);
  const serverConfig = ee.batch.Export.convertToServerParams(
      clientConfig, ExportDestination.GCS);
  serverConfig['region'] =
      ee.batch.Export.serializeRegion(serverConfig['region']);
  return ee.batch.ExportTask.create(serverConfig, ExportType.MAP);
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
      clientConfig, ExportDestination.GCS);
  return ee.batch.ExportTask.create(serverConfig, ExportType.TABLE);
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
  const serverConfig = ee.batch.Export.convertToServerParams(
      clientConfig, ExportDestination.DRIVE);
  return ee.batch.ExportTask.create(serverConfig, ExportType.TABLE);
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
      clientConfig, ExportDestination.ASSET);
  return ee.batch.ExportTask.create(serverConfig, ExportType.TABLE);
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
      clientConfig, ExportDestination.GCS);
  serverConfig['region'] =
      ee.batch.Export.serializeRegion(serverConfig['region']);
  return ee.batch.ExportTask.create(serverConfig, ExportType.VIDEO);
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
      clientConfig, ExportDestination.DRIVE);
  serverConfig['region'] =
      ee.batch.Export.serializeRegion(serverConfig['region']);
  return ee.batch.ExportTask.create(serverConfig, ExportType.VIDEO);
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
      region = googAsserts.assertObject(JSON.parse(region));
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
 * Extracts task arguments into a backend friendly format.
 * Sets corresponding destination configuration values to empty strings.
 *
 * @param {!Object} originalArgs The original arguments to the function.
 * @param {string} destination The destination of the export.
 * @return {!ee.batch.ServerTaskConfig} A server-friendly task configuration.
 */
ee.batch.Export.convertToServerParams = function(originalArgs, destination) {
  const args = /** @type {!ee.batch.ServerTaskConfig} */ ({});
  Object.assign(args, originalArgs);

  if (goog.isDefAndNotNull(args['crsTransform'])) {
    args[ee.batch.Export.CRS_TRANSFORM_KEY] = args['crsTransform'];
    delete args['crsTransform'];
  }

  // Convert array-valued fileDimensions to a comma-separated string.
  if (goog.typeOf(args['fileDimensions']) == 'array') {
    args['fileDimensions'] = args['fileDimensions'].join();
  }

  // Convert array-valued selectors to a comma-separated string.
  if (goog.typeOf(args['selectors']) == 'array') {
    args['selectors'] = args['selectors'].join();
  }

  // Convert to deprecated backend keys or fill with empty strings.
  switch (destination) {
    case ExportDestination.GCS:
      args['outputBucket'] = args['bucket'] || '';
      args['outputPrefix'] = args['fileNamePrefix'] || args['path'] || '';
      delete args['bucket'];
      delete args['fileNamePrefix'];
      break;
    case ExportDestination.ASSET:
      args['assetId'] = args['assetId'] || '';
      break;
    case ExportDestination.DRIVE:
      // Catch legacy function signature for toDrive calls.
      var allowedFolderType = ['string', 'undefined'];
      var folderType = goog.typeOf(args['folder']);
      if (!googArray.contains(allowedFolderType, folderType)) {
        throw Error(
            'Error: toDrive "folder" parameter must be a string, but is ' +
            'of type ' + folderType + '.');
      }
    // Drive is the default; fall through.
    default:
      args['driveFolder'] = args['folder'] || '';
      args['driveFileNamePrefix'] = args['fileNamePrefix'] || '';
      delete args['folder'];
      delete args['fileNamePrefix'];
      break;
  }

  return /** {!ee.batch.ServerTaskConfig} */ (args);
};


const PERMISSABLE_FORMAT_OPTIONS = [
  'tiffCloudOptimized', 'tiffFileDimensions', 'tfrecordPatchDimensions',
  'tfrecordKernelSize', 'tfrecordCompressed', 'tfrecordMaxFileSize',
  'tfrecordDefaultValue', 'tfrecordTensorDepths', 'tfrecordSequenceData',
  'tfrecordCollapseBands', 'tfrecordMaskedThreshold'
];

const FORMAT_PREFIX_MAP = {
  'GEOTIFF': 'tiff',
  'TFRECORD': 'tfrecord'
};

/**
 * Validates any format specific options, and converts said options to a
 * backend friendly format.
 * @param {!ee.data.ImageTaskConfigUnformatted} taskArgsUnformatted Arguments
 *     passed to an image export to drive or cloud storage
 * @return {!ee.data.ImageTaskConfig}
 */
ee.batch.Export.reconcileImageFormat = function(taskArgsUnformatted) {
  // GeoTIFF is our default
  let formatString = 'GEOTIFF';
  if (taskArgsUnformatted['fileFormat'] != null) {
    formatString = taskArgsUnformatted['fileFormat'].toUpperCase();
  }

  if (!(formatString in FORMAT_PREFIX_MAP)) {
    const supportedFormats = Object.keys(FORMAT_PREFIX_MAP).join(', ');
    throw new Error(
        `Invalid file format. Supported formats are: ${supportedFormats}.`);
  }

  let taskConfig = taskArgsUnformatted;
  if ((taskArgsUnformatted['formatOptions'] != null) &&
      (goog.typeOf(taskArgsUnformatted['formatOptions']) == 'object')) {
    const formatOptions = taskArgsUnformatted['formatOptions'];
    delete taskArgsUnformatted['formatOptions'];
    taskConfig = ee.batch.Export.reconcilePrefixOptions_(
        taskArgsUnformatted, formatOptions, formatString);
  }

  return ee.batch.Export.convertArraysToStrings_(taskConfig);
};


/**
 * Converts array format options in a partially formatted task config to comma
 * delimited strings.
 * @param {!Object} taskConfig Potentially only partially correct task config
 *     with array valued parameters that need to be converted to comma-
 *     delimited strings.
 * @return {!ee.data.ImageTaskConfig} Fully formed task config
 * @private
 */
ee.batch.Export.convertArraysToStrings_ = function(taskConfig) {
  if (taskConfig['tiffFileDimensions'] != null) {
    taskConfig['tiffFileDimensions'] = taskConfig['tiffFileDimensions'].join();
  }

  if (taskConfig['tfrecordPatchDimensions'] != null) {
    taskConfig['tfrecordPatchDimensions'] =
        taskConfig['tfrecordPatchDimensions'].join();
  }

  if (taskConfig['tfrecordKernelSize'] != null) {
    taskConfig['tfrecordKernelSize'] = taskConfig['tfrecordKernelSize'].join();
  }

  if (taskConfig['tfrecordTensorDepths'] != null) {
    taskConfig['tfrecordTensorDepths'] =
        taskConfig['tfrecordTensorDepths'].join();
  }

  return /** @type {!ee.data.ImageTaskConfig} */ (taskConfig);
};


/**
 * Ensures the provided arguments and format options can be sucessfully
 * combined into top level parameters passed to the server, and returns a task
 * configuration with such a combination.
 * @param {!ee.data.ImageTaskConfigUnformatted} taskConfig Arguments passed to
 *     an image export to drive or cloud storage
 * @param {!ee.data.ImageExportFormatConfig} formatOptions An options
 *     dictionary with format specific properties.
 * @param {string} format The export format
 * @return {!Object} A potentially only partially correct task config that may
 *     need field type conversion to be conformant with ImageTaskConfig.
 * @private
 */
ee.batch.Export.reconcilePrefixOptions_ = function(
    taskConfig, formatOptions, format) {
  if (Object.keys(taskConfig).some((key) => key in formatOptions)) {
    throw new Error(
        'Parameter specified at least twice: once in config, and once in ' +
        'config format options.');
  }

  const prefix = FORMAT_PREFIX_MAP[format];

  for (const [key, value] of Object.entries(formatOptions)) {
    const prefixedKey = prefix + key[0].toUpperCase() + key.slice(1);
    if (!PERMISSABLE_FORMAT_OPTIONS.includes(prefixedKey)) {
      throw new Error(`'${key}' is not a valid option for '${format}'.`);
    }
    taskConfig[prefixedKey] = value;
  }

  return taskConfig;
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
