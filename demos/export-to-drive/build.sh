#!/bin/bash

# This Bash script (1) builds Python dependencies needed to run and deploy
# the demo application and (2) installs the Google App Engine
# developer tools if they aren't found on the system.

# Builds the specified dependency if it hasn't been built. Takes 3 parameters:
#   1. The URL of the git repo.
#   2. The tag name or commit SHA at which to checkout the repo.
#   3. The path within the repo to the desired library folder.
BuildDep () {
  DST_FOLDER=$(basename "$3")
  echo "Building $DST_FOLDER..."
  if [ ! -d "./lib/$DST_FOLDER" ]; then
    # See: http://unix.stackexchange.com/a/84980
    TEMP_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'mytmpdir')
    cd "$TEMP_DIR"
    git clone "$1" .
    git checkout "$2" .
    cd -
    mv "$TEMP_DIR/$3" ./lib/
    rm -rf "$TEMP_DIR"
  fi
}

# Create the lib directory if it doesn't exist.
if [ ! -d "lib" ]; then
  mkdir lib
  # Make the Python libraries in the lib/ folder available as if they were in
  # the root.
  { echo "import sys" ; echo "sys.path.append('lib/')"; } >> ./lib/__init__.py
fi

# Build oauth2client.
BuildDep https://github.com/google/oauth2client.git tags/v1.3.2 oauth2client

# Build httplib2.
BuildDep https://github.com/jcgregorio/httplib2.git tags/v0.9.1 python2/httplib2

# Build the Google API Python Client.
BuildDep https://github.com/google/google-api-python-client.git tags/v1.3.2 googleapiclient

# Build the URI template library.
BuildDep https://github.com/sigmavirus24/uritemplate.git tags/0.3.0 uritemplate

# Build the Earth Engine Python client library.
BuildDep https://github.com/google/earthengine-api.git tags/v0.1.60 python/ee
