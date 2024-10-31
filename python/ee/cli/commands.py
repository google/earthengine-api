"""Commands supported by the Earth Engine command line interface.

Each command is implemented by extending the Command class. Each class
defines the supported positional and optional arguments, as well as
the actions to be taken when the command is executed.
"""

import argparse
import calendar
import collections
import datetime
import json
import logging
import os
import re
import shutil
import sys
import tempfile
from typing import Any, Dict, List, Sequence, Tuple, Type, Union
import urllib.parse

# Prevent TensorFlow from logging anything at the native level.
# pylint: disable=g-import-not-at-top
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Suppress non-error logs while TF initializes
old_level = logging.getLogger().level
logging.getLogger().setLevel(logging.ERROR)

TENSORFLOW_INSTALLED = False

# pylint: disable=g-import-not-at-top
try:
  import tensorflow.compat.v1 as tf
  from tensorflow.compat.v1.saved_model import utils as saved_model_utils
  from tensorflow.compat.v1.saved_model import signature_constants
  from tensorflow.compat.v1.saved_model import signature_def_utils
  # This triggers a warning about disable_resource_variables
  tf.disable_v2_behavior()
  # Prevent TensorFlow from logging anything at the python level.
  tf.logging.set_verbosity(tf.logging.ERROR)

  TENSORFLOW_INSTALLED = True
except ImportError:
  pass
except TypeError:
  # The installed version of the protobuf package is incompatible with
  # Tensorflow. A type error is thrown when trying to generate proto
  # descriptors. Reinstalling Tensorflow should fix any dep versioning issues.
  pass
finally:
  logging.getLogger().setLevel(old_level)

TENSORFLOW_ADDONS_INSTALLED = False
# pylint: disable=g-import-not-at-top
if TENSORFLOW_INSTALLED:
  try:
    # This import is enough to register TFA ops though isn't directly used
    # (for now).
    # pylint: disable=unused-import
    import tensorflow_addons as tfa
    tfa.register_all(custom_kernels=False)  # pytype: disable=module-attr
    TENSORFLOW_ADDONS_INSTALLED = True
  except ImportError:
    pass
  except AttributeError:
    # This can be thrown by "tfa.register_all()" which means the
    # tensorflow_addons version is registering ops the old way, i.e.
    # automatically at import time. If this is the case, we've actually
    # successfully registered TFA.
    TENSORFLOW_ADDONS_INSTALLED = True

# pylint: disable=g-import-not-at-top, g-bad-import-order
import ee
from ee.cli import utils

# Constants used in ACLs.
ALL_USERS = 'allUsers'
ALL_USERS_CAN_READ = 'all_users_can_read'
READERS = 'readers'
WRITERS = 'writers'

# Constants used in setting metadata properties.
TYPE_DATE = 'date'
TYPE_NUMBER = 'number'
TYPE_STRING = 'string'
SYSTEM_TIME_START = 'system:time_start'
SYSTEM_TIME_END = 'system:time_end'

# A regex that parses properties of the form "[(type)]name=value".  The
# second, third, and fourth group are type, name, and number, respectively.
PROPERTY_RE = re.compile(r'(\(([^\)]*)\))?([^=]+)=(.*)')

# Translate internal task type identifiers to user-friendly strings that
# are consistent with the language in the API and docs.
TASK_TYPES = {
    'EXPORT_FEATURES': 'Export.table',
    'EXPORT_IMAGE': 'Export.image',
    'EXPORT_TILES': 'Export.map',
    'EXPORT_VIDEO': 'Export.video',
    'INGEST': 'Upload',
    'INGEST_IMAGE': 'Upload',
    'INGEST_TABLE': 'Upload',
}

TF_RECORD_EXTENSIONS = ['.tfrecord', 'tfrecord.gz']

# Maximum size of objects in a SavedModel directory that we're willing to
# download from GCS.
SAVED_MODEL_MAX_SIZE = 400 * 1024 * 1024

# Default path to SavedModel variables.
DEFAULT_VARIABLES_PREFIX = '/variables/variables'


def _add_wait_arg(parser: argparse.ArgumentParser) -> None:
  parser.add_argument(
      '--wait', '-w', nargs='?', default=-1, type=int, const=sys.maxsize,
      help=('Wait for the task to finish,'
            ' or timeout after the specified number of seconds.'
            ' Without this flag, the command just starts an export'
            ' task in the background, and returns immediately.'))


def _add_overwrite_arg(parser: argparse.ArgumentParser) -> None:
  parser.add_argument(
      '--force', '-f', action='store_true',
      help='Overwrite any existing version of the asset.')


def _upload(
    args: argparse.Namespace, request: Dict[str, Any], ingestion_function: Any
) -> None:
  if 0 <= args.wait < 10:
    raise ee.EEException('Wait time should be at least 10 seconds.')
  request_id = ee.data.newTaskId()[0]
  task_id = ingestion_function(request_id, request, args.force)['id']
  print('Started upload task with ID: %s' % task_id)
  if args.wait >= 0:
    print('Waiting for the upload task to complete...')
    utils.wait_for_task(task_id, args.wait)


# Argument types
def _comma_separated_strings(string: str) -> List[str]:
  """Parses an input consisting of comma-separated strings."""
  error_msg = 'Argument should be a comma-separated list of strings: {}'
  values = string.split(',')
  if not values:
    raise argparse.ArgumentTypeError(error_msg.format(string))
  return values


def _comma_separated_numbers(string: str) -> List[float]:
  """Parses an input consisting of comma-separated numbers."""
  error_msg = 'Argument should be a comma-separated list of numbers: {}'
  values = string.split(',')
  if not values:
    raise argparse.ArgumentTypeError(error_msg.format(string))
  numbervalues = []
  for value in values:
    try:
      numbervalues.append(int(value))
    except ValueError:
      try:
        numbervalues.append(float(value))
      except ValueError:
        # pylint: disable-next=raise-missing-from
        raise argparse.ArgumentTypeError(error_msg.format(string))
  return numbervalues


def _comma_separated_pyramiding_policies(string: str) -> List[str]:
  """Parses an input consisting of comma-separated pyramiding policies."""
  error_msg = ('Argument should be a comma-separated list of: '
               '{{"mean", "sample", "min", "max", "mode"}}: {}')
  values = string.split(',')
  if not values:
    raise argparse.ArgumentTypeError(error_msg.format(string))
  redvalues = []
  for value in values:
    value = value.upper()
    if value not in {'MEAN', 'SAMPLE', 'MIN', 'MAX', 'MODE', 'MEDIAN'}:
      raise argparse.ArgumentTypeError(error_msg.format(string))
    redvalues.append(value)
  return redvalues


def _decode_number(string: str) -> float:
  """Decodes a number from a command line argument."""
  try:
    return float(string)
  except ValueError:
    raise argparse.ArgumentTypeError(  # pylint: disable=raise-missing-from
        'Invalid value for property of type "number": "%s".' % string)


