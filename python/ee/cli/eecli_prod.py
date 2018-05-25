#!/usr/bin/env python
"""Executable for the Earth Engine command line interface to run on Borg.

This executable is an internal version of the Earth Engine CLI to upload image
and table manifests on Borg with a subset of its commands (most importantly, to
allow upload_manifest and upload_table_manifest to point at manifest files in
prod).

Why do we need a separate binary from eecli.py?
  GFile requires using main() to launch the program. The app module handles
  initializing GFile as well as various other Google libraries and the parsing
  of arguments for the absl flags module. However, the absl and argparse flags
  may collide when using main(). A possible workaround is using the
  absl.flags.argparse_flags, but the -v and --verbose flags in some of the
  command classes still collide with the corresponding absl flags.
"""

from __future__ import print_function

import argparse
import sys

from absl import app
import ee
from ee.cli import commands
from ee.cli import utils


class CommandDispatcher(commands.Dispatcher):
  name = 'main'

  COMMANDS = [
      commands.UploadImageManifestGFileCommand,
      commands.UploadTableManifestGFileCommand,
  ]


def main(argv):
  del argv
  # Set the program name to 'earthengine' for proper help text display.
  parser = argparse.ArgumentParser(
      prog='earthengine', description='Earth Engine Command Line Interface.')

  dispatcher = CommandDispatcher(parser)

  # Print the list of commands if the user supplied no arguments at all.
  if len(sys.argv) == 1:
    parser.print_help()
    return

  args = parser.parse_args()
  config = utils.CommandLineConfig()

  # Catch EEException errors, which wrap server-side Earth Engine
  # errors, and print the error message without the irrelevant local
  # stack trace. (Individual commands may also catch EEException if
  # they want to be able to continue despite errors.)
  try:
    dispatcher.run(args, config)
  except ee.EEException as e:
    print(e)
    sys.exit(1)

if __name__ == '__main__':
  app.run(main)
