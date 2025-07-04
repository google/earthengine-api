"""A wrapper for dictionaries."""
from __future__ import annotations

from typing import Any, Optional, Union

from ee import _arg_types
from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import ee_array
from ee import ee_list
from ee import ee_number
from ee import ee_string
from ee import geometry
from ee import image

# bool, float, and int are automatically converted to ee.String for keys.
_EeKeyType = Union[bool, float, int, str, computedobject.ComputedObject]
# TODO: Make a better type for a list of keys.
_EeKeyListType = Any
# TODO: Make a better type for a list of strings.
#   Or is this the same as _EeKeyListType?
_StringListType = Union[Any, computedobject.ComputedObject]


class Dictionary(computedobject.ComputedObject):
  """An object to represent dictionaries."""

  _dictionary: Optional[dict[Any, Any]]

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(self, arg: Optional[_arg_types.Dictionary] = None):
    """Construct a dictionary.

    Args:
      arg: This constructor accepts the following args:
        1) Another dictionary.
        2) A list of key/value pairs.
        3) A null or no argument (producing an empty dictionary)
    """
    self.initialize()

    if isinstance(arg, dict):
      super().__init__(None, None)
      self._dictionary = arg
    else:
      self._dictionary = None
      if self.is_func_returning_same(arg):
        # If it's a call that's already returning a Dictionary, just cast.
        assert isinstance(arg, computedobject.ComputedObject)
        super().__init__(arg.func, arg.args, arg.varName)
      else:
        # Delegate everything else to the server-side constructor.
        super().__init__(apifunction.ApiFunction(self.name()), {'input': arg})

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
    return 'Dictionary'

  @_utils.accept_opt_prefix('opt_encoder')
  def encode(self, encoder=None):
    if self._dictionary is not None:
      return encoder(self._dictionary)
    else:
      return super().encode(encoder)

  @_utils.accept_opt_prefix('opt_encoder')
  def encode_cloud_value(self, encoder=None):
    if self._dictionary is not None:
      return {'valueReference': encoder(self._dictionary)}
    else:
      return super().encode_cloud_value(encoder)

  def combine(
      self,
      second: _arg_types.Dictionary,
      overwrite: Optional[_arg_types.Bool] = None,
  ) -> Dictionary:
    """Combines two dictionaries.

    In the case of duplicate key names, the output will contain the value of the
    second dictionary unless overwrite is false. Null values in both
    dictionaries are ignored / removed.

    Args:
      second: The other dictionary to merge in.
      overwrite: If true, this keeps the value of the original dictionary.
        Defaults to true.

    Returns:
      An ee.Dictionary.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.combine', self, second, overwrite
    )

  def contains(self, key: _arg_types.String) -> computedobject.ComputedObject:
    """Returns true if the dictionary contains the given key.

    Args:
      key: A string to look for in the dictionary.

    Returns:
      An ee.Boolean.
    """

    return apifunction.ApiFunction.call_(self.name() + '.contains', self, key)

  # TODO: keys should be a _StringListType.
  @staticmethod
  def fromLists(keys: _arg_types.List, values: _arg_types.List) -> Dictionary:
    """Returns a dictionary from two parallel lists of keys and values.

    Args:
      keys: A list of keys.
      values: A list of values.
    """

    return apifunction.ApiFunction.call_('Dictionary.fromLists', keys, values)

  def get(
      self,
      key: _EeKeyType,
      # pylint: disable-next=invalid-name
      defaultValue: Optional[_arg_types.Any] = None,
  ) -> computedobject.ComputedObject:
    """Extracts a named value from a dictionary.

    If the dictionary does not contain the given key, then defaultValue is
    returned, unless it is null.

    Args:
      key: A string to look for in the dictionary.
      defaultValue: The value to return if the key is not found.

    Returns:
      Returns an ee.ComputedObject.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.get', self, key, defaultValue
    )

  def getArray(self, key: _EeKeyType) -> ee_array.Array:
    """Extracts a named array value from a dictionary.

    Args:
      key: A string to look for in the dictionary.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.getArray', self, key)

  def getGeometry(self, key: _EeKeyType) -> geometry.Geometry:
    """Extracts a named geometry value from a dictionary.

    Args:
      key: A string to look for in the dictionary.

    Returns:
      An ee.Geometry.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.getGeometry', self, key
    )

  def getNumber(self, key: _EeKeyType) -> ee_number.Number:
    """Extracts a named number value from a dictionary.

    Args:
      key: A string to look for in the dictionary.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(self.name() + '.getNumber', self, key)

  def getString(self, key: _EeKeyType) -> ee_string.String:
    """Extracts a named string value from a dictionary.

    Args:
      key: A string to look for in the dictionary.

    Returns:
      An ee.String.
    """

    return apifunction.ApiFunction.call_(self.name() + '.getString', self, key)

  def keys(self) -> ee_list.List:
    """Retrieve the keys of a dictionary as a list."""

    return apifunction.ApiFunction.call_(self.name() + '.keys', self)

  # pylint: disable-next=invalid-name
  def map(self, baseAlgorithm: _arg_types.Any) -> Dictionary:
    """Map an algorithm over a dictionary.

    The algorithm is expected to take 2 arguments, a key from the existing
    dictionary and the value it corresponds to, and return a new value for the
    given key. If the algorithm returns null, the key is dropped.

    Args:
      baseAlgorithm: A function taking key, value and returning the new value.

    Returns:
      An ee.Dictionary with new values for each key.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.map', self, baseAlgorithm
    )

  def remove(
      self,
      selectors: _arg_types.Any,
      # pylint: disable-next=invalid-name
      ignoreMissing: Optional[_arg_types.Bool] = None,
  ) -> Dictionary:
    """Returns a dictionary with the specified keys removed.

    Args:
      selectors: A list of key names or regular expressions of key names to
        remove.
      ignoreMissing: Ignore selectors that don't match at least 1 key. Defaults
        to false.

    Returns:
      An ee.Dictionary.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.remove', self, selectors, ignoreMissing
    )

  # TODO: Make a tighter method signature.
  # pylint: disable-next=g-doc-args
  def rename(self, *args, **kwargs) -> Dictionary:
    """Rename elements in a dictionary.

    Args:
      from: A list of keys to be renamed.
      to: A list of the new names for the keys listed in the 'from' parameter.
        Must have the same length as the 'from' list.
      overwrite: Allow overwriting existing properties with the same name.

    Returns:
      An ee.Dictionary.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.rename', self, *args, **kwargs
    )

  def select(
      self,
      selectors: _arg_types.Any,
      # pylint: disable-next=invalid-name
      ignoreMissing: Optional[_arg_types.Bool] = None,
  ) -> Dictionary:
    """Returns a dictionary with only the specified keys.

    Args:
      selectors: A list of keys or regular expressions to select.
      ignoreMissing: Ignore selectors that don't match at least 1 key.
        Defaults to false.

    Returns:
      An ee.Dictionary.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.select', self, selectors, ignoreMissing
    )

  def set(self, key: _EeKeyType, value: _arg_types.Any) -> Dictionary:
    """Set a value in a dictionary.

    Args:
      key: A string for where to set the value. Does not need to already exist.
      value: The value to set for the key.

    Returns:
      An ee.Dictionary.
    """

    return apifunction.ApiFunction.call_(self.name() + '.set', self, key, value)

  def size(self) -> ee_number.Number:
    """Returns the number of entries in a dictionary."""

    return apifunction.ApiFunction.call_(self.name() + '.size', self)

  def toArray(
      self,
      keys: Optional[_EeKeyListType] = None,
      axis: Optional[_arg_types.Integer] = None,
  ) -> ee_array.Array:
    """Returns numeric values of a dictionary as an array.

    If no keys are specified, all values are returned in the natural ordering of
    the dictionary's keys. The default 'axis' is 0.

    Args:
      keys: An optional list of keys to subselect.
      axis: How to interpret values that are ee.Arrays. Defaults to 0.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.toArray', self, keys, axis
    )

  def toImage(self, names: Optional[_arg_types.Any] = None) -> image.Image:
    """Creates an image of constants from values in a dictionary.

    The bands of the image are ordered and named according to the names
    argument. If no names are specified, the bands are sorted
    alpha-numerically.

    Args:
      names: The order of the output bands.

    Returns:
      An ee.Image.
    """

    return apifunction.ApiFunction.call_(self.name() + '.toImage', self, names)

  def values(self, keys: Optional[_EeKeyListType] = None) -> ee_list.List:
    """Returns the values of a dictionary as a list.

    If no keys are specified, all values are returned in the natural ordering of
    the dictionary's keys.

    Args:
      keys: An optional list of keys to subselect.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.values', self, keys)
