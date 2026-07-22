/**
 * ENTERPRISE NURSERY MANAGEMENT SYSTEM - STORAGE ENGINE
 * Simulates a relational database stored in LocalStorage.
 * Generates 100% realistic mining reclamation seedling data on first initialization.
 */

(function () {
  const DB_PREFIX = "NurseryDB_";

  const StorageService = {
    // Basic Storage Utilities
    get: function (table) {
      const data = localStorage.getItem(DB_PREFIX + table);
      return data ? JSON.parse(data) : [];
    },

    save: function (table, data) {
      localStorage.setItem(DB_PREFIX + table, JSON.stringify(data));
    },

    // CRUD helpers
    getAll: function (table) {
      return this.get(table);
    },

    getById: function (table, id) {
      const list = this.get(table);
      return list.find(item => String(item.id) === String(id));
    },

    insert: function (table, record, currentUser = "System") {
      const list = this.get(table);
      record.id = record.id || 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      record.createdAt = record.createdAt || new Date().toISOString();
      list.push(record);
      this.save(table, list);
      
      this.logAudit(currentUser, table, "INSERT", null, record);
      return record;
    },

    update: function (table, id, updatedRecord, currentUser = "System") {
      const list = this.get(table);
      const idx = list.findIndex(item => String(item.id) === String(id));
      if (idx !== -1) {
        const oldRecord = JSON.parse(JSON.stringify(list[idx]));
        // Keep ID and createdAt
        updatedRecord.id = oldRecord.id;
        updatedRecord.createdAt = oldRecord.createdAt;
        updatedRecord.updatedAt = new Date().toISOString();
        list[idx] = updatedRecord;
        this.save(table, list);
        
        this.logAudit(currentUser, table, "UPDATE", oldRecord, updatedRecord);
        return updatedRecord;
      }
      return null;
    },

    delete: function (table, id, currentUser = "System") {
      const list = this.get(table);
      const idx = list.findIndex(item => String(item.id) === String(id));
      if (idx !== -1) {
        const oldRecord = list[idx];
        list.splice(idx, 1);
        this.save(table, list);
        
        this.logAudit(currentUser, table, "DELETE", oldRecord, null);
        return true;
      }
      return false;
    },

    // Audit Logging
    logAudit: function (user, module, activity, before, after) {
      const auditList = this.get("audit_trail");
      const record = {
        id: 'AUD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        user: user || "System",
        module: module,
        activity: activity,
        beforeValue: before ? JSON.stringify(before) : "N/A",
        afterValue: after ? JSON.stringify(after) : "N/A",
        timestamp: new Date().toISOString()
      };
      auditList.unshift(record); // newest first
      // Keep audit trail at max 1000 records
      if (auditList.length > 1000) {
        auditList.pop();
      }
      this.save("audit_trail", auditList);
    },

    // Ledger Movement logger
    addLedgerEntry: function (batchNumber, type, qtyIn, qtyOut, remarks, date = new Date().toISOString()) {
      const ledgerList = this.get("ledger");
      const inventoryList = this.get("inventory");
      const item = inventoryList.find(i => i.batchNumber === batchNumber);
      
      const prevBalance = item ? item.currentQuantity : 0;
      let newBalance = prevBalance;
      if (qtyIn > 0) newBalance += qtyIn;
      if (qtyOut > 0) newBalance -= qtyOut;
      if (newBalance < 0) newBalance = 0;

      const txNum = "TX-" + type.substring(0, 3).toUpperCase() + "-" + Math.floor(100000 + Math.random() * 900000);
      const record = {
        id: 'LED-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        transactionNumber: txNum,
        date: date,
        batch: batchNumber,
        type: type, // Receipt, Transfer, Mortality, Planting, Stock Opname Adjustment
        qtyIn: qtyIn,
        qtyOut: qtyOut,
        balance: newBalance,
        remarks: remarks
      };
      ledgerList.unshift(record); // newest first
      this.save("ledger", ledgerList);

      // Also update inventory current quantity if item exists
      if (item) {
        item.currentQuantity = newBalance;
        if (newBalance <= 0) {
          item.status = "Dead";
        }
        this.save("inventory", inventoryList);
      }
      return record;
    },

    // Initialization of Demo Data
    initialize: function (force = false) {
      if (!force && localStorage.getItem(DB_PREFIX + "initialized")) {
        return; // Already initialized
      }

      // Clear existing
      const tables = [
        "users", "seedling_types", "suppliers", "nursery_areas", 
        "planting_areas", "inventory", "ledger", "monitoring", 
        "mortality", "stock_opname", "planting", "survival", 
        "reclamation", "audit_trail"
      ];
      tables.forEach(t => localStorage.removeItem(DB_PREFIX + t));

      // Load real Excel data from window.InitialNurseryData
      const initialData = window.InitialNurseryData || {};
      tables.forEach(t => {
        const tableData = initialData[t] || [];
        this.save(t, tableData);
      });

      localStorage.setItem(DB_PREFIX + "initialized", "true");
      console.log("NurseryDB initialized successfully with full demo data.");
    }
  };

  // Attach to global window
  window.NurseryStorage = StorageService;
  
  // Auto-initialize DB
  StorageService.initialize();
})();
