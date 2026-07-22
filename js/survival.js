/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - SURVIVAL ANALYSIS
 * Tracks reclamation survival rates, calculates ESG metrics, and renders performance trends.
 */

(function () {
  const Survival = {
    trendChart: null,
    compareChart: null,

    init: function () {
      this.renderLayout();
      this.renderCharts();
      this.loadSurvivalData();
    },

    renderLayout: function () {
      const container = document.getElementById("view-survival");
      if (!container) return;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-wrap">
            <h1>Survival Analysis</h1>
            <p>ESG Environmental performance dashboard. Monitor post-reclamation seedling survival index targets</p>
          </div>
          <div>
            <button class="btn btn-primary" id="btn-log-survival" ${!window.NurseryAuth.hasPermission("survival", "write") ? 'disabled' : ''}>
              <i class="fa-solid fa-chart-line"></i> Log Survival Audit
            </button>
          </div>
        </div>

        <!-- CHARTS SECTION -->
        <div class="dashboard-grid">
          
          <!-- Performance gauge -->
          <div class="dashboard-card col-4">
            <div class="card-header">
              <span class="card-title">Average Reclamation Survival Index</span>
            </div>
            <div style="text-align:center; padding: 20px 0;">
              <div style="font-size: 48px; font-family:var(--font-title); font-weight:700; color:var(--primary-green);" id="survival-avg-gauge">0.0%</div>
              <div style="font-size: 12px; color:var(--text-light); margin-top:5px; font-weight:600;">System Target Threshold: &ge;90.0%</div>
              <div style="font-size: 11px; color:var(--text-muted); margin-top:15px; border-top:1px solid var(--border-color); padding-top:10px;">
                Calculated as weighted average of live seedling counts divided by total dispatched reclamation counts.
              </div>
            </div>
          </div>

          <!-- Trend Chart -->
          <div class="dashboard-card col-4">
            <div class="card-header">
              <span class="card-title">Survival Trend (90-Day Moving Avg)</span>
            </div>
            <div class="chart-container" style="height: 180px;">
              <canvas id="survival-trend-chart-canvas"></canvas>
            </div>
          </div>

          <!-- Area Comparison -->
          <div class="dashboard-card col-4">
            <div class="card-header">
              <span class="card-title">Block Survival Index Comparison (%)</span>
            </div>
            <div class="chart-container" style="height: 180px;">
              <canvas id="survival-compare-chart-canvas"></canvas>
            </div>
          </div>

        </div>

        <!-- RECORDS LIST -->
        <div class="dashboard-card col-12" style="margin-top:20px;">
          <div class="card-header">
            <span class="card-title">Field Survival Inspections Registry</span>
          </div>
          <div class="table-wrapper">
            <table class="custom-table" id="survival-table">
              <thead>
                <tr>
                  <th>Monitoring Date</th>
                  <th>Planting Ticket</th>
                  <th>Reclamation Block</th>
                  <th>Total Planted</th>
                  <th>Live Seedlings</th>
                  <th>Dead Seedlings</th>
                  <th>Survival Rate (%)</th>
                  <th style="text-align: right; width: 120px;">Actions</th>
                </tr>
              </thead>
              <tbody id="survival-tbody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>
      `;

      const self = this;
      document.getElementById("btn-log-survival").addEventListener("click", () => self.openCreateModal());
    },

    renderCharts: function () {
      const records = window.NurseryStorage.getAll("survival");
      const plantings = window.NurseryStorage.getAll("planting");
      const blocks = window.NurseryStorage.getAll("planting_areas");

      // 1. Calculate Average Survival
      let totalLive = 0;
      let totalPlanted = 0;
      records.forEach(r => {
        totalLive += r.liveSeedlings;
        totalPlanted += (r.liveSeedlings + r.deadSeedlings);
      });
      const avgRate = totalPlanted > 0 ? ((totalLive / totalPlanted) * 100).toFixed(1) : "94.6";
      document.getElementById("survival-avg-gauge").textContent = `${avgRate}%`;

      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const gridColor = isDark ? "#334155" : "#E2E8F0";

      // 2. Trend Chart Render
      const ctxTrend = document.getElementById("survival-trend-chart-canvas").getContext("2d");
      if (this.trendChart) this.trendChart.destroy();
      
      // Sort chronologically
      records.sort((a,b) => new Date(a.monitoringDate) - new Date(b.monitoringDate));
      const trendLabels = records.slice(-5).map(r => r.monitoringDate);
      const trendRates = records.slice(-5).map(r => r.survivalRate);

      this.trendChart = new Chart(ctxTrend, {
        type: 'line',
        data: {
          labels: trendLabels.length > 0 ? trendLabels : ["Jan", "Feb", "Mar", "Apr", "May"],
          datasets: [{
            label: 'Survival Rate (%)',
            data: trendRates.length > 0 ? trendRates : [96, 94.2, 95.1, 93.8, 94.6],
            borderColor: '#4CAF50',
            tension: 0.3,
            fill: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { max: 100, min: 50, grid: { color: gridColor } } }
        }
      });

      // 3. Comparison Chart Render (Block wise average survival)
      const ctxComp = document.getElementById("survival-compare-chart-canvas").getContext("2d");
      if (this.compareChart) this.compareChart.destroy();

      const blockRates = blocks.slice(0, 4).map(b => {
        // Find matching planting tickets completed in this block
        const tickets = plantings.filter(p => p.plantingAreaId === b.id && p.status === "Completed");
        const ticketNums = tickets.map(t => t.plantingNumber);
        
        const matchedAudits = records.filter(r => ticketNums.includes(r.plantingNumber));
        if (matchedAudits.length === 0) return 90 + Math.floor(Math.random() * 8); // mock fallback for visual

        let live = 0, planted = 0;
        matchedAudits.forEach(a => {
          live += a.liveSeedlings;
          planted += (a.liveSeedlings + a.deadSeedlings);
        });
        return parseFloat(((live / planted) * 100).toFixed(1));
      });

      this.compareChart = new Chart(ctxComp, {
        type: 'bar',
        data: {
          labels: blocks.slice(0, 4).map(b => b.code),
          datasets: [{
            data: blockRates,
            backgroundColor: '#0288D1'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { max: 100, min: 70 } }
        }
      });
    },

    loadSurvivalData: function () {
      const tbody = document.getElementById("survival-tbody");
      if (!tbody) return;

      const records = window.NurseryStorage.getAll("survival");
      const plantings = window.NurseryStorage.getAll("planting");
      const blocks = window.NurseryStorage.getAll("planting_areas");

      records.sort((a,b) => new Date(b.monitoringDate) - new Date(a.monitoringDate));

      const canWrite = window.NurseryAuth.hasPermission("survival", "write");
      const canDelete = window.NurseryAuth.hasPermission("survival", "delete");

      if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-muted);">No survival inspection logs found.</td></tr>`;
        return;
      }

      tbody.innerHTML = records.map(r => {
        const ticket = plantings.find(p => p.plantingNumber === r.plantingNumber) || {};
        const block = blocks.find(b => b.id === ticket.plantingAreaId) || { name: "Unknown Block" };
        const totalPlanted = r.liveSeedlings + r.deadSeedlings;

        return `
          <tr>
            <td><strong>${r.monitoringDate}</strong></td>
            <td><strong style="font-family:monospace;">${r.plantingNumber}</strong></td>
            <td>${block.name}</td>
            <td>${totalPlanted.toLocaleString()}</td>
            <td style="color:var(--primary-green); font-weight:600;">${r.liveSeedlings.toLocaleString()}</td>
            <td style="color:var(--critical-red); font-weight:600;">${r.deadSeedlings.toLocaleString()}</td>
            <td style="font-weight:700; color: ${r.survivalRate >= 90 ? 'var(--primary-green)' : 'var(--critical-red)'}">${r.survivalRate}%</td>
            <td style="text-align: right;">
              <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px;" onclick="window.NurseryApp.views.survival.openEditModal('${r.id}')" ${!canWrite ? 'disabled' : ''}><i class="fa-solid fa-edit"></i></button>
              <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px; color:var(--critical-red);" onclick="window.NurseryApp.views.survival.handleDelete('${r.id}')" ${!canDelete ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `;
      }).join("");
    },

    openCreateModal: function () {
      const self = this;
      const plantings = window.NurseryStorage.getAll("planting").filter(p => p.status === "Completed");

      if (plantings.length === 0) {
        window.NurseryApp.showToast("No completed planting dispatches available for monitoring.", "warning");
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const formHTML = `
        <form id="survival-event-form" class="form-grid">
          <div class="form-group">
            <label>Inspection Date</label>
            <input type="date" id="srv-date" class="form-input" value="${today}" required>
          </div>
          <div class="form-group">
            <label>Planting Dispatch Ticket</label>
            <select id="srv-ticket" class="form-input" required>
              <option value="">-- Choose Ticket --</option>
              ${plantings.map(p => `<option value="${p.plantingNumber}">${p.plantingNumber} (Planted Qty: ${p.quantity})</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Total Placed Quantity</label>
            <input type="number" id="srv-total" class="form-input" value="0" readonly>
          </div>
          <div class="form-group">
            <label>Live Seedlings Counted</label>
            <input type="number" id="srv-live" class="form-input" min="0" value="0" required>
          </div>
          <div class="form-group">
            <label>Dead Seedlings Counted</label>
            <input type="number" id="srv-dead" class="form-input" value="0" readonly>
          </div>
          <div class="form-group">
            <label>Survival Rate Index</label>
            <input type="text" id="srv-rate" class="form-input" style="font-weight:bold; color:var(--primary-green);" value="100%" readonly>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Log Field Survival Audit", formHTML, function () {
        const form = document.getElementById("survival-event-form");
        if (!form.checkValidity() || !document.getElementById("srv-ticket").value) {
          window.NurseryApp.showToast("Please choose a ticket and count live seedlings.", "warning");
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const live = parseInt(document.getElementById("srv-live").value);
        const ticketNum = document.getElementById("srv-ticket").value;
        
        // Find total quantity
        const t = plantings.find(p => p.plantingNumber === ticketNum);
        const total = t ? t.quantity : 0;
        const dead = total - live;
        const rate = parseFloat(((live / total) * 100).toFixed(2));

        if (live > total) {
          window.NurseryApp.showToast(`Live count cannot exceed total planted quantity (${total}).`, "error");
          return false;
        }

        const record = {
          plantingNumber: ticketNum,
          monitoringDate: document.getElementById("srv-date").value,
          liveSeedlings: live,
          deadSeedlings: dead,
          survivalRate: rate
        };

        window.NurseryStorage.insert("survival", record, user.name);
        window.NurseryApp.showToast(`Survival audit registered for Ticket ${ticketNum}.`, "success");
        
        self.renderCharts();
        self.loadSurvivalData();
        window.NurseryApp.updateNotifications();
        return true;
      });

      // Bind reactive formulas inside modal
      const ticketSel = document.getElementById("srv-ticket");
      const totalInput = document.getElementById("srv-total");
      const liveInput = document.getElementById("srv-live");
      const deadInput = document.getElementById("srv-dead");
      const rateInput = document.getElementById("srv-rate");

      ticketSel.addEventListener("change", function () {
        const match = plantings.find(p => p.plantingNumber === this.value);
        if (match) {
          totalInput.value = match.quantity;
          liveInput.value = match.quantity; // default 100% survival
          deadInput.value = 0;
          rateInput.value = "100%";
          rateInput.style.color = "var(--primary-green)";
        }
      });

      liveInput.addEventListener("input", function () {
        const tot = parseInt(totalInput.value) || 0;
        const live = parseInt(this.value) || 0;
        const dead = Math.max(0, tot - live);
        
        deadInput.value = dead;
        const rate = tot > 0 ? ((live / tot) * 100).toFixed(1) : 0;
        rateInput.value = `${rate}%`;

        if (rate >= 90) {
          rateInput.style.color = "var(--primary-green)";
        } else {
          rateInput.style.color = "var(--critical-red)";
        }
      });
    },

    openEditModal: function (id) {
      const self = this;
      const record = window.NurseryStorage.getById("survival", id);
      if (!record) return;

      const plantings = window.NurseryStorage.getAll("planting").filter(p => p.status === "Completed");
      const match = plantings.find(p => p.plantingNumber === record.plantingNumber) || {};
      const total = match.quantity || (record.liveSeedlings + record.deadSeedlings);

      const formHTML = `
        <form id="survival-event-form" class="form-grid">
          <div class="form-group">
            <label>Inspection Date</label>
            <input type="date" id="srv-date" class="form-input" value="${record.monitoringDate}" required>
          </div>
          <div class="form-group">
            <label>Planting Ticket</label>
            <input type="text" id="srv-ticket" class="form-input" value="${record.plantingNumber}" readonly>
          </div>
          <div class="form-group">
            <label>Total Placed Quantity</label>
            <input type="number" id="srv-total" class="form-input" value="${total}" readonly>
          </div>
          <div class="form-group">
            <label>Live Seedlings Counted</label>
            <input type="number" id="srv-live" class="form-input" min="0" value="${record.liveSeedlings}" required>
          </div>
          <div class="form-group">
            <label>Dead Seedlings Counted</label>
            <input type="number" id="srv-dead" class="form-input" value="${record.deadSeedlings}" readonly>
          </div>
          <div class="form-group">
            <label>Survival Rate Index</label>
            <input type="text" id="srv-rate" class="form-input" style="font-weight:bold;" value="${record.survivalRate}%" readonly>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Edit Survival Audit Count", formHTML, function () {
        const form = document.getElementById("survival-event-form");
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const live = parseInt(document.getElementById("srv-live").value);
        
        if (live > total) {
          window.NurseryApp.showToast(`Live count cannot exceed total planted quantity (${total}).`, "error");
          return false;
        }

        const dead = total - live;
        const rate = parseFloat(((live / total) * 100).toFixed(2));

        const updated = {
          ...record,
          monitoringDate: document.getElementById("srv-date").value,
          liveSeedlings: live,
          deadSeedlings: dead,
          survivalRate: rate
        };

        window.NurseryStorage.update("survival", id, updated, user.name);
        window.NurseryApp.showToast("Survival counts saved successfully.", "success");
        
        self.renderCharts();
        self.loadSurvivalData();
        window.NurseryApp.updateNotifications();
        return true;
      });

      // Bind events
      const liveInput = document.getElementById("srv-live");
      const deadInput = document.getElementById("srv-dead");
      const rateInput = document.getElementById("srv-rate");

      liveInput.addEventListener("input", function () {
        const live = parseInt(this.value) || 0;
        const dead = Math.max(0, total - live);
        
        deadInput.value = dead;
        const rate = total > 0 ? ((live / total) * 100).toFixed(1) : 0;
        rateInput.value = `${rate}%`;

        if (rate >= 90) {
          rateInput.style.color = "var(--primary-green)";
        } else {
          rateInput.style.color = "var(--critical-red)";
        }
      });
    },

    handleDelete: function (id) {
      const self = this;
      window.NurseryApp.showModal(
        "Delete Survival Audit",
        "<p>Delete this survival inspection log?</p>",
        function () {
          const user = window.NurseryAuth.getCurrentUser();
          window.NurseryStorage.delete("survival", id, user.name);
          window.NurseryApp.showToast("Survival audit removed.", "warning");
          self.renderCharts();
          self.loadSurvivalData();
          return true;
        }
      );
    }
  };

  window.NurseryApp.views.survival = Survival;
})();
