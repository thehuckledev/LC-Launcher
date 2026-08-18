#!/bin/sh

set -eu

ARCH=$(uname -m)
case "$ARCH" in
    aarch64|arm64)
        TARGET="arm64"
        ;;
    *)
        TARGET="x64"
        ;;
esac
VERSION="$(tr -d '\r\n' < BUMP)"
export ARCH VERSION
export ADD_HOOKS="self-updater.hook:wayland-is-broken.hook"

build_appimage() {
    BINARY_PATH="$1"
    VARIANT_SUFFIX="$2"

    export OUTPATH="./dist"
    export OUTNAME="LC-Launcher${VARIANT_SUFFIX}-linux-${TARGET}.AppImage"
    export ICON="./build-scripts/sharun/template/LC-Launcher.png"
    export DESKTOP="./build-scripts/sharun/template/LC-Launcher.desktop"
    export UPINFO="gh-releases-zsync|${GITHUB_REPOSITORY%/*}|${GITHUB_REPOSITORY#*/}|latest|*${VARIANT_SUFFIX}-linux-${TARGET}.AppImage.zsync"

    quick-sharun "$BINARY_PATH"

    if [ -d "./AppDir" ]; then
        BINARY_DIR="$(dirname "$BINARY_PATH")"

        if [ -f "$BINARY_DIR/resources.neu" ]; then
            cp "$BINARY_DIR/resources.neu" "./AppDir/bin/"
        fi
        if [ -d "$BINARY_DIR/libs" ]; then
            cp -r "$BINARY_DIR/libs" "./AppDir/bin/"
        fi
    fi

    quick-sharun --make-appimage
    quick-sharun --test "$OUTPATH/$OUTNAME"

    rm -rf ./AppDir
}

build_appimage "./dist/linux_${TARGET}/LC-Launcher/LC-Launcher" ""
build_appimage "./dist/linux_${TARGET}_portable/LC-Launcher/LC-Launcher" "-portable"