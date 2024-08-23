#!/usr/bin/env python3
"""Test for ee._helpers.

When the function in question is defined in ee/_helpers.py but exported for
public use by ee/__init__.py, the test is located here but uses the ee.-prefixed
name since that is the name we want to ensure works.
"""

import io
import unittest

import unittest
import ee
from ee import apifunction
from ee import apitestcase
from ee import computedobject
from ee import ee_exception


class ProfilingTest(apitestcase.ApiTestCase):

  def MockValue(self, value):
    """Overridden to check for profiling-related data."""
    hooked = ee.data._thread_locals.profile_hook is not None
    is_get_profiles = isinstance(
        value, computedobject.ComputedObject
    ) and value.func == apifunction.ApiFunction.lookup('Profile.getProfiles')
    return 'hooked=%s getProfiles=%s' % (hooked, is_get_profiles)

  def testProfilePrinting(self):
    ee.data.computeValue = self.MockValue
    out = io.StringIO()
    with ee.profilePrinting(destination=out):
      self.assertEqual('hooked=True getProfiles=False', ee.Number(1).getInfo())
    self.assertEqual('hooked=False getProfiles=True', out.getvalue())

  def testProfilePrintingDefaultSmoke(self):
    # This will print to sys.stderr, so we can't make any assertions about the
    # output. But we can check that it doesn't fail.
    ee.data.computeValue = self.MockValue
    with ee.profilePrinting():
      self.assertEqual('hooked=True getProfiles=False', ee.Number(1).getInfo())

  def testProfilePrintingErrorGettingProfiles(self):
    ee.data.computeValue = self.MockValue
    mock = unittest.mock.Mock()
    mock.call.side_effect = ee_exception.EEException('test')
    apifunction.ApiFunction._api['Profile.getProfiles'] = mock

    with self.assertRaises(ee_exception.EEException):
      with ee.profilePrinting():
        ee.Number(1).getInfo()
    self.assertEqual(5, mock.call.call_count)


if __name__ == '__main__':
  unittest.main()
