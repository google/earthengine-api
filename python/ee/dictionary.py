#!/usr/bin/env python3
"""A wrapper for dictionaries."""


from typing import Any, Dict, Optional, Sequence, Union

from ee import _utils
from ee import apifunction
from ee import computedobject


class Dictionary(computedobject.ComputedObject):
  """An object to represent dictionaries."""

  _dictionary: Optional[Dict[Any, Any]]

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(
      self,
      arg: Optional[
          Union[Dict[Any, Any], Sequence[Any], computedobject.ComputedObject]
      ] = None,
  ):
    """Construct a dictionary.

    Args:
      arg: This constructor accepts the following args:
        1) Another dictionary.
        2) A list of key/value pairs.
        3) A null or no argument (producing an empty dictionary)
    """
    self.initialize()

    if isinstance(arg, dict):
      super().__init__(None, None)
      self._dictionary = arg
    else:
      self._dictionary = None
      if (isinstance(arg, computedobject.ComputedObject)
          and arg.func
          and arg.func.getSignature()['returns'] == self.name()):
        # If it's a call that's already returning a Dictionary, just cast.
        super().__init__(arg.func, arg.args, arg.varName)
      else:
        # Delegate everything else to the server-side constructor.
        super().__init__(apifunction.ApiFunction(self.name()), {'input': arg})

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
    return 'Dictionary'

  @_utils.accept_opt_prefix('opt_encoder')
  def encode(self, encoder=None):
    if self._dictionary is not None:
      return encoder(self._dictionary)
    else:
      return super().encode(encoder)

  @_utils.accept_opt_prefix('opt_encoder')
  def encode_cloud_value(self, encoder=None):
    if self._dictionary is not None:
      return {'valueReference': encoder(self._dictionary)}
    else:
      return super().encode_cloud_value(encoder)
