"""A representation of an Earth Engine computed object."""



# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import data
import encodable
import serializer


class ComputedObject(encodable.Encodable):
  """A representation of an Earth Engine computed object.

  This is a base class for most API objects.

  The class itself is not abstract as it is used to wrap the return values of
  algorithms that produce unrecognized types with the minimal functionality
  necessary to interact well with the rest of the API.
  """

  class __metaclass__(type):
    """A meta-class that makes type coercion idempotent.

    If an instance of a ComputedObject subclass is instantiated by passing
    another instance of that class as the sole argument, this short-circuits
    and returns that argument.

    This is necessary for CustomFunction variables to pretend to be instances
    of any type.
    """

    def __call__(cls, *args, **kwargs):
      """Creates a computed object, catching self-casts."""
      if len(args) == 1 and not kwargs and isinstance(args[0], cls):
        # Self-casting returns the argument unchanged.
        return args[0]
      else:
        return type.__call__(cls, *args, **kwargs)

  def __init__(self, func, args):
    """Creates a computed object.

    Args:
      func: The ee.Function called to compute this object, either as an
          Algorithm name or an ee.Function object.
      args: A dictionary of arguments to pass to the specified function.
          Note that the caller is responsible for promoting the arguments
          to the correct types.
    """
    self.func = func
    self.args = args

  def __eq__(self, other):
    return (type(self) == type(other) and
            self.func == other.func and
            self.args == other.args)

  def __ne__(self, other):
    return not self.__eq__(other)

  def getInfo(self):
    """Fetch and return information about this object.

    Returns:
      The object can evaluate to anything.
    """
    return data.getValue({'json': self.serialize()})

  def encode(self, encoder):
    """Encodes the object in a format compatible with Serializer."""

    # Encode the function that we're calling.
    func = encoder(self.func)
    # Built-in functions are encoded as strings under a different key.
    key = 'functionName' if isinstance(func, basestring) else 'function'

    # Encode all arguments recursively.
    encoded_args = {}
    for name, value in self.args.iteritems():
      if value is not None:
        encoded_args[name] = encoder(value)

    return {
        'type': 'Invocation',
        'arguments': encoded_args,
        key: func
    }

  def serialize(self, opt_pretty=False):
    """Serialize this object into a JSON string.

    Args:
      opt_pretty: A flag indicating whether to pretty-print the JSON.

    Returns:
      The serialized representation of this object.
    """
    return serializer.toJSON(self, opt_pretty)

  def __str__(self):
    """Writes out the object in a human-readable form."""
    return 'ee.%s(%s)' % (self.name(), serializer.toReadableJSON(self))

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
      # Hack: check if this is a variable class.
      if cls.__name__ == 'Variable':
        cls = cls.__bases__[0]

      # Assumes all subclass constructors can be called with a
      # ComputedObject as their first parameter.
      return cls(obj)
