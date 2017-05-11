#!/bin/bash
# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

TMPDIR=temp-repo

mkdir -p /content/datalab
cd /content/datalab

if [[ ! -d "docs-earthengine" ]]; then
  echo "Adding Earth Engine docs to the Datalab container..."
  # Clone the repository into a temporary directory.
  git clone https://github.com/google/earthengine-api $TMPDIR
  # Copy the IPython Notebook examples.
  cp -R $TMPDIR/python/examples/ipynb/ docs-earthengine/
  # Delete the temporary directory.
  rm -fr $TMPDIR
fi

source /datalab/base-run.sh