def _timestamp_ms_for_datetime(datetime_obj: datetime.datetime) -> int:
  """Returns time since the epoch in ms for the given UTC datetime object."""
  return (
      int(calendar.timegm(datetime_obj.timetuple()) * 1000) +
      datetime_obj.microsecond // 1000)


def _cloud_timestamp_for_timestamp_ms(timestamp_ms: float) -> str:
  """Returns a Cloud-formatted date for the given millisecond timestamp."""
  # Desired format is like '2003-09-07T19:30:12.345Z'
  return datetime.datetime.utcfromtimestamp(
      timestamp_ms / 1000.0).isoformat() + 'Z'


def _parse_millis(millis: float) -> datetime.datetime:
  return datetime.datetime.fromtimestamp(millis / 1000)


def _decode_date(string: str) -> Union[float, str]:
  """Decodes a date from a command line argument, returning msec since epoch".

  Args:
    string: See AssetSetCommand class comment for the allowable
      date formats.

  Returns:
    long, ms since epoch, or '' if the input is empty.

  Raises:
    argparse.ArgumentTypeError: if string does not conform to a legal
      date format.
  """
  if not string:
    return ''

  try:
    return int(string)
  except ValueError:
    date_formats = ['%Y-%m-%d',
                    '%Y-%m-%dT%H:%M:%S',
                    '%Y-%m-%dT%H:%M:%S.%f']
    for date_format in date_formats:
      try:
        dt = datetime.datetime.strptime(string, date_format)
        return _timestamp_ms_for_datetime(dt)
      except ValueError:
        continue
  raise argparse.ArgumentTypeError(
      'Invalid value for property of type "date": "%s".' % string)


def _decode_property(string: str) -> Tuple[str, Any]:
  """Decodes a general key-value property from a command-line argument.

  Args:
    string: The string must have the form name=value or (type)name=value, where
      type is one of 'number', 'string', or 'date'. The value format for dates
      is YYYY-MM-DD[THH:MM:SS[.MS]].  The value 'null' is special: it evaluates
      to None unless it is cast to a string of 'null'.

  Returns:
    a tuple representing the property in the format (name, value)

  Raises:
    argparse.ArgumentTypeError: if the flag value could not be decoded or if
    the type is not recognized
  """

  m = PROPERTY_RE.match(string)
  if not m:
    raise argparse.ArgumentTypeError(
        'Invalid property: "%s". Must have the form "name=value" or '
        '"(type)name=value".' % string)
  _, type_str, name, value_str = m.groups()
  if value_str == 'null' and type_str != TYPE_STRING:
    return (name, None)
  if type_str is None:
    # Guess numeric types automatically.
    try:
      value = _decode_number(value_str)
    except argparse.ArgumentTypeError:
      value = value_str
  elif type_str == TYPE_DATE:
    value = _decode_date(value_str)
  elif type_str == TYPE_NUMBER:
    value = _decode_number(value_str)
  elif type_str == TYPE_STRING:
    value = value_str
  else:
    raise argparse.ArgumentTypeError(
        'Unrecognized property type name: "%s". Expected one of "string", '
        '"number", or "date".' % type_str)
  return (name, value)


def _add_property_flags(parser: argparse.ArgumentParser) -> None:
  """Adds command line flags related to metadata properties to a parser."""
  parser.add_argument(
      '--property', '-p',
      help='A property to set, in the form [(type)]name=value. If no type '
      'is specified the type will be "number" if the value is numeric and '
      '"string" otherwise. May be provided multiple times.',
      action='append',
      type=_decode_property)
  parser.add_argument(
      '--time_start', '-ts',
      help='Sets the start time property to a number or date.',
      type=_decode_date)
  parser.add_argument(
      '--time_end', '-te',
      help='Sets the end time property to a number or date.',
      type=_decode_date)


def _decode_property_flags(args: argparse.Namespace) -> Dict[str, Any]:
  """Decodes metadata properties from args as a name->value dict."""
  property_list = list(args.property or [])
  names = [name for name, _ in property_list]
  duplicates = [
      name for name, count in collections.Counter(names).items() if count > 1]
  if duplicates:
    raise ee.EEException('Duplicate property name(s): %s.' % duplicates)
  return dict(property_list)


def _check_valid_files(filenames: Sequence[str]) -> None:
  """Returns true if the given filenames are valid upload file URIs."""
  for filename in filenames:
    if not filename.startswith('gs://'):
      raise ee.EEException('Invalid Cloud Storage URL: ' + filename)


def _pretty_print_json(json_obj: Any) -> None:
  """Pretty-prints a JSON object to standard output."""
  print(json.dumps(json_obj, sort_keys=True, indent=2, separators=(',', ': ')))


class Dispatcher:
  """Dispatches to a set of commands implemented as command classes."""
  COMMANDS: List[Any]
  command_dict: Dict[str, Any]
  dest: str
  name: str

  def __init__(self, parser: argparse.ArgumentParser):
    self.command_dict = {}
    self.dest = self.name + '_cmd'
    subparsers = parser.add_subparsers(title='Commands', dest=self.dest)
    subparsers.required = True  # Needed for proper missing arg handling in 3.x
    for command in self.COMMANDS:
      command_help = None
      if command.__doc__ and command.__doc__.splitlines():
        command_help = command.__doc__.splitlines()[0]
      subparser = subparsers.add_parser(
          command.name,
          description=command.__doc__,
          help=command_help)
      self.command_dict[command.name] = command(subparser)

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    self.command_dict[vars(args)[self.dest]].run(args, config)


class AuthenticateCommand:
  """Prompts the user to authorize access to Earth Engine via OAuth2.

  Note that running this command in the default interactive mode within
  JupyterLab with a bash magic command (i.e. "!earthengine authenticate") is
  problematic (see https://github.com/ipython/ipython/issues/10499). To avoid
  this issue, use the non-interactive mode
  (i.e. "!earthengine authenticate --quiet").
  """

  name = 'authenticate'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument(
        '--authorization-code',
        help='Use this specified authorization code.')
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='Do not prompt for input, run gcloud-legacy in no-browser mode.')
    parser.add_argument(
        '--code-verifier',
        help='PKCE verifier to prevent auth code stealing.')
    parser.add_argument(
        '--auth_mode',
        help='One of: notebook - use notebook authenticator; colab - use Colab'
        ' authenticator; gcloud / gcloud-legacy - use gcloud;'
        ' localhost[:PORT|:0] - use local browser')
    parser.add_argument(
        '--scopes', help='Optional comma-separated list of scopes.')
    parser.add_argument(
        '--force',
        action='store_true',
        help='Run authentication even if credentials already exist.')

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Prompts for an auth code, requests a token and saves it."""
    del config  # Unused

    # Filter for arguments relevant for ee.Authenticate()
    args_auth = {x: vars(args)[x] for x in (
        'authorization_code', 'quiet', 'code_verifier', 'auth_mode', 'force')}
    if args.scopes:
      args_auth['scopes'] = args.scopes.split(',')

    if ee.oauth.in_colab_shell():
      print(
          'Authenticate: Limited support in Colab. Use ee.Authenticate()'
          ' or --auth_mode=notebook instead.'
      )
      if not args.auth_mode:
        args_auth['auth_mode'] = 'notebook'

    if ee.Authenticate(**args_auth):
      print('Authenticate: Credentials already exist.  Use --force to refresh.')


class SetProjectCommand:
  """Sets the default user project to be used for all API calls."""

  name = 'set_project'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument('project', help='project id or number to use.')

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Saves the project to the config file."""

    config_path = config.config_file
    try:
      with open(config_path) as json_config_file:
        config = json.load(json_config_file)
    except FileNotFoundError:
      # File may not exist if we initialized from default credentials.
      config = {}

    config['project'] = args.project
    ee.oauth.write_private_json(config_path, config)
    print('Successfully saved project id')


