#!/bin/sh

set -eu

ARCH=$(uname -m)
VERSION="$(tr -d '\r\n' < BUMP)"
export ARCH VERSION
export ADD_HOOKS="self-updater.hook"

build_appimage() {
    BINARY_PATH="$1"
    VARIANT_SUFFIX="$2"

    export OUTPATH="./dist"
    export OUTNAME="LC-Launcher${VARIANT_SUFFIX}-${ARCH}.AppImage"
    export ICON="./build-scripts/sharun/template/LC-Launcher.png"
    export DESKTOP="./build-scripts/sharun/template/LC-Launcher.desktop"
    export UPINFO="gh-releases-zsync|${GITHUB_REPOSITORY%/*}|${GITHUB_REPOSITORY#*/}|latest|*LC-Launcher${VARIANT_SUFFIX}*${ARCH}.AppImage.zsync"

    quick-sharun "$BINARY_PATH"
    quick-sharun --make-appimage

    quick-sharun --test "$OUTPATH/$OUTNAME"

    rm -rf ./*.AppDir
}

build_appimage "./dist/linux_${ARCH}/LC-Launcher/LC_Launcher-linux_${ARCH}" ""
build_appimage "./dist/linux_${ARCH}_portable/LC-Launcher/LC_Launcher-linux_${ARCH}" "-Portable"