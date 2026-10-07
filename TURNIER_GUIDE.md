# 🎯 DartVault – Leitfaden für den Turniertag

## 🏠 1. Vorbereitung (zuhause, mit Internet)

1. [Node.js](https://nodejs.org) (LTS) installieren.
2. Einmal starten: `Start-Windows.bat` bzw. `Start-Mac-Linux.command` doppelklicken (oder `npm install && npm start`).
   Dabei werden Abhängigkeiten installiert und die App gebaut. Danach läuft alles **ohne Internet**.
3. Kurz ein Test-Turnier mit 2 Spielern und einem Handy durchspielen, dann **Turnier zurücksetzen**.

---

## 🏟️ 2. Am Turniertag

### A. Geräte & Aufbau
* **1 Laptop**: Server & Host. Zeigt Turnierbaum und Live-Scores am **Beamer/TV**.
* **Handys/Tablets**: Zum Eintragen der Punkte.
* **WLAN**: Alle Geräte im **gleichen WLAN**.
  *Tipp:* Kein WLAN vor Ort? Handy-Hotspot aufmachen und den Laptop damit verbinden.

### B. Software starten
1. Starter doppelklicken. Im Fenster erscheint:
   ```
   Host (dieser PC):  http://localhost:3000
   Handys (Scoring):  http://192.168.1.5:3000/mobile
   Admin von anderem Gerät: http://192.168.1.5:3000/?admin=1a2b3c4d
   ```
2. Der Browser öffnet sich automatisch. Fenster offen lassen!

### C. Turnier
1. **Am Laptop:** Turnier erstellen (Modus, Legs, PIN-Schutz …), Spieler eintragen, starten.
2. **Handys:** QR-Code auf dem Turnier-Bildschirm scannen (oder die Handy-Adresse eintippen).
3. Spiel antippen → **PIN** vom Laptop-Bildschirm eingeben → **Spiel starten** → Würfe eintragen.
   Verbindungsabbruch? Kein Problem, das Handy meldet sich mit der PIN automatisch wieder an.
4. Falsch getippt? **Rückgängig** auf dem Handy. (Nicht mehr möglich, wenn der Sieger schon sein nächstes Spiel begonnen hat.)

Nur der Laptop sieht die PINs und kann das Turnier ändern. Soll ein zweites Gerät (z.B. Tablet an der Theke) auch Admin sein, dort den **Admin-Link** aus dem Fenster öffnen.

---

## ⚠️ 3. Checkliste

- [ ] Ladekabel für den Laptop
- [ ] WLAN-Kennwort oder Hotspot bereit
- [ ] Schlafmodus/Bildschirmsperre an Laptop und Tablets deaktiviert
- [ ] Vorab einmal gestartet (siehe Vorbereitung)

---

## 🆘 Troubleshooting

* **Handys finden die Seite nicht?**
  * Alle im *selben* WLAN? Gast-WLANs blockieren Verbindungen zwischen Geräten.
  * Windows fragt "Zugriff zulassen?" → **Ja** (für private Netzwerke).
  * QR-Code zeigt eine komische Adresse (VPN, virtuelle Netzwerkkarte)? VPN trennen oder IP erzwingen: `set HOST_IP=192.168.1.5` (Windows) bzw. `HOST_IP=192.168.1.5 npm start`.
* **App hängt?** Browser neu laden. Die Daten liegen auf dem Server.
* **Server abgestürzt / Laptop neu gestartet?** Einfach wieder starten – der Turnierstand wird nach jedem Wurf gespeichert (`server/data/`) und automatisch geladen.

**Viel Erfolg und Good Darts!** 🎯
