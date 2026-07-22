/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - SECURITY AUDIT TRAIL
 * Renders security transaction logs and full JSON before/after state diff inspectors.
 */

(function () {
  const AuditTrail = {
    searchQuery: "",
    moduleFilter: "all",
    currentPage: 1,
    itemsPerPage: 15,

    init: function () {
      this.renderLayout();
      this.loadAuditLogs();
    },

    renderLayout: function () {
      const container = document.getElementById("view-audittrail");
      if (!container) return;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-wrap">
            <h1>Security Audit Trail</h1>
            <p>Chronological records of database logins, configuration modifications, and inventory transactions</p>
          </div>
          <div>
            <button class="btn btn-outline" onclick="window.NurseryApp.views.audittrail.exportCSV()">
              <i class="fa-solid fa-file-csv"></i> Export Audit Logs
            </button>
          </div>
        </div>

        <!-- FILTERS TOOLBAR -->
        <div class="table-toolbar">
          <div class="toolbar-left">
            <div class="table-search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="audit-search-input" placeholder="Search user, action, log ID...">
            </div>
            
            <select id="filter-audit-module" class="select-filter">
              <option value="all">All Modules</option>
              <option value="auth">auth (Logins/Logouts)</option>
              <option value="inventory">inventory (Stock Catalog)</option>
              <option value="monitoring">monitoring (inspections)</option>
              <option value="mortality">mortality (casualties)</option>
              <option value="stock_opname">stock_opname (counts)</option>
              <option value="planting">planting (field dispatches)</option>
              <option value="survival">survival (audits)</option>
              <option value="reclamation">reclamation (campaigns)</option>
              <option value="users">users (credentials)</option>
            </select>
          </div>
          <div class="toolbar-right">
            <span id="audit-log-count-badge" style="font-size:12px; color:var(--text-light); font-weight:600;">0 entries logged</span>
          </div>
        </div>

        <!-- AUDIT TABLE -->
        <div class="table-wrapper">
          <table class="custom-table" id="audit-logs-table">
            <thead>
              <tr>
                <th>Audit ID</th>
                <th>Timestamp</th>
                <th>Operator User</th>
                <th>Module</th>
                <th>Action Activity</th>
                <th>State Inspection</th>
              </tr>
            </thead>
            <tbody id="audit-logs-tbody">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div class="pagination-wrap" id="audit-pagination">
          <!-- Dynamically populated -->
        </div>
      `;

      const self = this;
      
      // Bind Search
      document.getElementById("audit-search-input").addEventListener("input", function (e) {
        self.searchQuery = e.target.value;
        self.currentPage = 1;
        self.loadAuditLogs();
      });

      // Bind Module Filter
      document.getElementById("filter-audit-module").addEventListener("change", function () {
        self.moduleFilter = this.value;
        self.currentPage = 1;
        self.loadAuditLogs();
      });
    },

    loadAuditLogs: function () {
      const tbody = document.getElementById("audit-logs-tbody");
      if (!tbody) return;

      const audits = window.NurseryStorage.getAll("audit_trail");

      // Filter
      let filtered = audits.filter(a => {
        const q = this.searchQuery.toLowerCase();
        const matchesSearch = a.id.toLowerCase().includes(q) || 
                              a.user.toLowerCase().includes(q) || 
                              a.activity.toLowerCase().includes(q) ||
                              a.beforeValue.toLowerCase().includes(q) ||
                              a.afterValue.toLowerCase().includes(q);

        const matchesModule = this.moduleFilter === "all" || a.module === this.moduleFilter;

        return matchesSearch && matchesModule;
      });

      // Sort chronological descending (already handled by unshift, but guarantee here)
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const totalItems = filtered.length;
      document.getElementById("audit-log-count-badge").textContent = `${totalItems} operations logged`;

      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const paginated = filtered.slice(startIndex, startIndex + this.itemsPerPage);

      this.renderTable(paginated);
      this.renderPagination(totalItems);
    },

    renderTable: function (data) {
      const tbody = document.getElementById("audit-logs-tbody");
      if (!tbody) return;

      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 25px; color:var(--text-muted);">No security logs found.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.map(a => {
        let actClass = "planned"; // default info
        if (a.activity === "INSERT") actClass = "healthy";
        if (a.activity === "LOGIN") actClass = "completed";
        if (a.activity === "DELETE") actClass = "dead";
        if (a.activity === "UPDATE") actClass = "monitoring";

        return `
          <tr>
            <td><code style="font-family:monospace; font-weight:700;">${a.id}</code></td>
            <td>${new Date(a.timestamp).toLocaleString()}</td>
            <td><strong>${a.user}</strong></td>
            <td><span style="font-family:monospace; background:var(--bg-gray); padding:4px 8px; border-radius:4px; font-size:11px;">${a.module}</span></td>
            <td><span class="status-badge ${actClass}">${a.activity}</span></td>
            <td>
              <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px;" onclick="window.NurseryApp.views.audittrail.openDiffModal('${a.id}')"><i class="fa-solid fa-code-compare"></i> Inspect State</button>
            </td>
          </tr>
        `;
      }).join("");
    },

    renderPagination: function (totalItems) {
      const container = document.getElementById("audit-pagination");
      if (!container) return;

      const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
      
      let html = `<div>Showing ${Math.min(totalItems, (this.currentPage - 1) * this.itemsPerPage + 1)} to ${Math.min(totalItems, this.currentPage * this.itemsPerPage)} of ${totalItems} entries</div>`;
      
      html += `<div class="pagination-controls">`;
      html += `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="window.NurseryApp.views.audittrail.goToPage(${this.currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
      
      for (let p = 1; p <= totalPages; p++) {
        html += `<button class="page-btn ${this.currentPage === p ? 'active' : ''}" onclick="window.NurseryApp.views.audittrail.goToPage(${p})">${p}</button>`;
      }
      
      html += `<button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="window.NurseryApp.views.audittrail.goToPage(${this.currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
      html += `</div>`;

      container.innerHTML = html;
    },

    goToPage: function (page) {
      this.currentPage = page;
      this.loadAuditLogs();
    },

    openDiffModal: function (id) {
      const log = window.NurseryStorage.getById("audit_trail", id);
      if (!log) return;

      // Format JSON prettily
      const formatJSON = (str) => {
        if (!str || str === "N/A") return "N/A";
        try {
          const parsed = JSON.parse(str);
          return JSON.stringify(parsed, null, 2);
        } catch(e) {
          return str;
        }
      };

      const beforeFormatted = formatJSON(log.beforeValue);
      const afterFormatted = formatJSON(log.afterValue);

      const contentHTML = `
        <div style="font-size:12px; line-height: 1.5;">
          <div style="background:var(--bg-gray); padding:10px; border-radius: var(--border-radius-sm); margin-bottom:15px;">
            <strong>Log ID:</strong> ${log.id}<br>
            <strong>Operator User:</strong> ${log.user}<br>
            <strong>Target Module:</strong> ${log.module} | <strong>Action:</strong> ${log.activity}<br>
            <strong>Logged Timestamp:</strong> ${new Date(log.timestamp).toLocaleString()}
          </div>
          
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
            <div>
              <strong style="display:block; margin-bottom:5px; color:var(--text-light);">STATE BEFORE CHANGE (JSON)</strong>
              <pre style="background:#263238; color:#80C880; padding:12px; border-radius:6px; overflow:auto; max-height:220px; font-family:monospace;">${beforeFormatted}</pre>
            </div>
            <div>
              <strong style="display:block; margin-bottom:5px; color:var(--text-light);">STATE AFTER CHANGE (JSON)</strong>
              <pre style="background:#263238; color:#FFD54F; padding:12px; border-radius:6px; overflow:auto; max-height:220px; font-family:monospace;">${afterFormatted}</pre>
            </div>
          </div>
        </div>
      `;

      window.NurseryApp.showModal(`Audit Inspector: Ticket ${log.id}`, contentHTML, null, null, "Close Audit");
    },

    exportCSV: function () {
      const audits = window.NurseryStorage.getAll("audit_trail");
      let csv = "Audit ID,Timestamp,Operator,Module,Activity,Before Value,After Value\n";
      audits.forEach(a => {
        csv += `"${a.id}","${a.timestamp}","${a.user}","${a.module}","${a.activity}","${a.beforeValue.replace(/"/g, '""')}","${a.afterValue.replace(/"/g, '""')}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `Security_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.NurseryApp.showToast("Audit Trail CSV Exported", "success");
    }
  };

  window.NurseryApp.views.audittrail = AuditTrail;
})();
