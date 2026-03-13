#!/bin/bash
#
# build-win.sh
#
# Windows build script for NeutralinoJS
#
# Call:
# ./build-win.sh
#
# Requirements:
# brew install jq 
#
# (c)2023-2024 Harald Schneider - marketmix.com

VERSION='1.1.0'

OS=$(uname -s)

echo
echo -e "\033[1mNeutralino BuildScript for Windows platform, version ${VERSION}\033[0m"

CONF=./neutralino.config.json

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

if ! jq -e '.buildScript | has("win")' "${CONF}" > /dev/null; then
    echo
    echo -e "\033[31m\033[1mERROR: Missing buildScript JSON structure in ${CONF}\033[0m"
    exit 1
fi

APP_ARCH_LIST=($(jq -r '.buildScript.win.architecture[]' ${CONF}))
APP_BINARY=$(jq -r '.cli.binaryName' ${CONF})
APP_NAME=$(jq -r '.buildScript.win.appName' ${CONF})
APP_ICON=$(jq -r '.buildScript.win.appIcon' ${CONF})

if [[ $APP_NAME != *".exe"* ]]; then
    APP_NAME=${APP_NAME}.exe
fi

APP_SRC=./build-scripts/_app_scaffolds/win

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

    APP_DST=./dist/win_${APP_ARCH}

    if [ -e "./preproc-win.sh" ]; then
        echo "  Running pre-processor ..."
        . preproc-win.sh
    fi
 
    EXE=./dist/${APP_BINARY}/${APP_BINARY}-win_${APP_ARCH}.exe
    RES=./dist/${APP_BINARY}/resources.neu
    EXT=./dist/${APP_BINARY}/extensions

    echo 
    echo -e "\033[1mBuilding App Bundle (${APP_ARCH}):\033[0m"
    echo
    echo "  App Name:      ${APP_NAME}"
    echo "  Target Folder: ${APP_DST}"
    echo

    if [ ! -e "./${EXE}" ]; then
        echo -e "\033[31m\033[1m  ERROR: Binary file not found: ${EXE}\033[0m"
        exit 1
    fi

    if [ ! -e "./${RES}" ]; then
        echo -e "\033[31m\033[1m  ERROR: Resource file not found: ${RES}\033[0m"
        exit 1
    fi

    echo "  Creating target folder ..."
    mkdir -p "${APP_DST}"
    
    if [ -e "./${APP_ICON}" ]; then

        echo "  Cloning scaffold ..."

        set +f
        cp ${APP_SRC}/* "${APP_DST}/"
        set -f

        #if [ "$OS" == "Darwin" ]; then
        #  sed -i '' "s/{APP_NAME}/${APP_NAME}/g" "${APP_DST}/install-icon.cmd"
        #  sed -i '' "s/{APP_ICON}/${APP_ICON}/g" "${APP_DST}/install-icon.cmd"
        #else
        #  sed -i "s/{APP_NAME}/${APP_NAME}/g" "${APP_DST}/install-icon.cmd"
        #  sed -i "s/{APP_ICON}/${APP_ICON}/g" "${APP_DST}/install-icon.cmd"
        #fi
    fi

    echo "  Copying content:"
    echo "    - Binary File"
    cp "${EXE}" "${APP_DST}/${APP_NAME}"
    echo "    - Resources"
    cp "${RES}" "${APP_DST}/"

    if [ -e "./${EXT}" ]; then
        echo "    - Extensions"
        cp -r "${EXT}" "${APP_DST}/"
    fi

    if [ -e "./${APP_ICON}" ]; then
        echo "    - Icon"
        #cp -r "${APP_ICON}" "${APP_DST}/"
    fi

    if [ -e "./postproc-win.sh" ]; then
        echo "  Running post-processor ..."
        . postproc-win.sh
    fi

    echo "  Compressing Windows bundle for ${APP_ARCH} ..."
    
    PUSHED_DIR=$(pwd)
    cd "./dist" || exit
    
    ZIP_NAME="${APP_NAME%.exe}-win-${APP_ARCH}.zip"
    
    zip -9 -rq "${ZIP_NAME}" "win_${APP_ARCH}"
    
    cd "${PUSHED_DIR}" || exit
    echo "  Package created: ./dist/${ZIP_NAME}"

    echo
    echo -e "\033[1mBuild finished.\033[0m"

    if [ -e "./${APP_ICON}" ]; then
        echo
        echo -e "\033[32m\033[1mDouble-click install-icon.cmd on a Windows machine to apply the app icon.\033[0m"
    fi
done

echo 
echo -e "\033[1mAll done.\033[0m"
