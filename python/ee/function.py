#!/usr/bin/env python
"""A base class for EE Functions."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import textwrap

from . import computedobject
from . import ee_exception
from . import encodable
from . import serializer


class Function(encodable.EncodableFunction):
  """An abstract base class for functions callable by the EE API.

  Subclasses must implement encode_invocation() and getSignature().
  """

  # A function used to type-coerce arguments and return values.
  _promoter = staticmethod(lambda value, type_name: value)

  @staticmethod
  def _registerPromoter(promoter):
    """Registers a function used to type-coerce arguments and return values.

    Args:
      promoter: A function used to type-coerce arguments and return values.
          Passed a value as the first parameter and a type name as the second.
          Can be used, for example, promote numbers or strings to Images.
          Should return the input promoted if the type is recognized,
          otherwise the original input.
    """
    Function._promoter = staticmethod(promoter)

  def getSignature(self):
    """Returns a description of the interface provided by this function.

    Returns:
      The function's signature, a dictionary containing:
        name: string
        returns: type name string
        args: list of argument dictionaries, each containing:
          name: string
          type: type name string
          optional: boolean
          default: an arbitrary primitive or encodable object
    """
    raise NotImplementedError(
        'Function subclasses must implement getSignature().')

  def call(self, *args, **kwargs):
    """Calls the function with the given positional and keyword arguments.

    Args:
      *args: The positional arguments to pass to the function.
      **kwargs: The named arguments to pass to the function.

    Returns:
      A ComputedObject representing the called function. If the signature
      specifies a recognized return type, the returned value will be cast
      to that type.
    """
    return self.apply(self.nameArgs(args, kwargs))

  def apply(self, named_args):
    """Calls the function with a dictionary of named arguments.

    Args:
      named_args: A dictionary of named arguments to pass to the function.

    Returns:
      A ComputedObject representing the called function. If the signature
      specifies a recognized return type, the returned value will be cast
      to that type.
    """
    result = computedobject.ComputedObject(self, self.promoteArgs(named_args))
    return Function._promoter(result, self.getReturnType())

  def promoteArgs(self, args):
    """Promotes arguments to their types based on the function's signature.

    Verifies that all required arguments are provided and no unknown arguments
    are present.

    Args:
      args: A dictionary of keyword arguments to the function.

    Returns:
      A dictionary of promoted arguments.

    Raises:
      EEException: If unrecognized arguments are passed or required ones are
          missing.
    """
    specs = self.getSignature()['args']

    # Promote all recognized args.
    promoted_args = {}
    known = set()
    for spec in specs:
      name = spec['name']
      if name in args:
        promoted_args[name] = Function._promoter(args[name], spec['type'])
      elif not spec.get('optional'):
        raise ee_exception.EEException(
            'Required argument (%s) missing to function: %s' % (name, self))
      known.add(name)

    # Check for unknown arguments.
    unknown = set(args.keys()).difference(known)
    if unknown:
      raise ee_exception.EEException(
          'Unrecognized arguments %s to function: %s' % (unknown, self))

    return promoted_args

  def nameArgs(self, args, extra_keyword_args=None):
    """Converts a list of positional arguments to a map of keyword arguments.

    Uses the function's signature for argument names. Note that this does not
    check whether the array contains enough arguments to satisfy the call.

    Args:
      args: Positional arguments to the function.
      extra_keyword_args: Optional named arguments to add.

    Returns:
      Keyword arguments to the function.

    Raises:
      EEException: If conflicting arguments or too many of them are supplied.
    """
    specs = self.getSignature()['args']

    # Handle positional arguments.
    if len(specs) < len(args):
      raise ee_exception.EEException(
          'Too many (%d) arguments to function: %s' % (len(args), self))
    named_args = dict([(spec['name'], value)
                       for spec, value in zip(specs, args)])

    # Handle keyword arguments.
    if extra_keyword_args:
      for name in extra_keyword_args:
        if name in named_args:
          raise ee_exception.EEException(
              'Argument %s specified as both positional and '
              'keyword to function: %s' % (name, self))
        named_args[name] = extra_keyword_args[name]
      # Unrecognized arguments are checked in promoteArgs().

    return named_args

  def getReturnType(self):
    return self.getSignature()['returns']

  def serialize(self, for_cloud_api=True):
    return serializer.toJSON(
        self, for_cloud_api=for_cloud_api
    )

  def __str__(self):
    """Returns a user-readable docstring for this function."""
    DOCSTRING_WIDTH = 75
    signature = self.getSignature()
    parts = []
    if 'description' in signature:
      parts.append(
          textwrap.fill(signature['description'], width=DOCSTRING_WIDTH))
    args = signature['args']
    if args:
      parts.append('')
      parts.append('Args:')
      for arg in args:
        name_part = '  ' + arg['name']
        if 'description' in arg:
          name_part += ': '
          arg_header = name_part + arg['description']
        else:
          arg_header = name_part
        arg_doc = textwrap.fill(arg_header,
                                width=DOCSTRING_WIDTH - len(name_part),
                                subsequent_indent=' ' * 6)
        parts.append(arg_doc)
    return '\n'.join(parts)
