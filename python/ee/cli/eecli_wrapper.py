#!/usr/bin/env python3
"""Wrapper module for running eecli.main() from the command line."""

import os
import sys

# Minimum python version.
MAJOR = 3
MINOR = 7

if (sys.version_info.major != MAJOR or sys.version_info.minor < MINOR):
  sys.exit('earthengine requires Python %d >= %d.%d' % (MAJOR, MAJOR, MINOR))


def OutputAndExit(message: str) -> None:
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


def RunMain() -> None:
  # pytype: disable=import-error
  import eecli  # pylint: disable=g-import-not-at-top
  # pytype: enable=import-error
  sys.exit(eecli.main())

if __name__ == '__main__':
  RunMain()
