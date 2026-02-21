# WhatsApp Bridge für MagicMirror

WhatsApp-Bridge ohne Browser - perfekt für Raspberry Pi!

## Features

- ✅ **Kein Browser benötigt** - verwendet Baileys statt Puppeteer
- ✅ **Leichtgewichtig** - läuft auch auf älteren Raspberry Pis
- ✅ **Stabil** - keine Chromium-Probleme mehr
- ✅ **Einfach** - QR-Code scannen und fertig

## Setup

### 1. Dependencies installieren

```bash
cd ~/MagicMirror/whatsapp-bridge
rm -rf node_modules package-lock.json
npm install
```

### 2. Service starten

```bash
npm start
```

### 3. QR-Code scannen

- Ein QR-Code wird im Terminal angezeigt
- Öffne WhatsApp auf deinem Handy
- Gehe zu: ⋮ → Verknüpfte Geräte → Gerät verknüpfen
- Scanne den QR-Code

### 4. Fertig!

Die Session wird in `baileys-auth/` gespeichert. Beim nächsten Start musst du nicht erneut scannen.

## Konfiguration

Bearbeite `.env`:

```env
# MagicMirror URL
MAGICMIRROR_URL=http://localhost:8080

# WhatsApp Kontakte filtern (optional)
# Nur Telefonnummern, ohne @ oder Suffix
ALLOWED_WHATSAPP_CONTACTS=491701234567,491709876543
```

### Contact-Nummern herausfinden:

1. Lass `ALLOWED_WHATSAPP_CONTACTS` leer
2. Starte den Service
3. Sende eine Test-Nachricht von WhatsApp
4. Schau in die Logs - dort steht die Nummer
5. Trage die Nummer in `.env` ein (nur Ziffern)

## Verwendung

**Befehle senden:**

```
/essensplan Pizza Pasta Schnitzel Curry Salat Burger Fisch
```

- Gehe zu: ⋮ → Verknüpfte Geräte → Gerät verknüpfen
- Scanne den QR-Code

### 4. Fertig!

Die Session wird gespeichert. Beim nächsten Start musst du nicht erneut scannen.

## Konfiguration

Bearbeite `.env`:

```env
# Telegram Bot Konfiguration (bereits eingetragen)
TELEGRAM_API_KEY=dein_bot_token
TELEGRAM_CHAT_ID=deine_chat_id

# WhatsApp Kontakte filtern (optional)
ALLOWED_WHATSAPP_CONTACTS=491701234567@c.us,491709876543@c.us
```

### Contact IDs herausfinden:

1. Lass `ALLOWED_WHATSAPP_CONTACTS` leer
2. Starte den Service
3. Sende eine Test-Nachricht von WhatsApp
4. Schau in die Logs - dort steht die Contact ID
5. Trage die ID in `.env` ein

## Verwendung

**Einfach WhatsApp-Nachricht schreiben:**

- Schreibe an dich selbst oder eine Gruppe
- Nachricht wird automatisch an Telegram weitergeleitet
- Telegram Bot zeigt sie auf dem MagicMirror an

**Essensplan per WhatsApp:**

1. Öffne Telegram
2. Schicke den Befehl wie gewohnt: `/essensplan Pizza Nudeln Schnitzel`
3. Oder nutze normale Nachrichten für Notizen

## Im Hintergrund laufen lassen

### Mit PM2 (empfohlen):

```bash
npm install -g pm2
cd ~/MagicMirror/whatsapp-bridge
pm2 start index.js --name whatsapp-bridge
pm2 save
pm2 startup
```

### Logs anschauen:

```bash
pm2 logs whatsapp-bridge
```

### Service stoppen:

```bash
pm2 stop whatsapp-bridge
```

## Troubleshooting

**QR-Code wird nicht angezeigt:**

- Prüfe Internetverbindung
- Lösche `whatsapp-session/` und starte neu

**Nachrichten kommen nicht an:**

- Prüfe `.env` - ist die Telegram Chat ID korrekt?
- Teste Telegram Bot direkt: `/mychatid`
- Schau in die Logs: Wird die Nachricht empfangen?

**WhatsApp Session abgelaufen:**

- Lösche `whatsapp-session/`
- Starte neu und scanne QR-Code erneut
