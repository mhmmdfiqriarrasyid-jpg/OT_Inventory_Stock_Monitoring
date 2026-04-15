/* ============================================================================
 * seed.js — Injectable Data Template
 * ----------------------------------------------------------------------------
 * This file is the ONE place you edit to bulk-load inventory data. On first
 * load (when localStorage is empty) the dashboard copies SEED_DATA into
 * localStorage. You can also re-inject at any time via:
 *    Settings → Reset to seed
 *
 * Rules of thumb:
 *   - `itemId` must be unique across masterData.
 *   - `serial` must be unique across serialData and must reference a valid
 *     `itemId` from masterData.
 *   - Dates use ISO format: "YYYY-MM-DD".
 *   - Status values: "IN_STOCK" | "OUT" | "RESERVED" | "DAMAGED".
 *   - You can leave stockIn / stockOut / activityLog empty — they will be
 *     populated as you record movements inside the dashboard.
 * ==========================================================================*/

window.SEED_DATA = {
  masterData: [
    // Precision Delta / John Deere
    { itemId: "PRE363", item: "Display",                  category: "Precision Delta", brand: "John Deere", model: "GS Command Center Universal", deviceType: "Display" },
    { itemId: "PRE066", item: "GPS",                      category: "Precision Delta", brand: "John Deere", model: "GS Command Center",           deviceType: "GPS" },
    { itemId: "PRE100", item: "Soft Distributional Sensor", category: "Precision Delta", brand: "John Deere", model: "SDS-100",                   deviceType: "Weather Station" },

    // IoT / Milesight
    { itemId: "SOT051", item: "Radio Distance/Level Sensor", category: "IoT",          brand: "Milesight", model: "WTS506",                      deviceType: "Weather Station" },
    { itemId: "SOT061", item: "RSSI",                     category: "IoT",             brand: "Milesight", model: "EM300-RDL",                    deviceType: "Water Level" },
    { itemId: "SOT071", item: "GPS",                      category: "IoT",             brand: "Milesight", model: "LGT92",                        deviceType: "Asset Tracker" },

    // Agleader
    { itemId: "MAP001", item: "GPS",                      category: "Agleader",        brand: "Agleader", model: "Ag Leader 7200",                deviceType: "GPS" },
    { itemId: "CAB001", item: "Display",                  category: "Agleader",        brand: "Agleader", model: "Ag Leader 7500",                deviceType: "Display" },
    { itemId: "CAB002", item: "Hardware KIT",             category: "Cable",           brand: "Agleader", model: "Ag Leader Harness",             deviceType: "Cable" },
    { itemId: "MAP002", item: "GPS Receiver",             category: "Cable",           brand: "Agleader", model: "Ag Leader 6000",                deviceType: "GPS" },

    // Trimble / Base Radio
    { itemId: "BA1001", item: "Radio Data UHF",           category: "Radio",           brand: "Trimble", model: "RD450",                          deviceType: "Radio" },
    { itemId: "BA1002", item: "Base Radio",               category: "Base",            brand: "Trimble", model: "Atlas",                          deviceType: "Industrial Cellular Router" },
    { itemId: "BA1003", item: "Power Supply",             category: "Radio",           brand: "Trimble", model: "SPS6000",                        deviceType: "Power Supply" },

    // Other
    { itemId: "OTH001", item: "Kartu GSM",                category: "Other",           brand: "Telkomsel", model: "Kartu Perdana",                deviceType: "SIM Card" }
  ],

  serialData: [
    { serial: "SN-PRE363-0001", itemId: "PRE363", status: "IN_STOCK", receivedAt: "2026-01-10", notes: "" },
    { serial: "SN-PRE363-0002", itemId: "PRE363", status: "IN_STOCK", receivedAt: "2026-01-10", notes: "" },
    { serial: "SN-PRE066-0001", itemId: "PRE066", status: "IN_STOCK", receivedAt: "2026-01-12", notes: "" },
    { serial: "SN-PRE066-0002", itemId: "PRE066", status: "OUT",      receivedAt: "2026-01-12", notes: "Deployed to field A" },
    { serial: "SN-SOT051-0001", itemId: "SOT051", status: "IN_STOCK", receivedAt: "2026-02-03", notes: "" },
    { serial: "SN-SOT061-0001", itemId: "SOT061", status: "RESERVED", receivedAt: "2026-02-05", notes: "Reserved for site 12" },
    { serial: "SN-MAP001-0001", itemId: "MAP001", status: "IN_STOCK", receivedAt: "2026-02-15", notes: "" },
    { serial: "SN-CAB001-0001", itemId: "CAB001", status: "IN_STOCK", receivedAt: "2026-02-20", notes: "" },
    { serial: "SN-BA1001-0001", itemId: "BA1001", status: "DAMAGED",  receivedAt: "2026-01-25", notes: "RMA pending" },
    { serial: "SN-BA1002-0001", itemId: "BA1002", status: "IN_STOCK", receivedAt: "2026-03-01", notes: "" },
    { serial: "SN-OTH001-0001", itemId: "OTH001", status: "IN_STOCK", receivedAt: "2026-03-10", notes: "" }
  ],

  // Optional — you can leave these empty.
  stockIn: [
    { id: "IN-0001", itemId: "PRE363", serial: "SN-PRE363-0001", qty: 1, date: "2026-01-10", source: "HQ Warehouse", note: "Initial intake" },
    { id: "IN-0002", itemId: "PRE363", serial: "SN-PRE363-0002", qty: 1, date: "2026-01-10", source: "HQ Warehouse", note: "Initial intake" },
    { id: "IN-0003", itemId: "PRE066", serial: "SN-PRE066-0001", qty: 1, date: "2026-01-12", source: "HQ Warehouse", note: "Initial intake" },
    { id: "IN-0004", itemId: "PRE066", serial: "SN-PRE066-0002", qty: 1, date: "2026-01-12", source: "HQ Warehouse", note: "Initial intake" }
  ],

  stockOut: [
    { id: "OUT-0001", itemId: "PRE066", serial: "SN-PRE066-0002", qty: 1, date: "2026-03-22", destination: "Field A", note: "Deployment" }
  ],

  activityLog: [
    { id: "LOG-0001", type: "STOCK_IN",  ref: "IN-0001",  when: "2026-01-10T09:00:00", user: "system", summary: "Stock in PRE363 +1 (SN-PRE363-0001)" },
    { id: "LOG-0002", type: "STOCK_IN",  ref: "IN-0002",  when: "2026-01-10T09:01:00", user: "system", summary: "Stock in PRE363 +1 (SN-PRE363-0002)" },
    { id: "LOG-0003", type: "STOCK_IN",  ref: "IN-0003",  when: "2026-01-12T10:00:00", user: "system", summary: "Stock in PRE066 +1 (SN-PRE066-0001)" },
    { id: "LOG-0004", type: "STOCK_IN",  ref: "IN-0004",  when: "2026-01-12T10:01:00", user: "system", summary: "Stock in PRE066 +1 (SN-PRE066-0002)" },
    { id: "LOG-0005", type: "STOCK_OUT", ref: "OUT-0001", when: "2026-03-22T14:30:00", user: "system", summary: "Stock out PRE066 -1 (SN-PRE066-0002) → Field A" }
  ]
};
