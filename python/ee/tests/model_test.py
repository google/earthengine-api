#!/usr/bin/env python3
"""Tests for the ee.Model module."""

import json
from typing import Any

import unittest
import ee
from ee import apitestcase

MODEL = 'Model'


def make_expression_graph(
    function_invocation_value: dict[str, Any],
) -> dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


def make_override_expression(key: str, pixel_type: str) -> dict[str, Any]:
  return {
      'dictionaryValue': {
          'values': {
              key: {
                  'functionInvocationValue': {
                      'functionName': 'PixelType',
                      'arguments': {
                          'precision': {
                              'functionInvocationValue': {
                                  'functionName': pixel_type,
                                  'arguments': {},
                              }
                          }
                      },
                  }
              }
          }
      }
  }


def make_type_expression(
    key: str, pixel_type: str, dimensions: int
) -> dict[str, Any]:
  return {
      'dictionaryValue': {
          'values': {
              key: {
                  'dictionaryValue': {
                      'values': {
                          'dimensions': {'constantValue': dimensions},
                          'type': {
                              'functionInvocationValue': {
                                  'functionName': 'PixelType',
                                  'arguments': {
                                      'precision': {
                                          'functionInvocationValue': {
                                              'functionName': pixel_type,
                                              'arguments': {},
                                          }
                                      }
                                  },
                              }
                          },
                      }
                  }
              }
          }
      }
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

  def test_from_ai_platform_predictor(self):
    project_name = 'some project'
    project_id = 'a project id'
    model_name = 'model name'
    version = 'a version'
    region = 'us-central1'
    input_properties = ['a', 'b']
    input_type_override = {'c': ee.PixelType.int8()}
    input_shapes = {'d': [1, 2]}
    proj = 'epsg:4326'
    fix_input_proj = True
    input_tile_size = [3, 4]
    input_overlap_size = [5, 6]
    output_tile_size = [7, 8]
    output_bands = {'e': {'type': ee.PixelType.int16(), 'dimensions': 10}}
    output_properties = {'f': {'type': ee.PixelType.int32(), 'dimensions': 11}}
    output_multiplier = 9.1

    expect = make_expression_graph({
        'functionName': 'Model.fromAiPlatformPredictor',
        'arguments': {
            'fixInputProj': {'constantValue': fix_input_proj},
            'inputOverlapSize': {'constantValue': input_overlap_size},
            'inputProperties': {'constantValue': input_properties},
            'inputShapes': {'constantValue': input_shapes},
            'inputTileSize': {'constantValue': input_tile_size},
            'inputTypeOverride': make_override_expression(
                'c', 'PixelType.int8'
            ),
            'modelName': {'constantValue': model_name},
            'outputBands': make_type_expression('e', 'PixelType.int16', 10),
            'outputMultiplier': {'constantValue': output_multiplier},
            'outputProperties': make_type_expression(
                'f', 'PixelType.int32', 11
            ),
            'outputTileSize': {'constantValue': output_tile_size},
            'proj': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': 'epsg:4326'}},
                }
            },
            'projectId': {'constantValue': project_id},
            'projectName': {'constantValue': project_name},
            'region': {'constantValue': region},
            'version': {'constantValue': version},
        },
    })
    expression = ee.Model.fromAiPlatformPredictor(
        project_name,
        project_id,
        model_name,
        version,
        region,
        input_properties,
        input_type_override,
        input_shapes,
        proj,
        fix_input_proj,
        input_tile_size,
        input_overlap_size,
        output_tile_size,
        output_bands,
        output_properties,
        output_multiplier,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Model.fromAiPlatformPredictor(
        projectName=project_name,
        projectId=project_id,
        modelName=model_name,
        version=version,
        region=region,
        inputProperties=input_properties,
        inputTypeOverride=input_type_override,
        inputShapes=input_shapes,
        proj=proj,
        fixInputProj=fix_input_proj,
        inputTileSize=input_tile_size,
        inputOverlapSize=input_overlap_size,
        outputTileSize=output_tile_size,
        outputBands=output_bands,
        outputProperties=output_properties,
        outputMultiplier=output_multiplier,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_from_vertex_ai(self):
    project = 'ee-demos'
    region = 'us-central1'
    endpoint_id = '5184137951335940096'
    endpoint = f'projects/{project}/locations/{region}/endpoints/{endpoint_id}'

    input_properties = ['a', 'b']
    input_type_override = {'c': ee.PixelType.int8()}
    input_shapes = {'d': [1, 2]}
    proj = 'epsg:4326'
    fix_input_proj = True
    input_tile_size = [3, 4]
    input_overlap_size = [5, 6]
    output_tile_size = [7, 8]
    output_bands = {'e': {'type': ee.PixelType.int16(), 'dimensions': 10}}
    output_properties = {'f': {'type': ee.PixelType.int32(), 'dimensions': 11}}
    output_multiplier = 9.1
    max_payload_bytes = 2014
    payload_format = 'RAW_JSON'

    expect = make_expression_graph({
        'functionName': 'Model.fromVertexAi',
        'arguments': {
            'endpoint': {'constantValue': endpoint},
            'fixInputProj': {'constantValue': fix_input_proj},
            'inputOverlapSize': {'constantValue': input_overlap_size},
            'inputProperties': {'constantValue': input_properties},
            'inputShapes': {'constantValue': input_shapes},
            'inputTileSize': {'constantValue': input_tile_size},
            'inputTypeOverride': make_override_expression(
                'c', 'PixelType.int8'
            ),
            'maxPayloadBytes': {'constantValue': max_payload_bytes},
            'outputBands': make_type_expression('e', 'PixelType.int16', 10),
            'outputMultiplier': {'constantValue': output_multiplier},
            'outputProperties': make_type_expression(
                'f', 'PixelType.int32', 11
            ),
            'outputTileSize': {'constantValue': output_tile_size},
            'payloadFormat': {'constantValue': payload_format},
            'proj': {
                'functionInvocationValue': {
                    'functionName': 'Projection',
                    'arguments': {'crs': {'constantValue': 'epsg:4326'}},
                }
            },
        },
    })
    expression = ee.Model.fromVertexAi(
        endpoint,
        input_properties,
        input_type_override,
        input_shapes,
        proj,
        fix_input_proj,
        input_tile_size,
        input_overlap_size,
        output_tile_size,
        output_bands,
        output_properties,
        output_multiplier,
        max_payload_bytes,
        payload_format,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Model.fromVertexAi(
        endpoint=endpoint,
        inputProperties=input_properties,
        inputTypeOverride=input_type_override,
        inputShapes=input_shapes,
        proj=proj,
        fixInputProj=fix_input_proj,
        inputTileSize=input_tile_size,
        inputOverlapSize=input_overlap_size,
        outputTileSize=output_tile_size,
        outputBands=output_bands,
        outputProperties=output_properties,
        outputMultiplier=output_multiplier,
        maxPayloadBytes=max_payload_bytes,
        payloadFormat=payload_format,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

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
