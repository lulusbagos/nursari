/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - REPORT CENTER
 * Generates audit-ready printable spreadsheets for environmental compliance reporting.
 */

(function () {
  const ReportCenter = {
    activeReport: "inventory", // inventory, nursery, monitoring, mortality, stockopname, planting, survival, reclamation
    startDate: "",
    endDate: "",

    init: function () {
      this.renderLayout();
      this.generateReportData();
    },

    renderLayout: function () {
      const container = document.getElementById("view-report");
      if (!container) return;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-wrap">
            <h1>Compliance Report Center</h1>
            <p>Generate environmental audit ledgers, mortality ratios, and ESG sustainability reports</p>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-outline" onclick="window.NurseryApp.views.report.exportCSV()">
              <i class="fa-solid fa-file-excel"></i> Export CSV Spreadsheet
            </button>
            <button class="btn btn-primary" onclick="window.print()">
              <i class="fa-solid fa-print"></i> Print / Save PDF
            </button>
          </div>
        </div>

        <!-- FILTERS DECK -->
        <div class="table-toolbar" style="padding:16px 20px;">
          <div class="toolbar-left">
            <label style="font-weight:600; font-size:13px; color:var(--text-light);">Select Report Type:</label>
            <select id="report-type-select" class="select-filter" style="min-width: 250px;">
              <option value="inventory">1. Seedling Inventory Report</option>
              <option value="nursery">2. Nursery Plot Occupancy & Health</option>
              <option value="monitoring">3. Growth Inspection Chronology</option>
              <option value="mortality">4. Mortality & Casualty Analysis</option>
              <option value="stockopname">5. Stock Opname Discrepancy Ledger</option>
              <option value="planting">6. Reclamation Planting Logs</option>
              <option value="survival">7. Post-Transplant Survival Analysis</option>
              <option value="reclamation">8. ESG Reclamation Target Progress</option>
            </select>

            <span style="margin: 0 10px; color:var(--text-muted); font-size:12px;">|</span>

            <label style="font-weight:600; font-size:13px; color:var(--text-light);">Range:</label>
            <input type="date" id="report-start-date" class="form-input" style="width:140px; padding:6px 10px;">
            <span style="color:var(--text-muted);">to</span>
            <input type="date" id="report-end-date" class="form-input" style="width:140px; padding:6px 10px;">
          </div>
        </div>

        <!-- REPORT DISPLAY SHEET -->
        <div class="dashboard-card" style="background:#FFFFFF; color:#1A1A1A; padding:40px; border-radius: var(--border-radius-md); box-shadow:var(--shadow-md); margin-top:20px; border:1px solid #E0E0E0;" id="report-print-sheet">
          
          <!-- Report Header -->
          <div style="border-bottom: 2px solid #2E7D32; padding-bottom:15px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-family:var(--font-title); font-size:24px; font-weight:700; color:#2E7D32;">
                <i class="fa-solid fa-tree"></i> PT INDEXIM COAL INDO
              </div>
              <div style="font-size:11px; color:#555555; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Environmental & Soil Reclamation Division</div>
            </div>
            <div style="text-align: right; font-size:12px; color:#555555;">
              <strong>Report Generated:</strong> <span id="report-gen-date">00/00/0000</span><br>
              <strong>Security Protocol:</strong> INTERNAL AUDIT CONFIDENTIAL
            </div>
          </div>

          <!-- Report Metadata Title -->
          <div style="margin-bottom:25px;">
            <h2 id="report-title-header" style="font-family:var(--font-title); font-size:20px; font-weight:700; color:#222222; margin-bottom:5px;">Report Title</h2>
            <p id="report-desc-header" style="font-size:13px; color:#666666;">Detailed description of report objectives and compliance parameters.</p>
          </div>

          <!-- Report Summary Stats Blocks -->
          <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:15px; margin-bottom:25px;" id="report-stats-grid">
            <!-- Dynamically populated stats -->
          </div>

          <!-- Report Data Table -->
          <div style="overflow-x:auto;">
            <table class="custom-table" style="width:100%; border-collapse:collapse; font-size:12px;" id="report-data-table-element">
              <!-- Dynamically populated table -->
            </table>
          </div>

          <!-- Report Signature block for print -->
          <div style="margin-top:50px; display:none; justify-content:space-between; font-size:12px; border-top:1px dashed #CCCCCC; padding-top:20px;" id="report-signature-block">
            <div>
              <p>Generated by:</p>
              <br><br>
              <p>___________________________</p>
              <p id="report-pic-name">Officer Name</p>
            </div>
            <div>
              <p>Approved for Compliance by:</p>
              <br><br>
              <p>___________________________</p>
              <p>Reclamation Lead Manager</p>
            </div>
          </div>

        </div>
      `;

      const self = this;
      
      // Gen date
      document.getElementById("report-gen-date").textContent = new Date().toLocaleDateString();

      // Bind switches
      document.getElementById("report-type-select").addEventListener("change", function () {
        self.activeReport = this.value;
        self.generateReportData();
      });

      document.getElementById("report-start-date").addEventListener("change", function () {
        self.startDate = this.value;
        self.generateReportData();
      });

      document.getElementById("report-end-date").addEventListener("change", function () {
        self.endDate = this.value;
        self.generateReportData();
      });
    },

    generateReportData: function () {
      const start = this.startDate ? new Date(this.startDate) : null;
      const end = this.endDate ? new Date(this.endDate) : null;
      const user = window.NurseryAuth.getCurrentUser();
      
      if (document.getElementById("report-pic-name")) {
        document.getElementById("report-pic-name").textContent = user ? user.name : "Officer Signature";
      }

      // Check report type and extract tables
      const inventory = window.NurseryStorage.getAll("inventory");
      const types = window.NurseryStorage.getAll("seedling_types");
      const suppliers = window.NurseryStorage.getAll("suppliers");
      const areas = window.NurseryStorage.getAll("nursery_areas");
      const monitoring = window.NurseryStorage.getAll("monitoring");
      const mortality = window.NurseryStorage.getAll("mortality");
      const opnames = window.NurseryStorage.getAll("stock_opname");
      const planting = window.NurseryStorage.getAll("planting");
      const survival = window.NurseryStorage.getAll("survival");
      const reclamation = window.NurseryStorage.getAll("reclamation");

      let statsGrid = "";
      let tableHeader = "";
      let tableRows = "";
      let title = "";
      let desc = "";

      // Date filter helper
      const isDateValid = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      };

      if (this.activeReport === "inventory") {
        title = "Seedling Inventory Balance Sheet";
        desc = "Current stock allocation of forest seedlings across nursery greenhouse grids, highlighting age and bio-health statuses.";
        
        const active = inventory.filter(i => i.status !== "Dead" && (start === null || isDateValid(i.dateReceived)));
        const totalStock = active.reduce((sum, item) => sum + item.currentQuantity, 0);
        const avgAge = active.length > 0 ? (active.reduce((sum, item) => sum + item.age, 0) / active.length).toFixed(1) : 0;
        const readyStock = active.filter(i => i.status === "Ready To Plant").reduce((sum, item) => sum + item.currentQuantity, 0);

        statsGrid = `
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #2E7D32;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Active Seedlings</div>
            <strong style="font-size:18px;">${totalStock.toLocaleString()}</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #0288D1;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Ready for Transplant</div>
            <strong style="font-size:18px;">${readyStock.toLocaleString()}</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #FBC02D;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Avg Cultivation Age</div>
            <strong style="font-size:18px;">${avgAge} Weeks</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #78909C;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Unique Batches</div>
            <strong style="font-size:18px;">${active.length} Records</strong>
          </div>
        `;

        tableHeader = `
          <thead>
            <tr style="background:#F5F7FA; border-bottom:1px solid #CCCCCC;">
              <th style="padding:10px; text-align:left;">Batch</th>
              <th style="padding:10px; text-align:left;">Species</th>
              <th style="padding:10px; text-align:left;">Supplier</th>
              <th style="padding:10px; text-align:left;">Date Received</th>
              <th style="padding:10px; text-align:left;">Rec Qty</th>
              <th style="padding:10px; text-align:left;">Bal Qty</th>
              <th style="padding:10px; text-align:left;">Height (cm)</th>
              <th style="padding:10px; text-align:left;">Plot</th>
              <th style="padding:10px; text-align:left;">Status</th>
            </tr>
          </thead>
        `;

        tableRows = active.map(i => {
          const type = types.find(t => t.id === i.seedlingTypeId) || {};
          const supplier = suppliers.find(s => s.id === i.supplierId) || {};
          const area = areas.find(a => a.id === i.nurseryAreaId) || {};
          return `
            <tr style="border-bottom:1px solid #E0E0E0;">
              <td style="padding:10px; font-weight:700;">${i.batchNumber}</td>
              <td style="padding:10px;">${type.name}</td>
              <td style="padding:10px;">${supplier.name}</td>
              <td style="padding:10px;">${i.dateReceived}</td>
              <td style="padding:10px;">${i.quantity.toLocaleString()}</td>
              <td style="padding:10px; font-weight:600;">${i.currentQuantity.toLocaleString()}</td>
              <td style="padding:10px;">${i.height} cm</td>
              <td style="padding:10px; font-family:monospace;">${area.code}</td>
              <td style="padding:10px;">${i.status}</td>
            </tr>
          `;
        }).join("");

      } else if (this.activeReport === "nursery") {
        title = "Nursery Greenbed Plot Utilization Matrix";
        desc = "Structural analysis of nursery capacity usage, showing occupancy ratios and biological health coefficients for sectors A1 to D5.";
        
        const totalCapacity = areas.reduce((sum, item) => sum + item.capacity, 0);
        const usedStock = inventory.filter(i => i.status !== "Dead").reduce((sum, item) => sum + item.currentQuantity, 0);
        const occupancy = ((usedStock / totalCapacity) * 100).toFixed(1);

        statsGrid = `
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #2E7D32;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Nursery Occupancy</div>
            <strong style="font-size:18px;">${occupancy}%</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #0288D1;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Total Capacity</div>
            <strong style="font-size:18px;">${totalCapacity.toLocaleString()} Max</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #66BB6A;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Total Stock In-use</div>
            <strong style="font-size:18px;">${usedStock.toLocaleString()}</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #78909C;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Total Registered Plots</div>
            <strong style="font-size:18px;">${areas.length} Units</strong>
          </div>
        `;

        tableHeader = `
          <thead>
            <tr style="background:#F5F7FA; border-bottom:1px solid #CCCCCC;">
              <th style="padding:10px; text-align:left;">Plot Code</th>
              <th style="padding:10px; text-align:left;">Sector Name</th>
              <th style="padding:10px; text-align:left;">Max Capacity</th>
              <th style="padding:10px; text-align:left;">Current Occupied</th>
              <th style="padding:10px; text-align:left;">Occupancy (%)</th>
              <th style="padding:10px; text-align:left;">Biological Health (%)</th>
              <th style="padding:10px; text-align:left;">Location sector</th>
            </tr>
          </thead>
        `;

        tableRows = areas.map(a => {
          const plotInvs = inventory.filter(i => i.nurseryAreaId === a.id && i.currentQuantity > 0 && i.status !== "Dead");
          const count = plotInvs.reduce((sum, item) => sum + item.currentQuantity, 0);
          const occupancyRate = ((count / a.capacity) * 100).toFixed(1);
          
          const healthy = plotInvs.filter(i => i.status === "Healthy" || i.status === "Ready To Plant").reduce((sum, item) => sum + item.currentQuantity, 0);
          const healthRate = count > 0 ? ((healthy / count) * 100).toFixed(1) : 100.0;

          return `
            <tr style="border-bottom:1px solid #E0E0E0;">
              <td style="padding:10px; font-weight:700; font-family:monospace;">${a.code}</td>
              <td style="padding:10px;">${a.name}</td>
              <td style="padding:10px;">${a.capacity.toLocaleString()}</td>
              <td style="padding:10px; font-weight:600;">${count.toLocaleString()}</td>
              <td style="padding:10px;">${occupancyRate}%</td>
              <td style="padding:10px; font-weight:700; color: ${healthRate < 90 ? '#C2185B' : '#2E7D32'}">${healthRate}%</td>
              <td style="padding:10px;">${a.location}</td>
            </tr>
          `;
        }).join("");

      } else if (this.activeReport === "monitoring") {
        title = "Botanical Growth Inspection Logbook";
        desc = "Inspection logs tracking height additions and stem diameters of active seedling batches to monitor silvicultural parameters.";
        
        const filteredMon = monitoring.filter(m => start === null || isDateValid(m.monitoringDate));
        const totalInspections = filteredMon.length;
        const avgScore = totalInspections > 0 ? (filteredMon.reduce((sum, m) => sum + m.healthScore, 0) / totalInspections).toFixed(1) : 0;
        const maxHt = totalInspections > 0 ? Math.max(...filteredMon.map(m => m.height)) : 0;

        statsGrid = `
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #2E7D32;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Total Inspections</div>
            <strong style="font-size:18px;">${totalInspections}</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #0288D1;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Avg Health Rating</div>
            <strong style="font-size:18px;">${avgScore}%</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #FBC02D;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Max Height Observed</div>
            <strong style="font-size:18px;">${maxHt} cm</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #78909C;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Unique Batches Checked</div>
            <strong style="font-size:18px;">${[...new Set(filteredMon.map(m => m.batchNumber))].length} Batches</strong>
          </div>
        `;

        tableHeader = `
          <thead>
            <tr style="background:#F5F7FA; border-bottom:1px solid #CCCCCC;">
              <th style="padding:10px; text-align:left;">Inspection Date</th>
              <th style="padding:10px; text-align:left;">Batch Number</th>
              <th style="padding:10px; text-align:left;">Height (cm)</th>
              <th style="padding:10px; text-align:left;">Diameter (cm)</th>
              <th style="padding:10px; text-align:left;">Leaf Condition</th>
              <th style="padding:10px; text-align:left;">Bio-Health Index</th>
              <th style="padding:10px; text-align:left;">Notes / Anomalies</th>
            </tr>
          </thead>
        `;

        tableRows = filteredMon.map(m => `
          <tr style="border-bottom:1px solid #E0E0E0;">
            <td style="padding:10px; font-weight:700;">${m.monitoringDate}</td>
            <td style="padding:10px;">${m.batchNumber}</td>
            <td style="padding:10px;">${m.height} cm</td>
            <td style="padding:10px;">${m.diameter} cm</td>
            <td style="padding:10px;">${m.leafCondition}</td>
            <td style="padding:10px; font-weight:700; color: ${m.healthScore >= 90 ? '#2E7D32' : '#F57F17'}">${m.healthScore}%</td>
            <td style="padding:10px; max-width: 300px;">${m.notes}</td>
          </tr>
        `).join("");

      } else if (this.activeReport === "mortality") {
        title = "Nursery Plant Casualty & Mortality Analysis Report";
        desc = "Identifies total seedling losses, grouped by mortality root causes (Pests, Drought, Diseases) and dates of incident.";
        
        const filteredMort = mortality.filter(m => start === null || isDateValid(m.date));
        const totalDead = filteredMort.reduce((sum, item) => sum + item.quantityDead, 0);
        const avgCasualties = filteredMort.length > 0 ? (totalDead / filteredMort.length).toFixed(1) : 0;

        statsGrid = `
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #D32F2F;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Seedlings Dead</div>
            <strong style="font-size:18px;">${totalDead.toLocaleString()}</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #0288D1;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Avg casualty size</div>
            <strong style="font-size:18px;">${avgCasualties} seedlings</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #78909C;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Loss Incidents</div>
            <strong style="font-size:18px;">${filteredMort.length} Events</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #90A4AE;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Target Threshold</div>
            <strong style="font-size:18px; color:#2E7D32;">&lt;5% Total Recs</strong>
          </div>
        `;

        tableHeader = `
          <thead>
            <tr style="background:#F5F7FA; border-bottom:1px solid #CCCCCC;">
              <th style="padding:10px; text-align:left;">Loss Date</th>
              <th style="padding:10px; text-align:left;">Batch Number</th>
              <th style="padding:10px; text-align:left;">Quantity Dead</th>
              <th style="padding:10px; text-align:left;">Primary Cause</th>
            </tr>
          </thead>
        `;

        tableRows = filteredMort.map(m => `
          <tr style="border-bottom:1px solid #E0E0E0;">
            <td style="padding:10px; font-weight:700;">${m.date}</td>
            <td style="padding:10px;">${m.batch}</td>
            <td style="padding:10px; font-weight:700; color:#D32F2F;">-${m.quantityDead.toLocaleString()}</td>
            <td style="padding:10px; text-transform:capitalize; font-weight:600;">${m.cause}</td>
          </tr>
        `).join("");

      } else if (this.activeReport === "stockopname") {
        title = "Stock Opname Reconciliation & Audit Discrepancies Ledger";
        desc = "Compares book inventory records against verified physical measurements, listing variances and workflow verification states.";
        
        const filteredSO = opnames.filter(o => start === null || isDateValid(o.dateCreated));
        const totalAudits = filteredSO.length;
        const totalApproved = filteredSO.filter(o => o.status === "Approved");
        const netVariance = totalApproved.reduce((sum, item) => sum + item.variance, 0);

        statsGrid = `
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #0288D1;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Total Audited Entries</div>
            <strong style="font-size:18px;">${totalAudits} SOs</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #2E7D32;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Net Variance</div>
            <strong style="font-size:18px; color:${netVariance < 0 ? '#C2185B' : '#2E7D32'};">${(netVariance >= 0 ? '+' : '') + netVariance.toLocaleString()}</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #FBC02D;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Pending Approval</div>
            <strong style="font-size:18px;">${filteredSO.filter(o => o.status === "Submitted").length} items</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #78909C;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Reconciliation Rate</div>
            <strong style="font-size:18px;">${totalAudits > 0 ? ((totalApproved.length / totalAudits) * 100).toFixed(1) : 0}%</strong>
          </div>
        `;

        tableHeader = `
          <thead>
            <tr style="background:#F5F7FA; border-bottom:1px solid #CCCCCC;">
              <th style="padding:10px; text-align:left;">SO Number</th>
              <th style="padding:10px; text-align:left;">Created Date</th>
              <th style="padding:10px; text-align:left;">Batch Checked</th>
              <th style="padding:10px; text-align:left;">System Qty</th>
              <th style="padding:10px; text-align:left;">Physical Qty</th>
              <th style="padding:10px; text-align:left;">Variance</th>
              <th style="padding:10px; text-align:left;">Workflow State</th>
              <th style="padding:10px; text-align:left;">Audited By</th>
            </tr>
          </thead>
        `;

        tableRows = filteredSO.map(o => `
          <tr style="border-bottom:1px solid #E0E0E0;">
            <td style="padding:10px; font-weight:700; font-family:monospace;">${o.opnameNumber}</td>
            <td style="padding:10px;">${o.dateCreated}</td>
            <td style="padding:10px;">${o.batchNumber}</td>
            <td style="padding:10px;">${o.systemQty.toLocaleString()}</td>
            <td style="padding:10px;">${o.physicalQty.toLocaleString()}</td>
            <td style="padding:10px; font-weight:700; color: ${o.variance < 0 ? '#D32F2F' : o.variance > 0 ? '#2E7D32' : '#222'};">${(o.variance >= 0 ? '+' : '') + o.variance}</td>
            <td style="padding:10px; font-weight:600;">${o.status}</td>
            <td style="padding:10px;">${o.createdBy}</td>
          </tr>
        `).join("");

      } else if (this.activeReport === "planting") {
        title = "Reclamation Site Seedling Planting Logs";
        desc = "Transplant dispatches to dump slope blocks of the mines, indicating coordinates, quantity sent and PIC environment officers.";
        
        const filteredPlant = planting.filter(p => start === null || isDateValid(p.date));
        const completedPlts = filteredPlant.filter(p => p.status === "Completed");
        const totalDispatched = completedPlts.reduce((sum, item) => sum + item.quantity, 0);

        statsGrid = `
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #2E7D32;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Planted Seedlings</div>
            <strong style="font-size:18px;">${totalDispatched.toLocaleString()}</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #0288D1;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Completed Tickets</div>
            <strong style="font-size:18px;">${completedPlts.length}</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #FBC02D;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Active Schedules</div>
            <strong style="font-size:18px;">${filteredPlant.filter(p => p.status !== "Completed").length} jobs</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #78909C;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Target Zones</div>
            <strong style="font-size:18px;">${[...new Set(filteredPlant.map(p => p.plantingAreaId))].length} Blocks</strong>
          </div>
        `;

        tableHeader = `
          <thead>
            <tr style="background:#F5F7FA; border-bottom:1px solid #CCCCCC;">
              <th style="padding:10px; text-align:left;">Ticket Num</th>
              <th style="padding:10px; text-align:left;">Planting Date</th>
              <th style="padding:10px; text-align:left;">Reclamation Block</th>
              <th style="padding:10px; text-align:left;">Batch Number</th>
              <th style="padding:10px; text-align:left;">Quantity Sent</th>
              <th style="padding:10px; text-align:left;">PIC Officer</th>
              <th style="padding:10px; text-align:left;">GPS Coordinates</th>
              <th style="padding:10px; text-align:left;">Status</th>
            </tr>
          </thead>
        `;

        tableRows = filteredPlant.map(p => {
          const areaObj = areas.find(a => a.id === p.plantingAreaId) || { name: "Unknown" };
          return `
            <tr style="border-bottom:1px solid #E0E0E0;">
              <td style="padding:10px; font-weight:700; font-family:monospace;">${p.plantingNumber}</td>
              <td style="padding:10px;">${p.date}</td>
              <td style="padding:10px;">${areaObj.name}</td>
              <td style="padding:10px;">${p.batch}</td>
              <td style="padding:10px; font-weight:600;">${p.quantity.toLocaleString()}</td>
              <td style="padding:10px;">${p.pic}</td>
              <td style="padding:10px; font-family:monospace;">${p.coordinates}</td>
              <td style="padding:10px;">${p.status}</td>
            </tr>
          `;
        }).join("");

      } else if (this.activeReport === "survival") {
        title = "Post-Transplant Seedling Field Survival Index Report";
        desc = "Monitors bio-reclamation viability on dump slopes, compiling survival rates which are critical for annual ESG audits.";
        
        const filteredSurv = survival.filter(s => start === null || isDateValid(s.monitoringDate));
        let totalLiveCount = 0;
        let totalPlantedCount = 0;
        filteredSurv.forEach(s => {
          totalLiveCount += s.liveSeedlings;
          totalPlantedCount += (s.liveSeedlings + s.deadSeedlings);
        });
        const indexVal = totalPlantedCount > 0 ? ((totalLiveCount / totalPlantedCount) * 100).toFixed(1) : 0;

        statsGrid = `
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #2E7D32;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Overall Survival Rate</div>
            <strong style="font-size:18px;">${indexVal}%</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #66BB6A;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Live Seedlings</div>
            <strong style="font-size:18px;">${totalLiveCount.toLocaleString()}</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #C2185B;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Dead Counted</div>
            <strong style="font-size:18px;">${(totalPlantedCount - totalLiveCount).toLocaleString()}</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #78909C;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Audited Tickets</div>
            <strong style="font-size:18px;">${filteredSurv.length}</strong>
          </div>
        `;

        tableHeader = `
          <thead>
            <tr style="background:#F5F7FA; border-bottom:1px solid #CCCCCC;">
              <th style="padding:10px; text-align:left;">Inspection Date</th>
              <th style="padding:10px; text-align:left;">Planting Ticket</th>
              <th style="padding:10px; text-align:left;">Total Planted</th>
              <th style="padding:10px; text-align:left;">Live Counted</th>
              <th style="padding:10px; text-align:left;">Dead Counted</th>
              <th style="padding:10px; text-align:left;">Survival Rate (%)</th>
            </tr>
          </thead>
        `;

        tableRows = filteredSurv.map(s => {
          const tot = s.liveSeedlings + s.deadSeedlings;
          return `
            <tr style="border-bottom:1px solid #E0E0E0;">
              <td style="padding:10px; font-weight:700;">${s.monitoringDate}</td>
              <td style="padding:10px; font-family:monospace;">${s.plantingNumber}</td>
              <td style="padding:10px;">${tot.toLocaleString()}</td>
              <td style="padding:10px; color:#2E7D32; font-weight:600;">${s.liveSeedlings.toLocaleString()}</td>
              <td style="padding:10px; color:#C2185B; font-weight:600;">${s.deadSeedlings.toLocaleString()}</td>
              <td style="padding:10px; font-weight:700; color: ${s.survivalRate < 90 ? '#C2185B' : '#2E7D32'}">${s.survivalRate}%</td>
            </tr>
          `;
        }).join("");

      } else if (this.activeReport === "reclamation") {
        title = "Mine Reclamation Campaigns Compliance Report";
        desc = "Aggregated targets vs actual seedlings planted per reclamation dump areas to comply with government forestation quotas.";
        
        const totalSize = reclamation.reduce((sum, item) => sum + item.areaSize, 0);
        const totalT = reclamation.reduce((sum, item) => sum + item.targetSeedlings, 0);
        const totalA = reclamation.reduce((sum, item) => sum + item.actualSeedlings, 0);
        const weightedComp = totalT > 0 ? ((totalA / totalT) * 100).toFixed(1) : 0;

        statsGrid = `
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #2E7D32;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Overall Completion</div>
            <strong style="font-size:18px;">${weightedComp}%</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #0288D1;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Total Hectares (Ha)</div>
            <strong style="font-size:18px;">${totalSize.toFixed(1)} Ha</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #4CAF50;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Total Planted</div>
            <strong style="font-size:18px;">${totalA.toLocaleString()}</strong>
          </div>
          <div style="background:#F5F7FA; padding:15px; border-radius:6px; border-left:4px solid #90A4AE;">
            <div style="font-size:10px; color:#666666; font-weight:600; text-transform:uppercase;">Unique Target Zones</div>
            <strong style="font-size:18px;">${reclamation.length} Campaigns</strong>
          </div>
        `;

        tableHeader = `
          <thead>
            <tr style="background:#F5F7FA; border-bottom:1px solid #CCCCCC;">
              <th style="padding:10px; text-align:left;">Reclamation Campaign Zone</th>
              <th style="padding:10px; text-align:left;">Area Size (Ha)</th>
              <th style="padding:10px; text-align:left;">Campaign Year</th>
              <th style="padding:10px; text-align:left;">Target Seedlings</th>
              <th style="padding:10px; text-align:left;">Actual Planted</th>
              <th style="padding:10px; text-align:left;">Completion Rate (%)</th>
            </tr>
          </thead>
        `;

        tableRows = reclamation.map(r => `
          <tr style="border-bottom:1px solid #E0E0E0;">
            <td style="padding:10px; font-weight:700;">${r.reclamationArea}</td>
            <td style="padding:10px;">${r.areaSize} Hectares</td>
            <td style="padding:10px;">${r.year}</td>
            <td style="padding:10px;">${r.targetSeedlings.toLocaleString()}</td>
            <td style="padding:10px; font-weight:600;">${r.actualSeedlings.toLocaleString()}</td>
            <td style="padding:10px; font-weight:700; color: ${r.completionRate < 80 ? '#D32F2F' : '#2E7D32'}">${r.completionRate}%</td>
          </tr>
        `).join("");
      }

      // Update HTML components
      document.getElementById("report-title-header").textContent = title;
      document.getElementById("report-desc-header").textContent = desc;
      document.getElementById("report-stats-grid").innerHTML = statsGrid;
      
      const tableObj = document.getElementById("report-data-table-element");
      tableObj.innerHTML = tableHeader + `<tbody>` + (tableRows || `<tr><td colspan="10" style="text-align:center; padding:30px; color:#999999;">No records found within the specified date boundaries.</td></tr>`) + `</tbody>`;
    },

    exportCSV: function () {
      // Export current report CSV
      const self = this;
      const type = this.activeReport;
      
      let filename = `Nursery_Report_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      let csv = "";

      if (type === "inventory") {
        const data = window.NurseryStorage.getAll("inventory").filter(i => i.status !== "Dead");
        csv = "Batch,Species,Supplier,Date Received,Received Qty,Current Qty,Height (cm),Plot,Status\n";
        data.forEach(i => {
          csv += `"${i.batchNumber}","${i.seedlingTypeId}","${i.supplierId}","${i.dateReceived}",${i.quantity},${i.currentQuantity},${i.height},"${i.nurseryAreaId}","${i.status}"\n`;
        });
      } else if (type === "nursery") {
        const data = window.NurseryStorage.getAll("nursery_areas");
        csv = "Plot Code,Name,Capacity,Location\n";
        data.forEach(a => {
          csv += `"${a.code}","${a.name}",${a.capacity},"${a.location}"\n`;
        });
      } else if (type === "monitoring") {
        const data = window.NurseryStorage.getAll("monitoring");
        csv = "Date,Batch,Height,Diameter,Leaf Condition,Health Score,Notes\n";
        data.forEach(m => {
          csv += `"${m.monitoringDate}","${m.batchNumber}",${m.height},${m.diameter},"${m.leafCondition}",${m.healthScore},"${m.notes.replace(/"/g, '""')}"\n`;
        });
      } else if (type === "mortality") {
        const data = window.NurseryStorage.getAll("mortality");
        csv = "Date,Batch,Quantity Dead,Cause\n";
        data.forEach(m => {
          csv += `"${m.date}","${m.batch}",${m.quantityDead},"${m.cause}"\n`;
        });
      } else if (type === "stockopname") {
        const data = window.NurseryStorage.getAll("stock_opname");
        csv = "SO Number,Date,Batch,System Qty,Physical Qty,Variance,Status,Auditor,Approver\n";
        data.forEach(o => {
          csv += `"${o.opnameNumber}","${o.dateCreated}","${o.batchNumber}",${o.systemQty},${o.physicalQty},${o.variance},"${o.status}","${o.createdBy}","${o.approvedBy}"\n`;
        });
      } else if (type === "planting") {
        const data = window.NurseryStorage.getAll("planting");
        csv = "Ticket,Date,Area,Batch,Quantity,PIC,GPS Coords,Status\n";
        data.forEach(p => {
          csv += `"${p.plantingNumber}","${p.date}","${p.plantingAreaId}","${p.batch}",${p.quantity},"${p.pic}","${p.coordinates}","${p.status}"\n`;
        });
      } else if (type === "survival") {
        const data = window.NurseryStorage.getAll("survival");
        csv = "Date,Planting Ticket,Live,Dead,Survival Rate\n";
        data.forEach(s => {
          csv += `"${s.monitoringDate}","${s.plantingNumber}",${s.liveSeedlings},${s.deadSeedlings},${s.survivalRate}\n`;
        });
      } else if (type === "reclamation") {
        const data = window.NurseryStorage.getAll("reclamation");
        csv = "Area,Size (Ha),Year,Target,Actual,Completion Rate\n";
        data.forEach(r => {
          csv += `"${r.reclamationArea}",${r.areaSize},${r.year},${r.targetSeedlings},${r.actualSeedlings},${r.completionRate}\n`;
        });
      }

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.NurseryApp.showToast("Report CSV Exported", "success");
    }
  };

  window.NurseryApp.views.report = ReportCenter;
})();
