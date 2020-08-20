#!/usr/bin/env python
"""An object representing a custom EE Function."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

# pylint: disable=g-bad-import-order
import six

from . import computedobject
from . import ee_types
from . import encodable
from . import function
from . import serializer


# Multiple inheritance, yay! This is necessary because a CustomFunction needs to
# know how to encode itself in different ways:
# - as an Encodable: encode its definition
# - as a Function: encode its invocation (which may also involve encoding its
#   definition, if that hasn't happened yet).
class CustomFunction(function.Function, encodable.Encodable):
  """An object representing a custom EE Function."""

  def __init__(self, signature, body):
    """Creates a function defined by a given expression with unbound variables.

    The expression is created by evaluating the given function
    using variables as placeholders.

    Args:
      signature: The function signature. If any of the argument names are
          null, their names will be generated deterministically, based on
          the body.
      body: The Python function to evaluate.
    """
    variables = [CustomFunction.variable(arg['type'], arg['name'])
                 for arg in signature['args']]

    # The signature of the function.
    self._signature = CustomFunction._resolveNamelessArgs(
        signature, variables, body)

    # The expression to evaluate.
    self._body = body(*variables)

  def encode(self, encoder):
    return {
        'type': 'Function',
        'argumentNames': [x['name'] for x in self._signature['args']],
        'body': encoder(self._body)
    }

  def encode_cloud_value(self, encoder):
    return {
        'functionDefinitionValue': {
            'argumentNames': [x['name'] for x in self._signature['args']],
            'body': encoder(self._body)
        }
    }

  def encode_invocation(self, encoder):
    return self.encode(encoder)

  def encode_cloud_invocation(self, encoder):
    return {'functionReference': encoder(self)}

  def getSignature(self):
    """Returns a description of the interface provided by this function."""
    return self._signature

  @staticmethod
  def variable(type_name, name):
    """Returns a placeholder variable with a given name and EE type.

    Args:
      type_name: A class to mimic.
      name: The name of the variable as it will appear in the
          arguments of the custom functions that use this variable. If null,
          a name will be auto-generated in _resolveNamelessArgs().

    Returns:
      A variable with the given name implementing the given type.
    """
    var_type = ee_types.nameToClass(type_name) or computedobject.ComputedObject
    result = var_type.__new__(var_type)
    result.func = None
    result.args = None
    result.varName = name
    return result

  @staticmethod
  def create(func, return_type, arg_types):
    """Creates a CustomFunction.

    The result calls a given native function with the specified return type and
    argument types and auto-generated argument names.

    Args:
      func: The native function to wrap.
      return_type: The type of the return value, either as a string or a
          class reference.
      arg_types: The types of the arguments, either as strings or class
          references.

    Returns:
      The constructed CustomFunction.
    """

    def StringifyType(t):
      return t if isinstance(t, six.string_types) else ee_types.classToName(t)

    args = [{'name': None, 'type': StringifyType(i)} for i in arg_types]
    signature = {
        'name': '',
        'returns': StringifyType(return_type),
        'args': args
    }
    return CustomFunction(signature, func)

  @staticmethod
  def _resolveNamelessArgs(signature, variables, body):
    """Deterministically generates names for unnamed variables.

    The names are based on the body of the function.

    Args:
      signature: The signature which may contain null argument names.
      variables: A list of variables, some of which may be nameless.
          These will be updated to include names when this method returns.
      body: The Python function to evaluate.

    Returns:
      The signature with null arg names resolved.
    """
    nameless_arg_indices = []
    for i, variable in enumerate(variables):
      if variable.varName is None:
        nameless_arg_indices.append(i)

    # Do we have any nameless arguments at all?
    if not nameless_arg_indices:
      return signature

    # Generate the name base by counting the number of custom functions
    # within the body.
    def CountFunctions(expression):
      """Counts the number of custom functions in a serialized expression."""
      def CountNodes(nodes):
        return sum([CountNode(node) for node in nodes])
      def CountNode(node):
        if 'functionDefinitionValue' in node:
          return 1
        elif 'arrayValue' in node:
          return CountNodes(node['arrayValue']['values'])
        elif 'dictionaryValue' in node:
          return CountNodes(six.itervalues(node['dictionaryValue']['values']))
        elif 'valueReference' in node:
          return CountNode(expression['values'][node['valueReference']])
        elif 'functionInvocationValue' in node:
          fn = node['functionInvocationValue']
          count = CountNodes(six.itervalues(fn['arguments']))
          if 'functionReference' in fn:
            count += CountNode(expression['values'][fn['functionReference']])
          return count
        return 0
      return CountNode(expression['values'][expression['result']])

    serialized_body = serializer.encode(body(*variables), for_cloud_api=True)
    base_name = '_MAPPING_VAR_%d_' % CountFunctions(serialized_body)

    # Update the vars and signature by the name.
    for (i, index) in enumerate(nameless_arg_indices):
      name = base_name + str(i)
      variables[index].varName = name
      signature['args'][index]['name'] = name

    return signature
