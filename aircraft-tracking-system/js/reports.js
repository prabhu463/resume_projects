// ============================================================
//  REPORTS & ANALYTICS PAGE – Chart.js
//  NOTE: Chart.defaults are set inside renderReports() — not at
//  module level — so Chart.js is guaranteed to be loaded first.
// ============================================================

let reportCharts = {};

function destroyReportCharts() {
  Object.values(reportCharts).forEach(c => { try { c.destroy(); } catch (_) { } });
  reportCharts = {};
}

function renderReports() {
  destroyReportCharts();

  // Set chart defaults here (after Chart.js has loaded)
  if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
    Chart.defaults.font.family = 'Inter, sans-serif';
  }

  $id('page-reports').innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-title">Reports &amp; Analytics</div>
      <div class="page-subtitle">Fleet performance, maintenance costs and operational insights</div>
    </div>
    <div class="page-header-actions">
      <select class="filter-select" id="report-period" onchange="renderReports()">
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
        <option value="365" selected>Last Year</option>
      </select>
    </div>
  </div>

  <!-- Summary KPIs -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--gap);margin-bottom:var(--gap)">
    ${invKpi('✈', 'Active Aircraft', DB.aircraft.filter(a => a.status === 'active').length, 'var(--accent)')}
    ${invKpi('🔧', 'Total Maintenance', DB.maintenance.length, 'var(--warning)')}
    ${invKpi('💰', 'Total Maint. Cost', formatCost(DB.maintenance.reduce((s, m) => s + m.cost, 0)), 'var(--accent2)')}
    ${invKpi('⏱', 'Total Est. Hours', DB.maintenance.reduce((s, m) => s + m.estimatedHours, 0).toLocaleString(), 'var(--success)')}
  </div>

  <div class="charts-grid">
    <div class="chart-card">
      <div class="chart-card-header">
        <h3>✈ Fleet Utilization (Flight Hours)</h3>
        <span class="badge badge-primary">Bar</span>
      </div>
      <canvas id="chart-utilization"></canvas>
    </div>

    <div class="chart-card">
      <div class="chart-card-header">
        <h3>🔧 Maintenance Types</h3>
        <span class="badge badge-primary">Doughnut</span>
      </div>
      <canvas id="chart-maint-types"></canvas>
    </div>

    <div class="chart-card">
      <div class="chart-card-header">
        <h3>💰 Maintenance Cost Trend</h3>
        <span class="badge badge-primary">Line</span>
      </div>
      <canvas id="chart-cost-trend"></canvas>
    </div>

    <div class="chart-card">
      <div class="chart-card-header">
        <h3>🚦 Aircraft Status Distribution</h3>
        <span class="badge badge-primary">Pie</span>
      </div>
      <canvas id="chart-status"></canvas>
    </div>
  </div>`;

  // Build charts after HTML is in DOM
  requestAnimationFrame(() => {
    buildUtilizationChart();
    buildMaintTypesChart();
    buildCostTrendChart();
    buildStatusChart();
  });
}

// ── Shared chart options factory ────────────────────────────
function chartOpts(extra) {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        backgroundColor: '#111827',
        borderColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
      },
    },
    ...extra,
  };
}

// ── Individual charts ───────────────────────────────────────
function buildUtilizationChart() {
  const ctx = $id('chart-utilization')?.getContext('2d');
  if (!ctx) return;
  reportCharts.util = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: DB.aircraft.map(a => a.registration),
      datasets: [{
        label: 'Flight Hours',
        data: DB.aircraft.map(a => a.flightHours),
        backgroundColor: DB.aircraft.map(a => getStatusColor(a.status) + '55'),
        borderColor: DB.aircraft.map(a => getStatusColor(a.status)),
        borderWidth: 1.5,
        borderRadius: 4,
      }],
    },
    options: chartOpts({
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      },
    }),
  });
}

function buildMaintTypesChart() {
  const ctx = $id('chart-maint-types')?.getContext('2d');
  if (!ctx) return;
  const counts = {};
  DB.maintenance.forEach(m => { counts[m.type] = (counts[m.type] || 0) + 1; });
  const palette = ['#00d4ff', '#6366f1', '#f59e0b', '#ef4444', '#22c55e', '#f97316', '#a855f7', '#14b8a6'];
  reportCharts.types = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: palette.map(c => c + 'bb'),
        borderColor: palette,
        borderWidth: 2,
      }],
    },
    options: chartOpts({ cutout: '62%' }),
  });
}

function buildCostTrendChart() {
  const ctx = $id('chart-cost-trend')?.getContext('2d');
  if (!ctx) return;
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const costs = [45000, 62000, 38000, 91000, 55000, 127000];
  reportCharts.cost = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Maintenance Cost',
        data: costs,
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0,212,255,0.07)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00d4ff',
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
    },
    options: chartOpts({
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: {
          ticks: { color: '#94a3b8', callback: v => '$' + (v / 1000).toFixed(0) + 'k' },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
      },
    }),
  });
}

function buildStatusChart() {
  const ctx = $id('chart-status')?.getContext('2d');
  if (!ctx) return;
  const active = DB.aircraft.filter(a => a.status === 'active').length;
  const maint = DB.aircraft.filter(a => a.status === 'maintenance').length;
  const ground = DB.aircraft.filter(a => a.status === 'grounded').length;
  reportCharts.status = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Active', 'In Maintenance', 'Grounded'],
      datasets: [{
        data: [active, maint, ground],
        backgroundColor: ['rgba(34,197,94,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)'],
        borderColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 2,
      }],
    },
    options: chartOpts({}),
  });
}
