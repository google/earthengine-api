#!/usr/bin/env python
"""A namespace for Terrain."""



import apifunction

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name


class Terrain(object):
  """An namespace for Terrain Algorithms."""

  _initialized = False

  @classmethod
  def initialize(cls):
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, 'Terrain', 'Terrain')
      cls._initialized = True

  @classmethod
  def reset(cls):
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False
