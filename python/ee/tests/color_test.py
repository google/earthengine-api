#!/usr/bin/env python3
"""Tests for the ee.Color class."""

import json
import unittest
import ee
from ee import apitestcase


class ColorTest(apitestcase.ApiTestCase):

  def test_constructors(self):
    """Test the ee.Color constructors."""
    self.assertEqual('Color', ee.Color('red').func.getSignature()['name'])
    self.assertEqual({'input': 'red'}, ee.Color('red').args)

    self.assertEqual('Color', ee.Color([1, 0, 0]).func.getSignature()['name'])
    self.assertEqual({'input': [1, 0, 0]}, ee.Color([1, 0, 0]).args)

    self.assertEqual('Color', ee.Color(input='blue').func.getSignature()['name'])
    self.assertEqual({'input': 'blue'}, ee.Color(input='blue').args)

  def test_serialization(self):
    """Test the ee.Color serialization."""
    color = ee.Color('red')
    result = json.loads(color.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {'input': {'constantValue': 'red'}},
                    'functionName': 'Color',
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_static_methods(self):
    """Test the ee.Color static methods."""
    self.assertEqual(
        'Color.fromHsv', ee.Color.fromHsv([0, 1, 1]).func.getSignature()['name']
    )
    self.assertEqual(
        'Color.fromHsl',
        ee.Color.fromHsl([0, 1, 0.5]).func.getSignature()['name'],
    )
    self.assertEqual(
        'Color.fromLab',
        ee.Color.fromLab([50, 0, 0]).func.getSignature()['name'],
    )
    self.assertEqual(
        'Color.fromLch',
        ee.Color.fromLch([50, 0, 0]).func.getSignature()['name'],
    )
    self.assertEqual(
        'Color.gray', ee.Color.gray(0.5).func.getSignature()['name']
    )
    self.assertEqual(
        'Color.mix',
        ee.Color.mix(ee.Color('red'), ee.Color('blue')).func.getSignature()[
            'name'
        ],
    )

  def test_instance_methods(self):
    """Test the ee.Color instance methods."""
    color = ee.Color('red')
    self.assertEqual(
        'Color.brighter', color.brighter().func.getSignature()['name']
    )
    self.assertEqual(
        'Color.darker', color.darker().func.getSignature()['name']
    )
    self.assertEqual('Color.toHsl', color.toHsl().func.getSignature()['name'])
    self.assertEqual('Color.toHsv', color.toHsv().func.getSignature()['name'])
    self.assertEqual('Color.toLab', color.toLab().func.getSignature()['name'])
    self.assertEqual('Color.toLch', color.toLch().func.getSignature()['name'])
    self.assertEqual('Color.toRGB', color.toRgb().func.getSignature()['name'])
    self.assertEqual(
        'Color.toHexString', color.toHexString().func.getSignature()['name']
    )


if __name__ == '__main__':
  unittest.main()
