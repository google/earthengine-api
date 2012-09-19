# Copyright 2012 Google Inc. All Rights Reserved.

"""Tests for the ee.algorithms module."""



# pylint doesn't understand dynamically added functions.
# pylint: disable-msg=E1101

import json

import unittest

import ee


TEST_SIGNATURES = {
    'Image.fakeFunction': {
        'name': 'Image.fakeFunction',
        'description': 'Method description.',
        'returns': 'Image',
        'args': [
            {'type': 'Image', 'name': 'image1', 'description': 'Arg A doc.'},
            {'type': 'Image', 'name': 'image2', 'description': 'Arg B doc.'}
        ]
    }
}

EXPECTED_DOC = """Method description.

Args:
  image1: Arg A doc.
  image2: Arg B doc."""


class AlgorithmTestCase(unittest.TestCase):

  def setUp(self):
    # Mock the send call.

    def MockSend(*unused_):
      return TEST_SIGNATURES

    ee.data.send_ = MockSend

  def testSignatures(self):
    # Verify init.
    ee.algorithms.init()
    self.assertTrue(ee.algorithms.getSignature(
        'Image.fakeFunction') is not None)

    # Verify addFunctions.
    class TestClass(object):
      _description = {}

    ee.algorithms._addFunctions(TestClass, 'Image')
    self.assertTrue(getattr(TestClass, 'fakeFunction') is not None)

    # Verify docs.
    self.assertEquals('fakeFunction', TestClass.fakeFunction.__name__)
    self.assertEquals(EXPECTED_DOC, TestClass.fakeFunction.__doc__)

    # Verify the return type wrapper and type promotion.
    f = TestClass().fakeFunction(1)             # pylint: disable-msg=E1101
    self.assertTrue(isinstance(f, ee.Image))
    self.assertEquals(
        {
            'algorithm': 'Image.fakeFunction',
            'image1': {},
            'image2': {'algorithm': 'Constant', 'value': 1},
        },
        json.loads(f.serialize(False)))

    # Test using a named arg
    f = TestClass().fakeFunction(image2=1)
    self.assertEquals(
        {
            'algorithm': 'Image.fakeFunction',
            'image1': {},
            'image2': {'algorithm': 'Constant', 'value': 1},
            },
        json.loads(f.serialize(False)))

  def testApplySignature(self):
    ee.algorithms.init()

    image1 = ee.Image(1)
    image2 = ee.Image(2)

    signature = ee.algorithms.getSignature('Image.fakeFunction')
    expected = {
        'algorithm': 'Image.fakeFunction',
        'image1': {'algorithm': 'Constant', 'value': 1},
        'image2': {'algorithm': 'Constant', 'value': 2},
    }

    # Positional args.
    out = ee.algorithms._applySignature(signature, image1, image2)
    self.assertEquals(expected, json.loads(out.serialize()))

    # Positional args with promotion
    out = ee.algorithms._applySignature(signature, 1, 2)
    self.assertEquals(expected, json.loads(out.serialize()))

    # Kwargs.
    out = ee.algorithms._applySignature(signature,
                                        image1=image1, image2=image2)
    self.assertEquals(expected, json.loads(out.serialize()))

    # Kwargs with promotion.
    out = ee.algorithms._applySignature(signature,
                                        image1=1, image2=2)
    self.assertEquals(expected, json.loads(out.serialize()))

  def testMapFunctions(self):
    ee.Initialize()

    image2 = ee.Image('2')
    c1 = ee.ImageCollection('foo')
    c2 = c1.map_fakeFunction(image2)

    expected = {
        'baseAlgorithm': 'Image.fakeFunction',
        'constantArgs': {
            'image2': {
                'type': 'Image',
                'id': '2'
                }
            },
        'collection': {
            'type': 'ImageCollection',
            'id': 'foo'
            },
        'dynamicArgs': {
            'image1': '.all'
        },
        'algorithm': 'MapAlgorithm'
        }

    self.assertEquals(expected, json.loads(c2.serialize()))

    # Try again with a named arg.
    c3 = c1.map_fakeFunction(image2=image2)
    self.assertEquals(expected, json.loads(c3.serialize()))


if __name__ == '__main__':
  unittest.main()
