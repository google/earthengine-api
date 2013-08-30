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


if __name__ == '__main__':
  unittest.main()
