#!/usr/bin/env python3
"""Test for the blob module."""

import json

import unittest
import ee
from ee import apitestcase


class BlobTest(apitestcase.ApiTestCase):

  def test_blob(self):
    url = 'gs://ee-docs-demos/something'
    blob = ee.Blob(url)

    blob_func = ee.ApiFunction.lookup('Blob')
    self.assertEqual(blob_func, blob.func)

    self.assertFalse(blob.isVariable())
    self.assertEqual({'url': ee.String(url)}, blob.args)

    result = json.loads(blob.serialize())
    expect = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'arguments': {
                        'url': {'constantValue': url}
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
    url = 'gs://ee-docs-demos/something'
    result = ee.ApiFunction.call_('Blob', url)
    serialized = result.serialize()
    self.assertIsInstance(serialized, str)

    expected = {
        'result': '0',
        'values': {
            '0': {
                'functionInvocationValue': {
                    'functionName': 'Blob',
                    'arguments': {
                        'url': {'constantValue': url},
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


if __name__ == '__main__':
  unittest.main()
