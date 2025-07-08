"""Decorators to handle various deprecations."""

from __future__ import annotations

import dataclasses
import datetime
import functools
import inspect
import json
from typing import Any, Callable
import urllib
import warnings

_DEPRECATED_OBJECT = 'earthengine-stac/catalog/catalog_deprecated.json'
_DEPRECATED_ASSETS_URL = f'https://storage.googleapis.com/{_DEPRECATED_OBJECT}'

# Deprecation warnings are per-asset, per-initialization.
deprecated_assets: dict[str, DeprecatedAsset] = dict()


def Deprecated(message: str):
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
          '{}() is deprecated: {}'.format(func.__name__, message),
          category=DeprecationWarning,
          filename=func.__code__.co_filename,
          lineno=func.__code__.co_firstlineno + 1,
      )
      return func(*args, **kwargs)

    deprecation_message = '\nDEPRECATED: ' + message
    Wrapper.__doc__ += deprecation_message
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


@dataclasses.dataclass
class DeprecatedAsset:
  """Class for keeping track of a single deprecated asset."""

  id: str
  replacement_id: str | None
  removal_date: datetime.datetime | None
  learn_more_url: str | None

  has_warning_been_issued: bool = False

  @classmethod
  def _ParseDateString(cls, date_str: str) -> datetime.datetime | None:
    try:
      # We can't use `datetime.datetime.fromisoformat` because it's behavior
      # changes by Python version.
      return datetime.datetime.strptime(date_str, '%Y-%m-%dT%H:%M:%S%z')
    except ValueError:
      return None

  @classmethod
  def FromStacLink(cls, stac_link: dict[str, Any]) -> DeprecatedAsset:
    removal_date = stac_link.get('gee:removal_date')
    if removal_date is not None:
      removal_date = cls._ParseDateString(removal_date)
    title = stac_link.get('title')
    assert isinstance(title, str)
    return DeprecatedAsset(
        id=title,
        replacement_id=stac_link.get('gee:replacement_id'),
        removal_date=removal_date,
        learn_more_url=stac_link.get('gee:learn_more_url'),
    )


def WarnForDeprecatedAsset(arg_name: str) -> Callable[..., Any]:
  """Decorator to warn on usage of deprecated assets.

  Args:
    arg_name: The name of the argument to check for asset deprecation.

  Returns:
    The decorated function which checks for asset deprecation.
  """

  def Decorator(func: Callable[..., Any]):
    @functools.wraps(func)
    def Wrapper(*args, **kwargs) -> Callable[..., Any]:
      argspec = inspect.getfullargspec(func)
      index = argspec.args.index(arg_name)
      if kwargs.get(arg_name):
        asset_name_object = kwargs[arg_name]
      elif index < len(args):
        asset_name_object = args[index]
      else:
        asset_name_object = None
      asset_name = _GetStringFromObject(asset_name_object)
      if asset_name:
        asset = (deprecated_assets or {}).get(asset_name)
        if asset:
          _IssueAssetDeprecationWarning(asset)
      return func(*args, **kwargs)

    return Wrapper

  return Decorator


def InitializeDeprecatedAssets() -> None:
  # Deprecated asset functionality is not critical. A warning is enough if
  # something unexpected happens.
  try:
    _InitializeDeprecatedAssetsInternal()
  except Exception as e:  # pylint: disable=broad-except
    warnings.warn(f'Unable to initialize deprecated assets: {e}')


def _InitializeDeprecatedAssetsInternal() -> None:
  global deprecated_assets
  if deprecated_assets:
    return
  _UnfilterDeprecationWarnings()

  deprecated_assets = {}
  stac = _FetchDataCatalogStac()
  for stac_link in stac.get('links', []):
    if stac_link.get('deprecated', False):
      asset = DeprecatedAsset.FromStacLink(stac_link)
      deprecated_assets[asset.id] = asset


def Reset() -> None:
  global deprecated_assets
  deprecated_assets = dict()


def _FetchDataCatalogStac() -> dict[str, Any]:
  try:
    response = urllib.request.urlopen(_DEPRECATED_ASSETS_URL).read()
  except (urllib.error.HTTPError, urllib.error.URLError):
    return {}
  return json.loads(response)


def _GetStringFromObject(obj: Any) -> str | None:
  if isinstance(obj, str):
    return obj
  return None


def _UnfilterDeprecationWarnings() -> None:
  """Unfilters deprecation warnings for this module."""
  warnings.filterwarnings(
      'default', category=DeprecationWarning, module=__name__
  )


def _IssueAssetDeprecationWarning(asset: DeprecatedAsset) -> None:
  """Issues a warning for a deprecated asset if one hasn't already been issued.

  Args:
    asset: The asset.
  """
  if asset.has_warning_been_issued:
    return
  asset.has_warning_been_issued = True

  warning = (
      f'\n\nAttention required for {asset.id}! You are using a deprecated'
      ' asset.\nTo make sure your code keeps working, please update it'
  )
  removal_date = asset.removal_date
  today = datetime.datetime.now()
  if removal_date:
    # If today is the removal date or prior, show the removal date, ignoring
    # time zones.
    if today.date() <= removal_date.date():
      # %d gives a zero-padded day. Remove the leading zero. %-d is incompatible
      # with Windows.
      formatted_date = removal_date.strftime('%B %d, %Y').replace(' 0', ' ')
      warning += f' by {formatted_date}'
  warning += '.'
  if asset.learn_more_url:
    warning = warning + f'\nLearn more: {asset.learn_more_url}\n'
  warnings.warn(warning, category=DeprecationWarning)
