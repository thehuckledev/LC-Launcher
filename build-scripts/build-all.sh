#!/bin/bash
echo "Building for all platforms..."

chmod +x ./build-scripts/build-linux.sh ./build-scripts/build-mac.sh ./build-scripts/build-win.sh

./build-scripts/build-linux.sh
./build-scripts/build-mac.sh
./build-scripts/build-win.sh

echo 
echo -e "\033[1mAll platforms built.\033[0m"