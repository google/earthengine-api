#!/usr/bin/env python3
"""Test for the oauth module."""

import json
import sys
import tempfile
from unittest import mock
import urllib.parse

import unittest
from ee import oauth


class OAuthTest(unittest.TestCase):

  def setUp(self):
    super().setUp()
    self.test_tmpdir = tempfile.mkdtemp()

  def testRequestToken(self):

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

  def testWriteToken(self):

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

if __name__ == '__main__':
  unittest.main()
