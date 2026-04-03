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
    # String input
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

    # List input
    color = ee.Color([1, 0, 0])
    result = json.loads(color.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {'input': {'constantValue': [1, 0, 0]}},
                    'functionName': 'Color',
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_static_methods_serialization(self):
    """Test serialization of ee.Color static methods."""
    # fromHsv
    color = ee.Color.fromHsv([0.1, 0.2, 0.3])
    node = json.loads(color.serialize())['values']['0']['functionInvocationValue']
    self.assertEqual('Color.fromHsv', node['functionName'])
    self.assertEqual([0.1, 0.2, 0.3], node['arguments']['hsv']['constantValue'])

    # fromHsl
    color = ee.Color.fromHsl([0.4, 0.5, 0.6])
    node = json.loads(color.serialize())['values']['0']['functionInvocationValue']
    self.assertEqual('Color.fromHsl', node['functionName'])
    self.assertEqual([0.4, 0.5, 0.6], node['arguments']['hsl']['constantValue'])

    # fromLab
    color = ee.Color.fromLab([10, 20, 30])
    node = json.loads(color.serialize())['values']['0']['functionInvocationValue']
    self.assertEqual('Color.fromLab', node['functionName'])
    self.assertEqual([10, 20, 30], node['arguments']['lab']['constantValue'])

    # fromLch
    color = ee.Color.fromLch([40, 50, 60])
    node = json.loads(color.serialize())['values']['0']['functionInvocationValue']
    self.assertEqual('Color.fromLch', node['functionName'])
    self.assertEqual([40, 50, 60], node['arguments']['lch']['constantValue'])

    # gray
    color = ee.Color.gray(0.7, 0.5)
    node = json.loads(color.serialize())['values']['0']['functionInvocationValue']
    self.assertEqual('Color.gray', node['functionName'])
    self.assertEqual(0.7, node['arguments']['value']['constantValue'])
    self.assertEqual(0.5, node['arguments']['alpha']['constantValue'])

    # mix (static)
    color = ee.Color.mix(ee.Color('red'), ee.Color('blue'), 0.8, 'hsv')
    result = json.loads(color.serialize())
    node = result['values'][result['result']]['functionInvocationValue']
    self.assertEqual('Color.mix', node['functionName'])
    self.assertEqual(0.8, node['arguments']['ratio']['constantValue'])
    self.assertEqual('hsv', node['arguments']['colorspace']['constantValue'])
    self.assertEqual('Color', node['arguments']['start']['functionInvocationValue']['functionName'])
    self.assertEqual('Color', node['arguments']['end']['functionInvocationValue']['functionName'])

  def test_instance_methods_serialization(self):
    """Test serialization of ee.Color instance methods."""
    # brighter
    color = ee.Color('red').brighter(0.9)
    result = json.loads(color.serialize())
    node = result['values'][result['result']]['functionInvocationValue']
    self.assertEqual('Color.brighter', node['functionName'])
    self.assertEqual(0.9, node['arguments']['scale']['constantValue'])
    self.assertEqual('Color', node['arguments']['color']['functionInvocationValue']['functionName'])

    # darker
    color = ee.Color('red').darker(0.1)
    result = json.loads(color.serialize())
    node = result['values'][result['result']]['functionInvocationValue']
    self.assertEqual('Color.darker', node['functionName'])
    self.assertEqual(0.1, node['arguments']['scale']['constantValue'])

    # toHsl, toHsv, toLab, toLch, toRgb, toHexString
    for method in ['toHsl', 'toHsv', 'toLab', 'toLch', 'toRgb', 'toHexString']:
      color = getattr(ee.Color('red'), method)()
      result = json.loads(color.serialize())
      node = result['values'][result['result']]['functionInvocationValue']
      expected_name = 'Color.' + (method.replace('Rgb', 'RGB') if method == 'toRgb' else method)
      self.assertEqual(expected_name, node['functionName'])
      self.assertIn('color', node['arguments'])


if __name__ == '__main__':
  unittest.main()
