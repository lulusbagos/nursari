/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - SEEDLING INVENTORY CRUD
 * Handles inventory, search, multi-filters, detail drawers, CSV downloads, and CSV uploads.
 */

(function () {
  const Inventory = {
    searchQuery: "",
    statusFilter: "all",
    typeFilter: "all",
    areaFilter: "all",
    sortBy: "dateReceived",
    sortOrder: "desc",
    currentPage: 1,
    itemsPerPage: 10,

    init: function () {
      this.renderLayout();
      this.populateFilterDropdowns();
      this.loadInventoryData();
    },

    renderLayout: function () {
      const container = document.getElementById("view-inventory");
      if (!container) return;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-wrap">
            <h1>Seedling Inventory</h1>
            <p>Track botanical batches, growth ages, and plot assignments</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-outline" id="btn-inv-import" title="Upload CSV Data Sheet">
              <i class="fa-solid fa-file-import"></i> Import CSV
            </button>
            <input type="file" id="inv-import-file-input" style="display: none;" accept=".csv">
            
            <button class="btn btn-outline" id="btn-inv-export" title="Download Excel CSV Sheet">
              <i class="fa-solid fa-file-export"></i> Export CSV
            </button>
            
            <button class="btn btn-primary" id="btn-inv-create-new">
              <i class="fa-solid fa-plus"></i> Log New Batch
            </button>
          </div>
        </div>

        <!-- FILTERS TOOLBAR -->
        <div class="table-toolbar">
          <div class="toolbar-left">
            <div class="table-search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="inv-search-input" placeholder="Search batch, scientific name...">
            </div>
            
            <!-- Status Filter -->
            <select id="filter-inv-status" class="select-filter">
              <option value="all">All Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Ready To Plant">Ready To Plant</option>
              <option value="Dead">Dead</option>
            </select>

            <!-- Species Filter -->
            <select id="filter-inv-type" class="select-filter">
              <option value="all">All Species</option>
              <!-- Populated dynamically -->
            </select>

            <!-- Plot Area Filter -->
            <select id="filter-inv-area" class="select-filter">
              <option value="all">All Nursery Plots</option>
              <!-- Populated dynamically -->
            </select>
          </div>
          <div class="toolbar-right">
            <span id="inv-record-count-badge" style="font-size:12px; color:var(--text-light); font-weight:600;">0 batches active</span>
          </div>
        </div>

        <!-- INVENTORY TABLE -->
        <div class="table-wrapper">
          <table class="custom-table" id="inventory-table-list">
            <!-- Populated dynamically -->
          </table>
        </div>

        <!-- PAGINATION -->
        <div class="pagination-wrap" id="inventory-pagination">
          <!-- Populated dynamically -->
        </div>
      `;

      // Bind actions
      const self = this;
      
      // Add record click
      document.getElementById("btn-inv-create-new").addEventListener("click", () => self.openCreateModal());

      // Search & Filters inputs
      const search = document.getElementById("inv-search-input");
      if (search) {
        search.addEventListener("input", function (e) {
          self.searchQuery = e.target.value;
          self.currentPage = 1;
          self.loadInventoryData();
        });
      }

      document.getElementById("filter-inv-status").addEventListener("change", function () {
        self.statusFilter = this.value;
        self.currentPage = 1;
        self.loadInventoryData();
      });

      document.getElementById("filter-inv-type").addEventListener("change", function () {
        self.typeFilter = this.value;
        self.currentPage = 1;
        self.loadInventoryData();
      });

      document.getElementById("filter-inv-area").addEventListener("change", function () {
        self.areaFilter = this.value;
        self.currentPage = 1;
        self.loadInventoryData();
      });

      // Export CSV
      document.getElementById("btn-inv-export").addEventListener("click", () => self.exportToCSV());

      // Import CSV Trigger
      const importBtn = document.getElementById("btn-inv-import");
      const importInput = document.getElementById("inv-import-file-input");
      if (importBtn && importInput) {
        importBtn.addEventListener("click", () => importInput.click());
        importInput.addEventListener("change", function (e) {
          if (e.target.files.length > 0) {
            self.importFromCSV(e.target.files[0]);
          }
        });
      }
    },

    populateFilterDropdowns: function () {
      const types = window.NurseryStorage.getAll("seedling_types");
      const areas = window.NurseryStorage.getAll("nursery_areas");

      const typeSelect = document.getElementById("filter-inv-type");
      const areaSelect = document.getElementById("filter-inv-area");

      if (typeSelect) {
        typeSelect.innerHTML = `<option value="all">All Species</option>` + 
          types.map(t => `<option value="${t.id}">${t.name} (${t.code})</option>`).join("");
      }

      if (areaSelect) {
        areaSelect.innerHTML = `<option value="all">All Nursery Plots</option>` + 
          areas.map(a => `<option value="${a.id}">${a.code} - ${a.name}</option>`).join("");
      }
    },

    loadInventoryData: function () {
      const inventory = window.NurseryStorage.getAll("inventory");
      const types = window.NurseryStorage.getAll("seedling_types");
      const suppliers = window.NurseryStorage.getAll("suppliers");
      const areas = window.NurseryStorage.getAll("nursery_areas");

      // Filter
      let filtered = inventory.filter(item => {
        const type = types.find(t => t.id === item.seedlingTypeId) || {};
        const supplier = suppliers.find(s => s.id === item.supplierId) || {};
        const area = areas.find(a => a.id === item.nurseryAreaId) || {};
        
        const q = this.searchQuery.toLowerCase();
        const matchesSearch = item.batchNumber.toLowerCase().includes(q) || 
                              type.name?.toLowerCase().includes(q) || 
                              type.scientificName?.toLowerCase().includes(q) ||
                              supplier.name?.toLowerCase().includes(q);

        const matchesStatus = this.statusFilter === "all" || item.status === this.statusFilter;
        const matchesType = this.typeFilter === "all" || item.seedlingTypeId === this.typeFilter;
        const matchesArea = this.areaFilter === "all" || item.nurseryAreaId === this.areaFilter;

        return matchesSearch && matchesStatus && matchesType && matchesArea;
      });

      // Sort
      filtered.sort((a, b) => {
        let valA = a[this.sortBy];
        let valB = b[this.sortBy];

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return this.sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return this.sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      const totalItems = filtered.length;
      document.getElementById("inv-record-count-badge").textContent = `${totalItems} batches tracked`;

      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const paginated = filtered.slice(startIndex, startIndex + this.itemsPerPage);

      this.renderTable(paginated, types, suppliers, areas);
      this.renderPagination(totalItems);
    },

    renderTable: function (data, types, suppliers, areas) {
      const table = document.getElementById("inventory-table-list");
      if (!table) return;

      const canWrite = window.NurseryAuth.hasPermission("inventory", "write");
      const canDelete = window.NurseryAuth.hasPermission("inventory", "delete");

      const getSortClass = (field) => {
        if (this.sortBy === field) {
          return this.sortOrder === "asc" ? "sort-asc" : "sort-desc";
        }
        return "";
      };

      const headers = `
        <thead>
          <tr>
            <th class="${getSortClass('batchNumber')}" onclick="window.NurseryApp.views.inventory.changeSort('batchNumber')">Batch Number</th>
            <th class="${getSortClass('seedlingTypeId')}" onclick="window.NurseryApp.views.inventory.changeSort('seedlingTypeId')">Species Name</th>
            <th class="${getSortClass('dateReceived')}" onclick="window.NurseryApp.views.inventory.changeSort('dateReceived')">Date Received</th>
            <th class="${getSortClass('quantity')}" onclick="window.NurseryApp.views.inventory.changeSort('quantity')">Received Qty</th>
            <th class="${getSortClass('currentQuantity')}" onclick="window.NurseryApp.views.inventory.changeSort('currentQuantity')">Balance Qty</th>
            <th class="${getSortClass('age')}" onclick="window.NurseryApp.views.inventory.changeSort('age')">Age (Wks)</th>
            <th class="${getSortClass('height')}" onclick="window.NurseryApp.views.inventory.changeSort('height')">Height (cm)</th>
            <th class="${getSortClass('nurseryAreaId')}" onclick="window.NurseryApp.views.inventory.changeSort('nurseryAreaId')">Plot Location</th>
            <th class="${getSortClass('status')}" onclick="window.NurseryApp.views.inventory.changeSort('status')">Health Status</th>
            <th style="text-align: right; width: 150px;">Actions</th>
          </tr>
        </thead>
      `;

      const rows = data.map(item => {
        const type = types.find(t => t.id === item.seedlingTypeId) || { name: "Unknown" };
        const area = areas.find(a => a.id === item.nurseryAreaId) || { code: "N/A" };
        const statusClass = item.status.toLowerCase().replace(/ /g, "");

        return `
          <tr>
            <td><a href="#" style="color:var(--primary-green); font-weight:700;" onclick="window.NurseryApp.views.inventory.openDetailModal('${item.id}'); event.preventDefault();">${item.batchNumber}</a></td>
            <td>
              <div style="font-weight:600;">${type.name}</div>
              <div style="font-size:11px; color:var(--text-light); font-style:italic;">${type.scientificName || ''}</div>
            </td>
            <td>${item.dateReceived}</td>
            <td>${item.quantity.toLocaleString()}</td>
            <td style="font-weight:600;">${item.currentQuantity.toLocaleString()}</td>
            <td>${item.age} wks</td>
            <td>${item.height} cm</td>
            <td><span class="status-badge planned" style="font-family:monospace;">${area.code}</span></td>
            <td><span class="status-badge ${statusClass}">${item.status}</span></td>
            <td style="text-align: right;">
              <button class="btn btn-outline" style="padding: 5px 8px; font-size:11px;" title="View History Log" onclick="window.NurseryApp.views.inventory.openDetailModal('${item.id}')"><i class="fa-solid fa-magnifying-glass"></i></button>
              <button class="btn btn-outline" style="padding: 5px 8px; font-size:11px;" title="Edit Batch" onclick="window.NurseryApp.views.inventory.openEditModal('${item.id}')" ${!canWrite ? 'disabled' : ''}><i class="fa-solid fa-edit"></i></button>
              <button class="btn btn-outline" style="padding: 5px 8px; font-size:11px; color:var(--critical-red);" title="Delete Batch" onclick="window.NurseryApp.views.inventory.handleDelete('${item.id}')" ${!canDelete ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `;
      }).join("");

      table.innerHTML = headers + `<tbody>` + (rows || `<tr><td colspan="10" style="text-align:center; padding: 25px; color:var(--text-muted);">No batches found in the ledger matrix.</td></tr>`) + `</tbody>`;
    },

    changeSort: function (field) {
      if (this.sortBy === field) {
        this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
      } else {
        this.sortBy = field;
        this.sortOrder = "asc";
      }
      this.loadInventoryData();
    },

    renderPagination: function (totalItems) {
      const container = document.getElementById("inventory-pagination");
      if (!container) return;

      const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
      
      let html = `<div>Showing ${Math.min(totalItems, (this.currentPage - 1) * this.itemsPerPage + 1)} to ${Math.min(totalItems, this.currentPage * this.itemsPerPage)} of ${totalItems} entries</div>`;
      
      html += `<div class="pagination-controls">`;
      html += `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="window.NurseryApp.views.inventory.goToPage(${this.currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
      
      for (let p = 1; p <= totalPages; p++) {
        html += `<button class="page-btn ${this.currentPage === p ? 'active' : ''}" onclick="window.NurseryApp.views.inventory.goToPage(${p})">${p}</button>`;
      }
      
      html += `<button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="window.NurseryApp.views.inventory.goToPage(${this.currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
      html += `</div>`;

      container.innerHTML = html;
    },

    goToPage: function (page) {
      this.currentPage = page;
      this.loadInventoryData();
    },

    openCreateModal: function () {
      const self = this;
      const types = window.NurseryStorage.getAll("seedling_types");
      const suppliers = window.NurseryStorage.getAll("suppliers");
      const areas = window.NurseryStorage.getAll("nursery_areas");

      const today = new Date().toISOString().split('T')[0];
      const autoBatch = `BCH-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

      const formHTML = `
        <form id="inventory-item-form" class="form-grid">
          <div class="form-group">
            <label>Batch Number</label>
            <input type="text" id="inv-batch" class="form-input" value="${autoBatch}" required>
          </div>
          <div class="form-group">
            <label>Seedling Species</label>
            <select id="inv-type" class="form-input" required>
              ${types.map(t => `<option value="${t.id}">${t.name} (${t.code})</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Supplier Source</label>
            <select id="inv-supplier" class="form-input" required>
              ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Nursery Plot Area</label>
            <select id="inv-area" class="form-input" required>
              ${areas.map(a => `<option value="${a.id}">${a.code} - Capacity ${a.capacity.toLocaleString()}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Received Date</label>
            <input type="date" id="inv-date" class="form-input" value="${today}" required>
          </div>
          <div class="form-group">
            <label>Initial Quantity</label>
            <input type="number" id="inv-qty" class="form-input" min="1" value="1000" required>
          </div>
          <div class="form-group">
            <label>Age at Receipt (Weeks)</label>
            <input type="number" id="inv-age" class="form-input" min="0" value="2" required>
          </div>
          <div class="form-group">
            <label>Height at Receipt (cm)</label>
            <input type="number" id="inv-height" class="form-input" min="1" value="8" required>
          </div>
          <div class="form-group">
            <label>Health Bio-Status</label>
            <select id="inv-status" class="form-input">
              <option value="Healthy">Healthy</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Ready To Plant">Ready To Plant</option>
              <option value="Dead">Dead</option>
            </select>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Receipt New Seedling Batch", formHTML, function () {
        const form = document.getElementById("inventory-item-form");
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const batchNum = document.getElementById("inv-batch").value.toUpperCase();
        const qty = parseInt(document.getElementById("inv-qty").value);

        // Check duplicates
        const invs = window.NurseryStorage.getAll("inventory");
        if (invs.some(i => i.batchNumber === batchNum)) {
          window.NurseryApp.showToast(`Batch Number ${batchNum} already exists in database.`, "error");
          return false;
        }

        const record = {
          batchNumber: batchNum,
          seedlingTypeId: document.getElementById("inv-type").value,
          supplierId: document.getElementById("inv-supplier").value,
          dateReceived: document.getElementById("inv-date").value,
          quantity: qty,
          currentQuantity: qty,
          age: parseInt(document.getElementById("inv-age").value),
          height: parseInt(document.getElementById("inv-height").value),
          nurseryAreaId: document.getElementById("inv-area").value,
          status: document.getElementById("inv-status").value
        };

        window.NurseryStorage.insert("inventory", record, user.name);
        
        // Log to ledger
        window.NurseryStorage.addLedgerEntry(
          batchNum, 
          "Receipt", 
          qty, 0, 
          `Registered seedling batch from receipt form. Supplier: ${record.supplierId}`, 
          new Date(record.dateReceived).toISOString()
        );

        window.NurseryApp.showToast(`Seedling batch ${batchNum} received & logged to ledger!`, "success");
        self.loadInventoryData();
        return true;
      });
    },

    openEditModal: function (id) {
      const self = this;
      const record = window.NurseryStorage.getById("inventory", id);
      if (!record) return;

      const types = window.NurseryStorage.getAll("seedling_types");
      const suppliers = window.NurseryStorage.getAll("suppliers");
      const areas = window.NurseryStorage.getAll("nursery_areas");

      const formHTML = `
        <form id="inventory-item-form" class="form-grid">
          <div class="form-group">
            <label>Batch Number</label>
            <input type="text" id="inv-batch" class="form-input" value="${record.batchNumber}" readonly>
          </div>
          <div class="form-group">
            <label>Seedling Species</label>
            <select id="inv-type" class="form-input" required>
              ${types.map(t => `<option value="${t.id}" ${t.id === record.seedlingTypeId ? 'selected' : ''}>${t.name}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Supplier Source</label>
            <select id="inv-supplier" class="form-input" required>
              ${suppliers.map(s => `<option value="${s.id}" ${s.id === record.supplierId ? 'selected' : ''}>${s.name}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Nursery Plot Area</label>
            <select id="inv-area" class="form-input" required>
              ${areas.map(a => `<option value="${a.id}" ${a.id === record.nurseryAreaId ? 'selected' : ''}>${a.code} - ${a.name}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Received Date</label>
            <input type="date" id="inv-date" class="form-input" value="${record.dateReceived}" required>
          </div>
          <div class="form-group">
            <label>Original Receipt Qty</label>
            <input type="number" id="inv-qty" class="form-input" value="${record.quantity}" required>
          </div>
          <div class="form-group">
            <label>Current Balance Qty</label>
            <input type="number" id="inv-curr-qty" class="form-input" value="${record.currentQuantity}" required>
          </div>
          <div class="form-group">
            <label>Age (Weeks)</label>
            <input type="number" id="inv-age" class="form-input" value="${record.age}" required>
          </div>
          <div class="form-group">
            <label>Height (cm)</label>
            <input type="number" id="inv-height" class="form-input" value="${record.height}" required>
          </div>
          <div class="form-group">
            <label>Health Bio-Status</label>
            <select id="inv-status" class="form-input">
              <option value="Healthy" ${record.status === 'Healthy' ? 'selected' : ''}>Healthy</option>
              <option value="Monitoring" ${record.status === 'Monitoring' ? 'selected' : ''}>Monitoring</option>
              <option value="Ready To Plant" ${record.status === 'Ready To Plant' ? 'selected' : ''}>Ready To Plant</option>
              <option value="Dead" ${record.status === 'Dead' ? 'selected' : ''}>Dead</option>
            </select>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Modify Seedling Batch Details", formHTML, function () {
        const form = document.getElementById("inventory-item-form");
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const prevPlot = record.nurseryAreaId;
        const newPlot = document.getElementById("inv-area").value;
        const newCurrQty = parseInt(document.getElementById("inv-curr-qty").value);
        
        const updated = {
          ...record,
          seedlingTypeId: document.getElementById("inv-type").value,
          supplierId: document.getElementById("inv-supplier").value,
          nurseryAreaId: newPlot,
          dateReceived: document.getElementById("inv-date").value,
          quantity: parseInt(document.getElementById("inv-qty").value),
          currentQuantity: newCurrQty,
          age: parseInt(document.getElementById("inv-age").value),
          height: parseInt(document.getElementById("inv-height").value),
          status: document.getElementById("inv-status").value
        };

        // If plot location changed, trigger a Ledger Transfer automatically!
        if (prevPlot !== newPlot) {
          const areaObj = areas.find(a => a.id === newPlot) || { code: "N/A" };
          window.NurseryStorage.addLedgerEntry(
            record.batchNumber,
            "Transfer",
            0, 0,
            `Transferred batch to plot ${areaObj.code} via master update`
          );
        }

        // If manual count changed, trigger an Adjustment ledger entry
        if (record.currentQuantity !== newCurrQty) {
          const diff = newCurrQty - record.currentQuantity;
          window.NurseryStorage.addLedgerEntry(
            record.batchNumber,
            "Stock Opname Adjustment",
            diff > 0 ? diff : 0,
            diff < 0 ? Math.abs(diff) : 0,
            `Manual quantity adjustment from edit screen. Previous: ${record.currentQuantity}, New: ${newCurrQty}`
          );
        }

        window.NurseryStorage.update("inventory", id, updated, user.name);
        window.NurseryApp.showToast("Batch configurations saved successfully.", "success");
        self.loadInventoryData();
        return true;
      });
    },

    handleDelete: function (id) {
      const self = this;
      const record = window.NurseryStorage.getById("inventory", id);
      if (!record) return;

      window.NurseryApp.showModal(
        "Delete Seedling Batch",
        `<p>Confirm deletion of batch <strong>${record.batchNumber}</strong>? This clears all linked ledger lines and historical records.</p>`,
        function () {
          const user = window.NurseryAuth.getCurrentUser();
          window.NurseryStorage.delete("inventory", id, user.name);
          window.NurseryApp.showToast("Inventory batch removed from catalog.", "warning");
          self.loadInventoryData();
          return true;
        }
      );
    },

    openDetailModal: function (id) {
      const record = window.NurseryStorage.getById("inventory", id);
      if (!record) return;

      const type = window.NurseryStorage.getById("seedling_types", record.seedlingTypeId) || {};
      const supplier = window.NurseryStorage.getById("suppliers", record.supplierId) || {};
      const area = window.NurseryStorage.getById("nursery_areas", record.nurseryAreaId) || {};

      // Filter ledgers for this batch
      const ledger = window.NurseryStorage.getAll("ledger").filter(l => l.batch === record.batchNumber);
      // Filter growth monitorings
      const monitoring = window.NurseryStorage.getAll("monitoring").filter(m => m.batchNumber === record.batchNumber);

      const formHTML = `
        <div style="font-size:13px; line-height: 1.6;">
          
          <!-- Master Details -->
          <div class="form-grid" style="background:var(--bg-gray); padding:15px; border-radius: var(--border-radius-md); margin-bottom: 20px;">
            <div>
              <strong>Batch Number:</strong> ${record.batchNumber}<br>
              <strong>Species Type:</strong> ${type.name} (<em>${type.scientificName || ''}</em>)<br>
              <strong>Supplied by:</strong> ${supplier.name}<br>
              <strong>Status:</strong> <span class="status-badge ${record.status.toLowerCase().replace(/ /g, '')}">${record.status}</span>
            </div>
            <div>
              <strong>Date Received:</strong> ${record.dateReceived}<br>
              <strong>Original Qty:</strong> ${record.quantity.toLocaleString()}<br>
              <strong>Current Stock:</strong> <strong>${record.currentQuantity.toLocaleString()}</strong> seedlings<br>
              <strong>Nursery Plot:</strong> ${area.code} - ${area.name}
            </div>
          </div>

          <!-- Tabs inside detail Modal -->
          <div style="font-weight:700; border-bottom:1px solid var(--border-color); padding-bottom:5px; margin-bottom:10px;">Growth Log (${monitoring.length})</div>
          <div style="max-height: 120px; overflow-y:auto; margin-bottom:20px; border:1px solid var(--border-color); padding:8px; border-radius: var(--border-radius-sm);">
            ${monitoring.length === 0 ? '<p style="color:var(--text-muted); text-align:center;">No growth logs yet.</p>' : monitoring.map(m => `
              <div style="padding: 4px 0; border-bottom:1px solid var(--bg-gray);">
                <code>[${m.monitoringDate}]</code> Height: <strong>${m.height}cm</strong> | Dia: ${m.diameter}cm | Condition: ${m.leafCondition} | Score: ${m.healthScore}%
              </div>
            `).join("")}
          </div>

          <div style="font-weight:700; border-bottom:1px solid var(--border-color); padding-bottom:5px; margin-bottom:10px;">Stock Movement Ledger (${ledger.length})</div>
          <div style="max-height: 120px; overflow-y:auto; border:1px solid var(--border-color); padding:8px; border-radius: var(--border-radius-sm);">
            ${ledger.length === 0 ? '<p style="color:var(--text-muted); text-align:center;">No movement history.</p>' : ledger.map(l => `
              <div style="padding: 4px 0; border-bottom:1px solid var(--bg-gray); display:flex; justify-content:space-between;">
                <div>
                  <code>[${new Date(l.date).toLocaleDateString()}]</code> ${l.type} - <span style="color:var(--text-light); font-size:11px;">${l.remarks}</span>
                </div>
                <strong>${l.qtyIn > 0 ? '+' + l.qtyIn : '-' + l.qtyOut} (Bal: ${l.balance})</strong>
              </div>
            `).join("")}
          </div>
        </div>
      `;

      window.NurseryApp.showModal(`Seedling Batch Audit Inspector: ${record.batchNumber}`, formHTML, null, null, "Close Inspector");
    },

    exportToCSV: function () {
      const inventory = window.NurseryStorage.getAll("inventory");
      const types = window.NurseryStorage.getAll("seedling_types");
      const suppliers = window.NurseryStorage.getAll("suppliers");
      const areas = window.NurseryStorage.getAll("nursery_areas");

      // Generate CSV Content
      let csv = "Batch Number,Species Code,Species Name,Supplier,Date Received,Received Qty,Current Qty,Age (Weeks),Height (cm),Nursery Plot,Status\n";
      inventory.forEach(i => {
        const type = types.find(t => t.id === i.seedlingTypeId) || {};
        const supplier = suppliers.find(s => s.id === i.supplierId) || {};
        const area = areas.find(a => a.id === i.nurseryAreaId) || {};
        
        csv += `"${i.batchNumber}","${type.code || ''}","${type.name || ''}","${supplier.name || ''}","${i.dateReceived}",${i.quantity},${i.currentQuantity},${i.age},${i.height},"${area.code || ''}","${i.status}"\n`;
      });

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `Nursery_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.NurseryApp.showToast("CSV Inventory Export Completed", "success");
    },

    importFromCSV: function (file) {
      const self = this;
      const reader = new FileReader();
      
      reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.split("\n");
        if (lines.length <= 1) {
          window.NurseryApp.showToast("CSV file is empty or missing headers", "error");
          return;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const types = window.NurseryStorage.getAll("seedling_types");
        const suppliers = window.NurseryStorage.getAll("suppliers");
        const areas = window.NurseryStorage.getAll("nursery_areas");

        let importsCount = 0;
        let errorsCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Simple CSV splitter (handles quotes roughly)
          const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());

          if (cols.length < 6) {
            errorsCount++;
            continue;
          }

          const batchNumber = cols[0].toUpperCase();
          const speciesCode = cols[1];
          const supplierName = cols[3];
          const dateReceived = cols[4];
          const receivedQty = parseInt(cols[5]) || 0;
          const currentQty = parseInt(cols[6]) || receivedQty;
          const age = parseInt(cols[7]) || 2;
          const height = parseInt(cols[8]) || 8;
          const plotCode = cols[9];
          const status = cols[10] || "Healthy";

          // Resolve references
          const typeObj = types.find(t => t.code.toLowerCase() === speciesCode.toLowerCase() || t.name.toLowerCase() === speciesCode.toLowerCase());
          const supplierObj = suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
          const areaObj = areas.find(a => a.code.toLowerCase() === plotCode.toLowerCase());

          if (!typeObj || !supplierObj || !areaObj) {
            errorsCount++;
            continue;
          }

          // Insert record
          const invList = window.NurseryStorage.getAll("inventory");
          const existingIdx = invList.findIndex(inv => inv.batchNumber === batchNumber);

          const record = {
            batchNumber: batchNumber,
            seedlingTypeId: typeObj.id,
            supplierId: supplierObj.id,
            nurseryAreaId: areaObj.id,
            dateReceived: dateReceived,
            quantity: receivedQty,
            currentQuantity: currentQty,
            age: age,
            height: height,
            status: status
          };

          if (existingIdx !== -1) {
            // Update existing
            window.NurseryStorage.update("inventory", invList[existingIdx].id, record, user.name);
          } else {
            // Insert new
            window.NurseryStorage.insert("inventory", record, user.name);
            window.NurseryStorage.addLedgerEntry(
              batchNumber,
              "Receipt",
              receivedQty, 0,
              `Imported new batch from CSV sheet. Supplier: ${supplierObj.name}`
            );
          }
          importsCount++;
        }

        window.NurseryApp.showToast(`CSV Import Complete: ${importsCount} records ingested. Errors/Skips: ${errorsCount}`, importsCount > 0 ? "success" : "error");
        self.loadInventoryData();
      };

      reader.readAsText(file);
      // Reset input element
      document.getElementById("inv-import-file-input").value = "";
    },

    onSearch: function (q) {
      this.searchQuery = q;
      document.getElementById("inv-search-input").value = q;
      this.currentPage = 1;
      this.loadInventoryData();
    }
  };

  window.NurseryApp.views.inventory = Inventory;
})();
