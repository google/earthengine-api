#!/usr/bin/env python


import StringIO

import unittest
import ee
from ee import apitestcase
from ee import deserializer
from ee.apifunction import ApiFunction
from ee.computedobject import ComputedObject


class ProfilingTest(apitestcase.ApiTestCase):

  def MockSend(self, path, params, *args):
    """Overridden to check for profiling-related data."""
    if path == '/value':
      value = deserializer.fromJSON(params['json'])
      hooked = ee.data._thread_locals.profile_hook is not None
      is_get_profiles = (isinstance(value, ComputedObject) and value.func ==
                         ApiFunction.lookup('Profile.getProfiles'))
      return 'hooked=%s getProfiles=%s' % (hooked, is_get_profiles)
    else:
      return super(ProfilingTest, self).MockSend(path, params, *args)

  def testProfilePrinting(self):
    out = StringIO.StringIO()
    with ee.profilePrinting(destination=out):
      self.assertEquals('hooked=True getProfiles=False', ee.Number(1).getInfo())
    self.assertEquals('hooked=False getProfiles=True', out.getvalue())

  def testProfilePrintingDefaultSmoke(self):
    # This will print to sys.stderr, so we can't make any assertions about the
    # output. But we can check that it doesn't fail.
    with ee.profilePrinting():
      self.assertEquals('hooked=True getProfiles=False', ee.Number(1).getInfo())


if __name__ == '__main__':
  unittest.main()
