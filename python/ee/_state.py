"""Stores the current state of the EE library."""

from __future__ import annotations

import dataclasses
import re
from typing import Any

# Rename to avoid redefined-outer-name warning.
from google.oauth2 import credentials as credentials_lib
import requests


# The default project to use for Cloud API calls.
DEFAULT_CLOUD_API_USER_PROJECT = 'earthengine-legacy'


@dataclasses.dataclass()
class _WorkloadTag:
  """A helper class to manage the workload tag."""

  _tag: str
  _default: str

  def __init__(self):
    self._tag = ''
    self._default = ''

  def get(self) -> str:
    return self._tag

  def set(self, tag: int | str | None) -> None:
    self._tag = self.validate(tag)

  def set_default(self, new_default: int | str | None) -> None:
    self._default = self.validate(new_default)

  def reset(self) -> None:
    self._tag = self._default

  def validate(self, tag: int | str | None) -> str:
    """Returns the validated tag or raises a ValueError.

    Args:
      tag: the tag to validate.

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
  credentials: credentials_lib.Credentials | None = None
  api_base_url: str | None = None
  tile_base_url: str | None = None
  cloud_api_base_url: str | None = None
  cloud_api_key: str | None = None
  requests_session: requests.Session | None = None
  cloud_api_resource: Any | None = None
  cloud_api_resource_raw: Any | None = None
  cloud_api_user_project: str | None = DEFAULT_CLOUD_API_USER_PROJECT
  cloud_api_client_version: str | None = None
  http_transport: Any | None = None
  deadline_ms: int = 0
  max_retries: int = 5
  user_agent: str | None = None
  workload_tag: _WorkloadTag = dataclasses.field(default_factory=_WorkloadTag)


_state: EEState | None = None


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
