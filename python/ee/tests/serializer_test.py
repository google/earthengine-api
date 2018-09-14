#!/usr/bin/env python
"""Tests for the ee.serializer module."""



import json

import unittest

import ee
from ee import apitestcase
from ee import serializer


class SerializerTest(apitestcase.ApiTestCase):

  def testSerialization(self):
    """Verifies a complex serialization case."""

    class ByteString(ee.Encodable):
      """A custom Encodable class that does not use invocations.

      This one is actually supported by the EE API encoding.
      """

      def __init__(self, value):
        """Creates a bytestring with a given string value."""
        self._value = value

      def encode(self, unused_encoder):  # pylint: disable-msg=g-bad-name
        return {'type': 'Bytes', 'value': self._value}


    call = ee.ComputedObject('String.cat', {'string1': 'x', 'string2': 'y'})
    body = lambda x, y: ee.CustomFunction.variable(None, 'y')
    sig = {'returns': 'Object',
           'args': [
               {'name': 'x', 'type': 'Object'},
               {'name': 'y', 'type': 'Object'}]}
    custom_function = ee.CustomFunction(sig, body)
    to_encode = [
        None,
        True,
        5,
        7,
        3.4,
        112233445566778899,
        'hello',
        ee.Date(1234567890000),
        ee.Geometry(ee.Geometry.LineString(1, 2, 3, 4), 'SR-ORG:6974'),
        ee.Geometry.Polygon([
            [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
            [[5, 6], [7, 6], [7, 8], [5, 8]],
            [[1, 1], [2, 1], [2, 2], [1, 2]]
        ]),
        ByteString('aGVsbG8='),
        {
            'foo': 'bar',
            'baz': call
        },
        call,
        custom_function
    ]

    self.assertEquals(apitestcase.ENCODED_JSON_SAMPLE,
                      json.loads(serializer.toJSON(to_encode)))

  def testRepeats(self):
    """Verifies serialization finds and removes repeated values."""
    test1 = ee.Image(5).mask(ee.Image(5))     # pylint: disable-msg=no-member
    expected1 = {
        'type': 'CompoundValue',
        'scope': [
            ['0', {
                'type': 'Invocation',
                'arguments': {
                    'value': 5
                },
                'functionName': 'Image.constant'
            }],
            ['1', {
                'type': 'Invocation',
                'arguments': {
                    'image': {
                        'type': 'ValueRef',
                        'value': '0'
                    },
                    'mask': {
                        'type': 'ValueRef',
                        'value': '0'
                    }
                },
                'functionName': 'Image.mask'
            }]
        ],
        'value': {
            'type': 'ValueRef',
            'value': '1'
        }
    }
    self.assertEquals(expected1, json.loads(serializer.toJSON(test1)))


if __name__ == '__main__':
  unittest.main()
