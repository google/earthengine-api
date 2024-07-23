#!/usr/bin/env python3
"""Tests for ee_types.py."""

import datetime

import unittest
from ee import ee_list
from ee import ee_number
from ee import ee_types


class EeTypesTest(unittest.TestCase):

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


if __name__ == '__main__':
  unittest.main()
