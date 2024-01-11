"""A wrapper for dates."""

import datetime
import math
from typing import Any, Dict, Optional, Union

from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import ee_types as types
from ee import serializer


class Date(computedobject.ComputedObject):
  """An object to represent dates."""

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  @_utils.accept_opt_prefix('opt_tz')
  def __init__(
      self,
      date: Union[datetime.datetime, float, str, computedobject.ComputedObject],
      tz: Optional[str] = None,
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
    args: Dict[str, Any]
    var_name = None
    if isinstance(date, datetime.datetime):
      args = {'value':
              math.floor(serializer.DatetimeToMicroseconds(date) / 1000)}
    elif types.isNumber(date):
      args = {'value': date}
    elif isinstance(date, str):
      args = {'value': date}
      if tz:
        if isinstance(tz, str):
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
