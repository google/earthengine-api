#!/usr/bin/env python3
"""Test for the ee.oauth module."""

from collections.abc import Iterator
import contextlib
import json
import sys
import tempfile
from unittest import mock
import urllib.parse

import unittest
import ee


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
      refresh_token = ee.oauth.request_token(auth_code, verifier)
      self.assertEqual('123456', refresh_token)

  def testWriteToken(self):

    def mock_credentials_path():
      return self.test_tmpdir + '/tempfile'

    oauth_pkg = 'ee.oauth'
    with mock.patch(
        oauth_pkg + '.get_credentials_path', new=mock_credentials_path):
      client_info = dict(refresh_token='123')
      ee.oauth.write_private_json(ee.oauth.get_credentials_path(), client_info)

    with open(mock_credentials_path()) as f:
      token = json.load(f)
      self.assertEqual({'refresh_token': '123'}, token)

  def test_in_colab_shell(self):
    self.assertFalse(ee.oauth.in_colab_shell())

if __name__ == '__main__':
  unittest.main()
