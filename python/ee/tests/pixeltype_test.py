#!/usr/bin/env python3
"""Tests for the ee.PixelType module.

Everything except the PixelType constructor is dynamically generated.
"""

import enum
import json

import ee
from ee import apitestcase
import unittest


class Type(str, enum.Enum):
  DOUBLE = 'double'
  FLOAT = 'float'
  INT = 'int'

DIMENSIONS_KEY = 'dimensions'
MAX_VALUE_KEY = 'maxValue'
MIN_VALUE_KEY = 'minValue'
PRECISION_KEY = 'precision'

PIXELTYPE = 'PixelType'


class PixelTypeTest(apitestcase.ApiTestCase):

  def test_int(self):
    precision = Type.INT
    min_value = 0
    max_value = 1
    dimensions = 2
    pixeltype = ee.PixelType(precision, min_value, max_value, dimensions)
    self.assertEqual({'value': 'fakeValue'}, pixeltype.getInfo())

    pixeltype_func = ee.ApiFunction.lookup('PixelType')
    self.assertEqual(pixeltype_func, pixeltype.func)

    self.assertFalse(pixeltype.isVariable())
    self.assertEqual(
        {
            DIMENSIONS_KEY: dimensions,
            MAX_VALUE_KEY: max_value,
            MIN_VALUE_KEY: min_value,
            PRECISION_KEY: precision,
        },
        pixeltype.args,
    )

    result = json.loads(pixeltype.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        DIMENSIONS_KEY: {'constantValue': dimensions},
                        MAX_VALUE_KEY: {'constantValue': max_value},
                        MIN_VALUE_KEY: {'constantValue': min_value},
                        PRECISION_KEY: {'constantValue': precision},
                    },
                    'functionName': PIXELTYPE,
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_minimal_double(self):
    precision = Type.DOUBLE
    pixeltype = ee.PixelType(precision)
    result = json.loads(pixeltype.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {PRECISION_KEY: {'constantValue': precision}},
                    'functionName': PIXELTYPE,
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_float_named_args(self):
    precision = Type.FLOAT
    min_value = 3
    max_value = 4
    dimensions = 5
    pixeltype = ee.PixelType(
        dimensions=dimensions,
        precision=precision,
        minValue=min_value,
        maxValue=max_value,
    )
    result = json.loads(pixeltype.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        DIMENSIONS_KEY: {'constantValue': dimensions},
                        MAX_VALUE_KEY: {'constantValue': max_value},
                        MIN_VALUE_KEY: {'constantValue': min_value},
                        PRECISION_KEY: {'constantValue': precision},
                    },
                    'functionName': PIXELTYPE,
                }
            }
        },
    }
    self.assertEqual(expect, result)

    cast_result = json.loads(ee.PixelType(pixeltype).serialize())
    self.assertEqual(expect, cast_result)

  def test_float_computed_object_args(self):
    precision = Type.FLOAT
    min_value = 3
    max_value = 4
    dimensions = 5
    pixeltype = ee.PixelType(
        precision=ee.String(precision).cat(''),
        minValue=ee.Number(min_value),
        maxValue=ee.Number(max_value),
        dimensions=ee.Number(dimensions),
    )
    result = json.loads(pixeltype.serialize())
    expected_precision = {
        'functionInvocationValue': {
            'functionName': 'String.cat',
            'arguments': {
                'string1': {'constantValue': 'float'},
                'string2': {'constantValue': ''},
            },
        }
    }
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        DIMENSIONS_KEY: {'constantValue': dimensions},
                        MAX_VALUE_KEY: {'constantValue': max_value},
                        MIN_VALUE_KEY: {'constantValue': min_value},
                        PRECISION_KEY: expected_precision,
                    },
                    'functionName': PIXELTYPE,
                }
            }
        },
    }
    self.assertEqual(expect, result)

    cast_result = json.loads(ee.PixelType(pixeltype).serialize())
    self.assertEqual(expect, cast_result)


if __name__ == '__main__':
  unittest.main()
