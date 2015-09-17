#!/usr/bin/env python
"""Support utilities used by the Earth Engine command line interface.

This module defines the Command class which is the base class of all
the commands supported by the EE command line tool. It also defines
the classes for configuration and runtime context management.
"""

from datetime import datetime
import json
import os
import time

import oauth2client.client

import ee
from ee.oauthinfo import OAuthInfo

HOMEDIR = os.path.expanduser('~')
EE_CONFIG_FILE = 'EE_CONFIG_FILE'
DEFAULT_EE_CONFIG_FILE = os.path.join(
    HOMEDIR, '.config', 'earthengine', 'credentials')

CONFIG_PARAMS = {
    'url': 'https://earthengine.googleapis.com',
    'account': None,
    'private_key': None,
    'refresh_token': None,
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
  path ~/.config/earthengine/credentials. If all fails, it fallsback to using
  some predefined defaults for each configuration parameter.
  """

  def __init__(self, config_file=None):
    if not config_file:
      config_file = os.environ.get(EE_CONFIG_FILE, DEFAULT_EE_CONFIG_FILE)
    self.config_file = config_file
    config = {}
    if os.path.exists(config_file):
      with open(config_file) as config_file_json:
        config = json.load(config_file_json)
    for key, default_value in CONFIG_PARAMS.items():
      setattr(self, key, config.get(key, default_value))

  def ee_init(self):
    """Load the EE credentils and initialize the EE client."""
    if self.account and self.private_key:
      credentials = ee.ServiceAccountCredentials(self.account, self.private_key)
    elif self.refresh_token:
      credentials = oauth2client.client.OAuth2Credentials(
          None, OAuthInfo.CLIENT_ID, OAuthInfo.CLIENT_SECRET,
          self.refresh_token, None,
          'https://accounts.google.com/o/oauth2/token', None)
    else:
      credentials = 'persistent'
    ee.Initialize(credentials=credentials, opt_url=self.url)

  def save(self):
    config = {}
    for key in CONFIG_PARAMS:
      value = getattr(self, key)
      if value is not None:
        config[key] = value
    with open(self.config_file, 'w') as output_file:
      json.dump(config, output_file)


def query_yes_no(msg):
  print '%s (y/n)' % msg
  while True:
    confirm = raw_input().lower()
    if confirm == 'y':
      return True
    elif confirm == 'n':
      return False
    else:
      print 'Please respond with \'y\' or \'n\'.'


def truncate(string, length):
  return (string[:length] + '..') if len(string) > length else string


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
      print 'Task ended at state: %s after %.2f seconds' % (state, elapsed)
      if error_message:
        print 'Error: %s' % error_message
      return
    if log_progress and elapsed - last_check >= 30:
      print '[{:%H:%M:%S}] Current task state: {}'.format(datetime.now(), state)
      last_check = elapsed
    remaining = timeout - elapsed
    if remaining > 0:
      time.sleep(min(10, remaining))
    else:
      break
  print 'Wait timed out after %.2f seconds' % elapsed
