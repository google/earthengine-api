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


if __name__ == '__main__':
  unittest.main()
