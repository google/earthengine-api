"""A wrapper for Blobs."""

from typing import Any, Dict, Union

from ee import apifunction
from ee import computedobject


class Blob(computedobject.ComputedObject):
  """An object to represent an Earth Engine Blob.

  Loads a string Blob from a Google Cloud Storage (GCS) URL.

  Example:

    url = 'gs://ee-docs-demos/vector/geojson/point.json'
    blob = ee.Blob(url)
    print(blob.url().getInfo())
    print(blob.string().getInfo())

    entry = ee.Dictionary(blob.string().decodeJSON())
    print(entry.getInfo())  # Point (1.00, 2.00)...
    print(entry.get('a_field').getInfo())  # 'a demo field'
  """

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(self, url: Union[str, computedobject.ComputedObject]):
    """Creates a Blob wrapper.

    Args:
      url: Where to fetch the blob on GCS. Must start with "gs://". This must
        be a python str or a ComputedObject that returns an ee.String.
    """
    self.initialize()

    if isinstance(url, computedobject.ComputedObject):
      if self.is_func_returning_same(url):
        # If it is a call that is already returning a Blob, just cast.
        super().__init__(url.func, url.args, url.varName)
        return

      super().__init__(apifunction.ApiFunction(self.name()), {'url': url})
      return

    if not isinstance(url, str):
      raise ValueError(
          f'{self.name()} url must be a string: {type(url)} -> "{url}"'
      )
    if not url.startswith('gs://'):
      raise ValueError(f'{self.name()} url must start with "gs://": "{url}"')

    args: Dict[str, Any] = {'url': url}
    func = apifunction.ApiFunction(self.name())
    super().__init__(func, args)

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
    return 'Blob'
