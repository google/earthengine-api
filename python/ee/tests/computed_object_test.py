# Copyright 2012 Google Inc. All Rights Reserved.

"""Test for the ee.image module."""



import json

import unittest

import ee


class ImageTestCase(unittest.TestCase):
  def setUp(self):
    ee.algorithms._signatures = {
        'Image.fakeFunction': {
            'returns': 'Map',
            'description': 'Fake doc.',
            'args': [
                {'type': 'Image', 'name': 'image1', 'description': ''},
                ]
        }
    }

  def testComputedObject(self):
    ee.Initialize(None, '')

    # Mock out send.
    def MockSend(unused_path, unused_params, unused_method='POST'):
      return {'value': 1}
    ee.data.send_ = MockSend

    # Test serialize
    image1 = ee.Image(1)
    result = image1.fakeFunction()
    self.assertEqual(
        {'algorithm': 'Image.fakeFunction',
         'image1': {'algorithm': 'Constant', 'value': 1}},
        json.loads(result.serialize()))

    self.assertEqual({'value': 1}, result.getInfo())


if __name__ == '__main__':
  unittest.main()
