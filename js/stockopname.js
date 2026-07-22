/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - STOCK OPNAME RECONCILIATION
 * Manages inventory reconciliation audits, variance calculations, and workflow state approvals.
 */

(function () {
  const StockOpname = {
    varianceChart: null,

    init: function () {
      this.renderLayout();
      this.calculateMetrics();
      this.renderCharts();
      this.loadOpnameData();
    },

    renderLayout: function () {
      const container = document.getElementById("view-stockopname");
      if (!container) return;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-wrap">
            <h1>Stock Opname Reconciliation</h1>
            <p>Initiate physical counts, audit ledger discrepancies, and process administrative approvals</p>
          </div>
          <div>
            <button class="btn btn-primary" id="btn-create-opname" ${!window.NurseryAuth.hasPermission("stockopname", "submit") ? 'disabled' : ''}>
              <i class="fa-solid fa-clipboard-list"></i> Conduct Stock Count
            </button>
          </div>
        </div>

        <!-- RECONCILIATION KPI DASHBOARD -->
        <div class="kpi-grid">
          <div class="kpi-card blue">
            <div class="kpi-header">
              <span class="kpi-title">Total System Qty</span>
              <i class="fa-solid fa-desktop kpi-icon"></i>
            </div>
            <div class="kpi-value" id="so-kpi-system">0</div>
            <div class="kpi-subtext">Active catalog sum</div>
          </div>

          <div class="kpi-card green">
            <div class="kpi-header">
              <span class="kpi-title">Physical Counted</span>
              <i class="fa-solid fa-hand-holding-hand kpi-icon" style="color: var(--success-green);"></i>
            </div>
            <div class="kpi-value" id="so-kpi-physical">0</div>
            <div class="kpi-subtext">Approved count audits</div>
          </div>

          <div class="kpi-card red" id="so-kpi-variance-card">
            <div class="kpi-header">
              <span class="kpi-title">Audited Variance</span>
              <i class="fa-solid fa-triangle-exclamation kpi-icon"></i>
            </div>
            <div class="kpi-value" id="so-kpi-variance">0</div>
            <div class="kpi-subtext">Physical - System count</div>
          </div>

          <div class="kpi-card yellow">
            <div class="kpi-header">
              <span class="kpi-title">Pending Workflow</span>
              <i class="fa-solid fa-hourglass-half kpi-icon" style="color: var(--warning-yellow);"></i>
            </div>
            <div class="kpi-value" id="so-kpi-pending">0</div>
            <div class="kpi-subtext">Requires Supervisor action</div>
          </div>
        </div>

        <!-- CHARTS SECTION -->
        <div class="dashboard-grid">
          <div class="dashboard-card col-8">
            <div class="card-header">
              <span class="card-title">Reconciliation Discrepancies by Seedling Batch</span>
            </div>
            <div class="chart-container" style="height: 200px;">
              <canvas id="opname-variance-chart"></canvas>
            </div>
          </div>

          <div class="dashboard-card col-4">
            <div class="card-header">
              <span class="card-title">Workflows Approval Status</span>
            </div>
            <div style="font-size:12px; display:flex; flex-direction:column; gap:10px; padding:10px 0;">
              <div style="display:flex; justify-content:space-between;"><span>Approved (Reconciled):</span><strong id="so-stat-approved">0</strong></div>
              <div style="display:flex; justify-content:space-between;"><span>Pending Approval:</span><strong id="so-stat-pending" style="color:var(--warning-yellow);">0</strong></div>
              <div style="display:flex; justify-content:space-between;"><span>Rejected (Re-count):</span><strong id="so-stat-rejected" style="color:var(--critical-red);">0</strong></div>
              <div style="display:flex; justify-content:space-between;"><span>Drafts:</span><strong id="so-stat-draft">0</strong></div>
            </div>
          </div>
        </div>

        <!-- OPNAME LIST -->
        <div class="dashboard-card col-12" style="margin-top:20px;">
          <div class="card-header">
            <span class="card-title">Audit Opname Ledger</span>
          </div>
          <div class="table-wrapper">
            <table class="custom-table" id="opname-table">
              <thead>
                <tr>
                  <th>Audit Reference</th>
                  <th>Log Date</th>
                  <th>Batch Number</th>
                  <th>System Qty</th>
                  <th>Physical Qty</th>
                  <th>Variance</th>
                  <th>Workflow Status</th>
                  <th>Audited By</th>
                  <th>Approved By</th>
                  <th style="text-align: right; width: 180px;">Actions</th>
                </tr>
              </thead>
              <tbody id="opname-tbody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>
      `;

      const self = this;
      document.getElementById("btn-create-opname").addEventListener("click", () => self.openCreateModal());
    },

    calculateMetrics: function () {
      const inventory = window.NurseryStorage.getAll("inventory");
      const opnames = window.NurseryStorage.getAll("stock_opname");

      // Active seedlings in system
      const systemTotal = inventory.filter(i => i.status !== "Dead").reduce((sum, item) => sum + item.currentQuantity, 0);
      document.getElementById("so-kpi-system").textContent = systemTotal.toLocaleString();

      // Physical sum from APPROVED opnames
      const approvedOpnames = opnames.filter(o => o.status === "Approved");
      
      // Calculate total variance in approved opnames
      const varianceSum = approvedOpnames.reduce((sum, item) => sum + item.variance, 0);
      
      const physicalTotal = systemTotal + varianceSum; // physical count reflects variance adjustments
      document.getElementById("so-kpi-physical").textContent = physicalTotal.toLocaleString();

      const varCard = document.getElementById("so-kpi-variance-card");
      const varKPI = document.getElementById("so-kpi-variance");
      varKPI.textContent = (varianceSum >= 0 ? "+" : "") + varianceSum.toLocaleString();

      if (varianceSum < 0) {
        varCard.className = "kpi-card red";
      } else if (varianceSum > 0) {
        varCard.className = "kpi-card green";
      } else {
        varCard.className = "kpi-card blue";
      }

      // Counts by states
      const pendingCount = opnames.filter(o => o.status === "Submitted").length;
      document.getElementById("so-kpi-pending").textContent = pendingCount;

      document.getElementById("so-stat-approved").textContent = approvedOpnames.length;
      document.getElementById("so-stat-pending").textContent = pendingCount;
      document.getElementById("so-stat-rejected").textContent = opnames.filter(o => o.status === "Rejected").length;
      document.getElementById("so-stat-draft").textContent = opnames.filter(o => o.status === "Draft").length;
    },

    renderCharts: function () {
      const ctx = document.getElementById("opname-variance-chart").getContext("2d");
      const opnames = window.NurseryStorage.getAll("stock_opname").filter(o => o.status === "Approved" && o.variance !== 0).slice(0, 10);

      const labels = opnames.map(o => o.batchNumber);
      const variances = opnames.map(o => o.variance);

      if (this.varianceChart) this.varianceChart.destroy();

      this.varianceChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels.length > 0 ? labels : ["No approved variances"],
          datasets: [{
            label: 'Physical Count Discrepancies (+/-)',
            data: variances.length > 0 ? variances : [0],
            backgroundColor: variances.map(v => v < 0 ? '#EF5350' : '#66BB6A'),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    },

    loadOpnameData: function () {
      const tbody = document.getElementById("so-tbody");
      if (!tbody) return;

      const opnames = window.NurseryStorage.getAll("stock_opname");
      opnames.sort((a,b) => new Date(b.dateCreated) - new Date(a.dateCreated));

      const currentUser = window.NurseryAuth.getCurrentUser();
      const canApprove = window.NurseryAuth.hasPermission("stockopname", "approve");
      const canSubmit = window.NurseryAuth.hasPermission("stockopname", "submit");

      if (opnames.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 20px; color:var(--text-muted);">No stock opname files.</td></tr>`;
        return;
      }

      tbody.innerHTML = opnames.map(o => {
        const varColor = o.variance < 0 ? 'var(--critical-red)' : o.variance > 0 ? 'var(--primary-green)' : 'var(--text-main)';
        const varStr = (o.variance >= 0 ? "+" : "") + o.variance;
        const statusClass = o.status.toLowerCase();

        let actionButtons = "";
        
        // Draft states actions
        if (o.status === "Draft") {
          actionButtons = `
            <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px;" title="Submit Count" onclick="window.NurseryApp.views.stockopname.handleSubmitCount('${o.id}')" ${!canSubmit ? 'disabled' : ''}><i class="fa-solid fa-paper-plane"></i> Submit</button>
            <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px; color:var(--critical-red);" title="Discard Draft" onclick="window.NurseryApp.views.stockopname.handleDelete('${o.id}')" ${!canSubmit ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
          `;
        }
        
        // Submitted states actions (Approve / Reject)
        if (o.status === "Submitted") {
          actionButtons = `
            <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px; color:var(--primary-green);" title="Approve & Reconcile" onclick="window.NurseryApp.views.stockopname.handleWorkflow('${o.id}', 'Approved')" ${!canApprove ? 'disabled' : ''}><i class="fa-solid fa-check"></i> Approve</button>
            <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px; color:var(--critical-red);" title="Reject Count" onclick="window.NurseryApp.views.stockopname.handleWorkflow('${o.id}', 'Rejected')" ${!canApprove ? 'disabled' : ''}><i class="fa-solid fa-xmark"></i> Reject</button>
          `;
        }

        if (o.status === "Approved" || o.status === "Rejected") {
          actionButtons = `<span style="font-size:11px; color:var(--text-muted);">Reconciliation Closed</span>`;
        }

        return `
          <tr>
            <td><strong style="font-family:monospace;">${o.opnameNumber}</strong></td>
            <td>${o.dateCreated}</td>
            <td><a href="#" style="color:var(--primary-green); font-weight:700;" onclick="window.NurseryApp.navigateTo('inventory'); window.NurseryApp.views.inventory.onSearch('${o.batchNumber}'); event.preventDefault();">${o.batchNumber}</a></td>
            <td>${o.systemQty.toLocaleString()}</td>
            <td>${o.physicalQty.toLocaleString()}</td>
            <td style="color:${varColor}; font-weight:700;">${varStr}</td>
            <td><span class="status-badge ${statusClass}">${o.status}</span></td>
            <td>${o.createdBy}</td>
            <td>${o.approvedBy || '-'}</td>
            <td style="text-align: right;">${actionButtons}</td>
          </tr>
        `;
      }).join("");
    },

    openCreateModal: function () {
      const self = this;
      const inventory = window.NurseryStorage.getAll("inventory");
      const active = inventory.filter(i => i.status !== "Dead" && i.currentQuantity > 0);

      if (active.length === 0) {
        window.NurseryApp.showToast("No active batches found to perform stock counting.", "warning");
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const autoSO = `SO-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

      const formHTML = `
        <form id="opname-count-form" class="form-grid">
          <div class="form-group">
            <label>Audit Code</label>
            <input type="text" id="so-num" class="form-input" value="${autoSO}" readonly>
          </div>
          <div class="form-group">
            <label>Record Date</label>
            <input type="date" id="so-date" class="form-input" value="${today}" required>
          </div>
          <div class="form-group">
            <label>Select Seedling Batch</label>
            <select id="so-batch-select" class="form-input" required>
              <option value="">-- Choose Batch --</option>
              ${active.map(i => `<option value="${i.batchNumber}">${i.batchNumber}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>System Quantity</label>
            <input type="number" id="so-sys-qty" class="form-input" value="0" readonly>
          </div>
          <div class="form-group">
            <label>Physical Counting Qty</label>
            <input type="number" id="so-phys-qty" class="form-input" value="0" min="0" required>
          </div>
          <div class="form-group">
            <label>Variance Discrepancy</label>
            <input type="text" id="so-variance" class="form-input" style="font-weight:bold;" value="0" readonly>
          </div>
          <div class="form-group col-span-2">
            <label>Save Mode Action</label>
            <select id="so-save-mode" class="form-input">
              <option value="Draft">Save as Draft (Edits allowed)</option>
              <option value="Submitted">Submit for Approval (Lock record)</option>
            </select>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Log Stock Opname Count", formHTML, function () {
        const form = document.getElementById("opname-count-form");
        if (!form.checkValidity() || !document.getElementById("so-batch-select").value) {
          window.NurseryApp.showToast("Please choose a valid seedling batch and physical count", "warning");
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const batchNum = document.getElementById("so-batch-select").value;
        const systemQty = parseInt(document.getElementById("so-sys-qty").value);
        const physicalQty = parseInt(document.getElementById("so-phys-qty").value);
        const calculatedVar = physicalQty - systemQty;
        const mode = document.getElementById("so-save-mode").value;

        // Create record
        const record = {
          opnameNumber: document.getElementById("so-num").value,
          dateCreated: document.getElementById("so-date").value,
          dateCompleted: "",
          status: mode,
          createdBy: user.name,
          approvedBy: "",
          batchNumber: batchNum,
          systemQty: systemQty,
          physicalQty: physicalQty,
          variance: calculatedVar
        };

        window.NurseryStorage.insert("stock_opname", record, user.name);
        window.NurseryApp.showToast(`Stock count logged as ${mode}.`, mode === "Draft" ? "info" : "success");
        
        self.calculateMetrics();
        self.renderCharts();
        self.loadOpnameData();
        return true;
      });

      // Bind events inside modal
      const batchSel = document.getElementById("so-batch-select");
      const sysQtyInput = document.getElementById("so-sys-qty");
      const physQtyInput = document.getElementById("so-phys-qty");
      const varianceInput = document.getElementById("so-variance");

      batchSel.addEventListener("change", function () {
        const match = active.find(i => i.batchNumber === this.value);
        if (match) {
          sysQtyInput.value = match.currentQuantity;
          physQtyInput.value = match.currentQuantity; // default match
          varianceInput.value = "0";
          varianceInput.style.color = "var(--text-main)";
        }
      });

      physQtyInput.addEventListener("input", function () {
        const sys = parseInt(sysQtyInput.value) || 0;
        const phys = parseInt(this.value) || 0;
        const diff = phys - sys;
        varianceInput.value = (diff >= 0 ? "+" : "") + diff;
        
        if (diff < 0) {
          varianceInput.style.color = "var(--critical-red)";
        } else if (diff > 0) {
          varianceInput.style.color = "var(--primary-green)";
        } else {
          varianceInput.style.color = "var(--text-main)";
        }
      });
    },

    handleSubmitCount: function (id) {
      const self = this;
      const record = window.NurseryStorage.getById("stock_opname", id);
      if (!record) return;

      window.NurseryApp.showModal(
        "Submit Stock Count",
        `<p>Are you sure you want to submit <strong>${record.opnameNumber}</strong> for verification approval? You will not be able to edit count values after submission.</p>`,
        function () {
          const user = window.NurseryAuth.getCurrentUser();
          record.status = "Submitted";
          window.NurseryStorage.update("stock_opname", id, record, user.name);
          window.NurseryApp.showToast("Count sheet locked and submitted to Supervisor.", "success");
          self.calculateMetrics();
          self.renderCharts();
          self.loadOpnameData();
          window.NurseryApp.updateNotifications();
          return true;
        }
      );
    },

    handleDelete: function (id) {
      const self = this;
      window.NurseryApp.showModal(
        "Discard Count Draft",
        "<p>Delete this draft counting record? This action is permanent.</p>",
        function () {
          const user = window.NurseryAuth.getCurrentUser();
          window.NurseryStorage.delete("stock_opname", id, user.name);
          window.NurseryApp.showToast("Draft sheet discarded.", "warning");
          self.calculateMetrics();
          self.renderCharts();
          self.loadOpnameData();
          return true;
        }
      );
    },

    handleWorkflow: function (id, action) {
      const self = this;
      const record = window.NurseryStorage.getById("stock_opname", id);
      if (!record) return;

      const title = action === "Approved" ? "Approve Audit count" : "Reject Audit count";
      const promptText = action === "Approved" 
        ? `<p>Approve physical counts for batch <strong>${record.batchNumber}</strong>? This automatically modifies seedling balances in inventory by <strong>${record.variance}</strong> and logs a transaction ledger entry.</p>`
        : `<p>Reject this count sheet? The auditor must draft a re-counting ticket.</p>`;

      window.NurseryApp.showModal(title, promptText, function () {
        const user = window.NurseryAuth.getCurrentUser();
        record.status = action;
        record.dateCompleted = new Date().toISOString().split('T')[0];
        record.approvedBy = user.name;

        window.NurseryStorage.update("stock_opname", id, record, user.name);

        if (action === "Approved" && record.variance !== 0) {
          // Reconcile and adjust inventory currentQuantity
          const qtyIn = record.variance > 0 ? record.variance : 0;
          const qtyOut = record.variance < 0 ? Math.abs(record.variance) : 0;

          window.NurseryStorage.addLedgerEntry(
            record.batchNumber,
            "Stock Opname Adjustment",
            qtyIn, qtyOut,
            `System adjustments from approved Stock Opname ${record.opnameNumber}.`
          );
        }

        window.NurseryApp.showToast(`Stock count has been successfully ${action.toUpperCase()}.`, action === "Approved" ? "success" : "warning");
        self.calculateMetrics();
        self.renderCharts();
        self.loadOpnameData();
        window.NurseryApp.updateNotifications();
        return true;
      });
    }
  };

  window.NurseryApp.views.stockopname = StockOpname;
})();
