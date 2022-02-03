/**
 * @fileoverview An interface implemented by serializable objects.
 */

goog.provide('ee.Encodable');
goog.provide('ee.rpc_convert');
goog.provide('ee.rpc_node');

goog.require('ee.api');
goog.require('ee.apiclient');
goog.require('goog.array');



/**
 * An interface implemented by objects that know how to serialize themselves.
 * Not an actual Closure interface because we need instanceof to work.
 * @constructor
 */
ee.Encodable = function() {};


/**
 * Encodes an object in a format compatible with ee.Serializer.encode().
 * @param {function(*): *} encoder A function that can be called to encode
 *    the components of an object.
 * @return {*} The encoded form of the object.
 */
ee.Encodable.prototype.encode = goog.abstractMethod;

/**
 * Defines the serializer behavior needed by encodeCloudValue.
 * @typedef {{
 *     makeReference: function(*):string, unboundName:(string|undefined)}}
 */
ee.Encodable.Serializer;

/**
 * Encodes an object in a format compatible with ee.Serializer.encodeCloudApi().
 * @param {!ee.Encodable.Serializer}
 *    serializer An object that can be used to encode a serializable object.
 * @return {!ee.api.ValueNode} The encoded object.
 */
ee.Encodable.prototype.encodeCloudValue = goog.abstractMethod;


/**
 * Holds utility functions to build javascript protocol buffer objects.
 */
ee.rpc_node = {};

/**
 * @param {*} obj
 * @return {!ee.api.ValueNode} constructed proto object.
 */
ee.rpc_node.constant = function(obj) {
  if (obj === undefined || obj === null) {
    obj = ee.apiclient.NULL_VALUE;
  }
  return new ee.api.ValueNode({constantValue: obj});
};

/**
 * @param {string} ref
 * @return {!ee.api.ValueNode} constructed proto object.
 */
ee.rpc_node.reference = function(ref) {
  return new ee.api.ValueNode({valueReference: ref});
};

/**
 * @param {!Array<!ee.api.ValueNode>} values
 * @return {!ee.api.ValueNode} constructed proto object.
 */
ee.rpc_node.array = function(values) {
  return new ee.api.ValueNode({arrayValue: new ee.api.ArrayValue({values})});
};

/**
 * @param {!Object<string, !ee.api.ValueNode>} values
 * @return {!ee.api.ValueNode} constructed proto object.
 */
ee.rpc_node.dictionary = function(values) {
  return new ee.api.ValueNode(
      {dictionaryValue: new ee.api.DictionaryValue({values})});
};


/**
 * @param {string} name
 * @param {!Object<string, !ee.api.ValueNode>} args
 * @return {!ee.api.ValueNode} constructed proto object.
 */
ee.rpc_node.functionByName = function(name, args) {
  return new ee.api.ValueNode(
      {functionInvocationValue: new ee.api.FunctionInvocation(
           {functionName: name, arguments: args})});
};

/**
 * @param {string} ref
 * @param {!Object<string, !ee.api.ValueNode>} args
 * @return {!ee.api.ValueNode} constructed proto object.
 */
ee.rpc_node.functionByReference = function(ref, args) {
  return new ee.api.ValueNode(
      {functionInvocationValue: new ee.api.FunctionInvocation(
           {functionReference: ref, arguments: args})});
};

/**
 * @param {!Array<string>} argumentNames
 * @param {string} body
 * @return {!ee.api.ValueNode} constructed proto object.
 */
ee.rpc_node.functionDefinition = function(argumentNames, body) {
  return new ee.api.ValueNode(
      {functionDefinitionValue: new ee.api.FunctionDefinition(
           {argumentNames, body})});
};

/**
 * @param {string} ref
 * @return {!ee.api.ValueNode} constructed proto object.
 */
ee.rpc_node.argumentReference = function(ref) {
  return new ee.api.ValueNode({argumentReference: ref});
};



/** Namespace to hold value conversion methods for the Cloud API calls. */
ee.rpc_convert = {};


/**
 * @param {string|undefined} format
 * @return {string}
 */
