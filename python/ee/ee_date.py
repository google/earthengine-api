"""A wrapper for dates."""
from __future__ import annotations

import datetime
import math
from typing import Any, Optional, Union

from ee import _arg_types
from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import daterange
from ee import ee_number
from ee import ee_string
from ee import ee_types as types
from ee import serializer

# _arg_types.DateType does not have datetime.Datetime.
_DateType = Union[
    datetime.datetime, float, str, 'Date', computedobject.ComputedObject
]


class Date(computedobject.ComputedObject):
  """An object to represent dates."""

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  @_utils.accept_opt_prefix('opt_tz')
  def __init__(
      self, date: Union[_DateType], tz: Optional[_arg_types.String] = None
  ):
    """Construct a date.

    This sends all inputs (except another Date) through the Date function.

    This constructor accepts the following args:
      1) A bare date.
      2) An ISO string
      3) An integer number of milliseconds since the epoch.
      4) A ComputedObject.

    Args:
      date: The date to wrap.
      tz: An optional timezone, only usable with a string date.
    """
    self.initialize()

    func = apifunction.ApiFunction(self.name())
    args: dict[str, Any]
    var_name = None
    if isinstance(date, datetime.datetime):
      args = {'value':
              math.floor(serializer.DatetimeToMicroseconds(date) / 1000)}
    elif types.isNumber(date):
      args = {'value': date}
    elif isinstance(date, str):
      args = {'value': date}
      if tz:
        if isinstance(tz, (str, computedobject.ComputedObject)):
          args['timeZone'] = tz
        else:
          raise ValueError(
              f'Invalid argument specified for ee.Date(..., opt_tz): {tz}'
          )
    elif isinstance(date, computedobject.ComputedObject):
      if self.is_func_returning_same(date):
        # If it's a call that's already returning a Date, just cast.
        func = date.func
        args = date.args
        var_name = date.varName
      else:
        args = {'value': date}
        if tz:
          if isinstance(tz, (str, computedobject.ComputedObject)):
            args['timeZone'] = tz
          else:
            raise ValueError(
                f'Invalid argument specified for ee.Date(..., opt_tz): {tz}'
            )
    else:
      raise ValueError(f'Invalid argument specified for ee.Date(): {date}')

    super().__init__(func, args, var_name)

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
    return 'Date'

  def advance(
      self,
      delta: _arg_types.Number,
      unit: _arg_types.String,
      # pylint: disable-next=invalid-name
      timeZone: Optional[_arg_types.String] = None,
  ) -> 'Date':
    """Create a new Date by adding the specified units to the given Date.

    Args:
      delta: The amount to move in the unit. Negative values go back in time.
      unit: One of 'year', 'month', 'week', 'day', 'hour', 'minute', or
        'second'.
      timeZone: The time zone (e.g., 'America/Los_Angeles'); defaults to UTC.

    Returns:
      An ee.Date.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.advance', self, delta, unit, timeZone
    )

  def difference(
      self, start: _DateType, unit: _arg_types.String
  ) -> ee_number.Number:
    """Returns the difference between two Dates in the specified units.

    Args:
      start: The date to compare to.
      unit: One of 'year', 'month', 'week', 'day', 'hour', 'minute', or
        'second'.

    Returns:
      Returns an ee.Number based on the average length of the unit.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.difference', self, start, unit
    )

  def format(
      self,
      # pylint: disable-next=redefined-builtin
      format: Optional[_arg_types.String] = None,
      # pylint: disable-next=invalid-name
      timeZone: Optional[_arg_types.String] = None,
  ) -> ee_string.String:
    """Convert a date to string.

    The format string is described here:

    http://joda-time.sourceforge.net/apidocs/org/joda/time/format/DateTimeFormat.html

    Args:
      format: A Joda Time pattern. If omitted, it uses the ISO default date.
      timeZone: The time zone (e.g., 'America/Los_Angeles'); defaults to UTC.

    Returns:
      An ee.String.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.format', self, format, timeZone
    )

  @staticmethod
  def fromYMD(
      year: _arg_types.Integer,
      month: _arg_types.Integer,
      day: _arg_types.Integer,
      # pylint: disable=invalid-name
      timeZone: Optional[_arg_types.String] = None,
  ) -> 'Date':
    """Returns a Date given year, month, day.

    Args:
      year: The year, 2013, for example.
      month: The month, 3, for example.
      day: The day, 15, for example.
      timeZone: The time zone (e.g., 'America/Los_Angeles'); defaults to UTC.
    """

    return apifunction.ApiFunction.call_(
        'Date.fromYMD', year, month, day, timeZone
    )

  def get(
      self,
      unit: _arg_types.String,
      # pylint: disable-next=invalid-name
      timeZone: Optional[_arg_types.String] = None,
  ) -> ee_number.Number:
    """Returns the specified unit of this date.

    Args:
      unit: One of 'year', 'month' (returns 1-12), 'week' (1-53), 'day' (1-31),
        'hour' (0-23), 'minute' (0-59), or 'second' (0-59).
      timeZone: The time zone (e.g., 'America/Los_Angeles'); defaults to UTC.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.get', self, unit, timeZone
    )

  def getFraction(
      self,
      unit: _arg_types.String,
      # pylint: disable-next=invalid-name
      timeZone: Optional[_arg_types.String] = None,
  ) -> ee_number.Number:
    """Returns this date's elapsed fraction of the specified unit.

    Args:
      unit: One of 'year', 'month', 'week', 'day', 'hour', 'minute', or
        'second'.
      timeZone: The time zone (e.g., 'America/Los_Angeles'); defaults to UTC.

    Returns:
      An ee.Number between 0 and 1.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.getFraction', self, unit, timeZone
    )

  def getRange(
      self,
      unit: _arg_types.String,
      # pylint: disable-next=invalid-name
      timeZone: Optional[_arg_types.String] = None,
  ) -> daterange.DateRange:
    """Returns a DateRange covering the unit that contains this date.

    For example,

      Date('2013-3-15').getRange('year')

    returns

      DateRange('2013-1-1', '2014-1-1').

    Args:
      unit: One of 'year', 'month', 'week', 'day', 'hour', 'minute', or
        'second'.
      timeZone: The time zone (e.g., 'America/Los_Angeles'); defaults to UTC.

    Returns:
      An ee.DateRange.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.getRange', self, unit, timeZone
    )

  def getRelative(
      self,
      unit: _arg_types.String,
      inUnit: _arg_types.String,  # pylint: disable=invalid-name
      # pylint: disable-next=invalid-name
      timeZone: Optional[_arg_types.String] = None,
  ) -> ee_number.Number:
    """Returns the specified unit of this date relative to a larger unit.

    For example, getRelative('day', 'year') returns a value between 0 and 365.

    Args:
      unit: One of 'month', 'week', 'day', 'hour', 'minute', or 'second'.
      inUnit: One of 'year', 'month', 'week', 'day', 'hour', or 'minute'.
      timeZone: The time zone (e.g., 'America/Los_Angeles'); defaults to UTC.

    Returns:
      A 0-based ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.getRelative', self, unit, inUnit, timeZone
    )

  def millis(self) -> ee_number.Number:
    """The number of milliseconds since 1970-01-01T00:00:00Z."""

    return apifunction.ApiFunction.call_(self.name() + '.millis', self)

  @staticmethod
  def parse(
      format: _arg_types.String,  # pylint: disable=redefined-builtin
      date: _arg_types.String,
      # pylint: disable-next=invalid-name
      timeZone: Optional[_arg_types.String] = None,
  ) -> 'Date':
    """Parse a date string, given a string describing its format.

    Args:
      format: A pattern, as described at
        https://joda-time.sourceforge.net/apidocs/org/joda/time/format/DateTimeFormat.html.
      date: A string matching the given pattern.
      timeZone: The time zone (e.g., 'America/Los_Angeles'); defaults to UTC.

    Returns:
      An ee.Date.
    """

    return apifunction.ApiFunction.call_('Date.parse', format, date, timeZone)

  @classmethod
  def unitRatio(
      cls, numerator: _arg_types.String, denominator: _arg_types.String
  ) -> ee_number.Number:
    """Returns the ratio of the length of one unit to the length of another.

    For example, unitRatio('day', 'minute') returns 1440.

    Valid units are 'year', 'month', 'week', 'day', 'hour', 'minute', and
    'second'.

    Args:
      numerator: Unit to be divided by the denominator.
      denominator: Unit to divide into the numerator.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(
        cls.name() + '.unitRatio', numerator, denominator
    )

  def update(
      self,
      year: Optional[_arg_types.Integer] = None,
      month: Optional[_arg_types.Integer] = None,
      day: Optional[_arg_types.Integer] = None,
      hour: Optional[_arg_types.Integer] = None,
      minute: Optional[_arg_types.Integer] = None,
      second: Optional[_arg_types.Number] = None,
      # pylint: disable-next=invalid-name
      timeZone: Optional[_arg_types.String] = None,
  ) -> 'Date':
    """Create a new Date by setting one or more of the units of the given Date.

    If a timeZone is given the new value(s) is interpreted in that zone. Skip or
    set to None any argument to keep the same as the input Date.

    Args:
      year: Set the year.
      month: Set the month.
      day: Set the day.
      hour: Set the hour.
      minute: Set the minute.
      second: Set the second.
      timeZone: The time zone (e.g., 'America/Los_Angeles'); defaults to UTC.

    Returns:
      An ee.Date.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.update',
        self,
        year,
        month,
        day,
        hour,
        minute,
        second,
        timeZone,
    )
