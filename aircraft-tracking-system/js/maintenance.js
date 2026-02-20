// ============================================================
//  MAINTENANCE PAGE – Kanban board + Add task
// ============================================================
function renderMaintenance() {
    const scheduled = DB.maintenance.filter(m => m.status === 'scheduled');
    const inProgress = DB.maintenance.filter(m => m.status === 'in-progress');
    const completed = DB.maintenance.filter(m => m.status === 'completed');

    document.getElementById('page-maintenance').innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-title">Maintenance Scheduling</div>
      <div class="page-subtitle">${DB.maintenance.length} total tasks · ${inProgress.length} in progress</div>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-secondary" onclick="renderMaintenance()">↻ Refresh</button>
      <button class="btn btn-primary" onclick="openAddMaintenanceModal()">+ Schedule Task</button>
    </div>
  </div>

  <!-- Summary chips -->
  <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1.25rem">
    ${maintSummaryChip('Scheduled', scheduled.length, 'var(--accent)')}
    ${maintSummaryChip('In Progress', inProgress.length, 'var(--warning)')}
    ${maintSummaryChip('Completed', completed.length, 'var(--success)')}
    ${maintSummaryChip('Overdue', DB.maintenance.filter(m => m.status !== 'completed' && daysUntil(m.dueDate) < 0).length, 'var(--danger)')}
  </div>

  <div class="kanban-board">
    ${kanbanCol('Scheduled', scheduled, 'var(--accent)')}
    ${kanbanCol('In Progress', inProgress, 'var(--warning)')}
    ${kanbanCol('Completed', completed, 'var(--success)')}
  </div>`;
}

function maintSummaryChip(label, count, color) {
    return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.4rem 0.85rem;display:flex;align-items:center;gap:0.4rem">
    <span style="font-size:0.9rem;font-weight:700;color:${color}">${count}</span>
    <span style="font-size:0.8rem;color:var(--text-secondary)">${label}</span>
  </div>`;
}

function kanbanCol(title, tasks, color) {
    return `
  <div class="kanban-col">
    <div class="kanban-col-header">
      <div class="kanban-col-title" style="color:${color}">${title}</div>
      <span class="kanban-count">${tasks.length}</span>
    </div>
    <div class="kanban-cards">
      ${tasks.length === 0
            ? `<div class="empty-state" style="padding:1.5rem"><div class="empty-icon" style="font-size:1.5rem">📋</div><p>No tasks</p></div>`
            : tasks.map(m => maintCard(m)).join('')}
    </div>
  </div>`;
}

function maintCard(m) {
    const ac = getAircraft(m.aircraftId);
    const days = daysUntil(m.dueDate);
    const pct = m.estimatedHours > 0 ? Math.round((m.completedHours / m.estimatedHours) * 100) : 0;
    const dueStr = days < 0 ? `<span style="color:var(--danger)">${Math.abs(days)}d overdue</span>`
        : days === 0 ? `<span style="color:var(--warning)">Due today</span>`
            : `<span style="color:var(--text-muted)">${days}d left</span>`;

    return `
  <div class="maint-card ${m.priority}" onclick="openMaintModal('${m.id}')">
    <div class="maint-card-top">
      <div class="maint-card-title">${m.type}</div>
      ${priorityBadge(m.priority)}
    </div>
    <div class="maint-aircraft">${ac ? ac.registration : m.aircraftId} · ${ac ? ac.model : ''}</div>
    ${m.status !== 'completed' ? `
      <div style="margin:0.4rem 0">
        ${progressBar(pct, getPriorityColor(m.priority))}
        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">${pct}% complete · ${m.completedHours}/${m.estimatedHours} hrs</div>
      </div>` : ''}
    <div class="maint-meta">
      <div class="maint-meta-item">🔧 ${m.technician}</div>
      <div class="maint-meta-item">🏢 ${m.hangar}</div>
      <div class="maint-meta-item">📅 ${dueStr}</div>
    </div>
    ${m.status !== 'completed' ? `
    <div style="display:flex;gap:0.4rem;margin-top:0.6rem;flex-wrap:wrap">
      ${m.status === 'scheduled' ? `<button class="btn btn-sm btn-primary" onclick="event.stopPropagation();advanceMaint('${m.id}','in-progress')">▶ Start</button>` : ''}
      ${m.status === 'in-progress' ? `<button class="btn btn-sm btn-success" onclick="event.stopPropagation();advanceMaint('${m.id}','completed')">✓ Complete</button>` : ''}
    </div>` : ''}
  </div>`;
}

function advanceMaint(id, newStatus) {
    const m = DB.maintenance.find(m => m.id === id);
    if (!m) return;
    m.status = newStatus;
    if (newStatus === 'completed') m.completedHours = m.estimatedHours;
    renderMaintenance();
    showToast(`Task moved to: ${capitalize(newStatus)}`, 'success');
}

