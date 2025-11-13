#!/usr/bin/env python3
"""Test for the oauth module."""

import http.client
import io
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

    with mock.patch.object(urllib.request, 'urlopen', new=mock_urlopen):
      auth_code = '123'
      verifier = 'xyz'
      refresh_token = oauth.request_token(auth_code, verifier)
      self.assertEqual('123456', refresh_token)

  def test_request_token_http_error(self):
    mock_fp = io.BytesIO(b'error details')
    http_error = urllib.error.HTTPError(
        'url', 400, 'message', hdrs=http.client.HTTPMessage(), fp=mock_fp
    )
    with mock.patch.object(urllib.request, 'urlopen', side_effect=http_error):
      with self.assertRaisesRegex(
          Exception,
          r"Problem requesting tokens.*HTTP Error 400: message.*b'error"
          r" details'",
      ):
        oauth.request_token('auth_code', 'code_verifier')

  def test_write_token(self):

    def mock_credentials_path():
      return f'{self.test_tmpdir}/tempfile'

    with mock.patch.object(
        oauth, 'get_credentials_path', new=mock_credentials_path
    ):
      client_info = dict(refresh_token='123')
      oauth.write_private_json(oauth.get_credentials_path(), client_info)

    with open(mock_credentials_path()) as f:
      token = json.load(f)
      self.assertEqual({'refresh_token': '123'}, token)

  def test_get_credentials_arguments(self):
    credentials_path = f'{self.test_tmpdir}/temp_creds'

    creds = {
        'refresh_token': 'REFRESH_TOKEN',
        'client_id': 'CLIENT_ID',
        'project': 'PROJECT',
    }
    with open(credentials_path, 'w') as f:
      json.dump(creds, f)

    with mock.patch.object(
        oauth, 'get_credentials_path', return_value=credentials_path
    ):
      args = oauth.get_credentials_arguments()

    expected_args = {
        'token_uri': oauth.TOKEN_URI,
        'refresh_token': 'REFRESH_TOKEN',
        'client_id': 'CLIENT_ID',
        'client_secret': oauth.CLIENT_SECRET,
        'scopes': oauth.SCOPES,
        'quota_project_id': 'PROJECT',
    }
    self.assertEqual(expected_args, args)

  def test_is_valid_credentials(self):
    self.assertFalse(oauth.is_valid_credentials(None))

    mock_credentials_valid = mock.MagicMock()
    self.assertTrue(oauth.is_valid_credentials(mock_credentials_valid))
    mock_credentials_valid.refresh.assert_called_once()

    mock_credentials_invalid = mock.MagicMock()
    mock_credentials_invalid.refresh.side_effect = (
        oauth.google.auth.exceptions.RefreshError()
    )
    self.assertFalse(oauth.is_valid_credentials(mock_credentials_invalid))
    mock_credentials_invalid.refresh.assert_called_once()

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

  def test_colab_mode_with_nonstandard_scopes_raises_exception(self):
    with self.assertRaisesRegex(
        ee_exception.EEException,
        'Scopes cannot be customized when auth_mode is "colab".'
    ):
      oauth.authenticate(
          auth_mode='colab',
          scopes=['https://www.googleapis.com/auth/earthengine.readonly']
      )

  def test_colab_auth_mode_with_standard_scopes_succeeds(self):
    # Should not raise an exception if the scopes are not narrowed.
    with mock.patch.dict(sys.modules, {'google.colab': mock.MagicMock()}):
      try:
        oauth.authenticate(auth_mode='colab', scopes=oauth.SCOPES)
      except ee_exception.EEException:
        self.fail('authenticate raised an exception unexpectedly.')

  def test_authenticate_appdefault(self):
    with mock.patch.object(
        oauth,
        '_valid_credentials_exist',
        return_value=False,
    ), mock.patch.object(
        sys, 'stderr', new_callable=io.StringIO
    ) as mock_stderr:
      oauth.authenticate(auth_mode='appdefault')
      self.assertIn('appdefault no longer necessary', mock_stderr.getvalue())

  @mock.patch.object(oauth, '_load_gcloud_credentials')
  @mock.patch.object(oauth, '_valid_credentials_exist', return_value=False)
  @mock.patch.object(oauth, 'in_colab_shell', return_value=False)
  @mock.patch.object(oauth, '_in_jupyter_shell', return_value=False)
  @mock.patch.object(oauth, '_localhost_is_viable', return_value=False)
  def test_authenticate_default_gcloud(
      self,
      mock_localhost_viable,
      mock_jupyter,
      mock_colab,
      mock_valid_creds,
      mock_load_gcloud,
  ):
    del (
        mock_localhost_viable,
        mock_jupyter,
        mock_colab,
        mock_valid_creds,
    )  # Unused
    oauth.authenticate()
    mock_load_gcloud.assert_called_once_with(None, None, False)

  def test_localhost_fetch_code(self):
    mock_server = mock.MagicMock()
    mock_server.url = 'http://localhost:8085'
    mock_server.fetch_code.return_value = 'FETCHED_CODE'
    with mock.patch.object(
        oauth, '_start_server', return_value=mock_server
    ), mock.patch.object(oauth, '_obtain_and_write_token') as mock_obtain:
      flow = oauth.Flow(auth_mode='localhost')
      flow.save_code()
      mock_server.fetch_code.assert_called_once()
      mock_obtain.assert_called_once_with(
          'FETCHED_CODE',
          flow.code_verifier,
          flow.scopes,
          'http://localhost:8085',
      )

  @mock.patch.object(oauth, '_display_auth_instructions_for_noninteractive')
  def test_display_instructions_quiet(self, mock_display):
    flow = oauth.Flow(auth_mode='notebook')
    self.assertTrue(flow.display_instructions(quiet=True))
    mock_display.assert_called_once_with(flow.auth_url, flow.code_verifier)

  @mock.patch.object(oauth, '_display_auth_instructions_with_print')
  @mock.patch.object(oauth, 'in_colab_shell', return_value=True)
  def test_display_instructions_colab(self, mock_in_colab, mock_display_print):
    del mock_in_colab  # Unused
    flow = oauth.Flow(auth_mode='notebook')
    self.assertTrue(flow.display_instructions())
    mock_display_print.assert_called_once_with(flow.auth_url, None)

  @mock.patch.object(oauth, '_display_auth_instructions_with_html')
  @mock.patch.object(oauth, '_in_jupyter_shell', return_value=True)
  def test_display_instructions_jupyter(
      self, mock_in_jupyter, mock_display_html
  ):
    del mock_in_jupyter  # Unused
    flow = oauth.Flow(auth_mode='notebook')
    self.assertTrue(flow.display_instructions())
    mock_display_html.assert_called_once_with(flow.auth_url, None)

  @mock.patch.object(oauth, '_display_auth_instructions_with_print')
  @mock.patch.object(oauth, 'in_colab_shell', return_value=False)
  @mock.patch.object(oauth, '_in_jupyter_shell', return_value=False)
  def test_display_instructions_print(
      self, mock_in_jupyter, mock_in_colab, mock_display_print
  ):
    del mock_in_jupyter, mock_in_colab  # Unused
    flow = oauth.Flow(auth_mode='notebook')
    self.assertTrue(flow.display_instructions())
    mock_display_print.assert_called_once_with(flow.auth_url, None)

  @mock.patch.object(oauth, '_display_auth_instructions_with_print')
  @mock.patch.object(oauth, 'in_colab_shell', return_value=True)
  @mock.patch.object(oauth.http.server, 'HTTPServer')
  def test_display_instructions_localhost_colab(
      self, mock_http_server, mock_in_colab, mock_display_print
  ):
    del mock_http_server, mock_in_colab  # Unused
    flow = oauth.Flow(auth_mode='localhost')
    self.assertTrue(flow.display_instructions())
    mock_display_print.assert_called_once_with(
        flow.auth_url, oauth.WAITING_CODA
    )

  def test_flow_unknown_auth_mode(self):
    with self.assertRaisesRegex(ee_exception.EEException, 'Unknown auth_mode'):
      oauth.Flow(auth_mode='unknown')

  def test_flow_localhost_with_port(self):
    with mock.patch.object(oauth, '_start_server') as mock_start_server:
      oauth.Flow(auth_mode='localhost:1234')
      mock_start_server.assert_called_once_with(1234)


if __name__ == '__main__':
  unittest.main()
