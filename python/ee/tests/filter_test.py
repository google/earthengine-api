#!/usr/bin/env python3
"""Test for the ee.filter module."""

import datetime

import unittest
import ee
from ee import apitestcase


class FilterTest(apitestcase.ApiTestCase):

  def testConstructors(self):
    """Verifies that constructors understand valid parameters."""
    from_static_method = ee.Filter.gt('foo', 1)
    from_computed_object = ee.Filter(
        ee.ApiFunction.call_('Filter.greaterThan', 'foo', 1))
    self.assertEqual(from_static_method, from_computed_object)

    copy = ee.Filter(from_static_method)
    self.assertEqual(from_static_method, copy)

  def testMetadata(self):
    """Verifies that the metadata_() method works."""
    self.assertEqual(
        ee.ApiFunction.call_('Filter.equals', 'x', 1),
        ee.Filter.metadata_('x', 'equals', 1))
    self.assertEqual(
        ee.Filter.metadata_('x', 'equals', 1), ee.Filter.eq('x', 1))
    self.assertEqual(
        ee.Filter.metadata_('x', 'EQUALS', 1), ee.Filter.eq('x', 1))
    self.assertEqual(
        ee.Filter.metadata_('x', 'not_equals', 1), ee.Filter.neq('x', 1))
    self.assertEqual(
        ee.Filter.metadata_('x', 'less_than', 1), ee.Filter.lt('x', 1))
    self.assertEqual(
        ee.Filter.metadata_('x', 'not_greater_than', 1), ee.Filter.lte('x', 1))
    self.assertEqual(
        ee.Filter.metadata_('x', 'greater_than', 1), ee.Filter.gt('x', 1))
    self.assertEqual(
        ee.Filter.metadata_('x', 'not_less_than', 1), ee.Filter.gte('x', 1))

  def testLogicalCombinations(self):
    """Verifies that the and() and or() methods work."""
    f1 = ee.Filter.eq('x', 1)
    f2 = ee.Filter.eq('x', 2)

    or_filter = ee.Filter.Or(f1, f2)
    self.assertEqual(ee.ApiFunction.call_('Filter.or', (f1, f2)), or_filter)

    and_filter = ee.Filter.And(f1, f2)
    self.assertEqual(ee.ApiFunction.call_('Filter.and', (f1, f2)), and_filter)

    self.assertEqual(
        ee.ApiFunction.call_('Filter.or', (or_filter, and_filter)),
        ee.Filter.Or(or_filter, and_filter))

  def testDate(self):
    """Verifies that date filters work."""
    d1 = datetime.datetime.strptime('1/1/2000', '%m/%d/%Y')
    d2 = datetime.datetime.strptime('1/1/2001', '%m/%d/%Y')
    instant_range = ee.ApiFunction.call_('DateRange', d1, None)
    long_range = ee.ApiFunction.call_('DateRange', d1, d2)

    instant_filter = ee.Filter.date(d1)
    self.assertEqual(
        ee.ApiFunction.lookup('Filter.dateRangeContains'), instant_filter.func)
    self.assertEqual({
        'leftValue': instant_range,
        'rightField': ee.String('system:time_start')
    }, instant_filter.args)

    long_filter = ee.Filter.date(d1, d2)
    self.assertEqual(
        ee.ApiFunction.lookup('Filter.dateRangeContains'), long_filter.func)
    self.assertEqual({
        'leftValue': long_range,
        'rightField': ee.String('system:time_start')
    }, long_filter.args)

  def testBounds(self):
    """Verifies that geometry intersection filters work."""
    polygon = ee.Geometry.Polygon(1, 2, 3, 4, 5, 6)
    self.assertEqual(
        ee.ApiFunction.call_('Filter.intersects', '.all',
                             ee.ApiFunction.call_('Feature', polygon)),
        ee.Filter.geometry(polygon))

    # Collection-to-geometry promotion.
    collection = ee.FeatureCollection('foo')
    feature = ee.ApiFunction.call_(
        'Feature', ee.ApiFunction.call_('Collection.geometry', collection))
    self.assertEqual(
        ee.ApiFunction.call_('Filter.intersects', '.all', feature),
        ee.Filter.geometry(collection))

    # Check the bounds() alias.
    self.assertEqual(
        ee.ApiFunction.call_('Filter.intersects', '.all',
                             ee.ApiFunction.call_('Feature', polygon)),
        ee.Filter.bounds(polygon))

  def testInList(self):
    """Verifies that list membership filters work."""
    self.assertEqual(
        ee.Filter.listContains(None, None, 'foo', [1, 2]),  # pytype: disable=attribute-error
        ee.Filter.inList('foo', [1, 2]))

  def testInternals(self):
    """Test eq(), ne() and hash()."""
    a = ee.Filter.eq('x', 1)
    b = ee.Filter.eq('x', 2)
    c = ee.Filter.eq('x', 1)

    self.assertEqual(a, a)
    self.assertNotEqual(a, b)
    self.assertEqual(a, c)
    self.assertNotEqual(b, c)
    self.assertNotEqual(hash(a), hash(b))

  def testInitOptParams(self):
    result = ee.Filter(opt_filter=[ee.Filter.gt('prop', 1)]).serialize()
    self.assertIn('"functionName": "Filter.greaterThan"', result)

  def test_date_opt_params(self):
    result = ee.Filter.date(
        start='1996-01-01T00:00', opt_end='2023-01-01T00:00'
    ).serialize()
    self.assertIn('"end": {"constantValue": "2023-01-01T00:00"}', result)

  def test_in_list_opt_params(self):
    result = ee.Filter.inList(
        opt_leftField='lf',
        opt_rightValue='rv',
        opt_rightField='rf',
        opt_leftValue='lv',
    ).serialize()
    self.assertIn('"leftField": {"constantValue": "rf"}', result)
    self.assertIn('"leftValue": {"constantValue": "rv"}', result)
    self.assertIn('"rightField": {"constantValue": "lf"}', result)
    self.assertIn('"rightValue": {"constantValue": "lv"}', result)

  def test_bounds_opt_params(self):
    result = ee.Filter.bounds(
        geometry=ee.Geometry.Point(0, 0), opt_errorMargin=12345
    ).serialize()
    self.assertIn('"value": {"constantValue": 12345}', result)


if __name__ == '__main__':
  unittest.main()
