// ============================================================
//  TRACKING PAGE — Live flight map with OpenSky Network data
//  Shows real aircraft over Indian airspace, updated every 15s.
// ============================================================

let trackingMap = null;
let trackingMarkers = {};
let selectedIcao = null;
let _trackingUpdateFn = null;   // Stored reference so we can unsubscribe

function renderTracking() {
  $id('page-tracking').innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-title">Live Flight Tracking — India</div>
      <div class="page-subtitle" id="tracking-subtitle">Connecting to OpenSky Network…</div>
    </div>
    <div class="page-header-actions">
      <div id="tracking-status" class="tracking-status-indicator">
        <span class="status-dot live"></span>
        <span id="tracking-status-text">Connecting…</span>
      </div>
    </div>
  </div>

  <!-- Alert Banner -->
  <div id="tracking-alert-banner" class="alert-banner" style="display:none"></div>

  <div class="tracking-layout">
    <div class="tracking-map-wrap">
      <div id="tracking-map"></div>
      <!-- Map overlay stats -->
      <div class="map-overlay-stats" id="map-overlay-stats">
        <div class="map-stat"><span id="stat-total">—</span> Aircraft</div>
        <div class="map-stat"><span id="stat-alerts" style="color:var(--danger)">0</span> Alerts</div>
        <div class="map-stat">Updated <span id="stat-updated">—</span></div>
      </div>
    </div>
    <div class="flight-panel" id="flight-panel">
      <div class="flight-panel-header">
        <span>🛩 Aircraft in Range</span>
        <span class="badge badge-primary" id="panel-count">0</span>
      </div>
      <div class="flight-panel-search">
        <input type="text" placeholder="Filter by callsign…" id="track-filter" oninput="filterFlightCards()">
      </div>
      <div class="flight-panel-list" id="flight-card-list">
        <div class="empty-state" style="padding:2rem;text-align:center;color:var(--text-muted)">
          Waiting for live data…
        </div>
      </div>

      <!-- Safety Alert Log -->
      <div class="flight-panel-header" style="margin-top:0.5rem;border-top:1px solid var(--border);padding-top:0.75rem">
        <span>🚨 Safety Alerts</span>
        <span class="badge badge-danger" id="alert-count">0</span>
      </div>
      <div class="alert-log" id="alert-log">
        <div style="padding:1rem;text-align:center;color:var(--text-muted);font-size:0.8rem">No alerts</div>
      </div>
    </div>
  </div>`;

  // Inject pulse animation if not already there
  if (!$id('pulse-style')) {
    const s = document.createElement('style');
    s.id = 'pulse-style';
    s.textContent = `
            @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
            @keyframes pulse-ring { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.5);opacity:0} }
        `;
    document.head.appendChild(s);
  }

  setTimeout(() => initTrackingMap(), 80);
}

// ── Map Initialization ──────────────────────────────────────
function initTrackingMap() {
  if (trackingMap) { trackingMap.remove(); trackingMap = null; }
  trackingMarkers = {};

  trackingMap = L.map('tracking-map', {
    zoomControl: true,
    attributionControl: false,
  }).setView([22, 82], 5);  // Center on India

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
  }).addTo(trackingMap);

  // Draw India bounding box
  const bounds = OpenSky.BOUNDS;
  L.rectangle(
    [[bounds.lamin, bounds.lomin], [bounds.lamax, bounds.lomax]],
    { color: '#00d4ff', weight: 1, fillOpacity: 0.02, dashArray: '6 4' }
  ).addTo(trackingMap);

  // Subscribe to OpenSky updates
  _trackingUpdateFn = (flights, error) => {
    if (error) {
      updateTrackingStatus('error', `API Error — showing last data (${flights.length})`);
    } else {
      updateTrackingStatus('live', `${flights.length} aircraft · Updated ${new Date().toLocaleTimeString()}`);
    }
    updateMapMarkers(flights);
    updateFlightCards(flights);
    updateAlertDisplay();
    updateOverlayStats(flights);
  };
  OpenSky.onUpdate(_trackingUpdateFn);

  // Start OpenSky polling (idempotent — won't double-start)
  OpenSky.start();

  // If we already have data, render immediately
  const existing = OpenSky.getLastData();
  if (existing.length > 0) {
    updateMapMarkers(existing);
    updateFlightCards(existing);
    updateOverlayStats(existing);
    updateTrackingStatus('live', `${existing.length} aircraft · Cached data`);
  }
}

// ── Cleanup (called by router when leaving tracking page) ───
function cleanupTracking() {
  if (_trackingUpdateFn) {
    OpenSky.offUpdate(_trackingUpdateFn);
    _trackingUpdateFn = null;
  }
  // Don't stop OpenSky entirely — dashboard may also use it
  if (trackingMap) { trackingMap.remove(); trackingMap = null; }
  trackingMarkers = {};
  selectedIcao = null;
}

// ── Status indicator ────────────────────────────────────────
function updateTrackingStatus(state, text) {
  const dot = $qs('#tracking-status .status-dot');
  const label = $id('tracking-status-text');
  const sub = $id('tracking-subtitle');
  if (dot) {
    dot.className = 'status-dot ' + (state === 'live' ? 'live' : state === 'error' ? 'error' : '');
  }
  if (label) label.textContent = state === 'live' ? 'Live' : state === 'error' ? 'Offline' : 'Connecting…';
  if (sub) sub.textContent = text;
}

// ── Map Markers ─────────────────────────────────────────────
function updateMapMarkers(flights) {
  if (!trackingMap) return;

  const activeAlerts = AlertEngine.getActive();
  const alertMap = {};
  activeAlerts.forEach(a => { alertMap[a.icao24] = a.severity; });

  const currentIcaos = new Set();

  flights.forEach(f => {
    if (f.onGround) return; // Skip grounded
    currentIcaos.add(f.icao24);

    const severity = alertMap[f.icao24] || null;
    const icon = makeFlightIcon(f.heading, f.icao24 === selectedIcao, severity);

    if (trackingMarkers[f.icao24]) {
      // Update existing
      trackingMarkers[f.icao24].setLatLng([f.lat, f.lng]);
      trackingMarkers[f.icao24].setIcon(icon);
      trackingMarkers[f.icao24].setPopupContent(buildLivePopup(f, severity));
    } else {
      // New marker
      const marker = L.marker([f.lat, f.lng], { icon })
        .addTo(trackingMap)
        .bindPopup(buildLivePopup(f, severity));
      marker.on('click', () => selectAircraft(f.icao24));
      trackingMarkers[f.icao24] = marker;
    }
  });

  // Remove markers for aircraft no longer in data
  Object.keys(trackingMarkers).forEach(icao => {
    if (!currentIcaos.has(icao)) {
      trackingMap.removeLayer(trackingMarkers[icao]);
      delete trackingMarkers[icao];
    }
  });
}

function makeFlightIcon(heading, selected, severity) {
  let color = '#94a3b8';  // default grey
  let glow = 'none';
  if (selected) { color = '#00d4ff'; glow = 'drop-shadow(0 0 6px #00d4ff)'; }
  if (severity === 'critical') { color = '#ef4444'; glow = 'drop-shadow(0 0 8px #ef4444)'; }
  else if (severity === 'warning') { color = '#f59e0b'; glow = 'drop-shadow(0 0 6px #f59e0b)'; }

  return L.divIcon({
    className: '',
    html: `<div style="font-size:18px;transform:rotate(${heading || 0}deg);color:${color};filter:${glow};transition:all 0.8s ease">✈</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function buildLivePopup(f, severity) {
  const alertTag = severity
    ? `<div style="background:${severity === 'critical' ? '#ef444433' : '#f59e0b33'};color:${severity === 'critical' ? '#ef4444' : '#f59e0b'};padding:2px 6px;border-radius:4px;font-size:0.7rem;margin-bottom:4px">⚠ ${severity.toUpperCase()} ALERT</div>`
    : '';
  return `<div style="min-width:180px;font-family:Inter,sans-serif">
    ${alertTag}
    <div style="font-weight:700;font-size:0.9rem;margin-bottom:2px">${f.callsign || f.icao24}</div>
    <div style="font-size:0.75rem;color:#64748b;margin-bottom:6px">${f.country} · ICAO: ${f.icao24}</div>
    <div style="font-size:0.78rem;line-height:1.6">
      📏 Alt: <b>${f.altitude != null ? f.altitude.toLocaleString() + ' ft' : 'N/A'}</b><br>
      ⚡ Speed: <b>${f.speed != null ? f.speed + ' kts' : 'N/A'}</b><br>
      🧭 Heading: <b>${f.heading}°</b><br>
      📐 V/S: <b>${f.verticalRate > 0 ? '+' : ''}${f.verticalRate} ft/min</b>
      ${f.squawk ? `<br>📟 Squawk: <b>${f.squawk}</b>` : ''}
    </div>
  </div>`;
}

