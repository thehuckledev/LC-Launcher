#!/bin/bash
#
# build-linux.sh
#
# Linux build script for NeutralinoJS
#
# Call:
# ./build-linux.sh
#
# Requirements:
# brew install jq 
#
# (c)2023-2024 Harald Schneider - marketmix.com

VERSION='1.0.8'

OS=$(uname -s)

echo
echo -e "\033[1mNeutralino BuildScript for Linux platform, version ${VERSION}\033[0m"

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

if ! jq -e '.buildScript | has("linux")' "${CONF}" > /dev/null; then
    echo
    echo -e "\033[31m\033[1mERROR: Missing buildScript JSON structure in ${CONF}\033[0m"
    exit 1
fi

APP_ARCH_LIST=($(jq -r '.buildScript.linux.architecture[]' ${CONF}))
APP_VERSION=$(jq -r '.version' ${CONF})
APP_BINARY=$(jq -r '.cli.binaryName' ${CONF})
APP_NAME=$(jq -r '.buildScript.linux.appName' ${CONF})
APP_ICON=$(jq -r '.buildScript.linux.appIcon' ${CONF})
APP_ICON_PATH=$(jq -r '.buildScript.linux.appIconLocation' ${CONF})

if jq -e '.buildScript.linux.appPath'  "${CONF}" &> /dev/null; then
  APP_PATH=$(jq -r '.buildScript.linux.appPath' ${CONF})
else
  echo
  echo -e "\033[31m\033[1mWARNING: Please set appPath in neutralino.config.json!\033[0m"
  APP_PATH="/usr/share/${APP_NAME}"
fi

APP_BASEPATH=$(echo ${APP_PATH} | awk -v replacement="" -v search="/${APP_NAME}" '{gsub(search, replacement)}1')

if jq -e '.buildScript.linux.appIconPath'  "${CONF}" &> /dev/null; then
  APP_ICON_PATH=$(jq -r '.buildScript.linux.appIconPath' ${CONF})
else
  echo
  echo -e "\033[31m\033[1mWARNING: Please set appIconPath in neutralino.config.json!\033[0m"
  APP_ICON_PATH="/usr/share/${APP_NAME}"
fi

APP_SRC=./build-scripts/_app_scaffolds/linux/myapp.desktop
INSTALL_SCRIPT=./build-scripts/_app_scaffolds/linux/install.sh

if [ ! -e "./${APP_SRC}" ]; then
    echo
    echo -e "\033[31m\033[1mERROR: App scaffold not found: ${APP_SRC}\033[0m"
    exit 1
fi

