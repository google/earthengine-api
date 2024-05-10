#!/usr/bin/env python3
"""Test for the ee.element module."""

import unittest
import ee
from ee import apitestcase


class ElementTestCase(apitestcase.ApiTestCase):

  def testSet(self):
    """Verifies Element.set() keyword argument interpretation."""
    image = ee.Image(1)

    # Constant dictionary.
    def AssertProperties(expected, image):
      properties = {}
      while image.func == ee.ApiFunction.lookup('Element.set'):
        key = image.args['key']
        if not isinstance(key, str):
          key = key.encode()
        properties[key] = image.args['value']
        image = image.args['object']
      self.assertEqual(ee.Image(1), image)
      self.assertEqual(expected, properties)

    AssertProperties({'foo': 'bar'}, image.set({'foo': 'bar'}))
    AssertProperties({'foo': 'bar'}, image.set({'properties': {'foo': 'bar'}}))
    AssertProperties({'properties': 5}, image.set({'properties': 5}))
    AssertProperties({'properties': {'foo': 'bar'}, 'baz': 'quux'},
                     image.set({'properties': {'foo': 'bar'}, 'baz': 'quux'}))
    AssertProperties({'foo': 'bar', 'baz': 'quux'},
                     image.set('foo', 'bar', 'baz', 'quux'))

    # Computed dictionary.
    computed_arg = ee.ComputedObject(None, None, 'foo')

    def CheckMultiProperties(result):
      self.assertEqual(ee.ApiFunction.lookup('Element.setMulti'), result.func)
      self.assertEqual({
          'object': image,
          'properties': ee.Dictionary(computed_arg)
      }, result.args)
    CheckMultiProperties(image.set(computed_arg))
    CheckMultiProperties(image.set({'properties': computed_arg}))

  def testInitOptParams(self):
    result = ee.Element(func=None, args=None, opt_varName='test').serialize()
    self.assertIn('"0": {"argumentReference": "test"}', result)


if __name__ == '__main__':
  unittest.main()
