"""Representation of an Earth Engine FeatureCollection."""

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

from __future__ import annotations

from typing import Any

from ee import _arg_types
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
from ee import image


class FeatureCollection(collection.Collection):
  """A representation of a FeatureCollection."""

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  @_utils.accept_opt_prefix('opt_column')
  @deprecation.WarnForDeprecatedAsset('args')
  def __init__(
      self,
      args: None | (
              dict[str, Any] |
              list[Any] |
              str |
              feature.Feature |
              geometry.Geometry |
              computedobject.ComputedObject
      ),
      column: Any | None = None,
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
    painted = apifunction.ApiFunction.apply_('Collection.draw', {
        'collection': self,
        'color': (vis_params or {}).get('color', '000000')
    })
    return painted.getMapId({})

  def getDownloadURL(
      self,
      filetype: str | None = None,
      selectors: Any | None = None,
      filename: str | None = None,
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
      newProperties: Any | None = None,
      retainGeometry: bool | str = True,
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
  def elementType() -> type[feature.Feature]:
    return feature.Feature

  def classify(
      self,
      classifier: _arg_types.Classifier,
      # pylint: disable-next=invalid-name
      outputName: _arg_types.String | None = None,
  ) -> FeatureCollection:
    """Returns the result of classifying each feature in a collection.

    Args:
      classifier: The classifier to use.
      outputName: The name of the output property to be added. This argument is
        ignored if the classifier has more than one output.

    Returns:
      An ee.FeatureCollection.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.classify', self, classifier, outputName
    )

  def cluster(
      self,
      clusterer: _arg_types.Clusterer,
      # pylint: disable-next=invalid-name
      outputName: _arg_types.String | None = None,
  ) -> FeatureCollection:
    """Returns the results of clustering each feature in a collection.

    Clusters each feature in a collection, adding a new column to each feature
    containing the cluster number to which it has been assigned.

    Args:
      clusterer: The clusterer to use.
      outputName: The name of the output property to be added.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.cluster', self, clusterer, outputName
    )

  def inverseDistance(
      self,
      range: _arg_types.Number,  # pylint: disable=redefined-builtin
      propertyName: _arg_types.String,  # pylint: disable=invalid-name
      mean: _arg_types.Number,
      stdDev: _arg_types.Number,  # pylint: disable=invalid-name
      gamma: _arg_types.Number | None = None,
      reducer: _arg_types.Reducer | None = None,
  ) -> image.Image:
    """Returns an inverse-distance weighted estimate of the value at each pixel.

    Args:
      range: Size of the interpolation window (in meters).
      propertyName: Name of the numeric property to be estimated.
      mean: Global expected mean.
      stdDev: Global standard deviation.
      gamma: Determines how quickly the estimates tend towards the global mean.
      reducer: Reducer used to collapse the 'propertyName' value of overlapping
        points into a single value.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.inverseDistance',
        self,
        range,
        propertyName,
        mean,
        stdDev,
        gamma,
        reducer,
    )

  def kriging(
      self,
      propertyName: _arg_types.String,  # pylint: disable=invalid-name
      shape: _arg_types.String,
      range: _arg_types.Number,  # pylint: disable=redefined-builtin
      sill: _arg_types.Number,
      nugget: _arg_types.Number,
      # pylint: disable-next=invalid-name
      maxDistance: _arg_types.Number | None = None,
      reducer: _arg_types.Reducer | None = None,
  ) -> image.Image:
    """Returns the results of sampling a Kriging estimator at each pixel.

    Args:
      propertyName: Property to be estimated (must be numeric).
      shape: Semivariogram shape (one of {exponential, gaussian, spherical}).
      range: Semivariogram range, in meters.
      sill: Semivariogram sill.
      nugget: Semivariogram nugget.
      maxDistance: Radius which determines which features are included in each
        pixel's computation, in meters. Defaults to the semivariogram's range.
      reducer: Reducer used to collapse the 'propertyName' value of overlapping
        points into a single value.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.kriging',
        self,
        propertyName,
        shape,
        range,
        sill,
        nugget,
        maxDistance,
        reducer,
    )

  @staticmethod
  def loadBigQueryTable(
      table: _arg_types.String,
      geometryColumn: _arg_types.String | None = None,
  ) -> FeatureCollection:
    """Returns a FeatureCollection containing data read from a BigQuery table.

    Args:
      table: Path to BigQuery table in a project.dataset.table format.
      geometryColumn: The name of the column to use as the main feature
        geometry. If not specified, all features will have null geometry.
    """

    return apifunction.ApiFunction.call_(
        'FeatureCollection.loadBigQueryTable',
        table,
        geometryColumn,
    )

  def makeArray(
      self,
      properties: _arg_types.List,
      name: _arg_types.String | None = None,
  ) -> FeatureCollection:
    """Returns a collection with a 1-D Array property for each feature.

    Add a 1-D Array to each feature in a collection by combining a list of
    properties for each feature into a 1-D Array.

    All of the properties must be numeric values. If a feature doesn't contain
    all of the named properties, or any of them aren't numeric, the feature will
    be dropped from the resulting collection.

    Args:
      properties: The properties to select.
      name: The name of the new array property.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.makeArray', self, properties, name
    )

  @staticmethod
  def randomPoints(
      region: geometry.Geometry,
      points: _arg_types.Integer | None = None,
      seed: _arg_types.Integer | None = None,
      # pylint: disable-next=invalid-name
      maxError: _arg_types.ErrorMargin | None = None,
  ) -> FeatureCollection:
    """Returns a collection of random points.

    Generates points that are uniformly random in the given geometry. If the
    geometry is two-dimensional (polygon or multi-polygon) then the returned
    points are uniformly distributed on the given region of the sphere. If the
    geometry is one-dimensional (linestrings), the returned points are
    interpolated uniformly along the geometry's edges. If the geometry has
    dimension zero (points), the returned points are sampled uniformly from the
    input points. If a multi-geometry of mixed dimension is given, points are
    sampled from the component geometries with the highest dimension.

    Args:
      region: The region to generate points for.
      points: The number of points to generate.
      seed: A seed for the random number generator.
      maxError: The maximum amount of error tolerated when performing any
        necessary reprojection.
    """

    return apifunction.ApiFunction.call_(
        'FeatureCollection.randomPoints', region, points, seed, maxError
    )

  @staticmethod
  def runBigQuery(
      query: _arg_types.String,
      geometryColumn: _arg_types.String | None = None,
      maxBytesBilled: _arg_types.Integer | None = int(1e11),
  ) -> FeatureCollection:
    """Returns a FeatureCollection containing result of a BigQuery query.

    Args:
      query: GoogleSQL query to perform on the BigQuery resources.
      geometryColumn: The name of the column to use as the main feature
        geometry. If not specified, all features will have null geometry.
      maxBytesBilled: Maximum number of bytes billed while processing the query.
        Any BigQuery job that exceeds this limit will fail and won't be billed.
        Defaults to 100GB.
    """

    return apifunction.ApiFunction.call_(
        'FeatureCollection.runBigQuery',
        query,
        geometryColumn,
        maxBytesBilled
    )