class UnSetProjectCommand:
  """UnSets the default user project to be used for all API calls."""

  name = 'unset_project'

  def __init__(self, parser: argparse.ArgumentParser):
    del parser  # Unused.

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Saves the project to the config file."""
    del args  # Unused.

    config_path = config.config_file
    try:
      with open(config_path) as json_config_file:
        config = json.load(json_config_file)
    except FileNotFoundError:
      # File may not exist if we initialized from default credentials.
      config = {}

    if 'project' in config:
      del config['project']
    ee.oauth.write_private_json(config_path, config)
    print('Successfully unset project id')


class AclChCommand:
  """Changes the access control list for an asset.

  Each change specifies the email address of a user or group and,
  for additions, one of R or W corresponding to the read or write
  permissions to be granted, as in "user@domain.com:R". Use the
  special name "allUsers" to change whether all users can read the
  asset.
  """

  name = 'ch'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument('-u', action='append', metavar='user permission',
                        help='Add or modify a user\'s permission.')
    parser.add_argument('-d', action='append', metavar='remove user',
                        help='Remove all permissions for a user.')
    parser.add_argument('-g', action='append', metavar='group permission',
                        help='Add or modify a group\'s permission.')
    parser.add_argument('-dg', action='append', metavar='remove group',
                        help='Remove all permissions for a user.')
    parser.add_argument('asset_id', help='ID of the asset.')

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Performs an ACL update."""
    config.ee_init()
    permissions = self._parse_permissions(args)
    acl = ee.data.getAssetAcl(args.asset_id)
    self._apply_permissions(acl, permissions)
    ee.data.setAssetAcl(args.asset_id, json.dumps(acl))

  def _set_permission(
      self, permissions: Dict[str, str], grant: str, prefix: str
  ) -> None:
    """Sets the permission for a given user/group."""
    parts = grant.rsplit(':', 1)
    if len(parts) != 2 or parts[1] not in ['R', 'W']:
      raise ee.EEException('Invalid permission "%s".' % grant)
    user, role = parts
    prefixed_user = user
    if not self._is_all_users(user):
      prefixed_user = prefix + user
    if prefixed_user in permissions:
      raise ee.EEException('Multiple permission settings for "%s".' % user)
    if self._is_all_users(user) and role == 'W':
      raise ee.EEException('Cannot grant write permissions to all users.')
    permissions[prefixed_user] = role

  def _remove_permission(
      self, permissions: Dict[str, str], user: str, prefix: str
  ) -> None:
    """Removes permissions for a given user/group."""
    prefixed_user = user
    if not self._is_all_users(user):
      prefixed_user = prefix + user
    if prefixed_user in permissions:
      raise ee.EEException('Multiple permission settings for "%s".' % user)
    permissions[prefixed_user] = 'D'

  def _user_account_type(self, user: str) -> str:
    """Returns the appropriate account type for a user email."""

    # Here 'user' ends with ':R', ':W', or ':D', so we extract
    # just the username.
    if user.split(':')[0].endswith('.gserviceaccount.com'):
      return 'serviceAccount:'
    else:
      return 'user:'

  def _parse_permissions(self, args: argparse.Namespace) -> Dict[str, str]:
    """Decodes and sanity-checks the permissions in the arguments."""
    # A dictionary mapping from user ids to one of 'R', 'W', or 'D'.
    permissions = {}
    if args.u:
      for user in args.u:
        self._set_permission(permissions, user, self._user_account_type(user))
    if args.d:
      for user in args.d:
        self._remove_permission(
            permissions, user, self._user_account_type(user))
    if args.g:
      for group in args.g:
        self._set_permission(permissions, group, 'group:')
    if args.dg:
      for group in args.dg:
        self._remove_permission(permissions, group, 'group:')
    return permissions

  def _apply_permissions(
      self, acl: Dict[str, Union[bool, List[str]]], permissions: Dict[str, str]
  ) -> None:
    """Applies the given permission edits to the given acl."""
    for user, role in permissions.items():
      if self._is_all_users(user):
        acl[ALL_USERS_CAN_READ] = role == 'R'
      else:
        readers = acl[READERS]
        writers = acl[WRITERS]
        # Make pytype understand the types.
        assert isinstance(readers, list)
        assert isinstance(writers, list)

        if role == 'R':
          if user not in readers:
            readers.append(user)
          if user in writers:
            writers.remove(user)
        elif role == 'W':
          if user in readers:
            readers.remove(user)
          if user not in writers:
            writers.append(user)
        elif role == 'D':
          if user in readers:
            readers.remove(user)
          if user in writers:
            writers.remove(user)

  def _is_all_users(self, user: str) -> bool:
    """Determines if a user name represents the special "all users" entity."""
    # We previously used "AllUsers" as the magic string to denote that we wanted
    # to apply some permission to everyone. However, Google Cloud convention for
    # this concept is "allUsers". Because some people might be using one and
    # some the other, we do a case-insensitive comparison.
    return user.lower() == ALL_USERS.lower()


class AclGetCommand:
  """Prints the access control list for an asset."""

  name = 'get'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument('asset_id', help='ID of the asset.')

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    config.ee_init()
    acl = ee.data.getAssetAcl(args.asset_id)
    _pretty_print_json(acl)


class AclSetCommand:
  """Sets the access control list for an asset.

  The ACL may be the name of a canned ACL, or it may be the path to a
  file containing the output from "acl get". The recognized canned ACL
  names are "private", indicating that no users other than the owner
  have access, and "public", indicating that all users have read
  access. It is currently not possible to modify the owner ACL using
  this tool.
  """

  name = 'set'

  CANNED_ACLS = {
      'private': {
          READERS: [],
          WRITERS: [],
          ALL_USERS_CAN_READ: False,
      },
      'public': {
          READERS: [],
          WRITERS: [],
          ALL_USERS_CAN_READ: True,
      },
  }

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument('file_or_acl_name',
                        help='File path or canned ACL name.')
    parser.add_argument('asset_id', help='ID of the asset.')

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Sets asset ACL to a canned ACL or one provided in a JSON file."""
    config.ee_init()
    if args.file_or_acl_name in list(self.CANNED_ACLS.keys()):
      acl = self.CANNED_ACLS[args.file_or_acl_name]
    else:
      acl = json.load(open(args.file_or_acl_name))
    ee.data.setAssetAcl(args.asset_id, json.dumps(acl))


class AclCommand(Dispatcher):
  """Prints or updates the access control list of the specified asset."""

  name = 'acl'

  COMMANDS = [
      AclChCommand,
      AclGetCommand,
      AclSetCommand,
  ]


class AssetInfoCommand:
  """Prints metadata and other information about an Earth Engine asset."""

  name = 'info'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument('asset_id', help='ID of the asset to print.')

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    config.ee_init()
    info = ee.data.getInfo(args.asset_id)
    if info:
      _pretty_print_json(info)
    else:
      raise ee.EEException(
          'Asset does not exist or is not accessible: %s' % args.asset_id)


class AssetSetCommand:
  """Sets metadata properties of an Earth Engine asset.

  Properties may be of type "string", "number", or "date". Dates must
  be specified in the form YYYY-MM-DD[Thh:mm:ss[.ff]] in UTC and are
  stored as numbers representing the number of milliseconds since the
  Unix epoch (00:00:00 UTC on 1 January 1970).

  To delete a property, set it to null without a type:
     prop=null.
  To set a property to the string value 'null', use the assignment
     (string)prop4=null.
  """

  name = 'set'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument('asset_id', help='ID of the asset to update.')
    _add_property_flags(parser)

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Runs the asset update."""
    config.ee_init()
    properties = _decode_property_flags(args)
    if not properties and args.time_start is None and args.time_end is None:
      raise ee.EEException('No properties specified.')
    update_mask = [
        'properties.' + property_name for property_name in properties
    ]
    asset = {}
    if properties:
      asset['properties'] = {
          k: v for k, v in properties.items() if v is not None
      }
    # args.time_start and .time_end could have any of three falsy values, with
    # different meanings:
    # None: the --time_start flag was not provided at all
    # '': the --time_start flag was explicitly set to the empty string
    # 0: the --time_start flag was explicitly set to midnight 1 Jan 1970.
    # pylint:disable=g-explicit-bool-comparison
    if args.time_start is not None:
      update_mask.append('start_time')
      if args.time_start != '':
        asset['start_time'] = _cloud_timestamp_for_timestamp_ms(
            args.time_start)
    if args.time_end is not None:
      update_mask.append('end_time')
      if args.time_end != '':
        asset['end_time'] = _cloud_timestamp_for_timestamp_ms(args.time_end)
    # pylint:enable=g-explicit-bool-comparison
    ee.data.updateAsset(args.asset_id, asset, update_mask)
    return


class AssetCommand(Dispatcher):
  """Prints or updates metadata associated with an Earth Engine asset."""

  name = 'asset'

  COMMANDS = [
      AssetInfoCommand,
      AssetSetCommand,
  ]


