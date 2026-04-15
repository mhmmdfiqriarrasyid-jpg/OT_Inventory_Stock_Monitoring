/* ============================================================================
 * charts.js — Dependency-free SVG charts.
 * ==========================================================================*/

window.Charts = (function () {
  function renderMovementChart(container, data) {
    // data: [{ date, in, out }]
    const width = container.clientWidth || 600;
    const height = 220;
    const pad = { top: 16, right: 16, bottom: 28, left: 36 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const maxVal = Math.max(1, ...data.map((d) => Math.max(d.in, d.out)));
    const step = data.length > 1 ? innerW / (data.length - 1) : innerW;

    const xy = (i, v) => [pad.left + i * step, pad.top + innerH - (v / maxVal) * innerH];

    const pathFor = (key) => data.map((d, i) => {
      const [x, y] = xy(i, d[key]);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

    const yTicks = 4;
    const yGrid = Array.from({ length: yTicks + 1 }, (_, i) => {
      const v = Math.round((maxVal * i) / yTicks);
      const y = pad.top + innerH - (v / maxVal) * innerH;
      return `
        <line x1="${pad.left}" x2="${pad.left + innerW}" y1="${y}" y2="${y}" stroke="#eef0f4" />
        <text x="${pad.left - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="#6b7280">${v}</text>
      `;
    }).join("");

    const xLabels = data.map((d, i) => {
      if (data.length > 10 && i % Math.ceil(data.length / 6) !== 0) return "";
      const [x] = xy(i, 0);
      return `<text x="${x}" y="${height - 8}" text-anchor="middle" font-size="10" fill="#6b7280">${d.date.slice(5)}</text>`;
    }).join("");

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" aria-label="Stock movements">
        ${yGrid}
        <path d="${pathFor("in")}"  fill="none" stroke="#16a34a" stroke-width="2" />
        <path d="${pathFor("out")}" fill="none" stroke="#dc2626" stroke-width="2" />
        ${xLabels}
      </svg>
      <div class="chart-legend">
        <span><i style="background:#16a34a"></i> Stock In</span>
        <span><i style="background:#dc2626"></i> Stock Out</span>
      </div>
    `;
  }

  function renderCategoryBars(container, rows) {
    // rows: [{ label, value }]
    if (!rows.length) { container.innerHTML = '<p class="muted">No data.</p>'; return; }
    const max = Math.max(1, ...rows.map((r) => r.value));
    container.innerHTML = rows.map((r) => `
      <div class="bar-row">
        <div class="bar-label">${escapeHTML(r.label)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(r.value / max) * 100}%"></div></div>
        <div class="bar-value">${r.value}</div>
      </div>
    `).join("");
  }

  function escapeHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  return { renderMovementChart, renderCategoryBars };
})();
