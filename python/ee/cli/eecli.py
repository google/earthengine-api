#!/usr/bin/env python
"""Executable for the Earth Engine command line interface.

This executable starts a Python Cmd instance to receive and process command
line input entered by the user. If the executable is invoked with some
command line arguments, the Cmd is launched in the one-off mode, where
the provided arguments are processed as a single command after which the
program is terminated. Otherwise, this executable will launch the Cmd in the
interactive (looping) mode, where the user will be able to run multiple
commands as in a typical terminal program.
"""

from __future__ import print_function

import argparse
import sys

import ee
from ee.cli import commands
from ee.cli import utils


class CommandDispatcher(commands.Dispatcher):
  name = 'main'

  COMMANDS = [
      commands.AuthenticateCommand,
      commands.AclCommand,
      commands.AssetCommand,
      commands.CopyCommand,
      commands.CreateCommand,
      commands.ListCommand,
      commands.SizeCommand,
      commands.MoveCommand,
      commands.RmCommand,
      commands.TaskCommand,
      commands.UploadCommand,
      commands.UploadImageManifestCommand,
      commands.UploadTableManifestCommand,
  ]


def main():
  # Set the program name to 'earthengine' for proper help text display.
  parser = argparse.ArgumentParser(
      prog='earthengine', description='Earth Engine Command Line Interface.')
  parser.add_argument(
      '--ee_config', help='Path to the earthengine configuration file. '
      'Defaults to "~/%s".' % utils.DEFAULT_EE_CONFIG_FILE_RELATIVE)
  parser.add_argument(
      '--service_account_file', help='Path to a service account credentials'
      'file.  Overrides any ee_config if specified.')

  dispatcher = CommandDispatcher(parser)

  # Print the list of commands if the user supplied no arguments at all.
  if len(sys.argv) == 1:
    parser.print_help()
    return

  args = parser.parse_args()
  config = utils.CommandLineConfig(args.ee_config, args.service_account_file)

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
  main()
