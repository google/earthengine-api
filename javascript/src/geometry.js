/**
 * @fileoverview An object representing EE Geometries.
 */

goog.provide('ee.Geometry');

goog.require('ee.ApiFunction');
goog.require('ee.ComputedObject');
goog.require('ee.Serializer');
goog.require('goog.json.Serializer');



/**
 * Creates a geometry.
 * @param {Object} geoJson The GeoJSON object describing the geometry or
 *     a CompuedObject to be reinterpreted as a Geometry. Supports
 *     CRS specifications as per the GeoJSON spec, but only allows named
 *     (rather than "linked" CRSs). If this includes a 'geodesic' field,
 *     and opt_geodesic is not specified, it will be used as opt_geodesic.
 * @param {String=} opt_proj An optional projection specification, either as
 *     a CRS ID code or as a WKT string. If specified, overrides any CRS found
 *     in the geoJson parameter. If unspecified and the geoJson does not
 *     declare a CRS, defaults to "EPSG:4326" (x=longitude, y=latitude).
 * @param {boolean=} opt_geodesic Whether line segments should be interpreted
 *     as spherical geodesics. If false, indicates that line segments should
 *     be interpreted as planar lines in the specified CRS. If absent, defaults
 *     to true if the CRS is geographic (including the default EPSG:4326),
 *     or to false if the CRS is projected.
 * @constructor
 * @extends {ee.ComputedObject}
 */
ee.Geometry = function(geoJson, opt_proj, opt_geodesic) {
  if (!(this instanceof ee.Geometry)) {
    return new ee.Geometry(geoJson, opt_proj, opt_geodesic);
  }

  ee.Geometry.initialize();

  var computed = geoJson instanceof ee.ComputedObject && Boolean(geoJson.func);
  var options = (goog.isDefAndNotNull(opt_proj) ||
                 goog.isDefAndNotNull(opt_geodesic));
  if (computed) {
    if (options) {
      throw new Error(
          'Setting the CRS or geodesic on a computed Geometry ' +
          'is not suported.  Use Geometry.transform().');
    } else {
      goog.base(this, geoJson.func, geoJson.args);
      return;
    }
  }

  // Below here, we're working with a GeoJSON literal.
  if (geoJson instanceof ee.Geometry) {
    geoJson = /** @type {Object} */(geoJson.encode());
  }

  if (arguments.length > 3) {
    throw Error('The Geometry constructor takes at most 3 arguments (' +
                arguments.length + ' given)');
  }

  if (!ee.Geometry.isValidGeometry_(geoJson)) {
    throw Error('Invalid GeoJSON geometry: ' + JSON.stringify(geoJson));
  }

  goog.base(this, null, null);
  /**
   * The type of the geometry.
   * @type {string}
   * @private
   */
  this.type_ = geoJson['type'];

  /**
   * The coordinates of the geometry, up to 4 nested levels with numbers at
   * the last level. Null iff type is GeometryCollection.
   * @type {Array?}
   * @private
   */
  this.coordinates_ = geoJson['coordinates'] || null;

  /**
   * The subgeometries, non-null iff type is GeometryCollection.
   * @type {Array?}
   * @private
   */
  this.geometries_ = geoJson['geometries'] || null;

  /**
   * The projection of the geometry.
   * @type {String|undefined}
   * @private
   */
  this.proj_ = opt_proj;

  /**
   * Whether the geometry has spherical geodesic edges.
   * @type {boolean|undefined}
   * @private
   */
  this.geodesic_ = opt_geodesic;
  if (!goog.isDef(opt_geodesic) && 'geodesic' in geoJson) {
    this.geodesic_ = Boolean(geoJson['geodesic']);
  }
};
goog.inherits(ee.Geometry, ee.ComputedObject);


/**
 * Whether the class has been initialized with API functions.
 * @type {boolean}
 * @private
 */
ee.Geometry.initialized_ = false;


/**
 * Imports API functions to this class.
 * @hidden
 */
ee.Geometry.initialize = function() {
  if (!ee.Geometry.initialized_) {
    ee.ApiFunction.importApi(ee.Geometry, 'Geometry', 'Geometry');
    ee.Geometry.initialized_ = true;
  }
};


