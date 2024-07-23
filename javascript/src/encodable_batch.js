/**
 * @fileoverview Helper functions for converting Legacy batch task objects into
 * Cloud API objects.
 */
goog.provide('ee.rpc_convert_batch');

goog.require('ee.Serializer');
goog.require('ee.api');
goog.require('ee.rpc_convert');
goog.require('goog.object');


/**
 * Possible legacy export destinations.
 * TODO(user): Remove duplicate the ExportDestination enum.
 *
 * @enum {string} The destination of the export.
 */
ee.rpc_convert_batch.ExportDestination = {
  DRIVE: 'DRIVE',
  GCS: 'GOOGLE_CLOUD_STORAGE',
  ASSET: 'ASSET',
  FEATURE_VIEW: 'FEATURE_VIEW',
  BIGQUERY: 'BIGQUERY',
};


/**
 * Converts a legacy ExportParameters into a Cloud API ExportImageRequest.
 *
 * @param {!Object} params A parameter list representing a ExportParameters
 * taken from an export TaskConfig.
 * @return {!ee.api.ExportImageRequest}
 */
ee.rpc_convert_batch.taskToExportImageRequest = function(params) {
  if (params['element'] == null) {
    throw new Error(`"element" not found in params ${params}`);
  }
  const result = new ee.api.ExportImageRequest({
    expression: ee.Serializer.encodeCloudApiExpression(params['element']),
    description: stringOrNull_(params['description']),
    fileExportOptions: null,
    assetExportOptions: null,
    grid: null,
    // Int64s are encoded as strings.
    maxPixels: stringOrNull_(params['maxPixels']),
    requestId: stringOrNull_(params['id']),
    priority: numberOrNull_(params['priority']),
  });

  const destination = ee.rpc_convert_batch.guessDestination_(params);
  switch (destination) {
    case ee.rpc_convert_batch.ExportDestination.GCS:
    case ee.rpc_convert_batch.ExportDestination.DRIVE:
      result.fileExportOptions =
          ee.rpc_convert_batch.buildImageFileExportOptions_(
              params, destination);
      break;
    case ee.rpc_convert_batch.ExportDestination.ASSET:
      result.assetExportOptions =
          ee.rpc_convert_batch.buildImageAssetExportOptions_(params);
      break;
    default:
      throw new Error(`Export destination "${destination}" unknown`);
  }
  return result;
};


/**
 * Converts a legacy ExportParameters into a Cloud API ExportTableRequest.
 *
 * @param {!Object} params A parameter list representing a ExportParameters
 *     taken from an export TaskConfig.
 * @return {!ee.api.ExportTableRequest}
 */
ee.rpc_convert_batch.taskToExportTableRequest = function(params) {
  if (params['element'] == null) {
    throw new Error(`"element" not found in params ${params}`);
  }
  let selectors = params['selectors'] || null;
  if (selectors != null) {
    if (typeof selectors === 'string') {
      selectors = selectors.split(',');
    }
  }
  const result = new ee.api.ExportTableRequest({
    expression: ee.Serializer.encodeCloudApiExpression(params['element']),
    description: stringOrNull_(params['description']),
    fileExportOptions: null,
    assetExportOptions: null,
    featureViewExportOptions: null,
    bigqueryExportOptions: null,
    selectors: /** @type {?Array<string>} */ (selectors),
    maxErrorMeters: numberOrNull_(params['maxErrorMeters']),
    requestId: stringOrNull_(params['id']),
    maxVertices: numberOrNull_(params['maxVertices']),
    priority: numberOrNull_(params['priority']),
  });

  const destination = ee.rpc_convert_batch.guessDestination_(params);
  switch (destination) {
    case ee.rpc_convert_batch.ExportDestination.GCS:
    case ee.rpc_convert_batch.ExportDestination.DRIVE:
      result.fileExportOptions =
          ee.rpc_convert_batch.buildTableFileExportOptions_(
              params, destination);
      break;
    case ee.rpc_convert_batch.ExportDestination.ASSET:
      result.assetExportOptions =
          ee.rpc_convert_batch.buildTableAssetExportOptions_(params);
      break;
    case ee.rpc_convert_batch.ExportDestination.FEATURE_VIEW:
      result.featureViewExportOptions =
          ee.rpc_convert_batch.buildFeatureViewExportOptions_(params);
      break;
    case ee.rpc_convert_batch.ExportDestination.BIGQUERY:
      result.bigqueryExportOptions =
          ee.rpc_convert_batch.buildBigQueryExportOptions_(params);
      break;
    default:
      throw new Error(`Export destination "${destination}" unknown`);
  }

  if (params['workloadTag']) {
    result.workloadTag = params['workloadTag'];
  }
  return result;
};


