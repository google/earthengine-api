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
import shutil
import subprocess
import sys
from typing import Any, Dict, Optional, Sequence, Union
import urllib.error
import urllib.parse
import urllib.request
import webbrowser

import google.auth
from google.auth import _cloud_sdk
import google.auth.transport.requests

from ee import data as ee_data
from ee import ee_exception


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
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/devstorage.full_control'
]
REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'  # Prompts user to copy-paste code
TOKEN_URI = 'https://oauth2.googleapis.com/token'
AUTH_URI = 'https://accounts.google.com/o/oauth2/auth'

AUTH_PAGE_URL = 'https://code.earthengine.google.com/client-auth'
MODE_URL = AUTH_PAGE_URL + '/mode'
FETCH_URL = AUTH_PAGE_URL + '/fetch'
AUTH_URL_TEMPLATE = AUTH_PAGE_URL + '?scopes={scopes}' + (
    '&request_id={request_id}&tc={token_challenge}&cc={client_challenge}')

# Command to execute in gcloud mode
GCLOUD_COMMAND = 'gcloud auth application-default login'

DEFAULT_LOCAL_PORT = 8085
WAITING_CODA = 'Waiting for successful authorization from web browser ...'
PASTE_CODA = ('The authorization workflow will generate a code, which you'
              ' should paste in the box below.')

# Command-line browsers cannot handle the auth pages.
TEXT_BROWSERS = ['elinks', 'links', 'lynx', 'w3m', 'www-browser']
# Environment variables indicating valid compositors on Linux.
DISPLAY_VARIABLES = ['DISPLAY', 'WAYLAND_DISPLAY', 'MIR_SOCKET']
# Projects owned by Google SDKs, which do not have the EE API enabled.
SDK_PROJECTS = [
    '764086051850',
    '618104708054',
    '32555940559',
    '522309567947',
    '1014160490159',
    '1057398310658',
]


def get_credentials_path() -> str:
  cred_path = os.path.expanduser(
      '~/.config/earthengine/credentials',
  )
  return cred_path


def get_credentials_arguments() -> Dict[str, Any]:
  with open(get_credentials_path()) as creds:
    stored = json.load(creds)
    args = {}
    args['token_uri'] = TOKEN_URI  # Not overridable in file
    args['refresh_token'] = stored.get('refresh_token')
    args['client_id'] = stored.get('client_id', CLIENT_ID)
    args['client_secret'] = stored.get('client_secret', CLIENT_SECRET)
    args['scopes'] = stored.get('scopes', SCOPES)
    args['quota_project_id'] = stored.get('project')
    return args


def is_sdk_credentials(credentials: Optional[Any]) -> bool:
  client_id = credentials and getattr(credentials, 'client_id', None)
  return is_sdk_project(_project_number_from_client_id(client_id))


def is_sdk_project(project: str) -> bool:
  return project in SDK_PROJECTS


def get_appdefault_project() -> Optional[str]:
  try:
    adc_path = _cloud_sdk.get_application_default_credentials_path()
    with open(adc_path) as adc_json:
      adc = json.load(adc_json)
      return adc.get('quota_project_id')
  except FileNotFoundError:
    return None


def _valid_credentials_exist() -> bool:
  try:
    creds = ee_data.get_persistent_credentials()
    return is_valid_credentials(creds)
  except ee_exception.EEException:
    return False


def is_valid_credentials(credentials: Optional[Any]) -> bool:
  if credentials is None:
    return False
  try:
    credentials.refresh(google.auth.transport.requests.Request())
  except google.auth.exceptions.RefreshError:
    return False
  return True


def get_authorization_url(
    code_challenge: str,
    scopes: Optional[Sequence[str]] = None,
    redirect_uri: Optional[str] = None,
) -> str:
  """Returns a URL to generate an auth code."""

  return 'https://accounts.google.com/o/oauth2/auth?' + urllib.parse.urlencode({
      'client_id': CLIENT_ID,
      'scope': ' '.join(scopes or SCOPES),
      'redirect_uri': redirect_uri or REDIRECT_URI,
      'response_type': 'code',
      'code_challenge': code_challenge,
      'code_challenge_method': 'S256',
  })


