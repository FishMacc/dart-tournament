#!/usr/bin/env bash
# Double-click on macOS (or run ./Start-Mac-Linux.command on Linux)
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js ist nicht installiert."
    echo "Bitte die LTS-Version von https://nodejs.org installieren und danach erneut starten."
    (open https://nodejs.org/ || xdg-open https://nodejs.org/) >/dev/null 2>&1
    read -r -p "Enter zum Schliessen..."
    exit 1
fi

echo "Dart Tournament wird gestartet... Dieses Fenster bitte NICHT schliessen!"
node scripts/start.mjs
