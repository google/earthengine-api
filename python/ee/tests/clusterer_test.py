#!/usr/bin/env python3
"""Tests for the ee.Clusterer module."""

import json

import unittest
import ee
from ee import apitestcase

_WEKA_COBWEB_SERIALIZED = {
    'result': '0',
    'values': {
        '0': {
            'functionInvocationValue': {
                'functionName': 'Clusterer.wekaCobweb',
                'arguments': {
                    'acuity': {'constantValue': 2},
                    'cutoff': {'constantValue': 0.01},
                    'seed': {'constantValue': 3},
                },
            }
        }
    },
}


class ClustererTest(apitestcase.ApiTestCase):

  def test_cobweb_args(self):
    clusterer = ee.Clusterer.wekaCobweb(2, 0.01, 3)
    self.assertEqual({'value': 'fakeValue'}, clusterer.getInfo())

    join_func = ee.ApiFunction.lookup('Clusterer.wekaCobweb')
    self.assertEqual(join_func, clusterer.func)
    self.assertFalse(clusterer.isVariable())

    result = json.loads(clusterer.serialize())
    self.assertEqual(_WEKA_COBWEB_SERIALIZED, result)

  def test_cobweb_kwargs(self):
    clusterer = ee.Clusterer.wekaCobweb(acuity=2, cutoff=0.01, seed=3)
    self.assertEqual({'value': 'fakeValue'}, clusterer.getInfo())

    join_func = ee.ApiFunction.lookup('Clusterer.wekaCobweb')
    self.assertEqual(join_func, clusterer.func)
    self.assertFalse(clusterer.isVariable())

    result = json.loads(clusterer.serialize())
    self.assertEqual(_WEKA_COBWEB_SERIALIZED, result)

  def test_cast(self):
    clusterer = ee.Clusterer(
        ee.Clusterer.wekaCobweb(acuity=2, cutoff=0.01, seed=3)
    )
    result = json.loads(clusterer.serialize())
    self.assertEqual(_WEKA_COBWEB_SERIALIZED, result)

  @unittest.skip('Does not work on github with python <= 3.9')
  def test_no_args(self):
    message = (
        r'Clusterer\.__init__\(\) missing 1 required positional argument:'
        r' \'clusterer\''
    )
    with self.assertRaisesRegex(TypeError, message):
      ee.Clusterer()  # pytype:disable=missing-parameter

  def test_wrong_type(self):
    message = (
        r'Clusterer can only be used as a cast to Clusterer\. Found <class'
        r' \'int\'>'
    )
    with self.assertRaisesRegex(TypeError, message):
      ee.Clusterer(1234)  # pytype:disable=wrong-arg-types


if __name__ == '__main__':
  unittest.main()
