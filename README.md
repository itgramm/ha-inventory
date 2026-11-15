# HA Inventory

A **local-only** inventory of every device in your Home Assistant. The more devices you add, the harder it is to remember what you have, where it came from and how old it is. HA Inventory adds an **Inventory** panel to the sidebar that answers those questions.

## Privacy

- No network calls, no telemetry, no cloud, no external fonts or scripts.
- The only thing stored is `.storage/ha_inventory.first_seen` in your HA config folder (device id → date first seen).
- Links in the table are plain URLs. Your browser opens them only when you click.
- Exports (CSV/JSON) are generated in your browser.

## Features

- Every device: name, area, manufacturer, model, model ID, firmware, hardware version, serial number, integration, protocol (Zigbee / Z-Wave / Matter / Bluetooth / network / service).
- **Date added and age** with fun tiers (🍼 Newborn → 🦖 Ancient), oldest / newest / average age.
  HA older than the device-registry `created_at` field has no exact date; for those devices the date HA Inventory first saw them is used and marked with `≈`.
- **Useful links per device**
  - Zigbee2MQTT devices: direct page in the Zigbee2MQTT device database.
  - ZHA and other Zigbee devices: a search in the Zigbee2MQTT database.
  - Z-Wave JS devices: the Z-Wave JS device database entry.
  - Manufacturer website (built-in list of common brands, otherwise a web search link).
  - Home Assistant integration docs, device web UI, and a shortcut to the HA device page.
- **Health at a glance:** offline devices, low battery, pending firmware updates.
- Search, filters (protocol, integration, manufacturer, area, status), sorting, expandable details.
- CSV / JSON export of the current view.

## Installation (HACS)

1. HACS → Integrations → ⋮ → **Custom repositories** → add this repository, category **Integration** (or find it in the HACS store once listed).
2. Download **HA Inventory**, restart Home Assistant.
3. Settings → Devices & services → **Add integration** → *HA Inventory*.
4. Open **Inventory** in the sidebar (admins only).

Options (gear icon on the integration): show in sidebar, include disabled devices, include services, low battery threshold.

## Development

```bash
pip install pytest
pytest
```

The data logic (`classify.py`, `links.py`, `inventory.py`) has no Home Assistant imports and is covered by plain unit tests.

## License

MIT