function openMaintModal(id) {
    const m = DB.maintenance.find(m => m.id === id);
    if (!m) return;
    const ac = getAircraft(m.aircraftId);
    openModal(`
  <div class="modal-header">
    <div>
      <h3>${m.type}</h3>
      <div style="font-size:0.8rem;color:var(--text-muted)">${ac ? ac.registration : m.aircraftId} · ${m.hangar}</div>
    </div>
    <button class="modal-close" onclick="closeModal()">✕</button>
  </div>
  <div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap">
    ${statusBadge(m.status)} ${priorityBadge(m.priority)}
  </div>
  <p style="margin-bottom:1rem">${m.description}</p>
  <div class="detail-grid">
    <div class="detail-item"><div class="detail-item-label">Technician</div><div class="detail-item-value">${m.technician}</div></div>
    <div class="detail-item"><div class="detail-item-label">Hangar</div><div class="detail-item-value">${m.hangar}</div></div>
    <div class="detail-item"><div class="detail-item-label">Start Date</div><div class="detail-item-value">${formatDate(m.startDate)}</div></div>
    <div class="detail-item"><div class="detail-item-label">Due Date</div><div class="detail-item-value">${formatDate(m.dueDate)}</div></div>
    <div class="detail-item"><div class="detail-item-label">Est. Hours</div><div class="detail-item-value">${m.estimatedHours} hrs</div></div>
    <div class="detail-item"><div class="detail-item-label">Est. Cost</div><div class="detail-item-value">${formatCost(m.cost)}</div></div>
  </div>
  <div style="margin-top:0.75rem">
    <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px">Progress: ${Math.round((m.completedHours / m.estimatedHours) * 100)}%</div>
    ${progressBar(Math.round((m.completedHours / m.estimatedHours) * 100), getPriorityColor(m.priority))}
  </div>
  <div style="display:flex;gap:0.5rem;margin-top:1.25rem;justify-content:flex-end">
    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    ${m.status === 'scheduled' ? `<button class="btn btn-primary" onclick="advanceMaint('${m.id}','in-progress');closeModal()">Start Task</button>` : ''}
    ${m.status === 'in-progress' ? `<button class="btn btn-success" onclick="advanceMaint('${m.id}','completed');closeModal()">Complete Task</button>` : ''}
  </div>`);
}

function openAddMaintenanceModal() {
    openModal(`
  <div class="modal-header">
    <h3>Schedule Maintenance Task</h3>
    <button class="modal-close" onclick="closeModal()">✕</button>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
    <div class="form-group" style="grid-column:1/-1"><label class="form-label">Task Type / Name</label><input class="form-input" id="mt-type" placeholder="e.g. A-Check, Engine Borescope"></div>
    <div class="form-group" style="grid-column:1/-1"><label class="form-label">Description</label><textarea class="form-textarea" id="mt-desc" placeholder="Describe the maintenance activity"></textarea></div>
    <div class="form-group"><label class="form-label">Aircraft</label>
      <select class="form-select" id="mt-aircraft">
        ${DB.aircraft.map(a => `<option value="${a.id}">${a.registration} – ${a.model}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label class="form-label">Priority</label>
      <select class="form-select" id="mt-priority"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
    </div>
    <div class="form-group"><label class="form-label">Technician</label>
      <select class="form-select" id="mt-tech">${DB.technicians.map(t => `<option>${t}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label class="form-label">Hangar</label>
      <select class="form-select" id="mt-hangar">${DB.hangars.map(h => `<option>${h}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label class="form-label">Start Date</label><input class="form-input" id="mt-start" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
    <div class="form-group"><label class="form-label">Due Date</label><input class="form-input" id="mt-due" type="date"></div>
    <div class="form-group"><label class="form-label">Est. Hours</label><input class="form-input" id="mt-hours" type="number" placeholder="24" min="1"></div>
    <div class="form-group"><label class="form-label">Est. Cost ($)</label><input class="form-input" id="mt-cost" type="number" placeholder="10000" min="0"></div>
  </div>
  <div style="display:flex;gap:0.5rem;margin-top:1.25rem;justify-content:flex-end">
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveMaintTask()">Schedule Task</button>
  </div>`);
}

function saveMaintTask() {
    const type = $id('mt-type').value.trim();
    const due = $id('mt-due').value;
    if (!type || !due) { showToast('Task name and due date are required.', 'error'); return; }
    DB.maintenance.push({
        id: 'M' + String(DB.maintenance.length + 1).padStart(3, '0'),
        aircraftId: $id('mt-aircraft').value,
        type,
        description: $id('mt-desc').value.trim() || type,
        status: 'scheduled',
        priority: $id('mt-priority').value,
        technician: $id('mt-tech').value,
        hangar: $id('mt-hangar').value,
        startDate: $id('mt-start').value,
        dueDate: due,
        estimatedHours: parseInt($id('mt-hours').value) || 8,
        completedHours: 0,
        cost: parseInt($id('mt-cost').value) || 0,
    });
    closeModal();
    renderMaintenance();
    showToast('Maintenance task scheduled!', 'success');
}
