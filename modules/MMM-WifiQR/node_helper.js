/* MagicMirror² NodeHelper: MMM-WifiQR
 * Generiert einen WLAN-QR-Code als Data-URL.
 * QR-Format: WIFI:T:<enc>;S:<ssid>;P:<pass>;;
 */
"use strict";

const NodeHelper = require("node_helper");
const QRCode = require("qrcode");

module.exports = NodeHelper.create({

	socketNotificationReceived(notification, payload) {
		if (notification === "WIFIQR_GENERATE") {
			const { ssid, password, encryption, size } = payload;

			// WiFi-QR-Code-String nach Standard-Format
			const wifiString = `WIFI:T:${encryption};S:${ssid};P:${password};;`;

			QRCode.toDataURL(wifiString, {
				width: size,
				margin: 2,
				color: {
					dark: "#000000",
					light: "#ffffff",
				},
				errorCorrectionLevel: "M",
			})
				.then((dataUrl) => {
					this.sendSocketNotification("WIFIQR_DATA", { dataUrl });
				})
				.catch((err) => {
					console.error("[MMM-WifiQR] Fehler beim Erstellen des QR-Codes:", err);
				});
		}
	},
});
