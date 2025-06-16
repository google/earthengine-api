#!/usr/bin/env python3
"""Test for the ee.deserializer module."""

import json

import unittest
import ee
from ee import apitestcase
from ee import deserializer
from ee import serializer


class DeserializerTest(apitestcase.ApiTestCase):

  def test_legacy_roundtrip(self):
    """Verifies a round trip of a comprehensive serialization case."""
    encoded = apitestcase.ENCODED_JSON_SAMPLE
    decoded = deserializer.decode(encoded)
    re_encoded = json.loads(serializer.toJSON(decoded, for_cloud_api=False))
    self.assertEqual(encoded, re_encoded)
    # Round-trip the decoded object through the Cloud API
    cloud_encoded = json.loads(serializer.toJSON(decoded, for_cloud_api=True))
    cloud_decoded = deserializer.decode(cloud_encoded)  # Supports both formats
    cloud_re_encoded = json.loads(
        serializer.toJSON(cloud_decoded, for_cloud_api=True))
    self.assertEqual(cloud_encoded, cloud_re_encoded)

  def test_cloud_roundtrip(self):
    """Verifies a round trip of a comprehensive serialization case."""
    cloud_encoded = apitestcase.ENCODED_CLOUD_API_JSON_SAMPLE
    cloud_decoded = deserializer.decode(cloud_encoded)  # Supports both formats
    cloud_re_encoded = json.loads(
        serializer.toJSON(cloud_decoded, for_cloud_api=True))
    self.assertEqual(cloud_encoded, cloud_re_encoded)
    # Round-trip the decoded object through the legacy API
    encoded = json.loads(serializer.toJSON(cloud_decoded, for_cloud_api=False))
    decoded = deserializer.decode(encoded)
    re_encoded = json.loads(serializer.toJSON(decoded, for_cloud_api=False))
    self.assertEqual(encoded, re_encoded)

  def test_cast(self):
    """Verifies that decoding casts the result to the right class."""
    input_image = ee.Image(13).addBands(42)
    output = deserializer.fromJSON(serializer.toJSON(input_image))
    self.assertIsInstance(output, ee.Image)
    cloud_output = deserializer.fromCloudApiJSON(
        serializer.toJSON(input_image, for_cloud_api=True))
    self.assertIsInstance(cloud_output, ee.Image)

  def test_reuse(self):
    """Verifies that decoding results can be used and re-encoded."""
    input_image = ee.Image(13)
    output = deserializer.fromJSON(serializer.toJSON(input_image))
    self.assertEqual(
        output.addBands(42).serialize(),
        input_image.addBands(42).serialize())
    cloud_output = deserializer.fromCloudApiJSON(
        serializer.toJSON(input_image, for_cloud_api=True))
    self.assertEqual(
        cloud_output.addBands(42).serialize(),
        input_image.addBands(42).serialize())

  def test_image_expression(self):
    """Verifies that ee.Image.expression results can be re-encoded."""
    image = ee.Image(13)
    expression = image.expression('x', {'x': image})
    expression_encoded = serializer.toJSON(expression)
    expression_decoded = deserializer.decode(json.loads(expression_encoded))
    expression_re_encoded = serializer.toJSON(expression_decoded)
    self.assertEqual(expression_encoded, expression_re_encoded)

  def test_unknown_value_ref(self):
    """Verifies raising Unknown ValueRef in _decodeValue()."""
    encoded = {
        'type': 'CompoundValue',
        'scope': [['key', {'type': 'ValueRef', 'value': 'bar'}]],
    }
    with self.assertRaisesRegex(
        ee.EEException, "Unknown ValueRef: {'type': 'ValueRef', 'value': 'bar'}"
    ):
      deserializer.decode(encoded)


if __name__ == '__main__':
  unittest.main()
