#!/usr/bin/env python
"""Test class for oauth."""


import json
import mock

from six.moves.urllib import parse

import tempfile
import unittest

import ee


class OAuthTest(unittest.TestCase):

  def setUp(self):
    self.test_tmpdir = tempfile.mkdtemp()

  def testRequestToken(self):

    class MockResponse(object):

      def __init__(self, code):
        self.code = code.decode()

      def read(self):
        return ('{"refresh_token": "' + self.code + '456"}').encode()

    def mock_urlopen(unused_url, param):
      parsed = parse.parse_qs(param)
      self.assertEqual('xyz', parsed[b'code_verifier'][0].decode())
      return MockResponse(parsed[b'code'][0])

    with mock.patch('six.moves.urllib.request.urlopen', new=mock_urlopen):
      auth_code = '123'
      verifier = 'xyz'
      refresh_token = ee.oauth.request_token(auth_code, verifier)
      self.assertEqual('123456', refresh_token)

  def testWriteToken(self):

    def mock_credentials_path():
      return self.test_tmpdir+'/tempfile'

    oauth_pkg = 'ee.oauth'
    with mock.patch(oauth_pkg+'.get_credentials_path',
                    new=mock_credentials_path):
      refresh_token = '123'
      ee.oauth.write_token(refresh_token)

    with open(mock_credentials_path()) as f:
      token = json.load(f)
      self.assertEqual({'refresh_token': '123'}, token)


if __name__ == '__main__':
  unittest.main()
