# Copyright 2012 Google Inc. All Rights Reserved.

"""An object representing EE Features."""



# Using old-style python function naming on purpose to match the
# javascript version's naming.
# pylint: disable-msg=C6003,C6409

import collections
import numbers

import ee_exception
import image
import serializer


class Feature(object):
  """An object representing EE Features."""

  def __init__(self, geometry, opt_properties=None):
    """Create a feature from either a GeoJSON geometry or another feature.

    Args:
      geometry: The geometry to use, or a pre-constructed Feature, or a JSON
          description of a call that returns a feature.
      opt_properties: A dictionary of metadata properties.  If a Feature
          is passed (instead of a geometry) this is unused.

    Raises:
      EEException: if the given geometry isn't valid.

    """
    if isinstance(geometry, Feature):
      if opt_properties is not None:
        raise ee_exception.EEException(
            'Can\'t create Feature out of a Feature and properties.')
      # pylint: disable-msg=protected-access
      self._description = dict(geometry._description)
      # pylint: enable-msg=protected-access
      return

    if 'algorithm' in geometry or geometry.get('type') == 'Variable':
      if opt_properties:
        self._description = {
            'algorithm': 'Feature',
            'geometry': geometry,
            'metadata': opt_properties
        }
      else:
        self._description = geometry
    else:
      if Feature.isValidGeometry(geometry):
        self._description = {
            'algorithm': 'Feature',
            'geometry': geometry,
            'metadata': opt_properties or {}
        }
      else:
        raise ee_exception.EEException('Invalid geometry.')

  def __eq__(self, other):
    return self._description == other._description   # pylint: disable-msg=W0212

  def __ne__(self, other):
    return self._description != other._description   # pylint: disable-msg=W0212

  def __str__(self):
    """Writes out the feature in a human-readable form."""
    return 'Feature(%s)' % serializer.toJSON(self._description)

  def __repr__(self):
    """Writes out the feature in an eval-able form."""
    return 'ee.Feature(%s)' % self._description

  def serialize(self, opt_pretty=True):
    """Serialize this object into a JSON string.

    Args:
      opt_pretty: A flag indicating whether to pretty-print the JSON.

    Returns:
      A JSON represenation of this image.
    """
    return serializer.toJSON(self._description, opt_pretty)

  def getMapId(self, vis_params=None):
    """Fetch and return a map id and token, suitable for use in a Map overlay.

    Args:
      vis_params: The visualization parameters. Currently only one parameter,
          'color', containing a hex RGB color string is allowed.

    Returns:
      An object containing a mapid string, an access token, plus a DrawVector
      image wrapping a FeatureCollection containing this feature.
    """
    painted = image.Image({
        'algorithm': 'DrawVector',
        'collection': {
            'type': 'FeatureCollection',
            'features': [self]
        },
        'color': (vis_params or {}).get('color', '000000')
    })
    return painted.getMapId({})

  @staticmethod
  def isValidGeometry(geometry):
    """Check if a geometry looks valid.

    Args:
      geometry: The geometry to check.

    Returns:
      True if the geometry looks valid.
    """
    t = geometry.get('type')
    coords = geometry.get('coordinates')
    return (
        ((t == 'Point' and Feature.validateCoordinates(coords) == 1) or
         (t == 'MultiPoint' and Feature.validateCoordinates(coords) == 2) or
         (t == 'LineString' and Feature.validateCoordinates(coords) == 2) or
         (t == 'LinearRing' and Feature.validateCoordinates(coords) == 2) or
         (t == 'MultiLine' and Feature.validateCoordinates(coords) == 3) or
         (t == 'Polygon' and Feature.validateCoordinates(coords) == 3) or
         (t == 'MultiPolygon' and Feature.validateCoordinates(coords) == 4)))

  @staticmethod
  def validateCoordinates(shape):
    """Validate the coordinates of a geometry.

    Args:
      shape: The coordinates to validate.

    Returns:
      The number of nested arrays or -1 on error.
    """
    if not isinstance(shape, collections.Iterable):
      return -1

    shape = list(shape)
    if isinstance(shape[0], collections.Iterable):
      count = Feature.validateCoordinates(shape[0])
      # If more than 1 ring or polygon, they should have the same nesting.
      for i in xrange(1, len(shape)):
        if Feature.validateCoordinates(shape[i]) != count:
          return -1
      return count + 1
    else:
      # Make sure the pts are all numbers.
      for i in xrange(0, len(shape)):
        if not isinstance(shape[i], numbers.Number):
          return -1

      # Test that we have an even number of pts.
      if len(shape) % 2 == 0:
        return 1
      else:
        return -1

  @staticmethod
  def coordinatesToLine(coordinates):
    """Create a line from a list of points.

    Args:
      coordinates: The points to convert.  Must be list of numbers of
          even length, in the format [x1, y1, x2, y2, ...]

    Returns:
      An array of pairs of points.
    """
    if isinstance(coordinates[0], numbers.Number):
      line = []
      for i in xrange(0, len(coordinates), 2):
        pt = [coordinates[i], coordinates[i + 1]]
        line.append(pt)

      coordinates = line
    return coordinates

  @staticmethod
  def _makeGeometry(geometry, nesting, opt_coordinates=()):
    """Check that the given geometry has the specified level of nesting.

    If the user passed a list of points to one of the Geometry functions,
    then geometry will not be used and the coordinates in opt_coordinates
    will be processed instead.  This is to allow calls such as:
    Polygon(1,2,3,4,5,6) and Polygon([[[1,2],[3,4],[5,6]]])

    Args:
      geometry: The geometry to check.
      nesting: The expected level of array nesting.
      opt_coordinates: A list of coordinates to decode.

    Returns:
      The processed geometry.

    Raises:
      EEException: if the nesting level of the arrays isn't supported.
    """
    if nesting < 2 or nesting > 4:
      raise ee_exception.EEException('Unexpected nesting level.')

    # Handle a list of points.
    if isinstance(geometry, numbers.Number) and opt_coordinates:
      coordinates = [geometry]
      coordinates.extend(opt_coordinates)
      geometry = Feature.coordinatesToLine(coordinates)

    # Make sure the number of nesting levels is correct.
    item = geometry
    count = 0
    while isinstance(item, list) or isinstance(item, tuple):
      item = item[0]
      count += 1

    while count < nesting:
      geometry = [geometry]
      count += 1

    return geometry

  @staticmethod
  def Point(lon, lat):
    """Construct a GeoJSON Point.

    Args:
      lon: The longitude of the point.
      lat: The latitude of the point.

    Returns:
      A dictionary representing a GeoJSON Point.
    """
    return {
        'type': 'Point',
        'coordinates': [lon, lat]
        }

  @staticmethod
  def MultiPoint(coordinates, *rest):
    """Create a GeoJSON MultiPoint.

    Args:
      coordinates: The coordinates as either an array of [lon, lat] tuples,
          or literal pairs of coordinate longitudes and latitudes, such as
          MultiPoint(1, 2, 3, 4).

    Returns:
      A dictionary representing a GeoJSON MultiPoint.
    """
    return {
        'type': 'MultiPoint',
        'coordinates': Feature._makeGeometry(coordinates, 2, rest)
        }

  @staticmethod
  def Rectangle(xlo, ylo, xhi, yhi):
    """Construct a rectangular polygon from the given corner points.

    Args:
      xlo: The lower left x coordinate.
      ylo: The lower left y coordinate.
      xhi: The upper right x coordinate.
      yhi: The upepr right y coordinate.

    Returns:
      A dictionary representing a GeoJSON Polygon.
    """
    return {
        'type': 'Polygon',
        'coordinates': [[[xlo, yhi], [xlo, ylo], [xhi, ylo], [xhi, yhi]]]
        }

  @staticmethod
  def LineString(coordinates, *rest):
    """Create a GeoJSON LineString.

    Args:
      coordinates: The coordinates as either an array of [lon, lat] tuples,
          or literal pairs of coordinate longitudes and latitudes, such as
          LineString(1, 2, 3, 4).

    Returns:
      A dictionary representing a GeoJSON LineString.
    """
    return {
        'type': 'LineString',
        'coordinates': Feature._makeGeometry(coordinates, 2, rest)
        }

  @staticmethod
  def LinearRing(coordinates, *rest):
    """Construct a LinearRing from the given coordinates.

    Args:
      coordinates: The coordinates as either an array of [lon, lat] tuples,
          or literal pairs of coordinate longitudes and latitudes, such as
          LinearRing(1, 2, 3, 4, 5, 6).

    Returns:
      A dictionary representing a GeoJSON LinearRing.
    """
    return {
        'type': 'LinearRing',
        'coordinates': Feature._makeGeometry(coordinates, 2, rest)
        }

  @staticmethod
  def MultiLine(coordinates, *rest):
    """Create a GeoJSON MutliLine.

    Create a GeoJSON MultiLine from either a list of points, or an array
    of lines (each an array of Points).  If a list of points is specified,
    only a single line is created.

    Args:
      coordinates: The coordinates as either an array of arrays of
          [lon, lat] tuples, or literal pairs of coordinate longitudes
          and latitudes, such as MultiLine(1, 2, 3, 4, 5, 6).

    Returns:
      A dictionary representing a GeoJSON MultiLine.

    TODO(user): This actually doesn't accept an array of
    Feature.LineString, but it should.
    """
    return {
        'type': 'MultiLine',
        'coordinates': Feature._makeGeometry(coordinates, 3, rest)
        }

  @staticmethod
  def Polygon(coordinates, *rest):
    """Create a GeoJSON Polygon.

    Create a GeoJSON Polygon from either a list of points, or an array of
    linear rings.  If created from points, only an outer ring can be specified.

    Args:
      coordinates: The polygon coordinates as either a var_args list of
          numbers, or an array of rings, each of which is an array of points.

    Returns:
      A dictionary representing a GeoJSON polygon.

    TODO(user): This actually doesn't accept an array of
    Feature.LinearRings, but it should.
    """
    return {
        'type': 'Polygon',
        'coordinates': Feature._makeGeometry(coordinates, 3, rest)
        }

  @staticmethod
  def MultiPolygon(coordinates, *rest):
    """Create a GeoJSON MultiPolygon.

    If created from points, only one polygon can be specified.

    Args:
      coordinates: The multipolygon coordinates either as a var_args list
      of numbers of an array of polygons.
    Returns:
      A dictionary representing a GeoJSON MultiPolygon.

    TODO(user): This actually doesn't accept an array of
    Feature.Polygon, but it should.
    """
    return {
        'type': 'MultiPolygon',
        'coordinates': Feature._makeGeometry(coordinates, 4, rest)
        }
