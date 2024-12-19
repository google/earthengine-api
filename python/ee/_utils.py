"""General decorators and helper methods which should not import ee."""

import functools
import os
from typing import Any, Callable


# Optional imports used for specific shells.
# pylint: disable=g-import-not-at-top
try:
  import IPython
except ImportError:
  pass


def accept_opt_prefix(*opt_args) -> Callable[..., Any]:
  """Decorator to maintain support for "opt_" prefixed kwargs.

  Args:
    *opt_args: Arguments prefixed with "opt_" to be replaced by the stripped
      version. Use a nested tuple to map an old "opt_" arg to a new one, e.g.,
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


def in_colab_shell() -> bool:
  """Tests if the code is being executed within Google Colab."""
  try:
    import google.colab  # pylint: disable=unused-import,redefined-outer-name

    return True
  except ImportError:
    return False


def in_jupyter_shell() -> bool:
  """Tests if the code is being executed within Jupyter."""
  try:
    import ipykernel.zmqshell

    return isinstance(
        IPython.get_ipython(), ipykernel.zmqshell.ZMQInteractiveShell
    )
  except ImportError:
    return False
  except NameError:
    return False


def get_environment_variable(key: str) -> Any:
  """Retrieves a Colab secret or environment variable for the given key.

  Colab secrets have precedence over environment variables.

  Args:
      key (str): The key that's used to fetch the environment variable.

  Returns:
      Optional[str]: The retrieved key, or None if no environment variable was
      found.
  """
  if in_colab_shell():
    from google.colab import userdata  # pylint: disable=g-import-not-at-top

    try:
      return userdata.get(key)
    except (
        userdata.SecretNotFoundError,
        userdata.NotebookAccessError,
        AttributeError,
    ):
      pass

  return os.environ.get(key)
