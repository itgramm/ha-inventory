"""Local persistence: when did we first see each device.

Home Assistant only started recording ``created_at`` for devices relatively
recently; older devices carry a placeholder date. We remember the first time
this integration saw a device and use it as a fallback.

Data lives in ``.storage/ha_inventory.first_seen`` inside the HA config
directory and never leaves the machine.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import STORAGE_KEY, STORAGE_VERSION


class FirstSeenStore:
    """Tiny wrapper around ``Store`` keeping ``device_id -> ISO timestamp``."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._first_seen: dict[str, str] = {}

    @property
    def first_seen(self) -> dict[str, str]:
        """Mapping of device id to ISO timestamp."""
        return self._first_seen

    async def async_load(self) -> None:
        """Load data from disk."""
        data = await self._store.async_load()
        self._first_seen = dict((data or {}).get("first_seen", {}))

    @callback
    def record(self, device_id: str, when: datetime) -> None:
        """Remember a device if it is not known yet."""
        if device_id not in self._first_seen:
            self._first_seen[device_id] = when.isoformat()
            self._schedule_save()

    @callback
    def forget(self, device_id: str) -> None:
        """Drop a removed device."""
        if self._first_seen.pop(device_id, None) is not None:
            self._schedule_save()

    @callback
    def _schedule_save(self) -> None:
        self._store.async_delay_save(lambda: {"first_seen": self._first_seen}, 10)
