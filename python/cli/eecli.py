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

import argparse

import commands
import utils


COMMANDS = [
    commands.AclCommand,
    commands.AssetCommand,
    commands.ConfigCommand,
    commands.ExportCommand,
    commands.ListCommand,
    commands.RenameCommand,
    commands.RmCommand,
    commands.SetPropertiesCommand,
    commands.TasksCommand,
    commands.UploadCommand,
]


def main():
  # Set the program name to 'earthengine' for proper help text display.
  parser = argparse.ArgumentParser(
      prog='earthengine', description='Earth Engine Command Line Interface.')
  parser.add_argument(
      '--ee-config', help='Path to the CLI configuration file.')

  subparsers = parser.add_subparsers(title='Commands', dest='top_cmd')
  command_objects = {}
  for command in COMMANDS:
    subparser = subparsers.add_parser(
        command.name, description=command.__doc__, help=command.__doc__)
    command_objects[command.name] = command(subparser)
  args = parser.parse_args()

  config = utils.CommandLineConfig(args.ee_config)
  command_objects[args.top_cmd].run(args, config)


if __name__ == '__main__':
  main()
