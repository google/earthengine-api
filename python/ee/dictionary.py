#!/usr/bin/env python
"""A wrapper for dictionaries."""



import apifunction
import computedobject

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name


class Dictionary(computedobject.ComputedObject):
  """An object to represent dictionaries."""

  _initialized = False

  def __init__(self, arg=None):
    """Construct a dictionary.

    Args:
      arg: This constructor accepts the following args:
        1) Another dictionary.
        2) A list of key/value pairs.
        3) A null or no argument (producing an empty dictionary)
    """
    self.initialize()

    if isinstance(arg, dict):
      super(Dictionary, self).__init__(None, None)
      self._dictionary = arg
    else:
      self._dictionary = None
      if (isinstance(arg, computedobject.ComputedObject)
          and arg.func
          and arg.func.getSignature()['returns'] == 'Dictionary'):
        # If it's a call that's already returning a Dictionary, just cast.
        super(Dictionary, self).__init__(arg.func, arg.args, arg.varName)
      else:
        # Delegate everything else to the server-side constuctor.
        super(Dictionary, self).__init__(
            apifunction.ApiFunction('Dictionary'), {'input': arg})

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