/**
 * Converts a legacy ExportParameters into a Cloud API ExportVideoRequest.
 *
 * @param {!Object} params A parameter list representing a ExportParameters
 * taken from an export TaskConfig.
 * @return {!ee.api.ExportVideoRequest}
 */
ee.rpc_convert_batch.taskToExportVideoRequest = function(params) {
  if (params['element'] == null) {
    throw new Error(`"element" not found in params ${params}`);
  }
  const result = new ee.api.ExportVideoRequest({
    expression: ee.Serializer.encodeCloudApiExpression(params['element']),
    description: stringOrNull_(params['description']),
    videoOptions: ee.rpc_convert_batch.buildVideoOptions_(params),
    fileExportOptions: null,
    requestId: stringOrNull_(params['id']),
    priority: numberOrNull_(params['priority']),
  });

  const destination = ee.rpc_convert_batch.guessDestination_(params);
  result.fileExportOptions =
      ee.rpc_convert_batch.buildVideoFileExportOptions_(params, destination);
  return result;
};


/**
 * Converts a legacy ExportParameters into a Cloud API ExportMapRequest.
 *
 * @param {!Object} params A parameter list representing a ExportParameters
 * taken from an export TaskConfig.
 * @return {!ee.api.ExportMapRequest}
 */
ee.rpc_convert_batch.taskToExportMapRequest = function(params) {
  if (params['element'] == null) {
    throw new Error(`"element" not found in params ${params}`);
  }
  return new ee.api.ExportMapRequest({
    expression: ee.Serializer.encodeCloudApiExpression(params['element']),
    description: stringOrNull_(params['description']),
    tileOptions: ee.rpc_convert_batch.buildTileOptions_(params),
    tileExportOptions: ee.rpc_convert_batch.buildImageFileExportOptions_(
        // Only Export to cloud storage is allow currently.
        params, ee.rpc_convert_batch.ExportDestination.GCS),
    requestId: stringOrNull_(params['id']),
    priority: numberOrNull_(params['priority']),
  });
};


/**
 * Converts a legacy ExportParameters into a Cloud API ExportVideoMapRequest.
 *
 * @param {!Object} params A parameter list representing a ExportParameters
 * taken from an export TaskConfig.
 * @return {!ee.api.ExportVideoMapRequest}
 */
ee.rpc_convert_batch.taskToExportVideoMapRequest = function(params) {
  if (params['element'] == null) {
    throw new Error(`"element" not found in params ${params}`);
  }
  return new ee.api.ExportVideoMapRequest({
    expression: ee.Serializer.encodeCloudApiExpression(params['element']),
    description: stringOrNull_(params['description']),
    videoOptions: ee.rpc_convert_batch.buildVideoMapOptions_(params),
    tileOptions: ee.rpc_convert_batch.buildTileOptions_(params),
    tileExportOptions: ee.rpc_convert_batch.buildVideoFileExportOptions_(
        params, ee.rpc_convert_batch.ExportDestination.GCS),
    requestId: stringOrNull_(params['id']),
    version: stringOrNull_(params['version']),
    priority: numberOrNull_(params['priority']),
  });
};

/**
 * Converts a legacy ExportParameters into a Cloud API ExportClassifierRequest.
 *
 * @param {!Object} params A parameter list representing a ExportParameters
 * taken from an export TaskConfig.
 * @return {!ee.api.ExportClassifierRequest}
 */
ee.rpc_convert_batch.taskToExportClassifierRequest = function(params) {
  if (params['element'] == null) {
    throw new Error(`"element" not found in params ${params}`);
  }
  const destination = ee.rpc_convert_batch.guessDestination_(params);
  if (destination != ee.rpc_convert_batch.ExportDestination.ASSET) {
    throw new Error(`Export destination "${destination}" unknown`);
  }
  return new ee.api.ExportClassifierRequest({
    expression: ee.Serializer.encodeCloudApiExpression(params['element']),
    description: stringOrNull_(params['description']),
    requestId: stringOrNull_(params['id']),
    assetExportOptions: new ee.api.ClassifierAssetExportOptions({
      earthEngineDestination:
          ee.rpc_convert_batch.buildEarthEngineDestination_(params)
    }),
    priority: numberOrNull_(params['priority']),
  });
};


