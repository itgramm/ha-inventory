"""Config flow for HA Inventory."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback

from .const import (
    CONF_INCLUDE_DISABLED,
    CONF_LOW_BATTERY,
    CONF_SHOW_IN_SIDEBAR,
    DEFAULT_INCLUDE_DISABLED,
    DEFAULT_LOW_BATTERY,
    DEFAULT_SHOW_IN_SIDEBAR,
    DOMAIN,
)


class HAInventoryConfigFlow(ConfigFlow, domain=DOMAIN):
    """Single-step flow: confirm and create."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Ask the user to confirm."""
        if user_input is not None:
            return self.async_create_entry(title="HA Inventory", data={})
        return self.async_show_form(step_id="user")

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        """Return the options flow."""
        return HAInventoryOptionsFlow()


class HAInventoryOptionsFlow(OptionsFlow):
    """Options: sidebar, disabled devices, low battery threshold."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(data=user_input)

        options = self.config_entry.options
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_SHOW_IN_SIDEBAR,
                    default=options.get(CONF_SHOW_IN_SIDEBAR, DEFAULT_SHOW_IN_SIDEBAR),
                ): bool,
                vol.Required(
                    CONF_INCLUDE_DISABLED,
                    default=options.get(CONF_INCLUDE_DISABLED, DEFAULT_INCLUDE_DISABLED),
                ): bool,
                vol.Required(
                    CONF_LOW_BATTERY,
                    default=options.get(CONF_LOW_BATTERY, DEFAULT_LOW_BATTERY),
                ): vol.All(vol.Coerce(int), vol.Range(min=1, max=90)),
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
