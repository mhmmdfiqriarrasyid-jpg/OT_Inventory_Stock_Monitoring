/* ============================================================================
 * store.js — localStorage persistence + derived calculations + import/export.
 * ==========================================================================*/

window.Store = (function () {
  const STORAGE_KEY = "ot_inventory_state_v1";

  const EMPTY_STATE = {
    masterData: [],
    serialData: [],
    stockIn: [],
    stockOut: [],
    activityLog: []
  };

  let state = null;
  const listeners = [];

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { state = JSON.parse(raw); }
      catch { state = clone(EMPTY_STATE); }
    } else if (window.SEED_DATA) {
      state = clone(window.SEED_DATA);
      persist();
    } else {
      state = clone(EMPTY_STATE);
    }
    // Ensure all arrays exist (forward-compat with older saves).
    for (const k of Object.keys(EMPTY_STATE)) {
      if (!Array.isArray(state[k])) state[k] = [];
    }
    return state;
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function emit() {
    persist();
    listeners.forEach((fn) => fn(state));
  }

  function subscribe(fn) {
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  function getState() { return state; }

  // ---------- Derived ----------
  function currentStockByItem() {
    // Stock per item =
    //   count(serials with status IN_STOCK for this item)   [serial-tracked units]
    // + sum(stockIn.qty where serial is empty)              [bulk intake]
    // − sum(stockOut.qty where serial is empty)             [bulk outgoing]
    //
    // Serial-linked movements already update the corresponding serial's
    // status, so they're captured by the serial count and must NOT be double
    // counted here — we only sum movements without a serial attached.
    const byItem = {};
    for (const m of state.masterData) byItem[m.itemId] = 0;

    for (const s of state.serialData) {
      if (s.status === "IN_STOCK" && byItem[s.itemId] !== undefined) {
        byItem[s.itemId] += 1;
      }
    }
    for (const r of state.stockIn) {
      if (!r.serial && byItem[r.itemId] !== undefined) {
        byItem[r.itemId] += Number(r.qty || 0);
      }
    }
    for (const r of state.stockOut) {
      if (!r.serial && byItem[r.itemId] !== undefined) {
        byItem[r.itemId] -= Number(r.qty || 0);
      }
    }
    return byItem;
  }

  function totalUnitsInStock() {
    const by = currentStockByItem();
    return Object.values(by).reduce((a, n) => a + n, 0);
  }

  function lowStockItems(threshold = 1) {
    const by = currentStockByItem();
    return state.masterData
      .filter((m) => (by[m.itemId] || 0) < threshold)
      .map((m) => ({ ...m, current: by[m.itemId] || 0 }));
  }

  function movementsLastNDays(days = 30) {
    const out = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const map = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { date: key, in: 0, out: 0 };
      out.push(map[key]);
    }
    for (const r of state.stockIn) {
      if (map[r.date]) map[r.date].in += Number(r.qty || 0);
    }
    for (const r of state.stockOut) {
      if (map[r.date]) map[r.date].out += Number(r.qty || 0);
    }
    return out;
  }

  function monthToDateTotals() {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const sum = (rows) => rows
      .filter((r) => (r.date || "").startsWith(prefix))
      .reduce((a, r) => a + Number(r.qty || 0), 0);
    return { in: sum(state.stockIn), out: sum(state.stockOut) };
  }

  // ---------- Mutations ----------
  function logActivity(type, ref, summary) {
    const id = Schema.nextId("LOG", state.activityLog.map((x) => x.id));
    state.activityLog.unshift({
      id, type, ref, when: Schema.nowISO(), user: "local", summary
    });
  }

  // Master items
  function upsertMaster(row, originalId) {
    if (originalId && originalId !== row.itemId) {
      // rename: update references
      state.serialData.forEach((s) => { if (s.itemId === originalId) s.itemId = row.itemId; });
      state.stockIn.forEach((s)   => { if (s.itemId === originalId) s.itemId = row.itemId; });
      state.stockOut.forEach((s)  => { if (s.itemId === originalId) s.itemId = row.itemId; });
    }
    const idx = state.masterData.findIndex((m) => m.itemId === (originalId || row.itemId));
    if (idx >= 0) {
      state.masterData[idx] = { ...state.masterData[idx], ...row };
      logActivity("UPDATE_ITEM", row.itemId, `Updated item ${row.itemId}`);
    } else {
      state.masterData.push({ ...row });
      logActivity("CREATE_ITEM", row.itemId, `Created item ${row.itemId} — ${row.item}`);
    }
    emit();
  }

  function deleteMaster(itemId) {
    state.masterData = state.masterData.filter((m) => m.itemId !== itemId);
    state.serialData = state.serialData.filter((s) => s.itemId !== itemId);
    logActivity("DELETE_ITEM", itemId, `Deleted item ${itemId} (and its serials)`);
    emit();
  }

  // Serials
  function upsertSerial(row, originalSerial) {
    const idx = state.serialData.findIndex((s) => s.serial === (originalSerial || row.serial));
    if (idx >= 0) {
      state.serialData[idx] = { ...state.serialData[idx], ...row };
      logActivity("UPDATE_SERIAL", row.serial, `Updated serial ${row.serial}`);
    } else {
      state.serialData.push({ ...row });
      logActivity("CREATE_SERIAL", row.serial, `Created serial ${row.serial} for ${row.itemId}`);
    }
    emit();
  }

  function deleteSerial(serial) {
    state.serialData = state.serialData.filter((s) => s.serial !== serial);
    logActivity("DELETE_SERIAL", serial, `Deleted serial ${serial}`);
    emit();
  }

  // Stock movements
  function recordStockIn(row) {
    const id = Schema.nextId("IN", state.stockIn.map((x) => x.id));
    const rec = { id, ...row, qty: Number(row.qty) };
    state.stockIn.push(rec);
    if (row.serial) {
      const s = state.serialData.find((x) => x.serial === row.serial);
      if (s) s.status = "IN_STOCK";
    }
    logActivity(
      "STOCK_IN", id,
      `Stock in ${row.itemId} +${rec.qty}${row.serial ? ` (${row.serial})` : ""}${row.source ? ` ← ${row.source}` : ""}`
    );
    emit();
    return rec;
  }

  function recordStockOut(row) {
    const id = Schema.nextId("OUT", state.stockOut.map((x) => x.id));
    const rec = { id, ...row, qty: Number(row.qty) };
    state.stockOut.push(rec);
    if (row.serial) {
      const s = state.serialData.find((x) => x.serial === row.serial);
      if (s) s.status = "OUT";
    }
    logActivity(
      "STOCK_OUT", id,
      `Stock out ${row.itemId} -${rec.qty}${row.serial ? ` (${row.serial})` : ""}${row.destination ? ` → ${row.destination}` : ""}`
    );
    emit();
    return rec;
  }

  // Import / export / reset
  function exportJSON() {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(json) {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    const next = clone(EMPTY_STATE);
    for (const k of Object.keys(EMPTY_STATE)) {
      if (Array.isArray(parsed[k])) next[k] = parsed[k];
    }
    state = next;
    logActivity("IMPORT", "-", "Imported data from JSON");
    emit();
  }

  function resetToSeed() {
    if (!window.SEED_DATA) return;
    state = clone(window.SEED_DATA);
    logActivity("RESET", "-", "Reset to seed data");
    emit();
  }

  function clearAll() {
    state = clone(EMPTY_STATE);
    emit();
  }

  return {
    load, getState, subscribe,
    currentStockByItem, totalUnitsInStock, lowStockItems,
    movementsLastNDays, monthToDateTotals,
    upsertMaster, deleteMaster,
    upsertSerial, deleteSerial,
    recordStockIn, recordStockOut,
    exportJSON, importJSON, resetToSeed, clearAll
  };
})();