class CopyCommand:
  """Creates a new Earth Engine asset as a copy of another asset."""

  name = 'cp'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument(
        'source', help='Full path of the source asset.')
    parser.add_argument(
        'destination', help='Full path of the destination asset.')
    _add_overwrite_arg(parser)

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Runs the asset copy."""
    config.ee_init()
    ee.data.copyAsset(
        args.source,
        args.destination,
        args.force
    )


class CreateCommandBase:
  """Base class for implementing Create subcommands."""

  def __init__(self, parser, fragment, asset_type):
    parser.add_argument(
        'asset_id', nargs='+',
        help='Full path of %s to create.' % fragment)
    parser.add_argument(
        '--parents', '-p', action='store_true',
        help='Make parent folders as needed.')
    self.asset_type = asset_type

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    config.ee_init()
    ee.data.create_assets(args.asset_id, self.asset_type, args.parents)


class CreateCollectionCommand(CreateCommandBase):
  """Creates one or more image collections."""

  name = 'collection'

  def __init__(self, parser: argparse.ArgumentParser):
    super().__init__(
        parser, 'an image collection', ee.data.ASSET_TYPE_IMAGE_COLL)


class CreateFolderCommand(CreateCommandBase):
  """Creates one or more folders."""

  name = 'folder'

  def __init__(self, parser: argparse.ArgumentParser):
    super().__init__(parser, 'a folder', ee.data.ASSET_TYPE_FOLDER)


class CreateCommand(Dispatcher):
  """Creates assets and folders."""

  name = 'create'

  COMMANDS = [
      CreateCollectionCommand,
      CreateFolderCommand,
  ]


class ListCommand:
  """Prints the contents of a folder or collection."""

  name = 'ls'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument(
        'asset_id', nargs='*',
        help='A folder or image collection to be inspected.')
    parser.add_argument(
        '--long_format',
        '-l',
        action='store_true',
        help='Print output in long format.')
    parser.add_argument(
        '--max_items', '-m', default=-1, type=int,
        help='Maximum number of items to list for each collection.')
    parser.add_argument(
        '--recursive',
        '-r',
        action='store_true',
        help='List folders recursively.')
    parser.add_argument(
        '--filter',
        '-f',
        default='',
        type=str,
        help=(
            'Filter string to use on a collection. Accepts property names'
            ' "start_time", "end_time", "update_time", and "properties.foo"'
            ' (where "foo" is any user-defined property). Example filter'
            ' strings: properties.SCENE_ID="ABC";'
            ' start_time>"2023-02-03T00:00:00+00:00"'
        ),
    )

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Runs the list command."""
    config.ee_init()
    if not args.asset_id:
      roots = ee.data.getAssetRoots()
      self._print_assets(roots, args.max_items, '', args.long_format,
                         args.recursive)
      return
    assets = args.asset_id
    count = 0
    for asset in assets:
      if count > 0:
        print()
      self._list_asset_content(
          asset, args.max_items, len(assets), args.long_format,
          args.recursive, args.filter)
      count += 1

  def _print_assets(self, assets, max_items, indent, long_format, recursive):
    """Prints the listing of given assets."""
    if not assets:
      return

    max_type_length = max([len(asset['type']) for asset in assets])

    if recursive:
      # fallback to max to include the string 'ImageCollection'
      max_type_length = ee.data.MAX_TYPE_LENGTH

    format_str = '%s{:%ds}{:s}' % (indent, max_type_length + 4)
    for asset in assets:
      if long_format:
        # Example output:
        # [Image]           user/test/my_img
        # [ImageCollection] user/test/my_coll
        print(format_str.format('['+asset['type']+']', asset['id']))

      else:
        print(asset['id'])

      if recursive and asset['type'] in (ee.data.ASSET_TYPE_FOLDER,
                                         ee.data.ASSET_TYPE_FOLDER_CLOUD):
        list_req = {'id': asset['id']}
        children = ee.data.getList(list_req)
        self._print_assets(children, max_items, indent, long_format, recursive)

  def _list_asset_content(self, asset, max_items, total_assets, long_format,
                          recursive, filter_string):
    """Prints the contents of an asset and its children."""
    try:
      list_req = {'id': asset}
      if max_items >= 0:
        list_req['num'] = max_items
      if filter_string:
        list_req['filter'] = filter_string
      children = ee.data.getList(list_req)
      indent = ''
      if total_assets > 1:
        print('%s:' % asset)
        indent = '  '
      self._print_assets(children, max_items, indent, long_format, recursive)
    except ee.EEException as e:
      print(e)


class SizeCommand:
  """Prints the size and names of all items in a given folder or collection."""

  name = 'du'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument(
        'asset_id',
        nargs='*',
        help='A folder or image collection to be inspected.')
    parser.add_argument(
        '--summarize', '-s', action='store_true',
        help='Display only a total.')

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Runs the du command."""
    config.ee_init()

    # Select all available asset roots if no asset ids are given.
    if not args.asset_id:
      assets = ee.data.getAssetRoots()
    else:
      assets = [ee.data.getInfo(asset) for asset in args.asset_id]

    # If args.summarize is True, list size+name for every leaf child asset,
    # and show totals for non-leaf children.
    # If args.summarize is False, print sizes of all children.
    for index, asset in enumerate(assets):
      if args.asset_id and not asset:
        asset_id = args.asset_id[index]
        print('Asset does not exist or is not accessible: %s' % asset_id)
        continue
      is_parent = asset['type'] in (
          ee.data.ASSET_TYPE_FOLDER,
          ee.data.ASSET_TYPE_IMAGE_COLL,
          ee.data.ASSET_TYPE_FOLDER_CLOUD,
          ee.data.ASSET_TYPE_IMAGE_COLL_CLOUD,
      )
      if not is_parent or args.summarize:
        self._print_size(asset)
      else:
        children = ee.data.getList({'id': asset['id']})
        if not children:
          # A leaf asset
          children = [asset]
        for child in children:
          self._print_size(child)

  def _print_size(self, asset):
    size = self._get_size(asset)
    print('{:>16d}   {}'.format(size, asset['id']))

  def _get_size(self, asset):
    """Returns the size of the given asset in bytes."""
    size_parsers = {
        'Image': self._get_size_asset,
        'Folder': self._get_size_folder,
        'ImageCollection': self._get_size_image_collection,
        'Table': self._get_size_asset,
        'IMAGE': self._get_size_asset,
        'FOLDER': self._get_size_folder,
        'IMAGE_COLLECTION': self._get_size_image_collection,
        'TABLE': self._get_size_asset,
    }

    if asset['type'] not in size_parsers:
      raise ee.EEException(
          'Cannot get size for asset type "%s"' % asset['type'])

    return size_parsers[asset['type']](asset)

  def _get_size_asset(self, asset):
    info = ee.data.getInfo(asset['id'])

    if 'sizeBytes' in info:
      return int(info['sizeBytes'])
    return info['properties']['system:asset_size']

  def _get_size_folder(self, asset):
    children = ee.data.getList({'id': asset['id']})
    sizes = [self._get_size(child) for child in children]

    return sum(sizes)

  def _get_size_image_collection(self, asset):
    images = ee.ImageCollection(asset['id'])
    return images.aggregate_sum('system:asset_size').getInfo()


class MoveCommand:
  """Moves or renames an Earth Engine asset."""

  name = 'mv'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument(
        'source', help='Full path of the source asset.')
    parser.add_argument(
        'destination', help='Full path of the destination asset.')

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    config.ee_init()
    ee.data.renameAsset(args.source, args.destination)


class RmCommand:
  """Deletes the specified assets."""

  name = 'rm'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument(
        'asset_id', nargs='+', help='Full path of an asset to delete.')
    parser.add_argument(
        '--recursive', '-r', action='store_true',
        help='Recursively delete child assets.')
    parser.add_argument(
        '--dry_run', action='store_true',
        help=('Perform a dry run of the delete operation. Does not '
              'delete any assets.'))
    parser.add_argument(
        '--verbose', '-v', action='store_true',
        help='Print the progress of the operation to the console.')

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    config.ee_init()
    for asset in args.asset_id:
      self._delete_asset(asset, args.recursive, args.verbose, args.dry_run)

  def _delete_asset(self, asset_id, recursive, verbose, dry_run):
    """Attempts to delete the specified asset or asset collection."""
    if recursive:
      info = ee.data.getInfo(asset_id)
      if info is None:
        print('Asset does not exist or is not accessible: %s' % asset_id)
        return
      if info['type'] in (ee.data.ASSET_TYPE_FOLDER,
                          ee.data.ASSET_TYPE_IMAGE_COLL,
                          ee.data.ASSET_TYPE_FOLDER_CLOUD,
                          ee.data.ASSET_TYPE_IMAGE_COLL_CLOUD):
        children = ee.data.getList({'id': asset_id})
        for child in children:
          self._delete_asset(child['id'], True, verbose, dry_run)
    if dry_run:
      print('[dry-run] Deleting asset: %s' % asset_id)
    else:
      if verbose:
        print('Deleting asset: %s' % asset_id)
      try:
        ee.data.deleteAsset(asset_id)
      except ee.EEException as e:
        print('Failed to delete %s. %s' % (asset_id, e))


class TaskCancelCommand:
  """Cancels a running task."""

  name = 'cancel'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument(
        'task_ids', nargs='+',
        help='IDs of one or more tasks to cancel,'
        ' or `all` to cancel all tasks.')

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Cancels a running task."""
    config.ee_init()
    cancel_all = args.task_ids == ['all']
    if cancel_all:
      statuses = ee.data.getTaskList()
    else:
      statuses = ee.data.getTaskStatus(args.task_ids)
    for status in statuses:
      state = status['state']
      task_id = status['id']
      if state == 'UNKNOWN':
        raise ee.EEException('Unknown task id "%s"' % task_id)
      elif state == 'READY' or state == 'RUNNING':
        print('Canceling task "%s"' % task_id)
        ee.data.cancelTask(task_id)
      elif not cancel_all:
        print('Task "%s" already in state "%s".' % (status['id'], state))


