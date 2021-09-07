#!/usr/bin/env python
"""Test for the ee.string module."""



import unittest

import ee
from ee import apitestcase


class StringTest(apitestcase.ApiTestCase):

  def testString(self):
    """Verifies basic behavior of ee.String."""
    bare_string = ee.String('foo')
    self.assertEqual('foo', bare_string.encode())

    computed = ee.String('foo').cat('bar')
    self.assertIsInstance(computed, ee.String)
    self.assertEqual(ee.ApiFunction.lookup('String.cat'), computed.func)
    self.assertEqual({
        'string1': ee.String('foo'),
        'string2': ee.String('bar')
    }, computed.args)

    # Casting a non-string ComputedObject.
    obj = ee.Number(1).add(1)
    s = ee.String(obj)
    self.assertIsInstance(s, ee.String)
    self.assertEqual(ee.ApiFunction.lookup('String'), s.func)
    self.assertEqual({'input': obj}, s.args)

  def testInternals(self):
    """Test eq(), ne() and hash()."""
    a = ee.String('one')
    b = ee.String('two')
    c = ee.String('one')

    self.assertEqual(a, a)
    self.assertNotEqual(a, b)
    self.assertEqual(a, c)
    self.assertNotEqual(b, c)
    self.assertNotEqual(hash(a), hash(b))


if __name__ == '__main__':
  unittest.main()
