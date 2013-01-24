# Copyright 2012 Google Inc. All Rights Reserved.

"""Test for the ee.feature module."""



import json

import unittest

import ee


class FeatureTestCase(unittest.TestCase):
  def setUp(self):
    ee.algorithms._signatures = {}

  def testConstructor(self):
    f1 = ee.Feature(ee.Feature.LineString(1, 2, 3, 4))
    f2 = ee.Feature(f1)
    self.assertEquals(f1, f2)

  def testValidGeometry(self):
    point = ee.Feature.Point(1, 2)
    mpoint = ee.Feature.MultiPoint(1, 2, 3, 4, 5, 6)
    line = ee.Feature.LineString(1, 2, 3, 4, 5, 6)
    ring = ee.Feature.LinearRing(1, 2, 3, 4, 5, 6)
    mline = ee.Feature.Polygon(1, 2, 3, 4, 5, 6)
    poly = ee.Feature.Polygon(1, 2, 3, 4, 5, 6)
    rect = ee.Feature.Rectangle(1, 2, 5, 6)
    mpoly = ee.Feature.MultiPolygon(1, 2, 3, 4, 5, 6)

    self.assertTrue(ee.Feature.isValidGeometry(point))
    self.assertTrue(ee.Feature.isValidGeometry(mpoint))
    self.assertTrue(ee.Feature.isValidGeometry(line))
    self.assertTrue(ee.Feature.isValidGeometry(ring))
    self.assertTrue(ee.Feature.isValidGeometry(mline))
    self.assertTrue(ee.Feature.isValidGeometry(rect))
    self.assertTrue(ee.Feature.isValidGeometry(poly))
    self.assertTrue(ee.Feature.isValidGeometry(mpoly))

    self.assertEquals(1, ee.Feature.validateCoordinates(point['coordinates']))
    self.assertEquals(2, ee.Feature.validateCoordinates(mpoint['coordinates']))
    self.assertEquals(2, ee.Feature.validateCoordinates(line['coordinates']))
    self.assertEquals(2, ee.Feature.validateCoordinates(ring['coordinates']))
    self.assertEquals(3, ee.Feature.validateCoordinates(mline['coordinates']))
    self.assertEquals(3, ee.Feature.validateCoordinates(rect['coordinates']))
    self.assertEquals(3, ee.Feature.validateCoordinates(poly['coordinates']))
    self.assertEquals(4, ee.Feature.validateCoordinates(mpoly['coordinates']))

    # The alternate constuction of each.
    mpoint = ee.Feature.MultiPoint([[1, 2], [3, 4], [5, 6]])
    line = ee.Feature.LineString([[1, 2], [3, 4], [5, 6]])
    ring = ee.Feature.LinearRing([[1, 2], [3, 4], [5, 6], [1, 2]])
    mline = ee.Feature.Polygon(
        [
            [[1, 2], [3, 4], [5, 6], [1, 2]],
            [[7, 8], [9, 10], [11, 12]]
            ])

    mpoly = ee.Feature.MultiPolygon(
        [
            [
                [[1, 2], [3, 4], [5, 6], [1, 2]],
                [[7, 8], [9, 10], [11, 12]]
                ],
            [
                [[1, 2], [3, 4], [5, 6], [1, 2]],
                [[7, 8], [9, 10], [11, 12]]
                ]
            ])

    self.assertTrue(ee.Feature.isValidGeometry(mpoint))
    self.assertTrue(ee.Feature.isValidGeometry(line))
    self.assertTrue(ee.Feature.isValidGeometry(ring))
    self.assertTrue(ee.Feature.isValidGeometry(mline))
    self.assertTrue(ee.Feature.isValidGeometry(poly))
    self.assertTrue(ee.Feature.isValidGeometry(mpoly))

  def testValidCoordinates(self):
    # Verify that we can validate tuples and lists alike.
    self.assertEquals(1, ee.Feature.validateCoordinates([1, 2, 3, 4, 5, 6]))
    self.assertEquals(1, ee.Feature.validateCoordinates((1, 2, 3, 4, 5, 6)))
    self.assertEquals(2, ee.Feature.validateCoordinates([[1, 2], [3, 4]]))
    self.assertEquals(2, ee.Feature.validateCoordinates(((1, 2), (3, 4))))
    self.assertEquals(3, ee.Feature.validateCoordinates(
        [[[1, 2], [3, 4]],
         [[5, 6], [7, 8]]]))
    self.assertEquals(3, ee.Feature.validateCoordinates(
        (((1, 2), (3, 4)),
         ((5, 6), (7, 8)))))

  def testConstructorLaxity(self):
    point = ee.Feature.Point(1, 2)
    feature = ee.Feature(point)
    self.assertEquals(point, feature._description['geometry'])
    self.assertEquals(point, ee.Feature(feature)._description['geometry'])

    geom = {
        'algorithm': 'foo',
        'bar': 42
    }
    props = {
        'algorithm': 'bar',
        'bar': 13
    }
    description = {
        'algorithm': 'Feature',
        'geometry': geom,
        'metadata': props
    }
    self.assertEquals(description, ee.Feature(geom, props)._description)

  def testGetMap(self):
    point = ee.Feature.Point(1, 2)
    feature = ee.Feature(point)
    self.assertEquals(point, feature._description['geometry'])
    self.assertEquals(point, ee.Feature(feature)._description['geometry'])

    description = {
        'algorithm': 'foo',
        'bar': 42
    }
    self.assertEquals(description, ee.Feature(description)._description)

  def testGetMapId(self):
    ee.Initialize(None, '')
    # Mock out send so we can hang on to the parameters.
    send_val = {}

    def MockSend(path, params, unused_method='POST'):
      send_val['path'] = path
      send_val['params'] = params
      return {'mapid': '1', 'token': '2'}
    ee.data.send_ = MockSend

    mapid = ee.Feature({
        'algorithm': 'foo',
        'bar': 42
    }).getMapId({'color': 'ABCDEF'})
    self.assertEqual({
        'color': 'ABCDEF',
        'algorithm': 'DrawVector',
        'collection': {
            'type': 'FeatureCollection',
            'features': [{'bar': 42, 'algorithm': 'foo'}]
        }
    }, json.loads(send_val['params']['image']))
    self.assertEqual({'mapid': '1', 'token': '2'}, mapid)


if __name__ == '__main__':
  unittest.main()
