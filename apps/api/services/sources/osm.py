"""OpenStreetMap Overpass API ソース。

パブリック Overpass は 2 並列を超えると 429 で拒否されるため、
バッチ実行側（sync_runner）が並列度を制御する前提。
このモジュール自身は単一リクエスト単位の fetch に専念する。
"""
from __future__ import annotations

import json
from typing import Any, Iterator

import httpx

from .base import ShrineSource, SourceRecord, registry


OVERPASS_ENDPOINTS: list[str] = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.osm.jp/api/interpreter",
]

QUERY_TEMPLATE = """
[out:json][timeout:90];
(
  node["amenity"="place_of_worship"]["religion"="shinto"]({bbox});
  way["amenity"="place_of_worship"]["religion"="shinto"]({bbox});
  relation["amenity"="place_of_worship"]["religion"="shinto"]({bbox});
);
out center tags;
"""


class OsmSource(ShrineSource):
    source_type = "osm"
    display_name = "OpenStreetMap"
    default_confidence = 40
    allow_persist = True

    def _query_bbox(self, south: float, west: float, north: float, east: float,
                    endpoint_index: int = 0) -> dict[str, Any]:
        endpoint = OVERPASS_ENDPOINTS[endpoint_index % len(OVERPASS_ENDPOINTS)]
        q = QUERY_TEMPLATE.format(bbox=f"{south},{west},{north},{east}")
        with httpx.Client(timeout=120.0) as client:
            res = client.post(endpoint, data={"data": q})
            res.raise_for_status()
            return res.json()

    def fetch(self, *, bbox: tuple[float, float, float, float],
              endpoint_index: int = 0, **_: Any) -> Iterator[SourceRecord]:
        south, west, north, east = bbox
        data = self._query_bbox(south, west, north, east, endpoint_index=endpoint_index)
        for el in data.get("elements", []):
            lat = el.get("lat") or (el.get("center") or {}).get("lat")
            lng = el.get("lon") or (el.get("center") or {}).get("lon")
            if lat is None or lng is None:
                continue
            tags = el.get("tags", {}) or {}
            name = tags.get("name") or tags.get("name:ja") or tags.get("name:en")
            if not name:
                continue
            osm_id = f"osm:{el['type']}/{el['id']}"
            yield SourceRecord(
                source_type="osm",
                source_object_id=osm_id,
                name=name,
                lat=float(lat),
                lng=float(lng),
                address=tags.get("addr:full") or tags.get("addr:housenumber"),
                url=tags.get("website") or tags.get("contact:website"),
                shrine_type=tags.get("shrine:type"),
                raw={"tags": tags, "type": el.get("type"), "id": el.get("id")},
                confidence_hint=self.default_confidence,
            )


registry.register(OsmSource())
