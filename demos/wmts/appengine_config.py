#!/usr/bin/env python3
"""App Engine config file, used for dependency management for the proxy."""
# appengine_config.py
from google.appengine.ext import vendor

# Add any libraries present in the "lib" folder.
vendor.add('lib')
