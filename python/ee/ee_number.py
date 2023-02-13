#!/usr/bin/env python
"""A wrapper for numbers."""



import numbers

from . import _cloud_api_utils
from . import apifunction
from . import computedobject
from . import ee_exception

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name


class Number(computedobject.ComputedObject):
  """An object to represent numbers."""

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(self, number):
    """Construct a number wrapper.

    This constructor accepts the following args:
      1) A bare number.
      2) A ComputedObject returning a number.

    Args:
      number: The number to wrap.
    """
    self.initialize()

    if isinstance(number, numbers.Number):
      super(Number, self).__init__(None, None)
      self._number = number
    elif isinstance(number, computedobject.ComputedObject):
      super(Number, self).__init__(number.func, number.args, number.varName)
      self._number = None
    else:
      raise ee_exception.EEException(
          'Invalid argument specified for ee.Number(): %s' % number)

  @classmethod
  def initialize(cls):
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, 'Number', 'Number')
      cls._initialized = True

  @classmethod
  def reset(cls):
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  @staticmethod
  def name():
    return 'Number'

  def encode(self, opt_encoder=None):
    if isinstance(self._number, numbers.Number):
      return self._number
    else:
      return super(Number, self).encode(opt_encoder)

  def encode_cloud_value(self, opt_encoder=None):
    if isinstance(self._number, numbers.Number):
      return _cloud_api_utils.encode_number_as_cloud_value(self._number)
    else:
      return super(Number, self).encode_cloud_value(opt_encoder)
