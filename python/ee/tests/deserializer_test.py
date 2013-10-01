"""Tests for the ee.deserializer module."""



import json

import unittest

import ee
from ee import apitestcase
from ee import deserializer
from ee import serializer


class DeserializerTest(apitestcase.ApiTestCase):

  def testRoundTrip(self):
    """Verifies a round trip of a comprehensive serialization case."""
    encoded = apitestcase.ENCODED_JSON_SAMPLE
    decoded = deserializer.decode(encoded)
    re_encoded = json.loads(serializer.toJSON(decoded))
    self.assertEquals(encoded, re_encoded)

  def testCast(self):
    """Verifies that decoding casts the result to the right class."""
    input_image = ee.Image(13).addBands(42)
    output = deserializer.fromJSON(serializer.toJSON(input_image))
    self.assertTrue(isinstance(output, ee.Image))

  def testReuse(self):
    """Verifies that decoding results can be used and re-encoded."""
    input_image = ee.Image(13)
    output = deserializer.fromJSON(serializer.toJSON(input_image))
    self.assertEquals(output.addBands(42).serialize(),
                      input_image.addBands(42).serialize())

if __name__ == '__main__':
  unittest.main()
