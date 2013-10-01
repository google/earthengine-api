"""A deserializer that decodes EE object trees from JSON DAGs."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import datetime
import json
import numbers

import apifunction
import computedobject
import customfunction
import ee_exception
import encodable
import function
import geometry


def fromJSON(json_obj):
  """Deserialize an object from a JSON string appropriate for API calls.

  Args:
    json_obj: The JSON represenation of the input.

  Returns:
    The deserialized object.
  """
  return decode(json.loads(json_obj))


def decode(json_obj):
  """Decodes an object previously encoded using the EE API v2 (DAG) format.

  Args:
    json_obj: The serialied object to decode.

  Returns:
    The decoded object.
  """
  named_values = {}

  # Incrementally decode scope entries if there are any.
  if isinstance(json_obj, dict) and json_obj['type'] == 'CompoundValue':
    for i, (key, value) in enumerate(json_obj['scope']):
      if key in named_values:
        raise ee_exception.EEException(
            'Duplicate scope key "%s" in scope #%d.' % (key, i))
      named_values[key] = _decodeValue(value, named_values)
    json_obj = json_obj['value']

  # Decode the final value.
  return _decodeValue(json_obj, named_values)


def _decodeValue(json_obj, named_values):
  """Decodes an object previously encoded using the EE API v2 (DAG) format.

  This uses a provided scopre for ValueRef lookup and does not not allow the
  input to be a CompoundValue.

  Args:
    json_obj: The serialied object to decode.
    named_values: The objects that can be referenced by ValueRefs.

  Returns:
    The decoded object.
  """

  # Check for primitive values.
  if (json_obj is None or
      isinstance(json_obj, (bool, numbers.Number, basestring))):
    return json_obj

  # Check for array values.
  if isinstance(json_obj, (list, tuple)):
    return [_decodeValue(element, named_values) for element in json_obj]

  # Ensure that we've got a proper object at this point.
  if not isinstance(json_obj, dict):
    raise ee_exception.EEException('Cannot decode object: ' + json_obj)

  # Check for explicitly typed values.
  type_name = json_obj['type']
  if type_name == 'ValueRef':
    if json_obj['value'] in named_values:
      return named_values[json_obj['value']]
    else:
      raise ee_exception.EEException('Unknown ValueRef: ' + json_obj)
  elif type_name == 'ArgumentRef':
    var_name = json_obj['value']
    if not isinstance(var_name, basestring):
      raise ee_exception.EEException('Invalid variable name: ' + var_name)
    return customfunction.CustomFunction._variable(None, var_name)  # pylint: disable=protected-access
  elif type_name == 'Date':
    microseconds = json_obj['value']
    if not isinstance(microseconds, numbers.Number):
      raise ee_exception.EEException('Invalid date value: ' + microseconds)
    return datetime.datetime.utcfromtimestamp(microseconds / 1e6)
  elif type_name == 'Bytes':
    result = encodable.Encodable()
    result.encode = lambda encoder: json_obj
    return result
  elif type_name == 'Invocation':
    if 'functionName' in json_obj:
      func = apifunction.ApiFunction.lookup(json_obj['functionName'])
    else:
      func = _decodeValue(json_obj['function'], named_values)
    args = dict((key, _decodeValue(value, named_values))
                for (key, value) in json_obj['arguments'].iteritems())
    if isinstance(func, function.Function):
      return func.apply(args)
    elif isinstance(func, computedobject.ComputedObject):
      # We have to allow ComputedObjects for cases where invocations
      # return a function, e.g. Image.parseExpression().
      return computedobject.ComputedObject(func, args)
    else:
      raise ee_exception.EEException(
          'Invalid function value: ' + json_obj['function'])
  elif type_name == 'Dictionary':
    return dict((key, _decodeValue(value, named_values))
                for (key, value) in json_obj['value'].iteritems())
  elif type_name == 'Function':
    body = _decodeValue(json_obj['body'], named_values)
    signature = {
        'name': '',
        'args': [{'name': arg_name, 'type': 'Object', 'optional': False}
                 for arg_name in json_obj['argumentNames']],
        'returns': 'Object'
    }
    return customfunction.CustomFunction(signature, lambda *args: body)
  elif type_name in ('Point', 'MultiPoint', 'LineString', 'MultiLineString',
                     'Polygon', 'MultiPolygon', 'LinearRing',
                     'GeometryCollection'):
    return geometry.Geometry(json_obj)
  elif type_name == 'CompoundValue':
    raise ee_exception.EEException('Nested CompoundValues are disallowed.')
  else:
    raise ee_exception.EEException('Unknown encoded object type: ' + type_name)
