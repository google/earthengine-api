"""A wrapper for PixelTypes."""

from typing import Any, Dict, Optional, Union

from ee import apifunction
from ee import computedobject
from ee import ee_number
from ee import ee_string

_IntegerType = Union[int, ee_number.Number, computedobject.ComputedObject]
_NumberType = Union[float, ee_number.Number, computedobject.ComputedObject]
_StringType = Union[str, ee_string.String, computedobject.ComputedObject]


class PixelType(computedobject.ComputedObject):
  """An object to represent an Earth Engine PixelType.

  Examples:
    # Convenience constructors:
    ee.PixelType.int8()
    ee.PixelType.int16()
    ee.PixelType.int32()
    ee.PixelType.int64()

    ee.PixelType.uint8()
    ee.PixelType.uint16()
    ee.PixelType.uint32()

    ee.PixelType.float()
    ee.PixelType.double()

    # Explicit constructors:
    ee.PixelType('int', 0, 1)
    ee.PixelType('float', 1, 2, 3)
    ee.PixelType('double', 2, 3, 4)

    # Example of the methods
    pixeltype = ee.PixelType('double', -1, 2, 3)
    print(pixeltype.getInfo())
    # {'type': 'PixelType', 'precision': 'double', 'min': -1, 'max': 2,
    #  'dimensions': 3}

    print(pixeltype.precision().getInfo())
    # double
    print(pixeltype.minValue().getInfo())
    # -1
    print(pixeltype.maxValue().getInfo())
    # 2
    print(pixeltype.dimensions().getInfo())
    # 3
  """

  _initialized: bool = False

  def __init__(
      self,
      precision: Union[_StringType],
      # pylint: disable=invalid-name
      minValue: Optional[_NumberType] = None,
      maxValue: Optional[_NumberType] = None,
      # pylint: enable=invalid-name
      dimensions: Optional[_IntegerType] = None,
  ):
    """Creates a PixelType wrapper.

    Args:
      precision: The pixel precision, one of 'int', 'float', or 'double'.
      minValue: The minimum value of pixels of this type. If precision is
        'float' or 'double', this can be null, signifying negative infinity.
      maxValue: The maximum value of pixels of this type. If precision is
        'float' or 'double', this can be null, signifying positive infinity.
      dimensions: The number of dimensions in which pixels of this type can
        vary; 0 is a scalar, 1 is a vector, 2 is a matrix, etc.
    """
    self.initialize()

    args: Dict[str, Any] = {'precision': precision}
    if minValue is not None:
      args['minValue'] = minValue
    if maxValue is not None:
      args['maxValue'] = maxValue
    if dimensions is not None:
      args['dimensions'] = dimensions

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
    return 'PixelType'

  def dimensions(self) -> ee_number.Number:
    """Returns the number of dimensions for this type.

    Returns:
      An ee.Number. 0 for scalar values and >= 1 for array values.
    """

    return apifunction.ApiFunction.call_(self.name() + '.dimensions', self)

  def maxValue(self) -> ee_number.Number:
    """Returns the maximum value of the PixelType."""

    return apifunction.ApiFunction.call_(self.name() + '.maxValue', self)

  def minValue(self) -> ee_number.Number:
    """Returns the minimum value of the PixelType."""

    return apifunction.ApiFunction.call_(self.name() + '.minValue', self)

  def precision(self) -> ee_string.String:
    """Returns the precision of the PixelType.

    Returns:
      An ee.String. One of 'int', 'float', or 'double'.
    """

    return apifunction.ApiFunction.call_(self.name() + '.precision', self)
