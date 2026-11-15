"""Build helpful links for a device.

Links are only *generated strings*. Nothing is fetched: a URL is opened by the
user's own browser when (and only when) they click it.
"""

from __future__ import annotations

from urllib.parse import quote, quote_plus

from .classify import (
    PROTOCOL_ZIGBEE,
    PROTOCOL_ZWAVE,
    ZigbeeInfo,
    ZWaveInfo,
    parse_z2m_model,
)

Z2M_DEVICES_URL = "https://www.zigbee2mqtt.io/devices/{slug}.html"
ZWAVE_DB_URL = "https://devices.zwave-js.io/?jumpTo={mfr}:{ptype}:{pid}:{fw}"
SEARCH_URL = "https://duckduckgo.com/?q={query}"

# Lower-cased manufacturer name (as reported by integrations) -> official site.
MANUFACTURER_SITES: dict[str, str] = {
    "ikea of sweden": "https://www.ikea.com/",
    "ikea": "https://www.ikea.com/",
    "signify netherlands b.v.": "https://www.philips-hue.com/",
    "signify": "https://www.philips-hue.com/",
    "philips": "https://www.philips-hue.com/",
    "lumi": "https://www.aqara.com/",
    "aqara": "https://www.aqara.com/",
    "xiaomi": "https://www.mi.com/",
    "sonoff": "https://sonoff.tech/",
    "itead": "https://sonoff.tech/",
    "tuya": "https://www.tuya.com/",
    "shelly": "https://www.shelly.com/",
    "allterco robotics": "https://www.shelly.com/",
    "tp-link": "https://www.tp-link.com/",
    "ubiquiti inc.": "https://ui.com/",
    "ubiquiti": "https://ui.com/",
    "sonos": "https://www.sonos.com/",
    "google": "https://store.google.com/",
    "google inc.": "https://store.google.com/",
    "apple": "https://www.apple.com/",
    "apple inc.": "https://www.apple.com/",
    "samsung": "https://www.samsung.com/",
    "lg": "https://www.lg.com/",
    "bosch": "https://www.bosch-smarthome.com/",
    "tado": "https://www.tado.com/",
    "netatmo": "https://www.netatmo.com/",
    "ecobee": "https://www.ecobee.com/",
    "eve systems": "https://www.evehome.com/",
    "aeotec": "https://aeotec.com/",
    "fibaro": "https://www.fibaro.com/",
    "zooz": "https://www.getzooz.com/",
    "ring": "https://ring.com/",
    "yeelight": "https://www.yeelight.com/",
    "espressif": "https://www.espressif.com/",
    "nanoleaf": "https://nanoleaf.me/",
    "lifx": "https://www.lifx.com/",
    "wiz": "https://www.wizconnected.com/",
    "innr": "https://www.innr.com/",
    "ledvance": "https://www.ledvance.com/",
    "osram": "https://www.ledvance.com/",
    "legrand": "https://www.legrand.com/",
    "schneider electric": "https://www.se.com/",
    "danfoss": "https://www.danfoss.com/",
    "centralite": "https://centralite.com/",
    "sengled": "https://www.sengled.com/",
    "thirdreality": "https://3reality.com/",
    "third reality, inc": "https://3reality.com/",
    "moes": "https://www.moeshouse.com/",
    "frient": "https://frient.com/",
    "develco products a/s": "https://frient.com/",
    "namron": "https://namron.com/",
    "gledopto": "https://www.gledopto.com/",
    "hive": "https://www.hivehome.com/",
    "roborock": "https://global.roborock.com/",
    "dyson": "https://www.dyson.com/",
    "eufy": "https://www.eufy.com/",
    "reolink": "https://reolink.com/",
    "ecowitt": "https://www.ecowitt.com/",
}


def _search_link(query: str) -> str:
    return SEARCH_URL.format(query=quote_plus(query))


def _http_url(url: str | None) -> str | None:
    if url and url.lower().startswith(("http://", "https://")):
        return url
    return None


def manufacturer_site(manufacturer: str | None) -> str | None:
    """Return the official site for a known manufacturer."""
    if not manufacturer:
        return None
    return MANUFACTURER_SITES.get(manufacturer.strip().lower())


def build_links(
    *,
    device_id: str,
    manufacturer: str | None,
    model: str | None,
    protocol: str,
    model_id: str | None = None,
    zigbee: ZigbeeInfo | None = None,
    zwave: ZWaveInfo | None = None,
    firmware: str | None = None,
    doc_urls: list[str] | None = None,
    configuration_url: str | None = None,
) -> list[dict[str, str]]:
    """Return an ordered list of ``{"kind": ..., "url": ...}`` links."""
    links: list[dict[str, str]] = [
        {"kind": "ha_device", "url": f"/config/devices/device/{device_id}"}
    ]
    has_direct_db_link = False

    if protocol == PROTOCOL_ZIGBEE and zigbee is not None:
        exact = False  # True when the model came from the "Description (MODEL)" form
        if zigbee.source == "z2m":
            if zigbee.is_bridge:
                links.append({"kind": "z2m", "url": "https://www.zigbee2mqtt.io/"})
                has_direct_db_link = exact = True
            else:
                z2m_model = parse_z2m_model(model)
                exact = z2m_model is not None
                # Newer Zigbee2MQTT publishes the description as `model` and the
                # model code as `model_id`; the code is usually the docs page name.
                if not z2m_model and model_id and model_id.strip():
                    z2m_model = model_id.strip()
                if z2m_model:
                    slug = quote(z2m_model.replace("/", "_"), safe="")
                    links.append({"kind": "z2m", "url": Z2M_DEVICES_URL.format(slug=slug)})
                    has_direct_db_link = True
        # A guessed page may not exist, so keep a search as a safety net.
        if not exact and (manufacturer or model or model_id):
            query = f"site:zigbee2mqtt.io {manufacturer or ''} {model_id or model or ''}".strip()
            links.append({"kind": "z2m_search", "url": _search_link(query)})

    if protocol == PROTOCOL_ZWAVE and zwave is not None:
        fw = quote(firmware or "0.0", safe=".")
        links.append(
            {
                "kind": "zwave_db",
                "url": ZWAVE_DB_URL.format(
                    mfr=f"0x{zwave.manufacturer_id:04x}",
                    ptype=f"0x{zwave.product_type:04x}",
                    pid=f"0x{zwave.product_id:04x}",
                    fw=fw,
                ),
            }
        )
        has_direct_db_link = True

    site = manufacturer_site(manufacturer)
    if site:
        links.append({"kind": "manufacturer", "url": site})

    for doc in doc_urls or []:
        if url := _http_url(doc):
            links.append({"kind": "docs", "url": url})

    if url := _http_url(configuration_url):
        links.append({"kind": "device_ui", "url": url})

    if not site and not has_direct_db_link and (manufacturer or model):
        links.append(
            {
                "kind": "search",
                "url": _search_link(f"{manufacturer or ''} {model or ''}".strip()),
            }
        )

    # Drop exact duplicates while keeping order.
    seen: set[tuple[str, str]] = set()
    unique: list[dict[str, str]] = []
    for link in links:
        key = (link["kind"], link["url"])
        if key not in seen:
            seen.add(key)
            unique.append(link)
    return unique
