#!/usr/bin/env python3
"""Tests for the ee.PixelType module.

Everything except the PixelType constructor is dynamically generated.
"""

import enum
import json
from typing import Any, Dict

import unittest
import ee
from ee import apitestcase


class Type(str, enum.Enum):
  DOUBLE = 'double'
  FLOAT = 'float'
  INT = 'int'


DIMENSIONS_KEY = 'dimensions'
MAX_VALUE_KEY = 'maxValue'
MIN_VALUE_KEY = 'minValue'
PRECISION_KEY = 'precision'

PIXELTYPE = 'PixelType'


def make_expression_graph(
    function_invocation_value: Dict[str, Any]
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


def pixeltype_function_expr(value: Type) -> Dict[str, Any]:
  return {
      'functionInvocationValue': {
          'functionName': 'PixelType',
          'arguments': {'precision': {'constantValue': value}},
      }
  }


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
        set([DIMENSIONS_KEY, MAX_VALUE_KEY, MIN_VALUE_KEY, PRECISION_KEY]),
        set(pixeltype.args),
    )
    expected_dimensions = {'result': '0', 'values': {'0': {'constantValue': 2}}}
    self.assertEqual(
        expected_dimensions,
        json.loads(pixeltype.args[DIMENSIONS_KEY].serialize()),
    )
    expected_max_value = {'result': '0', 'values': {'0': {'constantValue': 1}}}
    self.assertEqual(
        expected_max_value,
        json.loads(pixeltype.args[MAX_VALUE_KEY].serialize()),
    )
    expected_min_value = {'result': '0', 'values': {'0': {'constantValue': 0}}}
    self.assertEqual(
        expected_min_value,
        json.loads(pixeltype.args[MIN_VALUE_KEY].serialize()),
    )
    self.assertEqual(Type.INT, pixeltype.args[PRECISION_KEY])

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

  def test_float_no_dimensions(self):
    precision = Type.FLOAT
    min_value = 0.1
    max_value = 0.2
    result = json.loads(
        ee.PixelType(precision, min_value, max_value).serialize()
    )
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        MAX_VALUE_KEY: {'constantValue': 0.2},
                        MIN_VALUE_KEY: {'constantValue': 0.1},
                        PRECISION_KEY: {'constantValue': precision},
                    },
                    'functionName': PIXELTYPE,
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_dimensions(self):
    expect = make_expression_graph({
        'arguments': {
            'pixelType': pixeltype_function_expr(Type.FLOAT),
        },
        'functionName': 'PixelType.dimensions',
    })
    expression = ee.PixelType(Type.FLOAT).dimensions()
    result = json.loads(expression.serialize())

    self.assertEqual(expect, result)

  def test_maxValue(self):
    expect = make_expression_graph({
        'arguments': {
            'pixelType': pixeltype_function_expr(Type.FLOAT),
        },
        'functionName': 'PixelType.maxValue',
    })
    expression = ee.PixelType(Type.FLOAT).maxValue()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_minValue(self):
    expect = make_expression_graph({
        'arguments': {
            'pixelType': pixeltype_function_expr(Type.FLOAT),
        },
        'functionName': 'PixelType.minValue',
    })
    expression = ee.PixelType(Type.FLOAT).minValue()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_precision(self):
    expect = make_expression_graph({
        'arguments': {
            'pixelType': pixeltype_function_expr(Type.FLOAT),
        },
        'functionName': 'PixelType.precision',
    })
    expression = ee.PixelType(Type.FLOAT).precision()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
