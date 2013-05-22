"""An object representing a custom EE Function."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable-msg=g-bad-name

import ee_exception
import ee_types
import encodable
import function


class CustomFunction(function.Function):
  """An object representing a custom EE Function."""

  def __init__(self, args, return_type, body):
    """Creates a function defined by a given expression with unbound variables.

    Args:
      args: The arguments to the function. If body is a Python function, this
          must be a map from argument names to types (classes). Otherwise this
          is an array of names.
      return_type: The expected return type of the function as a class,
          or None if not known.
      body: The expression to evaluate. Can be either:
          1. A Python function, in which case the args argument must describe
             the types of this function's arguments.
          2. An encodable value, made out of primitives (boolean, number,
             string, datetime), data structures (lists, dictionaries),
             ComputedObjects or variables (made by CustomFunction.variable()).
             Variables refer to the elements of args by names. Structures and
             ComputedObjects can recursively contain any of the above.
    """
    if callable(body):
      if not isinstance(args, dict):
        raise ee_exception.EEException(
            'The "args" of a custom function created from a native '
            'Python function must be a dictionary from name to type.')
      arg_names = args.keys()
      arg_types = args.values()
      variables = [CustomFunction.variable(var_type, name)
                   for name, var_type in args.iteritems()]
      body = body(*variables)
    else:
      if not isinstance(args, (list, tuple)):
        raise ee_exception.EEException(
            'The "args" of a custom function created from an '
            'expression must be a list or tuple of names.')
      arg_names = args
      arg_types = [object] * len(args)

    # The names of the function arguments.
    self._arg_names = arg_names

    # The types of the function arguments.
    self._arg_types = arg_types

    # The return type of the function.
    self._return_type = return_type or object

    # The expression to evaluate.
    self._body = body

  def encode(self, encoder):
    return {
        'type': 'Function',
        'argumentNames': self._arg_names,
        'body': encoder(self._body)
    }

  def getSignature(self):
    """Returns a description of the interface provided by this function."""
    return {
        'name': '',
        'args': [
            {'name': name, 'type': ee_types.classToName(cls), 'optional': False}
            for name, cls in zip(self._arg_names, self._arg_types)
        ],
        'returns': ee_types.classToName(self._return_type)
    }

  @staticmethod
  def variable(var_type, name):
    """Returns a placeholder variable with a given name and EE type.

    Args:
      var_type: A class to mimic.
      name: The name of the variable as it will appear in the
          arguments of the custom functions that use this variable.

    Returns:
      A variable with the given name implementing the given type.
    """
    var_type = var_type or object
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
