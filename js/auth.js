/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - AUTHENTICATION & RBAC
 * Manages user logins, sessions, and permissions.
 */

(function () {
  const SESSION_KEY = "nursery_user_session";
  const REMEMBER_KEY = "nursery_remember_email";

  const AuthService = {
    // RBAC Permission Grid
    // Roles: Admin, Supervisor, Environment Officer, Viewer
    permissions: {
      "dashboard": ["Admin", "Supervisor", "Environment Officer", "Viewer"],
      "masterdata": {
        "read": ["Admin", "Supervisor", "Environment Officer", "Viewer"],
        "write": ["Admin", "Supervisor", "Environment Officer"],
        "delete": ["Admin"]
      },
      "inventory": {
        "read": ["Admin", "Supervisor", "Environment Officer", "Viewer"],
        "write": ["Admin", "Supervisor", "Environment Officer"],
        "delete": ["Admin"]
      },
      "ledger": ["Admin", "Supervisor", "Environment Officer", "Viewer"],
      "nurserymap": ["Admin", "Supervisor", "Environment Officer", "Viewer"],
      "monitoring": {
        "read": ["Admin", "Supervisor", "Environment Officer", "Viewer"],
        "write": ["Admin", "Supervisor", "Environment Officer"],
        "delete": ["Admin"]
      },
      "mortality": {
        "read": ["Admin", "Supervisor", "Environment Officer", "Viewer"],
        "write": ["Admin", "Supervisor", "Environment Officer"],
        "delete": ["Admin"]
      },
      "stockopname": {
        "read": ["Admin", "Supervisor", "Environment Officer", "Viewer"],
        "submit": ["Admin", "Supervisor", "Environment Officer"],
        "approve": ["Admin", "Supervisor"] // Only Admin & Supervisor can approve/reject opnames
      },
      "planting": {
        "read": ["Admin", "Supervisor", "Environment Officer", "Viewer"],
        "write": ["Admin", "Supervisor", "Environment Officer"],
        "delete": ["Admin"]
      },
      "survival": {
        "read": ["Admin", "Supervisor", "Environment Officer", "Viewer"],
        "write": ["Admin", "Supervisor", "Environment Officer"],
        "delete": ["Admin"]
      },
      "reclamation": {
        "read": ["Admin", "Supervisor", "Environment Officer", "Viewer"],
        "write": ["Admin", "Supervisor", "Environment Officer"],
        "delete": ["Admin"]
      },
      "reports": ["Admin", "Supervisor", "Environment Officer", "Viewer"],
      "usermanagement": {
        "read": ["Admin", "Supervisor"],
        "write": ["Admin"],
        "delete": ["Admin"]
      },
      "audittrail": ["Admin", "Supervisor"]
    },

    login: function (email, password, rememberMe = false) {
      // Special login bypass for Ayla
      if (email.trim().toLowerCase() === "ayla" && password === "Ayla") {
        const sessionData = {
          id: "U-AYLA",
          name: "Ayla",
          email: "ayla",
          role: "Admin",
          loginTime: new Date().toISOString()
        };

        if (rememberMe) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
          localStorage.setItem(REMEMBER_KEY, email);
        } else {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
          localStorage.removeItem(REMEMBER_KEY);
        }

        window.NurseryStorage.logAudit("Ayla", "auth", "LOGIN", null, { email: "ayla", role: "Admin" });
        return sessionData;
      }

      const users = window.NurseryStorage.getAll("users");
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      if (!user) {
        throw new Error("Invalid email or password");
      }
      
      if (user.status !== "Active") {
        throw new Error("This user account is inactive. Please contact the administrator.");
      }

      // Store in session
      const sessionData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        loginTime: new Date().toISOString()
      };

      if (rememberMe) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        localStorage.removeItem(REMEMBER_KEY);
      }

      window.NurseryStorage.logAudit(user.name, "auth", "LOGIN", null, { email: user.email, role: user.role });
      return sessionData;
    },

    logout: function () {
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        window.NurseryStorage.logAudit(currentUser.name, "auth", "LOGOUT", null, null);
      }
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    },

    getCurrentUser: function () {
      const sessionStr = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      return sessionStr ? JSON.parse(sessionStr) : null;
    },

    getRememberedEmail: function () {
      return localStorage.getItem(REMEMBER_KEY) || "";
    },

    // Check permissions
    hasPermission: function (module, action = "read") {
      const user = this.getCurrentUser();
      if (!user) return false;
      const role = user.role;

      const rules = this.permissions[module];
      if (!rules) return false;

      if (Array.isArray(rules)) {
        return rules.includes(role);
      }

      if (rules[action]) {
        return rules[action].includes(role);
      }

      return false;
    }
  };

  window.NurseryAuth = AuthService;
})();
