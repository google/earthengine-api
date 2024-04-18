"""A wrapper for Arrays."""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple, Union

from ee import apifunction
from ee import computedobject
# pylint: disable-next=unused-import
from ee import ee_list
from ee import ee_number
# pylint: disable-next=unused-import
from ee import ee_string

_ArrayType = Union[
    Any, List[Any], 'Array', 'ee_list.List', computedobject.ComputedObject
]
_EeAnyType = Union[Any, computedobject.ComputedObject]
_IntegerType = Union[int, ee_number.Number, computedobject.ComputedObject]
_EeListType = Union[List[Any], Tuple[Any, Any], computedobject.ComputedObject]
_StringType = Union[str, 'ee_string.String', computedobject.ComputedObject]


class Array(computedobject.ComputedObject):
  """An object to represent an Earth Engine Array.

  Examples:
    # Requires an explicit PixelType if no data.
    ee.Array([], ee.PixelType.int8()); value: []
    ee.Array([[]], ee.PixelType.uint8()); value: [[]]
    ee.Array([[], []], ee.PixelType.float()); value: [[], []]
    # 1-D Arrays
    ee.Array([0]); value: [0]
    ee.Array([0, 1]); value: [0, 1]
    # 2-D Arrays
    ee.Array([[1]]); value: [[1]]
    ee.Array([[0, 1], [2, 3]]); value: [[0,1],[2,3]]
    # Arrays from ee.Number.
    ee.Array([ee.Number(123).toUint8()]); value: [123]
    # Lists are useful ways to construct larger Arrays.
    ee.Array(ee.List.sequence(0, 10, 2)); value: [0, 2, 4, 6, 8, 10]
  """

  _initialized: bool = False

  def __init__(
      self,
      values: Optional[_ArrayType],
      # pylint: disable-next=invalid-name
      pixelType: Optional[_StringType] = None,
  ):
    """Creates an Array wrapper.

    Returns an Array with the given coordinates.

    Args:
      values: An existing array to cast, or a number/list of numbers/nested list
        of numbers of any depth to create an array from. For nested lists, all
        inner arrays at the same depth must have the same length, and numbers
        may only be present at the deepest level.
      pixelType: The type of each number in the values argument. If the pixel
        type is not provided, it will be inferred from the numbers in 'values'.
        If there aren't any numbers in 'values', this type must be provided.
    """
    self.initialize()

    if isinstance(values, computedobject.ComputedObject) and pixelType is None:
      if self.is_func_returning_same(values):
        # If it is a call that is already returning an Array, just cast.
        super().__init__(values.func, values.args, values.varName)
        return

    args: Dict[str, Any] = {'values': values}
    if pixelType is not None:
      args['pixelType'] = pixelType

    func = apifunction.ApiFunction(self.name())
    super().__init__(func, func.promoteArgs(args))

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
    return 'Array'

  def abs(self) -> 'Array':
    """On an element-wise basis, computes the absolute value of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.abs', self)

  # TODO: Use _ReducerType for reducer.
  def accum(
      self, axis: _IntegerType, reducer: Optional[_EeAnyType] = None
  ) -> 'Array':
    """Accumulates elements of an array along the given axis.

    Sets each element of the result to the reduction of elements along that axis
    up to and including the current position.

    May be used to make a cumulative sum, a monotonically increasing sequence,
    etc.

    Args:
      axis: Axis along which to perform the accumulation.
      reducer: Reducer to accumulate values. Default is SUM, to produce the
        cumulative sum of each vector along the given axis.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.accum', self, axis, reducer
    )

  def acos(self) -> 'Array':
    """Computes the arccosine in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.acos', self)

  def add(self, right: _ArrayType) -> 'Array':
    """On an element-wise basis, adds the first value to the second.

    Args:
      right: The values to add.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.add', self, right)

  def And(self, right: _ArrayType) -> 'Array':
    """Returns 1 if and only if both values are non-zero.

    Args:
      right: The values to add.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.and', self, right)

  def argmax(self) -> ee_list.List:
    """Returns the position of the maximum value in an array.

    If there are multiple occurrences of the maximum, returns the position of
    the first.

    Returns:
      An ee.List that is empty if the input in an empty ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.argmax', self)

  def asin(self) -> 'Array':
    """Computes the arcsine in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.asin', self)

  def atan(self) -> 'Array':
    """Computes the arctangent in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.atan', self)

  def atan2(self, right: _ArrayType) -> 'Array':
    """Calculates the angle formed by the 2D vector [x, y].

    Args:
      right: The y values.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.atan2', self, right)

  def bitCount(self) -> 'Array':
    """Calculates the number of one-bits.

    Uses a 64-bit two's complement binary representation of the input.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.bitCount', self)

  # TODO: Add bitsToArray classmethod.

  def bitwiseAnd(self, right: _ArrayType) -> 'Array':
    """On an element-wise basis, calculates the bitwise AND of the input values.

    Args:
      right: The values to AND with.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bitwiseAnd', self, right
    )

  def bitwiseNot(self) -> 'Array':
    """On an element-wise basis, calculates the bitwise NOT of the input.

    In the smallest signed integer type that can hold the input.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.bitwiseNot', self)

  def bitwiseOr(self, right: _ArrayType) -> 'Array':
    """On an element-wise basis, calculates the bitwise OR of the input values.

    Args:
      right: The values to OR with.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bitwiseOr', self, right
    )

  def bitwiseXor(self, right: _ArrayType) -> 'Array':
    """On an element-wise basis, calculates the bitwise XOR of the input values.

    Args:
      right: The values to XOR with.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bitwiseXor', self, right
    )

  def byte(self) -> 'Array':
    """Casts the input value to an unsigned 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.byte', self)

  # TODO: Add cat classmethod.

  def cbrt(self) -> 'Array':
    """On an element-wise basis, computes the cubic root of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.cbrt', self)

  def ceil(self) -> 'Array':
    """Computes the smallest integer greater than or equal to the input."""

    return apifunction.ApiFunction.call_(self.name() + '.ceil', self)

  def cos(self) -> 'Array':
    """On an element-wise basis, computes the cosine of the input in radians."""

    return apifunction.ApiFunction.call_(self.name() + '.cos', self)

  def cosh(self) -> 'Array':
    """On an element-wise basis, computes the hyperbolic cosine of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.cosh', self)

  def cut(self, position: _EeListType) -> 'Array':
    """Cut an array along one or more axes.

    Args:
      position: Cut an array along one or more axes.  The positions args
        specifies either a single value for each axis of the array, or -1,
        indicating the whole axis. The output will be an array that has the same
        dimensions as the input, with a length of 1 on each axis that was not -1
        in the positions array.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.cut', self, position)

  def digamma(self) -> 'Array':
    """On an element-wise basis, computes the digamma function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.digamma', self)

  def divide(self, right: _ArrayType) -> 'Array':
    """Divides the first value by the second, returning 0 for division by 0.

    Args:
      right: The values to divide by.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.divide', self, right)

  def dotProduct(self, array2: _ArrayType) -> ee_number.Number:
    """Compute the dot product between two 1-D arrays.

    Args:
      array2: The second 1-D array.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.dotProduct', self, array2
    )

  def double(self) -> 'Array':
    """On an element-wise basis, casts the input value to a 64-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.double', self)

  def eigen(self) -> 'Array':
    """Computes the real eigenvectors and eigenvalues of a square 2D array.

    Returns:
      An ee.Array with A rows and A+1 columns, where each row contains an
      eigenvalue in the first column, and the corresponding eigenvector in the
      remaining A columns. The rows are sorted by eigenvalue, in descending
      order. This implementation uses DecompositionFactory.eig() from
      http://ejml.org.
    """

    return apifunction.ApiFunction.call_(self.name() + '.eigen', self)

  def eq(self, right: _ArrayType) -> 'Array':
    """Returns 1 if and only if the first value is equal to the second.

    Args:
      right: The values to compare with.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.eq', self, right)

  def erf(self) -> 'Array':
    """On an element-wise basis, computes the error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erf', self)

  def erfInv(self) -> 'Array':
    """Computes the inverse error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erfInv', self)

  def erfc(self) -> 'Array':
    """Computes the complementary error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erfc', self)

  def erfcInv(self) -> 'Array':
    """Computes the inverse complementary error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erfcInv', self)

  def exp(self) -> 'Array':
    """Computes Euler's number e raised to the power of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.exp', self)

  def first(self, right: _ArrayType) -> 'Array':
    """On an element-wise basis, selects the value of the first value.

    Args:
      right: The matching values that are always ignored.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.first', self, right)

  def firstNonZero(self, right: _ArrayType) -> 'Array':
    """Selects the first value if it is non-zero, otherwise the second value.

    Args:
      right: The values to use if the array has a zero in the corresponding
        position.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.firstNonZero', self, right
    )

  def float(self) -> 'Array':
    """On an element-wise basis, casts the input value to a 32-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.float', self)

  def floor(self) -> 'Array':
    """Computes the largest integer less than or equal to the input."""

    return apifunction.ApiFunction.call_(self.name() + '.floor', self)
