"""An object representing EE Features."""
from __future__ import annotations

from typing import Any, Dict, Optional, Union

from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import ee_exception
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
      geom: Optional[
          Union[
              Feature,
              geometry.Geometry,
              Dict[str, Any],
              computedobject.ComputedObject,
          ]
      ],
      properties: Optional[
          Union[Dict[str, Any], computedobject.ComputedObject]
      ] = None,
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
      self, vis_params: Optional[Dict[str, Any]] = None
  ) -> Dict[str, Any]:
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
