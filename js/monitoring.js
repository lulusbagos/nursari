/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - GROWTH MONITORING
 * Tracks seedling heights, diameters, leaf health conditions, with timeline and mock photo upload.
 */

(function () {
  const Monitoring = {
    selectedBatch: "",
    growthChart: null,
    uploadedPhotoBase64: "",

    init: function () {
      const inventory = window.NurseryStorage.getAll("inventory");
      // Pre-select first healthy batch if not set
      if (!this.selectedBatch && inventory.length > 0) {
        const active = inventory.find(i => i.status !== "Dead");
        this.selectedBatch = active ? active.batchNumber : inventory[0].batchNumber;
      }
      this.renderLayout();
      this.renderBatchSelector();
      this.renderGrowthData();
    },

    renderLayout: function () {
      const container = document.getElementById("view-monitoring");
      if (!container) return;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-wrap">
            <h1>Growth Monitoring Log</h1>
            <p>Audit seedling height growth, stem diameter, and leaf health anomalies</p>
          </div>
          <div>
            <button class="btn btn-primary" id="btn-log-monitoring">
              <i class="fa-solid fa-square-poll-vertical"></i> Log New Inspection
            </button>
          </div>
        </div>

        <!-- BATCH SELECTOR DECK -->
        <div class="dashboard-card" style="padding: 16px 20px; margin-bottom: 24px;">
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            <label style="font-weight:600; font-size:14px; color:var(--text-light);">Select Inventory Batch:</label>
            <select id="monitoring-batch-select" class="select-filter" style="min-width: 250px;">
              <!-- Dynamically populated -->
            </select>
            <div id="monitoring-batch-badge-status"></div>
          </div>
        </div>

        <!-- GROWTH TIMELINE & CHART ROW -->
        <div class="dashboard-grid">
          
          <!-- Height Trend Chart -->
          <div class="dashboard-card col-6">
            <div class="card-header">
              <span class="card-title">Batch Growth Height/Diameter Curve</span>
            </div>
            <div class="chart-container" style="height: 300px;">
              <canvas id="monitoring-growth-curve-canvas"></canvas>
            </div>
          </div>

          <!-- Chronological Timeline -->
          <div class="dashboard-card col-6" style="max-height: 400px; overflow-y:auto;">
            <div class="card-header" style="position: sticky; top:0; background: var(--card-bg); z-index:2; margin-bottom: 10px;">
              <span class="card-title">Inspection Timeline</span>
            </div>
            <div class="timeline" id="monitoring-growth-timeline">
              <!-- Dynamically populated timeline -->
            </div>
          </div>
        </div>

        <!-- MASTER LIST OF ALL INSPECTIONS -->
        <div class="dashboard-card col-12" style="margin-top:20px;">
          <div class="card-header">
            <span class="card-title">All System Inspections Logs</span>
          </div>
          <div class="table-wrapper">
            <table class="custom-table" id="monitoring-all-logs-table">
              <thead>
                <tr>
                  <th>Inspection Date</th>
                  <th>Batch Number</th>
                  <th>Height (cm)</th>
                  <th>Diameter (cm)</th>
                  <th>Leaf Condition</th>
                  <th>Health Rating Score</th>
                  <th>Inspector Notes</th>
                  <th>Visual Reference</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="monitoring-all-logs-tbody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>
      `;

      const self = this;
      document.getElementById("btn-log-monitoring").addEventListener("click", () => self.openCreateModal());
      document.getElementById("monitoring-batch-select").addEventListener("change", function () {
        self.selectedBatch = this.value;
        self.renderGrowthData();
      });
    },

    renderBatchSelector: function () {
      const select = document.getElementById("monitoring-batch-select");
      if (!select) return;

      const inventory = window.NurseryStorage.getAll("inventory");
      // Sort batches by number
      inventory.sort((a,b) => a.batchNumber.localeCompare(b.batchNumber));

      select.innerHTML = inventory.map(i => `<option value="${i.batchNumber}" ${i.batchNumber === this.selectedBatch ? 'selected' : ''}>${i.batchNumber} - ${i.status}</option>`).join("");
    },

    renderGrowthData: function () {
      this.renderTimeline();
      this.renderGrowthChart();
      this.renderAllLogsTable();
      this.updateBatchBadge();
    },

    updateBatchBadge: function () {
      const badge = document.getElementById("monitoring-batch-badge-status");
      if (!badge) return;

      const inventory = window.NurseryStorage.getAll("inventory");
      const batch = inventory.find(i => i.batchNumber === this.selectedBatch);
      if (batch) {
        badge.innerHTML = `<span class="status-badge ${batch.status.toLowerCase().replace(/ /g, '')}">${batch.status} | ${batch.currentQuantity} seedlings</span>`;
      } else {
        badge.innerHTML = "";
      }
    },

    renderTimeline: function () {
      const timelineDiv = document.getElementById("monitoring-growth-timeline");
      if (!timelineDiv) return;

      const logs = window.NurseryStorage.getAll("monitoring").filter(m => m.batchNumber === this.selectedBatch);
      // Sort newest first
      logs.sort((a, b) => new Date(b.monitoringDate) - new Date(a.monitoringDate));

      if (logs.length === 0) {
        timelineDiv.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:12px;">No growth records for this batch. Click "Log New Inspection" to log data.</div>`;
        return;
      }

      timelineDiv.innerHTML = logs.map(m => {
        let photoHTML = "";
        if (m.photo) {
          photoHTML = `<div style="margin-top:10px;"><img src="${m.photo}" class="photo-preview" style="max-height:80px; border-radius:4px;"></div>`;
        }

        return `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-card">
              <div class="timeline-date">${m.monitoringDate}</div>
              <div class="timeline-content">
                <h4>Height: <strong>${m.height} cm</strong> | Stem Diameter: <strong>${m.diameter} cm</strong></h4>
                <p><strong>Leaf Condition:</strong> ${m.leafCondition} | <strong>Bio-Health Index:</strong> <span style="font-weight:700; color: ${m.healthScore >= 90 ? 'var(--primary-green)' : m.healthScore >= 70 ? 'var(--warning-yellow)' : 'var(--critical-red)'}">${m.healthScore}%</span></p>
                <p style="margin-top:5px; font-style:italic;">"${m.notes}"</p>
                ${photoHTML}
              </div>
            </div>
          </div>
        `;
      }).join("");
    },

    renderGrowthChart: function () {
      const canvas = document.getElementById("monitoring-growth-curve-canvas");
      if (!canvas) return;

      const logs = window.NurseryStorage.getAll("monitoring").filter(m => m.batchNumber === this.selectedBatch);
      // Sort oldest first for chronological chart plotting
      logs.sort((a, b) => new Date(a.monitoringDate) - new Date(b.monitoringDate));

      const labels = logs.map(l => l.monitoringDate);
      const heights = logs.map(l => l.height);
      const diameters = logs.map(l => parseFloat(l.diameter) || 0);

      if (this.growthChart) {
        this.growthChart.destroy();
      }

      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const gridColor = isDark ? "#334155" : "#E2E8F0";

      this.growthChart = new Chart(canvas.getContext("2d"), {
        type: 'line',
        data: {
          labels: labels.length > 0 ? labels : ["No Data"],
          datasets: [
            {
              label: 'Height (cm)',
              data: heights.length > 0 ? heights : [0],
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              yAxisID: 'yHeight',
              fill: true,
              tension: 0.3
            },
            {
              label: 'Stem Diameter (cm)',
              data: diameters.length > 0 ? diameters : [0],
              borderColor: '#FF7043',
              yAxisID: 'yDiameter',
              fill: false,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            yHeight: {
              type: 'linear',
              position: 'left',
              title: { display: true, text: 'Height (cm)' },
              grid: { color: gridColor }
            },
            yDiameter: {
              type: 'linear',
              position: 'right',
              title: { display: true, text: 'Stem Diameter (cm)' },
              grid: { drawOnChartArea: false } // Only draw grid for left axis
            }
          }
        }
      });
    },

    renderAllLogsTable: function () {
      const tbody = document.getElementById("monitoring-all-logs-tbody");
      if (!tbody) return;

      const logs = window.NurseryStorage.getAll("monitoring");
      logs.sort((a,b) => new Date(b.monitoringDate) - new Date(a.monitoringDate));

      const canWrite = window.NurseryAuth.hasPermission("monitoring", "write");
      const canDelete = window.NurseryAuth.hasPermission("monitoring", "delete");

      if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:var(--text-muted);">No monitoring logs recorded.</td></tr>`;
        return;
      }

      tbody.innerHTML = logs.map(m => {
        const photoRef = m.photo ? `<i class="fa-solid fa-image" style="color:var(--primary-green); font-size:16px; cursor:pointer;" onclick="window.NurseryApp.views.monitoring.openPhotoModal('${m.id}')" title="View Image"></i>` : `<span style="color:var(--text-muted); font-size:11px;">No Photo</span>`;

        return `
          <tr>
            <td><strong>${m.monitoringDate}</strong></td>
            <td><a href="#" style="color:var(--primary-green); font-weight:700;" onclick="window.NurseryApp.views.monitoring.selectBatchNumber('${m.batchNumber}'); event.preventDefault();">${m.batchNumber}</a></td>
            <td>${m.height} cm</td>
            <td>${m.diameter} cm</td>
            <td>${m.leafCondition}</td>
            <td><strong>${m.healthScore}%</strong></td>
            <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${m.notes}">${m.notes}</td>
            <td>${photoRef}</td>
            <td style="text-align: right;">
              <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px;" onclick="window.NurseryApp.views.monitoring.openEditModal('${m.id}')" ${!canWrite ? 'disabled' : ''}><i class="fa-solid fa-edit"></i></button>
              <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px; color:var(--critical-red);" onclick="window.NurseryApp.views.monitoring.handleDelete('${m.id}')" ${!canDelete ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `;
      }).join("");
    },

    selectBatchNumber: function (batch) {
      this.selectedBatch = batch;
      document.getElementById("monitoring-batch-select").value = batch;
      this.renderGrowthData();
    },

    openPhotoModal: function (id) {
      const log = window.NurseryStorage.getById("monitoring", id);
      if (!log || !log.photo) return;

      window.NurseryApp.showModal(
        `Visual reference: Batch ${log.batchNumber} (${log.monitoringDate})`,
        `<div style="text-align:center;"><img src="${log.photo}" style="max-width:100%; border-radius: var(--border-radius-md); box-shadow:var(--shadow-md);"></div>`,
        null, null, "Close View"
      );
    },

    openCreateModal: function () {
      const self = this;
      const inventory = window.NurseryStorage.getAll("inventory");
      const activeBatches = inventory.filter(i => i.status !== "Dead");

      const today = new Date().toISOString().split('T')[0];
      self.uploadedPhotoBase64 = "";

      const formHTML = `
        <form id="monitoring-event-form" class="form-grid">
          <div class="form-group">
            <label>Batch Number</label>
            <select id="mon-batch" class="form-input" required>
              ${activeBatches.map(i => `<option value="${i.batchNumber}" ${i.batchNumber === this.selectedBatch ? 'selected' : ''}>${i.batchNumber}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Inspection Date</label>
            <input type="date" id="mon-date" class="form-input" value="${today}" required>
          </div>
          <div class="form-group">
            <label>Height (cm)</label>
            <input type="number" id="mon-height" class="form-input" min="1" value="20" required>
          </div>
          <div class="form-group">
            <label>Stem Diameter (cm)</label>
            <input type="number" id="mon-diameter" class="form-input" step="0.01" min="0.1" value="1.5" required>
          </div>
          <div class="form-group">
            <label>Leaf Condition</label>
            <select id="mon-leaf" class="form-input">
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Slightly Yellow">Slightly Yellow</option>
              <option value="Wilted">Wilted</option>
              <option value="Pest Spotted">Pest Spotted</option>
            </select>
          </div>
          <div class="form-group">
            <label>Health Rating Score (0 - 100)</label>
            <input type="number" id="mon-score" class="form-input" min="0" max="100" value="95" required>
          </div>
          <div class="form-group col-span-2">
            <label>Inspection Notes</label>
            <textarea id="mon-notes" class="form-input" style="height:60px;" placeholder="Describe leaf spot counts, stem nodes condition..."></textarea>
          </div>
          <div class="form-group col-span-2">
            <label>Camera Reference Photo (Base64 File)</label>
            <div class="photo-uploader" id="photo-drop-zone">
              <i class="fa-solid fa-cloud-arrow-up" style="font-size:24px; color:var(--text-light);"></i>
              <p style="font-size:12px; margin-top:5px; color:var(--text-muted);">Choose photo image (Max 500KB for LocalStorage safety)</p>
              <input type="file" id="mon-file-picker" style="display:none;" accept="image/*">
              <img id="mon-image-preview-box" class="photo-preview" style="display:none;">
            </div>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Log Growth Inspection", formHTML, function () {
        const form = document.getElementById("monitoring-event-form");
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const batchNum = document.getElementById("mon-batch").value;
        const height = parseInt(document.getElementById("mon-height").value);
        const score = parseInt(document.getElementById("mon-score").value);

        const record = {
          monitoringDate: document.getElementById("mon-date").value,
          batchNumber: batchNum,
          height: height,
          diameter: document.getElementById("mon-diameter").value,
          leafCondition: document.getElementById("mon-leaf").value,
          healthScore: score,
          notes: document.getElementById("mon-notes").value,
          photo: self.uploadedPhotoBase64
        };

        window.NurseryStorage.insert("monitoring", record, user.name);

        // Update active height & status in seedling inventory if height exceeds ready thresholds
        const invs = window.NurseryStorage.getAll("inventory");
        const invIdx = invs.findIndex(i => i.batchNumber === batchNum);
        if (invIdx !== -1) {
          const invObj = invs[invIdx];
          invObj.height = height;
          
          // Determine status from health score and height
          if (score < 70) {
            invObj.status = "Monitoring"; // critical health drops status to active monitoring
          } else if (height >= 40) {
            invObj.status = "Ready To Plant";
          } else {
            invObj.status = "Healthy";
          }
          window.NurseryStorage.update("inventory", invObj.id, invObj, user.name);
        }

        window.NurseryApp.showToast(`Growth logged successfully for Batch ${batchNum}.`, "success");
        
        self.selectedBatch = batchNum;
        self.renderGrowthData();
        return true;
      });

      // Bind Uploader inside modal
      const dropZone = document.getElementById("photo-drop-zone");
      const picker = document.getElementById("mon-file-picker");
      const preview = document.getElementById("mon-image-preview-box");

      dropZone.addEventListener("click", () => picker.click());
      picker.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 512000) {
            window.NurseryApp.showToast("Image size exceeds 500KB limitation. Please upload smaller references.", "warning");
            return;
          }
          const reader = new FileReader();
          reader.onload = function (evt) {
            self.uploadedPhotoBase64 = evt.target.result;
            preview.src = evt.target.result;
            preview.style.display = "block";
            dropZone.querySelector("i").style.display = "none";
            dropZone.querySelector("p").style.display = "none";
          };
          reader.readAsDataURL(file);
        }
      });
    },

    openEditModal: function (id) {
      const self = this;
      const record = window.NurseryStorage.getById("monitoring", id);
      if (!record) return;

      self.uploadedPhotoBase64 = record.photo || "";

      const formHTML = `
        <form id="monitoring-event-form" class="form-grid">
          <div class="form-group">
            <label>Batch Number</label>
            <input type="text" id="mon-batch" class="form-input" value="${record.batchNumber}" readonly>
          </div>
          <div class="form-group">
            <label>Inspection Date</label>
            <input type="date" id="mon-date" class="form-input" value="${record.monitoringDate}" required>
          </div>
          <div class="form-group">
            <label>Height (cm)</label>
            <input type="number" id="mon-height" class="form-input" min="1" value="${record.height}" required>
          </div>
          <div class="form-group">
            <label>Stem Diameter (cm)</label>
            <input type="number" id="mon-diameter" class="form-input" step="0.01" value="${record.diameter}" required>
          </div>
          <div class="form-group">
            <label>Leaf Condition</label>
            <select id="mon-leaf" class="form-input">
              <option value="Excellent" ${record.leafCondition === 'Excellent' ? 'selected' : ''}>Excellent</option>
              <option value="Good" ${record.leafCondition === 'Good' ? 'selected' : ''}>Good</option>
              <option value="Slightly Yellow" ${record.leafCondition === 'Slightly Yellow' ? 'selected' : ''}>Slightly Yellow</option>
              <option value="Wilted" ${record.leafCondition === 'Wilted' ? 'selected' : ''}>Wilted</option>
              <option value="Pest Spotted" ${record.leafCondition === 'Pest Spotted' ? 'selected' : ''}>Pest Spotted</option>
            </select>
          </div>
          <div class="form-group">
            <label>Health Rating Score</label>
            <input type="number" id="mon-score" class="form-input" min="0" max="100" value="${record.healthScore}" required>
          </div>
          <div class="form-group col-span-2">
            <label>Inspection Notes</label>
            <textarea id="mon-notes" class="form-input" style="height:60px;">${record.notes}</textarea>
          </div>
          <div class="form-group col-span-2">
            <label>Camera Reference Photo (Base64 File)</label>
            <div class="photo-uploader" id="photo-drop-zone">
              <input type="file" id="mon-file-picker" style="display:none;" accept="image/*">
              <img id="mon-image-preview-box" class="photo-preview" src="${record.photo || ''}" style="${record.photo ? 'display:block;' : 'display:none;'}">
              <i class="fa-solid fa-cloud-arrow-up" style="font-size:24px; color:var(--text-light); ${record.photo ? 'display:none;' : ''}"></i>
              <p style="font-size:12px; margin-top:5px; color:var(--text-muted); ${record.photo ? 'display:none;' : ''}">Choose photo image (Max 500KB)</p>
            </div>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Edit Growth Inspection Details", formHTML, function () {
        const form = document.getElementById("monitoring-event-form");
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const updated = {
          ...record,
          monitoringDate: document.getElementById("mon-date").value,
          height: parseInt(document.getElementById("mon-height").value),
          diameter: document.getElementById("mon-diameter").value,
          leafCondition: document.getElementById("mon-leaf").value,
          healthScore: parseInt(document.getElementById("mon-score").value),
          notes: document.getElementById("mon-notes").value,
          photo: self.uploadedPhotoBase64
        };

        window.NurseryStorage.update("monitoring", id, updated, user.name);
        window.NurseryApp.showToast("Inspection logs updated successfully.", "success");
        self.renderGrowthData();
        return true;
      });

      // Bind Uploader inside modal
      const dropZone = document.getElementById("photo-drop-zone");
      const picker = document.getElementById("mon-file-picker");
      const preview = document.getElementById("mon-image-preview-box");

      dropZone.addEventListener("click", () => picker.click());
      picker.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 512000) {
            window.NurseryApp.showToast("Image size exceeds 500KB limitation.", "warning");
            return;
          }
          const reader = new FileReader();
          reader.onload = function (evt) {
            self.uploadedPhotoBase64 = evt.target.result;
            preview.src = evt.target.result;
            preview.style.display = "block";
            dropZone.querySelector("i").style.display = "none";
            dropZone.querySelector("p").style.display = "none";
          };
          reader.readAsDataURL(file);
        }
      });
    },

    handleDelete: function (id) {
      const self = this;
      window.NurseryApp.showModal(
        "Delete Growth Inspection Entry",
        "<p>Are you sure you want to delete this monitoring record? Historical curves will adjust automatically.</p>",
        function () {
          const user = window.NurseryAuth.getCurrentUser();
          window.NurseryStorage.delete("monitoring", id, user.name);
          window.NurseryApp.showToast("Growth monitoring entry deleted.", "warning");
          self.renderGrowthData();
          return true;
        }
      );
    }
  };

  window.NurseryApp.views.monitoring = Monitoring;
})();
