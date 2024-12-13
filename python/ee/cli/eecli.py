#!/usr/bin/env python3
"""Executable for the Earth Engine command line interface.

This executable starts a Python Cmd instance to receive and process command
line input entered by the user. If the executable is invoked with some
command line arguments, the Cmd is launched in the one-off mode, where
the provided arguments are processed as a single command after which the
program is terminated. Otherwise, this executable will launch the Cmd in the
interactive (looping) mode, where the user will be able to run multiple
commands as in a typical terminal program.
"""

import argparse
import sys

import ee
from ee.cli import commands
from ee.cli import utils


class CommandDispatcher(commands.Dispatcher):
  name: str = 'main'
  COMMANDS = commands.EXTERNAL_COMMANDS


def _run_command(*argv):
  """Runs an eecli command."""
  del argv  # Unused

  # Set the program name to 'earthengine' for proper help text display.
  parser = argparse.ArgumentParser(
      prog='earthengine', description='Earth Engine Command Line Interface.')
  parser.add_argument(
      '--ee_config', help='Path to the earthengine configuration file. '
      'Defaults to "~/%s".' % utils.DEFAULT_EE_CONFIG_FILE_RELATIVE)
  parser.add_argument(
      '--service_account_file', help='Path to a service account credentials'
      'file.  Overrides any ee_config if specified.')
  parser.add_argument(
      '--project',
      help='Specifies a Google Cloud Platform Project id to override the call.',
      dest='project_override')

  dispatcher = CommandDispatcher(parser)

  # Print the list of commands if the user supplied no arguments at all.
  if len(sys.argv) == 1:
    parser.print_help()
    return

  args = parser.parse_args()
  config = utils.CommandLineConfig(
      config_file=args.ee_config,
      service_account_file=args.service_account_file,
      project_override=args.project_override,
  )

  # Catch EEException errors, which wrap server-side Earth Engine
  # errors, and print the error message without the irrelevant local
  # stack trace. (Individual commands may also catch EEException if
  # they want to be able to continue despite errors.)
  try:
    dispatcher.run(args, config)
  except ee.EEException as e:
    print(e)
    sys.exit(1)


def _get_tensorflow():
  try:
    # pylint: disable=g-import-not-at-top
    import tensorflow.compat.v1 as tf
    return tf
  except ImportError:
    return None
  except TypeError:
    # The installed version of the protobuf package is incompatible with
    # Tensorflow. A type error is thrown when trying to generate proto
    # descriptors. Reinstalling Tensorflow should fix any dep versioning issues.
    return None


def main():
  tf_module = _get_tensorflow()
  if tf_module:
    # We need InitGoogle initialization since TensorFlow expects it.
    tf_module.app.run(_run_command, argv=sys.argv[:1])
  else:
    _run_command()


if __name__ == '__main__':
  main()
