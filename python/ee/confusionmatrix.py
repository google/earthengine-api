"""A wrapper for ConfusionMatrices."""
from __future__ import annotations

from typing import Any

from ee import _arg_types
from ee import apifunction
from ee import computedobject
from ee import ee_array
from ee import ee_list
from ee import ee_number


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
      array: (
          ee_array.Array |
          _arg_types.ConfusionMatrix |
          computedobject.ComputedObject
      ),
      order: _arg_types.List | None = None,
  ):
    """Creates a ConfusionMatrix wrapper.

    Creates a confusion matrix. Axis 0 (the rows) of the matrix correspond to
    the actual values, and Axis 1 (the columns) to the predicted values.

    Args:
      array: A square, 2D array of integers, representing the confusion matrix.
        Note that unlike the ee.Array constructor, this argument cannot take a
        list.
      order: The row and column size and order, for non-contiguous or non-zero
        based matrices.
    """
    self.initialize()

    if isinstance(array, computedobject.ComputedObject) and order is None:
      if self.is_func_returning_same(array):
        # If it is a call that already returns a ConfusionMatrix, just cast.
        super().__init__(array.func, array.args, array.varName)
        return

    args: dict[str, Any] = {'array': array}
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

  def accuracy(self) -> ee_number.Number:
    """Returns the accuracy of a confusion matrix defined as correct / total."""

    return apifunction.ApiFunction.call_(self.name() + '.accuracy', self)

  def array(self) -> ee_array.Array:
    """Returns a confusion matrix as an Array."""

    return apifunction.ApiFunction.call_(self.name() + '.array', self)

  def consumersAccuracy(self) -> ee_array.Array:
    """Returns an array of consumer's accuracies.

    Computes the consumer's accuracy (reliability) of a confusion matrix defined
    as (correct / total) for each row.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.consumersAccuracy', self
    )

  def fscore(self, beta: _arg_types.Number | None = None) -> ee_array.Array:
    """Returns the F-beta score for the confusion matrix.

    Args:
      beta: A factor indicating how much more important recall is than
        precision. The standard F-score is equivalent to setting beta to one.
    """

    return apifunction.ApiFunction.call_(self.name() + '.fscore', self, beta)

  def kappa(self) -> ee_number.Number:
    """Returns the Kappa statistic for the confusion matrix."""

    return apifunction.ApiFunction.call_(self.name() + '.kappa', self)

  def order(self) -> ee_list.List:
    """Returns the name and order of the rows and columns of the matrix."""

    return apifunction.ApiFunction.call_(self.name() + '.order', self)

  def producersAccuracy(self) -> ee_array.Array:
    """Returns an array of producer's accuracies.

    Computes the producer's accuracy of a confusion matrix defined as (correct /
    total) for each column.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.producersAccuracy', self
    )
