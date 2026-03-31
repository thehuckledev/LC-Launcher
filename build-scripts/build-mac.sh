#!/bin/bash
#
# build-mac.sh
#
# macOS build script for NeutralinoJS
#
# Call:
# ./build-mac.sh
#
# Requirements:
# brew install jq
#
# (c)2023-2024 Harald Schneider - marketmix.com

VERSION='1.0.7'

OS=$(uname -s)

echo
echo -e "\033[1mNeutralino BuildScript for macOS platform, version ${VERSION}\033[0m"

CONF=./neutralino.config.json

if [ ! -d "./node_modules/@neutralinojs/neu" ]; then
    echo
    echo Installing Node Modules...
    npm i
fi

if [ ! -e "./bin/neutralino-win_x64.exe" ]; then
    echo
    echo Downloading Neutralino Binaries
    npx neu update
fi

if ! command -v jq >/dev/null 2>&1
then
    echo -e "\033[31m\033[1mWARNING: JQ not found. Installing..\033[0m"
    brew install jq || pacman -S jq || sudo apt-get install jq || true
fi

if [ ! -e "./${CONF}" ]; then
    echo
    echo -e "\033[31m\033[1mERROR: ${CONF} not found.\033[0m"
    exit 1
fi

if ! jq -e '.buildScript | has("mac")' "${CONF}" > /dev/null; then
    echo
    echo -e "\033[31m\033[1mERROR: Missing buildScript JSON structure in ${CONF}\033[0m"
    exit 1
fi

APP_ARCH_LIST=($(jq -r '.buildScript.mac.architecture[]' ${CONF}))
APP_VERSION=$(jq -r '.version' ${CONF})
APP_MIN_OS=$(jq -r '.buildScript.mac.minimumOS' ${CONF})
APP_BINARY=$(jq -r '.cli.binaryName' ${CONF})
APP_NAME=$(jq -r '.buildScript.mac.appName' ${CONF})
APP_ID=$(jq -r '.buildScript.mac.appIdentifier' ${CONF})
APP_BUNDLE=$(jq -r '.buildScript.mac.appBundleName' ${CONF})
APP_ICON=$(jq -r '.buildScript.mac.appIcon' ${CONF})
APP_CREDITS=$(jq -r '.buildScript.mac.appCredits' ${CONF})

APP_SRC=./build-scripts/_app_scaffolds/mac/myapp.app

if [ ! -e "./${APP_SRC}" ]; then
    echo
    echo -e "\033[31m\033[1mERROR: App scaffold not found: ${APP_SRC}\033[0m"
    exit 1
fi

if [ "$1" != "--test" ]; then
    echo
    echo -e "\033[1mBuilding Neutralino Apps ...\033[0m"
    echo
    rm -rf "./dist/${APP_BINARY}"
    npx neu build
    echo -e "\033[1mDone.\033[0m"
else
    echo
    echo "Skipped 'npx neu build' in test-mode ..."
fi

