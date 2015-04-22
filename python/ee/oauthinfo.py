#!/usr/bin/env python
"""Earth Engine OAuth2 client information."""

import os


class OAuthInfo(object):
  SCOPE = 'https://www.googleapis.com/auth/earthengine.readonly'
  CLIENT_ID = ('517222506229-vsmmajv00ul0bs7p89v5m89qs8eb9359.'
               'apps.googleusercontent.com')
  CLIENT_SECRET = 'RUP0RZ6e0pPhDzsqIJ7KlNd1'

  @classmethod
  def credentials_path(cls):
    return os.path.expanduser('~/.config/earthengine/credentials')