/**
 * Removes imported API functions from this class.
 * @hidden
 */
ee.Geometry.reset = function() {
  ee.ApiFunction.clearApi(ee.Geometry);
  ee.Geometry.initialized_ = false;
};


/**
 * Constructs a GeoJSON point.
 *
 * @param {number|Array.<number>} lon The longitude of the point, or
 *     a tuple of the longitude and latitude, in which case lat is ignored.
 * @param {number} lat The latitude of the point.
 * @constructor
 * @extends {ee.Geometry}
 */
ee.Geometry.Point = function(lon, lat) {
  if (!(this instanceof ee.Geometry.Point)) {
    return ee.Geometry.createInstance_(ee.Geometry.Point, arguments);
  }

  if (arguments.length > 2) {
    throw Error('The Geometry.Point constructor takes at most 2 arguments (' +
                arguments.length + ' given)');
  }

  if (arguments.length == 1 &&
      goog.isArray(arguments[0]) &&
      arguments[0].length == 2) {
    var coords = arguments[0];
    lon = coords[0];
    lat = coords[1];
  }
  goog.base(this, {
    'type': 'Point',
    'coordinates': [lon, lat]
  });
};
goog.inherits(ee.Geometry.Point, ee.Geometry);



/**
 * Constructs a GeoJSON MultiPoint.
 *
 * @param {number|!Array.<!Array.<number>>} coordinates The coordinates as
 *     either an array of [lon, lat] tuples, or literal pairs of
 *     coordinate longitudes and latitudes, such as MultiPoint(1, 2, 3, 4).
 * @constructor
 * @extends {ee.Geometry}
 */
ee.Geometry.MultiPoint = function(coordinates) {
  if (!(this instanceof ee.Geometry.MultiPoint)) {
    return ee.Geometry.createInstance_(ee.Geometry.MultiPoint, arguments);
  }
  goog.base(this, {
    'type': 'MultiPoint',
    'coordinates': ee.Geometry.makeGeometry_(coordinates, 2, arguments)
  });
};
goog.inherits(ee.Geometry.MultiPoint, ee.Geometry);



/**
 * Constructs a rectangular polygon from the given corner points.
 *
 * @param {number} lon1 The minimum X coordinate (e.g. longitude).
 * @param {number} lat1 The minimum Y coordinate (e.g. latitude).
 * @param {number} lon2 The maximum X coordinate (e.g. longitude).
 * @param {number} lat2 The maximum Y coordinate (e.g. latitude).
 * @constructor
 * @extends {ee.Geometry}
 */
ee.Geometry.Rectangle = function(lon1, lat1, lon2, lat2) {
  if (!(this instanceof ee.Geometry.Rectangle)) {
    return new ee.Geometry.Rectangle(lon1, lat1, lon2, lat2);
  }

  if (arguments.length > 4) {
    throw Error('The Geometry.Rectangle constructor takes at most 4 ' +
                'arguments (' + arguments.length + ' given)');
  }

  if (goog.isArray(lon1)) {
    var args = lon1;
    lon1 = args[0];
    lat1 = args[1];
    lon2 = args[2];
    lat2 = args[3];
  }
  goog.base(this, {
    'type': 'Polygon',
    'coordinates': [[[lon1, lat2], [lon1, lat1], [lon2, lat1], [lon2, lat2]]]
  });
};
goog.inherits(ee.Geometry.Rectangle, ee.Geometry);



/**
 * Constructs a LineString from the given coordinates.
 *
 * @param {number|!Array.<!Array.<number>>} coordinates The coordinates as
 *     either an array of [lon, lat] tuples, or literal pairs of
 *     coordinate longitudes and latitudes, such as LineString(1, 2, 3, 4).
 * @constructor
 * @extends {ee.Geometry}
 */
ee.Geometry.LineString = function(coordinates) {
  if (!(this instanceof ee.Geometry.LineString)) {
    return ee.Geometry.createInstance_(ee.Geometry.LineString, arguments);
  }
  goog.base(this, {
    'type': 'LineString',
    'coordinates': ee.Geometry.makeGeometry_(coordinates, 2, arguments)
  });
};
goog.inherits(ee.Geometry.LineString, ee.Geometry);



