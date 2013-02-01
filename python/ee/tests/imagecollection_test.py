# Copyright 2012 Google Inc. All Rights Reserved.

"""Test for the ee.imagecollection module."""



import json

import unittest

import ee


class ImageCollectionTestCase(unittest.TestCase):
  def setUp(self):
    ee.algorithms._signatures = {}

  def testImageCollectionConstructors(self):
    # Collection by ID.
    col1 = ee.ImageCollection('abcd')
    self.assertEquals(
        {'type': 'ImageCollection', 'id': 'abcd'},
        json.loads(col1.serialize()))

    # Manually created collection.
    col2 = ee.ImageCollection([ee.Image(1), ee.Image(2)])
    self.assertEquals(
        {
            'type': 'ImageCollection',
            'images': [
                {'algorithm': 'Constant', 'value': 1},
                {'algorithm': 'Constant', 'value': 2}
                ]
            },
        json.loads(col2.serialize()))

    col4 = ee.ImageCollection(col1)
    self.assertEquals(col1.serialize(), col4.serialize())

    # Single feature.
    col5 = ee.ImageCollection(ee.Image(1))
    col6 = ee.ImageCollection([ee.Image(1)])
    self.assertEquals(json.loads(col5.serialize()),
                      json.loads(col6.serialize()))


if __name__ == '__main__':
  unittest.main()
