# Copyright 2012 Google Inc. All Rights Reserved.

"""Test for the ee.featurecollection module."""



import json

import unittest

import ee


class FeatureCollectionTestCase(unittest.TestCase):
  def setUp(self):
    ee.algorithms._signatures = {}

  def testConstructors(self):
    # Collection by ID (string).
    col1 = ee.FeatureCollection('abcd')
    self.assertEquals(
        {'type': 'FeatureCollection', 'id': 'abcd'},
        json.loads(col1.serialize()))

    # Collection by ID (string), with column.
    col1 = ee.FeatureCollection('abcd', 'xyz')
    self.assertEquals(
        {'type': 'FeatureCollection', 'id': 'abcd', 'geo_column': 'xyz'},
        json.loads(col1.serialize()))

    # Fusion Table ID (number).
    col2 = ee.FeatureCollection(123456)
    self.assertEquals(
        {'type': 'FeatureCollection', 'table_id': 123456},
        json.loads(col2.serialize()))

    # Fusion Table ID (number) with column.
    col2 = ee.FeatureCollection(123456, 'xyz')
    self.assertEquals(
        {'type': 'FeatureCollection', 'table_id': 123456, 'geo_column': 'xyz'},
        json.loads(col2.serialize()))

    # Manually created collection from features.
    col3 = ee.FeatureCollection([ee.Feature.Polygon(1, 2, 3, 4, 5, 6),
                                 ee.Feature.Polygon(2, 3, 4, 5, 6, 7)])
    self.assertEquals(
        {
            'type': 'FeatureCollection',
            'features': [
                {
                    'algorithm': 'Feature',
                    'geometry': {'type': 'Polygon', 'coordinates': [[
                        [1, 2], [3, 4], [5, 6]]]},
                    'metadata': {}
                }, {
                    'algorithm': 'Feature',
                    'geometry': {'type': 'Polygon', 'coordinates': [[
                        [2, 3], [4, 5], [6, 7]]]},
                    'metadata': {}
                    }
                ]
            },
        json.loads(col3.serialize()))

    # From another FeatureCollection
    col4 = ee.FeatureCollection(col1)
    self.assertEquals(json.loads(col1.serialize()),
                      json.loads(col4.serialize()))

    # Single feature.
    f = ee.Feature(ee.Feature.Polygon(1, 2))
    col5 = ee.FeatureCollection(f)
    col6 = ee.FeatureCollection([f])
    self.assertEquals(json.loads(col5.serialize()),
                      json.loads(col6.serialize()))

    # From JSON
    col7 = ee.FeatureCollection({
        'type': 'FeatureCollection',
        'features': [{
            'algorithm': 'Feature',
            'geometry': {'type': 'Polygon', 'coordinates': [[
                [1, 2], [3, 4], [5, 6]]]},
            'metadata': {}
        }, {
            'algorithm': 'Feature',
            'geometry': {'type': 'Polygon', 'coordinates': [[
                [2, 3], [4, 5], [6, 7]]]},
            'metadata': {}
        }]
    })
    self.assertEquals(json.loads(col3.serialize()),
                      json.loads(col7.serialize()))

  def testGetMapId(self):
    ee.Initialize(None, '')
    # Mock out send so we can hang on to the parameters.
    send_val = {}

    def MockSend(path, params, unused_method='POST'):
      send_val['path'] = path
      send_val['params'] = params
      return {'mapid': '1', 'token': '2'}
    ee.data.send_ = MockSend

    mapid = ee.FeatureCollection(5).getMapId({'color': 'ABCDEF'})
    self.assertEqual({
        'color': 'ABCDEF',
        'algorithm': 'DrawVector',
        'collection': {
            'type': 'FeatureCollection',
            'table_id': 5
        }
    }, json.loads(send_val['params']['image']))
    self.assertEqual({'mapid': '1', 'token': '2'}, mapid)


if __name__ == '__main__':
  unittest.main()
