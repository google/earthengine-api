"""A wrapper for Reducers."""

from ee import apifunction
from ee import computedobject


class Reducer(computedobject.ComputedObject):
  """An object to represent an Earth Engine Reducer.

  Example:
    fc = ee.FeatureCollection([
        ee.Feature(None, {'label': 1}),
        ee.Feature(None, {'label': 2}),
    ])
    reducer = ee.Reducer(ee.Reducer.toList())
    result = fc.reduceColumns(reducer, ['label']).get('list')
    print(result.getInfo())
  """

  _initialized: bool = False

  def __init__(
      self,
      reducer: computedobject.ComputedObject,
  ):
    """Creates a Reducer wrapper.

    Args:
      reducer: A reducer to cast.
    """
    self.initialize()

    if isinstance(reducer, computedobject.ComputedObject):
      # There is no server-side constructor for ee.Reducer. Pass the object
      # as-is to the server in case it is intended to be a Reducer cast.
      super().__init__(reducer.func, reducer.args, reducer.varName)
      return

    raise TypeError(
        f'Reducer can only be used as a cast to Reducer. Found {type(reducer)}.'
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
    return 'Reducer'
