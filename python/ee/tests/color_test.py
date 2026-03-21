#!/usr/bin/env python3
"""Tests for the ee.Color class."""

import unittest
import ee
from ee import apitestcase


class ColorTest(apitestcase.ApiTestCase):

  def test_constructors(self):
    """Test the ee.Color constructors."""
    self.assertEqual(ee.ApiFunction('Color'), ee.Color('red').func)
    self.assertEqual({'input': 'red'}, ee.Color('red').args)

    self.assertEqual(ee.ApiFunction('Color'), ee.Color([1, 0, 0]).func)
    self.assertEqual({'input': [1, 0, 0]}, ee.Color([1, 0, 0]).args)

  def test_static_methods(self):
    """Test the ee.Color static methods."""
    self.assertEqual(
        ee.ApiFunction('Color.fromHsv'), ee.Color.fromHsv([0, 1, 1]).func
    )
    self.assertEqual(
        ee.ApiFunction('Color.fromHsl'), ee.Color.fromHsl([0, 1, 0.5]).func
    )
    self.assertEqual(
        ee.ApiFunction('Color.fromLab'), ee.Color.fromLab([50, 0, 0]).func
    )
    self.assertEqual(
        ee.ApiFunction('Color.fromLch'), ee.Color.fromLch([50, 0, 0]).func
    )
    self.assertEqual(ee.ApiFunction('Color.gray'), ee.Color.gray(0.5).func)
    self.assertEqual(
        ee.ApiFunction('Color.mix'),
        ee.Color.mix(ee.Color('red'), ee.Color('blue')).func,
    )

  def test_instance_methods(self):
    """Test the ee.Color instance methods."""
    color = ee.Color('red')
    self.assertEqual(ee.ApiFunction('Color.brighter'), color.brighter().func)
    self.assertEqual(ee.ApiFunction('Color.darker'), color.darker().func)
    self.assertEqual(ee.ApiFunction('Color.toHsl'), color.toHsl().func)
    self.assertEqual(ee.ApiFunction('Color.toHsv'), color.toHsv().func)
    self.assertEqual(ee.ApiFunction('Color.toLab'), color.toLab().func)
    self.assertEqual(ee.ApiFunction('Color.toLch'), color.toLch().func)
    self.assertEqual(ee.ApiFunction('Color.toRGB'), color.toRgb().func)
    self.assertEqual(
        ee.ApiFunction('Color.toHexString'), color.toHexString().func
    )


if __name__ == '__main__':
  unittest.main()
