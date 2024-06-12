"""A deserializer that decodes EE object trees from JSON DAGs."""

import json

from ee import apifunction
from ee import computedobject
from ee import customfunction
from ee import ee_date
from ee import ee_exception
from ee import encodable
from ee import function
from ee import geometry


def fromJSON(json_obj):  # pylint: disable=g-bad-name
  """Deserialize an object from a JSON string appropriate for API calls.

  Args:
    json_obj: The JSON representation of the input.

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
  if 'values' in json_obj and 'result' in json_obj:
    return decodeCloudApi(json_obj)
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


def _decodeValue(json_obj, named_values):  # pylint: disable=g-bad-name
  """Decodes an object previously encoded using the EE API v2 (DAG) format.

  This uses a provided scope for ValueRef lookup and does not allow the
  input to be a CompoundValue.

  Args:
    json_obj: The serialied object to decode.
    named_values: The objects that can be referenced by ValueRefs.

  Returns:
    The decoded object.
  """

  # Check for primitive values.
  if (json_obj is None or isinstance(json_obj, (bool, float, int, str))):
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
    if not isinstance(var_name, str):
      raise ee_exception.EEException('Invalid variable name: ' + var_name)
    return customfunction.CustomFunction.variable(None, var_name)  # pylint: disable=protected-access
  elif type_name == 'Date':
    microseconds = json_obj['value']
    if not isinstance(microseconds, (float, int)):
      raise ee_exception.EEException('Invalid date value: ' + microseconds)
    return ee_date.Date(microseconds / 1e3)
  elif type_name == 'Bytes':
    result = encodable.Encodable()
    result.encode = lambda encoder: json_obj
    node = {'bytesValue': json_obj['value']}
    result.encode_cloud_value = lambda encoder: node
    return result
  elif type_name == 'Invocation':
    if 'functionName' in json_obj:
      func = apifunction.ApiFunction.lookup(json_obj['functionName'])
    else:
      func = _decodeValue(json_obj['function'], named_values)
    if 'arguments' in json_obj:
      args = dict((key, _decodeValue(value, named_values))
                  for (key, value) in json_obj['arguments'].items())
    else:
      args = {}
    return _invocation(func, args)
  elif type_name == 'Dictionary':
    return dict((key, _decodeValue(value, named_values))
                for (key, value) in json_obj['value'].items())
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


def _invocation(func, args):
  """Creates an EE object representing the application of `func` to `args`."""
  if isinstance(func, function.Function):
    return func.apply(args)
  elif isinstance(func, computedobject.ComputedObject):
    # We have to allow ComputedObjects for cases where invocations return a
    # function, e.g., Image.parseExpression(). These need to get turned back
    # into some kind of Function, for which we need a signature. Type
    # information has been lost at this point, so we just use ComputedObject.
    signature = {
        'name': '',
        'args': [{'name': name, 'type': 'ComputedObject', 'optional': False}
                 for name in args],
        'returns': 'ComputedObject'
    }
    return function.SecondOrderFunction(func, signature).apply(args)
  raise ee_exception.EEException('Invalid function value: %s' % func)


def fromCloudApiJSON(json_obj):  # pylint: disable=g-bad-name
  """Deserializes an object from the JSON string used in Cloud API calls.

  Args:
    json_obj: The JSON representation of the input.

  Returns:
    The deserialized object.
  """
  return decodeCloudApi(json.loads(json_obj))


def decodeCloudApi(json_obj):  # pylint: disable=g-bad-name
  """Decodes an object previously encoded using the EE Cloud API format.

  Args:
    json_obj: The serialized object to decode.

  Returns:
    The decoded object.
  """

  decoded = {}
  def lookup(reference, kind):
    if reference not in decoded:
      if reference not in json_obj['values']:
        raise ee_exception.EEException('Cannot find %s %s' % (reference, kind))
      decoded[reference] = decode_node(json_obj['values'][reference])
    return decoded[reference]

  def decode_node(node):
    if 'constantValue' in node:
      return node['constantValue']
    elif 'arrayValue' in node:
      return [decode_node(x) for x in node['arrayValue']['values']]
    elif 'dictionaryValue' in node:
      return {
          key: decode_node(x)
          for key, x in node['dictionaryValue']['values'].items()
      }
    elif 'argumentReference' in node:
      return customfunction.CustomFunction.variable(
          None, node['argumentReference'])  # pylint: disable=protected-access
    elif 'functionDefinitionValue' in node:
      return decode_function_definition(node['functionDefinitionValue'])
    elif 'functionInvocationValue' in node:
      return decode_function_invocation(node['functionInvocationValue'])
    elif 'bytesValue' in node:
      return _decodeValue({'type': 'Bytes', 'value': node['bytesValue']}, {})
    elif 'integerValue' in node:
      return int(node['integerValue'])
    elif 'valueReference' in node:
      return lookup(node['valueReference'], 'reference')
    return None

  def decode_function_definition(defined):
    body = lookup(defined['body'], 'function body')
    signature_args = [{'name': name, 'type': 'Object', 'optional': False}
                      for name in defined['argumentNames']]
    signature = {'args': signature_args, 'name': '', 'returns': 'Object'}
    return customfunction.CustomFunction(signature, lambda *args: body)

  def decode_function_invocation(invoked):
    if 'functionReference' in invoked:
      func = lookup(invoked['functionReference'], 'function')
    else:
      func = apifunction.ApiFunction.lookup(invoked['functionName'])
    if 'arguments' in invoked:
      args = {key: decode_node(x) for key, x in invoked['arguments'].items()}
    else:
      args = {}
    return _invocation(func, args)

  return lookup(json_obj['result'], 'result value')
