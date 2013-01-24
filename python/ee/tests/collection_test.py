# Copyright 2012 Google Inc. All Rights Reserved.

"""Test for the ee.collection module."""



import datetime
import json

import unittest

import ee


class CollectionTestCase(unittest.TestCase):
  def setUp(self):
    ee.algorithms._signatures = {}

  def testFilterAndLimit(self):
    collection = ee.Collection({'type': 'collection'})
    self.assertFalse(ee.Collection._isFilterFeatureCollection(collection))

    try:
      collection.filter()       #pylint: disable-msg=E1120
      self.fail()
    except TypeError:
      pass

    c1 = collection.filter(ee.Filter().eq('foo', 1))

    self.assertEqual({
        'algorithm': 'FilterFeatureCollection',
        'collection': {'type': 'collection'},
        'filters': [{
            'property': 'foo',
            'equals': 1
            }]
        }, json.loads(c1.serialize(False)))

    # Test that filter().eq() is the same as filterMetadata()
    c2 = ee.Collection({'type': 'collection'})
    c2 = c2.filterMetadata('foo', 'equals', 1)
    self.assertEqual(c1.serialize(), c2.serialize())

    # Add in a limit.
    c3 = c2.limit(10)
    self.assertEqual({
        'algorithm': 'LimitFeatureCollection',
        'limit': 10,
        'collection': {
            'algorithm': 'FilterFeatureCollection',
            'collection': {'type': 'collection'},
            'filters': [{
                'property': 'foo',
                'equals': 1
                }]
            }
        }, json.loads(c3.serialize()))

    # Add a sort.
    c4 = c3.sort('bar', True)
    self.assertEqual({
        'algorithm': 'LimitFeatureCollection',
        'key': 'bar',
        'ascending': True,
        'collection': {
            'algorithm': 'LimitFeatureCollection',
            'limit': 10,
            'collection': {
                'algorithm': 'FilterFeatureCollection',
                'collection': {'type': 'collection'},
                'filters': [{
                    'property': 'foo',
                    'equals': 1
                    }]
                }
            }
        }, json.loads(c4.serialize()))

  def testFilterShortcuts(self):
    c1 = ee.Collection({'type': 'collection'})
    c2 = ee.Collection({'type': 'collection'})

    geom = {'type': 'Polygon', 'coordinates': [[1, 2], [3, 4]]}
    c1 = c1.filter(ee.Filter().geometry(geom))
    c2 = c2.filterBounds(geom)
    self.assertEqual(c1.serialize(), c2.serialize())

    d1 = datetime.datetime(2000, 1, 1)
    c1 = c1.filter(ee.Filter().date(d1))
    c2 = c2.filterDate(d1)
    self.assertEqual(c1.serialize(), c2.serialize())

    d2 = datetime.datetime(2000, 1, 1)
    c1 = c1.filter(ee.Filter().date(d1, d2))
    c2 = c2.filterDate(d1, d2)
    self.assertEqual(c1.serialize(), c2.serialize())

    c1 = c1.filter(ee.Filter().eq('foo', 1))
    c2 = c2.filterMetadata('foo', 'equals', 1)
    self.assertEqual(c1.serialize(), c2.serialize())

  def testMapping(self):
    col = ee.ImageCollection('foo')
    mapped = col.map(lambda img: ee.Image({'algorithm': 'bar', 'input': img}),
                     None,
                     {'baz': 42},
                     'quux')
    result = json.loads(mapped.serialize())

    self.assertTrue(isinstance(mapped, ee.ImageCollection))
    self.assertEqual(
        {
            'algorithm': 'Collection.map',
            'collection': {
                'type': 'ImageCollection',
                'id': 'foo',
            },
            'baseAlgorithm': {
                'type': 'Algorithm',
                'args': ['_MAPPING_VAR_0'],
                'body': {
                    'algorithm': 'bar',
                    'input': {'type': 'Variable', 'name': '_MAPPING_VAR_0'}
                }
            },
            'dynamicArgs': {
                '_MAPPING_VAR_0': '.all'
            },
            'constantArgs': {
                'baz': 42
            },
            'destination': 'quux'
        },
        result)


if __name__ == '__main__':
  unittest.main()
