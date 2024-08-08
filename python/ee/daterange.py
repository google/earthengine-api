"""A wrapper for DateRanges."""
from __future__ import annotations

from typing import Any, Dict, Optional, Union

from ee import _arg_types
from ee import apifunction
from ee import computedobject
from ee import ee_date


class DateRange(computedobject.ComputedObject):
  """An object to represent an Earth Engine DateRange.

  Examples:
    ee.DateRange(1498287600000, 1498312800000)
    ee.DateRange('2017-06-24', '2017-07-24')
    ee.DateRange('2017-06-24', '2017-07-24', 'UTC')
    ee.DateRange('2017-06-24T07:00:00', '2017-07-24T07:00:00',
                 'America/Los_Angeles')

    now = ee.Date(datetime.datetime.utcnow())
    ee.DateRange(now.advance(-1, 'year'), now)

    ee.DateRange.unbounded()
  """

  _initialized: bool = False

  def __init__(
      self,
      start: Union[_arg_types.Date, _arg_types.DateRange],
      end: Optional[_arg_types.Date] = None,
      # pylint: disable-next=invalid-name
      timeZone: Optional[_arg_types.String] = None,
  ):
    """Creates a DateRange wrapper.

    When the start and end arguments are numbers, they are millisec (ms) from
    1970-01-01T00:00.

    Args:
      start: Beginning of the DateRange (inclusive).
      end: Optional ending of the DateRange (exclusive). Defaults to start + 1
        ms.
      timeZone: If start and/or end are strings, the time zone in which to
        interpret them. Defaults to UTC.
    """
    self.initialize()

    if (
        isinstance(start, computedobject.ComputedObject)
        and end is None
        and timeZone is None
    ):
      if self.is_func_returning_same(start):
        # If it is a call that is already returning a DateRange, just cast.
        super().__init__(start.func, start.args, start.varName)
        return

    args: Dict[str, Any] = {'start': start}
    if end is not None:
      args['end'] = end
    if timeZone is not None:
      args['timeZone'] = timeZone

    func = apifunction.ApiFunction(self.name())
    super().__init__(func, func.promoteArgs(args))

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

  @staticmethod
  def name() -> str:
    return 'DateRange'

  def contains(
      self, other: Union[_arg_types.Date, _arg_types.DateRange]
  ) -> computedobject.ComputedObject:
    """Returns true if the given Date or DateRange is within this DateRange.

    Args:
      other: The Date or DateRange to check if it is inside the DateRange.

    Returns:
      A Boolean ComputedObject.
    """

    return apifunction.ApiFunction.call_(self.name() + '.contains', self, other)

  def end(self) -> ee_date.Date:
    """Returns the (exclusive) end of this DateRange."""

    return apifunction.ApiFunction.call_(self.name() + '.end', self)

  def intersection(
      self, other: Union[_arg_types.Date, _arg_types.DateRange]
  ) -> 'DateRange':
    """Returns a DateRange that contains all the timespan of this and other.

    Args:
      other: The other DateRange to include in the intersection.

    Raises:
      EEException if the result is an empty DateRange.

    Returns:
      An ee.DateRange.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.intersection', self, other
    )

  def intersects(
      self, other: Union[_arg_types.Date, _arg_types.DateRange]
  ) -> computedobject.ComputedObject:
    """Returns true if the other DateRange has at least one time in common.

    Args:
      other: The other DateRange to check against.

    Returns:
      A Boolean ComputedObject.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.intersects', self, other
    )

  def isEmpty(self) -> computedobject.ComputedObject:
    """Returns true if this DateRange contains no dates, i.e. start >= end."""

    return apifunction.ApiFunction.call_(self.name() + '.isEmpty', self)

  def isUnbounded(self) -> computedobject.ComputedObject:
    """Returns true if this DateRange contains all dates."""

    return apifunction.ApiFunction.call_(self.name() + '.isUnbounded', self)

  def start(self) -> ee_date.Date:
    """Returns the (inclusive) start of this DateRange."""

    return apifunction.ApiFunction.call_(self.name() + '.start', self)

  @staticmethod
  def unbounded() -> DateRange:
    """Returns a DateRange that includes all possible dates."""

    return apifunction.ApiFunction.call_('DateRange.unbounded')

  def union(
      self, other: Union[_arg_types.Date, _arg_types.DateRange]
  ) -> DateRange:
    """Returns a DateRange that contains all points in this and other.

    Args:
      other: The DateRange to union with.

    Returns:
      An ee.DateRange.
    """

    return apifunction.ApiFunction.call_(self.name() + '.union', self, other)
