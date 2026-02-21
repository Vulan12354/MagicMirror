Module.register("MMM-PIR-Sensor", {
	defaults: {
		sensorPin: 4,
		powerSavingDelay: 120, // 2 Minuten in Sekunden
		relayOnState: 1,
		relayOffState: 0,
		supportCEC: true,
		presenceIndicator: "fa-eye",
		presenceIndicatorColor: "lime",
		presenceOffIndicator: "fa-eye-slash",
		presenceOffIndicatorColor: "dimgray"
	},

	start() {
		Log.info("Starting module: " + this.name);
		this.userPresence = true;
		this.sendSocketNotification("CONFIG", this.config);
	},

	notificationReceived(notification, payload) {
		if (notification === "DOM_OBJECTS_CREATED") {
			this.sendSocketNotification("SCREEN_ON");
		}
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "USER_PRESENCE") {
			this.userPresence = payload;
			this.updateDom(300);
			
			if (payload) {
				this.sendNotification("SCREEN_ON");
			} else {
				this.sendNotification("SCREEN_OFF");
			}
		}
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "pir-sensor-indicator";
		
		const icon = document.createElement("i");
		icon.className = "fas " + (this.userPresence ? this.config.presenceIndicator : this.config.presenceOffIndicator);
		icon.style.color = this.userPresence ? this.config.presenceIndicatorColor : this.config.presenceOffIndicatorColor;
		
		wrapper.appendChild(icon);
		return wrapper;
	},

	getStyles() {
		return ["font-awesome.css"];
	}
});
