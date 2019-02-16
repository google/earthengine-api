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
          filename=func.__code__.co_filename,
          lineno=func.__code__.co_firstlineno + 1)
      return func(*args, **kwargs)
    deprecation_message = '\nDEPRECATED: ' + message
    try:
      Wrapper.__doc__ += deprecation_message
    # If there are non-ASCII characters in the docs, and we're in
    # Python 2, use a hammer to force them into a str.
    except UnicodeDecodeError:
      Wrapper.__doc__ += deprecation_message.encode('utf8')
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
