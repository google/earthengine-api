#!/usr/bin/env python3
"""Tests for the ee.Join module."""

import json

import unittest
import ee
from ee import apitestcase

INNER = 'Join.inner'
SIMPLE = 'Join.simple'


class JoinTest(apitestcase.ApiTestCase):

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

  def test_join_no_args(self):
    message = 'missing 1 required positional argument.*join'
    with self.assertRaisesRegex(TypeError, message):
      ee.Join()  # pytype:disable=missing-parameter


if __name__ == '__main__':
  unittest.main()
