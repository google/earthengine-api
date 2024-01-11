"""A wrapper for numbers."""

from typing import Any, Optional, Union

from ee import _cloud_api_utils
from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import ee_exception


class Number(computedobject.ComputedObject):
  """An object to represent numbers."""

  _number: Optional[Union[float, computedobject.ComputedObject]]

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(
      self, number: Union[float, computedobject.ComputedObject]
  ):
    """Construct a number wrapper.

    This constructor accepts the following args:
      1) A bare number.
      2) A ComputedObject returning a number.

    Args:
      number: The number to wrap.
    """
    self.initialize()

    if isinstance(number, (float, int)):
      super().__init__(None, None)
      self._number = number
    elif isinstance(number, computedobject.ComputedObject):
      super().__init__(number.func, number.args, number.varName)
      self._number = None
    else:
      raise ee_exception.EEException(
          'Invalid argument specified for ee.Number(): %s' % number)

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
    return 'Number'

  @_utils.accept_opt_prefix('opt_encoder')
  def encode(self, encoder: Any = None) -> Any:
    if isinstance(self._number, (float, int)):
      return self._number
    else:
      return super().encode(encoder)

  @_utils.accept_opt_prefix('opt_encoder')
  def encode_cloud_value(self, encoder: Any = None) -> Any:
    if isinstance(self._number, (float, int)):
      return _cloud_api_utils.encode_number_as_cloud_value(self._number)
    else:
      return super().encode_cloud_value(encoder)
