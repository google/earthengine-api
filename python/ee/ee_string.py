"""A wrapper for strings."""
from __future__ import annotations

from typing import Any

from ee import _arg_types
from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import ee_exception
from ee import ee_list
from ee import ee_number


class String(computedobject.ComputedObject):
  """An object to represent strings."""

  _string: str | None

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(self, string: _arg_types.String):
    """Construct a string wrapper.

    This constructor accepts the following args:
      1) A bare string.
      2) A ComputedObject returning a string.

    Args:
      string: The string to wrap.
    """
    self.initialize()

    if isinstance(string, str):
      super().__init__(None, None)
      self._string = string

    elif isinstance(string, computedobject.ComputedObject):
      if self.is_func_returning_same(string):
        # If it's a call that's already returning a String, just cast.
        super().__init__(string.func, string.args, string.varName)
      else:
        super().__init__(
            apifunction.ApiFunction(self.name()), {'input': string}
        )
      self._string = None
    else:
      raise ee_exception.EEException(
          'Invalid argument specified for ee.String(): %s' % string)

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
    return 'String'

  @_utils.accept_opt_prefix('opt_encoder')
  def encode(self, encoder: Any = None) -> Any:
    if isinstance(self._string, str):
      return self._string
    else:
      return super().encode(encoder)

  @_utils.accept_opt_prefix('opt_encoder')
  def encode_cloud_value(self, encoder: Any = None) -> Any:
    if isinstance(self._string, str):
      return {'constantValue': self._string}
    else:
      return super().encode_cloud_value(encoder)

  def cat(self, string2: _arg_types.String) -> String:
    """Concatenates two strings.

    Args:
      string2: The second string.

    Returns:
      Returns the result of joining self and string2.
    """

    return apifunction.ApiFunction.call_(self.name() + '.cat', self, string2)

  def compareTo(self, string2: _arg_types.String) -> ee_number.Number:
    """Compares two strings lexicographically.

    Args:
      string2: The string to be compared.

    Returns:
      0 if the two strings are lexicographically equal;
      -1 if string1 is less than string2; and
      1 if string1 is greater than string2.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.compareTo', self, string2
    )

  def decodeJSON(self) -> computedobject.ComputedObject:
    """Decodes self as a JSON string."""

    return apifunction.ApiFunction.call_(self.name() + '.decodeJSON', self)

  @staticmethod
  def encodeJSON(object: _arg_types.Any) -> String:
    """Returns an ee.String with an object encoded as JSON.

    Supports primitives, lists, and dictionaries.

    Args:
      object: The object to encode.
    """

    return apifunction.ApiFunction.call_('String.encodeJSON', object)

  def equals(self, target: _arg_types.String) -> computedobject.ComputedObject:
    """Checks for string equality with a given object.

    Args:
      target: The second object to check for equality.

    Returns:
      True if the target is a string and is lexicographically equal to the
      reference, or false otherwise.
    """

    return apifunction.ApiFunction.call_(self.name() + '.equals', self, target)

  def index(self, pattern: _arg_types.String) -> ee_number.Number:
    """Searches a string for the first occurrence of a substring.

    Args:
      pattern: The string to find.

    Returns:
      The index of the first match, or -1.
    """

    return apifunction.ApiFunction.call_(self.name() + '.index', self, pattern)

  def length(self) -> ee_number.Number:
    """Returns the length of a string."""

    return apifunction.ApiFunction.call_(self.name() + '.length', self)

  def match(
      self, regex: _arg_types.String, flags: _arg_types.String | None = None
  ) -> ee_list.List:
    """Matches a string against a regular expression.

    Args:
      regex: The regular expression to match.
      flags: A string specifying a combination of regular expression flags,
        specifically one or more of: 'g' (global match) or 'i' (ignore case)

    Returns:
      A list of matching strings.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.match', self, regex, flags
    )

  def replace(
      self,
      regex: _arg_types.String,
      replacement: _arg_types.String,
      flags: _arg_types.String | None = None,
  ) -> String:
    """Returns a string with some or all matches of a pattern replaced.

    Args:
      regex: The regular expression to match.
      replacement: The string that replaces the matched substring.
      flags: A string specifying a combination of regular expression flags,
        specifically one or more of: 'g' (global match) or 'i' (ignore case).

    Returns:
      A string with the replacements.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.replace', self, regex, replacement, flags
    )

  def rindex(self, pattern: _arg_types.String) -> ee_number.Number:
    """Searches a string for the last occurrence of a substring.

    Args:
      pattern: The string to find.

    Returns:
      The index of the first match or -1 if no match.
    """

    return apifunction.ApiFunction.call_(self.name() + '.rindex', self, pattern)

  def slice(
      self, start: _arg_types.Integer, end: _arg_types.Integer | None = None
  ) -> String:
    """Returns a substring of the given string.

    If the specified range exceeds the length of the string, returns a shorter
    substring.

    Args:
      start: The beginning index, inclusive. Negative numbers count backwards
        from the end of the string.
      end: The ending index, exclusive. Defaults to the length of the string.
        Negative numbers count backwards from the end of the string.

    Returns:
      The requested portion of the string.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.slice', self, start, end
    )

  def split(
      self, regex: _arg_types.String, flags: _arg_types.String | None = None
  ) -> ee_list.List:
    """Splits a string on a regular expression into a list of strings.

    Args:
      regex: A regular expression to split on. If regex is the empty string,
        then the input string is split into individual characters.
      flags: A string specifying the regular expression flag: 'i' (ignore case)

    Returns:
      A list of strings.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.split', self, regex, flags
    )

  def toLowerCase(self) -> String:
    """Converts all of the characters in a string to lower case."""

    return apifunction.ApiFunction.call_(self.name() + '.toLowerCase', self)

  def toUpperCase(self) -> String:
    """Converts all of the characters in a string to upper case."""

    return apifunction.ApiFunction.call_(self.name() + '.toUpperCase', self)

  def trim(self) -> String:
    """Returns a string with any leading and trailing whitespace removed."""

    return apifunction.ApiFunction.call_(self.name() + '.trim', self)
