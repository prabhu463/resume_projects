// ============================================================
//  UTILS – Shared helpers
//  All pages depend on this file; load order: data → utils → pages → app
// ============================================================

// ── Status / Priority Badges ────────────────────────────────
function statusBadge(status) {
    const map = {
        active: { label: 'Active', cls: 'badge-success' },
        grounded: { label: 'Grounded', cls: 'badge-danger' },
        maintenance: { label: 'Maintenance', cls: 'badge-warning' },
        'en-route': { label: 'En Route', cls: 'badge-info' },
        scheduled: { label: 'Scheduled', cls: 'badge-primary' },
        'in-progress': { label: 'In Progress', cls: 'badge-warning' },
        completed: { label: 'Completed', cls: 'badge-success' },
    };
    const s = map[status] || { label: status, cls: 'badge-primary' };
    return `<span class="badge ${s.cls}">${s.label}</span>`;
}

function priorityBadge(p) {
    const cls = { critical: 'badge-danger', high: 'badge-orange', medium: 'badge-warning', low: 'badge-success' };
    return `<span class="badge ${cls[p] || 'badge-primary'}">${capitalize(p)}</span>`;
}

// ── String helpers ──────────────────────────────────────────
function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCost(n) {
    return '$' + Number(n || 0).toLocaleString();
}

// ── Color helpers ───────────────────────────────────────────
function getStatusColor(status) {
    return { active: '#22c55e', grounded: '#ef4444', maintenance: '#f59e0b', 'en-route': '#00d4ff' }[status] || '#6b7280';
}

function getPriorityColor(p) {
    return { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e' }[p] || '#6b7280';
}

// ── DOM helpers ─────────────────────────────────────────────
function $id(id) { return document.getElementById(id); }
function $qs(sel, ctx) { return (ctx || document).querySelector(sel); }
function $qsa(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }

// ── Escape HTML ─────────────────────────────────────────────
function escapeHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
}

// ── Progress bar ────────────────────────────────────────────
function progressBar(pct, color) {
    const safePct = Math.max(0, Math.min(100, pct || 0));
    return `<div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${safePct}%;background:${color || '#00d4ff'}"></div></div>`;
}

// ── KPI Cards ───────────────────────────────────────────────
/**
 * Large KPI card — used on Dashboard (4-column row).
 * @param {string} icon       Emoji character
 * @param {string} label      Short uppercase label
 * @param {string|number} value   Primary numeric value
 * @param {string} subtext    Secondary line below value
 * @param {string} accent     CSS color for top border and hover
 * @param {string} iconBg     Background CSS for icon box
 * @param {string} iconColor  Color CSS for icon box
 */
function kpiCard(icon, label, value, subtext, accent, iconBg, iconColor) {
    return `<div class="kpi-card" style="--kpi-color:${accent}">
    <div class="kpi-info">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-change">${subtext}</div>
    </div>
    <div class="kpi-icon" style="background:${iconBg};color:${iconColor}">${icon}</div>
  </div>`;
}

/**
 * Compact KPI card — used on Inventory, Reports, Logs pages.
 * @param {string} icon       Emoji character
 * @param {string} label      Short label
 * @param {string|number} value   Value to display
 * @param {string} accent     CSS color for top border
 */
function invKpi(icon, label, value, accent) {
    return `<div class="kpi-card" style="--kpi-color:${accent}">
    <div class="kpi-info">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value" style="font-size:1.5rem">${value}</div>
    </div>
    <div class="kpi-icon" style="background:rgba(255,255,255,0.05);font-size:1.3rem">${icon}</div>
  </div>`;
}

// ── Toast ───────────────────────────────────────────────────
function showToast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

// ── Modal ───────────────────────────────────────────────────
function openModal(html) {
    let overlay = $id('modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.innerHTML = `<div class="modal-box" id="modal-box"></div>`;
        overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
        document.body.appendChild(overlay);
    }
    $id('modal-box').innerHTML = html;
    overlay.classList.add('active');
    // Close on Escape
    const onEsc = e => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onEsc); } };
    document.addEventListener('keydown', onEsc);
}

function closeModal() {
    const overlay = $id('modal-overlay');
    if (overlay) overlay.classList.remove('active');
}
