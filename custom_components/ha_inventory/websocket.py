"""WebSocket API used by the Inventory panel."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.loader import async_get_integrations
from homeassistant.util import dt as dt_util

from .const import (
    CONF_INCLUDE_DISABLED,
    CONF_INCLUDE_SERVICES,
    CONF_LOW_BATTERY,
    DEFAULT_INCLUDE_DISABLED,
    DEFAULT_INCLUDE_SERVICES,
    DEFAULT_LOW_BATTERY,
    DOMAIN,
    WS_GET,
)
from .inventory import build_inventory


def async_register_websocket(hass: HomeAssistant) -> None:
    """Register the websocket commands."""
    websocket_api.async_register_command(hass, ws_get_inventory)


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): WS_GET})
@websocket_api.async_response
async def ws_get_inventory(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Return the full inventory."""
    entries = hass.config_entries.async_entries(DOMAIN)
    if not entries or not hasattr(entries[0], "runtime_data"):
        connection.send_error(msg["id"], "not_loaded", "HA Inventory is not loaded")
        return
    entry = entries[0]

    device_registry = dr.async_get(hass)
    entity_registry = er.async_get(hass)
    area_registry = ar.async_get(hass)

    entities_by_device: dict[str, list[er.RegistryEntry]] = {}
    for entity in entity_registry.entities.values():
        if entity.device_id:
            entities_by_device.setdefault(entity.device_id, []).append(entity)

    config_entries = {e.entry_id: e for e in hass.config_entries.async_entries()}
    domains = {e.domain for e in config_entries.values()}
    integrations = await async_get_integrations(hass, domains)
    docs = {
        domain: getattr(integration, "documentation", None)
        for domain, integration in integrations.items()
        if not isinstance(integration, BaseException)
    }

    result = build_inventory(
        devices=device_registry.devices.values(),
        entities_by_device=entities_by_device,
        get_state=hass.states.get,
        areas={a.id: a.name for a in area_registry.areas.values()},
        entries=config_entries,
        docs=docs,
        first_seen=entry.runtime_data.store.first_seen,
        now=dt_util.utcnow(),
        include_disabled=entry.options.get(CONF_INCLUDE_DISABLED, DEFAULT_INCLUDE_DISABLED),
        include_services=entry.options.get(CONF_INCLUDE_SERVICES, DEFAULT_INCLUDE_SERVICES),
        low_battery=entry.options.get(CONF_LOW_BATTERY, DEFAULT_LOW_BATTERY),
    )
    connection.send_result(msg["id"], result)