/**
 * Constructs a LinearRing from the given coordinates.
 *
 * @param {number|!Array.<!Array.<number>>} coordinates The coordinates as
 *     either an array of [lon, lat] tuples, or literal pairs of coordinate
 *     longitudes and latitudes, such as LinearRing(1, 2, 3, 4, 5, 6).
 * @constructor
 * @extends {ee.Geometry}
 */
ee.Geometry.LinearRing = function(coordinates) {
  if (!(this instanceof ee.Geometry.LinearRing)) {
    return ee.Geometry.createInstance_(ee.Geometry.LinearRing, arguments);
  }
  goog.base(this, {
    'type': 'LinearRing',
    'coordinates': ee.Geometry.makeGeometry_(coordinates, 2, arguments)
  });
};
goog.inherits(ee.Geometry.LinearRing, ee.Geometry);



/**
 * Constructs a MultiLineString from the given coordinates, either a list of
 * points, or an array of LineStrings.
 *
 * @param {number|!Array.<!Array.<!Array.<number>>>} coordinates The
 *     MultiLineString coordinates as either a var_args list of numbers, or
 *     an array of LineStrings, each of which is an array of points.
 * @constructor
 * @extends {ee.Geometry}
 *
 * TODO(user): This actually doesn't accept an array of
 * ee.Geometry.LineStrings, but it should.
 */
ee.Geometry.MultiLineString = function(coordinates) {
  if (!(this instanceof ee.Geometry.MultiLineString)) {
    return ee.Geometry.createInstance_(ee.Geometry.MultiLineString, arguments);
  }
  goog.base(this, {
    'type': 'MultiLineString',
    'coordinates': ee.Geometry.makeGeometry_(coordinates, 3, arguments)
  });
};
goog.inherits(ee.Geometry.MultiLineString, ee.Geometry);



/**
 * Constructs a Polygon from the given coordinates, either a list of points,
 * or an array of linear rings. If created from points, only an outer ring
 * can be specified.
 *
 * @param {number|!Array.<!Array.<!Array.<number>>>} coordinates The polygon
 *     coordinates as either a var_args list of numbers, or an array of rings,
 *     each of which is an array of points.
 * @constructor
 * @extends {ee.Geometry}
 *
 * TODO(user): This actually doesn't accept an array of
 * ee.Geometry.LinearRings, but it should.
 */
ee.Geometry.Polygon = function(coordinates) {
  if (!(this instanceof ee.Geometry.Polygon)) {
    return ee.Geometry.createInstance_(ee.Geometry.Polygon, arguments);
  }
  goog.base(this, {
    'type': 'Polygon',
    'coordinates': ee.Geometry.makeGeometry_(coordinates, 3, arguments)
  });
};
goog.inherits(ee.Geometry.Polygon, ee.Geometry);



/**
 * Cosntructs a new GeoJSON MultiPolygon from either a list of points, or an
 * array of Polygons.  If created from points, only one polygon can be
 * specified.
 *
 * @param {number|!Array.<!Array.<!Array.<!Array.<number>>>>} coordinates The
 *     multipolygon coordinates either as a var_args list of numbers of
 *     an array of polygons.
 * @constructor
 * @extends {ee.Geometry}
 *
 * TODO(user): This actually doesn't accept an array of
 * ee.Geometry.Polygon, but it should.
 */
ee.Geometry.MultiPolygon = function(coordinates) {
  if (!(this instanceof ee.Geometry.MultiPolygon)) {
    return ee.Geometry.createInstance_(ee.Geometry.MultiPolygon, arguments);
  }
  goog.base(this, {
    'type': 'MultiPolygon',
    'coordinates': ee.Geometry.makeGeometry_(coordinates, 4, arguments)
  });
};
goog.inherits(ee.Geometry.MultiPolygon, ee.Geometry);


/**
 * @param {function(*): *=} opt_encoder A function that can be called to encode
 *    the components of an object.
 * @return {*} A GeoJSON-compatible representation of the geometry.
 */
