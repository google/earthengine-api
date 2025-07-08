"""A wrapper for lists."""
from __future__ import annotations

from typing import Any

from ee import _arg_types
from ee import _utils
from ee import apifunction
from ee import computedobject
from ee import ee_array
from ee import ee_exception
from ee import ee_number
from ee import ee_string
from ee import filter as ee_filter
from ee import geometry


class List(computedobject.ComputedObject):
  """An object to represent lists."""
  _list: None | (
      list[Any] | tuple[Any, Any]
  )

  _initialized = False

  # Tell pytype to not complain about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES = True

  def __init__(self, arg: _arg_types.List | None):
    """Construct a list wrapper.

    This constructor accepts the following args:
      1) A bare list.
      2) A ComputedObject returning a list.

    Args:
      arg: The list to wrap.

    Raises:
      ee_exception.EEException: On bad input.
    """
    self.initialize()

    if isinstance(arg, (list, tuple)):
      super().__init__(None, None)
      self._list = arg  # pytype: disable=annotation-type-mismatch
    elif isinstance(arg, computedobject.ComputedObject):
      super().__init__(arg.func, arg.args, arg.varName)
      self._list = None
    else:
      raise ee_exception.EEException(
          'Invalid argument specified for ee.List(): %s' % arg)

  @staticmethod
  def repeat(value: _arg_types.Any, count: _arg_types.Integer) -> List:
    """Returns a new list containing value repeated count times.

    Args:
      value: The value to repeat.
      count: The number of times to repeat the value.
    """
    return apifunction.ApiFunction.call_('List.repeat', value, count)

  @staticmethod
  def sequence(
      start: _arg_types.Number,
      end: _arg_types.Number | None = None,
      step: _arg_types.Number | None = None,
      count: _arg_types.Integer | None = None,
  ) -> List:
    """Returns a List of numbers from start to end (inclusive).

    Generate a sequence of numbers from start to end (inclusive) in increments
    of step, or in count equally-spaced increments. If end is not specified it
    is computed from start + step * count, so at least one of end or count must
    be specified.

    Args:
      start: The starting number.
      end: The ending number.
      step: The increment.
      count: The number of increments.
    """

    return apifunction.ApiFunction.call_(
        'List.sequence', start, end, step, count
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
    return 'List'

  @_utils.accept_opt_prefix('opt_encoder')
  def encode(self, encoder: Any | None = None) -> Any:
    if isinstance(self._list, (list, tuple)):
      assert self._list is not None
      return [encoder(elem) for elem in self._list]
    else:
      return super().encode(encoder)

  @_utils.accept_opt_prefix('opt_encoder')
  def encode_cloud_value(self, encoder: Any | None = None) -> Any:
    if isinstance(self._list, (list, tuple)):
      return {'valueReference': encoder(self._list)}
    else:
      return super().encode_cloud_value(encoder)

  def add(self, element: Any) -> List:
    """Appends the element to the end of list.

    Args:
      element: The object to add.

    Returns:
      An ee.List with the element added to the end.
    """

    return apifunction.ApiFunction.call_(self.name() + '.add', self, element)

  def cat(self, other: _arg_types.List) -> List:
    """Concatenates the contents of other onto list.

    Args:
      other: Another list to add to the end of the list.

    Returns:
      An ee.List with the elements of the original list followed by the elements
      of other.
    """

    return apifunction.ApiFunction.call_(self.name() + '.cat', self, other)

  def contains(self, element: Any) -> computedobject.ComputedObject:
    """Returns true if list contains element.

    Args:
      element: An object to test for presence in the list.

    Returns:
      Returns a Boolean ComputedObject. True if the list has the element. False
      if the element is not in the list.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.contains', self, element
    )

  def containsAll(
      self, other: _arg_types.List
  ) -> computedobject.ComputedObject:
    """Returns true if list contains all of the elements of other.

    The results are independent of the order.

    Args:
      other: A list of elements to check for presence in the list.

    Returns:
      Boolean ComputedObject. True if the list has all of the elements of other.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.containsAll', self, other
    )

  def distinct(self) -> List:
    """Returns a copy of list without duplicate elements."""

    return apifunction.ApiFunction.call_(self.name() + '.distinct', self)

  def equals(self, other: _arg_types.List) -> computedobject.ComputedObject:
    """Returns true if the list contains in order the same elements as other.

    Args:
      other: List to compare to.

    Returns:
      Boolean ComputedObject.
    """

    return apifunction.ApiFunction.call_(self.name() + '.equals', self, other)

  # pylint: disable-next=redefined-builtin
  def filter(self, filter: ee_filter.Filter) -> List:
    """Filters a list to only the elements that match the given filter.

    To filter list items that aren't images or features, test a property
    named 'item', e.g., ee.Filter.gt('item', 3).

    Args:
      filter: The ee.Filter instance to apply.

    Returns:
      An ee.List with only the elements that pass the filter.
    """

    return apifunction.ApiFunction.call_(self.name() + '.filter', self, filter)

  def flatten(self) -> List:
    """Flattens any sublists into a single list."""

    return apifunction.ApiFunction.call_(self.name() + '.flatten', self)

  def frequency(self, element: Any) -> ee_number.Number:
    """Returns the number of elements in list equal to element.

    Args:
      element: The value to match against.

    Returns:
      Returns the count of elements that match element.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.frequency', self, element
    )

  def get(self, index: _arg_types.Integer) -> computedobject.ComputedObject:
    """Returns the element at the specified position in list.

    Args:
      index: Offset from where to get the element. A negative index counts
        backwards from the end of the list.

    Returns:
      An ee.ComputedObject.
    """

    return apifunction.ApiFunction.call_(self.name() + '.get', self, index)

  def getArray(self, index: _arg_types.Integer) -> ee_array.Array:
    """Returns the array at the specified position in list.

    If the value is not a array, an error will occur.

    Args:
      index: Offset from where to get the element. A negative index counts
        backwards from the end of the list.

    Returns:
      An ee.Array.
    """

    return apifunction.ApiFunction.call_(self.name() + '.getArray', self, index)

  def getGeometry(self, index: _arg_types.Integer) -> geometry.Geometry:
    """Returns the geometry at the specified position in list.

    If the value is not a geometry, an error will occur.

    Args:
      index: Offset from where to get the element. A negative index counts
        backwards from the end of the list.

    Returns:
      An ee.Geometry.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.getGeometry', self, index
    )

  def getNumber(self, index: _arg_types.Integer) -> ee_number.Number:
    """Returns the number at the specified position in list.

    If the value is not a number, an error will occur.

    Args:
      index: Offset from where to get the element. A negative index counts
        backwards from the end of the list.

    Returns:
      An ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.getNumber', self, index
    )

  def getString(self, index: _arg_types.Integer) -> ee_string.String:
    """Returns the string at the specified position in list.

    If the value is not a string, an error will occur.

    Args:
      index: Offset from where to get the element. A negative index counts
        backwards from the end of the list.

    Returns:
      An ee.String.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.getString', self, index
    )

  def indexOf(self, element: _arg_types.Any) -> ee_number.Number:
    """Returns the position of the first occurrence of element.

    Returns the position of the first occurrence of target in list, or -1 if
    list does not contain the target.

    Args:
      element: ComputedObject to search for.

    Returns:
      An integer as an ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.indexOf', self, element
    )

  def indexOfSublist(self, target: _arg_types.List) -> ee_number.Number:
    """Returns the position of the first occurrence of target.

    Returns the starting position of the first occurrence of target within list,
    or -1 if there is no such occurrence.

    Args:
      target: An ee.List to search for.

    Returns:
      An integer as an ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.indexOfSublist', self, target
    )

  def insert(self, index: _arg_types.Integer, element: _arg_types.Any) -> List:
    """Inserts element at the specified position in list.

    A negative index counts backwards from the end of the list.

    Args:
      index: Offset from where to get the element. A negative index counts
        backwards from the end of the list.
      element: A ComputedObject to insert.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.insert', self, index, element
    )

  # TODO: Improve the type of `function`
  def iterate(self, function: Any, first: _arg_types.Any) -> List:
    """Iterate an algorithm over a list.

    The algorithm is expected to take two objects, the current list item, and
    the result from the previous iteration or the value of first for the first
    iteration.

    Args:
      function: A function to apply to the list.
      first: The first item to pass the function.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.iterate', self, function, first
    )

  def join(self, separator: _arg_types.String = '') -> ee_string.String:
    """Returns a string with the list elements with the separator between them.

    Returns a string containing the elements of the list joined together with
    the specified separator between elements.

    Note: The string form of list elements which are not strings, numbers, or
    booleans is currently not well-defined and subject to change.

    Args:
      separator: A string to but between elements.

    Returns:
      An ee.String.
    """

    return apifunction.ApiFunction.call_(self.name() + '.join', self, separator)

  def lastIndexOfSubList(self, target: _arg_types.List) -> ee_number.Number:
    """Returns the position of that last instance of target in the list.

    Returns the starting position of the last occurrence of target within list,
    or -1 if there is no such occurrence.

    Args:
      target: A list to search for.

    Returns:
      An integer as an ee.Number.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.lastIndexOfSubList', self, target
    )

  def length(self) -> ee_number.Number:
    """Returns the number of elements in list."""

    return apifunction.ApiFunction.call_(self.name() + '.length', self)

  # TODO: Improve the type of `baseAlgorithm`.
  def map(
      self,
      baseAlgorithm: _arg_types.Any,  # pylint: disable=invalid-name
      dropNulls: _arg_types.Bool = False,
  ) -> List:
    """Map an algorithm over a list.

    The algorithm is expected to take an Object and return an Object.

    Args:
      baseAlgorithm: The function to apply.
      dropNulls: If true, the mapped algorithm is allowed to return nulls, and
        the elements for which it returns nulls will be dropped.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.map', self, baseAlgorithm, dropNulls
    )

  def reduce(
      self, reducer: _arg_types.Reducer
  ) -> computedobject.ComputedObject:
    """Apply a reducer to a list.

    If the reducer takes more than 1 input, then each element in the list is
    assumed to be a list of inputs. If the reducer returns a single output, it
    is returned directly, otherwise returns a dictionary containing the named
    reducer outputs.

    Args:
      reducer: An ee.Reducer instance.

    Returns:
      Return depends on the specific reducer used.
    """

    return apifunction.ApiFunction.call_(self.name() + '.reduce', self, reducer)

  def remove(self, element: _arg_types.Any) -> List:
    """Removes the first occurrence of the specified element from list.

    Args:
      element: The item to remove from the list.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(self.name() + '.remove', self, element)

  def removeAll(self, other: _arg_types.List) -> List:
    """Removes from list all of the elements that are contained in other list.

    Args:
      other: A list of the elements to remove.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.removeAll', self, other
    )

  def replace(self, oldval: _arg_types.Any, newval: _arg_types.Any) -> List:
    """Replaces the first occurrence of oldval in list with newval.

    Args:
      oldval: The value to be replaced.
      newval: The value to be put in place of oldval.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.replace', self, oldval, newval
    )

  def replaceAll(self, oldval: _arg_types.Any, newval: _arg_types.Any) -> List:
    """Replaces all occurrences of oldval in list with newval.

    Args:
      oldval: The value to be replaced.
      newval: The value to be put in place of oldval.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.replaceAll', self, oldval, newval
    )

  def reverse(self) -> List:
    """Reverses the order of the elements in list."""

    return apifunction.ApiFunction.call_(self.name() + '.reverse', self)

  def rotate(self, distance: _arg_types.Integer) -> List:
    """Rotates the elements of the list by the specified distance.

    Elements rotated off the end are pushed onto the other end of the list.

    Args:
      distance: How many positions to shift all the values.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.rotate', self, distance
    )

  def set(self, index: _arg_types.Integer, element: _arg_types.Any) -> List:
    """Sets the value at the specified position in list.

    Replaces the value at the specified position in list with element. A
    negative index counts backwards from the end of the list.

    Args:
      index: Offset from where to get the element. A negative index counts
        backwards from the end of the list.
      element: A ComputedObject to set at the position of index.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.set', self, index, element
    )

  def shuffle(self, seed: _arg_types.Integer | None = None) -> List:
    """Randomly permute the specified list.

    Note that the permutation order will always be the same for any given seed,
    unless the value for seed is false.

    Args:
      seed: A long integer to use as a seed for the randomization. If the
        boolean value of false is passed, then a completely random and
        unreproducible order will be generated.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(self.name() + '.shuffle', self, seed)

  def size(self) -> ee_number.Number:
    """Returns the number of elements in list."""

    return apifunction.ApiFunction.call_(self.name() + '.size', self)

  def slice(
      self,
      start: _arg_types.Integer,
      end: _arg_types.Integer | None = None,
      step: _arg_types.Integer | None = None,
  ) -> List:
    """Returns a range of elements from a list.

    Negative values for start or end count backwards from the end of the list.
    Values greater than the size of the list are valid but are truncated to the
    size of list.

    For start and end, a negative index counts backwards from the end of the
    list.

    Args:
      start: Offset from where to get the elements (inclusive).
      end: Offset from where to stop getting the elements (exclusive).
      step: How many elements to move forward to get the next element.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.slice', self, start, end, step
    )

  def sort(self, keys: _arg_types.List | None = None) -> List:
    """Sorts the list into ascending order.

    If the keys argument is provided, then it is sorted first, and the
    elements of list are placed in the same order.

    Args:
      keys: Optional keys to sort by. If keys is provided, it must have the
        same length as list.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(self.name() + '.sort', self, keys)

  def splice(
      self,
      start: _arg_types.Integer,
      count: _arg_types.Integer,
      other: _arg_types.List | None = None,
  ) -> List:
    """Removes elements from list and replaces with elements from other.

    Args:
      start: Offset from where to begin getting elements. A negative index
        counts backwards from the end of the list.
      count: How many elements to replace.
      other: Elements to put in at the splice location.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.splice', self, start, count, other
    )

  def swap(self, pos1: _arg_types.Integer, pos2: _arg_types.Integer) -> List:
    """Swaps the elements at the specified positions.

    A negative position counts backwards from the end of the list.

    Args:
      pos1: Offset of one element.
      pos2: Offset of the second element.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.swap', self, pos1, pos2
    )

  def unzip(self) -> List:
    """Rearranges a list of lists.

    Transposes a list of lists, extracting the first element of each inner list
    into one list, the second elements into another, etc., up to the length of
    the shortest inner list. The remaining items are discarded. The result is a
    list of lists.

    Returns:
      An ee.List.
    """

    return apifunction.ApiFunction.call_(self.name() + '.unzip', self)

  def zip(self, other: _arg_types.List) -> List:
    """Pairs the elements of two lists to create a list of two-element lists.

    When the input lists are of different sizes, the final list has the same
    size as the shortest one.

    Args:
      other: The list to merge into the current list.

    Returns:
      An ee.List with two elements that are both ee.Lists.
    """

    return apifunction.ApiFunction.call_(self.name() + '.zip', self, other)