class TaskInfoCommand:
  """Prints information about a task."""

  name = 'info'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument('task_id', nargs='*', help='ID of a task to get.')

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Runs the TaskInfo command."""
    config.ee_init()
    for i, status in enumerate(ee.data.getTaskStatus(args.task_id)):
      if i:
        print()
      print('%s:' % status['id'])
      print('  State: %s' % status['state'])
      if status['state'] == 'UNKNOWN':
        continue
      print('  Type: %s' % TASK_TYPES.get(status.get('task_type'), 'Unknown'))
      print('  Description: %s' % status.get('description'))
      print('  Created: %s' % _parse_millis(status['creation_timestamp_ms']))
      if 'start_timestamp_ms' in status:
        print('  Started: %s' % _parse_millis(status['start_timestamp_ms']))
      if 'update_timestamp_ms' in status:
        print('  Updated: %s' % _parse_millis(status['update_timestamp_ms']))
      if 'error_message' in status:
        print('  Error: %s' % status['error_message'])
      if 'destination_uris' in status:
        print('  Destination URIs: %s' % ', '.join(status['destination_uris']))
      if 'priority' in status:
        print('  Priority: %s' % status['priority'])


class TaskListCommand:
  """Lists the tasks submitted recently."""

  name = 'list'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument(
        '--status', '-s', required=False, nargs='*',
        choices=['READY', 'RUNNING', 'COMPLETED', 'FAILED',
                 'CANCELLED', 'UNKNOWN'],
        help=('List tasks only with a given status'))
    parser.add_argument(
        '--long_format',
        '-l',
        action='store_true',
        help=('Print output in long format. Extra columns are: creation time, '
              'start time, update time, EECU-seconds, output URLs, priority.')
    )

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Lists tasks present for a user, maybe filtering by state."""
    config.ee_init()
    status = args.status
    tasks = ee.data.getTaskList()
    descs = [utils.truncate(task.get('description', ''), 40) for task in tasks]
    desc_length = max((len(word) for word in descs), default=0)
    format_str = '{:25s} {:13s} {:%ds} {:10s} {:s}' % (desc_length + 1)
    for task in tasks:
      if status and task['state'] not in status:
        continue
      truncated_desc = utils.truncate(task.get('description', ''), 40)
      task_type = TASK_TYPES.get(task['task_type'], 'Unknown')
      extra = ''
      if args.long_format:
        show_date = lambda ms: _parse_millis(ms).strftime('%Y-%m-%d %H:%M:%S')
        eecu = '{:.4f}'.format(
            task['batch_eecu_usage_seconds']
        ) if 'batch_eecu_usage_seconds' in task else '-'
        trailing_extras = task.get('destination_uris', [])
        trailing_extras.append(task.get('priority', '-'))
        extra = ' {:20s} {:20s} {:20s} {:11s} {}'.format(
            show_date(task['creation_timestamp_ms']),
            show_date(task['start_timestamp_ms']),
            show_date(task['update_timestamp_ms']),
            eecu,
            ' '.join(map(str, trailing_extras)),
        )
      print(format_str.format(
          task['id'], task_type, truncated_desc,
          task['state'], task.get('error_message', '---')) + extra)


