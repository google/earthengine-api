#!/usr/bin/env python3
"""Tests for the ee.ConfusionMatrix module."""

import json

import ee
from ee import apitestcase
import unittest


class ConfusionMatrixTest(apitestcase.ApiTestCase):

  def test_init(self):
    array = ee.Array([[0, 0], [0, 0]])
    order = ee.List([2, 1])
    confusion_matrix = ee.ConfusionMatrix(array, order)
    self.assertEqual({'value': 'fakeValue'}, confusion_matrix.getInfo())

    func = ee.ApiFunction.lookup('ConfusionMatrix')
    self.assertEqual(func, confusion_matrix.func)
    self.assertFalse(confusion_matrix.isVariable())
    self.assertEqual({'array': array, 'order': order}, confusion_matrix.args)

  def test_init_order_literal(self):
    array = ee.Array([[0, 0], [0, 0]])
    order = [2, 1]
    confusion_matrix = ee.ConfusionMatrix(array, order)
    self.assertEqual({'value': 'fakeValue'}, confusion_matrix.getInfo())

    func = ee.ApiFunction.lookup('ConfusionMatrix')
    self.assertEqual(func, confusion_matrix.func)
    self.assertFalse(confusion_matrix.isVariable())
    self.assertEqual(
        {'array': array, 'order': ee.List(order)}, confusion_matrix.args
    )

  def test_init_no_order(self):
    array = ee.Array([[0, 0], [0, 0]])
    confusion_matrix = ee.ConfusionMatrix(array, None)
    self.assertEqual({'value': 'fakeValue'}, confusion_matrix.getInfo())

    func = ee.ApiFunction.lookup('ConfusionMatrix')
    self.assertEqual(func, confusion_matrix.func)
    self.assertFalse(confusion_matrix.isVariable())
    self.assertEqual({'array': array}, confusion_matrix.args)

  def test_serialize(self):
    confusion_matrix = ee.ConfusionMatrix(ee.Array([[0, 0], [0, 0]]), [1, 2])
    result = json.loads(confusion_matrix.serialize())
    expected = {
        'result': '0',
        'values': {
            '1': {'constantValue': [0, 0]},
            '0': {
                'functionInvocationValue': {
                    'functionName': 'ConfusionMatrix',
                    'arguments': {
                        'array': {
                            'functionInvocationValue': {
                                'functionName': 'Array',
                                'arguments': {
                                    'values': {
                                        'arrayValue': {
                                            'values': [
                                                {'valueReference': '1'},
                                                {'valueReference': '1'},
                                            ]
                                        }
                                    }
                                },
                            }
                        },
                        'order': {'constantValue': [1, 2]},
                    },
                }
            },
        },
    }
    self.assertEqual(expected, result)

  def test_cast(self):
    array = ee.Array([[0, 0], [0, 0]])
    order = ee.List([2, 1])
    confusion_matrix = ee.ConfusionMatrix(array, order)
    result = json.loads(ee.ConfusionMatrix(confusion_matrix).serialize())
    expect = {
        'result': '0',
        'values': {
            '1': {'constantValue': [0, 0]},
            '0': {
                'functionInvocationValue': {
                    'functionName': 'ConfusionMatrix',
                    'arguments': {
                        'array': {
                            'functionInvocationValue': {
                                'functionName': 'Array',
                                'arguments': {
                                    'values': {
                                        'arrayValue': {
                                            'values': [
                                                {'valueReference': '1'},
                                                {'valueReference': '1'},
                                            ]
                                        }
                                    }
                                },
                            }
                        },
                        'order': {'constantValue': [2, 1]},
                    },
                }
            },
        },
    }
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
