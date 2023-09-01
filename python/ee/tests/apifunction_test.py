#!/usr/bin/env python3
"""Test for the ee.apifunction module."""

import types

import ee
from ee import apitestcase
import unittest


class ApiFunctionTest(apitestcase.ApiTestCase):

  def testAddFunctions(self):
    """Verifies that addition of static and instance API functions."""

    # Check instance vs static functions, and trampling of
    # existing functions.
    class TestClass:

      def pre_addBands(self):  # pylint: disable=g-bad-name
        pass

    self.assertFalse(hasattr(TestClass, 'pre_load'))
    self.assertFalse(hasattr(TestClass, 'select'))
    self.assertFalse(hasattr(TestClass, 'pre_select'))
    self.assertTrue(hasattr(TestClass, 'pre_addBands'))
    self.assertFalse(hasattr(TestClass, '_pre_addBands'))

    ee.ApiFunction.importApi(TestClass, 'Image', 'Image', 'pre_')
    # pytype: disable=attribute-error
    self.assertNotIsInstance(TestClass.pre_load, types.MethodType)
    # pytype: enable=attribute-error
    self.assertFalse(hasattr(TestClass, 'select'))
    # Unbound methods are just functions in Python 3. Check both to maintain
    # backward compatibility.
    # pytype: disable=attribute-error
    self.assertIsInstance(TestClass.pre_select,
                          (types.FunctionType, types.MethodType))
    # pytype: enable=attribute-error
    self.assertIsInstance(TestClass.pre_addBands,
                          (types.FunctionType, types.MethodType))
    self.assertFalse(hasattr(TestClass, '_pre_addBands'))

    ee.ApiFunction.clearApi(TestClass)
    self.assertFalse(hasattr(TestClass, 'pre_load'))
    self.assertFalse(hasattr(TestClass, 'select'))
    self.assertFalse(hasattr(TestClass, 'pre_select'))
    self.assertTrue(hasattr(TestClass, 'pre_addBands'))
    self.assertFalse(hasattr(TestClass, '_pre_addBands'))

  def testAddFunctions_Inherited(self):
    """Verifies that inherited non-client functions can be overridden."""

    class Base:

      def ClientOverride(self):
        pass

    class Child(Base):
      pass

    ee.ApiFunction.importApi(Base, 'Image', 'Image')
    ee.ApiFunction.importApi(Child, 'Image', 'Image')
    self.assertEqual(Base.ClientOverride, Child.ClientOverride)
    # pytype: disable=attribute-error
    self.assertNotEqual(Base.addBands, Child.addBands)
    # pytype: enable=attribute-error


if __name__ == '__main__':
  unittest.main()
