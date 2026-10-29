#!/bin/bash

# This Bash script builds Python dependencies needed to run and deploy
# the Trendy Lights application

# Builds the specified dependency if it hasn't been built. Takes 3 parameters:
#   For PyPI packages:
#     1. The name of the PyPI package.
#     2. The version of the package.
#     3. The path within the package of the library folder.
#   For Git repositories:
#     1. The URL of the git repository.
#     2. The tag name or commit SHA at which to checkout the repo.
#     3. The path within the repo of the library folder.
BuildDep () {
  DST_FOLDER=$(basename "$3")
  echo "Building $DST_FOLDER ($2)..."
  if [ ! -d "$DST_FOLDER" ]; then
    if [ ! -f "$DST_FOLDER" ]; then
      # See: http://unix.stackexchange.com/a/84980
      TEMP_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'mytmpdir')
      cd "$TEMP_DIR"
      if [[ $1 == *git ]]; then
        echo "Git: Cloning $1..."
        git clone "$1" .
        echo "Git: Checking out $3..."
        git checkout "$2" .
      else
        echo "Pip: Installing $1..."
        pip install -t "$TEMP_DIR" "$1"=="$2"
      fi
      cd -
      mv "$TEMP_DIR/$3" ./
      rm -rf "$TEMP_DIR"
    fi
  fi
}

# Build oauth2client v2.2.0 dependencies.
BuildDep six 1.10.0 six.py
BuildDep pyasn1 0.1.9 pyasn1
BuildDep pyasn1-modules 0.0.8 pyasn1_modules
BuildDep rsa 3.4.2 rsa

# Build oauth2client.
BuildDep https://github.com/google/oauth2client.git tags/v2.2.0 oauth2client

# Build the Earth Engine Python client library.
BuildDep https://github.com/google/earthengine-api.git v0.1.114 python/ee

# Build httplib2.
BuildDep https://github.com/jcgregorio/httplib2.git tags/v0.9.1 python2/httplib2
