const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// WhatsApp Kontakte/Gruppen die Befehle senden dürfen
// Format: ["491701234567"] für Kontakte (nur Nummer, ohne @s.whatsapp.net)
const ALLOWED_CONTACTS = process.env.ALLOWED_WHATSAPP_CONTACTS 
  ? process.env.ALLOWED_WHATSAPP_CONTACTS.split(',').map(c => c.trim())
  : [];

// MagicMirror Konfiguration
const MAGICMIRROR_URL = process.env.MAGICMIRROR_URL || 'http://localhost:8080';

console.log('[WhatsApp Bridge] Starte WhatsApp Bridge Service...');
console.log('[WhatsApp Bridge] Verwendet Baileys (kein Browser benötigt)');

// Session-Verzeichnis
const authFolder = path.join(__dirname, 'baileys-auth');
if (!fs.existsSync(authFolder)) {
  fs.mkdirSync(authFolder, { recursive: true });
}

// Bekannte Befehle direkt an MagicMirror senden
async function handleCommand(command, args, sock, remoteJid) {
  console.log(`[WhatsApp Bridge] Verarbeite Befehl: /${command} mit Args: "${args}"`);
  
  if (command === 'essensplan') {
    const meals = args.trim().split(/\s+/).filter(m => m.length > 0);
    console.log(`[WhatsApp Bridge] Geparste Gerichte:`, meals);
    
    if (meals.length === 0) {
      return '⚠️ Bitte gib mindestens 1 Gericht an.\nBeispiel: /essensplan Pizza Nudeln Schnitzel';
    }

    // Fülle fehlende Tage mit "-" auf
    const fullWeek = [...meals];
    while (fullWeek.length < 7) fullWeek.push('-');

    console.log(`[WhatsApp Bridge] Vollständiger Essensplan (7 Tage):`, fullWeek);
    console.log(`[WhatsApp Bridge] Sende an: ${MAGICMIRROR_URL}/essensplan`);

    try {
      const response = await axios.post(`${MAGICMIRROR_URL}/essensplan`, {
        meals: fullWeek.slice(0, 7)
      });
      console.log(`[WhatsApp Bridge] ✅ Erfolgreich gesendet. Response:`, response.data);
      return `✅ Essensplan aktualisiert!\nMo-So: ${meals.join(', ')}`;
    } catch (error) {
      console.error('[WhatsApp Bridge] ❌ Fehler beim Senden an MagicMirror:', error.message);
      if (error.response) {
        console.error('[WhatsApp Bridge] Response Status:', error.response.status);
        console.error('[WhatsApp Bridge] Response Data:', error.response.data);
      }
      return '❌ Fehler beim Aktualisieren des Essensplans.';
    }
  }
  return null; // Unbekannter Befehl
}

// Verbindung aufbauen
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    syncFullHistory: false,
    browser: ['Chrome (Linux)', 'Chrome', '110.0.0.0'],
    getMessage: async (key) => {
      return { conversation: '' };
    }
  });

  // QR-Code anzeigen
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (connection === 'connecting') {
      console.log('[WhatsApp Bridge] Verbinde zu WhatsApp...');
    }
    
    if (qr) {
      console.log('\n[WhatsApp Bridge] Scanne diesen QR-Code mit WhatsApp:');
      qrcode.generate(qr, { small: true });
      console.log('\nÖffne WhatsApp auf deinem Handy:');
      console.log('1. Tippe auf die drei Punkte (⋮) oben rechts');
      console.log('2. Wähle "Verknüpfte Geräte"');
      console.log('3. Tippe auf "Gerät verknüpfen"');
      console.log('4. Scanne den QR-Code oben\n');
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      const errorMessage = lastDisconnect?.error?.message || 'Unbekannt';
      const statusCode = lastDisconnect?.error?.output?.statusCode || 'Keine';
      
      console.log('[WhatsApp Bridge] Verbindung geschlossen!');
      console.log('[WhatsApp Bridge] Fehler:', errorMessage);
      console.log('[WhatsApp Bridge] Status Code:', statusCode);
      console.log('[WhatsApp Bridge] Reconnect:', shouldReconnect);
      
      if (shouldReconnect) {
        console.log('[WhatsApp Bridge] Versuche Neuverbindung in 5 Sekunden...\n');
        setTimeout(() => connectToWhatsApp(), 5000);
      }
    } else if (connection === 'open') {
      console.log('[WhatsApp Bridge] ✅ WhatsApp verbunden!');
      console.log('[WhatsApp Bridge] Warte auf Nachrichten...\n');
    }
  });

  // Credentials speichern
  sock.ev.on('creds.update', saveCreds);

  // Nachrichten empfangen
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    
    for (const msg of messages) {
      try {
        // Ignoriere eigene Nachrichten
        if (msg.key.fromMe) continue;
        
        // Ignoriere Status-Updates
        if (msg.key.remoteJid === 'status@broadcast') continue;
        
        const remoteJid = msg.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const senderId = isGroup ? msg.key.participant : remoteJid;
        const senderNumber = senderId.split('@')[0];
        
        // Prüfe ob Kontakt erlaubt ist (wenn Liste nicht leer)
        if (ALLOWED_CONTACTS.length > 0 && !ALLOWED_CONTACTS.includes(senderNumber)) {
          console.log(`[WhatsApp Bridge] Ignoriere Nachricht von: ${senderNumber} (nicht in Erlaubt-Liste)`);
          continue;
        }
        
        // Extrahiere Nachrichtentext
        const text = msg.message?.conversation || 
                     msg.message?.extendedTextMessage?.text || 
                     '';
        
        if (!text) continue;
        
        console.log(`\n[WhatsApp] 📱 Neue Nachricht von: ${senderNumber}`);
        console.log(`[WhatsApp] Text: ${text}`);
        
        // Prüfe ob es ein Befehl ist (beginnt mit /)
        if (text.startsWith('/')) {
          const parts = text.trim().split(/\s+/);
          const command = parts[0].substring(1).toLowerCase();
          const args = parts.slice(1).join(' ');
          
          console.log(`[WhatsApp] ⌨️ Befehl erkannt: /${command} ${args}`);
          const result = await handleCommand(command, args, sock, remoteJid);
          
          if (result !== null) {
            // Befehl wurde verarbeitet - direkt per WhatsApp antworten
            await sock.sendMessage(remoteJid, { text: result });
            console.log(`[WhatsApp Bridge] ✅ Befehl verarbeitet: /${command}`);
          }
        } else {
          console.log(`[WhatsApp] Nachricht (kein Befehl, wird ignoriert)`);
        }
      } catch (error) {
        console.error('[WhatsApp Bridge] ❌ Fehler beim Verarbeiten der Nachricht:', error);
      }
    }
  });

  return sock;
}

// Start
connectToWhatsApp().catch(err => {
  console.error('[WhatsApp Bridge] ❌ Fataler Fehler:', err);
  process.exit(1);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n[WhatsApp Bridge] Beende Service...');
  process.exit(0);
});
