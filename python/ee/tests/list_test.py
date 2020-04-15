#!/usr/bin/env python
"""Test for the ee.lber module."""



import unittest

import ee
from ee import apitestcase


class ListTest(apitestcase.ApiTestCase):

  def testList(self):
    """Verifies basic behavior of ee.List."""
    l = ee.List([1, 2, 3])
    self.assertEqual([1, 2, 3], ee.Serializer(False)._encode(l))

    computed = ee.List([1, 2, 3]).slice(0)    # pylint: disable=no-member
    self.assertIsInstance(computed, ee.List)
    self.assertEqual(ee.ApiFunction.lookup('List.slice'), computed.func)
    self.assertEqual({
        'list': ee.List([1, 2, 3]),
        'start': ee.Number(0)
    }, computed.args)

  def testMapping(self):
    lst = ee.List(['foo', 'bar'])
    body = lambda s: ee.String(s).cat('bar')
    mapped = lst.map(body)

    self.assertIsInstance(mapped, ee.List)
    self.assertEqual(ee.ApiFunction.lookup('List.map'), mapped.func)
    self.assertEqual(lst, mapped.args['list'])

    # Need to do a serialized comparison for the function body because
    # variables returned from CustomFunction.variable() do not implement
    # __eq__.
    sig = {
        'returns': 'Object',
        'args': [{'name': '_MAPPING_VAR_0_0', 'type': 'Object'}]
    }
    expected_function = ee.CustomFunction(sig, body)
    self.assertEqual(expected_function.serialize(),
                     mapped.args['baseAlgorithm'].serialize())
    self.assertEqual(
        expected_function.serialize(for_cloud_api=True),
        mapped.args['baseAlgorithm'].serialize(for_cloud_api=True))

  def testInternals(self):
    """Test eq(), ne() and hash()."""
    a = ee.List([1, 2])
    b = ee.List([2, 1])
    c = ee.List([1, 2])

    self.assertTrue(a.__eq__(a))
    self.assertFalse(a.__eq__(b))
    self.assertTrue(a.__eq__(c))
    self.assertTrue(b.__ne__(c))
    self.assertNotEqual(a.__hash__(), b.__hash__())
    self.assertEqual(a.__hash__(), c.__hash__())


if __name__ == '__main__':
  unittest.main()
