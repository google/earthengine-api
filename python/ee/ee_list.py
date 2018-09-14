#!/usr/bin/env python
"""A wrapper for lists."""



from . import apifunction
from . import computedobject
from . import ee_exception

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name


class List(computedobject.ComputedObject):
  """An object to represent lists."""

  _initialized = False

  def __init__(self, arg):
    """Construct a list wrapper.

    This constructor accepts the following args:
      1) A bare list.
      2) A ComputedObject returning a list.

    Args:
      arg: The list to wrap.

    Raises:
      ee_exception.EEException: On bad input.
    """
    self.initialize()

    if isinstance(arg, (list, tuple)):
      super(List, self).__init__(None, None)
      self._list = arg
    elif isinstance(arg, computedobject.ComputedObject):
      super(List, self).__init__(arg.func, arg.args, arg.varName)
      self._list = None
    else:
      raise ee_exception.EEException(
          'Invalid argument specified for ee.List(): %s' % arg)

  @classmethod
  def initialize(cls):
    """Imports API functions to this class."""
    if not cls._initialized:
      apifunction.ApiFunction.importApi(cls, 'List', 'List')
      cls._initialized = True

  @classmethod
  def reset(cls):
    """Removes imported API functions from this class."""
    apifunction.ApiFunction.clearApi(cls)
    cls._initialized = False

  @staticmethod
  def name():
    return 'List'

  def encode(self, opt_encoder=None):
    if isinstance(self._list, (list, tuple)):
      return [opt_encoder(elem) for elem in self._list]
    else:
      return super(List, self).encode(opt_encoder)

