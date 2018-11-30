/**
 * @fileoverview An object representing EE Features.
 */

goog.provide('ee.Feature');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.Element');
goog.require('ee.Geometry');
goog.require('ee.arguments');
goog.require('goog.object');

goog.forwardDeclare('ee.FeatureCollection');

/**
 * Features can be constructed from one of the following arguments plus an
 * optional dictionary of properties:
 *   - An ee.Geometry.
 *   - A GeoJSON Geometry.
 *   - A GeoJSON Feature.
 *   - A computed object: reinterpreted as a geometry if properties
 *      are specified, and as a feature if they aren't.
 *
 * @param {ee.Geometry|ee.Feature|ee.ComputedObject|Object} geometry
 *     A geometry or feature.
 * @param {Object=} opt_properties A dictionary of metadata properties. If the
 *     first parameter is a Feature (instead of a geometry), this is unused.
 * @constructor
 * @extends {ee.Element}
 * @export
 */
ee.Feature = function(geometry, opt_properties) {
  if (!(this instanceof ee.Feature)) {
    return ee.ComputedObject.construct(ee.Feature, arguments);
  } else if (geometry instanceof ee.Feature) {
    // A pre-constructed Feature. Return as is.
    if (opt_properties) {
      throw new Error('Can\'t create Feature out of a Feature and properties.');
    }
    return geometry;
  }

  if (arguments.length > 2) {
    throw Error('The Feature constructor takes at most 2 arguments (' +
                arguments.length + ' given)');
  }

  ee.Feature.initialize();

  if (geometry instanceof ee.Geometry || geometry === null) {
    // A Geometry object.
    ee.Feature.base(this, 'constructor', new ee.ApiFunction('Feature'), {
      'geometry': geometry,
      'metadata': opt_properties || null
    });
  } else if (geometry instanceof ee.ComputedObject) {
    // A custom object to reinterpret as a Feature.
    ee.Feature.base(this, 'constructor', geometry.func, geometry.args, geometry.varName);
  } else if (geometry['type'] == 'Feature') {
    // Try to convert a GeoJSON Feature.
    var properties = geometry['properties'] || {};
    if ('id' in geometry) {
      if ('system:index' in properties) {
        throw Error('Can\'t specify both "id" and "system:index".');
      }
      properties = goog.object.clone(properties);
      properties['system:index'] = geometry['id'];
    }
    ee.Feature.base(this, 'constructor', new ee.ApiFunction('Feature'), {
      'geometry': new ee.Geometry(geometry['geometry']),
      'metadata': properties
    });
  } else {
    // Try to convert the geometry arg to a Geometry, in the hopes of it
    // turning out to be GeoJSON.
    ee.Feature.base(this, 'constructor', new ee.ApiFunction('Feature'), {
      'geometry': new ee.Geometry(geometry),
      'metadata': opt_properties || null
    });
  }
};
goog.inherits(ee.Feature, ee.Element);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.Feature.initialized_ = false;


/**
 * Imports API functions to this class.
 */
ee.Feature.initialize = function() {
  if (!ee.Feature.initialized_) {
    ee.ApiFunction.importApi(ee.Feature, 'Feature', 'Feature');
    ee.Feature.initialized_ = true;
  }
};


/**
 * Removes imported API functions from this class.
 */
ee.Feature.reset = function() {
  ee.ApiFunction.clearApi(ee.Feature);
  ee.Feature.initialized_ = false;
};


/**
 * An imperative function that returns information about this feature via an
 * AJAX call.
 *
 * @param {function(ee.data.GeoJSONFeature, string=)=} opt_callback
 *     An optional callback. If not supplied, the call is made synchronously.
 *     If supplied, will be called with the first parameter if successful and
 *     the second if unsuccessful.
 * @return {ee.data.GeoJSONFeature} A description of the feature.
 * @export
 */
ee.Feature.prototype.getInfo = function(opt_callback) {
  return /** @type {ee.data.GeoJSONFeature} */(
      ee.Feature.base(this, 'getInfo', opt_callback));
};


/**
 * An imperative function that returns a map ID and token, suitable for
 * generating a Map overlay.
 *
 * @param {Object?=} opt_visParams The visualization parameters. Currently only
 *     one parameter, 'color', containing an RGB color string is user.  If
 *     vis_params is null, black ("000000") is used.
 * @param {function(Object, string=)=} opt_callback An async callback.
 * @return {ee.data.MapId|undefined} An object containing a mapid string, an
 *     access token plus a Collection.draw image wrapping a FeatureCollection
 *     containing this feature. Or undefined if a callback is provided.
 * @export
 */
ee.Feature.prototype.getMap = function(opt_visParams, opt_callback) {
  var args =
      ee.arguments.extractFromFunction(ee.Feature.prototype.getMap, arguments);
  var collection = ee.ApiFunction._call('Collection', [this]);
  return /** @type {ee.FeatureCollection} */(collection)
      .getMap(args['visParams'], args['callback']);
};


/** @override */
ee.Feature.prototype.name = function() {
  return 'Feature';
};
