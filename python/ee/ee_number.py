"""A wrapper for numbers."""



import numbers

import apifunction
import computedobject
import ee_exception

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name


class Number(computedobject.ComputedObject):
  """An object to represent numbers."""

  _initialized = False

  def __init__(self, number):
    """Construct a number wrapper.

    This constuctor accepts the following args:
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
      super(Number, self).__init__(number.func, number.args)
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