class TaskWaitCommand:
  """Waits for the specified task or tasks to complete."""

  name = 'wait'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument(
        '--timeout', '-t', default=sys.maxsize, type=int,
        help=('Stop waiting for the task(s) to finish after the specified,'
              ' number of seconds. Without this flag, the command will wait'
              ' indefinitely.'))
    parser.add_argument('--verbose', '-v', action='store_true',
                        help=('Print periodic status messages for each'
                              ' incomplete task.'))
    parser.add_argument('task_ids', nargs='+',
                        help=('Either a list of one or more currently-running'
                              ' task ids to wait on; or \'all\' to wait on all'
                              ' running tasks.'))

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Waits on the given tasks to complete or for a timeout to pass."""
    config.ee_init()
    task_ids = []
    if args.task_ids == ['all']:
      tasks = ee.data.getTaskList()
      for task in tasks:
        if task['state'] not in utils.TASK_FINISHED_STATES:
          task_ids.append(task['id'])
    else:
      statuses = ee.data.getTaskStatus(args.task_ids)
      for status in statuses:
        state = status['state']
        task_id = status['id']
        if state == 'UNKNOWN':
          raise ee.EEException('Unknown task id "%s"' % task_id)
        else:
          task_ids.append(task_id)

    utils.wait_for_tasks(task_ids, args.timeout, log_progress=args.verbose)


def _using_v1alpha(func):
  """Decorator that temporarily switches over to the v1alpha API."""

  def inner(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    # pylint: disable=protected-access
    original = ee._cloud_api_utils.VERSION
    ee._cloud_api_utils.VERSION = 'v1alpha'
    func(self, args, config)
    ee._cloud_api_utils.VERSION = original
    # pylint: enable=protected-access

  return inner


class TaskCommand(Dispatcher):
  """Prints information about or manages long-running tasks."""

  name = 'task'

  COMMANDS = [
      TaskCancelCommand,
      TaskInfoCommand,
      TaskListCommand,
      TaskWaitCommand,
  ]


# TODO(user): in both upload tasks, check if the parent namespace
# exists and is writeable first.
class UploadImageCommand:
  """Uploads an image from Cloud Storage to Earth Engine.

  See docs for "asset set" for additional details on how to specify asset
  metadata properties.
  """

  name = 'image'

  def __init__(self, parser: argparse.ArgumentParser):
    _add_wait_arg(parser)
    _add_overwrite_arg(parser)
    parser.add_argument(
        'src_files',
        help=('Cloud Storage URL(s) of the file(s) to upload. '
        'Must have the prefix \'gs://\'.'),
        nargs='*')
    parser.add_argument(
        '--asset_id',
        help='Destination asset ID for the uploaded file.')
    parser.add_argument(
        '--last_band_alpha',
        help='Use the last band as a masking channel for all bands. '
             'Mutually exclusive with nodata_value.',
        action='store_true')
    parser.add_argument(
        '--nodata_value',
        help='Value for missing data. '
             'Mutually exclusive with last_band_alpha.',
        type=_comma_separated_numbers)
    parser.add_argument(
        '--pyramiding_policy',
        help='The pyramid reduction policy to use',
        type=_comma_separated_pyramiding_policies)
    parser.add_argument(
        '--bands',
        help='Comma-separated list of names to use for the image bands.',
        type=_comma_separated_strings)
    parser.add_argument(
        '--crs',
        help='The coordinate reference system, to override the map projection '
             'of the image. May be either a well-known authority code (e.g. '
             'EPSG:4326) or a WKT string.')
    parser.add_argument(
        '--manifest',
        help='Local path to a JSON asset manifest file. No other flags are '
        'used if this flag is set.')
    _add_property_flags(parser)

  def _check_num_bands(self, bands, num_bands, flag_name):
    """Checks the number of bands, creating them if there are none yet."""
    if bands:
      if len(bands) != num_bands:
        raise ValueError(
            'Inconsistent number of bands in --{}: expected {} but found {}.'
            .format(flag_name, len(bands), num_bands))
    else:
      bands = ['b%d' % (i + 1) for i in range(num_bands)]
    return bands

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Starts the upload task, and waits for completion if requested."""
    config.ee_init()
    manifest = self.manifest_from_args(args)
    _upload(args, manifest, ee.data.startIngestion)

  def manifest_from_args(self, args: argparse.Namespace) -> Dict[str, Any]:
    """Constructs an upload manifest from the command-line flags."""

    def is_tf_record(path: str) -> bool:
      return any(
          path.lower().endswith(extension) for extension in TF_RECORD_EXTENSIONS
      )

    if args.manifest:
      with open(args.manifest) as fh:
        return json.loads(fh.read())

    if not args.asset_id:
      raise ValueError('Flag --asset_id must be set.')

    _check_valid_files(args.src_files)
    if args.last_band_alpha and args.nodata_value:
      raise ValueError(
          'last_band_alpha and nodata_value are mutually exclusive.')

    properties = _decode_property_flags(args)
    source_files = list(utils.expand_gcs_wildcards(args.src_files))
    if not source_files:
      raise ValueError('At least one file must be specified.')

    bands = args.bands
    if args.pyramiding_policy and len(args.pyramiding_policy) != 1:
      bands = self._check_num_bands(bands, len(args.pyramiding_policy),
                                    'pyramiding_policy')
    if args.nodata_value and len(args.nodata_value) != 1:
      bands = self._check_num_bands(bands, len(args.nodata_value),
                                    'nodata_value')

    args.asset_id = ee.data.convert_asset_id_to_asset_name(args.asset_id)
    # If we are ingesting a tfrecord, we actually treat the inputs as one
    # source and many uris.
    if any(is_tf_record(source) for source in source_files):
      tileset = {'id': 'ts', 'sources': [{'uris': list(source_files)}]}
    else:
      tileset = {
          'id': 'ts',
          'sources': [{'uris': [source]} for source in source_files]
      }
    if args.crs:
      tileset['crs'] = args.crs
    manifest = {
        'name': args.asset_id,
        'properties': properties,
        'tilesets': [tileset]
    }
    # pylint:disable=g-explicit-bool-comparison
    if args.time_start is not None and args.time_start != '':
      manifest['start_time'] = _cloud_timestamp_for_timestamp_ms(
          args.time_start)
    if args.time_end is not None and args.time_end != '':
      manifest['end_time'] = _cloud_timestamp_for_timestamp_ms(args.time_end)
    # pylint:enable=g-explicit-bool-comparison

    if bands:
      file_bands = []
      for i, band in enumerate(bands):
        file_bands.append({
            'id': band,
            'tilesetId': tileset['id'],
            'tilesetBandIndex': i
        })
      manifest['bands'] = file_bands

    if args.pyramiding_policy:
      if len(args.pyramiding_policy) == 1:
        manifest['pyramidingPolicy'] = args.pyramiding_policy[0]
      else:
        for index, policy in enumerate(args.pyramiding_policy):
          file_bands[index]['pyramidingPolicy'] = policy

    if args.nodata_value:
      if len(args.nodata_value) == 1:
        manifest['missingData'] = {'values': [args.nodata_value[0]]}
      else:
        for index, value in enumerate(args.nodata_value):
          file_bands[index]['missingData'] = {'values': [value]}

    if args.last_band_alpha:
      manifest['maskBands'] = {'tilesetId': tileset['id']}

    return manifest


