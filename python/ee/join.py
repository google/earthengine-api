"""A wrapper for Joins."""

from ee import apifunction
from ee import computedobject


class Join(computedobject.ComputedObject):
  """An object to represent an Earth Engine Join.

  Example:
    fc1 = ee.FeatureCollection([
        ee.Feature(None, {'label': 1}),
        ee.Feature(None, {'label': 2}),
    ])
    fc2 = ee.FeatureCollection([
        ee.Feature(None, {'label': 1}),
        ee.Feature(None, {'label': 3}),
    ])
    a_filter = ee.Filter.equals(leftField='label', rightField='label')
    join = ee.Join.simple()
    joined = join.apply(fc1, fc2, a_filter)
  """

  _initialized: bool = False

  def __init__(
      self,
      join: computedobject.ComputedObject,
  ):
    """Creates a Join wrapper.

    Args:
      join: A join to cast.
    """
    self.initialize()

    if isinstance(join, computedobject.ComputedObject):
      # There is no server-side constructor for ee.Join. Pass the object as-is
      # to the server in case it is intended to be a Join cast.
      super().__init__(join.func, join.args, join.varName)
      return

    raise TypeError(
        f'Join can only be used as a cast to Join. Found {type(join)}.')

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
    return 'Join'
