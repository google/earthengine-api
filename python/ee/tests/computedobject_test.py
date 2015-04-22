#!/usr/bin/env python
"""Tests for the ee.computedobject module."""



import unittest

import ee

from ee import apitestcase


class ComputedObjectTest(apitestcase.ApiTestCase):

  def testComputedObject(self):
    """Verifies that untyped calls wrap the result in a ComputedObject."""

    result = ee.ApiFunction.call_('DateRange', 1, 2)
    self.assertTrue(isinstance(result.serialize(), basestring))
    self.assertEquals({'value': 'fakeValue'}, result.getInfo())

  def testInternals(self):
    """Test eq(), ne() and hash()."""
    a = ee.ApiFunction.call_('DateRange', 1, 2)
    b = ee.ApiFunction.call_('DateRange', 2, 3)
    c = ee.ApiFunction.call_('DateRange', 1, 2)

    self.assertEquals(a, a)
    self.assertNotEquals(a, b)
    self.assertEquals(a, c)
    self.assertNotEquals(b, c)
    self.assertNotEquals(hash(a), hash(b))


if __name__ == '__main__':
  unittest.main()
