#!/usr/bin/env python3
"""Test for ee._helpers.

When the function in question is defined in ee/_helpers.py but exported for
public use by ee/__init__.py, the test is located here but uses the ee.-prefixed
name since that is the name we want to ensure works.
"""

import io
import json
import unittest
from unittest import mock

import unittest
import ee
from ee import _helpers
from ee import apifunction
from ee import apitestcase
from ee import computedobject
from ee import ee_exception
from ee import oauth


class ServiceAccountCredentialsTest(unittest.TestCase):

  def test_no_args(self):
    with self.assertRaisesRegex(ValueError, 'At least one of'):
      ee.ServiceAccountCredentials()

  @mock.patch('google.oauth2.service_account.Credentials')
  def test_json_file(self, mock_credentials):
    ee.ServiceAccountCredentials(key_file='foo.json')
    mock_credentials.from_service_account_file.assert_called_with(
        'foo.json', scopes=oauth.SCOPES
    )

  @mock.patch('google.oauth2.service_account.Credentials')
  def test_json_key_data(self, mock_credentials):
    key_data = {'client_email': 'foo@bar.com'}
    ee.ServiceAccountCredentials(key_data=json.dumps(key_data))
    mock_credentials.from_service_account_info.assert_called_with(
        key_data, scopes=oauth.SCOPES
    )

  @mock.patch('google.auth.crypt.RSASigner')
  @mock.patch('google.oauth2.service_account.Credentials')
  def test_pem_key_data(self, mock_credentials, mock_signer):
    ee.ServiceAccountCredentials(email='foo@bar.com', key_data='pem_key_data')
    mock_signer.from_string.assert_called_with('pem_key_data')
    self.assertEqual(
        mock_credentials.call_args[0][1], 'foo@bar.com'
    )

  @mock.patch('google.auth.crypt.RSASigner')
  @mock.patch('google.oauth2.service_account.Credentials')
  def test_pem_file(self, mock_credentials, mock_signer):
    with mock.patch.object(
        _helpers, 'open', mock.mock_open(read_data='pem_key_data')
    ):
      ee.ServiceAccountCredentials(email='foo@bar.com', key_file='foo.pem')
    mock_signer.from_string.assert_called_with('pem_key_data')
    self.assertEqual(
        mock_credentials.call_args[0][1], 'foo@bar.com'
    )

  def test_bad_json_key_data(self):
    # This causes a different failure based on where the test is run.
    message = r'Could not deserialize key data|No key could be detected'
    with self.assertRaisesRegex(ValueError, message):
      ee.ServiceAccountCredentials(key_data='not json')


class ProfilingTest(apitestcase.ApiTestCase):

  def MockValue(self, value):
    """Overridden to check for profiling-related data."""
    hooked = ee.data._thread_locals.profile_hook is not None
    is_get_profiles = isinstance(
        value, computedobject.ComputedObject
    ) and value.func == apifunction.ApiFunction.lookup('Profile.getProfiles')
    return f'hooked={hooked} getProfiles={is_get_profiles}'

  def test_profile_printing(self):
    ee.data.computeValue = self.MockValue
    out = io.StringIO()
    with ee.profilePrinting(destination=out):
      self.assertEqual('hooked=True getProfiles=False', ee.Number(1).getInfo())
    self.assertEqual('hooked=False getProfiles=True', out.getvalue())

  def test_profile_printing_default_smoke(self):
    # This will print to sys.stderr, so we can't make any assertions about the
    # output. But we can check that it doesn't fail.
    ee.data.computeValue = self.MockValue
    with ee.profilePrinting():
      self.assertEqual('hooked=True getProfiles=False', ee.Number(1).getInfo())

  def test_profile_printing_error_getting_profiles(self):
    ee.data.computeValue = self.MockValue
    mock = unittest.mock.Mock()
    mock.call.side_effect = ee_exception.EEException('test')
    apifunction.ApiFunction._api['Profile.getProfiles'] = mock

    with self.assertRaises(ee_exception.EEException):
      with ee.profilePrinting():
        ee.Number(1).getInfo()
    self.assertEqual(5, mock.call.call_count)


if __name__ == '__main__':
  unittest.main()