/**
 * @param {*} value
 * @return {string|null}
 * @private
 */
function stringOrNull_(value) {
  if (value != null) {
    return String(value);
  }
  return null;
}


/**
 * @param {*} value
 * @return {number|null}
 * @private
 */
function numberOrNull_(value) {
  if (value != null) {
    return Number(value);
  }
  return null;
}


/**
 * @param {*} value
 * @return {!ee.api.Number|null}
 * @private
 */
function noDataOrNull_(value) {
  if (value != null) {
    return new ee.api.Number({floatValue: Number(value)});
  }
  return null;
}


/**
 * Guesses an export destination from the ExportParameters object.
 * @param {?Object|undefined} params ExportParameters
 * @return {string}
 * @private
 * #visibleForTesting
 */
ee.rpc_convert_batch.guessDestination_ = function(params) {
  let destination = ee.rpc_convert_batch.ExportDestination.DRIVE;
  // Default destination if no params are present.
  if (params == null) {
    return destination;
  }
  if ((params['outputBucket'] != null || params['outputPrefix'] != null)) {
    destination = ee.rpc_convert_batch.ExportDestination.GCS;
  } else if (params['assetId'] != null) {
    destination = ee.rpc_convert_batch.ExportDestination.ASSET;
  } else if (params['mapName'] != null) {
    destination = ee.rpc_convert_batch.ExportDestination.FEATURE_VIEW;
  }
  if (params['table'] != null) {
    destination = ee.rpc_convert_batch.ExportDestination.BIGQUERY;
  }
  return destination;
};


/**
 * @param {!Object} params An ExportParameters parameter list
 *     which contains format-specific prefix options.
 * @return {!ee.api.GeoTiffImageExportOptions}
 * @private
 */
ee.rpc_convert_batch.buildGeoTiffFormatOptions_ = function(params) {
  if (params['fileDimensions'] && params['tiffFileDimensions']) {
    throw new Error(
        'Export cannot set both "fileDimensions" and "tiffFileDimensions".');
  }
  const fileDimensions =
      params['fileDimensions'] || params['tiffFileDimensions'];
  const tileSize = params['tiffShardSize'] || params['shardSize'];
  return new ee.api.GeoTiffImageExportOptions({
    cloudOptimized: Boolean(params['tiffCloudOptimized']),
    // The ee.data.ImageTaskConfig has the top-level option
    // "skipEmptyTiles" when it really should be "tiffSkipEmptyFiles".
    // Let's just accept both until the param in Export.image is renamed.
    skipEmptyFiles:
        Boolean(params['skipEmptyTiles'] || params['tiffSkipEmptyFiles']),
    tileDimensions: ee.rpc_convert_batch.buildGridDimensions_(fileDimensions),
    tileSize: numberOrNull_(tileSize),
    noData: noDataOrNull_(params['tiffNoData']),
  });
};


/**
 * @param {!Object} params An ExportParameters parameter list
 *     which contains format-specific prefix options.
 * @return {!ee.api.TfRecordImageExportOptions}
 * @private
 */
ee.rpc_convert_batch.buildTfRecordFormatOptions_ = function(params) {
  const tfRecordOptions = new ee.api.TfRecordImageExportOptions({
    compress: Boolean(params['tfrecordCompressed']),
    maxSizeBytes: stringOrNull_(params['tfrecordMaxFileSize']),
    sequenceData: Boolean(params['tfrecordSequenceData']),
    collapseBands: Boolean(params['tfrecordCollapseBands']),
    maxMaskedRatio: numberOrNull_(params['tfrecordMaskedThreshold']),
    defaultValue: numberOrNull_(params['tfrecordDefaultValue']),
    tileDimensions: ee.rpc_convert_batch.buildGridDimensions_(
        params['tfrecordPatchDimensions']),
    marginDimensions:
        ee.rpc_convert_batch.buildGridDimensions_(params['tfrecordKernelSize']),
    tensorDepths: null,
  });
  /* Tensor depths is tricky since the old api supported a flat array
   * whereas the new api expects a map.  Do a check at runtime to
   * make sure that the map (or flat array) has numbers for all it's values.
   */
  const tensorDepths = params['tfrecordTensorDepths'];
  if (tensorDepths != null) {
    if (goog.isObject(tensorDepths)) {
      const result = {};
      const addTensorDepthsOption = (v, k) => {
        if (typeof k !== 'string' || typeof v !== 'number') {
          throw new Error(
              '"tensorDepths" option must be an object of' +
              ' type Object<string, number>');
        }
        result[k] = v;
      };
      goog.object.forEach(tensorDepths, addTensorDepthsOption);
      tfRecordOptions.tensorDepths = result;
    } else {
      throw new Error(
          '"tensorDepths" option needs to have the form' +
          ' Object<string, number>.');
    }
  }
  return tfRecordOptions;
};


