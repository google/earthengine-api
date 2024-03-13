"""A wrapper for Classifiers."""

from ee import apifunction
from ee import computedobject


class Classifier(computedobject.ComputedObject):
  """An object to represent an Earth Engine Classifier.

  Example:
    # https://developers.google.com/earth-engine/guides/classification
  """

  _initialized: bool = False

  def __init__(self, classifier: computedobject.ComputedObject):
    """Creates a Classifier wrapper.

    Args:
      classifier: A Classifier to cast.
    """
    self.initialize()

    if isinstance(classifier, computedobject.ComputedObject):
      # There is no server-side constructor for ee.Classifier. Pass the object
      # as-is to the server in case it is intended to be a Classifier cast.
      super().__init__(classifier.func, classifier.args, classifier.varName)
      return

    raise TypeError(
        'Classifier can only be used as a cast to Classifier. Found'
        f' {type(classifier)}.'
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
    return 'Classifier'
