# Copyright 2012 Google Inc. All Rights Reserved.

"""Collection filters."""



# Using old-style python function naming on purpose to match the
# javascript version's naming.
# pylint: disable-msg=C6003,C6409

import functools
import time

import featurecollection
import serializer


class Operators(object):
  """A simple enumeration of filter operators."""
  EQUALS = 'equals'
  NOT_EQUALS = 'not_equals'
  LESS_THAN = 'less_than'
  LESS_THAN_OR_EQUAL = 'not_greater_than'
  GREATER_THAN = 'greater_than'
  GREATER_THAN_OR_EQUAL = 'not_less_than'
  CONTAINS = 'contains'
  NOT_CONTAINS = 'not_contains'
  STARTS_WITH = 'starts_with'
  NOT_STARTS_WITH = 'not_starts_with'
  ENDS_WITH = 'ends_with'
  NOT_ENDS_WITH = 'not_ends_with'
  OR = 'or'
  AND = 'and'


class _FilterAutoCreator(object):
  """A decorator to make Filter methods both static and instance.

  If the decorated method is called as a static method, a new empty Filter
  instance is created automatically.
  """

  def __init__(self, func):
    self.func = func

  def __get__(self, filter_instance, cls=None):
    if filter_instance is None:
      filter_instance = Filter()
    return functools.partial(self.func, filter_instance)


