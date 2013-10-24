/**
 * @fileoverview An object representing EE Features.
 */

goog.provide('ee.Feature');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.Geometry');
goog.require('goog.array');
goog.require('goog.object');



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
       first parameter is a Feature (instead of a geometry), this is unused.
 * @constructor
 * @extends {ee.ComputedObject}
 * @export
 */
ee.Feature = function(geometry, opt_properties) {
  if (!(this instanceof ee.Feature)) {
    return new ee.Feature(geometry, opt_properties);
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
    goog.base(this, new ee.ApiFunction('Feature'), {
      'geometry': geometry,
      'metadata': opt_properties || null
    });
  } else if (geometry instanceof ee.ComputedObject) {
    // A custom object to reinterpret as a Feature.
    goog.base(this, geometry.func, geometry.args);
  } else if (geometry['type'] == 'Feature') {
    // Try to convert a GeoJSON Feature.
    goog.base(this, new ee.ApiFunction('Feature'), {
      'geometry': new ee.Geometry(geometry['geometry']),
      'metadata': geometry['properties'] || null
    });
  } else {
    // Try to convert the geometry arg to a Geometry, in the hopes of it
    // turning out to be GeoJSON.
    goog.base(this, new ee.ApiFunction('Feature'), {
      'geometry': new ee.Geometry(geometry),
      'metadata': opt_properties || null
    });
  }
};
goog.inherits(ee.Feature, ee.ComputedObject);


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
      goog.base(this, 'getInfo', opt_callback));
};


/**
 * An imperative function that returns a map ID and token, suitable for
 * generating a Map overlay.
 *
 * @param {Object?=} opt_visParams The visualization parameters. Currently only
 *     one parameter, 'color', containing an RGB color string is user.  If
 *     vis_params is null, black ("000000") is used.
 * @param {function(Object, string=)=} opt_callback An async callback.
 * @return {ee.data.MapId} An object containing a mapid string, an access
 *    token, plus a Collection.draw image wrapping a FeatureCollection
 *    containing this feature.
 * @export
 */
ee.Feature.prototype.getMap = function(opt_visParams, opt_callback) {
  var collection = ee.ApiFunction._call('Collection', [this]);
  return /** @type {ee.FeatureCollection} */(collection)
      .getMap(opt_visParams, opt_callback);
};


/**
 * Construct a GeoJSON point.
 *
 * @param {number|Array.<number>} lon The longitude of the point, or
 *     a tuple of the longitude and latitude, in which case lat is ignored.
 * @param {number} lat The latitude of the point.
 * @return {ee.Geometry} A GeoJSON Point.
 * @export
 */
ee.Feature.Point = function(lon, lat) {
  return ee.Geometry.Point.apply(null, arguments);
};


/**
 * Construct a GeoJSON MultiPoint.
 *
 * @param {number|!Array.<!Array.<number>>} coordinates The coordinates as
 *     either an array of [lon, lat] tuples, or literal pairs of
 *     coordinate longitudes and latitudes, such as MultiPoint(1, 2, 3, 4).
 * @return {Object} A GeoJSON MultiPoint object.
 * @export
 */
ee.Feature.MultiPoint = function(coordinates) {
  return ee.Geometry.MultiPoint.apply(null, arguments);
};


/**
 * Construct a rectangular polygon from the given corner points.
 *
 * @param {number} lon1 Longitude of the first corner point.
 * @param {number} lat1 Latitude of the first corner point.
 * @param {number} lon2 Longiude of the second corner point.
 * @param {number} lat2 latitude of the second corner point.
 * @return {Object} A GeoJSON Polygon.
 * @export
 */
ee.Feature.Rectangle = function(lon1, lat1, lon2, lat2) {
  return new ee.Geometry.Rectangle(lon1, lat1, lon2, lat2);
};


