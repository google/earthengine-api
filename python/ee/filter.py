"""Collection filters.

Example usage:
  Filter('time', low, high)
     .bounds(ring)
     .eq('time', value)
     .lt('time', value)
"""

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import ee_exception


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

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  @_utils.accept_opt_prefix(('opt_filter', 'filter_'))
  def __init__(self, filter_=None):
    """Construct a filter.

    This constructor accepts the following args:
      1) Another filter.
      2) An array of filters (which are implicitly ANDed together).
      3) A ComputedObject returning a filter. Users shouldn't be making these;
         they're produced by the generator functions below.

    Args:
      filter_: Optional filter to add.
    """
    self.initialize()

    if isinstance(filter_, (list, tuple)):
      if not filter_:
        raise ee_exception.EEException('Empty list specified for ee.Filter().')
      elif len(filter_) == 1:
        filter_ = filter_[0]
      else:
        self._filter = tuple(filter_)
        super().__init__(
            apifunction.ApiFunction.lookup('Filter.and'),
            {'filters': self._filter})
        return

    if isinstance(filter_, computedobject.ComputedObject):
      super().__init__(filter_.func, filter_.args, filter_.varName)
      self._filter = (filter_,)
    elif filter_ is None:
      # A silly call with no arguments left for backward-compatibility.
      # Encoding such a filter is expected to fail, but it can be composed
      # by calling the various methods that end up in _append().
      super().__init__(None, None)
      self._filter = ()
    else:
      raise ee_exception.EEException(
          'Invalid argument specified for ee.Filter(): %s' % filter_
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
      The negated filter, which will match if and only if this filter does not.
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
  @_utils.accept_opt_prefix('opt_end')
  def date(start, end=None):
    """Filter images by date.

    The start and end may be a Date, numbers (interpreted as milliseconds since
    1970-01-01T00:00:00Z), or strings (such as '1996-01-01T08:00'). Based on
    'system:time_start'.

    Args:
      start: The inclusive start date.
      end: The optional exclusive end date, If not specified, a 1-millisecond
        range starting at 'start' is created.

    Returns:
      The modified filter.
    """
    date_range = apifunction.ApiFunction.call_('DateRange', start, end)
    return apifunction.ApiFunction.apply_('Filter.dateRangeContains', {
        'leftValue': date_range,
        'rightField': 'system:time_start'
    })

  @staticmethod
  @_utils.accept_opt_prefix(
      'opt_leftField', 'opt_rightValue', 'opt_rightField', 'opt_leftValue'
  )
  def inList(leftField=None, rightValue=None, rightField=None, leftValue=None):
    """Filter on metadata contained in a list.

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.

    Returns:
      The constructed filter.
    """
    # Implement this in terms of listContains, with the arguments switched.
    # In listContains the list is on the left side, while in inList it's on
    # the right.
    return apifunction.ApiFunction.apply_(
        'Filter.listContains',
        {
            'leftField': rightField,
            'rightValue': leftValue,
            'rightField': leftField,
            'leftValue': rightValue,
        },
    )

  @staticmethod
  @_utils.accept_opt_prefix('opt_errorMargin')
  def geometry(geometry, errorMargin=None):
    """Filter on intersection with geometry.

    Items in the collection with a footprint that fails to intersect
    the given geometry will be excluded.

    Args:
      geometry: The geometry to filter to either as a GeoJSON geometry, or a
        FeatureCollection, from which a geometry will be extracted.
      errorMargin: An optional error margin. If a number, interpreted as sphere
        surface meters.

    Returns:
      The constructed filter.
    """
    # Invoke geometry promotion then manually promote to a Feature.
    args = {
        'leftField': '.all',
        'rightValue': apifunction.ApiFunction.call_('Feature', geometry)
    }
    if errorMargin is not None:
      args['maxError'] = errorMargin
    return apifunction.ApiFunction.apply_('Filter.intersects', args)

  @staticmethod
  @_utils.accept_opt_prefix('opt_errorMargin')
  def bounds(geometry, errorMargin=None):
    """Filter on intersection with geometry.

    Items in the collection with a footprint that fails to intersect
    the given geometry will be excluded. This is an alias for geometry().

    Caution: providing a large or complex collection as the `geometry` argument
    can result in poor performance. Collating the geometry of collections does
    not scale well; use the smallest collection (or geometry) that is required
    to achieve the desired outcome.

    Args:
      geometry: The geometry to filter to either as a GeoJSON geometry, or a
        FeatureCollection, from which a geometry will be extracted.
      errorMargin: An optional error margin. If a number, interpreted as sphere
        surface meters.

    Returns:
      The constructed filter.
    """
    return Filter.geometry(geometry, errorMargin)

  @staticmethod
  def name() -> str:
    return 'Filter'
