#!/usr/bin/env python
"""Earth Engine OAuth2 helper functions for generating client tokens.

Typical use-case consists of:
1. Calling 'get_authorization_url'
2. Using a browser to access the output URL and copy the generated OAuth2 code
3. Calling 'request_token' to request a token using that code and the OAuth API
4. Calling 'write_token' to save the token at the path given by
   'get_credentials_path'
"""

from __future__ import print_function


import datetime
import errno
import json
import os
import sys
import webbrowser
import six
from six.moves import input
from six.moves.urllib import parse
from six.moves.urllib import request
from six.moves.urllib.error import HTTPError


# Optional imports used for specific shells.
# pylint: disable=g-import-not-at-top
try:
  import IPython
except ImportError:
  pass


CLIENT_ID = ('517222506229-vsmmajv00ul0bs7p89v5m89qs8eb9359.'
             'apps.googleusercontent.com')
CLIENT_SECRET = 'RUP0RZ6e0pPhDzsqIJ7KlNd1'
SCOPES = [
    'https://www.googleapis.com/auth/earthengine',
    'https://www.googleapis.com/auth/devstorage.full_control'
]
REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'  # Prompts user to copy-paste code
TOKEN_URI = 'https://accounts.google.com/o/oauth2/token'


def get_credentials_path():
  cred_path = os.path.expanduser('~/.config/earthengine/credentials')
  return cred_path


def get_authorization_url():
  """Returns a URL to generate an auth code."""

  return 'https://accounts.google.com/o/oauth2/auth?' + parse.urlencode({
      'client_id': CLIENT_ID,
      'scope': ' '.join(SCOPES),
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
    response = request.urlopen(
        TOKEN_URI,
        parse.urlencode(request_args).encode()).read().decode()
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

  file_content = json.dumps({'refresh_token': refresh_token})
  if os.path.exists(credentials_path):
    # Remove file because os.open will not change permissions of existing files
    os.remove(credentials_path)
  with os.fdopen(
      os.open(credentials_path, os.O_WRONLY | os.O_CREAT, 0o600), 'w') as f:
    f.write(file_content)


def _in_colab_shell():
  """Tests if the code is being executed within Google Colab."""
  try:
    import google.colab  # pylint: disable=unused-variable
    return True
  except ImportError:
    return False


def _in_jupyter_shell():
  """Tests if the code is being executed within Jupyter."""
  try:
    import ipykernel.zmqshell
    return isinstance(IPython.get_ipython(),
                      ipykernel.zmqshell.ZMQInteractiveShell)
  except ImportError:
    return False
  except NameError:
    return False


def _obtain_and_write_token(auth_code=None):
  """Obtains and writes credentials token based on a authorization code."""
  if not auth_code:
    auth_code = input('Enter verification code: ')
    assert isinstance(auth_code, six.string_types)
  token = request_token(auth_code)
  write_token(token)
  print('\nSuccessfully saved authorization token.')


def _display_auth_instructions_for_noninteractive(auth_url):
  """Displays instructions for authenticating without blocking for user input."""
  print('Paste the following address into a web browser:\n'
        '\n'
        '    {0}\n'
        '\n'
        'On the web page, please authorize access to your '
        'Earth Engine account and copy the authentication code. '
        'Next authenticate with the following command:\n'
        '\n'
        '    earthengine authenticate '
        '--authorization-code=PLACE_AUTH_CODE_HERE\n'.format(auth_url))


def _display_auth_instructions_with_print(auth_url):
  """Displays instructions for authenticating using a print statement."""
  print('To authorize access needed by Earth Engine, open the following '
        'URL in a web browser and follow the instructions. If the web '
        'browser does not start automatically, please manually browse the '
        'URL below.\n'
        '\n'
        '    {0}\n'
        '\n'
        'The authorization workflow will generate a code, which you '
        'should paste in the box below. '.format(auth_url))


def _display_auth_instructions_with_html(auth_url):
  """Displays instructions for authenticating using HTML code."""
  try:
    IPython.display.display(IPython.display.HTML(
        """<p>To authorize access needed by Earth Engine, open the following
        URL in a web browser and follow the instructions:</p>
        <p><a href={0}>{0}</a></p>
        <p>The authorization workflow will generate a code, which you
        should paste in the box below</p>
        """.format(auth_url)))
  except NameError:
    print('The IPython module must be installed to use HTML.')
    raise


def authenticate(
    authorization_code=None,
    quiet=False):
  """Prompts the user to authorize access to Earth Engine via OAuth2.

  Args:
    authorization_code: An optional authorization code.
    quiet: If true, do not require interactive prompts.
  """

  if authorization_code:
    _obtain_and_write_token(authorization_code)
    return

  auth_url = get_authorization_url()

  if quiet:
    _display_auth_instructions_for_noninteractive(auth_url)
    webbrowser.open_new(auth_url)
    return

  if _in_colab_shell():
    if sys.version_info[0] == 2:  # Python 2
      _display_auth_instructions_for_noninteractive(auth_url)
      return
    else:  # Python 3
      _display_auth_instructions_with_print(auth_url)
  elif _in_jupyter_shell():
    _display_auth_instructions_with_html(auth_url)
  else:
    _display_auth_instructions_with_print(auth_url)
  webbrowser.open_new(auth_url)

  auth_code = input('Enter verification code: ')
  assert isinstance(auth_code, six.string_types)
  _obtain_and_write_token(auth_code.strip())
