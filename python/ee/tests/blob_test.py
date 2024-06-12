#!/usr/bin/env python3
"""Test for the blob module."""

import json
from typing import Any, Dict

import unittest
import ee
from ee import apitestcase

URL = 'gs://ee-docs-demos/something'


def make_expression_graph(
    function_invocation_value: Dict[str, Any],
) -> Dict[str, Any]:
  return {
      'result': '0',
      'values': {'0': {'functionInvocationValue': function_invocation_value}},
  }


class BlobTest(apitestcase.ApiTestCase):

  def test_blob(self):
    blob = ee.Blob(URL)

    blob_func = ee.ApiFunction.lookup('Blob')
    self.assertEqual(blob_func, blob.func)

    self.assertFalse(blob.isVariable())
    self.assertEqual({'url': ee.String(URL)}, blob.args)

    result = json.loads(blob.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        'url': {'constantValue': URL}
                    },
                    'functionName': 'Blob',
                }
            }
        },
    }
    self.assertEqual(expect, result)

    result_cast = json.loads(ee.Blob(blob).serialize())
    self.assertEqual(expect, result_cast)

    self.assertEqual({'value': 'fakeValue'}, blob.getInfo())

  def test_computed_object(self):
    """Verifies that untyped calls wrap the result in a ComputedObject."""
    result = ee.ApiFunction.call_('Blob', URL)
    serialized = result.serialize()
    self.assertIsInstance(serialized, str)

    expected = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'functionName': 'Blob',
                    'arguments': {
                        'url': {'constantValue': URL},
                    },
                }
            }
        },
    }
    self.assertEqual(expected, json.loads(serialized))
    self.assertEqual({'value': 'fakeValue'}, result.getInfo())

  def test_wrong_arg_type(self):
    message = 'Blob url must be a string: <class \'int\'> -> "123"'
    with self.assertRaisesRegex(ValueError, message):
      ee.Blob(123)  # pytype: disable=wrong-arg-types

  def test_does_not_start_with_gs(self):
    url = 'http://example.com/something'
    message = f'Blob url must start with "gs://": "{url}"'
    with self.assertRaisesRegex(ValueError, message):
      ee.Blob(url)

  def test_string(self):
    encoding = 'an encoding'
    expect = make_expression_graph({
        'arguments': {
            'blob': {
                'functionInvocationValue': {
                    'functionName': 'Blob',
                    'arguments': {'url': {'constantValue': URL}},
                }
            },
            'encoding': {'constantValue': encoding},
        },
        'functionName': 'Blob.string',
    })
    expression = ee.Blob(URL).string(encoding)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

    expression = ee.Blob(URL).string(encoding=encoding)
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)

  def test_url(self):
    expect = make_expression_graph({
        'arguments': {
            'blob': {
                'functionInvocationValue': {
                    'functionName': 'Blob',
                    'arguments': {'url': {'constantValue': URL}},
                }
            }
        },
        'functionName': 'Blob.url',
    })
    expression = ee.Blob(URL).url()
    result = json.loads(expression.serialize())
    self.assertEqual(expect, result)


if __name__ == '__main__':
  unittest.main()
