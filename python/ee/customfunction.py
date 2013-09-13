"""An object representing a custom EE Function."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable-msg=g-bad-name

import ee_types
import encodable
import function


class CustomFunction(function.Function):
  """An object representing a custom EE Function."""

  def __init__(self, signature, body):
    """Creates a function defined by a given expression with unbound variables.

    The expression is created by evaluating the given function
    using variables as placeholders.

    Args:
      signature: The function signature
      body: The Python function to evaluate.
    """
    variables = [CustomFunction.variable(arg['type'], arg['name'])
                 for arg in signature['args']]
    body = body(*variables)

    # The signature of the function.
    self._signature = signature

    # The expression to evaluate.
    self._body = body

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
  def variable(type_name, name):
    """Returns a placeholder variable with a given name and EE type.

    Args:
      type_name: A class to mimic.
      name: The name of the variable as it will appear in the
          arguments of the custom functions that use this variable.

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
        pass  # Don't call the base class's constructor.

      def encode(self, unused_encoder):
        return {
            'type': 'ArgumentRef',
            'value': name
        }

    instance = Variable()
    setattr(instance, ee_types.VAR_TYPE_KEY, var_type)
    return instance
