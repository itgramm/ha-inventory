"""Build the device inventory from registry data.

The builder is deliberately decoupled from Home Assistant: it works on any
objects exposing the same attributes as the registry entries, which keeps it
unit-testable without a running instance.
"""

from __future__ import annotations

from collections import Counter
from collections.abc import Callable, Iterable, Mapping
from datetime import UTC, datetime
from typing import Any

from .classify import detect_protocol, zigbee_info, zwave_info
from .links import build_links

# Home Assistant did not exist before this; registry migrations use 1970 placeholders.
MIN_VALID_DATE = datetime(2013, 1, 1, tzinfo=UTC)


def _aware(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value if value.tzinfo else value.replace(tzinfo=UTC)


def resolve_added(
    created_at: datetime | None, first_seen_iso: str | None
) -> tuple[datetime | None, str | None]:
    """Pick the best "date added" and say where it came from."""
    created = _aware(created_at)
    if created is not None and created >= MIN_VALID_DATE:
        return created, "registry"
    if first_seen_iso:
        try:
            seen = _aware(datetime.fromisoformat(first_seen_iso))
        except ValueError:
            seen = None
        if seen is not None and seen >= MIN_VALID_DATE:
            return seen, "first_seen"
    return None, None


def _numeric(state: str) -> float | None:
    try:
        return float(state)
    except (TypeError, ValueError):
        return None


def _device_status(
    entities: Iterable[Any], get_state: Callable[[str], Any]
) -> dict[str, Any]:
    battery: float | None = None
    live_states = 0
    unavailable = 0
    update: dict[str, str | None] | None = None
    entity_count = 0

    for entity in entities:
        entity_count += 1
        if entity.disabled_by is not None:
            continue
        state = get_state(entity.entity_id)
        if state is None:
            continue
        live_states += 1
        if state.state in ("unavailable",):
            unavailable += 1
        domain = entity.entity_id.split(".", 1)[0]
        device_class = entity.device_class or entity.original_device_class
        if domain == "sensor" and device_class == "battery":
            value = _numeric(state.state)
            if value is not None and (battery is None or value < battery):
                battery = value
        elif domain == "update" and state.state == "on":
            attrs = state.attributes
            update = {
                "installed": attrs.get("installed_version"),
                "latest": attrs.get("latest_version"),
            }

    return {
        "entities": entity_count,
        "battery": None if battery is None else round(battery),
        "offline": live_states > 0 and unavailable == live_states,
        "update": update,
    }


def build_inventory(
    *,
    devices: Iterable[Any],
    entities_by_device: Mapping[str, list[Any]],
    get_state: Callable[[str], Any],
    areas: Mapping[str, str],
    entries: Mapping[str, Any],
    docs: Mapping[str, str | None],
    first_seen: Mapping[str, str],
    now: datetime,
    include_disabled: bool = False,
    low_battery: int = 20,
) -> dict[str, Any]:
    """Return ``{"devices": [...], "summary": {...}}`` ready for JSON."""
    devices = list(devices)
    names = {d.id: (d.name_by_user or d.name or d.id) for d in devices}
    rows: list[dict[str, Any]] = []

    for device in devices:
        disabled = device.disabled_by is not None
        if disabled and not include_disabled:
            continue

        device_entries = [
            entries[eid] for eid in device.config_entries if eid in entries
        ]
        domains = sorted({e.domain for e in device_entries})
        identifiers = [tuple(i) for i in device.identifiers]
        connections = [tuple(c) for c in device.connections]
        is_service = getattr(device.entry_type, "value", device.entry_type) == "service"

        protocol = detect_protocol(
            domains=domains,
            identifiers=identifiers,
            connections=connections,
            is_service=is_service,
        )
        zigbee = zigbee_info(identifiers, connections)
        zwave = zwave_info(identifiers)
        added, added_source = resolve_added(
            device.created_at, first_seen.get(device.id)
        )
        age_days = max(0, (now - added).days) if added else None
        status = _device_status(entities_by_device.get(device.id, []), get_state)

        doc_urls = [docs[d] for d in domains if docs.get(d)]
        rows.append(
            {
                "id": device.id,
                "name": names[device.id],
                "manufacturer": device.manufacturer,
                "model": device.model,
                "model_id": getattr(device, "model_id", None),
                "hw_version": device.hw_version,
                "sw_version": device.sw_version,
                "serial_number": getattr(device, "serial_number", None),
                "area": areas.get(device.area_id) if device.area_id else None,
                "via": names.get(device.via_device_id) if device.via_device_id else None,
                "integrations": domains,
                "protocol": protocol,
                "ieee": zigbee.ieee if zigbee else None,
                "added": added.isoformat() if added else None,
                "added_source": added_source,
                "age_days": age_days,
                "disabled": disabled,
                **status,
                "links": build_links(
                    device_id=device.id,
                    manufacturer=device.manufacturer,
                    model=device.model,
                    protocol=protocol,
                    zigbee=zigbee,
                    zwave=zwave,
                    firmware=device.sw_version,
                    doc_urls=doc_urls,
                    configuration_url=device.configuration_url,
                ),
            }
        )

    rows.sort(key=lambda r: (r["name"] or "").lower())
    return {
        "generated": now.isoformat(),
        "devices": rows,
        "summary": build_summary(rows, low_battery),
    }


def _top(counter: Counter[str], limit: int | None = None) -> list[dict[str, Any]]:
    return [{"key": k, "count": c} for k, c in counter.most_common(limit)]


def build_summary(rows: list[dict[str, Any]], low_battery: int) -> dict[str, Any]:
    """Aggregate statistics shown at the top of the panel."""
    dated = [r for r in rows if r["age_days"] is not None]
    oldest = max(dated, key=lambda r: r["age_days"], default=None)
    newest = min(dated, key=lambda r: r["age_days"], default=None)

    def brief(row: dict[str, Any] | None) -> dict[str, Any] | None:
        if row is None:
            return None
        return {
            "id": row["id"],
            "name": row["name"],
            "age_days": row["age_days"],
            "added": row["added"],
        }

    return {
        "total": len(rows),
        "dated": len(dated),
        "total_age_days": sum(r["age_days"] for r in dated),
        "average_age_days": round(sum(r["age_days"] for r in dated) / len(dated))
        if dated
        else None,
        "oldest": brief(oldest),
        "newest": brief(newest),
        "offline": sum(1 for r in rows if r["offline"]),
        "updates": sum(1 for r in rows if r["update"]),
        "low_battery": sum(
            1 for r in rows if r["battery"] is not None and r["battery"] <= low_battery
        ),
        "no_area": sum(1 for r in rows if not r["area"]),
        "disabled": sum(1 for r in rows if r["disabled"]),
        "low_battery_threshold": low_battery,
        "by_protocol": _top(Counter(r["protocol"] for r in rows)),
        "by_manufacturer": _top(
            Counter(r["manufacturer"] or "?" for r in rows), 15
        ),
        "by_integration": _top(
            Counter(d for r in rows for d in r["integrations"]), 15
        ),
        "by_area": _top(Counter(r["area"] or "" for r in rows)),
    }