ee.rpc_convert.fileFormat = function(format) {
  if (!format) {
    return 'AUTO_JPEG_PNG';
  }
  const upper = format.toUpperCase();
  switch (upper) {
    case 'JPG':
      return 'JPEG';
    case 'AUTO':
      return 'AUTO_JPEG_PNG';
    case 'TIF':
    case 'TIFF':
    case 'GEOTIF':
    case 'GEOTIFF':
      return 'GEO_TIFF';
    case 'TF_RECORD':
    case 'TFRECORD':
      return 'TF_RECORD_IMAGE';
    case 'NUMPY':
      return 'NPY';
    case 'ZIPPED_TIF':
    case 'ZIPPED_TIFF':
    case 'ZIPPED_GEOTIF':
    case 'ZIPPED_GEOTIFF':
      return 'ZIPPED_GEO_TIFF';
    case 'ZIPPED_TIF_PER_BAND':
    case 'ZIPPED_TIFF_PER_BAND':
    case 'ZIPPED_GEOTIF_PER_BAND':
    case 'ZIPPED_GEOTIFF_PER_BAND':
      return 'ZIPPED_GEO_TIFF_PER_BAND';
    // It might be some other supported format. Let the server validate it.
    default: return upper;
  }
};


/**
 * @param {string|undefined} format
 * @return {string}
 */
ee.rpc_convert.tableFileFormat = function(format) {
  if (!format) {
    return 'CSV';
  }
  const upper = format.toUpperCase();
  switch (upper) {
    case 'TF_RECORD':
    case 'TFRECORD':
      return 'TF_RECORD_TABLE';
    case 'JSON':
    case 'GEOJSON':
      return 'GEO_JSON';
    // It might be some other supported format. Let the server validate it.
    default:
      return upper;
  }
};


/**
 * @param {string|undefined} orientation
 * @return {string}
 */
ee.rpc_convert.orientation = function(orientation) {
  if (!orientation) {
    return 'VERTICAL';
  }
  const upper = orientation.toUpperCase();
  if (upper !== 'HORIZONTAL' || upper !== 'VERTICAL') {
    throw new Error('Orientation must be "horizontal" or "vertical"');
  }
  return upper;
};


/**
 * @param {*} bands
 * @return {!Array}
 */
ee.rpc_convert.bandList = function(bands) {
  if (!bands) {
    return [];
  }
  if (typeof bands === 'string') {
    return bands.split(',');
  }
  if (Array.isArray(bands)) {
    return bands;
  }
  throw new Error('Invalid band list ' + bands);
};


/**
 * @param {!Object} params
 * @return {?ee.api.VisualizationOptions}
 */
ee.rpc_convert.visualizationOptions = function(params) {
  const result = new ee.api.VisualizationOptions();
  let hasResult = false;
  if ('palette' in params) {
    const pal = params['palette'];
    result.paletteColors = (typeof pal === 'string') ? pal.split(',') : pal;
    hasResult = true;
  }
  let ranges = [];
  if ('gain' in params || 'bias' in params) {
    if ('min' in params || 'max' in params) {
      throw new Error('Gain and bias can\'t be specified with min and max');
    }
    // Convert to min & max for the Cloud API.
    const valueRange =
        result.paletteColors ? result.paletteColors.length - 1 : 255;
    ranges = ee.rpc_convert.pairedValues(params, 'bias', 'gain').map(pair => {
        const min = -pair['bias'] / pair['gain'];
        return {'min': min, 'max': valueRange / pair['gain'] + min };
    });
  } else if ('min' in params || 'max' in params) {
    ranges = ee.rpc_convert.pairedValues(params, 'min', 'max');
  }
  if (ranges.length !== 0) {
    result.ranges = ranges.map(range => new ee.api.DoubleRange(range));
    hasResult = true;
  }
  const gammas = ee.rpc_convert.csvToNumbers(params['gamma']);
  if (gammas.length > 1) {
    throw new Error('Only one gamma value is supported');
  } else if (gammas.length === 1) {
    result.gamma = gammas[0];
    hasResult = true;
  }
  return hasResult ? result : null;
};


/**
 * @param {string|undefined} csv
 * @return {!Array<number>}
 */
ee.rpc_convert.csvToNumbers = function(csv) {
  if (!csv) {
    return [];
  }
  return csv.split(',').map(Number);
};


/**
 * Converts the `a` and `b` fields of obj to arrays of numbers, and returns an
 * array of pairs of numbers.  It is an error if the arrays are different
 * lengths, but if either field is missing or empty, it is populated with
 * default values of 0 and 1 for a and b respectively.
 * @param {!Object} obj
 * @param {string} a
 * @param {string} b
 * @return {!Array<!Object<string, number>>} Objects have `a` and `b` members.
 */
ee.rpc_convert.pairedValues = function(obj, a, b) {
  let aValues = ee.rpc_convert.csvToNumbers(obj[a]);
  let bValues = ee.rpc_convert.csvToNumbers(obj[b]);
  if (aValues.length === 0) {
    return bValues.map(value => ({[a]: 0, [b]: value}));
  } else if (bValues.length === 0) {
    return aValues.map(value => ({[a]: value, [b]: 1}));
  } else if (aValues.length !== bValues.length) {
    throw new Error('Length of ' + a + ' and ' + b + ' must match.');
  }
  return aValues.map((value, index) => ({[a]: value, [b]: bValues[index]}));
};


