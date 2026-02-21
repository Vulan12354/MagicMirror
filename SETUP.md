# MagicMirror Fork Setup

Dieses Repository ist ein Fork von [MagicMirror²](https://github.com/MichMich/MagicMirror) mit zusätzlichen Custom Modulen.

## Erstes Setup

### 1. Repository klonen

```bash
git clone [YOUR_REPO_URL]
cd MagicMirror
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Konfiguration erstellen

```bash
cp config/config.js.sample config/config.js
```

### 4. Konfiguration anpassen

Bearbeite `config/config.js` und passe folgende Werte an:

- **Google Calendar URL**: Zeile 62 - Ersetze `YOUR_GOOGLE_CALENDAR_ICAL_URL_HERE` mit deiner iCal URL
- **WiFi Credentials**: Zeilen 123-124 - Ersetze `YOUR_WIFI_SSID` und `YOUR_WIFI_PASSWORD`
- **Shelly IP**: Zeile 134 - Ersetze mit der IP deines Shelly-Geräts (falls vorhanden)
- **Koordinaten**: Zeilen 105, 115 - Passe lat/lon für deine Stadt an
- **Stundenpläne**: Zeilen 142-175 - Passe Zeiten und Fächer an

### 5. Custom CSS (optional)

```bash
cp css/custom.css.sample css/custom.css
```

### 6. MagicMirror starten

```bash
npm start
```

Oder mit PM2 (für Produktionsumgebung):

```bash
npm install -g pm2
cp ecosystem.config.js.sample ecosystem.config.js
# Passe ecosystem.config.js an (Pfade!)
pm2 start ecosystem.config.js
pm2 save
```

## WhatsApp Bridge Setup

Die WhatsApp Bridge ermöglicht es, über WhatsApp den Essensplan zu aktualisieren.

### 1. WhatsApp Bridge konfigurieren

```bash
cd whatsapp-bridge
cp .env.sample .env
```

Bearbeite `.env`:

- `MAGICMIRROR_URL`: URL deines MagicMirror (Standard: http://localhost:8080)
- `ALLOWED_WHATSAPP_CONTACTS`: Deine WhatsApp-Telefonnummer(n)

### 2. Dependencies installieren

```bash
npm install
```

### 3. WhatsApp Bridge starten

```bash
npm start
```

Beim ersten Start erscheint ein QR-Code - scanne ihn mit WhatsApp (Verknüpfte Geräte).

Siehe [whatsapp-bridge/README.md](whatsapp-bridge/README.md) für Details.

## Custom Module

Folgende Custom Module sind enthalten:

- **MMM-CalendarExt3**: Erweiterter Kalender mit Wochen- und Monatsansicht
- **MMM-Essensplan**: Wochenplan für Essen (über WhatsApp steuerbar)
- **MMM-ImagesPhotos**: Diashow von Bildern aus einem Ordner
- **MMM-PIR-Sensor**: Bewegungsmelder mit automatischer Bildschirmsteuerung (siehe [MMM-PIR-Sensor/README.md](modules/MMM-PIR-Sensor/README.md))
- **MMM-ShellyPower**: Anzeige von Shelly-Plug-Daten (z.B. Balkonkraftwerk)
- **MMM-Stundenplan**: Schulstundenplan-Anzeige
- **MMM-WifiQR**: QR-Code für WiFi-Zugang
- **MMM-TelegramBot**: Telegram-Integration (veraltet, nutze WhatsApp Bridge)

## Sensitive Daten

**WICHTIG**: Folgende Dateien werden NICHT committed:

- `config/config.js` (enthält private URLs, Passwörter)
- `css/custom.css` (persönliche Anpassungen)
- `whatsapp-bridge/.env` (WhatsApp-Nummern)
- `whatsapp-bridge/whatsapp-session/` (Session-Daten)

Nutze stattdessen die `.sample` Dateien als Vorlage!

## Weitere Dokumentation

- [MagicMirror² Dokumentation](https://docs.magicmirror.builders/)
- [Modul-Konfiguration](https://docs.magicmirror.builders/modules/configuration.html)