if [ ! -e "./${INSTALL_SCRIPT}" ]; then
    echo
    echo -e "\033[31m\033[1mERROR: App install script not found: ${INSTALL_SCRIPT}\033[0m"
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

    APP_DST=./dist/linux_${APP_ARCH}/${APP_NAME}

    if [ -e "./preproc-linux.sh" ]; then
        echo "  Running pre-processor ..."
        . preproc-linux.sh
    fi

    EXE=./dist/${APP_BINARY}/${APP_BINARY}-linux_${APP_ARCH}
    RES=./dist/${APP_BINARY}/resources.neu
    EXT=./dist/${APP_BINARY}/extensions

    APP_EXEC=${APP_PATH}/${APP_BINARY}-linux_${APP_ARCH}
    chmod +x "${APP_DST}"

    echo
    echo -e "\033[1mBuilding App Bundle (${APP_ARCH}):\033[0m"
    echo
    echo "  App Name:           ${APP_NAME}"
    echo "  App Executable:     ${APP_EXEC}"
    echo "  Icon:               ${APP_ICON}"
    echo "  Icon Install Path:  ${APP_ICON_PATH}"
    echo "  App Path:           ${APP_PATH}"
    echo "  Target Folder:      ${APP_DST}"
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
    cp "${APP_SRC}" "${APP_DST}/${APP_NAME}.desktop"
    cp "${INSTALL_SCRIPT}" "${APP_DST}"

    echo "  Copying content:"
    echo "    - Binary File"
    cp "${EXE}" "${APP_DST}/"
    echo "    - Resources"
    cp "${RES}" "${APP_DST}/"

    if [ -e "./${EXT}" ]; then
        echo "    - Extensions"
        cp -r "${EXT}" "${APP_DST}/"
    fi

    if [ -e "./${APP_ICON}" ]; then
        echo "    - Icon"
        cp -r "${APP_ICON}" "${APP_DST}/"
    fi

    echo "  Processing Desktop File ..."

    if [ "$OS" == "Darwin" ]; then
      sed -i '' "s/{APP_NAME}/${APP_NAME}/g" "${APP_DST}/${APP_NAME}.desktop"
      sed -i '' "s|{APP_ICON_LOCATION}|${APP_ICON_PATH}|g" "${APP_DST}/${APP_NAME}.desktop"
      sed -i '' "s|{APP_ICON_PATH}|${APP_ICON_PATH}|g" "${APP_DST}/${APP_NAME}.desktop"
      sed -i '' "s|{APP_PATH}|${APP_PATH}|g" "${APP_DST}/${APP_NAME}.desktop"
      sed -i '' "s|{APP_EXEC}|${APP_EXEC}|g" "${APP_DST}/${APP_NAME}.desktop"

      sed -i '' "s|{APP_NAME}|${APP_NAME}|g" "${APP_DST}/install.sh"
      sed -i '' "s|{APP_PATH}|${APP_PATH}|g" "${APP_DST}/install.sh"
      sed -i '' "s|{APP_BASEPATH}|${APP_BASEPATH}|g" "${APP_DST}/install.sh"
      sed -i '' "s|{APP_EXEC}|${APP_EXEC}|g" "${APP_DST}/install.sh"
      sed -i '' "s|{APP_ICON}|${APP_ICON}|g" "${APP_DST}/install.sh"
      sed -i '' "s|{APP_ICON_PATH}|${APP_ICON_PATH}|g" "${APP_DST}/install.sh"
    else
      sed -i "s/{APP_NAME}/${APP_NAME}/g" "${APP_DST}/${APP_NAME}.desktop"
      sed -i "s|{APP_ICON_LOCATION}|${APP_ICON_PATH}|g" "${APP_DST}/${APP_NAME}.desktop"
      sed -i "s|{APP_ICON_PATH}|${APP_ICON_PATH}|g" "${APP_DST}/${APP_NAME}.desktop"
      sed -i "s|{APP_PATH}|${APP_PATH}|g" "${APP_DST}/${APP_NAME}.desktop"
      sed -i "s|{APP_EXEC}|${APP_EXEC}|g" "${APP_DST}/${APP_NAME}.desktop"

      sed -i "s|{APP_NAME}|${APP_NAME}|g" "${APP_DST}/install.sh"
      sed -i "s|{APP_PATH}|${APP_PATH}|g" "${APP_DST}/install.sh"
      sed -i "s|{APP_BASEPATH}|${APP_BASEPATH}|g" "${APP_DST}/install.sh"
      sed -i "s|{APP_EXEC}|${APP_EXEC}|g" "${APP_DST}/install.sh"
      sed -i "s|{APP_ICON}|${APP_ICON}|g" "${APP_DST}/install.sh"
      sed -i "s|{APP_ICON_PATH}|${APP_ICON_PATH}|g" "${APP_DST}/install.sh"
    fi

    if [ -e "./postproc-linux.sh" ]; then
        echo "  Running post-processor ..."
        . postproc-linux.sh
    fi

    echo "  Compressing bundle for ${APP_ARCH} ..."

    PUSHED_DIR=$(pwd)
    cd "./dist/linux_${APP_ARCH}" || exit

    TAR_NAME="${APP_NAME}-linux-${APP_ARCH}.tar.gz"
    
    tar -cJf "../${TAR_NAME}" "${APP_NAME}"
    
    cd "${PUSHED_DIR}" || exit
    echo "  Package created: ./dist/${TAR_NAME}"

    echo
    echo -e "\033[1mBuild finished.\033[0m"
done

echo
echo -e "\033[1mI propose the following paths for your installer:\033[0m"
echo
echo "  Application Folder: ${APP_PATH}"
echo "  Application Icon:   ${APP_ICON_PATH}"
echo "  Desktop File:       /usr/share/applications/${APP_NAME}.desktop"
echo
echo "You can call ./install.sh to start a quick installation on the target machine."

echo 
echo -e "\033[1mAll done.\033[0m"
