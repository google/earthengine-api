#!/usr/bin/env python3
"""Tests for the ee.DateRange module.

DateRange is currently 100% dynamically generated.
"""

import json
from typing import Any, Dict

import unittest
import ee
from ee import apitestcase

START = 'start'
END = 'end'
TIME_ZONE = 'timeZone'
# Example time zone.
LOS_ANGELES = 'America/Los_Angeles'

DATERANGE = 'DateRange'


def make_expression_graph(
    function_invocation_value: Dict[str, Any]
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


def daterange_function_expr(value: int) -> Dict[str, Any]:
  return {
      'functionInvocationValue': {
          'functionName': 'DateRange',
          'arguments': {'start': {'constantValue': value}},
      }
  }


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

  def test_contains(self):
    expect = make_expression_graph({
        'functionName': 'DateRange.contains',
        'arguments': {
            'dateRange': daterange_function_expr(1),
            'other': {'constantValue': 2},
        },
    })
    expression = ee.DateRange(1).contains(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.DateRange(1).contains(other=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_end(self):
    expect = make_expression_graph({
        'functionName': 'DateRange.end',
        'arguments': {'dateRange': daterange_function_expr(1)},
    })
    expression = ee.DateRange(1).end()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_intersection(self):
    expect = make_expression_graph({
        'functionName': 'DateRange.intersection',
        'arguments': {
            'dateRange': daterange_function_expr(1),
            'other': daterange_function_expr(2),
        },
    })
    expression = ee.DateRange(1).intersection(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.DateRange(1).intersection(other=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_intersects(self):
    expect = make_expression_graph({
        'arguments': {
            'dateRange': daterange_function_expr(1),
            'other': daterange_function_expr(2),
        },
        'functionName': 'DateRange.intersects',
    })
    expression = ee.DateRange(1).intersects(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.DateRange(1).intersects(other=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_isEmpty(self):
    expect = make_expression_graph({
        'arguments': {
            'dateRange': daterange_function_expr(1),
        },
        'functionName': 'DateRange.isEmpty',
    })
    expression = ee.DateRange(1).isEmpty()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_isUnbounded(self):
    expect = make_expression_graph({
        'arguments': {
            'dateRange': daterange_function_expr(1),
        },
        'functionName': 'DateRange.isUnbounded',
    })
    expression = ee.DateRange(1).isUnbounded()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_start(self):
    expect = make_expression_graph({
        'functionName': 'DateRange.start',
        'arguments': {
            'dateRange': {
                'functionInvocationValue': {
                    'functionName': 'DateRange',
                    'arguments': {'start': {'constantValue': 1}},
                }
            },
        },
    })
    expression = ee.DateRange(1).start()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_union(self):
    expect = make_expression_graph({
        'arguments': {
            'dateRange': daterange_function_expr(1),
            'other': daterange_function_expr(2),
        },
        'functionName': 'DateRange.union',
    })

    expression = ee.DateRange(1).union(2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.DateRange(1).union(other=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
