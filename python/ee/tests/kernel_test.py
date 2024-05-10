#!/usr/bin/env python3
"""Tests for the ee.Kernel module."""

import json

import unittest
import ee
from ee import apitestcase


_KERNEL_JSON = {
    'result': '0',
    'values': {
        '0': {
            'functionInvocationValue': {
                'functionName': 'Kernel.square',
                'arguments': {
                    'magnitude': {'constantValue': 2},
                    'normalize': {'constantValue': True},
                    'radius': {'constantValue': 1},
                    'units': {'constantValue': 'pixels'},
                },
            }
        }
    },
}


class KernelTest(apitestcase.ApiTestCase):

  def test_square_args(self):
    kernel = ee.Kernel.square(1, 'pixels', True, 2)
    self.assertEqual({'value': 'fakeValue'}, kernel.getInfo())

    square_func = ee.ApiFunction.lookup('Kernel.square')
    self.assertEqual(square_func, kernel.func)
    self.assertFalse(kernel.isVariable())

    result = json.loads(kernel.serialize())
    self.assertEqual(_KERNEL_JSON, result)

  def test_square_kwargs(self):
    kernel = ee.Kernel.square(
        radius=1, units='pixels', normalize=True, magnitude=2
    )
    result = json.loads(kernel.serialize())
    self.assertEqual(_KERNEL_JSON, result)

  def test_cast(self):
    kernel = ee.Kernel(ee.Kernel.square(1, 'pixels', True, 2))
    result = json.loads(kernel.serialize())
    self.assertEqual(_KERNEL_JSON, result)

  @unittest.skip('Does not work on github with python <= 3.9')
  def test_no_args(self):
    message = (
        r'Kernel\.__init__\(\) missing 1 required positional argument:'
        r' \'kernel\''
    )
    with self.assertRaisesRegex(TypeError, message):
      ee.Kernel()  # pytype:disable=missing-parameter

  def test_wrong_type(self):
    message = (
        r'Kernel can only be used as a cast to Kernel\. Found <class'
        r' \'int\'>'
    )
    with self.assertRaisesRegex(TypeError, message):
      ee.Kernel(1234)  # pytype:disable=wrong-arg-types


if __name__ == '__main__':
  unittest.main()
