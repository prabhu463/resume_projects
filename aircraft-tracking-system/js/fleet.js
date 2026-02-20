// ============================================================
//  FLEET MANAGEMENT PAGE
// ============================================================
let fleetFilter = { status: 'all', type: 'all', search: '' };

function renderFleet() {
    const types = [...new Set(DB.aircraft.map(a => a.type))];
    document.getElementById('page-fleet').innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-title">Fleet Management</div>
      <div class="page-subtitle">${DB.aircraft.length} aircraft registered</div>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-primary" onclick="openAddAircraftModal()">+ Add Aircraft</button>
    </div>
  </div>

  <div class="filter-bar">
    <div class="search-input-wrap">
      <span>🔍</span>
      <input type="text" placeholder="Search registration, model, airline…" id="fleet-search" oninput="applyFleetFilter()">
    </div>
    <select class="filter-select" id="fleet-status-filter" onchange="applyFleetFilter()">
      <option value="all">All Status</option>
      <option value="active">Active</option>
      <option value="maintenance">Maintenance</option>
      <option value="grounded">Grounded</option>
    </select>
    <select class="filter-select" id="fleet-type-filter" onchange="applyFleetFilter()">
      <option value="all">All Types</option>
      ${types.map(t => `<option value="${t}">${t}</option>`).join('')}
    </select>
    <div style="margin-left:auto;font-size:0.8rem;color:var(--text-muted)" id="fleet-count"></div>
  </div>

  <div class="aircraft-grid" id="aircraft-grid"></div>`;

    renderAircraftCards(DB.aircraft);
}

function applyFleetFilter() {
    const search = $id('fleet-search')?.value.toLowerCase() || '';
    const status = $id('fleet-status-filter')?.value || 'all';
    const type = $id('fleet-type-filter')?.value || 'all';

    const filtered = DB.aircraft.filter(a => {
        const matchSearch = !search ||
            a.registration.toLowerCase().includes(search) ||
            a.model.toLowerCase().includes(search) ||
            a.airline.toLowerCase().includes(search);
        const matchStatus = status === 'all' || a.status === status;
        const matchType = type === 'all' || a.type === type;
        return matchSearch && matchStatus && matchType;
    });

    renderAircraftCards(filtered);
}

function renderAircraftCards(list) {
    const grid = $id('aircraft-grid');
    const countEl = $id('fleet-count');
    if (countEl) countEl.textContent = `${list.length} aircraft`;
    if (!grid) return;

    if (list.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">✈</div><p>No aircraft match your filters.</p></div>`;
        return;
    }

    grid.innerHTML = list.map(a => {
        const nextDays = daysUntil(a.nextMaintenance);
        const maintColor = nextDays < 0 ? 'var(--danger)' : nextDays < 7 ? 'var(--warning)' : 'var(--success)';
        const flight = getActiveFlight(a.id);
        return `
    <div class="aircraft-card" onclick="openAircraftModal('${a.id}')">
      <div class="aircraft-card-header">
        <div>
          <div class="aircraft-reg">${a.registration}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${a.type}</div>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center">
          ${flight ? '<span style="font-size:0.7rem;background:var(--info-dim);color:var(--info);padding:2px 8px;border-radius:99px">✈ In Flight</span>' : ''}
          <div class="aircraft-plane-icon">✈</div>
        </div>
      </div>
      <div class="aircraft-card-body">
        <div class="aircraft-model">${a.model}</div>
        <div class="aircraft-airline">${a.airline}</div>
        <div class="aircraft-stats">
          <div class="ac-stat"><div class="ac-stat-label">Flight Hours</div><div class="ac-stat-value">${a.flightHours.toLocaleString()}</div></div>
          <div class="ac-stat"><div class="ac-stat-label">Cycles</div><div class="ac-stat-value">${a.cycles.toLocaleString()}</div></div>
          <div class="ac-stat"><div class="ac-stat-label">Year</div><div class="ac-stat-value">${a.manufacture}</div></div>
          <div class="ac-stat"><div class="ac-stat-label">Engines</div><div class="ac-stat-value">${a.engines}</div></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.76rem">
          <span style="color:var(--text-muted)">Next Maintenance</span>
          <span style="color:${maintColor};font-weight:600">${formatDate(a.nextMaintenance)}</span>
        </div>
      </div>
      <div class="aircraft-card-footer">
        ${statusBadge(a.status)}
        <span style="font-size:0.76rem;color:var(--text-muted)">${a.seats} seats</span>
        <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();openAircraftModal('${a.id}')">View →</button>
      </div>
    </div>`;
    }).join('');
}

