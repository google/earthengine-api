"""An object representing EE Geometries."""

from __future__ import annotations

import collections.abc
import json
import math
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

from ee import _arg_types
from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import ee_exception
from ee import ee_list
from ee import ee_number
from ee import ee_string
from ee import ee_types
from ee import featurecollection
from ee import projection
from ee import serializer


# A sentinel value used to detect unspecified function parameters.
_UNSPECIFIED = object()


class Geometry(computedobject.ComputedObject):
  """An Earth Engine geometry."""

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  @_utils.accept_opt_prefix('opt_proj', 'opt_geodesic', 'opt_evenOdd')
  def __init__(
      self,
      geo_json: Union[Dict[str, Any], computedobject.ComputedObject, Geometry],
      proj: Optional[Any] = None,
      geodesic: Optional[bool] = None,
      evenOdd: Optional[bool] = None,  # pylint: disable=g-bad-name
  ):
    """Creates a geometry.

    Args:
      geo_json: The GeoJSON object describing the geometry or a computed object
        to be reinterpred as a Geometry. Supports CRS specifications as per the
        GeoJSON spec, but only allows named (rather than "linked" CRSs). If this
        includes a 'geodesic' field, and geodesic is not specified, it will be
        used as geodesic.
      proj: An optional projection specification, either as an ee.Projection, as
        a CRS ID code or as a WKT string. If specified, overrides any CRS found
        in the geo_json parameter. If unspecified and the geo_json does not
        declare a CRS, defaults to "EPSG:4326" (x=longitude, y=latitude).
      geodesic: Whether line segments should be interpreted as spherical
        geodesics. If false, indicates that line segments should be interpreted
        as planar lines in the specified CRS. If absent, defaults to true if the
        CRS is geographic (including the default
          EPSG:4326), or to false if the CRS is projected.
      evenOdd: If true, polygon interiors will be determined by the even/odd
        rule, where a point is inside if it crosses an odd number of edges to
        reach a point at infinity. Otherwise polygons use the left-inside rule,
        where interiors are on the left side of the shell's edges when walking
        the vertices in the given order. If unspecified, defaults to True.

    Raises:
      EEException: if the given geometry isn't valid.
    """
    self.initialize()

    # pylint: disable-next=protected-access
    computed = isinstance(geo_json, computedobject.ComputedObject) and not (
        isinstance(geo_json, Geometry) and geo_json._type is not None
    )
    options = proj or geodesic or evenOdd
    if computed:
      if options:
        raise ee_exception.EEException(
            'Setting the CRS or geodesic on a computed Geometry is not '
            'supported.  Use Geometry.transform().')
      else:
        super().__init__(geo_json.func, geo_json.args, geo_json.varName)
        return

    # Below here we're working with a GeoJSON literal.
    if isinstance(geo_json, Geometry):
      geo_json = geo_json.encode()

    if not Geometry._isValidGeometry(geo_json):
      raise ee_exception.EEException('Invalid GeoJSON geometry.')

    super().__init__(None, None)

    # The type of the geometry.
    self._type = geo_json['type']

    # The coordinates of the geometry, up to 4 nested levels with numbers at
    # the last level. None if and only if type is GeometryCollection.
    self._coordinates = geo_json.get('coordinates')

    # The subgeometries, None unless type is GeometryCollection.
    self._geometries = geo_json.get('geometries')

    # The projection code (WKT or identifier) of the geometry.
    if proj:
      self._proj = proj
    elif 'crs' in geo_json:
      self._proj = self._get_name_from_crs(geo_json.get('crs'))
    else:
      self._proj = None

    # Whether the geometry has spherical geodesic edges.
    self._geodesic = geodesic
    if geodesic is None and 'geodesic' in geo_json:
      self._geodesic = bool(geo_json['geodesic'])

    # Whether polygon interiors use the even/odd rule.
    self._evenOdd = evenOdd  # pylint: disable=g-bad-name
    if evenOdd is None and 'evenOdd' in geo_json:
      self._evenOdd = bool(geo_json['evenOdd'])

    # Build a proxy for this object that is an invocation of a server-side
    # constructor. This is used during Cloud API encoding, but can't be
    # constructed at that time: due to id()-based caching in Serializer,
    # building transient objects during encoding isn't safe.
    ctor_args = {}
    if self._type == 'GeometryCollection':
      ctor_name = 'MultiGeometry'
      ctor_args['geometries'] = [Geometry(g) for g in self._geometries]
    else:
      ctor_name = self._type
      ctor_args['coordinates'] = self._coordinates

    if self._proj is not None:
      if isinstance(self._proj, str):
        ctor_args['crs'] = apifunction.ApiFunction.lookup('Projection').call(
            self._proj)
      else:
        ctor_args['crs'] = self._proj

    if self._geodesic is not None:
      ctor_args['geodesic'] = self._geodesic

    if self._evenOdd is not None:
      ctor_args['evenOdd'] = self._evenOdd
    self._computed_equivalent = apifunction.ApiFunction.lookup(
        'GeometryConstructors.' + ctor_name).apply(ctor_args)

  def _get_name_from_crs(self, crs: Dict[str, Any]) -> str:
    """Returns projection name from a CRS."""
    if isinstance(crs, dict) and crs.get('type') == 'name':
      properties = crs.get('properties')
      if isinstance(properties, dict):
        name = properties.get('name')
        if isinstance(name, str):
          return name
    raise ee_exception.EEException(
        'Invalid CRS declaration in GeoJSON: ' + json.dumps(crs)
    )

  @classmethod
  def initialize(cls) -> None:
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, cls.name(), cls.name())
      cls._initialized = True

  @classmethod
  def reset(cls) -> None:
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  def __getitem__(self, key: str) -> Any:
    """Allows access to GeoJSON properties for backward-compatibility."""
    return self.toGeoJSON()[key]

  @staticmethod
  # pylint: disable-next=keyword-arg-before-vararg
  def Point(
      coords=_UNSPECIFIED, proj=_UNSPECIFIED, *args, **kwargs
  ) -> Geometry:
    """Constructs an ee.Geometry describing a point.

    Args:
      coords: A list of two [x,y] coordinates in the given projection.
      proj: The projection of this geometry, or EPSG:4326 if unspecified.
      *args: For convenience, varargs may be used when all arguments are
          numbers. This allows creating EPSG:4326 points, e.g.,
          ee.Geometry.Point(lng, lat).
      **kwargs: Keyword args that accept "lon" and "lat" for backward-
          compatibility.

    Returns:
      An ee.Geometry describing a point.
    """
    init = Geometry._parseArgs(
        'Point', 1,
        Geometry._GetSpecifiedArgs((coords, proj) + args, ('lon', 'lat'),
                                   **kwargs))
    if not isinstance(init, computedobject.ComputedObject):
      xy = init['coordinates']
      if not isinstance(xy, (list, tuple)) or len(xy) != 2:
        raise ee_exception.EEException(
            'The Geometry.Point constructor requires 2 coordinates.')
    return Geometry(init)

  @staticmethod
  # pylint: disable-next=keyword-arg-before-vararg
  def MultiPoint(coords=_UNSPECIFIED, proj=_UNSPECIFIED, *args) -> Geometry:
    """Constructs an ee.Geometry describing a MultiPoint.

    Args:
      coords: A list of points, each in the GeoJSON 'coordinates' format of a
          Point, or a list of the x,y coordinates in the given projection, or
          an ee.Geometry describing a point.
      proj: The projection of this geometry. If unspecified, the default is
          the projection of the input ee.Geometry, or EPSG:4326 if there are
          no ee.Geometry inputs.
      *args: For convenience, varargs may be used when all arguments are
          numbers. This allows creating EPSG:4326 MultiPoints given an even
          number of arguments, e.g.,
          ee.Geometry.MultiPoint(aLng, aLat, bLng, bLat, ...).

    Returns:
      An ee.Geometry describing a MultiPoint.
    """
    all_args = Geometry._GetSpecifiedArgs((coords, proj) + args)
    return Geometry(Geometry._parseArgs('MultiPoint', 2, all_args))

  # pylint: disable=keyword-arg-before-vararg
  @staticmethod
  def Rectangle(
      coords=_UNSPECIFIED,
      proj=_UNSPECIFIED,
      geodesic=_UNSPECIFIED,
      evenOdd=_UNSPECIFIED,  # pylint: disable=g-bad-name
      *args,
      **kwargs,
  ) -> Geometry:
    """Constructs an ee.Geometry describing a rectangular polygon.

    Args:
      coords: The minimum and maximum corners of the rectangle, as a list of
          two points each in the format of GeoJSON 'Point' coordinates, or a
          list of two ee.Geometry objects describing a point, or a list of four
          numbers in the order xMin, yMin, xMax, yMax.
      proj: The projection of this geometry. If unspecified, the default is the
          projection of the input ee.Geometry, or EPSG:4326 if there are no
          ee.Geometry inputs.
      geodesic: If false, edges are straight in the projection. If true, edges
          are curved to follow the shortest path on the surface of the Earth.
          The default is the geodesic state of the inputs, or true if the
          inputs are numbers.
      evenOdd: If true, polygon interiors will be determined by the even/odd
          rule, where a point is inside if it crosses an odd number of edges to
          reach a point at infinity. Otherwise polygons use the left-inside
          rule, where interiors are on the left side of the shell's edges when
          walking the vertices in the given order. If unspecified, defaults to
          True.
      *args: For convenience, varargs may be used when all arguments are
          numbers. This allows creating EPSG:4326 Polygons given exactly four
          coordinates, e.g.,
          ee.Geometry.Rectangle(minLng, minLat, maxLng, maxLat).
      **kwargs: Keyword args that accept "xlo", "ylo", "xhi" and "yhi" for
          backward-compatibility.

    Returns:
      An ee.Geometry describing a rectangular polygon.
    """
    init = Geometry._parseArgs(
        'Rectangle', 2,
        Geometry._GetSpecifiedArgs(
            (coords, proj, geodesic, evenOdd) + args,
            ('xlo', 'ylo', 'xhi', 'yhi'), **kwargs))
    if not isinstance(init, computedobject.ComputedObject):
      # GeoJSON does not have a Rectangle type, so expand to a Polygon.
      xy = init['coordinates']
      if not isinstance(xy, (list, tuple)) or len(xy) != 2:
        raise ee_exception.EEException(
            'The Geometry.Rectangle constructor requires 2 points or 4 '
            'coordinates.')
      x1 = xy[0][0]
      y1 = xy[0][1]
      x2 = xy[1][0]
      y2 = xy[1][1]
      init['coordinates'] = [[[x1, y2], [x1, y1], [x2, y1], [x2, y2]]]
      init['type'] = 'Polygon'
    return Geometry(init)

  @staticmethod
  def BBox(
      west: Union[float, computedobject.ComputedObject],
      south: Union[float, computedobject.ComputedObject],
      east: Union[float, computedobject.ComputedObject],
      north: Union[float, computedobject.ComputedObject],
  ) -> Geometry:
    """Constructs a rectangle ee.Geometry from lines of latitude and longitude.

    If (east - west) ≥ 360° then the longitude range will be normalized to -180°
    to +180°; otherwise they will be treated as designating points on a circle
    (e.g., east may be numerically less than west).

    Args:
      west: The westernmost enclosed longitude. Will be adjusted to lie in the
        range -180° to 180°.
      south: The southernmost enclosed latitude. If less than -90° (south pole),
        will be treated as -90°.
      east: The easternmost enclosed longitude.
      north: The northernmost enclosed latitude. If greater than +90° (north
        pole), will be treated as +90°.

    Returns:
      An ee.Geometry describing a planar WGS84 rectangle.
    """
    # Not using Geometry._parseArgs because that assumes the args should go
    # directly into a coordinates field.

    if Geometry._hasServerValue((west, south, east, north)):
      # Some arguments cannot be handled in the client, so make a server call.
      return (apifunction.ApiFunction.lookup('GeometryConstructors.BBox')
              .apply(dict(west=west, south=south, east=east, north=north)))
    # Else proceed with client-side implementation.

    # Reject NaN and positive (west) or negative (east) infinities before they
    # become bad JSON. The other two infinities are acceptable because we
    # support the general idea of an around-the-globe latitude band. By writing
    # them negated, we also reject NaN.
    if not west < math.inf:
      raise ee_exception.EEException(
          'Geometry.BBox: west must not be {}'.format(west))
    if not east > -math.inf:
      raise ee_exception.EEException(
          'Geometry.BBox: east must not be {}'.format(east))
    # Reject cases which, if we clamped them instead, would move a box whose
    # bounds lie entirely "past" a pole to being at the pole. By writing them
    # negated, we also reject NaN.
    if not south <= 90:
      raise ee_exception.EEException(
          'Geometry.BBox: south must be at most +90°, but was {}°'.format(
              south))
    if not north >= -90:
      raise ee_exception.EEException(
          'Geometry.BBox: north must be at least -90°, but was {}°'.format(
              north))
    # On the other hand, allow a box whose extent lies past the pole, but
    # canonicalize it to being exactly the pole.
    south = max(south, -90)
    north = min(north, 90)

    if east - west >= 360:
      # We conclude from seeing more than 360 degrees that the user intends to
      # specify the entire globe (or a band of latitudes, at least).
      # Canonicalize to standard global form.
      west = -180
      east = 180
    else:
      # Not the entire globe. Canonicalize coordinate ranges.
      west = Geometry._canonicalize_longitude(west)
      east = Geometry._canonicalize_longitude(east)
      if east < west:
        east += 360

    # GeoJSON does not have a Rectangle type, so expand to a Polygon.
    return Geometry(
        geo_json={
            'coordinates': [[
                [west, north],
                [west, south],
                [east, south],
                [east, north],
            ]],
            'type': 'Polygon',
        },
        geodesic=False,
    )

  @staticmethod
  def _canonicalize_longitude(longitude: float) -> float:
    # Note that Python specifies "The modulo operator always yields a result
    # with the same sign as its second operand"; therefore no special handling
    # of negative arguments is needed.
    longitude = longitude % 360
    if longitude > 180:
      longitude -= 360
    return longitude

  # pylint: disable=keyword-arg-before-vararg
  @staticmethod
  def LineString(
      coords=_UNSPECIFIED,
      proj=_UNSPECIFIED,
      geodesic=_UNSPECIFIED,
      maxError=_UNSPECIFIED,  # pylint: disable=g-bad-name
      *args,
  ) -> Geometry:
    """Constructs an ee.Geometry describing a LineString.

    Args:
      coords: A list of at least two points.  May be a list of coordinates in
          the GeoJSON 'LineString' format, a list of at least two ee.Geometry
          objects describing a point, or a list of at least four numbers
          defining the [x,y] coordinates of at least two points.
      proj: The projection of this geometry. If unspecified, the default is the
          projection of the input ee.Geometry, or EPSG:4326 if there are no
          ee.Geometry inputs.
      geodesic: If false, edges are straight in the projection. If true, edges
          are curved to follow the shortest path on the surface of the Earth.
          The default is the geodesic state of the inputs, or true if the
          inputs are numbers.
      maxError: Max error when input geometry must be reprojected to an
          explicitly requested result projection or geodesic state.
      *args: For convenience, varargs may be used when all arguments are
          numbers. This allows creating geodesic EPSG:4326 LineStrings given
          an even number of arguments, e.g.,
          ee.Geometry.LineString(aLng, aLat, bLng, bLat, ...).

    Returns:
      An ee.Geometry describing a LineString.
    """
    all_args = Geometry._GetSpecifiedArgs((coords, proj, geodesic, maxError) +
                                          args)
    return Geometry(Geometry._parseArgs('LineString', 2, all_args))

  # pylint: disable=keyword-arg-before-vararg
  @staticmethod
  def LinearRing(
      coords=_UNSPECIFIED,
      proj=_UNSPECIFIED,
      geodesic=_UNSPECIFIED,
      maxError=_UNSPECIFIED,  # pylint: disable=g-bad-name
      *args,
  ) -> Geometry:
    """Constructs an ee.Geometry describing a LinearRing.

    If the last point is not equal to the first, a duplicate of the first
    point will be added at the end.

    Args:
      coords: A list of points in the ring. May be a list of coordinates in
          the GeoJSON 'LinearRing' format, a list of at least three ee.Geometry
          objects describing a point, or a list of at least six numbers defining
          the [x,y] coordinates of at least three points.
      proj: The projection of this geometry. If unspecified, the default is the
          projection of the input ee.Geometry, or EPSG:4326 if there are no
          ee.Geometry inputs.
      geodesic: If false, edges are straight in the projection. If true, edges
          are curved to follow the shortest path on the surface of the Earth.
          The default is the geodesic state of the inputs, or true if the
          inputs are numbers.
      maxError: Max error when input geometry must be reprojected to an
          explicitly requested result projection or geodesic state.
      *args: For convenience, varargs may be used when all arguments are
          numbers. This allows creating geodesic EPSG:4326 LinearRings given
          an even number of arguments, e.g.,
          ee.Geometry.LinearRing(aLng, aLat, bLng, bLat, ...).

    Returns:
      A dictionary representing a GeoJSON LinearRing.
    """
    all_args = Geometry._GetSpecifiedArgs((coords, proj, geodesic, maxError) +
                                          args)
    return Geometry(Geometry._parseArgs('LinearRing', 2, all_args))

  # pylint: disable=keyword-arg-before-vararg
  @staticmethod
  def MultiLineString(
      coords=_UNSPECIFIED,
      proj=_UNSPECIFIED,
      geodesic=_UNSPECIFIED,
      maxError=_UNSPECIFIED,  # pylint: disable=g-bad-name
      *args,
  ) -> Geometry:
    """Constructs an ee.Geometry describing a MultiLineString.

    Create a GeoJSON MultiLineString from either a list of points, or an array
    of lines (each an array of Points).  If a list of points is specified,
    only a single line is created.

    Args:
      coords: A list of linestrings. May be a list of coordinates in the
          GeoJSON 'MultiLineString' format, a list of at least two ee.Geometry
          objects describing a LineString, or a list of numbers defining a
          single linestring.
      proj: The projection of this geometry. If unspecified, the default is the
          projection of the input ee.Geometry, or EPSG:4326 if there are no
          ee.Geometry inputs.
      geodesic: If false, edges are straight in the projection. If true, edges
          are curved to follow the shortest path on the surface of the Earth.
          The default is the geodesic state of the inputs, or true if the
          inputs are numbers.
      maxError: Max error when input geometry must be reprojected to an
          explicitly requested result projection or geodesic state.
      *args: For convenience, varargs may be used when all arguments are
          numbers. This allows creating geodesic EPSG:4326 MultiLineStrings
          with a single LineString, given an even number of arguments, e.g.,
          ee.Geometry.MultiLineString(aLng, aLat, bLng, bLat, ...).

    Returns:
      An ee.Geometry describing a MultiLineString.
    """
    all_args = Geometry._GetSpecifiedArgs((coords, proj, geodesic, maxError) +
                                          args)
    return Geometry(Geometry._parseArgs('MultiLineString', 3, all_args))

  # pylint: disable=keyword-arg-before-vararg
  @staticmethod
  def Polygon(
      coords=_UNSPECIFIED,
      proj=_UNSPECIFIED,
      geodesic=_UNSPECIFIED,
      maxError=_UNSPECIFIED,  # pylint: disable=g-bad-name
      evenOdd=_UNSPECIFIED,  # pylint: disable=g-bad-name
      *args,
  ) -> Geometry:
    """Constructs an ee.Geometry describing a polygon.

    Args:
      coords: A list of rings defining the boundaries of the polygon. May be a
          list of coordinates in the GeoJSON 'Polygon' format, a list of
          ee.Geometry describing a LinearRing, or a list of numbers defining a
          single polygon boundary.
      proj: The projection of this geometry. If unspecified, the default is the
          projection of the input ee.Geometry, or EPSG:4326 if there are no
          ee.Geometry inputs.
      geodesic: If false, edges are straight in the projection. If true, edges
          are curved to follow the shortest path on the surface of the Earth.
          The default is the geodesic state of the inputs, or true if the
          inputs are numbers.
      maxError: Max error when input geometry must be reprojected to an
          explicitly requested result projection or geodesic state.
      evenOdd: If true, polygon interiors will be determined by the even/odd
          rule, where a point is inside if it crosses an odd number of edges to
          reach a point at infinity. Otherwise polygons use the left-inside
          rule, where interiors are on the left side of the shell's edges when
          walking the vertices in the given order. If unspecified, defaults to
          True.
      *args: For convenience, varargs may be used when all arguments are
          numbers. This allows creating geodesic EPSG:4326 Polygons with a
          single LinearRing given an even number of arguments, e.g.,
          ee.Geometry.Polygon(aLng, aLat, bLng, bLat, ..., aLng, aLat).

    Returns:
      An ee.Geometry describing a polygon.
    """
    all_args = Geometry._GetSpecifiedArgs((coords, proj, geodesic, maxError,
                                           evenOdd) + args)
    return Geometry(Geometry._parseArgs('Polygon', 3, all_args))

  # pylint: disable=keyword-arg-before-vararg
  @staticmethod
  def MultiPolygon(
      coords=_UNSPECIFIED,
      proj=_UNSPECIFIED,
      geodesic=_UNSPECIFIED,
      maxError=_UNSPECIFIED,  # pylint: disable=g-bad-name
      evenOdd=_UNSPECIFIED,  # pylint: disable=g-bad-name
      *args,
  ) -> Geometry:
    """Constructs an ee.Geometry describing a MultiPolygon.

    If created from points, only one polygon can be specified.

    Args:
      coords: A list of polygons. May be a list of coordinates in the GeoJSON
          'MultiPolygon' format, a list of ee.Geometry objects describing a
          Polygon, or a list of numbers defining a single polygon boundary.
      proj: The projection of this geometry. If unspecified, the default is the
          projection of the input ee.Geometry, or EPSG:4326 if there are no
          ee.Geometry inputs.
      geodesic: If false, edges are straight in the projection. If true, edges
          are curved to follow the shortest path on the surface of the Earth.
          The default is the geodesic state of the inputs, or true if the
          inputs are numbers.
      maxError: Max error when input geometry must be reprojected to an
          explicitly requested result projection or geodesic state.
      evenOdd: If true, polygon interiors will be determined by the even/odd
          rule, where a point is inside if it crosses an odd number of edges to
          reach a point at infinity. Otherwise polygons use the left-inside
          rule, where interiors are on the left side of the shell's edges when
          walking the vertices in the given order. If unspecified, defaults to
          True.
      *args: For convenience, varargs may be used when all arguments are
          numbers. This allows creating geodesic EPSG:4326 MultiPolygons with
          a single Polygon with a single LinearRing given an even number of
          arguments, e.g.,
          ee.Geometry.MultiPolygon(aLng, aLat, bLng, bLat, ..., aLng, aLat).

    Returns:
      An ee.Geometry describing a MultiPolygon.
    """
    all_args = Geometry._GetSpecifiedArgs((coords, proj, geodesic, maxError,
                                           evenOdd) + args)
    return Geometry(Geometry._parseArgs('MultiPolygon', 4, all_args))

  @_utils.accept_opt_prefix('opt_encoder')
  def encode(self, encoder: Optional[Any] = None) -> Dict[str, Any]:
    """Returns a GeoJSON-compatible representation of the geometry."""
    if not getattr(self, '_type', None):
      return super().encode(encoder)

    result = {'type': self._type}
    if self._type == 'GeometryCollection':
      result['geometries'] = self._geometries
    else:
      result['coordinates'] = self._coordinates

    if self._proj is not None:
      result['crs'] = {'type': 'name', 'properties': {'name': self._proj}}

    if self._geodesic is not None:
      result['geodesic'] = self._geodesic

    if self._evenOdd is not None:
      result['evenOdd'] = self._evenOdd

    return result

  def encode_cloud_value(self, encoder: Any) -> Any:
    """Returns a server-side invocation of the appropriate constructor."""
    if not getattr(self, '_type', None):
      return super().encode_cloud_value(encoder)

    return self._computed_equivalent.encode_cloud_value(encoder)

  def toGeoJSON(self) -> Dict[str, Any]:
    """Returns a GeoJSON representation of the geometry."""
    if self.func:
      raise ee_exception.EEException(
          'Cannot convert a computed geometry to GeoJSON. '
          'Wrap a getInfo() call in json.dumps instead.'
      )

    return self.encode()

  def toGeoJSONString(self) -> str:
    """Returns a GeoJSON string representation of the geometry."""
    if self.func:
      raise ee_exception.EEException(
          'Cannot convert a computed geometry to GeoJSON. '
          'Wrap a getInfo() call in json.dumps instead.'
      )
    return json.dumps(self.toGeoJSON())

  def serialize(self, for_cloud_api=True):
    """Returns the serialized representation of this object."""
    return serializer.toJSON(self, for_cloud_api=for_cloud_api)

  def __str__(self) -> str:
    return 'ee.Geometry(%s)' % serializer.toReadableJSON(self)

  def __repr__(self) -> str:
    return self.__str__()

  @staticmethod
  def _isValidGeometry(geometry: Dict[str, Any]) -> bool:
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
              (geometry_type == 'MultiPoint' and
               (nesting == 2 or not coords)) or
              (geometry_type == 'LineString' and nesting == 2) or
              (geometry_type == 'LinearRing' and nesting == 2) or
              (geometry_type == 'MultiLineString' and
               (nesting == 3 or not coords)) or
              (geometry_type == 'Polygon' and nesting == 3) or
              (geometry_type == 'MultiPolygon' and
               (nesting == 4 or not coords)))

  @staticmethod
  def _isValidCoordinates(shape: Union[Sequence[float], Geometry]) -> int:
    """Validate the coordinates of a geometry.

    Args:
      shape: The coordinates to validate.

    Returns:
      The number of nested arrays or -1 on error.
    """
    if not isinstance(shape, collections.abc.Iterable):
      return -1

    if (shape and isinstance(shape[0], collections.abc.Iterable) and
        not isinstance(shape[0], str)):
      count = Geometry._isValidCoordinates(shape[0])
      # If more than 1 ring or polygon, they should have the same nesting.
      for i in range(1, len(shape)):
        if Geometry._isValidCoordinates(shape[i]) != count:
          return -1
      return count + 1
    else:
      # Make sure the pts are all numbers.
      for i in shape:
        if not isinstance(i, (float, int)):
          return -1

      # Test that we have an even number of pts.
      if len(shape) % 2 == 0:
        return 1
      else:
        return -1

  @staticmethod
  def _coordinatesToLine(coordinates: Sequence[float]) -> Any:
    """Create a line from a list of points.

    Args:
      coordinates: The points to convert.  Must be list of numbers of
          even length, in the format [x1, y1, x2, y2, ...]

    Returns:
      An array of pairs of points.
    """
    if not (coordinates and isinstance(coordinates[0], (float, int))):
      return coordinates
    if len(coordinates) == 2:
      return coordinates
    if len(coordinates) % 2 != 0:
      raise ee_exception.EEException(
          'Invalid number of coordinates: %s' % len(coordinates))

    line = []
    for i in range(0, len(coordinates), 2):
      pt = [coordinates[i], coordinates[i + 1]]
      line.append(pt)
    return line

  @staticmethod
  def _parseArgs(ctor_name: str, depth: int, args: Any) -> Dict[str, Any]:
    """Parses arguments into a GeoJSON dictionary or a ComputedObject.

    Args:
      ctor_name: The name of the constructor to use.
      depth: The nesting depth at which points are found.
      args: The array of values to test.

    Returns:
      If the arguments are simple, a GeoJSON object describing the geometry.
      Otherwise a ComputedObject calling the appropriate constructor.
    """
    result = {}
    keys = ['coordinates', 'crs', 'geodesic']
    if ctor_name != 'Rectangle':
      # The constructor for Rectangle does not accept maxError.
      keys.append('maxError')
    keys.append('evenOdd')

    if all(ee_types.isNumber(i) for i in args):
      # All numbers, so convert them to a true array.
      result['coordinates'] = args
    else:
      # Parse parameters by position.
      if len(args) > len(keys):
        raise ee_exception.EEException(
            'Geometry constructor given extra arguments.')
      for key, arg in zip(keys, args):
        if arg is not None:
          result[key] = arg

    # Standardize the coordinates and test if they are simple enough for
    # client-side initialization.
    if (Geometry._hasServerValue(result['coordinates']) or
        result.get('crs') is not None or
        result.get('geodesic') is not None or
        result.get('maxError') is not None):
      # Some arguments cannot be handled in the client, so make a server call.
      # Note we don't declare a default evenOdd value, so the server can infer
      # a default based on the projection.
      server_name = 'GeometryConstructors.' + ctor_name
      return apifunction.ApiFunction.lookup(server_name).apply(result)
    else:
      # Everything can be handled here, so check the depth and init this object.
      result['type'] = ctor_name
      result['coordinates'] = Geometry._fixDepth(depth, result['coordinates'])
      # Enable evenOdd by default for any kind of polygon.
      if ('evenOdd' not in result and
          ctor_name in ['Polygon', 'Rectangle', 'MultiPolygon']):
        result['evenOdd'] = True
      return result

  @staticmethod
  def _hasServerValue(coordinates: Any) -> bool:
    """Returns whether any of the coordinates are computed values or geometries.

    Computed items must be resolved by the server (evaluated in the case of
    computed values, and processed to a single projection and geodesic state
    in the case of geometries.

    Args:
      coordinates: A nested list of ... of number coordinates.

    Returns:
      Whether all coordinates are lists or numbers.
    """
    if isinstance(coordinates, (list, tuple)):
      return any(Geometry._hasServerValue(i) for i in coordinates)
    else:
      return isinstance(coordinates, computedobject.ComputedObject)

  @staticmethod
  def _fixDepth(depth: int, coords: Any) -> Any:
    """Fixes the depth of the given coordinates.

    Checks that each element has the expected depth as all other elements
    at that depth.

    Args:
      depth: The desired depth.
      coords: The coordinates to fix.

    Returns:
      The fixed coordinates, with the deepest elements at the requested depth.

    Raises:
      EEException: if the depth is invalid and could not be fixed.
    """
    if depth < 1 or depth > 4:
      raise ee_exception.EEException('Unexpected nesting level.')

    # Handle a list of numbers.
    if all(isinstance(i, (float, int)) for i in coords):
      coords = Geometry._coordinatesToLine(coords)

    # Make sure the number of nesting levels is correct.
    item = coords
    count = 0
    while isinstance(item, (list, tuple)):
      item = item[0] if item else None
      count += 1
    while count < depth:
      coords = [coords]
      count += 1

    if Geometry._isValidCoordinates(coords) != depth:
      raise ee_exception.EEException('Invalid geometry.')

    # Empty arrays should not be wrapped.
    item = coords
    while isinstance(item, (list, tuple)) and len(item) == 1:
      item = item[0]
    if isinstance(item, (list, tuple)) and not item:
      return []

    return coords

  @staticmethod
  def _GetSpecifiedArgs(
      args, keywords: Tuple[str, ...] = (), **kwargs
  ) -> List[Any]:
    """Returns args, filtering out _UNSPECIFIED and checking for keywords."""
    if keywords:
      args = list(args)
      for i, keyword in enumerate(keywords):
        if keyword in kwargs:
          assert args[i] is _UNSPECIFIED
          args[i] = kwargs[keyword]
    return [i for i in args if i != _UNSPECIFIED]

  @staticmethod
  def name() -> str:
    return 'Geometry'

  def area(
      self,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> ee_number.Number:
    """Returns the area of the geometry.

    Returns the area of the geometry. Area of points and line strings is 0 and
    the area of multi geometries is the sum of the areas of their components
    (intersecting areas are counted multiple times).

    Args:
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: If specified, the result will be in the units of the coordinate
        system of this projection. Otherwise it will be in square meters.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.area', self, maxError, proj
    )

  def bounds(
      self,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> Geometry:
    """Returns the bounding rectangle of the geometry.

    Args:
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: If specified, the result will be in this projection. Otherwise it
        will be in EPSG:4326.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bounds', self, maxError, proj
    )

  def buffer(
      self,
      distance: _arg_types.Number,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> Geometry:
    """Returns the input buffered by a given distance.

    If the distance is positive, the geometry is expanded, and if the distance
    is negative, the geometry is contracted.

    Args:
      distance: The distance of the buffering, which may be negative. If no
        projection is specified, the unit is meters. Otherwise the unit is in
        the coordinate system of the projection.
      maxError: The maximum amount of error tolerated when approximating the
        buffering circle and performing any necessary reprojection. If
        unspecified, defaults to 1% of the distance.
      proj: If specified, the buffering will be performed in this projection and
        the distance will be interpreted as units of the coordinate system of
        this projection. Otherwise the distance is interpereted as meters and
        the buffering is performed in a spherical coordinate system.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.buffer', self, distance, maxError, proj
    )

  def centroid(
      self,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> Geometry:
    """Returns a point at the center of the highest-dimension components.

    Lower-dimensional components are ignored, so the centroid of a geometry
    containing two polygons, three lines and a point is equivalent to the
    centroid of a geometry containing just the two polygons.

    Args:
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: If specified, the result will be in this projection. Otherwise it
        will be in EPSG:4326.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.centroid', self, maxError, proj
    )

  def closestPoint(
      self,
      right: _arg_types.Geometry,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> computedobject.ComputedObject:
    """Returns the point on the right input that is nearest to the left input.

    If either input is empty, null is returned. If both inputs are unbounded, an
    arbitrary point is returned. If one input is unbounded, an arbitrary point
    in the bounded input is returned.

    Args:
      right: The geometry used as the right operand of the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.

    Returns:
      An ee.Object.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.closestPoint', self, right, maxError, proj
    )

  def closestPoints(
      self,
      right: _arg_types.Geometry,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> computedobject.ComputedObject:
    """Returns the points on the right input that are nearest to the left input.

    Returns a dictionary containing up to two entries representing a point on
    each input geometry that is closest to the other input geometry. If either
    geometry is empty, an empty dictionary is returned. If both geometries are
    unbounded, the dictionary has an arbitrary point for both 'left' and
    'right'. If one geometry is unbounded, the dictionary has an arbitrary point
    contained in the bounded geometry for both 'left' and 'right'.

    Args:
      right: The geometry used as the right operand of the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.

    Returns:
      An ee.Object.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.closestPoints', self, right, maxError, proj
    )

  def containedIn(
      self,
      right: _arg_types.Geometry,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> computedobject.ComputedObject:
    """Returns true if and only if one geometry is contained in the other.

    Args:
      right: The geometry used as the right operand of the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.

    Returns:
      An ee.Boolean.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.containedIn', self, right, maxError, proj
    )

  def contains(
      self,
      right: _arg_types.Geometry,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> computedobject.ComputedObject:
    """Returns true if and only if one geometry contains the other.

    Args:
      right: The geometry used as the right operand of the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.

    Returns:
      An ee.Boolean.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.contains', self, right, maxError, proj
    )

  def convexHull(
      self,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> Geometry:
    """Returns the convex hull of the given geometry.

    The convex hull of a single point is the point itself, the convex hull of
    collinear points is a line, and the convex hull of everything else is a
    polygon. Note that a degenerate polygon with all vertices on the same line
    will result in a line segment.

    Args:
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.convexHull', self, maxError, proj
    )

  def coordinates(self) -> ee_list.List:
    """Returns a GeoJSON-style list of the geometry's coordinates."""

    return apifunction.ApiFunction.call_(self.name() + '.coordinates', self)

  def coveringGrid(
      self,
      proj: _arg_types.Projection,
      scale: Optional[_arg_types.Number] = None,
  ) -> featurecollection.FeatureCollection:
    """Returns a collection of features that cover this geometry.

    Each feature is a rectangle in the grid defined by the given projection.

    Args:
      proj: The projection in which to construct the grid. A feature is
        generated for each grid cell that intersects 'geometry', where cell
        corners are at integer-valued positions in the projection. If the
        projection is scaled in meters, the points will be on a grid of that
        size at the point of true scale.
      scale: Overrides the scale of the projection, if provided. May be required
        if the projection isn't already scaled.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.coveringGrid', self, proj, scale
    )

  def cutLines(
      self,
      distances: _arg_types.List,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> Geometry:
    """Returns geometries cut into pieces along the given distances.

    Converts LineString, MultiLineString, and LinearRing geometries into a
    MultiLineString by cutting them into parts no longer than the given distance
    along their length. All other geometry types will be converted to an empty
    MultiLineString.

    Args:
      distances: Distances along each LineString to cut the line into separate
        pieces, measured in units of the given proj, or meters if proj is
        unspecified.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: Projection of the result and distance measurements, or EPSG:4326 if
        unspecified.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.cutLines', self, distances, maxError, proj
    )

  def difference(
      self,
      right: _arg_types.Geometry,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> Geometry:
    """Returns the result of subtracting the 'right' geometry from the geometry.

    Args:
      right: The geometry used as the right operand of the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.difference', self, right, maxError, proj
    )

  def disjoint(
      self,
      right: _arg_types.Geometry,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> computedobject.ComputedObject:
    """Returns true if and only if the geometries are disjoint.

    Args:
      right: The geometry used as the right operand of the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.

    Returns:
      An ee.Boolean.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.disjoint', self, right, maxError, proj
    )

  def dissolve(
      self,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> Geometry:
    """Returns the union of the geometry.

    This leaves single geometries untouched, and unions multi geometries.

    Args:
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: If specified, the union will be performed in this projection.
        Otherwise it will be performed in a spherical coordinate system.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.dissolve', self, maxError, proj
    )

  def distance(
      self,
      right: _arg_types.Geometry,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> ee_number.Number:
    """Returns the minimum distance between two geometries.

    Args:
      right: The geometry used as the right operand of the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.

    Returns:
      An ee.Float.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.distance', self, right, maxError, proj
    )

  def edgesAreGeodesics(self) -> computedobject.ComputedObject:
    """Returns true if the edges are geodesics for a spherical earth.

    Returns true if the geometry edges, if any, are geodesics along a spherical
    model of the earth; if false, any edges are straight lines in the
    projection.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.edgesAreGeodesics', self
    )

  @staticmethod
  def fromS2CellId(
      cellId: _arg_types.Integer,  # pylint: disable=invalid-name
  ) -> Geometry:
    """Returns the Polygon corresponding to an S2 cell id.

    Args:
      cellId: The S2 cell id as 64 bit integer.
    """

    return apifunction.ApiFunction.call_('Geometry.fromS2CellId', cellId)

  @staticmethod
  def fromS2CellToken(
      cellToken: _arg_types.String,  # pylint: disable=invalid-name
  ) -> Geometry:
    """Returns the Polygon corresponding to an S2 cell id as a hex string.

    Args:
      cellToken: The S2 cell id as a hex string. Trailing zeros are required,
        e.g. the top level face containing Antarctica is 0xb000000000000000.
    """

    return apifunction.ApiFunction.call_('Geometry.fromS2CellToken', cellToken)

  def geodesic(self) -> computedobject.ComputedObject:
    """Returns false if edges are straight in the projection.

    If true, edges are curved to follow the shortest path on the surface of the
    Earth.
    """

    return apifunction.ApiFunction.call_(self.name() + '.geodesic', self)

  def geometries(self) -> ee_list.List:
    """Returns the list of geometries in a GeometryCollection.

    For single geometries, returns a singleton list of the geometry .
    """

    return apifunction.ApiFunction.call_(self.name() + '.geometries', self)

  def intersection(
      self,
      right: _arg_types.Geometry,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> Geometry:
    """Returns the intersection of the two geometries.

    Args:
      right: The geometry used as the right operand of the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.intersection', self, right, maxError, proj
    )

  def intersects(
      self,
      right: _arg_types.Geometry,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> computedobject.ComputedObject:
    """Returns true if and only if the geometries intersect.

    Args:
      right: The geometry used as the right operand of the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.

    Returns:
      An ee.Boolean.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.intersects', self, right, maxError, proj
    )

  def isUnbounded(self) -> computedobject.ComputedObject:
    """Returns whether the geometry is unbounded."""

    return apifunction.ApiFunction.call_(self.name() + '.isUnbounded', self)

  def length(
      self,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> ee_number.Number:
    """Returns the length of the linear parts of the geometry.

    Polygonal parts are ignored. The length of multi geometries is the sum of
    the lengths of their components.

    Args:
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: If specified, the result will be in the units of the coordinate
        system of this projection. Otherwise it will be in meters.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.length', self, maxError, proj
    )

  def perimeter(
      self,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> ee_number.Number:
    """Returns the perimeter length of the polygonal parts of the geometry.

    The perimeter of multi geometries is the sum of the perimeters of their
    components.

    Args:
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: If specified, the result will be in the units of the coordinate
        system of this projection. Otherwise it will be in meters.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.perimeter', self, maxError, proj
    )

  def projection(self) -> projection.Projection:
    """Returns the projection of the geometry."""

    return apifunction.ApiFunction.call_(self.name() + '.projection', self)

  @staticmethod
  # pylint: disable-next=invalid-name
  def s2Cell(cellId: _arg_types.Integer) -> Geometry:
    """Returns the Polygon corresponding to an S2 cell id.

    Args:
      cellId: The S2 cell id as 64 bit integer.
    """

    return apifunction.ApiFunction.call_('Geometry.s2Cell', cellId)

  def simplify(
      self,
      maxError: _arg_types.ErrorMargin,  # pylint: disable=invalid-name
      proj: Optional[_arg_types.Projection] = None,
  ) -> Geometry:
    """Returns a simplified geometry to within a given error margin.

    Note that this does not respect the error margin requested by the consumer
    of this algorithm, unless maxError is explicitly specified to be null.

    This overrides the default Earth Engine policy for propagating error
    margins, so regardless of the geometry accuracy requested from the output,
    the inputs will be requested with the error margin specified in the
    arguments to this algorithm. This results in consistent rendering at all
    zoom levels of a rendered vector map, but at lower zoom levels (i.e. zoomed
    out), the geometry won't be simplified, which may harm performance.

    Args:
      maxError: The maximum amount of error by which the result may differ from
        the input.
      proj: If specified, the result will be in this projection. Otherwise it
        will be in the same projection as the input. If the error margin is in
        projected units, the margin will be interpreted as units of this
        projection.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.simplify', self, maxError, proj
    )

  def symmetricDifference(
      self,
      right: _arg_types.Geometry,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> Geometry:
    """Returns the symmetric difference between two geometries.

    Args:
      right: The geometry used as the right operand of the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.symmetricDifference', self, right, maxError, proj
    )

  def transform(
      self,
      proj: Optional[_arg_types.Projection] = None,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
  ) -> Geometry:
    """Returns the geometry Transformed to a specific projection.

    Args:
      proj: The target projection. Defaults to EPSG:4326. If this has a
        geographic CRS, the edges of the geometry will be interpreted as
        geodesics. Otherwise they will be interpreted as straight lines in the
        projection.
      maxError: The maximum projection error.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.transform', self, proj, maxError
    )

  def type(self) -> ee_string.String:
    """Returns the GeoJSON type of the geometry."""

    return apifunction.ApiFunction.call_(self.name() + '.type', self)

  def union(
      self,
      right: _arg_types.Geometry,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> Geometry:
    """Returns the union of the two geometries.

    Args:
      right: The geometry used as the right operand of the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.union', self, right, maxError, proj
    )

  def withinDistance(
      self,
      right: _arg_types.Geometry,
      distance: _arg_types.Number,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      proj: Optional[_arg_types.Projection] = None,
  ) -> computedobject.ComputedObject:
    """Returns true if the geometries are within a specified distance.

    Args:
      right: The geometry used as the right operand of the operation.
      distance: The distance threshold. If a projection is specified, the
        distance is in units of that projected coordinate system, otherwise it
        is in meters.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.

    Returns:
      An ee.Boolean.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.withinDistance', self, right, distance, maxError, proj
    )
