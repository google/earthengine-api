"""A wrapper for Kernels."""

from ee import apifunction
from ee import computedobject


class Kernel(computedobject.ComputedObject):
  """An object to represent an Earth Engine Kernel.

  Example:
    # Square kernel
    ee.Kernel.square(radius=2, units='pixels', normalize=False)
    # Chebyshev kernel
    ee.Kernel.chebyshev(radius=3)
  """

  _initialized: bool = False

  def __init__(self, kernel: computedobject.ComputedObject):
    """Creates a Kernel wrapper.

    Args:
      kernel: A Kernel to cast.
    """
    self.initialize()

    if isinstance(kernel, computedobject.ComputedObject):
      # There is no server-side constructor for ee.Kernel. Pass the object as-is
      # to the server in case it is intended to be a Kernel cast.
      super().__init__(kernel.func, kernel.args, kernel.varName)
      return

    raise TypeError(
        f'Kernel can only be used as a cast to Kernel. Found {type(kernel)}.'
    )

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
    return 'Kernel'
