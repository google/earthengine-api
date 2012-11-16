// Copyright 2012 Google Inc. All Rights Reserved.

/**
 * @fileoverview An object representing EE Features.
 */
goog.provide('ee.Feature');
goog.provide('ee.Geometry');

goog.require('ee');
goog.require('ee.Image');
goog.require('ee.Serializer');



/**
 * Create a feature out of a geometry, with the specified metadata properties.
 * @param {ee.Geometry|ee.Feature|Object} geometry The geometry to use, or a
 *     pre-constructed Feature, or a JSON description of a call that returns
 *     a feature.
 * @param {Object=} opt_properties A dictionary of metadata properties.  If a
       Feature is passed (instead of a geometry) this is unused.
 * @constructor
 */
ee.Feature = function(geometry, opt_properties) {
  if (!(this instanceof ee.Feature)) {
    return new ee.Feature(geometry, opt_properties);
  }
  ee.initialize();
  if (geometry instanceof ee.Feature) {
    if (opt_properties) {
      throw new Error('Can\'t create Feature out of a Feature and properties.');
    }
    return geometry;
  }
  if (geometry['coordinates'] &&
      ee.Feature.validGeometry(/** @type {ee.Geometry} */ (geometry))) {
    this.description_ = {
      'type': 'Feature',
      'geometry': geometry,
      'properties': opt_properties
    };
  } else if (geometry['type'] == 'Feature' ||
             ('algorithm' in geometry && opt_properties === undefined)) {
    this.description_ = geometry;
  } else {
    throw new Error('Not a geometry, feature or JSON description.');
  }
};


/**
 * An imperative function that returns a map ID and token, suitable for
 * generating a Map overlay.
 *
 * @param {Object?=} opt_visParams The visualization parameters. Currently only
 *     one parameter, 'color', containing an RGB color string is user.  If
 *     vis_params is null, black ("000000") is used.
 * @param {function(Object, string=)=} opt_callback An async callback.
 * @return {ee.data.mapid} An object containing a mapid string, an access
 *    token, plus a DrawVector image wrapping a FeatureCollection containing
 *    this feature.
 */
ee.Feature.prototype.getMap = function(opt_visParams, opt_callback) {
  var painted = new ee.Image({
    'algorithm': 'DrawVector',
    'collection': {
      'type': 'FeatureCollection',
      'features': [this]
    },
    'color': (opt_visParams || {})['color'] || '000000'
  });

  if (opt_callback) {
    painted.getMap(null, opt_callback);
  } else {
    return painted.getMap();
  }
};


/**
 * Check if a geometry looks valid.
 * @param {ee.Geometry} geometry The geometry to validate.
 * @return {boolean} True if the geometry looks valid.
 */
ee.Feature.validGeometry = function(geometry) {
  var type = geometry['type'];
  var coords = geometry['coordinates'];
  var nesting = ee.Feature.validCoordinates(coords);
  return (type == 'Point' && nesting == 1) ||
      (type == 'MultiPoint' && nesting == 2) ||
      (type == 'LineString' && nesting == 2) ||
      (type == 'LinearRing' && nesting == 2) ||
      (type == 'MultiLine' && nesting == 3) ||
      (type == 'Polygon' && nesting == 3) ||
      (type == 'MultiPolygon' && nesting == 4);
};


/**
 * Validate the coordinates of a geometry.
 * @param {number|!Array.<*>} shape The coordinates to validate.
 *
 * @return {number} The number of nested arrays or -1 on error.
 */
