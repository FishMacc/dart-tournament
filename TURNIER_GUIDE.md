# 🎯 DartVault - Turnier-Leitfaden für Dienstag

Herzlichen Glückwunsch! Deine Software ist bereit für das Turnier am Dienstag. Hier ist alles, was du wissen musst.

---

## 🏠 1. Vorbereitung (Zuhause / Jetzt)

Damit am Dienstag alles stabil und schnell läuft, erstellen wir eine "Produktions-Version". Das macht die App schneller und unabhänig vom Internet.

1.  Öffne ein Terminal im Projektordner.
2.  Gehe in den Client-Ordner: `cd client`
3.  Führe den Build-Befehl aus: `npm run build`
    - Warte, bis der Prozess fertig ist (es sollte "Build complete" oder ähnliches stehen).
    - Es entsteht ein Ordner `client/dist`. Das ist deine fertige App!

---

## 🏟️ 2. Am Turniertag (Vor Ort)

### A. Geräte & Aufbau
*   **1 Laptop**: Das ist der "Server" & "Host". Er zeigt den **Beamer/TV** (Turnierbaum & Live-View).
*   **Tablets/Handys**: Zum Eingeben der Punkte (Scoring).
*   **WLAN**: **WICHTIG!** Alle Geräte (Laptop & Handys) müssen im **GLEICHEN WLAN** sein.
    *   *Tipp:* Wenn kein WLAN da ist, mach mit deinem Handy einen Hotspot auf und verbinde den Laptop damit.

### B. Software Starten
1.  Am Laptop: Öffne ein Terminal im Projektordner.
2.  Starte den Server:
    ```bash
    cd server
    node src/server.js
    ```
    *(Hinweis: Du brauchst KEIN `npm run dev` mehr im Client! Der Server liefert jetzt alles aus.)*

3.  Im Terminal erscheint eine Meldung wie:
    ```
    🎯 DART TOURNAMENT SERVER
       Local:   http://localhost:3000
       LAN:     http://192.168.1.5:3000  <-- DAS IST WICHTIG!
    ```

### C. Verbinden
1.  **Am Laptop (Host):** Öffne den Browser und gehe auf `http://localhost:3000`.
    - Das ist deine Admin-Ansicht. Klicke auf "Setup", erstelle das Turnier.
    - Wenn das Turnier läuft, schließe den Laptop an den TV/Beamer an.

2.  **An den Tablets (Scoring):**
    - Öffne den Browser (Chrome/Safari).
    - Gib die **LAN-Adresse** vom Terminal ein (z.B. `http://192.168.1.5:3000/mobile`).
    - *Oder noch einfacher:* Am Laptop im Menü auf **"Mobile QR Code"** klicken (falls vorhanden) oder einfach die URL abtippen.

---

## ⚠️ 3. Checkliste für Dienstag

- [ ] **Strom:** Ladekabel für Laptop dabei?
- [ ] **WLAN:** Kennwort bekannt oder Hotspot bereit?
- [ ] **Browser:** Chrome oder Safari auf den Tablets installiert? (Funktioniert am besten).
- [ ] **Standby:** Schalte den "Schlafmodus" auf den Tablets aus, damit sie anbleiben.

---

## 🆘 Troubleshooting (Wenn was nicht geht)

*   **Handys finden die Seite nicht?**
    *   Prüfe: Sind alle im *selben* WLAN? (Gast-WLANs blockieren oft Verbindungen untereinander!)
    *   Firewall am Laptop: Wenn Windows fragt "Zugriff zulassen?", unbedingt **JA** (für Private Netzwerke) klicken.
*   **App hängt?**
    *   Einfach Browser neu laden (F5 am Laptop, Swipe-Down am Tablet). Die Daten sind sicher gespeichert.
*   **Server abgestürzt?**
    *   Terminal schließen, neu öffnen, `node src/server.js` starten. Der Turnierstand bleibt erhalten (solange der Prozess nicht gekillt wurde - *Hinweis an Entwickler: Persistenz ist im RAM, also Vorsicht beim Neustart!*)

**Viel Erfolg und "Good Darts"!** 🎯
