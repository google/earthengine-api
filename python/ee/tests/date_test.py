#!/usr/bin/env python
"""Test for the ee.date module."""



import datetime

import unittest

import ee
from ee import apitestcase


class DateTest(apitestcase.ApiTestCase):
  def testDate(self):
    """Verifies date constructors."""

    datefunc = ee.ApiFunction.lookup('Date')

    d1 = ee.Date('2000-01-01')
    d2 = ee.Date(946684800000)
    d3 = ee.Date(datetime.datetime(2000, 1, 1))
    d4 = ee.Date(d3)
    dates = [d1, d2, d3, d4]

    for d in dates:
      self.assertIsInstance(d, ee.Date)
      self.assertEqual(datefunc, d.func)

    self.assertEqual(d1.args, {'value': '2000-01-01'})
    for d in dates[1:]:
      self.assertEqual(d.args['value'], 946684800000)

    d5 = ee.Date(ee.CustomFunction.variable('Date', 'foo'))
    self.assertIsInstance(d5, ee.Date)
    self.assertTrue(d5.isVariable())
    self.assertEqual('foo', d5.varName)

    # A non-date variable.
    v = ee.CustomFunction.variable('Number', 'bar')
    d6 = ee.Date(v)
    self.assertIsInstance(d6, ee.Date)
    self.assertFalse(d6.isVariable())
    self.assertEqual(datefunc, d6.func)
    self.assertEqual({'value': v}, d6.args)

    # A non-date ComputedObject, promotion and casting.
    obj = ee.ApiFunction.call_('DateRange', 1, 2)
    d7 = ee.Date(obj)
    self.assertIsInstance(d7, ee.Date)
    self.assertEqual(datefunc, d7.func)
    self.assertEqual({'value': obj}, d7.args)


if __name__ == '__main__':
  unittest.main()
