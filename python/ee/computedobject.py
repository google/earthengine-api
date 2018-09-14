#!/usr/bin/env python
"""A representation of an Earth Engine computed object."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

# pylint: disable=g-bad-import-order
import six

from . import data
from . import ee_exception
from . import encodable
from . import serializer


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


class ComputedObject(six.with_metaclass(
    ComputedObjectMetaclass, encodable.Encodable)):
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

  def __init__(self, func, args, opt_varName=None):
    """Creates a computed object.

    Args:
      func: The ee.Function called to compute this object, either as an
          Algorithm name or an ee.Function object.
      args: A dictionary of arguments to pass to the specified function.
          Note that the caller is responsible for promoting the arguments
          to the correct types.
      opt_varName: A variable name. If not None, the object will be encoded
          as a reference to a CustomFunction variable of this name, and both
          'func' and 'args' must be None. If all arguments are None, the
          object is considered an unnamed variable, and a name will be
          generated when it is included in an ee.CustomFunction.
    """
    if opt_varName and (func or args):
      raise ee_exception.EEException(
          'When "opt_varName" is specified, "func" and "args" must be null.')
    self.func = func
    self.args = args
    self.varName = opt_varName

  def __eq__(self, other):
    # pylint: disable=unidiomatic-typecheck
    return (type(self) == type(other) and
            self.__dict__ == other.__dict__)

  def __ne__(self, other):
    return not self.__eq__(other)

  def __hash__(self):
    return hash(ComputedObject.freeze(self.__dict__))

  def getInfo(self):
    """Fetch and return information about this object.

    Returns:
      The object can evaluate to anything.
    """
    return data.computeValue(self)

  def encode(self, encoder):
    """Encodes the object in a format compatible with Serializer."""
    if self.isVariable():
      return {
          'type': 'ArgumentRef',
          'value': self.varName
      }
    else:
      # Encode the function that we're calling.
      func = encoder(self.func)
      # Built-in functions are encoded as strings under a different key.
      key = 'functionName' if isinstance(func, six.string_types) else 'function'

      # Encode all arguments recursively.
      encoded_args = {}
      for name, value in self.args.items():
        if value is not None:
          encoded_args[name] = encoder(value)

      return {
          'type': 'Invocation',
          'arguments': encoded_args,
          key: func
      }


  def serialize(
      self,
      opt_pretty=False
  ):
    """Serialize this object into a JSON string.

    Args:
      opt_pretty: A flag indicating whether to pretty-print the JSON.

    Returns:
      The serialized representation of this object.
    """
    return serializer.toJSON(
        self,
        opt_pretty
    )

  def __str__(self):
    """Writes out the object in a human-readable form."""
    return 'ee.%s(%s)' % (self.name(), serializer.toReadableJSON(self))

  def isVariable(self):
    """Returns whether this computed object is a variable reference."""
    # We can't just check for varName != null, since we allow that
    # to remain null until for CustomFunction.resolveNamelessArgs_().
    return self.func is None and self.args is None

  def aside(self, func, *var_args):
    """Calls a function passing this object as the first argument.

    Returns the object itself for chaining. Convenient e.g. when debugging:

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
  def name(cls):
    """Returns the name of the object, used in __str__()."""
    return 'ComputedObject'

  @classmethod
  def _cast(cls, obj):
    """Cast a ComputedObject to a new instance of the same class as this.

    Args:
      obj: The object to cast.

    Returns:
      The cast object, and instance of the class on which this method is called.
    """
    if isinstance(obj, cls):
      return obj
    else:
      result = cls.__new__(cls)
      result.func = obj.func
      result.args = obj.args
      result.varName = obj.varName
      return result

  @staticmethod
  def freeze(obj):
    """Freeze a list or dict so it can be hashed."""
    if isinstance(obj, dict):
      return frozenset(
          (key, ComputedObject.freeze(val)) for key, val in obj.items())
    elif isinstance(obj, list):
      return tuple(map(ComputedObject.freeze, obj))
    else:
      return obj
