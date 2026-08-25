#!/usr/bin/env bash

# Install LC Launcher using this command:
#
# curl -sSL https://install.lce-launcher.com | bash
#
# OR
#
# wget -qO- https://install.lce-launcher.com | bash

set -euo pipefail

readonly APP_NAME="LC Launcher"
readonly SAFE_NAME="lc-launcher"
readonly GITHUB_USER="thehuckledev"
readonly GITHUB_REPO="LC-Launcher"

readonly INSTALL_DIR="$HOME/.local/share/$SAFE_NAME"
readonly BIN_DIR="$HOME/.local/bin"
readonly DESKTOP_DIR="$HOME/.local/share/applications"
readonly APPIMAGE_PATH="$INSTALL_DIR/$SAFE_NAME.AppImage"
readonly ICON_PATH="$INSTALL_DIR/$SAFE_NAME.png"
readonly DESKTOP_PATH="$DESKTOP_DIR/$SAFE_NAME.desktop"

readonly C_RESET="\033[0m"
readonly C_BOLD="\033[1m"
readonly C_BLUE="\033[1;34m"
readonly C_GREEN="\033[1;32m"
readonly C_YELLOW="\033[1;33m"
readonly C_RED="\033[1;31m"
readonly C_CYAN="\033[1;36m"

log() { printf "[%bINFO%b] %s\n" "${C_BLUE}" "${C_RESET}" "$*" >&2; }
warn() { printf "[%bWARN%b] %s\n" "${C_YELLOW}" "${C_RESET}" "$*" >&2; }
error() { printf "[%bERROR%b] %s\n" "${C_RED}" "${C_RESET}" "$*" >&2; exit 1; }

fetch_text() {
    local url="$1"
    if command -v curl &> /dev/null; then
        curl -fsSL "$url" && return 0
    fi
    if command -v wget &> /dev/null; then
        wget -qO- "$url" && return 0
    fi
    return 1
}

download_file() {
    local url="$1"
    local output_path="$2"
    if command -v curl &> /dev/null; then
        curl -fL --progress-bar "$url" -o "$output_path" && return 0
    fi
    if command -v wget &> /dev/null; then
        wget -q --show-progress "$url" -O "$output_path" && return 0
    fi
    return 1
}

check_webkit_dependency() {
    log "Checking for WebKitGTK..."
    if ! ldconfig -p 2>/dev/null | grep -qE 'libwebkit2gtk-4\.1\.so\.0|libwebkit2gtk-4\.0\.so\.37'; then

        warn "Missing libwebkit2gtk, attempting to install..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y libwebkit2gtk-4.1-0
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y webkit2gtk4.1
        elif command -v pacman &> /dev/null; then
            sudo pacman -Sy --noconfirm webkit2gtk-4.1
        elif command -v zypper &> /dev/null; then
            sudo zypper install -y webkit2gtk3-soup2
        else
            warn "Couldn't find package manager, install WebKitGTK 4.1 manually"
        fi
    else
        log "Found WebKitGTK"
    fi
}