def request_token(
    auth_code: str,
    code_verifier: str,
    client_id: Optional[str] = None,
    client_secret: Optional[str] = None,
    redirect_uri: Optional[str] = None,
) -> str:
  """Uses authorization code to request tokens."""

  request_args = {
      'code': auth_code,
      'client_id': client_id or CLIENT_ID,
      'client_secret': client_secret or CLIENT_SECRET,
      'redirect_uri': redirect_uri or REDIRECT_URI,
      'grant_type': 'authorization_code',
      'code_verifier': code_verifier,
  }

  try:
    response = urllib.request.urlopen(
        TOKEN_URI,
        urllib.parse.urlencode(request_args).encode()).read().decode()
  except urllib.error.HTTPError as e:
    # pylint:disable=broad-exception-raised,raise-missing-from
    raise Exception('Problem requesting tokens. Please try again.  %s %s' %
                    (e, e.read()))
    # pylint:enable=broad-exception-raised,raise-missing-from

  return json.loads(response)['refresh_token']


def write_private_json(json_path: str, info_dict: Dict[str, Any]) -> None:
  """Attempts to write the passed token to the given user directory."""

  dirname = os.path.dirname(json_path)
  try:
    os.makedirs(dirname)
  except OSError as e:
    if e.errno != errno.EEXIST:
      # pylint:disable=broad-exception-raised,raise-missing-from
      raise Exception('Error creating directory %s: %s' % (dirname, e))
      # pylint:enable=broad-exception-raised,raise-missing-from

  file_content = json.dumps(info_dict)
  if os.path.exists(json_path):
    # Remove file because os.open will not change permissions of existing files
    os.remove(json_path)
  with os.fdopen(
      os.open(json_path, os.O_WRONLY | os.O_CREAT, 0o600), 'w') as f:
    f.write(file_content)


def in_colab_shell() -> bool:
  """Tests if the code is being executed within Google Colab."""
  try:
    import google.colab  # pylint: disable=unused-import,redefined-outer-name
    return True
  except ImportError:
    return False


def _in_jupyter_shell() -> bool:
  """Tests if the code is being executed within Jupyter."""
  try:
    import ipykernel.zmqshell
    return isinstance(IPython.get_ipython(),
                      ipykernel.zmqshell.ZMQInteractiveShell)
  except ImportError:
    return False
  except NameError:
    return False


def _project_number_from_client_id(client_id: Optional[str]) -> Optional[str]:
  """Returns the project number associated with the given OAuth client ID."""
  # Client IDs are of the form:
  # PROJECTNUMBER-BASE32STUFF.apps.googleusercontent.com.
  substrings = (client_id or '').split('-')
  return substrings[0] if substrings else None


def _obtain_and_write_token(
    auth_code: Optional[str] = None,
    code_verifier: Optional[str] = None,
    scopes: Optional[Sequence[str]] = None,
    redirect_uri: Optional[str] = None,
) -> None:
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
  assert isinstance(auth_code, str)
  scopes = scopes or SCOPES
  if fetch_data:
    data = json.dumps(fetch_data).encode()
    headers = {'Content-Type': 'application/json; charset=UTF-8'}
    fetch_client = urllib.request.Request(FETCH_URL, data=data, headers=headers)
    fetched_info = json.loads(
        urllib.request.urlopen(fetch_client).read().decode())
    if 'error' in fetched_info:
      raise ee_exception.EEException(
          'Cannot authenticate: %s' % fetched_info['error']
      )
    client_info = {k: fetched_info[k] for k in ['client_id', 'client_secret']}
    scopes = fetched_info.get('scopes') or scopes
  token = request_token(auth_code.strip(), code_verifier, **client_info)
  client_info['refresh_token'] = token
  client_info['scopes'] = scopes
  project = _project_number_from_client_id(client_info.get('client_id'))
  if project:
    client_info['project'] = project
  write_private_json(get_credentials_path(), client_info)
  print('\nSuccessfully saved authorization token.')


def _display_auth_instructions_for_noninteractive(
    auth_url: str, code_verifier: Union[bytes, str]
) -> None:
  """Displays instructions for authenticating without blocking for user input."""
  # Python 3 `bytes` should be decoded to `str` if used as an argument of
  # `str.format()`.
  if isinstance(code_verifier, bytes):
    code_verifier_str = code_verifier.decode('utf-8', 'strict')
  else:
    code_verifier_str = code_verifier

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
            auth_url, code_verifier_str))


def _display_auth_instructions_with_print(
    auth_url: str, coda: Optional[str] = None
) -> None:
  """Displays instructions for authenticating using a print statement."""
  print('To authorize access needed by Earth Engine, open the following '
        'URL in a web browser and follow the instructions. If the web '
        'browser does not start automatically, please manually browse the '
        'URL below.\n'
        '\n'
        '    {0}\n'
        '\n{1}'.format(auth_url, coda or PASTE_CODA))


def _display_auth_instructions_with_html(
    auth_url: str, coda: Optional[str] = None
) -> None:
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