/**
 * Returns an ImageFileExportOptions built from ExportParameters.
 *
 * @param {!Object} params
 * @param {string} destination
 * @return {!ee.api.ImageFileExportOptions}
 * @private
 * #visibleForTesting
 */
ee.rpc_convert_batch.buildImageFileExportOptions_ = function(
    params, destination) {
  const result = new ee.api.ImageFileExportOptions({
    cloudStorageDestination: null,
    driveDestination: null,
    geoTiffOptions: null,
    tfRecordOptions: null,
    fileFormat: ee.rpc_convert.fileFormat(params['fileFormat']),
  });

  // If there are format-specific options pull them into the file options.
  if (result.fileFormat === 'GEO_TIFF') {
    result.geoTiffOptions =
        ee.rpc_convert_batch.buildGeoTiffFormatOptions_(params);
  } else if (result.fileFormat === 'TF_RECORD_IMAGE') {
    result.tfRecordOptions =
        ee.rpc_convert_batch.buildTfRecordFormatOptions_(params);
  }

  if (destination === ee.rpc_convert_batch.ExportDestination.GCS) {
    result.cloudStorageDestination =
        ee.rpc_convert_batch.buildCloudStorageDestination_(params);
    // Drive is default.
  } else {
    result.driveDestination =
        ee.rpc_convert_batch.buildDriveDestination_(params);
  }
  return result;
};


/**
 * Returns a ImageAssetExportOptions built from the original task config.
 *
 * @param {!Object} params An ExportParameters parameter list
 *     which contains format-specific prefix options.
 * @return {!ee.api.ImageAssetExportOptions}
 * @private
 */
ee.rpc_convert_batch.buildImageAssetExportOptions_ = function(params) {
  let allPolicies = params['pyramidingPolicy'] || {};
  try {
    // The Code Editor passes a legacy JSON encoding.
    allPolicies = /** @type {?} */ (JSON.parse(allPolicies));
  } catch {
  }
  let defaultPyramidingPolicy = 'PYRAMIDING_POLICY_UNSPECIFIED';
  if (typeof allPolicies === 'string') {
    defaultPyramidingPolicy = allPolicies;
    allPolicies = {};
  } else if (allPolicies['.default']) {
    defaultPyramidingPolicy = allPolicies['.default'];
    delete allPolicies['.default'];
  }
  return new ee.api.ImageAssetExportOptions({
    earthEngineDestination:
        ee.rpc_convert_batch.buildEarthEngineDestination_(params),
    pyramidingPolicy: defaultPyramidingPolicy,
    pyramidingPolicyOverrides: goog.object.isEmpty(allPolicies) ? null :
                                                                  allPolicies,
    tileSize: numberOrNull_(params['shardSize']),
  });
};


/**
 * Returns a TableFileExportOptions built from ExportParameters.
 *
 * @param {!Object} params
 * @param {string} destination
 * @return {!ee.api.TableFileExportOptions}
 * @private
 */
ee.rpc_convert_batch.buildTableFileExportOptions_ = function(
    params, destination) {
  const result = new ee.api.TableFileExportOptions({
    cloudStorageDestination: null,
    driveDestination: null,
    fileFormat: ee.rpc_convert.tableFileFormat(params['fileFormat']),
  });

  if (destination === ee.rpc_convert_batch.ExportDestination.GCS) {
    result.cloudStorageDestination =
        ee.rpc_convert_batch.buildCloudStorageDestination_(params);
    // Drive is default.
  } else {
    result.driveDestination =
        ee.rpc_convert_batch.buildDriveDestination_(params);
  }
  return result;
};


