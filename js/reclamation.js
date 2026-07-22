/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - RECLAMATION MANAGEMENT
 * Tracks reclamation plot targets, yearly scheduling, and seedling transplant actuals.
 */

(function () {
  const Reclamation = {
    compareChart: null,

    init: function () {
      this.renderLayout();
      this.renderCharts();
      this.loadReclamationData();
    },

    renderLayout: function () {
      const container = document.getElementById("view-reclamation");
      if (!container) return;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-wrap">
            <h1>Reclamation & Soil Rehabilitation Targets</h1>
            <p>Annual mine reclamation scheduling registry. ESG rehabilitation compliance oversight</p>
          </div>
          <div>
            <button class="btn btn-primary" id="btn-create-reclamation" ${!window.NurseryAuth.hasPermission("reclamation", "write") ? 'disabled' : ''}>
              <i class="fa-solid fa-mountain-sun"></i> Add Reclamation Area Target
            </button>
          </div>
        </div>

        <!-- RECLAMATION OVERVIEW CARDS -->
        <div class="kpi-grid">
          <div class="kpi-card blue">
            <div class="kpi-header">
              <span class="kpi-title">Total Target Hectares</span>
              <i class="fa-solid fa-map kpi-icon"></i>
            </div>
            <div class="kpi-value" id="rec-kpi-hectares">0 Ha</div>
            <div class="kpi-subtext">Sum of target dump zones</div>
          </div>

          <div class="kpi-card blue">
            <div class="kpi-header">
              <span class="kpi-title">Seedling Targets</span>
              <i class="fa-solid fa-flag-checkered kpi-icon"></i>
            </div>
            <div class="kpi-value" id="rec-kpi-target">0</div>
            <div class="kpi-subtext">Accumulated targets</div>
          </div>

          <div class="kpi-card green">
            <div class="kpi-header">
              <span class="kpi-title">Actual Seeded</span>
              <i class="fa-solid fa-tree kpi-icon" style="color: var(--success-green);"></i>
            </div>
            <div class="kpi-value" id="rec-kpi-actual">0</div>
            <div class="kpi-subtext">Verified transplanted count</div>
          </div>

          <div class="kpi-card green">
            <div class="kpi-header">
              <span class="kpi-title">Completion index</span>
              <i class="fa-solid fa-chart-line kpi-icon" style="color: var(--primary-green);"></i>
            </div>
            <div class="kpi-value" id="rec-kpi-completion">0%</div>
            <div class="kpi-subtext">Weighted progress rate</div>
          </div>
        </div>

        <!-- CHARTS SECTION -->
        <div class="dashboard-grid">
          <div class="dashboard-card col-8">
            <div class="card-header">
              <span class="card-title">Target vs Actual Rehabilitation Seedlings</span>
            </div>
            <div class="chart-container" style="height: 220px;">
              <canvas id="reclamation-target-actual-chart"></canvas>
            </div>
          </div>

          <!-- MOCK OUTLINE MAP -->
          <div class="dashboard-card col-4">
            <div class="card-header">
              <span class="card-title">Mining Sector Zoning map</span>
            </div>
            <div style="background:var(--bg-gray); flex:1; border-radius: var(--border-radius-md); display:flex; flex-direction:column; justify-content:center; align-items:center; border: 1px dashed var(--border-color); text-align:center; padding: 15px;">
              <i class="fa-solid fa-map-marked-alt" style="font-size:32px; color:var(--text-light); margin-bottom:10px;"></i>
              <h5 style="margin: 0; font-weight:600;">Sector Pit Dump Plots Active</h5>
              <p style="font-size:11px; color:var(--text-muted); margin-top:5px;">Block coordinates synced with GPS tracking tags on field planting logs.</p>
            </div>
          </div>
        </div>

        <!-- RECLAMATION LIST -->
        <div class="dashboard-card col-12" style="margin-top:20px;">
          <div class="card-header">
            <span class="card-title">Active Reclamation Campaigns</span>
          </div>
          <div class="table-wrapper">
            <table class="custom-table" id="reclamation-table">
              <thead>
                <tr>
                  <th>Reclamation Area Location</th>
                  <th>Area Size (Ha)</th>
                  <th>Campaign Year</th>
                  <th>Target Seedlings</th>
                  <th>Actual Seedlings</th>
                  <th>Completion Progress (%)</th>
                  <th style="text-align: right; width: 120px;">Actions</th>
                </tr>
              </thead>
              <tbody id="reclamation-tbody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>
      `;

      const self = this;
      document.getElementById("btn-create-reclamation").addEventListener("click", () => self.openCreateModal());
    },

    renderCharts: function () {
      const data = window.NurseryStorage.getAll("reclamation");

      // Calculate totals
      const totalHa = data.reduce((sum, item) => sum + item.areaSize, 0);
      const totalTarget = data.reduce((sum, item) => sum + item.targetSeedlings, 0);
      const totalActual = data.reduce((sum, item) => sum + item.actualSeedlings, 0);
      const overallCompletion = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : 0;

      document.getElementById("rec-kpi-hectares").textContent = `${totalHa.toFixed(1)} Ha`;
      document.getElementById("rec-kpi-target").textContent = totalTarget.toLocaleString();
      document.getElementById("rec-kpi-actual").textContent = totalActual.toLocaleString();
      document.getElementById("rec-kpi-completion").textContent = `${overallCompletion}%`;

      // Chart: Target vs Actual
      const ctx = document.getElementById("reclamation-target-actual-chart").getContext("2d");
      const labels = data.slice(0, 6).map(r => r.reclamationArea.substring(0, 15) + "...");
      const targets = data.slice(0, 6).map(r => r.targetSeedlings);
      const actuals = data.slice(0, 6).map(r => r.actualSeedlings);

      if (this.compareChart) this.compareChart.destroy();
      this.compareChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            { label: 'Target Seedlings', data: targets, backgroundColor: '#CFD8DC' },
            { label: 'Actual Seeded', data: actuals, backgroundColor: '#4CAF50' }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } }
        }
      });
    },

    loadReclamationData: function () {
      const tbody = document.getElementById("reclamation-tbody");
      if (!tbody) return;

      const data = window.NurseryStorage.getAll("reclamation");
      data.sort((a,b) => b.year - a.year); // Sort by year descending

      const canWrite = window.NurseryAuth.hasPermission("reclamation", "write");
      const canDelete = window.NurseryAuth.hasPermission("reclamation", "delete");

      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-muted);">No reclamation campaigns registered.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.map(r => {
        const rate = r.completionRate || 0;
        const progressClass = rate >= 100 ? 'completed' : rate >= 50 ? 'ongoing' : 'planned';
        const progressText = rate >= 100 ? 'Completed' : rate >= 50 ? 'On Track' : 'Lagging';

        return `
          <tr>
            <td><strong>${r.reclamationArea}</strong></td>
            <td>${r.areaSize} Hectares</td>
            <td><strong>${r.year}</strong></td>
            <td>${r.targetSeedlings.toLocaleString()}</td>
            <td style="font-weight:600;">${r.actualSeedlings.toLocaleString()}</td>
            <td>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="status-badge ${progressClass}" style="width:70px; text-align:center;">${rate}%</span>
                <span style="font-size:11px; color:var(--text-light); font-weight:600;">${progressText}</span>
              </div>
            </td>
            <td style="text-align: right;">
              <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px;" onclick="window.NurseryApp.views.reclamation.openEditModal('${r.id}')" ${!canWrite ? 'disabled' : ''}><i class="fa-solid fa-edit"></i></button>
              <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px; color:var(--critical-red);" onclick="window.NurseryApp.views.reclamation.handleDelete('${r.id}')" ${!canDelete ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `;
      }).join("");
    },

    openCreateModal: function () {
      const self = this;
      const thisYear = new Date().getFullYear();

      const formHTML = `
        <form id="reclamation-event-form" class="form-grid">
          <div class="form-group col-span-2">
            <label>Reclamation Area / Dump Zone Location</label>
            <input type="text" id="rec-area" class="form-input" placeholder="e.g. Pit 3 East Dump Level 2" required>
          </div>
          <div class="form-group">
            <label>Dump Size (Hectares)</label>
            <input type="number" id="rec-size" class="form-input" step="0.01" value="5.0" required>
          </div>
          <div class="form-group">
            <label>Campaign Year</label>
            <input type="number" id="rec-year" class="form-input" value="${thisYear}" required>
          </div>
          <div class="form-group">
            <label>Target Seedlings quantity</label>
            <input type="number" id="rec-target" class="form-input" min="1" value="3000" required>
          </div>
          <div class="form-group">
            <label>Actual Seedlings planted</label>
            <input type="number" id="rec-actual" class="form-input" min="0" value="0" required>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Add Reclamation Campaign Target", formHTML, function () {
        const form = document.getElementById("reclamation-event-form");
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const target = parseInt(document.getElementById("rec-target").value);
        const actual = parseInt(document.getElementById("rec-actual").value);
        const rate = parseFloat(((actual / target) * 100).toFixed(2));

        const record = {
          reclamationArea: document.getElementById("rec-area").value,
          areaSize: parseFloat(document.getElementById("rec-size").value),
          year: parseInt(document.getElementById("rec-year").value),
          targetSeedlings: target,
          actualSeedlings: actual,
          completionRate: rate
        };

        window.NurseryStorage.insert("reclamation", record, user.name);
        window.NurseryApp.showToast("Reclamation campaign target registered.", "success");
        
        self.renderCharts();
        self.loadReclamationData();
        return true;
      });
    },

    openEditModal: function (id) {
      const self = this;
      const record = window.NurseryStorage.getById("reclamation", id);
      if (!record) return;

      const formHTML = `
        <form id="reclamation-event-form" class="form-grid">
          <div class="form-group col-span-2">
            <label>Reclamation Area / Dump Zone Location</label>
            <input type="text" id="rec-area" class="form-input" value="${record.reclamationArea}" required>
          </div>
          <div class="form-group">
            <label>Dump Size (Hectares)</label>
            <input type="number" id="rec-size" class="form-input" step="0.01" value="${record.areaSize}" required>
          </div>
          <div class="form-group">
            <label>Campaign Year</label>
            <input type="number" id="rec-year" class="form-input" value="${record.year}" required>
          </div>
          <div class="form-group">
            <label>Target Seedlings quantity</label>
            <input type="number" id="rec-target" class="form-input" value="${record.targetSeedlings}" required>
          </div>
          <div class="form-group">
            <label>Actual Seedlings planted</label>
            <input type="number" id="rec-actual" class="form-input" value="${record.actualSeedlings}" required>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Edit Reclamation Campaign details", formHTML, function () {
        const form = document.getElementById("reclamation-event-form");
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const target = parseInt(document.getElementById("rec-target").value);
        const actual = parseInt(document.getElementById("rec-actual").value);
        const rate = parseFloat(((actual / target) * 100).toFixed(2));

        const updated = {
          ...record,
          reclamationArea: document.getElementById("rec-area").value,
          areaSize: parseFloat(document.getElementById("rec-size").value),
          year: parseInt(document.getElementById("rec-year").value),
          targetSeedlings: target,
          actualSeedlings: actual,
          completionRate: rate
        };

        window.NurseryStorage.update("reclamation", id, updated, user.name);
        window.NurseryApp.showToast("Reclamation details modified.", "success");
        
        self.renderCharts();
        self.loadReclamationData();
        return true;
      });
    },

    handleDelete: function (id) {
      const self = this;
      window.NurseryApp.showModal(
        "Delete Reclamation Target",
        "<p>Are you sure you want to delete this reclamation targets record? Historical actuals indicators will be removed.</p>",
        function () {
          const user = window.NurseryAuth.getCurrentUser();
          window.NurseryStorage.delete("reclamation", id, user.name);
          window.NurseryApp.showToast("Reclamation campaign target deleted.", "warning");
          self.renderCharts();
          self.loadReclamationData();
          return true;
        }
      );
    }
  };

  window.NurseryApp.views.reclamation = Reclamation;
})();
