// ============================================================
//  SAFETY ALERT ENGINE — Real-time flight safety monitoring
//  Analyzes OpenSky data every polling cycle to detect
//  dangerous conditions and generate alerts.
// ============================================================

const AlertEngine = {
    // Active alerts keyed by `${icao24}-${type}`
    _active: {},

    // Alert history (newest first, capped at 200)
    history: [],
    MAX_HISTORY: 200,

    // Listeners called when alerts change
    _listeners: [],

    // Alert thresholds
    THRESHOLDS: {
        EMERGENCY_SQUAWKS: ['7500', '7600', '7700'],
        RAPID_DESCENT_FTMIN: -1500,       // ft/min
        LOW_ALTITUDE_FT: 3000,            // feet
        GROUND_PROXIMITY_FT: 1500,        // feet
        GROUND_PROXIMITY_DESCENT: -800,   // ft/min
        EXCESSIVE_SPEED_KTS: 680,         // knots (~Mach 1)
        SIGNAL_LOST_SEC: 60,              // seconds since last contact
    },

    // Squawk code meanings
    SQUAWK_LABELS: {
        '7500': 'Hijack / Unlawful Interference',
        '7600': 'Radio Communication Failure',
        '7700': 'General Emergency',
    },

    /** Register a callback: fn(activeAlerts, newAlerts) */
    onAlert(fn) {
        this._listeners.push(fn);
    },

    /** Analyze a batch of flights from OpenSky */
    analyze(flights) {
        const now = Math.floor(Date.now() / 1000);
        const prevStates = OpenSky.getPrevStates();
        const newAlerts = [];
        const seenKeys = new Set();

        flights.forEach(f => {
            if (f.onGround) return; // Skip aircraft on ground

            // 1. Emergency Squawk
            if (f.squawk && this.THRESHOLDS.EMERGENCY_SQUAWKS.includes(f.squawk)) {
                const a = this._raise(f, 'EMERGENCY_SQUAWK', 'critical',
                    `🚨 EMERGENCY SQUAWK ${f.squawk}`,
                    `${f.callsign || f.icao24} — ${this.SQUAWK_LABELS[f.squawk] || 'Unknown emergency'}. Squawk ${f.squawk} detected at FL${Math.round((f.altitude || 0) / 100)}.`
                );
                if (a) newAlerts.push(a);
                seenKeys.add(`${f.icao24}-EMERGENCY_SQUAWK`);
            }

            // 2. Rapid Descent
            if (f.verticalRate != null && f.verticalRate < this.THRESHOLDS.RAPID_DESCENT_FTMIN) {
                const a = this._raise(f, 'RAPID_DESCENT', 'critical',
                    `📉 Rapid Descent Detected`,
                    `${f.callsign || f.icao24} descending at ${Math.abs(f.verticalRate)} ft/min. Alt: ${(f.altitude || 0).toLocaleString()} ft. Pos: ${f.lat.toFixed(2)}°N ${f.lng.toFixed(2)}°E`
                );
                if (a) newAlerts.push(a);
                seenKeys.add(`${f.icao24}-RAPID_DESCENT`);
            }

            // 3. Ground Proximity (low alt + descending fast)
            if (f.altitude != null && f.altitude < this.THRESHOLDS.GROUND_PROXIMITY_FT &&
                f.altitude > 0 && f.verticalRate < this.THRESHOLDS.GROUND_PROXIMITY_DESCENT) {
                const a = this._raise(f, 'GROUND_PROXIMITY', 'critical',
                    `🛬 Ground Proximity Warning`,
                    `${f.callsign || f.icao24} at ${f.altitude} ft, descending ${Math.abs(f.verticalRate)} ft/min. PULL UP advisory. Pos: ${f.lat.toFixed(2)}°N ${f.lng.toFixed(2)}°E`
                );
                if (a) newAlerts.push(a);
                seenKeys.add(`${f.icao24}-GROUND_PROXIMITY`);
            }

            // 4. Low Altitude (not descending dangerously — just unusually low)
            else if (f.altitude != null && f.altitude > 0 && f.altitude < this.THRESHOLDS.LOW_ALTITUDE_FT) {
                const a = this._raise(f, 'LOW_ALTITUDE', 'warning',
                    `⚠️ Low Altitude`,
                    `${f.callsign || f.icao24} flying at ${f.altitude} ft. Below ${this.THRESHOLDS.LOW_ALTITUDE_FT} ft threshold. Pos: ${f.lat.toFixed(2)}°N ${f.lng.toFixed(2)}°E`
                );
                if (a) newAlerts.push(a);
                seenKeys.add(`${f.icao24}-LOW_ALTITUDE`);
            }

            // 5. Excessive Speed
            if (f.speed != null && f.speed > this.THRESHOLDS.EXCESSIVE_SPEED_KTS) {
                const a = this._raise(f, 'EXCESSIVE_SPEED', 'warning',
                    `⚡ Excessive Speed`,
                    `${f.callsign || f.icao24} at ${f.speed} kts — exceeds ${this.THRESHOLDS.EXCESSIVE_SPEED_KTS} kts threshold. Alt: ${(f.altitude || 0).toLocaleString()} ft`
                );
                if (a) newAlerts.push(a);
                seenKeys.add(`${f.icao24}-EXCESSIVE_SPEED`);
            }

            // 6. Signal Loss (stale contact)
            if (f.lastContact && (now - f.lastContact) > this.THRESHOLDS.SIGNAL_LOST_SEC) {
                const staleSec = now - f.lastContact;
                const a = this._raise(f, 'SIGNAL_LOST', 'warning',
                    `📡 Signal Lost`,
                    `${f.callsign || f.icao24} — no signal for ${staleSec}s. Last: ${f.lat.toFixed(2)}°N ${f.lng.toFixed(2)}°E at ${(f.altitude || 0).toLocaleString()} ft`
                );
                if (a) newAlerts.push(a);
                seenKeys.add(`${f.icao24}-SIGNAL_LOST`);
            }
        });

        // Auto-clear alerts where condition no longer exists
        const cleared = [];
        Object.keys(this._active).forEach(key => {
            if (!seenKeys.has(key)) {
                const alert = this._active[key];
                alert.clearedAt = new Date().toISOString();
                alert.status = 'resolved';
                cleared.push(alert);
                delete this._active[key];
            }
        });

        // Notify listeners
        if (newAlerts.length > 0 || cleared.length > 0) {
            const active = Object.values(this._active);
            this._listeners.forEach(fn => {
                try { fn(active, newAlerts, cleared); } catch (e) { console.error('[AlertEngine] Listener error:', e); }
            });
        }
    },

    /**
     * Raise or update an alert. Returns the alert object if newly created, null if already active.
     */
    _raise(flight, type, severity, title, message) {
        const key = `${flight.icao24}-${type}`;
        if (this._active[key]) {
            // Update existing alert with latest position
            this._active[key].lat = flight.lat;
            this._active[key].lng = flight.lng;
            this._active[key].altitude = flight.altitude;
            this._active[key].message = message;
            this._active[key].updatedAt = new Date().toISOString();
            return null;
        }

        const alert = {
            id: key,
            type,
            severity,
            title,
            message,
            icao24: flight.icao24,
            callsign: flight.callsign || flight.icao24,
            lat: flight.lat,
            lng: flight.lng,
            altitude: flight.altitude,
            speed: flight.speed,
            squawk: flight.squawk,
            country: flight.country,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
        };

        this._active[key] = alert;

        // Add to history
        this.history.unshift({ ...alert });
        if (this.history.length > this.MAX_HISTORY) {
            this.history = this.history.slice(0, this.MAX_HISTORY);
        }

        return alert;
    },

    /** Get all active alerts sorted by severity */
    getActive() {
        const order = { critical: 0, warning: 1, info: 2 };
        return Object.values(this._active)
            .sort((a, b) => (order[a.severity] || 99) - (order[b.severity] || 99));
    },

    /** Get count by severity */
    getCounts() {
        const alerts = Object.values(this._active);
        return {
            total: alerts.length,
            critical: alerts.filter(a => a.severity === 'critical').length,
            warning: alerts.filter(a => a.severity === 'warning').length,
        };
    },

    /** Clear all active alerts */
    clearAll() {
        Object.values(this._active).forEach(a => {
            a.status = 'resolved';
            a.clearedAt = new Date().toISOString();
        });
        this._active = {};
    },

    /** Get severity icon */
    icon(severity) {
        return { critical: '🔴', warning: '🟡', info: '🔵' }[severity] || '⚪';
    },

    /** Get severity CSS class */
    cssClass(severity) {
        return { critical: 'alert-critical', warning: 'alert-warning', info: 'alert-info' }[severity] || '';
    },
};

// Wire up: when OpenSky delivers new data, analyze it
OpenSky.onUpdate((flights, error) => {
    if (!error) {
        AlertEngine.analyze(flights);
    }
});