// ── Flight cards sidebar ────────────────────────────────────
function updateFlightCards(flights) {
  const list = $id('flight-card-list');
  const countBadge = $id('panel-count');
  if (!list) return;

  const airborne = flights.filter(f => !f.onGround);
  if (countBadge) countBadge.textContent = airborne.length;

  const filter = ($id('track-filter')?.value || '').toLowerCase();
  const filtered = filter
    ? airborne.filter(f => (f.callsign || '').toLowerCase().includes(filter) || f.icao24.includes(filter))
    : airborne;

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state" style="padding:2rem;text-align:center;color:var(--text-muted)">${filter ? 'No matches' : 'No airborne aircraft in range'}</div>`;
    return;
  }

  const alerts = AlertEngine.getActive();
  const alertMap = {};
  alerts.forEach(a => { alertMap[a.icao24] = a.severity; });

  // Sort: critical first, then warning, then by callsign
  const sorted = [...filtered].sort((a, b) => {
    const sa = alertMap[a.icao24] === 'critical' ? 0 : alertMap[a.icao24] === 'warning' ? 1 : 2;
    const sb = alertMap[b.icao24] === 'critical' ? 0 : alertMap[b.icao24] === 'warning' ? 1 : 2;
    if (sa !== sb) return sa - sb;
    return (a.callsign || a.icao24).localeCompare(b.callsign || b.icao24);
  });

  // Only render first 80 to avoid DOM overload
  list.innerHTML = sorted.slice(0, 80).map(f => {
    const sev = alertMap[f.icao24];
    const borderColor = sev === 'critical' ? 'var(--danger)' : sev === 'warning' ? 'var(--warning)' : 'transparent';
    const isSelected = f.icao24 === selectedIcao;
    return `
        <div class="flight-card ${isSelected ? 'selected' : ''}" id="fcard-${f.icao24}"
             onclick="selectAircraft('${f.icao24}')"
             style="border-left:3px solid ${borderColor}">
          <div class="flight-no">
            ${f.callsign || f.icao24}
            <span style="font-size:0.68rem;color:var(--text-muted);font-weight:400">${f.country}</span>
            ${sev ? `<span class="badge ${sev === 'critical' ? 'badge-danger' : 'badge-warning'}" style="font-size:0.55rem;padding:1px 5px">${sev.toUpperCase()}</span>` : ''}
          </div>
          <div class="flight-metrics" style="margin-top:0.3rem">
            <div class="flight-metric"><div class="flight-metric-label">ALT</div><div class="flight-metric-value">${f.altitude != null ? f.altitude.toLocaleString() : '—'} ft</div></div>
            <div class="flight-metric"><div class="flight-metric-label">SPD</div><div class="flight-metric-value">${f.speed || '—'} kt</div></div>
            <div class="flight-metric"><div class="flight-metric-label">HDG</div><div class="flight-metric-value">${f.heading}°</div></div>
            <div class="flight-metric"><div class="flight-metric-label">V/S</div><div class="flight-metric-value">${f.verticalRate > 0 ? '+' : ''}${f.verticalRate}</div></div>
          </div>
        </div>`;
  }).join('');
}

