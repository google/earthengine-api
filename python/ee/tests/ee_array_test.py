#!/usr/bin/env python3
"""Tests for the ee.Array module."""

import json

import ee
from ee import apitestcase
import unittest


class EeArrayTest(apitestcase.ApiTestCase):

  def test_init(self):
    array = ee.Array([1, 2])
    self.assertEqual({'value': 'fakeValue'}, array.getInfo())

    array_func = ee.ApiFunction.lookup('Array')
    self.assertEqual(array_func, array.func)
    self.assertFalse(array.isVariable())
    self.assertEqual({'values': [1, 2]}, array.args)

  def test_init_pixel_type(self):
    pixel_type = ee.PixelType.int8()
    array = ee.Array([], pixelType=pixel_type)
    self.assertEqual({'value': 'fakeValue'}, array.getInfo())

    array_func = ee.ApiFunction.lookup('Array')
    self.assertEqual(array_func, array.func)
    self.assertFalse(array.isVariable())
    self.assertEqual({'values': [], 'pixelType': pixel_type}, array.args)

  def test_init_tuple(self):
    array = ee.Array((2, 3, 4))
    self.assertEqual({'value': 'fakeValue'}, array.getInfo())

    array_func = ee.ApiFunction.lookup('Array')
    self.assertEqual(array_func, array.func)
    self.assertFalse(array.isVariable())
    self.assertEqual({'values': (2, 3, 4)}, array.args)

  def test_serialize(self):
    array = ee.Array([[1, 2], [3, 4]])
    result = json.loads(array.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'functionName': 'Array',
                    'arguments': {
                        'values': {'constantValue': [[1, 2], [3, 4]]}
                    },
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_cast(self):
    array = ee.Array([[1, 2], [3, 4]])
    result = json.loads(ee.Array(array).serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'functionName': 'Array',
                    'arguments': {
                        'values': {'constantValue': [[1, 2], [3, 4]]}
                    },
                }
            }
        },
    }
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
