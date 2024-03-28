"""Representation of an Earth Engine FeatureCollection."""

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

from __future__ import annotations

from typing import Any, Dict, List, Optional, Type, Union

from ee import _utils
from ee import apifunction
from ee import collection
from ee import computedobject
from ee import data
from ee import deprecation
from ee import ee_exception
from ee import ee_list
from ee import ee_types
from ee import feature
from ee import geometry


class FeatureCollection(collection.Collection):
  """A representation of a FeatureCollection."""

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  @_utils.accept_opt_prefix('opt_column')
  @deprecation.WarnForDeprecatedAsset('args')
  def __init__(
      self,
      args: Optional[
          Union[
              Dict[str, Any],
              List[Any],
              str,
              feature.Feature,
              geometry.Geometry,
              computedobject.ComputedObject,
          ]
      ],
      column: Optional[Any] = None,
  ):
    """Constructs a collection features.

    Args:
      args: constructor argument.  One of: 1) A string - assumed to be the name
        of a collection. 2) A geometry. 3) A feature. 4) An array of features.
        5) A GeoJSON FeatureCollection. 6) A computed object - reinterpreted as
        a collection.
      column: The name of the geometry column to use. Only useful with the
        string constructor.

    Raises:
      EEException: if passed something other than the above.
    """
    self.initialize()

    # Wrap geometries with features.
    if isinstance(args, geometry.Geometry):
      args = feature.Feature(args)

    # Wrap single features in an array.
    if isinstance(args, feature.Feature):
      args = [args]

    if ee_types.isString(args):
      # An ID.
      actual_args = {'tableId': args}
      if column:
        actual_args['geometryColumn'] = column
      super().__init__(
          apifunction.ApiFunction.lookup('Collection.loadTable'), actual_args)
    elif isinstance(args, (list, tuple)):
      # A list of features.
      super().__init__(
          apifunction.ApiFunction.lookup('Collection'), {
              'features': [feature.Feature(i) for i in args]
          })
    elif isinstance(args, ee_list.List):
      # A computed list of features.
      super().__init__(
          apifunction.ApiFunction.lookup('Collection'), {
              'features': args
          })
    elif isinstance(args, dict) and args.get('type') == self.name():
      # A GeoJSON FeatureCollection
      super().__init__(
          apifunction.ApiFunction.lookup('Collection'),
          {'features': [feature.Feature(i) for i in args.get('features', [])]})
    elif isinstance(args, computedobject.ComputedObject):
      # A custom object to reinterpret as a FeatureCollection.
      super().__init__(args.func, args.args, args.varName)
    else:
      raise ee_exception.EEException(
          'Unrecognized argument type to convert to a FeatureCollection: %s' %
          args)

  @classmethod
  def initialize(cls) -> None:
    """Imports API functions to this class."""
    if not cls._initialized:
      super().initialize()
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
    painted = apifunction.ApiFunction.apply_('Collection.draw', {
        'collection': self,
        'color': (vis_params or {}).get('color', '000000')
    })
    return painted.getMapId({})

  def getDownloadURL(
      self,
      filetype: Optional[str] = None,
      selectors: Optional[Any] = None,
      filename: Optional[str] = None,
  ) -> str:
    """Gets a download URL.

    When the URL is accessed, the FeatureCollection is downloaded in one of
    several formats.

    Args:
      filetype: The format of download, one of: "csv", "json", "geojson", "kml",
          "kmz" ("json" outputs GeoJSON). If unspecified, defaults to "csv".
      selectors: Feature property names used to select the attributes to be
          downloaded. If unspecified, all properties are included.
      filename: Name of the file to be downloaded; extension is appended by
          default. If unspecified, defaults to "table".

    Returns:
      A URL to download this FeatureCollection.
    """
    request = {}
    request['table'] = self
    if filetype is not None:
      request['format'] = filetype.upper()
    if filename is not None:
      request['filename'] = filename
    if selectors is not None:
      if isinstance(selectors, (list, tuple)):
        selectors = ','.join(selectors)
      request['selectors'] = selectors
    return data.makeTableDownloadUrl(data.getTableDownloadId(request))

  # Deprecated spelling to match the JS library.
  getDownloadUrl = deprecation.Deprecated('Use getDownloadURL().')(
      getDownloadURL)

  # TODO(user): How to handle type annotations for
  #  feature_collection.select('a', 'b', 'c')?
  # pylint: disable-next=keyword-arg-before-vararg
  def select(
      self,
      propertySelectors: Any,
      newProperties: Optional[Any] = None,
      retainGeometry: Union[bool, str] = True,
      *args,
  ) -> FeatureCollection:
    """Select properties from each feature in a collection.

    Args:
      propertySelectors: An array of names or regexes specifying the properties
          to select.
      newProperties: An array of strings specifying the new names for the
          selected properties.  If supplied, the length must match the number
          of properties selected.
      retainGeometry: A boolean.  When false, the result will have no geometry.
      *args: Selector elements as varargs.

    Returns:
      The feature collection with selected properties.
    """
    if len(args) or ee_types.isString(propertySelectors):
      args = list(args)
      if not isinstance(retainGeometry, bool):
        args.insert(0, retainGeometry)
      if newProperties is not None:
        args.insert(0, newProperties)
      args.insert(0, propertySelectors)
      return self.map(lambda feat: feat.select(args, None, True))
    else:
      return self.map(
          # pylint: disable-next=g-long-lambda
          lambda feat: feat.select(
              propertySelectors, newProperties, retainGeometry
          )
      )

  @staticmethod
  def name() -> str:
    return 'FeatureCollection'

  @staticmethod
  def elementType() -> Type[feature.Feature]:
    return feature.Feature
