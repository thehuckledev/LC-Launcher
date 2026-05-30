#!/bin/sh
set -e

NL_PATH="$1"
ARCH="$(uname -m)"

EXT_DIR="$NL_PATH/libs"

case "$ARCH" in
    x86_64|amd64)
        BIN="$EXT_DIR/lcLib-linux-x64"
        ;;
    aarch64|arm64)
        BIN="$EXT_DIR/lcLib-linux-arm64"
        ;;
    *)
        exit 1
        ;;
esac

exec "$BIN"
