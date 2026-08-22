# 🎯 Dart Tournament Software

Lokale LAN-basierte Dart-Turnier-Software. Erstelle Turniere auf dem PC und lass Spieler über ihre Smartphones Punkte eingeben.

## Features
- Unterstützung für 301, 501 und mehr
- Automatische Turnierbaum-Generierung
- QR-Code für einfachen mobilen Zugriff
- Live-Updates via WebSockets
- Intuitive Punkte-Eingabe auf dem Smartphone

## Setup
```bash
npm install
npm run dev
```

## Schnellstart

```bash
npm run install:all   # Server- und Client-Abhängigkeiten installieren
npm run dev           # Server und Client gleichzeitig starten
```

Für ein Turnier vor Ort wird empfohlen, vorher den Client zu bauen:

```bash
npm run build         # Erzeugt client/dist
```

Dann startet nur noch der Server die Anwendung:

```bash
cd server
node src/server.js
```

## Technologie
- **Backend**: Node.js + Express + Socket.io
- **Frontend**: React + Vite
- **Tests**: Vitest

## Projektstruktur

```
dart-tournament/
├── server/              # Node.js + Express + Socket.io Backend
├── client/              # React + Vite Frontend
├── package.json         # Root-Skripte
├── package-lock.json
├── INSTALL.txt          # Installationsanleitung für Endnutzer
├── TURNIER_GUIDE.md     # Schritt-für-Schritt Turnierleitfaden
├── start_turnier.bat
├── build_release.js
└── README.md            # Diese Datei
```

## Lizenz

Keine Lizenzdatei im Repository hinterlegt.
