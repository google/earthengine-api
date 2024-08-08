"""Collection filters.

Example usage:
  Filter('time', low, high)
     .bounds(ring)
     .eq('time', value)
     .lt('time', value)
"""

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

from __future__ import annotations

from typing import Optional

from ee import _arg_types
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

  def predicateCount(self) -> int:
    """Return the number of predicates that have been added to this filter.

    Returns:
      The number of predicates that have been added to this filter.
      This does not count nested predicates.
    """
    return len(self._filter)

  def _append(self, new_filter: _arg_types.Filter) -> Filter:
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
    if new_filter is None:
      raise ValueError('new_filter should never be None')
    prev = list(self._filter)
    if isinstance(new_filter, Filter):
      prev.extend(new_filter._filter)  # pylint: disable=protected-access
    elif isinstance(new_filter, list):
      prev.extend(new_filter)
    else:
      prev.append(new_filter)
    return Filter(prev)

  @staticmethod
  def metadata_(name: str, operator: str, value: _arg_types.Any) -> Filter:
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
  def name() -> str:
    return 'Filter'

  @staticmethod
  def And(*args) -> Filter:
    """Combine two or more filters using boolean AND."""
    if len(args) == 1 and isinstance(args[0], (list, tuple)):
      args = args[0]
    return apifunction.ApiFunction.call_('Filter.and', args)

  @staticmethod
  def area(
      min: _arg_types.Number,  # pylint: disable=redefined-builtin
      max: _arg_types.Number,  # pylint: disable=redefined-builtin
      # pylint: disable=invalid-name
      maxError: Optional[_arg_types.ErrorMargin] = None,
      geometrySelector: Optional[_arg_types.String] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns an area filter of the geometry.

    Returns a filter that passes if the specified geometry has an area within
    the given range (inclusive).

    Args:
      min: Minimum area in square meters (inclusive).
      max: Maximum area in square meters (inclusive).
      maxError: The maximum allowed error for computing the geometry's area.
      geometrySelector: The name of the geometry property to use for filtering.
        Leave blank or use '.geo' to operate on the object's geometry.
    """

    return apifunction.ApiFunction.call_(
        'Filter.area', min, max, maxError, geometrySelector
    )

  @staticmethod
  def dateRangeContains(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns a filter that passes if a date range contains a date.

    Creates a unary or binary filter that passes if the left operand, a date
    range, contains the right operand, a date.

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
    """

    return apifunction.ApiFunction.call_(
        'Filter.dateRangeContains', leftField, rightValue, rightField, leftValue
    )

  @staticmethod
  @_utils.accept_opt_prefix('opt_errorMargin')
  def bounds(
      geometry: _arg_types.Geometry,
      # pylint: disable-next=invalid-name
      errorMargin: Optional[_arg_types.ErrorMargin] = None,
  ) -> Filter:
    """Returns a filter on intersection with geometry.

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
    """
    return Filter.geometry(geometry, errorMargin)

  @staticmethod
  def calendarRange(
      start: _arg_types.Integer,
      end: Optional[_arg_types.Integer] = None,
      field: Optional[_arg_types.String] = None,
  ) -> Filter:
    """Returns a filter that passes if a timestamp is in a range.

    Returns a filter that passes if the object's timestamp falls within the
    given range of a calendar field.

    The `month`, `day_of_year`, `day_of_month`, and `day_of_week` are 1-based.
    Times are assumed to be in UTC. Weeks are assumed to begin on Monday as day
    1. If `end` < `start` then this tests for `value` >= `start` OR `value` <=
    `end`, to allow for wrapping.

    Args:
      start: The start of the desired calendar field, inclusive.
      end: The end of the desired calendar field, inclusive. Defaults to the
        same value as start.
      field: The calendar field to filter over. Options are: `year`, `month`,
        `hour`, `minute`, `day_of_year`, `day_of_month`, and `day_of_week`.
    """

    return apifunction.ApiFunction.call_(
        'Filter.calendarRange', start, end, field
    )

  @staticmethod
  def contains(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      maxError: Optional[_arg_types.ErrorMargin] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns a filter that passes if the left contains the right geometry.

    Creates a unary or binary filter that passes if the left geometry contains
    the right geometry (empty geometries are not contained in anything).

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
      maxError: The maximum reprojection error allowed during filter
        application.
    """

    return apifunction.ApiFunction.call_(
        'Filter.contains',
        leftField,
        rightValue,
        rightField,
        leftValue,
        maxError,
    )

  @staticmethod
  @_utils.accept_opt_prefix('opt_end')
  def date(
      start: _arg_types.Date, end: Optional[_arg_types.Date] = None
  ) -> Filter:
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
  def dayOfYear(start: _arg_types.Integer, end: _arg_types.Integer) -> Filter:
    """Returns a day-of-year filter.

    Returns a filter that passes if the object's timestamp falls within the
    given day-of-year range.

    Args:
      start: The start of the desired day range, inclusive.
      end: The end of the desired day range, inclusive.
    """

    return apifunction.ApiFunction.call_('Filter.dayOfYear', start, end)

  @staticmethod
  def disjoint(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      maxError: Optional[_arg_types.ErrorMargin] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns a filter.

    Creates a unary or binary filter that passes unless the left geometry
    intersects the right geometry.

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
      maxError: The maximum reprojection error allowed during filter
        application.
    """

    return apifunction.ApiFunction.call_(
        'Filter.disjoint',
        leftField,
        rightValue,
        rightField,
        leftValue,
        maxError,
    )

  @staticmethod
  def eq(name: _arg_types.String, value: _arg_types.Any) -> Filter:
    """Filter to metadata equal to the given value."""
    return apifunction.ApiFunction.call_('Filter.equals', name, value)

  @staticmethod
  def equals(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns a filter that passes if the two operands are equals.

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
    """

    return apifunction.ApiFunction.call_(
        'Filter.equals', leftField, rightValue, rightField, leftValue
    )

  @staticmethod
  def expression(expression) -> Filter:
    """Returns a filter tree from a string.

    Args:
      expression: A string to be parsed into a Filter object (e.g., "property >
        value"). Supported operators include: >, >=, <, <=, ==, !=, (), !, &&
        and ||.
    """

    return apifunction.ApiFunction.call_('Filter.expression', expression)

  @staticmethod
  @_utils.accept_opt_prefix('opt_errorMargin')
  def geometry(
      geometry: _arg_types.Geometry,
      # pylint: disable-next=invalid-name
      errorMargin: Optional[_arg_types.ErrorMargin] = None,
  ):
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
  def greaterThan(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns a filter that passes if value is greater than the right operand.

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
    """

    return apifunction.ApiFunction.call_(
        'Filter.greaterThan', leftField, rightValue, rightField, leftValue
    )

  @staticmethod
  def greaterThanOrEquals(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns filter that passes if value is greater than the right operand.

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
    """

    return apifunction.ApiFunction.call_(
        'Filter.greaterThanOrEquals',
        leftField,
        rightValue,
        rightField,
        leftValue,
    )

  @staticmethod
  def gt(name: _arg_types.String, value: _arg_types.Any) -> Filter:
    """Filter on metadata greater than the given value."""
    return apifunction.ApiFunction.call_('Filter.greaterThan', name, value)

  @staticmethod
  def gte(name: _arg_types.String, value: _arg_types.Any) -> Filter:
    """Filter on metadata greater than or equal to the given value."""
    return Filter.lt(name, value).Not()

  @staticmethod
  def hasType(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns a filter that passes if the left has the type.

    Creates a unary or binary filter that passes if the left operand has the
    type, or is a subtype of the type named in the right operand.

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
      An ee.Filter.
    """

    return apifunction.ApiFunction.call_(
        'Filter.hasType', leftField, rightValue, rightField, leftValue
    )

  @staticmethod
  def intersects(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      maxError: Optional[_arg_types.ErrorMargin] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns a filter that passes if left intersects the right geometry.

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
      maxError: The maximum reprojection error allowed during filter
        application.
    """

    return apifunction.ApiFunction.call_(
        'Filter.intersects',
        leftField,
        rightValue,
        rightField,
        leftValue,
        maxError,
    )

  @staticmethod
  def isContained(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      maxError: Optional[_arg_types.ErrorMargin] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns filter that passes if the right geometry contains the geometry.

    Empty geometries are not contained in anything.

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
      maxError: The maximum reprojection error allowed during filter
        application.
    """

    return apifunction.ApiFunction.call_(
        'Filter.isContained',
        leftField,
        rightValue,
        rightField,
        leftValue,
        maxError,
    )

  @staticmethod
  @_utils.accept_opt_prefix(
      'opt_leftField', 'opt_rightValue', 'opt_rightField', 'opt_leftValue'
  )
  def inList(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
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
  def lessThan(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns filter that passes if the value is less than the right operand.

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
    """

    return apifunction.ApiFunction.call_(
        'Filter.lessThan', leftField, rightValue, rightField, leftValue
    )

  @staticmethod
  def lessThanOrEquals(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns filter that passes if the value is less than the right operand.

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
    """

    return apifunction.ApiFunction.call_(
        'Filter.lessThanOrEquals', leftField, rightValue, rightField, leftValue
    )

  @staticmethod
  def listContains(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns filter that passes if the left, contains the right.

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
      An ee.Filter.
    """

    return apifunction.ApiFunction.call_(
        'Filter.listContains', leftField, rightValue, rightField, leftValue
    )

  @staticmethod
  def lt(name: _arg_types.String, value: _arg_types.Any) -> Filter:
    """Filter to metadata less than the given value."""
    return apifunction.ApiFunction.call_('Filter.lessThan', name, value)

  @staticmethod
  def lte(name: _arg_types.String, value: _arg_types.Any) -> Filter:
    """Filter on metadata less than or equal to the given value."""
    return Filter.gt(name, value).Not()

  @staticmethod
  def maxDifference(
      difference: _arg_types.Number,
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns a filter that passes if the fields are within a given difference.

    Creates a unary or binary filter that passes if the left and right operands,
    both numbers, are within a given maximum difference.

    If used as a join condition, this numeric difference is used as a join
    measure.

    Args:
      difference: The maximum difference for which the filter will return true.
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
    """

    return apifunction.ApiFunction.call_(
        'Filter.maxDifference',
        difference,
        leftField,
        rightValue,
        rightField,
        leftValue,
    )

  @staticmethod
  def neq(name: _arg_types.String, value: _arg_types.Any) -> Filter:
    """Filter to metadata not equal to the given value."""
    return Filter.eq(name, value).Not()

  @staticmethod
  def notEquals(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns a filter that passes unless the two operands are equal.

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
    """

    return apifunction.ApiFunction.call_(
        'Filter.notEquals', leftField, rightValue, rightField, leftValue
    )

  def Not(self) -> Filter:
    """Returns the opposite of this filter.

    Returns:
      The negated filter, which will match if and only if this filter does not.
    """
    return apifunction.ApiFunction.call_('Filter.not', self)

  @staticmethod
  def notNull(properties: _arg_types.List) -> Filter:
    """Returns a filter that passes if all the named properties are not null."""

    return apifunction.ApiFunction.call_('Filter.notNull', properties)

  @staticmethod
  def Or(*args) -> Filter:
    """Combine two or more filters using boolean OR."""
    if len(args) == 1 and isinstance(args[0], (list, tuple)):
      args = args[0]
    return apifunction.ApiFunction.call_('Filter.or', args)

  @staticmethod
  def rangeContains(
      field: _arg_types.String,
      minValue: _arg_types.Number,  # pylint: disable=invalid-name
      maxValue: _arg_types.Number,  # pylint: disable=invalid-name
  ) -> Filter:
    """Returns a filter that passes if the value is in the range.

    Returns a filter that passes if the value of the selected field is in the
    specified range (inclusive).

    Args:
      field: A selector for the property being tested.
      minValue: The lower bound of the range.
      maxValue: The upper bound of the range.
    """

    return apifunction.ApiFunction.call_(
        'Filter.rangeContains', field, minValue, maxValue
    )

  @staticmethod
  def stringContains(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns a filter that passes if it contains the right string.

    Creates a unary or binary filter that passes if the left operand, a string,
    contains the right operand, also a string.

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
    """

    return apifunction.ApiFunction.call_(
        'Filter.stringContains', leftField, rightValue, rightField, leftValue
    )

  @staticmethod
  def stringEndsWith(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns a filter that passes if the string ends with the right string.

    Creates a unary or binary filter that passes if the left operand, a string,
    ends with the right operand, also a string.

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
    """

    return apifunction.ApiFunction.call_(
        'Filter.stringEndsWith', leftField, rightValue, rightField, leftValue
    )

  @staticmethod
  def stringStartsWith(
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns a filter that passes if the string starts with the right string.

    Creates a unary or binary filter that passes if the left operand, a string,
    starts with the right operand, also a string.

    Args:
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
    """

    return apifunction.ApiFunction.call_(
        'Filter.stringStartsWith', leftField, rightValue, rightField, leftValue
    )

  @staticmethod
  def withinDistance(
      distance: _arg_types.Number,
      # pylint: disable=invalid-name
      leftField: Optional[_arg_types.String] = None,
      rightValue: Optional[_arg_types.Any] = None,
      rightField: Optional[_arg_types.String] = None,
      leftValue: Optional[_arg_types.Any] = None,
      maxError: Optional[_arg_types.ErrorMargin] = None,
      # pylint: enable=invalid-name
  ) -> Filter:
    """Returns a filter that passes if the geometry is within a distance.

    Creates a unary or binary filter that passes if the left geometry is within
    a specified distance of the right geometry. If used as a join condition,
    this distance is used as a join measure.

    Args:
      distance: The maximum distance for which the filter will return true.
      leftField: A selector for the left operand. Should not be specified if
        leftValue is specified.
      rightValue: The value of the right operand. Should not be specified if
        rightField is specified.
      rightField: A selector for the right operand. Should not be specified if
        rightValue is specified.
      leftValue: The value of the left operand. Should not be specified if
        leftField is specified.
      maxError: The maximum reprojection error allowed during filter
        application.
    """

    return apifunction.ApiFunction.call_(
        'Filter.withinDistance',
        distance,
        leftField,
        rightValue,
        rightField,
        leftValue,
        maxError,
    )