/**
 * Construct a LineString from the given coordinates.
 *
 * @param {number|!Array.<!Array.<number>>} coordinates The coordinates as
 *     either an array of [lon, lat] tuples, or literal pairs of
 *     coordinate longitudes and latitudes, such as LineString(1, 2, 3, 4).
 * @return {ee.Geometry} A GeoJSON LineString.
 * @export
 */
ee.Feature.LineString = function(coordinates) {
  return ee.Geometry.LineString.apply(null, arguments);
};


/**
 * Construct a LinearRing from the given coordinates.
 *
 * @param {number|!Array.<!Array.<number>>} coordinates The coordinates as
 *     either an array of [lon, lat] tuples, or literal pairs of coordinate
 *     longitudes and latitudes, such as LinearRing(1, 2, 3, 4, 5, 6).
 * @return {ee.Geometry} A GeoJSON LinearRing.
 * @export
 */
ee.Feature.LinearRing = function(coordinates) {
  return ee.Geometry.LinearRing.apply(null, arguments);
};


/**
 * Construct a MultiLine from the given coordinates, either a list of points,
 * or an array of linestrings.
 *
 * @param {number|!Array.<!Array.<!Array.<number>>>} coordinates The MultiLine
 *     coordinates as either a var_args list of numbers, or an array of
 *     lineStrings, each of which is an array of points.
 * @return {ee.Geometry} The newly constructed MultiLine.
 * @export
 *
 * TODO(user): This actually doesn't accept an array of
 * ee.Feature.LineStrings, but it should.
 */
ee.Feature.MultiLine = function(coordinates) {
  return ee.Geometry.MultiLineString.apply(null, arguments);
};


/**
 * Construct a Polygon from the given coordinates, either a list of points,
 * or an array of linear rings. If created from points, only an outer ring
 * can be specified.
 *
 * @param {number|!Array.<!Array.<!Array.<number>>>} coordinates The polygon
 *     coordinates as either a var_args list of numbers, or an array of rings,
 *     each of which is an array of points.
 * @return {ee.Geometry} The newly constructed polygon.
 * @export
 *
 * TODO(user): This actually doesn't accept an array of
 * ee.Feature.LinearRings, but it should.
 */
ee.Feature.Polygon = function(coordinates) {
  return ee.Geometry.Polygon.apply(null, arguments);
};


/**
 * Create a new GeoJSON MultiPolygon from either a list of points, or an array
 * of Polygons.  If created from points, only one polygon can be specified.
 *
 * @param {number|!Array.<!Array.<!Array.<!Array.<number>>>>} coordinates The
 *     multipolygon coordinates either as a var_args list of numbers of
 *     an array of polygons.
 * @return {ee.Geometry} The newly constructed MultiPolygon.
 * @export
 *
 * TODO(user): This actually doesn't accept an array of
 * ee.Feature.Polygon, but it should.
 */
ee.Feature.MultiPolygon = function(coordinates) {
  return ee.Geometry.MultiPolygon.apply(null, arguments);
};


/**
 * Overrides one or more metadata properties of a Feature.
 *
 * @param {Object.<*>} properties The property values to override.
 * @return {ee.Feature} The feature with the specified properties overridden.
 * @export
 */
ee.Feature.prototype.set = function(properties) {
  // NOTE: This is virtually identical to Image.set() and relies on its test.
  if (arguments.length != 1 || !goog.isObject(properties)) {
    throw Error('Feature.set() takes only one argument (a dictionary).');
  }
  // Try to be smart about interpreting the argument.
  // Check that we have a plain object, with 1 property called 'properties',
  // which is itself a plain object.
  if (properties.constructor == Object &&
      goog.array.equals(goog.object.getKeys(properties), ['properties']) &&
      goog.isObject(properties['properties']) &&
      properties['properties'].constructor == Object) {
    // Looks like a call with keyword parameters. Extract them.
    properties = /** @type {Object.<*>} */(properties['properties']);
  }
  // Manually cast the result to a feature.
  return new ee.Feature(ee.ApiFunction._call('Feature.set', this, properties));
};


/** @inheritDoc */
ee.Feature.prototype.name = function() {
  return 'Feature';
};