ee.Geometry.prototype.encode = function(opt_encoder) {
  if (this.func) {
    if (!opt_encoder) {
      throw Error('Must specify an encode function when encoding a ' +
                  'computed geometry.');
    }
    return ee.ComputedObject.prototype.encode.call(this, opt_encoder);
  }

  var result = {'type': this.type_};
  if (this.type_ == 'GeometryCollection') {
    result['geometries'] = this.geometries_;
  } else {
    result['coordinates'] = this.coordinates_;
  }

  if (goog.isDefAndNotNull(this.proj_)) {
    result['crs'] = {
      'type': 'name',
      'properties': {
        'name': this.proj_
      }
    };
  }

  if (goog.isDefAndNotNull(this.geodesic_)) {
    result['geodesic'] = this.geodesic_;
  }

  return result;
};


/**
 * @return {Object} A GeoJSON representation of the geometry.
 */
ee.Geometry.prototype.toGeoJSON = function() {
  if (this.func) {
    throw new Error('Can\'t convert a computed Geometry to GeoJSON.  ' +
                    'Use getInfo() instead.');
  }
  return /** @type {Object} */(this.encode());
};


/**
 * @return {string} A GeoJSON string representation of the geometry.
 */
ee.Geometry.prototype.toGeoJSONString = function() {
  if (this.func) {
    throw new Error('Can\'t convert a computed Geometry to GeoJSON.  ' +
                    'Use getInfo() instead.');
  }
  return (new goog.json.Serializer()).serialize(this.toGeoJSON());
};


/**
 * @return {string} The serialized representation of this object.
 */
ee.Geometry.prototype.serialize = function() {
  return ee.Serializer.toJSON(this);
};


/** @inheritDoc */
ee.Geometry.prototype.toString = function() {
  return 'ee.Geometry(' + this.toGeoJSONString() + ')';
};


/**
 * Checks if a geometry looks valid.
 * @param {Object} geometry The geometry to validate.
 * @return {boolean} whether the geometry looks valid.
 * @private
 */
ee.Geometry.isValidGeometry_ = function(geometry) {
  var type = geometry['type'];
  if (type == 'GeometryCollection') {
    var geometries = geometry['geometries'];
    if (!goog.isArray(geometries)) {
      return false;
    }
    for (var i = 0; i < geometries.length; i++) {
      if (!ee.Geometry.isValidGeometry_(geometries[i])) {
        return false;
      }
    }
    return true;
  } else {
    var coords = geometry['coordinates'];
    var nesting = ee.Geometry.isValidCoordinates_(coords);
    return (type == 'Point' && nesting == 1) ||
        (type == 'MultiPoint' && nesting == 2) ||
        (type == 'LineString' && nesting == 2) ||
        (type == 'LinearRing' && nesting == 2) ||
        (type == 'MultiLineString' && nesting == 3) ||
        (type == 'Polygon' && nesting == 3) ||
        (type == 'MultiPolygon' && nesting == 4);
  }
};


/**
 * Validate the coordinates of a geometry.
 * @param {number|!Array.<*>} shape The coordinates to validate.
 * @return {number} The number of nested arrays or -1 on error.
 * @private
 */
ee.Geometry.isValidCoordinates_ = function(shape) {
  if (!goog.isArray(shape)) {
    return -1;
  }
  if (goog.isArray(shape[0])) {
    var count = ee.Geometry.isValidCoordinates_(shape[0]);
    // If more than 1 ring or polygon, they should have the same nesting.
    for (var i = 1; i < shape.length; i++) {
      if (ee.Geometry.isValidCoordinates_(shape[i]) != count) {
        return -1;
      }
    }
    return count + 1;
  } else {
    // Make sure the coordinates are all numbers.
    for (var i = 0; i < shape.length; i++) {
      if (!goog.isNumber(shape[i])) {
        return -1;
      }
    }
    // Test that we have an even number of coordinates.
    return (shape.length % 2 == 0) ? 1 : -1;
  }
};


