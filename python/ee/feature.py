"""An object representing EE Features."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import apifunction
import computedobject
import ee_exception
import element
import geometry


class Feature(element.Element):
  """An object representing EE Features."""

  _initialized = False

  def __init__(self, geom, opt_properties=None):
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
      opt_properties: A dictionary of metadata properties. If the first
          parameter is a Feature (instead of a geometry), this is unused.

    Raises:
      EEException: if the given geometry isn't valid.
    """
    if isinstance(geom, Feature):
      if opt_properties is not None:
        raise ee_exception.EEException(
            'Can\'t create Feature out of a Feature and properties.')
      # A pre-constructed Feature. Copy.
      super(Feature, self).__init__(geom.func, geom.args)
      return

    self.initialize()

    feature_constructor = apifunction.ApiFunction.lookup('Feature')
    if geom is None or isinstance(geom, geometry.Geometry):
      # A geometry object.
      super(Feature, self).__init__(feature_constructor, {
          'geometry': geom,
          'metadata': opt_properties or None
      })
    elif isinstance(geom, computedobject.ComputedObject):
      # A custom object to reinterpret as a Feature.
      super(Feature, self).__init__(geom.func, geom.args)
    elif isinstance(geom, dict) and geom.get('type') == 'Feature':
      # Try to convert a GeoJSON Feature.
      super(Feature, self).__init__(feature_constructor, {
          'geometry': geometry.Geometry(geom.get('geometry', None)),
          'metadata': geom.get('properties', None)
      })
    else:
      # Try to convert the geometry arg to a Geometry, in the hopes of it
      # turning out to be GeoJSON.
      super(Feature, self).__init__(feature_constructor, {
          'geometry': geometry.Geometry(geom),
          'metadata': opt_properties or None
      })

  @classmethod
  def initialize(cls):
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, 'Feature', 'Feature')
      cls._initialized = True

  @classmethod
  def reset(cls):
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  def getMapId(self, vis_params=None):
    """Fetch and return a map id and token, suitable for use in a Map overlay.

    Args:
      vis_params: The visualization parameters. Currently only one parameter,
          'color', containing a hex RGB color string is allowed.

    Returns:
      An object containing a mapid string, an access token, plus a
      Collection.draw image wrapping a FeatureCollection containing
      this feature.
    """
    # Create a collection containing this one feature and render it.
    collection = apifunction.ApiFunction.call_('Collection', [self])
    return collection.getMapId(vis_params)

  @staticmethod
  def Point(*args, **kwargs):
    """Construct a GeoJSON Point."""
    return geometry.Geometry.Point(*args, **kwargs)

  @staticmethod
  def MultiPoint(*args, **kwargs):
    """Create a GeoJSON MultiPoint."""
    return geometry.Geometry.MultiPoint(*args, **kwargs)

  @staticmethod
  def Rectangle(*args, **kwargs):
    """Create a GeoJSON Rectangle."""
    return geometry.Geometry.Rectangle(*args, **kwargs)

  @staticmethod
  def LineString(*args, **kwargs):
    """Create a GeoJSON LineString."""
    return geometry.Geometry.LineString(*args, **kwargs)

  @staticmethod
  def LinearRing(*args, **kwargs):
    """Create a GeoJSON LinearRing."""
    return geometry.Geometry.LinearRing(*args, **kwargs)

  @staticmethod
  def MultiLineString(*args, **kwargs):
    """Create a GeoJSON MultiLineString."""
    return geometry.Geometry.MultiLineString(*args, **kwargs)

  @staticmethod
  def Polygon(*args, **kwargs):
    """Create a GeoJSON Polygon."""
    return geometry.Geometry.Polygon(*args, **kwargs)

  @staticmethod
  def MultiPolygon(*args, **kwargs):
    """Create a GeoJSON MultiPolygon."""
    return geometry.Geometry.MultiPolygon(*args, **kwargs)

  @staticmethod
  def name():
    return 'Feature'
