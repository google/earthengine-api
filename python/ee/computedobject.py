"""A representation of an Earth Engine computed object."""

from __future__ import annotations

from typing import Any, Callable, Optional

from ee import _utils
from ee import data
from ee import ee_exception
from ee import encodable
from ee import serializer


class ComputedObjectMetaclass(type):
  """A meta-class that makes type coercion idempotent.

  If an instance of a ComputedObject subclass is instantiated by passing
  another instance of that class as the sole argument, this short-circuits
  and returns that argument.
  """

  def __call__(cls, *args, **kwargs):
    """Creates a computed object, catching self-casts."""
    if len(args) == 1 and not kwargs and isinstance(args[0], cls):
      # Self-casting returns the argument unchanged.
      return args[0]
    else:
      return type.__call__(cls, *args, **kwargs)


class ComputedObject(encodable.Encodable, metaclass=ComputedObjectMetaclass):
  """A representation of an Earth Engine computed object.

  This is a base class for most API objects.

  The class itself is not abstract as it is used to wrap the return values of
  algorithms that produce unrecognized types with the minimal functionality
  necessary to interact well with the rest of the API.

  ComputedObjects come in two flavors:
  1. If func != null and args != null, the ComputedObject is encoded as an
     invocation of func with args.
  2. If func == null and args == null, the ComputedObject is a variable
     reference. The variable name is stored in its varName member. Note that
     in this case, varName may still be null; this allows the name to be
     deterministically generated at a later time. This is used to generate
     deterministic variable names for mapped functions, ensuring that nested
     mapping calls do not use the same variable name.
  """
  func: Optional[Any]
  args: Optional[dict[str, Any]]
  varName: Optional[str]  # pylint: disable=g-bad-name

  # Tell pytype not to worry about dynamic attributes.
  _HAS_DYNAMIC_ATTRIBUTES: bool = True

  # False until the client has initialized the dynamic attributes.
  _initialized: bool

  @_utils.accept_opt_prefix('opt_varName')
  def __init__(
      self,
      func: Optional[Any],
      args: Optional[dict[str, Any]],
      varName: Optional[str] = None,  # pylint: disable=g-bad-name
  ):
    """Creates a computed object.

    Args:
      func: The ee.Function called to compute this object, either as an
        Algorithm name or an ee.Function object.
      args: A dictionary of arguments to pass to the specified function. Note
        that the caller is responsible for promoting the arguments to the
        correct types.
      varName: A variable name. If not None, the object will be encoded as a
        reference to a CustomFunction variable of this name, and both 'func' and
        'args' must be None. If all arguments are None, the object is considered
        an unnamed variable, and a name will be generated when it is included in
        an ee.CustomFunction.
    """
    if varName and (func or args):
      raise ee_exception.EEException(
          'When "varName" is specified, "func" and "args" must be null.'
      )
    self.func = func
    self.args = args
    self.varName = varName  # pylint: disable=g-bad-name

  def __eq__(self, other: Any) -> bool:
    # pylint: disable=unidiomatic-typecheck
    return (type(self) == type(other) and
            self.__dict__ == other.__dict__)

  def __ne__(self, other: Any) -> bool:
    return not self.__eq__(other)

  def __hash__(self) -> int:
    return hash(ComputedObject.freeze(self.__dict__))

  # pylint: disable-next=useless-parent-delegation
  def getInfo(self) -> Optional[Any]:
    """Fetch and return information about this object.

    Returns:
      The object can evaluate to anything.
    """
    return data.computeValue(self)

  def encode(self, encoder: Optional[Callable[..., Any]]) -> dict[str, Any]:
    """Encodes the object in a format compatible with Serializer."""
    if self.isVariable():
      return {
          'type': 'ArgumentRef',
          'value': self.varName
      }
    else:
      if encoder is None:
        raise ValueError(
            'encoder can only be none when encode is for a variable.')
      # Encode the function that we're calling.
      func = encoder(self.func)
      # Built-in functions are encoded as strings under a different key.
      key = 'functionName' if isinstance(func, str) else 'function'

      # Encode all arguments recursively.
      encoded_args = {}
      assert self.args is not None  # For pytype
      for name, value in self.args.items():
        if value is not None:
          encoded_args[name] = encoder(value)

      return {
          'type': 'Invocation',
          'arguments': encoded_args,
          key: func
      }

  def encode_cloud_value(self, encoder: Any) -> dict[str, Any]:
    if self.isVariable():
      ref = self.varName
      if ref is None and isinstance(
          getattr(encoder, '__self__'), serializer.Serializer):
        ref = encoder.__self__.unbound_name
      if ref is None:
        # We are trying to call getInfo() or make some other server call inside
        # a function passed to collection.map() or .iterate(), and the call uses
        # one of the function arguments. The argument will be unbound outside of
        # the map operation and cannot be evaluated. See the Count Functions
        # case in customfunction.py for details on the unbound_name mechanism.
        raise ee_exception.EEException(
            "A mapped function's arguments cannot be used in "
            'client-side operations'
        )
      return {'argumentReference': ref}
    else:
      if isinstance(self.func, str):
        invocation = {'functionName': self.func}
      else:
        assert self.func is not None
        invocation = self.func.encode_cloud_invocation(encoder)

      # Encode all arguments recursively.
      encoded_args: dict[str, Any] = {}
      for name in sorted(self.args):
        value = self.args[name]
        if value is not None:
          encoded_args[name] = {'valueReference': encoder(value)}
      invocation['arguments'] = encoded_args
      return {'functionInvocationValue': invocation}

  @_utils.accept_opt_prefix('opt_pretty')
  def serialize(self, pretty: bool = False, for_cloud_api: bool = True) -> str:
    """Serialize this object into a JSON string.

    Args:
      pretty: A flag indicating whether to pretty-print the JSON.
      for_cloud_api: Whether the encoding should be done for the Cloud API or
        the legacy API.

    Returns:
      The serialized representation of this object.
    """
    return serializer.toJSON(self, pretty, for_cloud_api=for_cloud_api)

  def __str__(self) -> str:
    """Writes out the object in a human-readable form."""
    return 'ee.%s(%s)' % (self.name(), serializer.toReadableJSON(self))

  def isVariable(self) -> bool:
    """Returns whether this computed object is a variable reference."""
    # We can't just check for varName != null, since we allow that
    # to remain null until for CustomFunction.resolveNamelessArgs_().
    return self.func is None and self.args is None

  def aside(self, func: Any, *var_args) -> ComputedObject:
    """Calls a function passing this object as the first argument.

    Returns the object itself for chaining. Convenient when debugging. For
    example:

    c = (ee.ImageCollection('foo').aside(logging.info)
             .filterDate('2001-01-01', '2002-01-01').aside(logging.info)
             .filterBounds(geom).aside(logging.info)
             .aside(addToMap, {'min': 0, 'max': 142})
             .select('a', 'b'))

    Args:
      func: The function to call.
      *var_args: Any extra arguments to pass to the function.

    Returns:
      The same object, for chaining.
    """
    func(self, *var_args)
    return self

  @classmethod
  def name(cls) -> str:
    """Returns the name of the object, used in __str__()."""
    return 'ComputedObject'

  @classmethod
  def _cast(cls, obj: ComputedObject) -> ComputedObject:
    """Cast a ComputedObject to a new instance of the same class as this.

    Args:
      obj: The object to cast.

    Returns:
      The cast object, and instance of the class on which this method is called.
    """
    if isinstance(obj, cls):
      return obj
    else:
      result = cls.__new__(cls)  # pylint: disable=no-value-for-parameter
      result.func = obj.func
      result.args = obj.args
      result.varName = obj.varName
      return result

  @staticmethod
  def freeze(obj: Any) -> Any:
    """Freeze a list or dict so it can be hashed."""
    if isinstance(obj, dict):
      return frozenset(
          (key, ComputedObject.freeze(val)) for key, val in obj.items())
    elif isinstance(obj, list):
      return tuple(map(ComputedObject.freeze, obj))
    else:
      return obj

  def is_func_returning_same(self, an_object: Any) -> bool:
    if not isinstance(an_object, ComputedObject):
      return False
    if not an_object.func:
      return False
    return an_object.func.getReturnType() == self.name()
