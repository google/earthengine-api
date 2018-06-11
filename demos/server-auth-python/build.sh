#!/bin/bash

# This Bash script builds Python dependencies needed to run and deploy
# the demo application.

# Builds the specified dependency if it hasn't been built. Takes 4 parameters:
#   For PyPI packages:
#     1. The source type: "pypi".
#     2. The name of the PyPI package.
#     3. The version of the package.
#     4. The path within the package of the library folder.
#   For Git repositories:
#     1. The source type: "git".
#     2. The URL of the git repository.
#     3. The tag name or commit SHA at which to checkout the repo.
#     4. The path within the repo of the library folder.
BuildDep () {
  DST_FOLDER=$(basename "$4")
  echo "Building $DST_FOLDER ($3)..."
  if [ ! -d "$DST_FOLDER" ]; then
    if [ ! -f "$DST_FOLDER" ]; then
      # See: http://unix.stackexchange.com/a/84980
      TEMP_DIR=$(mktemp -d 2> /dev/null || mktemp -d -t 'mytmpdir')
      cd "$TEMP_DIR"
      case $1 in
        "git"  ) echo "Git: Cloning $2..."
                 git clone "$2" .
                 echo "Git: Checking out $4..."
                 git checkout "$3" .
                 ;;
        "pypi" ) echo "Pip: Installing $2..."
                 pip install -t "$TEMP_DIR" "$2"=="$3"
                 ;;
        *      )
                 echo "ERROR: Unrecognized source type. Specify 'git' or 'pypi'."
                 cd -
      esac
      cd -
      mv "$TEMP_DIR/$4" ./
      rm -rf "$TEMP_DIR"
    fi
  fi
}

# Build oauth2client v2.2.0 dependencies.
BuildDep pypi six 1.10.0 six.py
BuildDep pypi pyasn1 0.1.9 pyasn1
BuildDep pypi pyasn1-modules 0.0.8 pyasn1_modules
BuildDep pypi rsa 3.4.2 rsa

# Build oauth2client.
BuildDep git https://github.com/google/oauth2client.git tags/v2.2.0 oauth2client

# Build the Earth Engine Python client library.
BuildDep git https://github.com/google/earthengine-api.git v0.1.114 python/ee

# Build httplib2.
BuildDep git https://github.com/jcgregorio/httplib2.git tags/v0.9.1 python2/httplib2
