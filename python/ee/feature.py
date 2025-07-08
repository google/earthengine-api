"""An object representing EE Features."""
from __future__ import annotations

from typing import Any

from ee import _arg_types
from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import dictionary
from ee import ee_array
from ee import ee_exception
from ee import ee_number
from ee import ee_string
from ee import element
from ee import geometry


class Feature(element.Element):
  """An object representing EE Features."""

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  @_utils.accept_opt_prefix('opt_properties')
  def __init__(
      self,
      geom: None | (
              Feature |
              geometry.Geometry |
              dict[str, Any] |
              computedobject.ComputedObject
      ),
      properties: None | (
          dict[str, Any] | computedobject.ComputedObject
      ) = None,
  ):
    """Creates a feature a geometry or computed object.

    Features can be constructed from one of the following arguments plus an
    optional dictionary of properties:
      1) An ee.Geometry.
      2) A GeoJSON Geometry.
      3) A GeoJSON Feature.
      4) A computed object - reinterpreted as a geometry if properties
         are specified, and as a feature if they aren't.

    Args:
      geom: A geometry or feature.
      properties: A dictionary of metadata properties. If the first parameter is
        a Feature (instead of a geometry), this is unused.

    Raises:
      EEException: if the given geometry isn't valid.
    """
    if isinstance(geom, Feature):
      if properties is not None:
        raise ee_exception.EEException(
            'Cannot create Feature out of a Feature and properties.')
      # A pre-constructed Feature. Copy.
      super().__init__(geom.func, geom.args)
      return

    self.initialize()

    feature_constructor = apifunction.ApiFunction.lookup(self.name())
    if geom is None or isinstance(geom, geometry.Geometry):
      # A geometry object.
      super().__init__(
          feature_constructor,
          {'geometry': geom, 'metadata': properties or None},
      )
    elif isinstance(geom, computedobject.ComputedObject):
      # A custom object to reinterpret as a Feature.
      super().__init__(geom.func, geom.args, geom.varName)
    elif isinstance(geom, dict) and geom.get('type') == self.name():
      properties = geom.get('properties', {})
      if 'id' in geom:
        if 'system:index' in properties:
          raise ee_exception.EEException(
              'Cannot specify both "id" and "system:index".')
        properties = properties.copy()
        properties['system:index'] = geom['id']
      # Try to convert a GeoJSON Feature.
      super().__init__(feature_constructor, {
          'geometry': geometry.Geometry(geom.get('geometry', None)),
          'metadata': properties
      })
    else:
      # Try to convert the geometry arg to a Geometry, in the hopes of it
      # turning out to be GeoJSON.
      super().__init__(
          feature_constructor,
          {'geometry': geometry.Geometry(geom), 'metadata': properties or None},
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

  def getMapId(
      self, vis_params: dict[str, Any] | None = None
  ) -> dict[str, Any]:
    """Fetch and return a map id and token, suitable for use in a Map overlay.

    Args:
      vis_params: The visualization parameters. Currently only one parameter,
          'color', containing a hex RGB color string is allowed.

    Returns:
      A map ID dictionary as described in ee.data.getMapId, including an
      additional 'image' field containing Collection.draw image wrapping a
      FeatureCollection containing this feature.
    """
    # Create a collection containing this one feature and render it.
    collection = apifunction.ApiFunction.call_('Collection', [self])
    return collection.getMapId(vis_params)

  @staticmethod
  def name() -> str:
    return 'Feature'

  def area(
      self,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> ee_number.Number:
    """Returns the area of the feature's default geometry.

    Area of points and line strings is 0, and the area of multi geometries is
    the sum of the areas of their components (intersecting areas are counted
    multiple times).

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
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> Feature:
    """Returns a feature containing the bounding box of the geometry.

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
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> Feature:
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
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> Feature:
    """Returns a point at the center.

    Returns a feature containing the point at the center of the
    highest-dimension components of the geometry of a feature. Lower-dimensional
    components are ignored, so the centroid of a geometry containing two
    polygons, three lines and a point is equivalent to the centroid of a
    geometry containing just the two polygons.

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
      right: _arg_types.Element,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> computedobject.ComputedObject:
    """Returns the point on the right input that is nearest to the left input.

    If either input is empty, null is returned. If both inputs are unbounded, an
    arbitrary point is returned. If one input is unbounded, an arbitrary point
    in the bounded input is returned.

    Args:
      right: The feature containing the geometry used as the right operand of
        the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.closestPoint', self, right, maxError, proj
    )

  def closestPoints(
      self,
      right: _arg_types.Element,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> computedobject.ComputedObject:
    """Returns the points on the right input that are nearest to the left input.

    Returns a dictionary containing up to two entries representing a point on
    each input feature's geometry that is closest to the geometry of the other
    input. If either geometry is empty, an empty dictionary is returned. If both
    geometries are unbounded, the dictionary has an arbitrary point for both
    'left' and 'right'. If one geometry is unbounded, the dictionary has an
    arbitrary point contained in the bounded geometry for both 'left' and
    'right'.

    Args:
      right: The feature containing the geometry used as the right operand of
        the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.closestPoints', self, right, maxError, proj
    )

  def containedIn(
      self,
      right: _arg_types.Any,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> computedobject.ComputedObject:
    """Returns true if the geometry is contained in the geometry of another.

    Args:
      right: The feature containing the geometry used as the right operand of
        the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.

    Returns:
      A Boolean.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.containedIn', self, right, maxError, proj
    )

  def contains(
      self,
      right: _arg_types.Any,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> computedobject.ComputedObject:
    """Returns true if the geometry contains the geometry of another.

    Args:
      right: The feature containing the geometry used as the right operand of
        the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.

    Returns:
      A Boolean.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.contains', self, right, maxError, proj
    )

  def convexHull(
      self,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> Feature:
    """Returns the convex hull of the original geometry.

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

  def cutLines(
      self,
      distances: _arg_types.List,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> Feature:
    """Returns a feature containing the cut lines.

    Converts LineString, MultiLineString, and LinearRing geometries into a
    MultiLineString by cutting them into parts no longer than the given distance
    along their length.

    All other geometry types will be converted to an empty MultiLineString.

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
      right: _arg_types.Any,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> Feature:
    """Returns the geometry of the feature minus the 'right' geometry.

    Returns a feature with the properties of the 'left' feature, and the
    geometry that results from subtracting the 'right' geometry from the 'left'
    geometry.

    Args:
      right: The feature containing the geometry used as the right operand of
        the operation. The properties of this object are ignored.
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
      right: _arg_types.Any,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> computedobject.ComputedObject:
    """Returns true if and only if the feature geometries are disjoint.

    Args:
      right: The feature containing the geometry used as the right operand of
        the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.

    Returns:
      A Boolean.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.disjoint', self, right, maxError, proj
    )

  def dissolve(
      self,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> Feature:
    """Returns a feature containing the union of the geometry of a feature.

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
      right: _arg_types.Any,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
      spherical: _arg_types.Bool | None = None,
  ) -> ee_number.Number:
    """Returns the minimum distance between the geometries of two features.

    Args:
      right: The feature containing the geometry used as the right operand of
        the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.
      spherical: If true, the calculation will be done on the unit sphere. If
        false, the calculation will be elliptical, taking earth flattening into
        account. Ignored if proj is specified. Default is false.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.distance', self, right, maxError, proj, spherical
    )

  def geometry(
      self,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
      geodesics: _arg_types.Bool | None = None,
  ) -> geometry.Geometry:
    """Returns the geometry of a given feature in a given projection.

    Args:
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: If specified, the geometry will be in this projection. If
        unspecified, the geometry will be in its default projection.
      geodesics: If true, the geometry will have geodesic edges. If false, it
        will have edges as straight lines in the specified projection. If null,
        the edge interpretation will be the same as the original geometry. This
        argument is ignored if proj is not specified.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.geometry', self, maxError, proj, geodesics
    )

  def hersDescriptor(
      self,
      selectors: _arg_types.List | None = None,
      buckets: _arg_types.Integer | None = None,
      # pylint: disable-next=invalid-name
      peakWidthScale: _arg_types.Number | None = None,
  ) -> dictionary.Dictionary:
    """Returns a dictionary of Histogram Error Ring Statistic (HERS) arrays.

    Creates a dictionary of Histogram Error Ring Statistic (HERS) descriptor
    arrays from square array properties of an element. The HERS radius is taken
    to be the array's (side_length - 1) / 2.

    Args:
      selectors: The array properties for which descriptors will be created.
        Selected array properties must be square, floating point arrays.
        Defaults to all array properties.
      buckets: The number of HERS buckets. Defaults to 100.
      peakWidthScale: The HERS peak width scale. Defaults to 1.0.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.hersDescriptor',
        self,
        selectors,
        buckets,
        peakWidthScale,
    )

  def id(self) -> ee_string.String:
    """Returns the ID of a given element within a collection.

    Objects outside collections are not guaranteed to have IDs.
    """

    return apifunction.ApiFunction.call_(self.name() + '.id', self)

  def intersection(
      self,
      right: _arg_types.Any,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> Feature:
    """Returns the intersection of the geometries with right.

    Returns a feature containing the intersection of the geometries of two
    features, with the properties of the left feature.

    Args:
      right: The feature containing the geometry used as the right operand of
        the operation. The properties of this object are ignored.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.

    Returns:
      An ee.Feature.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.intersection', self, right, maxError, proj
    )

  def intersects(
      self,
      right: _arg_types.Any,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> computedobject.ComputedObject:
    """Returns true if and only if the feature geometries intersect.

    Args:
      right: The feature containing the geometry used as the right operand of
        the operation.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.

    Returns:
      A Boolean.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.intersects', self, right, maxError, proj
    )

  def length(
      self,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> ee_number.Number:
    """Returns the length of the linear parts of the geometry of a feature.

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
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> ee_number.Number:
    """Returns the length of the perimeter of the polygonal parts of the geometry of a given feature.

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

  def select(
      self,
      # pylint: disable=invalid-name
      propertySelectors: _arg_types.List,
      newProperties: _arg_types.List | None = None,
      retainGeometry: _arg_types.Bool | None = None,
      # pylint: enable=invalid-name
  ) -> Feature:
    """Returns a feature with the selected properties.

    Selects properties from a feature by name or RE2-compatible regex and
    optionally renames them.

    Args:
      propertySelectors: A list of names or regexes specifying the properties to
        select.
      newProperties: Optional new names for the output properties. Must match
        the number of properties selected.
      retainGeometry: When false, the result will have a NULL geometry.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.select',
        self,
        propertySelectors,
        newProperties,
        retainGeometry,
    )

  def setGeometry(
      self, geometry: _arg_types.Geometry | None = None
  ) -> Feature:
    """Returns the feature with the geometry replaced by the specified geometry.

    Args:
      geometry: The geometry to set.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.setGeometry', self, geometry
    )

  def simplify(
      self,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin,
      proj: _arg_types.Projection | None = None,
  ) -> Feature:
    """Returns a feature with geometry simplified to within an error margin.

    Note that this does not respect the error margin requested by the consumer
    of this algorithm, unless maxError is explicitly specified to be null.

    This overrides the default Earth Engine policy for propagating error
    margins, so regardless of the geometry accuracy requested from the output,
    the inputs will be requested with the error margin specified in the
    arguments to this algorithm. This results in consistent rendering at all
    zoom levels of a rendered vector map, but at lower zoom levels (i.e., zoomed
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
      right: _arg_types.Any,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> Feature:
    """Returns a feature containing the symmetric difference with right.

    Args:
      right: The feature containing the geometry used as the right operand of
        the operation. The properties of this object are ignored.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.symmetricDifference', self, right, maxError, proj
    )

  def toArray(self, properties: _arg_types.List) -> ee_array.Array:
    """Returns an array from the given properties of an object.

    The properties must all be numbers.

    Args:
      properties: The property selectors for each array element.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.toArray', self, properties
    )

  def transform(
      self,
      proj: _arg_types.Projection | None = None,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
  ) -> Feature:
    """Transforms the geometry of a feature to a specific projection.

    Args:
      proj: The target projection. Defaults to EPSG:4326. If this has a
        geographic CRS, the edges of the geometry will be interpreted as
        geodesics. Otherwise they will be interpreted as straight lines in the
        projection.
      maxError: The maximum projection error.

    Returns:
      An ee.Feature.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.transform', self, proj, maxError
    )

  def union(
      self,
      right: _arg_types.Any,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> Feature:
    """Returns a feature containing the union of the geometries of two features.

    Args:
      right: The feature containing the geometry used as the right operand of
        the operation. The properties of this object are ignored.
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
      right: _arg_types.Any,
      distance: _arg_types.Number,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
      proj: _arg_types.Projection | None = None,
  ) -> computedobject.ComputedObject:
    """Returns true if the geometries of right are within a specified distance.

    Args:
      right: The feature containing the geometry used as the right operand of
        the operation.
      distance: The distance threshold. If a projection is specified, the
        distance is in units of that projected coordinate system, otherwise it
        is in meters.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
      proj: The projection in which to perform the operation. If not specified,
        the operation will be performed in a spherical coordinate system, and
        linear distances will be in meters on the sphere.

    Returns:
      A Boolean.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.withinDistance', self, right, distance, maxError, proj
    )
