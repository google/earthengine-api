"""A wrapper for Joins."""

from __future__ import annotations

from typing import Optional

from ee import _arg_types
from ee import apifunction
from ee import computedobject
from ee import featurecollection


class Join(computedobject.ComputedObject):
  """An object to represent an Earth Engine Join.

  Example:
    fc1 = ee.FeatureCollection([
        ee.Feature(None, {'label': 1}),
        ee.Feature(None, {'label': 2}),
    ])
    fc2 = ee.FeatureCollection([
        ee.Feature(None, {'label': 1}),
        ee.Feature(None, {'label': 3}),
    ])
    a_filter = ee.Filter.equals(leftField='label', rightField='label')
    join = ee.Join.simple()
    joined = join.apply(fc1, fc2, a_filter)
  """

  _initialized: bool = False

  def __init__(
      self,
      join: computedobject.ComputedObject,
  ):
    """Creates a Join wrapper.

    Args:
      join: A join to cast.
    """
    self.initialize()

    if isinstance(join, computedobject.ComputedObject):
      # There is no server-side constructor for ee.Join. Pass the object as-is
      # to the server in case it is intended to be a Join cast.
      super().__init__(join.func, join.args, join.varName)
      return

    raise TypeError(
        f'Join can only be used as a cast to Join. Found {type(join)}.')

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
    return 'Join'

  def apply(
      self,
      primary: _arg_types.FeatureCollection,
      secondary: _arg_types.FeatureCollection,
      condition: _arg_types.Filter,
  ) -> featurecollection.FeatureCollection:
    """Joins two collections.

    Args:
      primary: The primary collection.
      secondary: The secondary collection.
      condition: The join condition used to select the matches from the two
        collections.

    Returns:
      An ee.FeatureCollection.
    """

    return apifunction.ApiFunction.call_(
        self.name() + '.apply', self, primary, secondary, condition
    )

  @staticmethod
  def inner(
      # pylint: disable=invalid-name
      primaryKey: Optional[_arg_types.String] = None,
      secondaryKey: Optional[_arg_types.String] = None,
      measureKey: Optional[_arg_types.String] = None,
      # pylint: enable=invalid-name
  ) -> Join:
    """Returns a join with matching pairs of elements.

    Returns a join that pairs elements from the primary collection with matching
    elements from the secondary collection.

    Each result has a 'primary' property that contains the element from the
    primary collection, and a 'secondary' property containing the matching
    element from the secondary collection. If measureKey is specified, the join
    measure is also attached to the object as a property.

    Args:
      primaryKey: The property name used to save the primary match.
      secondaryKey: The property name used to save the secondary match.
      measureKey: An optional property name used to save the measure of the join
        condition.
    """

    return apifunction.ApiFunction.call_(
        'Join.inner', primaryKey, secondaryKey, measureKey
    )

  @staticmethod
  def inverted() -> Join:
    """Returns a join producing only elements not in the secondary collection.

    Returns a join that produces the elements of the primary collection that
    match no elements of the secondary collection. No properties are added to
    the results.
    """

    return apifunction.ApiFunction.call_('Join.inverted')

  @staticmethod
  def saveAll(
      # pylint: disable-next=invalid-name
      matchesKey: Optional[_arg_types.String] = None,
      ordering: Optional[_arg_types.String] = None,
      ascending: Optional[_arg_types.Bool] = None,
      # pylint: disable-next=invalid-name
      measureKey: Optional[_arg_types.String] = None,
      outer: Optional[_arg_types.Bool] = None,
  ) -> Join:
    """Returns a join that returns all pairs of elements.

    Returns a join that pairs each element from the first collection with a
    group of matching elements from the second collection.

    The list of matches is added to each result as an additional property. If
    measureKey is specified, each match has the value of its join measure
    attached. Join measures are produced when withinDistance or maxDifference
    filters are used as the join condition.

    Args:
      matchesKey: The property name used to save the matches list.
      ordering: The property on which to sort the matches list.
      ascending: Whether the ordering is ascending.
      measureKey: An optional property name used to save the measure of the join
        condition on each match.
      outer: If true, primary rows without matches will be included in the
        result.
    """

    return apifunction.ApiFunction.call_(
        'Join.saveAll', matchesKey, ordering, ascending, measureKey, outer
    )

  @staticmethod
  def saveBest(
      matchKey: _arg_types.String,  # pylint: disable=invalid-name
      measureKey: _arg_types.String,  # pylint: disable=invalid-name
      outer: Optional[_arg_types.Bool] = None,
  ) -> Join:
    """Returns a join that returns the best match pairs.

    Returns a join that pairs each element from the first collection with a
    matching element from the second collection. The match with the best join
    measure is added to each result as an additional property. Join measures are
    produced when withinDistance or maxDifference filters are used as the join
    condition.

    Args:
      matchKey: The key used to save the match.
      measureKey: The key used to save the measure of the join condition on the
        match.
      outer: If true, primary rows without matches will be included in the
        result.
    """

    return apifunction.ApiFunction.call_(
        'Join.saveBest', matchKey, measureKey, outer
    )

  @staticmethod
  def saveFirst(
      matchKey: _arg_types.String,  # pylint: disable=invalid-name
      ordering: Optional[_arg_types.String] = None,
      ascending: Optional[_arg_types.Bool] = None,
      # pylint: disable-next=invalid-name
      measureKey: Optional[_arg_types.String] = None,
      outer: Optional[_arg_types.Bool] = None,
  ) -> Join:
    """Returns a join that returns the first match pairs.

    Returns a join that pairs each element from the first collection with a
    matching element from the second collection. The first match is added to the
    result as an additional property.

    Args:
      matchKey: The property name used to save the match.
      ordering: The property on which to sort the matches before selecting the
        first.
      ascending: Whether the ordering is ascending.
      measureKey: An optional property name used to save the measure of the join
        condition on the match.
      outer: If true, primary rows without matches will be included in the
        result.
    """

    return apifunction.ApiFunction.call_(
        'Join.saveFirst', matchKey, ordering, ascending, measureKey, outer
    )

  @staticmethod
  def simple() -> Join:
    """Returns a join that returns match pairs.

    Returns a join that produces the elements of the primary collection that
    match any element of the secondary collection. No properties are added to
    the results.
    """

    return apifunction.ApiFunction.call_('Join.simple')
