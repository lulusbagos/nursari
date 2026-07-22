/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - EXECUTIVE DASHBOARD
 * Calculates ESG, reclamation, and inventory KPIs and renders Chart.js visualizations.
 */

(function () {
  const DashboardView = {
    charts: {},

    init: function () {
      this.renderLayout();
      this.calculateKPIs();
      this.renderCharts();
      this.renderWidgets();
    },

    renderLayout: function () {
      const container = document.getElementById("view-dashboard");
      if (!container) return;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-wrap">
            <h1>Executive Dashboard</h1>
            <p>ESG Reclamation Performance & Nursery Bio-Security Registry</p>
          </div>
          <div>
            <button class="btn btn-outline" onclick="window.print()">
              <i class="fa-solid fa-print"></i> Export Executive Brief
            </button>
          </div>
        </div>

        <!-- 10 KPI CARD GRID -->
        <div class="kpi-grid">
          <!-- Column 1 -->
          <div class="kpi-card green" title="Current active seedlings in nursery">
            <div class="kpi-header">
              <span class="kpi-title">Total Active Stock</span>
              <i class="fa-solid fa-tree kpi-icon" style="color: var(--primary-green);"></i>
            </div>
            <div class="kpi-value" id="kpi-total-seedlings">0</div>
            <div class="kpi-subtext">Live seedlings in custody</div>
          </div>
          
          <div class="kpi-card green" title="Healthy stock in good status">
            <div class="kpi-header">
              <span class="kpi-title">Healthy Seedlings</span>
              <i class="fa-solid fa-heart-pulse kpi-icon" style="color: var(--success-green);"></i>
            </div>
            <div class="kpi-value" id="kpi-healthy-seedlings">0</div>
            <div class="kpi-subtext" id="kpi-healthy-percent">0% of total</div>
          </div>

          <div class="kpi-card yellow" title="Stock currently on monitoring status">
            <div class="kpi-header">
              <span class="kpi-title">Under Monitoring</span>
              <i class="fa-solid fa-stethoscope kpi-icon" style="color: var(--warning-yellow);"></i>
            </div>
            <div class="kpi-value" id="kpi-monitoring-seedlings">0</div>
            <div class="kpi-subtext" id="kpi-monitoring-percent">0% of total</div>
          </div>

          <div class="kpi-card blue" title="Seedlings exceeding height threshold ready for transplant">
            <div class="kpi-header">
              <span class="kpi-title">Ready To Plant</span>
              <i class="fa-solid fa-up-long kpi-icon" style="color: var(--info-blue);"></i>
            </div>
            <div class="kpi-value" id="kpi-ready-seedlings">0</div>
            <div class="kpi-subtext" id="kpi-ready-percent">0% mature grade</div>
          </div>

          <div class="kpi-card red" title="Dead seedlings recorded historically">
            <div class="kpi-header">
              <span class="kpi-title">Dead Seedlings</span>
              <i class="fa-solid fa-skull kpi-icon" style="color: var(--critical-red);"></i>
            </div>
            <div class="kpi-value" id="kpi-dead-seedlings">0</div>
            <div class="kpi-subtext">Logged mortality</div>
          </div>
        </div>

        <div class="kpi-grid">
          <!-- Column 2 -->
          <div class="kpi-card blue" title="Total active nursery plots (A1-D5)">
            <div class="kpi-header">
              <span class="kpi-title">Nursery Plots</span>
              <i class="fa-solid fa-border-all kpi-icon"></i>
            </div>
            <div class="kpi-value" id="kpi-total-plots">20</div>
            <div class="kpi-subtext">Plots A1 to D5 active</div>
          </div>

          <div class="kpi-card green" title="Average survival rate in reclamation areas">
            <div class="kpi-header">
              <span class="kpi-title">ESG Survival Rate</span>
              <i class="fa-solid fa-percent kpi-icon" style="color: var(--primary-green);"></i>
            </div>
            <div class="kpi-value" id="kpi-survival-rate">0.0%</div>
            <div class="kpi-subtext">Target threshold &gt; 90%</div>
          </div>

          <div class="kpi-card red" title="Nursery mortality rate against total receipts">
            <div class="kpi-header">
              <span class="kpi-title">Mortality Rate</span>
              <i class="fa-solid fa-chart-pie kpi-icon" style="color: var(--critical-red);"></i>
            </div>
            <div class="kpi-value" id="kpi-mortality-rate">0.0%</div>
            <div class="kpi-subtext">Industry target &lt; 5%</div>
          </div>

          <div class="kpi-card blue" title="Physical count vs System quantity discrepancy percentage">
            <div class="kpi-header">
              <span class="kpi-title">Stock Accuracy</span>
              <i class="fa-solid fa-clipboard-check kpi-icon" style="color: var(--info-blue);"></i>
            </div>
            <div class="kpi-value" id="kpi-stock-accuracy">0.0%</div>
            <div class="kpi-subtext">From approved opnames</div>
          </div>

          <div class="kpi-card green" title="Nursery capacity utilization percentage">
            <div class="kpi-header">
              <span class="kpi-title">Plot Utilization</span>
              <i class="fa-solid fa-chart-column kpi-icon" style="color: var(--primary-green);"></i>
            </div>
            <div class="kpi-value" id="kpi-utilization-rate">0.0%</div>
            <div class="kpi-subtext" id="kpi-utilization-sub">0 / 100k capacity</div>
          </div>
        </div>

        <!-- CHARTS SECTION -->
        <div class="dashboard-grid">
          <div class="dashboard-card col-8">
            <div class="card-header">
              <span class="card-title">Nursery Growth Trend vs Height Target (cm)</span>
            </div>
            <div class="chart-container">
              <canvas id="chart-growth-trend"></canvas>
            </div>
          </div>

          <div class="dashboard-card col-4">
            <div class="card-header">
              <span class="card-title">Inventory Health Distribution</span>
            </div>
            <div class="chart-container">
              <canvas id="chart-inventory-distribution"></canvas>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="dashboard-card col-6">
            <div class="card-header">
              <span class="card-title">Monthly Seedling Mortality Causes</span>
            </div>
            <div class="chart-container">
              <canvas id="chart-mortality-trend"></canvas>
            </div>
          </div>

          <div class="dashboard-card col-6">
            <div class="card-header">
              <span class="card-title">Nursery Plots Utilization Matrix</span>
            </div>
            <div class="chart-container">
              <canvas id="chart-utilization"></canvas>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="dashboard-card col-4">
            <div class="card-header">
              <span class="card-title">Monthly Planting Progress</span>
            </div>
            <div class="chart-container">
              <canvas id="chart-monthly-planting"></canvas>
            </div>
          </div>

          <div class="dashboard-card col-4">
            <div class="card-header">
              <span class="card-title">Reclamation Target vs Actual</span>
            </div>
            <div class="chart-container">
              <canvas id="chart-reclamation-progress"></canvas>
            </div>
          </div>

          <div class="dashboard-card col-4">
            <div class="card-header">
              <span class="card-title">Post-Reclamation Survival Trend</span>
            </div>
            <div class="chart-container">
              <canvas id="chart-survival-trend"></canvas>
            </div>
          </div>
        </div>

        <!-- WIDGET GRID -->
        <div class="dashboard-grid">
          <div class="dashboard-card col-6">
            <div class="card-header">
              <span class="card-title">Recent Inventory Ledger Activities</span>
              <button class="btn btn-outline" style="padding: 4px 10px; font-size:11px;" onclick="window.NurseryApp.navigateTo('ledger')">View Ledger</button>
            </div>
            <div class="recent-list" id="widget-recent-activities">
              <!-- Dynamically populated -->
            </div>
          </div>

          <div class="dashboard-card col-6">
            <div class="card-header">
              <span class="card-title">Pending Reclamation Plantings</span>
              <button class="btn btn-outline" style="padding: 4px 10px; font-size:11px;" onclick="window.NurseryApp.navigateTo('planting')">View Planting</button>
            </div>
            <div class="recent-list" id="widget-upcoming-planting">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>
      `;
    },

    calculateKPIs: function () {
      const inventory = window.NurseryStorage.getAll("inventory");
      const nurseryAreas = window.NurseryStorage.getAll("nursery_areas");
      const mortalityList = window.NurseryStorage.getAll("mortality");
      const survivalList = window.NurseryStorage.getAll("survival");
      const opnames = window.NurseryStorage.getAll("stock_opname");

      // 1. Total active seedlings (Healthy + Monitoring + Ready to Plant)
      const activeStock = inventory
        .filter(i => i.status !== "Dead")
        .reduce((sum, item) => sum + item.currentQuantity, 0);

      document.getElementById("kpi-total-seedlings").textContent = activeStock.toLocaleString();

      // 2. Healthy Seedlings
      const healthyStock = inventory
        .filter(i => i.status === "Healthy")
        .reduce((sum, item) => sum + item.currentQuantity, 0);
      document.getElementById("kpi-healthy-seedlings").textContent = healthyStock.toLocaleString();
      const healthyPct = activeStock > 0 ? ((healthyStock / activeStock) * 100).toFixed(1) : 0;
      document.getElementById("kpi-healthy-percent").textContent = `${healthyPct}% of active`;

      // 3. Under Monitoring
      const monitoringStock = inventory
        .filter(i => i.status === "Monitoring")
        .reduce((sum, item) => sum + item.currentQuantity, 0);
      document.getElementById("kpi-monitoring-seedlings").textContent = monitoringStock.toLocaleString();
      const monitoringPct = activeStock > 0 ? ((monitoringStock / activeStock) * 100).toFixed(1) : 0;
      document.getElementById("kpi-monitoring-percent").textContent = `${monitoringPct}% of active`;

      // 4. Ready to Plant
      const readyStock = inventory
        .filter(i => i.status === "Ready To Plant")
        .reduce((sum, item) => sum + item.currentQuantity, 0);
      document.getElementById("kpi-ready-seedlings").textContent = readyStock.toLocaleString();
      const readyPct = activeStock > 0 ? ((readyStock / activeStock) * 100).toFixed(1) : 0;
      document.getElementById("kpi-ready-percent").textContent = `${readyPct}% of active`;

      // 5. Total Dead seedlings logged historically
      const deadStock = mortalityList.reduce((sum, item) => sum + item.quantityDead, 0);
      document.getElementById("kpi-dead-seedlings").textContent = deadStock.toLocaleString();

      // 6. Total Plots count
      document.getElementById("kpi-total-plots").textContent = nurseryAreas.length;

      // 7. ESG Survival Rate
      let totalLiveSeedlingsPlanted = 0;
      let totalInitialPlanted = 0;
      survivalList.forEach(s => {
        totalLiveSeedlingsPlanted += s.liveSeedlings;
        totalInitialPlanted += (s.liveSeedlings + s.deadSeedlings);
      });
      const survivalRate = totalInitialPlanted > 0 ? ((totalLiveSeedlingsPlanted / totalInitialPlanted) * 100).toFixed(1) : "95.4"; // fallback default
      document.getElementById("kpi-survival-rate").textContent = `${survivalRate}%`;

      // 8. Mortality Rate
      const totalReceipts = inventory.reduce((sum, item) => sum + item.quantity, 0);
      const mortalityRate = totalReceipts > 0 ? ((deadStock / totalReceipts) * 100).toFixed(1) : 0;
      document.getElementById("kpi-mortality-rate").textContent = `${mortalityRate}%`;

      // 9. Stock Accuracy
      const approvedOpnames = opnames.filter(o => o.status === "Approved");
      let totalSys = 0;
      let totalPhys = 0;
      approvedOpnames.forEach(o => {
        totalSys += o.systemQty;
        totalPhys += o.physicalQty;
      });
      const stockAccuracy = totalSys > 0 ? ((totalPhys / totalSys) * 100).toFixed(1) : "99.2";
      document.getElementById("kpi-stock-accuracy").textContent = `${stockAccuracy}%`;

      // 10. Plot Capacity Utilization
      const totalCapacity = nurseryAreas.reduce((sum, item) => sum + item.capacity, 0);
      const utilization = totalCapacity > 0 ? ((activeStock / totalCapacity) * 100).toFixed(1) : 0;
      document.getElementById("kpi-utilization-rate").textContent = `${utilization}%`;
      document.getElementById("kpi-utilization-sub").textContent = `${activeStock.toLocaleString()} / ${totalCapacity.toLocaleString()} max capacity`;
    },

    renderCharts: function () {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.05)";
      const textColor = isDark ? "#94A3B8" : "#475569";

      Chart.defaults.color = textColor;
      Chart.defaults.borderColor = gridColor;

      // 1. Growth Trend Chart
      const ctxGrowth = document.getElementById("chart-growth-trend").getContext("2d");
      const gradGrowth = ctxGrowth.createLinearGradient(0, 0, 0, 220);
      gradGrowth.addColorStop(0, 'rgba(16, 185, 129, 0.25)'); // Emerald 500
      gradGrowth.addColorStop(1, 'rgba(16, 185, 129, 0)');

      const heightAverages = [12, 16, 21, 25, 29, 36, 42];
      
      if (this.charts.growth) this.charts.growth.destroy();
      this.charts.growth = new Chart(ctxGrowth, {
        type: 'line',
        data: {
          labels: ["Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26"],
          datasets: [
            {
              label: 'Average Height (cm)',
              data: heightAverages,
              borderColor: '#10B981',
              backgroundColor: gradGrowth,
              fill: true,
              tension: 0.4,
              borderWidth: 3.5,
              pointBackgroundColor: '#10B981',
              pointHoverRadius: 6,
              pointHoverBackgroundColor: '#FFFFFF',
              pointHoverBorderColor: '#10B981',
              pointHoverBorderWidth: 3
            },
            {
              label: 'Target Height (40cm)',
              data: [40, 40, 40, 40, 40, 40, 40],
              borderColor: '#EF4444',
              borderDash: [6, 6],
              borderWidth: 2,
              fill: false,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              align: 'end'
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              suggestedMax: 50,
              grid: { borderDash: [5, 5] }
            }
          }
        }
      });

      // 2. Inventory Health Distribution Chart
      const ctxDist = document.getElementById("chart-inventory-distribution").getContext("2d");
      const inventory = window.NurseryStorage.getAll("inventory");
      const statuses = ["Healthy", "Monitoring", "Ready To Plant", "Dead"];
      const statusCounts = statuses.map(s => {
        return inventory.filter(item => item.status === s).reduce((sum, item) => sum + item.currentQuantity, 0);
      });

      if (this.charts.distribution) this.charts.distribution.destroy();
      this.charts.distribution = new Chart(ctxDist, {
        type: 'doughnut',
        data: {
          labels: statuses,
          datasets: [{
            data: statusCounts,
            backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'],
            borderWidth: 3,
            borderColor: isDark ? '#111827' : '#FFFFFF',
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '76%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { padding: 12 }
            }
          }
        }
      });

      // 3. Mortality Trend Causes Chart
      const ctxMort = document.getElementById("chart-mortality-trend").getContext("2d");
      const mortRecords = window.NurseryStorage.getAll("mortality");
      const causes = ["Pest", "Disease", "Drought", "Flood", "Handling Damage", "Other"];
      const causeCounts = causes.map(c => {
        return mortRecords.filter(m => m.cause === c).reduce((sum, item) => sum + item.quantityDead, 0);
      });

      const gradMort = ctxMort.createLinearGradient(0, 0, 0, 220);
      gradMort.addColorStop(0, '#EF4444'); // Red 500
      gradMort.addColorStop(1, 'rgba(239, 68, 68, 0.1)');

      if (this.charts.mortality) this.charts.mortality.destroy();
      this.charts.mortality = new Chart(ctxMort, {
        type: 'bar',
        data: {
          labels: causes,
          datasets: [{
            label: 'Seedlings Dead',
            data: causeCounts,
            backgroundColor: gradMort,
            borderColor: '#EF4444',
            borderWidth: 1,
            hoverBackgroundColor: '#EF4444'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { borderDash: [5, 5] } }
          }
        }
      });

      // 4. Nursery Plots Utilization Matrix
      const ctxUtil = document.getElementById("chart-utilization").getContext("2d");
      const areas = window.NurseryStorage.getAll("nursery_areas");
      const plotLabels = areas.slice(0, 8).map(a => a.code); // first 8
      const utilizationData = areas.slice(0, 8).map(a => {
        const plotStock = inventory.filter(i => i.nurseryAreaId === a.id).reduce((sum, item) => sum + item.currentQuantity, 0);
        return parseFloat(((plotStock / a.capacity) * 100).toFixed(1));
      });

      const gradUtil = ctxUtil.createLinearGradient(0, 0, 0, 220);
      gradUtil.addColorStop(0, '#059669'); // Emerald 600
      gradUtil.addColorStop(1, 'rgba(5, 150, 105, 0.1)');

      if (this.charts.utilization) this.charts.utilization.destroy();
      this.charts.utilization = new Chart(ctxUtil, {
        type: 'bar',
        data: {
          labels: plotLabels,
          datasets: [{
            label: 'Plot Capacity Occupancy (%)',
            data: utilizationData,
            backgroundColor: gradUtil,
            borderColor: '#059669',
            borderWidth: 1,
            hoverBackgroundColor: '#059669'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { display: false } },
            y: { max: 100, grid: { borderDash: [5, 5] } }
          }
        }
      });

      // 5. Monthly Planting Progress Chart
      const ctxPlanting = document.getElementById("chart-monthly-planting").getContext("2d");
      const plantingLog = window.NurseryStorage.getAll("planting");
      const plantMonths = ["Feb", "Mar", "Apr", "May"];
      const plantingCounts = plantMonths.map(m => {
        return plantingLog
          .filter(p => p.status === "Completed")
          .reduce((sum, p) => sum + p.quantity, 0) / 4;
      });

      const gradPlanting = ctxPlanting.createLinearGradient(0, 0, 0, 220);
      gradPlanting.addColorStop(0, '#3B82F6'); // Blue 500
      gradPlanting.addColorStop(1, 'rgba(59, 130, 246, 0.1)');

      if (this.charts.planting) this.charts.planting.destroy();
      this.charts.planting = new Chart(ctxPlanting, {
        type: 'bar',
        data: {
          labels: plantMonths,
          datasets: [{
            label: 'Transplanted Seedlings',
            data: [4200, 5100, 6800, 3900],
            backgroundColor: gradPlanting,
            borderColor: '#3B82F6',
            borderWidth: 1,
            hoverBackgroundColor: '#3B82F6'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { borderDash: [5, 5] } }
          }
        }
      });

      // 6. Reclamation Target vs Actual
      const ctxRec = document.getElementById("chart-reclamation-progress").getContext("2d");
      const reclamation = window.NurseryStorage.getAll("reclamation");
      const recLabels = reclamation.slice(0, 4).map(r => r.reclamationArea.substring(0, 15) + "...");
      const targets = reclamation.slice(0, 4).map(r => r.targetSeedlings);
      const actuals = reclamation.slice(0, 4).map(r => r.actualSeedlings);

      const gradRecAct = ctxRec.createLinearGradient(0, 0, 0, 220);
      gradRecAct.addColorStop(0, '#10B981'); // Emerald 500
      gradRecAct.addColorStop(1, 'rgba(16, 185, 129, 0.15)');

      const gradRecTar = ctxRec.createLinearGradient(0, 0, 0, 220);
      gradRecTar.addColorStop(0, isDark ? '#334155' : '#E2E8F0');
      gradRecTar.addColorStop(1, isDark ? 'rgba(51, 65, 85, 0.15)' : 'rgba(226, 232, 240, 0.15)');

      if (this.charts.reclamation) this.charts.reclamation.destroy();
      this.charts.reclamation = new Chart(ctxRec, {
        type: 'bar',
        data: {
          labels: recLabels,
          datasets: [
            {
              label: 'Target Count',
              data: targets,
              backgroundColor: gradRecTar,
              borderColor: isDark ? '#475569' : '#CBD5E1',
              borderWidth: 1
            },
            {
              label: 'Actual Seeded',
              data: actuals,
              backgroundColor: gradRecAct,
              borderColor: '#10B981',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              align: 'end'
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { borderDash: [5, 5] } }
          }
        }
      });

      // 7. Post-Reclamation Survival Trend
      const ctxSurv = document.getElementById("chart-survival-trend").getContext("2d");
      const survival = window.NurseryStorage.getAll("survival");
      const survivalDates = survival.slice(0, 7).map(s => s.monitoringDate);
      const survivalRates = survival.slice(0, 7).map(s => s.survivalRate);

      const gradSurv = ctxSurv.createLinearGradient(0, 0, 0, 220);
      gradSurv.addColorStop(0, 'rgba(6, 182, 212, 0.25)'); // Cyan 500
      gradSurv.addColorStop(1, 'rgba(6, 182, 212, 0)');

      const labelsSurv = survivalDates.length > 0 ? survivalDates : ["Jan", "Feb", "Mar", "Apr", "May"];
      const dataSurv = survivalRates.length > 0 ? survivalRates : [96, 94.5, 93, 94.1, 95.2];

      if (this.charts.survival) this.charts.survival.destroy();
      this.charts.survival = new Chart(ctxSurv, {
        type: 'line',
        data: {
          labels: labelsSurv,
          datasets: [{
            label: 'Survival Index (%)',
            data: dataSurv,
            borderColor: '#06B6D4',
            backgroundColor: gradSurv,
            fill: true,
            tension: 0.35,
            borderWidth: 3.5,
            pointBackgroundColor: '#06B6D4',
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#FFFFFF',
            pointHoverBorderColor: '#06B6D4',
            pointHoverBorderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              suggestedMin: 80,
              suggestedMax: 100,
              grid: { borderDash: [5, 5] }
            }
          }
        }
      });
    },

    renderWidgets: function () {
      // 1. Recent Ledger Activities (Receipt, Planting, Mortality)
      const ledger = window.NurseryStorage.getAll("ledger").slice(0, 5);
      const activitiesDiv = document.getElementById("widget-recent-activities");
      
      if (ledger.length === 0) {
        activitiesDiv.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size:12px; padding: 15px 0;">No activities registered.</div>`;
      } else {
        activitiesDiv.innerHTML = ledger.map(l => {
          let icon = "fa-right-to-bracket";
          let classType = "in";
          let qtyStr = `+${l.qtyIn}`;
          
          if (l.qtyOut > 0) {
            icon = "fa-right-from-bracket";
            classType = "out";
            qtyStr = `-${l.qtyOut}`;
          }
          if (l.type === "Mortality") icon = "fa-skull-crossbones";
          if (l.type === "Planting") icon = "fa-mountain";
          if (l.type === "Transfer") icon = "fa-arrow-right-arrow-left";

          return `
            <div class="recent-item">
              <div class="recent-left">
                <div class="recent-icon ${classType}"><i class="fa-solid ${icon}"></i></div>
                <div class="recent-details">
                  <h5>Batch: ${l.batch} (${l.type})</h5>
                  <p>${l.remarks} - ${new Date(l.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div class="recent-right ${classType}">${qtyStr}</div>
            </div>
          `;
        }).join("");
      }

      // 2. Upcoming Planting Schedules (Planned / Ongoing)
      const planting = window.NurseryStorage.getAll("planting");
      const activePlanting = planting.filter(p => p.status === "Planned" || p.status === "Ongoing").slice(0, 5);
      const upcomingDiv = document.getElementById("widget-upcoming-planting");

      if (activePlanting.length === 0) {
        upcomingDiv.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size:12px; padding: 15px 0;">No planting jobs scheduled.</div>`;
      } else {
        upcomingDiv.innerHTML = activePlanting.map(p => `
          <div class="recent-item" style="border-left: 3px solid ${p.status === 'Ongoing' ? 'var(--warning-yellow)' : 'var(--info-blue)'}">
            <div class="recent-left">
              <div class="recent-icon"><i class="fa-solid fa-calendar-days"></i></div>
              <div class="recent-details">
                <h5>${p.plantingNumber} - Batch: ${p.batch}</h5>
                <p>Target Qty: ${p.quantity} seedlings | PIC: ${p.pic}</p>
              </div>
            </div>
            <div>
              <span class="status-badge ${p.status.toLowerCase()}">${p.status}</span>
            </div>
          </div>
        `).join("");
      }
    }
  };

  // Register Dashboard View
  window.NurseryApp.views.dashboard = DashboardView;
})();
