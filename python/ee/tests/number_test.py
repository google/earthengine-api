#!/usr/bin/env python
"""Test for the ee.number module."""



import unittest

import ee
from ee import apitestcase


class NumberTest(apitestcase.ApiTestCase):

  def testNumber(self):
    """Verifies basic behavior of ee.Number."""
    num = ee.Number(1)
    self.assertEqual(1, num.encode())

    computed = ee.Number(1).add(2)
    self.assertIsInstance(computed, ee.Number)
    self.assertEqual(ee.ApiFunction.lookup('Number.add'), computed.func)
    self.assertEqual({
        'left': ee.Number(1),
        'right': ee.Number(2)
    }, computed.args)

  def testInternals(self):
    """Test eq(), ne() and hash()."""
    a = ee.Number(1)
    b = ee.Number(2.1)
    c = ee.Number(1)

    self.assertEqual(a, a)
    self.assertNotEqual(a, b)
    self.assertEqual(a, c)
    self.assertNotEqual(b, c)
    self.assertNotEqual(hash(a), hash(b))


if __name__ == '__main__':
  unittest.main()
