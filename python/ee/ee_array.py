"""A wrapper for Arrays."""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Union

from ee import apifunction
from ee import computedobject
# pylint: disable=unused-import
from ee import ee_list
from ee import ee_string
# pylint: enable=unused-import

_ArrayType = Union[
    Any, List[Any], 'Array', 'ee_list.List', computedobject.ComputedObject
]
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
