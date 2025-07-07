#!/usr/bin/env python3
"""Test for the errormargin module."""

import json

import unittest
import ee
from ee import apitestcase

VALUE = 'value'
UNIT = 'unit'

INFINITE = 'infinite'
METERS = 'meters'
PROJECTED = 'projected'


class ErrorMarginTest(apitestcase.ApiTestCase):

  def test_init(self):
    value = 2
    unit = PROJECTED
    errormargin = ee.ErrorMargin(value, unit)

    errormargin_func = ee.ApiFunction.lookup('ErrorMargin')
    self.assertEqual(errormargin_func, errormargin.func)

    self.assertFalse(errormargin.isVariable())
    self.assertEqual({UNIT, VALUE}, set(errormargin.args))
    expected_unit = {
        'result': '0',
        'values': {'0': {'constantValue': 'projected'}},
    }
    self.assertEqual(
        expected_unit, json.loads(errormargin.args[UNIT].serialize())
    )
    expected_value = {'result': '0', 'values': {'0': {'constantValue': 2}}}
    self.assertEqual(
        expected_value, json.loads(errormargin.args[VALUE].serialize())
    )

    result = json.loads(errormargin.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        VALUE: {'constantValue': value},
                        UNIT: {'constantValue': unit},
                    },
                    'functionName': 'ErrorMargin',
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_cast(self):
    value = 42
    unit = METERS
    errormargin = ee.ErrorMargin(ee.ErrorMargin(value, unit))
    result = json.loads(errormargin.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        VALUE: {'constantValue': value},
                        UNIT: {'constantValue': unit},
                    },
                    'functionName': 'ErrorMargin',
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_only_value(self):
    value = 3
    errormargin = ee.ErrorMargin(value)
    result = json.loads(errormargin.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        VALUE: {'constantValue': value},
                    },
                    'functionName': 'ErrorMargin',
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_infinite(self):
    value = 4
    unit = INFINITE
    errormargin = ee.ErrorMargin(value, unit)
    result = json.loads(errormargin.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        VALUE: {'constantValue': value},
                        UNIT: {'constantValue': unit},
                    },
                    'functionName': 'ErrorMargin',
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_infinite_without_value(self):
    unit = INFINITE
    errormargin = ee.ErrorMargin(unit=unit)
    result = json.loads(errormargin.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        UNIT: {'constantValue': unit},
                    },
                    'functionName': 'ErrorMargin',
                }
            }
        },
    }
    self.assertEqual(expect, result)

  def test_computed_object(self):
    """Verifies that untyped calls wrap the result in a ComputedObject."""
    value = 5
    unit = METERS
    result = ee.ApiFunction.call_('ErrorMargin', value, unit)
    serialized = result.serialize()
    self.assertIsInstance(serialized, str)

    expected = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'functionName': 'ErrorMargin',
                    'arguments': {
                        VALUE: {'constantValue': value},
                        UNIT: {'constantValue': unit},
                    },
                }
            }
        },
    }
    self.assertEqual(expected, json.loads(serialized))
    self.assertEqual({'value': 'fakeValue'}, result.getInfo())

  def test_need_value(self):
    message = r'value must be provided if unit is not infinite'
    with self.assertRaisesRegex(TypeError, message):
      ee.ErrorMargin().getInfo()

    with self.assertRaisesRegex(TypeError, message):
      ee.ErrorMargin(unit=PROJECTED).getInfo()

  def test_bad_casting_with_unit_not_none(self):
    error_margin = ee.ErrorMargin(value=1)
    message = r'unit must be None if value is an ErrorMargin'
    with self.assertRaisesRegex(TypeError, message):
      ee.ErrorMargin(error_margin, PROJECTED)


if __name__ == '__main__':
  unittest.main()
