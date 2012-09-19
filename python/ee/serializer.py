# Copyright 2012 Google Inc. All Rights Reserved.

"""A wrapper for the JSON module that allows per-object serialize methods.

This json module wrapper checks each object to see if it has
a serialize method.  If so, it uses that to do the serialization.
Otherwise, it uses the default serialization.
"""



# Using old-style python function naming on purpose to match the
# javascript version's naming.
# pylint: disable-msg=C6003,C6409

import json

import ee_exception


def _customSerialize(obj):
  """A custom serializer that uses an object's serialize() method.

  Args:
    obj: The object to serialize.

  Returns:
    A serializable representation of the object.

  Raises:
    EEException: if the object isn't serializable.
  """
  if not hasattr(obj, 'serialize'):
    raise ee_exception.EEException('Unserializable object: ' + obj)
  return json.loads(obj.serialize())


def toJSON(obj, opt_pretty=True):
  """Convert an object to JSON.

  Args:
    obj: The object to Serialize.
    opt_pretty: True to pretty-print the object.

  Returns:
    A JSON string representing the input.
  """
  return json.dumps(obj, default=_customSerialize,
                    indent=2 if opt_pretty else None)
