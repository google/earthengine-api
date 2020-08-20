#!/usr/bin/env python
# Lint as: python2, python3
"""Support utilities used by the Earth Engine command line interface.

This module defines the Command class which is the base class of all
the commands supported by the EE command line tool. It also defines
the classes for configuration and runtime context management.
"""
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
import collections
from datetime import datetime
import json
import os
import re
import tempfile
import threading
import time

import httplib2
import six
from six.moves import input
from six.moves import urllib

from google.cloud import storage
from google.oauth2.credentials import Credentials
import ee

HOMEDIR = os.path.expanduser('~')
EE_CONFIG_FILE = 'EE_CONFIG_FILE'
DEFAULT_EE_CONFIG_FILE_RELATIVE = os.path.join(
    '.config', 'earthengine', 'credentials')
DEFAULT_EE_CONFIG_FILE = os.path.join(
    HOMEDIR, DEFAULT_EE_CONFIG_FILE_RELATIVE)

CONFIG_PARAMS = {
    'url': 'https://earthengine.googleapis.com',
    'account': None,
    'private_key': None,
    'refresh_token': None,
    'use_cloud_api': True,
    'cloud_api_key': None,
    'project': None,
}

TASK_FINISHED_STATES = (ee.batch.Task.State.COMPLETED,
                        ee.batch.Task.State.FAILED,
                        ee.batch.Task.State.CANCELLED)


class CommandLineConfig(object):
  """Holds the configuration parameters used by the EE command line interface.

  This class attempts to load the configuration parameters from a file
  specified as a constructor argument. If not provided, it attempts to load
  the configuration from a file specified via the EE_CONFIG_FILE environment
  variable. If the variable is not set, it looks for a JSON file at the
  path ~/.config/earthengine/credentials. If all fails, it falls back to using
  some predefined defaults for each configuration parameter.

  If --service_account_file is specified, it is used instead.
  """

  def __init__(
      self, config_file=None, service_account_file=None, use_cloud_api=True,
      project_override=None):
    if not config_file:
      config_file = os.environ.get(EE_CONFIG_FILE, DEFAULT_EE_CONFIG_FILE)
    self.config_file = config_file
    self.project_override = project_override
    config = {}
    if os.path.exists(config_file):
      with open(config_file) as config_file_json:
        config = json.load(config_file_json)
    CONFIG_PARAMS['use_cloud_api'] = use_cloud_api
    for key, default_value in CONFIG_PARAMS.items():
      setattr(self, key, config.get(key, default_value))
    self.service_account_file = service_account_file
    if service_account_file:
      # Load the file to verify that it exists.
      with open(service_account_file) as service_file_json:
        service = json.load(service_file_json)
      for key, value in service.items():
        setattr(self, key, value)

  def _get_credentials(self):
    """Acquires credentials."""
    if self.service_account_file:
      return ee.ServiceAccountCredentials(self.client_email,
                                          self.service_account_file)
    elif self.account and self.private_key:
      return ee.ServiceAccountCredentials(self.account, self.private_key)
    elif self.refresh_token:
      return Credentials(
          None,
          refresh_token=self.refresh_token,
          token_uri=ee.oauth.TOKEN_URI,
          client_id=ee.oauth.CLIENT_ID,
          client_secret=ee.oauth.CLIENT_SECRET,
          scopes=ee.oauth.SCOPES)
    else:
      return 'persistent'

  # TODO(user): We now have two ways of accessing GCS. storage.Client is
  #            preferred and we should eventually migrate to just use that
  #            instead of sending raw HTTP requests.
  def create_gcs_helper(self):
    """Creates a GcsHelper using the same credentials EE authorizes with."""
    project = self._get_project()
    if project is None:
      raise ValueError('A project is required to access Cloud Storage. It '
                       'can be set per-call by passing the --project flag or '
                       'by setting the \'project\' parameter in your Earth '
                       'Engine config file.')
    creds = self._get_credentials()
    if creds == 'persistent':
      creds = ee.data.get_persistent_credentials()
    return GcsHelper(
        storage.Client(project=project, credentials=creds))

  def _get_project(self):
    # If a --project flag is passed into a command, it supercedes the one set
    # by calling the set_project command.
    if self.project_override:
      return self.project_override
    else:
      return self.project

  def ee_init(self):
    """Loads the EE credentials and initializes the EE client."""
    ee.Initialize(
        credentials=self._get_credentials(),
        opt_url=self.url,
        use_cloud_api=self.use_cloud_api,
        cloud_api_key=self.cloud_api_key,
        project=self._get_project())

  def save(self):
    config = {}
    for key in CONFIG_PARAMS:
      value = getattr(self, key)
      if value is not None:
        config[key] = value
    with open(self.config_file, 'w') as output_file:
      json.dump(config, output_file)


