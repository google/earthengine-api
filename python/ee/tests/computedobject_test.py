"""Tests for the ee.computedobject module."""



import unittest

import ee

from ee import apitestcase


class ComputedObjectTest(apitestcase.ApiTestCase):

  def testComputedObject(self):
    """Verifies that untyped calls wrap the result in a ComputedObject."""

    result = ee.ApiFunction.call_('DateRange', 1, 2)
    self.assertTrue(isinstance(result.serialize(), basestring))
    self.assertEquals({'value': 'fakeValue'}, result.getInfo())


if __name__ == '__main__':
  unittest.main()
