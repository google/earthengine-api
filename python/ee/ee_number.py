"""A wrapper for numbers."""
from __future__ import annotations

from typing import Any, Optional, Union

from ee import _cloud_api_utils
from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import ee_exception

_NumberType = Union[float, 'Number', computedobject.ComputedObject]


class Number(computedobject.ComputedObject):
  """An object to represent numbers."""

  _number: Optional[float]

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(self, number: _NumberType):
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

  def abs(self) -> 'Number':
    """Computes the absolute value of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.abs', self)

  def acos(self) -> 'Number':
    """Computes the arccosine in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.acos', self)

  def add(self, right: _NumberType) -> 'Number':
    """Adds the right value.

    Args:
      right: The value to add to the current ee.Number.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.add', self, right)

  # `and` is not allowed by the Python parser.
  def And(self, right: _NumberType) -> 'Number':
    """Returns 1 if and only if both values are non-zero.

    Args:
      right: The value to and with the current ee.Number.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.and', self, right)

  def asin(self) -> 'Number':
    """Computes the arcsine in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.asin', self)

  def atan(self) -> 'Number':
    """Computes the arctangent in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.atan', self)

  def atan2(self, right: _NumberType) -> 'Number':
    """Calculates the angle in radians formed by the 2D vector [x, y].

    Args:
      right: The second value of the atan2 call.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.atan2', self, right)

  def bitCount(self) -> 'Number':
    """Returns the number of one-bits in the Number.

    Calculates the number of one-bits in the 64-bit two's complement binary
    representation of the input.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.bitCount', self)

  def bitwiseAnd(self, right: _NumberType) -> 'Number':
    """Calculates the bitwise AND of the input values.

    Args:
      right: The value to do the bitwise AND with.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bitwiseAnd', self, right
    )

  def bitwiseNot(self) -> 'Number':
    """Returns the bitwise NOT of the input.

    Uses the smallest signed integer type that can hold the input.
    """

    return apifunction.ApiFunction.call_(self.name() + '.bitwiseNot', self)

  def bitwiseOr(self, right: _NumberType) -> 'Number':
    """Calculates the bitwise OR of the input values.

    Args:
      right: The value to OR with.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bitwiseOr', self, right
    )

  def bitwiseXor(self, right: _NumberType) -> 'Number':
    """Calculates the bitwise XOR of the input values.

    Args:
      right: The right-hand value.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bitwiseXor', self, right
    )

  def byte(self) -> 'Number':
    """Casts the input value to an unsigned 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.byte', self)

  def cbrt(self) -> 'Number':
    """Computes the cubic root of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.cbrt', self)

  def ceil(self) -> 'Number':
    """Computes the smallest integer greater than or equal to the input."""

    return apifunction.ApiFunction.call_(self.name() + '.ceil', self)

  # TODO: Add clamp method with `min` and `max` args.

  def cos(self) -> 'Number':
    """Computes the cosine of the input in radians."""

    return apifunction.ApiFunction.call_(self.name() + '.cos', self)

  def cosh(self) -> 'Number':
    """Computes the hyperbolic cosine of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.cosh', self)

  def digamma(self) -> 'Number':
    """Computes the digamma function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.digamma', self)

  def divide(self, right: _NumberType) -> 'Number':
    """Divides the first value by the second, returning 0 for division by 0.

    Args:
      right: The value to divide by.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.divide', self, right)

  def double(self) -> 'Number':
    """Casts the input value to a 64-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.double', self)

  def eq(self, right: _NumberType) -> 'Number':
    """Returns 1 if and only if the first value is equal to the second.

    Args:
      right: The value to compare to.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.eq', self, right)

  def erf(self) -> 'Number':
    """Computes the error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erf', self)

  def erfInv(self) -> 'Number':
    """Computes the inverse error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erfInv', self)

  def erfc(self) -> 'Number':
    """Computes the complementary error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erfc', self)

  def erfcInv(self) -> 'Number':
    """Computes the inverse complementary error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erfcInv', self)

  def exp(self) -> 'Number':
    """Computes the Euler's number e raised to the power of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.exp', self)

  # TODO: Add expression staticmethod
