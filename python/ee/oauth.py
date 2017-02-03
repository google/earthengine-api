#!/usr/bin/env python
"""Earth Engine OAuth2 helper functions for generating client tokens.

Typical use-case consists of:
1. Calling 'get_authorization_url'
2. Using a browser to access the output URL and copy the generated OAuth2 code
3. Calling 'request_token' to request a token using that code and the OAuth API
4. Calling 'write_token' to save the token at the path given by
   'get_credentials_path'
"""


import errno
import json
import os

# pylint: disable=g-import-not-at-top
try:
  # Python 3.x
  import urllib
  from urllib.parse import urlencode
  from urllib.error import HTTPError
except ImportError:
  # Python 2.x
  import urllib
  from urllib import urlencode
  import urllib2
  from urllib2 import HTTPError

CLIENT_ID = ('517222506229-vsmmajv00ul0bs7p89v5m89qs8eb9359.'
             'apps.googleusercontent.com')
CLIENT_SECRET = 'RUP0RZ6e0pPhDzsqIJ7KlNd1'
REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'  # Prompts user to copy-paste code
SCOPE = ('https://www.googleapis.com/auth/earthengine'
         ' https://www.googleapis.com/auth/devstorage.full_control')
TOKEN_REQ_URL = 'https://accounts.google.com/o/oauth2/token'


def get_credentials_path():
  return os.path.expanduser('~/.config/earthengine/credentials')


def get_authorization_url():
  """Returns a URL to generate an auth code."""

  return 'https://accounts.google.com/o/oauth2/auth?' + urlencode({
      'client_id': CLIENT_ID,
      'scope': SCOPE,
      'redirect_uri': REDIRECT_URI,
      'response_type': 'code',
  })


def request_token(auth_code):
  """Uses authorization code to request tokens."""

  request_args = {
      'code': auth_code,
      'client_id': CLIENT_ID,
      'client_secret': CLIENT_SECRET,
      'redirect_uri': REDIRECT_URI,
      'grant_type': 'authorization_code',
  }

  refresh_token = None

  try:
    try:
      # Python 2.x
      response = urllib2.urlopen(TOKEN_REQ_URL,
                                 urllib.urlencode(request_args).encode()
                                ).read().decode()
    except NameError:
      # Python 3.x
      response = urllib.request.urlopen(TOKEN_REQ_URL,
                                        urlencode(request_args).encode()
                                       ).read().decode()
    refresh_token = json.loads(response)['refresh_token']
  except HTTPError as e:
    raise Exception('Problem requesting tokens. Please try again.  %s %s' %
                    (e, e.read()))

  return refresh_token


def write_token(refresh_token):
  """Attempts to write the passed token to the given user directory."""

  credentials_path = get_credentials_path()
  dirname = os.path.dirname(credentials_path)
  try:
    os.makedirs(dirname)
  except OSError as e:
    if e.errno != errno.EEXIST:
      raise Exception('Error creating directory %s: %s' % (dirname, e))

  json.dump({'refresh_token': refresh_token}, open(credentials_path, 'w'))
