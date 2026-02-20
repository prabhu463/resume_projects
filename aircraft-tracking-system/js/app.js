// ============================================================
//  APP – SPA Router & Initialization
// ============================================================

const PAGES = {
    dashboard: { label: 'Dashboard', icon: '⊞', render: renderDashboard, activeGroup: 'overview' },
    fleet: { label: 'Fleet', icon: '✈', render: renderFleet, activeGroup: 'ops' },
    tracking: { label: 'Live Tracking', icon: '🌍', render: renderTracking, activeGroup: 'ops' },
    maintenance: { label: 'Maintenance', icon: '🔧', render: renderMaintenance, activeGroup: 'maint' },
    logs: { label: 'Logs', icon: '📋', render: renderLogs, activeGroup: 'maint' },
    inventory: { label: 'Inventory', icon: '📦', render: renderInventory, activeGroup: 'parts' },
    reports: { label: 'Reports', icon: '📊', render: renderReports, activeGroup: 'insights' },
};

const router = {
    current: null,
    navigate(page) {
        if (!PAGES[page]) return;
        const prev = router.current;

        // Clean up leaving-page resources
        if (prev === 'tracking' && page !== 'tracking') {
            if (typeof cleanupTracking === 'function') cleanupTracking();
        }
        if (prev === 'dashboard' && page !== 'dashboard') {
            if (typeof cleanupDashboard === 'function') cleanupDashboard();
        }
        if (prev === 'reports' && page !== 'reports') {
            destroyReportCharts();
        }

        // Stop OpenSky if neither dashboard nor tracking is active
        if (page !== 'tracking' && page !== 'dashboard') {
            OpenSky.stop();
        }

        // Hide all pages, show target
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const pageEl = document.getElementById('page-' + page);
        if (pageEl) pageEl.classList.add('active');

        // Update sidebar active state
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (navEl) navEl.classList.add('active');

        // Update topbar title
        const titleEl = document.getElementById('topbar-title');
        if (titleEl) titleEl.textContent = PAGES[page].label;

        router.current = page;
        PAGES[page].render();
        window.location.hash = page;
    },
};

// ── Notifications ──────────────────────────────────────────
function updateNotifBadge() {
    const count = getUnreadAlerts().length;
    const badge = document.getElementById('notif-badge');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}

function toggleNotifPanel() {
    document.getElementById('notif-panel')?.classList.toggle('open');
}

function markAllRead() {
    DB.alerts.forEach(a => a.read = true);
    renderNotifPanel();
    updateNotifBadge();
}

function renderNotifPanel() {
    const panel = document.getElementById('notif-list');
    if (!panel) return;
    panel.innerHTML = DB.alerts.map(a => `
    <div class="notif-item ${a.read ? '' : 'unread'}" onclick="markNotifRead('${a.id}')">
      <div class="notif-icon">${a.icon}</div>
      <div class="notif-body">
        <h4>${a.title}</h4>
        <p>${a.message}</p>
        <small>${a.time}</small>
      </div>
    </div>`).join('');
}

function markNotifRead(id) {
    const a = DB.alerts.find(x => x.id === id);
    if (a) a.read = true;
    renderNotifPanel();
    updateNotifBadge();
}

// ── Sidebar toggle ─────────────────────────────────────────
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('collapsed');
    const lbl = document.getElementById('toggle-label');
    if (lbl) lbl.textContent = sb.classList.contains('collapsed') ? '☰ Expand' : '← Collapse';
}

// ── Global search ─────────────────────────────────────────
function handleGlobalSearch(e) {
    // Capture the raw value BEFORE any async navigation
    const raw = e.target.value.trim();
    const q = raw.toLowerCase();
    if (!q) return;

    // Clear the search bar
    e.target.value = '';

    const ac = DB.aircraft.find(a =>
        a.registration.toLowerCase().includes(q) || a.model.toLowerCase().includes(q)
    );
    if (ac) {
        router.navigate('fleet');
        requestAnimationFrame(() => {
            const inp = $id('fleet-search');
            if (inp) { inp.value = raw; applyFleetFilter(); }
        });
        return;
    }

    const m = DB.maintenance.find(m => m.type.toLowerCase().includes(q));
    if (m) { router.navigate('maintenance'); return; }

    const p = DB.parts.find(p =>
        p.name.toLowerCase().includes(q) || p.partNo.toLowerCase().includes(q)
    );
    if (p) {
        router.navigate('inventory');
        requestAnimationFrame(() => {
            const inp = $id('inv-search');
            if (inp) { inp.value = raw; applyInvFilter(); }
        });
        return;
    }

    showToast(`No results for "${raw}"`, 'info');
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    renderNotifPanel();
    updateNotifBadge();

    // Global search
    const gs = document.getElementById('global-search');
    if (gs) gs.addEventListener('keydown', e => { if (e.key === 'Enter') handleGlobalSearch(e); });

    // Route on load via hash or default
    const hash = window.location.hash.replace('#', '');
    router.navigate(PAGES[hash] ? hash : 'dashboard');
});
