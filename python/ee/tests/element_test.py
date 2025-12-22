#!/usr/bin/env python3
"""Test for the ee.element module."""

import datetime

import unittest
import ee
from ee import apitestcase


class ElementTestCase(apitestcase.ApiTestCase):

  def test_set(self):
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
    dt = datetime.datetime.fromtimestamp(12345)
    AssertProperties({'foo': dt}, image.set('foo', dt))

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

  def test_set_one_arg_exception(self):
    with self.assertRaisesRegex(
        ee.EEException,
        r'When Element\.set\(\) is passed one argument, '
        r'it must be a dictionary\.',
    ):
      ee.Image(1).set('not a dictionary')

  def test_set_odd_args_exception(self):
    with self.assertRaisesRegex(
        ee.EEException,
        r'When Element\.set\(\) is passed multiple arguments, there '
        r'must be an even number of them\.',
    ):
      ee.Image(1).set('key1', 'value1', 'key2')

  def test_get_array(self):
    image = ee.Image(1)
    array_property = image.getArray('array_prop')
    self.assertIsInstance(array_property, ee.Array)
    self.assertEqual(
        ee.ApiFunction.lookup('Element.getArray'), array_property.func
    )
    self.assertEqual(
        {'object': image, 'property': ee.String('array_prop')},
        array_property.args,
    )

  def test_get_number(self):
    image = ee.Image(1)
    number_property = image.getNumber('number_prop')
    self.assertIsInstance(number_property, ee.Number)
    self.assertEqual(
        ee.ApiFunction.lookup('Element.getNumber'), number_property.func
    )
    self.assertEqual(
        {'object': image, 'property': ee.String('number_prop')},
        number_property.args,
    )

  def test_get_string(self):
    image = ee.Image(1)
    string_property = image.getString('string_prop')
    self.assertIsInstance(string_property, ee.String)
    self.assertEqual(
        ee.ApiFunction.lookup('Element.getString'), string_property.func
    )
    self.assertEqual(
        {'object': image, 'property': ee.String('string_prop')},
        string_property.args,
    )

  def test_property_names(self):
    image = ee.Image(1)
    property_names = image.propertyNames()
    self.assertIsInstance(property_names, ee.List)
    self.assertEqual(
        ee.ApiFunction.lookup('Element.propertyNames'), property_names.func
    )
    self.assertEqual({'element': image}, property_names.args)

  def test_to_dictionary(self):
    image = ee.Image(1)
    dictionary = image.toDictionary()
    self.assertIsInstance(dictionary, ee.Dictionary)
    self.assertEqual(
        ee.ApiFunction.lookup('Element.toDictionary'), dictionary.func
    )
    self.assertEqual({'element': image, 'properties': None}, dictionary.args)

    dictionary_with_props = image.toDictionary(['a', 'b'])
    self.assertIsInstance(dictionary_with_props, ee.Dictionary)
    self.assertEqual(
        ee.ApiFunction.lookup('Element.toDictionary'),
        dictionary_with_props.func,
    )
    self.assertEqual(
        {'element': image, 'properties': ee.List(['a', 'b'])},
        dictionary_with_props.args,
    )

  def test_init_opt_params(self):
    result = ee.Element(func=None, args=None, opt_varName='test').serialize()
    self.assertIn('"0": {"argumentReference": "test"}', result)


if __name__ == '__main__':
  unittest.main()
