# OT Inventory Stock Monitoring

A simple, user-friendly **static dashboard** for tracking operational-technology
(OT) inventory — master items, serial numbers, stock-in, stock-out, and a full
activity log. No backend, no build step. Open `index.html` and go.

## Features

- **Overview** — KPI cards (total items, units in stock, month-to-date stock in/out, low-stock alerts), 30-day stock movement chart, top items bar chart, recent activity.
- **Master Data** — searchable table of items (`Item ID`, `Item`, `Category`, `Brand`, `Model`, `Device Type`). Add / edit / delete via modal form.
- **Serial Numbers** — per-unit tracking with status (`In Stock`, `Out`, `Reserved`, `Damaged`) linked to a master item.
- **Stock In / Stock Out** — forms to record movements (with optional serial number), plus history tables. Stock-out is blocked when the item has no stock available.
- **Activity Log** — chronological history of every change, filterable by type.
- **Settings** — export JSON, import JSON, reset to the seed template, or clear all data.
- **Persistence** — everything is saved in your browser's `localStorage` under the key `ot_inventory_state_v1`.

## Quick Start

1. Clone the repo (or download the files).
2. Open `index.html` in your browser — the dashboard loads with sample data from `assets/js/data/seed.js`.
3. Start adding items, serials, and stock movements.

To host it on **GitHub Pages**: enable Pages on this branch — no Jekyll required (the `.nojekyll` file is already in place).

## Injecting Your Own Data

`assets/js/data/seed.js` is the **template file** you edit to bulk-load
inventory. It exports a single global `window.SEED_DATA` with five arrays:

```js
window.SEED_DATA = {
  masterData: [
    { itemId: "PRE363", item: "Display", category: "Precision Delta",
      brand: "John Deere", model: "GS Command Center Universal", deviceType: "Display" },
    // …
  ],
  serialData: [
    { serial: "SN-PRE363-0001", itemId: "PRE363", status: "IN_STOCK",
      receivedAt: "2026-01-10", notes: "" },
    // …
  ],
  stockIn:  [ /* { id, itemId, serial?, qty, date, source, note } */ ],
  stockOut: [ /* { id, itemId, serial?, qty, date, destination, note } */ ],
  activityLog: [ /* auto-populated, can start empty */ ]
};
```

### Rules

- `itemId` must be unique across `masterData`.
- `serial` must be unique across `serialData` and must reference an existing `itemId`.
- Dates use ISO format: `"YYYY-MM-DD"`.
- Valid statuses: `"IN_STOCK"`, `"OUT"`, `"RESERVED"`, `"DAMAGED"`.
- `stockIn`, `stockOut`, and `activityLog` can be empty `[]` if you prefer to record movements manually.

### Applying the template

- **First load** — if `localStorage` is empty, the dashboard automatically copies `SEED_DATA` into it.
- **Later** — go to **Settings → Reset to Seed** to re-inject the template (overwrites current state).
- **Import an existing backup** — **Settings → Import JSON** to load a previously-exported file (same JSON shape as `seed.js`).

## Project Structure

```
.
├── index.html                 Shell + all section containers
├── .nojekyll                  Lets GitHub Pages serve /assets as-is
├── assets/
│   ├── css/
│   │   └── styles.css         Light, simple theme
│   └── js/
│       ├── app.js             Routing + event wiring
│       ├── store.js           localStorage CRUD + derived calculations
│       ├── ui.js              Render helpers (KPIs, tables, modal, toasts)
│       ├── charts.js          Dependency-free SVG charts
│       └── data/
│           ├── seed.js        Injectable data template (edit this!)
│           └── schema.js      Field definitions + validators
└── README.md
```

## Stock Calculation

The dashboard computes current stock per item as follows:

- If the item has serial numbers recorded, current stock = **count of serials with `status: "IN_STOCK"`**.
- Otherwise, current stock = **sum of `stockIn.qty`** − **sum of `stockOut.qty`** for that item.

This lets you mix bulk-quantity items (e.g., cables, SIM cards) with serial-tracked items (e.g., GPS receivers) in one dashboard.

## Tech Stack

Plain HTML + CSS + vanilla JavaScript. No frameworks, no bundler, no dependencies.

## License

MIT — feel free to adapt for your own inventory workflow.
