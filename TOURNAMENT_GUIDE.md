# 🎯 DartVault — Tournament Day Guide

## 🏠 1. Before the day (at home, with internet)

1. Install [Node.js](https://nodejs.org) (LTS).
2. Start the app once: double-click `Start-Windows.bat` or `Start-Mac-Linux.command` (or run `npm install && npm start`).
   This installs everything and builds the app. From then on it runs **without internet**.
3. Play a quick test tournament with 2 players and one phone, then **reset** it.

---

## 🏟️ 2. On the day

### A. Devices
* **1 laptop**: server and host. Shows the bracket and live scores on a **TV or projector**.
* **Phones/tablets**: for entering scores.
* **Wi-Fi**: all devices on the **same network**.
  *Tip:* no Wi-Fi at the venue? Open a hotspot on a phone and connect the laptop to it.

### B. Start the software
1. Double-click the start script. The window shows:
   ```
   Host (this PC):        http://localhost:3000
   Phones (scoring):      http://192.168.1.5:3000/mobile
   Admin on other device: http://192.168.1.5:3000/?admin=1a2b3c4d
   ```
2. The browser opens automatically. Keep the window open!

### C. Run the tournament
1. **On the laptop:** create the tournament (game, legs, PIN protection …), add players, start.
2. **Phones:** scan the QR code on the tournament screen (or type the phone address).
3. Tap your match → enter the **PIN** from the laptop screen → **Start match** → enter darts.
   Lost the connection? No problem, the phone logs back in with its PIN automatically.
4. Mistyped? **Undo** on the phone. (Not possible any more once the winner has started their next match.)

Only the laptop sees the PINs and can change the tournament. If a second device (e.g. a tablet at the bar) should be an admin too, open the **admin link** from the window on it.

Players who prefer German can switch the language with the **EN/DE** button at the top right; every device keeps its own choice.

---

## ⚠️ 3. Checklist

- [ ] Laptop charger
- [ ] Wi-Fi password or hotspot ready
- [ ] Sleep mode / screen lock turned off on the laptop and tablets
- [ ] Started once beforehand (see above)

---

## 🆘 Troubleshooting

* **Phones can't reach the page?**
  * All on the *same* Wi-Fi? Guest networks often block devices from talking to each other.
  * Windows asks "Allow access?" → **Yes** (for private networks).
  * The QR code shows an odd address (VPN, virtual network adapter)? Disconnect the VPN or force the IP: `set HOST_IP=192.168.1.5` (Windows) or `HOST_IP=192.168.1.5 npm start`.
* **App stuck?** Reload the browser. The data lives on the server.
* **Server crashed / laptop restarted?** Just start it again. The tournament is saved after every dart (`server/data/`) and loaded automatically.
* **"Port 3000 is already in use"?** The server is already running in another window.

**Good luck and good darts!** 🎯
