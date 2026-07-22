/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - PLANTING LOGS
 * Manages seedling dispatches to reclamation dump pits and integrates with ledger tracking.
 */

(function () {
  const Planting = {
    progressChart: null,

    init: function () {
      this.renderLayout();
      this.renderCharts();
      this.loadPlantingData();
    },

    renderLayout: function () {
      const container = document.getElementById("view-planting");
      if (!container) return;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-wrap">
            <h1>Planting & Reclamation Log</h1>
            <p>Dispatch ready-to-plant seedling stocks, track mine site coordinates, and monitor rehabilitation coverage</p>
          </div>
          <div>
            <button class="btn btn-primary" id="btn-create-planting">
              <i class="fa-solid fa-truck-ramp-box"></i> Dispatch Planting Job
            </button>
          </div>
        </div>

        <!-- PLANTING DASHBOARD -->
        <div class="dashboard-grid">
          
          <!-- Summary card -->
          <div class="dashboard-card col-4">
            <div class="card-header">
              <span class="card-title">Planting Overview</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:15px; padding:10px 0;">
              <div>
                <span style="font-size:11px; text-transform:uppercase; font-weight:700; color:var(--text-light);">Total Transplanted Out</span>
                <h2 style="font-size:32px; font-family:var(--font-title); font-weight:700; color:var(--primary-green);" id="plant-stat-total">0</h2>
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; border-top:1px solid var(--border-color); padding-top:10px;">
                <div>
                  <span style="font-size:10px; color:var(--text-muted);">ONGOING JOBS</span>
                  <h4 style="font-size:16px; font-weight:700; color:var(--warning-yellow);" id="plant-stat-ongoing">0</h4>
                </div>
                <div>
                  <span style="font-size:10px; color:var(--text-muted);">PLANNED SCHEDS</span>
                  <h4 style="font-size:16px; font-weight:700; color:var(--info-blue);" id="plant-stat-planned">0</h4>
                </div>
              </div>
            </div>
          </div>

          <!-- Progress Chart -->
          <div class="dashboard-card col-8">
            <div class="card-header">
              <span class="card-title">Reclamation Block Progress (%)</span>
            </div>
            <div class="chart-container" style="height: 150px;">
              <canvas id="planting-block-progress-chart"></canvas>
            </div>
          </div>

        </div>

        <!-- PLANTING LOGS LIST -->
        <div class="dashboard-card col-12" style="margin-top:20px;">
          <div class="card-header">
            <span class="card-title">Dispatched Planting Tickets</span>
          </div>
          <div class="table-wrapper">
            <table class="custom-table" id="planting-table">
              <thead>
                <tr>
                  <th>Ticket Number</th>
                  <th>Transplant Date</th>
                  <th>Reclamation Block</th>
                  <th>Batch Number</th>
                  <th>Quantity Sent</th>
                  <th>PIC Officer</th>
                  <th>GPS Coordinates</th>
                  <th>Job Status</th>
                  <th style="text-align: right; width: 150px;">Actions</th>
                </tr>
              </thead>
              <tbody id="planting-tbody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>
      `;

      const self = this;
      document.getElementById("btn-create-planting").addEventListener("click", () => self.openCreateModal());
    },

    renderCharts: function () {
      const logs = window.NurseryStorage.getAll("planting");
      const blocks = window.NurseryStorage.getAll("planting_areas");

      // Stats
      const totalSent = logs.filter(l => l.status === "Completed").reduce((sum, item) => sum + item.quantity, 0);
      document.getElementById("plant-stat-total").textContent = totalSent.toLocaleString() + " seedlings";
      document.getElementById("plant-stat-ongoing").textContent = logs.filter(l => l.status === "Ongoing").length;
      document.getElementById("plant-stat-planned").textContent = logs.filter(l => l.status === "Planned").length;

      // Chart: display top blocks completion %
      const ctx = document.getElementById("planting-block-progress-chart").getContext("2d");
      const labels = blocks.slice(0, 5).map(b => b.code);
      const data = blocks.slice(0, 5).map(b => {
        // Sum completed quantity in block
        const completedInBlock = logs.filter(l => l.plantingAreaId === b.id && l.status === "Completed").reduce((sum, item) => sum + item.quantity, 0);
        // Target is arbitrary e.g. size * 800 seedlings/Ha
        const target = Math.round(b.size * 500);
        return Math.min(100, parseFloat(((completedInBlock / target) * 100).toFixed(1)));
      });

      if (this.progressChart) this.progressChart.destroy();
      this.progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Seeded vs Target Hectares (%)',
            data: data,
            backgroundColor: '#81C784'
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { max: 100 } }
        }
      });
    },

    loadPlantingData: function () {
      const tbody = document.getElementById("planting-tbody");
      if (!tbody) return;

      const logs = window.NurseryStorage.getAll("planting");
      const areas = window.NurseryStorage.getAll("planting_areas");

      logs.sort((a,b) => new Date(b.date) - new Date(a.date));

      const canWrite = window.NurseryAuth.hasPermission("planting", "write");
      const canDelete = window.NurseryAuth.hasPermission("planting", "delete");

      if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px; color:var(--text-muted);">No planting logs registered in logs.</td></tr>`;
        return;
      }

      tbody.innerHTML = logs.map(l => {
        const area = areas.find(a => a.id === l.plantingAreaId) || { name: "Unknown" };
        const statusClass = l.status.toLowerCase();

        return `
          <tr>
            <td><strong style="font-family:monospace;">${l.plantingNumber}</strong></td>
            <td><strong>${l.date}</strong></td>
            <td>${area.name}</td>
            <td><a href="#" style="color:var(--primary-green); font-weight:700;" onclick="window.NurseryApp.navigateTo('inventory'); window.NurseryApp.views.inventory.onSearch('${l.batch}'); event.preventDefault();">${l.batch}</a></td>
            <td style="font-weight:700;">${l.quantity.toLocaleString()}</td>
            <td>${l.pic}</td>
            <td><code style="background:var(--bg-gray); padding:4px 8px; border-radius:4px; font-size:11px;">${l.coordinates}</code></td>
            <td><span class="status-badge ${statusClass}">${l.status}</span></td>
            <td style="text-align: right;">
              <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px;" onclick="window.NurseryApp.views.planting.openEditModal('${l.id}')" ${!canWrite ? 'disabled' : ''}><i class="fa-solid fa-edit"></i></button>
              <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px; color:var(--critical-red);" onclick="window.NurseryApp.views.planting.handleDelete('${l.id}')" ${!canDelete ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `;
      }).join("");
    },

    openCreateModal: function () {
      const self = this;
      const inventory = window.NurseryStorage.getAll("inventory");
      const readyBatches = inventory.filter(i => i.currentQuantity > 0 && i.status === "Ready To Plant");
      const blocks = window.NurseryStorage.getAll("planting_areas");

      if (readyBatches.length === 0) {
        window.NurseryApp.showToast("No seedling batches marked 'Ready To Plant'. Seedlings must grow to target height first.", "warning");
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const autoNum = `PLN-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

      const formHTML = `
        <form id="planting-event-form" class="form-grid">
          <div class="form-group">
            <label>Ticket Number</label>
            <input type="text" id="pl-num" class="form-input" value="${autoNum}" readonly>
          </div>
          <div class="form-group">
            <label>Select Ready Batch</label>
            <select id="pl-batch-select" class="form-input" required>
              <option value="">-- Choose Batch --</option>
              ${readyBatches.map(i => `<option value="${i.batchNumber}">${i.batchNumber} (Avail: ${i.currentQuantity})</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Reclamation Area Block</label>
            <select id="pl-block" class="form-input" required>
              ${blocks.map(b => `<option value="${b.id}">${b.name}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Transplant Date</label>
            <input type="date" id="pl-date" class="form-input" value="${today}" required>
          </div>
          <div class="form-group">
            <label>Dispatch Quantity</label>
            <input type="number" id="pl-qty" class="form-input" min="1" value="100" required>
          </div>
          <div class="form-group">
            <label>PIC Officer</label>
            <input type="text" id="pl-pic" class="form-input" placeholder="e.g. Siti Rahma" required>
          </div>
          <div class="form-group col-span-2">
            <label>GPS Coordinate Markers (Lat, Long)</label>
            <input type="text" id="pl-coords" class="form-input" placeholder="e.g. -0.9823, 117.4982" required>
          </div>
          <div class="form-group col-span-2">
            <label>Initial Status</label>
            <select id="pl-status" class="form-input">
              <option value="Planned">Planned (No stock deducted yet)</option>
              <option value="Ongoing">Ongoing (Transporting to field)</option>
              <option value="Completed">Completed (Transplanted out - deduct stock)</option>
            </select>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Dispatch Planting Ticket", formHTML, function () {
        const form = document.getElementById("planting-event-form");
        if (!form.checkValidity() || !document.getElementById("pl-batch-select").value) {
          window.NurseryApp.showToast("Please fill all fields accurately", "warning");
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const batchNum = document.getElementById("pl-batch-select").value;
        const qty = parseInt(document.getElementById("pl-qty").value);
        const status = document.getElementById("pl-status").value;
        const blockId = document.getElementById("pl-block").value;

        // Verify inventory quantity
        const invs = window.NurseryStorage.getAll("inventory");
        const invObj = invs.find(i => i.batchNumber === batchNum);
        if (!invObj || invObj.currentQuantity < qty) {
          window.NurseryApp.showToast(`Insufficient quantity. Available ready: ${invObj ? invObj.currentQuantity : 0}`, "error");
          return false;
        }

        const record = {
          plantingNumber: document.getElementById("pl-num").value,
          plantingAreaId: blockId,
          date: document.getElementById("pl-date").value,
          batch: batchNum,
          quantity: qty,
          pic: document.getElementById("pl-pic").value,
          coordinates: document.getElementById("pl-coords").value,
          status: status
        };

        window.NurseryStorage.insert("planting", record, user.name);

        // If status Completed, deduct stock from inventory
        if (status === "Completed") {
          window.NurseryStorage.addLedgerEntry(
            batchNum,
            "Planting",
            0, qty,
            `Transplanted out seedlings to Block via dispatch ticket ${record.plantingNumber}`,
            new Date(record.date).toISOString()
          );

          // Update reclamation targets automatically
          self.updateReclamationTargets(blockId, qty);
        }

        window.NurseryApp.showToast(`Planting ticket ${record.plantingNumber} logged as ${status}.`, "success");
        self.renderCharts();
        self.loadPlantingData();
        return true;
      });

      // Bind autofill GPS coordinate in modal
      const blockSel = document.getElementById("pl-block");
      const coordsInput = document.getElementById("pl-coords");
      blockSel.addEventListener("change", function () {
        const match = blocks.find(b => b.id === this.value);
        if (match) {
          coordsInput.value = match.coordinates;
        }
      });
      // Initial trigger
      if (blocks.length > 0) {
        coordsInput.value = blocks[0].coordinates;
      }
    },

    openEditModal: function (id) {
      const self = this;
      const record = window.NurseryStorage.getById("planting", id);
      if (!record) return;

      const blocks = window.NurseryStorage.getAll("planting_areas");

      const formHTML = `
        <form id="planting-event-form" class="form-grid">
          <div class="form-group">
            <label>Ticket Number</label>
            <input type="text" id="pl-num" class="form-input" value="${record.plantingNumber}" readonly>
          </div>
          <div class="form-group">
            <label>Batch Number</label>
            <input type="text" id="pl-batch" class="form-input" value="${record.batch}" readonly>
          </div>
          <div class="form-group">
            <label>Reclamation Area Block</label>
            <select id="pl-block" class="form-input" required>
              ${blocks.map(b => `<option value="${b.id}" ${b.id === record.plantingAreaId ? 'selected' : ''}>${b.name}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Transplant Date</label>
            <input type="date" id="pl-date" class="form-input" value="${record.date}" required>
          </div>
          <div class="form-group">
            <label>Dispatch Quantity</label>
            <input type="number" id="pl-qty" class="form-input" value="${record.quantity}" required>
          </div>
          <div class="form-group">
            <label>PIC Officer</label>
            <input type="text" id="pl-pic" class="form-input" value="${record.pic}" required>
          </div>
          <div class="form-group col-span-2">
            <label>GPS Coordinates</label>
            <input type="text" id="pl-coords" class="form-input" value="${record.coordinates}" required>
          </div>
          <div class="form-group col-span-2">
            <label>Job Status</label>
            <select id="pl-status" class="form-input">
              <option value="Planned" ${record.status === 'Planned' ? 'selected' : ''}>Planned</option>
              <option value="Ongoing" ${record.status === 'Ongoing' ? 'selected' : ''}>Ongoing</option>
              <option value="Completed" ${record.status === 'Completed' ? 'selected' : ''}>Completed (Transplant out)</option>
            </select>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Edit Planting Dispatch Ticket", formHTML, function () {
        const form = document.getElementById("planting-event-form");
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const prevStatus = record.status;
        const nextStatus = document.getElementById("pl-status").value;
        const newQty = parseInt(document.getElementById("pl-qty").value);
        const blockId = document.getElementById("pl-block").value;

        // Verify stock adjustments if status flips to completed or qty increases
        const invs = window.NurseryStorage.getAll("inventory");
        const invObj = invs.find(i => i.batchNumber === record.batch);

        if (!invObj) {
          window.NurseryApp.showToast("Seedling batch reference no longer exists.", "error");
          return false;
        }

        // Calculate net change
        let netDeduction = 0;
        if (prevStatus !== "Completed" && nextStatus === "Completed") {
          netDeduction = newQty;
        } else if (prevStatus === "Completed" && nextStatus === "Completed") {
          netDeduction = newQty - record.quantity;
        } else if (prevStatus === "Completed" && nextStatus !== "Completed") {
          netDeduction = -record.quantity; // add back all
        }

        if (invObj.currentQuantity < netDeduction) {
          window.NurseryApp.showToast(`Insufficient quantity. Available ready: ${invObj.currentQuantity + (prevStatus === 'Completed' ? record.quantity : 0)}`, "error");
          return false;
        }

        const updated = {
          ...record,
          plantingAreaId: blockId,
          date: document.getElementById("pl-date").value,
          quantity: newQty,
          pic: document.getElementById("pl-pic").value,
          coordinates: document.getElementById("pl-coords").value,
          status: nextStatus
        };

        window.NurseryStorage.update("planting", id, updated, user.name);

        // Apply ledger changes
        if (netDeduction > 0) {
          window.NurseryStorage.addLedgerEntry(
            record.batch,
            "Planting",
            0, netDeduction,
            `Transplanted out seedlings to Block via updated ticket ${record.plantingNumber}`,
            new Date(updated.date).toISOString()
          );
          self.updateReclamationTargets(blockId, netDeduction);
        } else if (netDeduction < 0) {
          window.NurseryStorage.addLedgerEntry(
            record.batch,
            "Receipt",
            Math.abs(netDeduction), 0,
            `Returned seedling stock from cancelled planting ticket ${record.plantingNumber}`
          );
          self.updateReclamationTargets(blockId, netDeduction);
        }

        window.NurseryApp.showToast("Planting ticket configurations updated.", "success");
        self.renderCharts();
        self.loadPlantingData();
        return true;
      });
    },

    handleDelete: function (id) {
      const self = this;
      const record = window.NurseryStorage.getById("planting", id);
      if (!record) return;

      window.NurseryApp.showModal(
        "Discard Planting Ticket",
        `<p>Are you sure you want to discard planting ticket <strong>${record.plantingNumber}</strong>? If completed, stock will be added back to nursery inventory.</p>`,
        function () {
          const user = window.NurseryAuth.getCurrentUser();

          // Revert stock if was completed
          if (record.status === "Completed") {
            window.NurseryStorage.addLedgerEntry(
              record.batch,
              "Receipt",
              record.quantity, 0,
              `Returned seedling stock due to deletion of completed planting ticket ${record.plantingNumber}`
            );
            self.updateReclamationTargets(record.plantingAreaId, -record.quantity);
          }

          window.NurseryStorage.delete("planting", id, user.name);
          window.NurseryApp.showToast("Planting ticket cleared.", "warning");
          self.renderCharts();
          self.loadPlantingData();
          return true;
        }
      );
    },

    updateReclamationTargets: function (plantingAreaId, qtyChange) {
      // Find matching planting area
      const plantingArea = window.NurseryStorage.getById("planting_areas", plantingAreaId);
      if (!plantingArea) return;

      // Find matching Reclamation record
      // Let's match by name similarities
      const reclamation = window.NurseryStorage.getAll("reclamation");
      const match = reclamation.find(r => r.reclamationArea.toLowerCase().includes(plantingArea.name.replace(/Block \w - /i, '').toLowerCase().substring(0, 10)));
      
      if (match) {
        match.actualSeedlings = Math.max(0, match.actualSeedlings + qtyChange);
        match.completionRate = parseFloat(((match.actualSeedlings / match.targetSeedlings) * 100).toFixed(2));
        window.NurseryStorage.update("reclamation", match.id, match, "System");
      }
    }
  };

  window.NurseryApp.views.planting = Planting;
})();
