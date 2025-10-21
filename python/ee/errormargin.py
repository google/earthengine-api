"""A wrapper for ErrorMargins."""
from __future__ import annotations

from typing import Any

from ee import _arg_types
from ee import apifunction
from ee import computedobject


class ErrorMargin(computedobject.ComputedObject):
  """An object to represent an Earth Engine ErrorMargin.

  Examples:
    # Construct a variety of error margins.
    ee.ErrorMargin(0)  # unit: meters, value: 0
    ee.ErrorMargin(1)  # unit: meters, value: 1
    # Negative margin yields a positive value.
    ee.ErrorMargin(-1)  # unit: meters, value: 1
    # A very large error margin does not quite trigger infinite, which is 2.0e7.
    ee.ErrorMargin(1.99e7)  # unit: meters, value: 19900000
    # Values >= 2.0e7 are turned into an 'infinite'.
    ee.ErrorMargin(2e7)  # unit: infinite

    # High precision for 'meters' (< 0.001) results in an error.
    ee.ErrorMargin(0.0009, 'meters')

    # Being explicit about the units of the error margin.
    ee.ErrorMargin(1, 'meters')  # unit: meters, value: 1
    ee.ErrorMargin(1, 'projected')  # unit: projected, value: 1
    ee.ErrorMargin(1, 'infinite')  # unit: infinite
    ee.ErrorMargin(value=2, unit='meters')  # unit: meters, value: 2
  """
  _initialized = False

  def __init__(
      self,
      value: _arg_types.Number | None = None,
      unit: _arg_types.String | None = None,
  ):
    """Creates a ErrorMargin wrapper.

    Args:
      value: The maximum error value allowed by the margin. Ignored if the unit
        is 'infinite'.
      unit: The unit of this margin: 'meters', 'projected', or 'infinite'.
        When specifying 'infinite', 'value' is ignored. Defaults to 'meters'.
    """
    self.initialize()

    if isinstance(value, computedobject.ComputedObject):
      if self.is_func_returning_same(value):
        if unit is not None:
          raise TypeError('unit must be None if value is an ErrorMargin')
        # If it is a call that is already returning a ErrorMargin, just cast.
        super().__init__(value.func, value.args, value.varName)
        return

    if value is None and not (
        # TODO(user): Make the computed object check look for a ee.String or
        #   a function that returns a string.
        unit == 'infinite' or isinstance(unit, computedobject.ComputedObject)
    ):
      raise TypeError('value must be provided if unit is not infinite')

    args: dict[str, Any] = {}
    if value is not None:
      args['value'] = value
    if unit is not None:
      args['unit'] = unit

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
    return 'ErrorMargin'
