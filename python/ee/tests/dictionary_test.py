"""Test for the ee.number module."""



import unittest

import ee
from ee import apitestcase


class DictionaryTest(apitestcase.ApiTestCase):

  def testDictionary(self):
    """Verifies basic behavior of ee.Dictionary."""
    src = {'a': 1, 'b': 2, 'c': 'three'}
    dictionary = ee.Dictionary(src)
    self.assertEquals({'type': 'Dictionary', 'value': src},
                      ee.Serializer(False)._encode(dictionary))

    f = ee.Feature(None, {'properties': src})
    computed = ee.Dictionary(f.get('properties'))
    self.assertTrue(isinstance(computed, ee.Dictionary))

    try:
      ee.Dictionary(1)
    except ee.EEException as e:
      self.assertTrue('Invalid argument' in str(e))
    else:
      self.fail('Expected an exception.')

  def testInternals(self):
    """Test eq(), ne() and hash()."""
    a = ee.Dictionary({'one': 1})
    b = ee.Dictionary({'two': 2})
    c = ee.Dictionary({'one': 1})

    self.assertEquals(a, a)
    self.assertNotEquals(a, b)
    self.assertEquals(a, c)
    self.assertNotEquals(b, c)
    self.assertNotEquals(hash(a), hash(b))


if __name__ == '__main__':
  unittest.main()
