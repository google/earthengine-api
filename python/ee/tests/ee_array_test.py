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

  def test_serialize_list(self):
    list_object = ee.List([1, 2])
    result = json.loads(ee.Array([list_object.size(), 2, 3]).serialize())
    expected = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'functionName': 'Array',
                    'arguments': {
                        'values': {
                            'arrayValue': {
                                'values': [
                                    {
                                        'functionInvocationValue': {
                                            'functionName': 'List.size',
                                            'arguments': {
                                                'list': {
                                                    'constantValue': [1, 2]
                                                }
                                            },
                                        }
                                    },
                                    {'constantValue': 2},
                                    {'constantValue': 3},
                                ]
                            }
                        }
                    },
                }
            }
        },
    }
    self.assertEqual(expected, result)

  def test_serialize_pixel_type(self):
    result = json.loads(ee.Array([], ee.PixelType.float()).serialize())
    expected = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'functionName': 'Array',
                    'arguments': {
                        'pixelType': {
                            'functionInvocationValue': {
                                'functionName': 'PixelType',
                                'arguments': {
                                    'precision': {
                                        'functionInvocationValue': {
                                            'functionName': 'PixelType.float',
                                            'arguments': {},
                                        }
                                    }
                                },
                            }
                        },
                        'values': {'constantValue': []},
                    },
                }
            }
        },
    }
    self.assertEqual(expected, result)

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
