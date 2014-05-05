"""A wrapper for dictionaries."""



import apifunction
import computedobject
import ee_exception

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name


class Dictionary(computedobject.ComputedObject):
  """An object to represent dictionaries."""

  _initialized = False

  def __init__(self, arg):
    """Construct a dictionary wrapper.

    This constuctor accepts the following args:
      1) A bare dictionary.
      2) A ComputedObject returning a dictionary.

    Args:
      arg: The dictionary to wrap.
    """
    self.initialize()

    if isinstance(arg, dict):
      super(Dictionary, self).__init__(None, None)
      self._dictionary = arg
    elif isinstance(arg, computedobject.ComputedObject):
      super(Dictionary, self).__init__(arg.func, arg.args, arg.varName)
      self._dictionary = None
    else:
      raise ee_exception.EEException(
          'Invalid argument specified for ee.Dictionary(): %s' % arg)

  @classmethod
  def initialize(cls):
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, 'Dictionary', 'Dictionary')
      cls._initialized = True

  @classmethod
  def reset(cls):
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  @staticmethod
  def name():
    return 'Dictionary'

  def encode(self, opt_encoder=None):
    if self._dictionary is not None:
      return opt_encoder(self._dictionary)
    else:
      return super(Dictionary, self).encode(opt_encoder)
