#!/usr/bin/env python
"""A namespace for Terrain."""

from ee import apifunction


class Terrain:
  """An namespace for Terrain Algorithms."""

  _initialized: bool = False

  @classmethod
  def initialize(cls) -> None:
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, 'Terrain', 'Terrain')
      cls._initialized = True

  @classmethod
  def reset(cls) -> None:
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False
