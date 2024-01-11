"""Common representation for ImageCollection and FeatureCollection.

This class is never intended to be instantiated by the user.
"""

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

from __future__ import annotations

import datetime
from typing import Any, Callable, Dict, Optional, Type, Union

from ee import _utils
from ee import apifunction
from ee import deprecation
from ee import ee_date
from ee import ee_exception
from ee import element
from ee import filter as ee_filter
from ee import function
from ee import geometry as ee_geometry


class Collection(element.Element):
  """Base class for ImageCollection and FeatureCollection."""

  _initialized = False

  # pylint: disable-next=useless-parent-delegation
  @_utils.accept_opt_prefix('opt_varName')
  def __init__(
      self,
      func: function.Function,
      args: Dict[str, Any],
      varName: Optional[str] = None,
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

  def filter(self, new_filter: Union[str, ee_filter.Filter]) -> Any:
    """Apply a filter to this collection.

    Args:
      new_filter: Filter to add to this collection.

    Returns:
      The filtered collection object.
    """
    if not new_filter:
      raise ee_exception.EEException('Empty filters.')
    return self._cast(apifunction.ApiFunction.call_(
        'Collection.filter', self, new_filter))

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

  @staticmethod
  def name() -> str:
    return 'Collection'

  @staticmethod
  def elementType() -> Type[element.Element]:
    """Returns the type of the collection's elements."""
    return element.Element

  # TODO(user): Can dropNulls default to False?
  @_utils.accept_opt_prefix('opt_dropNulls')
  def map(
      self,
      algorithm: Callable[[Any], Any],
      dropNulls: Optional[bool] = None,
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
