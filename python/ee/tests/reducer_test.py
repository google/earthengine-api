#!/usr/bin/env python3
"""Tests for ee.Reducer module."""

import json

import unittest
import ee
from ee import apitestcase

TO_LIST = 'Reducer.toList'


class ReducerTest(apitestcase.ApiTestCase):

  def test_simple(self):
    reducer = ee.Reducer.toList()
    self.assertEqual({'value': 'fakeValue'}, reducer.getInfo())

    reducer_func = ee.ApiFunction.lookup(TO_LIST)
    self.assertEqual(reducer_func, reducer.func)

    self.assertFalse(reducer.isVariable())
    self.assertEqual({}, reducer.args)

    result = json.loads(reducer.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'functionName': TO_LIST,
                    'arguments': {},
                }
            }
        },
    }
    self.assertEqual(expect, result)

    cast_result = json.loads(ee.Reducer(reducer).serialize())
    self.assertEqual(expect, cast_result)

  def test_no_args(self):
    message = r"missing 1 required positional argument: 'reducer'"
    with self.assertRaisesRegex(TypeError, message):
      ee.Reducer()  # pytype: disable=missing-parameter

  def test_bad_arg_literal(self):
    message = (
        r"Reducer can only be used as a cast to Reducer. Found <class 'int'>\."
    )
    with self.assertRaisesRegex(TypeError, message):
      ee.Reducer(1)  # pytype: disable=wrong-arg-types


if __name__ == '__main__':
  unittest.main()