class GcsHelper(object):
  """A helper for manipulating files in GCS."""

  def __init__(self, client):
    self.client = client

  @staticmethod
  def _split_gcs_path(path):
    m = re.search('gs://([a-z0-9-_.]*)/(.*)', path, re.IGNORECASE)
    if not m:
      raise ValueError('\'{}\' is not a valid GCS path'.format(path))

    return m.groups()

  @staticmethod
  def _canonicalize_dir_path(path):
    return path.strip().rstrip('/')

  def _get_blobs_under_path(self, path):
    bucket, prefix = GcsHelper._split_gcs_path(
        GcsHelper._canonicalize_dir_path(path))
    return self.client.get_bucket(bucket).list_blobs(prefix=prefix + '/')

  def check_gcs_dir_within_size(self, path, max_bytes):
    blobs = self._get_blobs_under_path(path)
    total_bytes = 0
    for blob in blobs:
      total_bytes += blob.size
      if total_bytes > max_bytes:
        raise ValueError('Size of files in \'{}\' exceeds allowed size: '
                         '{} > {}.'.format(path, total_bytes, max_bytes))
    if total_bytes == 0:
      raise ValueError('No files found at \'{}\'.'.format(path))

  def download_dir_to_temp(self, path):
    """Downloads recursively the contents at a GCS path to a temp directory."""
    canonical_path = GcsHelper._canonicalize_dir_path(path)
    blobs = self._get_blobs_under_path(canonical_path)
    temp_dir = tempfile.mkdtemp()

    _, prefix = GcsHelper._split_gcs_path(canonical_path)
    for blob in blobs:
      stripped_name = blob.name[len(prefix):]
      if stripped_name == '/':
        continue

      output_path = temp_dir + six.ensure_str(stripped_name)
      dir_path = os.path.dirname(output_path)
      if not os.path.exists(dir_path):
        os.makedirs(dir_path)

      if output_path[-1:] != '/':
        blob.download_to_filename(output_path)

    return temp_dir

  def upload_dir_to_bucket(self, source_path, dest_path):
    """Uploads a directory to cloud storage."""
    canonical_path = GcsHelper._canonicalize_dir_path(source_path)

    files = list()
    for dirpath, _, filenames in os.walk(canonical_path):
      files += [os.path.join(dirpath, f) for f in filenames]

    bucket, prefix = GcsHelper._split_gcs_path(
        GcsHelper._canonicalize_dir_path(dest_path))
    bucket_client = self.client.get_bucket(bucket)

    for f in files:
      relative_file = f[len(canonical_path):]
      bucket_client.blob(prefix + relative_file).upload_from_filename(f)


def is_gcs_path(path):
  return six.ensure_str(path.strip()).startswith('gs://')


def query_yes_no(msg):
  print('%s (y/n)' % msg)
  while True:
    confirm = input().lower()
    if confirm == 'y':
      return True
    elif confirm == 'n':
      return False
    else:
      print('Please respond with \'y\' or \'n\'.')


def truncate(string, length):
  if len(string) > length:
    return six.ensure_str(string[:length]) + '..'
  else:
    return string


def wait_for_task(task_id, timeout, log_progress=True):
  """Waits for the specified task to finish, or a timeout to occur."""
  start = time.time()
  elapsed = 0
  last_check = 0
  while True:
    elapsed = time.time() - start
    status = ee.data.getTaskStatus(task_id)[0]
    state = status['state']
    if state in TASK_FINISHED_STATES:
      error_message = status.get('error_message', None)
      print('Task %s ended at state: %s after %.2f seconds'
            % (task_id, state, elapsed))
      if error_message:
        raise ee.ee_exception.EEException('Error: %s' % error_message)
      return
    if log_progress and elapsed - last_check >= 30:
      print('[{:%H:%M:%S}] Current state for task {}: {}'
            .format(datetime.now(), task_id, state))
      last_check = elapsed
    remaining = timeout - elapsed
    if remaining > 0:
      time.sleep(min(10, remaining))
    else:
      break
  print('Wait for task %s timed out after %.2f seconds' % (task_id, elapsed))


