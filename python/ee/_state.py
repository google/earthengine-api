"""Stores the current state of the EE library."""

import dataclasses
import re
from typing import Any, Optional, Union

# Rename to avoid redefined-outer-name warning.
from google.oauth2 import credentials as credentials_lib
import requests


# The default project to use for Cloud API calls.
DEFAULT_CLOUD_API_USER_PROJECT = 'earthengine-legacy'


# TODO(user): Consider only returning str even for ints.
@dataclasses.dataclass()
class _WorkloadTag:
  """A helper class to manage the workload tag."""

  _tag: Optional[Union[int, str]]
  _default: Optional[Union[int, str]]

  def __init__(self):
    # TODO(user): Consider using None as default and setting them above.
    self._tag = ''
    self._default = ''

  def get(self) -> Union[int, str, None]:
    return self._tag

  def set(self, tag: Optional[Union[int, str]]) -> None:
    self._tag = self.validate(tag)

  def set_default(self, new_default: Optional[Union[int, str]]) -> None:
    self._default = self.validate(new_default)

  def reset(self) -> None:
    self._tag = self._default

  def validate(self, tag: Optional[Union[int, str]]) -> str:
    """Throws an error if setting an invalid tag.

    Args:
      tag: the tag to validate.

    Returns:
      The validated tag.

    Raises:
      ValueError if the tag does not match the expected format.
    """
    if not tag and tag != 0:
      return ''
    tag = str(tag)
    if not re.fullmatch(r'([a-z0-9]|[a-z0-9][-_a-z0-9]{0,61}[a-z0-9])', tag):
      validation_message = (
          'Tags must be 1-63 characters, '
          'beginning and ending with a lowercase alphanumeric character '
          '([a-z0-9]) with dashes (-), underscores (_), '
          'and lowercase alphanumerics between.'
      )
      raise ValueError(f'Invalid tag, "{tag}". {validation_message}')
    return tag


@dataclasses.dataclass()
class EEState:
  """Holds the configuration and initialized resources for an EE session."""

  initialized: bool = False
  credentials: Optional[credentials_lib.Credentials] = None
  api_base_url: Optional[str] = None
  tile_base_url: Optional[str] = None
  cloud_api_base_url: Optional[str] = None
  cloud_api_key: Optional[str] = None
  requests_session: Optional[requests.Session] = None
  cloud_api_resource: Optional[Any] = None
  cloud_api_resource_raw: Optional[Any] = None
  cloud_api_user_project: Optional[str] = DEFAULT_CLOUD_API_USER_PROJECT
  cloud_api_client_version: Optional[str] = None
  http_transport: Optional[Any] = None
  deadline_ms: int = 0
  max_retries: int = 5
  user_agent: Optional[str] = None
  workload_tag: _WorkloadTag = dataclasses.field(default_factory=_WorkloadTag)


_state: Optional[EEState] = None


def get_state() -> EEState:
  """Retrieves the EEState for the current execution context.

  Returns:
    The EEState for the current execution context.
  """
  global _state
  if not _state:
    _state = EEState()
  return _state


def reset_state() -> None:
  """Resets the EEState to the default state."""
  global _state
  _state = None
