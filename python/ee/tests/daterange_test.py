#!/usr/bin/env python3
"""Tests for the ee.DateRange module.

DateRange is currently 100% dynamically generated.
"""

import json

import ee
from ee import apitestcase
import unittest

START = 'start'
END = 'end'
TIME_ZONE = 'timeZone'
# Example time zone.
LOS_ANGELES = 'America/Los_Angeles'

DATERANGE = 'DateRange'


class DateRangeTest(apitestcase.ApiTestCase):

  def test_init_all(self):
    start = 1
    end = 123456
    daterange = ee.DateRange(start, end, LOS_ANGELES)
    self.assertEqual({'value': 'fakeValue'}, daterange.getInfo())

    daterange_func = ee.ApiFunction.lookup('DateRange')
    self.assertEqual(daterange_func, daterange.func)

    self.assertFalse(daterange.isVariable())

    self.assertEqual(
        {START: start, END: end, TIME_ZONE: ee.String(LOS_ANGELES)},
        daterange.args,
    )

    result = json.loads(daterange.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        'end': {'constantValue': end},
                        'start': {'constantValue': start},
                        'timeZone': {'constantValue': LOS_ANGELES},
                    },
                    'functionName': DATERANGE,
                }
            }
        },
    }
    self.assertEqual(expect, result)

    cast_result = json.loads(ee.DateRange(daterange).serialize())
    self.assertEqual(expect, cast_result)

  def test_init_only_start(self):
    start = 3
    daterange = ee.DateRange(start)
    result = json.loads(daterange.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        'start': {'constantValue': start},
                    },
                    'functionName': DATERANGE,
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_init_start_and_end_strings(self):
    start = '2017-06-24'
    end = '2017-06-24T07:00:00'
    daterange = ee.DateRange(start, end)
    result = json.loads(daterange.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        'end': {'constantValue': end},
                        'start': {'constantValue': start},
                    },
                    'functionName': DATERANGE,
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_init_ee_dates(self):
    start = ee.Date('2017-06-24')
    end = ee.Date('2017-06-24T07:00:00')
    daterange = ee.DateRange(start, end)
    result = json.loads(daterange.serialize())
    print(result)
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'functionName': 'DateRange',
                    'arguments': {
                        'end': {
                            'functionInvocationValue': {
                                'functionName': 'Date',
                                'arguments': {
                                    'value': {
                                        'constantValue': '2017-06-24T07:00:00'
                                    }
                                },
                            }
                        },
                        'start': {
                            'functionInvocationValue': {
                                'functionName': 'Date',
                                'arguments': {
                                    'value': {'constantValue': '2017-06-24'}
                                },
                            }
                        },
                    },
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_no_args(self):
    message = r"missing 1 required positional argument: 'start'"
    with self.assertRaisesRegex(TypeError, message):
      ee.DateRange()  # pytype:disable=missing-parameter


if __name__ == '__main__':
  unittest.main()
