#!/usr/bin/env python3
"""Test for the ee.number module."""

import json
from typing import Any, Dict
import unittest

import unittest
import ee
from ee import apitestcase


def make_expression_graph(
    function_invocation_value: Dict[str, Any],
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


class NumberTest(apitestcase.ApiTestCase):

  def testNumber(self):
    """Verifies basic behavior of ee.Number."""
    num = ee.Number(1)
    self.assertEqual(1, num.encode())

    computed = ee.Number(1).add(2)
    self.assertIsInstance(computed, ee.Number)
    self.assertEqual(ee.ApiFunction.lookup('Number.add'), computed.func)
    self.assertEqual({
        'left': ee.Number(1),
        'right': ee.Number(2)
    }, computed.args)

  def testInternals(self):
    """Test eq(), ne() and hash()."""
    a = ee.Number(1)
    b = ee.Number(2.1)
    c = ee.Number(1)

    self.assertEqual(a, a)
    self.assertNotEqual(a, b)
    self.assertEqual(a, c)
    self.assertNotEqual(b, c)
    self.assertNotEqual(hash(a), hash(b))

  def test_abs(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.abs',
    })
    expression = ee.Number(1).abs()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_acos(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.acos',
    })
    expression = ee.Number(1).acos()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_add(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.add',
    })
    expression = ee.Number(1).add(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).add(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  # `and` not possible with the python parser, so it is exposed as `And`.
  def test_and(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.and',
    })
    expression = ee.Number(1).And(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).And(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_asin(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.asin',
    })
    expression = ee.Number(1).asin()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_atan(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.atan',
    })
    expression = ee.Number(1).atan()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_atan2(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.atan2',
    })
    expression = ee.Number(1).atan2(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).atan2(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitCount(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.bitCount',
    })
    expression = ee.Number(1).bitCount()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitwiseAnd(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.bitwiseAnd',
    })
    expression = ee.Number(1).bitwiseAnd(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).bitwiseAnd(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitwiseNot(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.bitwiseNot',
    })
    expression = ee.Number(1).bitwiseNot()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitwiseOr(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.bitwiseOr',
    })
    expression = ee.Number(1).bitwiseOr(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).bitwiseOr(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_bitwiseXor(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.bitwiseXor',
    })
    expression = ee.Number(1).bitwiseXor(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).bitwiseXor(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_byte(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.byte',
    })
    expression = ee.Number(1).byte()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cbrt(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.cbrt',
    })
    expression = ee.Number(1).cbrt()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_ceil(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.ceil',
    })
    expression = ee.Number(1).ceil()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_clamp(self):
    expect = make_expression_graph({
        'arguments': {
            'number': {'constantValue': 1},
            'min': {'constantValue': 2},
            'max': {'constantValue': 3},
        },
        'functionName': 'Number.clamp',
    })
    expression = ee.Number(1).clamp(2, 3)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).clamp(min=2, max=3)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cos(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.cos',
    })
    expression = ee.Number(1).cos()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_cosh(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.cosh',
    })
    expression = ee.Number(1).cosh()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_digamma(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.digamma',
    })
    expression = ee.Number(1).digamma()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_divide(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.divide',
    })
    expression = ee.Number(1).divide(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).divide(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_double(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.double',
    })
    expression = ee.Number(1).double()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_eq(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.eq',
    })
    expression = ee.Number(1).eq(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).eq(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_erf(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.erf',
    })
    expression = ee.Number(1).erf()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_erfInv(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.erfInv',
    })
    expression = ee.Number(1).erfInv()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_erfc(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.erfc',
    })
    expression = ee.Number(1).erfc()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_erfcInv(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.erfcInv',
    })
    expression = ee.Number(1).erfcInv()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_exp(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.exp',
    })
    expression = ee.Number(1).exp()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_first(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.first',
    })
    expression = ee.Number(1).first(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).first(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_firstNonZero(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.firstNonZero',
    })
    expression = ee.Number(1).firstNonZero(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).firstNonZero(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_float(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.float',
    })
    expression = ee.Number(1).float()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_floor(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.floor',
    })
    expression = ee.Number(1).floor()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_format(self):
    expect = make_expression_graph({
        'arguments': {
            'number': {'constantValue': 1},
            'pattern': {'constantValue': 'a'},
        },
        'functionName': 'Number.format',
    })
    expression = ee.Number(1).format('a')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).format(pattern='a')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_gamma(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.gamma',
    })
    expression = ee.Number(1).gamma()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_gammainc(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.gammainc',
    })
    expression = ee.Number(1).gammainc(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).gammainc(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_gt(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.gt',
    })
    expression = ee.Number(1).gt(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).gt(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_gte(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.gte',
    })
    expression = ee.Number(1).gte(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).gte(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_hypot(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.hypot',
    })
    expression = ee.Number(1).hypot(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).hypot(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_int(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.int',
    })
    expression = ee.Number(1).int()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_int16(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.int16',
    })
    expression = ee.Number(1).int16()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_int32(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.int32',
    })
    expression = ee.Number(1).int32()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_int64(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.int64',
    })
    expression = ee.Number(1).int64()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_int8(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.int8',
    })
    expression = ee.Number(1).int8()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_lanczos(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.lanczos',
    })
    expression = ee.Number(1).lanczos()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_leftShift(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.leftShift',
    })
    expression = ee.Number(1).leftShift(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).leftShift(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_log(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.log',
    })
    expression = ee.Number(1).log()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_log10(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.log10',
    })
    expression = ee.Number(1).log10()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_long(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.long',
    })
    expression = ee.Number(1).long()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_lt(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.lt',
    })
    expression = ee.Number(1).lt(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).lt(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_lte(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.lte',
    })
    expression = ee.Number(1).lte(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).lte(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_max(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.max',
    })
    expression = ee.Number(1).max(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).max(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_min(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.min',
    })
    expression = ee.Number(1).min(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).min(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_mod(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.mod',
    })
    expression = ee.Number(1).mod(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).mod(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_multiply(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.multiply',
    })
    expression = ee.Number(1).multiply(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).multiply(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_neq(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.neq',
    })
    expression = ee.Number(1).neq(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).neq(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_not(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.not',
    })
    expression = ee.Number(1).Not()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_or(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.or',
    })
    expression = ee.Number(1).Or(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).Or(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  # TODO: test_parse.

  def test_pow(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.pow',
    })
    expression = ee.Number(1).pow(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).pow(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_rightShift(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.rightShift',
    })
    expression = ee.Number(1).rightShift(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).rightShift(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_round(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.round',
    })
    expression = ee.Number(1).round()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_short(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.short',
    })
    expression = ee.Number(1).short()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_signum(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.signum',
    })
    expression = ee.Number(1).signum()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sin(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.sin',
    })
    expression = ee.Number(1).sin()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sinh(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.sinh',
    })
    expression = ee.Number(1).sinh()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_sqrt(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.sqrt',
    })
    expression = ee.Number(1).sqrt()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_subtract(self):
    expect = make_expression_graph({
        'arguments': {
            'left': {'constantValue': 1},
            'right': {'constantValue': 2},
        },
        'functionName': 'Number.subtract',
    })
    expression = ee.Number(1).subtract(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).subtract(right=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_tan(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.tan',
    })
    expression = ee.Number(1).tan()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_tanh(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.tanh',
    })
    expression = ee.Number(1).tanh()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toByte(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.toByte',
    })
    expression = ee.Number(1).toByte()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toDouble(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.toDouble',
    })
    expression = ee.Number(1).toDouble()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toFloat(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.toFloat',
    })
    expression = ee.Number(1).toFloat()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toInt(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.toInt',
    })
    expression = ee.Number(1).toInt()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toInt16(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.toInt16',
    })
    expression = ee.Number(1).toInt16()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toInt32(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.toInt32',
    })
    expression = ee.Number(1).toInt32()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toInt64(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.toInt64',
    })
    expression = ee.Number(1).toInt64()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toInt8(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.toInt8',
    })
    expression = ee.Number(1).toInt8()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toLong(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.toLong',
    })
    expression = ee.Number(1).toLong()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toShort(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.toShort',
    })
    expression = ee.Number(1).toShort()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toUint16(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.toUint16',
    })
    expression = ee.Number(1).toUint16()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toUint32(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.toUint32',
    })
    expression = ee.Number(1).toUint32()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toUint8(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.toUint8',
    })
    expression = ee.Number(1).toUint8()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_trigamma(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.trigamma',
    })
    expression = ee.Number(1).trigamma()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_uint16(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.uint16',
    })
    expression = ee.Number(1).uint16()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_uint32(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.uint32',
    })
    expression = ee.Number(1).uint32()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_uint8(self):
    expect = make_expression_graph({
        'arguments': {
            'input': {'constantValue': 1},
        },
        'functionName': 'Number.uint8',
    })
    expression = ee.Number(1).uint8()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_unitScale(self):
    expect = make_expression_graph({
        'arguments': {
            'number': {'constantValue': 1},
            'min': {'constantValue': 2},
            'max': {'constantValue': 3},
        },
        'functionName': 'Number.unitScale',
    })
    expression = ee.Number(1).unitScale(2, 3)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Number(1).unitScale(min=2, max=3)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  @unittest.mock.patch.object(ee.ComputedObject, 'encode')
  def test_encode_opt_params(self, mock_encode):
    number = ee.Number(ee.Dictionary({'a': 3}).get('a'))

    mock_encoder = unittest.mock.Mock()
    number.encode(opt_encoder=mock_encoder)

    mock_encode.assert_called_once_with(mock_encoder)

  @unittest.mock.patch.object(ee.ComputedObject, 'encode_cloud_value')
  def test_encode_cloud_value_opt_params(self, mock_encode_cloud_value):
    number = ee.Number(ee.Dictionary({'a': 3}).get('a'))

    mock_encoder = unittest.mock.Mock()
    number.encode_cloud_value(opt_encoder=mock_encoder)

    mock_encode_cloud_value.assert_called_once_with(mock_encoder)


if __name__ == '__main__':
  unittest.main()
