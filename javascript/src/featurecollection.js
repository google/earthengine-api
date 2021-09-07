/**
 * @fileoverview Representation of an Earth Engine FeatureCollection.
 */

goog.provide('ee.FeatureCollection');

goog.require('ee.ApiFunction');
goog.require('ee.Collection');
goog.require('ee.ComputedObject');
goog.require('ee.Feature');
goog.require('ee.Geometry');
goog.require('ee.Image');
goog.require('ee.List');
goog.require('ee.Types');
goog.require('ee.arguments');
goog.require('ee.data');
goog.require('goog.array');



/**
 * FeatureCollections can be constructed from the following arguments:
 *   - A string: assumed to be the name of a collection.
 *   - A single geometry.
 *   - A single feature.
 *   - A list of features.
 *   - A GeoJSON FeatureCollection
 *   - A computed object: reinterpreted as a collection.
 *
 * @param {string|number|Array.<*>|ee.ComputedObject|
 *         ee.Geometry|ee.Feature|ee.FeatureCollection} args
 *     The constructor arguments.
 * @param {string=} opt_column The name of the geometry column to use.  Only
 *     useful when working with a named collection.
 * @constructor
 * @extends {ee.Collection}
 * @export
 */
ee.FeatureCollection = function(args, opt_column) {
  // Constructor safety.
  if (!(this instanceof ee.FeatureCollection)) {
    return ee.ComputedObject.construct(ee.FeatureCollection, arguments);
  } else if (args instanceof ee.FeatureCollection) {
    return args;
  }

  if (arguments.length > 2) {
    throw Error(
        'The FeatureCollection constructor takes at most 2 arguments (' +
        arguments.length + ' given)');
  }

  ee.FeatureCollection.initialize();

  // Wrap geometries with features.
  if (args instanceof ee.Geometry) {
    args = new ee.Feature(args);
  }

  // Wrap single features in an array.
  if (args instanceof ee.Feature) {
    args = [args];
  }

  if (ee.Types.isString(args)) {
    // An ID.
    var actualArgs = {'tableId': args};
    if (opt_column) {
      actualArgs['geometryColumn'] = opt_column;
    }
    ee.FeatureCollection.base(
        this, 
        'constructor', 
        new ee.ApiFunction('Collection.loadTable'), actualArgs);
  } else if (Array.isArray(args)) {
    // A list of features.
    ee.FeatureCollection.base(
        this, 'constructor', new ee.ApiFunction('Collection'), {
      'features': goog.array.map(args, function(elem) {
        return new ee.Feature(elem);
      })
    });
  } else if (args instanceof ee.List) {
    // A computed list of features.  This can't get the extra ee.Feature()
    ee.FeatureCollection.base(
        this, 'constructor', new ee.ApiFunction('Collection'),
        {'features': args});
  } else if (args && typeof args === 'object'
      && args['type'] === 'FeatureCollection') {
    ee.FeatureCollection.base(
        this, 'constructor', new ee.ApiFunction('Collection'),
        {'features': args['features'].map(f => new ee.Feature(f))});
  } else if (args instanceof ee.ComputedObject) {
    // A custom object to reinterpret as a FeatureCollection.
    ee.FeatureCollection.base(
        this, 'constructor', args.func, args.args, args.varName);
  } else {
    throw Error('Unrecognized argument type to convert to a ' +
                'FeatureCollection: ' + args);
  }
};
goog.inherits(ee.FeatureCollection, ee.Collection);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.FeatureCollection.initialized_ = false;


/**
 * Imports API functions to this class.
 */
ee.FeatureCollection.initialize = function() {
  if (!ee.FeatureCollection.initialized_) {
    ee.ApiFunction.importApi(
        ee.FeatureCollection, 'FeatureCollection', 'FeatureCollection');
    ee.FeatureCollection.initialized_ = true;
  }
};


/**
 * Removes imported API functions from this class.
 */
ee.FeatureCollection.reset = function() {
  ee.ApiFunction.clearApi(ee.FeatureCollection);
  ee.FeatureCollection.initialized_ = false;
};


/**
 * An imperative function that returns a map id and token, suitable for
 * generating a Map overlay.
 *
 * @param {?Object=} opt_visParams The visualization parameters. Currently only
 *     one parameter, 'color', containing an RGB color string is allowed.  If
 *     vis_params isn't specified, then the color #000000 is used.
 * @param {function(!Object, string=)=} opt_callback An async callback.
 *     If not supplied, the call is made synchronously.
 * @return {!ee.data.MapId|undefined} An object which may be passed to
 *     ee.data.getTileUrl or ui.Map.addLayer, including an additional 'image'
 *     field, containing a Collection.draw image wrapping a FeatureCollection
 *     containing this feature. Undefined if a callback was specified.
 * @export
 */