def wait_for_tasks(task_id_list, timeout, log_progress=False):
  """For each task specified in task_id_list, wait for that task or timeout."""

  if len(task_id_list) == 1:
    wait_for_task(task_id_list[0], timeout, log_progress)
    return

  threads = []
  for task_id in task_id_list:
    t = threading.Thread(target=wait_for_task,
                         args=(task_id, timeout, log_progress))
    threads.append(t)
    t.start()

  for thread in threads:
    thread.join()

  status_list = ee.data.getTaskStatus(task_id_list)
  status_counts = collections.defaultdict(int)
  for status in status_list:
    status_counts[status['state']] += 1
  num_incomplete = (len(status_list) - status_counts['COMPLETED']
                    - status_counts['FAILED'] - status_counts['CANCELLED'])
  print('Finished waiting for tasks.\n  Status summary:')
  print('  %d tasks completed successfully.' % status_counts['COMPLETED'])
  print('  %d tasks failed.' % status_counts['FAILED'])
  print('  %d tasks cancelled.' % status_counts['CANCELLED'])
  print('  %d tasks are still incomplete (timed-out)' % num_incomplete)


def expand_gcs_wildcards(source_files):
  """Implements glob-like '*' wildcard completion for cloud storage objects.

  Args:
    source_files: A list of one or more cloud storage paths of the format
                  gs://[bucket]/[path-maybe-with-wildcards]

  Yields:
    cloud storage paths of the above format with '*' wildcards expanded.
  Raises:
    EEException: If badly formatted source_files
                 (e.g., missing gs://) are specified
  """
  for source in source_files:
    if '*' not in source:
      yield source
      continue

    # We extract the bucket and prefix from the input path to match
    # the parameters for calling GCS list objects and reduce the number
    # of items returned by that API call

    # Capture the part of the path after gs:// and before the first /
    bucket_regex = 'gs://([a-z0-9_.-]+)/(.*)'
    bucket_match = re.match(bucket_regex, six.ensure_str(source))
    if bucket_match:
      bucket, rest = bucket_match.group(1, 2)
    else:
      raise ee.ee_exception.EEException(
          'Badly formatted source file or bucket: %s' % source)
    prefix = rest[:rest.find('*')]  # Everything before the first wildcard

    bucket_files = _gcs_ls(bucket, prefix)

    # Regex to match the source path with wildcards expanded
    regex = six.ensure_str(re.escape(source)).replace(r'\*', '[^/]*') + '$'
    for gcs_path in bucket_files:
      if re.match(regex, gcs_path):
        yield gcs_path


def _gcs_ls(bucket, prefix=''):
  """Retrieve a list of cloud storage filepaths from the given bucket.

  Args:
    bucket: The cloud storage bucket to be queried
    prefix: Optional, a prefix used to select the objects to return
  Yields:
    Cloud storage filepaths matching the given bucket and prefix
  Raises:
    EEException:
      If there is an error in accessing the specified bucket
  """

  base_url = 'https://storage.googleapis.com/storage/v1/b/%s/o' % bucket
  method = 'GET'
  http = ee.data.authorizeHttp(httplib2.Http(0))
  next_page_token = None

  # Loop to handle paginated responses from GCS;
  # Exits once no 'next page token' is returned
  while True:
    params = {'fields': 'items/name,nextPageToken'}
    if next_page_token:
      params['pageToken'] = next_page_token
    if prefix:
      params['prefix'] = prefix
    payload = urllib.parse.urlencode(params)

    url = base_url + '?' + payload
    try:
      response, content = http.request(url, method=method)
    except httplib2.HttpLib2Error as e:
      raise ee.ee_exception.EEException('Unexpected HTTP error: %s' % str(e))

    if response.status < 100 or response.status >= 300:
      raise ee.ee_exception.EEException(('Error retrieving bucket %s;'
                                         ' Server returned HTTP code: %d' %
                                         (bucket, response.status)))

    json_content = json.loads(content)
    if 'error' in json_content:
      json_error = json_content['error']['message']
      raise ee.ee_exception.EEException('Error retrieving bucket %s: %s' %
                                        (bucket, json_error))

    if 'items' not in json_content:
      raise ee.ee_exception.EEException(
          'Cannot find items list in the response from GCS: %s' % json_content)
    objects = json_content['items']
    object_names = [str(gc_object['name']) for gc_object in objects]

    for name in object_names:
      yield 'gs://%s/%s' % (bucket, name)

    # GCS indicates no more results
    if 'nextPageToken' not in json_content:
      return

    # Load next page, continue at beginning of while True:
    next_page_token = json_content['nextPageToken']
