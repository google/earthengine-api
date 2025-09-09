#!/usr/bin/env python3
"""Test for the oauth module."""

import json
import sys
import tempfile
from unittest import mock
import urllib.parse

import unittest
from ee import ee_exception
from ee import oauth


class OAuthTest(unittest.TestCase):

  def setUp(self):
    super().setUp()
    self.test_tmpdir = tempfile.mkdtemp()

  def test_request_token(self):

    class MockResponse:

      def __init__(self, code):
        self.code = code.decode()

      def read(self):
        return ('{"refresh_token": "' + self.code + '456"}').encode()

    def mock_urlopen(url, param):
      del url  # Unused.
      parsed = urllib.parse.parse_qs(param)
      self.assertEqual('xyz', parsed[b'code_verifier'][0].decode())
      return MockResponse(parsed[b'code'][0])

    with mock.patch('urllib.request.urlopen', new=mock_urlopen):
      auth_code = '123'
      verifier = 'xyz'
      refresh_token = oauth.request_token(auth_code, verifier)
      self.assertEqual('123456', refresh_token)

  def test_write_token(self):

    def mock_credentials_path():
      return self.test_tmpdir + '/tempfile'

    oauth_pkg = 'ee.oauth'
    with mock.patch(
        oauth_pkg + '.get_credentials_path', new=mock_credentials_path):
      client_info = dict(refresh_token='123')
      oauth.write_private_json(oauth.get_credentials_path(), client_info)

    with open(mock_credentials_path()) as f:
      token = json.load(f)
      self.assertEqual({'refresh_token': '123'}, token)

  def test_in_colab_shell(self):
    with mock.patch.dict(sys.modules, {'google.colab': None}):
      self.assertFalse(oauth.in_colab_shell())

    with mock.patch.dict(sys.modules, {'google.colab': mock.MagicMock()}):
      self.assertTrue(oauth.in_colab_shell())

  def test_is_sdk_credentials(self):
    sdk_project = oauth.SDK_PROJECTS[0]
    self.assertFalse(oauth.is_sdk_credentials(None))
    self.assertFalse(oauth.is_sdk_credentials(mock.MagicMock()))
    self.assertFalse(
        oauth.is_sdk_credentials(mock.MagicMock(client_id='123'))
    )
    self.assertTrue(
        oauth.is_sdk_credentials(mock.MagicMock(client_id=sdk_project))
    )
    self.assertTrue(
        oauth.is_sdk_credentials(
            mock.MagicMock(client_id=f'{sdk_project}-somethingelse')
        )
    )

  def testAuthenticate_colabAuthModeWithNonstandardScopes_raisesException(self):
    with self.assertRaisesRegex(
        ee_exception.EEException,
        'Scopes cannot be customized when auth_mode is "colab".'
    ):
      oauth.authenticate(
          auth_mode='colab',
          scopes=['https://www.googleapis.com/auth/earthengine.readonly']
      )

  def testAuthenticate_colabAuthModeWithStandardScopes_succeeds(self):
    # Should not raise an exception if the scopes are not narrowed.
    with mock.patch.dict(sys.modules, {'google.colab': mock.MagicMock()}):
      try:
        oauth.authenticate(auth_mode='colab', scopes=oauth.SCOPES)
      except ee_exception.EEException:
        self.fail('authenticate raised an exception unexpectedly.')

  @mock.patch.object(oauth, '_obtain_and_write_token')
  @mock.patch.object(oauth, 'is_valid_credentials')
  @mock.patch.object(oauth, 'get_credentials_arguments')
  @mock.patch.object(oauth.ee_data, 'get_persistent_credentials')
  def testAuthenticate_differentScopes_reauthenticates(
      self,
      mock_get_persistent_credentials,
      mock_get_credentials_arguments,
      mock_is_valid_credentials,
      mock_obtain_and_write_token,
  ):
    # Mock valid credentials to exist initially.
    mock_is_valid_credentials.return_value = True
    mock_get_persistent_credentials.return_value = mock.MagicMock()

    # First call with default scopes.
    mock_get_credentials_arguments.return_value = {'scopes': oauth.SCOPES}
    oauth.authenticate(auth_mode='notebook', scopes=oauth.SCOPES)
    mock_obtain_and_write_token.assert_not_called()

    # Second call with different scopes.
    new_scopes = ['https://www.googleapis.com/auth/earthengine.readonly']
    oauth.authenticate(auth_mode='notebook', scopes=new_scopes)
    mock_obtain_and_write_token.assert_called_once()

    # Third call with the new scopes again.
    mock_obtain_and_write_token.reset_mock()
    mock_get_credentials_arguments.return_value = {'scopes': new_scopes}
    oauth.authenticate(auth_mode='notebook', scopes=new_scopes)
    mock_obtain_and_write_token.assert_not_called()

  @mock.patch.object(oauth, '_obtain_and_write_token')
  @mock.patch.object(oauth, 'is_valid_credentials')
  @mock.patch.object(oauth, 'get_credentials_arguments')
  @mock.patch.object(oauth.ee_data, 'get_persistent_credentials')
  def testAuthenticate_oldCreds_defaultScopes_succeeds(
      self,
      mock_get_persistent_credentials,
      mock_get_credentials_arguments,
      mock_is_valid_credentials,
      mock_obtain_and_write_token,
  ):
    # Mock valid credentials to exist initially.
    mock_is_valid_credentials.return_value = True
    mock_get_persistent_credentials.return_value = mock.MagicMock()

    # If get_credentials_arguments returns no scopes (i.e., file saved by an
    # older client), and we authenticate with default scopes, we should not
    # trigger re-auth. This is to minimize disruption for the majority of users
    # updating to the latest client.
    mock_get_credentials_arguments.return_value = {}  # No 'scopes' key
    oauth.authenticate(auth_mode='notebook', scopes=oauth.SCOPES)
    mock_obtain_and_write_token.assert_not_called()

if __name__ == '__main__':
  unittest.main()
