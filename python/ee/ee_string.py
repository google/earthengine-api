#!/usr/bin/env python3
"""A wrapper for strings."""

from typing import Any, Union

from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import ee_exception


class String(computedobject.ComputedObject):
  """An object to represent strings."""

  _string: Union[str, computedobject.ComputedObject]

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(
      self, string: Union[str, computedobject.ComputedObject]
  ):
    """Construct a string wrapper.

    This constructor accepts the following args:
      1) A bare string.
      2) A ComputedObject returning a string.

    Args:
      string: The string to wrap.
    """
    self.initialize()

    if isinstance(string, str):
      super().__init__(None, None)
    elif isinstance(string, computedobject.ComputedObject):
      if string.func and string.func.getSignature()['returns'] == self.name():
        # If it's a call that's already returning a String, just cast.
        super().__init__(string.func, string.args, string.varName)
      else:
        super().__init__(
            apifunction.ApiFunction(self.name()), {'input': string}
        )
    else:
      raise ee_exception.EEException(
          'Invalid argument specified for ee.String(): %s' % string)
    self._string = string

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
    return 'String'

  @_utils.accept_opt_prefix('opt_encoder')
  def encode(self, encoder: Any = None) -> Any:
    if isinstance(self._string, str):
      return self._string
    else:
      return self._string.encode(encoder)

  @_utils.accept_opt_prefix('opt_encoder')
  def encode_cloud_value(self, encoder: Any = None) -> Any:
    if isinstance(self._string, str):
      return {'constantValue': self._string}
    else:
      return self._string.encode_cloud_value(encoder)
