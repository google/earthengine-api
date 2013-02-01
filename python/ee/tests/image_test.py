# Copyright 2012 Google Inc. All Rights Reserved.

"""Test for the ee.image module."""



import json

import unittest

import ee


class ImageTestCase(unittest.TestCase):
  def setUp(self):
    ee.algorithms._signatures = {
        'Image.fakeFunction': {
            'returns': 'Image',
            'description': 'Fake doc.',
            'args': [
                {'type': 'Image', 'name': 'image1', 'description': ''},
                {'type': 'Image', 'name': 'image2', 'description': ''}
                ]
        },
        'Image.and': {
            'returns': 'Image',
            'description': 'fake doc 2.',
            'args': [
                {'type': 'Image', 'name': 'image1', 'description': ''},
                {'type': 'Image', 'name': 'image2', 'description': ''}
            ],
        },
        'Image.clip': {
            'returns': 'Image',
            'description': 'fake doc 3',
            'args': [
                {
                    'name': 'input',
                    'type': 'Image',
                    'description': 'The image to clip.'
                },
                {
                    'name': 'geometry',
                    'type': 'Geometry',
                    'optional': True,
                    'description': 'The region to clip to.'
                }
            ]
        }
    }

  def testImageConstructors(self):
    # We want to check that the serialized version is as expected,
    # but we don't want to deal with whitespace and order differences,
    # so the serialize() output is reparsed and we compare against that.
    image1 = ee.Image(1)
    self.assertEqual(
        {'algorithm': 'Constant', 'value': 1},
        json.loads(image1.serialize()))

    image2 = ee.Image('abcd')
    self.assertEqual(
        {'type': 'Image', 'id': 'abcd'},
        json.loads(image2.serialize()))

    image3 = ee.Image([1, 2])
    self.assertEqual(
        {
            'algorithm': 'Image.addBands',
            'dstImg': {'algorithm': 'Constant', 'value': 1},
            'srcImg': {'algorithm': 'Constant', 'value': 2}
        },
        json.loads(image3.serialize()))

    image4 = ee.Image(image1)
    self.assertEqual(json.loads(image4.serialize()),
                     json.loads(image1.serialize()))

  def testImageSignatures(self):
    # Manually invoke Signatures.addFunctions because send doesn't
    # get overriden until after the library is loaded.
    ee.algorithms._addFunctions(ee.Image, 'Image', 'Image')

    # Verify that we picked up a prototype def from signatures.
    image = ee.Image(1)

    self.assertTrue(image.fakeFunction is not None)

  def testCombine(self):
    image1 = ee.Image([1, 2])
    image2 = ee.Image([3, 4])
    image3 = ee.Image.combine_([image1, image2], ['a', 'b', 'c', 'd'])

    self.assertEqual(
        {
            'algorithm': 'Image.select',
            'input': {
                'algorithm': 'Image.addBands',
                'dstImg': {
                    'algorithm': 'Image.addBands',
                    'dstImg': {'algorithm': 'Constant', 'value': 1},
                    'srcImg': {'algorithm': 'Constant', 'value': 2}
                },
                'srcImg': {
                    'algorithm': 'Image.addBands',
                    'dstImg': {'algorithm': 'Constant', 'value': 3},
                    'srcImg': {'algorithm': 'Constant', 'value': 4}
                },
            },
            'bandSelectors': ['.*'],
            'newNames': ['a', 'b', 'c', 'd']
        },
        json.loads(image3.serialize()))

  def testDownload(self):
    ee.Initialize(None, '')
    # Mock out send so we can hang on to the parameters.
    send_val = {}

    def MockSend(path, params, unused_method='POST'):
      send_val['path'] = path
      send_val['params'] = params
      return {'docid': '1', 'token': '2'}
    ee.data.send_ = MockSend

    url = ee.Image(1).getDownloadUrl()
    self.assertEqual({'value': 1, 'algorithm': 'Constant'},
                     json.loads(send_val['params']['image']))
    self.assertEqual('/api/download?docid=1&token=2', url)

  def testSelect(self):
    image = ee.Image([1, 2, 3, 4])

    # Just checking what gets passed to MockSelect; don't need the return value.
    result = json.loads(image.select([0, 1]).serialize())
    self.assertEquals(result['bandSelectors'], [0, 1])
    self.assertFalse('newNames' in result)

    result = json.loads(image.select([0, 1, 2]).serialize())
    self.assertEquals(result['bandSelectors'], [0, 1, 2])
    self.assertFalse('newNames' in result)

    result = json.loads(image.select([0, 1, 2], ['a', 'b', 'c']).serialize())
    self.assertEquals(result['bandSelectors'], [0, 1, 2])
    self.assertEquals(result['newNames'], ['a', 'b', 'c'])

  def testAnd(self):
    # Check that the Image.and and Image.or functions get renamed.
    ee.algorithms._addFunctions(ee.Image, 'Image', 'Image')
    ee.algorithms._addFunctions(ee.ImageCollection,
                                'Image',
                                'Image',
                                'map_',
                                ee.algorithms._makeMapFunction)

    image = ee.Image(0).And(1)
    self.assertEqual(
        {'algorithm': 'Image.and',
         'image1': {'algorithm': 'Constant', 'value': 0},
         'image2': {'algorithm': 'Constant', 'value': 1}
        },
        json.loads(image.serialize()))

    c = ee.ImageCollection([ee.Image(0), ee.Image(1)])
    c2 = c.map_and(2)
    self.assertEquals(
        {
            'algorithm': 'MapAlgorithm',
            'baseAlgorithm': 'Image.and',
            'collection': {'images': [{'algorithm': 'Constant', 'value': 0},
                                      {'algorithm': 'Constant', 'value': 1}],
                           'type': 'ImageCollection'},
            'constantArgs': {'image2': {'algorithm': 'Constant', 'value': 2}},
            'dynamicArgs': {'image1': '.all'}
        }, json.loads(c2.serialize()))


if __name__ == '__main__':
  unittest.main()
