#!/usr/bin/env python3
"""Tests for the ee.Array module."""

import json
from typing import Any, Dict

import unittest
import ee
from ee import apitestcase

ARRAY_ONE = {
    'functionInvocationValue': {
        'functionName': 'Array',
        'arguments': {'values': {'constantValue': [1]}},
    }
}

ARRAY_TWO = {
    'functionInvocationValue': {
        'functionName': 'Array',
        'arguments': {'values': {'constantValue': [2]}},
    }
}


def make_expression_graph(
    function_invocation_value: Dict[str, Any],
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


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

  def test_abs(self):
    expect = make_expression_graph({
        'functionName': 'Array.abs',
        'arguments': {
            'input': ARRAY_ONE,
        },
    })
    expression = ee.Array([1]).abs()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_accum(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
            'axis': {'constantValue': 2},
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.sum',
                    'arguments': {},
                }
            },
        },
        'functionName': 'Array.accum',
    })
    expression = ee.Array([1]).accum(2, ee.Reducer.sum())
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).accum(axis=2, reducer=ee.Reducer.sum())
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_acos(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.acos',
    })
    expression = ee.Array([1]).acos()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_add(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.add',
    })
    expression = ee.Array([1]).add([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).add(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_and(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.and',
    })
    expression = ee.Array([1]).And([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).And(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_argmax(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
        },
        'functionName': 'Array.argmax',
    })
    expression = ee.Array([1]).argmax()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_asin(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.asin',
    })
    expression = ee.Array([1]).asin()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_atan(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.atan',
    })
    expression = ee.Array([1]).atan()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_atan2(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.atan2',
    })
    expression = ee.Array([1]).atan2([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).atan2(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitCount(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.bitCount',
    })
    expression = ee.Array([1]).bitCount()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    # TODO: test_bitsToArray

  def test_bitwise_and(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.bitwiseAnd',
    })
    expression = ee.Array([1]).bitwiseAnd([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).bitwiseAnd(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitwise_not(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.bitwiseNot',
    })
    expression = ee.Array([1]).bitwiseNot()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitwise_or(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.bitwiseOr',
    })
    expression = ee.Array([1]).bitwiseOr([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).bitwiseOr(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitwise_xor(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.bitwiseXor',
    })
    expression = ee.Array([1]).bitwiseXor([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).bitwiseXor(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_byte(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.byte',
    })
    expression = ee.Array([1]).byte()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  # TODO: test_cat

  def test_cbrt(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.cbrt',
    })
    expression = ee.Array([1]).cbrt()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_ceil(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.ceil',
    })
    expression = ee.Array([1]).ceil()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cos(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.cos',
    })
    expression = ee.Array([1]).cos()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cosh(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.cosh',
    })
    expression = ee.Array([1]).cosh()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cut(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
            'position': {'constantValue': [2]},
        },
        'functionName': 'Array.cut',
    })
    expression = ee.Array([1]).cut([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).cut(position=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_digamma(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.digamma',
    })
    expression = ee.Array([1]).digamma()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_divide(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.divide',
    })
    expression = ee.Array([1]).divide([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).divide(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_dot_product(self):
    expect = make_expression_graph({
        'arguments': {
            'array1': ARRAY_ONE,
            'array2': ARRAY_TWO,
        },
        'functionName': 'Array.dotProduct',
    })
    expression = ee.Array([1]).dotProduct([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).dotProduct(array2=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_double(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.double',
    })
    expression = ee.Array([1]).double()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_eigen(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.eigen',
    })
    expression = ee.Array([1]).eigen()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_eq(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.eq',
    })
    expression = ee.Array([1]).eq([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).eq(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_erf(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.erf',
    })
    expression = ee.Array([1]).erf()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_erfInv(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.erfInv',
    })
    expression = ee.Array([1]).erfInv()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_erfc(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.erfc',
    })
    expression = ee.Array([1]).erfc()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_erfcInv(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.erfcInv',
    })
    expression = ee.Array([1]).erfcInv()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_exp(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.exp',
    })
    expression = ee.Array([1]).exp()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_first(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.first',
    })
    expression = ee.Array([1]).first([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).first(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_firstNonZero(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.firstNonZero',
    })
    expression = ee.Array([1]).firstNonZero([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).firstNonZero(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_float(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.float',
    })
    expression = ee.Array([1]).float()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_floor(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.floor',
    })
    expression = ee.Array([1]).floor()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_gamma(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.gamma',
    })
    expression = ee.Array([1]).gamma()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_gammainc(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.gammainc',
    })
    expression = ee.Array([1]).gammainc([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).gammainc(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_get(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
            'position': {'constantValue': [2]},
        },
        'functionName': 'Array.get',
    })
    expression = ee.Array([1]).get([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).get(position=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_gt(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.gt',
    })
    expression = ee.Array([1]).gt([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).gt(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_gte(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.gte',
    })
    expression = ee.Array([1]).gte([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).gte(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_hypot(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.hypot',
    })
    expression = ee.Array([1]).hypot([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).hypot(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  # TODO: test_identity

  def test_int(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.int',
    })
    expression = ee.Array([1]).int()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_int16(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.int16',
    })
    expression = ee.Array([1]).int16()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_int32(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.int32',
    })
    expression = ee.Array([1]).int32()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_int64(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.int64',
    })
    expression = ee.Array([1]).int64()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_int8(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.int8',
    })
    expression = ee.Array([1]).int8()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_lanczos(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.lanczos',
    })
    expression = ee.Array([1]).lanczos()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_leftShift(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.leftShift',
    })
    expression = ee.Array([1]).leftShift([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).leftShift(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_length(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
        },
        'functionName': 'Array.length',
    })
    expression = ee.Array([1]).length()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_log(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.log',
    })
    expression = ee.Array([1]).log()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_log10(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.log10',
    })
    expression = ee.Array([1]).log10()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_long(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.long',
    })
    expression = ee.Array([1]).long()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_lt(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.lt',
    })
    expression = ee.Array([1]).lt([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).lt(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_lte(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.lte',
    })
    expression = ee.Array([1]).lte([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).lte(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_mask(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
            'mask': ARRAY_TWO,
        },
        'functionName': 'Array.mask',
    })
    expression = ee.Array([1]).mask([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).mask(mask=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrixCholeskyDecomposition(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
        },
        'functionName': 'Array.matrixCholeskyDecomposition',
    })
    expression = ee.Array([1]).matrixCholeskyDecomposition()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrixDeterminant(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.matrixDeterminant',
    })
    expression = ee.Array([1]).matrixDeterminant()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrixDiagonal(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.matrixDiagonal',
    })
    expression = ee.Array([1]).matrixDiagonal()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrixFnorm(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.matrixFnorm',
    })
    expression = ee.Array([1]).matrixFnorm()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrixInverse(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.matrixInverse',
    })
    expression = ee.Array([1]).matrixInverse()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrixLUDecomposition(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
        },
        'functionName': 'Array.matrixLUDecomposition',
    })
    expression = ee.Array([1]).matrixLUDecomposition()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrixMultiply(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.matrixMultiply',
    })
    expression = ee.Array([1]).matrixMultiply([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).matrixMultiply(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrixPseudoInverse(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.matrixPseudoInverse',
    })
    expression = ee.Array([1]).matrixPseudoInverse()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrixQRDecomposition(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
        },
        'functionName': 'Array.matrixQRDecomposition',
    })
    expression = ee.Array([1]).matrixQRDecomposition()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrixSingularValueDecomposition(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
        },
        'functionName': 'Array.matrixSingularValueDecomposition',
    })
    expression = ee.Array([1]).matrixSingularValueDecomposition()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrixSolve(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.matrixSolve',
    })
    expression = ee.Array([1]).matrixSolve([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).matrixSolve(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrixToDiag(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.matrixToDiag',
    })
    expression = ee.Array([1]).matrixToDiag()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrixTrace(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.matrixTrace',
    })
    expression = ee.Array([1]).matrixTrace()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_matrixTranspose(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
            'axis1': {'constantValue': 2},
            'axis2': {'constantValue': 3},
        },
        'functionName': 'Array.matrixTranspose',
    })
    expression = ee.Array([1]).matrixTranspose(2, 3)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).matrixTranspose(axis1=2, axis2=3)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_max(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.max',
    })
    expression = ee.Array([1]).max([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).max(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_min(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.min',
    })
    expression = ee.Array([1]).min([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).min(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_mod(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.mod',
    })
    expression = ee.Array([1]).mod([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).mod(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_multiply(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.multiply',
    })
    expression = ee.Array([1]).multiply([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).multiply(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_neq(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.neq',
    })
    expression = ee.Array([1]).neq([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).neq(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_not(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.not',
    })
    expression = ee.Array([1]).Not()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_or(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.or',
    })
    expression = ee.Array([1]).Or([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).Or(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_pad(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
            'lengths': {'constantValue': [2]},
            'pad': {'constantValue': 3},
        },
        'functionName': 'Array.pad',
    })
    expression = ee.Array([1]).pad([2], 3)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).pad(lengths=[2], pad=3)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_pow(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.pow',
    })
    expression = ee.Array([1]).pow([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).pow(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_project(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
            'axes': {'constantValue': [2]},
        },
        'functionName': 'Array.project',
    })
    expression = ee.Array([1]).project([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).project(axes=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_reduce(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
            'reducer': {
                'functionInvocationValue': {
                    'functionName': 'Reducer.sum',
                    'arguments': {},
                }
            },
            'axes': {'constantValue': [2]},
            'fieldAxis': {'constantValue': 3},
        },
        'functionName': 'Array.reduce',
    })
    expression = ee.Array([1]).reduce(ee.Reducer.sum(), [2], 3)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).reduce(
        reducer=ee.Reducer.sum(), axes=[2], fieldAxis=3
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_repeat(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
            'axis': {'constantValue': 2},
            'copies': {'constantValue': 3},
        },
        'functionName': 'Array.repeat',
    })
    expression = ee.Array([1]).repeat(2, 3)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).repeat(axis=2, copies=3)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_reshape(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
            'shape': ARRAY_TWO,
        },
        'functionName': 'Array.reshape',
    })
    expression = ee.Array([1]).reshape([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).reshape(shape=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_rightShift(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.rightShift',
    })
    expression = ee.Array([1]).rightShift([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).rightShift(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_round(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.round',
    })
    expression = ee.Array([1]).round()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_short(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.short',
    })
    expression = ee.Array([1]).short()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_signum(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.signum',
    })
    expression = ee.Array([1]).signum()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sin(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.sin',
    })
    expression = ee.Array([1]).sin()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sinh(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.sinh',
    })
    expression = ee.Array([1]).sinh()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_slice(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
            'axis': {'constantValue': 2},
            'start': {'constantValue': 3},
            'end': {'constantValue': 4},
            'step': {'constantValue': 5},
        },
        'functionName': 'Array.slice',
    })
    expression = ee.Array([1]).slice(2, 3, 4, 5)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).slice(axis=2, start=3, end=4, step=5)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sort(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
            'keys': ARRAY_TWO,
        },
        'functionName': 'Array.sort',
    })
    expression = ee.Array([1]).sort([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).sort(keys=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sqrt(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.sqrt',
    })
    expression = ee.Array([1]).sqrt()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_subtract(self):
    expect = make_expression_graph({
        'arguments': {
            'left': ARRAY_ONE,
            'right': ARRAY_TWO,
        },
        'functionName': 'Array.subtract',
    })
    expression = ee.Array([1]).subtract([2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).subtract(right=[2])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_tan(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.tan',
    })
    expression = ee.Array([1]).tan()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_tanh(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.tanh',
    })
    expression = ee.Array([1]).tanh()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toByte(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.toByte',
    })
    expression = ee.Array([1]).toByte()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toDouble(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.toDouble',
    })
    expression = ee.Array([1]).toDouble()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toFloat(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.toFloat',
    })
    expression = ee.Array([1]).toFloat()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toInt(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.toInt',
    })
    expression = ee.Array([1]).toInt()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toInt16(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.toInt16',
    })
    expression = ee.Array([1]).toInt16()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toInt32(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.toInt32',
    })
    expression = ee.Array([1]).toInt32()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toInt64(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.toInt64',
    })
    expression = ee.Array([1]).toInt64()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toInt8(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.toInt8',
    })
    expression = ee.Array([1]).toInt8()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toList(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
        },
        'functionName': 'Array.toList',
    })
    expression = ee.Array([1]).toList()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toLong(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.toLong',
    })
    expression = ee.Array([1]).toLong()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toShort(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.toShort',
    })
    expression = ee.Array([1]).toShort()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toUint16(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.toUint16',
    })
    expression = ee.Array([1]).toUint16()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toUint32(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.toUint32',
    })
    expression = ee.Array([1]).toUint32()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toUint8(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.toUint8',
    })
    expression = ee.Array([1]).toUint8()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_transpose(self):
    expect = make_expression_graph({
        'arguments': {
            'array': ARRAY_ONE,
            'axis1': {'constantValue': 2},
            'axis2': {'constantValue': 3},
        },
        'functionName': 'Array.transpose',
    })
    expression = ee.Array([1]).transpose(2, 3)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Array([1]).transpose(axis1=2, axis2=3)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_trigamma(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.trigamma',
    })
    expression = ee.Array([1]).trigamma()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_uint16(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.uint16',
    })
    expression = ee.Array([1]).uint16()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_uint32(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.uint32',
    })
    expression = ee.Array([1]).uint32()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_uint8(self):
    expect = make_expression_graph({
        'arguments': {
            'input': ARRAY_ONE,
        },
        'functionName': 'Array.uint8',
    })
    expression = ee.Array([1]).uint8()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
