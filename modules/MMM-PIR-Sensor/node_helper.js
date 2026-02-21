const NodeHelper = require("node_helper");
const { exec } = require("child_process");

module.exports = NodeHelper.create({
	start() {
		console.log("Starting node_helper for: " + this.name);
		this.monitoring = false;
		this.userPresence = true;
		this.timeout = null;
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "CONFIG") {
			this.config = payload;
			if (!this.monitoring) {
				this.startMonitoring();
			}
		} else if (notification === "SCREEN_ON") {
			this.turnScreenOn();
		}
	},

	startMonitoring() {
		this.monitoring = true;
		console.log("[MMM-PIR-Sensor] Starting GPIO monitoring on pin " + this.config.sensorPin);
		
		try {
			const Gpio = require("onoff").Gpio;
			
			// Initialisiere PIR-Sensor
			this.pir = new Gpio(this.config.sensorPin, "in", "both");
			
			// Überwache Änderungen
			this.pir.watch((err, value) => {
				if (err) {
					console.error("[MMM-PIR-Sensor] Error reading GPIO:", err);
					return;
				}
				
				console.log("[MMM-PIR-Sensor] Motion detected, GPIO value:", value);
				
				if (value === 1) { // Bewegung erkannt
					this.onMotionDetected();
				}
			});
			
			console.log("[MMM-PIR-Sensor] GPIO monitoring started successfully");
		} catch (error) {
			console.error("[MMM-PIR-Sensor] Error initializing GPIO:", error);
			console.log("[MMM-PIR-Sensor] Fallback: Using simulation mode");
			// Fallback für Entwicklung ohne GPIO
			this.simulateMotion();
		}
	},

	onMotionDetected() {
		console.log("[MMM-PIR-Sensor] Motion detected!");
		
		// Clear existing timeout
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
		
		// Turn screen on if off
		if (!this.userPresence) {
			this.turnScreenOn();
			this.userPresence = true;
			this.sendSocketNotification("USER_PRESENCE", true);
		}
		
		// Set new timeout
		this.timeout = setTimeout(() => {
			console.log("[MMM-PIR-Sensor] No motion for " + this.config.powerSavingDelay + " seconds, turning screen off");
			this.turnScreenOff();
			this.userPresence = false;
			this.sendSocketNotification("USER_PRESENCE", false);
		}, this.config.powerSavingDelay * 1000);
	},

	turnScreenOn() {
		console.log("[MMM-PIR-Sensor] Turning screen ON");
		
		// HDMI einschalten (vcgencmd für Raspberry Pi)
		exec("vcgencmd display_power 1", (error, stdout, stderr) => {
			if (error) {
				console.error("[MMM-PIR-Sensor] Error turning screen on:", error);
			} else {
				console.log("[MMM-PIR-Sensor] Screen turned on");
			}
		});
		
		// Optional: CEC command
		if (this.config.supportCEC) {
			exec("echo 'on 0' | cec-client -s -d 1", (error) => {
				if (error) {
					console.log("[MMM-PIR-Sensor] CEC not available or error");
				}
			});
		}
	},

	turnScreenOff() {
		console.log("[MMM-PIR-Sensor] Turning screen OFF");
		
		// HDMI ausschalten (vcgencmd für Raspberry Pi)
		exec("vcgencmd display_power 0", (error, stdout, stderr) => {
			if (error) {
				console.error("[MMM-PIR-Sensor] Error turning screen off:", error);
			} else {
				console.log("[MMM-PIR-Sensor] Screen turned off");
			}
		});
		
		// Optional: CEC command
		if (this.config.supportCEC) {
			exec("echo 'standby 0' | cec-client -s -d 1", (error) => {
				if (error) {
					console.log("[MMM-PIR-Sensor] CEC not available or error");
				}
			});
		}
	},

	simulateMotion() {
		// Simulationsmodus für Entwicklung
		setInterval(() => {
			this.onMotionDetected();
		}, 30000); // Alle 30 Sekunden simulierte Bewegung
	},

	stop() {
		if (this.pir) {
			this.pir.unexport();
		}
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}
});
