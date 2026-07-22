/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - TRANSACTION LEDGER VIEWER
 * Renders read-only stock movements (Receipt, Transfer, Planting, Mortality, Adjustments).
 */

(function () {
  const Ledger = {
    searchQuery: "",
    typeFilter: "all",
    currentPage: 1,
    itemsPerPage: 15,

    init: function () {
      this.renderLayout();
      this.loadLedgerData();
    },

    renderLayout: function () {
      const container = document.getElementById("view-ledger");
      if (!container) return;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-wrap">
            <h1>Transaction Ledger</h1>
            <p>Historical audit logging of seedling arrivals, mortalities, transfers, and field planting dispatches</p>
          </div>
          <div>
            <button class="btn btn-outline" onclick="window.NurseryApp.views.ledger.exportCSV()">
              <i class="fa-solid fa-file-excel"></i> Export Ledger CSV
            </button>
            <button class="btn btn-outline" onclick="window.print()">
              <i class="fa-solid fa-print"></i> Print Ledger Log
            </button>
          </div>
        </div>

        <!-- SEARCH TOOLBAR -->
        <div class="table-toolbar">
          <div class="toolbar-left">
            <div class="table-search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="ledger-search-input" placeholder="Search batch, TX number, remarks...">
            </div>
            
            <select id="filter-ledger-type" class="select-filter">
              <option value="all">All Movements</option>
              <option value="Receipt">Receipts (Arrivals)</option>
              <option value="Transfer">Plot Transfers</option>
              <option value="Mortality">Mortality Loggings</option>
              <option value="Planting">Planting Dispatches</option>
              <option value="Stock Opname Adjustment">Reconciled Adjustments</option>
            </select>
          </div>
          <div class="toolbar-right">
            <span id="ledger-count-badge" style="font-size:12px; color:var(--text-light); font-weight:600;">0 entries logged</span>
          </div>
        </div>

        <!-- LEDGER TABLE -->
        <div class="table-wrapper">
          <table class="custom-table" id="ledger-table">
            <thead>
              <tr>
                <th>Tx Number</th>
                <th>Timestamp</th>
                <th>Batch Number</th>
                <th>Activity Type</th>
                <th>Qty In (+)</th>
                <th>Qty Out (-)</th>
                <th>Audit Balance</th>
                <th>Remarks / Event description</th>
              </tr>
            </thead>
            <tbody id="ledger-table-body">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div class="pagination-wrap" id="ledger-pagination">
          <!-- Dynamically populated -->
        </div>
      `;

      const self = this;
      
      // Bind Search
      document.getElementById("ledger-search-input").addEventListener("input", function (e) {
        self.searchQuery = e.target.value;
        self.currentPage = 1;
        self.loadLedgerData();
      });

      // Bind Filter
      document.getElementById("filter-ledger-type").addEventListener("change", function () {
        self.typeFilter = this.value;
        self.currentPage = 1;
        self.loadLedgerData();
      });
    },

    loadLedgerData: function () {
      const ledger = window.NurseryStorage.getAll("ledger");
      
      // Filter
      let filtered = ledger.filter(l => {
        const q = this.searchQuery.toLowerCase();
        const matchesSearch = l.transactionNumber.toLowerCase().includes(q) || 
                              l.batch.toLowerCase().includes(q) || 
                              l.remarks.toLowerCase().includes(q);

        const matchesType = this.typeFilter === "all" || l.type === this.typeFilter;

        return matchesSearch && matchesType;
      });

      // Sort chronologically descending (newest ledger entry first)
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

      const totalItems = filtered.length;
      document.getElementById("ledger-count-badge").textContent = `${totalItems} ledger entries`;

      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const paginated = filtered.slice(startIndex, startIndex + this.itemsPerPage);

      this.renderTable(paginated);
      this.renderPagination(totalItems);
    },

    renderTable: function (data) {
      const tbody = document.getElementById("ledger-table-body");
      if (!tbody) return;

      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 25px; color:var(--text-muted);">No stock movements recorded in the ledger files.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.map(l => {
        let typeBadge = l.type;
        let styleClass = "planned"; // default info
        if (l.type === "Receipt") styleClass = "healthy";
        if (l.type === "Mortality") styleClass = "dead";
        if (l.type === "Planting") styleClass = "completed";
        if (l.type === "Stock Opname Adjustment") styleClass = "monitoring";

        return `
          <tr>
            <td><strong style="font-family:monospace;">${l.transactionNumber}</strong></td>
            <td>${new Date(l.date).toLocaleString()}</td>
            <td><a href="#" style="color:var(--primary-green); font-weight:700;" onclick="window.NurseryApp.navigateTo('inventory'); window.NurseryApp.views.inventory.onSearch('${l.batch}'); event.preventDefault();">${l.batch}</a></td>
            <td><span class="status-badge ${styleClass}">${typeBadge}</span></td>
            <td style="color:var(--primary-green); font-weight:600;">${l.qtyIn > 0 ? '+' + l.qtyIn.toLocaleString() : '-'}</td>
            <td style="color:var(--critical-red); font-weight:600;">${l.qtyOut > 0 ? '-' + l.qtyOut.toLocaleString() : '-'}</td>
            <td style="font-weight:700;">${l.balance.toLocaleString()}</td>
            <td style="color:var(--text-light); font-size:12px;">${l.remarks}</td>
          </tr>
        `;
      }).join("");
    },

    renderPagination: function (totalItems) {
      const container = document.getElementById("ledger-pagination");
      if (!container) return;

      const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
      
      let html = `<div>Showing ${Math.min(totalItems, (this.currentPage - 1) * this.itemsPerPage + 1)} to ${Math.min(totalItems, this.currentPage * this.itemsPerPage)} of ${totalItems} entries</div>`;
      
      html += `<div class="pagination-controls">`;
      html += `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="window.NurseryApp.views.ledger.goToPage(${this.currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
      
      for (let p = 1; p <= totalPages; p++) {
        html += `<button class="page-btn ${this.currentPage === p ? 'active' : ''}" onclick="window.NurseryApp.views.ledger.goToPage(${p})">${p}</button>`;
      }
      
      html += `<button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="window.NurseryApp.views.ledger.goToPage(${this.currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
      html += `</div>`;

      container.innerHTML = html;
    },

    goToPage: function (page) {
      this.currentPage = page;
      this.loadLedgerData();
    },

    exportCSV: function () {
      const ledger = window.NurseryStorage.getAll("ledger");
      let csv = "Transaction Number,Date,Batch,Type,Qty In,Qty Out,Audited Balance,Remarks\n";
      ledger.forEach(l => {
        csv += `"${l.transactionNumber}","${l.date}","${l.batch}","${l.type}",${l.qtyIn},${l.qtyOut},${l.balance},"${l.remarks}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `Nursery_Ledger_Log_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.NurseryApp.showToast("Ledger CSV Export Completed", "success");
    },

    onSearch: function (q) {
      this.searchQuery = q;
      document.getElementById("ledger-search-input").value = q;
      this.currentPage = 1;
      this.loadLedgerData();
    }
  };

  window.NurseryApp.views.ledger = Ledger;
})();
