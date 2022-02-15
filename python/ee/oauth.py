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


import base64
import errno
import hashlib
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
  cred_path = os.path.expanduser(
      '~/.config/earthengine/credentials',
  )
  return cred_path


def get_credentials_arguments():
  with open(get_credentials_path()) as creds:
    stored = json.load(creds)
    args = {}
    args['token_uri'] = TOKEN_URI  # Not overridable in file
    args['refresh_token'] = stored['refresh_token']  # Must be present
    args['client_id'] = stored.get('client_id', CLIENT_ID)
    args['client_secret'] = stored.get('client_secret', CLIENT_SECRET)
    args['scopes'] = stored.get('scopes', SCOPES)
    return args


def get_authorization_url(code_challenge):
  """Returns a URL to generate an auth code."""

  return 'https://accounts.google.com/o/oauth2/auth?' + parse.urlencode({
      'client_id': CLIENT_ID,
      'scope': ' '.join(SCOPES),
      'redirect_uri': REDIRECT_URI,
      'response_type': 'code',
      'code_challenge': code_challenge,
      'code_challenge_method': 'S256',
  })


def request_token(auth_code, code_verifier, client_id=None, client_secret=None):
  """Uses authorization code to request tokens."""

  request_args = {
      'code': auth_code,
      'client_id': client_id or CLIENT_ID,
      'client_secret': client_secret or CLIENT_SECRET,
      'redirect_uri': REDIRECT_URI,
      'grant_type': 'authorization_code',
      'code_verifier': code_verifier,
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


def write_token(refresh_token, client_info=None):
  """Attempts to write the passed token to the given user directory."""

  credentials_path = get_credentials_path()
  dirname = os.path.dirname(credentials_path)
  try:
    os.makedirs(dirname)
  except OSError as e:
    if e.errno != errno.EEXIST:
      raise Exception('Error creating directory %s: %s' % (dirname, e))

  client_info = client_info or {}
  file_content = json.dumps(dict(refresh_token=refresh_token, **client_info))
  if os.path.exists(credentials_path):
    # Remove file because os.open will not change permissions of existing files
    os.remove(credentials_path)
  with os.fdopen(
      os.open(credentials_path, os.O_WRONLY | os.O_CREAT, 0o600), 'w') as f:
    f.write(file_content)


def _in_colab_shell():
  """Tests if the code is being executed within Google Colab."""
  try:
    import google.colab  # pylint: disable=unused-import
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


def _obtain_and_write_token(auth_code=None, code_verifier=None):
  """Obtains and writes credentials token based on an authorization code."""
  if not auth_code:
    auth_code = input('Enter verification code: ')
  assert isinstance(auth_code, six.string_types)
  client_info = {}
  token = request_token(auth_code.strip(), code_verifier, **client_info)
  write_token(token, client_info)
  print('\nSuccessfully saved authorization token.')


def _display_auth_instructions_for_noninteractive(auth_url, code_verifier):
  """Displays instructions for authenticating without blocking for user input."""
  print('Paste the following address into a web browser:\n'
        '\n'
        '    {0}\n'
        '\n'
        'On the web page, please authorize access to your '
        'Earth Engine account and copy the authentication code. '
        'Next authenticate with the following command:\n'
        '\n'
        '    earthengine authenticate --code-verifier={1} '
        '--authorization-code=PLACE_AUTH_CODE_HERE\n'.format(
            auth_url, six.ensure_str(code_verifier)))


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


def _base64param(byte_string):
  """Encodes bytes for use as a URL parameter."""
  return base64.urlsafe_b64encode(byte_string).rstrip(b'=')


def _nonce_table(*nonce_keys):
  """Makes random nonces, and adds PKCE challenges for each _verifier nonce."""
  table = {}
  for key in nonce_keys:
    table[key] = _base64param(os.urandom(32))
    if key.endswith('_verifier'):
      # Generate a challenge that the server will use to ensure that requests
      # only work with our verifiers.  https://tools.ietf.org/html/rfc7636
      pkce_challenge = _base64param(hashlib.sha256(table[key]).digest())
      table[key.replace('_verifier', '_challenge')] = pkce_challenge
  return {k: v.decode() for k, v in table.items()}


def authenticate(
    cli_authorization_code=None,
    quiet=False,
    cli_code_verifier=None):
  """Prompts the user to authorize access to Earth Engine via OAuth2.

  Args:
    cli_authorization_code: An optional authorization code.  Supports CLI mode,
        where the code is passed as an argument to `earthengine authenticate`.
    quiet: If true, do not require interactive prompts.
    cli_code_verifier: PKCE verifier to prevent auth code stealing.  Must be
        provided if cli_authorization_code is given.
  """

  if cli_authorization_code:
    _obtain_and_write_token(cli_authorization_code, cli_code_verifier)
    return

  pkce = _nonce_table('code_verifier')
  code_verifier = pkce['code_verifier']
  auth_url = get_authorization_url(pkce['code_challenge'])

  if quiet:
    _display_auth_instructions_for_noninteractive(auth_url, code_verifier)
    webbrowser.open_new(auth_url)
    return

  if _in_colab_shell():
    if sys.version_info[0] == 2:  # Python 2
      _display_auth_instructions_for_noninteractive(auth_url, code_verifier)
      return
    else:  # Python 3
      _display_auth_instructions_with_print(auth_url)
  elif _in_jupyter_shell():
    _display_auth_instructions_with_html(auth_url)
  else:
    _display_auth_instructions_with_print(auth_url)
  webbrowser.open_new(auth_url)

  _obtain_and_write_token(None, code_verifier)  # Will prompt for auth_code.