get_download_url() {
    log "Fetching GitHub release..."
    local api_url="https://api.github.com/repos/$GITHUB_USER/$GITHUB_REPO/releases/latest"
    local release_json
    
    if ! release_json=$(fetch_text "$api_url"); then
        error "Failed to fetch GitHub release"
    fi

    local arch
    arch=$(uname -m)
    
    local target_arch="x64"
    if [[ "$arch" == "aarch64" || "$arch" == "arm64" ]]; then
        target_arch="arm64"
    fi

    local download_url=""
    
    while read -r line; do
        if [[ $line =~ \"browser_download_url\":\ *\"([^\"]*-linux-${target_arch}\.([aA]pp[iI]mage))\" ]]; then
            local candidate="${BASH_REMATCH[1]}"
            if [[ "$candidate" != *portable* ]]; then
                download_url="$candidate"
                break
            fi
        fi
    done <<< "$release_json"

    if [[ -z "$download_url" ]]; then
        while read -r line; do
            if [[ $line =~ \"browser_download_url\":\ *\"([^\"]*-linux-${target_arch}\.([aA]pp[iI]mage))\" ]]; then
                download_url="${BASH_REMATCH[1]}"
                break
            fi
        done <<< "$release_json"
    fi

    if [[ -z "$download_url" ]]; then
        while read -r line; do
            if [[ $line =~ \"browser_download_url\":\ *\"([^\"]+\.([aA]pp[iI]mage))\" ]]; then
                download_url="${BASH_REMATCH[1]}"
                break
            fi
        done <<< "$release_json"
    fi

    if [[ -z "$download_url" ]]; then
        error "A .AppImage wasn't in the GitHub release"
    fi

    echo "$download_url"
}

download_appimage() {
    local download_url="$1"
    log "Downloading latest release..."
    mkdir -p "$(dirname "$APPIMAGE_PATH")"
    
    if ! download_file "$download_url" "$APPIMAGE_PATH"; then
        error "Failed to download .AppImage"
    fi

    chmod +x "$APPIMAGE_PATH"
}

create_symlink() {
    log "Creating bin symlink..."
    ln -sf "$APPIMAGE_PATH" "$BIN_DIR/$SAFE_NAME"
}

extract_desktop_assets() {
    log "Extracting desktop shortcut and icon..."
    (
        cd "$INSTALL_DIR"
        
        "$APPIMAGE_PATH" --appimage-extract &> /dev/null

        if [ -L "squashfs-root" ] || [ -e "squashfs-root" ]; then
            rm -rf "squashfs-root"
        fi

        if [ ! -d "AppDir" ]; then
            error "AppImage extraction failed"
        fi

        if [ -f "AppDir/.DirIcon" ]; then
            cp "AppDir/.DirIcon" "$ICON_PATH"
        else
            local found_icon
            found_icon=$(find AppDir -name "*.png" -print -quit 2>/dev/null)
            if [ -n "$found_icon" ]; then
                cp "$found_icon" "$ICON_PATH"
            fi
        fi

        local found_desktop
        found_desktop=$(find AppDir -maxdepth 2 -name "*.desktop" -print -quit 2>/dev/null)

        if [ -z "$found_desktop" ]; then
            rm -rf AppDir
            exit 1
        fi

        cp "$found_desktop" "$DESKTOP_PATH"
        
        sed -i "s|^Exec=.*|Exec=$BIN_DIR/$SAFE_NAME %U|" "$DESKTOP_PATH"
        if [ -f "$ICON_PATH" ]; then
            sed -i "s|^Icon=.*|Icon=$ICON_PATH|" "$DESKTOP_PATH"
        fi
        
        rm -rf AppDir
    ) || error "Failed to extract .desktop file from the AppImage"

    chmod +x "$DESKTOP_PATH"
}

main() {
    printf '\033[2J\033[3J\033[H'
    printf "%b=================================================================%b\n" "${C_CYAN}" "${C_RESET}"
    printf "  Installing %b%s%b\n" "${C_BOLD}" "$APP_NAME" "${C_RESET}"
    printf "%b=================================================================%b\n" "${C_CYAN}" "${C_RESET}\n"

    mkdir -p "$INSTALL_DIR" "$BIN_DIR" "$DESKTOP_DIR"
    check_webkit_dependency
    
    local download_url
    download_url=$(get_download_url)
    
    download_appimage "$download_url"
    create_symlink
    extract_desktop_assets
    
    if command -v update-desktop-database &> /dev/null; then
        update-desktop-database "$DESKTOP_DIR"
    fi

    printf "\n%b=================================================================%b\n" "${C_CYAN}" "${C_RESET}"
    printf "  %b✓%b %b%s%b installed\n" "${C_GREEN}" "${C_RESET}" "${C_BOLD}" "$APP_NAME" "${C_RESET}"
    printf "  Launch it from your applications menu\n"
    printf "%b=================================================================%b\n\n" "${C_CYAN}" "${C_RESET}"
}

main "$@"