/**
 * Returns a TableAssetExportOptions built from the original task config.
 *
 * @param {!Object} params An ExportParameters parameter list
 *     which contains format-specific prefix options.
 * @return {!ee.api.TableAssetExportOptions}
 * @private
 */
ee.rpc_convert_batch.buildTableAssetExportOptions_ = function(params) {
  return new ee.api.TableAssetExportOptions({
    earthEngineDestination:
        ee.rpc_convert_batch.buildEarthEngineDestination_(params)
  });
};


/**
 * Returns a FeatureViewExportOptions built from ExportParameters.
 *
 * @param {!Object} params
 * @return {!ee.api.FeatureViewAssetExportOptions}
 * @private
 */
ee.rpc_convert_batch.buildFeatureViewExportOptions_ = function(params) {
  return new ee.api.FeatureViewAssetExportOptions({
    featureViewDestination:
        ee.rpc_convert_batch.buildFeatureViewDestination_(params),
    ingestionTimeParameters:
        ee.rpc_convert_batch.buildFeatureViewIngestionTimeParameters_(params),
  });
};

/**
 * Returns BigQueryExportOptions built from ExportParameters.
 *
 * @param {!Object} params
 * @return {!ee.api.BigQueryExportOptions}
 * @private
 */
ee.rpc_convert_batch.buildBigQueryExportOptions_ = function(params) {
  return new ee.api.BigQueryExportOptions({
    // `bigquery_destination` from the API is translated to
    // `bigqueryDestination` in the JavaScript.
    bigqueryDestination: ee.rpc_convert_batch.buildBigQueryDestination_(params),
  });
};


/**
 * Returns a VideoFileExportOptions built from ExportParameters.
 *
 * @param {!Object} params
 * @param {string} destination
 * @return {!ee.api.VideoFileExportOptions}
 * @private
 */
ee.rpc_convert_batch.buildVideoFileExportOptions_ = function(
    params, destination) {
  const result = new ee.api.VideoFileExportOptions({
    cloudStorageDestination: null,
    driveDestination: null,
    // Currently MP4 is the only supported video format.
    fileFormat: 'MP4',
  });

  if (destination === ee.rpc_convert_batch.ExportDestination.GCS) {
    result.cloudStorageDestination =
        ee.rpc_convert_batch.buildCloudStorageDestination_(params);
  } else {
    result.driveDestination =
        ee.rpc_convert_batch.buildDriveDestination_(params);
  }
  return result;
};

/**
 * Returns a VideoOptions built from ExportParameters.
 * @param {!Object} params
 * @return {!ee.api.VideoOptions}
 * @private
 */
ee.rpc_convert_batch.buildVideoOptions_ = function(params) {
  return new ee.api.VideoOptions({
    framesPerSecond: numberOrNull_(params['framesPerSecond']),
    maxFrames: numberOrNull_(params['maxFrames']),
    maxPixelsPerFrame: stringOrNull_(params['maxPixels']),
  });
};


/**
 * Returns a VideoOptions built from ExportParameters suitable for video map
 * exports.
 * @param {!Object} params
 * @return {!ee.api.VideoOptions}
 * @private
 */
ee.rpc_convert_batch.buildVideoMapOptions_ = function(params) {
  return new ee.api.VideoOptions({
    framesPerSecond: numberOrNull_(params['framesPerSecond']),
    maxFrames: numberOrNull_(params['maxFrames']),
    maxPixelsPerFrame: null,
  });
};


/**
 * Returns a TileOptions built from ExportParameters.
 * @param {!Object} params
 * @return {!ee.api.TileOptions}
 * @private
 */
ee.rpc_convert_batch.buildTileOptions_ = function(params) {
  return new ee.api.TileOptions({
    endZoom: numberOrNull_(params['endZoom'] ?? params['maxZoom']),
    startZoom: numberOrNull_(params['startZoom'] ?? params['minZoom']),
    scale: numberOrNull_(params['scale']),
    skipEmpty: Boolean(params['skipEmpty'] ?? params['skipEmptyTiles']),
    mapsApiKey: stringOrNull_(params['mapsApiKey']),
    dimensions: ee.rpc_convert_batch.buildGridDimensions_(
        params['dimensions'] ?? params['tileDimensions']),
    stride: numberOrNull_(params['stride']),
    zoomSubset: ee.rpc_convert_batch.buildZoomSubset_(
        numberOrNull_(params['minTimeMachineZoomSubset']),
        numberOrNull_(params['maxTimeMachineZoomSubset'])),
  });
};


