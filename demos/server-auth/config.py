#!/usr/bin/env python
"""An example config.py file."""

import ee
from oauth2client.service_account import ServiceAccountCredentials

# Set up a service account as described in the README, and generate a 
# a private key in JSON format via the Google API Console.
# https://console.cloud.google.com/iam-admin/serviceaccounts/

EE_SCOPE = 'https://www.googleapis.com/auth/earthengine'
EE_PRIVATE_KEY_FILE = 'privatekey.json'

EE_CREDENTIALS = ServiceAccountCredentials.from_json_keyfile_name(
  EE_PRIVATE_KEY_FILE, EE_SCOPE)
