#!/bin/sh

# Builds a self-contained archive from the open source release of EE CLI tool.

EE_CLI_DIR="earthengine-cli"
mkdir -p $EE_CLI_DIR/third_party
pip install -t $EE_CLI_DIR/third_party earthengine-api

cp eecli.py commands.py utils.py $EE_CLI_DIR/

cp eecli_wrapper.py $EE_CLI_DIR/earthengine
chmod +x $EE_CLI_DIR/earthengine

tar cvf earthengine-cli.tar.gz $EE_CLI_DIR
rm -rf $EE_CLI_DIR
