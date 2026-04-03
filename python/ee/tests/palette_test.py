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

  def test_static_methods(self):
    """Test the ee.Palette static methods."""
    self.assertEqual(
        'Palette.cubeHelix', ee.Palette.cubeHelix().func.getSignature()['name']
    )
    self.assertEqual('Palette.OrRd', ee.Palette.OrRd().func.getSignature()['name'])
    self.assertEqual(
        'Palette.Viridis', ee.Palette.Viridis().func.getSignature()['name']
    )

  def test_instance_methods(self):
    """Test the ee.Palette instance methods."""
    palette = ee.Palette('spectral')
    self.assertEqual(
        'Palette.getColor', palette.getColor(0.5).func.getSignature()['name']
    )
    self.assertEqual(
        'Palette.getColors', palette.getColors(10).func.getSignature()['name']
    )
    self.assertEqual(
        'Palette.mode', palette.mode('HSL').func.getSignature()['name']
    )
    self.assertEqual(
        'Palette.limits', palette.limits(0, 100).func.getSignature()['name']
    )
    self.assertEqual(
        'Palette.positions',
        palette.positions([0, 10, 100]).func.getSignature()['name'],
    )
    self.assertEqual(
        'Palette.classes', palette.classes(5).func.getSignature()['name']
    )
    self.assertEqual(
        'Palette.padding', palette.padding(0.1, 0.1).func.getSignature()['name']
    )
    self.assertEqual(
        'Palette.gamma', palette.gamma(2.2).func.getSignature()['name']
    )
    self.assertEqual(
        'Palette.bezier', palette.bezier(True).func.getSignature()['name']
    )
    self.assertEqual(
        'Palette.correctLightness',
        palette.correctLightness(True).func.getSignature()['name'],
    )


if __name__ == '__main__':
  unittest.main()
