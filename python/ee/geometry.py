"""An object representing EE Geometries."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import collections
import json
import numbers

import apifunction
import computedobject
import ee_exception
import serializer


class Geometry(computedobject.ComputedObject):
  """An Earth Engine geometry."""

  _initialized = False

  def __init__(self, geo_json, opt_proj=None, opt_geodesic=None):
    """Creates a geometry.

    Args:
      geo_json: The GeoJSON object describing the geometry or a
          computed object to be reinterpred as a Geometry. Supports
          CRS specifications as per the GeoJSON spec, but only allows named
          (rather than "linked" CRSs). If this includes a 'geodesic' field,
          and opt_geodesic is not specified, it will be used as opt_geodesic.
      opt_proj: An optional projection specification, either as a CRS ID
          code or as a WKT string. If specified, overrides any CRS found
          in the geo_json parameter. If unspecified and the geo_json does not
          declare a CRS, defaults to "EPSG:4326" (x=longitude, y=latitude).
      opt_geodesic: Whether line segments should be interpreted as spherical
          geodesics. If false, indicates that line segments should be
          interpreted as planar lines in the specified CRS. If absent,
          defaults to true if the CRS is geographic (including the default
          EPSG:4326), or to false if the CRS is projected.

    Raises:
      EEException: if the given geometry isn't valid.
    """
    self.initialize()

    computed = (isinstance(geo_json, computedobject.ComputedObject) and
                not (isinstance(geo_json, Geometry) and
                     geo_json._type is not None))  # pylint: disable=protected-access
    options = opt_proj or opt_geodesic
    if computed:
      if options:
        raise ee_exception.EEException(
            'Setting the CRS or geodesic on a computed Geometry is not '
            'suported.  Use Geometry.transform().')
      else:
        super(Geometry, self).__init__(
            geo_json.func, geo_json.args, geo_json.varName)
        return

    # Below here we're working with a GeoJSON literal.
    if isinstance(geo_json, Geometry):
      geo_json = geo_json.encode()

    if not Geometry._isValidGeometry(geo_json):
      raise ee_exception.EEException('Invalid GeoJSON geometry.')

    super(Geometry, self).__init__(None, None)

    # The type of the geometry.
    self._type = geo_json['type']

    # The coordinates of the geometry, up to 4 nested levels with numbers at
    # the last level. None iff type is GeometryCollection.
    self._coordinates = geo_json.get('coordinates')

    # The subgeometries, None unless type is GeometryCollection.
    self._geometries = geo_json.get('geometries')

    # The projection code (WKT or identifier) of the geometry.
    if opt_proj:
      self._proj = opt_proj
    elif 'crs' in geo_json:
      if (isinstance(geo_json.get('crs'), dict) and
          geo_json['crs'].get('type') == 'name' and
          isinstance(geo_json['crs'].get('properties'), dict) and
          isinstance(geo_json['crs']['properties'].get('name'), basestring)):
        self._proj = geo_json['crs']['properties']['name']
      else:
        raise ee_exception.EEException('Invalid CRS declaration in GeoJSON: ' +
                                       json.dumps(geo_json['crs']))
    else:
      self._proj = None

    # Whether the geometry has spherical geodesic edges.
    self._geodesic = opt_geodesic
    if opt_geodesic is None and 'geodesic' in geo_json:
      self._geodesic = bool(geo_json['geodesic'])

  @classmethod
  def initialize(cls):
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, 'Geometry', 'Geometry')
      cls._initialized = True

  @classmethod
  def reset(cls):
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  def __getitem__(self, key):
    """Allows access to GeoJSON properties for backward-compatibility."""
    return self.toGeoJSON()[key]

  @staticmethod
  def Point(lon, lat=None):
    """Construct a GeoJSON Point.

    Args:
      lon: The longitude of the point, or a (lon, lat) list/tuple.
      lat: The latitude of the point.

    Returns:
      A dictionary representing a GeoJSON Point.
    """
    if (lat is None and
        isinstance(lon, (list, tuple)) and
        len(lon) == 2):
      lon, lat = lon
    return Geometry({
        'type': 'Point',
        'coordinates': [lon, lat]
    })

  @staticmethod
  def MultiPoint(*coordinates):
    """Create a GeoJSON MultiPoint.

    Args:
      *coordinates: The coordinates as either an array of [lon, lat] tuples,
          or literal pairs of coordinate longitudes and latitudes, such as
          MultiPoint(1, 2, 3, 4).

    Returns:
      A dictionary representing a GeoJSON MultiPoint.
    """
    return Geometry({
        'type': 'MultiPoint',
        'coordinates': Geometry._makeGeometry(
            coordinates[0], 2, coordinates[1:])
    })

  @staticmethod
  def Rectangle(xlo, ylo, xhi, yhi):
    """Construct a rectangular polygon from the given corner points.

    Args:
      xlo: The minimum X coordinate (e.g. longitude).
      ylo: The minimum Y coordinate (e.g. latitude).
      xhi: The maximum X coordinate (e.g. longitude).
      yhi: The maximum Y coordinate (e.g. latitude).

    Returns:
      A dictionary representing a GeoJSON Polygon.
    """
    return Geometry({
        'type': 'Polygon',
        'coordinates': [[[xlo, yhi], [xlo, ylo], [xhi, ylo], [xhi, yhi]]]
    })

  @staticmethod
  def LineString(*coordinates):
    """Create a GeoJSON LineString.

    Args:
      *coordinates: The coordinates as either an array of [lon, lat] tuples,
          or literal pairs of coordinate longitudes and latitudes, such as
          LineString(1, 2, 3, 4).

    Returns:
      A dictionary representing a GeoJSON LineString.
    """
    return Geometry({
        'type': 'LineString',
        'coordinates': Geometry._makeGeometry(
            coordinates[0], 2, coordinates[1:])
    })

  @staticmethod
  def LinearRing(*coordinates):
    """Construct a LinearRing from the given coordinates.

    Args:
      *coordinates: The coordinates as either an array of [lon, lat] tuples,
          or literal pairs of coordinate longitudes and latitudes, such as
          LinearRing(1, 2, 3, 4, 5, 6).

    Returns:
      A dictionary representing a GeoJSON LinearRing.
    """
    return Geometry({
        'type': 'LinearRing',
        'coordinates': Geometry._makeGeometry(
            coordinates[0], 2, coordinates[1:])
    })

  @staticmethod
  def MultiLineString(*coordinates):
    """Create a GeoJSON MultiLineString.

    Create a GeoJSON MultiLineString from either a list of points, or an array
    of lines (each an array of Points).  If a list of points is specified,
    only a single line is created.

    Args:
      *coordinates: The coordinates as either an array of arrays of
          [lon, lat] tuples, or literal pairs of coordinate longitudes
          and latitudes, such as MultiLineString(1, 2, 3, 4, 5, 6).

    Returns:
      A dictionary representing a GeoJSON MultiLineString.

    TODO(user): This actually doesn't accept an array of
    Geometry.LineString, but it should.
    """
    return Geometry({
        'type': 'MultiLineString',
        'coordinates': Geometry._makeGeometry(
            coordinates[0], 3, coordinates[1:])
    })

  @staticmethod
  def Polygon(*coordinates):
    """Create a GeoJSON Polygon.

    Create a GeoJSON Polygon from either a list of points, or an array of
    linear rings.  If created from points, only an outer ring can be specified.

    Args:
      *coordinates: The polygon coordinates as either a var_args list of
          numbers, or an array of rings, each of which is an array of points.

    Returns:
      A dictionary representing a GeoJSON polygon.

    TODO(user): This actually doesn't accept an array of
    Geometry.LinearRings, but it should.
    """
    return Geometry({
        'type': 'Polygon',
        'coordinates': Geometry._makeGeometry(
            coordinates[0], 3, coordinates[1:])
    })

  @staticmethod
  def MultiPolygon(*coordinates):
    """Create a GeoJSON MultiPolygon.

    If created from points, only one polygon can be specified.

    Args:
      *coordinates: The multipolygon coordinates either as a var_args list
          of numbers of an array of polygons.

    Returns:
      A dictionary representing a GeoJSON MultiPolygon.

    TODO(user): This actually doesn't accept an array of
    Geometry.Polygon, but it should.
    """
    return Geometry({
        'type': 'MultiPolygon',
        'coordinates': Geometry._makeGeometry(
            coordinates[0], 4, coordinates[1:])
    })

  def encode(self, opt_encoder=None):  # pylint: disable=unused-argument
    """Returns a GeoJSON-compatible representation of the geometry."""
    if not getattr(self, '_type', None):
      return super(Geometry, self).encode(opt_encoder)

    result = {'type': self._type}
    if self._type == 'GeometryCollection':
      result['geometries'] = self._geometries
    else:
      result['coordinates'] = self._coordinates

    if self._proj is not None:
      result['crs'] = {
          'type': 'name',
          'properties': {
              'name': self._proj
          }
      }

    if self._geodesic is not None:
      result['geodesic'] = self._geodesic

    return result

  def toGeoJSON(self):
    """Returns a GeoJSON representation of the geometry."""
    if self.func:
      raise ee_exception.EEException(
          'Can\'t convert a computed geometry to GeoJSON. '
          'Use getInfo() instead.')

    return self.encode()

  def toGeoJSONString(self):
    """Returns a GeoJSON string representation of the geometry."""
    if self.func:
      raise ee_exception.EEException(
          'Can\'t convert a computed geometry to GeoJSON. '
          'Use getInfo() instead.')
    return json.dumps(self.toGeoJSON())

  def type(self):
    """Returns the GeoJSON type of the geometry."""
    if self.func:
      raise ee_exception.EEException(
          'Can\'t get the type of a computed geometry to GeoJSON. '
          'Use getInfo() instead.')
    return self._type

  def serialize(self):
    """Returns the serialized representation of this object."""
    return serializer.toJSON(self)

  def __str__(self):
    return 'ee.Geometry(%s)' % serializer.toReadableJSON(self)

  @staticmethod
  def _isValidGeometry(geometry):
    """Check if a geometry looks valid.

    Args:
      geometry: The geometry to check.

    Returns:
      True if the geometry looks valid.
    """
    if not isinstance(geometry, dict):
      return False
    geometry_type = geometry.get('type')
    if geometry_type == 'GeometryCollection':
      geometries = geometry.get('geometries')
      if not isinstance(geometries, (list, tuple)):
        return False
      for sub_geometry in geometries:
        if not Geometry._isValidGeometry(sub_geometry):
          return False
      return True
    else:
      coords = geometry.get('coordinates')
      nesting = Geometry._isValidCoordinates(coords)
      return ((geometry_type == 'Point' and nesting == 1) or
              (geometry_type == 'MultiPoint' and nesting == 2) or
              (geometry_type == 'LineString' and nesting == 2) or
              (geometry_type == 'LinearRing' and nesting == 2) or
              (geometry_type == 'MultiLineString' and nesting == 3) or
              (geometry_type == 'Polygon' and nesting == 3) or
              (geometry_type == 'MultiPolygon' and nesting == 4))

  @staticmethod
  def _isValidCoordinates(shape):
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
      count = Geometry._isValidCoordinates(shape[0])
      # If more than 1 ring or polygon, they should have the same nesting.
      for i in xrange(1, len(shape)):
        if Geometry._isValidCoordinates(shape[i]) != count:
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
  def _coordinatesToLine(coordinates):
    """Create a line from a list of points.

    Args:
      coordinates: The points to convert.  Must be list of numbers of
          even length, in the format [x1, y1, x2, y2, ...]

    Returns:
      An array of pairs of points.
    """
    if isinstance(coordinates[0], numbers.Number):
      line = []
      if len(coordinates) % 2 != 0:
        raise ee_exception.EEException('Invalid number of coordinates: %s' %
                                       len(coordinates))
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
      opt_coordinates: A list of extra coordinates to decode.

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
      geometry = Geometry._coordinatesToLine(coordinates)

    # Make sure the number of nesting levels is correct.
    item = geometry
    count = 0
    while isinstance(item, list) or isinstance(item, tuple):
      item = item[0]
      count += 1

    while count < nesting:
      geometry = [geometry]
      count += 1

    if Geometry._isValidCoordinates(geometry) != nesting:
      raise ee_exception.EEException('Invalid geometry.')

    return geometry

  @staticmethod
  def name():
    return 'Geometry'
