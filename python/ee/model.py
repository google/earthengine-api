"""A wrapper for Models."""

from typing import Any, Union

from ee import apifunction
from ee import computedobject
from ee import featurecollection
from ee import image

_FeatureCollectionType = Union[
    Any, featurecollection.FeatureCollection, computedobject.ComputedObject
]
_ImageType = Union[Any, image.Image, computedobject.ComputedObject]


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

  # TODO: Add fromAiPlatformPredictor
  # TODO: Add fromVertexAi

  def predictImage(self, image: _ImageType) -> image.Image:
    """Returns an image with predictions from pixel tiles of an image.

    The predictions are merged as bands with the input image.

    The model will receive 0s in place of masked pixels. The masks of predicted
    output bands are the minimum of the masks of the inputs.

    Args:
      image: The input image.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.predictImage', self, image
    )

  def predictProperties(
      self, collection: _FeatureCollectionType
  ) -> featurecollection.FeatureCollection:
    """Returns a feature collection with predictions for each feature.

    Predicted properties are merged with the properties of the input feature.

    Args:
      collection: The input collection.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.predictProperties', self, collection
    )
