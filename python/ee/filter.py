"""Collection filters.

Example usage:
  Filter('time', low, high)
     .bounds(ring)
     .eq('time', value)
     .lt('time', value)
"""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

# Our custom instance/static decorator is not recognized by lint.
# pylint: disable=no-self-argument, no-method-argument, g-doc-args

import datetime
import functools

import apifunction
import computedobject
import ee_exception


class _FilterAutoCreator(object):
  """A decorator to make Filter methods both static and instance.

  If the decorated method is called as an instance method, its result is passed
  through _append().
  """

  def __init__(self, func):
    self.func = func

  def __get__(self, filter_instance, cls=None):
    if filter_instance is None:
      return self.func

    @functools.wraps(self.func)
    def PassThroughAppend(*args, **kwargs):
      return filter_instance._append(  # pylint: disable=protected-access
          self.func(*args, **kwargs))

    return PassThroughAppend


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

    This constuctor accepts the following args:
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
      super(Filter, self).__init__(opt_filter.func, opt_filter.args)
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

  @_FilterAutoCreator
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

  @_FilterAutoCreator
  def eq(name, value):
    """Filter to metadata equal to the given value."""
    return apifunction.ApiFunction.call_('Filter.equals', name, value)

  @_FilterAutoCreator
  def neq(name, value):
    """Filter to metadata not equal to the given value."""
    return Filter.eq(name, value).Not()

  @_FilterAutoCreator
  def lt(name, value):
    """Filter to metadata less than the given value."""
    return apifunction.ApiFunction.call_('Filter.lessThan', name, value)

  @_FilterAutoCreator
  def gte(name, value):
    """Filter on metadata greater than or equal to the given value."""
    return Filter.lt(name, value).Not()

  @_FilterAutoCreator
  def gt(name, value):
    """Filter on metadata greater than the given value."""
    return apifunction.ApiFunction.call_('Filter.greaterThan', name, value)

  @_FilterAutoCreator
  def lte(name, value):
    """Filter on metadata less than or equal to the given value."""
    return Filter.gt(name, value).Not()

  @_FilterAutoCreator
  def contains(name, value):
    """Filter on metadata containing the given string."""
    return apifunction.ApiFunction.call_('Filter.stringContains', name, value)

  @_FilterAutoCreator
  def not_contains(name, value):
    """Filter on metadata not containing the given string."""
    return Filter.contains(name, value).Not()

  @_FilterAutoCreator
  def starts_with(name, value):
    """Filter on metadata begining with the given string."""
    return apifunction.ApiFunction.call_('Filter.stringStartsWith', name, value)

  @_FilterAutoCreator
  def not_starts_with(name, value):
    """Filter on metadata not begining with the given string."""
    return Filter.starts_with(name, value).Not()

  @_FilterAutoCreator
  def ends_with(name, value):
    """Filter on metadata ending with the given string."""
    return apifunction.ApiFunction.call_('Filter.stringEndsWith', name, value)

  @_FilterAutoCreator
  def not_ends_with(name, value):
    """Filter on metadata not ending with the given string."""
    return Filter.ends_with(name, value).Not()

  @_FilterAutoCreator
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

  @_FilterAutoCreator
  def date(start, opt_end=None):
    """Filter images by date.

    Args:
      start: The start date as a UTC datetime or ms since Unix epoch.
      opt_end: The end date as a UTC datetime or ms since Unix epoch.

    Returns:
      The modified filter.
    """
    if opt_end is None:
      # Can't create half-open DateRanges. Hack around it.
      opt_end = datetime.datetime(9999, 1, 1)
    date_range = apifunction.ApiFunction.call_('DateRange', start, opt_end)
    return apifunction.ApiFunction.apply_('Filter.dateRangeContains', {
        'leftValue': date_range,
        'rightField': 'system:time_start'
    })

  @_FilterAutoCreator
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

  @_FilterAutoCreator
  def geometry(geometry, opt_errorMargin=None):
    """Filter on bounds.

    Items in the collection with a footprint that fails to intersect
    the bounds will be excluded when the collection is evaluated.

    Args:
      geometry: The geometry to filter to either as a GeoJSON geometry,
          or a FeatureCollection, from which a geometry will be extracted.
      opt_errorMargin: An optional error margin. If a number, interpreted as
          sphere surface meters.

    Returns:
      The modified filter.
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
