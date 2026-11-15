/*
 * HA Inventory panel. Vanilla custom element, no build step, no external requests.
 * Data comes from the `ha_inventory/get` websocket command of this integration.
 */

const STRINGS = {
  en: {
    title: "Inventory",
    search: "Search name, model, area, IEEE…",
    all: "All",
    protocol: "Protocol",
    integration: "Integration",
    manufacturer: "Manufacturer",
    area: "Area",
    status: "Status",
    noArea: "No area",
    export_csv: "Export CSV",
    export_json: "Export JSON",
    refresh: "Refresh",
    loading: "Loading…",
    error: "Failed to load inventory",
    empty: "Nothing found",
    devices: "devices",
    total: "Total devices",
    combined: "Combined age",
    average: "Average age",
    oldest: "Oldest device",
    newest: "Newest device",
    attention: "Needs attention",
    col_name: "Device",
    col_model: "Manufacturer / model",
    col_protocol: "Protocol",
    col_integration: "Integration",
    col_added: "Added",
    col_fw: "Firmware",
    col_status: "Status",
    col_links: "Links",
    offline: "offline",
    lowBattery: "Low battery",
    updates: "Update available",
    disabled: "Disabled",
    approx: "First seen by Inventory (HA has no exact date)",
    unknownDate: "unknown",
    detail_serial: "Serial",
    detail_hw: "Hardware",
    detail_ieee: "IEEE",
    detail_via: "Connected via",
    detail_entities: "Entities",
    detail_model_id: "Model ID",
    y: "y", mo: "mo", d: "d",
    attentionFilter: "Needs attention",
    tab_devices: "Devices",
    tab_report: "Report",
    report_title: "Devices by type and model",
    report_summary: "devices · models · types",
    report_hint: "Click a model to see its devices. The copied or downloaded report contains only manufacturers, models and counts, so it is safe to share.",
    copy_report: "Copy report",
    copied: "Copied!",
    download_report: "Download .md",
    show_in_table: "Show in Devices tab",
    unknownModel: "Unknown model",
    unknownMaker: "Unknown manufacturer",
    models: "models",
    types: {
      light: "Lights", switch: "Switches & plugs", sensor: "Sensors", climate: "Climate",
      cover: "Covers & blinds", lock: "Locks", camera: "Cameras", media_player: "Media players",
      vacuum: "Vacuums", fan: "Fans", humidifier: "Humidifiers", water_heater: "Water heaters",
      alarm: "Alarm panels", siren: "Sirens", valve: "Valves", lawn_mower: "Lawn mowers",
      remote: "Remotes & buttons", tracker: "Trackers", hub: "Hubs & bridges",
      service: "Services", other: "Other",
    },
    privacy: "All data is processed and stored locally. Links open only when you click them.",
    tiers: ["Newborn", "Young", "Settled", "Veteran", "Ancient"],
    protocols: { zigbee: "Zigbee", zwave: "Z-Wave", matter: "Matter", bluetooth: "Bluetooth", network: "Network / cloud", service: "Service", other: "Other" },
    links: {
      ha_device: "Open in HA",
      z2m: "Zigbee2MQTT",
      z2m_search: "Find in Z2M",
      zwave_db: "Z-Wave DB",
      manufacturer: "Manufacturer",
      docs: "HA docs",
      device_ui: "Device UI",
      search: "Web search",
    },
  },
};

