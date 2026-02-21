/* MagicMirror² NodeHelper: MMM-ShellyPower
 * Pollt die REST-API eines Shelly PM Mini Gen 3.
 *
 * API-Endpunkt: GET http://<ip>/rpc/PM1.GetStatus?id=0
 * Relevante Felder:
 *   apower              – Momentanleistung in W
 *   ret_aenergy.total   – Erzeugte Energie in Wh (setzt die Shelly-App täglich um
 *                         Mitternacht zurück → entspricht dem Tageserzeugnis)
 *   aenergy.total       – Bezogene/verbrauchte Energie in Wh (kumuliert)
 */
"use strict";

const NodeHelper = require("node_helper");
const https = require("https");
const http = require("http");

module.exports = NodeHelper.create({

	start() {
		this.config = null;
		this.timer = null;
		this.isFetching = false; // verhindert parallele Requests
		// Tagesbasis: retEnergy-Wert (Wh) zu Beginn des aktuellen Tages
		this.dayStart = {
			date: null,
			retEnergyWh: null,
		};
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "SHELLY_START") {
			this.config = payload;
			if (this.timer) clearInterval(this.timer);
			this.fetchData();
			this.timer = setInterval(() => this.fetchData(), payload.updateInterval);
		}
	},

	fetchData() {
		// Vorherigen Request abwarten – Shelly verträgt keine parallelen Verbindungen
		if (this.isFetching) return;
		this.isFetching = true;

		const ip = this.config.shellyIp;
		const url = `http://${ip}/rpc/PM1.GetStatus?id=0`;

		this._get(url, (err, data) => {
			this.isFetching = false;
			if (err) {
				this.sendSocketNotification("SHELLY_ERROR", { message: err.message });
				return;
			}

			let parsed;
			try {
				parsed = JSON.parse(data);
			} catch (e) {
				this.sendSocketNotification("SHELLY_ERROR", { message: "JSON-Fehler: " + e.message });
				return;
			}

			const power = parsed.apower ?? null;                    // W
			const retTotalWh = parsed.ret_aenergy?.total ?? null;   // Wh, kumuliert (erzeugt)
			// aenergy.total: Gesamtenergie kumuliert (Wh → kWh)
			const totalEnergy = parsed.aenergy?.total != null
				? parsed.aenergy.total / 1000
				: null;

			// Tagesenergie: Differenz seit Tagesbeginn (eigenes Tracking)
			const today = new Date().toDateString();
			if (this.dayStart.date !== today) {
				// Neuer Tag → Basis neu setzen
				this.dayStart.date = today;
				this.dayStart.retEnergyWh = retTotalWh;
			}

			let dailyEnergy = null; // kWh
			if (retTotalWh !== null && this.dayStart.retEnergyWh !== null) {
				dailyEnergy = (retTotalWh - this.dayStart.retEnergyWh) / 1000;
				if (dailyEnergy < 0) {
					// Zähler wurde extern zurückgesetzt → Basis anpassen
					this.dayStart.retEnergyWh = retTotalWh;
					dailyEnergy = 0;
				}
			}

			this.sendSocketNotification("SHELLY_DATA", {
				power,        // W
				dailyEnergy,  // kWh (seit Tagesbeginn, eigenes Tracking)
				totalEnergy,  // kWh (kumuliert gesamt)
			});
		});
	},

	_get(url, callback) {
		const lib = url.startsWith("https") ? https : http;
		// agent: false → keine Keep-Alive-Verbindung, Shelly kommt damit besser klar
		const req = lib.get(url, { timeout: 15000, agent: false }, (res) => {
			let body = "";
			res.on("data", (chunk) => (body += chunk));
			res.on("end", () => callback(null, body));
		});
		req.on("error", (err) => callback(err));
		req.on("timeout", () => {
			req.destroy();
			callback(new Error("Timeout (15s) – Shelly nicht erreichbar"));
		});
	},

	stop() {
		if (this.timer) clearInterval(this.timer);
	},
});
