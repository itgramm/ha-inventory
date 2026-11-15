from datetime import UTC, datetime, timedelta
from types import SimpleNamespace as NS

from custom_components.ha_inventory.inventory import build_inventory, resolve_added

NOW = datetime(2026, 11, 15, tzinfo=UTC)


def device(id, name, created, **kw):
    base = dict(
        id=id, name=name, name_by_user=None, manufacturer="IKEA", model="x",
        model_id=None, hw_version=None, sw_version="1.0", serial_number=None,
        area_id=None, via_device_id=None, config_entries={"e1"},
        identifiers=set(), connections=set(), created_at=created,
        disabled_by=None, entry_type=None, configuration_url=None,
    )
    base.update(kw)
    return NS(**base)


def entity(eid, device_id, **kw):
    base = dict(entity_id=eid, device_id=device_id, disabled_by=None,
                device_class=None, original_device_class=None)
    base.update(kw)
    return NS(**base)


def run(devices, entities=None, states=None, first_seen=None, **kw):
    states = states or {}
    by_dev = {}
    for e in entities or []:
        by_dev.setdefault(e.device_id, []).append(e)
    return build_inventory(
        devices=devices,
        entities_by_device=by_dev,
        get_state=states.get,
        areas={"a1": "Kitchen"},
        entries={"e1": NS(domain="zha", title="ZHA")},
        docs={"zha": "https://www.home-assistant.io/integrations/zha"},
        first_seen=first_seen or {},
        now=NOW,
        **kw,
    )


def test_resolve_added_prefers_registry_then_first_seen():
    created = NOW - timedelta(days=100)
    assert resolve_added(created, "2020-01-01T00:00:00+00:00") == (created, "registry")
    epoch = datetime(1970, 1, 1, tzinfo=UTC)
    dt, src = resolve_added(epoch, "2025-05-01T00:00:00+00:00")
    assert src == "first_seen" and dt.year == 2025
    assert resolve_added(epoch, None) == (None, None)
    assert resolve_added(None, "garbage") == (None, None)


def test_inventory_rows_and_summary():
    old = device("d1", "Old lamp", NOW - timedelta(days=1000), area_id="a1",
                 identifiers={("zha", "00:15")})
    new = device("d2", "New sensor", NOW - timedelta(days=10))
    legacy = device("d3", "Legacy", datetime(1970, 1, 1, tzinfo=UTC))
    off = device("d4", "Dead", NOW - timedelta(days=5), disabled_by="user")

    entities = [
        entity("sensor.new_battery", "d2", original_device_class="battery"),
        entity("sensor.new_temp", "d2"),
        entity("update.old_fw", "d1"),
        entity("light.old", "d1"),
    ]
    states = {
        "sensor.new_battery": NS(state="12", attributes={}),
        "sensor.new_temp": NS(state="20", attributes={}),
        "update.old_fw": NS(state="on", attributes={"installed_version": "1", "latest_version": "2"}),
        "light.old": NS(state="unavailable", attributes={}),
    }
    result = run([old, new, legacy, off], entities, states,
                 first_seen={"d3": "2026-01-01T00:00:00+00:00"})
    rows = {r["id"]: r for r in result["devices"]}

    assert "d4" not in rows  # disabled hidden by default
    assert rows["d1"]["age_days"] == 1000 and rows["d1"]["area"] == "Kitchen"
    assert rows["d1"]["protocol"] == "zigbee"
    assert rows["d1"]["update"] == {"installed": "1", "latest": "2"}
    assert rows["d1"]["offline"] is False  # update entity is on, light unavailable
    assert rows["d2"]["battery"] == 12
    assert rows["d3"]["added_source"] == "first_seen"

    s = result["summary"]
    assert s["total"] == 3
    assert s["oldest"]["id"] == "d1" and s["newest"]["id"] == "d2"
    assert s["low_battery"] == 1 and s["updates"] == 1
    assert s["no_area"] == 2


def test_device_types():
    hub = device("h", "Bridge", NOW)
    child = device("c", "Bulb", NOW, via_device_id="h")
    sensor = device("s", "Temp", NOW)
    plug = device("p", "Plug", NOW)
    entities = [
        entity("light.bulb", "c"),
        entity("sensor.temp", "s"),
        entity("sensor.temp_battery", "s", entity_category="diagnostic"),
        entity("switch.plug", "p"),
        entity("sensor.plug_power", "p"),
        entity("update.plug_fw", "p", entity_category="config"),
    ]
    rows = {r["id"]: r for r in run([hub, child, sensor, plug], entities)["devices"]}
    assert rows["h"]["type"] == "hub"
    assert rows["c"]["type"] == "light"
    assert rows["s"]["type"] == "sensor"
    assert rows["p"]["type"] == "switch"


def test_include_disabled_and_offline():
    dead = device("d4", "Dead", NOW - timedelta(days=5), disabled_by="user")
    sleeper = device("d5", "Sleeper", NOW - timedelta(days=5))
    entities = [entity("light.s", "d5")]
    states = {"light.s": NS(state="unavailable", attributes={})}
    result = run([dead, sleeper], entities, states, include_disabled=True)
    rows = {r["id"]: r for r in result["devices"]}
    assert rows["d4"]["disabled"] is True
    assert rows["d5"]["offline"] is True
    assert result["summary"]["offline"] == 1