function filterFlightCards() {
  const data = OpenSky.getLastData();
  if (data.length) updateFlightCards(data);
}

// ── Select aircraft on map ──────────────────────────────────
function selectAircraft(icao) {
  selectedIcao = icao;
  // Highlight card
  $qsa('.flight-card').forEach(c => c.classList.remove('selected'));
  const card = $id('fcard-' + icao);
  if (card) { card.classList.add('selected'); card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  // Pan map + highlight marker
  const m = trackingMarkers[icao];
  if (m && trackingMap) {
    trackingMap.panTo(m.getLatLng(), { animate: true, duration: 0.8 });
    m.openPopup();
  }
  // Re-render markers to update colors
  const data = OpenSky.getLastData();
  if (data.length) updateMapMarkers(data);
}

// ── Alert display ───────────────────────────────────────────
function updateAlertDisplay() {
  const alerts = AlertEngine.getActive();
  const counts = AlertEngine.getCounts();

  // Badge
  const badge = $id('alert-count');
  if (badge) { badge.textContent = counts.total; badge.style.display = counts.total > 0 ? 'inline-flex' : 'none'; }

  // Alert banner (top of page for critical alerts)
  const banner = $id('tracking-alert-banner');
  if (banner) {
    const critical = alerts.filter(a => a.severity === 'critical');
    if (critical.length > 0) {
      banner.style.display = 'block';
      banner.className = 'alert-banner alert-banner-critical';
      banner.innerHTML = critical.map(a =>
        `<div class="alert-banner-item">🚨 <strong>${a.title}</strong> — ${a.message}</div>`
      ).join('');
    } else {
      banner.style.display = 'none';
    }
  }

  // Alert log panel
  const log = $id('alert-log');
  if (log) {
    if (alerts.length === 0 && AlertEngine.history.length === 0) {
      log.innerHTML = `<div style="padding:1rem;text-align:center;color:var(--text-muted);font-size:0.8rem">✅ No safety alerts</div>`;
    } else {
      // Show active first, then recent history
      const items = [
        ...alerts.map(a => ({ ...a, isActive: true })),
        ...AlertEngine.history.filter(h => h.status === 'resolved').slice(0, 10).map(h => ({ ...h, isActive: false })),
      ];
      log.innerHTML = items.map(a => `
              <div class="alert-log-item ${a.isActive ? AlertEngine.cssClass(a.severity) : 'alert-resolved'}"
                   onclick="${a.lat ? `selectAircraft('${a.icao24}')` : ''}">
                <div class="alert-log-icon">${AlertEngine.icon(a.severity)}</div>
                <div class="alert-log-body">
                  <div class="alert-log-title">${escapeHtml(a.title)} ${!a.isActive ? '<span class="badge badge-success" style="font-size:0.55rem">RESOLVED</span>' : ''}</div>
                  <div class="alert-log-msg">${escapeHtml(a.message)}</div>
                  <div class="alert-log-time">${new Date(a.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>`).join('');
    }
  }
}

// ── Overlay stats ───────────────────────────────────────────
function updateOverlayStats(flights) {
  const total = $id('stat-total');
  const alertStat = $id('stat-alerts');
  const updated = $id('stat-updated');
  if (total) total.textContent = flights.filter(f => !f.onGround).length;
  if (alertStat) alertStat.textContent = AlertEngine.getCounts().total;
  if (updated) updated.textContent = new Date().toLocaleTimeString();
}
