/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - USER MANAGEMENT & RBAC
 * Manages accounts and visualizes role authorization metrics.
 */

(function () {
  const UserManagement = {
    init: function () {
      this.renderLayout();
      this.loadUserData();
      this.renderRBACMatrix();
    },

    renderLayout: function () {
      const container = document.getElementById("view-usermanagement");
      if (!container) return;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-wrap">
            <h1>User Accounts & Access Matrix</h1>
            <p>Administer user sessions and inspect security role permissions matrix</p>
          </div>
          <div>
            <button class="btn btn-primary" id="btn-create-user" ${!window.NurseryAuth.hasPermission("usermanagement", "write") ? 'disabled' : ''}>
              <i class="fa-solid fa-user-plus"></i> Add Account Entry
            </button>
          </div>
        </div>

        <div class="dashboard-grid">
          
          <!-- Users List -->
          <div class="dashboard-card col-7">
            <div class="card-header">
              <span class="card-title">Registered Accounts</span>
            </div>
            <div class="table-wrapper">
              <table class="custom-table" id="users-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Security Role</th>
                    <th>Status</th>
                    <th style="text-align: right; width: 120px;">Actions</th>
                  </tr>
                </thead>
                <tbody id="users-tbody">
                  <!-- Dynamically populated -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- RBAC Matrix -->
          <div class="dashboard-card col-5">
            <div class="card-header">
              <span class="card-title">Role-Based Access Control (RBAC) Matrix</span>
            </div>
            <div style="font-size:12px; line-height:1.4; color:var(--text-light); margin-bottom:15px;">
              Verify system module security privileges across role authorization levels.
            </div>
            <div class="table-wrapper" style="overflow:auto;">
              <table class="matrix-table" id="rbac-matrix-table-element">
                <!-- Dynamically populated Matrix -->
              </table>
            </div>
          </div>

        </div>
      `;

      const self = this;
      document.getElementById("btn-create-user").addEventListener("click", () => self.openCreateModal());
    },

    loadUserData: function () {
      const tbody = document.getElementById("users-tbody");
      if (!tbody) return;

      const users = window.NurseryStorage.getAll("users");
      const current = window.NurseryAuth.getCurrentUser();
      const canWrite = window.NurseryAuth.hasPermission("usermanagement", "write");
      const canDelete = window.NurseryAuth.hasPermission("usermanagement", "delete");

      tbody.innerHTML = users.map(u => {
        const isSelf = current && String(current.id) === String(u.id);
        const statusClass = u.status.toLowerCase();

        return `
          <tr>
            <td><strong>${u.name} ${isSelf ? '<span style="font-size:10px; color:var(--text-light);">(You)</span>' : ''}</strong></td>
            <td>${u.email}</td>
            <td><span class="status-badge planned" style="font-weight:600;">${u.role}</span></td>
            <td><span class="status-badge ${statusClass}">${u.status}</span></td>
            <td style="text-align: right;">
              <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px;" onclick="window.NurseryApp.views.usermanagement.openEditModal('${u.id}')" ${!canWrite ? 'disabled' : ''}><i class="fa-solid fa-edit"></i></button>
              <button class="btn btn-outline" style="padding: 4px 8px; font-size:11px; color:var(--critical-red);" onclick="window.NurseryApp.views.usermanagement.handleDelete('${u.id}')" ${!canDelete || isSelf ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `;
      }).join("");
    },

    renderRBACMatrix: function () {
      const table = document.getElementById("rbac-matrix-table-element");
      if (!table) return;

      const matrix = window.NurseryAuth.permissions;
      const roles = ["Admin", "Supervisor", "Environment Officer", "Viewer"];

      let html = `
        <thead>
          <tr>
            <th>System Module</th>
            <th>Admin</th>
            <th>Superv</th>
            <th>Officer</th>
            <th>Viewer</th>
          </tr>
        </thead>
        <tbody>
      `;

      for (const [module, rules] of Object.entries(matrix)) {
        html += `<tr><td><strong>${module.toUpperCase()}</strong></td>`;
        
        roles.forEach(role => {
          let hasAccess = false;
          if (Array.isArray(rules)) {
            hasAccess = rules.includes(role);
          } else if (rules.read) {
            // Check general read access
            hasAccess = rules.read.includes(role);
          }

          if (hasAccess) {
            html += `<td><i class="fa-solid fa-check matrix-check"></i></td>`;
          } else {
            html += `<td><i class="fa-solid fa-xmark matrix-cross"></i></td>`;
          }
        });
        html += `</tr>`;
      }

      html += `</tbody>`;
      table.innerHTML = html;
    },

    openCreateModal: function () {
      const self = this;
      const formHTML = `
        <form id="user-mgmt-form" class="form-grid">
          <div class="form-group col-span-2">
            <label>Full Name</label>
            <input type="text" id="usr-name" class="form-input" placeholder="e.g. Rinaldi Sasana" required>
          </div>
          <div class="form-group col-span-2">
            <label>Enterprise E-mail</label>
            <input type="email" id="usr-email" class="form-input" placeholder="e.g. rinaldi.s@indexim.com" required>
          </div>
          <div class="form-group">
            <label>Initial Password</label>
            <input type="password" id="usr-pwd" class="form-input" value="user123" required>
          </div>
          <div class="form-group">
            <label>System Role Assignment</label>
            <select id="usr-role" class="form-input">
              <option value="Admin">Admin</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Environment Officer">Environment Officer</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
          <div class="form-group col-span-2">
            <label>Initial Status</label>
            <select id="usr-status" class="form-input">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Create User Account", formHTML, function () {
        const form = document.getElementById("user-mgmt-form");
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const email = document.getElementById("usr-email").value.toLowerCase();

        // Check duplicate email
        const users = window.NurseryStorage.getAll("users");
        if (users.some(u => u.email.toLowerCase() === email)) {
          window.NurseryApp.showToast("Email address already registered.", "error");
          return false;
        }

        const record = {
          name: document.getElementById("usr-name").value,
          email: email,
          password: document.getElementById("usr-pwd").value,
          role: document.getElementById("usr-role").value,
          status: document.getElementById("usr-status").value
        };

        window.NurseryStorage.insert("users", record, user.name);
        window.NurseryApp.showToast(`User account created: ${record.email}`, "success");
        
        self.loadUserData();
        return true;
      });
    },

    openEditModal: function (id) {
      const self = this;
      const record = window.NurseryStorage.getById("users", id);
      if (!record) return;

      const formHTML = `
        <form id="user-mgmt-form" class="form-grid">
          <div class="form-group col-span-2">
            <label>Full Name</label>
            <input type="text" id="usr-name" class="form-input" value="${record.name}" required>
          </div>
          <div class="form-group col-span-2">
            <label>Enterprise E-mail</label>
            <input type="email" id="usr-email" class="form-input" value="${record.email}" required>
          </div>
          <div class="form-group">
            <label>Password (Change if needed)</label>
            <input type="password" id="usr-pwd" class="form-input" value="${record.password}" required>
          </div>
          <div class="form-group">
            <label>System Role Assignment</label>
            <select id="usr-role" class="form-input">
              <option value="Admin" ${record.role === 'Admin' ? 'selected' : ''}>Admin</option>
              <option value="Supervisor" ${record.role === 'Supervisor' ? 'selected' : ''}>Supervisor</option>
              <option value="Environment Officer" ${record.role === 'Environment Officer' ? 'selected' : ''}>Environment Officer</option>
              <option value="Viewer" ${record.role === 'Viewer' ? 'selected' : ''}>Viewer</option>
            </select>
          </div>
          <div class="form-group col-span-2">
            <label>Account Status</label>
            <select id="usr-status" class="form-input">
              <option value="Active" ${record.status === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Inactive" ${record.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </form>
      `;

      window.NurseryApp.showModal("Edit Account details", formHTML, function () {
        const form = document.getElementById("user-mgmt-form");
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const user = window.NurseryAuth.getCurrentUser();
        const updated = {
          ...record,
          name: document.getElementById("usr-name").value,
          email: document.getElementById("usr-email").value.toLowerCase(),
          password: document.getElementById("usr-pwd").value,
          role: document.getElementById("usr-role").value,
          status: document.getElementById("usr-status").value
        };

        window.NurseryStorage.update("users", id, updated, user.name);
        window.NurseryApp.showToast("Account details updated successfully.", "success");
        
        self.loadUserData();
        return true;
      });
    },

    handleDelete: function (id) {
      const self = this;
      const record = window.NurseryStorage.getById("users", id);
      if (!record) return;

      window.NurseryApp.showModal(
        "Delete User Account",
        `<p>Are you sure you want to terminate account <strong>${record.email}</strong>? They will instantly lose system access.</p>`,
        function () {
          const user = window.NurseryAuth.getCurrentUser();
          window.NurseryStorage.delete("users", id, user.name);
          window.NurseryApp.showToast("User account terminated.", "warning");
          self.loadUserData();
          return true;
        }
      );
    }
  };

  window.NurseryApp.views.usermanagement = UserManagement;
})();
