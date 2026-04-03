#!/usr/bin/env python3
"""Tests for the ee.Palette class."""

import json
import unittest
import ee
from ee import apitestcase


class PaletteTest(apitestcase.ApiTestCase):

  def test_constructors(self):
    """Test the ee.Palette constructors."""
    self.assertEqual('Palette', ee.Palette('spectral').func.getSignature()['name'])
    self.assertEqual({'colors': 'spectral'}, ee.Palette('spectral').args)

    self.assertEqual('Palette', ee.Palette(['red', 'blue']).func.getSignature()['name'])
    self.assertEqual({'colors': ['red', 'blue']}, ee.Palette(['red', 'blue']).args)

    self.assertEqual('Palette', ee.Palette(colors=['red', 'blue']).func.getSignature()['name'])
    self.assertEqual(
        {'colors': ['red', 'blue']}, ee.Palette(colors=['red', 'blue']).args
    )

  def test_serialization(self):
    """Test the ee.Palette serialization."""
    palette = ee.Palette(['red', 'blue'])
    result = json.loads(palette.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        'colors': {
                            'constantValue': ['red', 'blue']
                        },
                    },
                    'functionName': 'Palette',
                }
            }
        },
    }
    self.assertEqual(expect, result)

    # Full constructor (use positional to be dynamic-compatible)
    palette = ee.Palette(
        ['red', 'blue'],
        'hsv',
        10.0,
        20.0,
        [0.1, 0.2],
        [0, 10, 20],
        [0, 0.5, 1],
        True,
        2.2,
        True,
    )
    result = json.loads(palette.serialize())
    node = result['values'][result['result']]['functionInvocationValue']
    self.assertEqual('Palette', node['functionName'])
    args = node['arguments']
    self.assertEqual(['red', 'blue'], args['colors']['constantValue'])
    self.assertEqual('hsv', args['mode']['constantValue'])
    self.assertEqual(10.0, args['min']['constantValue'])
    self.assertEqual(20.0, args['max']['constantValue'])
    self.assertEqual([0.1, 0.2], args['padding']['constantValue'])
    self.assertEqual([0, 10, 20], args['classes']['constantValue'])
    self.assertEqual([0, 0.5, 1], args['positions']['constantValue'])
    self.assertTrue(args['correctLightness']['constantValue'])
    self.assertEqual(2.2, args['gamma']['constantValue'])
    self.assertTrue(args['bezier']['constantValue'])

  def test_static_methods_serialization(self):
    """Test serialization of ee.Palette static methods."""
    # cubeHelix (use positional)
    palette = ee.Palette.cubeHelix(
        0.5,
        1.0,
        2.0,
        1.5,
        0.1,
        0.9,
        0.8,
    )
    result = json.loads(palette.serialize())
    node = result['values'][result['result']]['functionInvocationValue']
    self.assertEqual('Palette.cubeHelix', node['functionName'])
    args = node['arguments']
    self.assertEqual(0.5, args['startHue']['constantValue'])
    self.assertEqual(1.0, args['rotations']['constantValue'])
    self.assertEqual(2.0, args['saturation']['constantValue'])
    self.assertEqual(1.5, args['gamma']['constantValue'])
    self.assertEqual(0.1, args['startLightness']['constantValue'])
    self.assertEqual(0.9, args['endLightness']['constantValue'])
    self.assertEqual(0.8, args['endHue']['constantValue'])

  def test_instance_methods_serialization(self):
    """Test serialization of ee.Palette instance methods."""
    palette = ee.Palette('spectral')

    # getColor
    res = palette.getColor(0.5)
    node = json.loads(res.serialize())['values'][json.loads(res.serialize())['result']]['functionInvocationValue']
    self.assertEqual('Palette.getColor', node['functionName'])
    self.assertEqual(0.5, node['arguments']['value']['constantValue'])
    self.assertEqual('Palette', node['arguments']['palette']['functionInvocationValue']['functionName'])

    # getColors
    res = palette.getColors(5)
    node = json.loads(res.serialize())['values'][json.loads(res.serialize())['result']]['functionInvocationValue']
    self.assertEqual('Palette.getColors', node['functionName'])
    self.assertEqual(5, node['arguments']['nColors']['constantValue'])

    # mode
    res = palette.mode('HSL')
    node = json.loads(res.serialize())['values'][json.loads(res.serialize())['result']]['functionInvocationValue']
    self.assertEqual('Palette.mode', node['functionName'])
    self.assertEqual('HSL', node['arguments']['mode']['constantValue'])

    # limits
    res = palette.limits(10, 20)
    node = json.loads(res.serialize())['values'][json.loads(res.serialize())['result']]['functionInvocationValue']
    self.assertEqual('Palette.limits', node['functionName'])
    self.assertEqual(10, node['arguments']['min']['constantValue'])
    self.assertEqual(20, node['arguments']['max']['constantValue'])

    # positions
    res = palette.positions([0, 1])
    node = json.loads(res.serialize())['values'][json.loads(res.serialize())['result']]['functionInvocationValue']
    self.assertEqual('Palette.positions', node['functionName'])
    self.assertEqual([0, 1], node['arguments']['positions']['constantValue'])

    # classes
    res = palette.classes(3)
    node = json.loads(res.serialize())['values'][json.loads(res.serialize())['result']]['functionInvocationValue']
    self.assertEqual('Palette.classes', node['functionName'])
    self.assertEqual(3, node['arguments']['classes']['constantValue'])

    # padding
    res = palette.padding(0.1, 0.2)
    node = json.loads(res.serialize())['values'][json.loads(res.serialize())['result']]['functionInvocationValue']
    self.assertEqual('Palette.padding', node['functionName'])
    self.assertEqual(0.1, node['arguments']['left']['constantValue'])
    self.assertEqual(0.2, node['arguments']['right']['constantValue'])

    # gamma
    res = palette.gamma(2.0)
    node = json.loads(res.serialize())['values'][json.loads(res.serialize())['result']]['functionInvocationValue']
    self.assertEqual('Palette.gamma', node['functionName'])
    self.assertEqual(2.0, node['arguments']['gamma']['constantValue'])

    # bezier
    res = palette.bezier(True)
    node = json.loads(res.serialize())['values'][json.loads(res.serialize())['result']]['functionInvocationValue']
    self.assertEqual('Palette.bezier', node['functionName'])
    self.assertTrue(node['arguments']['interpolate']['constantValue'])

    # correctLightness
    res = palette.correctLightness(True)
    node = json.loads(res.serialize())['values'][json.loads(res.serialize())['result']]['functionInvocationValue']
    self.assertEqual('Palette.correctLightness', node['functionName'])
    self.assertTrue(node['arguments']['correct']['constantValue'])


if __name__ == '__main__':
  unittest.main()
