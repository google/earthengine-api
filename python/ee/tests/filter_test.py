# Copyright 2012 Google Inc. All Rights Reserved.

"""Test for the ee.filter module."""



import datetime
import json
import time

import unittest

import ee


class FilterTestCase(unittest.TestCase):
  def setUp(self):
    ee.algorithms._signatures = {}

  def testConstructor(self):
    f = ee.Filter()
    self.assertEquals(0, f.predicateCount())

    f1 = ee.Filter().gt('foo', 1)
    self.assertEquals(1, f1.predicateCount())

    f2 = ee.Filter({'property': 'foo', 'greater_than': 1})
    self.assertEquals(1, f2.predicateCount())
    self.assertEquals(f1, f2)

    f3 = ee.Filter(f2)
    self.assertEquals(f2, f3)

  def testAppend(self):
    f1 = ee.Filter().eq('foo', 1).eq('bar', 2).eq('baz', 3)
    self.assertEquals(3, f1.predicateCount())

    f2 = ee.Filter().eq('foo_', 1).eq('bar_', 2).eq('baz_', 3)
    self.assertEquals(3, f2.predicateCount())

    f3 = f2._append(f1)
    self.assertEquals(3, f2.predicateCount())
    self.assertEquals(6, f3.predicateCount())

  def testMetadataFilters(self):
    self.assertEquals(
        ee.Filter().eq('x', 1),
        ee.Filter().metadata_('x', 'equals', 1))
    self.assertEquals(
        ee.Filter().neq('x', 1),
        ee.Filter().metadata_('x', 'not_equals', 1))
    self.assertEquals(
        ee.Filter().lt('x', 1),
        ee.Filter().metadata_('x', 'less_than', 1))
    self.assertEquals(
        ee.Filter().lte('x', 1),
        ee.Filter().metadata_('x', 'not_greater_than', 1))
    self.assertEquals(
        ee.Filter().gt('x', 1),
        ee.Filter().metadata_('x', 'greater_than', 1))
    self.assertEquals(
        ee.Filter().gte('x', 1),
        ee.Filter().metadata_('x', 'not_less_than', 1))

  def testLogicalCombinations(self):
    or_filter = ee.Filter().Or(
        ee.Filter().eq('x', 1),
        ee.Filter().eq('x', 2))

    self.assertEquals(
        [
            {'or': [
                [{'property': 'x', 'equals': 1}],
                [{'property': 'x', 'equals': 2}]
                ]
            }
            ],
        json.loads(or_filter.serialize(False)))

    and_filter = ee.Filter().And(
        ee.Filter().eq('x', 1),
        ee.Filter().eq('x', 2))
    self.assertEquals(
        [{'and': [
            [{'property': 'x', 'equals': 1}],
            [{'property': 'x', 'equals': 2}]
            ]
         }],
        json.loads(and_filter.serialize(False)))

    combined = ee.Filter().Or(or_filter, and_filter)
    self.assertEquals(
        [{'or': [
            [{'or': [
                [{'property': 'x', 'equals': 1}],
                [{'property': 'x', 'equals': 2}]
                ]
             }],
            [{'and': [
                [{'property': 'x', 'equals': 1}],
                [{'property': 'x', 'equals': 2}]
                ]
             }]
            ]
         }],
        json.loads(combined.serialize(False)))

  def testDateFilter(self):
    def GetTime(utc):
      return time.mktime(utc.timetuple()) * 1000

    d1 = datetime.datetime(2000, 1, 1)
    d2 = datetime.datetime(2000, 1, 1)

    f1 = ee.Filter().date(d1)
    self.assertEquals(
        [{'property': 'system:time_start',
          'not_less_than': GetTime(d1)
         }],
        json.loads(f1.serialize(False)))

    f2 = ee.Filter().date(d1, d2)
    self.assertEquals(
        [
            {'property': 'system:time_start', 'not_less_than': GetTime(d1)},
            {'property': 'system:time_start', 'not_greater_than': GetTime(d2)}
            ],
        json.loads(f2.serialize(False)))

    f3 = ee.Filter().date(123, 456)
    self.assertEquals(
        [
            {'property': 'system:time_start', 'not_less_than': 123},
            {'property': 'system:time_start', 'not_greater_than': 456}
            ],
        json.loads(f3.serialize(False)))

  def testBoundsFilter(self):
    ring1 = ee.Feature.Polygon(1, 2, 3, 4, 5, 6)
    f1 = ee.Filter().geometry(ring1)
    self.assertEquals([{'geometry': ring1}], json.loads(f1.serialize(False)))

    collection = ee.FeatureCollection([ring1])
    f2 = ee.Filter().geometry(collection)
    self.assertEquals(
        [{'geometry': {
            'algorithm': 'ExtractGeometry',
            'collection': {
                'type': 'FeatureCollection',
                'features': [{
                    'algorithm': 'Feature',
                    'metadata': {},
                    'geometry': ring1
                    }]
                }
            }
         }],
        json.loads(f2.serialize(False)))

  def testStaticVersions(self):
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

    d1 = datetime.datetime(2000, 1, 1)
    d2 = datetime.datetime(2001, 1, 1)
    f1 = ee.Filter().date(d1, d2)
    f2 = ee.Filter.date(d1, d2)
    self.assertEquals(f1, f2)


if __name__ == '__main__':
  unittest.main()
