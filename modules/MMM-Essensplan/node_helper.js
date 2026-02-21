'use strict';

const NodeHelper = require('node_helper');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, 'essensplan.json');

module.exports = NodeHelper.create({
  start: function() {
    console.log('[MMM-Essensplan] Node helper gestartet');
    this.setupEndpoint();
  },

  setupEndpoint: function() {
    // POST: Essensplan speichern
    this.expressApp.post('/essensplan', (req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.meals && Array.isArray(data.meals)) {
            const payload = { meals: data.meals, lastUpdate: Date.now() };
            fs.writeFileSync(DATA_FILE, JSON.stringify(payload));
            console.log('[MMM-Essensplan] Essensplan gespeichert:', data.meals);
            this.sendSocketNotification('ESSENSPLAN_UPDATE', payload);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Ungültige Daten' }));
          }
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'JSON Fehler: ' + e.message }));
        }
      });
    });

    // GET: Aktuelle Daten für Frontend abrufen
    this.expressApp.get('/essensplan', (req, res) => {
      try {
        if (fs.existsSync(DATA_FILE)) {
          const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ meals: [], lastUpdate: null }));
        }
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });

    console.log('[MMM-Essensplan] API-Endpunkte /essensplan registriert');
  },

	socketNotificationReceived: function(notification, payload) {
		if (notification === "GET_ESSENSPLAN") {
			try {
				if (fs.existsSync(DATA_FILE)) {
					const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
					this.sendSocketNotification("ESSENSPLAN_UPDATE", data);
				}
			} catch(e) {
				console.error("[MMM-Essensplan] Fehler beim Lesen:", e.message);
			}
		}
	}
});