function openAircraftModal(id) {
    const a = getAircraft(id);
    if (!a) return;
    const maintHistory = getMaintenanceByAircraft(id);
    const flight = getActiveFlight(id);

    openModal(`
  <div class="modal-header">
    <div>
      <div style="font-size:1.1rem;font-weight:800;font-family:ui-monospace,monospace;color:var(--accent)">${a.registration}</div>
      <div style="font-size:0.82rem;color:var(--text-muted)">${a.model} · ${a.airline}</div>
    </div>
    <div style="display:flex;gap:0.5rem;align-items:center">
      ${statusBadge(a.status)}
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
  </div>

  ${flight ? `<div style="background:var(--info-dim);border:1px solid rgba(59,130,246,0.3);border-radius:var(--radius-sm);padding:0.6rem 0.85rem;margin-bottom:1rem;font-size:0.82rem;color:var(--info)">
    ✈ Currently on flight <b>${flight.flightNo}</b> — ${flight.origin} → ${flight.dest} (${flight.progress}% complete)
  </div>` : ''}

  <div class="detail-grid">
    <div class="detail-item"><div class="detail-item-label">Type</div><div class="detail-item-value">${a.type}</div></div>
    <div class="detail-item"><div class="detail-item-label">Manufacture Year</div><div class="detail-item-value">${a.manufacture}</div></div>
    <div class="detail-item"><div class="detail-item-label">Flight Hours</div><div class="detail-item-value">${a.flightHours.toLocaleString()} hrs</div></div>
    <div class="detail-item"><div class="detail-item-label">Cycles</div><div class="detail-item-value">${a.cycles.toLocaleString()}</div></div>
    <div class="detail-item"><div class="detail-item-label">Seats</div><div class="detail-item-value">${a.seats}</div></div>
    <div class="detail-item"><div class="detail-item-label">Engines</div><div class="detail-item-value">${a.engines}</div></div>
    <div class="detail-item"><div class="detail-item-label">Last Maintenance</div><div class="detail-item-value">${formatDate(a.lastMaintenance)}</div></div>
    <div class="detail-item"><div class="detail-item-label">Next Maintenance</div><div class="detail-item-value" style="color:${daysUntil(a.nextMaintenance) < 0 ? 'var(--danger)' : 'var(--success)'}">${formatDate(a.nextMaintenance)}</div></div>
  </div>

  ${a.notes ? `<div style="background:var(--warning-dim);border:1px solid rgba(245,158,11,0.3);border-radius:var(--radius-sm);padding:0.6rem 0.85rem;margin-bottom:1rem;font-size:0.82rem;color:var(--warning)">⚠ ${a.notes}</div>` : ''}

  <div class="section-label" style="margin-top:0.5rem">Maintenance History</div>
  ${maintHistory.length === 0 ? '<p style="color:var(--text-muted);font-size:0.82rem">No maintenance records.</p>' :
            maintHistory.map(m => `
    <div class="stat-row">
      <div><div style="font-size:0.82rem;font-weight:600">${m.type}</div><div style="font-size:0.75rem;color:var(--text-muted)">${formatDate(m.startDate)} · ${m.technician}</div></div>
      <div style="display:flex;gap:0.5rem;align-items:center">${priorityBadge(m.priority)}${statusBadge(m.status)}</div>
    </div>`).join('')}

  <div style="display:flex;gap:0.5rem;margin-top:1.25rem">
    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    <button class="btn btn-primary" onclick="closeModal();router.navigate('maintenance')">Schedule Maintenance</button>
  </div>`);
}

function openAddAircraftModal() {
    openModal(`
  <div class="modal-header">
    <h3>Add New Aircraft</h3>
    <button class="modal-close" onclick="closeModal()">✕</button>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
    <div class="form-group"><label class="form-label">Registration</label><input class="form-input" id="new-reg" placeholder="N12345"></div>
    <div class="form-group"><label class="form-label">Model</label><input class="form-input" id="new-model" placeholder="Boeing 737-800"></div>
    <div class="form-group"><label class="form-label">Airline</label><input class="form-input" id="new-airline" placeholder="Airline Name"></div>
    <div class="form-group"><label class="form-label">Type</label>
      <select class="form-select" id="new-type">
        <option>Narrow-body</option><option>Wide-body</option><option>Regional</option><option>Cargo</option>
      </select>
    </div>
    <div class="form-group"><label class="form-label">Year</label><input class="form-input" id="new-year" type="number" placeholder="2022" min="1980" max="2026"></div>
    <div class="form-group"><label class="form-label">Seats</label><input class="form-input" id="new-seats" type="number" placeholder="180"></div>
    <div class="form-group"><label class="form-label">Engines</label><input class="form-input" id="new-engines" type="number" placeholder="2" min="1" max="4"></div>
    <div class="form-group"><label class="form-label">Status</label>
      <select class="form-select" id="new-status"><option value="active">Active</option><option value="grounded">Grounded</option><option value="maintenance">Maintenance</option></select>
    </div>
  </div>
  <div style="display:flex;gap:0.5rem;margin-top:1.25rem;justify-content:flex-end">
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveNewAircraft()">Add Aircraft</button>
  </div>`);
}

function saveNewAircraft() {
    const reg = $id('new-reg').value.trim().toUpperCase();
    const model = $id('new-model').value.trim();
    if (!reg || !model) { showToast('Registration and model are required.', 'error'); return; }
    const newAc = {
        id: 'A' + String(DB.aircraft.length + 1).padStart(3, '0'),
        registration: reg, model,
        airline: $id('new-airline').value.trim() || 'Unknown',
        type: $id('new-type').value,
        status: $id('new-status').value,
        flightHours: 0, lastMaintenance: '', nextMaintenance: '',
        cycles: 0,
        manufacture: parseInt($id('new-year').value) || 2024,
        engines: parseInt($id('new-engines').value) || 2,
        seats: parseInt($id('new-seats').value) || 0,
        notes: '',
    };
    DB.aircraft.push(newAc);
    closeModal();
    renderFleet();
    showToast(`Aircraft ${reg} added successfully!`, 'success');
}