def _base64param(byte_string: bytes) -> bytes:
  """Encodes bytes for use as a URL parameter."""
  return base64.urlsafe_b64encode(byte_string).rstrip(b'=')


def _nonce_table(*nonce_keys: str) -> Dict[str, str]:
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


def _open_new_browser(url: str) -> bool:
  """Opens a web browser if possible, returning True when so."""
  try:
    browser = webbrowser.get()
    if hasattr(browser, 'name') and browser.name in TEXT_BROWSERS:
      return False
  except webbrowser.Error:
    return False
  if url:
    webbrowser.open_new(url)
  return True


def _localhost_is_viable() -> bool:
  valid_display = 'linux' not in sys.platform or any(
      os.environ.get(var) for var in DISPLAY_VARIABLES)
  return valid_display and _open_new_browser('')


def _no_gcloud() -> bool:
  return not shutil.which(GCLOUD_COMMAND.split()[0])


def _load_gcloud_credentials(
    scopes: Optional[Sequence[str]] = None,
    quiet: Optional[bool] = None,
    run_gcloud_legacy: bool = False,
) -> None:
  """Initializes credentials by running gcloud flows."""
  client_id_file = None
  command = GCLOUD_COMMAND.split()
  command[0] = shutil.which(command[0]) or command[0]  # Windows fix
  command += ['--scopes=%s' % (','.join(scopes or SCOPES))]
  if run_gcloud_legacy:
    client_id_json = dict(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        auth_uri=AUTH_URI,
        token_uri=TOKEN_URI)
    client_id_file = get_credentials_path() + '-client-id.json'
    write_private_json(client_id_file, dict(installed=client_id_json))
    command += ['--client-id-file=%s' % client_id_file]
    force_quiet = quiet is None and not _localhost_is_viable()
    command += ['--no-browser'] if quiet or force_quiet else []
  print('Fetching credentials using gcloud')
  more_info = '\nMore information: ' + (
      'https://developers.google.com/earth-engine/guides/auth\n')
  try:
    subprocess.run(command, check=True)
  except FileNotFoundError as e:
    tip = 'Please ensure that gcloud is installed.' + more_info
    raise Exception('gcloud command not found. ' + tip) from e  # pylint:disable=broad-exception-raised
  except subprocess.CalledProcessError as e:
    tip = ('Please check for any errors above.\n*Possible fixes:'
           ' If you loaded a page with a "redirect_uri_mismatch" error,'
           ' run earthengine authenticate with the --quiet flag;'
           ' if the error page says "invalid_request", be sure to run the'
           ' entire gcloud auth command that is shown.' + more_info)
    raise Exception('gcloud failed. ' + tip) from e  # pylint:disable=broad-exception-raised
  finally:
    if client_id_file:
      os.remove(client_id_file)
  adc_path = _cloud_sdk.get_application_default_credentials_path()
  with open(adc_path) as adc_json:
    adc = json.load(adc_json)
    adc = {k: adc[k] for k in ['client_id', 'client_secret', 'refresh_token']}
    write_private_json(get_credentials_path(), adc)
  print('\nSuccessfully saved authorization token.')


def _start_server(port: int):
  """Starts and returns a web server that handles the OAuth callback."""

  class Handler(http.server.BaseHTTPRequestHandler):
    """Handles the OAuth callback and reports a success page."""

    code: Optional[str] = None

    def do_GET(self) -> None:  # pylint: disable=invalid-name
      Handler.code = urllib.parse.parse_qs(
          urllib.parse.urlparse(self.path).query)['code'][0]
      self.send_response(200)
      self.send_header('Content-type', 'text/plain; charset=utf-8')
      self.end_headers()
      self.wfile.write(
          b'\n\nGoogle Earth Engine authorization successful!\n\n\n'
          b'Credentials have been retrieved.  Please close this window.\n\n'
          b'  \xf0\x9f\x8c\x8d  \xe2\x9a\x99\xef\xb8\x8f  \xf0\x9f\x8c\x8f'
          b'  \xe2\x9a\x99\xef\xb8\x8f  \xf0\x9f\x8c\x8e ')  # Earth emoji

    def log_message(self, *_) -> None:
      pass  # Suppresses the logging of request info to stderr.

  class Server:
    server: http.server.HTTPServer
    url: str

    def __init__(self) -> None:
      self.server = http.server.HTTPServer(('localhost', port), Handler)
      self.url = 'http://localhost:%s' % self.server.server_address[1]

    def fetch_code(self) -> Optional[str]:
      self.server.handle_request()  # Blocks until a single request arrives.
      self.server.server_close()
      return Handler.code

  return Server()


