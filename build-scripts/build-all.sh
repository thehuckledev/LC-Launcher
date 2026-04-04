#!/bin/bash
echo "Building for all platforms..."

CONF=./neutralino.config.json

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

sed -i '' 's/"enableInspector": *true/"enableInspector": false/' "$CONF"
sed -i '' 's/"tokenSecurity": *"none"/"tokenSecurity": "one-time"/' "$CONF"

chmod +x ./build-scripts/build-linux.sh ./build-scripts/build-mac.sh ./build-scripts/build-win.sh

./build-scripts/build-linux.sh
./build-scripts/build-mac.sh
./build-scripts/build-win.sh

sed -i '' 's/"enableInspector": *false/"enableInspector": true/' "$CONF"
sed -i '' 's/"tokenSecurity": *"one-time"/"tokenSecurity": "none"/' "$CONF"

echo 
echo -e "\033[1mAll platforms built.\033[0m"