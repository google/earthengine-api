#!/usr/bin/env python
"""Wrapper module for running eecli.main() from the command line."""

import os
import sys

if not (2, 6) <= sys.version_info[:3] < (3,):
  sys.exit('earthengine requires python 2.6 or 2.7.')


def OutputAndExit(message):
  sys.stderr.write('%s\n' % message)
  sys.exit(1)


EECLI_DIR = os.path.dirname(os.path.abspath(os.path.realpath(__file__)))
if not EECLI_DIR:
  OutputAndExit('Unable to determine where earthengine CLI is installed. Sorry,'
                ' cannot run correctly without this.\n')

# The wrapper script adds all third_party libraries to the Python path, since
# we don't assume any third party libraries are installed system-wide.
THIRD_PARTY_DIR = os.path.join(EECLI_DIR, 'third_party')
sys.path.insert(0, THIRD_PARTY_DIR)


def RunMain():
  import eecli  # pylint: disable=g-import-not-at-top
  sys.exit(eecli.main())

if __name__ == '__main__':
  RunMain()
