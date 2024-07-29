#!/usr/bin/env python3
"""Tests for the ee.Model module."""

import json
from typing import Any, Dict

import unittest
import ee
from ee import apitestcase

MODEL = 'Model'


def make_expression_graph(
    function_invocation_value: Dict[str, Any],
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


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

  # TODO: test_from_ai_platform_predictor
  # TODO: test_from_vertex_ai

  def test_predict_image(self):
    end_point = 'an end point'
    model = ee.Model.fromVertexAi(end_point)
    image_name = 'an image'
    image = ee.Image(image_name)

    expect = make_expression_graph({
        'arguments': {
            'model': {
                'functionInvocationValue': {
                    'functionName': 'Model.fromVertexAi',
                    'arguments': {'endpoint': {'constantValue': end_point}},
                }
            },
            'image': {
                'functionInvocationValue': {
                    'functionName': 'Image.load',
                    'arguments': {'id': {'constantValue': image_name}},
                }
            },
        },
        'functionName': 'Model.predictImage',
    })
    expression = model.predictImage(image)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = model.predictImage(image=image)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_predict_properties(self):
    end_point = 'an end point'
    model = ee.Model.fromVertexAi(end_point)
    feature_collection_name = 'a feature collection'
    collection = fc = ee.FeatureCollection(feature_collection_name)
    expect = make_expression_graph({
        'arguments': {
            'model': {
                'functionInvocationValue': {
                    'functionName': 'Model.fromVertexAi',
                    'arguments': {'endpoint': {'constantValue': end_point}},
                }
            },
            'collection': {
                'functionInvocationValue': {
                    'functionName': 'Collection.loadTable',
                    'arguments': {
                        'tableId': {'constantValue': 'a feature collection'}
                    },
                }
            },
        },
        'functionName': 'Model.predictProperties',
    })
    expression = model.predictProperties(collection)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = model.predictProperties(collection=collection)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
