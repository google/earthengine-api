#!/usr/bin/env python
"""Test for the ee.dictionary module."""



import unittest

import ee
from ee import apitestcase


class DictionaryTest(apitestcase.ApiTestCase):

  def testDictionary(self):
    """Verifies basic behavior of ee.Dictionary."""
    src = {'a': 1, 'b': 2, 'c': 'three'}
    dictionary = ee.Dictionary(src)
    self.assertEqual({
        'type': 'Dictionary',
        'value': src
    },
                     ee.Serializer(False)._encode(dictionary))
    self.assertEqual({'constantValue': {
        'a': 1,
        'b': 2,
        'c': 'three'
    }},
                     ee.Serializer(False,
                                   for_cloud_api=True)._encode(dictionary))

    f = ee.Feature(None, {'properties': src})
    computed = ee.Dictionary(f.get('properties'))
    self.assertIsInstance(computed, ee.Dictionary)

    # The 4 types of arguments we expect
    cons = (ee.Dictionary(src),
            ee.Dictionary(f.get('properties')),
            ee.Dictionary(),
            ee.Dictionary(('one', 1)))

    for d in cons:
      self.assertIsInstance(d, ee.ComputedObject)

  def testInternals(self):
    """Test eq(), ne() and hash()."""
    a = ee.Dictionary({'one': 1})
    b = ee.Dictionary({'two': 2})
    c = ee.Dictionary({'one': 1})

    self.assertEqual(a, a)
    self.assertNotEqual(a, b)
    self.assertEqual(a, c)
    self.assertNotEqual(b, c)
    self.assertNotEqual(hash(a), hash(b))


if __name__ == '__main__':
  unittest.main()
