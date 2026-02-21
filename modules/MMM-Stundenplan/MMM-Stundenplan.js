Module.register("MMM-Stundenplan", {
  defaults: {
    title: "Stundenplan",
    updateInterval: 60000,
    days: ["Mo", "Di", "Mi", "Do", "Fr"],
    times: ["08:00-08:45", "08:50-09:35", "09:55-10:40", "10:45-11:30"],
    schedule: {
      "Mo": ["Mathe", "Deutsch", "Sport", "Englisch"],
      "Di": ["Englisch", "Mathe", "Kunst", "Geschichte"],
      "Mi": ["Deutsch", "Sport", "Mathe", "Chemie"],
      "Do": ["Bio", "Englisch", "Mathe", "Deutsch"],
      "Fr": ["Geschichte", "Chemie", "Sport", "Mathe"]
    }
  },

  start: function() {
    Log.info("Starting module: " + this.name);
  },

  getDom: function() {
    const wrapper = document.createElement("div");
    wrapper.className = "stundenplan-wrapper";

    // Titel
    if (this.config.title) {
      const title = document.createElement("div");
      title.className = "stundenplan-title bright";
      title.innerHTML = this.config.title;
      wrapper.appendChild(title);
    }

    // Aktueller Tag
    const today = new Date().getDay();
    const dayIndex = today === 0 ? -1 : today - 1; // 0=Sonntag -> -1, 1=Montag -> 0

    // Tabelle
    const table = document.createElement("table");
    table.className = "small stundenplan-table";

    // Kopfzeile mit Wochentagen
    const headerRow = document.createElement("tr");
    
    // Leere Zelle für Uhrzeiten-Spalte
    const emptyHeader = document.createElement("th");
    emptyHeader.className = "stundenplan-header-time";
    headerRow.appendChild(emptyHeader);

    // Wochentage
    this.config.days.forEach((day, index) => {
      const dayHeader = document.createElement("th");
      dayHeader.className = "stundenplan-header-day";
      if (index === dayIndex) {
        dayHeader.className += " stundenplan-today bright";
      }
      dayHeader.innerHTML = day;
      headerRow.appendChild(dayHeader);
    });

    table.appendChild(headerRow);

    // Zeilen für jede Unterrichtsstunde
    this.config.times.forEach((time, timeIndex) => {
      const row = document.createElement("tr");

      // Uhrzeit
      const timeCell = document.createElement("td");
      timeCell.className = "stundenplan-time dimmed";
      timeCell.innerHTML = time;
      row.appendChild(timeCell);

      // Fächer für jeden Tag
      this.config.days.forEach((day, dayIdx) => {
        const subjects = this.config.schedule[day] || [];
        const subjectCell = document.createElement("td");
        subjectCell.className = "stundenplan-subject";
        if (dayIdx === dayIndex) {
          subjectCell.className += " stundenplan-today-cell";
        }
        subjectCell.innerHTML = subjects[timeIndex] || "-";
        row.appendChild(subjectCell);
      });

      table.appendChild(row);
    });

    wrapper.appendChild(table);
    return wrapper;
  },

  getStyles: function() {
    return ["MMM-Stundenplan.css"];
  }
});