for APP_ARCH in "${APP_ARCH_LIST[@]}"; do
    rm -rf "./dist/mac_${APP_ARCH}"

    APP_DST=./dist/mac_${APP_ARCH}/${APP_NAME}.app
    APP_MACOS=${APP_DST}/Contents/MacOS
    APP_RESOURCES=${APP_DST}/Contents/Resources

    if [ -e "./preproc-mac.sh" ]; then
        echo "  Running pre-processor ..."
        . preproc-mac.sh
    fi

    EXE=./dist/${APP_BINARY}/${APP_BINARY}-mac_${APP_ARCH}
    RES=./dist/${APP_BINARY}/resources.neu
    EXT=./dist/${APP_BINARY}/extensions

    echo 
    echo -e "\033[1mBuilding App Bundle (${APP_ARCH}):\033[0m"
    echo
    echo "  Minimum macOS: ${APP_MIN_OS}"
    echo "  App Name:      ${APP_NAME}"
    echo "  Bundle Name:   ${APP_BUNDLE}"
    echo "  Identifier:    ${APP_ID}"
    echo "  Icon:          ${APP_ICON}"
    echo "  Credits:       ${APP_CREDITS}"
    echo "  Source Folder: ${APP_SRC}"
    echo "  Target Folder: ${APP_DST}"
    echo

    if [ ! -e "./${EXE}" ]; then
        echo -e "\033[31m\033[1m  ERROR: File not found: ${EXE}\033[0m"
        exit 1
    fi

    if [ ! -e "./${RES}" ]; then
        echo -e "\033[31m\033[1m  ERROR: Resource file not found: ${RES}\033[0m"
        exit 1
    fi

    echo "  Cloning scaffold ..."
    mkdir -p "${APP_DST}"
    cp -r ${APP_SRC}/* ${APP_DST}/

    echo "  Copying content:"
    echo "    - Binary File"
    cp "${EXE}" "${APP_MACOS}/main"
    chmod 755 "${APP_MACOS}/main"
    echo "    - Resources"
    cp "${RES}" "${APP_RESOURCES}/"

    if [ -e "./${EXT}" ]; then
        echo "    - Extensions"
        cp -r "${EXT}" "${APP_RESOURCES}/"
    fi

    if [ -e "./${APP_ICON}" ]; then
        echo "    - Icon"
        cp -r "${APP_ICON}" "${APP_RESOURCES}/"
    fi

    echo "  Processing Info.plist ..."

    if [ "$OS" == "Darwin" ]; then
      sed -i '' "s/{APP_NAME}/${APP_NAME}/g" "${APP_DST}/Contents/Info.plist"
      sed -i '' "s/{APP_BUNDLE}/${APP_BUNDLE}/g" "${APP_DST}/Contents/Info.plist"
      sed -i '' "s/{APP_ID}/${APP_ID}/g" "${APP_DST}/Contents/Info.plist"
      sed -i '' "s/{APP_VERSION}/${APP_VERSION}/g" "${APP_DST}/Contents/Info.plist"
      sed -i '' "s/{APP_MIN_OS}/${APP_MIN_OS}/g" "${APP_DST}/Contents/Info.plist"
      sed -i '' "s/{APP_CREDITS}/${APP_CREDITS}/g" "${APP_DST}/Contents/Info.plist"
    else
      sed -i "s/{APP_NAME}/${APP_NAME}/g" "${APP_DST}/Contents/Info.plist"
      sed -i "s/{APP_BUNDLE}/${APP_BUNDLE}/g" "${APP_DST}/Contents/Info.plist"
      sed -i "s/{APP_ID}/${APP_ID}/g" "${APP_DST}/Contents/Info.plist"
      sed -i "s/{APP_VERSION}/${APP_VERSION}/g" "${APP_DST}/Contents/Info.plist"
      sed -i "s/{APP_MIN_OS}/${APP_MIN_OS}/g" "${APP_DST}/Contents/Info.plist"
      sed -i "s/{APP_CREDITS}/${APP_CREDITS}/g" "${APP_DST}/Contents/Info.plist"
    fi

    if [ -e "./postproc-mac.sh" ]; then
        echo "  Running post-processor ..."
        . postproc-mac.sh
    fi

    if [ "$OS" == "Darwin" ]; then
      echo "  Clearing Extended Attributes ..."
      find "${APP_DST}" -type f -exec xattr -c {} \;
    fi

    echo "  Compressing bundle for ${APP_ARCH} ..."
        
    PUSHED_DIR=$(pwd)
    cd "./dist/mac_${APP_ARCH}" || exit
    
    ZIP_NAME="${APP_NAME}-mac-${APP_ARCH}.zip"
    
    zip -9 -ryX "../${ZIP_NAME}" "${APP_NAME}.app"
    
    cd "${PUSHED_DIR}" || exit
    echo "  Package created: ./dist/${ZIP_NAME}"

    echo
    echo -e "\033[1mBuild finished, ready to sign and notarize.\033[0m"
done

echo 
echo -e "\033[1mAll done.\033[0m"
