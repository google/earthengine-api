#!/usr/bin/env python
"""Decorators to mark function deprecated."""



import functools
import warnings


def Deprecated(message):
  """Returns a decorator with a given warning message."""

  def Decorator(func):
    """Emits a deprecation warning when the decorated function is called.

    Also adds the deprecation message to the function's docstring.

    Args:
      func: The function to deprecate.

    Returns:
      func: The wrapped function.
    """

    @functools.wraps(func)
    def Wrapper(*args, **kwargs):
      warnings.warn_explicit(
          '%s() is deprecated: %s' % (func.__name__, message),
          category=DeprecationWarning,
          filename=func.func_code.co_filename,
          lineno=func.func_code.co_firstlineno + 1)
      return func(*args, **kwargs)
    Wrapper.__doc__ += '\nDEPRECATED: ' + message
    return Wrapper
  return Decorator


def CanUseDeprecated(func):
  """Ignores deprecation warnings emitted while the decorated function runs."""

  @functools.wraps(func)
  def Wrapper(*args, **kwargs):
    with warnings.catch_warnings():
      warnings.filterwarnings('ignore', category=DeprecationWarning)
      return func(*args, **kwargs)
  return Wrapper