const TIER_EMOJI = ["🍼", "🌱", "🏠", "🛡️", "🦖"];

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const STYLE = `
:host { display:block; height:100%; background:var(--primary-background-color); color:var(--primary-text-color); font-family:var(--paper-font-body1_-_font-family, Roboto, sans-serif); }
* { box-sizing:border-box; }
.bar { display:flex; align-items:center; gap:8px; height:56px; padding:0 12px; background:var(--app-header-background-color, var(--primary-color)); color:var(--app-header-text-color, #fff); position:sticky; top:0; z-index:5; }
.bar h1 { font-size:20px; font-weight:400; margin:0; flex:1; }
.wrap { padding:16px; max-width:1500px; margin:0 auto; }
.cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:12px; margin-bottom:16px; }
.card { background:var(--card-background-color); border-radius:var(--ha-card-border-radius,12px); padding:12px 16px; box-shadow:var(--ha-card-box-shadow, none); border:1px solid var(--divider-color); }
.card .k { font-size:12px; color:var(--secondary-text-color); text-transform:uppercase; letter-spacing:.04em; }
.card .v { font-size:26px; margin-top:4px; }
.card .s { font-size:13px; color:var(--secondary-text-color); margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mix { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
.toolbar { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; align-items:center; }
input, select, button { font:inherit; color:var(--primary-text-color); background:var(--card-background-color); border:1px solid var(--divider-color); border-radius:8px; padding:8px 10px; }
input[type=search] { flex:1; min-width:200px; }
button { cursor:pointer; }
button:hover { border-color:var(--primary-color); }
.bar button { background:transparent; color:inherit; border-color:rgba(255,255,255,.4); }
.tablewrap { overflow:auto; border:1px solid var(--divider-color); border-radius:12px; background:var(--card-background-color); }
table { width:100%; border-collapse:collapse; font-size:14px; }
th { text-align:left; padding:10px 12px; color:var(--secondary-text-color); font-weight:500; position:sticky; top:0; background:var(--card-background-color); cursor:pointer; white-space:nowrap; border-bottom:1px solid var(--divider-color); user-select:none; }
th.sorted::after { content: attr(data-dir); margin-left:4px; }
td { padding:10px 12px; border-bottom:1px solid var(--divider-color); vertical-align:top; }
tr.row { cursor:pointer; }
tr.row:hover td { background:var(--secondary-background-color); }
tr.detail td { background:var(--secondary-background-color); font-size:13px; }
.sub { color:var(--secondary-text-color); font-size:12px; }
.chip { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; margin:0 4px 4px 0; background:var(--secondary-background-color); border:1px solid var(--divider-color); white-space:nowrap; }
.chip.warn { color:var(--error-color, #db4437); border-color:currentColor; }
.chip.info { color:var(--primary-color); border-color:currentColor; }
.chip.proto { background:var(--primary-color); color:var(--text-primary-color, #fff); border-color:transparent; }
a.link { display:inline-block; margin:0 6px 2px 0; color:var(--primary-color); text-decoration:none; font-size:13px; white-space:nowrap; }
a.link:hover { text-decoration:underline; }
.detailgrid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:6px 16px; }
.footer { margin:16px 0 8px; color:var(--secondary-text-color); font-size:12px; text-align:center; }
.tabs { display:flex; gap:4px; }
.tabs button.active { background:rgba(255,255,255,.22); }
.card.click { cursor:pointer; transition:border-color .15s; }
.card.click:hover { border-color:var(--primary-color); }
.card.click .s span.cnt { text-decoration:underline dotted; }
.card.click .s span.cnt:hover { color:var(--primary-color); }
.typeblock { background:var(--card-background-color); border:1px solid var(--divider-color); border-radius:12px; margin-bottom:12px; overflow:hidden; }
.typehead { display:flex; align-items:baseline; gap:10px; padding:12px 16px; border-bottom:1px solid var(--divider-color); }
.typehead h2 { margin:0; font-size:17px; font-weight:500; flex:1; }
.model { border-bottom:1px solid var(--divider-color); }
.model:last-child { border-bottom:none; }
.modelrow { display:flex; align-items:center; gap:12px; padding:10px 16px; cursor:pointer; }
.modelrow:hover { background:var(--secondary-background-color); }
.modelrow .mname { flex:1; min-width:0; }
.modelrow .mname div { overflow:hidden; text-overflow:ellipsis; }
.count { font-weight:500; background:var(--secondary-background-color); border:1px solid var(--divider-color); border-radius:999px; padding:1px 10px; font-size:13px; }
.modeldevs { padding:4px 16px 12px 32px; background:var(--secondary-background-color); font-size:13px; }
.modeldevs .dev { display:flex; flex-wrap:wrap; gap:4px 16px; padding:6px 0; border-bottom:1px dashed var(--divider-color); }
.modeldevs .dev:last-child { border-bottom:none; }
.reportbar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:12px; }
.reportbar .sub { flex:1; min-width:200px; }
.msg { padding:40px; text-align:center; color:var(--secondary-text-color); }
`;

class HaInventoryPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._data = null;
    this._error = null;
    this._query = "";
    this._filters = { protocol: "", integration: "", manufacturer: "", area: "", status: "" };
    this._sort = { key: "name", dir: 1 };
    this._open = new Set();
    this._openModels = new Set();
    this._view = "devices";
    this._built = false;
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) {
      this._build();
      this._load();
    }
    if (this._menu) this._menu.hass = hass;
  }

  set narrow(narrow) {
    this._narrow = narrow;
    if (this._menu) this._menu.narrow = narrow;
  }

  set panel(_) {}
  set route(_) {}

  get _t() {
    return STRINGS.en;
  }

  get _locale() {
    return "en";
  }

  async _load() {
    this._error = null;
    this._renderBody();
    try {
      this._data = await this._hass.callWS({ type: "ha_inventory/get" });
    } catch (err) {
      this._error = (err && err.message) || String(err);
    }
    this._renderFilters();
    this._renderBody();
  }

  /* ---------- static skeleton ---------- */

  _build() {
    const t = this._t;
    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <div class="bar">
        <span id="menu"></span>
        <h1>${esc(t.title)}</h1>
        <span class="tabs">
          <button id="tab_devices">${esc(t.tab_devices)}</button>
          <button id="tab_report">${esc(t.tab_report)}</button>
        </span>
        <button id="refresh">${esc(t.refresh)}</button>
      </div>
      <div class="wrap">
        <div id="devicesView">
          <div id="cards" class="cards"></div>
          <div class="toolbar">
            <input id="q" type="search" placeholder="${esc(t.search)}" />
            <span id="filters"></span>
            <button id="csv">${esc(t.export_csv)}</button>
            <button id="json">${esc(t.export_json)}</button>
          </div>
          <div id="table"></div>
        </div>
        <div id="reportView" hidden></div>
        <div class="footer">${esc(t.privacy)}</div>
      </div>`;
    const root = this.shadowRoot;
    const menu = document.createElement("ha-menu-button");
    menu.hass = this._hass;
    menu.narrow = this._narrow;
    root.getElementById("menu").appendChild(menu);
    this._menu = menu;

    root.getElementById("q").addEventListener("input", (e) => {
      this._query = e.target.value.toLowerCase();
      this._renderTable();
    });
    root.getElementById("refresh").addEventListener("click", () => this._load());
    root.getElementById("csv").addEventListener("click", () => this._export("csv"));
    root.getElementById("json").addEventListener("click", () => this._export("json"));
    root.getElementById("tab_devices").addEventListener("click", () => this._setView("devices"));
    root.getElementById("tab_report").addEventListener("click", () => this._setView("report"));
    // One delegated handler for the clickable "needs attention" card.
    root.getElementById("cards").addEventListener("click", (e) => {
      const target = e.target.closest("[data-status]");
      if (target) this._applyStatusFilter(target.dataset.status);
    });
    this._built = true;
    this._setView("devices");
  }

  _setView(view) {
    this._view = view;
    const root = this.shadowRoot;
    root.getElementById("devicesView").hidden = view !== "devices";
    root.getElementById("reportView").hidden = view !== "report";
    root.getElementById("tab_devices").classList.toggle("active", view === "devices");
    root.getElementById("tab_report").classList.toggle("active", view === "report");
    if (view === "report") this._renderReport();
  }

  _applyStatusFilter(status) {
    this._filters = { protocol: "", integration: "", manufacturer: "", area: "", status };
    this._query = "";
    this.shadowRoot.getElementById("q").value = "";
    this._renderFilters();
    this._renderTable();
    this.shadowRoot.getElementById("table").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- helpers ---------- */

  _formatAge(days) {
    const t = this._t;
    if (days == null) return t.unknownDate;
    if (days < 30) return `${days} ${t.d}`;
    const years = Math.floor(days / 365.25);
    const months = Math.floor((days - years * 365.25) / 30.44);
    if (years === 0) return `${months} ${t.mo}`;
    return months ? `${years} ${t.y} ${months} ${t.mo}` : `${years} ${t.y}`;
  }

  _tier(days) {
    if (days == null) return null;
    const idx = days < 30 ? 0 : days < 180 ? 1 : days < 730 ? 2 : days < 1460 ? 3 : 4;
    return `${TIER_EMOJI[idx]} ${this._t.tiers[idx]}`;
  }

  _formatDate(iso) {
    if (!iso) return this._t.unknownDate;
    return new Date(iso).toLocaleDateString(this._locale, { year: "numeric", month: "short", day: "numeric" });
  }

  _protocolName(p) {
    return this._t.protocols[p] || p;
  }

  _isLowBattery(d) {
    const thr = (this._data && this._data.summary.low_battery_threshold) || 20;
    return d.battery != null && d.battery <= thr;
  }

  _matchesStatus(d, status) {
    switch (status) {
      case "attention": return d.offline || this._isLowBattery(d) || !!d.update;
      case "offline": return d.offline;
      case "low_battery": return this._isLowBattery(d);
      case "update": return !!d.update;
      case "no_area": return !d.area;
      case "disabled": return d.disabled;
      default: return true;
    }
  }

  _filtered() {
    if (!this._data) return [];
    const f = this._filters;
    const q = this._query;
    const rows = this._data.devices.filter((d) => {
      if (f.protocol && d.protocol !== f.protocol) return false;
      if (f.integration && !d.integrations.includes(f.integration)) return false;
      if (f.manufacturer && (d.manufacturer || "") !== f.manufacturer) return false;
      if (f.area && (d.area || "") !== (f.area === "__none__" ? "" : f.area)) return false;
      if (f.status && !this._matchesStatus(d, f.status)) return false;
      if (q) {
        const hay = [d.name, d.manufacturer, d.model, d.model_id, d.area, d.ieee, d.serial_number, d.sw_version, d.integrations.join(" ")]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const { key, dir } = this._sort;
    const val = (d) => {
      switch (key) {
        case "manufacturer": return `${d.manufacturer || ""} ${d.model || ""}`.toLowerCase();
        case "protocol": return d.protocol;
        case "integration": return d.integrations.join(",");
        case "added": return d.added ? Date.parse(d.added) : null;
        case "fw": return (d.sw_version || "").toLowerCase();
        default: return (d.name || "").toLowerCase();
      }
    };
    return rows.sort((a, b) => {
      const va = val(a), vb = val(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return (va < vb ? -1 : va > vb ? 1 : 0) * dir;
    });
  }

  /* ---------- rendering ---------- */

  _renderFilters() {
    const t = this._t;
    const host = this.shadowRoot.getElementById("filters");
    if (!this._data) { host.innerHTML = ""; return; }
    const s = this._data.summary;
    const opt = (value, label, count) => `<option value="${esc(value)}">${esc(label)}${count != null ? ` (${count})` : ""}</option>`;
    const select = (id, label, options) =>
      `<select id="f_${id}" title="${esc(label)}"><option value="">${esc(label)}: ${esc(t.all)}</option>${options.join("")}</select>`;

    const protocols = s.by_protocol.map((x) => opt(x.key, this._protocolName(x.key), x.count));
    const integrations = [...new Set(this._data.devices.flatMap((d) => d.integrations))].sort().map((x) => opt(x, x));
    const manufacturers = [...new Set(this._data.devices.map((d) => d.manufacturer || ""))].filter(Boolean).sort().map((x) => opt(x, x));
    const areas = [...new Set(this._data.devices.map((d) => d.area).filter(Boolean))].sort().map((x) => opt(x, x));
    areas.unshift(opt("__none__", t.noArea));
    const statuses = [
      opt("attention", `${t.attentionFilter} (${this._data.devices.filter((d) => this._matchesStatus(d, "attention")).length})`),
      opt("offline", `${t.offline} (${s.offline})`),
      opt("low_battery", `${t.lowBattery} (${s.low_battery})`),
      opt("update", `${t.updates} (${s.updates})`),
      opt("no_area", `${t.noArea} (${s.no_area})`),
      opt("disabled", `${t.disabled} (${s.disabled})`),
    ];

    host.innerHTML = [
      select("protocol", t.protocol, protocols),
      select("integration", t.integration, integrations),
      select("manufacturer", t.manufacturer, manufacturers),
      select("area", t.area, areas),
      select("status", t.status, statuses),
    ].join(" ");

    for (const key of Object.keys(this._filters)) {
      const el = host.querySelector(`#f_${key}`);
      el.value = this._filters[key];
      el.addEventListener("change", (e) => {
        this._filters[key] = e.target.value;
        this._renderTable();
      });
    }
  }

  _renderCards() {
    const t = this._t;
    const host = this.shadowRoot.getElementById("cards");
    if (!this._data) { host.innerHTML = ""; return; }
    const s = this._data.summary;
    const device = (x) => (x ? `${esc(x.name)}` : "–");
    const age = (x) => (x ? this._formatAge(x.age_days) : "");
    // Distinct devices (one device can be offline and low on battery at once).
    const attention = this._data.devices.filter((d) => this._matchesStatus(d, "attention")).length;
    const mix = s.by_protocol.map((p) => `<span class="chip proto">${esc(this._protocolName(p.key))}: ${p.count}</span>`).join("");
    host.innerHTML = `
      <div class="card"><div class="k">${esc(t.total)}</div><div class="v">${s.total}</div><div class="mix">${mix}</div></div>
      <div class="card"><div class="k">${esc(t.oldest)}</div><div class="v">${esc(age(s.oldest) || "–")}</div><div class="s" title="${esc(s.oldest && s.oldest.name)}">${device(s.oldest)}</div></div>
      <div class="card"><div class="k">${esc(t.newest)}</div><div class="v">${esc(age(s.newest) || "–")}</div><div class="s" title="${esc(s.newest && s.newest.name)}">${device(s.newest)}</div></div>
      <div class="card"><div class="k">${esc(t.average)}</div><div class="v">${esc(s.average_age_days != null ? this._formatAge(s.average_age_days) : "–")}</div><div class="s">${esc(t.combined)}: ${esc(this._formatAge(s.total_age_days))}</div></div>
      <div class="card click" data-status="attention" title="${esc(t.attentionFilter)}"><div class="k">${esc(t.attention)}</div><div class="v">${attention}</div><div class="s"><span class="cnt" data-status="offline">${esc(t.offline)} ${s.offline}</span> · <span class="cnt" data-status="low_battery">${esc(t.lowBattery.toLowerCase())} ${s.low_battery}</span> · <span class="cnt" data-status="update">${esc(t.updates.toLowerCase())} ${s.updates}</span></div></div>`;
  }

  _renderBody() {
    if (!this._built) return;
    this._renderCards();
    this._renderTable();
    if (this._view === "report") this._renderReport();
  }

  /* ---------- report: type -> model -> devices ---------- */

  _reportGroups() {
    const t = this._t;
    const types = new Map();
    for (const d of this._data ? this._data.devices : []) {
      const maker = d.manufacturer || "";
      const model = d.model || "";
      const type = types.get(d.type) || types.set(d.type, { type: d.type, models: new Map(), count: 0 }).get(d.type);
      const key = `${maker}|${model}`.toLowerCase();
      const entry = type.models.get(key) || type.models.set(key, { key: `${d.type}|${key}`, maker, model, devices: [] }).get(key);
      entry.devices.push(d);
      type.count += 1;
    }
    const list = [...types.values()].map((g) => ({
      ...g,
      label: t.types[g.type] || g.type,
      models: [...g.models.values()].sort((a, b) => b.devices.length - a.devices.length || `${a.maker} ${a.model}`.localeCompare(`${b.maker} ${b.model}`)),
    }));
    // "Other" always last, the rest by number of devices.
    return list.sort((a, b) => (a.type === "other") - (b.type === "other") || b.count - a.count);
  }

  _renderReport() {
    const t = this._t;
    const host = this.shadowRoot.getElementById("reportView");
    if (this._error) { host.innerHTML = `<div class="msg">${esc(t.error)}: ${esc(this._error)}</div>`; return; }
    if (!this._data) { host.innerHTML = `<div class="msg">${esc(t.loading)}</div>`; return; }
    const groups = this._reportGroups();
    const modelCount = groups.reduce((n, g) => n + g.models.length, 0);
    const blocks = groups.map((g) => {
      const rows = g.models.map((m) => {
        const open = this._openModels.has(m.key);
        const devs = open
          ? `<div class="modeldevs">${m.devices.map((d) => this._reportDeviceHtml(d)).join("")}
               <div style="padding-top:8px"><button data-show="${esc(m.model || m.maker)}">${esc(t.show_in_table)}</button></div></div>`
          : "";
        return `<div class="model">
          <div class="modelrow" data-model="${esc(m.key)}">
            <div class="mname"><div>${esc(m.model || t.unknownModel)}</div><div class="sub">${esc(m.maker || t.unknownMaker)}</div></div>
            <span class="count">×${m.devices.length}</span>
          </div>${devs}</div>`;
      }).join("");
      return `<div class="typeblock">
        <div class="typehead"><h2>${esc(g.label)}</h2><span class="sub">${g.count} ${esc(t.devices)} · ${g.models.length} ${esc(t.models)}</span></div>${rows}</div>`;
    }).join("");

    host.innerHTML = `
      <div class="reportbar">
        <div class="sub"><b>${esc(t.report_title)}</b><br>${this._data.devices.length} ${esc(t.devices)} · ${modelCount} ${esc(t.models)} · ${groups.length} types<br>${esc(t.report_hint)}</div>
        <button id="copyReport">${esc(t.copy_report)}</button>
        <button id="dlReport">${esc(t.download_report)}</button>
      </div>${blocks}`;

    host.querySelectorAll(".modelrow").forEach((el) =>
      el.addEventListener("click", () => {
        const key = el.dataset.model;
        this._openModels.has(key) ? this._openModels.delete(key) : this._openModels.add(key);
        this._renderReport();
      })
    );
    host.querySelectorAll("button[data-show]").forEach((el) =>
      el.addEventListener("click", () => {
        this._applyStatusFilter("");
        this._query = el.dataset.show.toLowerCase();
        this.shadowRoot.getElementById("q").value = el.dataset.show;
        this._setView("devices");
        this._renderTable();
      })
    );
    host.querySelector("#copyReport").addEventListener("click", (e) => this._copyReport(e.target));
    host.querySelector("#dlReport").addEventListener("click", () => this._download(this._reportMarkdown(), "text/markdown;charset=utf-8", `ha-inventory-report-${new Date().toISOString().slice(0, 10)}.md`));
  }

  _reportDeviceHtml(d) {
    const t = this._t;
    const bits = [
      `<b>${esc(d.name)}</b>`,
      d.area ? esc(d.area) : `<span class="sub">${esc(t.noArea)}</span>`,
      d.added ? `${esc(this._formatDate(d.added))}${d.added_source === "first_seen" ? " ≈" : ""} · ${esc(this._formatAge(d.age_days))}` : "",
      d.sw_version ? `${esc(t.col_fw)}: ${esc(d.sw_version)}` : "",
    ].filter(Boolean).join(" · ");
    const links = d.links.map((l) => {
      const internal = l.url.startsWith("/");
      const attrs = internal ? "" : ' target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer"';
      return `<a class="link" href="${esc(l.url)}"${attrs}>${esc(t.links[l.kind] || l.kind)}</a>`;
    }).join("");
    return `<div class="dev"><span>${bits}</span><span>${links}</span></div>`;
  }

  /** Shareable text: manufacturers, models and counts only. No names, areas or ids. */
  _reportMarkdown() {
    const t = this._t;
    const groups = this._reportGroups();
    const lines = [`# My Home Assistant devices`, "", `${this._data.devices.length} ${t.devices}, ${groups.reduce((n, g) => n + g.models.length, 0)} ${t.models}`, ""];
    for (const g of groups) {
      lines.push(`## ${g.label} (${g.count})`, "");
      for (const m of g.models) {
        const name = [m.maker, m.model].filter(Boolean).join(" ") || t.unknownModel;
        lines.push(`- ${name}${m.devices.length > 1 ? ` ×${m.devices.length}` : ""}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }

  async _copyReport(button) {
    const text = this._reportMarkdown();
    try {
      await navigator.clipboard.writeText(text);
      const old = button.textContent;
      button.textContent = this._t.copied;
      setTimeout(() => (button.textContent = old), 1500);
    } catch (_) {
      // Clipboard needs a secure context (https); fall back to a file download.
      this._download(text, "text/markdown;charset=utf-8", "ha-inventory-report.md");
    }
  }

  _download(text, type, name) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  _renderTable() {
    const t = this._t;
    const host = this.shadowRoot.getElementById("table");
    if (this._error) { host.innerHTML = `<div class="msg">${esc(t.error)}: ${esc(this._error)}</div>`; return; }
    if (!this._data) { host.innerHTML = `<div class="msg">${esc(t.loading)}</div>`; return; }
    const rows = this._filtered();
    const th = (key, label) => {
      const sorted = this._sort.key === key;
      return `<th data-sort="${key}" class="${sorted ? "sorted" : ""}" data-dir="${this._sort.dir > 0 ? "▲" : "▼"}">${esc(label)}</th>`;
    };
    const body = rows.length
      ? rows.map((d) => this._rowHtml(d)).join("")
      : `<tr><td colspan="8" class="msg">${esc(t.empty)}</td></tr>`;
    host.innerHTML = `
      <div class="sub" style="margin:0 0 6px 4px">${rows.length} / ${this._data.devices.length} ${esc(t.devices)}</div>
      <div class="tablewrap"><table>
        <thead><tr>${th("name", t.col_name)}${th("manufacturer", t.col_model)}${th("protocol", t.col_protocol)}${th("integration", t.col_integration)}${th("added", t.col_added)}${th("fw", t.col_fw)}<th>${esc(t.col_status)}</th><th>${esc(t.col_links)}</th></tr></thead>
        <tbody>${body}</tbody>
      </table></div>`;

    host.querySelectorAll("th[data-sort]").forEach((el) =>
      el.addEventListener("click", () => {
        const key = el.dataset.sort;
        this._sort = { key, dir: this._sort.key === key ? -this._sort.dir : 1 };
        this._renderTable();
      })
    );
    host.querySelectorAll("tr.row").forEach((el) =>
      el.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        const id = el.dataset.id;
        this._open.has(id) ? this._open.delete(id) : this._open.add(id);
        this._renderTable();
      })
    );
  }

  _rowHtml(d) {
    const t = this._t;
    const tier = this._tier(d.age_days);
    const added = d.added
      ? `${esc(this._formatDate(d.added))}${d.added_source === "first_seen" ? ` <span title="${esc(t.approx)}">≈</span>` : ""}<div class="sub">${esc(this._formatAge(d.age_days))}${tier ? ` · ${esc(tier)}` : ""}</div>`
      : `<span class="sub">${esc(t.unknownDate)}</span>`;
    const chips = [];
    if (d.offline) chips.push(`<span class="chip warn">${esc(t.offline)}</span>`);
    if (this._isLowBattery(d)) chips.push(`<span class="chip warn">🔋 ${d.battery}%</span>`);
    else if (d.battery != null) chips.push(`<span class="chip">🔋 ${d.battery}%</span>`);
    if (d.update) chips.push(`<span class="chip info" title="${esc(d.update.installed)} → ${esc(d.update.latest)}">⬆ ${esc(d.update.latest || t.updates)}</span>`);
    if (d.disabled) chips.push(`<span class="chip">${esc(t.disabled)}</span>`);
    const links = d.links
      .map((l) => {
        const internal = l.url.startsWith("/");
        const attrs = internal ? "" : ' target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer"';
        return `<a class="link" href="${esc(l.url)}"${attrs}>${esc(t.links[l.kind] || l.kind)}</a>`;
      })
      .join("");
    const open = this._open.has(d.id);
    const main = `
      <tr class="row" data-id="${esc(d.id)}">
        <td>${esc(d.name)}<div class="sub">${esc(d.area || t.noArea)}</div></td>
        <td>${esc(d.manufacturer || "–")}<div class="sub">${esc(d.model || "")}</div></td>
        <td><span class="chip proto">${esc(this._protocolName(d.protocol))}</span></td>
        <td>${esc(d.integrations.join(", "))}</td>
        <td>${added}</td>
        <td>${esc(d.sw_version || "–")}</td>
        <td>${chips.join("") || "–"}</td>
        <td>${links}</td>
      </tr>`;
    if (!open) return main;
    const detail = [
      [t.detail_model_id, d.model_id],
      [t.detail_serial, d.serial_number],
      [t.detail_hw, d.hw_version],
      [t.detail_ieee, d.ieee],
      [t.detail_via, d.via],
      [t.detail_entities, d.entities],
    ]
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `<div><span class="sub">${esc(k)}:</span> ${esc(v)}</div>`)
      .join("");
    return `${main}<tr class="detail"><td colspan="8"><div class="detailgrid">${detail}</div></td></tr>`;
  }

  /* ---------- export (client side only, nothing leaves the browser) ---------- */

  _export(kind) {
    const rows = this._filtered();
    let blob, name;
    const stamp = new Date().toISOString().slice(0, 10);
    if (kind === "json") {
      blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
      name = `ha-inventory-${stamp}.json`;
    } else {
      const cols = ["name", "manufacturer", "model", "model_id", "protocol", "integrations", "area", "added", "age_days", "sw_version", "hw_version", "serial_number", "ieee", "entities", "battery", "offline", "update", "links"];
      const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const flat = (d, c) => {
        if (c === "integrations") return d.integrations.join("|");
        if (c === "update") return d.update ? `${d.update.installed || ""}->${d.update.latest || ""}` : "";
        if (c === "links") return d.links.filter((l) => !l.url.startsWith("/")).map((l) => l.url).join(" ");
        return d[c];
      };
      const lines = [cols.join(",")].concat(rows.map((d) => cols.map((c) => cell(flat(d, c))).join(",")));
      blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
      name = `ha-inventory-${stamp}.csv`;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

customElements.define("ha-inventory-panel", HaInventoryPanel);
