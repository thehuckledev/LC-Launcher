#!/bin/bash
echo "Building for all platforms..."

chmod +x ./build-scripts/build-linux.sh ./build-scripts/build-mac.sh ./build-scripts/build-win.sh

./build-scripts/build-linux.sh
./build-scripts/build-mac.sh
./build-scripts/build-win.sh

echo 
echo -e "\033[1mAll platforms built.\033[0m"

echo -e "\033[1mMAKE SURE THAT tokenSecurity was set to one-time in neutralino CONFIG!\033[0m"
echo -e "\033[1mAlso disable webInspector prop in neutralino config!\033[0m"