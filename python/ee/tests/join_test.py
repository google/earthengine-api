#!/usr/bin/env python3
"""Tests for the ee.Join module."""

import json
from typing import Any, Dict

import unittest
import ee
from ee import apitestcase

INNER = 'Join.inner'
SIMPLE = 'Join.simple'


def make_expression_graph(
    function_invocation_value: Dict[str, Any],
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


class JoinTest(apitestcase.ApiTestCase):

  def test_join_no_args(self):
    message = 'missing 1 required positional argument.*join'
    with self.assertRaisesRegex(TypeError, message):
      ee.Join()  # pytype:disable=missing-parameter

  def test_apply(self):
    expect = make_expression_graph({
        'arguments': {
            'condition': {
                'functionInvocationValue': {
                    'arguments': {
                        'leftField': {'constantValue': 'c'},
                        'rightValue': {'constantValue': 1},
                    },
                    'functionName': 'Filter.equals',
                }
            },
            'join': {
                'functionInvocationValue': {
                    'arguments': {},
                    'functionName': 'Join.inverted',
                }
            },
            'primary': {
                'functionInvocationValue': {
                    'arguments': {'tableId': {'constantValue': 'a'}},
                    'functionName': 'Collection.loadTable',
                }
            },
            'secondary': {
                'functionInvocationValue': {
                    'arguments': {'tableId': {'constantValue': 'b'}},
                    'functionName': 'Collection.loadTable',
                }
            },
        },
        'functionName': 'Join.apply',
    })
    expression = ee.Join.inverted().apply('a', 'b', ee.Filter.eq('c', 1))
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Join.inverted().apply(
        primary='a', secondary='b', condition=ee.Filter.eq(name='c', value=1)
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_inner_join(self):
    first = '1st'
    second = '2nd'
    join = ee.Join.inner(first, second)
    self.assertEqual({'value': 'fakeValue'}, join.getInfo())

    join_func = ee.ApiFunction.lookup(INNER)
    self.assertEqual(join_func, join.func)

    self.assertFalse(join.isVariable())
    args = join.args
    self.assertEqual(first, args['primaryKey']._string)
    self.assertEqual(second, args['secondaryKey']._string)

    result = json.loads(join.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        'primaryKey': {'constantValue': '1st'},
                        'secondaryKey': {'constantValue': '2nd'},
                    },
                    'functionName': INNER,
                }
            }
        },
    }
    self.assertEqual(expect, result)

    join_cast_result = json.loads(ee.Join(join).serialize())
    self.assertEqual(expect, join_cast_result)

  def test_inner(self):
    primary_key = 'a'
    secondary_key = 'b'
    measure_key = 'c'
    expect = make_expression_graph({
        'arguments': {
            'primaryKey': {'constantValue': primary_key},
            'secondaryKey': {'constantValue': secondary_key},
            'measureKey': {'constantValue': measure_key},
        },
        'functionName': 'Join.inner',
    })
    expression = ee.Join.inner(primary_key, secondary_key, measure_key)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Join.inner(
        primaryKey=primary_key,
        secondaryKey=secondary_key,
        measureKey=measure_key,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_inverted(self):
    expect = make_expression_graph({
        'arguments': {},
        'functionName': 'Join.inverted',
    })
    expression = ee.Join.inverted()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_save_all(self):
    matches_key = 'a'
    ordering = 'b'
    ascending = True
    measure_key = 'c'
    outer = False
    expect = make_expression_graph({
        'arguments': {
            'matchesKey': {'constantValue': matches_key},
            'ordering': {'constantValue': ordering},
            'ascending': {'constantValue': ascending},
            'measureKey': {'constantValue': measure_key},
            'outer': {'constantValue': outer},
        },
        'functionName': 'Join.saveAll',
    })
    expression = ee.Join.saveAll(
        matches_key, ordering, ascending, measure_key, outer
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Join.saveAll(
        matchesKey=matches_key,
        ordering=ordering,
        ascending=ascending,
        measureKey=measure_key,
        outer=outer,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_save_best(self):
    match_key = 'a'
    measure_key = 'b'
    outer = False
    expect = make_expression_graph({
        'arguments': {
            'matchKey': {'constantValue': match_key},
            'measureKey': {'constantValue': measure_key},
            'outer': {'constantValue': outer},
        },
        'functionName': 'Join.saveBest',
    })
    expression = ee.Join.saveBest(match_key, measure_key, outer)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Join.saveBest(
        matchKey=match_key, measureKey=measure_key, outer=outer
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_save_first(self):
    match_key = 'a'
    ordering = 'b'
    ascending = True
    measure_key = 'c'
    outer = False
    expect = make_expression_graph({
        'arguments': {
            'matchKey': {'constantValue': match_key},
            'ordering': {'constantValue': ordering},
            'ascending': {'constantValue': ascending},
            'measureKey': {'constantValue': measure_key},
            'outer': {'constantValue': outer},
        },
        'functionName': 'Join.saveFirst',
    })
    expression = ee.Join.saveFirst(
        match_key, ordering, ascending, measure_key, outer
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Join.saveFirst(
        matchKey=match_key,
        ordering=ordering,
        ascending=ascending,
        measureKey=measure_key,
        outer=outer,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_simple_join(self):
    join = ee.Join.simple()
    self.assertEqual({'value': 'fakeValue'}, join.getInfo())

    join_func = ee.ApiFunction.lookup(SIMPLE)
    self.assertEqual(join_func, join.func)

    self.assertFalse(join.isVariable())
    self.assertEqual({}, join.args)

    result = json.loads(join.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {},
                    'functionName': SIMPLE,
                }
            }
        },
    }
    self.assertEqual(expect, result)

    join_cast_result = json.loads(ee.Join(join).serialize())
    self.assertEqual(expect, join_cast_result)


if __name__ == '__main__':
  unittest.main()
