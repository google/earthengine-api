#!/usr/bin/env python
"""A wrapper for dates."""



# pylint: disable=g-bad-import-order
import datetime
import math
import six

from . import apifunction
from . import computedobject
from . import ee_exception
from . import ee_types as types
from . import serializer

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name


class Date(computedobject.ComputedObject):
  """An object to represent dates."""

  _initialized = False

  def __init__(self, date, opt_tz=None):
    """Construct a date.

    This sends all inputs (except another Date) through the Date function.

    This constructor accepts the following args:
      1) A bare date.
      2) An ISO string
      3) An integer number of milliseconds since the epoch.
      4) A ComputedObject.

    Args:
      date: The date to wrap.
      opt_tz: An optional timezone, only usable with a string date.
    """
    self.initialize()

    func = apifunction.ApiFunction('Date')
    args = None
    varName = None
    if isinstance(date, datetime.datetime):
      args = {'value':
              math.floor(serializer.DatetimeToMicroseconds(date) / 1000)}
    elif types.isNumber(date):
      args = {'value': date}
    elif isinstance(date, six.string_types):
      args = {'value': date}
      if opt_tz:
        if isinstance(opt_tz, six.string_types):
          args['timeZone'] = opt_tz
        else:
          raise ee_exception.EEException(
              'Invalid argument specified for ee.Date(..., opt_tz): %s' % date)
    elif isinstance(date, computedobject.ComputedObject):
      if date.func and date.func.getSignature()['returns'] == 'Date':
        # If it's a call that's already returning a Date, just cast.
        func = date.func
        args = date.args
        varName = date.varName
      else:
        args = {'value': date}
    else:
      raise ee_exception.EEException(
          'Invalid argument specified for ee.Date(): %s' % date)

    super(Date, self).__init__(func, args, varName)

  @classmethod
  def initialize(cls):
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, 'Date', 'Date')
      cls._initialized = True

  @classmethod
  def reset(cls):
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  @staticmethod
  def name():
    return 'Date'
