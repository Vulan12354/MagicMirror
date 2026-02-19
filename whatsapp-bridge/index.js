const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
require('dotenv').config();

// WhatsApp Kontakte/Gruppen die Befehle senden dürfen
// Format: ["491701234567@c.us"] für Kontakte oder ["123456789@g.us"] für Gruppen
const ALLOWED_CONTACTS = process.env.ALLOWED_WHATSAPP_CONTACTS 
  ? process.env.ALLOWED_WHATSAPP_CONTACTS.split(',')
  : [];

console.log('[WhatsApp Bridge] Starte WhatsApp Bridge Service...');

// Initialisiere WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './whatsapp-session'
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// QR Code zum Verbinden anzeigen
client.on('qr', (qr) => {
  console.log('\n[WhatsApp Bridge] Scanne diesen QR-Code mit WhatsApp:');
  qrcode.generate(qr, { small: true });
  console.log('\nÖffne WhatsApp auf deinem Handy:');
  console.log('1. Tippe auf die drei Punkte (⋮) oben rechts');
  console.log('2. Wähle "Verknüpfte Geräte"');
  console.log('3. Tippe auf "Gerät verknüpfen"');
  console.log('4. Scanne den QR-Code oben\n');
});

// Erfolgreich verbunden
client.on('ready', () => {
  console.log('[WhatsApp Bridge] ✅ WhatsApp Client ist bereit!');
  console.log('[WhatsApp Bridge] Warte auf Nachrichten...\n');
});

// Fehler behandeln
client.on('auth_failure', (msg) => {
  console.error('[WhatsApp Bridge] ❌ Authentifizierung fehlgeschlagen:', msg);
});

client.on('disconnected', (reason) => {
  console.log('[WhatsApp Bridge] ⚠️ WhatsApp getrennt:', reason);
});

// MagicMirror Konfiguration
const MAGICMIRROR_URL = process.env.MAGICMIRROR_URL || 'http://localhost:8080';

// Bekannte Befehle direkt an MagicMirror senden
async function handleCommand(command, args) {
  if (command === 'essensplan') {
    const meals = args.trim().split(/\s+/).filter(m => m.length > 0);
    if (meals.length === 0) {
      return '⚠️ Bitte gib mindestens 1 Gericht an.\nBeispiel: /essensplan Pizza Nudeln Schnitzel';
    }

    // Fülle fehlende Tage mit "-" auf
    const fullWeek = [...meals];
    while (fullWeek.length < 7) fullWeek.push('-');

    try {
      const response = await axios.post(`${MAGICMIRROR_URL}/essensplan`, {
        meals: fullWeek.slice(0, 7)
      });
      return `✅ Essensplan aktualisiert!\nMo-So: ${meals.join(', ')}`;
    } catch (error) {
      console.error('[WhatsApp Bridge] ❌ Fehler beim Senden an MagicMirror:', error.message);
      return '❌ Fehler beim Aktualisieren des Essensplans.';
    }
  }
  return null; // Unbekannter Befehl
}


// (Telegram-Funktionen entfernt – Steuerung nur noch via WhatsApp)

// Nachrichten empfangen
client.on('message', async (message) => {
  try {
    // Status-Updates (WhatsApp Stories) ignorieren
    if (message.from === 'status@broadcast') {
      return;
    }

    const contact = await message.getContact();
    const chat = await message.getChat();
    const contactId = message.from;
    
    // Prüfe ob Kontakt erlaubt ist (wenn Liste nicht leer)
    if (ALLOWED_CONTACTS.length > 0 && !ALLOWED_CONTACTS.includes(contactId)) {
      console.log(`[WhatsApp Bridge] Ignoriere Nachricht von: ${contactId} (nicht in Erlaubt-Liste)`)
      return;
    }

    const contactName = contact.pushname || contact.name || message.from;
    const chatName = chat.isGroup ? chat.name : contactName;
    
    console.log(`\n[WhatsApp] 📱 Neue Nachricht von: ${chatName}`);
    console.log(`[WhatsApp] Contact ID: ${contactId}`);

    // Prüfe ob es ein Befehl ist (beginnt mit /)
    if (message.body && message.body.startsWith('/')) {
      const parts = message.body.trim().split(/\s+/);
      const command = parts[0].substring(1).toLowerCase(); // z.B. "essensplan"
      const args = parts.slice(1).join(' ');

      console.log(`[WhatsApp] ⌨️ Befehl erkannt: /${command} ${args}`);
      const result = await handleCommand(command, args);

      if (result !== null) {
        // Befehl wurde verarbeitet - direkt per WhatsApp antworten
        await message.reply(result);
        console.log(`[WhatsApp Bridge] ✅ Befehl verarbeitet: /${command}`);
        return;
      }
      // Unbekannter Befehl - normal als Text weiterleiten
    }

    // Keine Weiterleitung normaler Nachrichten - nur Befehle werden verarbeitet
    if (message.body) {
      console.log(`[WhatsApp] Nachricht (kein Befehl, wird ignoriert): ${message.body}`);
    }
  } catch (error) {
    console.error('[WhatsApp Bridge] ❌ Fehler beim Verarbeiten der Nachricht:', error);
  }
});

// Client starten
console.log('[WhatsApp Bridge] Initialisiere WhatsApp Client...\n');
client.initialize();

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n[WhatsApp Bridge] Beende Service...');
  await client.destroy();
  process.exit(0);
});
