#!/usr/bin/env python
"""Test class for oauth."""


import json
import sys
import mock

# pylint: disable=g-import-not-at-top
try:
  # Python 2.x
  import urlparse
except ImportError:
  # Python 3.x
  import urllib.parse as urlparse

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
      return MockResponse(urlparse.parse_qs(param)[b'code'][0])

    # Choose urlopen function to mock based on Python version
    if sys.version_info[0] < 3:
      urlopen_lib = 'urllib2.urlopen'
    else:
      urlopen_lib = 'urllib.request.urlopen'

    with mock.patch(urlopen_lib, new=mock_urlopen):
      auth_code = '123'
      refresh_token = ee.oauth.request_token(auth_code)
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
      self.assertEquals({'refresh_token': '123'}, token)


if __name__ == '__main__':
  unittest.main()