ee.Feature.validCoordinates = function(shape) {
  if (!goog.isArray(shape)) {
    return -1;
  }
  if (goog.isArray(shape[0])) {
    var count = ee.Feature.validCoordinates(shape[0]);
    // If more than 1 ring or polygon, they should have the same nesting.
    for (var i = 1; i < shape.length; i++) {
      if (ee.Feature.validCoordinates(shape[i]) != count) {
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
 */
ee.Feature.coordinatesToLine = function(coordinates) {
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
 * @param {Array.<number>=} opt_coordinates A list of coordinates to decode
 *     from the calling function's arguments parameter.
 * @return {!Array.<*>} The processed geometry.
 * @private
 */
ee.Feature.makeGeometry_ = function(geometry, nesting, opt_coordinates) {
  if (nesting < 2 || nesting > 4) {
    throw new Error('Unexpected nesting level.');
  }

  // Handle a list of points.
  if (!goog.isArray(geometry) && opt_coordinates) {
    geometry = ee.Feature.coordinatesToLine(
        Array.prototype.slice.call(
            /** @type {goog.array.ArrayLike} */ (opt_coordinates)));
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

  if (ee.Feature.validCoordinates(geometry) != nesting) {
    throw Error('Invalid geometry');
  }

  return (/** @type {!Array.<*>} */ geometry);
};


/**
 * @typedef {{
 *     type: string,
 *     coordinates: !Array.<*>
 * }}
 * TODO(user): consider promoting this up to its own class, and
 * moving all the shape creators below.  The downside is, it's another
 * entire class for users to deal with.
 */
ee.Geometry;


/**
 * Construct a GeoJSON point.
 *
 * @param {number} lon The longitude of the point.
 * @param {number} lat The latitude of the point.
 * @return {Object} A GeoJSON Point.
 */
ee.Feature.Point = function(lon, lat) {
  return {
    'type': 'Point',
    'coordinates': [lon, lat]
  };
};


/**
 * Construct a GeoJSON MultiPoint.
 *
 * @param {number|!Array.<!Array.<number>>} coordinates The coordinates as
 *     either an array of [lon, lat] tuples, or literal pairs of
 *     coordinate longitudes and latitudes, such as MultiPoint(1, 2, 3, 4).
 * @return {Object} A GeoJSON MultiPoint object.
 */
ee.Feature.MultiPoint = function(coordinates) {
  return {
    'type': 'MultiPoint',
    'coordinates': ee.Feature.makeGeometry_(
        coordinates, 2, /** @type {!Array.<number>} */ (arguments))
  };
};


/**
 * Construct a rectangular polygon from the given corner points.
 *
 * @param {number} lon1 Longitude of the first corner point.
 * @param {number} lat1 Latitude of the first corner point.
 * @param {number} lon2 Longiude of the second corner point.
 * @param {number} lat2 latitude of the second corner point.
 * @return {Object} A GeoJSON Polygon.
 */
ee.Feature.Rectangle = function(lon1, lat1, lon2, lat2) {
  if (goog.isArray(lon1)) {
    var args = lon1;
    lon1 = args[0];
    lat1 = args[1];
    lon2 = args[2];
    lat2 = args[3];
  }
  return {
    'type': 'Polygon',
    'coordinates': [[[lon1, lat2], [lon1, lat1], [lon2, lat1], [lon2, lat2]]]
  };
};


/**
 * Construct a LineString from the given coordinates.
 *
 * @param {number|!Array.<!Array.<number>>} coordinates The coordinates as
 *     either an array of [lon, lat] tuples, or literal pairs of
 *     coordinate longitudes and latitudes, such as LineString(1, 2, 3, 4).
 *
 * @return {ee.Geometry} A GeoJSON LineString.
 */
ee.Feature.LineString = function(coordinates) {
  return {
    'type': 'LineString',
    'coordinates': ee.Feature.makeGeometry_(
        coordinates, 2, /** @type {!Array.<number>} */ (arguments))
  };
};


/**
 * Construct a LinearRing from the given coordinates.
 *
 * @param {number|!Array.<!Array.<number>>} coordinates The coordinates as
 *     either an array of [lon, lat] tuples, or literal pairs of coordinate
 *     longitudes and latitudes, such as LinearRing(1, 2, 3, 4, 5, 6).
 *
 * @return {ee.Geometry} A GeoJSON LinearRing.
 */
ee.Feature.LinearRing = function(coordinates) {
  return {
    'type': 'LinearRing',
    'coordinates': ee.Feature.makeGeometry_(
        coordinates, 2, /** @type {!Array.<number>} */ (arguments))
  };
};


/**
 * Construct a MultiLine from the given coordinates.
 * Create a new GeoJSON MultiLine from either a list of points, or an
 * array of linestrings.
 *
 * @param {number|!Array.<!Array.<!Array.<number>>>} coordinates The MultiLine
 *     coordinates as either a var_args list of numbers, or an array of
 *     lineStrings, each of which is an array of points.
 * @return {ee.Geometry} The newly constructed MultiLine.
 *
 * TODO(user): This actually doesn't accept an array of
 * ee.Feature.LineStrings, but it should.
 */
ee.Feature.MultiLine = function(coordinates) {
  return {
    'type': 'MultiLine',
    'coordinates': ee.Feature.makeGeometry_(
        coordinates, 3, /** @type {!Array.<number>} */ (arguments))
  };
};


/**
 * Construct a Polygon from the given coordinates.
 * Create a new GeoJSON Polygon from either a list of points, or an
 * array of linear rings.  If created from points, only an outer ring
 * can be specified.
 *
 * @param {number|!Array.<!Array.<!Array.<number>>>} coordinates The polygon
 *     coordinates as either a var_args list of numbers, or an array of rings,
 *     each of which is an array of points.
 * @return {ee.Geometry} The newly constructed polygon.
 *
 * TODO(user): This actually doesn't accept an array of
 * ee.Feature.LinearRings, but it should.
 */
ee.Feature.Polygon = function(coordinates) {
  return {
    'type': 'Polygon',
    'coordinates': ee.Feature.makeGeometry_(
        coordinates, 3, /** @type {!Array.<number>} */ (arguments))
  };
};


/**
 * Create a new GeoJSON MultiPolygon from either a list of points, or an array
 * of Polygons.  If created from points, only one polygon can be specified.
 *
 * @param {number|!Array.<!Array.<!Array.<!Array.<number>>>>} coordinates The
 *     multipolygon coordinates either as a var_args list of numbers of
 *     an array of polygons.
 * @return {ee.Geometry} The newly constructed MultiPolygon.
 *
 * TODO(user): This actually doesn't accept an array of
 * ee.Feature.Polygon, but it should.
 */
ee.Feature.MultiPolygon = function(coordinates) {
  return {
    'type': 'MultiPolygon',
    'coordinates': ee.Feature.makeGeometry_(
        coordinates, 4, /** @type {!Array.<number>} */ (arguments))
  };
};


/**
 * JSON serializer.
 * @return {string} The serialized representation of this object.
 */
ee.Feature.prototype.serialize = function() {
  return ee.Serializer.toJSON(this.description_);
};


/** @override */
ee.Feature.prototype.toString = function() {
  return 'ee.Feature(' + ee.Serializer.toReadableJSON(this.description_) + ')';
};

goog.exportSymbol('ee.Feature', ee.Feature);
goog.exportProperty(ee.Feature, 'validGeometry',
                    ee.Feature.validGeometry);
goog.exportProperty(ee.Feature, 'validCoordinates',
                    ee.Feature.validCoordinates);
goog.exportProperty(ee.Feature, 'Point', ee.Feature.Point);
goog.exportProperty(ee.Feature, 'MultiPoint', ee.Feature.MultiPoint);
goog.exportProperty(ee.Feature, 'Rectangle', ee.Feature.Rectangle);
goog.exportProperty(ee.Feature, 'LineString', ee.Feature.LineString);
goog.exportProperty(ee.Feature, 'LinearRing', ee.Feature.LinearRing);
goog.exportProperty(ee.Feature, 'MultiLine', ee.Feature.MultiLine);
goog.exportProperty(ee.Feature, 'Polygon', ee.Feature.Polygon);
goog.exportProperty(ee.Feature, 'MultiPolygon', ee.Feature.MultiPolygon);
goog.exportProperty(ee.Feature, 'getMap', ee.Feature.prototype.getMap);
goog.exportProperty(ee.Feature.prototype, 'serialize',
                    ee.Feature.prototype.serialize);
goog.exportProperty(ee.Feature.prototype, 'toString',
                    ee.Feature.prototype.toString);
