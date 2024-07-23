#!/usr/bin/env python3
"""Tests for the ee.Model module."""

import json

import unittest
import ee
from ee import apitestcase

MODEL = 'Model'


class ModelTest(apitestcase.ApiTestCase):

  def test_serialize(self):
    model = ee.Model.fromAiPlatformPredictor('some-project', 'some-model')
    result = json.loads(model.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'functionName': 'Model.fromAiPlatformPredictor',
                    'arguments': {
                        'projectId': {'constantValue': 'some-model'},
                        'projectName': {'constantValue': 'some-project'},
                    },
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_cast(self):
    model = ee.Model(
        ee.Model.fromAiPlatformPredictor('some-project', 'some-model')
    )
    result = json.loads(model.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'functionName': 'Model.fromAiPlatformPredictor',
                    'arguments': {
                        'projectId': {'constantValue': 'some-model'},
                        'projectName': {'constantValue': 'some-project'},
                    },
                }
            }
        },
    }
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