/**
 * Returns a ZoomSubset created from an object, or possibly null if no subset
 * parameters are provided.
 *
 * @param {number|null} start
 * @param {number|null} end
 * @return {?ee.api.ZoomSubset}
 * @private
 */
ee.rpc_convert_batch.buildZoomSubset_ = function(start, end) {
  if (start == null && end == null) {
    return null;
  }
  return new ee.api.ZoomSubset({start: start ?? 0, end});
};


/**
 * Returns a GridDimensions created from an array, string or object, or possibly
 * null if no dimensions are provided.
 *
 * @param {number|string|!Array<number>|!Object<string, number>|undefined}
 *     dimensions
 * @return {?ee.api.GridDimensions}
 * @private
 */
ee.rpc_convert_batch.buildGridDimensions_ = function(dimensions) {
  if (dimensions == null) {
    return null;
  }
  const result = new ee.api.GridDimensions({height: 0, width: 0});
  if (typeof dimensions === 'string') {
    if (dimensions.indexOf('x') !== -1) {
      dimensions = dimensions.split('x').map(Number);
    } else if (dimensions.indexOf(',') !== -1) {
      dimensions = dimensions.split(',').map(Number);
    }
  }
  if (Array.isArray(dimensions)) {
    if (dimensions.length === 2) {
      result.height = dimensions[0];
      result.width = dimensions[1];
    } else if (dimensions.length === 1) {
      result.height = dimensions[0];
      result.width = dimensions[0];
    } else {
      throw new Error(
          `Unable to construct grid from dimensions: ${dimensions}`);
    }
  } else if (typeof dimensions === 'number' && !isNaN(dimensions)) {
    result.height = dimensions;
    result.width = dimensions;
  } else if (
      goog.isObject(dimensions) && dimensions['height'] != null &&
      dimensions['width'] != null) {
    result.height = dimensions['height'];
    result.width = dimensions['width'];
  } else {
    throw new Error(`Unable to construct grid from dimensions: ${dimensions}`);
  }
  return result;
};


/**
 * @param {!Object} params
 * @return {!ee.api.CloudStorageDestination}
 * @private
 */
ee.rpc_convert_batch.buildCloudStorageDestination_ = function(params) {
  let permissions = null;
  if (params['writePublicTiles'] != null) {
    permissions = params['writePublicTiles'] ? 'PUBLIC' : 'DEFAULT_OBJECT_ACL';
  }
  return new ee.api.CloudStorageDestination({
    bucket: stringOrNull_(params['outputBucket']),
    filenamePrefix: stringOrNull_(params['outputPrefix']),
    bucketCorsUris: params['bucketCorsUris'] || null,
    permissions: permissions,
  });
};


/**
 * @param {!Object} params An ExportParameters parameter list.
 * @return {!ee.api.DriveDestination}
 * @private
 */
ee.rpc_convert_batch.buildDriveDestination_ = function(params) {
  return new ee.api.DriveDestination({
    folder: stringOrNull_(params['driveFolder']),
    filenamePrefix: stringOrNull_(params['driveFileNamePrefix']),
  });
};


/**
 * @param {!Object} params  An ExportParameters parameter list.
 * @return {!ee.api.EarthEngineDestination}
 * @private
 */
ee.rpc_convert_batch.buildEarthEngineDestination_ = function(params) {
  return new ee.api.EarthEngineDestination(
      {name: ee.rpc_convert.assetIdToAssetName(params['assetId'])});
};


/**
 * @param {!Object} params A FeatureViewDestination parameter list.
 * @return {!ee.api.FeatureViewDestination}
 * @private
 */
ee.rpc_convert_batch.buildFeatureViewDestination_ = function(params) {
  return new ee.api.FeatureViewDestination(
      {name: ee.rpc_convert.assetIdToAssetName(params['mapName'])});
};

/**
 * @param {!Object} params A BigQueryDestination parameter list.
 * @return {!ee.api.BigQueryDestination}
 * @private
 */
ee.rpc_convert_batch.buildBigQueryDestination_ = function(params) {
  return new ee.api.BigQueryDestination({
    table: stringOrNull_(params['table']),
    overwrite: Boolean(params['overwrite']),
    append: Boolean(params['append']),
  });
};

/**
 * @param {?Object} params An ExportParameters parameter list.
 * @return {?ee.api.FeatureViewIngestionTimeParameters}
 * @private
 */
