#!/usr/bin/env python
"""Test for the ee.filter module."""



import datetime

import unittest

import ee
from ee import apitestcase


class FilterTest(apitestcase.ApiTestCase):

  def testConstructors(self):
    """Verifies that constructors understand valid parameters."""
    empty = ee.Filter()
    self.assertEquals(0, empty.predicateCount())

    from_static_method = ee.Filter.gt('foo', 1)
    self.assertEquals(1, from_static_method.predicateCount())

    from_computed_object = ee.Filter(
        ee.ApiFunction.call_('Filter.greaterThan', 'foo', 1))
    self.assertEquals(1, from_computed_object.predicateCount())
    self.assertEquals(from_static_method, from_computed_object)

    copy = ee.Filter(from_static_method)
    self.assertEquals(from_static_method, copy)

  def testAppend(self):
    """Verifies that appending filters with instance methods works."""
    multi_filter = ee.Filter().eq('foo', 1).eq('bar', 2).eq('baz', 3)
    self.assertEquals(3, multi_filter.predicateCount())

  def testMetadata(self):
    """Verifies that the metadata_() method works."""
    self.assertEquals(
        ee.ApiFunction.call_('Filter.equals', 'x', 1),
        ee.Filter.metadata_('x', 'equals', 1))
    self.assertEquals(
        ee.Filter.metadata_('x', 'equals', 1),
        ee.Filter().eq('x', 1))
    self.assertEquals(
        ee.Filter.metadata_('x', 'EQUALS', 1),
        ee.Filter().eq('x', 1))
    self.assertEquals(
        ee.Filter.metadata_('x', 'not_equals', 1),
        ee.Filter().neq('x', 1))
    self.assertEquals(
        ee.Filter.metadata_('x', 'less_than', 1),
        ee.Filter().lt('x', 1))
    self.assertEquals(
        ee.Filter.metadata_('x', 'not_greater_than', 1),
        ee.Filter().lte('x', 1))
    self.assertEquals(
        ee.Filter.metadata_('x', 'greater_than', 1),
        ee.Filter().gt('x', 1))
    self.assertEquals(
        ee.Filter.metadata_('x', 'not_less_than', 1),
        ee.Filter().gte('x', 1))

  def testLogicalCombinations(self):
    """Verifies that the and() and or() methods work."""
    f1 = ee.Filter.eq('x', 1)
    f2 = ee.Filter.eq('x', 2)

    or_filter = ee.Filter.Or(f1, f2)
    self.assertEquals(ee.ApiFunction.call_('Filter.or', (f1, f2)), or_filter)

    and_filter = ee.Filter.And(f1, f2)
    self.assertEquals(ee.ApiFunction.call_('Filter.and', (f1, f2)), and_filter)

    self.assertEquals(
        ee.ApiFunction.call_('Filter.or', (or_filter, and_filter)),
        ee.Filter.Or(or_filter, and_filter))

  def testDate(self):
    """Verifies that date filters work."""
    d1 = datetime.datetime.strptime('1/1/2000', '%m/%d/%Y')
    d2 = datetime.datetime.strptime('1/1/2001', '%m/%d/%Y')
    instant_range = ee.ApiFunction.call_('DateRange', d1, None)
    long_range = ee.ApiFunction.call_('DateRange', d1, d2)

    instant_filter = ee.Filter.date(d1)
    self.assertEquals(ee.ApiFunction.lookup('Filter.dateRangeContains'),
                      instant_filter.func)
    self.assertEquals({'leftValue': instant_range,
                       'rightField': ee.String('system:time_start')},
                      instant_filter.args)

    long_filter = ee.Filter.date(d1, d2)
    self.assertEquals(ee.ApiFunction.lookup('Filter.dateRangeContains'),
                      long_filter.func)
    self.assertEquals({'leftValue': long_range,
                       'rightField': ee.String('system:time_start')},
                      long_filter.args)

  def testBounds(self):
    """Verifies that geometry intersection filters work."""
    polygon = ee.Geometry.Polygon(1, 2, 3, 4, 5, 6)
    self.assertEquals(
        ee.ApiFunction.call_(
            'Filter.intersects', '.all',
            ee.ApiFunction.call_('Feature', polygon)),
        ee.Filter.geometry(polygon))

    # Collection-to-geometry promotion.
    collection = ee.FeatureCollection('foo')
    feature = ee.ApiFunction.call_(
        'Feature', ee.ApiFunction.call_('Collection.geometry', collection))
    self.assertEquals(
        ee.ApiFunction.call_('Filter.intersects', '.all', feature),
        ee.Filter.geometry(collection))

  def testInList(self):
    """Verifies that list membership filters work."""
    self.assertEquals(
        ee.Filter.listContains(None, None, 'foo', [1, 2]),
        ee.Filter.inList('foo', [1, 2]))
    self.assertEquals(
        ee.Filter.inList('foo', [1, 2]),
        ee.Filter().inList('foo', [1, 2]))

  def testStaticVersions(self):
    """Verifies that static filter methods are equivalent to instance ones."""
    self.assertEquals(ee.Filter().eq('foo', 1), ee.Filter.eq('foo', 1))
    self.assertEquals(ee.Filter().neq('foo', 1), ee.Filter.neq('foo', 1))
    self.assertEquals(ee.Filter().lt('foo', 1), ee.Filter.lt('foo', 1))
    self.assertEquals(ee.Filter().gt('foo', 1), ee.Filter.gt('foo', 1))
    self.assertEquals(ee.Filter().lte('foo', 1), ee.Filter.lte('foo', 1))
    self.assertEquals(ee.Filter().gte('foo', 1), ee.Filter.gte('foo', 1))

    self.assertEquals(ee.Filter().contains('foo', 1),
                      ee.Filter.contains('foo', 1))
    self.assertEquals(ee.Filter().not_contains('foo', 1),
                      ee.Filter.not_contains('foo', 1))
    self.assertEquals(ee.Filter().starts_with('foo', 1),
                      ee.Filter.starts_with('foo', 1))
    self.assertEquals(ee.Filter().not_starts_with('foo', 1),
                      ee.Filter.not_starts_with('foo', 1))
    self.assertEquals(ee.Filter().ends_with('foo', 1),
                      ee.Filter.ends_with('foo', 1))
    self.assertEquals(ee.Filter().not_ends_with('foo', 1),
                      ee.Filter.not_ends_with('foo', 1))

    f1 = ee.Filter().And(ee.Filter().eq('foo', 1), ee.Filter().eq('foo', 2))
    f2 = ee.Filter.And(ee.Filter.eq('foo', 1), ee.Filter().eq('foo', 2))
    self.assertEquals(f1, f2)

    ring1 = ee.Geometry.Polygon(1, 2, 3, 4, 5, 6)
    f1 = ee.Filter().geometry(ring1)
    f2 = ee.Filter.geometry(ring1)
    self.assertEquals(f1, f2)

    d1 = datetime.datetime.strptime('1/1/2000', '%m/%d/%Y')
    d2 = datetime.datetime.strptime('1/1/2001', '%m/%d/%Y')
    f1 = ee.Filter().date(d1, d2)
    f2 = ee.Filter.date(d1, d2)
    self.assertEquals(f1, f2)

  def testInternals(self):
    """Test eq(), ne() and hash()."""
    a = ee.Filter.eq('x', 1)
    b = ee.Filter.eq('x', 2)
    c = ee.Filter.eq('x', 1)

    self.assertEquals(a, a)
    self.assertNotEquals(a, b)
    self.assertEquals(a, c)
    self.assertNotEquals(b, c)
    self.assertNotEquals(hash(a), hash(b))


if __name__ == '__main__':
  unittest.main()
