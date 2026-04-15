/* ============================================================================
 * app.js — Routing, event wiring, form builders.
 * ==========================================================================*/

(function () {
  const $ = UI.$;
  const $$ = UI.$$;
  const esc = UI.escapeHTML;

  const SECTIONS = ["overview", "master", "serials", "stockin", "stockout", "activity", "settings"];
  let filters = { master: "", serials: "", stockin: "", stockout: "", activity: "", activityType: "" };

  // ---------- Routing ----------
  function setSection(section) {
    if (!SECTIONS.includes(section)) section = "overview";
    $$(".nav-link").forEach((a) => a.classList.toggle("active", a.dataset.section === section));
    $$(".section").forEach((s) => s.classList.toggle("visible", s.id === `section-${section}`));
    location.hash = `#${section}`;
    renderAll();
  }

  function renderAll() {
    UI.renderOverview();
    UI.renderMaster(filters.master);
    UI.renderSerials(filters.serials);
    UI.renderStockIn(filters.stockin);
    UI.renderStockOut(filters.stockout);
    UI.renderActivity(filters.activity, filters.activityType);
    UI.populateItemSelects();
  }

  // ---------- Forms ----------
  function masterForm(row = {}) {
    const v = (k) => esc(row[k] || "");
    return `
      <form novalidate>
        <div class="grid-2">
          <label>Item ID<input name="itemId" value="${v("itemId")}" ${row.itemId ? "" : ""} required />
            <small class="field-error" data-error="itemId"></small></label>
          <label>Item<input name="item" value="${v("item")}" required />
            <small class="field-error" data-error="item"></small></label>
          <label>Category<input name="category" value="${v("category")}" required />
            <small class="field-error" data-error="category"></small></label>
          <label>Brand<input name="brand" value="${v("brand")}" required />
            <small class="field-error" data-error="brand"></small></label>
          <label>Model<input name="model" value="${v("model")}" /></label>
          <label>Device Type<input name="deviceType" value="${v("deviceType")}" /></label>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-ghost" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn-primary">Save</button>
        </div>
      </form>
    `;
  }

  function serialForm(row = {}) {
    const v = (k) => esc(row[k] || "");
    const items = Store.getState().masterData
      .map((m) => `<option value="${esc(m.itemId)}" ${m.itemId === row.itemId ? "selected" : ""}>${esc(m.itemId)} — ${esc(m.item)}</option>`)
      .join("");
    const statuses = Schema.STATUSES
      .map((s) => `<option value="${s}" ${s === row.status ? "selected" : ""}>${Schema.STATUS_LABELS[s]}</option>`)
      .join("");
    return `
      <form novalidate>
        <div class="grid-2">
          <label>Serial Number<input name="serial" value="${v("serial")}" required />
            <small class="field-error" data-error="serial"></small></label>
          <label>Item ID<select name="itemId" required><option value="">—</option>${items}</select>
            <small class="field-error" data-error="itemId"></small></label>
          <label>Status<select name="status" required>${statuses}</select>
            <small class="field-error" data-error="status"></small></label>
          <label>Received At<input type="date" name="receivedAt" value="${v("receivedAt")}" /></label>
          <label class="full">Notes<input name="notes" value="${v("notes")}" /></label>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-ghost" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn-primary">Save</button>
        </div>
      </form>
    `;
  }

  // ---------- Action handlers ----------
  function handleClick(e) {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    const state = Store.getState();

    switch (action) {
      case "close-modal": UI.closeModal(); break;

      case "add-master":
        UI.openModal("Add Item", masterForm({}), (data) => {
          const errors = Schema.validateMaster(data, { existingIds: state.masterData.map((m) => m.itemId) });
          if (Object.keys(errors).length) return errors;
          Store.upsertMaster(data);
          UI.toast("Item added", "success");
        });
        break;

      case "edit-master": {
        const row = state.masterData.find((m) => m.itemId === id);
        if (!row) return;
        UI.openModal("Edit Item", masterForm(row), (data) => {
          const errors = Schema.validateMaster(data, { existingIds: state.masterData.map((m) => m.itemId), ignoreId: row.itemId });
          if (Object.keys(errors).length) return errors;
          Store.upsertMaster(data, row.itemId);
          UI.toast("Item updated", "success");
        });
        break;
      }

      case "delete-master":
        if (confirm(`Delete item ${id} and all its serials?`)) {
          Store.deleteMaster(id);
          UI.toast("Item deleted", "success");
        }
        break;

      case "add-serial":
        UI.openModal("Add Serial Number", serialForm({ status: "IN_STOCK", receivedAt: Schema.todayISO() }), (data) => {
          const errors = Schema.validateSerial(data, {
            existingSerials: state.serialData.map((s) => s.serial),
            masterIds: state.masterData.map((m) => m.itemId)
          });
          if (Object.keys(errors).length) return errors;
          Store.upsertSerial(data);
          UI.toast("Serial added", "success");
        });
        break;

      case "edit-serial": {
        const row = state.serialData.find((s) => s.serial === id);
        if (!row) return;
        UI.openModal("Edit Serial Number", serialForm(row), (data) => {
          const errors = Schema.validateSerial(data, {
            existingSerials: state.serialData.map((s) => s.serial),
            ignoreSerial: row.serial,
            masterIds: state.masterData.map((m) => m.itemId)
          });
          if (Object.keys(errors).length) return errors;
          Store.upsertSerial(data, row.serial);
          UI.toast("Serial updated", "success");
        });
        break;
      }

      case "delete-serial":
        if (confirm(`Delete serial ${id}?`)) {
          Store.deleteSerial(id);
          UI.toast("Serial deleted", "success");
        }
        break;

      case "export-json": {
        const blob = new Blob([Store.exportJSON()], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inventory-${Schema.todayISO()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        UI.toast("Exported", "success");
        break;
      }

      case "import-json":
        $("#import-file").click();
        break;

      case "reset-seed":
        if (confirm("Reset all data to seed? Current data will be overwritten.")) {
          Store.resetToSeed();
          UI.toast("Reset to seed", "success");
        }
        break;

      case "clear-all":
        if (confirm("Permanently clear all data? This cannot be undone.")) {
          Store.clearAll();
          UI.toast("All data cleared", "success");
        }
        break;
    }
  }

  // ---------- Stock-in / Stock-out form submission ----------
  function wireStockForms() {
    $("#form-stockin").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd);
      const state = Store.getState();
      const errs = Schema.validateMovement(data, {
        masterIds: state.masterData.map((m) => m.itemId),
        kind: "IN"
      });
      renderFieldErrors(e.target, errs);
      if (Object.keys(errs).length) return;
      Store.recordStockIn({
        itemId: data.itemId,
        serial: data.serial || undefined,
        qty: Number(data.qty),
        date: data.date,
        source: data.source || "",
        note: data.note || ""
      });
      e.target.reset();
      $("#stockin-date").value = Schema.todayISO();
      UI.toast("Stock in recorded", "success");
    });

    $("#form-stockout").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd);
      const state = Store.getState();
      const current = Store.currentStockByItem()[data.itemId] || 0;
      const errs = Schema.validateMovement(data, {
        masterIds: state.masterData.map((m) => m.itemId),
        currentStock: current,
        kind: "OUT"
      });
      if (data.serial) {
        const s = state.serialData.find((x) => x.serial === data.serial);
        if (!s) errs.serial = "Unknown serial";
        else if (s.itemId !== data.itemId) errs.serial = "Serial does not match item";
        else if (s.status !== "IN_STOCK") errs.serial = `Serial is ${Schema.STATUS_LABELS[s.status] || s.status}`;
      }
      renderFieldErrors(e.target, errs);
      if (Object.keys(errs).length) return;
      Store.recordStockOut({
        itemId: data.itemId,
        serial: data.serial || undefined,
        qty: Number(data.qty),
        date: data.date,
        destination: data.destination || "",
        note: data.note || ""
      });
      e.target.reset();
      $("#stockout-date").value = Schema.todayISO();
      UI.toast("Stock out recorded", "success");
    });
  }

  function renderFieldErrors(form, errs) {
    $$(".field-error", form).forEach((el) => (el.textContent = ""));
    Object.entries(errs).forEach(([k, msg]) => {
      const err = form.querySelector(`[data-error="${k}"]`);
      if (err) err.textContent = msg;
    });
  }

  // ---------- Filter wiring ----------
  function wireFilters() {
    $("#master-search").addEventListener("input", (e) => {
      filters.master = e.target.value;
      UI.renderMaster(filters.master);
    });
    $("#serial-search").addEventListener("input", (e) => {
      filters.serials = e.target.value;
      UI.renderSerials(filters.serials);
    });
    $("#stockin-search").addEventListener("input", (e) => {
      filters.stockin = e.target.value;
      UI.renderStockIn(filters.stockin);
    });
    $("#stockout-search").addEventListener("input", (e) => {
      filters.stockout = e.target.value;
      UI.renderStockOut(filters.stockout);
    });
    $("#activity-search").addEventListener("input", (e) => {
      filters.activity = e.target.value;
      UI.renderActivity(filters.activity, filters.activityType);
    });
    $("#activity-type").addEventListener("change", (e) => {
      filters.activityType = e.target.value;
      UI.renderActivity(filters.activity, filters.activityType);
    });
  }

  function wireImport() {
    $("#import-file").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          Store.importJSON(reader.result);
          UI.toast("Imported successfully", "success");
        } catch (err) {
          UI.toast("Invalid JSON: " + err.message, "error");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });
  }

  function wireNav() {
    $$(".nav-link").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        setSection(a.dataset.section);
      });
    });
    window.addEventListener("hashchange", () => {
      const sec = location.hash.replace("#", "") || "overview";
      setSection(sec);
    });

    $("#menu-toggle").addEventListener("click", () => {
      document.body.classList.toggle("nav-open");
    });
  }

  function wireModal() {
    $("#modal-close").addEventListener("click", UI.closeModal);
    $("#modal").addEventListener("click", (e) => {
      if (e.target.id === "modal") UI.closeModal();
    });
  }

  function init() {
    Store.load();
    Store.subscribe(renderAll);

    document.addEventListener("click", handleClick);
    wireNav();
    wireModal();
    wireFilters();
    wireStockForms();
    wireImport();

    // Default dates
    $("#stockin-date").value = Schema.todayISO();
    $("#stockout-date").value = Schema.todayISO();

    const initialSection = (location.hash || "#overview").replace("#", "");
    setSection(initialSection);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
