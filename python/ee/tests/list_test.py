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


if __name__ == '__main__':
  unittest.main()