/**
 * Create a line from a list of points.
 * @param {!Array.<number>} coordinates The points to convert.  Must be a
 *     multiple of 2.
 * @return {!Array.<!Array.<number>>} An array of pairs of points.
 * @private
 */
ee.Geometry.coordinatesToLine_ = function(coordinates) {
  if (typeof(coordinates[0]) == 'number') {
    if (coordinates.length % 2 != 0) {
      throw Error('Invalid number of coordinates: ' + coordinates.length);
    }
    var line = [];
    for (var i = 0; i < coordinates.length; i += 2) {
      var pt = [coordinates[i], coordinates[i + 1]];
      line.push(pt);
    }
    coordinates = line;
  }
  return coordinates;
};


/**
 * Check that the given geometry has the specified level of nesting.
 * If the user passed a list of points to one of the Geometry functions,
 * then geometry will not be used and the coordinates in opt_coordinates will
 * be processed instead.  This is to allow calls such as:
 * Polygon(1,2,3,4,5,6) and Polygon([[[1,2],[3,4],[5,6]]])
 *
 * @param {number|!Array.<*>} geometry The geometry to check.
 * @param {number} nesting The expected level of array nesting.
 * @param {goog.array.ArrayLike=} opt_coordinates A list of coordinates to
 *     decode from the calling function's arguments parameter.
 * @return {!Array.<*>} The processed geometry.
 * @private
 */
ee.Geometry.makeGeometry_ = function(geometry, nesting, opt_coordinates) {
  if (nesting < 2 || nesting > 4) {
    throw new Error('Unexpected nesting level.');
  }

  // Handle a list of points.
  if (!goog.isArray(geometry) && opt_coordinates) {
    geometry = ee.Geometry.coordinatesToLine_(
        Array.prototype.slice.call(opt_coordinates));
  }

  // Make sure the number of nesting levels is correct.
  var item = geometry;
  var count = 0;
  while (goog.isArray(item)) {
    item = item[0];
    count++;
  }
  while (count < nesting) {
    geometry = [geometry];
    count++;
  }

  if (ee.Geometry.isValidCoordinates_(geometry) != nesting) {
    throw Error('Invalid geometry');
  }

  return /** @type {!Array.<*>} */ (geometry);
};


/**
 * Creates an instance of an object given a constructor and a set of arguments.
 * @param {function(this:T, ...[?]): T} klass The class constructor.
 * @param {Arguments} args The arguments to pass to the constructor.
 * @return {T} The new instance.
 * @template T
 * @private
 */
ee.Geometry.createInstance_ = function(klass, args) {
  /** @constructor */
  var f = function() {};
  f.prototype = klass.prototype;
  var instance = new f();
  var result = klass.apply(instance, args);
  return result !== undefined ? result : instance;
};


/** @inheritDoc */
ee.Geometry.prototype.name = function() {
  return 'Geometry';
};


goog.exportSymbol('ee.Geometry', ee.Geometry);
goog.exportProperty(ee.Geometry, 'Point', ee.Geometry.Point);
goog.exportProperty(ee.Geometry, 'MultiPoint', ee.Geometry.MultiPoint);
goog.exportProperty(ee.Geometry, 'Rectangle', ee.Geometry.Rectangle);
goog.exportProperty(ee.Geometry, 'LineString', ee.Geometry.LineString);
goog.exportProperty(ee.Geometry, 'LinearRing', ee.Geometry.LinearRing);
goog.exportProperty(ee.Geometry, 'MultiLineString',
                    ee.Geometry.MultiLineString);
goog.exportProperty(ee.Geometry, 'Polygon', ee.Geometry.Polygon);
goog.exportProperty(ee.Geometry, 'MultiPolygon', ee.Geometry.MultiPolygon);
goog.exportProperty(ee.Geometry.prototype, 'toGeoJSON',
                    ee.Geometry.prototype.toGeoJSON);
goog.exportProperty(ee.Geometry.prototype, 'toGeoJSONString',
                    ee.Geometry.prototype.toGeoJSONString);
goog.exportProperty(ee.Geometry.prototype, 'toString',
                    ee.Geometry.prototype.toString);
