/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - VISUAL CULTIVATION PLOT MAP
 * Renders A1-D5 plots, calculating health status and capacities dynamically.
 */

(function () {
  const NurseryMap = {
    init: function () {
      this.renderLayout();
      this.calculatePlotMetrics();
    },

    renderLayout: function () {
      const container = document.getElementById("view-nurserymap");
      if (!container) return;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-wrap">
            <h1>Visual Nursery Map</h1>
            <p>Interactive greenbed grid. Review bio-security status and capacity occupancy in real-time</p>
          </div>
          <div style="display:flex; gap:15px; font-size:12px; align-items:center;">
            <div style="display:flex; align-items:center; gap:6px;"><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color:#4CAF50;"></span> Healthy (&ge;90% Health)</div>
            <div style="display:flex; align-items:center; gap:6px;"><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color:#FBC02D;"></span> Monitoring (70-89% Health)</div>
            <div style="display:flex; align-items:center; gap:6px;"><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color:#D32F2F;"></span> Critical (&lt;70% Health)</div>
          </div>
        </div>

        <div class="dashboard-card" style="padding: 24px;">
          <div class="card-header" style="margin-bottom:10px;">
            <span class="card-title">Greenhouse Sector A1 - D5 Matrix layout</span>
          </div>
          <div class="map-grid" id="nursery-visual-map-grid">
            <!-- Dynamically populated 20 plots -->
          </div>
        </div>
      `;
    },

    calculatePlotMetrics: function () {
      const grid = document.getElementById("nursery-visual-map-grid");
      if (!grid) return;

      const areas = window.NurseryStorage.getAll("nursery_areas");
      const inventory = window.NurseryStorage.getAll("inventory");

      grid.innerHTML = areas.map(area => {
        // Find active inventory in this area (currentQuantity > 0 and status != Dead)
        const activeBatches = inventory.filter(i => i.nurseryAreaId === area.id && i.currentQuantity > 0 && i.status !== "Dead");
        
        const count = activeBatches.reduce((sum, item) => sum + item.currentQuantity, 0);
        const occupancy = parseFloat(((count / area.capacity) * 100).toFixed(1));
        
        // Calculate health %
        const healthyCount = activeBatches.filter(i => i.status === "Healthy" || i.status === "Ready To Plant").reduce((sum, item) => sum + item.currentQuantity, 0);
        const healthRate = count > 0 ? parseFloat(((healthyCount / count) * 100).toFixed(1)) : 100;
        
        // Calculate growth % (average height relative to 40cm target)
        const avgHeight = activeBatches.length > 0 ? (activeBatches.reduce((sum, item) => sum + item.height, 0) / activeBatches.length) : 0;
        const growthRate = Math.min(100, parseFloat(((avgHeight / 40) * 100).toFixed(1)));

        // Color coding
        let badgeColor = "healthy";
        if (count > 0) {
          if (healthRate < 70) badgeColor = "critical";
          else if (healthRate < 90) badgeColor = "monitoring";
        }

        return `
          <div class="plot-card" onclick="window.NurseryApp.views.nurserymap.openPlotDetail('${area.id}')">
            <span class="plot-badge ${badgeColor}"></span>
            <div class="plot-code">${area.code}</div>
            
            <div class="plot-metrics">
              <div class="plot-metric-item">
                <span>Stock:</span>
                <span class="plot-metric-val">${count.toLocaleString()} / ${area.capacity.toLocaleString()}</span>
              </div>
              <div class="plot-metric-item">
                <span>Health:</span>
                <span class="plot-metric-val" style="color: ${badgeColor === 'critical' ? 'var(--critical-red)' : badgeColor === 'monitoring' ? '#B78103' : 'var(--primary-green)'}">${healthRate}%</span>
              </div>
              <div class="plot-metric-item">
                <span>Growth:</span>
                <span class="plot-metric-val">${growthRate}%</span>
              </div>
            </div>

            <div>
              <div class="plot-metric-item" style="font-size:10px; margin-bottom:2px;">
                <span>Occupancy:</span>
                <span>${occupancy}%</span>
              </div>
              <div class="progress-bar-wrap">
                <div class="progress-bar-fill" style="width: ${Math.min(100, occupancy)}%; background-color: ${occupancy > 90 ? 'var(--critical-red)' : 'var(--primary-green)'}"></div>
              </div>
            </div>
          </div>
        `;
      }).join("");
    },

    openPlotDetail: function (areaId) {
      const area = window.NurseryStorage.getById("nursery_areas", areaId);
      if (!area) return;

      const inventory = window.NurseryStorage.getAll("inventory");
      const types = window.NurseryStorage.getAll("seedling_types");
      
      const activeBatches = inventory.filter(i => i.nurseryAreaId === areaId && i.currentQuantity > 0 && i.status !== "Dead");
      const currentStock = activeBatches.reduce((sum, item) => sum + item.currentQuantity, 0);

      const tableRows = activeBatches.map(b => {
        const type = types.find(t => t.id === b.seedlingTypeId) || {};
        return `
          <tr>
            <td><strong>${b.batchNumber}</strong></td>
            <td>${type.name}</td>
            <td>${b.currentQuantity.toLocaleString()} seedlings</td>
            <td>${b.height} cm</td>
            <td><span class="status-badge ${b.status.toLowerCase().replace(/ /g, '')}">${b.status}</span></td>
            <td>
              <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px;" onclick="window.NurseryApp.closeModal(); window.NurseryApp.navigateTo('inventory'); window.NurseryApp.views.inventory.onSearch('${b.batchNumber}')">Inspect</button>
            </td>
          </tr>
        `;
      }).join("");

      const contentHTML = `
        <div style="font-size:13px; line-height: 1.6;">
          <div style="background:var(--bg-gray); padding:15px; border-radius: var(--border-radius-md); margin-bottom: 20px; display:flex; justify-content:space-between;">
            <div>
              <strong>Plot Label:</strong> ${area.name}<br>
              <strong>Location:</strong> ${area.location}<br>
              <strong>Description:</strong> ${area.description}
            </div>
            <div style="text-align: right;">
              <strong>Capacity:</strong> ${area.capacity.toLocaleString()} max<br>
              <strong>Current Stock:</strong> <strong>${currentStock.toLocaleString()}</strong> seedlings<br>
              <strong>Utilization:</strong> ${((currentStock / area.capacity) * 100).toFixed(1)}%
            </div>
          </div>

          <div style="font-weight:700; border-bottom:1px solid var(--border-color); padding-bottom:5px; margin-bottom:10px;">Active Seedling Batches (${activeBatches.length})</div>
          
          <div class="table-wrapper">
            <table class="custom-table" style="font-size:12px;">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Species</th>
                  <th>Quantity</th>
                  <th>Height</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows || `<tr><td colspan="6" style="text-align:center; padding:15px; color:var(--text-muted);">No seedling batches in this plot.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      `;

      window.NurseryApp.showModal(`Plot Grid Inspector: Area ${area.code}`, contentHTML, null, null, "Close Plot Inspector");
    }
  };

  window.NurseryApp.views.nurserymap = NurseryMap;
})();
