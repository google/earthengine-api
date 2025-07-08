"""A class for representing built-in EE API Function.

Earth Engine can dynamically produce a JSON array listing the
algorithms available to the user.  Each item in the dictionary identifies
the name and return type of the algorithm, the name and type of its
arguments, whether they're required or optional, default values and docs
for each argument and the algorithms as a whole.

This class manages the algorithm dictionary and creates JavaScript functions
to apply each EE algorithm.
"""

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

from __future__ import annotations

import copy
import keyword
import re
from typing import Any

from ee import _utils
from ee import computedobject
from ee import data
from ee import deprecation
from ee import ee_exception
from ee import ee_types
from ee import function


class ApiFunction(function.Function):
  """An object representing an EE API Function."""
  _signature: dict[str, Any]

  # A dictionary of functions defined by the API server.
  _api: dict[str, ApiFunction] = {}

  # A set of algorithm names containing all algorithms that have been bound to
  # a function so far using importApi().
  _bound_signatures: set[str] = set()

  @_utils.accept_opt_prefix('opt_signature')
  def __init__(self, name: str, signature: dict[str, Any] | None = None):
    """Creates a function defined by the EE API.

    Args:
      name: The name of the function.
      signature: The signature of the function. If unspecified, looked up
        dynamically.
    """
    if signature is None:
      signature = ApiFunction.lookup(name).getSignature()

    # The signature of this API function.
    self._signature = copy.deepcopy(signature)
    self._signature['name'] = name

  def __eq__(self, other: Any) -> bool:
    return (isinstance(other, ApiFunction) and
            self.getSignature() == other.getSignature())

  # For Python 3, __hash__ is needed because __eq__ is defined.
  # See https://docs.python.org/3/reference/datamodel.html#object.__hash__
  def __hash__(self) -> int:
    return hash(computedobject.ComputedObject.freeze(self.getSignature()))

  def __ne__(self, other: Any) -> bool:
    return not self.__eq__(other)

  @classmethod
  def call_(cls, name: str, *args: Any, **kwargs: Any) -> Any:
    """Call a named API function with positional and keyword arguments.

    Args:
      name: The name of the API function to call.
      *args: Positional arguments to pass to the function.
      **kwargs: Keyword arguments to pass to the function.

    Returns:
      An object representing the called function. If the signature specifies
      a recognized return type, the returned value will be cast to that type.
    """
    return cls.lookup(name).call(*args, **kwargs)

  @classmethod
  def apply_(cls, name: str, named_args: dict[str, Any]) -> Any:
    """Call a named API function with a dictionary of named arguments.

    Args:
      name: The name of the API function to call.
      named_args: A dictionary of arguments to the function.

    Returns:
      An object representing the called function. If the signature specifies
      a recognized return type, the returned value will be cast to that type.
    """
    return cls.lookup(name).apply(named_args)

  def encode_invocation(self, encoder: Any) -> Any:
    del encoder  # Unused.
    return self._signature['name']

  def encode_cloud_invocation(self, encoder: Any) -> dict[str, Any]:
    del encoder  # Unused.
    return {'functionName': self._signature['name']}

  def getSignature(self) -> dict[str, Any]:
    """Returns a description of the interface provided by this function."""
    return self._signature

  @classmethod
  def allSignatures(cls) -> dict[str, dict[str, Any]]:
    """Returns a map from the name to signature for all API functions."""
    cls.initialize()
    return {name: func.getSignature() for name, func in cls._api.items()}

  @classmethod
  def unboundFunctions(cls) -> dict[str, Any]:
    """Returns the functions that have not been bound using importApi() yet."""
    cls.initialize()
    return {
        name: func
        for name, func in cls._api.items()
        if name not in cls._bound_signatures
    }

  # TODO(user): Any -> ApiFunction for the return type.
  @classmethod
  def lookup(cls, name: str) -> Any:
    """Looks up an API function by name.

    Args:
      name: The name of the function to get.

    Returns:
      The requested ApiFunction.
    """
    result = cls.lookupInternal(name)
    # TODO(user): name -> result?
    if not name:
      raise ee_exception.EEException(
          'Unknown built-in function name: %s' % name)
    return result

  @classmethod
  def lookupInternal(cls, name: str) -> ApiFunction | None:
    """Looks up an API function by name.

    Args:
      name: The name of the function to get.

    Returns:
      The requested ApiFunction or None if not found.
    """
    cls.initialize()
    return cls._api.get(name, None)

  @classmethod
  def initialize(cls) -> None:
    """Initializes the list of signatures from the Earth Engine front-end."""
    if not cls._api:
      signatures = data.getAlgorithms()
      api = {}
      for name, sig in signatures.items():
        # Strip type parameters.
        sig['returns'] = re.sub('<.*>', '', sig['returns'])
        for arg in sig['args']:
          arg['type'] = re.sub('<.*>', '', arg['type'])
        api[name] = cls(name, sig)
      cls._api = api

  @classmethod
  def reset(cls) -> None:
    """Clears the API functions list so it will be reloaded from the server."""
    cls._api = {}
    cls._bound_signatures = set()

  @classmethod
  @_utils.accept_opt_prefix('opt_prepend')
  def importApi(
      cls,
      target: Any,
      prefix: str,
      type_name: str,
      prepend: str | None = None,
  ) -> None:
    """Adds all API functions that begin with a given prefix to a target class.

    Args:
      target: The class to add to.
      prefix: The prefix to search for in the signatures.
      type_name: The name of the object's type. Functions whose first argument
        matches this type are bound as instance methods, and those whose first
        argument doesn't match are bound as static methods.
      prepend: An optional string to prepend to the names of the added
        functions.
    """
    cls.initialize()
    prepend = prepend or ''
    for name, api_func in cls._api.items():
      parts = name.split('.')
      if len(parts) == 2 and parts[0] == prefix:
        fname = prepend + parts[1]
        signature = api_func.getSignature()

        cls._bound_signatures.add(name)

        # Specifically handle the function names that are illegal in python.
        if keyword.iskeyword(fname):
          fname = fname.title()

        # Don't overwrite existing versions of this function.
        if (hasattr(target, fname) and
            not hasattr(getattr(target, fname), 'signature')):
          continue

        # Create a new function so we can attach properties to it.
        def MakeBoundFunction(func):
          # We need the lambda to capture "func" from the enclosing scope.
          # pylint: disable-next=unnecessary-lambda
          return lambda *args, **kwargs: func.call(*args, **kwargs)
        bound_function = MakeBoundFunction(api_func)

        # Add docs.
        setattr(bound_function, '__name__', str(name))
        bound_function.__doc__ = str(api_func)

        # Attach the signature object for documentation generators.
        bound_function.signature = signature

        # Mark as deprecated if needed.
        if signature.get('deprecated'):
          deprecated_decorator = deprecation.Deprecated(signature['deprecated'])
          bound_function = deprecated_decorator(bound_function)

        # Mark as preview if needed.
        if signature.get('preview'):
          bound_function.__doc__ += (
              '\nPREVIEW: This function is preview or internal only.')

        # Decide whether this is a static or an instance function.
        is_instance = (signature['args'] and
                       ee_types.isSubtype(signature['args'][0]['type'],
                                          type_name))
        if not is_instance:
          bound_function = staticmethod(bound_function)

        # Attach the function as a method.
        setattr(target, fname, bound_function)

  @staticmethod
  def clearApi(target: type[Any]) -> None:
    """Removes all methods added by importApi() from a target class.

    Args:
      target: The class to remove from.
    """
    for attr_name in dir(target):
      attr_value = getattr(target, attr_name)
      if callable(attr_value) and hasattr(attr_value, 'signature'):
        delattr(target, attr_name)
