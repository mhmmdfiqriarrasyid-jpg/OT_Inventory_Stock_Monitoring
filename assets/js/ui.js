/* ============================================================================
 * ui.js — Rendering helpers (KPIs, tables, forms, modal, toast).
 * ==========================================================================*/

window.UI = (function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function escapeHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  function statusBadge(status) {
    const cls = {
      IN_STOCK: "badge badge-green",
      OUT: "badge badge-gray",
      RESERVED: "badge badge-amber",
      DAMAGED: "badge badge-red"
    }[status] || "badge";
    return `<span class="${cls}">${Schema.STATUS_LABELS[status] || status}</span>`;
  }

  // ---------- Overview ----------
  function renderOverview() {
    const state = Store.getState();
    const stockByItem = Store.currentStockByItem();
    const total = Store.totalUnitsInStock();
    const mtd = Store.monthToDateTotals();
    const low = Store.lowStockItems(1);

    $("#kpi-items").textContent = state.masterData.length;
    $("#kpi-units").textContent = total;
    $("#kpi-in-month").textContent = mtd.in;
    $("#kpi-out-month").textContent = mtd.out;
    $("#kpi-low").textContent = low.length;

    Charts.renderMovementChart($("#chart-movements"), Store.movementsLastNDays(30));

    const topRows = state.masterData
      .map((m) => ({ label: `${m.itemId} · ${m.item}`, value: stockByItem[m.itemId] || 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    Charts.renderCategoryBars($("#chart-top-items"), topRows);

    const recent = state.activityLog.slice(0, 8);
    $("#overview-activity").innerHTML = recent.length
      ? recent.map((r) => `
          <li>
            <span class="activity-type">${escapeHTML(r.type)}</span>
            <span class="activity-summary">${escapeHTML(r.summary)}</span>
            <span class="activity-when muted">${escapeHTML((r.when || "").replace("T", " "))}</span>
          </li>`).join("")
      : '<li class="muted">No activity yet.</li>';
  }

  // ---------- Master Data ----------
  function renderMaster(filter = "") {
    const state = Store.getState();
    const stockByItem = Store.currentStockByItem();
    const q = filter.trim().toLowerCase();
    const rows = state.masterData.filter((m) => {
      if (!q) return true;
      return Object.values(m).some((v) => String(v).toLowerCase().includes(q));
    });

    const tbody = $("#master-tbody");
    tbody.innerHTML = rows.length
      ? rows.map((m) => `
        <tr>
          <td class="mono">${escapeHTML(m.itemId)}</td>
          <td>${escapeHTML(m.item)}</td>
          <td>${escapeHTML(m.category)}</td>
          <td>${escapeHTML(m.brand)}</td>
          <td>${escapeHTML(m.model)}</td>
          <td>${escapeHTML(m.deviceType)}</td>
          <td class="num"><strong>${stockByItem[m.itemId] || 0}</strong></td>
          <td class="actions">
            <button class="btn-ghost" data-action="edit-master" data-id="${escapeHTML(m.itemId)}">Edit</button>
            <button class="btn-ghost danger" data-action="delete-master" data-id="${escapeHTML(m.itemId)}">Delete</button>
          </td>
        </tr>`).join("")
      : '<tr><td colspan="8" class="muted center">No items. Click "Add Item" to get started.</td></tr>';
  }

  // ---------- Serial Data ----------
  function renderSerials(filter = "") {
    const state = Store.getState();
    const q = filter.trim().toLowerCase();
    const rows = state.serialData.filter((s) => {
      if (!q) return true;
      return Object.values(s).some((v) => String(v).toLowerCase().includes(q));
    });

    const tbody = $("#serial-tbody");
    tbody.innerHTML = rows.length
      ? rows.map((s) => {
          const m = state.masterData.find((x) => x.itemId === s.itemId);
          return `
            <tr>
              <td class="mono">${escapeHTML(s.serial)}</td>
              <td class="mono">${escapeHTML(s.itemId)}</td>
              <td>${escapeHTML(m ? m.item : "—")}</td>
              <td>${escapeHTML(m ? m.brand : "—")}</td>
              <td>${statusBadge(s.status)}</td>
              <td>${escapeHTML(s.receivedAt)}</td>
              <td>${escapeHTML(s.notes)}</td>
              <td class="actions">
                <button class="btn-ghost" data-action="edit-serial" data-id="${escapeHTML(s.serial)}">Edit</button>
                <button class="btn-ghost danger" data-action="delete-serial" data-id="${escapeHTML(s.serial)}">Delete</button>
              </td>
            </tr>`;
        }).join("")
      : '<tr><td colspan="8" class="muted center">No serial numbers. Click "Add Serial".</td></tr>';
  }

  // ---------- Stock In / Out ----------
  function renderStockIn(filter = "") {
    const state = Store.getState();
    const q = filter.trim().toLowerCase();
    const rows = state.stockIn.filter((r) => !q || Object.values(r).some((v) => String(v).toLowerCase().includes(q)))
                              .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    $("#stockin-tbody").innerHTML = rows.length
      ? rows.map((r) => `
        <tr>
          <td class="mono">${escapeHTML(r.id)}</td>
          <td>${escapeHTML(r.date)}</td>
          <td class="mono">${escapeHTML(r.itemId)}</td>
          <td class="mono">${escapeHTML(r.serial || "—")}</td>
          <td class="num">+${escapeHTML(r.qty)}</td>
          <td>${escapeHTML(r.source || "")}</td>
          <td>${escapeHTML(r.note || "")}</td>
        </tr>`).join("")
      : '<tr><td colspan="7" class="muted center">No stock-in records.</td></tr>';
  }

  function renderStockOut(filter = "") {
    const state = Store.getState();
    const q = filter.trim().toLowerCase();
    const rows = state.stockOut.filter((r) => !q || Object.values(r).some((v) => String(v).toLowerCase().includes(q)))
                               .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    $("#stockout-tbody").innerHTML = rows.length
      ? rows.map((r) => `
        <tr>
          <td class="mono">${escapeHTML(r.id)}</td>
          <td>${escapeHTML(r.date)}</td>
          <td class="mono">${escapeHTML(r.itemId)}</td>
          <td class="mono">${escapeHTML(r.serial || "—")}</td>
          <td class="num">-${escapeHTML(r.qty)}</td>
          <td>${escapeHTML(r.destination || "")}</td>
          <td>${escapeHTML(r.note || "")}</td>
        </tr>`).join("")
      : '<tr><td colspan="7" class="muted center">No stock-out records.</td></tr>';
  }

  // ---------- Activity Log ----------
  function renderActivity(filter = "", type = "") {
    const state = Store.getState();
    const q = filter.trim().toLowerCase();
    const rows = state.activityLog
      .filter((r) => !type || r.type === type)
      .filter((r) => !q || (r.summary || "").toLowerCase().includes(q));
    $("#activity-tbody").innerHTML = rows.length
      ? rows.map((r) => `
        <tr>
          <td>${escapeHTML((r.when || "").replace("T", " "))}</td>
          <td><span class="badge badge-neutral">${escapeHTML(r.type)}</span></td>
          <td class="mono">${escapeHTML(r.ref)}</td>
          <td>${escapeHTML(r.summary)}</td>
        </tr>`).join("")
      : '<tr><td colspan="4" class="muted center">No activity yet.</td></tr>';
  }

  // ---------- Select options ----------
  function populateItemSelects() {
    const state = Store.getState();
    const options = ['<option value="">— Select item —</option>']
      .concat(state.masterData.map((m) => `<option value="${escapeHTML(m.itemId)}">${escapeHTML(m.itemId)} — ${escapeHTML(m.item)}</option>`))
      .join("");
    $$(".item-select").forEach((sel) => {
      const prev = sel.value;
      sel.innerHTML = options;
      sel.value = prev;
    });
  }

  // ---------- Modal ----------
  function openModal(title, bodyHTML, onSubmit) {
    const modal = $("#modal");
    $("#modal-title").textContent = title;
    $("#modal-body").innerHTML = bodyHTML;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    const form = $("#modal-body form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = {};
        new FormData(form).forEach((v, k) => { data[k] = v; });
        const errs = onSubmit(data, form);
        if (errs && Object.keys(errs).length) {
          $$(".field-error", form).forEach((el) => (el.textContent = ""));
          Object.entries(errs).forEach(([k, msg]) => {
            const err = form.querySelector(`[data-error="${k}"]`);
            if (err) err.textContent = msg;
          });
        } else {
          closeModal();
        }
      });
    }
  }

  function closeModal() {
    const modal = $("#modal");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    $("#modal-body").innerHTML = "";
  }

  // ---------- Toast ----------
  let toastTimer = null;
  function toast(msg, kind = "info") {
    const t = $("#toast");
    t.textContent = msg;
    t.className = `toast show ${kind}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = "toast"; }, 2400);
  }

  return {
    $, $$, escapeHTML, statusBadge,
    renderOverview, renderMaster, renderSerials,
    renderStockIn, renderStockOut, renderActivity,
    populateItemSelects,
    openModal, closeModal, toast
  };
})();