/**
 * Converts a ListAlgorithmsResponse to the internal format.
 *
 * The internal code expects an object mapping each algorithm's name to an
 * object containing:
 * - description: string
 * - returns: string
 * - args: list of objects, each containing
 *   - name: argument name
 *   - type: argument type
 *   - description: argument description (optional)
 *   - optional: bool (optional)
 *   - default: default value (optional)
 * - hidden: bool (optional)
 * - preview: bool (optional)
 * - deprecated: string containing deprecation reason (optional)
 * - sourceCodeUri: string (optional)
 *
 * @param {!ee.api.ListAlgorithmsResponse} result
 * @return {!Object}
 */
ee.rpc_convert.algorithms = function(result) {
  const convertArgument = (argument) => {
    const internalArgument = {};
    internalArgument['description'] = argument.description || '';
    internalArgument['type'] = argument.type || '';
    if (argument.argumentName != null) {
      internalArgument['name'] = argument.argumentName;
    }
    if (argument.defaultValue !== undefined) {
      internalArgument['default'] = argument.defaultValue;
    }
    if (argument.optional != null) {
      internalArgument['optional'] = argument.optional;
    }
    return internalArgument;
  };
  const convertAlgorithm = (algorithm) => {
    const internalAlgorithm = {};
    internalAlgorithm['args'] =
        (algorithm.arguments || []).map(convertArgument);
    internalAlgorithm['description'] = algorithm.description || '';
    internalAlgorithm['returns'] = algorithm.returnType || '';
    if (algorithm.hidden != null) {
      internalAlgorithm['hidden'] = algorithm.hidden;
    }
    if (algorithm.preview) {
      internalAlgorithm['preview'] = algorithm.preview;
    }
    if (algorithm.deprecated) {
      internalAlgorithm['deprecated'] = algorithm.deprecationReason;
    }
    if (algorithm.sourceCodeUri) {
      internalAlgorithm['sourceCodeUri'] = algorithm.sourceCodeUri;
    }
    return internalAlgorithm;
  };
  const internalAlgorithms = {};
  for (const algorithm of result.algorithms || []) {
    const name = algorithm.name.replace(/^algorithms\//, '');
    internalAlgorithms[name] = convertAlgorithm(algorithm);
  }
  return internalAlgorithms;
};

/** @const {string}  */
ee.rpc_convert.DEFAULT_PROJECT = 'earthengine-legacy';

/** @const {string}  */
ee.rpc_convert.PUBLIC_PROJECT = 'earthengine-public';
/**
 * @const {!RegExp} Matches a Cloud project ID in an asset path of the form
 * "projects/PROJECT/...". Returns matching group $1 for the project ID.
 * /\w+(?:[\w\-]+\.[\w\-]+)*?\.\w+\:/ matches a Dasher/Cloud org prefix.
 * /[a-z][a-z0-9\-]{4,28}[a-z0-9]/ matches a valid Cloud project ID.
 */
ee.rpc_convert.PROJECT_ID_RE =
    /^projects\/((?:\w+(?:[\w\-]+\.[\w\-]+)*?\.\w+\:)?[a-z][a-z0-9\-]{4,28}[a-z0-9])\/.+/;

/**
 * @const {!RegExp} Matches a Cloud asset ID in an asset path of the form
 * "projects/PROJECT/assets/(path)". Returns matching group $1 for the project
 * ID and $2 for the asset path.
 */
ee.rpc_convert.CLOUD_ASSET_ID_RE =
    /^projects\/((?:\w+(?:[\w\-]+\.[\w\-]+)*?\.\w+\:)?[a-z][a-z0-9\-]{4,28}[a-z0-9])\/assets\/(.*)$/;

/**
 * @const {!RegExp} Matches a Cloud asset root path of the form
 * "projects/PROJECT/assets/?". Returns matching group $1 for the project ID.
 */
ee.rpc_convert.CLOUD_ASSET_ROOT_RE =
    /^projects\/((?:\w+(?:[\w\-]+\.[\w\-]+)*?\.\w+\:)?[a-z][a-z0-9\-]{4,28}[a-z0-9])\/assets\/?$/;


/**
 * @param {string} path Resource path potentially containing a project ID.
 * @return {string} The project ID to use for the given path.
 */
ee.rpc_convert.projectIdFromPath = function(path) {
  const matches = ee.rpc_convert.PROJECT_ID_RE.exec(path);
  if (matches) {
    return matches[1];
  }
  // Default project for users without a Cloud project.
  return ee.rpc_convert.DEFAULT_PROJECT;
};


/**
 * @param {string} path Resource path potentially containing a project ID.
 * @return {string} The project root ID to use for the given path.
 */
ee.rpc_convert.projectParentFromPath = function(path) {
  return 'projects/' + ee.rpc_convert.projectIdFromPath(path);
};


/**
 * @param {string} param The asset ID.
 * @return {string} The full asset name.
 */
ee.rpc_convert.assetIdToAssetName = function(param) {
  if (ee.rpc_convert.CLOUD_ASSET_ID_RE.exec(param)) {
    return param;
  } else if (/^(users|projects)\/.*/.exec(param)) {
    return `projects/${ee.rpc_convert.DEFAULT_PROJECT}/assets/${param}`;
  } else {
    return `projects/${ee.rpc_convert.PUBLIC_PROJECT}/assets/${param}`;
  }
};


/**
 * Returns the asset ID without the 'projects/PROJECT/assets/' prefix. If
 * `name` is not in this form or PROJECT is the default or public project,
 * it is returned unmodified.
 * @param {string} name asset name
 * @return {string} asset id
 */
ee.rpc_convert.assetNameToAssetId = function(name) {
  const parts = name.split('/');
  const isLegacyProject =
      (id) => [ee.rpc_convert.DEFAULT_PROJECT, ee.rpc_convert.PUBLIC_PROJECT]
                  .includes(id);
  if (parts[0] === 'projects' && parts[2] === 'assets' &&
      isLegacyProject(parts[1])) {
    return parts.slice(3).join('/');
  }
  return name;
};


/**
 * @param {?string} param
 * @return {?string}
 */
ee.rpc_convert.assetTypeForCreate = function(param) {
  switch (param) {
    case 'ImageCollection': return 'IMAGE_COLLECTION';
    case 'Folder': return 'FOLDER';
    default: return param;
  }
};


/**
 * @param {!ee.api.ListAssetsResponse} result
 * @return {!Object}
 */
ee.rpc_convert.listAssetsToGetList = function(result) {
  return (result.assets || []).map(ee.rpc_convert.assetToLegacyResult);
};


/**
 * @param {!ee.api.ListImagesResponse} result
 * @return {!Object}
 */
ee.rpc_convert.listImagesToGetList = function(result) {
  return (result.images || []).map(ee.rpc_convert.imageToLegacyResult);
};

/**
 * @param {?string} type The cloud asset type. These types must match the values
 *     in google.earthengine.v1main.EarthEngineAsset.Type.
 * @return {string} The equivalent legacy asset type.
 */
ee.rpc_convert.assetTypeToLegacyAssetType = function(type) {
  switch (type) {
    case 'ALGORITHM':
      return 'Algorithm';
    case 'FOLDER':
      return 'Folder';
    case 'IMAGE':
      return 'Image';
    case 'IMAGE_COLLECTION':
      return 'ImageCollection';
    case 'TABLE':
      return 'Table';
    case 'CLASSIFIER':
      return 'Classifier';
    case 'FEATURE_VIEW':
      return 'FeatureView';
    default:
      return 'Unknown';
  }
};


/**
 * @param {?string} type The legacy asset type.
 * @return {string} The equivalent cloud asset type.
 */
ee.rpc_convert.legacyAssetTypeToAssetType = function(type) {
  switch (type) {
    case 'Algorithm':
      return 'ALGORITHM';
    case 'Folder':
      return 'FOLDER';
    case 'Image':
      return 'IMAGE';
    case 'ImageCollection':
      return 'IMAGE_COLLECTION';
    case 'Table':
      return 'TABLE';
    default:
      return 'UNKNOWN';
  }
};


/**
 * @param {!ee.api.EarthEngineAsset} result
 * @return {!Object}
 */
ee.rpc_convert.assetToLegacyResult = function(result) {
  const asset = ee.rpc_convert.makeLegacyAsset_(
      ee.rpc_convert.assetTypeToLegacyAssetType(result.type), result.name);
  const properties = Object.assign({}, result.properties || {});
  // Put system properties back into the legacy properties object.
  if (result.sizeBytes) {
    properties['system:asset_size'] = Number(result.sizeBytes);
  }
  if (result.startTime) {
    properties['system:time_start'] = Date.parse(result.startTime);
  }
  if (result.endTime) {
    properties['system:time_end'] = Date.parse(result.endTime);
  }
  if (result.geometry) {
    properties['system:footprint'] = result.geometry;  // GeoJSON
  }
  if (typeof result.title === 'string') {
    properties['system:title'] = result.title;
  }
  if (typeof result.description === 'string') {
    properties['system:description'] = result.description;
  }
  if (result.updateTime) {
    asset['version'] = Date.parse(result.updateTime) * 1000;  // us
  }
  asset['properties'] = properties;

  if (result.bands) {
    asset['bands'] = result.bands.map((band) => {
      const legacyBand = {
        'id': band.id,
        'crs': band.grid.crsCode,
        'dimensions': undefined,
        'crs_transform': undefined,
      };
      if (band.grid) {
        if (band.grid.affineTransform != null) {
          const affine = band.grid.affineTransform;
          legacyBand['crs_transform'] = [
            affine.scaleX || 0,
            affine.shearX || 0,
            affine.translateX || 0,
            affine.shearY || 0,
            affine.scaleY || 0,
            affine.translateY || 0,
          ];
        }
        if (band.grid.dimensions != null) {
          legacyBand['dimensions'] =
              [band.grid.dimensions.width, band.grid.dimensions.height];
        }
      }
      if (band.dataType) {
        const dataType = {'type': 'PixelType'};
        dataType['precision'] =
            (band.dataType.precision || '').toLowerCase();
        if (band.dataType.range) {
          dataType['min'] = band.dataType.range.min || 0;
          dataType['max'] = band.dataType.range.max;
        }
        legacyBand['data_type'] = dataType;
      }
      return legacyBand;
    });
  }
  if (result.featureViewAssetLocation) {
    asset['mapLocation'] = result.featureViewAssetLocation;
  }
  if (result.featureCount) {
    asset['featureCount'] = result.featureCount;
  }
  return asset;
};


/**
 * @param {!Object} legacyProperties
 * @return {!ee.api.EarthEngineAsset}
 */
ee.rpc_convert.legacyPropertiesToAssetUpdate = function(legacyProperties) {
  const asset = new ee.api.EarthEngineAsset();
  const toTimestamp = (msec) => new Date(Number(msec)).toISOString();
  const asNull = (value) =>
      value === null ? /** type {?} */ (ee.apiclient.NULL_VALUE) : undefined;
  const properties = Object.assign({}, legacyProperties);
  let value;
  const extractValue = (key) => {
    value = properties[key];
    delete properties[key];
    return value;
  };
  // Extract the legacy properties from the properties object. May be set to
  // null for deletion, but we use NULL_VALUE so that Serializable$has returns
  // true.
  if (extractValue('system:asset_size') !== undefined) {
    asset.sizeBytes = asNull(value) || String(value);
  }
  if (extractValue('system:time_start') !== undefined) {
    asset.startTime = asNull(value) || toTimestamp(value);
  }
  if (extractValue('system:time_end') !== undefined) {
    asset.endTime = asNull(value) || toTimestamp(value);
  }
  if (extractValue('system:footprint') !== undefined) {
    asset.geometry = asNull(value) || value;
  }
  // Extract `system:title` and set it in `properties` unless `title` is present
  // in `properties`, which takes precedence.
  extractValue('system:title');
  if ((typeof value === 'string' || value === null) &&
      properties['title'] == null) {
    properties['title'] = asNull(value) || value;
  }
  // Extract `system:description` and set it in `properties` unless
  // `description` is present in `properties`, which takes precedence.
  extractValue('system:description');
  if ((typeof value === 'string' || value === null) &&
      properties['description'] == null) {
    properties['description'] = asNull(value) || value;
  }
  // update_time cannot be set directly.
  Object.entries(properties).forEach(([key, value]) => {
    properties[key] = asNull(value) || value;
  });
  asset.properties = properties;
  return asset;
};


/**
 * @param {!ee.api.Image} result
 * @return {!Object}
 */
ee.rpc_convert.imageToLegacyResult = function(result) {
  return ee.rpc_convert.makeLegacyAsset_('Image', result.name);
};


/**
 * @param {?string} type
 * @param {?undefined|string} name
 * @return {!Object}
 * @private
 */
ee.rpc_convert.makeLegacyAsset_ = function(type, name) {
  const legacyAsset = {};
  legacyAsset['type'] = type;
  if (name != null) {
    legacyAsset['id'] = ee.rpc_convert.assetNameToAssetId(name);
  }
  return legacyAsset;
};


/**
 * @param {!Object} param
 * @return {!ee.api.ProjectsAssetsListImagesNamedParameters}
 */
ee.rpc_convert.getListToListImages = function(param) {
  /** @type {!ee.api.ProjectsAssetsListImagesNamedParameters} */
  const imagesRequest = {};
  const toTimestamp = (msec) => new Date(msec).toISOString();
  if (param['num']) {
    imagesRequest.pageSize = param['num'];
  }
  if (param['starttime']) {
    imagesRequest.startTime = toTimestamp(param['starttime']);
  }
  if (param['endtime']) {
    imagesRequest.endTime = toTimestamp(param['endtime']);
  }
  if (param['bbox']) {
    imagesRequest.region = ee.rpc_convert.boundingBoxToGeoJson(param['bbox']);
  }
  if (param['region']) {
    imagesRequest.region = param['region'];
  }
  if (param['bbox'] && param['region']) {
    console.warn('Multiple request parameters converted to region');
  }
  const allKeys = ['id', 'num', 'starttime', 'endtime', 'bbox', 'region'];
  for (let key of Object.keys(param).filter(k => !allKeys.includes(k))) {
    console.warn('Unrecognized key ' + key + ' ignored');
  }
  imagesRequest.fields = 'assets(type,path)';
  return imagesRequest;
};


/**
 * @param {!Array<number>} bbox
 * @return {string}
 */
ee.rpc_convert.boundingBoxToGeoJson = function(bbox) {
  const indexes = [[0, 1], [2, 1], [2, 3], [0, 3], [0, 1]];
  const pairs = indexes.map(i => bbox[i[0]] + ',' + bbox[i[1]]);
  return '{"type":"Polygon","coordinates":[[[' + pairs.join('],[') + ']]]}';
};


/**
 * Converts an IamPolicy object to our internal AssetAcl representation.
 * @param {!ee.api.Policy} result
 * @return {!Object}
 */
ee.rpc_convert.iamPolicyToAcl = function(result) {
  const bindingMap = {};
  (result.bindings || []).forEach(binding => {
    bindingMap[binding.role] = binding.members;
  });
  const groups = new Set();
  const toAcl = (member) => {
    const email = member.replace(/^group:|^user:|^serviceAccount:/, '');
    if (member.startsWith('group:')) {
      groups.add(email);
    }
    return email;
  };
  const readersWithAll = bindingMap['roles/viewer'] || [];
  const readers = readersWithAll.filter(reader => reader !== 'allUsers');
  const internalAcl = {
    'owners': (bindingMap['roles/owner'] || []).map(toAcl),
    'writers': (bindingMap['roles/editor'] || []).map(toAcl),
    'readers': readers.map(toAcl),
  };
  if (groups.size > 0) {
    internalAcl['groups'] = groups;
  }
  if (readersWithAll.length != readers.length) {
    internalAcl['all_users_can_read'] = true;
  }
  return internalAcl;
};


/**
 * @param {!Object} acls
 * @return {!ee.api.Policy}
 */
ee.rpc_convert.aclToIamPolicy = function(acls) {
  const isGroup = (email) => acls['groups'] && acls['groups'].has(email);
  const isServiceAccount = (email) =>
      email.match(/[@|\.]gserviceaccount\.com$/);
  // Converts the list of emails to <prefix>:<email> format for IamPolicy.
  const asMembers = (aclName) => (acls[aclName] || []).map((email) => {
    let prefix = 'user:';
    if (isGroup(email)) {
      prefix = 'group:';
    } else if (isServiceAccount(email)) {
      prefix = 'serviceAccount:';
    }
    return prefix + email;
  });
  const all = acls['all_users_can_read'] ? ['allUsers'] : [];
  const bindings = [
    {role: 'roles/owner', members: asMembers('owners')},
    {role: 'roles/viewer', members: asMembers('readers').concat(all)},
    {role: 'roles/editor', members: asMembers('writers')},
  ].map(params => new ee.api.Binding(params));
  return new ee.api.Policy({
    bindings: bindings.filter(binding => binding.members.length),
    etag: null,
  });
};

/**
 * @param {string} operationNameOrTaskId
 * @return {string}
 */
ee.rpc_convert.taskIdToOperationName = function(operationNameOrTaskId) {
  const taskId = ee.rpc_convert.operationNameToTaskId(operationNameOrTaskId);
  const project = ee.rpc_convert.operationNameToProject(operationNameOrTaskId);
  return `projects/${project}/operations/${taskId}`;
};


/**
 * @param {string} result
 * @return {string}
 */
ee.rpc_convert.operationNameToTaskId = function(result) {
  const found = /^.*operations\/(.*)$/.exec(result);
  return found ? found[1] : result;
};


/**
 * @param {string} operationNameOrTaskId
 * @return {string}
 */
ee.rpc_convert.operationNameToProject = function(operationNameOrTaskId) {
  const found = /^projects\/(.+)\/operations\/.+$/.exec(operationNameOrTaskId);
  return found ? found[1] : ee.rpc_convert.DEFAULT_PROJECT;
};


/**
 * @param {!ee.api.Operation} result
 * @return {!Object}
 */
ee.rpc_convert.operationToTask = function(result) {
  const internalTask = {};
  const assignTimestamp = (field, timestamp) => {
    if (timestamp != null) {
      internalTask[field] = Date.parse(timestamp);
    }
  };
  const convertState = (state) => {
    switch (state) {
      case 'PENDING': return 'READY';
      case 'RUNNING': return 'RUNNING';
      case 'CANCELLING': return 'CANCEL_REQUESTED';
      case 'SUCCEEDED': return 'COMPLETED';
      case 'CANCELLED': return 'CANCELLED';
      case 'FAILED': return 'FAILED';
      default: return 'UNKNOWN';
    }
  };
  const metadata = ee.apiclient.deserialize(
      ee.api.OperationMetadata, result.metadata || {});
  if (metadata.description != null) {
    internalTask['description'] = metadata.description;
  }
  if (metadata.state != null) {
    internalTask['state'] = convertState(metadata.state);
  }
  assignTimestamp('creation_timestamp_ms', metadata.createTime);
  assignTimestamp('update_timestamp_ms', metadata.updateTime);
  assignTimestamp('start_timestamp_ms', metadata.startTime);
  internalTask['attempt'] = metadata.attempt;
  if (result.done && result.error != null) {
    internalTask['error_message'] = result.error.message;
  }
  if (result.name != null) {
    internalTask['id'] = ee.rpc_convert.operationNameToTaskId(result.name);
    internalTask['name'] = result.name;
  }
  internalTask['task_type'] = metadata.type || 'UNKNOWN';
  internalTask['output_url'] = metadata.destinationUris;
  internalTask['source_url'] = metadata.scriptUri;
  return internalTask;
};


/**
 * @param {!ee.api.Operation} operation
 * @return {!Object} ProcessingResponse
 */
ee.rpc_convert.operationToProcessingResponse = function(operation) {
  // The legacy response should always return OK.  If the task is
  // attempted to be created again with the same requestId an exception
  // may be thrown if the request is not byte for byte identical.
  const result = {'started': 'OK'};
  if (operation.name) {
    result['taskId'] = ee.rpc_convert.operationNameToTaskId(operation.name);
    result['name'] = operation.name;
  }
  if (operation.error) {
    result['note'] = operation.error.message;
  }
  return result;
};


/**
 * @param {!Object} source Legacy source object.
 * @return {?Array<string>} Paths to add to the uris field.
 */
ee.rpc_convert.sourcePathsToUris = function(source) {
  if (source['primaryPath']) {
    return [source['primaryPath'], ...source['additionalPaths'] || []];
  }
  return null;
};


/**
 * @param {!Object} params Legacy request parameters
 * @return {!ee.api.ImageManifest}
 */
ee.rpc_convert.toImageManifest = function(params) {
  // Use deserialize to convert string-keyed objects to API types.
  const convertImageSource = (source) => {
    const apiSource = ee.apiclient.deserialize(ee.api.ImageSource, source);
    apiSource.uris = ee.rpc_convert.sourcePathsToUris(source);
    return apiSource;
  };
  const convertTileset = (tileset) => {
    const apiTileset = ee.apiclient.deserialize(ee.api.Tileset, tileset);
    apiTileset.sources = (tileset['sources'] || []).map(convertImageSource);
    return apiTileset;
  };
  const convertBands = (band) => {
    const apiBand = ee.apiclient.deserialize(ee.api.TilesetBand, band);
    apiBand.missingData =
        ee.rpc_convert.toOnePlatformMissingData(band['missingData']);
    return apiBand;
  };
  // Retain existing keys
  const manifest = ee.apiclient.deserialize(ee.api.ImageManifest, params);
  // TODO(user): Transform keys as done in ee/cli/commands.py
  manifest.name = ee.rpc_convert.assetIdToAssetName(params['id']);
  manifest.tilesets = (params['tilesets'] || []).map(convertTileset);
  manifest.bands = (params['bands'] || []).map(convertBands);
  manifest.missingData =
      ee.rpc_convert.toOnePlatformMissingData(params['missingData']);
  manifest.maskBands = goog.array.flatten(
      (params['tilesets'] || []).map(ee.rpc_convert.toOnePlatformMaskBands));
  manifest.pyramidingPolicy = params['pyramidingPolicy'] || null;

  // Extract properties.
  if (params['properties']) {
    const properties = Object.assign({}, params['properties']);
    const toTimestamp = (msec) => new Date(Number(msec)).toISOString();
    let value;
    const extractValue = (key) => {
      value = properties[key];
      delete properties[key];
      return value;
    };
    if (extractValue('system:time_start')) {
      manifest.startTime = toTimestamp(value);
    }
    if (extractValue('system:time_end')) {
      manifest.endTime = toTimestamp(value);
    }
    manifest.properties = properties;
  }
  return manifest;
};


/**
 * Returns an array of TilesetMaskBands for a given tileset.
 *
 * @param {!Object} tileset legacy tileset object.
 * @return {!Array<!ee.api.TilesetMaskBand>}
 */
ee.rpc_convert.toOnePlatformMaskBands = function(tileset) {
  const maskBands = [];
  if (!Array.isArray(tileset['fileBands'])) {
    return maskBands;
  }

  /**
   *  Return a TilesetMaskBand  for a given maskConfig.  If the maskConfig
   *  is null the default is to return a TilesetMaskBand for all bands
   *  (No bandIds set).
   *
   *  @param {?Object} maskConfig the old-manifest maskConfig.
   *  @return {!ee.api.TilesetMaskBand}
   */
  const convertMaskConfig = (maskConfig) => {
    let bandIds = [];
    if (maskConfig != null && Array.isArray(maskConfig['bandId'])) {
      bandIds = maskConfig['bandId'].map((bandId) => bandId || '');
    }
    // TODO(user): Tileset ID is always set to the default of the empty
    // string, if we decide to set the tilesetId on the OnePlatform tileset
    // we need to change this.
    return new ee.api.TilesetMaskBand({tilesetId: tileset['id'] || '', bandIds});
  };

  tileset['fileBands'].forEach((fileBand) => {
    if (fileBand['maskForAllBands']) {
      // Provide null since that will return a default
      // mask for all bands.
      maskBands.push(convertMaskConfig(null));
    } else if (fileBand['maskForBands'] != null) {
      maskBands.push(convertMaskConfig(fileBand['maskForBands']));
    }
  });
  return maskBands;
};


/**
 * @param {!Object} params Legacy request parameters
 * @return {!ee.api.TableManifest}
 */
ee.rpc_convert.toTableManifest = function(params) {
  const convertTableSource = (source) => {
    const apiSource = ee.apiclient.deserialize(ee.api.TableSource, source);
    apiSource.uris = ee.rpc_convert.sourcePathsToUris(source);
    if (source['maxError']) {
      apiSource.maxErrorMeters = source['maxError'];
    }
    return apiSource;
  };
  // Retain existing keys
  const manifest = ee.apiclient.deserialize(ee.api.TableManifest, params);
  // TODO(user): Transform keys as done in ee/cli/commands.py
  manifest.name = ee.rpc_convert.assetIdToAssetName(params['id']);
  manifest.sources = (params['sources'] || []).map(convertTableSource);

  // Extract properties.
  if (params['properties']) {
    const properties = Object.assign({}, params['properties']);
    const toTimestamp = (msec) => new Date(Number(msec)).toISOString();
    let value;
    const extractValue = (key) => {
      value = properties[key];
      delete properties[key];
      return value;
    };
    if (extractValue('system:time_start')) {
      manifest.startTime = toTimestamp(value);
    }
    if (extractValue('system:time_end')) {
      manifest.endTime = toTimestamp(value);
    }
    manifest.properties = properties;
  }
  return manifest;
};

/**
 * @param {!Object} params Legacy image manifest missing data field.
 * @return {?ee.api.MissingData}
 */
ee.rpc_convert.toOnePlatformMissingData = function(params) {
  if (params == null) {
    return null;
  }
  const missingData = new ee.api.MissingData({values: []});
  if (params['value'] != null && typeof params['value'] === 'number') {
    missingData.values.push(params['value']);
  }
  if (Array.isArray(params['values'])) {
    params['values'].map(value => {
      if (typeof value === 'number') {
        missingData.values.push(value);
      }
    });
  }
  return (goog.array.isEmpty(missingData.values)) ? null : missingData;
};

/**
 * @param {!ee.api.FolderQuota} quota
 * @return {!Object}
 */
ee.rpc_convert.folderQuotaToAssetQuotaDetails = function(quota) {
  const toNumber = (field) => Number(field || 0);
  return {
    asset_count: {
      usage: toNumber(quota.assetCount),
      limit: toNumber(quota.maxAssetCount),
    },
    asset_size: {
      usage: toNumber(quota.sizeBytes),
      limit: toNumber(quota.maxSizeBytes),
    }
  };
};
