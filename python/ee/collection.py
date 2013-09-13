"""Common representation for ImageCollection and FeatureCollection.

This class is never intended to be instantiated by the user.
"""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import apifunction
import computedobject
import customfunction
import ee_exception
import ee_types
import filter   # pylint: disable=redefined-builtin
import function


class Collection(computedobject.ComputedObject):
  """Base class for ImageCollection and FeatureCollection."""

  _initialized = False

  # The serial number of the next mapping variable.
  _serialMappingId = 0

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
    cls._serialMappingId = 0

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

  @classmethod
  def _cast(cls, obj):
    """Cast a ComputedObject to a new instance of the same class as this.

    Args:
      obj: The object to cast.

    Returns:
      The cast object, and instance of the class on which this method is called.
    """
    if isinstance(obj, cls):
      return obj
    else:
      # Assumes all subclass constructors can be called with a
      # ComputedObject as their first parameter.
      return cls(obj)

  @staticmethod
  def name():
    return 'Collection'

  def mapInternal(self,
                  cls,
                  algorithm,
                  opt_dynamicArgs=None,
                  opt_constantArgs=None,
                  opt_destination=None):
    """Maps an algorithm over a collection.

    Args:
      cls: The collection elements' type (class).
      algorithm: The operation to map over the images or features of the
          collection. Either an algorithm name as a string, or a Python
          function that receives an image or features and returns one. If a
          function is passed, it is called only once and the result is captured
          as a description, so it cannot perform imperative operations or rely
          on external state.
      opt_dynamicArgs: A map specifying which properties of the input objects
          to pass to each argument of the algorithm. This maps from argument
          names to selector strings. Selector strings are property names,
          optionally concatenated into chains separated by a period to access
          properties-of-properties. To pass the whole object, use the special
          selector string '.all', and to pass the geometry, use '.geo'. If
          this argument is not specified, the names of the arguments will be
          matched exactly to the properties of the input object. If algorithm
          is a Python function, this must be null or undefined as the
          image will always be the only dynamic argument.
      opt_constantArgs: A map from argument names to constant values to be
          passed to the algorithm on every invocation.
      opt_destination: The property where the result of the algorithm will be
          put. If this is null or undefined, the result of the algorithm will
          replace the input, as is the usual behavior of a mapping opeartion.

    Returns:
      The mapped collection.

    Raises:
      RuntimeError: if algorithm is a Python function and opt_dynamicArgs is
          specified.
    """
    if callable(algorithm):
      if opt_dynamicArgs:
        # TODO(user): Remove this once we have a getProperty() algorithm.
        raise ee_exception.EEException(
            'Can\'t use dynamicArgs with a mapped Python function.')
      varName = '_MAPPING_VAR_%d' % Collection._serialMappingId
      Collection._serialMappingId += 1

      typeName = ee_types.classToName(cls)
      sig = {'returns': typeName, 'args': [{'name': varName, 'type': typeName}]}
      algorithm = customfunction.CustomFunction(sig, algorithm)
    elif isinstance(algorithm, basestring):
      algorithm = apifunction.ApiFunction.lookup(algorithm)
    elif not isinstance(algorithm, function.Function):
      raise ee_exception.EEException(
          'Can\'t map non-callable object: %s' % algorithm)

    args = {
        'collection': self,
        'baseAlgorithm': algorithm
    }
    if opt_dynamicArgs:
      args['dynamicArgs'] = opt_dynamicArgs
    else:
      # Use the function's first argument.
      varName = algorithm.getSignature()['args'][0]['name']
      args['dynamicArgs'] = {varName: '.all'}

    if opt_constantArgs: args['constantArgs'] = opt_constantArgs
    if opt_destination: args['destination'] = opt_destination
    return self._cast(apifunction.ApiFunction.apply_('Collection.map', args))

  @classmethod
  def createAutoMapFunctions(cls, elementClass):
    """Creates map_*() methods on collectionClass.

    Creates a map_* method on collectionClass for each generated instance
    method on elementClass that maps that method over the collection.

    TODO(user): Deprecate these.

    Args:
      elementClass: The collection elements' type.
    """
    for name in dir(elementClass):
      method = getattr(elementClass, name)
      if callable(method) and hasattr(method, 'signature'):
        def MakeMapFunction(name, method):   # Capture scope.
          def MapFunction(self, *args, **kwargs):
            method_caller = lambda elem: method(elem, *args, **kwargs)
            destination = None
            if not ee_types.isSubtype('EEObject', method.signature['returns']):
              destination = name
            return self.mapInternal(
                elementClass, method_caller, None, None, destination)
          return MapFunction
        setattr(cls, 'map_' + name, MakeMapFunction(name, method))
