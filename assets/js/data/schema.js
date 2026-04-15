/* ============================================================================
 * schema.js — Field definitions, validators, and id helpers.
 * ==========================================================================*/

window.Schema = (function () {
  const STATUSES = ["IN_STOCK", "OUT", "RESERVED", "DAMAGED"];

  const STATUS_LABELS = {
    IN_STOCK: "In Stock",
    OUT:      "Out",
    RESERVED: "Reserved",
    DAMAGED:  "Damaged"
  };

  const ACTIVITY_TYPES = [
    "CREATE_ITEM", "UPDATE_ITEM", "DELETE_ITEM",
    "CREATE_SERIAL", "UPDATE_SERIAL", "DELETE_SERIAL",
    "STOCK_IN", "STOCK_OUT",
    "IMPORT", "RESET"
  ];

  const MASTER_FIELDS = [
    { key: "itemId",     label: "Item ID",     required: true },
    { key: "item",       label: "Item",        required: true },
    { key: "category",   label: "Category",    required: true },
    { key: "brand",      label: "Brand",       required: true },
    { key: "model",      label: "Model",       required: false },
    { key: "deviceType", label: "Device Type", required: false }
  ];

  const SERIAL_FIELDS = [
    { key: "serial",     label: "Serial Number", required: true },
    { key: "itemId",     label: "Item ID",       required: true },
    { key: "status",     label: "Status",        required: true },
    { key: "receivedAt", label: "Received At",   required: false },
    { key: "notes",      label: "Notes",         required: false }
  ];

  function validateMaster(row, { existingIds = [], ignoreId = null } = {}) {
    const errors = {};
    for (const f of MASTER_FIELDS) {
      if (f.required && !String(row[f.key] || "").trim()) {
        errors[f.key] = `${f.label} is required`;
      }
    }
    if (row.itemId && existingIds.includes(row.itemId) && row.itemId !== ignoreId) {
      errors.itemId = "Item ID must be unique";
    }
    return errors;
  }

  function validateSerial(row, { existingSerials = [], ignoreSerial = null, masterIds = [] } = {}) {
    const errors = {};
    for (const f of SERIAL_FIELDS) {
      if (f.required && !String(row[f.key] || "").trim()) {
        errors[f.key] = `${f.label} is required`;
      }
    }
    if (row.serial && existingSerials.includes(row.serial) && row.serial !== ignoreSerial) {
      errors.serial = "Serial must be unique";
    }
    if (row.itemId && masterIds.length && !masterIds.includes(row.itemId)) {
      errors.itemId = "Item ID must match a master item";
    }
    if (row.status && !STATUSES.includes(row.status)) {
      errors.status = "Invalid status";
    }
    return errors;
  }

  function validateMovement(row, { masterIds = [], currentStock = 0, kind = "IN" } = {}) {
    const errors = {};
    if (!row.itemId) errors.itemId = "Item ID is required";
    else if (masterIds.length && !masterIds.includes(row.itemId)) errors.itemId = "Unknown item";
    const qty = Number(row.qty);
    if (!qty || qty <= 0 || !Number.isFinite(qty)) errors.qty = "Qty must be > 0";
    if (!row.date) errors.date = "Date is required";
    if (kind === "OUT" && qty > currentStock) errors.qty = `Only ${currentStock} in stock`;
    return errors;
  }

  // Simple incremental id generator based on current max.
  function nextId(prefix, existingIds) {
    let max = 0;
    const re = new RegExp("^" + prefix + "-(\\d+)$");
    for (const id of existingIds) {
      const m = re.exec(id || "");
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `${prefix}-${String(max + 1).padStart(4, "0")}`;
  }

  function todayISO() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function nowISO() {
    return new Date().toISOString().replace(/\.\d{3}Z$/, "");
  }

  return {
    STATUSES, STATUS_LABELS, ACTIVITY_TYPES,
    MASTER_FIELDS, SERIAL_FIELDS,
    validateMaster, validateSerial, validateMovement,
    nextId, todayISO, nowISO
  };
})();
