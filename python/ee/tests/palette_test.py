#!/usr/bin/env python3
"""Tests for the ee.Palette class."""

import unittest
import ee
from ee import apitestcase


class PaletteTest(apitestcase.ApiTestCase):

  def test_constructors(self):
    """Test the ee.Palette constructors."""
    self.assertEqual(ee.ApiFunction('Palette'), ee.Palette('spectral').func)
    self.assertEqual(
        {
            'colors': 'spectral',
            'mode': 'RGB',
            'min': 0.0,
            'max': 1.0,
            'padding': None,
            'classes': None,
            'positions': None,
            'correctLightness': False,
            'gamma': 1.0,
            'bezier': False,
        },
        ee.Palette('spectral').args,
    )

    self.assertEqual(
        ee.ApiFunction('Palette'), ee.Palette(['red', 'blue']).func
    )
    self.assertEqual(
        {
            'colors': ['red', 'blue'],
            'mode': 'RGB',
            'min': 0.0,
            'max': 1.0,
            'padding': None,
            'classes': None,
            'positions': None,
            'correctLightness': False,
            'gamma': 1.0,
            'bezier': False,
        },
        ee.Palette(['red', 'blue']).args,
    )

  def test_instance_methods(self):
    """Test the ee.Palette instance methods."""
    palette = ee.Palette('spectral')
    self.assertEqual(
        ee.ApiFunction('Palette.getColor'), palette.getColor(0.5).func
    )
    self.assertEqual(
        ee.ApiFunction('Palette.getColors'), palette.getColors(10).func
    )
    self.assertEqual(ee.ApiFunction('Palette.mode'), palette.mode('HSL').func)
    self.assertEqual(
        ee.ApiFunction('Palette.limits'), palette.limits(0, 100).func
    )
    self.assertEqual(
        ee.ApiFunction('Palette.positions'),
        palette.positions([0, 10, 100]).func,
    )
    self.assertEqual(ee.ApiFunction('Palette.classes'), palette.classes(5).func)
    self.assertEqual(
        ee.ApiFunction('Palette.padding'), palette.padding(0.1, 0.1).func
    )
    self.assertEqual(ee.ApiFunction('Palette.gamma'), palette.gamma(2.2).func)
    self.assertEqual(
        ee.ApiFunction('Palette.bezier'), palette.bezier(True).func
    )
    self.assertEqual(
        ee.ApiFunction('Palette.correctLightness'),
        palette.correctLightness(True).func,
    )


if __name__ == '__main__':
  unittest.main()
