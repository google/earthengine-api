"""A wrapper for Models."""

from ee import apifunction
from ee import computedobject


class Model(computedobject.ComputedObject):
  """An object to represent an Earth Engine Model.

  Example:
    model = ee.Model.fromVertexAi(
        endpoint='endpoint-name',
        inputTileSize=[8, 8],
        outputBands={
            'probability': {'type': ee.PixelType.float(), 'dimensions': 1}
        },
    )

  Please visit one of the following links for more info:
    - https://developers.google.com/earth-engine/guides/machine-learning
    - https://developers.google.com/earth-engine/guides/tensorflow-vertex
  """

  _initialized: bool = False

  def __init__(self, model: computedobject.ComputedObject):
    """Creates a Model wrapper.

    Args:
      model: A Model to cast.
    """
    self.initialize()

    if isinstance(model, computedobject.ComputedObject):
      # There is no server-side constructor for ee.Model. Pass the object as-is
      # to the server in case it is intended to be a Model cast.
      super().__init__(model.func, model.args, model.varName)
      return

    raise TypeError('Model constructor can only cast to Model.')

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
    return 'Model'
