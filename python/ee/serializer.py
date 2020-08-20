#!/usr/bin/env python
"""A serializer that encodes EE object trees as JSON DAGs."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

# pylint: disable=g-bad-import-order
import collections
import datetime
import hashlib
import json
import math
import numbers
import six

from . import _cloud_api_utils
from . import ee_exception
from . import encodable

# The datetime for the beginning of the Unix epoch.
_EPOCH_DATETIME = datetime.datetime.utcfromtimestamp(0)

# Don't generate very deep expressions, as the backend rejects them.
# The backend's limit is 100, and we want to stay well away from that
# as a few extra levels of wrapping are always added.
_DEPTH_LIMIT = 50


def DatetimeToMicroseconds(date):
  """Convert a datetime to a timestamp, microseconds since the epoch."""
  td = (date - _EPOCH_DATETIME)
  microseconds = td.microseconds + (td.seconds + td.days * 24 * 3600) * 1e6
  return math.floor(microseconds)


class Serializer(object):
  """A serializer for EE object trees."""

  def __init__(self, is_compound=True, for_cloud_api=False):
    """Constructs a serializer.

    Args:
      is_compound: Whether the encoding should factor out shared subtrees.
      for_cloud_api: Whether the encoding should be done for the Cloud API or
        the legacy API.
    """

    # Whether the encoding should factor out shared subtrees.
    self._is_compound = bool(is_compound)

    self._for_cloud_api = bool(for_cloud_api)

    # A list of shared subtrees as [name, value] pairs.
    self._scope = []

    # A lookup table from object hash to subtree names as stored in self._scope
    self._encoded = {}

    # A lookup table from object ID as retrieved by id() to md5 hash values.
    self._hashcache = {}

  def _encode(self, obj):
    """Encodes a top level object to be executed server-side.

    Args:
      obj: The object to encode.

    Returns:
      An encoded object ready for JSON serialization.
    """
    if self._for_cloud_api:
      return self._encode_for_cloud_api(obj)
    value = self._encode_value(obj)
    if self._is_compound:
      if (isinstance(value, dict) and value['type'] == 'ValueRef' and
          len(self._scope) == 1):
        # Just one value. No need for complex structure.
        value = self._scope[0][1]
      else:
        # Wrap the scopes and final value with a CompoundValue.
        value = {'type': 'CompoundValue', 'scope': self._scope, 'value': value}
      # Clear state in case of future encoding.
      self._scope = []
      self._encoded = {}
      self._hashcache = {}
    return value

  def _encode_for_cloud_api(self, obj):
    """Encodes an object as an Expression or quasi-Expression."""
    value = self._encode_cloud_object(obj)
    if self._is_compound:
      # Wrap the scopes and final value into an Expression.
      value = _ExpressionOptimizer(value, self._scope).optimize()
      # Clear state in case of future encoding.
      self._scope = []
      self._encoded = {}
      self._hashcache = {}
    else:
      value = _ExpressionOptimizer(value).optimize()
    return value

  def _encode_value(self, obj):
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
      return {'type': 'ValueRef', 'value': encoded}
    elif obj is None or isinstance(obj,
                                   (bool, numbers.Number, six.string_types)):
      # Primitives are encoded as is and not saved in the scope.
      return obj
    elif isinstance(obj, datetime.datetime):
      # A raw date slipped through. Wrap it. Calling ee.Date from here would
      # cause a circular dependency, so we encode it manually.
      return {
          'type': 'Invocation',
          'functionName': 'Date',
          'arguments': {
              'value': DatetimeToMicroseconds(obj) / 1e3
          }
      }
    elif isinstance(obj, encodable.Encodable):
      # Some objects know how to encode themselves.
      result = obj.encode(self._encode_value)
      if (not isinstance(result, (list, tuple)) and
          (not isinstance(result, (dict)) or result['type'] == 'ArgumentRef')):
        # Optimization: simple enough that adding it to the scope is probably
        # not worth it.
        return result
    elif isinstance(obj, encodable.EncodableFunction):
      result = obj.encode_invocation(self._encode_value)
      if (not isinstance(result, (list, tuple)) and
          (not isinstance(result, (dict)) or result['type'] == 'ArgumentRef')):
        # Optimization: simple enough that adding it to the scope is probably
        # not worth it.
        return result
    elif isinstance(obj, (list, tuple)):
      # Lists are encoded recursively.
      result = [self._encode_value(i) for i in obj]
    elif isinstance(obj, dict):
      # Dictionary are encoded recursively and wrapped in a type specifier.
      result = {
          'type':
              'Dictionary',
          'value':
              dict([(key, self._encode_value(value))
                    for key, value in obj.items()])
      }
    else:
      raise ee_exception.EEException('Can\'t encode object: %s' % obj)

    if self._is_compound:
      # Save the new object and return a ValueRef.
      hashval = hashlib.md5(json.dumps(result).encode()).digest()
      self._hashcache[obj_id] = hashval
      name = self._encoded.get(hashval, None)
      if not name:
        name = str(len(self._scope))
        self._scope.append((name, result))
        self._encoded[hashval] = name
      return {'type': 'ValueRef', 'value': name}
    else:
      return result

  def _encode_cloud_object(self, obj):
    """Encodes an object using the Cloud API Expression form.

    If _is_compound is True, this will fill the _scope and _encoded properties.

    Args:
      obj: The object to encode.

    Returns:
      If _is_compound is True, a string that is the key under which the
        encoded object is stored in _scope.
      If _is_compound is False, the encoded object as a single quasi-Expression.
    """
    obj_id = id(obj)
    hashval = self._hashcache.get(obj_id)
    reference = self._encoded.get(hashval, None)
    if reference:
      return reference
    elif obj is None or isinstance(obj, (bool, six.string_types)):
      result = {'constantValue': obj}
    elif isinstance(obj, numbers.Number):
      result = _cloud_api_utils.encode_number_as_cloud_value(obj)
    elif isinstance(obj, datetime.datetime):
      # A raw date slipped through. Wrap it. Calling ee.Date from here would
      # cause a circular dependency, so we encode it manually.
      result = {
          'functionInvocationValue': {
              'functionName': 'Date',
              'arguments': {
                  'value': {
                      'constantValue': DatetimeToMicroseconds(obj) / 1e3
                  }
              }
          }
      }
    elif isinstance(obj, encodable.Encodable):
      # Some objects know how to encode themselves.
      result = obj.encode_cloud_value(self._encode_cloud_object)
    elif isinstance(obj, (list, tuple)):
      # Lists are encoded recursively.
      if self._is_compound:
        result = {
            'arrayValue': {
                'values': [{
                    'valueReference': self._encode_cloud_object(i)
                } for i in obj]
            }
        }
      else:
        result = {
            'arrayValue': {
                'values': [self._encode_cloud_object(i) for i in obj]
            }
        }
    elif isinstance(obj, dict):
      # Dictionary are encoded recursively and wrapped in a type specifier.
      # We iterate through the entries in a deterministic order, not because it
      # affects the order of the entries in the output result, but because it
      # affects the names that they are assigned in _scope; without the
      # ordering, the encoding process may produce one of multiple different
      # (albeit equivalent) representations.
      if self._is_compound:
        result = {
            'dictionaryValue': {
                'values': {
                    key: {
                        'valueReference': self._encode_cloud_object(obj[key])
                    } for key in sorted(obj)
                }
            }
        }
      else:
        result = {
            'dictionaryValue': {
                'values': {
                    key: self._encode_cloud_object(obj[key])
                    for key in sorted(obj)
                }
            }
        }
    else:
      raise ee_exception.EEException('Can\'t encode object: %s' % obj)

    if self._is_compound:
      # Save the new object and return a ValueRef.
      hashval = hashlib.md5(json.dumps(result).encode()).digest()
      self._hashcache[obj_id] = hashval
      name = self._encoded.get(hashval, None)
      if not name:
        name = str(len(self._scope))
        self._scope.append((name, result))
        self._encoded[hashval] = name
      return name
    else:
      return result


def encode(obj, is_compound=True, for_cloud_api=True):
  """Serialize an object to a JSON-compatible structure for API calls.

  Args:
    obj: The object to serialize.
    is_compound: Whether the encoding should factor out shared subtrees.
    for_cloud_api: Whether the encoding should be done for the Cloud API or the
      legacy API.

  Returns:
    A JSON-compatible structure representing the input.
  """
  serializer = Serializer(is_compound, for_cloud_api=for_cloud_api)
  return serializer._encode(obj)  # pylint: disable=protected-access


def toJSON(obj, opt_pretty=False, for_cloud_api=True):
  """Serialize an object to a JSON string appropriate for API calls.

  Args:
    obj: The object to serialize.
    opt_pretty: True to pretty-print the object.
    for_cloud_api: Whether the encoding should be done for the Cloud API or the
      legacy API.

  Returns:
    A JSON string representing the input.
  """
  serializer = Serializer(not opt_pretty, for_cloud_api=for_cloud_api)
  encoded = serializer._encode(obj)  # pylint: disable=protected-access
  return json.dumps(encoded, indent=2 if opt_pretty else None)


def toReadableJSON(obj, for_cloud_api=True):
  """Convert an object to readable JSON."""
  return toJSON(obj, True, for_cloud_api=for_cloud_api)


class _ExpressionOptimizer(object):
  """Optimises the representation of an Expression.

  The Expressions generated by recursive encoding can be inefficiently
  represented. This class helps improve the representation.

  The initial representation is intentionally simple, as it makes the encoding
  logic simple. Constants end up as individual ValueNodes, though the Expression
  format itself allows complex constants (nested arrays and/or dicts containing
  constant values). There are also often places where references to ValueNodes
  can be replaced by direct inclusion of those ValueNodes.

  This operates in two modes:
  - It can be passed an Expression as a dict of named ValueNodes, and the name
    that represents the final result. In this case, it returns the optimised
    Expression in the same form. This is the "compound" mode.
  - It can be passed a quasi-Expression as a single object. In this case, it
    returns the optimised quasi-Expression in the same form. This is the
    "non-compound" mode. A "quasi-Expression" is essentially an Expression DAG
    that's been expanded to a tree by replacing references with the actual thing
    being referenced. This means that if the same entity is referenced more than
    once, it will be duplicated in the tree.

  The rules that the optimiser follows are straightforward:
  - If a value is referred to only once, lift it into the place that references
    it.
  - If a value is a numeric or boolean constant, lift it into all the places
    that reference it.
  - If a value is a string constant, lift it if it is referred to only once.
  - Collapse dicts and arrays of constants to constant dicts/arrays.
  """

  def __init__(self, result, values=None):
    """Builds an ExpressionOptimizer.

    Args:
      result: The result to optimize, either as a key of "values", or as a
        quasi-Expression.
      values: If provided (in compound mode), a set of named ValueNodes.
    """
    self._result = result
    # We want to make sure the process is deterministic.
    self._values = collections.OrderedDict(
        values) if values is not None else None
    if self._is_compound():
      self._single_uses = self._find_single_uses()
      self._optimized_values = {}
      self._reference_map = {}

  def _is_compound(self):
    return self._values is not None

  def _find_single_uses(self):
    """Finds the names of all named values that are referred to only once."""
    reference_counts = collections.defaultdict(int)
    reference_counts[self._result] += 1

    def _contained_reference(value):
      """Gets a contained reference from a ValueNode, if there is one."""
      if 'functionDefinitionValue' in value:
        return value['functionDefinitionValue']['body']
      elif 'functionInvocationValue' in value:
        function_invocation = value['functionInvocationValue']
        if 'functionReference' in function_invocation:
          return function_invocation['functionReference']
      elif 'valueReference' in value:
        return value['valueReference']
      return None

    def increment_reference_count(value):
      reference = _contained_reference(value)
      if reference is not None:
        reference_counts[reference] += 1

    self._visit_all_values_in_expression(increment_reference_count)
    return set(reference for reference, count in six.iteritems(reference_counts)
               if count == 1)

  def optimize(self):
    """Optimises the expression, returning the optimised form."""
    optimized_result = self._optimize_referred_value(self._result)
    if self._is_compound():
      return {'result': optimized_result, 'values': self._optimized_values}
    else:
      return optimized_result

  def _optimize_referred_value(self, reference_or_value):
    """Recursively optimises a value.

    Optimises a value and everything recursively reachable from it.

    This operates differently depending on the mode.
    In compound mode:
      Takes a name (in _values) for a ValueNode, optimises the referenced
      ValueNode, and returns a name (in _optimized_values) for the optimised
      ValueNode. Updates _optimized_values and _reference_map.
    In non-compound mode:
      Takes a quasi-ValueNode, optimises it, and returns the optimised
      quasi-ValueNode.

    Args:
      reference_or_value: The name in _values of the value to optimise, or the
        actual value itself.

    Returns:
      The name, in _optimized_values, of the optimised value, or the optimised
      value itself.
    """
    if self._is_compound():
      if reference_or_value in self._reference_map:
        return self._reference_map[reference_or_value]
      mapped_reference = str(len(self._reference_map))
      self._reference_map[reference_or_value] = mapped_reference
      self._optimized_values[mapped_reference] = self._optimize_value(
          self._values[reference_or_value], 0)
      return mapped_reference
    else:
      return self._optimize_value(reference_or_value, 0)

  def _optimize_value(self, value, depth):
    """Optimises a single value.

    Args:
      value: The ValueNode to optimise, in dict form.
      depth: How deep in the encoded output this value will be placed.

    Returns:
      An optimised version of that value, created by lifting in all feasible
      constants and references, subject (in compound mode) to a depth limit.
    """
    if any(
        x in value for x in
        ['constantValue', 'integerValue', 'bytesValue', 'argumentReference']):
      # Not optimisable.
      return value
    elif 'arrayValue' in value:
      # Optimise recursively, then turn an array of constants into a constant
      # array.
      optimized_array = [
          self._optimize_value(array_value, depth + 3)
          for array_value in value['arrayValue']['values']
      ]
      if all(self._is_constant_value(v) for v in optimized_array):
        optimized_array = [v['constantValue'] for v in optimized_array]
        return {'constantValue': optimized_array}
      else:
        return {'arrayValue': {'values': optimized_array}}
    elif 'dictionaryValue' in value:
      # Optimise recursively, then turn a dict of constants into a constant
      # dict.
      optimized_dict = {
          key: self._optimize_value(dict_value, depth + 3) for key, dict_value
          in six.iteritems(value['dictionaryValue']['values'])
      }
      if all(
          self._is_constant_value(v) for v in six.itervalues(optimized_dict)):
        optimized_dict = {
            k: v['constantValue'] for k, v in six.iteritems(optimized_dict)
        }
        return {'constantValue': optimized_dict}
      else:
        return {'dictionaryValue': {'values': optimized_dict}}
    elif 'functionDefinitionValue' in value:
      function_definition = value['functionDefinitionValue']
      return {
          'functionDefinitionValue': {
              'argumentNames': function_definition['argumentNames'],
              'body': self._optimize_referred_value(function_definition['body'])
          }
      }
    elif 'functionInvocationValue' in value:
      function_invocation = value['functionInvocationValue']
      arguments = function_invocation['arguments']
      optimized_invocation = {}
      if 'functionName' in function_invocation:
        optimized_invocation['functionName'] = function_invocation[
            'functionName']
      else:
        optimized_invocation[
            'functionReference'] = self._optimize_referred_value(
                function_invocation['functionReference'])
      optimized_invocation['arguments'] = {
          k: self._optimize_value(arguments[k], depth + 3)
          for k, v in six.iteritems(arguments)
      }
      return {'functionInvocationValue': optimized_invocation}
    elif 'valueReference' in value:
      # Lift if possible: anything used only here, anything lightweight.
      reference = value['valueReference']
      if not self._is_compound():
        return self._optimize_value(reference, depth)

      referenced_value = self._values[reference]
      if reference in self._single_uses and depth < _DEPTH_LIMIT:
        return self._optimize_value(referenced_value, depth)
      else:
        if self._is_always_liftable(referenced_value):
          return referenced_value
        return {'valueReference': self._optimize_referred_value(reference)}

  def _is_always_liftable(self, value):
    """Determines if a value is simple enough to lift unconditionally."""
    # Non-string constants and argument references are simple enough.
    if 'constantValue' in value:
      return self._is_liftable_constant(value['constantValue'])
    else:
      return 'argumentReference' in value

  def _is_liftable_constant(self, value):
    """Whether a constant is simple enough to lift to where it's referenced."""
    return value is None or isinstance(value, (bool, numbers.Number))

  def _is_constant_value(self, value):
    """Whether a ValueNode (as a dict) is a constant."""
    return 'constantValue' in value

  def _visit_all_values_in_expression(self, visitor):
    """Calls visitor on all ValueNodes in the expression.

    Args:
      visitor: A callable that will be invoked once at every ValueNode in the
        expression, including nested ValueNodes.
    """
    self._visit_all_values(self._result, self._values[self._result], set(),
                           visitor)

  def _visit_all_values(self, reference, value, visited, visitor):
    """Calls visitor on a ValueNode and its descendants.

    Args:
      reference: A reference to the ValueNode, or None.
      value: The ValueNode, in dict form.
      visited: A set of references for which the visitor has already been
        invoked.
      visitor: The callable to invoke.
    """
    if reference is not None:
      if reference in visited:
        return
      visited.add(reference)
    visitor(value)

    if 'arrayValue' in value:
      for v in value['arrayValue']['values']:
        self._visit_all_values(None, v, visited, visitor)
    elif 'dictionaryValue' in value:
      d = value['dictionaryValue']['values']
      for k in sorted(d):
        self._visit_all_values(None, d[k], visited, visitor)
    elif 'functionDefinitionValue' in value:
      definition_reference = value['functionDefinitionValue']['body']
      self._visit_all_values(definition_reference,
                             self._values[definition_reference], visited,
                             visitor)
    elif 'functionInvocationValue' in value:
      function_invocation = value['functionInvocationValue']
      if 'functionReference' in function_invocation:
        function_reference = function_invocation['functionReference']
        self._visit_all_values(function_reference,
                               self._values[function_reference], visited,
                               visitor)
      arguments = function_invocation['arguments']
      for k in sorted(arguments):
        self._visit_all_values(None, arguments[k], visited, visitor)
    elif 'valueReference' in value:
      value_reference = value['valueReference']
      self._visit_all_values(value_reference, self._values[value_reference],
                             visited, visitor)
