/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - CORE FRAMEWORK & ROUTING
 * Coordinates authentication states, theme changes, side menu views, toasts, and modal interactions.
 */

(function () {
  const App = {
    views: {}, // Views register their rendering functions here
    activeView: "dashboard",
    currentSearchQuery: "",

    init: function () {
      this.bindDOMEvents();
      this.checkSession();
      this.initTheme();
      this.initChartDefaults();
      this.updateNotifications();
    },

    bindDOMEvents: function () {
      const self = this;

      // Login Form Submit
      const loginForm = document.getElementById("login-form");
      if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
          e.preventDefault();
          const email = document.getElementById("login-email").value.trim();
          const password = document.getElementById("login-password").value;
          const remember = document.getElementById("remember-me").checked;
          
          if (email.toLowerCase() === "ayla" && password === "Ayla") {
            self.triggerAylaLogin(remember);
            return;
          }

          try {
            const user = window.NurseryAuth.login(email, password, remember);
            self.showToast(`Welcome back, ${user.name}!`, "success");
            self.checkSession();
          } catch (err) {
            self.showToast(err.message, "error");
          }
        });
      }

      // Password Visibility Toggle
      const pwdToggle = document.getElementById("toggle-pwd-icon");
      if (pwdToggle) {
        pwdToggle.addEventListener("click", function () {
          const pwdField = document.getElementById("login-password");
          if (pwdField.type === "password") {
            pwdField.type = "text";
            pwdToggle.classList.replace("fa-eye", "fa-eye-slash");
          } else {
            pwdField.type = "password";
            pwdToggle.classList.replace("fa-eye-slash", "fa-eye");
          }
        });
      }

      // Forgot Password Click
      const forgotLink = document.getElementById("forgot-password-link");
      if (forgotLink) {
        forgotLink.addEventListener("click", function () {
          self.showModal(
            "Access Recovery Portal",
            `<div style="font-size: 13px; line-height: 1.6;">
              <p>For security, password resets are handled by the <strong>Enterprise Security & Identity Access Management (SIAM)</strong> team.</p>
              <p style="margin-top:10px;">Please contact <strong>siam.support@indexim.com</strong> or call Ext. <strong>4100</strong> to verify credentials.</p>
              <p style="margin-top:10px; background:var(--bg-gray); padding:10px; border-radius: var(--border-radius-sm);">
                <strong>Default Accounts:</strong><br>
                Email: admin@indexim.com<br>
                Password: admin123
              </p>
             </div>`,
            null,
            null,
            "Acknowledge"
          );
        });
      }

      // Sidebar Navigation Clicks
      const menuItems = document.querySelectorAll(".sidebar-menu .menu-item");
      menuItems.forEach(item => {
        item.addEventListener("click", function () {
          const viewName = this.getAttribute("data-view");
          self.navigateTo(viewName);
        });
      });

      // Sidebar Toggle (Mobile)
      const menuToggleBtn = document.getElementById("sidebar-toggle-btn");
      const appContainer = document.getElementById("app-container");
      if (menuToggleBtn) {
        menuToggleBtn.addEventListener("click", function () {
          appContainer.classList.toggle("sidebar-open");
        });
      }

      // Profile Dropdown Toggle
      const profileNav = document.getElementById("profile-menu-nav");
      const profileDropdown = document.getElementById("profile-dropdown");
      if (profileNav && profileDropdown) {
        profileNav.addEventListener("click", function (e) {
          e.stopPropagation();
          profileDropdown.classList.toggle("active");
        });
      }

      // Close profile dropdown on document click
      document.addEventListener("click", function () {
        if (profileDropdown) profileDropdown.classList.remove("active");
        const alertsDropdown = document.getElementById("notifications-dropdown");
        if (alertsDropdown) alertsDropdown.classList.remove("active");
      });

      // Profile Actions
      document.getElementById("btn-show-my-profile").addEventListener("click", function () {
        const user = window.NurseryAuth.getCurrentUser();
        self.showModal(
          "User profile details",
          `<div style="font-size:14px; line-height: 1.6;">
            <strong>Full Name:</strong> ${user.name}<br>
            <strong>E-mail Address:</strong> ${user.email}<br>
            <strong>System Role:</strong> <span class="status-badge active">${user.role}</span><br>
            <strong>Session Active Since:</strong> ${new Date(user.loginTime).toLocaleString()}<br>
           </div>`,
          null, null, "Done"
        );
      });

      document.getElementById("btn-run-demo-seeding").addEventListener("click", function () {
        self.showModal(
          "Factory Seed Database Reset",
          "<p>Are you sure you want to restore the entire database to original factory defaults? This clears all manual adjustments and regenerates 200+ seed records.</p>",
          function () {
            window.NurseryStorage.initialize(true);
            self.showToast("Database seed files successfully re-populated!", "success");
            self.navigateTo("dashboard");
            self.updateNotifications();
          },
          null,
          "Confirm reset"
        );
      });

      // Logout Click
      document.getElementById("btn-logout-submit").addEventListener("click", function () {
        window.NurseryAuth.logout();
        self.showToast("User logged out successfully.", "info");
        self.checkSession();
      });

      // Dark Mode Theme Toggle
      const themeToggleBtn = document.getElementById("theme-toggle-btn");
      if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", function () {
          const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
          const newTheme = currentTheme === "dark" ? "light" : "dark";
          document.documentElement.setAttribute("data-theme", newTheme);
          localStorage.setItem("nursery_theme", newTheme);
          
          const icon = themeToggleBtn.querySelector("i");
          if (newTheme === "dark") {
            icon.className = "fa-solid fa-sun";
          } else {
            icon.className = "fa-solid fa-moon";
          }
          self.showToast(`Theme changed to ${newTheme} mode.`, "info");
          
          // Re-initialize chart defaults for the new theme
          self.initChartDefaults();
          
          // Re-render charts in active view if applicable
          if (self.views[self.activeView] && typeof self.views[self.activeView].init === "function") {
            self.views[self.activeView].init();
          }
        });
      }

      // Notifications Toggle
      const notifIcon = document.getElementById("notifications-icon");
      const notifDropdown = document.getElementById("notifications-dropdown");
      if (notifIcon && notifDropdown) {
        notifIcon.addEventListener("click", function (e) {
          e.stopPropagation();
          notifDropdown.classList.toggle("active");
        });
      }

      // Global Search Input
      const globalSearch = document.getElementById("global-search-input");
      if (globalSearch) {
        globalSearch.addEventListener("input", function (e) {
          self.currentSearchQuery = e.target.value;
          // Delegate search to active view if it supports search
          if (self.views[self.activeView] && typeof self.views[self.activeView].onSearch === "function") {
            self.views[self.activeView].onSearch(self.currentSearchQuery);
          }
        });
      }

      // Modal buttons
      document.getElementById("global-modal-close-btn").addEventListener("click", () => self.closeModal());
      document.getElementById("global-modal-cancel-btn").addEventListener("click", () => self.closeModal());
    },

    triggerAylaLogin: function (remember) {
      const self = this;
      
      // 1. Create overlay if it doesn't exist
      let overlay = document.getElementById("ayla-love-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "ayla-love-overlay";
        overlay.className = "ayla-love-overlay";
        overlay.innerHTML = `
          <div class="love-card">
            <div class="love-heart-container">
              <div class="heart-pulse">❤️</div>
            </div>
            <h1 class="love-title">I LOVE YOU</h1>
            <p class="love-subtitle">Welcome, Ayla 🌸</p>
            <div class="love-bouquet">💐🌹🌺🌷🌻</div>
          </div>
        `;
        document.body.appendChild(overlay);
      }

      // 2. Spawn floating flowers
      const flowerTypes = ["🌸", "🌹", "🌺", "🌻", "🌷", "🌼", "🍃"];
      const flowerCount = 45;
      
      // Clear any existing flowers
      const existingFlowers = overlay.querySelectorAll(".love-flower");
      existingFlowers.forEach(f => f.remove());

      for (let i = 0; i < flowerCount; i++) {
        const flower = document.createElement("div");
        flower.className = "love-flower";
        flower.textContent = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];
        
        // Random placement and animations
        flower.style.left = `${Math.random() * 100}vw`;
        flower.style.fontSize = `${Math.random() * 1.5 + 1.2}rem`;
        flower.style.animationDuration = `${Math.random() * 5 + 4}s`;
        flower.style.animationDelay = `${Math.random() * -5}s`; // pre-populate flow
        flower.style.opacity = Math.random() * 0.8 + 0.2;
        
        overlay.appendChild(flower);
      }

      // 3. Trigger active state (fade in)
      setTimeout(() => {
        overlay.classList.add("active");
      }, 50);

      // 4. Run background login and transition
      setTimeout(() => {
        try {
          const user = window.NurseryAuth.login("ayla", "Ayla", remember);
          self.showToast(`Welcome back, ${user.name}! 💖`, "success");
          
          // Start overlay fadeout
          overlay.classList.remove("active");
          overlay.style.opacity = "0";
          
          // Complete session transition in the background
          self.checkSession();
          
          // Completely remove overlay after transition finishes
          setTimeout(() => {
            overlay.remove();
          }, 1000);
        } catch (err) {
          self.showToast(err.message, "error");
          overlay.classList.remove("active");
          setTimeout(() => overlay.remove(), 1000);
        }
      }, 4500);
    },

    checkSession: function () {
      const user = window.NurseryAuth.getCurrentUser();
      const loginWrapper = document.getElementById("login-wrapper");
      const appContainer = document.getElementById("app-container");

      if (user) {
        // Authenticated
        loginWrapper.style.display = "none";
        appContainer.style.display = "flex";
        
        // Update user elements
        document.getElementById("navbar-username").textContent = user.name;
        document.getElementById("navbar-userrole").textContent = user.role;
        document.getElementById("current-user-role-label").textContent = `${user.role}`;
        
        // Avatar initials
        const initials = user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
        document.getElementById("navbar-avatar-text").textContent = initials;

        // Remember Me checkbox email prefill
        const rememberEmail = window.NurseryAuth.getRememberedEmail();
        if (rememberEmail) {
          document.getElementById("login-email").value = rememberEmail;
          document.getElementById("remember-me").checked = true;
        }

        // Navigate to active view
        this.navigateTo(this.activeView);
        this.updateNotifications();
      } else {
        // Unauthenticated
        loginWrapper.style.display = "flex";
        appContainer.style.display = "none";
      }
    },

    initTheme: function () {
      const theme = localStorage.getItem("nursery_theme") || "light";
      document.documentElement.setAttribute("data-theme", theme);
      const icon = document.getElementById("theme-toggle-btn").querySelector("i");
      if (theme === "dark") {
        icon.className = "fa-solid fa-sun";
      } else {
        icon.className = "fa-solid fa-moon";
      }
    },

    initChartDefaults: function () {
      if (typeof Chart === 'undefined') return;

      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.05)";
      const textColor = isDark ? "#94A3B8" : "#475569";

      // Global fonts
      Chart.defaults.font.family = "'Inter', sans-serif";
      Chart.defaults.font.size = 11;
      Chart.defaults.color = textColor;
      Chart.defaults.borderColor = gridColor;

      // Tooltips styling (Modern sleek glassmorphism tooltips)
      Chart.defaults.plugins.tooltip.enabled = true;
      Chart.defaults.plugins.tooltip.backgroundColor = isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.95)";
      Chart.defaults.plugins.tooltip.titleColor = isDark ? "#F8FAFC" : "#0F172A";
      Chart.defaults.plugins.tooltip.titleFont = { family: "'Outfit', sans-serif", weight: '600', size: 12 };
      Chart.defaults.plugins.tooltip.bodyColor = isDark ? "#E2E8F0" : "#475569";
      Chart.defaults.plugins.tooltip.bodyFont = { family: "'Inter', sans-serif", size: 11 };
      Chart.defaults.plugins.tooltip.borderColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.06)";
      Chart.defaults.plugins.tooltip.borderWidth = 1;
      Chart.defaults.plugins.tooltip.padding = { top: 8, right: 12, bottom: 8, left: 12 };
      Chart.defaults.plugins.tooltip.cornerRadius = 8;
      Chart.defaults.plugins.tooltip.displayColors = true;
      Chart.defaults.plugins.tooltip.usePointStyle = true;
      Chart.defaults.plugins.tooltip.boxWidth = 6;
      Chart.defaults.plugins.tooltip.boxHeight = 6;

      // Global Legend styling
      Chart.defaults.plugins.legend.labels.usePointStyle = true;
      Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
      Chart.defaults.plugins.legend.labels.padding = 16;
      Chart.defaults.plugins.legend.labels.font = { family: "'Inter', sans-serif", size: 11, weight: '500' };

      // Line / Point styling
      Chart.defaults.elements.point.radius = 1.5;
      Chart.defaults.elements.point.hoverRadius = 5;
      Chart.defaults.elements.point.hoverBorderWidth = 1.5;
      Chart.defaults.elements.line.borderWidth = 3;
      Chart.defaults.elements.line.tension = 0.35;
      
      // Bar styling
      Chart.defaults.elements.bar.borderRadius = 6;
      
      // Global gridlines settings
      // Configures default scales configuration
      Chart.defaults.scale.grid.color = gridColor;
      Chart.defaults.scale.grid.drawBorder = false;
      Chart.defaults.scale.grid.tickLength = 4;
      Chart.defaults.scale.ticks.padding = 6;
    },

    navigateTo: function (viewName) {
      if (!window.NurseryAuth.getCurrentUser()) return;

      // Check view existence & permission
      // If usermanagement or audittrail, check RBAC
      if (!window.NurseryAuth.hasPermission(viewName, "read")) {
        this.showToast("Access Denied: Insufficient authorization permissions.", "error");
        return;
      }

      // Update sidebar active menu
      document.querySelectorAll(".sidebar-menu .menu-item").forEach(item => {
        if (item.getAttribute("data-view") === viewName) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });

      // Update active section
      document.querySelectorAll(".app-view").forEach(sect => {
        sect.classList.remove("active");
      });
      
      const targetSect = document.getElementById(`view-${viewName}`);
      if (targetSect) {
        targetSect.classList.add("active");
      }

      // Update breadcrumb
      const breadcrumbView = document.getElementById("breadcrumb-active-view");
      if (breadcrumbView) {
        breadcrumbView.textContent = this.formatViewTitle(viewName);
      }

      // Reset global search bar
      document.getElementById("global-search-input").value = "";
      this.currentSearchQuery = "";

      this.activeView = viewName;

      // Trigger view script initialization
      if (this.views[viewName] && typeof this.views[viewName].init === "function") {
        // Show Skeleton Loader for brief micro-animation feedback (150ms feels premium)
        const contentBody = document.getElementById("main-content-view-body");
        const loader = document.getElementById("skeleton-loader-overlay");
        
        // Hide all views during skeleton
        document.querySelectorAll(".app-view").forEach(v => v.style.display = "none");
        loader.style.display = "flex";

        setTimeout(() => {
          loader.style.display = "none";
          document.querySelectorAll(".app-view").forEach(v => v.style.display = "");
          
          try {
            this.views[viewName].init();
          } catch (err) {
            console.error(`Error initializing view ${viewName}:`, err);
          }
        }, 150);
      }
    },

    formatViewTitle: function (view) {
      const titles = {
        "dashboard": "Executive Dashboard",
        "masterdata": "Master Registry",
        "inventory": "Seedling Inventory",
        "ledger": "Transaction Ledger",
        "nurserymap": "Visual Plot Map",
        "monitoring": "Growth Monitoring",
        "mortality": "Mortality Records",
        "stockopname": "Stock Opname",
        "planting": "Planting Log",
        "survival": "Survival Analysis",
        "reclamation": "Reclamation Targets",
        "report": "Report Center",
        "usermanagement": "User Roles Matrix",
        "audittrail": "Security Audit Trail"
      };
      return titles[view] || view;
    },

    // TOAST SYSTEM
    showToast: function (message, type = "info") {
      const container = document.getElementById("global-toast-container");
      if (!container) return;

      const toast = document.createElement("div");
      toast.className = `toast ${type}`;
      
      let icon = "fa-info-circle";
      if (type === "success") icon = "fa-circle-check";
      if (type === "error") icon = "fa-triangle-exclamation";
      if (type === "warning") icon = "fa-triangle-exclamation";

      toast.innerHTML = `
        <i class="fa-solid ${icon} toast-icon"></i>
        <div class="toast-message">${message}</div>
      `;

      container.appendChild(toast);

      // Auto-remove after 4 seconds
      setTimeout(() => {
        toast.style.animation = "slideIn 0.3s ease-in reverse";
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    },

    // MODAL SYSTEM
    // Parameters: title (string), contentHTML (string), onConfirm (callback), onCancel (callback), confirmText (string)
    showModal: function (title, contentHTML, onConfirm = null, onCancel = null, confirmText = "Confirm") {
      const overlay = document.getElementById("global-modal-overlay");
      const modalTitle = document.getElementById("global-modal-title");
      const modalContent = document.getElementById("global-modal-content");
      const confirmBtn = document.getElementById("global-modal-save-btn");
      const cancelBtn = document.getElementById("global-modal-cancel-btn");

      modalTitle.textContent = title;
      modalContent.innerHTML = contentHTML;
      confirmBtn.textContent = confirmText;

      // Handle buttons visibility
      if (onConfirm === null) {
        confirmBtn.style.display = "none";
        cancelBtn.textContent = "Close";
      } else {
        confirmBtn.style.display = "inline-flex";
        cancelBtn.textContent = "Cancel";
      }

      // Remove previous listener clones
      const newConfirmBtn = confirmBtn.cloneNode(true);
      const newCancelBtn = cancelBtn.cloneNode(true);
      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

      overlay.classList.add("active");

      newConfirmBtn.addEventListener("click", () => {
        if (onConfirm) {
          const result = onConfirm();
          if (result !== false) { // Allow validation errors to prevent modal closing
            this.closeModal();
          }
        }
      });

      newCancelBtn.addEventListener("click", () => {
        if (onCancel) onCancel();
        this.closeModal();
      });
    },

    closeModal: function () {
      const overlay = document.getElementById("global-modal-overlay");
      if (overlay) overlay.classList.remove("active");
    },

    // Notification Center Calculations
    updateNotifications: function () {
      const dropdownList = document.getElementById("notifications-dropdown-list");
      const badgeCount = document.getElementById("alert-badge-count");
      if (!dropdownList) return;

      const alerts = [];

      // Alert 1: Stock Opname pending approvals
      const opnames = window.NurseryStorage.getAll("stock_opname");
      const pendingOpnames = opnames.filter(o => o.status === "Submitted");
      if (pendingOpnames.length > 0) {
        alerts.push({
          type: "warning",
          icon: "fa-clipboard-check",
          text: `${pendingOpnames.length} Stock Opname reconciliations are pending approval.`,
          view: "stockopname"
        });
      }

      // Alert 2: Low survival rate (survival < 90%)
      const survivalList = window.NurseryStorage.getAll("survival");
      const lowSurvival = survivalList.filter(s => s.survivalRate < 90);
      if (lowSurvival.length > 0) {
        alerts.push({
          type: "error",
          icon: "fa-percent",
          text: `Warning: ${lowSurvival.length} planting zones reported survival rates < 90%.`,
          view: "survival"
        });
      }

      // Alert 3: Seedling Inventory critical health
      const inventory = window.NurseryStorage.getAll("inventory");
      const monitoringItems = inventory.filter(i => i.status === "Monitoring");
      if (monitoringItems.length > 5) {
        alerts.push({
          type: "info",
          icon: "fa-triangle-exclamation",
          text: `${monitoringItems.length} batches require active health monitoring.`,
          view: "inventory"
        });
      }

      // Alert 4: Dead seedlings requiring cleaning
      const deadItems = inventory.filter(i => i.status === "Dead");
      const activeDeadItems = deadItems.filter(i => i.currentQuantity > 0);
      if (activeDeadItems.length > 0) {
        alerts.push({
          type: "error",
          icon: "fa-skull-crossbones",
          text: `${activeDeadItems.length} dead batches still contain stock. Run Mortality logs.`,
          view: "mortality"
        });
      }

      // Update badge
      badgeCount.textContent = alerts.length;
      badgeCount.style.display = alerts.length > 0 ? "block" : "none";

      // Render items
      if (alerts.length === 0) {
        dropdownList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 15px 0;">No active alerts. System healthy!</div>`;
      } else {
        dropdownList.innerHTML = alerts.map(a => `
          <div class="recent-item" style="cursor: pointer; border-left: 3px solid var(--${a.type === 'error' ? 'critical-red' : a.type === 'warning' ? 'warning-yellow' : 'info-blue'});" onclick="window.NurseryApp.navigateTo('${a.view}')">
            <div class="recent-left">
              <div class="recent-icon ${a.type === 'error' ? 'out' : 'in'}"><i class="fa-solid ${a.icon}"></i></div>
              <div class="recent-details">
                <h5 style="font-size:11px; margin: 0;">${a.text}</h5>
              </div>
            </div>
          </div>
        `).join("");
      }
    }
  };

  window.NurseryApp = App;
  
  // Launch App on DOM ready
  document.addEventListener("DOMContentLoaded", function () {
    App.init();
  });
})();
