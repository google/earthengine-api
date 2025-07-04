"""A wrapper for Arrays."""
from __future__ import annotations

from typing import Any, Optional

from ee import _arg_types
from ee import apifunction
from ee import computedobject
from ee import dictionary
from ee import ee_list
from ee import ee_number


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
      values: _arg_types.Array,
      # pylint: disable-next=invalid-name
      pixelType: Optional[_arg_types.String] = None,
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

    args: dict[str, Any] = {'values': values}
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

  def abs(self) -> Array:
    """On an element-wise basis, computes the absolute value of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.abs', self)

  def accum(
      self,
      axis: _arg_types.Integer,
      reducer: Optional[_arg_types.Reducer] = None,
  ) -> Array:
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

  def acos(self) -> Array:
    """Computes the arccosine in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.acos', self)

  def add(self, right: _arg_types.Array) -> Array:
    """On an element-wise basis, adds the first value to the second.

    Args:
      right: The values to add.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.add', self, right)

  def And(self, right: _arg_types.Array) -> Array:
    """Returns 1 if both values are non-zero.

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

  def asin(self) -> Array:
    """Computes the arcsine in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.asin', self)

  def atan(self) -> Array:
    """Computes the arctangent in radians of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.atan', self)

  def atan2(self, right: _arg_types.Array) -> Array:
    """Calculates the angle formed by the 2D vector [x, y].

    Args:
      right: The y values.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.atan2', self, right)

  def bitCount(self) -> Array:
    """Calculates the number of one-bits.

    Uses a 64-bit two's complement binary representation of the input.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.bitCount', self)

  def bitsToArray(input: _arg_types.Integer) -> Array:
    """Returns an Array from the bits of an integer.

    The array has as many elements as the position of the highest set bit, or a
    single 0 for a value of 0.

    Args:
      input: The integer to transform.
    """

    return apifunction.ApiFunction.call_('Array.bitsToArray', input)

  def bitwiseAnd(self, right: _arg_types.Array) -> Array:
    """On an element-wise basis, calculates the bitwise AND of the input values.

    Args:
      right: The values to AND with.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bitwiseAnd', self, right
    )

  def bitwiseNot(self) -> Array:
    """On an element-wise basis, calculates the bitwise NOT of the input.

    In the smallest signed integer type that can hold the input.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.bitwiseNot', self)

  def bitwiseOr(self, right: _arg_types.Array) -> Array:
    """On an element-wise basis, calculates the bitwise OR of the input values.

    Args:
      right: The values to OR with.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bitwiseOr', self, right
    )

  def bitwiseXor(self, right: _arg_types.Array) -> Array:
    """On an element-wise basis, calculates the bitwise XOR of the input values.

    Args:
      right: The values to XOR with.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.bitwiseXor', self, right
    )

  def byte(self) -> Array:
    """Casts the input value to an unsigned 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.byte', self)

  @staticmethod
  def cat(
      arrays: _arg_types.List, axis: Optional[_arg_types.Integer] = None
  ) -> Array:
    """Returns an Array that is the concatenation of the given arrays.

    Concatenates multiple arrays into a single array along the given axis. Each
    array must have the same dimensionality and the same length on all axes
    except the concatenation axis.

    Args:
      arrays: Arrays to concatenate.
      axis: Axis to concatenate along. Defaults to 0.
    """

    return apifunction.ApiFunction.call_('Array.cat', arrays, axis)

  def cbrt(self) -> Array:
    """On an element-wise basis, computes the cubic root of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.cbrt', self)

  def ceil(self) -> Array:
    """Computes the smallest integer greater than or equal to the input."""

    return apifunction.ApiFunction.call_(self.name() + '.ceil', self)

  def cos(self) -> Array:
    """On an element-wise basis, computes the cosine of the input in radians."""

    return apifunction.ApiFunction.call_(self.name() + '.cos', self)

  def cosh(self) -> Array:
    """On an element-wise basis, computes the hyperbolic cosine of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.cosh', self)

  def cut(self, position: _arg_types.List) -> Array:
    """Cut an array along one or more axes.

    Args:
      position: Cut an array along one or more axes. The positions args
        specifies either a single value for each axis of the array, or -1,
        indicating the whole axis. The output will be an array that has the same
        dimensions as the input, with a length of 1 on each axis that was not -1
        in the positions array.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.cut', self, position)

  def digamma(self) -> Array:
    """On an element-wise basis, computes the digamma function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.digamma', self)

  def divide(self, right: _arg_types.Array) -> Array:
    """Divides the first value by the second, returning 0 for division by 0.

    Args:
      right: The values to divide by.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.divide', self, right)

  def dotProduct(self, array2: _arg_types.Array) -> ee_number.Number:
    """Compute the dot product between two 1-D arrays.

    Args:
      array2: The second 1-D array.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.dotProduct', self, array2
    )

  def double(self) -> Array:
    """On an element-wise basis, casts the input value to a 64-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.double', self)

  def eigen(self) -> Array:
    """Computes the real eigenvectors and eigenvalues of a square 2D array.

    Returns:
      An ee.Array with A rows and A+1 columns, where each row contains an
      eigenvalue in the first column, and the corresponding eigenvector in the
      remaining A columns. The rows are sorted by eigenvalue, in descending
      order. This implementation uses DecompositionFactory.eig() from
      http://ejml.org.
    """

    return apifunction.ApiFunction.call_(self.name() + '.eigen', self)

  def eq(self, right: _arg_types.Array) -> Array:
    """Returns 1 if the first value is equal to the second.

    Args:
      right: The values to compare with.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.eq', self, right)

  def erf(self) -> Array:
    """On an element-wise basis, computes the error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erf', self)

  def erfInv(self) -> Array:
    """Computes the inverse error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erfInv', self)

  def erfc(self) -> Array:
    """Computes the complementary error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erfc', self)

  def erfcInv(self) -> Array:
    """Computes the inverse complementary error function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.erfcInv', self)

  def exp(self) -> Array:
    """Computes Euler's number e raised to the power of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.exp', self)

  def first(self, right: _arg_types.Array) -> Array:
    """On an element-wise basis, selects the value of the first value.

    Args:
      right: The matching values that are always ignored.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.first', self, right)

  def firstNonZero(self, right: _arg_types.Array) -> Array:
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

  def float(self) -> Array:
    """On an element-wise basis, casts the input value to a 32-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.float', self)

  def floor(self) -> Array:
    """Computes the largest integer less than or equal to the input."""

    return apifunction.ApiFunction.call_(self.name() + '.floor', self)

  def gamma(self) -> Array:
    """On an element-wise basis, computes the gamma function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.gamma', self)

  def gammainc(self, right: _arg_types.Any) -> Array:
    """Calculates the regularized lower incomplete Gamma function γ(x,a).

    Args:
      right: The a values for gammainc(x, a).

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.gammainc', self, right)

  def get(self, position: _arg_types.Any) -> ee_number.Number:
    """Extracts the value at the given position from the input array.

    Args:
      position: The coordinates of the element to get.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.get', self, position)

  def gt(self, right: _arg_types.Any) -> Array:
    """Returns 1 if the first value is greater than the second.

    Args:
      right: The values to compare with.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.gt', self, right)

  def gte(self, right: _arg_types.Any) -> Array:
    """Returns 1 if the first value is greater than or equal to the second.

    Args:
      right: The values to compare with.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.gte', self, right)

  def hypot(self, right: _arg_types.Any) -> Array:
    """Calculates the magnitude of the 2D vector [x, y].

    Args:
      right: The y values.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.hypot', self, right)

  @staticmethod
  def identity(size: _arg_types.Integer) -> Array:
    """Returns a 2D identity matrix of the given size.

    Args:
      size: The length of each axis.
    """

    return apifunction.ApiFunction.call_('Array.identity', size)

  def int(self) -> Array:
    """Casts the input value to a signed 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int', self)

  def int16(self) -> Array:
    """Casts the input value to a signed 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int16', self)

  def int32(self) -> Array:
    """Casts the input value to a signed 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int32', self)

  def int64(self) -> Array:
    """Casts the input value to a signed 64-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int64', self)

  def int8(self) -> Array:
    """Casts the input value to a signed 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.int8', self)

  def lanczos(self) -> Array:
    """Computes the Lanczos approximation of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.lanczos', self)

  def leftShift(self, right: _arg_types.Any) -> Array:
    """On an element-wise basis, calculates the left shift of v1 by v2 bits.

    Args:
      right: How many bits to shift by.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.leftShift', self, right
    )

  def length(self) -> Array:
    """Returns a 1-D ee.Array containing the length of each dimension."""

    return apifunction.ApiFunction.call_(self.name() + '.length', self)

  def log(self) -> Array:
    """On an element-wise basis, computes the natural logarithm of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.log', self)

  def log10(self) -> Array:
    """On an element-wise basis, computes the base-10 logarithm of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.log10', self)

  def long(self) -> Array:
    """Casts the input value to a signed 64-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.long', self)

  def lt(self, right: _arg_types.Any) -> Array:
    """Returns 1 if the first value is less than the second.

    Args:
      right: The values to compare with.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.lt', self, right)

  def lte(self, right: _arg_types.Any) -> Array:
    """Returns 1 if the first value is less than or equal to the second.

    Args:
      right: The values to compare with.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.lte', self, right)

  def mask(self, mask: _arg_types.Any) -> Array:
    """Creates an array of just the elements that have non-zero mask matches.

    Creates a subarray by slicing out each position in an input array that is
    parallel to a non-zero element of the given mask array.

    Args:
      mask: Mask array.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.mask', self, mask)

  def matrixCholeskyDecomposition(self) -> dictionary.Dictionary:
    """Calculates the Cholesky decomposition of a matrix.

    The Cholesky decomposition is a decomposition into the form L * L' where L
    is a lower triangular matrix. The input must be a symmetric
    positive-definite matrix. Returns a dictionary with 1 entry named 'L'.

    Returns:
      An ee.Dictionary.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixCholeskyDecomposition', self
    )

  def matrixDeterminant(self) -> ee_number.Number:
    """Computes the determinant of the matrix."""

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixDeterminant', self
    )

  def matrixDiagonal(self) -> Array:
    """Computes the diagonal of the matrix in a single column."""

    return apifunction.ApiFunction.call_(self.name() + '.matrixDiagonal', self)

  def matrixFnorm(self) -> ee_number.Number:
    """Computes the Frobenius norm of the matrix."""

    return apifunction.ApiFunction.call_(self.name() + '.matrixFnorm', self)

  def matrixInverse(self) -> Array:
    """Computes the inverse of the matrix."""

    return apifunction.ApiFunction.call_(self.name() + '.matrixInverse', self)

  def matrixLUDecomposition(self) -> dictionary.Dictionary:
    """Calculates the LU matrix decomposition.

    The LU decomposition such that P×input=L×U, where L is lower triangular
    (with unit diagonal terms), U is upper triangular and P is a partial pivot
    permutation matrix.

    The input matrix must be square. Returns a dictionary with entries named
    'L', 'U' and 'P'.

    Returns:
      An ee.Dictionary.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixLUDecomposition', self
    )

  def matrixMultiply(self, right: _arg_types.Any) -> Array:
    """Returns the matrix multiplication A * B.

    Args:
      right: The right-hand value.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixMultiply', self, right
    )

  def matrixPseudoInverse(self) -> Array:
    """Computes the Moore-Penrose pseudoinverse of the matrix."""

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixPseudoInverse', self
    )

  def matrixQRDecomposition(self) -> dictionary.Dictionary:
    """Returns the QR decomposition of the input matrix.

    Calculates the QR-decomposition of a matrix into two matrices Q and R such
    that input = QR, where Q is orthogonal, and R is upper triangular.

    Returns a dictionary with entries named 'Q' and 'R'.

    Returns:
      An ee.Dictionary.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixQRDecomposition', self
    )

  def matrixSingularValueDecomposition(self) -> dictionary.Dictionary:
    """Returns the Singular Value Decomposition of the input matrix.

    Calculates the Singular Value Decomposition of the input matrix into U×S×V',
    such that U and V are orthogonal and S is diagonal.

    Returns:
      An ee.Dictionary with entries named 'U', 'S' and 'V'.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixSingularValueDecomposition', self
    )

  def matrixSolve(self, right: _arg_types.Any) -> Array:
    """Returns the least-squares solution of the input matrix.

    Solves for x in the matrix equation A * x = B, finding a least-squares
    solution if A is overdetermined.

    Args:
      right: The right-hand value.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixSolve', self, right
    )

  def matrixToDiag(self) -> Array:
    """Computes a square diagonal matrix from a single column matrix."""

    return apifunction.ApiFunction.call_(self.name() + '.matrixToDiag', self)

  def matrixTrace(self) -> ee_number.Number:
    """Computes the trace of the matrix."""

    return apifunction.ApiFunction.call_(self.name() + '.matrixTrace', self)

  def matrixTranspose(
      self,
      axis1: Optional[_arg_types.Integer] = None,
      axis2: Optional[_arg_types.Integer] = None,
  ) -> Array:
    """Transposes two dimensions of an array.

    Args:
      axis1: First axis to swap. Defaults to 0.
      axis2: Second axis to swap. Defaults to 1.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.matrixTranspose', self, axis1, axis2
    )

  def max(self, right: _arg_types.Any) -> Array:
    """Selects the maximum of the first and second values.

    Args:
      right: The values to compare with.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.max', self, right)

  def min(self, right: _arg_types.Any) -> Array:
    """Selects the minimum of the first and second values.

    Args:
      right: The values to compare with.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.min', self, right)

  def mod(self, right: _arg_types.Any) -> Array:
    """Calculates the remainder of the first value divided by the second.

    Args:
      right: The values to divide by.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.mod', self, right)

  def multiply(self, right: _arg_types.Any) -> Array:
    """On an element-wise basis, multiplies the first value by the second.

    Args:
      right: The values to multiply by.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.multiply', self, right)

  def neq(self, right: _arg_types.Any) -> Array:
    """Returns 1 if the first value is not equal to the second.

    Args:
      right: The right-hand value.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.neq', self, right)

  def Not(self) -> Array:
    """Returns 0 if the input is non-zero, and 1 otherwise."""

    return apifunction.ApiFunction.call_(self.name() + '.not', self)

  def Or(self, right: _arg_types.Any) -> Array:
    """On an element-wise basis, returns 1 if either input value is non-zero.

    Args:
      right: The right-hand value.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.or', self, right)

  def pad(
      self, lengths: _arg_types.Any, pad: Optional[_arg_types.Number] = None
  ) -> Array:
    """Pad an array to a given length.

    The pad value will be repeatedly appended to the array to extend it to given
    length along each axis. If the array is already as large or larger than a
    given length, it will remain unchanged along that axis.

    Args:
      lengths: A list of new lengths for each axis.
      pad: The value with which to pad the array. Defaults to 0.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.pad', self, lengths, pad
    )

  def pow(self, right: _arg_types.Any) -> Array:
    """On an element-wise basis, raises the first value to the power of the second.

    Args:
      right: The right-hand value.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.pow', self, right)

  def project(self, axes: _arg_types.Any) -> Array:
    """Returns the projected array.

    Projects an array to a lower dimensional space by specifying the axes to
    retain. Dropped axes must be at most length 1.

    Args:
      axes: The axes to project onto. Other axes will be discarded, and must be
        at most length 1.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.project', self, axes)

  def reduce(
      self,
      reducer: _arg_types.Reducer,
      axes: _arg_types.Any,
      # pylint: disable-next=invalid-name
      fieldAxis: Optional[_arg_types.Integer] = None,
  ) -> Array:
    """Returns the result of applying the reducer on the array.

    Apply a reducer to an array by collapsing all the input values along each
    specified axis into a single output value computed by the reducer.

    The output always has the same dimensionality as the input, and the
    individual axes are affected as follows:

    - The axes specified in the 'axes' parameter have their length reduced to 1
      (by applying the reducer).
    - If the reducer has multiple inputs or multiple outputs, the axis specified
      in 'fieldAxis' will be used to provide the reducer's inputs and store the
      reducer's outputs.
    - All other axes are unaffected (independent reductions are performed).

    Args:
      reducer: The reducer to apply. Each of its outputs must be a number, not
        an array or other type.
      axes: The list of axes over which to reduce. The output will have a length
        of 1 in all these axes.
      fieldAxis: The axis to use as the reducer's input and output fields. Only
        required if the reducer has multiple inputs or multiple outputs, in
        which case the axis must have length equal to the number of reducer
        inputs, and in the result it will have length equal to the number of
        reducer outputs.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.reduce', self, reducer, axes, fieldAxis
    )

  def repeat(
      self,
      axis: Optional[_arg_types.Integer] = None,
      copies: Optional[_arg_types.Integer] = None,
  ) -> Array:
    """Repeats the array along the given axis.

    The result will have the shape of the input, except length along the
    repeated axis will be multiplied by the given number of copies.

    Args:
      axis: The axis along which to repeat the array. Defaults to 0.
      copies: The number of copies of this array to concatenate along the given
        axis. Defaults to 2.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.repeat', self, axis, copies
    )

  def reshape(self, shape: _arg_types.Any) -> Array:
    """Reshapes an array to a new list of dimension lengths.

    Args:
      shape: New shape to which arrays are converted. If one component of the
        shape is the special value -1, the size of that dimension is computed so
        that the total size remains constant. In particular, a shape of [-1]
        flattens into 1-D. At most one component of shape can be -1.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.reshape', self, shape)

  def rightShift(self, right: _arg_types.Any) -> Array:
    """Calculates the signed right shift of v1 by v2 bits.

    Args:
      right: The values to shift by.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.rightShift', self, right
    )

  def round(self) -> Array:
    """On an element-wise basis, computes the integer nearest to the input."""

    return apifunction.ApiFunction.call_(self.name() + '.round', self)

  def short(self) -> Array:
    """On an element-wise basis, casts the input value to a signed 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.short', self)

  def signum(self) -> Array:
    """Returns -1 or 1 base on the sign of the input or 0 if the input is zero.

    On an element-wise basis, computes the signum function (sign) of the input;
    The return value is 0 if the input is 0, 1 if the input is greater than 0,
    -1 if the input is less than 0.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.signum', self)

  def sin(self) -> Array:
    """On an element-wise basis, computes the sine of the input in radians."""

    return apifunction.ApiFunction.call_(self.name() + '.sin', self)

  def sinh(self) -> Array:
    """On an element-wise basis, computes the hyperbolic sine of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.sinh', self)

  def slice(
      self,
      axis: Optional[_arg_types.Integer] = None,
      start: Optional[_arg_types.Integer] = None,
      end: Optional[_arg_types.Integer] = None,
      step: Optional[_arg_types.Integer] = None,
  ) -> Array:
    """Returns the result of slicing the array along the given axis.

    Creates a subarray by slicing out each position along the given axis from
    the 'start' (inclusive) to 'end' (exclusive) by increments of 'step'.

    The result will have as many dimensions as the input, and the same length in
    all directions except the slicing axis, where the length will be the number
    of positions from 'start' to 'end' by 'step' that are in range of the input
    array's length along 'axis'. This means the result can be length 0 along the
    given axis if start=end, or if the start or end values are entirely out of
    range.

    Args:
      axis: The axis to slice on. Defaults to 0.
      start: The coordinate of the first slice (inclusive) along 'axis'.
        Negative numbers are used to position the start of slicing relative to
        the end of the array, where -1 starts at the last position on the axis,
        -2 starts at the next to last position, etc.  Defaults to 0.
      end: The coordinate (exclusive) at which to stop taking slices. By default
        this will be the length of the given axis. Negative numbers are used to
        position the end of slicing relative to the end of the array, where -1
        will exclude the last position, -2 will exclude the last two positions,
        etc.
      step: The separation between slices along 'axis'; a slice will be taken at
        each whole multiple of 'step' from 'start' (inclusive) to 'end'
        (exclusive). Must be positive.  Defaults to 1.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.slice', self, axis, start, end, step
    )

  def sort(self, keys: Optional[_arg_types.Any] = None) -> Array:
    """Sorts elements of the array along one axis.

    Args:
      keys: Optional keys to sort by. If not provided, the values are used as
        the keys. The keys can only have multiple elements along one axis, which
        determines the direction to sort in.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.sort', self, keys)

  def sqrt(self) -> Array:
    """On an element-wise basis, computes the square root of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.sqrt', self)

  def subtract(self, right: _arg_types.Any) -> Array:
    """On an element-wise basis, subtracts the second value from the first.

    Args:
      right: The values to subtract.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.subtract', self, right)

  def tan(self) -> Array:
    """Computes the tangent of the input in radians."""

    return apifunction.ApiFunction.call_(self.name() + '.tan', self)

  def tanh(self) -> Array:
    """Computes the hyperbolic tangent of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.tanh', self)

  def toByte(self) -> Array:
    """Casts the input value to an unsigned 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toByte', self)

  def toDouble(self) -> Array:
    """On an element-wise basis, casts the input value to a 64-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.toDouble', self)

  def toFloat(self) -> Array:
    """On an element-wise basis, casts the input value to a 32-bit float."""

    return apifunction.ApiFunction.call_(self.name() + '.toFloat', self)

  def toInt(self) -> Array:
    """Casts the input value to a signed 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt', self)

  def toInt16(self) -> Array:
    """Casts the input value to a signed 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt16', self)

  def toInt32(self) -> Array:
    """Casts the input value to a signed 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt32', self)

  def toInt64(self) -> Array:
    """Casts the input value to a signed 64-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt64', self)

  def toInt8(self) -> Array:
    """Casts the input value to a signed 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toInt8', self)

  def toList(self) -> ee_list.List:
    """Turns an Array into a list of lists of numbers."""

    return apifunction.ApiFunction.call_(self.name() + '.toList', self)

  def toLong(self) -> Array:
    """Casts the input value to a signed 64-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toLong', self)

  def toShort(self) -> Array:
    """Casts the input value to a signed 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toShort', self)

  def toUint16(self) -> Array:
    """Casts the input value to an unsigned 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toUint16', self)

  def toUint32(self) -> Array:
    """Casts the input value to an unsigned 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toUint32', self)

  def toUint8(self) -> Array:
    """Casts the input value to an unsigned 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.toUint8', self)

  def transpose(
      self,
      axis1: Optional[_arg_types.Integer] = None,
      axis2: Optional[_arg_types.Integer] = None,
  ) -> Array:
    """Transposes two dimensions of an array.

    Args:
      axis1: First axis to swap. Defaults to 0.
      axis2: Second axis to swap. Defaults to 1.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.transpose', self, axis1, axis2
    )

  def trigamma(self) -> Array:
    """Computes the trigamma function of the input."""

    return apifunction.ApiFunction.call_(self.name() + '.trigamma', self)

  def uint16(self) -> Array:
    """Casts the input value to an unsigned 16-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.uint16', self)

  def uint32(self) -> Array:
    """Casts the input value to an unsigned 32-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.uint32', self)

  def uint8(self) -> Array:
    """Casts the input value to an unsigned 8-bit integer."""

    return apifunction.ApiFunction.call_(self.name() + '.uint8', self)
