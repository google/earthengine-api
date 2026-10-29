#!/usr/bin/env python3
"""Configuration constants."""

import os

CSRF_TIME_LIMIT = 86400  # 24 hours in seconds.

# This is the account that is used for communicating with Earth Engine.
EE_SERVICE_ACCOUNT = os.environ.get(
    'EE_SERVICE_ACCOUNT',
    'earthengine-catalog@compact-sunset-791.google.com.iam.gserviceaccount.com')

EE_SA_CREDENTIALS_FILE = os.environ.get('EE_SA_CREDENTIALS_FILE')

# Cloud storage path template for Cloud Storage Layers
EE_CSL_TILEURL_TEMPLATE = '{path}/{z}/{x}/{y}{suffix}'

# Set this to true to turn on Cloud Storage Layers for table assets.
EE_CSL_ENABLED = False

# This is will hold a Google Cloud Storage bucket client object.
# The bucket will be initialized on application startup.
CATALOG_BUCKET = None
