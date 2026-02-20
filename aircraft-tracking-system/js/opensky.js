// ============================================================
//  OPENSKY SERVICE — Real-time flight data from OpenSky Network
//  API docs: https://openskynetwork.github.io/opensky-api/
// ============================================================

const OpenSky = {
    // India bounding box (covers mainland + islands)
    BOUNDS: { lamin: 6, lamax: 37, lomin: 68, lomax: 98 },

    // Polling config
    POLL_INTERVAL: 15000,   // 15 seconds (API rate limit: 10s for anon)
    _timer: null,
    _listeners: [],
    _prevStates: {},        // Previous state keyed by icao24 — used for delta alerts
    _lastData: [],          // Most recent processed data
    _lastFetchTime: null,
    _errorCount: 0,
    _maxErrors: 5,

    /** Register a callback: fn(flights[]) called every poll cycle */
    onUpdate(fn) {
        this._listeners.push(fn);
    },

    /** Remove a callback */
    offUpdate(fn) {
        this._listeners = this._listeners.filter(f => f !== fn);
    },

    /** Start polling */
    start() {
        if (this._timer) return;
        this._fetch();  // immediate first call
        this._timer = setInterval(() => this._fetch(), this.POLL_INTERVAL);
        console.log('[OpenSky] Polling started — India airspace');
    },

    /** Stop polling */
    stop() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        console.log('[OpenSky] Polling stopped');
    },

    /** Get last known data without waiting for next poll */
    getLastData() {
        return this._lastData;
    },

    /** Get previous states for delta comparison */
    getPrevStates() {
        return this._prevStates;
    },

    /** Core fetch + transform */
    async _fetch() {
        const { lamin, lamax, lomin, lomax } = this.BOUNDS;
        const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();
            const states = json.states || [];

            // Save prev states BEFORE overwriting
            const prevMap = {};
            this._lastData.forEach(f => { prevMap[f.icao24] = f; });
            this._prevStates = prevMap;

            // Transform raw arrays → clean objects
            // API column order: https://openskynetwork.github.io/opensky-api/rest.html
            const flights = states
                .filter(s => s[5] != null && s[6] != null) // must have lat/lng
                .map(s => ({
                    icao24: s[0],
                    callsign: (s[1] || '').trim(),
                    country: s[2] || 'Unknown',
                    timePosition: s[3],
                    lastContact: s[4],
                    lng: s[5],
                    lat: s[6],
                    altitude: s[7] != null ? Math.round(s[7] * 3.28084) : null, // meters → feet
                    onGround: s[8],
                    speed: s[9] != null ? Math.round(s[9] * 1.94384) : null,  // m/s → knots
                    heading: s[10] != null ? Math.round(s[10]) : 0,
                    verticalRate: s[11] != null ? Math.round(s[11] * 196.85) : 0,   // m/s → ft/min
                    geoAltitude: s[13] != null ? Math.round(s[13] * 3.28084) : null,
                    squawk: s[14] || null,
                    spi: s[15],    // special purpose indicator (emergency)
                    category: s[17],
                }));

            this._lastData = flights;
            this._lastFetchTime = Date.now();
            this._errorCount = 0;

            // Notify listeners
            this._listeners.forEach(fn => {
                try { fn(flights); } catch (e) { console.error('[OpenSky] Listener error:', e); }
            });

        } catch (err) {
            this._errorCount++;
            console.warn(`[OpenSky] Fetch failed (${this._errorCount}/${this._maxErrors}):`, err.message);

            if (this._errorCount >= this._maxErrors) {
                console.error('[OpenSky] Too many errors, stopping polling. Last data preserved.');
                this.stop();
                // Notify with last known data + error flag
                this._listeners.forEach(fn => {
                    try { fn(this._lastData, { error: true, message: err.message }); }
                    catch (_) { }
                });
            }
        }
    },

    /** Human-readable time since last fetch */
    getTimeSinceUpdate() {
        if (!this._lastFetchTime) return 'Never';
        const secs = Math.round((Date.now() - this._lastFetchTime) / 1000);
        return secs < 60 ? `${secs}s ago` : `${Math.floor(secs / 60)}m ${secs % 60}s ago`;
    },

    /** Check if the service is actively polling */
    isActive() {
        return this._timer !== null;
    },
};
