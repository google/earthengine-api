#!/usr/bin/env python3
"""Tests for ee_types.py."""

import datetime

from absl.testing import parameterized

import unittest
from ee import apitestcase
from ee import ee_list
from ee import ee_number
from ee import ee_types


class EeTypesTest(apitestcase.ApiTestCase, parameterized.TestCase):

  def test_class_to_name(self):
    self.assertEqual('List', ee_types.classToName(ee_list.List))
    self.assertEqual('Number', ee_types.classToName(ee_number.Number))
    self.assertEqual('Number', ee_types.classToName(int))
    self.assertEqual('Number', ee_types.classToName(float))
    self.assertEqual('String', ee_types.classToName(str))
    self.assertEqual('Array', ee_types.classToName(tuple))
    self.assertEqual('Array', ee_types.classToName(list))
    self.assertEqual('Array', ee_types.classToName(list))
    self.assertEqual('Date', ee_types.classToName(datetime.datetime))

    class Foo:
      pass

    self.assertEqual('Object', ee_types.classToName(Foo))

  @parameterized.named_parameters(
      ('Image_Image', 'Image', 'Image', True),
      ('Element_Image', 'Element', 'Image', True),
      ('Image_Element', 'Image', 'Element', False),
      ('Collection_ImageCollection', 'Collection', 'ImageCollection', True),
      ('Collection_FeatureCollection', 'Collection', 'FeatureCollection', True),
      ('ImageCollection_Collection', 'ImageCollection', 'Collection', False),
      ('Image_Collection', 'Image', 'Collection', False),
      (
          'ImageCollection_FeatureCollection',
          'ImageCollection',
          'FeatureCollection',
          False,
      ),
      ('Object_Image', 'Object', 'Image', True),
      # TODO: Theses two tests should be false.
      ('FeatureCollection_Collection', 'FeatureCollection', 'Collection', True),
      (
          'FeatureCollection_ImageCollection',
          'FeatureCollection',
          'ImageCollection',
          True,
      ),
  )
  def test_is_subtype(self, type1, type2, expected):
    self.assertEqual(expected, ee_types.isSubtype(type1, type2))

  def test_is_array(self):
    self.assertTrue(ee_types.isArray([]))
    self.assertTrue(ee_types.isArray(()))
    self.assertTrue(ee_types.isArray(ee_list.List([1, 2])))
    self.assertFalse(ee_types.isArray(1))
    self.assertFalse(ee_types.isArray('string'))
    self.assertFalse(ee_types.isArray(ee_number.Number(1)))


if __name__ == '__main__':
  unittest.main()
