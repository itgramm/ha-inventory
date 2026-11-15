"""HA Inventory: a local-only inventory of every device in Home Assistant."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path

from homeassistant.components import panel_custom
from homeassistant.components.frontend import async_remove_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration
from homeassistant.util import dt as dt_util

from .const import (
    CONF_SHOW_IN_SIDEBAR,
    DEFAULT_SHOW_IN_SIDEBAR,
    DOMAIN,
    PANEL_ICON,
    PANEL_JS,
    PANEL_TITLE,
    PANEL_URL_PATH,
    PANEL_WEBCOMPONENT,
    STATIC_URL_BASE,
)
from .storage import FirstSeenStore
from .websocket import async_register_websocket

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

FRONTEND_DIR = Path(__file__).parent / "frontend"


def _frontend_digest() -> str:
    """Short content hash of the panel JS, used to bust browser caches."""
    return hashlib.sha256((FRONTEND_DIR / PANEL_JS).read_bytes()).hexdigest()[:10]


type InventoryConfigEntry = ConfigEntry[InventoryRuntime]


@dataclass
class InventoryRuntime:
    """Per config entry runtime state."""

    store: FirstSeenStore


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register things that must only be registered once per HA run."""
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                STATIC_URL_BASE,
                str(FRONTEND_DIR),
                cache_headers=False,
            )
        ]
    )
    async_register_websocket(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: InventoryConfigEntry) -> bool:
    """Set up HA Inventory from a config entry."""
    store = FirstSeenStore(hass)
    await store.async_load()

    registry = dr.async_get(hass)
    now = dt_util.utcnow()
    for device in registry.devices.values():
        store.record(device.id, now)

    @callback
    def _device_registry_updated(event: Event[dr.EventDeviceRegistryUpdatedData]) -> None:
        action = event.data["action"]
        device_id = event.data["device_id"]
        if action == "create":
            store.record(device_id, dt_util.utcnow())
        elif action == "remove":
            store.forget(device_id)

    entry.async_on_unload(
        hass.bus.async_listen(dr.EVENT_DEVICE_REGISTRY_UPDATED, _device_registry_updated)
    )
    entry.runtime_data = InventoryRuntime(store=store)

    if entry.options.get(CONF_SHOW_IN_SIDEBAR, DEFAULT_SHOW_IN_SIDEBAR):
        integration = await async_get_integration(hass, DOMAIN)
        digest = await hass.async_add_executor_job(_frontend_digest)
        await panel_custom.async_register_panel(
            hass,
            webcomponent_name=PANEL_WEBCOMPONENT,
            frontend_url_path=PANEL_URL_PATH,
            module_url=f"{STATIC_URL_BASE}/{PANEL_JS}?v={integration.version}-{digest}",
            sidebar_title=PANEL_TITLE,
            sidebar_icon=PANEL_ICON,
            require_admin=True,
            embed_iframe=False,
        )
        entry.async_on_unload(lambda: async_remove_panel(hass, PANEL_URL_PATH))

    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def _async_options_updated(hass: HomeAssistant, entry: InventoryConfigEntry) -> None:
    """Reload so sidebar visibility and other options take effect."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: InventoryConfigEntry) -> bool:
    """Unload a config entry (listeners and panel are removed via async_on_unload)."""
    return True
