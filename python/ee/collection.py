"""Common representation for ImageCollection and FeatureCollection.

This class is never intended to be instantiated by the user.
"""

from __future__ import annotations

import datetime
from typing import Any, Callable, Dict, Optional, Type, Union

from ee import _arg_types
from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import confusionmatrix
from ee import deprecation
from ee import dictionary
from ee import ee_date
from ee import ee_exception
from ee import ee_list
from ee import ee_number
from ee import element
from ee import featurecollection
from ee import filter as ee_filter
from ee import function
from ee import geometry as ee_geometry
from ee import image


class Collection(element.Element):
  """Base class for ImageCollection and FeatureCollection."""

  _initialized = False

  # pylint: disable-next=useless-parent-delegation
  @_utils.accept_opt_prefix('opt_varName')
  def __init__(
      self,
      func: function.Function,
      args: Dict[str, Any],
      varName: Optional[str] = None,  # pylint: disable=invalid-name
  ):
    """Constructs a collection by initializing its ComputedObject."""
    super().__init__(func, args, varName)

  @classmethod
  def initialize(cls) -> None:
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, cls.name(), cls.name())
      apifunction.ApiFunction.importApi(
          cls, 'AggregateFeatureCollection', cls.name(), 'aggregate_')
      cls._initialized = True

  @classmethod
  def reset(cls) -> None:
    """Removes imported API functions from this class.

    Also resets the serial ID used for mapping Python functions to 0.
    """
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  @staticmethod
  def name() -> str:
    return 'Collection'

  # pylint: disable-next=redefined-builtin
  def aggregate_array(self, property: _arg_types.String) -> ee_list.List:
    """Returns a list of all the values of the selected property.

    Aggregates over a given property of the objects in a collection, calculating
    a list of all the values of the selected property.

    Args:
      property: The property to use from each element of the collection.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.array', self, property
    )

  # TODO: count removed due to behavior change.

  # pylint: disable-next=redefined-builtin
  def aggregate_count(self, property: _arg_types.String) -> ee_number.Number:
    """Returns the number of distinct values of the selected property.

    Aggregates over a given property of the objects in a collection, calculating
    the number of distinct values for the selected property.

    Args:
      property: The property to use from each element of the collection.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.count', self, property
    )

  def aggregate_count_distinct(
      self,
      property: _arg_types.String,  # pylint: disable=redefined-builtin
  ) -> ee_number.Number:
    """Returns the number of distinct values of the selected property.

    Aggregates over a given property of the objects in a collection, calculating
    the number of distinct values for the selected property.

    Args:
      property: The property to use from each element of the collection.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.count_distinct', self, property
    )

  def aggregate_first(
      self, property: _arg_types.String  # pylint: disable=redefined-builtin
  ) -> computedobject.ComputedObject:
    """Returns the first value of the selected property.

    Aggregates over a given property of the objects in a collection, calculating
    the property value of the first object in the collection.

    Args:
      property: The property to use from each element of the collection.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.first', self, property
    )

  def aggregate_histogram(
      self, property: _arg_types.String  # pylint: disable=redefined-builtin
  ) -> dictionary.Dictionary:
    """Returns a histogram of the selected property as a dictionary.

    Aggregates over a given property of the objects in a collection, calculating
    a histogram of the selected property.

    Args:
      property: The property to use from each element of the collection.

    Returns:
      An ee.Dictionary.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.histogram', self, property
    )

  def aggregate_max(
      self, property: _arg_types.String  # pylint: disable=redefined-builtin
  ) -> computedobject.ComputedObject:
    """Returns the maximum value of the selected property.

    Aggregates over a given property of the objects in a collection, calculating
    the maximum of the values of the selected property.

    Args:
      property: The property to use from each element of the collection.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.max', self, property
    )

  # pylint: disable-next=redefined-builtin
  def aggregate_mean(self, property: _arg_types.String) -> ee_number.Number:
    """Returns the mean of the selected property.

    Aggregates over a given property of the objects in a collection, calculating
    the mean of the selected property.

    Args:
      property: The property to use from each element of the collection.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.mean', self, property
    )

  def aggregate_min(
      self, property: _arg_types.String  # pylint: disable=redefined-builtin
  ) -> computedobject.ComputedObject:
    """Returns the minimum value of the selected property.

    Aggregates over a given property of the objects in a collection, calculating
    the minimum of the values of the selected property.

    Args:
      property: The property to use from each element of the collection.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.min', self, property
    )

  # pylint: disable-next=redefined-builtin
  def aggregate_product(self, property: _arg_types.String) -> ee_number.Number:
    """Returns the product of the values ofthe selected property.

    Aggregates over a given property of the objects in a collection, calculating
    the product of the values of the selected property.

    Args:
      property: The property to use from each element of the collection.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.product', self, property
    )

  def aggregate_sample_sd(
      self,
      # pylint: disable-next=redefined-builtin
      property: _arg_types.String,
  ) -> ee_number.Number:
    """Returns the sample standard deviation of the selected property.

    Aggregates over a given property of the objects in a collection, calculating
    the sample std. deviation of the values of the selected property.

    Args:
      property: The property to use from each element of the collection.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.sample_sd', self, property
    )

  def aggregate_sample_var(
      self,
      # pylint: disable-next=redefined-builtin
      property: _arg_types.String,
  ) -> ee_number.Number:
    """Returns the sample variance of the selected property.

    Aggregates over a given property of the objects in a collection, calculating
    the sample variance of the values of the selected property.

    Args:
      property: The property to use from each element of the collection.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.sample_var', self, property
    )

  def aggregate_stats(
      self,
      # pylint: disable-next=redefined-builtin
      property: _arg_types.String,
  ) -> dictionary.Dictionary:
    """Returns a dictionary of statistics for the selected property.

    Aggregates over a given property of the objects in a collection, calculating
    the sum, min, max, mean, sample standard deviation, sample variance, total
    standard deviation and total variance of the selected property.

    Args:
      property: The property to use from each element of the collection.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.stats', self, property
    )

  # pylint: disable-next=redefined-builtin
  def aggregate_sum(self, property: _arg_types.String) -> ee_number.Number:
    """Returns the sum of the values of the selected property.

    Aggregates over a given property of the objects in a collection, calculating
    the sum of the values of the selected property.

    Args:
      property: The property to use from each element of the collection.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.sum', self, property
    )

  # pylint: disable-next=redefined-builtin
  def aggregate_total_sd(self, property: _arg_types.String) -> ee_number.Number:
    """Returns the total standard deviation of the selected property.

    Aggregates over a given property of the objects in a collection, calculating
    the total std. deviation of the values of the selected property.

    Args:
      property: The property to use from each element of the collection.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.total_sd', self, property
    )

  def aggregate_total_var(
      self,
      # pylint: disable-next=redefined-builtin
      property: _arg_types.String,
  ) -> ee_number.Number:
    """Returns the total variance of the selected property.

    Aggregates over a given property of the objects in a collection, calculating
    the total variance of the values of the selected property.

    Args:
      property: The property to use from each element of the collection.
    """

    return apifunction.ApiFunction.call_(
        'AggregateFeatureCollection.total_var', self, property
    )

  def distance(
      self,
      # pylint: disable=invalid-name
      searchRadius: Optional[_arg_types.Number] = None,
      maxError: Optional[_arg_types.Number] = None,
      # pylint: enable=invalid-name
  ) -> image.Image:
    """Returns a distance image for the collection.

    Produces a DOUBLE image where each pixel is the distance in meters from the
    pixel center to the nearest Point, LineString, or polygonal boundary in the
    collection. Note distance is also measured within interiors of polygons.
    Pixels that are not within 'searchRadius' meters of a geometry will be
    masked out.

    Distances are computed on a sphere, so there is a small error proportional
    to the latitude difference between each pixel and the nearest geometry.

    Args:
      searchRadius: Maximum distance in meters from each pixel to look for
        edges. Pixels will be masked unless there are edges within this
        distance.
      maxError: Maximum reprojection error in meters, only used if the input
        polylines require reprojection. If '0' is provided, then this operation
        will fail if projection is required.
    """

    return apifunction.ApiFunction.call_(
        'Collection.distance', self, searchRadius, maxError
    )

  def distinct(
      self, properties: Union[_arg_types.String, _arg_types.List]
  ) -> featurecollection.FeatureCollection:
    """Returns a collection with duplicates removed.

    Removes duplicates from a collection. Note that duplicates are determined
    using a strong hash over the serialized form of the selected properties.

    Args:
      properties: A property name or a list of property names to use for
        comparison. The '.geo' property can be included to compare object
        geometries.
    """

    return apifunction.ApiFunction.call_(
        'Collection.distinct', self, properties
    )

  def draw(
      self,
      color: _arg_types.String,
      # pylint: disable=invalid-name
      pointRadius: Optional[_arg_types.Integer] = None,
      strokeWidth: Optional[_arg_types.Integer] = None,
      # pylint: enable=invalid-name
  ) -> image.Image:
    """Returns a painted image of a vector collection for visualization.

    Not intended for use as input to other algorithms.

    Args:
      color: A hex string in the format RRGGBB specifying the color to use for
        drawing the features.
      pointRadius: The radius in pixels of the point markers.
      strokeWidth: The width in pixels of lines and polygon borders.
    """

    return apifunction.ApiFunction.call_(
        'Collection.draw', self, color, pointRadius, strokeWidth
    )

  @staticmethod
  def elementType() -> Type[element.Element]:
    """Returns the type of the collection's elements."""
    return element.Element

  def errorMatrix(
      self,
      actual: _arg_types.String,
      predicted: _arg_types.String,
      order: Optional[_arg_types.List] = None,
  ) -> confusionmatrix.ConfusionMatrix:
    """Returns a 2D error matrix for a collection.

    Computes a 2D error matrix for a collection by comparing two columns of a
    collection: one containing the actual values, and one containing predicted
    values. The values are expected to be small contiguous integers, starting
    from 0.

    Axis 0 (the rows) of the matrix correspond to the actual values, and Axis 1
    (the columns) to the predicted values.

    Args:
      actual: The name of the property containing the actual value.
      predicted: The name of the property containing the predicted value.
      order: A list of the expected values. If this argument is not specified,
        the values are assumed to be contiguous and span the range 0 to
        maxValue. If specified, only values matching this list are used, and the
        matrix will have dimensions and order matching this list.
    """

    return apifunction.ApiFunction.call_(
        'Collection.errorMatrix', self, actual, predicted, order
    )

  def filter(self, new_filter: Union[str, ee_filter.Filter]) -> Any:
    """Apply a filter to this collection.

    Args:
      new_filter: Filter to add to this collection.

    Returns:
      The filtered collection object.
    """
    if not new_filter:
      raise ee_exception.EEException('Empty filters.')
    return self._cast(
        apifunction.ApiFunction.call_('Collection.filter', self, new_filter)
    )

  @deprecation.CanUseDeprecated
  def filterMetadata(
      self, name: str, operator: str, value: Union[int, str]
  ) -> Any:
    """Shortcut to add a metadata filter to a collection.

    This is equivalent to self.filter(Filter().metadata(...)).

    Args:
      name: Name of a property to filter.
      operator: Name of a comparison operator as defined
          by FilterCollection.  Possible values are: "equals", "less_than",
          "greater_than", "not_equals", "not_less_than", "not_greater_than",
          "starts_with", "ends_with", "not_starts_with", "not_ends_with",
          "contains", "not_contains".
      value: The value to compare against.

    Returns:
      The filtered collection.
    """
    return self.filter(ee_filter.Filter.metadata_(name, operator, value))

  def filterBounds(
      self, geometry: Union[Dict[str, Any], ee_geometry.Geometry]
  ) -> Any:
    """Shortcut to add a geometry filter to a collection.

    Items in the collection with a footprint that fails to intersect
    the given geometry will be excluded.
    This is equivalent to self.filter(Filter().geometry(...)).

    Caution: providing a large or complex collection as the `geometry` argument
    can result in poor performance. Collating the geometry of collections does
    not scale well; use the smallest collection (or geometry) that is required
    to achieve the desired outcome.

    Args:
      geometry: The boundary to filter to either as a GeoJSON geometry,
          or a FeatureCollection, from which a geometry will be extracted.

    Returns:
      The filtered collection.
    """
    return self.filter(ee_filter.Filter.geometry(geometry))

  # TODO(user): Any --> DateRange
  @_utils.accept_opt_prefix('opt_end')
  def filterDate(
      self,
      start: Union[datetime.datetime, ee_date.Date, int, str, Any],
      end: Optional[
          Union[datetime.datetime, ee_date.Date, int, str, Any]
      ] = None,
  ) -> Any:
    """Shortcut to filter a collection with a date range.

    Items in the collection with a system:time_start property that doesn't
    fall between the start and end dates will be excluded.
    This is equivalent to self.filter(ee.Filter.date(...)); see the ee.Filter
    type for other date filtering options.

    Args:
      start: The start date as a Date object, a string representation of a date,
        or milliseconds since epoch.
      end: The end date as a Date object, a string representation of a date, or
        milliseconds since epoch.

    Returns:
      The filter object.
    """
    return self.filter(ee_filter.Filter.date(start, end))

  def first(self) -> element.Element:
    """Returns the first entry from a given collection."""

    return apifunction.ApiFunction.call_('Collection.first', self)

  def flatten(self) -> featurecollection.FeatureCollection:
    """Flattens collections of collections."""

    return apifunction.ApiFunction.call_('Collection.flatten', self)

  def geometry(
      self,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
  ) -> ee_geometry.Geometry:
    """Returns the geometry of a collection.

    Extracts and merges the geometries of a collection. Requires that all the
    geometries in the collection share the projection and edge
    interpretation.

    Caution: providing a large or complex collection as input can result in poor
    performance. Collating the geometry of collections does not scale well; use
    the smallest collection that is required to achieve the desired outcome.

    Args:
      maxError: An error margin to use when merging geometries.
    """

    return apifunction.ApiFunction.call_(
        'Collection.geometry', self, maxError
    )

  # pylint: disable-next=useless-parent-delegation
  def getInfo(self) -> Optional[Any]:
    """Returns all the known information about this collection.

    This function makes a REST call to to retrieve all the known information
    about this collection.

    Returns:
      The return contents vary but will include at least:
       features: an array containing metadata about the items in the
           collection that passed all filters.
       properties: a dictionary containing the collection's metadata
           properties.
    """
    return super().getInfo()

  def iterate(
      self, algorithm: Callable[[Any, Any], Any], first: Optional[Any] = None
  ) -> Any:
    """Iterates over a collection with an algorithm.

    Applies a user-supplied function to each element of a collection. The
    user-supplied function is given two arguments: the current element, and
    the value returned by the previous call to iterate() or the first argument,
    for the first iteration. The result is the value returned by the final
    call to the user-supplied function.

    Args:
      algorithm: The function to apply to each element. Must take two
          arguments - an element of the collection and the value from the
          previous iteration.
      first: The initial state.

    Returns:
      The result of the Collection.iterate() call.

    Raises:
      ee_exception.EEException: if algorithm is not a function.
    """
    element_type = self.elementType()
    with_cast = lambda e, prev: algorithm(element_type(e, None), prev)
    return apifunction.ApiFunction.call_(
        'Collection.iterate', self, with_cast, first)

  @_utils.accept_opt_prefix(('opt_property', 'prop'), 'opt_ascending')
  def limit(
      self,
      maximum: int,
      prop: Optional[str] = None,
      ascending: Optional[bool] = None,
  ) -> Collection:
    """Limit a collection to the specified number of elements.

    This limits a collection to the specified number of elements, optionally
    sorting them by a specified prop first.

    Args:
       maximum: The number to limit the collection to.
       prop: The property to sort by, if sorting.
       ascending: Whether to sort in ascending or descending order. The default
         is true (ascending).

    Returns:
       The collection.
    """
    args = {'collection': self, 'limit': maximum}
    if prop is not None:
      args['key'] = prop
    if ascending is not None:
      args['ascending'] = ascending
    return self._cast(
        apifunction.ApiFunction.apply_('Collection.limit', args))

  @staticmethod
  def loadTable(
      # pylint: disable=invalid-name
      tableId: _arg_types.String,
      geometryColumn: Optional[_arg_types.String] = None,
      # pylint: enable=invalid-name
      version: Optional[_arg_types.Integer] = None,
  ) -> featurecollection.FeatureCollection:
    """Returns a Collection of features from a specified table.

    Args:
      tableId: The asset ID of the table to load.
      geometryColumn: The name of the column to use as the main feature
        geometry. Not used if tableId is an asset ID.
      version: The version of the asset. -1 signifies the latest version.
        Ignored unless tableId is an asset ID.
    """

    return apifunction.ApiFunction.call_(
        'Collection.loadTable', tableId, geometryColumn, version
    )

  # TODO(user): Can dropNulls default to False?
  @_utils.accept_opt_prefix('opt_dropNulls')
  def map(
      self,
      algorithm: Callable[[Any], Any],
      dropNulls: Optional[bool] = None,  # pylint: disable=invalid-name
  ) -> Any:
    """Maps an algorithm over a collection.

    Args:
      algorithm: The operation to map over the images or features of the
        collection, a Python function that receives an image or features and
        returns one. The function is called only once and the result is captured
        as a description, so it cannot perform imperative operations or rely on
        external state.
      dropNulls: If true, the mapped algorithm is allowed to return nulls, and
        the elements for which it returns nulls will be dropped.

    Returns:
      The mapped collection.

    Raises:
      ee_exception.EEException: if algorithm is not a function.
    """
    element_type = self.elementType()
    with_cast = lambda e: algorithm(element_type(e, None))
    return self._cast(
        apifunction.ApiFunction.call_(
            'Collection.map', self, with_cast, dropNulls
        )
    )

  def merge(
      self, collection2: _arg_types.FeatureCollection
  ) -> featurecollection.FeatureCollection:
    """Returns a collection with the elements from two collections.

    Merges two collections into one. The result has all the elements that were
    in either collection.

    Elements from the first collection will have IDs prefixed with "1_" and
    elements from the second collection will have IDs prefixed with "2_".

    Note: If many collections need to be merged, consider placing them all in a
    collection and using FeatureCollection.flatten() instead. Repeated use of
    FeatureCollection.merge() will result in increasingly long element IDs and
    reduced performance.

    Args:
      collection2: The second collection to merge.
    """

    return apifunction.ApiFunction.call_('Collection.merge', self, collection2)

  def randomColumn(
      self,
      # pylint: disable=next=invalid-name
      columnName: Optional[_arg_types.String] = None,
      seed: Optional[_arg_types.Integer] = None,
      distribution: Optional[_arg_types.String] = None,
  ) -> featurecollection.FeatureCollection:
    """Returns a collection with a random column added to each feature.

    Adds a column of deterministic pseudorandom numbers to a collection. The
    outputs are double-precision floating point numbers. When using the
    'uniform' distribution (default), outputs are in the range of [0, 1). Using
    the 'normal' distribution, outputs have mu=0, sigma=1, but have no explicit
    limits.

    Args:
      columnName: The name of the column to add.
      seed: A seed used when generating the random numbers.
      distribution: The distribution type of random numbers to produce; one of
        'uniform' or 'normal'.
    """

    return apifunction.ApiFunction.call_(
        'Collection.randomColumn', self, columnName, seed, distribution
    )

  def reduceColumns(
      self,
      reducer: _arg_types.Reducer,
      selectors: _arg_types.List,
      # pylint: disable=invalid-name
      weightSelectors: Optional[_arg_types.List] = None,
  ) -> dictionary.Dictionary:
    """Returns a dictionary of results, keyed with the output names.

    Apply a reducer to each element of a collection, using the given selectors
    to determine the inputs.
    Returns a dictionary of results, keyed with the output names.

    Args:
      reducer: The reducer to apply.
      selectors: A selector for each input of the reducer.
      weightSelectors: A selector for each weighted input of the reducer.
    """

    return apifunction.ApiFunction.call_(
        'Collection.reduceColumns',
        self,
        reducer,
        selectors,
        weightSelectors,
    )

  def reduceToImage(
      self, properties: _arg_types.List, reducer: _arg_types.Reducer
  ) -> image.Image:
    """Returns an image from a collection using a reducer.

    Creates an image from a feature collection by applying a reducer over the
    selected properties of all the features that intersect each pixel.

    Args:
      properties: Properties to select from each feature and pass into the
        reducer.
      reducer: A Reducer to combine the properties of each intersecting feature
        into a final result to store in the pixel.
    """

    return apifunction.ApiFunction.call_(
        'Collection.reduceToImage', self, properties, reducer
    )

  def remap(
      self,
      # pylint: disable=invalid-name
      lookupIn: _arg_types.List,
      lookupOut: _arg_types.List,
      columnName: _arg_types.String,
      # pylint: enable=invalid-name
  ) -> featurecollection.FeatureCollection:
    """Remaps the value of a specific property in a collection.

    Takes two parallel lists and maps values found in one to values in the
    other. Any element with a value that is not specified in the first list is
    dropped from the output collection.

    Args:
      lookupIn: The input mapping values. Restricted to strings and integers.
      lookupOut: The output mapping values. Must be the same size as lookupIn.
      columnName: The name of the property to remap.

    Returns:
      An ee.FeatureCollection.
    """

    return apifunction.ApiFunction.call_(
        'Collection.remap', self, lookupIn, lookupOut, columnName
    )

  def size(self) -> ee_number.Number:
    """Returns the number of elements in the collection."""

    return apifunction.ApiFunction.call_('Collection.size', self)

  # TODO(user): Make ascending default to True
  @_utils.accept_opt_prefix('opt_ascending')
  def sort(self, prop: str, ascending: Optional[bool] = None) -> Any:
    """Sort a collection by the specified property.

    Args:
       prop: The property to sort by.
       ascending: Whether to sort in ascending or descending order.  The default
         is true (ascending).

    Returns:
       The collection.
    """
    args = {'collection': self, 'key': prop}
    if ascending is not None:
      args['ascending'] = ascending
    return self._cast(
        apifunction.ApiFunction.apply_('Collection.limit', args))

  def style(
      self,
      color: Optional[_arg_types.String] = None,
      # pylint: disable=invalid-name
      pointSize: Optional[_arg_types.Integer] = None,
      pointShape: Optional[_arg_types.String] = None,
      # pylint: enable=invalid-name
      width: Optional[_arg_types.Number] = None,
      # pylint: disable=invalid-name
      fillColor: Optional[_arg_types.String] = None,
      styleProperty: Optional[_arg_types.String] = None,
      # pylint: enable=invalid-name
      neighborhood: Optional[_arg_types.Integer] = None,
      # pylint: disable-next=invalid-name
      lineType: Optional[_arg_types.String] = None,
  ) -> image.Image:
    """Draw a vector collection for visualization using a simple style language.

    Args:
      color: A default color (CSS 3.0 color value e.g., 'FF0000' or 'red') to
        use for drawing the features. Supports opacity (e.g., 'FF000088' for 50%
        transparent red).
      pointSize: The default size in pixels of the point markers.
      pointShape: The default shape of the marker to draw at each point
        location. One of: `circle`, `square`, `diamond`, `cross`, `plus`,
        `pentagram`, `hexagram`, `triangle`, `triangle_up`, `triangle_down`,
        `triangle_left`, `triangle_right`, `pentagon`, `hexagon`, `star5`,
        `star6`. This argument also supports these Matlab marker abbreviations:
        `o`, `s`, `d`, `x`, `+`, `p`, `h`, `^`, `v`, `<`, `>`.
      width: The default line width for lines and outlines for polygons and
        point shapes.
      fillColor: The color for filling polygons and point shapes. Defaults to
        'color' at 0.66 opacity.
      styleProperty: A per-feature property expected to contain a dictionary.
        Values in the dictionary override any default values for that feature.
      neighborhood: If styleProperty is used and any feature has a pointSize or
        width larger than the defaults, tiling artifacts can occur. Specifies
        the maximum neighborhood (pointSize + width) needed for any feature.
      lineType: The default line style for lines and outlines of polygons and
        point shapes. Defaults to 'solid'. One of: solid, dotted, dashed.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(
        'Collection.style',
        self,
        color,
        pointSize,
        pointShape,
        width,
        fillColor,
        styleProperty,
        neighborhood,
        lineType,
    )

  def toList(
      self,
      count: _arg_types.Integer,
      offset: Optional[_arg_types.Integer] = None,
  ) -> ee_list.List:
    """Returns the elements of a collection as a list.

    Args:
      count: The maximum number of elements to fetch.
      offset: The number of elements to discard from the start. If set, (offset
        + count) elements will be fetched and the first offset elements will be
        discarded.
    """

    return apifunction.ApiFunction.call_(
        'Collection.toList', self, count, offset
    )

  def union(
      self,
      # pylint: disable-next=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
  ) -> featurecollection.FeatureCollection:
    """Returns a collection containing a single feature with a unioned geometry.

    Merges all geometries in a given collection into one and returns a
    collection containing a single feature with only an ID of 'union_result' and
    a geometry.

    Args:
      maxError: The maximum error allowed when performing any necessary
        reprojections. If not specified, defaults to the error margin requested
        from the output.
    """

    return apifunction.ApiFunction.call_('Collection.union', self, maxError)
