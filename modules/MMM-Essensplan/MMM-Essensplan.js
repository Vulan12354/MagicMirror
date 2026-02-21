Module.register("MMM-Essensplan", {
	defaults: {
		daysLabels: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
		displayDuration: 7 * 24 * 60 * 60 * 1000,
	},

	start: function() {
		this.meals = ["Laden..."];
		this.lastUpdate = Date.now();
		this.sendSocketNotification("GET_ESSENSPLAN", {});
	},

	getDom: function() {
		const wrapper = document.createElement("div");
		wrapper.className = "essensplan-wrapper";

		// Prüfe ob Essensplan abgelaufen ist
		if (this.lastUpdate && (Date.now() - this.lastUpdate > this.config.displayDuration)) {
			const p = document.createElement("p");
			p.className = "dimmed small";
			p.innerHTML = "Essensplan abgelaufen";
			wrapper.appendChild(p);
			return wrapper;
		}

		// Header
		const title = document.createElement("div");
		title.className = "module-header";
		title.innerHTML = "📋 Essensplan der Woche";
		wrapper.appendChild(title);

		// Tabelle
		const table = document.createElement("table");
		table.className = "small";

		this.meals.forEach((meal, index) => {
			if (meal === "-") return;
			const row = document.createElement("tr");

			const dayCell = document.createElement("td");
			dayCell.className = "day";
			dayCell.innerHTML = this.config.daysLabels[index] || `Tag ${index + 1}`;
			dayCell.style.paddingRight = "15px";
			dayCell.style.fontWeight = "bold";
			dayCell.style.color = "#999";

			const mealCell = document.createElement("td");
			mealCell.className = "meal";
			mealCell.innerHTML = meal;

			row.appendChild(dayCell);
			row.appendChild(mealCell);
			table.appendChild(row);
		});

		wrapper.appendChild(table);
		return wrapper;
	},

	getStyles: function() {
		return ["MMM-Essensplan.css"];
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "ESSENSPLAN_UPDATE") {
			this.meals = payload.meals;
			this.lastUpdate = payload.lastUpdate;
			this.updateDom(300);
		}
	},

	notificationReceived: function(notification) {
		if (notification === "ALL_MODULES_STARTED") {
			this.sendSocketNotification("GET_ESSENSPLAN", {});
		}
	}
});
