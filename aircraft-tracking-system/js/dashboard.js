// ============================================================
//  DASHBOARD PAGE — Now with live OpenSky data
// ============================================================

let miniMap = null;
let _dashUpdateFn = null;

function renderDashboard() {
  // Cleanup previous
  if (miniMap) { miniMap.remove(); miniMap = null; }
  if (_dashUpdateFn) { OpenSky.offUpdate(_dashUpdateFn); _dashUpdateFn = null; }

  const totalAircraft = DB.aircraft.length;
  const overdueMaint = DB.maintenance.filter(m => m.status !== 'completed' && daysUntil(m.dueDate) < 0).length;
  const lowParts = DB.parts.filter(isLowStock).length;

  // We'll fill the live flight count from OpenSky
  const cachedLive = OpenSky.getLastData();
  const liveCount = cachedLive.filter(f => !f.onGround).length;

  $id('page-dashboard').innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-title">Command Center</div>
      <div class="page-subtitle">Real-time fleet, flight and safety overview — India airspace</div>
    </div>
    <div class="page-header-actions">
      <span style="font-size:0.78rem;color:var(--text-muted)">🕐 ${new Date().toLocaleTimeString()}</span>
      <button class="btn btn-primary" onclick="renderDashboard();showToast('Dashboard refreshed','success')">↻ Refresh</button>
    </div>
  </div>

  <div class="dashboard-grid">
    <!-- KPI Row -->
    <div class="dash-kpis">
      ${kpiCard('✈', 'Fleet Aircraft', totalAircraft, `${DB.aircraft.filter(a => a.status === 'active').length} active`, '#00d4ff', 'rgba(0,212,255,0.12)', '#00d4ff')}
      ${kpiCard('🛫', 'Live Over India', `<span id="kpi-live-count">${liveCount || '—'}</span>`, 'OpenSky real-time', '#22c55e', 'rgba(34,197,94,0.12)', '#22c55e')}
      ${kpiCard('🔧', 'Overdue Maintenance', overdueMaint, overdueMaint > 0 ? 'Needs attention' : 'All clear', '#ef4444', 'rgba(239,68,68,0.12)', '#ef4444')}
      ${kpiCard('🚨', 'Active Safety Alerts', '<span id="kpi-alert-count">0</span>', '<span id="kpi-alert-sub">Monitoring…</span>', '#f59e0b', 'rgba(245,158,11,0.12)', '#f59e0b')}
    </div>

    <!-- Mini Map — Live -->
    <div class="card dash-map" style="padding:1rem">
      <div class="card-header">
        <h3>🌍 Live India Airspace</h3>
        <button class="btn btn-sm btn-secondary" onclick="router.navigate('tracking')">Full Map →</button>
      </div>
      <div id="mini-map-container" class="mini-map"></div>
    </div>

    <!-- Live Safety Alerts -->
    <div class="card dash-alerts" style="padding:1rem">
      <div class="card-header">
        <h3>🚨 Safety Alerts</h3>
        <span class="badge badge-danger" id="dash-alert-badge">0</span>
      </div>
      <div id="dash-alert-list">
        <div style="padding:1.5rem;text-align:center;color:var(--text-muted);font-size:0.85rem">
          ✅ No active alerts — monitoring Indian airspace
        </div>
      </div>
    </div>

    <!-- Upcoming Maintenance -->
    <div class="card dash-maint" style="padding:1rem">
      <div class="card-header">
        <h3>🔧 Upcoming Maintenance</h3>
        <button class="btn btn-sm btn-secondary" onclick="router.navigate('maintenance')">View All →</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Aircraft</th><th>Task</th><th>Due</th><th>Priority</th><th>Status</th></tr></thead>
          <tbody>
          ${DB.maintenance.filter(m => m.status !== 'completed').slice(0, 5).map(m => {
    const ac = getAircraft(m.aircraftId);
    const days = daysUntil(m.dueDate);
    const dueColor = days < 0 ? 'var(--danger)' : days < 3 ? 'var(--warning)' : 'var(--text-secondary)';
    const dueLabel = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`;
    return `<tr>
                <td><span class="font-mono">${ac ? ac.registration : m.aircraftId}</span></td>
                <td>${escapeHtml(m.type)}</td>
                <td style="color:${dueColor};font-weight:500">${dueLabel}</td>
                <td>${priorityBadge(m.priority)}</td>
                <td>${statusBadge(m.status)}</td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Fleet Status -->
    <div class="card dash-fleet" style="padding:1rem">
      <div class="card-header">
        <h3>🚀 Fleet Status</h3>
        <button class="btn btn-sm btn-secondary" onclick="router.navigate('fleet')">Manage →</button>
      </div>
      <div style="display:flex;gap:0.75rem;margin-bottom:1rem">
        ${fleetStatusChip('Active', DB.aircraft.filter(a => a.status === 'active').length, 'var(--success)')}
        ${fleetStatusChip('Maintenance', DB.aircraft.filter(a => a.status === 'maintenance').length, 'var(--warning)')}
        ${fleetStatusChip('Grounded', DB.aircraft.filter(a => a.status === 'grounded').length, 'var(--danger)')}
      </div>
      ${DB.aircraft.slice(0, 6).map(a => `
        <div class="fleet-summary-item">
          <div class="fleet-dot" style="background:${getStatusColor(a.status)}"></div>
          <div class="fleet-info">
            <div class="reg">${a.registration}</div>
            <div class="model">${a.model}</div>
          </div>
          ${statusBadge(a.status)}
          <div class="fleet-hours">${a.flightHours.toLocaleString()} hrs</div>
        </div>`).join('')}
    </div>
  </div>`;

  setTimeout(initDashMiniMap, 80);

  // Subscribe to live alert updates for dashboard
  AlertEngine.onAlert((active, newAlerts) => {
    updateDashAlerts(active);
  });
}

function fleetStatusChip(label, count, color) {
  return `<div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.5rem 0.8rem;flex:1;text-align:center">
      <div style="font-size:1.2rem;font-weight:700;color:${color}">${count}</div>
      <div style="font-size:0.72rem;color:var(--text-muted)">${label}</div>
    </div>`;
}

// ── Mini Map with live aircraft ─────────────────────────────
function initDashMiniMap() {
  const container = $id('mini-map-container');
  if (!container) return;

  try {
    miniMap = L.map('mini-map-container', { zoomControl: false, attributionControl: false })
      .setView([22, 80], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);

    // India bounding box
    const b = OpenSky.BOUNDS;
    L.rectangle([[b.lamin, b.lomin], [b.lamax, b.lomax]], {
      color: '#00d4ff', weight: 1, fillOpacity: 0.03, dashArray: '5 3'
    }).addTo(miniMap);

    // Subscribe to OpenSky updates for mini-map
    _dashUpdateFn = (flights) => {
      updateMiniMapMarkers(flights);
      // Update KPI live count
      const liveEl = $id('kpi-live-count');
      if (liveEl) liveEl.textContent = flights.filter(f => !f.onGround).length;
    };
    OpenSky.onUpdate(_dashUpdateFn);

    // Start data if not started
    OpenSky.start();

    // Render with cached data if available
    const cached = OpenSky.getLastData();
    if (cached.length) updateMiniMapMarkers(cached);

  } catch (err) {
    console.warn('[Dashboard] Mini-map init failed:', err);
  }
}

let _miniMarkers = {};

function updateMiniMapMarkers(flights) {
  if (!miniMap) return;
  const airborne = flights.filter(f => !f.onGround);
  const seen = new Set();

  airborne.forEach(f => {
    seen.add(f.icao24);
    const icon = L.divIcon({
      className: '',
      html: `<div style="font-size:12px;transform:rotate(${f.heading || 0}deg);color:#00d4ff;filter:drop-shadow(0 0 3px #00d4ff)">✈</div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    if (_miniMarkers[f.icao24]) {
      _miniMarkers[f.icao24].setLatLng([f.lat, f.lng]);
      _miniMarkers[f.icao24].setIcon(icon);
    } else {
      _miniMarkers[f.icao24] = L.marker([f.lat, f.lng], { icon })
        .bindPopup(`<b>${f.callsign || f.icao24}</b><br>${f.country}`)
        .addTo(miniMap);
    }
  });

  // Remove old markers
  Object.keys(_miniMarkers).forEach(k => {
    if (!seen.has(k)) { miniMap.removeLayer(_miniMarkers[k]); delete _miniMarkers[k]; }
  });
}

// ── Dashboard live alerts panel ─────────────────────────────
function updateDashAlerts(activeAlerts) {
  const badge = $id('dash-alert-badge');
  const list = $id('dash-alert-list');
  const kpiCount = $id('kpi-alert-count');
  const kpiSub = $id('kpi-alert-sub');

  const counts = AlertEngine.getCounts();

  if (badge) { badge.textContent = counts.total; badge.style.display = counts.total > 0 ? 'inline-flex' : 'none'; }
  if (kpiCount) kpiCount.textContent = counts.total;
  if (kpiSub) kpiSub.textContent = counts.critical > 0 ? `${counts.critical} critical!` : counts.total > 0 ? `${counts.warning} warnings` : 'All clear';

  if (!list) return;

  if (activeAlerts.length === 0) {
    list.innerHTML = `<div style="padding:1.5rem;text-align:center;color:var(--text-muted);font-size:0.85rem">✅ No active alerts — monitoring Indian airspace</div>`;
    return;
  }

  list.innerHTML = activeAlerts.slice(0, 8).map(a => `
      <div class="alert-item" style="border-left:3px solid ${a.severity === 'critical' ? 'var(--danger)' : 'var(--warning)'}">
        <div class="alert-icon">${AlertEngine.icon(a.severity)}</div>
        <div class="alert-body">
          <h4>${escapeHtml(a.title)}</h4>
          <p style="font-size:0.78rem">${escapeHtml(a.message)}</p>
          <small>${new Date(a.createdAt).toLocaleTimeString()} · ${a.callsign}</small>
        </div>
      </div>`).join('');
}

// ── Cleanup ─────────────────────────────────────────────────
function cleanupDashboard() {
  if (_dashUpdateFn) { OpenSky.offUpdate(_dashUpdateFn); _dashUpdateFn = null; }
  if (miniMap) { miniMap.remove(); miniMap = null; }
  _miniMarkers = {};
}
