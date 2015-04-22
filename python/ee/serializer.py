#!/usr/bin/env python
"""A serializer that encodes EE object trees as JSON DAGs."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import datetime
import json
import math
import md5
import numbers

import ee_exception
import encodable


# The datetime for the beginning of the Unix epoch.
_EPOCH_DATETIME = datetime.datetime.utcfromtimestamp(0)


def DatetimeToMicroseconds(date):
  """Convert a datetime to a timestamp, microseconds since the epoch."""
  td = (date - _EPOCH_DATETIME)
  microseconds = td.microseconds + (td.seconds + td.days * 24 * 3600) * 1e6
  return math.floor(microseconds)


class Serializer(object):
  """A serializer for EE object trees."""

  def __init__(self, is_compound=True):
    """Constructs a serializer.

    Args:
      is_compound: Whether the encoding should factor out shared subtrees.
    """

    # Whether the encoding should factor out shared subtrees.
    self._is_compound = bool(is_compound)

    # A list of shared subtrees as [name, value] pairs.
    self._scope = []

    # A lookup table from object hash to subtree names as stored in self._scope
    self._encoded = {}

    # A lookup table from object ID as retrieved by id() to md5 hash values.
    self._hashcache = {}

  def _encode(self, obj):
    """Encodes a top level object in the EE API v2 (DAG) format.

    Args:
      obj: The object to encode.

    Returns:
      An encoded object ready for JSON serialization.
    """
    value = self._encodeValue(obj)
    if self._is_compound:
      if (isinstance(value, dict) and
          value['type'] == 'ValueRef' and
          len(self._scope) == 1):
        # Just one value. No need for complex structure.
        value = self._scope[0][1]
      else:
        # Wrap the scopes and final value with a CompoundValue.
        value = {
            'type': 'CompoundValue',
            'scope': self._scope,
            'value': value
        }
      # Clear state in case of future encoding.
      self._scope = []
      self._encoded = {}
      self._hashcache = {}
    return value

  def _encodeValue(self, obj):
    """Encodes a subtree as a Value in the EE API v2 (DAG) format.

    If _is_compound is True, this will fill the _scope and _encoded properties.

    Args:
      obj: The object to encode.

    Returns:
      An encoded object.
    """
    obj_id = id(obj)
    hashval = self._hashcache.get(obj_id)
    encoded = self._encoded.get(hashval, None)
    if self._is_compound and encoded:
      # Already encoded objects are encoded as ValueRefs and returned directly.
      return {
          'type': 'ValueRef',
          'value': encoded
      }
    elif obj is None or isinstance(obj, (bool, numbers.Number, basestring)):
      # Primitives are encoded as is and not saved in the scope.
      return obj
    elif isinstance(obj, datetime.datetime):
      # A raw date slipped through. Wrap it. Calling ee.Date from here would
      # cause a circular dependency, so we encode it manually.
      return {
          'type': 'Invocation',
          'functionName': 'Date',
          'arguments': {'value': DatetimeToMicroseconds(obj) / 1e3}
      }
    elif isinstance(obj, encodable.Encodable):
      # Some objects know how to encode themselves.
      result = obj.encode(self._encodeValue)
      if (not isinstance(result, (list, tuple)) and
          (not isinstance(result, (dict)) or result['type'] == 'ArgumentRef')):
        # Optimization: simple enough that adding it to the scope is probably
        # not worth it.
        return result
    elif isinstance(obj, (list, tuple)):
      # Lists are encoded recursively.
      result = [self._encodeValue(i) for i in obj]
    elif isinstance(obj, dict):
      # Dictionary are encoded recursively and wrapped in a type specifier.
      result = {
          'type': 'Dictionary',
          'value': dict([(key, self._encodeValue(value))
                         for key, value in obj.iteritems()])
      }
    else:
      raise ee_exception.EEException('Can\'t encode object: %s' % obj)

    if self._is_compound:
      # Save the new object and return a ValueRef.
      hashval = md5.new(json.dumps(result)).digest()
      self._hashcache[obj_id] = hashval
      name = self._encoded.get(hashval, None)
      if not name:
        name = str(len(self._scope))
        self._scope.append((name, result))
        self._encoded[hashval] = name
      return {
          'type': 'ValueRef',
          'value': name
      }
    else:
      return result


def encode(obj, is_compound=True):
  """Serialize an object to a JSON-compatible structure for API calls.

  Args:
    obj: The object to serialize.
    is_compound: Whether the encoding should factor out shared subtrees.

  Returns:
    A JSON-compatible structure representing the input.
  """
  serializer = Serializer(is_compound)
  return serializer._encode(obj)  # pylint: disable=protected-access


def toJSON(obj, opt_pretty=False):
  """Serialize an object to a JSON string appropriate for API calls.

  Args:
    obj: The object to serialize.
    opt_pretty: True to pretty-print the object.

  Returns:
    A JSON string representing the input.
  """
  serializer = Serializer(not opt_pretty)
  encoded = serializer._encode(obj)  # pylint: disable=protected-access
  return json.dumps(encoded, indent=2 if opt_pretty else None)


def toReadableJSON(obj):
  """Convert an object to readable JSON."""
  return toJSON(obj, True)
