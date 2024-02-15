"""A namespace for Terrain."""

from ee import apifunction


class Terrain:
  """A namespace for Terrain Algorithms."""

  _initialized: bool = False

  def __init__(self):
    raise RuntimeError(
        self.__name__
        + ' should not be used as an object. Only direct usage of Terrain'
        ' static methods is allowed. For example, use this: '
        ' `ee.Terrain.aspect(...)`'
    )

  @classmethod
  def initialize(cls) -> None:
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, cls.__name__, cls.__name__)
      cls._initialized = True

  @classmethod
  def reset(cls) -> None:
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  @staticmethod
  def name() -> str:
    return 'Terrain'
