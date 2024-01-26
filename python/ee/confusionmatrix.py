"""A wrapper for ConfusionMatrices."""

from typing import Any, Dict, List, Optional, Union

from ee import apifunction
from ee import computedobject


class ConfusionMatrix(computedobject.ComputedObject):
  """An object to represent an Earth Engine ConfusionMatrix.

  Examples:
    # Construct a confusion matrix. Rows correspond to actual values, columns to
    # predicted values.
    matrix = ee.Array([[32, 0, 0,  0,  1, 0],
                       [ 0, 5, 0,  0,  1, 0],
                       [ 0, 0, 1,  3,  0, 0],
                       [ 0, 1, 4, 26,  8, 0],
                       [ 0, 0, 0,  7, 15, 0],
                       [ 0, 0, 0,  1,  0, 5]])
    ee.ConfusionMatrix(matrix)
  """

  _initialized: bool = False

  def __init__(
      self,
      array: Optional[computedobject.ComputedObject],
      order: Optional[Union[List[Any], computedobject.ComputedObject]] = None,
  ):
    """Creates a ConfusionMatrix wrapper.

    Creates a confusion matrix. Axis 0 (the rows) of the matrix correspond to
    the actual values, and Axis 1 (the columns) to the predicted values.

    Args:
      array: A square, 2D array of integers, representing the confusion matrix.
      order: The row and column size and order, for non-contiguous or non-zero
        based matrices.
    """
    self.initialize()

    if isinstance(array, computedobject.ComputedObject) and order is None:
      if self.is_func_returning_same(array):
        # If it is a call that already returns a ConfusionMatrix, just cast.
        super().__init__(array.func, array.args, array.varName)
        return

    args: Dict[str, Any] = {'array': array}
    if order is not None:
      args['order'] = order

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
    return 'ConfusionMatrix'
