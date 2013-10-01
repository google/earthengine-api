"""An object representing a custom EE Function."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable-msg=g-bad-name

import ee_types
import encodable
import function
import serializer


class CustomFunction(function.Function):
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
    variables = [CustomFunction._variable(arg['type'], arg['name'])
                 for arg in signature['args']]

    # The expression to evaluate.
    self._body = body(*variables)

    # The signature of the function.
    self._signature = CustomFunction._resolveNamelessArgs(
        signature, variables, self._body)

  def encode(self, encoder):
    return {
        'type': 'Function',
        'argumentNames': [x['name'] for x in self._signature['args']],
        'body': encoder(self._body)
    }

  def getSignature(self):
    """Returns a description of the interface provided by this function."""
    return self._signature

  @staticmethod
  def _variable(type_name, name):
    """Returns a placeholder variable with a given name and EE type.

    Args:
      type_name: A class to mimic.
      name: The name of the variable as it will appear in the
          arguments of the custom functions that use this variable. If null,
          a name will be auto-generated in _resolveNamelessArgs().

    Returns:
      A variable with the given name implementing the given type.
    """
    var_type = ee_types.nameToClass(type_name) or object
    if issubclass(var_type, encodable.Encodable):
      base = var_type
    else:
      base = encodable.Encodable

    class Variable(base):
      def __init__(self):
        # Don't call the base class's constructor.
        self._name = name

      def encode(self, unused_encoder):
        return {
            'type': 'ArgumentRef',
            'value': self._name
        }

    instance = Variable()
    setattr(instance, ee_types.VAR_TYPE_KEY, var_type)
    return instance

  @staticmethod
  def _resolveNamelessArgs(signature, variables, body):
    """Deterministically generates names for unnamed variables.

    The names are based on the body of the function.

    Args:
      signature: The signature which may contain null argument names.
      variables: A list of variables, some of which may be nameless.
          These will be updated to include names when this method returns.
      body: The body of the function.

    Returns:
      The signature with null arg names resolved.
    """
    nameless_arg_indices = []
    for i, variable in enumerate(variables):
      if variable._name is None:  # pylint: disable-msg=protected-access
        nameless_arg_indices.append(i)

    # Do we have any nameless arguments at all?
    if not nameless_arg_indices:
      return signature

    # Generate the name base by counting the number of named variable
    # references within the body.
    def CountVariables(expression):
      """Counts the number of variable references in a serialized expression."""
      count = 0
      if isinstance(expression, dict):
        if (expression.get('type') == 'ArgumentRef' and
            expression.get('value') is not None):
          # Technically this allows false positives if one of the user
          # dictionaries contains type=ArgumentRef, but that does not matter
          # for this use case, as we only care about determinism.
          count += 1
        else:
          for sub_expression in expression.itervalues():
            count += CountVariables(sub_expression)
      elif isinstance(expression, (list, tuple)):
        for sub_expression in expression:
          count += CountVariables(sub_expression)
      return count
    serialized_body = serializer.encode(body)
    base_name = '_MAPPING_VAR_%d_' % CountVariables(serialized_body)

    # Update the vars and signature by the name.
    for (i, index) in enumerate(nameless_arg_indices):
      name = base_name + str(i)
      variables[index]._name = name  # pylint: disable-msg=protected-access
      signature['args'][index]['name'] = name

    return signature