# TODO(user): update src_files help string when secondary files
# can be uploaded.
class UploadTableCommand:
  """Uploads a table from Cloud Storage to Earth Engine."""

  name = 'table'

  def __init__(self, parser: argparse.ArgumentParser):
    _add_wait_arg(parser)
    _add_overwrite_arg(parser)
    parser.add_argument(
        'src_file',
        help=('Cloud Storage URL of the .csv, .tfrecord, .shp, or '
        '.zip file to upload. Must have the prefix \'gs://\'. For '
        '.shp files, related .dbf, .shx, and .prj files must be '
        'present in the same location.'),
        nargs='*')
    parser.add_argument(
        '--asset_id',
        help='Destination asset ID for the uploaded file.')
    _add_property_flags(parser)
    parser.add_argument(
        '--charset',
        help=(
            'The name of the charset to use for decoding strings. If not '
            'given, the charset "UTF-8" is assumed by default.'
        ),
        type=str,
        nargs='?',
    )
    parser.add_argument(
        '--max_error',
        help='Max allowed error in meters when transforming geometry '
             'between coordinate systems.',
        type=float, nargs='?')
    parser.add_argument(
        '--max_vertices',
        help='Max number of vertices per geometry. If set, geometry will be '
             'subdivided into spatially disjoint pieces each under this limit.',
        type=int, nargs='?')
    parser.add_argument(
        '--max_failed_features',
        help='The maximum number of failed features to allow during ingestion.',
        type=int, nargs='?')
    parser.add_argument(
        '--crs',
        help='The default CRS code or WKT string specifying the coordinate '
             'reference system of any geometry without one. If unspecified, '
             'the default will be EPSG:4326 (https://epsg.io/4326). For '
             'CSV/TFRecord only.')
    parser.add_argument(
        '--geodesic',
        help='The default strategy for interpreting edges in geometries that '
             'do not have one specified. If false, edges are '
             'straight in the projection. If true, edges are curved to follow '
             'the shortest path on the surface of the Earth. When '
             'unspecified, defaults to false if \'crs\' is a projected '
             'coordinate system. For CSV/TFRecord only.',
        action='store_true')
    parser.add_argument(
        '--primary_geometry_column',
        help='The geometry column to use as a row\'s primary geometry when '
             'there is more than one geometry column. If unspecified and more '
             'than one geometry column exists, the first geometry column '
             'is used. For CSV/TFRecord only.')
    parser.add_argument(
        '--x_column',
        help='The name of the numeric x coordinate column for constructing '
             'point geometries. If the y_column is also specified, and both '
             'columns contain numerical values, then a point geometry column '
             'will be constructed with x,y values in the coordinate system '
             'given in \'--crs\'. If unspecified and \'--crs\' does _not_ '
             'specify a projected coordinate system, defaults to "longitude". '
             'If unspecified and \'--crs\' _does_ specify a projected '
             'coordinate system, defaults to "" and no point geometry is '
             'generated. A generated point geometry column will be named '
             '{x_column}_{y_column}_N where N might be appended to '
             'disambiguate the column name. For CSV/TFRecord only.')
    parser.add_argument(
        '--y_column',
        help='The name of the numeric y coordinate column for constructing '
             'point geometries. If the x_column is also specified, and both '
             'columns contain numerical values, then a point geometry column '
             'will be constructed with x,y values in the coordinate system '
             'given in \'--crs\'. If unspecified and \'--crs\' does _not_ '
             'specify a projected coordinate system, defaults to "latitude". '
             'If unspecified and \'--crs\' _does_ specify a projected '
             'coordinate system, defaults to "" and no point geometry is '
             'generated. A generated point geometry column will be named '
             '{x_column}_{y_column}_N where N might be appended to '
             'disambiguate the column name. For CSV/TFRecord only.')
    # pylint: disable=line-too-long
    parser.add_argument(
        '--date_format',
        help='A format used to parse dates. The format pattern must follow '
             'http://joda-time.sourceforge.net/apidocs/org/joda/time/format/DateTimeFormat.html. '
             'If unspecified, dates will be imported as strings. For '
             'CSV/TFRecord only.')
    # pylint: enable=line-too-long
    parser.add_argument(
        '--csv_delimiter',
        help='A single character used as a delimiter between column values '
             'in a row. If unspecified, defaults to \',\'. For CSV only.')
    parser.add_argument(
        '--csv_qualifier',
        help='A character that surrounds column values (a.k.a. '
             '\'quote character\'). If unspecified, defaults to \'"\'. A '
             'column value may include the qualifier as a literal character by '
             'having 2 consecutive qualifier characters. For CSV only.')
    parser.add_argument(
        '--manifest',
        help='Local path to a JSON asset manifest file. No other flags are '
        'used if this flag is set.')

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Starts the upload task, and waits for completion if requested."""
    config.ee_init()
    manifest = self.manifest_from_args(args)
    _upload(args, manifest, ee.data.startTableIngestion)

  def manifest_from_args(self, args: argparse.Namespace) -> Any:
    """Constructs an upload manifest from the command-line flags."""

    if args.manifest:
      with open(args.manifest) as fh:
        return json.loads(fh.read())

    if not args.asset_id:
      raise ValueError('Flag --asset_id must be set.')

    _check_valid_files(args.src_file)
    source_files = list(utils.expand_gcs_wildcards(args.src_file))
    if len(source_files) != 1:
      raise ValueError('Exactly one file must be specified.')

    properties = _decode_property_flags(args)
    args.asset_id = ee.data.convert_asset_id_to_asset_name(args.asset_id)
    source = {'uris': source_files}
    if args.charset:
      source['charset'] = args.charset
    if args.max_error:
      source['maxErrorMeters'] = args.max_error
    if args.max_vertices:
      source['maxVertices'] = args.max_vertices
    if args.max_failed_features:
      raise ee.EEException(
          '--max_failed_features is not supported with the Cloud API')
    if args.crs:
      source['crs'] = args.crs
    if args.geodesic:
      source['geodesic'] = args.geodesic
    if args.primary_geometry_column:
      source['primary_geometry_column'] = args.primary_geometry_column
    if args.x_column:
      source['x_column'] = args.x_column
    if args.y_column:
      source['y_column'] = args.y_column
    if args.date_format:
      source['date_format'] = args.date_format
    if args.csv_delimiter:
      source['csv_delimiter'] = args.csv_delimiter
    if args.csv_qualifier:
      source['csv_qualifier'] = args.csv_qualifier

    manifest = {
        'name': args.asset_id,
        'sources': [source],
        'properties': properties
    }

    # pylint:disable=g-explicit-bool-comparison
    if args.time_start is not None and args.time_start != '':
      manifest['start_time'] = _cloud_timestamp_for_timestamp_ms(
          args.time_start)
    if args.time_end is not None and args.time_end != '':
      manifest['end_time'] = _cloud_timestamp_for_timestamp_ms(args.time_end)
    # pylint:enable=g-explicit-bool-comparison
    return manifest


class UploadCommand(Dispatcher):
  """Uploads assets to Earth Engine."""

  name = 'upload'

  COMMANDS = [
      UploadImageCommand,
      UploadTableCommand,
  ]


class _UploadManifestBase:
  """Uploads an asset to Earth Engine using the given manifest file."""

  def __init__(self, parser: argparse.ArgumentParser):
    _add_wait_arg(parser)
    _add_overwrite_arg(parser)
    parser.add_argument(
        'manifest',
        help=('Local path to a JSON asset manifest file.'))

  def run(self, args: argparse.Namespace, config, ingestion_function) -> None:
    """Starts the upload task, and waits for completion if requested."""
    config.ee_init()
    with open(args.manifest) as fh:
      manifest = json.loads(fh.read())

    _upload(args, manifest, ingestion_function)


class UploadImageManifestCommand(_UploadManifestBase):
  """Uploads an image to Earth Engine using the given manifest file."""

  name = 'upload_manifest'

  # pytype: disable=signature-mismatch
  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    # pytype: enable=signature-mismatch
    """Starts the upload task, and waits for completion if requested."""
    print(
        'This command is deprecated. '
        'Use "earthengine upload image --manifest".'
    )
    super().run(args, config, ee.data.startIngestion)


class UploadTableManifestCommand(_UploadManifestBase):
  """Uploads a table to Earth Engine using the given manifest file."""

  name = 'upload_table_manifest'

  # pytype: disable=signature-mismatch
  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    # pytype: enable=signature-mismatch
    print(
        'This command is deprecated. '
        'Use "earthengine upload table --manifest".'
    )
    super().run(args, config, ee.data.startTableIngestion)


def _get_nodes(node_spec, source_flag_name):
  """Extract a node mapping from a list or flag-specified JSON."""
  try:
    spec = json.loads(node_spec)
  except ValueError:
    spec = [n.strip() for n in node_spec.split(',')]
    return {item: item for item in spec}

  if not isinstance(spec, dict):
    raise ValueError(
        'If flag {} is JSON it must specify a dictionary.'.format(
            source_flag_name))

  for k, v in spec.items():
    if (not isinstance(k, str) or not isinstance(v, str)):
      raise ValueError(
          'All key/value pairs of the dictionary specified in ' +
          f'{source_flag_name} must be strings.')

  return spec


def _validate_and_extract_nodes(args):
  """Validate command line args and extract in/out node mappings."""
  if not args.source_dir:
    raise ValueError('Flag --source_dir must be set.')
  if not args.dest_dir:
    raise ValueError('Flag --dest_dir must be set.')
  if not args.input:
    raise ValueError('Flag --input must be set.')
  if not args.output:
    raise ValueError('Flag --output must be set.')

  return (_get_nodes(args.input, '--input'),
          _get_nodes(args.output, '--output'))


def _encode_op(output_tensor, name):
  return tf.identity(
      tf.map_fn(lambda x: tf.io.encode_base64(tf.serialize_tensor(x)),
                output_tensor, tf.string),
      name=name)


def _decode_op(input_tensor, dtype):
  mapped = tf.map_fn(lambda x: tf.parse_tensor(tf.io.decode_base64(x), dtype),
                     input_tensor, dtype)
  return mapped


def _strip_index(edge_name):
  colon_pos = edge_name.rfind(':')
  if colon_pos == -1:
    return edge_name
  else:
    return edge_name[:colon_pos]


def _get_input_tensor_spec(graph_def, input_names_set):
  """Extracts the types of the given node names from the GraphDef."""

  # Get the op names stripped of the input index, e.g. "op:0" becomes "op".
  input_names_missing_index = {_strip_index(i): i for i in input_names_set}

  spec = {}
  for cur_node in graph_def.node:
    if cur_node.name in input_names_missing_index:
      if 'shape' not in cur_node.attr or 'dtype' not in cur_node.attr:
        raise ValueError(
            'Specified input op is not a valid graph input: \'{}\'.'.format(
                cur_node.name))

      spec[input_names_missing_index[cur_node.name]] = tf.dtypes.DType(
          cur_node.attr['dtype'].type)

  if len(spec) != len(input_names_set):
    raise ValueError(
        'Specified input ops were missing from graph: {}.'.format(
            list(set(input_names_set).difference(list(spec.keys())))))
  return spec


def _make_rpc_friendly(model_dir, tag, in_map, out_map, vars_path):
  """Wraps a SavedModel in EE RPC-friendly ops and saves a temporary copy."""
  out_dir = tempfile.mkdtemp()
  builder = tf.saved_model.Builder(out_dir)

  # Get a GraphDef from the saved model
  with tf.Session() as sesh:
    meta_graph = tf.saved_model.load(sesh, [tag], model_dir)

  graph_def = meta_graph.graph_def

  # Purge the default graph immediately after: we want to remap parts of the
  # graph when we load it and we don't know what those parts are yet.
  tf.reset_default_graph()

  input_op_keys = list(in_map.keys())
  input_new_keys = list(in_map.values())

  # Get the shape and type of the input tensors
  in_op_types = _get_input_tensor_spec(graph_def, input_op_keys)

  # Create new input placeholders to receive RPC TensorProto payloads
  in_op_map = {
      k: tf.placeholder(
          tf.string, shape=[None], name='earthengine_in_{}'.format(i))
      for (i, k) in enumerate(input_new_keys)
  }

  # Glue on decoding ops to remap to the imported graph.
  decoded_op_map = {
      k: _decode_op(in_op_map[in_map[k]], in_op_types[k])
      for k in input_op_keys
  }

  # Okay now we're ready to import the graph again but remapped.
  saver = tf.train.import_meta_graph(
      meta_graph_or_file=meta_graph, input_map=decoded_op_map)

  # Boilerplate to build a signature def for our new graph
  sig_in = {
      _strip_index(k):
      saved_model_utils.build_tensor_info(v) for (k, v) in in_op_map.items()
  }

  sig_out = {}
  for index, (k, v) in enumerate(out_map.items()):
    out_tensor = saved_model_utils.build_tensor_info(
        _encode_op(
            tf.get_default_graph().get_tensor_by_name(k),
            name='earthengine_out_{}'.format(index)))

    sig_out[_strip_index(v)] = out_tensor

  sig_def = signature_def_utils.build_signature_def(
      sig_in, sig_out, signature_constants.PREDICT_METHOD_NAME)

  # Open a new session to load the variables and add them to the builder.
  with tf.Session() as sesh:
    if saver:
      saver.restore(sesh, model_dir + vars_path)
    builder.add_meta_graph_and_variables(
        sesh,
        tags=[tf.saved_model.tag_constants.SERVING],
        signature_def_map={
            signature_constants.DEFAULT_SERVING_SIGNATURE_DEF_KEY: sig_def
        },
        saver=saver)

  builder.save()
  return out_dir


class PrepareModelCommand:
  """Prepares a TensorFlow/Keras SavedModel for inference with Earth Engine.

  This is required only if a model is manually uploaded to Cloud AI Platform
  (https://cloud.google.com/ai-platform/) for predictions.
  """

  name = 'prepare'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument(
        '--source_dir',
        help='The local or Cloud Storage path to directory containing the '
        'SavedModel.')
    parser.add_argument(
        '--dest_dir',
        help='The name of the directory to be created locally or in Cloud '
        'Storage that will contain the Earth Engine ready SavedModel.')
    parser.add_argument(
        '--input',
        help='A comma-delimited list of input node names that will map to '
        'Earth Engine Feature columns or Image bands for prediction, or a JSON '
        'dictionary specifying a remapping of input node names to names '
        'mapping to Feature columns or Image bands etc... (e.x: '
        '\'{"Conv2D:0":"my_landsat_band"}\'). The names of model inputs will '
        'be stripped of any trailing \'<:prefix>\'.')
    parser.add_argument(
        '--output',
        help='A comma-delimited list of output tensor names that will map to '
        'Earth Engine Feature columns or Image bands for prediction, or a JSON '
        'dictionary specifying a remapping of output node names to names '
        'mapping to Feature columns or Image bands etc... (e.x: '
        '\'{"Sigmoid:0":"my_predicted_class"}\'). The names of model outputs '
        'will be stripped of any trailing \'<:prefix>\'.')
    parser.add_argument(
        '--tag',
        help='An optional tag used to load a specific graph from the '
        'SavedModel. Defaults to \'serve\'.')
    parser.add_argument(
        '--variables',
        help='An optional relative path from within the source directory to '
        'the prefix of the model variables. (e.x: if the model variables are '
        'stored under \'model_dir/variables/x.*\', set '
        '--variables=/variables/x). Defaults to \'/variables/variables\'.')

  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    """Wraps a SavedModel in EE RPC-friendly ops and saves a copy of it."""
    check_tensorflow_installed()

    in_spec, out_spec = _validate_and_extract_nodes(args)
    gcs_client = None

    if utils.is_gcs_path(args.source_dir):
      # If the model isn't locally available, we have to make it available...
      gcs_client = config.create_gcs_helper()
      gcs_client.check_gcs_dir_within_size(args.source_dir,
                                           SAVED_MODEL_MAX_SIZE)
      local_model_dir = gcs_client.download_dir_to_temp(args.source_dir)
    else:
      local_model_dir = args.source_dir

    tag = args.tag if args.tag else tf.saved_model.tag_constants.SERVING
    vars_path = args.variables if args.variables else DEFAULT_VARIABLES_PREFIX
    new_model_dir = _make_rpc_friendly(
        local_model_dir, tag, in_spec, out_spec, vars_path)

    if utils.is_gcs_path(args.dest_dir):
      if not gcs_client:
        gcs_client = config.create_gcs_helper()
      gcs_client.upload_dir_to_bucket(new_model_dir, args.dest_dir)
    else:
      shutil.move(new_model_dir, args.dest_dir)

    print(
        'Success: model at \'{}\' is ready to be hosted in AI Platform.'.format(
            args.dest_dir))


def check_tensorflow_installed():
  """Checks the status of TensorFlow installations."""
  if not TENSORFLOW_INSTALLED:
    raise ImportError(
        'By default, TensorFlow is not installed with Earth Engine client '
        'libraries. To use \'model\' commands, make sure at least TensorFlow '
        '1.14 is installed; you can do this by executing \'pip install '
        'tensorflow\' in your shell.'
    )
  else:
    if not TENSORFLOW_ADDONS_INSTALLED:
      print(
          'Warning: TensorFlow Addons not found. Models that use '
          'non-standard ops may not work.')


class ModelCommand(Dispatcher):
  """TensorFlow model related commands."""

  name = 'model'

  COMMANDS = [PrepareModelCommand]


class ProjectConfigGetCommand:
  """Prints the current project's ProjectConfig."""

  name = 'get'

  def __init__(self, parser: argparse.ArgumentParser):
    del parser  # Unused.
    pass

  @_using_v1alpha
  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    del args  # Unused.
    config.ee_init()
    print(ee.data.getProjectConfig())


class ProjectConfigSetCommand:
  """Updates the current project's ProjectConfig."""

  name = 'set'

  def __init__(self, parser: argparse.ArgumentParser):
    parser.add_argument(
        '--max_concurrent_exports',
        type=int,
        help='Max concurrent exports that can run in the project.',
    )

  @_using_v1alpha
  def run(
      self, args: argparse.Namespace, config: utils.CommandLineConfig
  ) -> None:
    if args.max_concurrent_exports < 0:
      raise ValueError('"max_concurrent_exports" must be >= 0.')

    config.ee_init()
    print(
        ee.data.updateProjectConfig(
            {'maxConcurrentExports': args.max_concurrent_exports},
            ['max_concurrent_exports'],
        )
    )


class ProjectConfigCommand(Dispatcher):
  """Prints or updates the current project's ProjectConfig."""

  name = 'project_config'

  COMMANDS = [
      ProjectConfigGetCommand,
      ProjectConfigSetCommand,
  ]


class AlphaCommand(Dispatcher):
  """Commands that are part of the v1alpha API."""

  name = 'alpha'

  COMMANDS = [
      ProjectConfigCommand,
  ]


EXTERNAL_COMMANDS = [
    AuthenticateCommand,
    AclCommand,
    AssetCommand,
    CopyCommand,
    CreateCommand,
    ListCommand,
    AlphaCommand,
    SizeCommand,
    MoveCommand,
    ModelCommand,
    RmCommand,
    SetProjectCommand,
    TaskCommand,
    UnSetProjectCommand,
    UploadCommand,
    UploadImageManifestCommand,
    UploadTableManifestCommand,
]
