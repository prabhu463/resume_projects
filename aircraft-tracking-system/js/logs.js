// ============================================================
//  MAINTENANCE LOGS PAGE
// ============================================================
function renderLogs() {
    const all = DB.maintenance;
    const done = all.filter(m => m.status === 'completed');
    const totalCost = done.reduce((s, m) => s + m.cost, 0);
    const totalHours = done.reduce((s, m) => s + m.completedHours, 0);

    document.getElementById('page-logs').innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-title">Maintenance Logs</div>
      <div class="page-subtitle">Complete maintenance history and records</div>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-secondary" onclick="exportLogsCSV()">↓ Export CSV</button>
    </div>
  </div>

  <div class="logs-stats">
    ${invKpi('📋', 'Total Records', all.length, 'var(--accent)')}
    ${invKpi('✅', 'Completed', done.length, 'var(--success)')}
    ${invKpi('⏱', 'Total Hours', totalHours.toLocaleString(), 'var(--warning)')}
    ${invKpi('💰', 'Total Cost', formatCost(totalCost), 'var(--accent2)')}
  </div>

  <div class="filter-bar">
    <div class="search-input-wrap">
      <span>🔍</span>
      <input type="text" placeholder="Search aircraft, task type, technician…" id="log-search" oninput="applyLogsFilter()">
    </div>
    <select class="filter-select" id="log-status" onchange="applyLogsFilter()">
      <option value="all">All Statuses</option>
      <option value="completed">Completed</option>
      <option value="in-progress">In Progress</option>
      <option value="scheduled">Scheduled</option>
    </select>
    <select class="filter-select" id="log-priority" onchange="applyLogsFilter()">
      <option value="all">All Priorities</option>
      <option value="critical">Critical</option>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
  </div>

  <div class="table-wrap">
    <table class="data-table">
      <thead><tr>
        <th>Task ID</th><th>Aircraft</th><th>Type</th><th>Technician</th>
        <th>Hangar</th><th>Start</th><th>Due</th><th>Hours</th>
        <th>Cost</th><th>Priority</th><th>Status</th>
      </tr></thead>
      <tbody id="logs-tbody"></tbody>
    </table>
  </div>`;

    renderLogsRows(DB.maintenance);
}

function applyLogsFilter() {
    const search = $id('log-search')?.value.toLowerCase() || '';
    const status = $id('log-status')?.value || 'all';
    const priority = $id('log-priority')?.value || 'all';

    const filtered = DB.maintenance.filter(m => {
        const ac = getAircraft(m.aircraftId);
        const matchSearch = !search ||
            m.type.toLowerCase().includes(search) ||
            m.technician.toLowerCase().includes(search) ||
            (ac && ac.registration.toLowerCase().includes(search));
        const matchStatus = status === 'all' || m.status === status;
        const matchPriority = priority === 'all' || m.priority === priority;
        return matchSearch && matchStatus && matchPriority;
    });
    renderLogsRows(filtered);
}

function renderLogsRows(list) {
    const tbody = $id('logs-tbody');
    if (!tbody) return;
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;color:var(--text-muted);padding:2rem">No records found.</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(m => {
        const ac = getAircraft(m.aircraftId);
        return `<tr>
      <td><span class="font-mono">${m.id}</span></td>
      <td><span class="font-mono">${ac ? ac.registration : m.aircraftId}</span></td>
      <td style="font-weight:500">${m.type}</td>
      <td>${m.technician}</td>
      <td><span class="chip">${m.hangar}</span></td>
      <td>${formatDate(m.startDate)}</td>
      <td style="color:${daysUntil(m.dueDate) < 0 && m.status !== 'completed' ? 'var(--danger)' : 'inherit'}">${formatDate(m.dueDate)}</td>
      <td>${m.completedHours}/${m.estimatedHours}</td>
      <td style="font-weight:500">${formatCost(m.cost)}</td>
      <td>${priorityBadge(m.priority)}</td>
      <td>${statusBadge(m.status)}</td>
    </tr>`;
    }).join('');
}

function exportLogsCSV() {
    const header = 'Task ID,Aircraft,Type,Technician,Hangar,Start,Due,Hours,Cost,Priority,Status';
    const rows = DB.maintenance.map(m => {
        const ac = getAircraft(m.aircraftId);
        return `${m.id},${ac ? ac.registration : m.aircraftId},"${m.type}","${m.technician}",${m.hangar},${m.startDate},${m.dueDate},${m.estimatedHours},${m.cost},${m.priority},${m.status}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'maintenance-logs.csv'; a.click();
    showToast('Logs exported!', 'success');
}
