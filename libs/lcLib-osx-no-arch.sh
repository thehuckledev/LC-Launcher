#!/bin/sh
set -e

NL_PATH="$1"
ARCH="$(uname -m)"

EXT_DIR="$NL_PATH/libs"

case "$ARCH" in
    arm64)
        BIN="$EXT_DIR/lcLib-osx-arm64"
        ;;
    x86_64)
        BIN="$EXT_DIR/lcLib-osx-x64"
        ;;
    *)
        exit 1
        ;;
esac

exec "$BIN"