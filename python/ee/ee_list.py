#!/usr/bin/env python3
"""A wrapper for lists."""

# List clashes with the class List, so call it ListType
from typing import Any, List as ListType, Optional, Tuple, Union

from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import ee_exception


class List(computedobject.ComputedObject):
  """An object to represent lists."""
  _list: Optional[
      Union[ListType[Any], Tuple[Any, Any], computedobject.ComputedObject]
  ]

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(
      self,
      arg: Optional[
          Union[ListType[Any], Tuple[Any, Any], computedobject.ComputedObject]
      ],
  ):
    """Construct a list wrapper.

    This constructor accepts the following args:
      1) A bare list.
      2) A ComputedObject returning a list.

    Args:
      arg: The list to wrap.

    Raises:
      ee_exception.EEException: On bad input.
    """
    self.initialize()

    if isinstance(arg, (list, tuple)):
      super().__init__(None, None)
      self._list = arg
    elif isinstance(arg, computedobject.ComputedObject):
      super().__init__(arg.func, arg.args, arg.varName)
      self._list = None
    else:
      raise ee_exception.EEException(
          'Invalid argument specified for ee.List(): %s' % arg)

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
    return 'List'

  @_utils.accept_opt_prefix('opt_encoder')
  def encode(self, encoder: Optional[Any] = None) -> Any:
    if isinstance(self._list, (list, tuple)):
      assert self._list is not None
      return [encoder(elem) for elem in self._list]
    else:
      return super().encode(encoder)

  @_utils.accept_opt_prefix('opt_encoder')
  def encode_cloud_value(self, encoder: Optional[Any] = None) -> Any:
    if isinstance(self._list, (list, tuple)):
      return {'valueReference': encoder(self._list)}
    else:
      return super().encode_cloud_value(encoder)
