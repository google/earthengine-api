"""Base class for Image, Feature and Collection.

This class is never intended to be instantiated by the user.
"""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import apifunction
import computedobject
import ee_exception


class Element(computedobject.ComputedObject):
  """Base class for ImageCollection and FeatureCollection."""

  _initialized = False

  def __init__(self, func, args):
    """Constructs a collection by initializing its ComputedObject."""
    super(Element, self).__init__(func, args)

  @classmethod
  def initialize(cls):
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, 'Element', 'Element')
      cls._initialized = True

  @classmethod
  def reset(cls):
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  @staticmethod
  def name():
    return 'Element'

  def set(self, *args):
    """Overrides one or more metadata properties of an Element.

    Args:
      *args: Either a dictionary of properties, or a vararg sequence of
          properties, e.g. key1, value1, key2, value2, ...

    Returns:
      The element with the specified properties overridden.
    """
    # TODO(user): Remove fallback once Element.set() is live.
    result = self
    if len(args) == 1:
      properties = args[0]
      if not isinstance(properties, (dict, computedobject.ComputedObject)):
        raise ee_exception.EEException('Element.set() requires a dictionary.')

      # Try to be smart about interpreting the argument.
      if (isinstance(properties, dict) and
          properties.keys() == ['properties'] and
          isinstance(properties['properties'], dict)):
        # Looks like a call with keyword parameters. Extract them.
        properties = properties['properties']
      try:
        for key, value in properties.iteritems():
          result = apifunction.ApiFunction.call_(
              'Element.set', result, key, value)
      except ee_exception.EEException:
        # No Element.set() defined yet. Use Feature.set().
        result = apifunction.ApiFunction.call_(
            'Feature.set', result, properties)
    else:
      # Interpret as key1, value1, key2, value2, ...
      if len(args) % 2 != 0:
        raise ee_exception.EEException(
            'When Element.set() is passed multiple arguments, there '
            'must be an even number of them.')
      try:
        for i in range(0, len(args), 2):
          key = args[i]
          value = args[i + 1]
          result = apifunction.ApiFunction.call_(
              'Element.set', result, key, value)
      except ee_exception.EEException:
        # No Element.set() defined yet. Use Feature.set().
        properties = {}
        for i in range(0, len(args), 2):
          key = args[i]
          value = args[i + 1]
          properties[key] = value
        result = apifunction.ApiFunction.call_(
            'Feature.set', result, properties)

    # Manually cast the result to an image.
    return self._cast(result)
