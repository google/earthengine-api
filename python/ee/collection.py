"""Common representation for ImageCollection and FeatureCollection.

This class is never intended to be instantiated by the user.
"""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import apifunction
import customfunction
import ee_exception
import ee_types
import element
import filter   # pylint: disable=redefined-builtin


class Collection(element.Element):
  """Base class for ImageCollection and FeatureCollection."""

  _initialized = False

  def __init__(self, func, args):
    """Constructs a collection by initializing its ComputedObject."""
    super(Collection, self).__init__(func, args)

  @classmethod
  def initialize(cls):
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, 'Collection', 'Collection')
      apifunction.ApiFunction.importApi(
          cls, 'AggregateFeatureCollection', 'Collection', 'aggregate_')
      cls._initialized = True

  @classmethod
  def reset(cls):
    """Removes imported API functions from this class.

    Also resets the serial ID used for mapping Python functions to 0.
    """
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  def filter(self, new_filter):
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

  def filterMetadata(self, name, operator, value):
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
    return self.filter(filter.Filter.metadata_(name, operator, value))

  def filterBounds(self, geometry):
    """Shortcut to add a geometry filter to a collection.

    Items in the collection with a footprint that fails to intersect
    the given geometry will be excluded when the collection is evaluated.
    This is equivalent to self.filter(Filter().geometry(...)).

    Args:
      geometry: The boundary to filter to either as a GeoJSON geometry,
          or a FeatureCollection, from which a geometry will be extracted.

    Returns:
      The filter object.
    """
    return self.filter(filter.Filter.geometry(geometry))

  def filterDate(self, start, opt_end=None):
    """Shortcut to filter a collection with a date range.

    Items in the collection with a time_start property that doesn't
    fall between the start and end dates will be excluded.
    This is equivalent to self.filter(Filter().date(...)).

    Args:
      start: The start date as a Date object, a string representation of
          a date, or milliseconds since epoch.
      opt_end: The end date as a Date object, a string representation of
          a date, or milliseconds since epoch.

    Returns:
      The filter object.
    """
    return self.filter(filter.Filter.date(start, opt_end))

  def getInfo(self):
    """Returns all the known information about this collection.

    This function makes an REST call to to retrieve all the known information
    about this collection.

    Returns:
      The return contents vary but will include at least:
       features: an array containing metadata about the items in the
           collection that passed all filters.
       properties: a dictionary containing the collection's metadata
           properties.
    """
    return super(Collection, self).getInfo()

  def limit(self, maximum, opt_property=None, opt_ascending=None):
    """Limit a collection to the specified number of elements.

    This limits a collection to the specified number of elements, optionally
    sorting them by a specified property first.

    Args:
       maximum: The number to limit the collection to.
       opt_property: The property to sort by, if sorting.
       opt_ascending: Whether to sort in ascending or descending order.
           The default is true (ascending).

    Returns:
       The collection.
    """
    args = {'collection': self, 'limit': maximum}
    if opt_property is not None:
      args['key'] = opt_property
    if opt_ascending is not None:
      args['ascending'] = opt_ascending
    return self._cast(
        apifunction.ApiFunction.apply_('Collection.limit', args))

  def sort(self, prop, opt_ascending=None):
    """Sort a collection by the specified property.

    Args:
       prop: The property to sort by.
       opt_ascending: Whether to sort in ascending or descending
           order.  The default is true (ascending).

    Returns:
       The collection.
    """
    args = {'collection': self, 'key': prop}
    if opt_ascending is not None:
      args['ascending'] = opt_ascending
    return self._cast(
        apifunction.ApiFunction.apply_('Collection.limit', args))

  @staticmethod
  def name():
    return 'Collection'

  def mapInternal(self, cls, algorithm):
    """Maps an algorithm over a collection.

    Args:
      cls: The collection elements' type (class).
      algorithm: The operation to map over the images or features of the
          collection, a Python function that receives an image or features and
          returns one. The function is called only once and the result is
          captured as a description, so it cannot perform imperative operations
          or rely on external state.

    Returns:
      The mapped collection.

    Raises:
      ee_exception.EEException: if algorithm is not a function.
    """
    if not callable(algorithm):
      raise ee_exception.EEException(
          'Can\'t map non-callable object: %s' % algorithm)
    signature = {
        'name': '',
        'returns': 'Object',
        'args': [{
            'name': None,
            'type': ee_types.classToName(cls)
        }]
    }
    return self._cast(apifunction.ApiFunction.apply_('Collection.map', {
        'collection': self,
        'baseAlgorithm': customfunction.CustomFunction(signature, algorithm)
    }))
