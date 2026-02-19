#!/bin/bash

echo "🚀 Starte WhatsApp Bridge Service..."
echo ""

cd ~/MagicMirror/whatsapp-bridge

# Prüfe ob Node.js verfügbar ist
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nicht gefunden!"
    exit 1
fi

# Starte Service
node index.js
