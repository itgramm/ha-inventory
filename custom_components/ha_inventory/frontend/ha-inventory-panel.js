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
    show_all: "Show all devices",
    filter_by: "Filter by this protocol",
    tab_devices: "Devices",
    tab_report: "Report",
    report_title: "Devices by type and model",
    report_summary: "devices · models · types",
    report_hint: "Click a model to see its devices. The shared report contains only manufacturers, models, counts and public links (no names, areas or IDs).",
    share: "Share…",
    share_title: "Share report",
    share_doc_title: "My Home Assistant devices",
    share_credit: "Made with HA Inventory",
    share_hints: {
      telegram: "Pastes with bold text in Telegram and Signal.",
      whatsapp: "Pastes with bold text in WhatsApp.",
      markdown: "Markdown for GitHub, Notion, Obsidian, forums.",
      rich: "Copies formatted text with clickable links (Google Docs, Notes, email, Word).",
    },
    fmt_telegram: "Telegram / Signal",
    fmt_whatsapp: "WhatsApp",
    fmt_markdown: "Markdown",
    fmt_rich: "Rich text (Docs, Notes, email)",
    include_links: "Include links",
    choose_models: "Choose what to share",
    pick_all: "Select all",
    pick_none: "Select none",
    nothing_selected: "Nothing selected. Pick at least one model above.",
    copy: "Copy",
    copied: "Copied!",
    copy_failed: "Select and copy manually",
    download_md: "Download .md",
    close: "Close",
    report_unique: "unique models",
    types_word: "types",
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

