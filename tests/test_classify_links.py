from custom_components.ha_inventory.classify import (
    detect_protocol,
    parse_z2m_model,
    zigbee_info,
    zwave_info,
)
from custom_components.ha_inventory.links import build_links


def kinds(links):
    return [link["kind"] for link in links]


def test_parse_z2m_model():
    assert parse_z2m_model("TRADFRI bulb E27 (LED1545G12)") == "LED1545G12"
    assert parse_z2m_model("Remote control (E1524/E1810)") == "E1524/E1810"
    assert parse_z2m_model("TS0601") is None
    assert parse_z2m_model(None) is None


def test_zigbee_detection():
    z2m = zigbee_info({("mqtt", "zigbee2mqtt_0x00158d0001")}, set())
    assert z2m.source == "z2m" and z2m.ieee == "0x00158d0001" and not z2m.is_bridge
    bridge = zigbee_info({("mqtt", "zigbee2mqtt_bridge_0xabc")}, set())
    assert bridge.is_bridge
    zha = zigbee_info({("zha", "00:15:8d:00:01")}, {("zigbee", "00:15:8d:00:01")})
    assert zha.source == "zha"
    assert zigbee_info({("hue", "abc")}, set()) is None


def test_zwave_info():
    info = zwave_info({("zwave_js", "3245146787-12:134:3:98")})
    assert (info.manufacturer_id, info.product_type, info.product_id) == (134, 3, 98)
    assert zwave_info({("zwave_js", "3245146787-12")}) is None


def test_protocols():
    def proto(domains, ident=(), conn=(), service=False):
        return detect_protocol(
            domains=domains, identifiers=ident, connections=conn, is_service=service
        )

    assert proto(["mqtt"], [("mqtt", "zigbee2mqtt_0x1")]) == "zigbee"
    assert proto(["mqtt"], [("mqtt", "tasmota_ABC")]) == "network"
    assert proto(["zha"]) == "zigbee"
    assert proto(["zwave_js"]) == "zwave"
    assert proto(["matter"]) == "matter"
    assert proto(["xiaomi_ble"]) == "bluetooth"
    assert proto(["sun"], service=True) == "service"
    assert proto([]) == "other"


def test_z2m_links():
    zigbee = zigbee_info({("mqtt", "zigbee2mqtt_0x1")}, set())
    links = build_links(
        device_id="dev1",
        manufacturer="IKEA",
        model="Remote control (E1524/E1810)",
        protocol="zigbee",
        zigbee=zigbee,
        doc_urls=["https://www.home-assistant.io/integrations/mqtt"],
    )
    by_kind = {link["kind"]: link["url"] for link in links}
    assert by_kind["z2m"] == "https://www.zigbee2mqtt.io/devices/E1524_E1810.html"
    assert by_kind["ha_device"] == "/config/devices/device/dev1"
    assert by_kind["manufacturer"] == "https://www.ikea.com/"
    assert "search" not in by_kind


def test_zha_gets_search_link_not_fake_z2m_page():
    zigbee = zigbee_info({("zha", "00:15")}, set())
    links = build_links(
        device_id="d", manufacturer="_TZ3000_x", model="TS0601",
        protocol="zigbee", zigbee=zigbee,
    )
    assert "z2m" not in kinds(links)
    assert "z2m_search" in kinds(links)


def test_zwave_link_and_unknown_manufacturer_search():
    zwave = zwave_info({("zwave_js", "1-2:134:3:98")})
    links = build_links(
        device_id="d", manufacturer="Aeotec", model="ZW100",
        protocol="zwave", zwave=zwave, firmware="1.7",
    )
    url = next(link["url"] for link in links if link["kind"] == "zwave_db")
    assert url == "https://devices.zwave-js.io/?jumpTo=0x0086:0x0003:0x0062:1.7"

    unknown = build_links(
        device_id="d", manufacturer="Acme Corp", model="X 1",
        protocol="network", configuration_url="homeassistant://x",
    )
    assert "search" in kinds(unknown)
    assert "device_ui" not in kinds(unknown)  # non-http URL dropped


def test_z2m_new_style_uses_model_id_with_search_backup():
    zigbee = zigbee_info({("mqtt", "zigbee2mqtt_0xa4c1")}, set())
    links = build_links(
        device_id="d", manufacturer="SONOFF", model="Temperature and humidity sensor",
        model_id="SNZB-02B", protocol="zigbee", zigbee=zigbee,
    )
    by_kind = {link["kind"]: link["url"] for link in links}
    assert by_kind["z2m"] == "https://www.zigbee2mqtt.io/devices/SNZB-02B.html"
    assert "z2m_search" in by_kind  # guessed page, keep a fallback