ee.FeatureCollection.prototype.getMap = function(opt_visParams, opt_callback) {
  var args = ee.arguments.extractFromFunction(
      ee.FeatureCollection.prototype.getMap, arguments);

  var painted = /** @type {!ee.Image} */(
      ee.ApiFunction._apply('Collection.draw', {
        'collection': this,
        'color': (args['visParams'] || {})['color'] || '000000'
      }));

  if (args['callback']) {
    painted.getMap(undefined, args['callback']);
  } else {
    return painted.getMap();
  }
};


/**
 * An imperative function that returns all the known information about this
 * collection via an AJAX call.
 *
 * @param {function(ee.data.FeatureCollectionDescription, string=)=}
 *     opt_callback An optional callback. If not supplied, the call is made
 *     synchronously. If supplied, will be called with the first parameter if
 *     successful and the second if unsuccessful.
 * @return {ee.data.FeatureCollectionDescription} A collection description
 *     whose fields include:
 *     - features: a list containing metadata about the features in the
 *           collection.
 *     - properties: an optional dictionary containing the collection's
 *           metadata properties.
 * @export
 */
ee.FeatureCollection.prototype.getInfo = function(opt_callback) {
  return /** @type {ee.data.FeatureCollectionDescription} */(
      ee.FeatureCollection.base(this, 'getInfo', opt_callback));
};


/**
 * Gets a download URL. When the URL is accessed, the FeatureCollection is
 * downloaded in one of several formats.
 * @param {string=} opt_format The format of download, one of:
 *     "csv", "json", "geojson", "kml", "kmz" ("json" outputs GeoJSON). If
 *     unspecified, defaults to "csv".
 * @param {string|!Array<string>=} opt_selectors Feature property names used to
 *     select the attributes to be downloaded. If unspecified, all properties
 *     are included.
 * @param {string=} opt_filename Name of the file to be downloaded; extension is
 *     appended by default. If unspecified, defaults to "table".
 * @param {function(string?, string=)=} opt_callback An optional
 *     callback. If not supplied, the call is made synchronously.
 * @return {string|undefined} A download URL or undefined if a callback was
 *     specified.
 * @export
 */
ee.FeatureCollection.prototype.getDownloadURL = function(
    opt_format, opt_selectors, opt_filename, opt_callback) {
  const args = ee.arguments.extractFromFunction(
      ee.FeatureCollection.prototype.getDownloadURL, arguments);
  const request = {};
  request['table'] = this;
  if (args['format']) {
    request['format'] = args['format'].toUpperCase();
  }
  if (args['filename']) {
    request['filename'] = args['filename'];
  }
  if (args['selectors']) {
    request['selectors'] = args['selectors'];
  }

  if (args['callback']) {
    ee.data.getTableDownloadId(request, function(downloadId, error) {
      if (downloadId) {
        args['callback'](ee.data.makeTableDownloadUrl(downloadId));
      } else {
        args['callback'](null, error);
      }
    });
  } else {
    return ee.data.makeTableDownloadUrl(
        /** @type {!ee.data.DownloadId} */ (
            ee.data.getTableDownloadId(request)));
  }
};


/**
 * Select properties from each Feature in a collection.  It is also
 * possible to call this function with only string arguments; they
 * will be all be interpreted as propertySelectors (varargs).
 *
 * @param {!Array<string>} propertySelectors A list of names or regexes
 *     specifying the attributes to select.
 * @param {!Array<string>=} opt_newProperties A list of new names for the
 *     output properties. Must match the number of properties selected.
 * @param {boolean=} opt_retainGeometry When false, the result will have a
 *     NULL geometry. Defaults to true.
 * @return {!ee.FeatureCollection} The feature collection with selected
 *     properties.
 * @export
 */
ee.FeatureCollection.prototype.select = function(
    propertySelectors, opt_newProperties, opt_retainGeometry) {
  if (ee.Types.isString(propertySelectors)) {
    // Varargs.
    var varargs = Array.prototype.slice.call(arguments);
    return /** @type {!ee.FeatureCollection} */ (this.map(function(feature) {
      return /** @type {!ee.Feature} */(feature).select(varargs);
    }));
  } else {
    // Translate the argument names.
    var args = ee.arguments.extractFromFunction(
        ee.FeatureCollection.prototype.select, arguments);
    return /** @type {!ee.FeatureCollection} */ (this.map(function(feature) {
      return /** @type {!ee.Feature} */(feature).select(args);
    }));
  }
};


/** @override */
ee.FeatureCollection.prototype.name = function() {
  return 'FeatureCollection';
};


/** @override */
ee.FeatureCollection.prototype.elementType = function() {
  return ee.Feature;
};
