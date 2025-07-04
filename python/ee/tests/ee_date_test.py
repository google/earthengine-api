#!/usr/bin/env python3
"""Test for the ee.date module."""

import datetime
import json
from typing import Any

import unittest
import ee
from ee import apitestcase

DAY = 'day'
WEEK = 'week'

UTC = 'UTC'


def make_expression_graph(
    function_invocation_value: dict[str, Any]
) -> dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


def date_function_expr(value: int) -> dict[str, Any]:
  return {
      'functionInvocationValue': {
          'functionName': 'Date',
          'arguments': {'value': {'constantValue': value}},
      }
  }


class DateTest(apitestcase.ApiTestCase):

  def test_date(self):
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

  def test_date_is_not_valid(self):
    message = r'Invalid argument specified for ee.Date\(\): \[\'a list\']'
    with self.assertRaisesRegex(ValueError, message):
      ee.Date(['a list'])  # pytype: disable=wrong-arg-types

  def test_timezone(self):
    self.assertEqual(
        {'timeZone': 'America/New_York', 'value': '2018-04-23'},
        ee.Date('2018-04-23', 'America/New_York').args,
    )

  def test_timezone_ee_string(self):
    date_str = '2018-04-23'
    timezone = ee.String('America/New_York')
    self.assertEqual(
        {'timeZone': timezone, 'value': date_str},
        ee.Date(date_str, timezone).args,
    )

  def test_date_ee_string_with_timezone(self):
    date_str = '2018-04-23'
    date_string = ee.String(date_str)
    timezone = 'America/New_York'
    self.assertEqual(
        {'timeZone': timezone, 'value': date_string},
        ee.Date(date_string, timezone).args,
    )

  def test_timezone_not_a_string(self):
    message = r'Invalid argument specified for ee.Date\(\.\.\., opt_tz\): 123'
    with self.assertRaisesRegex(ValueError, message):
      ee.Date('2018-04-23', 123)  # pytype: disable=wrong-arg-types

    with self.assertRaisesRegex(ValueError, message):
      ee.Date(ee.String('2018-04-23'), 123)  # pytype: disable=wrong-arg-types

  def test_with_reducer(self):
    date_int = 42
    column = 'date column'
    fc = ee.FeatureCollection([ee.Feature(None, {column: date_int})])
    reduced = fc.reduceColumns(ee.Reducer.max(), [column])
    end = ee.Date(reduced.get('max')).format()

    # Probe for the Date function call that will vanish if argument promotion
    # is not handled correctly.
    value_0 = json.loads(end.serialize())['values']['0']
    date = value_0['functionInvocationValue']['arguments']['date']
    function_name = date['functionInvocationValue']['functionName']
    self.assertEqual('Date', function_name)

  def test_name(self):
    self.assertEqual('Date', ee.Date.name())

  def test_advance(self):
    expect = make_expression_graph({
        'arguments': {
            'date': date_function_expr(1),
            'delta': {'constantValue': 2},
            'unit': {'constantValue': DAY},
            'timeZone': {'constantValue': UTC},
        },
        'functionName': 'Date.advance',
    })
    expression = ee.Date(1).advance(2, DAY, UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Date(1).advance(delta=2, unit=DAY, timeZone=UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_difference(self):
    expect = make_expression_graph({
        'arguments': {
            'date': date_function_expr(1),
            'start': date_function_expr(2),
            'unit': {'constantValue': DAY},
        },
        'functionName': 'Date.difference',
    })
    expression = ee.Date(1).difference(2, DAY)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Date(1).difference(start=2, unit=DAY)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_format(self):
    a_format = 'a format'
    expect = make_expression_graph({
        'arguments': {
            'date': date_function_expr(1),
            'format': {'constantValue': a_format},
            'timeZone': {'constantValue': UTC},
        },
        'functionName': 'Date.format',
    })
    expression = ee.Date(1).format(a_format, UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Date(1).format(format=a_format, timeZone=UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_from_ymd(self):
    expect = make_expression_graph({
        'arguments': {
            'year': {'constantValue': 1},
            'month': {'constantValue': 2},
            'day': {'constantValue': 3},
            'timeZone': {'constantValue': UTC},
        },
        'functionName': 'Date.fromYMD',
    })
    expression = ee.Date.fromYMD(1, 2, 3, UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Date.fromYMD(year=1, month=2, day=3, timeZone=UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_get(self):
    expect = make_expression_graph({
        'arguments': {
            'date': date_function_expr(1),
            'unit': {'constantValue': DAY},
            'timeZone': {'constantValue': UTC},
        },
        'functionName': 'Date.get',
    })
    expression = ee.Date(1).get(DAY, UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Date(1).get(unit=DAY, timeZone=UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_get_fraction(self):
    expect = make_expression_graph({
        'arguments': {
            'date': date_function_expr(1),
            'unit': {'constantValue': DAY},
            'timeZone': {'constantValue': UTC},
        },
        'functionName': 'Date.getFraction',
    })
    expression = ee.Date(1).getFraction(DAY, UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Date(1).getFraction(unit=DAY, timeZone=UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_get_range(self):
    expect = make_expression_graph({
        'arguments': {
            'date': date_function_expr(1),
            'unit': {'constantValue': DAY},
            'timeZone': {'constantValue': UTC},
        },
        'functionName': 'Date.getRange',
    })
    expression = ee.Date(1).getRange(DAY, UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Date(1).getRange(unit=DAY, timeZone=UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_get_relative(self):
    expect = make_expression_graph({
        'arguments': {
            'date': date_function_expr(1),
            'unit': {'constantValue': DAY},
            'inUnit': {'constantValue': WEEK},
            'timeZone': {'constantValue': UTC},
        },
        'functionName': 'Date.getRelative',
    })
    expression = ee.Date(1).getRelative(DAY, WEEK, UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Date(1).getRelative(unit=DAY, inUnit=WEEK, timeZone=UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_millis(self):
    expect = make_expression_graph({
        'arguments': {
            'date': date_function_expr(1),
        },
        'functionName': 'Date.millis',
    })
    expression = ee.Date(1).millis()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_parse(self):
    a_format = 'a format'
    date = 'a date'
    expect = make_expression_graph({
        'arguments': {
            'format': {'constantValue': a_format},
            'date': {'constantValue': date},
            'timeZone': {'constantValue': UTC},
        },
        'functionName': 'Date.parse',
    })
    expression = ee.Date(1).parse(a_format, date, UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Date(1).parse(format=a_format, date=date, timeZone=UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_unit_ratio(self):
    expect = make_expression_graph({
        'arguments': {
            'numerator': {'constantValue': WEEK},
            'denominator': {'constantValue': DAY},
        },
        'functionName': 'Date.unitRatio',
    })
    expression = ee.Date(1).unitRatio(WEEK, DAY)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Date(1).unitRatio(numerator=WEEK, denominator=DAY)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_update(self):
    expect = make_expression_graph({
        'arguments': {
            'date': date_function_expr(1),
            'year': {'constantValue': 2},
            'month': {'constantValue': 3},
            'day': {'constantValue': 4},
            'hour': {'constantValue': 5},
            'minute': {'constantValue': 6},
            'second': {'constantValue': 7},
            'timeZone': {'constantValue': UTC},
        },
        'functionName': 'Date.update',
    })
    expression = ee.Date(1).update(2, 3, 4, 5, 6, 7, UTC)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Date(1).update(
        year=2, month=3, day=4, hour=5, minute=6, second=7, timeZone=UTC
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_init_opt_params(self):
    date = '2023-1-01T00:00:00.000Z'
    result = ee.Date(date, opt_tz='US/Pacific').serialize()
    self.assertIn(
        '"value": {"constantValue": "2023-1-01T00:00:00.000Z"}', result
    )


if __name__ == '__main__':
  unittest.main()
