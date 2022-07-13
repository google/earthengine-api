#!/usr/bin/env python
"""Earth Engine OAuth2 helper functions for generating client tokens.

Typical use-case consists of:
1. Calling 'get_authorization_url'
2. Using a browser to access the output URL and copy the generated OAuth2 code
3. Calling 'request_token' to request a token using that code and the OAuth API
4. Calling 'write_private_json' to save the token at the path given by
   'get_credentials_path'
"""

import base64
import errno
import hashlib
import http.server
import json
import os
import sys
import webbrowser

from google.auth import _cloud_sdk
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
AUTH_URI = 'https://accounts.google.com/o/oauth2/auth'

AUTH_PAGE_URL = 'https://code.earthengine.google.com/client-auth'
MODE_URL = AUTH_PAGE_URL + '/mode'
FETCH_URL = AUTH_PAGE_URL + '/fetch'
AUTH_URL_TEMPLATE = AUTH_PAGE_URL + '?scopes={scopes}' + (
    '&request_id={request_id}&tc={token_challenge}&cc={client_challenge}')

# Command to execute in gcloud mode
GCLOUD_COMMAND = ('gcloud auth application-default login --scopes={scopes} '
                  '--client-id-file={client_id_file} {flags}')

DEFAULT_LOCAL_PORT = 8085
WAITING_CODA = 'Waiting for successful authorization from web browser ...'
PASTE_CODA = ('The authorization workflow will generate a code, which you'
              ' should paste in the box below.')

# Command-line browsers cannot handle the auth pages.
TEXT_BROWSERS = ['elinks', 'links', 'lynx', 'w3m', 'www-browser']


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


def get_authorization_url(code_challenge, scopes=None, redirect_uri=None):
  """Returns a URL to generate an auth code."""

  return 'https://accounts.google.com/o/oauth2/auth?' + parse.urlencode({
      'client_id': CLIENT_ID,
      'scope': ' '.join(scopes or SCOPES),
      'redirect_uri': redirect_uri or REDIRECT_URI,
      'response_type': 'code',
      'code_challenge': code_challenge,
      'code_challenge_method': 'S256',
  })


