# Copyright 2012 Google Inc. All Rights Reserved.

"""Tests for the ee.algorithms module."""



import json
import types

import unittest

import ee


TEST_SIGNATURES = {
    'Image.fakeFunction': {
        'description': 'Method description.',
        'returns': 'Image',
        'args': [
            {'type': 'Image', 'name': 'image1', 'description': 'Arg A doc.'},
            {'type': 'Image', 'name': 'image2', 'description': 'Arg B doc.'}
        ]
    },
    'fooBar': {
        'description': '',
        'returns': 'Image',
        'args': [
            {'type': 'Image', 'name': 'image1', 'description': ''},
            {'type': 'Image', 'name': 'image2', 'description': ''}
        ]
    },
    'Image.aStaticMethod': {
        'description': '',
        'returns': 'Image',
        'args': [
            {'type': 'String', 'name': 'str', 'description': ''}
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
    ee.Initialize()

  def testGetWithRealName(self):
    # Test that get() is also ensuring the 'name' value is set.
    # This algorithm will already have had a name added to it by init().
    algorithm = ee.algorithms.getSignature('Image.fakeFunction')
    self.assertTrue(algorithm is not None)
    self.assertEquals(algorithm['name'], 'Image.fakeFunction')

  def testGetWithFakeName(self):
    # Test that get() is also ensuring the 'name' value is set.
    # This algorithm will already have had a name added to it by init().
    algorithm = ee.algorithms.getSignature('fooBar')
    self.assertTrue(algorithm is not None)
    self.assertEquals(algorithm['name'], 'fooBar')

  def testAddFunctions(self):
    # Check instance vs static functions, and trampling of existing functions.

    class TestClass(object):
      def Test(self):
        pass

    self.assertFalse(hasattr(TestClass, 'fakeFunction'))
    self.assertTrue(hasattr(TestClass, 'Test'))

    ee.algorithms._addFunctions(TestClass, 'Image', 'Image')
    self.assertTrue(hasattr(TestClass, 'fakeFunction'))
    self.assertTrue(hasattr(TestClass, 'Test'))
    self.assertTrue(hasattr(TestClass, 'aStaticMethod'))
    self.assertTrue(isinstance(TestClass.fakeFunction, types.MethodType))
    self.assertTrue(isinstance(TestClass.Test, types.MethodType))
    self.assertFalse(isinstance(TestClass.aStaticMethod, types.MethodType))

  def testFunctionCall(self):
    class TestClass(object):
      _description = {}
    ee.algorithms._addFunctions(TestClass, 'Image', 'Image')

    # Verify docs.
    self.assertEquals('fakeFunction', TestClass.fakeFunction.__name__)
    self.assertEquals(EXPECTED_DOC, TestClass.fakeFunction.__doc__)

    # Verify the return type wrapper and type promotion.
    result = TestClass().fakeFunction(1)
    self.assertTrue(isinstance(result, ee.Image))
    self.assertEquals(
        {
            'algorithm': 'Image.fakeFunction',
            'image1': {},
            'image2': {'algorithm': 'Constant', 'value': 1}
        },
        json.loads(result.serialize(False)))
    self.assertEquals(
        {
            'algorithm': 'Image.aStaticMethod',
            'str': 'test'
        },
        json.loads(TestClass.aStaticMethod('test').serialize(False)))

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
