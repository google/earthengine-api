#!/usr/bin/env python
"""Collection filters.

Example usage:
  Filter('time', low, high)
     .bounds(ring)
     .eq('time', value)
     .lt('time', value)
"""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

from . import apifunction
from . import computedobject
from . import ee_exception


# A map from the deprecated old-style comparison operator names to API
# function names, implicitly prefixed with "Filter.". Negative operators
# (those starting with "not_") are not included.
_FUNCTION_NAMES = {
    'equals': 'equals',
    'less_than': 'lessThan',
    'greater_than': 'greaterThan',
    'contains': 'stringContains',
    'starts_with': 'stringStartsWith',
    'ends_with': 'stringEndsWith',
}


class Filter(computedobject.ComputedObject):
  """An object to represent collection filters."""

  _initialized = False

  def __init__(self, opt_filter=None):
    """Construct a filter.

    This constructor accepts the following args:
      1) Another filter.
      2) An array of filters (which are implicitly ANDed together).
      3) A ComputedObject returning a filter. Users shouldn't be making these;
         they're produced by the generator functions below.

    Args:
      opt_filter: Optional filter to add.
    """
    self.initialize()

    if isinstance(opt_filter, (list, tuple)):
      if not opt_filter:
        raise ee_exception.EEException('Empty list specified for ee.Filter().')
      elif len(opt_filter) == 1:
        opt_filter = opt_filter[0]
      else:
        self._filter = tuple(opt_filter)
        super(Filter, self).__init__(
            apifunction.ApiFunction.lookup('Filter.and'),
            {'filters': self._filter})
        return

    if isinstance(opt_filter, computedobject.ComputedObject):
      super(Filter, self).__init__(
          opt_filter.func, opt_filter.args, opt_filter.varName)
      self._filter = (opt_filter,)
    elif opt_filter is None:
      # A silly call with no arguments left for backward-compatibility.
      # Encoding such a filter is expected to fail, but it can be composed
      # by calling the various methods that end up in _append().
      super(Filter, self).__init__(None, None)
      self._filter = ()
    else:
      raise ee_exception.EEException(
          'Invalid argument specified for ee.Filter(): %s' % opt_filter)

  @classmethod
  def initialize(cls):
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, 'Filter', 'Filter')
      cls._initialized = True

  @classmethod
  def reset(cls):
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  def predicateCount(self):
    """Return the number of predicates that have been added to this filter.

    Returns:
      The number of predicates that have been added to this filter.
      This does not count nested predicates.
    """
    return len(self._filter)

  def _append(self, new_filter):
    """Append a predicate to this filter.

    These are implicitly ANDed.

    Args:
      new_filter: The filter to append to this one.  Possible types are:
          1) another fully constructed Filter,
          2) a JSON representation of a filter,
          3) an array of 1 or 2.

    Returns:
      A new filter that is the combination of both.
    """
    if new_filter is not None:
      prev = list(self._filter)
      if isinstance(new_filter, Filter):
        prev.extend(new_filter._filter)  # pylint: disable=protected-access
      elif isinstance(new_filter, list):
        prev.extend(new_filter)
      else:
        prev.append(new_filter)
    return Filter(prev)

  def Not(self):
    """Returns the opposite of this filter.

    Returns:
      The negated filter, which will match iff this filter doesn't.
    """
    return apifunction.ApiFunction.call_('Filter.not', self)

  @staticmethod
  def metadata_(name, operator, value):
    """Filter on metadata. This is deprecated.

    Args:
      name: The property name to filter on.
      operator: The type of comparison. One of:
          "equals", "less_than", "greater_than", "contains", "begins_with",
          "ends_with", or any of these prefixed with "not_".
      value: The value to compare against.

    Returns:
      The new filter.

    Deprecated.  Use ee.Filter.eq(), ee.Filter.gte(), etc.'
    """
    operator = operator.lower()

    # Check for negated filters.
    negated = False
    if operator.startswith('not_'):
      negated = True
      operator = operator[4:]

    # Convert the operator to a function.
    if operator not in _FUNCTION_NAMES:
      raise ee_exception.EEException(
          'Unknown filtering operator: %s' % operator)
    func_name = 'Filter.' + _FUNCTION_NAMES[operator]
    new_filter = apifunction.ApiFunction.call_(func_name, name, value)

    return new_filter.Not() if negated else new_filter

  @staticmethod
  def eq(name, value):
    """Filter to metadata equal to the given value."""
    return apifunction.ApiFunction.call_('Filter.equals', name, value)

  @staticmethod
  def neq(name, value):
    """Filter to metadata not equal to the given value."""
    return Filter.eq(name, value).Not()

  @staticmethod
  def lt(name, value):
    """Filter to metadata less than the given value."""
    return apifunction.ApiFunction.call_('Filter.lessThan', name, value)

  @staticmethod
  def gte(name, value):
    """Filter on metadata greater than or equal to the given value."""
    return Filter.lt(name, value).Not()

  @staticmethod
  def gt(name, value):
    """Filter on metadata greater than the given value."""
    return apifunction.ApiFunction.call_('Filter.greaterThan', name, value)

  @staticmethod
  def lte(name, value):
    """Filter on metadata less than or equal to the given value."""
    return Filter.gt(name, value).Not()

  @staticmethod
  def And(*args):
    """Combine two or more filters using boolean AND."""
    if len(args) == 1 and isinstance(args[0], (list, tuple)):
      args = args[0]
    return apifunction.ApiFunction.call_('Filter.and', args)

  @staticmethod
  def Or(*args):
    """Combine two or more filters using boolean OR."""
    if len(args) == 1 and isinstance(args[0], (list, tuple)):
      args = args[0]
    return apifunction.ApiFunction.call_('Filter.or', args)

  @staticmethod
  def date(start, opt_end=None):
    """Filter images by date.

    The start and end may be a Date, numbers (interpreted as milliseconds since
    1970-01-01T00:00:00Z), or strings (such as '1996-01-01T08:00'). Based on
    'system:time_start'.

    Args:
      start: The inclusive start date.
      opt_end: The optional exclusive end date, If not specified, a
               1-millisecond range starting at 'start' is created.

    Returns:
      The modified filter.
    """
    date_range = apifunction.ApiFunction.call_('DateRange', start, opt_end)
    return apifunction.ApiFunction.apply_('Filter.dateRangeContains', {
        'leftValue': date_range,
        'rightField': 'system:time_start'
    })

  @staticmethod
  def inList(opt_leftField=None,
             opt_rightValue=None,
             opt_rightField=None,
             opt_leftValue=None):
    """Filter on metadata contained in a list.

    Args:
      opt_leftField: A selector for the left operand.
          Should not be specified if leftValue is specified.
      opt_rightValue: The value of the right operand.
          Should not be specified if rightField is specified.
      opt_rightField: A selector for the right operand.
          Should not be specified if rightValue is specified.
      opt_leftValue: The value of the left operand.
          Should not be specified if leftField is specified.

    Returns:
      The constructed filter.
    """
    # Implement this in terms of listContains, with the arguments switched.
    # In listContains the list is on the left side, while in inList it's on
    # the right.
    return apifunction.ApiFunction.apply_('Filter.listContains', {
        'leftField': opt_rightField,
        'rightValue': opt_leftValue,
        'rightField': opt_leftField,
        'leftValue': opt_rightValue
    })

  @staticmethod
  def geometry(geometry, opt_errorMargin=None):
    """Filter on intersection with geometry.

    Items in the collection with a footprint that fails to intersect
    the given geometry will be excluded.

    Args:
      geometry: The geometry to filter to either as a GeoJSON geometry,
          or a FeatureCollection, from which a geometry will be extracted.
      opt_errorMargin: An optional error margin. If a number, interpreted as
          sphere surface meters.

    Returns:
      The constructed filter.
    """
    # Invoke geometry promotion then manually promote to a Feature.
    args = {
        'leftField': '.all',
        'rightValue': apifunction.ApiFunction.call_('Feature', geometry)
    }
    if opt_errorMargin is not None:
      args['maxError'] = opt_errorMargin
    return apifunction.ApiFunction.apply_('Filter.intersects', args)

  @staticmethod
  def name():
    return 'Filter'
