#!/usr/bin/env bash
# Double-click on macOS (or run ./Start-Mac-Linux.command on Linux)
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js is not installed."
    echo "Please install the LTS version from https://nodejs.org and start again."
    (open https://nodejs.org/ || xdg-open https://nodejs.org/) >/dev/null 2>&1
    read -r -p "Press Enter to close..."
    exit 1
fi

echo "Starting Dart Tournament... Please do NOT close this window!"
node scripts/start.mjs
