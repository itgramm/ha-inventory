"""Work out how a device is connected and extract protocol specific ids.

Pure functions: nothing here imports Home Assistant, so they are trivial to test.
"""

from __future__ import annotations

import re
from collections.abc import Iterable
from dataclasses import dataclass

PROTOCOL_ZIGBEE = "zigbee"
PROTOCOL_ZWAVE = "zwave"
PROTOCOL_MATTER = "matter"
PROTOCOL_BLUETOOTH = "bluetooth"
PROTOCOL_NETWORK = "network"
PROTOCOL_SERVICE = "service"
PROTOCOL_OTHER = "other"

ZIGBEE_DOMAINS = frozenset({"zha", "deconz"})
ZWAVE_DOMAINS = frozenset({"zwave_js", "zwave_me", "ozw", "zwave"})
MATTER_DOMAINS = frozenset({"matter"})
BLUETOOTH_DOMAINS = frozenset(
    {
        "bluetooth",
        "ble_monitor",
        "xiaomi_ble",
        "govee_ble",
        "switchbot",
        "inkbird",
        "ruuvitag_ble",
        "oralb",
        "sensorpush",
        "qingping",
        "bthome",
        "airthings_ble",
        "moat",
        "led_ble",
        "yalexs_ble",
        "thermobeacon",
        "thermopro",
        "bluemaestro",
        "mopeka",
        "sensirion_ble",
        "snooz",
        "leaone",
        "private_ble_device",
        "ibeacon",
    }
)

Z2M_PREFIX = "zigbee2mqtt_"
_Z2M_MODEL_RE = re.compile(r"\(([^()]+)\)\s*$")
_ZWAVE_EXT_ID_RE = re.compile(r"^\d+-\d+:(\d+):(\d+):(\d+)$")


@dataclass(frozen=True, slots=True)
class ZigbeeInfo:
    """Zigbee specific facts about a device."""

    source: str  # "zha" | "z2m" | "deconz"
    ieee: str | None
    is_bridge: bool = False


@dataclass(frozen=True, slots=True)
class ZWaveInfo:
    """Z-Wave JS identifiers (as ints)."""

    manufacturer_id: int
    product_type: int
    product_id: int


def zigbee_info(
    identifiers: Iterable[tuple[str, str]],
    connections: Iterable[tuple[str, str]],
) -> ZigbeeInfo | None:
    """Return Zigbee info if the device looks like a Zigbee device."""
    for domain, value in identifiers:
        if domain == "zha":
            return ZigbeeInfo("zha", value)
        if domain == "mqtt" and value.startswith(Z2M_PREFIX):
            rest = value[len(Z2M_PREFIX) :]
            if rest.startswith("bridge"):
                return ZigbeeInfo("z2m", rest.rsplit("_", 1)[-1] or None, True)
            return ZigbeeInfo("z2m", rest)
        if domain == "deconz":
            return ZigbeeInfo("deconz", value)
    for conn_type, value in connections:
        if conn_type == "zigbee":
            return ZigbeeInfo("zha", value)
    return None


def zwave_info(identifiers: Iterable[tuple[str, str]]) -> ZWaveInfo | None:
    """Extract manufacturer/product ids from a Z-Wave JS identifier."""
    for domain, value in identifiers:
        if domain != "zwave_js":
            continue
        match = _ZWAVE_EXT_ID_RE.match(value)
        if match:
            return ZWaveInfo(*(int(g) for g in match.groups()))
    return None


def parse_z2m_model(model: str | None) -> str | None:
    """Zigbee2MQTT publishes the model as 'Description (MODEL)'; return MODEL."""
    if not model:
        return None
    match = _Z2M_MODEL_RE.search(model.strip())
    return match.group(1).strip() if match else None


def detect_protocol(
    *,
    domains: Iterable[str],
    identifiers: Iterable[tuple[str, str]],
    connections: Iterable[tuple[str, str]],
    is_service: bool = False,
) -> str:
    """Best-effort guess of the radio / transport a device uses."""
    domain_set = set(domains)
    identifiers = list(identifiers)
    connections = list(connections)

    if zigbee_info(identifiers, connections) is not None or domain_set & ZIGBEE_DOMAINS:
        return PROTOCOL_ZIGBEE
    if domain_set & ZWAVE_DOMAINS:
        return PROTOCOL_ZWAVE
    if domain_set & MATTER_DOMAINS:
        return PROTOCOL_MATTER
    if domain_set & BLUETOOTH_DOMAINS or any(c[0] == "bluetooth" for c in connections):
        return PROTOCOL_BLUETOOTH
    if is_service:
        return PROTOCOL_SERVICE
    if any(c[0] in ("mac", "upnp", "ip") for c in connections):
        return PROTOCOL_NETWORK
    # Most remaining integrations (cloud APIs, LAN devices, ESPHome, ...) are network based.
    return PROTOCOL_NETWORK if domain_set else PROTOCOL_OTHER
