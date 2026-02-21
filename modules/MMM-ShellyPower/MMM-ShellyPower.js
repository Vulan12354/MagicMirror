/* MagicMirror² Module: MMM-ShellyPower
 * Zeigt Leistungsmessdaten eines Shelly PM Mini Gen 3 an.
 */
Module.register("MMM-ShellyPower", {

	defaults: {
		shellyIp: "192.168.178.87",
		updateInterval: 10 * 1000,   // 10 Sekunden
		label: "Shelly PM",
		showPower: true,
		showDailyEnergy: true,
		showTotalEnergy: true,
	},

	start() {
		this.power = null;
		this.dailyEnergy = null;
		this.totalEnergy = null;
		this.loaded = false;
		this.error = null;

		this.sendSocketNotification("SHELLY_START", {
			shellyIp: this.config.shellyIp,
			updateInterval: this.config.updateInterval,
		});
	},

	getStyles() {
		return ["MMM-ShellyPower.css"];
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "SHELLY_DATA") {
			this.power = payload.power;
			this.dailyEnergy = payload.dailyEnergy;
			this.totalEnergy = payload.totalEnergy;
			this.loaded = true;
			this.error = null;
			this.updateDom();
		} else if (notification === "SHELLY_ERROR") {
			this.error = payload.message;
			this.loaded = true;
			this.updateDom();
		}
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "shelly-power";

		// Titel
		const title = document.createElement("div");
		title.className = "shelly-title";
		title.textContent = this.config.label;
		wrapper.appendChild(title);

		if (!this.loaded) {
			const loading = document.createElement("div");
			loading.className = "shelly-loading dimmed small";
			loading.textContent = "Lade Daten…";
			wrapper.appendChild(loading);
			return wrapper;
		}

		if (this.error) {
			const err = document.createElement("div");
			err.className = "shelly-error small dimmed";
			err.textContent = `Fehler: ${this.error}`;
			wrapper.appendChild(err);
			return wrapper;
		}

		const table = document.createElement("table");
		table.className = "shelly-table small";

		if (this.config.showPower && this.power !== null) {
			const isProducing = this.power < 0;
			table.appendChild(this._row(
				"⚡ Aktuelle Leistung",
				`${Math.abs(this.power).toFixed(1)} W`,
				isProducing ? "shelly-producing" : "shelly-consuming"
			));
		}

		if (this.config.showDailyEnergy && this.dailyEnergy !== null) {
			table.appendChild(this._row(
				"☀️ Energie heute",
				`${this.dailyEnergy.toFixed(3)} kWh`
			));
		}

		if (this.config.showTotalEnergy && this.totalEnergy !== null) {
			table.appendChild(this._row(
				"🔋 Gesamtenergie",
				`${this.totalEnergy.toFixed(3)} kWh`
			));
		}

		wrapper.appendChild(table);
		return wrapper;
	},

	_row(label, value, valueClass = "") {
		const tr = document.createElement("tr");

		const tdLabel = document.createElement("td");
		tdLabel.className = "shelly-label";
		tdLabel.textContent = label;

		const tdValue = document.createElement("td");
		tdValue.className = `shelly-value${valueClass ? " " + valueClass : ""}`;
		tdValue.textContent = value;

		tr.appendChild(tdLabel);
		tr.appendChild(tdValue);
		return tr;
	},
});