const TYPE_ICON = {
  light: "💡", switch: "🔌", sensor: "🌡️", climate: "♨️", cover: "🪟", lock: "🔒", camera: "📷",
  media_player: "🔊", vacuum: "🧹", fan: "🌀", humidifier: "💧", water_heater: "🚿", alarm: "🚨",
  siren: "📢", valve: "🚰", lawn_mower: "🌱", remote: "🎛️", tracker: "📍", hub: "🛰️", service: "☁️", other: "📦",
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
.chip.click { cursor:pointer; }
.chip.click:hover { filter:brightness(1.15); }
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
button.primary { background:var(--primary-color); color:var(--text-primary-color,#fff); border-color:transparent; }
.typegrid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr)); gap:12px; align-items:start; }
.typegrid .typeblock { margin-bottom:0; }
.ticon { font-size:20px; }
.share-bar { height:3px; background:var(--divider-color); }
.share-bar div { height:100%; background:var(--primary-color); }
.chev { color:var(--secondary-text-color); width:12px; }
.mlinks { display:flex; flex-wrap:wrap; justify-content:flex-end; }
dialog { background:var(--card-background-color); color:var(--primary-text-color); border:1px solid var(--divider-color); border-radius:14px; padding:16px; width:min(720px,94vw); max-height:94vh; overflow:auto; }
dialog::backdrop { background:rgba(0,0,0,.55); }
.dlghead, .dlgfoot, .dlgopts { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.dlghead { justify-content:space-between; margin-bottom:12px; font-size:17px; }
.dlgopts { margin-bottom:10px; }
.dlgfoot { margin-top:12px; justify-content:flex-end; }
.dlgfoot .sub { flex:1; min-width:180px; }
.pick { margin-bottom:10px; border:1px solid var(--divider-color); border-radius:8px; padding:6px 10px; }
.pick summary { cursor:pointer; font-size:14px; padding:4px 0; }
.pickbtns { display:flex; gap:8px; margin:6px 0; }
.pickbtns button { padding:4px 10px; font-size:13px; }
#pickList { max-height:min(30vh,260px); overflow:auto; padding-bottom:4px; }
.phead { display:flex; align-items:center; gap:6px; font-weight:500; margin-top:8px; }
.pmodel { display:flex; align-items:center; gap:6px; padding:2px 0 2px 24px; font-size:13px; }
.phead .sub, .pmodel .sub { margin-left:auto; }
#shareText { width:100%; height:min(50vh,420px); resize:vertical; font:13px/1.45 ui-monospace,Menlo,Consolas,monospace; background:var(--primary-background-color); color:var(--primary-text-color); border:1px solid var(--divider-color); border-radius:8px; padding:10px; }
#shareRich { max-height:min(50vh,420px); overflow:auto; background:#fff; color:#111; border-radius:8px; padding:4px 16px; }
#shareRich a { color:#0b57d0; }
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
    this._shareExcluded = new Set();
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
      </div>
      <dialog id="share">
        <div class="dlghead"><b>${esc(t.share_title)}</b><button id="shareClose">${esc(t.close)}</button></div>
        <div class="dlgopts">
          <select id="shareFmt">
            <option value="telegram">${esc(t.fmt_telegram)}</option>
            <option value="whatsapp">${esc(t.fmt_whatsapp)}</option>
            <option value="markdown">${esc(t.fmt_markdown)}</option>
            <option value="rich">${esc(t.fmt_rich)}</option>
          </select>
          <label><input type="checkbox" id="shareLinks" checked> ${esc(t.include_links)}</label>
        </div>
        <details id="sharePick" class="pick">
          <summary id="pickSummary"></summary>
          <div class="pickbtns"><button id="pickAll">${esc(t.pick_all)}</button><button id="pickNone">${esc(t.pick_none)}</button></div>
          <div id="pickList"></div>
        </details>
        <textarea id="shareText" readonly spellcheck="false"></textarea>
        <div id="shareRich" hidden></div>
        <div class="dlgfoot">
          <span class="sub" id="shareHint"></span>
          <button id="shareDl">${esc(t.download_md)}</button>
          <button id="shareCopy" class="primary">${esc(t.copy)}</button>
        </div>
      </dialog>`;
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
      const target = e.target.closest("[data-protocol],[data-status],[data-reset]");
      if (!target) return;
      if (target.dataset.protocol) this._applyFilters({ protocol: target.dataset.protocol });
      else if (target.dataset.status) this._applyFilters({ status: target.dataset.status });
      else this._applyFilters({});
    });
    const dlg = root.getElementById("share");
    root.getElementById("shareClose").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    root.getElementById("shareFmt").addEventListener("change", () => this._renderShare());
    root.getElementById("shareLinks").addEventListener("change", () => this._renderShare());
    root.getElementById("shareCopy").addEventListener("click", (e) => this._shareCopy(e.target));
    root.getElementById("pickAll").addEventListener("click", () => this._pickAll(true));
    root.getElementById("pickNone").addEventListener("click", () => this._pickAll(false));
    root.getElementById("pickList").addEventListener("change", (e) => this._pickChanged(e.target));
    root.getElementById("shareDl").addEventListener("click", () =>
      this._download(this._shareContent("markdown", root.getElementById("shareLinks").checked).text, "text/markdown;charset=utf-8", `ha-inventory-report-${new Date().toISOString().slice(0, 10)}.md`));
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
    this._applyFilters({ status });
  }

  _applyFilters(partial) {
    this._filters = { protocol: "", integration: "", manufacturer: "", area: "", status: "", ...partial };
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

  /** "Description (CODE)": newer Zigbee2MQTT puts the code in model_id, not model. */
  _modelLabel(d) {
    const model = d.model || "";
    const id = d.model_id || "";
    if (model && id && !model.toLowerCase().includes(id.toLowerCase())) return `${model} (${id})`;
    return model || id;
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
        case "manufacturer": return `${d.manufacturer || ""} ${this._modelLabel(d)}`.toLowerCase();
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
    const mix = s.by_protocol.map((p) => `<span class="chip proto click" data-protocol="${esc(p.key)}" title="${esc(this._t.filter_by)}">${esc(this._protocolName(p.key))}: ${p.count}</span>`).join("");
    host.innerHTML = `
      <div class="card click" data-reset="1" title="${esc(t.show_all)}"><div class="k">${esc(t.total)}</div><div class="v">${s.total}</div><div class="mix">${mix}</div></div>
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

  /** Links worth showing for a model (device specific ones like "Open in HA" are skipped). */
  _modelLinks(devices) {
    const order = ["z2m", "zwave_db", "z2m_search", "manufacturer", "search"];
    const found = {};
    for (const d of devices) for (const l of d.links) if (order.includes(l.kind) && !found[l.kind]) found[l.kind] = l;
    return order.filter((k) => found[k]).map((k) => found[k]);
  }

  _reportGroups() {
    const t = this._t;
    const types = new Map();
    for (const d of this._data ? this._data.devices : []) {
      const maker = d.manufacturer || "";
      const model = this._modelLabel(d);
      const type = types.get(d.type) || types.set(d.type, { type: d.type, models: new Map(), count: 0 }).get(d.type);
      const key = `${maker}|${model}`.toLowerCase();
      const entry = type.models.get(key) || type.models.set(key, { key: `${d.type}|${key}`, maker, model, search: d.model_id || d.model || maker, devices: [] }).get(key);
      entry.devices.push(d);
      type.count += 1;
    }
    const list = [...types.values()].map((g) => ({
      ...g,
      label: t.types[g.type] || g.type,
      icon: TYPE_ICON[g.type] || "📦",
      models: [...g.models.values()]
        .map((m) => ({ ...m, name: [m.maker, m.model].filter(Boolean).join(" ") || t.unknownModel, links: this._modelLinks(m.devices) }))
        .sort((x, y) => y.devices.length - x.devices.length || x.name.localeCompare(y.name)),
    }));
    // "Other" always last, the rest by number of devices.
    return list.sort((x, y) => (x.type === "other") - (y.type === "other") || y.count - x.count);
  }

  _linkChips(links) {
    const t = this._t;
    return links
      .map((l) => `<a class="link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">${esc(t.links[l.kind] || l.kind)}</a>`)
      .join("");
  }

  _renderReport() {
    const t = this._t;
    const host = this.shadowRoot.getElementById("reportView");
    if (this._error) { host.innerHTML = `<div class="msg">${esc(t.error)}: ${esc(this._error)}</div>`; return; }
    if (!this._data) { host.innerHTML = `<div class="msg">${esc(t.loading)}</div>`; return; }
    const groups = this._reportGroups();
    const total = this._data.devices.length;
    const modelCount = groups.reduce((n, g) => n + g.models.length, 0);
    const mix = this._data.summary.by_protocol.map((p) => `<span class="chip proto click" data-protocol="${esc(p.key)}" title="${esc(this._t.filter_by)}">${esc(this._protocolName(p.key))}: ${p.count}</span>`).join("");

    const blocks = groups.map((g) => {
      const rows = g.models.map((m) => {
        const open = this._openModels.has(m.key);
        const devs = open
          ? `<div class="modeldevs">${m.devices.map((d) => this._reportDeviceHtml(d)).join("")}
               <div style="padding-top:8px"><button data-show="${esc(m.search)}">${esc(t.show_in_table)}</button></div></div>`
          : "";
        return `<div class="model">
          <div class="modelrow" data-model="${esc(m.key)}">
            <span class="chev">${open ? "▾" : "▸"}</span>
            <div class="mname"><div>${esc(m.model || t.unknownModel)}</div><div class="sub">${esc(m.maker || t.unknownMaker)}</div></div>
            <span class="mlinks">${this._linkChips(m.links)}</span>
            <span class="count">×${m.devices.length}</span>
          </div>${devs}</div>`;
      }).join("");
      const pct = Math.max(2, Math.round((g.count / total) * 100));
      return `<div class="typeblock">
        <div class="typehead"><span class="ticon">${g.icon}</span><h2>${esc(g.label)}</h2><span class="sub">${g.count} ${esc(t.devices)} · ${g.models.length} ${esc(t.models)}</span></div>
        <div class="share-bar"><div style="width:${pct}%"></div></div>${rows}</div>`;
    }).join("");

    host.innerHTML = `
      <div class="reportbar">
        <div class="sub"><b>${esc(t.report_title)}</b><br>${esc(t.report_hint)}</div>
        <button id="shareReport" class="primary">${esc(t.share)}</button>
      </div>
      <div class="cards">
        <div class="card"><div class="k">${esc(t.total)}</div><div class="v">${total}</div><div class="mix">${mix}</div></div>
        <div class="card"><div class="k">${esc(t.models)}</div><div class="v">${modelCount}</div><div class="s">${esc(t.report_unique)}</div></div>
        <div class="card"><div class="k">${esc(t.types_word)}</div><div class="v">${groups.length}</div><div class="s">${esc(groups.slice(0, 3).map((g) => g.icon + " " + g.label).join(" · "))}</div></div>
      </div>
      <div class="typegrid">${blocks}</div>`;

    host.querySelectorAll(".modelrow").forEach((el) =>
      el.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
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
    host.querySelector("#shareReport").addEventListener("click", () => this._openShare());
    host.querySelectorAll("[data-protocol]").forEach((el) =>
      el.addEventListener("click", () => {
        this._setView("devices");
        this._applyFilters({ protocol: el.dataset.protocol });
      })
    );
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

  /* ---------- sharing: preview dialog, several text formats ---------- */

  _openShare() {
    const root = this.shadowRoot;
    this._buildPicker();
    this._renderShare();
    root.getElementById("share").showModal();
  }

  /** Links safe to share: only direct, public ones (no search URLs, no local device pages). */
  _shareLink(m) {
    const l = m.links.find((x) => ["z2m", "zwave_db", "manufacturer"].includes(x.kind));
    return l ? l.url : null;
  }

  _shareContent(fmt, withLinks) {
    const t = this._t;
    const groups = this._selectedGroups();
    if (!groups.length) return { text: t.nothing_selected, html: `<p>${esc(t.nothing_selected)}</p>` };
    const total = groups.reduce((n, g) => n + g.count, 0);
    const models = groups.reduce((n, g) => n + g.models.length, 0);
    const summary = `${total} ${t.devices} · ${models} ${t.models} · ${groups.length} ${t.types_word}`;
    const title = t.share_doc_title;
    const credit = `${t.share_credit} https://github.com/itgramm/ha-inventory`;
    const countOf = (m) => (m.devices.length > 1 ? ` ×${m.devices.length}` : "");

    if (fmt === "rich") {
      let html = `<h2>${esc(title)}</h2><p>${esc(summary)}</p>`;
      for (const g of groups) {
        html += `<h3>${g.icon} ${esc(g.label)} (${g.count})</h3><ul>`;
        for (const m of g.models) {
          const url = withLinks ? this._shareLink(m) : null;
          html += `<li>${esc(m.name)}${esc(countOf(m))}${url ? ` — <a href="${esc(url)}">${esc(url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</a>` : ""}</li>`;
        }
        html += "</ul>";
      }
      html += `<p><i>${esc(credit)}</i></p>`;
      return { html, text: this._shareContent("markdown", withLinks).text };
    }

    const style = {
      telegram: { b: (x) => `**${x}**`, h1: (x) => `**${x}**`, h2: (x) => `**${x}**` },
      whatsapp: { b: (x) => `*${x}*`, h1: (x) => `*${x}*`, h2: (x) => `*${x}*` },
      markdown: { b: (x) => `**${x}**`, h1: (x) => `# ${x}`, h2: (x) => `## ${x}` },
    }[fmt];
    const lines = [style.h1(title), summary, ""];
    for (const g of groups) {
      lines.push(style.h2(`${g.icon} ${g.label} (${g.count})`));
      for (const m of g.models) {
        const url = withLinks ? this._shareLink(m) : null;
        if (fmt === "markdown") {
          const label = m.links.find((l) => l.url === url);
          lines.push(`- ${m.name}${countOf(m)}${url ? ` — [${t.links[label.kind] || label.kind}](${url})` : ""}`);
        } else {
          lines.push(`• ${m.name}${countOf(m)}`);
          if (url) lines.push(`   🔗 ${url}`);
        }
      }
      lines.push("");
    }
    lines.push(credit);
    return { text: lines.join("\n") };
  }

  /** Groups restricted to the models ticked in the share dialog. */
  _selectedGroups() {
    return this._reportGroups()
      .map((g) => {
        const models = g.models.filter((m) => !this._shareExcluded.has(m.key));
        return { ...g, models, count: models.reduce((n, m) => n + m.devices.length, 0) };
      })
      .filter((g) => g.models.length);
  }

  _buildPicker() {
    const groups = this._reportGroups();
    this.shadowRoot.getElementById("pickList").innerHTML = groups
      .map((g) => `<div class="pgroup">
        <label class="phead"><input type="checkbox" data-type="${esc(g.type)}"> ${g.icon} ${esc(g.label)} <span class="sub" data-tcount="${esc(g.type)}"></span></label>
        ${g.models.map((m) => `<label class="pmodel"><input type="checkbox" data-model="${esc(m.key)}"> ${esc(m.name)} <span class="sub">×${m.devices.length}</span></label>`).join("")}
      </div>`)
      .join("");
    this._syncPicker();
  }

  /** Reflect the exclusion set in every checkbox, counter and the summary line. */
  _syncPicker() {
    const root = this.shadowRoot;
    const groups = this._reportGroups();
    let chosen = 0;
    let all = 0;
    for (const g of groups) {
      const on = g.models.filter((m) => !this._shareExcluded.has(m.key)).length;
      chosen += on;
      all += g.models.length;
      const box = root.querySelector(`#pickList input[data-type="${CSS.escape(g.type)}"]`);
      if (box) {
        box.checked = on === g.models.length;
        box.indeterminate = on > 0 && on < g.models.length;
      }
      const cnt = root.querySelector(`[data-tcount="${CSS.escape(g.type)}"]`);
      if (cnt) cnt.textContent = `${on}/${g.models.length}`;
    }
    root.querySelectorAll("#pickList input[data-model]").forEach((el) => {
      el.checked = !this._shareExcluded.has(el.dataset.model);
    });
    root.getElementById("pickSummary").textContent = `${this._t.choose_models} (${chosen}/${all})`;
  }

  _pickChanged(el) {
    if (el.dataset.model) {
      el.checked ? this._shareExcluded.delete(el.dataset.model) : this._shareExcluded.add(el.dataset.model);
    } else if (el.dataset.type) {
      const group = this._reportGroups().find((g) => g.type === el.dataset.type);
      for (const m of group ? group.models : []) {
        el.checked ? this._shareExcluded.delete(m.key) : this._shareExcluded.add(m.key);
      }
    }
    this._syncPicker();
    this._renderShare();
  }

  _pickAll(selected) {
    this._shareExcluded = selected ? new Set() : new Set(this._reportGroups().flatMap((g) => g.models.map((m) => m.key)));
    this._syncPicker();
    this._renderShare();
  }

  _renderShare() {
    const root = this.shadowRoot;
    const fmt = root.getElementById("shareFmt").value;
    const withLinks = root.getElementById("shareLinks").checked;
    const content = this._shareContent(fmt, withLinks);
    const ta = root.getElementById("shareText");
    const rich = root.getElementById("shareRich");
    ta.value = content.text;
    ta.hidden = fmt === "rich";
    rich.hidden = fmt !== "rich";
    if (fmt === "rich") rich.innerHTML = content.html;
    root.getElementById("shareHint").textContent = this._t.share_hints[fmt];
    this._shareCurrent = content;
  }

  async _shareCopy(button) {
    const root = this.shadowRoot;
    const fmt = root.getElementById("shareFmt").value;
    const { text, html } = this._shareCurrent;
    let ok = false;
    try {
      if (html && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        })]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      ok = true;
    } catch (_) {
      // Clipboard API needs https; fall back to selecting the preview and copying it.
      const target = fmt === "rich" ? root.getElementById("shareRich") : root.getElementById("shareText");
      if (fmt === "rich") {
        const range = document.createRange();
        range.selectNodeContents(target);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        target.focus();
        target.select();
      }
      try { ok = document.execCommand("copy"); } catch (_e) { ok = false; }
    }
    const old = button.textContent;
    button.textContent = ok ? this._t.copied : this._t.copy_failed;
    setTimeout(() => (button.textContent = old), 1800);
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
        <td>${esc(d.manufacturer || "–")}<div class="sub">${esc(this._modelLabel(d))}</div></td>
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

// The backend registers the panel as ha-inventory-panel-<hash> and loads this
// file as ...js?v=<version>-<hash>, so every build gets its own element name.
const BUILD_HASH = (new URL(import.meta.url).searchParams.get("v") || "").split("-").pop();
customElements.define(BUILD_HASH ? `ha-inventory-panel-${BUILD_HASH}` : "ha-inventory-panel", HaInventoryPanel);
