"""Base class for Image, Feature and Collection.

This class is never intended to be instantiated by the user.
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Union

from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import ee_exception


class Element(computedobject.ComputedObject):
  """Base class for ImageCollection and FeatureCollection."""

  _initialized = False

  # pylint: disable-next=useless-parent-delegation
  @_utils.accept_opt_prefix('opt_varName')
  def __init__(
      self,
      func: Optional[apifunction.ApiFunction],
      args: Optional[Dict[str, Any]],
      varName: Optional[str] = None,  # pylint: disable=g-bad-name
  ):
    """Constructs a collection by initializing its ComputedObject."""
    super().__init__(func, args, varName)

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
    return 'Element'

  def set(
      self,
      *args: Union[Dict[str, Any], float, str, computedobject.ComputedObject],
  ) -> Element:
    """Overrides one or more metadata properties of an Element.

    Args:
      *args: Either a dictionary of properties, or a vararg sequence of
          properties, e.g. key1, value1, key2, value2, ...

    Returns:
      The element with the specified properties overridden.
    """
    if len(args) == 1:
      properties = args[0]

      # If this is a keyword call, unwrap it.
      if (isinstance(properties, dict) and
          (len(properties) == 1 and 'properties' in properties) and
          isinstance(properties['properties'],
                     (dict, computedobject.ComputedObject))):
        # Looks like a call with keyword parameters. Extract them.
        properties = properties['properties']

      if isinstance(properties, dict):
        # Still a plain object. Extract its keys. Setting the keys separately
        # allows filter propagation.
        result = self
        for key, value in properties.items():
          result = apifunction.ApiFunction.call_(
              'Element.set', result, key, value)
      elif (isinstance(properties, computedobject.ComputedObject) and
            apifunction.ApiFunction.lookupInternal('Element.setMulti')):
        # A computed dictionary. Can't set each key separately.
        result = apifunction.ApiFunction.call_(
            'Element.setMulti', self, properties)
      else:
        raise ee_exception.EEException(
            'When Element.set() is passed one argument, '
            'it must be a dictionary.')
    else:
      # Interpret as key1, value1, key2, value2, ...
      if len(args) % 2 != 0:
        raise ee_exception.EEException(
            'When Element.set() is passed multiple arguments, there '
            'must be an even number of them.')
      result = self
      for i in range(0, len(args), 2):
        key = args[i]
        value = args[i + 1]
        result = apifunction.ApiFunction.call_(
            'Element.set', result, key, value)

    # Manually cast the result to an image.
    return self._cast(result)
