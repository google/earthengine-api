#!/usr/bin/env python
"""Test for the ee.string module."""



import unittest

import ee
from ee import apitestcase


class StringTest(apitestcase.ApiTestCase):

  def testString(self):
    """Verifies basic behavior of ee.String."""
    bare_string = ee.String('foo')
    self.assertEquals('foo', bare_string.encode())

    computed = ee.String('foo').cat('bar')
    self.assertTrue(isinstance(computed, ee.String))
    self.assertEquals(ee.ApiFunction.lookup('String.cat'), computed.func)
    self.assertEquals({'string1': ee.String('foo'),
                       'string2': ee.String('bar')}, computed.args)

    # Casting a non-string ComputedObject.
    obj = ee.Number(1).add(1)
    s = ee.String(obj)
    self.assertTrue(isinstance(s, ee.String))
    self.assertEquals(ee.ApiFunction.lookup('String'), s.func)
    self.assertEquals({'input': obj}, s.args)

  def testInternals(self):
    """Test eq(), ne() and hash()."""
    a = ee.String('one')
    b = ee.String('two')
    c = ee.String('one')

    self.assertEquals(a, a)
    self.assertNotEquals(a, b)
    self.assertEquals(a, c)
    self.assertNotEquals(b, c)
    self.assertNotEquals(hash(a), hash(b))


if __name__ == '__main__':
  unittest.main()
