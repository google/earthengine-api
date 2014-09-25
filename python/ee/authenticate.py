#!/usr/bin/env python

"""Script to prompt user to authorize OAuth2 access to Earth Engine account.

Stores credentials (refresh token) for later use
"""

import errno
import json
import os
import urllib
import urllib2
import webbrowser

from oauthinfo import OAuthInfo


def main():
  # TODO(user): Add an additional, non-commandline flow for iPython notebook
  # for added convenience, and to work in notebook environments where
  # commandline isn't available.

  # This implements the flow from:
  # https://developers.google.com/accounts/docs/OAuth2ForDevices

  ### Request authorization from user

  # This URI prompts user to copy and paste a code after successful
  # authorization.
  redirect_uri = 'urn:ietf:wg:oauth:2.0:oob'

  auth_request_params = {
      'scope': OAuthInfo.SCOPE,
      'redirect_uri': redirect_uri,
      'response_type': 'code',
      'client_id': OAuthInfo.CLIENT_ID
  }
  auth_request_url = ('https://accounts.google.com/o/oauth2/auth?' +
                      urllib.urlencode(auth_request_params))

  webbrowser.open_new(auth_request_url)

  print """
  Opening web browser to address %s
  Please authorize access to your Earth Engine account, and paste
  the resulting code below.
  If the web browser does not start, please manually browse the the URL above.
  """ % auth_request_url

  auth_code = raw_input('Please enter authorization code: ').strip()

  ### Use authorization code to request tokens

  token_request_params = {
      'code': auth_code,
      'client_id': OAuthInfo.CLIENT_ID,
      'client_secret': OAuthInfo.CLIENT_SECRET,
      'redirect_uri': redirect_uri,
      'grant_type': 'authorization_code'
  }

  refresh_token = None
  try:
    response = urllib2.urlopen('https://accounts.google.com/o/oauth2/token',
                               urllib.urlencode(token_request_params)).read()
    tokens = json.loads(response)
    refresh_token = tokens['refresh_token']
  except urllib2.HTTPError, e:
    raise Exception('Problem requesting tokens.  Please try again.  %s %s' %
                    (e, e.read()))

  ### Write refresh token to filesystem for later use

  credentials_path = OAuthInfo.credentials_path()
  dirname = os.path.dirname(credentials_path)
  try:
    os.makedirs(dirname)
  except OSError, e:
    if e.errno != errno.EEXIST:
      raise Exception('Error creating %s: %s' % (dirname, e))

  json.dump({'refresh_token': refresh_token}, open(credentials_path, 'w'))

  print '\nSuccessfully saved authorization to %s' % credentials_path

if __name__ == '__main__':
  main()
