# MMM-PIR-Sensor

PIR Motion Sensor Modul für MagicMirror mit automatischer Bildschirmsteuerung.

## Features

- ✅ Bewegungserkennung über PIR-Sensor am GPIO
- ✅ Automatisches Ein-/Ausschalten des Bildschirms
- ✅ Konfigurierbare Timeout-Zeit
- ✅ Unterstützung für vcgencmd (Raspberry Pi HDMI)
- ✅ Optional: CEC-Unterstützung für HDMI-CEC fähige Monitore

## Hardware Setup

### PIR-Sensor Anschluss

Verbinde deinen PIR-Bewegungssensor mit dem Raspberry Pi:

```
PIR-Sensor    →   Raspberry Pi
─────────────────────────────
VCC (5V)      →   Pin 2 oder 4 (5V)
GND           →   Pin 6 (GND)
OUT           →   Pin 7 (GPIO 4) - oder ein anderer GPIO deiner Wahl
```

**Wichtig:** Der GPIO-Pin muss in der Konfiguration angegeben werden!

### Empfohlene PIR-Sensoren

- HC-SR501 (Standard PIR-Sensor, ~2€)
- HC-SR505 (Mini PIR-Sensor)
- AM312 (Sehr klein und stromsparend)

## Installation

### 1. Dependencies installieren

Auf dem Raspberry Pi:

```bash
cd ~/MagicMirror/modules/MMM-PIR-Sensor
npm install
```

### 2. GPIO Zugriff erlauben

Der User, der MagicMirror ausführt, benötigt GPIO-Zugriff:

```bash
sudo usermod -a -G gpio $USER
```

**Nach diesem Befehl einmal neu einloggen oder Raspberry Pi neu starten!**

### 3. Konfiguration

Die Konfiguration ist bereits in `config/config.js` enthalten:

```javascript
{
	module: "MMM-PIR-Sensor",
	position: "bottom_right",
	config: {
		sensorPin: 4,              // GPIO Pin (BCM-Nummerierung)
		powerSavingDelay: 120,     // Zeit in Sekunden bis Bildschirm ausgeht
		supportCEC: true           // HDMI-CEC Unterstützung aktivieren
	}
}
```

### Konfigurationsoptionen

| Option | Beschreibung | Standard | Typ |
|--------|-------------|----------|-----|
| `sensorPin` | GPIO Pin (BCM-Nummerierung) | `4` | Integer |
| `powerSavingDelay` | Timeout in Sekunden | `120` | Integer |
| `supportCEC` | HDMI-CEC Unterstützung | `true` | Boolean |

## GPIO Pin Nummerierung

**Wichtig:** Verwende die BCM-Nummerierung, nicht die physische Pin-Nummer!

Gängige GPIOs:
- **GPIO 4** = Pin 7 (empfohlen)
- **GPIO 17** = Pin 11
- **GPIO 27** = Pin 13
- **GPIO 22** = Pin 15

Falls du einen anderen Pin verwendest, ändere `sensorPin` in der Konfiguration.

## Funktionsweise

1. **Bewegung erkannt**: Bildschirm wird eingeschaltet
2. **Keine Bewegung für X Sekunden**: Timer startet
3. **Nach Timeout**: Bildschirm wird ausgeschaltet
4. **Neue Bewegung**: Timer wird zurückgesetzt, Bildschirm bleibt an

Der Bildschirm schaltet sich über `vcgencmd display_power` ein/aus.

## Testen

### PIR-Sensor testen

```bash
# GPIO Pin Status lesen
gpio -g read 4

# Sollte bei Bewegung 1 ausgeben, sonst 0
```

### Bildschirm manuell steuern

```bash
# Bildschirm ausschalten
vcgencmd display_power 0

# Bildschirm einschalten
vcgencmd display_power 1

# Status prüfen
vcgencmd display_power
```

## Troubleshooting

### GPIO-Zugriff verweigert

```bash
# GPIO-Gruppe prüfen
groups

# Sollte "gpio" enthalten
# Falls nicht, erneut einloggen oder neu starten
```

### Sensor reagiert nicht

1. Verkabelung prüfen (VCC, GND, OUT)
2. GPIO Pin in config.js prüfen
3. Logs anschauen: `pm2 logs magicmirror`
4. PIR-Sensor Empfindlichkeit anpassen (Potentiometer am Sensor)

### Bildschirm schaltet nicht

1. vcgencmd testen (siehe oben)
2. HDMI-Kabel prüfen
3. CEC deaktivieren: `supportCEC: false`
4. Monitor unterstützt eventuell kein DPMS

## PM2 Integration

Das Modul funktioniert automatisch mit PM2, wenn du MagicMirror über PM2 startest:

```bash
pm2 restart magicmirror
pm2 logs magicmirror
```

In den Logs siehst du:
- `[MMM-PIR-Sensor] Starting GPIO monitoring on pin X`
- `[MMM-PIR-Sensor] Motion detected!`
- `[MMM-PIR-Sensor] Turning screen ON/OFF`

## Stromsparen

Mit diesem Modul spart der MagicMirror Strom, da:
- Der Monitor nach 2 Minuten (konfigurierbar) ausgeht
- Er nur bei Bedarf eingeschaltet wird
- Der PIR-Sensor selbst nur ~50µA verbraucht

Bei 8 Stunden Nichtnutzung pro Tag sparst du ca. 30-50W × 8h = 240-400Wh täglich!