class Filter(object):
  """An object to help construct collection filters."""

  Operators = Operators

  def __init__(self, new_filter=None):
    """Construct a filter.

    This constuctor accepts the following args:
        1) Another filter.
        2) An array of filters (which are implicitly ANDed together)
        3) A JSON representation of a filter.   Users shouldn't be making
           these, they're produced by the generator functions below.

    Args:
      new_filter: Optional filter to add.
    """
    if isinstance(new_filter, Filter):
      self._filter = list(new_filter._filter)  # pylint: disable-msg=W0212
    elif isinstance(new_filter, list):
      self._filter = new_filter
    elif new_filter:
      self._filter = [new_filter]
    else:
      self._filter = []

  def __eq__(self, other):
    return self._filter == other._filter       # pylint: disable-msg=W0212

  def __ne__(self, other):
    return self._filter != other._filter       # pylint: disable-msg=W0212

  def predicateCount(self):
    """Return the number of predicates that have been added to this filter.

    Returns:
      The number of predicates that have been added to this filter.
      This does not count nested predicates.
    """
    return len(self._filter)

  def _append(self, new_filter):
    """Append a predicate to this filter.

    These are implicitly ANDed.

    Args:
      new_filter: The filter to append to this one.  Possible types are:
          1) another fully constructed Filter,
          2) a JSON representation of a filter,
          3) an array of 1 or 2.

    Returns:
      The modified filter.
    """
    if new_filter is not None:
      prev = list(self._filter)
      if isinstance(new_filter, Filter):
        prev.extend(new_filter._filter)     # pylint: disable-msg=W0212
      elif isinstance(new_filter, list):
        prev.extend(new_filter)
      else:
        prev.append(new_filter)
    return Filter(prev)

  @_FilterAutoCreator
  def metadata_(self, name, operator, value):
    """Filter on metadata.

    Args:
      name: The property name to filter on.
      operator: The type of comparison.  One of the operators in
          the Operators enumeration.
      value: The value to compare against.

    Returns:
      The modified filter.
    """
    new_filter = {'property': name}
    new_filter[operator] = value
    return self._append(new_filter)

  @_FilterAutoCreator
  def eq(self, name, value):
    """Filter to metadata equal to the given value."""
    return self.metadata_(name, Operators.EQUALS, value)

  @_FilterAutoCreator
  def neq(self, name, value):
    """Filter to metadata not equal to the given value."""
    return self.metadata_(name, Operators.NOT_EQUALS, value)

  @_FilterAutoCreator
  def lt(self, name, value):
    """Filter to metadata less than the given value."""
    return self.metadata_(name, Operators.LESS_THAN, value)

  @_FilterAutoCreator
  def gte(self, name, value):
    """Filter on metadata greater than or equal to the given value."""
    return self.metadata_(name, Operators.GREATER_THAN_OR_EQUAL, value)

  @_FilterAutoCreator
  def gt(self, name, value):
    """Filter on metadata greater than the given value."""
    return self.metadata_(name, Operators.GREATER_THAN, value)

  @_FilterAutoCreator
  def lte(self, name, value):
    """Filter on metadata less than or equal to the given value."""
    return self.metadata_(name, Operators.LESS_THAN_OR_EQUAL, value)

  @_FilterAutoCreator
  def contains(self, name, value):
    """Filter on metadata containing the given string."""
    return self.metadata_(name, Operators.CONTAINS, value)

  @_FilterAutoCreator
  def not_contains(self, name, value):
    """Filter on metadata not containing the given string."""
    return self.metadata_(name, Operators.NOT_CONTAINS, value)

  @_FilterAutoCreator
  def starts_with(self, name, value):
    """Filter on metadata begining with the given string."""
    return self.metadata_(name, Operators.STARTS_WITH, value)

  @_FilterAutoCreator
  def not_starts_with(self, name, value):
    """Filter on metadata not begining with the given string."""
    return self.metadata_(name, Operators.NOT_STARTS_WITH, value)

  @_FilterAutoCreator
  def ends_with(self, name, value):
    """Filter on metadata ending with the given string."""
    return self.metadata_(name, Operators.ENDS_WITH, value)

  @_FilterAutoCreator
  def not_ends_with(self, name, value):
    """Filter on metadata not ending with the given string."""
    return self.metadata_(name, Operators.NOT_ENDS_WITH, value)

  @_FilterAutoCreator
  def And(self, *args):
    """Combine two or more filters using boolean AND."""
    return self._append({'and': list(args)})

  @_FilterAutoCreator
  def Or(self, *args):
    """Combine two or more filters using boolean OR."""
    return self._append({'or': list(args)})

  @_FilterAutoCreator
  def date(self, start, opt_end=None):
    """Filter images by date.

    Args:
      start: The start date as a UTC datetime or ms since Unix epoch.
      opt_end: The end date as a UTC datetime or ms since Unix epoch.

    Returns:
      The modified filter.
    """

    def toMsec(utc_dt):
      if isinstance(utc_dt, (int, long, float)):
        return long(utc_dt)
      else:
        return time.mktime(utc_dt.timetuple()) * 1000

    new_filter = {
        'property': 'system:time_start',
        'not_less_than': toMsec(start)
        }

    if opt_end is not None:
      new_filter = [new_filter, {
          'property': 'system:time_start',
          'not_greater_than': toMsec(opt_end)
          }]

    return self._append(new_filter)

  @_FilterAutoCreator
  def geometry(self, geometry):
    """Filter on bounds.

    Items in the collection with a footprint that fails to intersect
    the bounds will be excluded when the collection is evaluated.

    Args:
      geometry: The geometry to filter to either as a GeoJSON geometry,
          or a FeatureCollection, from which a geometry will be extracted.

    Returns:
      The modified filter.
    """
    if isinstance(geometry, featurecollection.FeatureCollection):
      geometry = {
          'algorithm': 'ExtractGeometry',
          'collection': geometry
          }
    return self._append({'geometry': geometry})

  def serialize(self, opt_pretty=True):
    """Serialize this object into a JSON string.

    Args:
      opt_pretty: A flag indicating whether to pretty-print the JSON.

    Returns:
      A JSON represenation of this image.
    """
    return serializer.toJSON(self._filter, opt_pretty)

  def __str__(self):
    """Writes out the filter in a human-readable form."""
    return 'Filter(%s)' % serializer.toJSON(self._filter)

  def __repr__(self):
    """Writes out the filter in an eval-able form."""
    return 'ee.Filter(%s)' % self._filter