def authenticate(
    cli_authorization_code: Optional[str] = None,
    quiet: Optional[bool] = None,
    cli_code_verifier: Optional[str] = None,
    auth_mode: Optional[str] = None,
    scopes: Optional[Sequence[str]] = None,
    force: bool = False,
) -> Optional[bool]:
  """Prompts the user to authorize access to Earth Engine via OAuth2.

  Args:
    cli_authorization_code: An optional authorization code.  Supports CLI mode,
      where the code is passed as an argument to `earthengine authenticate`.
    quiet: If true, do not require interactive prompts and force --no-browser
      mode for gcloud-legacy. If false, never supply --no-browser. Default is
      None, which autodetects the --no-browser setting.
    cli_code_verifier: PKCE verifier to prevent auth code stealing.  Must be
      provided if cli_authorization_code is given.
    auth_mode: The authorization mode.  One of:
        "colab" - use the Colab authentication flow.
        "notebook" - send user to notebook authenticator page. Intended for
          web users who do not run code locally. Credentials expire in 7 days.
        "gcloud" - use gcloud to obtain credentials.
        "localhost" - sends credentials to the Python environment on the same
          localhost as the browser. Does not work for remote shells. Default
          port is 8085; use localhost:N set port or localhost:0 to auto-select.
        "gcloud-legacy" - use less convenient gcloud mode, for users without
          cloud projects.
        "appdefault" - included for legacy compatibility but not necessary.
          ee.Initialize() will always check for application default credentials.
        None - a default mode is chosen based on your environment.
   scopes: List of scopes to use for authorization. Defaults to [
     'https://www.googleapis.com/auth/earthengine',
     'https://www.googleapis.com/auth/devstorage.full_control' ].
   force: Will force authentication even if valid credentials already exist.

  Returns:
    True if we found valid credentials and didn't run the auth flow, or
    otherwise None.

  Raises:
     Exception: on invalid arguments.
  """

  if cli_authorization_code:
    _obtain_and_write_token(cli_authorization_code, cli_code_verifier, scopes)
    return

  if not force and _valid_credentials_exist():
    return True

  if not auth_mode:
    if in_colab_shell():
      auth_mode = 'colab'
    elif _in_jupyter_shell():
      auth_mode = 'notebook'
    elif _localhost_is_viable() and _no_gcloud():
      auth_mode = 'localhost'
    else:
      auth_mode = 'gcloud'

  if auth_mode in ['gcloud', 'gcloud-legacy']:
    _load_gcloud_credentials(scopes, quiet, auth_mode == 'gcloud-legacy')
    return

  if auth_mode == 'colab':
    from google.colab import auth  # pylint: disable=g-import-not-at-top # pytype: disable=import-error
    auth.authenticate_user()
    return

  if auth_mode == 'appdefault':
    print('appdefault no longer necessary: ee.Initialize() always checks ADC',
          file=sys.stderr)
    return

  flow = Flow(auth_mode, scopes)

  if flow.display_instructions(quiet):
    _open_new_browser(flow.auth_url)

  flow.save_code()


class Flow:
  """Holds state for auth flows."""
  code_verifier: str
  scopes: Sequence[str]
  server: Optional[Any]
  auth_url: str

  def __init__(
      self, auth_mode: str = 'notebook', scopes: Optional[Sequence[str]] = None
  ):
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
          scopes=urllib.parse.quote(' '.join(self.scopes)), **request_info)
      self.code_verifier = ':'.join(request_info[k] for k in nonces)
    else:
      # pylint:disable-next=broad-exception-raised
      raise ee_exception.EEException('Unknown auth_mode "%s"' % auth_mode)

  def save_code(self, code: Optional[str] = None) -> None:
    """Fetches auth code if not given, and saves the generated credentials."""
    redirect_uri = None
    if self.server and not code:
      redirect_uri = self.server.url
      code = self.server.fetch_code()  # Waits for oauth callback
    _obtain_and_write_token(code, self.code_verifier, self.scopes, redirect_uri)

  def display_instructions(self, quiet: Optional[bool] = None) -> bool:
    """Prints to stdout, and returns True if a browser should be opened."""

    if quiet:
      _display_auth_instructions_for_noninteractive(self.auth_url,
                                                    self.code_verifier)
      return True

    coda = WAITING_CODA if self.server else None
    if in_colab_shell():
      _display_auth_instructions_with_print(self.auth_url, coda)
    elif _in_jupyter_shell():
      _display_auth_instructions_with_html(self.auth_url, coda)
    else:
      _display_auth_instructions_with_print(self.auth_url, coda)
    return True
