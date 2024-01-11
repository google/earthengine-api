"""A wrapper for PixelTypes."""

from typing import Any, Dict, Optional, Union

from ee import apifunction
from ee import computedobject


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
      precision: Union[str, computedobject.ComputedObject],
      # pylint: disable=invalid-name
      minValue: Optional[Union[float, computedobject.ComputedObject]] = None,
      maxValue: Optional[Union[float, computedobject.ComputedObject]] = None,
      # pylint: enable=invalid-name
      dimensions: Optional[Union[int, computedobject.ComputedObject]] = None,
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
    super().__init__(func, args)

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
