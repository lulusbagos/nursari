/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - MASTER REGISTRY CRUD
 * Handles CRUD operations for Seedling Types, Suppliers, Nursery Areas, and Planting Areas.
 */

(function () {
  const MasterData = {
    activeTab: "seedling_types", // seedling_types, suppliers, nursery_areas, planting_areas
    searchQuery: "",
    sortBy: "id",
    sortOrder: "asc",
    currentPage: 1,
    itemsPerPage: 10,

    init: function () {
      this.renderLayout();
      this.loadTabData();
    },

    renderLayout: function () {
      const container = document.getElementById("view-masterdata");
      if (!container) return;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-wrap">
            <h1>Master Registry</h1>
            <p>Maintain coal mine reclamation botanical codes, suppliers, plots, and dump zones</p>
          </div>
          <div>
            <button class="btn btn-primary" id="btn-master-create-new">
              <i class="fa-solid fa-plus"></i> Create Registry Entry
            </button>
          </div>
        </div>

        <!-- SUB TAB CONTAINER -->
        <div class="tab-container">
          <button class="tab-btn ${this.activeTab === 'seedling_types' ? 'active' : ''}" data-tab="seedling_types">Seedling Species</button>
          <button class="tab-btn ${this.activeTab === 'suppliers' ? 'active' : ''}" data-tab="suppliers">Suppliers Registry</button>
          <button class="tab-btn ${this.activeTab === 'nursery_areas' ? 'active' : ''}" data-tab="nursery_areas">Nursery Plots</button>
          <button class="tab-btn ${this.activeTab === 'planting_areas' ? 'active' : ''}" data-tab="planting_areas">Planting Dump Blocks</button>
        </div>

        <!-- SEARCH TOOLBAR -->
        <div class="table-toolbar">
          <div class="toolbar-left">
            <div class="table-search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="master-search-input" placeholder="Search registry records...">
            </div>
          </div>
          <div class="toolbar-right">
            <!-- Details counts -->
            <span id="master-record-count-badge" style="font-size:12px; color:var(--text-light); font-weight:600;">0 records found</span>
          </div>
        </div>

        <!-- TABLE GRID -->
        <div class="table-wrapper">
          <table class="custom-table" id="master-data-table">
            <!-- Populated dynamically -->
          </table>
        </div>

        <!-- PAGINATION -->
        <div class="pagination-wrap" id="master-pagination">
          <!-- Populated dynamically -->
        </div>
      `;

      // Bind Tab switches
      const self = this;
      container.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", function () {
          self.activeTab = this.getAttribute("data-tab");
          container.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
          this.classList.add("active");
          self.searchQuery = "";
          self.currentPage = 1;
          self.sortBy = "id";
          self.sortOrder = "asc";
          self.loadTabData();
        });
      });

      // Bind Search
      const searchInput = document.getElementById("master-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", function (e) {
          self.searchQuery = e.target.value;
          self.currentPage = 1;
          self.loadTabData();
        });
      }

      // Bind Add Button
      document.getElementById("btn-master-create-new").addEventListener("click", function () {
        self.openCreateModal();
      });
    },

    loadTabData: function () {
      const data = window.NurseryStorage.getAll(this.activeTab);
      
      // Filter
      let filtered = data.filter(item => {
        const query = this.searchQuery.toLowerCase();
        if (this.activeTab === "seedling_types") {
          return item.code.toLowerCase().includes(query) || 
                 item.name.toLowerCase().includes(query) || 
                 item.scientificName.toLowerCase().includes(query) ||
                 item.category.toLowerCase().includes(query);
        } else if (this.activeTab === "suppliers") {
          return item.name.toLowerCase().includes(query) || 
                 item.contactPerson.toLowerCase().includes(query) || 
                 item.email.toLowerCase().includes(query) || 
                 item.phone.includes(query);
        } else if (this.activeTab === "nursery_areas") {
          return item.code.toLowerCase().includes(query) || 
                 item.name.toLowerCase().includes(query) || 
                 item.location.toLowerCase().includes(query);
        } else if (this.activeTab === "planting_areas") {
          return item.code.toLowerCase().includes(query) || 
                 item.name.toLowerCase().includes(query);
        }
        return false;
      });

      // Sort
      filtered.sort((a, b) => {
        let valA = a[this.sortBy] ? String(a[this.sortBy]).toLowerCase() : "";
        let valB = b[this.sortBy] ? String(b[this.sortBy]).toLowerCase() : "";
        if (this.sortBy === "capacity" || this.sortBy === "size") {
          valA = parseFloat(a[this.sortBy]) || 0;
          valB = parseFloat(b[this.sortBy]) || 0;
        }

        if (valA < valB) return this.sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return this.sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      // Pagination
      const totalItems = filtered.length;
      document.getElementById("master-record-count-badge").textContent = `${totalItems} entry matches`;

      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const paginatedData = filtered.slice(startIndex, startIndex + this.itemsPerPage);

      this.renderTable(paginatedData);
      this.renderPagination(totalItems);
    },

    renderTable: function (data) {
      const table = document.getElementById("master-data-table");
      if (!table) return;

      const user = window.NurseryAuth.getCurrentUser();
      const canWrite = window.NurseryAuth.hasPermission("masterdata", "write");
      const canDelete = window.NurseryAuth.hasPermission("masterdata", "delete");

      let headersHTML = "";
      let rowsHTML = "";

      const getSortClass = (field) => {
        if (this.sortBy === field) {
          return this.sortOrder === "asc" ? "sort-asc" : "sort-desc";
        }
        return "";
      };

      if (this.activeTab === "seedling_types") {
        headersHTML = `
          <thead>
            <tr>
              <th class="${getSortClass('code')}" onclick="window.NurseryApp.views.masterdata.changeSort('code')">Code</th>
              <th class="${getSortClass('name')}" onclick="window.NurseryApp.views.masterdata.changeSort('name')">Common Name</th>
              <th class="${getSortClass('category')}" onclick="window.NurseryApp.views.masterdata.changeSort('category')">Category</th>
              <th class="${getSortClass('scientificName')}" onclick="window.NurseryApp.views.masterdata.changeSort('scientificName')">Scientific Name</th>
              <th>Description</th>
              <th style="text-align: right; width: 120px;">Actions</th>
            </tr>
          </thead>
        `;

        rowsHTML = data.map(item => `
          <tr>
            <td><strong>${item.code}</strong></td>
            <td>${item.name}</td>
            <td><span class="status-badge ${item.category === 'Fast Growing' ? 'healthy' : 'planned'}">${item.category}</span></td>
            <td><em>${item.scientificName}</em></td>
            <td style="max-width:250px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${item.description}">${item.description}</td>
            <td style="text-align: right;">
              <button class="btn btn-outline" style="padding: 5px 8px; font-size:11px;" onclick="window.NurseryApp.views.masterdata.openEditModal('${item.id}')" ${!canWrite ? 'disabled' : ''}><i class="fa-solid fa-edit"></i></button>
              <button class="btn btn-outline" style="padding: 5px 8px; font-size:11px; color:var(--critical-red);" onclick="window.NurseryApp.views.masterdata.handleDelete('${item.id}')" ${!canDelete ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `).join("");
      } else if (this.activeTab === "suppliers") {
        headersHTML = `
          <thead>
            <tr>
              <th class="${getSortClass('name')}" onclick="window.NurseryApp.views.masterdata.changeSort('name')">Supplier Name</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th style="text-align: right; width: 120px;">Actions</th>
            </tr>
          </thead>
        `;

        rowsHTML = data.map(item => `
          <tr>
            <td><strong>${item.name}</strong></td>
            <td>${item.contactPerson}</td>
            <td>${item.phone}</td>
            <td><a href="mailto:${item.email}" style="color:var(--primary-green); font-weight:500;">${item.email}</a></td>
            <td>${item.address}</td>
            <td style="text-align: right;">
              <button class="btn btn-outline" style="padding: 5px 8px; font-size:11px;" onclick="window.NurseryApp.views.masterdata.openEditModal('${item.id}')" ${!canWrite ? 'disabled' : ''}><i class="fa-solid fa-edit"></i></button>
              <button class="btn btn-outline" style="padding: 5px 8px; font-size:11px; color:var(--critical-red);" onclick="window.NurseryApp.views.masterdata.handleDelete('${item.id}')" ${!canDelete ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `).join("");
      } else if (this.activeTab === "nursery_areas") {
        headersHTML = `
          <thead>
            <tr>
              <th class="${getSortClass('code')}" onclick="window.NurseryApp.views.masterdata.changeSort('code')">Plot Code</th>
              <th class="${getSortClass('name')}" onclick="window.NurseryApp.views.masterdata.changeSort('name')">Plot Name</th>
              <th class="${getSortClass('capacity')}" onclick="window.NurseryApp.views.masterdata.changeSort('capacity')">Capacity</th>
              <th class="${getSortClass('location')}" onclick="window.NurseryApp.views.masterdata.changeSort('location')">Location</th>
              <th>Description</th>
              <th style="text-align: right; width: 120px;">Actions</th>
            </tr>
          </thead>
        `;

        rowsHTML = data.map(item => `
          <tr>
            <td><strong>${item.code}</strong></td>
            <td>${item.name}</td>
            <td>${item.capacity.toLocaleString()} seedlings</td>
            <td>${item.location}</td>
            <td>${item.description}</td>
            <td style="text-align: right;">
              <button class="btn btn-outline" style="padding: 5px 8px; font-size:11px;" onclick="window.NurseryApp.views.masterdata.openEditModal('${item.id}')" ${!canWrite ? 'disabled' : ''}><i class="fa-solid fa-edit"></i></button>
              <button class="btn btn-outline" style="padding: 5px 8px; font-size:11px; color:var(--critical-red);" onclick="window.NurseryApp.views.masterdata.handleDelete('${item.id}')" ${!canDelete ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `).join("");
      } else if (this.activeTab === "planting_areas") {
        headersHTML = `
          <thead>
            <tr>
              <th class="${getSortClass('code')}" onclick="window.NurseryApp.views.masterdata.changeSort('code')">Block Code</th>
              <th class="${getSortClass('name')}" onclick="window.NurseryApp.views.masterdata.changeSort('name')">Block Area Name</th>
              <th class="${getSortClass('size')}" onclick="window.NurseryApp.views.masterdata.changeSort('size')">Area Size (Ha)</th>
              <th>GPS Coordinates</th>
              <th style="text-align: right; width: 120px;">Actions</th>
            </tr>
          </thead>
        `;

        rowsHTML = data.map(item => `
          <tr>
            <td><strong>${item.code}</strong></td>
            <td>${item.name}</td>
            <td>${item.size} Hectares</td>
            <td><code style="background:var(--bg-gray); padding:4px 8px; border-radius:4px; font-size:11px;">${item.coordinates}</code></td>
            <td style="text-align: right;">
              <button class="btn btn-outline" style="padding: 5px 8px; font-size:11px;" onclick="window.NurseryApp.views.masterdata.openEditModal('${item.id}')" ${!canWrite ? 'disabled' : ''}><i class="fa-solid fa-edit"></i></button>
              <button class="btn btn-outline" style="padding: 5px 8px; font-size:11px; color:var(--critical-red);" onclick="window.NurseryApp.views.masterdata.handleDelete('${item.id}')" ${!canDelete ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `).join("");
      }

      table.innerHTML = headersHTML + `<tbody>` + (rowsHTML || `<tr><td colspan="6" style="text-align:center; padding: 25px; color: var(--text-muted);">No registry files match current parameters.</td></tr>`) + `</tbody>`;
    },

    changeSort: function (field) {
      if (this.sortBy === field) {
        this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
      } else {
        this.sortBy = field;
        this.sortOrder = "asc";
      }
      this.loadTabData();
    },

    renderPagination: function (totalItems) {
      const container = document.getElementById("master-pagination");
      if (!container) return;

      const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
      
      let html = `<div>Showing ${Math.min(totalItems, (this.currentPage - 1) * this.itemsPerPage + 1)} to ${Math.min(totalItems, this.currentPage * this.itemsPerPage)} of ${totalItems} entries</div>`;
      
      html += `<div class="pagination-controls">`;
      html += `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="window.NurseryApp.views.masterdata.goToPage(${this.currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
      
      for (let p = 1; p <= totalPages; p++) {
        html += `<button class="page-btn ${this.currentPage === p ? 'active' : ''}" onclick="window.NurseryApp.views.masterdata.goToPage(${p})">${p}</button>`;
      }
      
      html += `<button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="window.NurseryApp.views.masterdata.goToPage(${this.currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
      html += `</div>`;

      container.innerHTML = html;
    },

    goToPage: function (page) {
      this.currentPage = page;
      this.loadTabData();
    },

    openCreateModal: function () {
      const self = this;
      let formHTML = "";
      let title = "";

      if (this.activeTab === "seedling_types") {
        title = "Register Seedling Species Code";
        formHTML = `
          <form id="master-item-form" class="form-grid">
            <div class="form-group">
              <label>Species Code</label>
              <input type="text" id="reg-code" class="form-input" placeholder="e.g. SNG-009" required>
            </div>
            <div class="form-group">
              <label>Common Name</label>
              <input type="text" id="reg-name" class="form-input" placeholder="e.g. Sengon Buto" required>
            </div>
            <div class="form-group">
              <label>Scientific Name</label>
              <input type="text" id="reg-scientific" class="form-input" placeholder="e.g. Falcataria gigant" required>
            </div>
            <div class="form-group">
              <label>Silviculture Category</label>
              <select id="reg-category" class="form-input">
                <option value="Fast Growing">Fast Growing</option>
                <option value="Local Species">Local Species</option>
                <option value="Late Successional">Late Successional</option>
                <option value="Conservation Species">Conservation Species</option>
              </select>
            </div>
            <div class="form-group col-span-2">
              <label>Field Botanical Description</label>
              <textarea id="reg-desc" class="form-input" style="height: 80px;" placeholder="Identify foliage features, target soil pH..."></textarea>
            </div>
          </form>
        `;
      } else if (this.activeTab === "suppliers") {
        title = "Register Botanical Seedling Supplier";
        formHTML = `
          <form id="master-item-form" class="form-grid">
            <div class="form-group col-span-2">
              <label>Supplier Company Name</label>
              <input type="text" id="reg-name" class="form-input" placeholder="e.g. CV Horti Lestari" required>
            </div>
            <div class="form-group">
              <label>Contact Person PIC</label>
              <input type="text" id="reg-cp" class="form-input" placeholder="e.g. Budi Hartono" required>
            </div>
            <div class="form-group">
              <label>Primary Phone</label>
              <input type="text" id="reg-phone" class="form-input" placeholder="e.g. 0812-xxxx" required>
            </div>
            <div class="form-group col-span-2">
              <label>Email Address</label>
              <input type="email" id="reg-email" class="form-input" placeholder="e.g. sales@horti.com" required>
            </div>
            <div class="form-group col-span-2">
              <label>Office & Seedbeds Address</label>
              <textarea id="reg-address" class="form-input" style="height: 60px;" required></textarea>
            </div>
          </form>
        `;
      } else if (this.activeTab === "nursery_areas") {
        title = "Add Nursery Cultivation Plot";
        formHTML = `
          <form id="master-item-form" class="form-grid">
            <div class="form-group">
              <label>Area Grid Code (Map Link)</label>
              <input type="text" id="reg-code" class="form-input" placeholder="e.g. E1" required>
            </div>
            <div class="form-group">
              <label>Plot Name Label</label>
              <input type="text" id="reg-name" class="form-input" placeholder="e.g. Greenhouse Plot E1" required>
            </div>
            <div class="form-group">
              <label>Max Quantity Capacity</label>
              <input type="number" id="reg-capacity" class="form-input" value="5000" min="1" required>
            </div>
            <div class="form-group">
              <label>Nursery Sector Location</label>
              <input type="text" id="reg-location" class="form-input" placeholder="e.g. East Wing Sector 3" required>
            </div>
            <div class="form-group col-span-2">
              <label>Irrigation & Shade description</label>
              <textarea id="reg-desc" class="form-input" style="height: 60px;"></textarea>
            </div>
          </form>
        `;
      } else if (this.activeTab === "planting_areas") {
        title = "Add Reclamation Pit Dump Block";
        formHTML = `
          <form id="master-item-form" class="form-grid">
            <div class="form-group">
              <label>Block Code</label>
              <input type="text" id="reg-code" class="form-input" placeholder="e.g. BLK-G-PIT3" required>
            </div>
            <div class="form-group">
              <label>Block Area Name</label>
              <input type="text" id="reg-name" class="form-input" placeholder="e.g. Block G - South Dump Pit 3" required>
            </div>
            <div class="form-group">
              <label>Block Size (Hectares)</label>
              <input type="number" id="reg-size" class="form-input" step="0.01" placeholder="e.g. 5.5" required>
            </div>
            <div class="form-group">
              <label>GPS Coordinates (Lat, Long)</label>
              <input type="text" id="reg-coords" class="form-input" placeholder="e.g. -0.9654, 117.4725" required>
            </div>
          </form>
        `;
      }

      window.NurseryApp.showModal(title, formHTML, function () {
        const form = document.getElementById("master-item-form");
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const record = {};

        if (self.activeTab === "seedling_types") {
          record.code = document.getElementById("reg-code").value;
          record.name = document.getElementById("reg-name").value;
          record.scientificName = document.getElementById("reg-scientific").value;
          record.category = document.getElementById("reg-category").value;
          record.description = document.getElementById("reg-desc").value;
        } else if (self.activeTab === "suppliers") {
          record.name = document.getElementById("reg-name").value;
          record.contactPerson = document.getElementById("reg-cp").value;
          record.phone = document.getElementById("reg-phone").value;
          record.email = document.getElementById("reg-email").value;
          record.address = document.getElementById("reg-address").value;
        } else if (self.activeTab === "nursery_areas") {
          record.code = document.getElementById("reg-code").value.toUpperCase();
          record.name = document.getElementById("reg-name").value;
          record.capacity = parseInt(document.getElementById("reg-capacity").value);
          record.location = document.getElementById("reg-location").value;
          record.description = document.getElementById("reg-desc").value;
        } else if (self.activeTab === "planting_areas") {
          record.code = document.getElementById("reg-code").value.toUpperCase();
          record.name = document.getElementById("reg-name").value;
          record.size = parseFloat(document.getElementById("reg-size").value);
          record.coordinates = document.getElementById("reg-coords").value;
        }

        window.NurseryStorage.insert(self.activeTab, record, user.name);
        window.NurseryApp.showToast("Record logged successfully!", "success");
        self.loadTabData();
        return true;
      });
    },

    openEditModal: function (id) {
      const self = this;
      const record = window.NurseryStorage.getById(this.activeTab, id);
      if (!record) return;

      let formHTML = "";
      let title = "";

      if (this.activeTab === "seedling_types") {
        title = "Edit Seedling Species Code";
        formHTML = `
          <form id="master-item-form" class="form-grid">
            <div class="form-group">
              <label>Species Code</label>
              <input type="text" id="reg-code" class="form-input" value="${record.code}" required>
            </div>
            <div class="form-group">
              <label>Common Name</label>
              <input type="text" id="reg-name" class="form-input" value="${record.name}" required>
            </div>
            <div class="form-group">
              <label>Scientific Name</label>
              <input type="text" id="reg-scientific" class="form-input" value="${record.scientificName}" required>
            </div>
            <div class="form-group">
              <label>Silviculture Category</label>
              <select id="reg-category" class="form-input">
                <option value="Fast Growing" ${record.category === 'Fast Growing' ? 'selected' : ''}>Fast Growing</option>
                <option value="Local Species" ${record.category === 'Local Species' ? 'selected' : ''}>Local Species</option>
                <option value="Late Successional" ${record.category === 'Late Successional' ? 'selected' : ''}>Late Successional</option>
                <option value="Conservation Species" ${record.category === 'Conservation Species' ? 'selected' : ''}>Conservation Species</option>
              </select>
            </div>
            <div class="form-group col-span-2">
              <label>Field Botanical Description</label>
              <textarea id="reg-desc" class="form-input" style="height: 80px;">${record.description}</textarea>
            </div>
          </form>
        `;
      } else if (this.activeTab === "suppliers") {
        title = "Edit Seedling Supplier";
        formHTML = `
          <form id="master-item-form" class="form-grid">
            <div class="form-group col-span-2">
              <label>Supplier Company Name</label>
              <input type="text" id="reg-name" class="form-input" value="${record.name}" required>
            </div>
            <div class="form-group">
              <label>Contact Person PIC</label>
              <input type="text" id="reg-cp" class="form-input" value="${record.contactPerson}" required>
            </div>
            <div class="form-group">
              <label>Primary Phone</label>
              <input type="text" id="reg-phone" class="form-input" value="${record.phone}" required>
            </div>
            <div class="form-group col-span-2">
              <label>Email Address</label>
              <input type="email" id="reg-email" class="form-input" value="${record.email}" required>
            </div>
            <div class="form-group col-span-2">
              <label>Office & Seedbeds Address</label>
              <textarea id="reg-address" class="form-input" style="height: 60px;" required>${record.address}</textarea>
            </div>
          </form>
        `;
      } else if (this.activeTab === "nursery_areas") {
        title = "Edit Nursery Cultivation Plot";
        formHTML = `
          <form id="master-item-form" class="form-grid">
            <div class="form-group">
              <label>Area Grid Code</label>
              <input type="text" id="reg-code" class="form-input" value="${record.code}" required>
            </div>
            <div class="form-group">
              <label>Plot Name Label</label>
              <input type="text" id="reg-name" class="form-input" value="${record.name}" required>
            </div>
            <div class="form-group">
              <label>Max Quantity Capacity</label>
              <input type="number" id="reg-capacity" class="form-input" value="${record.capacity}" min="1" required>
            </div>
            <div class="form-group">
              <label>Nursery Sector Location</label>
              <input type="text" id="reg-location" class="form-input" value="${record.location}" required>
            </div>
            <div class="form-group col-span-2">
              <label>Irrigation & Shade description</label>
              <textarea id="reg-desc" class="form-input" style="height: 60px;">${record.description}</textarea>
            </div>
          </form>
        `;
      } else if (this.activeTab === "planting_areas") {
        title = "Edit Reclamation Pit Dump Block";
        formHTML = `
          <form id="master-item-form" class="form-grid">
            <div class="form-group">
              <label>Block Code</label>
              <input type="text" id="reg-code" class="form-input" value="${record.code}" required>
            </div>
            <div class="form-group">
              <label>Block Area Name</label>
              <input type="text" id="reg-name" class="form-input" value="${record.name}" required>
            </div>
            <div class="form-group">
              <label>Block Size (Hectares)</label>
              <input type="number" id="reg-size" class="form-input" step="0.01" value="${record.size}" required>
            </div>
            <div class="form-group">
              <label>GPS Coordinates</label>
              <input type="text" id="reg-coords" class="form-input" value="${record.coordinates}" required>
            </div>
          </form>
        `;
      }

      window.NurseryApp.showModal(title, formHTML, function () {
        const form = document.getElementById("master-item-form");
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const updated = { ...record };

        if (self.activeTab === "seedling_types") {
          updated.code = document.getElementById("reg-code").value;
          updated.name = document.getElementById("reg-name").value;
          updated.scientificName = document.getElementById("reg-scientific").value;
          updated.category = document.getElementById("reg-category").value;
          updated.description = document.getElementById("reg-desc").value;
        } else if (self.activeTab === "suppliers") {
          updated.name = document.getElementById("reg-name").value;
          updated.contactPerson = document.getElementById("reg-cp").value;
          updated.phone = document.getElementById("reg-phone").value;
          updated.email = document.getElementById("reg-email").value;
          updated.address = document.getElementById("reg-address").value;
        } else if (self.activeTab === "nursery_areas") {
          updated.code = document.getElementById("reg-code").value.toUpperCase();
          updated.name = document.getElementById("reg-name").value;
          updated.capacity = parseInt(document.getElementById("reg-capacity").value);
          updated.location = document.getElementById("reg-location").value;
          updated.description = document.getElementById("reg-desc").value;
        } else if (self.activeTab === "planting_areas") {
          updated.code = document.getElementById("reg-code").value.toUpperCase();
          updated.name = document.getElementById("reg-name").value;
          updated.size = parseFloat(document.getElementById("reg-size").value);
          updated.coordinates = document.getElementById("reg-coords").value;
        }

        window.NurseryStorage.update(self.activeTab, id, updated, user.name);
        window.NurseryApp.showToast("Record updated successfully!", "success");
        self.loadTabData();
        return true;
      });
    },

    handleDelete: function (id) {
      const self = this;
      window.NurseryApp.showModal(
        "Confirm Deletion",
        "<p>Are you sure you want to delete this registry item? Doing so might disrupt integrity references in linked inventory records.</p>",
        function () {
          const user = window.NurseryAuth.getCurrentUser();
          window.NurseryStorage.delete(self.activeTab, id, user.name);
          window.NurseryApp.showToast("Registry entry deleted.", "warning");
          self.loadTabData();
          return true;
        }
      );
    },

    onSearch: function (q) {
      this.searchQuery = q;
      document.getElementById("master-search-input").value = q;
      this.currentPage = 1;
      this.loadTabData();
    }
  };

  window.NurseryApp.views.masterdata = MasterData;
})();
