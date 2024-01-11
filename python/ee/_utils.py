"""General decorators and helper methods which should not import ee."""

import functools
from typing import Any, Callable


def accept_opt_prefix(*opt_args) -> Callable[..., Any]:
  """Decorator to maintain support for "opt_" prefixed kwargs.

  Args:
    *opt_args: Arguments prefixed with "opt_" to be replaced by the stripped
      version. Use a nested tuple to map an old "opt_" arg to a new one, e.g.
      `opt_my_arg, (opt_my_arg2, opt_new_name)`.

  Returns:
    The decorated function which accepts the "opt_" versions of the args.
  """
  args_map = dict()
  for arg in opt_args:
    if isinstance(arg, str):
      args_map[arg] = arg.replace('opt_', '', 1)
    elif isinstance(arg, tuple):
      opt_arg, new_arg = arg
      args_map[opt_arg] = new_arg

  def opt_fixed(func: Callable[..., Any]):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
      # Cache the kwarg keys, since kwargs will be modified.
      for key in list(kwargs):
        if key in args_map:
          new_key = args_map.get(key)
          # Remove the old key unconditionally.
          old_key_val = kwargs.pop(key)
          # Ensure that existing keys are not overridden.
          if new_key not in kwargs:
            kwargs[new_key] = old_key_val
      return func(*args, **kwargs)

    return wrapper

  return opt_fixed
