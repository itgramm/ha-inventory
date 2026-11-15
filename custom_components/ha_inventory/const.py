"""Constants for HA Inventory."""

from __future__ import annotations

DOMAIN = "ha_inventory"

PANEL_URL_PATH = "ha-inventory"
PANEL_WEBCOMPONENT = "ha-inventory-panel"
PANEL_ICON = "mdi:clipboard-list-outline"
PANEL_TITLE = "Inventory"

STATIC_URL_BASE = "/ha_inventory_static"
PANEL_JS = "ha-inventory-panel.js"

STORAGE_KEY = "ha_inventory.first_seen"
STORAGE_VERSION = 1

CONF_SHOW_IN_SIDEBAR = "show_in_sidebar"
CONF_INCLUDE_DISABLED = "include_disabled"
CONF_LOW_BATTERY = "low_battery_threshold"

DEFAULT_SHOW_IN_SIDEBAR = True
DEFAULT_INCLUDE_DISABLED = False
DEFAULT_LOW_BATTERY = 20

WS_GET = f"{DOMAIN}/get"
