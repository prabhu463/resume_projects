// ============================================================
//  PARTS INVENTORY PAGE
// ============================================================
function renderInventory() {
  const total = DB.parts.length;
  const lowStock = DB.parts.filter(isLowStock);
  const categories = [...new Set(DB.parts.map(p => p.category))];
  const totalValue = DB.parts.reduce((s, p) => s + p.quantity * p.unitCost, 0);

  document.getElementById('page-inventory').innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-title">Parts Inventory</div>
      <div class="page-subtitle">${total} part types tracked · Total value ${formatCost(totalValue)}</div>
    </div>
    <div class="page-header-actions">
      <button class="btn btn-secondary" onclick="exportPartsCSV()">↓ Export CSV</button>
      <button class="btn btn-primary" onclick="openAddPartModal()">+ Add Part</button>
    </div>
  </div>

  ${lowStock.length > 0 ? `
  <div class="low-stock-warn">
    ⚠ ${lowStock.length} part(s) are below reorder level and need attention
  </div>` : ''}

  <div class="inv-grid">
    ${invKpi('📦', 'Total Parts', total, 'var(--accent)')}
    ${invKpi('⚠', 'Low Stock', lowStock.length, lowStock.length > 0 ? 'var(--danger)' : 'var(--success)')}
    ${invKpi('🏷', 'Categories', categories.length, 'var(--accent2)')}
    ${invKpi('💰', 'Total Value', formatCost(totalValue), 'var(--warning)')}
  </div>

  <div class="filter-bar">
    <div class="search-input-wrap">
      <span>🔍</span>
      <input type="text" placeholder="Search part number, name…" id="inv-search" oninput="applyInvFilter()">
    </div>
    <select class="filter-select" id="inv-cat" onchange="applyInvFilter()">
      <option value="all">All Categories</option>
      ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
    </select>
    <select class="filter-select" id="inv-stock" onchange="applyInvFilter()">
      <option value="all">All Stock Levels</option>
      <option value="low">Low Stock Only</option>
      <option value="ok">Adequate Stock</option>
    </select>
  </div>

  <div class="table-wrap">
    <table class="data-table" id="inv-table">
      <thead><tr>
        <th>Part No.</th><th>Name</th><th>Category</th>
        <th>Qty</th><th>Reorder Level</th><th>Unit Cost</th>
        <th>Total Value</th><th>Supplier</th><th>Lead Time</th><th>Actions</th>
      </tr></thead>
      <tbody id="inv-tbody"></tbody>
    </table>
  </div>`;

  renderInvRows(DB.parts);
}

// invKpi is defined in utils.js — available globally

function applyInvFilter() {
  const search = $id('inv-search')?.value.toLowerCase() || '';
  const cat = $id('inv-cat')?.value || 'all';
  const stock = $id('inv-stock')?.value || 'all';
  const filtered = DB.parts.filter(p => {
    const matchSearch = !search || p.partNo.toLowerCase().includes(search) || p.name.toLowerCase().includes(search);
    const matchCat = cat === 'all' || p.category === cat;
    const matchStock = stock === 'all' || (stock === 'low' && isLowStock(p)) || (stock === 'ok' && !isLowStock(p));
    return matchSearch && matchCat && matchStock;
  });
  renderInvRows(filtered);
}

function renderInvRows(list) {
  const tbody = $id('inv-tbody');
  if (!tbody) return;
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:2rem">No parts found.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(p => {
    const low = isLowStock(p);
    return `<tr>
      <td><span class="font-mono">${p.partNo}</span></td>
      <td>${p.name} ${low ? '<span class="badge badge-danger" style="font-size:0.6rem">LOW</span>' : ''}</td>
      <td><span class="chip">${p.category}</span></td>
      <td style="font-weight:600;color:${low ? 'var(--danger)' : 'var(--text-primary)'}">${p.quantity}</td>
      <td style="color:var(--text-muted)">${p.reorderLevel}</td>
      <td>${formatCost(p.unitCost)}</td>
      <td style="font-weight:500">${formatCost(p.quantity * p.unitCost)}</td>
      <td style="font-size:0.8rem">${p.supplier}</td>
      <td style="font-size:0.8rem">${p.leadDays}d</td>
      <td>
        <div style="display:flex;gap:4px">
          ${low ? `<button class="btn btn-sm btn-danger" onclick="reorderPart('${p.id}')">Reorder</button>` : ''}
          <button class="btn btn-sm btn-ghost" onclick="adjustStock('${p.id}', 1)">+</button>
          <button class="btn btn-sm btn-ghost" onclick="adjustStock('${p.id}', -1)">−</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function reorderPart(id) {
  const p = DB.parts.find(x => x.id === id);
  if (!p) return;
  p.quantity += p.reorderLevel * 2;
  renderInventory();
  showToast(`Reorder placed for ${p.name}`, 'success');
}

function adjustStock(id, delta) {
  const p = DB.parts.find(x => x.id === id);
  if (!p || p.quantity + delta < 0) return;
  p.quantity += delta;
  renderInventory();
}

function exportPartsCSV() {
  const header = 'Part No,Name,Category,Quantity,Reorder Level,Unit Cost,Supplier,Lead Days';
  const rows = DB.parts.map(p => `${p.partNo},"${p.name}",${p.category},${p.quantity},${p.reorderLevel},${p.unitCost},"${p.supplier}",${p.leadDays}`);
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'parts-inventory.csv'; a.click();
  showToast('CSV exported!', 'success');
}

function openAddPartModal() {
  openModal(`
  <div class="modal-header">
    <h3>Add New Part</h3>
    <button class="modal-close" onclick="closeModal()">✕</button>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
    <div class="form-group"><label class="form-label">Part Number</label><input class="form-input" id="np-num" placeholder="e.g. ENG-FAN-001"></div>
    <div class="form-group"><label class="form-label">Category</label>
      <select class="form-select" id="np-cat">
        <option>Engine</option><option>Hydraulics</option><option>Landing Gear</option><option>Avionics</option><option>APU</option><option>Cabin Safety</option><option>Other</option>
      </select>
    </div>
    <div class="form-group" style="grid-column:1/-1"><label class="form-label">Part Name</label><input class="form-input" id="np-name" placeholder="Descriptive name"></div>
    <div class="form-group"><label class="form-label">Quantity</label><input class="form-input" id="np-qty" type="number" placeholder="0" min="0"></div>
    <div class="form-group"><label class="form-label">Reorder Level</label><input class="form-input" id="np-reorder" type="number" placeholder="2" min="0"></div>
    <div class="form-group"><label class="form-label">Unit Cost ($)</label><input class="form-input" id="np-cost" type="number" placeholder="1000" min="0"></div>
    <div class="form-group"><label class="form-label">Lead Time (days)</label><input class="form-input" id="np-lead" type="number" placeholder="14" min="1"></div>
    <div class="form-group" style="grid-column:1/-1"><label class="form-label">Supplier</label><input class="form-input" id="np-supplier" placeholder="Supplier name"></div>
  </div>
  <div style="display:flex;gap:0.5rem;margin-top:1.25rem;justify-content:flex-end">
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveNewPart()">Add Part</button>
  </div>`);
}

function saveNewPart() {
  const num = $id('np-num').value.trim().toUpperCase();
  const name = $id('np-name').value.trim();
  if (!num || !name) { showToast('Part number and name are required.', 'error'); return; }
  DB.parts.push({
    id: 'P' + String(DB.parts.length + 1).padStart(3, '0'),
    partNo: num, name,
    category: $id('np-cat').value,
    quantity: parseInt($id('np-qty').value) || 0,
    reorderLevel: parseInt($id('np-reorder').value) || 1,
    unitCost: parseFloat($id('np-cost').value) || 0,
    supplier: $id('np-supplier').value.trim() || 'Unknown',
    leadDays: parseInt($id('np-lead').value) || 14,
  });
  closeModal();
  renderInventory();
  showToast(`Part ${num} added!`, 'success');
}
