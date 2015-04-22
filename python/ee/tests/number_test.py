#!/usr/bin/env python
"""Test for the ee.number module."""



import unittest

import ee
from ee import apitestcase


class NumberTest(apitestcase.ApiTestCase):

  def testNumber(self):
    """Verifies basic behavior of ee.Number."""
    num = ee.Number(1)
    self.assertEquals(1, num.encode())

    computed = ee.Number(1).add(2)
    self.assertTrue(isinstance(computed, ee.Number))
    self.assertEquals(ee.ApiFunction.lookup('Number.add'), computed.func)
    self.assertEquals({'left': ee.Number(1), 'right': ee.Number(2)},
                      computed.args)

  def testInternals(self):
    """Test eq(), ne() and hash()."""
    a = ee.Number(1)
    b = ee.Number(2.1)
    c = ee.Number(1)

    self.assertEquals(a, a)
    self.assertNotEquals(a, b)
    self.assertEquals(a, c)
    self.assertNotEquals(b, c)
    self.assertNotEquals(hash(a), hash(b))


if __name__ == '__main__':
  unittest.main()
