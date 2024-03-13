"""A wrapper for Clusterers."""

from ee import apifunction
from ee import computedobject


class Clusterer(computedobject.ComputedObject):
  """An object to represent an Earth Engine Clusterer.

  Example:
    # Load a pre-computed Landsat composite for input.
    input_img = ee.Image('LANDSAT/LE7_TOA_1YEAR/2001')

    # Define a region in which to generate a sample of the input.
    region = ee.Geometry.Rectangle(29.7, 30, 32.5, 31.7)

    # Make the training dataset.
    training = input_img.sample(region=region, scale=30, numPixels=5000)

    # Instantiate the clusterer and train it.
    clusterer = ee.Clusterer.wekaKMeans(15).train(training)

    # Cluster the input using the trained clusterer.
    result = input_img.cluster(clusterer)
  """

  _initialized: bool = False

  def __init__(
      self,
      clusterer: computedobject.ComputedObject,
  ):
    """Creates a Clusterer wrapper.

    Args:
      clusterer: A Clusterer to cast.
    """
    self.initialize()

    if isinstance(clusterer, computedobject.ComputedObject):
      # There is no server-side constructor for ee.Clusterer. Pass the object
      # as-is to the server in case it is intended to be a Clusterer cast.
      super().__init__(clusterer.func, clusterer.args, clusterer.varName)
      return

    raise TypeError(
        'Clusterer can only be used as a cast to Clusterer. Found'
        f' {type(clusterer)}.'
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
    return 'Clusterer'
