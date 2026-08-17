#!/bin/sh

set -eu

ARCH=$(uname -m)
case "$ARCH" in
  aarch64|arm64)
    TARGET="linux-arm64"s
    ;;
  *)
    TARGET="linux-x64"
    ;;
esac

echo "Installing package dependencies..."
echo "---------------------------------------------------------------"
pacman -Syu --noconfirm webkit2gtk-4.1 gstreamer gst-plugins-base gst-plugins-good gst-plugins-bad gst-libav zenity

echo "Installing debloated packages..."
echo "---------------------------------------------------------------"
get-debloated-pkgs --add-common --prefer-nano

# Comment this out if you need an AUR package
#make-aur-package PACKAGENAME

# If the application needs to be manually built that has to be done down here
bun ./build-scripts/build-lib.js "$TARGET"
node ./build-scripts/build.js "$TARGET"

# if you also have to make nightly releases check for DEVEL_RELEASE = 1
#
# if [ "${DEVEL_RELEASE-}" = 1 ]; then
# 	nightly build steps
# else
# 	regular build steps
# fi