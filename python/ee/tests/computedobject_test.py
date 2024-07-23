#!/usr/bin/env python3
"""Test for the ee.computedobject module."""

import json
from unittest import mock

import unittest
import ee
from ee import apitestcase
from ee import computedobject


class ComputedObjectTest(apitestcase.ApiTestCase):

  def test_metaclass_call_self_casting(self):
    number = ee.Number(1)
    # This exercises the self-cast case of ComputedObjectMetaclass.__call__.
    result = ee.Number(number)
    self.assertIs(result, number)

  def test_computed_object(self):
    """Verifies that untyped calls wrap the result in a ComputedObject."""

    result = ee.ApiFunction.call_('DateRange', 1, 2)
    serialized = result.serialize()
    self.assertIsInstance(serialized, str)

    expected = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'functionName': 'DateRange',
                    'arguments': {
                        'end': {'constantValue': 2},
                        'start': {'constantValue': 1},
                    },
                }
            }
        },
    }
    self.assertEqual(expected, json.loads(serialized))
    self.assertEqual({'value': 'fakeValue'}, result.getInfo())

  def test_internals(self):
    """Test eq(), ne() and hash()."""
    a = ee.ApiFunction.call_('DateRange', 1, 2)
    b = ee.ApiFunction.call_('DateRange', 2, 3)
    c = ee.ApiFunction.call_('DateRange', 1, 2)

    self.assertEqual(a, a)
    self.assertNotEqual(a, b)
    self.assertEqual(a, c)
    self.assertNotEqual(b, c)
    self.assertNotEqual(hash(a), hash(b))

  def test_bad_init_with_both_func_and_var(self):
    message = 'When "varName" is specified, "func" and "args" must be null.'
    with self.assertRaisesRegex(ee.EEException, message):
      computedobject.ComputedObject(None, {'dummy': 'arg'}, 'variable name')

    func = ee.ApiFunction.lookup('Date')
    with self.assertRaisesRegex(ee.EEException, message):
      computedobject.ComputedObject(func, None, 'variable name')

  def test_encoder_must_not_be_none_for_non_variable(self):
    an_object = computedobject.ComputedObject(None, {'dummy': 'arg'})
    with self.assertRaisesRegex(
        ValueError, 'encoder can only be none when encode is for a variable.'
    ):
      an_object.encode(None)

  def test_encode_variable(self):
    var_name = 'variable name'
    an_object = computedobject.ComputedObject(None, None, var_name)
    expect = {'type': 'ArgumentRef', 'value': var_name}
    self.assertEqual(expect, an_object.encode(None))

  # TODO(user): test_encode_function

  def test_encode_cloud_value_variable(self):
    var_name = 'variable name'
    an_object = computedobject.ComputedObject(None, None, var_name)
    expect = {'argumentReference': var_name}
    self.assertEqual(expect, an_object.encode_cloud_value(None))

  # TODO(user): test_encode_cloud_value_variable_ref_is_none
  # TODO(user): test_encode_cloud_value_str_func

  def test_str_variable(self):
    var_name = 'variable name'
    obj = computedobject.ComputedObject(None, None, var_name)
    expect = f'ee.ComputedObject({{\n  "argumentReference": "{var_name}"\n}})'
    self.assertEqual(expect, str(obj))

  def test_str_function(self):
    sine = ee.Number(1).sin()
    expect = (
        'ee.Number({\n'
        '  "functionInvocationValue": {\n'
        '    "functionName": "Number.sin",\n'
        '    "arguments": {\n'
        '      "input": {\n'
        '        "constantValue": 1\n'
        '      }\n'
        '    }\n'
        '  }\n'
        '})'
    )
    self.assertEqual(expect, str(sine))

  def test_aside(self):
    mock_function = mock.Mock(return_value=None)
    string = ee.String('a')
    self.assertIs(string, string.aside(mock_function))
    mock_function.assert_called_once_with(string)

  def test_name(self):
    self.assertEqual('ComputedObject', computedobject.ComputedObject.name())

  def test_cast_same(self):
    var_name = 'variable name'
    obj = computedobject.ComputedObject(None, None, var_name)
    self.assertIs(obj, type(obj)._cast(obj))

  def test_cast_different(self):
    number = ee.Number(1)
    result = ee.String._cast(number).getInfo()
    expect = ee.String('1').getInfo()
    self.assertEqual(expect, result)

  def test_is_func_returning_same(self):
    number = ee.Number(1)
    self.assertFalse(number.is_func_returning_same(None))
    self.assertFalse(number.is_func_returning_same(1))
    self.assertFalse(number.is_func_returning_same(number))
    number_computed_object_func = number.add(1)
    self.assertTrue(number_computed_object_func)

  def test_serialize_opt_params(self):
    obj = ee.ComputedObject(func=None, args=None, varName='test')
    self.assertIn('\n', obj.serialize(opt_pretty=True))
    self.assertNotIn('\n', obj.serialize(opt_pretty=False))


if __name__ == '__main__':
  unittest.main()
