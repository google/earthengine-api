#!/usr/bin/env python3
"""Tests for the ee.Terrain module."""

import json
from typing import Any

import unittest
import ee
from ee import apitestcase

# For an ee.Image(1).
IMAGE_1 = 1
IMAGE_EXPRESSION_1 = {
    'functionInvocationValue': {
        'functionName': 'Image.constant',
        'arguments': {'value': {'constantValue': IMAGE_1}},
    }
}


def make_expression_graph(
    function_invocation_value: dict[str, Any],
) -> dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


class TerrainTest(apitestcase.ApiTestCase):

  def test_aspect(self):
    expect = make_expression_graph({
        'functionName': 'Terrain.aspect',
        'arguments': {'input': IMAGE_EXPRESSION_1},
    })
    expression = ee.Terrain.aspect(IMAGE_1)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Terrain.aspect(input=IMAGE_1)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_fill_minima(self):
    border_value = 2
    neighborhood = 3
    expect = make_expression_graph({
        'functionName': 'Terrain.fillMinima',
        'arguments': {
            'image': IMAGE_EXPRESSION_1,
            'borderValue': {'constantValue': border_value},
            'neighborhood': {'constantValue': neighborhood},
        },
    })
    expression = ee.Terrain.fillMinima(IMAGE_1, border_value, neighborhood)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Terrain.fillMinima(
        image=IMAGE_1, borderValue=border_value, neighborhood=neighborhood
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_hill_shadow(self):
    azimuth = 2
    zenith = 3
    neighborhood_size = 4
    hysteresis = False
    expect = make_expression_graph({
        'functionName': 'Terrain.hillShadow',
        'arguments': {
            'image': IMAGE_EXPRESSION_1,
            'azimuth': {'constantValue': azimuth},
            'zenith': {'constantValue': zenith},
            'neighborhoodSize': {'constantValue': neighborhood_size},
            'hysteresis': {'constantValue': hysteresis},
        },
    })
    expression = ee.Terrain.hillShadow(
        IMAGE_1, azimuth, zenith, neighborhood_size, hysteresis
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Terrain.hillShadow(
        image=IMAGE_1,
        azimuth=azimuth,
        zenith=zenith,
        neighborhoodSize=neighborhood_size,
        hysteresis=hysteresis,
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_hillshade(self):
    azimuth = 2
    elevation = 3
    expect = make_expression_graph({
        'functionName': 'Terrain.hillshade',
        'arguments': {
            'input': IMAGE_EXPRESSION_1,
            'azimuth': {'constantValue': azimuth},
            'elevation': {'constantValue': elevation},
        },
    })
    expression = ee.Terrain.hillshade(IMAGE_1, azimuth, elevation)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Terrain.hillshade(
        input=IMAGE_1, azimuth=azimuth, elevation=elevation
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_products(self):
    expect = make_expression_graph({
        'functionName': 'Terrain.products',
        'arguments': {'input': IMAGE_EXPRESSION_1},
    })
    expression = ee.Terrain.products(IMAGE_1)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Terrain.products(input=IMAGE_1)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_slope(self):
    expect = make_expression_graph({
        'functionName': 'Terrain.slope',
        'arguments': {'input': IMAGE_EXPRESSION_1},
    })
    expression = ee.Terrain.slope(IMAGE_1)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Terrain.slope(input=IMAGE_1)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
