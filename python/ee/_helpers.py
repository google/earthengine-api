"""Convenience functions and code used by ee/__init__.py.

These functions are in general re-exported from the "ee" module and should be
referenced from there (e.g. "ee.profilePrinting").
"""

# Using lowercase function naming to match the JavaScript names.
# pylint: disable=g-bad-name

import contextlib
import json
import sys
from typing import Any, Dict, Iterator, Optional, TextIO, Union

from google.auth import crypt
from google.oauth2 import service_account

from ee import apifunction
from ee import computedobject
from ee import data
from ee import oauth


def ServiceAccountCredentials(
    email: str, key_file: Optional[str] = None, key_data: Optional[str] = None
) -> service_account.Credentials:
  """Configure OAuth2 credentials for a Google Service Account.

  Args:
    email: The email address of the account for which to configure credentials.
        Ignored if key_file or key_data represents a JSON service account key.
    key_file: The path to a file containing the private key associated with
        the service account. Both JSON and PEM files are supported.
    key_data: Raw key data to use, if key_file is not specified.

  Returns:
    An OAuth2 credentials object.
  """

  # Assume anything that doesn't end in '.pem' is a JSON key.
  if key_file and not key_file.endswith('.pem'):
    return service_account.Credentials.from_service_account_file(
        key_file, scopes=oauth.SCOPES)

  # If 'key_data' can be decoded as JSON, it's probably a raw JSON key.
  if key_data:
    try:
      key_data = json.loads(key_data)
      return service_account.Credentials.from_service_account_info(
          key_data, scopes=oauth.SCOPES)
    except ValueError:
      # It may actually be a raw PEM string, we'll try that below.
      pass

  # Probably a PEM key - just read the file into 'key_data'.
  if key_file:
    with open(key_file, 'r') as file_:
      key_data = file_.read()

  # Raw PEM key.
  signer = crypt.RSASigner.from_string(key_data)
  return service_account.Credentials(
      signer, email, oauth.TOKEN_URI, scopes=oauth.SCOPES)


def call(
    func: Union[str, apifunction.ApiFunction], *args, **kwargs
) -> computedobject.ComputedObject:
  """Invoke the given algorithm with the specified args.

  Args:
    func: The function to call. Either an ee.Function object or the name of
        an API function.
    *args: The positional arguments to pass to the function.
    **kwargs: The named arguments to pass to the function.

  Returns:
    A ComputedObject representing the called function. If the signature
    specifies a recognized return type, the returned value will be cast
    to that type.
  """
  if isinstance(func, str):
    func = apifunction.ApiFunction.lookup(func)
  return func.call(*args, **kwargs)


# pylint: disable-next=redefined-builtin
def apply(
    func: Union[str, apifunction.ApiFunction], named_args: Dict[str, Any]
) -> computedobject.ComputedObject:
  """Call a function with a dictionary of named arguments.

  Args:
    func: The function to call. Either an ee.Function object or the name of
        an API function.
    named_args: A dictionary of arguments to the function.

  Returns:
    A ComputedObject representing the called function. If the signature
    specifies a recognized return type, the returned value will be cast
    to that type.
  """
  if isinstance(func, str):
    func = apifunction.ApiFunction.lookup(func)
  return func.apply(named_args)


@contextlib.contextmanager
def profilePrinting(destination: TextIO = sys.stderr) -> Iterator[None]:
  # pylint: disable=g-doc-return-or-yield
  """Returns a context manager that prints a profile of enclosed API calls.

  The profile will be printed when the context ends, whether or not any error
  occurred within the context.

  # Simple example:
  with ee.profilePrinting():
     print ee.Number(1).add(1).getInfo()

  Args:
    destination: A file-like object to which the profile text is written.
        Defaults to sys.stderr.

  """
  # Profile.getProfiles is `hidden`, so call it explicitly.
  getProfiles = apifunction.ApiFunction.lookup('Profile.getProfiles')

  profile_ids = []
  try:
    with data.profiling(profile_ids.append):
      yield
  finally:
    profile_text = getProfiles.call(ids=profile_ids).getInfo()
    destination.write(profile_text)
