/* MagicMirror² Module: MMM-WifiQR
 * Zeigt einen QR-Code zum Einloggen ins WLAN an.
 */
Module.register("MMM-WifiQR", {

	defaults: {
		ssid: "",
		password: "",
		encryption: "WPA",   // WPA, WEP oder nopass
		label: "WLAN",
		size: 180,           // Pixelgröße des QR-Codes
		showLabel: true,
		showCredentials: false, // Passwort im Klartext darunter anzeigen
	},

	start() {
		this.qrDataUrl = null;
		this.sendSocketNotification("WIFIQR_GENERATE", {
			ssid: this.config.ssid,
			password: this.config.password,
			encryption: this.config.encryption,
			size: this.config.size,
		});
	},

	getStyles() {
		return ["MMM-WifiQR.css"];
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "WIFIQR_DATA") {
			this.qrDataUrl = payload.dataUrl;
			this.updateDom();
		}
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "wifiqr-wrapper";

		if (this.config.showLabel) {
			const label = document.createElement("div");
			label.className = "wifiqr-label";
			label.textContent = this.config.label;
			wrapper.appendChild(label);
		}

		if (!this.qrDataUrl) {
			const loading = document.createElement("div");
			loading.className = "dimmed small";
			loading.textContent = "Generiere QR-Code…";
			wrapper.appendChild(loading);
			return wrapper;
		}

		const img = document.createElement("img");
		img.src = this.qrDataUrl;
		img.width = this.config.size;
		img.height = this.config.size;
		img.className = "wifiqr-img";
		wrapper.appendChild(img);

		if (this.config.showCredentials) {
			const creds = document.createElement("div");
			creds.className = "wifiqr-creds xsmall dimmed";
			creds.innerHTML = `📶 ${this.config.ssid}<br>🔑 ${this.config.password}`;
			wrapper.appendChild(creds);
		}

		return wrapper;
	},
});
