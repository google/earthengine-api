"""A wrapper for numbers."""
from __future__ import annotations

from typing import Any, Optional, Union

from ee import _cloud_api_utils
from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import ee_exception
from ee import ee_string

_IntegerType = Union[int, 'Number', computedobject.ComputedObject]
_NumberType = Union[float, 'Number', computedobject.ComputedObject]
_StringType = Union[str, 'ee_string.String', computedobject.ComputedObject]


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

  def first(self, right: _NumberType) -> 'Number':
    """Selects the value of the first value.

    Args:
      right: This value is never returned.

    Returns:
      Return an ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.first', self, right)

  def firstNonZero(self, right: _NumberType) -> 'Number':
    """Returns the first value if it is non-zero, otherwise the second value.

    Args:
      right: The second value.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.firstNonZero', self, right
    )

  def float(self) -> 'Number':
    """Casts the input value to a 32-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.float', self)

  def floor(self) -> 'Number':
    """Computes the largest integer less than or equal to the input."""

    return apifunction.ApiFunction.call_(self.name() + '.floor', self)

  def format(self, pattern: Optional[_StringType] = None) -> ee_string.String:
    r"""Convert a number to a string using printf-style formatting.

    For more about format strings, see

      https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/Formatter.html

    Args:
      pattern: A printf-style format string. For example, '%.2f' produces
        numbers formatted like '3.14', and '%05d' produces numbers formatted
        like '00042'. The format string must satisfy the following criteria:  1.
        Zero or more prefix characters. 2. Exactly one '%'. 3. Zero or more
        modifier characters in the set [#-+ 0,(.\d]. 4. Exactly one conversion
        character in the set [sdoxXeEfgGaA]. 5. Zero or more suffix characters

    Returns:
      An ee.String with the number formatted based on the pattern.
    """

    return apifunction.ApiFunction.call_(self.name() + '.format', self, pattern)

  def gamma(self) -> 'Number':
    """Computes the gamma function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.gamma', self)

  def gammainc(self, right: _NumberType) -> 'Number':
    """Calculates the regularized lower incomplete Gamma function γ(x,a).

    Args:
      right: The right-hand value.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.gammainc', self, right)

  def gt(self, right: _NumberType) -> 'Number':
    """Returns 1 if and only if the first value is greater than the second.

    Args:
      right: The right-hand value.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.gt', self, right)

  def gte(self, right: _NumberType) -> 'Number':
    """Returns 1 if the first value is greater than or equal to the second.

    Args:
      right: The right-hand value.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.gte', self, right)

  def hypot(self, right: _NumberType) -> 'Number':
    """Calculates the magnitude of the 2D vector [x, y].

    Args:
      right: The y value.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.hypot', self, right)

  def int(self) -> 'Number':
    """Casts the input value to a signed 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int', self)

  def int16(self) -> 'Number':
    """Casts the input value to a signed 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int16', self)

  def int32(self) -> 'Number':
    """Casts the input value to a signed 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int32', self)

  def int64(self) -> 'Number':
    """Casts the input value to a signed 64-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int64', self)

  def int8(self) -> 'Number':
    """Casts the input value to a signed 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int8', self)

  def lanczos(self) -> 'Number':
    """Computes the Lanczos approximation of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.lanczos', self)

  def leftShift(self, right: _NumberType) -> 'Number':
    """Calculates the left shift of v1 by v2 bits.

    Args:
      right: How many bits to shift.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.leftShift', self, right
    )

  def log(self) -> 'Number':
    """Computes the natural logarithm of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.log', self)

  def log10(self) -> 'Number':
    """Computes the base-10 logarithm of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.log10', self)

  def long(self) -> 'Number':
    """Casts the input value to a signed 64-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.long', self)

  def lt(self, right: _NumberType) -> 'Number':
    """Returns 1 if and only if the first value is less than the second.

    Args:
      right: The value to compare to.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.lt', self, right)

  def lte(self, right: _NumberType) -> 'Number':
    """Returns 1 if the first value is less than or equal to the second.

    Args:
      right: The value to compare to.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.lte', self, right)

  def max(self, right: _NumberType) -> 'Number':
    """Selects the maximum of the first and second values.

    Args:
      right: The value to compare to.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.max', self, right)

  def min(self, right: _NumberType) -> 'Number':
    """Selects the minimum of the first and second values.

    Args:
      right: The value to compare to.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.min', self, right)

  def mod(self, right: _NumberType) -> 'Number':
    """Calculates the remainder of the first value divided by the second.

    Args:
      right: The value to divide by.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.mod', self, right)

  def multiply(self, right: _NumberType) -> 'Number':
    """Multiplies the first value by the second.

    Args:
      right: The value to multiply by.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.multiply', self, right)

  def neq(self, right: _NumberType) -> 'Number':
    """Returns 1 if and only if the first value is not equal to the second.

    Args:
      right: The value to compare to.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.neq', self, right)

  def Not(self) -> 'Number':
    """Returns 0 if the input is non-zero, and 1 otherwise."""

    return apifunction.ApiFunction.call_(self.name() + '.not', self)

  def Or(self, right: _NumberType) -> 'Number':
    """Returns 1 if and only if either input value is non-zero.

    Args:
      right: The value to or with.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.or', self, right)

  # TODO: Add classmethod parse

  def pow(self, right: _NumberType) -> 'Number':
    """Raises the first value to the power of the second.

    Args:
      right: The exponent to raise the value to.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.pow', self, right)

  def rightShift(self, right: _NumberType) -> 'Number':
    """Calculates the signed right shift of v1 by v2 bits.

    Args:
      right: How many bits to shift.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.rightShift', self, right
    )

  def round(self) -> 'Number':
    """Computes the integer nearest to the input."""

    return apifunction.ApiFunction.call_(self.name() + '.round', self)

  def short(self) -> 'Number':
    """Casts the input value to a signed 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.short', self)

  def signum(self) -> 'Number':
    """Computes the signum function (sign) of the input.

    Zero if the input is zero, 1 if the input is greater than zero, -1 if the
    input is less than zero.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.signum', self)

  def sin(self) -> 'Number':
    """Computes the sine of the input in radians."""

    return apifunction.ApiFunction.call_(self.name() + '.sin', self)

  def sinh(self) -> 'Number':
    """Computes the hyperbolic sine of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.sinh', self)

  def sqrt(self) -> 'Number':
    """Computes the square root of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.sqrt', self)

  def subtract(self, right: _NumberType) -> 'Number':
    """Subtracts the second value from the first.

    Args:
      right: The value to subtract.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.subtract', self, right)

  def tan(self) -> 'Number':
    """Computes the tangent of the input in radians."""

    return apifunction.ApiFunction.call_(self.name() + '.tan', self)

  def tanh(self) -> 'Number':
    """Computes the hyperbolic tangent of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.tanh', self)

  def toByte(self) -> 'Number':
    """Casts the input value to an unsigned 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toByte', self)

  def toDouble(self) -> 'Number':
    """Casts the input value to a 64-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.toDouble', self)

  def toFloat(self) -> 'Number':
    """Casts the input value to a 32-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.toFloat', self)

  def toInt(self) -> 'Number':
    """Casts the input value to a signed 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt', self)

  def toInt16(self) -> 'Number':
    """Casts the input value to a signed 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt16', self)

  def toInt32(self) -> 'Number':
    """Casts the input value to a signed 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt32', self)

  def toInt64(self) -> 'Number':
    """Casts the input value to a signed 64-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt64', self)

  def toInt8(self) -> 'Number':
    """Casts the input value to a signed 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt8', self)

  def toLong(self) -> 'Number':
    """Casts the input value to a signed 64-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toLong', self)

  def toShort(self) -> 'Number':
    """Casts the input value to a signed 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toShort', self)

  def toUint16(self) -> 'Number':
    """Casts the input value to an unsigned 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toUint16', self)

  def toUint32(self) -> 'Number':
    """Casts the input value to an unsigned 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toUint32', self)

  def toUint8(self) -> 'Number':
    """Casts the input value to an unsigned 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toUint8', self)

  def trigamma(self) -> 'Number':
    """Computes the trigamma function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.trigamma', self)

  def uint16(self) -> 'Number':
    """Casts the input value to an unsigned 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.uint16', self)

  def uint32(self) -> 'Number':
    """Casts the input value to an unsigned 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.uint32', self)

  def uint8(self) -> 'Number':
    """Casts the input value to an unsigned 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.uint8', self)

  # pylint: disable=redefined-builtin
  # pytype: disable=invalid-annotation
  def unitScale(
      self,
      min: Union[int, float, computedobject.ComputedObject],
      max: Union[int, float, computedobject.ComputedObject],
  ) -> 'Number':
    """Scales the input so that [min, max] becomes [0, 1].

    Values outside the range are NOT clamped.  If min == max, 0 is returned.

    Args:
      min: Minimum value of the input to be scaled to 0.
      max: Maximum value of the input to be scaled to 1.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.unitScale', self, min, max
    )
  # pytype: enable=invalid-annotation
  # pylint: enable=redefined-builtin
