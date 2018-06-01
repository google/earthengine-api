#!/usr/bin/env python
"""Executable for the Earth Engine command line interface to run on Borg.

This executable is an internal version of the Earth Engine CLI to upload image
and table manifests on Borg with a subset of its commands (most importantly, to
allow upload_manifest and upload_table_manifest to point at manifest files in
prod).

Why do we need a separate binary from eecli.py?
  GFile requires using absl.app.run to launch the program. The app module
  handles initializing GFile as well as various other Google libraries and the
  parsing of arguments for the absl.flags module.

  In order to avoid a collision between absl and argparse flags when using
  absl.app.run, the absl.flags.argparse_flags module is used. The module
  provides an argparse_flags.ArgumentParser class which has the same API as
  argparse.ArgumentParser, but will take into account all flags defined with
  absl.flags. To use it together with absl.app.run, you will need to define your
  argparse flags and call parse_args inside a function with type
  Callable[[List[Text]], Any].
  However, this only works for command classes that do not define argparse
  flags that collide with the corresponding absl flags. For example, RmCommand
  and TaskWaitCommand both define the -v and --verbose flags that collide with
  the same absl flags and therefore will not work here.
"""

from __future__ import print_function

import sys

from absl import app
from absl.flags import argparse_flags
import ee
from ee.cli import commands
from ee.cli import utils


class CommandDispatcher(commands.Dispatcher):
  name = 'main'

  COMMANDS = [
      commands.UploadImageManifestGFileCommand,
      commands.UploadTableManifestGFileCommand,
  ]


def parse_flags(argv):
  """Function passed to absl.app.run to call parse_args."""
  # Set the program name to 'earthengine' for proper help text display.
  parser = argparse_flags.ArgumentParser(
      prog='earthengine', description='Earth Engine Command Line Interface.')

  # Print the list of commands if the user supplied no arguments at all.
  if len(argv) == 1:
    parser.print_help()
    sys.exit(0)

  dispatcher = CommandDispatcher(parser)
  args = parser.parse_args(argv[1:])
  return dispatcher, args


def main(dispatcher_and_args):
  dispatcher, args = dispatcher_and_args
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
  app.run(main, flags_parser=parse_flags)
