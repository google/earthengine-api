#!/usr/bin/env python3
"""Tests for ee_types.py."""

import datetime

import unittest
from ee import apitestcase
from ee import ee_list
from ee import ee_number
from ee import ee_types


class EeTypesTest(apitestcase.ApiTestCase):

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

  def test_is_subtype(self):
    self.assertTrue(ee_types.isSubtype('Image', 'Image'))
    self.assertTrue(ee_types.isSubtype('Element', 'Image'))
    self.assertFalse(ee_types.isSubtype('Image', 'Element'))

    self.assertTrue(ee_types.isSubtype('Collection', 'ImageCollection'))
    self.assertTrue(ee_types.isSubtype('Collection', 'FeatureCollection'))

    self.assertFalse(ee_types.isSubtype('ImageCollection', 'Collection'))

    self.assertFalse(ee_types.isSubtype('Image', 'Collection'))
    self.assertFalse(ee_types.isSubtype('ImageCollection', 'FeatureCollection'))

    # TODO: Theses should be false.
    self.assertTrue(ee_types.isSubtype('FeatureCollection', 'Collection'))
    self.assertTrue(ee_types.isSubtype('FeatureCollection', 'ImageCollection'))

  def test_is_array(self):
    self.assertTrue(ee_types.isArray([]))
    self.assertTrue(ee_types.isArray(()))
    self.assertTrue(ee_types.isArray(ee_list.List([1, 2])))
    self.assertFalse(ee_types.isArray(1))
    self.assertFalse(ee_types.isArray('string'))
    self.assertFalse(ee_types.isArray(ee_number.Number(1)))


if __name__ == '__main__':
  unittest.main()
