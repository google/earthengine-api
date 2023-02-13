#!/usr/bin/env python
"""A wrapper for strings."""



# pylint: disable=g-bad-import-order

from . import apifunction
from . import computedobject
from . import ee_exception

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name


class String(computedobject.ComputedObject):
  """An object to represent strings."""

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(self, string):
    """Construct a string wrapper.

    This constructor accepts the following args:
      1) A bare string.
      2) A ComputedObject returning a string.

    Args:
      string: The string to wrap.
    """
    self.initialize()

    if isinstance(string, str):
      super(String, self).__init__(None, None)
    elif isinstance(string, computedobject.ComputedObject):
      if string.func and string.func.getSignature()['returns'] == 'String':
        # If it's a call that's already returning a String, just cast.
        super(String, self).__init__(string.func, string.args, string.varName)
      else:
        super(String, self).__init__(apifunction.ApiFunction('String'), {
            'input': string
        })
    else:
      raise ee_exception.EEException(
          'Invalid argument specified for ee.String(): %s' % string)
    self._string = string

  @classmethod
  def initialize(cls):
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, 'String', 'String')
      cls._initialized = True

  @classmethod
  def reset(cls):
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  @staticmethod
  def name():
    return 'String'

  def encode(self, opt_encoder=None):
    if isinstance(self._string, str):
      return self._string
    else:
      return self._string.encode(opt_encoder)

  def encode_cloud_value(self, opt_encoder=None):
    if isinstance(self._string, str):
      return {'constantValue': self._string}
    else:
      return self._string.encode_cloud_value(opt_encoder)
