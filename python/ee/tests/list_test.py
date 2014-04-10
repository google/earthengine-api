"""Test for the ee.lber module."""



import unittest

import ee
from ee import apitestcase


class ListTest(apitestcase.ApiTestCase):

  def testList(self):
    """Verifies basic behavior of ee.List."""
    l = ee.List([1, 2, 3])
    self.assertEquals([1, 2, 3], ee.Serializer(False)._encode(l))

    computed = ee.List([1, 2, 3]).slice(0)    # pylint: disable=no-member
    self.assertTrue(isinstance(computed, ee.List))
    self.assertEquals(ee.ApiFunction.lookup('List.slice'), computed.func)
    self.assertEquals({'list': ee.List([1, 2, 3]), 'start': ee.Number(0)},
                      computed.args)

  def testMapping(self):
    lst = ee.List(['foo', 'bar'])
    body = lambda s: ee.String(s).cat('bar')
    mapped = lst.map(body)

    self.assertTrue(isinstance(mapped, ee.List))
    self.assertEquals(ee.ApiFunction.lookup('List.map'), mapped.func)
    self.assertEquals(lst, mapped.args['list'])

    # Need to do a serialized comparison for the function body because
    # variables returned from CustomFunction.variable() do not implement
    # __eq__.
    sig = {
        'returns': 'Object',
        'args': [{'name': '_MAPPING_VAR_0_0', 'type': 'Object'}]
    }
    expected_function = ee.CustomFunction(sig, body)
    self.assertEquals(expected_function.serialize(),
                      mapped.args['baseAlgorithm'].serialize())


if __name__ == '__main__':
  unittest.main()
