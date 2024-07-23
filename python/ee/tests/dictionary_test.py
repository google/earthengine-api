#!/usr/bin/env python3
"""Test for the ee.dictionary module."""
import json
from typing import Any, Dict
import unittest

import unittest
import ee
from ee import apitestcase


def make_expression_graph(
    function_invocation_value: Dict[str, Any],
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


class DictionaryTest(apitestcase.ApiTestCase):

  def testDictionary(self):
    """Verifies basic behavior of ee.Dictionary."""
    src = {'a': 1, 'b': 2, 'c': 'three'}
    dictionary = ee.Dictionary(src)
    self.assertEqual(
        {'type': 'Dictionary', 'value': src},
        ee.Serializer(False)._encode(dictionary),
    )
    self.assertEqual(
        {'constantValue': {'a': 1, 'b': 2, 'c': 'three'}},
        ee.Serializer(False, for_cloud_api=True)._encode(dictionary),
    )

    f = ee.Feature(None, {'properties': src})
    computed = ee.Dictionary(f.get('properties'))
    self.assertIsInstance(computed, ee.Dictionary)

    # The 4 types of arguments we expect
    cons = (ee.Dictionary(src),
            ee.Dictionary(f.get('properties')),
            ee.Dictionary(),
            ee.Dictionary(('one', 1)))

    for d in cons:
      self.assertIsInstance(d, ee.ComputedObject)

  def testInternals(self):
    """Test eq(), ne() and hash()."""
    a = ee.Dictionary({'one': 1})
    b = ee.Dictionary({'two': 2})
    c = ee.Dictionary({'one': 1})

    self.assertEqual(a, a)
    self.assertNotEqual(a, b)
    self.assertEqual(a, c)
    self.assertNotEqual(b, c)
    self.assertNotEqual(hash(a), hash(b))

  def test_combine(self):
    expect = make_expression_graph({
        'arguments': {
            'first': {'constantValue': {'a': 1}},
            'second': {'constantValue': {'b': 2}},
            'overwrite': {'constantValue': True},
        },
        'functionName': 'Dictionary.combine',
    })
    expression = ee.Dictionary({'a': 1}).combine({'b': 2}, True)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary({'a': 1}).combine(
        second={'b': 2}, overwrite=True
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_contains(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
            'key': {'constantValue': 'a key'},
        },
        'functionName': 'Dictionary.contains',
    })
    expression = ee.Dictionary({'a': 1}).contains('a key')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary({'a': 1}).contains(key='a key')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_fromLists(self):
    expect = make_expression_graph({
        'arguments': {
            'keys': {'constantValue': ['a']},
            'values': {'constantValue': [1]},
        },
        'functionName': 'Dictionary.fromLists',
    })
    expression = ee.Dictionary().fromLists(['a'], [1])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary().fromLists(keys=['a'], values=[1])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_get(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
            'key': {'constantValue': 'b'},
            'defaultValue': {'constantValue': 'a default'},
        },
        'functionName': 'Dictionary.get',
    })
    expression = ee.Dictionary({'a': 1}).get('b', 'a default')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary({'a': 1}).get(key='b', defaultValue='a default')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_getArray(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
            'key': {'constantValue': 'b'},
        },
        'functionName': 'Dictionary.getArray',
    })
    expression = ee.Dictionary({'a': 1}).getArray('b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary({'a': 1}).getArray(key='b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_getGeometry(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
            'key': {'constantValue': 'b'},
        },
        'functionName': 'Dictionary.getGeometry',
    })
    expression = ee.Dictionary({'a': 1}).getGeometry('b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary({'a': 1}).getGeometry(key='b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_getNumber(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
            'key': {'constantValue': 'b'},
        },
        'functionName': 'Dictionary.getNumber',
    })
    expression = ee.Dictionary({'a': 1}).getNumber('b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary({'a': 1}).getNumber(key='b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_getString(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
            'key': {'constantValue': 'b'},
        },
        'functionName': 'Dictionary.getString',
    })
    expression = ee.Dictionary({'a': 1}).getString('b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary({'a': 1}).getString(key='b')
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_keys(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
        },
        'functionName': 'Dictionary.keys',
    })
    expression = ee.Dictionary({'a': 1}).keys()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary({'a': 1}).keys()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  # TODO: test_map

  def test_remove(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
            'selectors': {'constantValue': ['b']},
            'ignoreMissing': {'constantValue': True},
        },
        'functionName': 'Dictionary.remove',
    })
    expression = ee.Dictionary({'a': 1}).remove(['b'], True)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary({'a': 1}).remove(
        selectors=['b'], ignoreMissing=True
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_rename(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
            'from': {'constantValue': ['b']},
            'to': {'constantValue': ['c']},
            'overwrite': {'constantValue': True},
        },
        'functionName': 'Dictionary.rename',
    })
    expression = ee.Dictionary({'a': 1}).rename(['b'], ['c'], True)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    # Cannot use `from` kwarg as it is a python keyword.
    expression = ee.Dictionary({'a': 1}).rename(['b'], to=['c'], overwrite=True)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_select(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
            'selectors': {'constantValue': ['b']},
            'ignoreMissing': {'constantValue': True},
        },
        'functionName': 'Dictionary.select',
    })
    expression = ee.Dictionary({'a': 1}).select(['b'], True)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary({'a': 1}).select(
        selectors=['b'], ignoreMissing=True
    )
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_set(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
            'key': {'constantValue': 'b'},
            'value': {'constantValue': 2},
        },
        'functionName': 'Dictionary.set',
    })
    expression = ee.Dictionary({'a': 1}).set('b', 2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary({'a': 1}).set(key='b', value=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_size(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
        },
        'functionName': 'Dictionary.size',
    })
    expression = ee.Dictionary({'a': 1}).size()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toArray(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
            'keys': {'constantValue': ['b']},
            'axis': {'constantValue': 2},
        },
        'functionName': 'Dictionary.toArray',
    })
    expression = ee.Dictionary({'a': 1}).toArray(['b'], 2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary({'a': 1}).toArray(keys=['b'], axis=2)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_values(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
            'keys': {'constantValue': ['b']},
        },
        'functionName': 'Dictionary.values',
    })
    expression = ee.Dictionary({'a': 1}).values(['b'])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary({'a': 1}).values(keys=['b'])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_toImage(self):
    expect = make_expression_graph({
        'arguments': {
            'dictionary': {'constantValue': {'a': 1}},
            'names': {'constantValue': ['b']},
        },
        'functionName': 'Dictionary.toImage',
    })
    expression = ee.Dictionary({'a': 1}).toImage(['b'])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Dictionary({'a': 1}).toImage(names=['b'])
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_encode_opt_params(self):
    a_dict = ee.Dictionary({'x': 1})

    mock_encoder = unittest.mock.Mock(return_value='encoded-value')
    result = a_dict.encode(opt_encoder=mock_encoder)

    mock_encoder.assert_called()
    self.assertEqual('encoded-value', result)

  def test_encode_cloud_value_opt_params(self):
    a_dict = ee.Dictionary({'x': 1})

    mock_encoder = unittest.mock.Mock(return_value='encoded-value')
    result = a_dict.encode_cloud_value(opt_encoder=mock_encoder)

    mock_encoder.assert_called()
    self.assertEqual({'valueReference': 'encoded-value'}, result)


if __name__ == '__main__':
  unittest.main()
