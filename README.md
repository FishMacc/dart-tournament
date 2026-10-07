# 🎯 Dart Tournament (DartVault)

Lokale Dart-Turnier-Software fürs WLAN: Der Laptop zeigt Turnierbaum und Live-Scores (gerne am Beamer/TV), die Spieler tragen ihre Würfe per Smartphone ein – einfach QR-Code scannen, keine App, kein Internet nötig.

## Features
- 301 / 501 / 701, Best-of-Legs, Double-Out optional
- Automatischer K.-o.-Turnierbaum inkl. Freilosen
- Smartphone-Scoring per QR-Code, Match-PIN gegen falsche Eingaben
- Live-Ansicht, Statistiken (3-Dart-Average, Highest Finish, 180er), Preisgeld-Verteilung
- Turnierstand wird automatisch gespeichert und übersteht einen Neustart

## Schnellstart

**Voraussetzung:** [Node.js](https://nodejs.org) 18 oder neuer (LTS-Version).

| System | Starten |
|---|---|
| Windows | `Start-Windows.bat` doppelklicken |
| macOS | `Start-Mac-Linux.command` doppelklicken (beim ersten Mal ggf. Rechtsklick → Öffnen) |
| Linux / Terminal | `npm install` und dann `npm start` |

Beim ersten Start werden die Abhängigkeiten installiert und die Oberfläche gebaut (dauert 1–2 Minuten, Internet nötig). Danach öffnet sich der Browser automatisch auf `http://localhost:3000`.

Im Fenster/Terminal stehen alle Adressen:
```
Host (dieser PC):  http://localhost:3000
Handys (Scoring):  http://192.168.x.x:3000/mobile
Admin von anderem Gerät: http://192.168.x.x:3000/?admin=1a2b3c4d
```

## So läuft ein Turnier
1. Am Laptop **Turnier erstellen**, Spieler eintragen, **Starten**.
2. Spieler scannen den QR-Code auf dem Turnier-Bildschirm mit dem Handy.
3. Auf dem Handy das eigene Spiel wählen, die **PIN** vom Host-Bildschirm eingeben, Spiel starten und Würfe eintragen.

Nur der Laptop (bzw. ein Gerät, das den Admin-Link geöffnet hat) kann Turniere anlegen, zurücksetzen und die PINs sehen. Alle anderen Geräte sehen die Handy-Übersicht.

Ausführliche Anleitung für den Turniertag: [TURNIER_GUIDE.md](TURNIER_GUIDE.md)

## Einstellungen (Umgebungsvariablen)
| Variable | Standard | Zweck |
|---|---|---|
| `PORT` | `3000` | Server-Port |
| `HOST_IP` | automatisch | IP für QR-Code/Links erzwingen (falls die falsche Netzwerkkarte erkannt wird) |
| `ADMIN_KEY` | zufällig, in `server/data/admin_key.txt` | Schlüssel für den Admin-Link |
| `DART_DATA_DIR` | `server/data` | Speicherort für Turnierstand |
| `NO_BROWSER` | – | Browser beim Start nicht öffnen |

Beispiel: `PORT=8080 npm start` (Windows: `set PORT=8080 && npm start`).

## Entwicklung
```bash
npm install          # installiert Root, Server und Client
npm run dev          # Server (Port 3000, Auto-Reload) + Vite (Port 5173)
npm run test:all     # Server- und Client-Tests
npm run build        # Client bauen (client/dist)
npm run release      # Portabler Ordner in dist/DartTournament (zum Weitergeben)
```
Im Dev-Modus sind die Handys über `http://<LAN-IP>:5173/mobile` erreichbar.

## Projektstruktur
```
dart-tournament/
├── server/                  # Node.js + Express + Socket.IO
│   ├── src/                 # Spiellogik, Turnierbaum, Sockets, Host-Rechte
│   └── tests/               # Vitest
├── client/                  # React + Vite
├── scripts/start.mjs        # Ein-Befehl-Start (installieren, bauen, starten)
├── scripts/build-release.mjs
├── Start-Windows.bat
├── Start-Mac-Linux.command
├── INSTALL.txt              # Kurzanleitung für den portablen Ordner
└── TURNIER_GUIDE.md
```

## Technologie
Node.js, Express, Socket.IO · React 18, React Router, Vite · Vitest, Testing Library
