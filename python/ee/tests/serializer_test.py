"""Tests for the ee.serializer module."""



import datetime
import json

import unittest

import ee
from ee import apitestcase
from ee import serializer

# The encoded output.
EXPECTED_OUTPUT = {
    'type': 'CompoundValue',
    'scope': [
        ['0', {
            'type': 'LineString',
            'coordinates': [[1, 2], [3, 4]],
            'crs': {
                'type': 'name',
                'properties': {
                    'name': 'SR-ORG:6974'
                }
            }
        }],
        ['1', {
            'type': 'Polygon',
            'coordinates': [
                [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                [[5, 6], [7, 6], [7, 8], [5, 8]],
                [[1, 1], [2, 1], [2, 2], [1, 2]]
            ]
        }],
        ['2', {
            'type': 'Bytes',
            'value': 'aGVsbG8='
        }],
        ['3', {
            'type': 'Invocation',
            'functionName': 'SerializeThisThing',
            'arguments': {
                'a': 'x',
                'b': 5
            }
        }],
        ['4', {
            'type': 'Dictionary',
            'value': {
                'foo': 'bar',
                'baz': {'type': 'ValueRef', 'value': '3'}
            }
        }],
        ['5', {
            'type': 'Function',
            'argumentNames': ['x', 'y'],
            'body': {'type': 'ArgumentRef', 'value': 'y'}
        }],
        ['6', [
            None,
            True,
            5,
            7,
            3.4,
            2.5,
            'hello',
            {
                'type': 'Date',
                'value': 1234567890000000
            },
            {'type': 'ValueRef', 'value': '0'},
            {'type': 'ValueRef', 'value': '1'},
            {'type': 'ValueRef', 'value': '2'},
            {'type': 'ValueRef', 'value': '4'},
            {'type': 'ValueRef', 'value': '3'},
            {'type': 'ValueRef', 'value': '5'}
        ]]
    ],
    'value': {'type': 'ValueRef', 'value': '6'}
}


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
        return {
            'type': 'Bytes',
            'value': self._value
        }

    call = ee.ComputedObject('SerializeThisThing', {'a': 'x', 'b': 5})
    variable = ee.CustomFunction.variable(None, 'y')
    custom_function = ee.CustomFunction(['x', 'y'], object, variable)
    to_encode = [
        None,
        True,
        5,
        7,
        3.4,
        2.5,
        'hello',
        datetime.datetime.utcfromtimestamp(1234567890),
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

    self.assertEquals(EXPECTED_OUTPUT, json.loads(serializer.toJSON(to_encode)))


if __name__ == '__main__':
  unittest.main()