ee.rpc_convert_batch.buildFeatureViewIngestionTimeParameters_ = function(
    params) {
  return new ee.api.FeatureViewIngestionTimeParameters({
    thinningOptions: ee.rpc_convert_batch.buildThinningOptions_(params),
    rankingOptions: ee.rpc_convert_batch.buildRankingOptions_(params)
  });
};

/**
 * @param {?Object} params ExportParameters parameters list.
 * @return {?ee.api.ThinningOptions}
 * @private
 */
ee.rpc_convert_batch.buildThinningOptions_ = function(params) {
  if (params == null) {
    return null;
  }
  return new ee.api.ThinningOptions({
    maxFeaturesPerTile: numberOrNull_(params['maxFeaturesPerTile']),
    thinningStrategy: params['thinningStrategy']
  });
};

/**
 * @param {?Object} params ExportParameters parameters list.
 * @return {?ee.api.RankingOptions}
 * @private
 */
ee.rpc_convert_batch.buildRankingOptions_ = function(params) {
  if (params == null) {
    return null;
  }
  return new ee.api.RankingOptions({
    zOrderRankingRule:
        ee.rpc_convert_batch.buildRankingRule_(params['zOrderRanking']),
    thinningRankingRule:
        ee.rpc_convert_batch.buildRankingRule_(params['thinningRanking']),
  });
};

/**
 * @param {*} rules Ranking rules expressed as either one string or a list of
 *     rule strings.
 * @return {?ee.api.RankingRule}
 * @private
 */
ee.rpc_convert_batch.buildRankingRule_ = function(rules) {
  if (!rules) {
    return null;
  }
  const originalRules = rules;
  if (typeof rules === 'string') {
    rules = rules.split(',');
  }
  if (Array.isArray(rules)) {
    return new ee.api.RankingRule({
      rankByOneThingRule:
          (rules || []).map(ee.rpc_convert_batch.buildRankByOneThingRule_),
    });
  } else {
    throw new Error(`Unable to build ranking rule from rules: ${
        JSON.stringify(
            originalRules)}. Rules should either be a comma-separated string or list of strings.`);
  }
};

/**
 * @param {?string} ruleString String representing a RankByOneThingRule.
 * @return {!ee.api.RankByOneThingRule}
 * @private
 */
ee.rpc_convert_batch.buildRankByOneThingRule_ = function(ruleString) {
  const rankByOneThingRule = new ee.api.RankByOneThingRule({
    direction: null,
    rankByAttributeRule: null,
    rankByMinZoomLevelRule: null,
    rankByGeometryTypeRule: null,
  });

  // Parse rule string. Input is expected in the string format:
  // `attr_name ASC, .minZoomLevel DESC, .geometryType ASC`
  // or as a list of strings:
  // ["attr_name ASC", ".pixelSize DESC", ".geometryType ASC"].
  // Rules that do not start with the keywords ".minZoomLevel" or
  // ".geometryType" are assumed to be attribute rules.
  ruleString = ruleString.trim();
  const matches = ruleString.match(/^([\S]+.*)\s+(ASC|DESC)$/);
  if (matches == null) {
    throw new Error(
        'Ranking rule format is invalid. Each rule should be defined by a rule type and a direction (ASC or DESC), separated by a space. Valid rule types are: .geometryType, .minZoomLevel, or a feature property name.');
  }
  const [, ruleType, direction] = matches;
  switch (direction.toUpperCase()) {
    case 'ASC':
      rankByOneThingRule.direction = 'ASCENDING';
      break;
    case 'DESC':
      rankByOneThingRule.direction = 'DESCENDING';
      break;
    default:
      throw new Error(`Ranking rule direction '${
          direction}' is invalid. Directions are: ASC, DESC.`);
  }
  switch (ruleType.trim()) {
    case '.geometryType':
      rankByOneThingRule.rankByGeometryTypeRule =
          new ee.api.RankByGeometryTypeRule({});
      break;
    case '.minZoomLevel':
      rankByOneThingRule.rankByMinZoomLevelRule =
          new ee.api.RankByMinZoomLevelRule({});
      break;
    default:
      rankByOneThingRule.rankByAttributeRule = new ee.api.RankByAttributeRule(
          {attributeName: stringOrNull_(ruleType)});
  }
  return rankByOneThingRule;
};
