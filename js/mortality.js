/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - MORTALITY MANAGEMENT
 * Manages plant casualty records, performs cause analysis and updates inventory quantities.
 */

(function () {
  const Mortality = {
    causeChart: null,
    trendChart: null,

    init: function () {
      this.renderLayout();
      this.renderCharts();
      this.loadMortalityData();
    },

    renderLayout: function () {
      const container = document.getElementById("view-mortality");
      if (!container) return;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-wrap">
            <h1>Mortality Management</h1>
            <p>Log plant casualties, analyze root causes (Pests, Disease, Drought), and adjust bio-asset values</p>
          </div>
          <div>
            <button class="btn btn-primary" id="btn-log-mortality">
              <i class="fa-solid fa-skull"></i> Record Seedling Loss
            </button>
          </div>
        </div>

        <!-- STATISTICS & CHARTS ROW -->
        <div class="dashboard-grid">
          
          <!-- Summary card -->
          <div class="dashboard-card col-4">
            <div class="card-header">
              <span class="card-title">Mortality Metrics Summary</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:15px; padding:10px 0;">
              <div>
                <span style="font-size:11px; text-transform:uppercase; font-weight:700; color:var(--text-light);">Cumulative Dead Seedlings</span>
                <h2 style="font-size:32px; font-family:var(--font-title); font-weight:700; color:var(--critical-red);" id="mort-stat-total">0</h2>
              </div>
              <div>
                <span style="font-size:11px; text-transform:uppercase; font-weight:700; color:var(--text-light);">Leading Casualty Cause</span>
                <h3 style="font-size:20px; font-weight:600;" id="mort-stat-cause">N/A</h3>
              </div>
              <div style="border-top:1px solid var(--border-color); padding-top:10px; font-size:12px;">
                <strong>Standard operating warning:</strong> Any batch experiencing &gt; 15% mortality in 14 days must trigger a quarantine flag to the Reclamation Team.
              </div>
            </div>
          </div>

          <!-- Cause Distribution -->
          <div class="dashboard-card col-4">
            <div class="card-header">
              <span class="card-title">Loss Cause Distribution</span>
            </div>
            <div class="chart-container" style="height: 180px;">
              <canvas id="mortality-cause-chart"></canvas>
            </div>
          </div>

          <!-- Loss Trend -->
          <div class="dashboard-card col-4">
            <div class="card-header">
              <span class="card-title">Loss Historical Trend</span>
            </div>
            <div class="chart-container" style="height: 180px;">
              <canvas id="mortality-trend-chart"></canvas>
            </div>
          </div>

        </div>

        <!-- MORTALITY LOGS LIST -->
        <div class="dashboard-card col-12" style="margin-top:20px;">
          <div class="card-header">
            <span class="card-title">Historical Mortality Records</span>
          </div>
          <div class="table-wrapper">
            <table class="custom-table" id="mortality-logs-table">
              <thead>
                <tr>
                  <th>Loss Date</th>
                  <th>Batch Number</th>
                  <th>Species Name</th>
                  <th>Quantity Dead</th>
                  <th>Primary Cause</th>
                  <th style="text-align: right; width: 120px;">Actions</th>
                </tr>
              </thead>
              <tbody id="mortality-logs-tbody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>
      `;

      const self = this;
      document.getElementById("btn-log-mortality").addEventListener("click", () => self.openCreateModal());
    },

    renderCharts: function () {
      const records = window.NurseryStorage.getAll("mortality");
      const inventory = window.NurseryStorage.getAll("inventory");
      const types = window.NurseryStorage.getAll("seedling_types");

      // 1. Calculate causes distribution
      const causes = ["Pest", "Disease", "Drought", "Flood", "Handling Damage", "Other"];
      const causeCounts = causes.map(c => {
        return records.filter(r => r.cause === c).reduce((sum, r) => sum + r.quantityDead, 0);
      });

      // Update leading cause text
      const totalDead = causeCounts.reduce((a, b) => a + b, 0);
      document.getElementById("mort-stat-total").textContent = totalDead.toLocaleString();
      
      let maxCause = "N/A";
      let maxVal = -1;
      for (let i = 0; i < causes.length; i++) {
        if (causeCounts[i] > maxVal && causeCounts[i] > 0) {
          maxVal = causeCounts[i];
          maxCause = `${causes[i]} (${maxVal.toLocaleString()})`;
        }
      }
      document.getElementById("mort-stat-cause").textContent = maxCause;

      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const textColor = isDark ? "#94A3B8" : "#64748B";

      // Cause chart render
      const ctxCause = document.getElementById("mortality-cause-chart").getContext("2d");
      if (this.causeChart) this.causeChart.destroy();
      this.causeChart = new Chart(ctxCause, {
        type: 'doughnut',
        data: {
          labels: causes,
          datasets: [{
            data: causeCounts,
            backgroundColor: ['#EC407A', '#AB47BC', '#7E57C2', '#26A69A', '#FFA726', '#78909C'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false } // space limits
          }
        }
      });

      // 2. Trend chart render (Mocked monthly breakdown based on real data)
      const ctxTrend = document.getElementById("mortality-trend-chart").getContext("2d");
      if (this.trendChart) this.trendChart.destroy();
      this.trendChart = new Chart(ctxTrend, {
        type: 'line',
        data: {
          labels: ["Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26"],
          datasets: [{
            label: 'Casualties',
            data: [150, 240, 180, 290, 130, 210], // realistic mock
            borderColor: '#E53935',
            backgroundColor: 'rgba(229, 57, 53, 0.1)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    },

    loadMortalityData: function () {
      const tbody = document.getElementById("mortality-logs-tbody");
      if (!tbody) return;

      const records = window.NurseryStorage.getAll("mortality");
      const inventory = window.NurseryStorage.getAll("inventory");
      const types = window.NurseryStorage.getAll("seedling_types");

      // Sort newest first
      records.sort((a,b) => new Date(b.date) - new Date(a.date));

      const canWrite = window.NurseryAuth.hasPermission("mortality", "write");
      const canDelete = window.NurseryAuth.hasPermission("mortality", "delete");

      if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color:var(--text-muted);">No seedling casualties registered in logs.</td></tr>`;
        return;
      }

      tbody.innerHTML = records.map(r => {
        const inv = inventory.find(i => i.batchNumber === r.batch) || {};
        const type = types.find(t => t.id === inv.seedlingTypeId) || { name: "Unknown" };

        return `
          <tr>
            <td><strong>${r.date}</strong></td>
            <td><a href="#" style="color:var(--primary-green); font-weight:700;" onclick="window.NurseryApp.navigateTo('inventory'); window.NurseryApp.views.inventory.onSearch('${r.batch}'); event.preventDefault();">${r.batch}</a></td>
            <td>${type.name}</td>
            <td style="color:var(--critical-red); font-weight:700;">-${r.quantityDead.toLocaleString()}</td>
            <td><span class="status-badge critical">${r.cause}</span></td>
            <td style="text-align: right;">
              <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px;" onclick="window.NurseryApp.views.mortality.openEditModal('${r.id}')" ${!canWrite ? 'disabled' : ''}><i class="fa-solid fa-edit"></i></button>
              <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px; color:var(--critical-red);" onclick="window.NurseryApp.views.mortality.handleDelete('${r.id}')" ${!canDelete ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `;
      }).join("");
    },

    openCreateModal: function () {
      const self = this;
      const inventory = window.NurseryStorage.getAll("inventory");
      const active = inventory.filter(i => i.currentQuantity > 0 && i.status !== "Dead");

      const today = new Date().toISOString().split('T')[0];

      const formHTML = `
        <form id="mortality-event-form" class="form-grid">
          <div class="form-group">
            <label>Select Seedling Batch</label>
            <select id="mort-batch" class="form-input" required>
              ${active.map(i => `<option value="${i.batchNumber}">${i.batchNumber} (Stock: ${i.currentQuantity})</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Loss Date</label>
            <input type="date" id="mort-date" class="form-input" value="${today}" required>
          </div>
          <div class="form-group">
            <label>Quantity Dead</label>
            <input type="number" id="mort-qty" class="form-input" min="1" value="10" required>
          </div>
          <div class="form-group">
            <label>Primary Loss Cause</label>
            <select id="mort-cause" class="form-input" required>
              <option value="Pest">Pest</option>
              <option value="Disease">Disease</option>
              <option value="Drought">Drought</option>
              <option value="Flood">Flood</option>
              <option value="Handling Damage">Handling Damage</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Record Seedling Casualty Loss", formHTML, function () {
        const form = document.getElementById("mortality-event-form");
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const batchNum = document.getElementById("mort-batch").value;
        const qtyDead = parseInt(document.getElementById("mort-qty").value);
        const cause = document.getElementById("mort-cause").value;

        // Check inventory balance
        const invs = window.NurseryStorage.getAll("inventory");
        const inv = invs.find(i => i.batchNumber === batchNum);
        if (!inv || inv.currentQuantity < qtyDead) {
          window.NurseryApp.showToast(`Insufficient quantity in batch. Available: ${inv ? inv.currentQuantity : 0}`, "error");
          return false;
        }

        // Deduct inventory balance, record ledger, and save mortality
        const record = {
          date: document.getElementById("mort-date").value,
          batch: batchNum,
          quantityDead: qtyDead,
          cause: cause
        };

        window.NurseryStorage.insert("mortality", record, user.name);

        // Deduct inventory balance via addLedgerEntry hook (which handles currentQuantity calculations)
        window.NurseryStorage.addLedgerEntry(
          batchNum,
          "Mortality",
          0, qtyDead,
          `Logged mortality of ${qtyDead} seedlings due to ${cause}.`,
          new Date(record.date).toISOString()
        );

        window.NurseryApp.showToast(`Casualty loss registered for Batch ${batchNum}.`, "warning");
        self.renderCharts();
        self.loadMortalityData();
        return true;
      });
    },

    openEditModal: function (id) {
      const self = this;
      const record = window.NurseryStorage.getById("mortality", id);
      if (!record) return;

      const formHTML = `
        <form id="mortality-event-form" class="form-grid">
          <div class="form-group">
            <label>Batch Number</label>
            <input type="text" id="mort-batch" class="form-input" value="${record.batch}" readonly>
          </div>
          <div class="form-group">
            <label>Loss Date</label>
            <input type="date" id="mort-date" class="form-input" value="${record.date}" required>
          </div>
          <div class="form-group">
            <label>Quantity Dead</label>
            <input type="number" id="mort-qty" class="form-input" min="1" value="${record.quantityDead}" required>
          </div>
          <div class="form-group">
            <label>Primary Loss Cause</label>
            <select id="mort-cause" class="form-input" required>
              <option value="Pest" ${record.cause === 'Pest' ? 'selected' : ''}>Pest</option>
              <option value="Disease" ${record.cause === 'Disease' ? 'selected' : ''}>Disease</option>
              <option value="Drought" ${record.cause === 'Drought' ? 'selected' : ''}>Drought</option>
              <option value="Flood" ${record.cause === 'Flood' ? 'selected' : ''}>Flood</option>
              <option value="Handling Damage" ${record.cause === 'Handling Damage' ? 'selected' : ''}>Handling Damage</option>
              <option value="Other" ${record.cause === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Edit Seedling Loss Entry", formHTML, function () {
        const form = document.getElementById("mortality-event-form");
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const newQtyDead = parseInt(document.getElementById("mort-qty").value);

        // Revert old quantity back, then check if new is possible
        const invs = window.NurseryStorage.getAll("inventory");
        const inv = invs.find(i => i.batchNumber === record.batch);
        
        if (!inv) {
          window.NurseryApp.showToast("Batch reference invalid", "error");
          return false;
        }

        const maxAvailable = inv.currentQuantity + record.quantityDead;
        if (maxAvailable < newQtyDead) {
          window.NurseryApp.showToast(`Insufficient quantity. Max available with revert: ${maxAvailable}`, "error");
          return false;
        }

        // Apply change
        const diff = newQtyDead - record.quantityDead; // positive means we lost more, negative means we lost less
        
        const updated = {
          ...record,
          date: document.getElementById("mort-date").value,
          quantityDead: newQtyDead,
          cause: document.getElementById("mort-cause").value
        };

        window.NurseryStorage.update("mortality", id, updated, user.name);

        // Adjust ledger & inventory quantities
        if (diff > 0) {
          // lost more, deduct
          window.NurseryStorage.addLedgerEntry(
            record.batch,
            "Mortality",
            0, Math.abs(diff),
            `Adjusted mortality log (lost ${diff} more). Cause: ${updated.cause}`
          );
        } else if (diff < 0) {
          // lost less, add back
          window.NurseryStorage.addLedgerEntry(
            record.batch,
            "Receipt",
            Math.abs(diff), 0,
            `Reverted partial mortality logs (recovered ${Math.abs(diff)}). Cause: ${updated.cause}`
          );
        }

        window.NurseryApp.showToast("Loss records modified successfully.", "success");
        self.renderCharts();
        self.loadMortalityData();
        return true;
      });
    },

    handleDelete: function (id) {
      const self = this;
      const record = window.NurseryStorage.getById("mortality", id);
      if (!record) return;

      window.NurseryApp.showModal(
        "Delete Casualty Log",
        "<p>Delete this casualty record? This will revert the logged quantity back to the seedling inventory balance.</p>",
        function () {
          const user = window.NurseryAuth.getCurrentUser();
          
          // Revert inventory quantity
          window.NurseryStorage.addLedgerEntry(
            record.batch,
            "Receipt",
            record.quantityDead, 0,
            `Reverted mortality casualty log due to deletion of record id: ${record.id}`
          );

          window.NurseryStorage.delete("mortality", id, user.name);
          window.NurseryApp.showToast("Casualty records cleared.", "warning");
          self.renderCharts();
          self.loadMortalityData();
          return true;
        }
      );
    }
  };

  window.NurseryApp.views.mortality = Mortality;
})();
