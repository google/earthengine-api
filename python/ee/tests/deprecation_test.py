#!/usr/bin/env python3
"""Tests for the ee.deprecation module."""

import contextlib
from typing import Any, Dict
import warnings
import unittest

from absl.testing import parameterized

import unittest
from ee import apitestcase
from ee import deprecation
from ee import ee_string
from ee import image
from ee import imagecollection


_STAC_JSON = {
    'stac_version': '1.0.0',
    'type': 'Catalog',
    'id': 'GEE_catalog',
    'title': 'Google Earth Engine Catalog (Flat Version)',
    'description': 'A description.',
    'links': [
        {
            'href': 'https://example.test/catalog/catalog.json',
            'rel': 'root',
            'type': 'application/json',
        },
        {
            'href': 'https://example.test/catalog/catalog.json',
            'rel': 'self',
            'type': 'application/json',
        },
        {
            'href': 'https://example.test/date_and_learn_more.json',
            'title': 'date_and_learn_more',
            'deprecated': True,
            'gee:replacement_id': 'replacement_id',
            'gee:removal_date': '2024-07-01T00:00:00Z',
            'gee:learn_more_url': 'learn_more_url',
        },
        {
            'href': 'https://example.test/date_only.json',
            'title': 'date_only',
            'deprecated': True,
            'gee:replacement_id': 'replacement_id',
            'gee:removal_date': '2024-07-01T00:00:00Z',
        },
        {
            'href': 'https://example.test/learn_more_url_only.json',
            'title': 'learn_more_url_only',
            'deprecated': True,
            'gee:replacement_id': 'replacement_id',
            'gee:learn_more_url': 'learn_more_url',
        },
        {
            'href': 'https://example.test/deprecated_asset.json',
            'title': 'deprecated_asset',
            'deprecated': True,
            'gee:replacement_id': 'replacement_id',
        },
        {
            'href': 'https://example.test/non_deprecated_asset.json',
            'title': 'non_deprecated_asset',
        },
    ],
}


_EXPECTED_WARNINGS = {
    'deprecated_asset': (
        r'Attention required for deprecated_asset! You are using a deprecated'
        r' asset.\nTo ensure continued functionality, please update it.'
    ),
    'date_and_learn_more': (
        r'Attention required for date_and_learn_more! You are using a'
        r' deprecated asset.\nTo ensure continued functionality, please update'
        r' it by July 1, 2024.\nLearn more: learn_more_url'
    ),
    'date_only': (
        r'Attention required for date_only! You are using a deprecated asset.\n'
        r'To ensure continued functionality, please update it by July 1, 2024.'
    ),
    'learn_more_url_only': (
        r'Attention required for learn_more_url_only! You are using a'
        r' deprecated asset.\nTo ensure continued functionality, please update'
        r' it.\nLearn more: learn_more_url'
    ),
}


class FakeClass:

  @deprecation.WarnForDeprecatedAsset('arg1')
  def __init__(self, arg1=None, arg2=None):
    pass

  @deprecation.WarnForDeprecatedAsset('arg2')
  def some_function(self, arg1=None, arg2=None):
    pass


class DeprecationTest(apitestcase.ApiTestCase, parameterized.TestCase):

  @contextlib.contextmanager
  def assertDoesNotWarn(self):
    """Asserts that no warnings are thrown."""
    with warnings.catch_warnings():
      warnings.simplefilter('error')
      yield

  # Overridden from apitestcase.ApiTestCase.
  def _MockFetchDataCatalogStac(self) -> Dict[str, Any]:
    return _STAC_JSON

  def test_no_warnings_thrown(self):
    with self.assertDoesNotWarn():
      FakeClass('valid-asset')

  def test_no_warnings_thrown_second_arg(self):
    with self.assertDoesNotWarn():
      FakeClass().some_function('some-value', 'valid-asset')

  @unittest.skip('Does not work on github')
  @parameterized.named_parameters(
      ('deprecated_asset', 'deprecated_asset'),
      ('date_and_learn_more', 'date_and_learn_more'),
      ('date_only', 'date_only'),
      ('learn_more_url_only', 'learn_more_url_only'),
  )
  def test_warning_thrown_args_init(self, asset_id: str):
    with self.assertWarnsRegex(
        DeprecationWarning, _EXPECTED_WARNINGS[asset_id]
    ):
      FakeClass(asset_id, 'some-value')

  @unittest.skip('Does not work on github')
  def test_warning_thrown_args_instance_method(self):
    asset = 'deprecated_asset'
    with self.assertWarnsRegex(DeprecationWarning, _EXPECTED_WARNINGS[asset]):
      FakeClass().some_function('some-value', asset)

  @unittest.skip('Does not work on github')
  def test_warning_thrown_kwargs_init(self):
    asset = 'deprecated_asset'
    with self.assertWarnsRegex(DeprecationWarning, _EXPECTED_WARNINGS[asset]):
      FakeClass(arg1=asset)

  @unittest.skip('Does not work on github')
  def test_warning_thrown_kwargs_instance_method(self):
    asset = 'deprecated_asset'
    with self.assertWarnsRegex(DeprecationWarning, _EXPECTED_WARNINGS[asset]):
      FakeClass().some_function(arg2=asset)

  @unittest.skip('Does not work on github')
  def test_same_warning_not_thrown(self):
    # Verifies the same warning message is not thrown twice.
    asset = 'deprecated_asset'
    with self.assertWarnsRegex(DeprecationWarning, _EXPECTED_WARNINGS[asset]):
      FakeClass(arg1=asset)
    with self.assertDoesNotWarn():
      FakeClass(arg1=asset)

    # Verifies that a different warning message is thrown.
    asset = 'date_only'
    with self.assertWarnsRegex(DeprecationWarning, _EXPECTED_WARNINGS[asset]):
      FakeClass(arg1=asset)

  def test_ee_object_warning_not_thrown(self):
    with self.assertDoesNotWarn():
      FakeClass(arg1=ee_string.String('non_deprecated_asset'))
    with self.assertDoesNotWarn():
      FakeClass(
          imagecollection.ImageCollection([image.Image(0), image.Image(1)])
      )
    with self.assertDoesNotWarn():
      FakeClass(None)


if __name__ == '__main__':
  unittest.main()