def request_token(auth_code,
                  code_verifier,
                  client_id=None,
                  client_secret=None,
                  redirect_uri=None):
  """Uses authorization code to request tokens."""

  request_args = {
      'code': auth_code,
      'client_id': client_id or CLIENT_ID,
      'client_secret': client_secret or CLIENT_SECRET,
      'redirect_uri': redirect_uri or REDIRECT_URI,
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


def write_private_json(json_path, info_dict):
  """Attempts to write the passed token to the given user directory."""

  dirname = os.path.dirname(json_path)
  try:
    os.makedirs(dirname)
  except OSError as e:
    if e.errno != errno.EEXIST:
      raise Exception('Error creating directory %s: %s' % (dirname, e))

  file_content = json.dumps(info_dict)
  if os.path.exists(json_path):
    # Remove file because os.open will not change permissions of existing files
    os.remove(json_path)
  with os.fdopen(
      os.open(json_path, os.O_WRONLY | os.O_CREAT, 0o600), 'w') as f:
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


def _obtain_and_write_token(auth_code=None,
                            code_verifier=None,
                            scopes=None,
                            redirect_uri=None):
  """Obtains and writes credentials token based on an authorization code."""
  fetch_data = {}
  if code_verifier and ':' in code_verifier:
    request_id, code_verifier, client_verifier = code_verifier.split(':')
    fetch_data = dict(request_id=request_id, client_verifier=client_verifier)
  client_info = {}
  if redirect_uri:
    client_info['redirect_uri'] = redirect_uri
  if not auth_code:
    auth_code = input('Enter verification code: ')
  assert isinstance(auth_code, six.string_types)
  scopes = scopes or SCOPES
  if fetch_data:
    data = json.dumps(fetch_data).encode()
    headers = {'Content-Type': 'application/json; charset=UTF-8'}
    fetch_client = request.Request(FETCH_URL, data=data, headers=headers)
    fetched_info = json.loads(request.urlopen(fetch_client).read().decode())
    client_info = {k: fetched_info[k] for k in ['client_id', 'client_secret']}
    scopes = fetched_info.get('scopes') or scopes
  token = request_token(auth_code.strip(), code_verifier, **client_info)
  client_info['refresh_token'] = token
  client_info['scopes'] = scopes
  write_private_json(get_credentials_path(), client_info)
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


def _display_auth_instructions_with_print(auth_url, coda=None):
  """Displays instructions for authenticating using a print statement."""
  print('To authorize access needed by Earth Engine, open the following '
        'URL in a web browser and follow the instructions. If the web '
        'browser does not start automatically, please manually browse the '
        'URL below.\n'
        '\n'
        '    {0}\n'
        '\n{1}'.format(auth_url, coda or PASTE_CODA))


def _display_auth_instructions_with_html(auth_url, coda=None):
  """Displays instructions for authenticating using HTML code."""
  try:
    IPython.display.display(IPython.display.HTML(
        """<p>To authorize access needed by Earth Engine, open the following
        URL in a web browser and follow the instructions:</p>
        <p><a href={0}>{0}</a></p>
        <p>{1}</p>
        """.format(auth_url, coda or PASTE_CODA)))
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


def _open_new_browser(url):
  """Opens a web browser if possible."""
  try:
    browser = webbrowser.get()
    if hasattr(browser, 'name') and browser.name in TEXT_BROWSERS:
      return
  except webbrowser.Error:
    return
  webbrowser.open_new(url)


def _in_notebook():
  return _in_colab_shell() or _in_jupyter_shell()


def _load_app_default_credentials(run_gcloud=True, scopes=None, quiet=None):
  """Initializes credentials from ADC, optionally running gcloud to get them."""
  adc_path = _cloud_sdk.get_application_default_credentials_path()
  if run_gcloud:
    client_id_json = dict(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        auth_uri=AUTH_URI,
        token_uri=TOKEN_URI)
    client_id_file = get_credentials_path() + '-client-id.json'
    write_private_json(client_id_file, dict(installed=client_id_json))
    command = GCLOUD_COMMAND.format(
        scopes=','.join(scopes or SCOPES),
        client_id_file=client_id_file,
        flags='--no-browser' if quiet else '')
    print('Fetching credentials using gcloud')
    return_code = os.system(command)
    os.remove(client_id_file)
    if return_code != 0:
      raise Exception('gcloud failed. Please check for any errors above '
                      'and install gcloud if needed.')
  else:
    # Only consult the environment variable in appdefault mode, because gcloud
    # always writes to the default location.
    adc_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', adc_path)
  with open(adc_path) as adc_json:
    adc = json.load(adc_json)
    adc = {k: adc[k] for k in ['client_id', 'client_secret', 'refresh_token']}
    write_private_json(get_credentials_path(), adc)
  print('\nSuccessfully saved authorization token.')


def _start_server(port):
  """Starts and returns a web server that handles the OAuth callback."""

  class Handler(http.server.BaseHTTPRequestHandler):
    """Handles the OAuth callback and reports a success page."""

    code = None

    def do_GET(self):  # pylint: disable=invalid-name
      Handler.code = parse.parse_qs(parse.urlparse(self.path).query)['code'][0]
      self.send_response(200)
      self.send_header('Content-type', 'text/plain; charset=utf-8')
      self.end_headers()
      self.wfile.write(
          b'\n\nGoogle Earth Engine authorization successful!\n\n\n'
          b'Credentials have been retrieved.  Please close this window.\n\n'
          b'  \xf0\x9f\x8c\x8d  \xe2\x9a\x99\xef\xb8\x8f  \xf0\x9f\x8c\x8f'
          b'  \xe2\x9a\x99\xef\xb8\x8f  \xf0\x9f\x8c\x8e ')  # Earth emoji

    def log_message(self, *_):
      pass  # Suppresses the logging of request info to stderr.

  class Server(object):

    def __init__(self):
      self.server = http.server.HTTPServer(('localhost', port), Handler)
      self.url = 'http://localhost:%s' % self.server.server_address[1]

    def fetch_code(self):
      self.server.handle_request()  # Blocks until a single request arrives.
      self.server.server_close()
      return Handler.code

  return Server()


def authenticate(
    cli_authorization_code=None,
    quiet=False,
    cli_code_verifier=None,
    auth_mode=None,
    scopes=None):
  """Prompts the user to authorize access to Earth Engine via OAuth2.

  Args:
    cli_authorization_code: An optional authorization code.  Supports CLI mode,
      where the code is passed as an argument to `earthengine authenticate`.
    quiet: If true, do not require interactive prompts.
    cli_code_verifier: PKCE verifier to prevent auth code stealing.  Must be
      provided if cli_authorization_code is given.
    auth_mode: The authorization mode.  One of:
        "notebook" - send user to notebook authenticator page. Intended for
          web users who do not run code locally. Credentials expire in 7 days.
        "gcloud" - use gcloud to obtain credentials. This runs a command line to
          set the appdefault file, which must run on your local machine.
        "appdefault" - read an existing $GOOGLE_APPLICATION_CREDENTIALS file
          without running gcloud.
        "localhost" - sends credentials to the Python environment on the same
          localhost as the browser. Does not work for remote shells. Default
          port is 8085; use localhost:N set port or localhost:0 to auto-select.
        None - a default mode is chosen based on your environment.
   scopes: List of scopes to use for authorization. Defaults to [
     'https://www.googleapis.com/auth/earthengine',
     'https://www.googleapis.com/auth/devstorage.full_control' ].

  Raises:
     Exception: on invalid arguments.
  """

  if cli_authorization_code:
    _obtain_and_write_token(cli_authorization_code, cli_code_verifier, scopes)
    return

  if not auth_mode:
    auth_mode = 'notebook' if _in_notebook() else 'gcloud'

  if auth_mode in ['appdefault', 'gcloud']:
    _load_app_default_credentials(auth_mode == 'gcloud', scopes, quiet)
    return

  flow = Flow(auth_mode, scopes)

  if flow.display_instructions(quiet):
    _open_new_browser(flow.auth_url)

  flow.save_code()


class Flow(object):
  """Holds state for auth flows."""

  def __init__(self, auth_mode='notebook', scopes=None):
    """Initializes auth URL and PKCE verifier, for use in save_code().

    Args:
      auth_mode: Authorization mode, one of "notebook" or "localhost[:PORT]".
      scopes: Optional scope list override.

    Raises:
       Exception: on invalid arguments.
    """
    port = DEFAULT_LOCAL_PORT
    if auth_mode and auth_mode.startswith('localhost:'):
      auth_mode, port = auth_mode.split(':', 1)

    self.scopes = scopes or SCOPES
    self.server = None
    if auth_mode == 'localhost':
      pkce = _nonce_table('code_verifier')
      self.code_verifier = pkce['code_verifier']
      self.server = _start_server(int(port))
      self.auth_url = get_authorization_url(pkce['code_challenge'], self.scopes,
                                            self.server.url)
    elif auth_mode == 'notebook':
      nonces = ['request_id', 'token_verifier', 'client_verifier']
      request_info = _nonce_table(*nonces)
      self.auth_url = AUTH_URL_TEMPLATE.format(
          scopes=parse.quote(' '.join(self.scopes)), **request_info)
      self.code_verifier = ':'.join(request_info[k] for k in nonces)
    else:
      raise Exception('Unknown auth_mode "%s"' % auth_mode)

  def save_code(self, code=None):
    """Fetches auth code if not given, and saves the generated credentials."""
    redirect_uri = None
    if self.server and not code:
      redirect_uri = self.server.url
      code = self.server.fetch_code()  # Waits for oauth callback
    _obtain_and_write_token(code, self.code_verifier, self.scopes, redirect_uri)

  def display_instructions(self, quiet=None):
    """Prints to stdout, and returns True if a browser should be opened."""

    if quiet:
      _display_auth_instructions_for_noninteractive(self.auth_url,
                                                    self.code_verifier)
      return True

    coda = WAITING_CODA if self.server else None
    if _in_colab_shell():
      if sys.version_info[0] == 2:  # Python 2
        _display_auth_instructions_for_noninteractive(self.auth_url,
                                                      self.code_verifier)
        return False
      else:  # Python 3
        _display_auth_instructions_with_print(self.auth_url, coda)
    elif _in_jupyter_shell():
      _display_auth_instructions_with_html(self.auth_url, coda)
    else:
      _display_auth_instructions_with_print(self.auth_url, coda)
    return True
