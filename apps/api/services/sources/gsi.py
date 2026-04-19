"""GSI 国土地理院 基盤地図情報ソース。

地理院タイル（.geojson レンダリング済み）や基盤地図情報「自然地名・
行政区域・公共施設」を Shapefile / GeoJSON で配布している。
神社単独のデータセットは無いが、地名 DB や基盤地図情報のポイント
レイヤに含まれるものを抽出するのが主用途。

MLIT と同じくローカル GeoJSON を受け付ける実装。
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterator

from .base import ShrineSource, SourceRecord, registry


class GsiSource(ShrineSource):
    source_type = "gsi"
    display_name = "国土地理院 基盤地図情報"
    default_confidence = 65
    allow_persist = True

    def fetch(self, *, file_path: str | None = None, **_: Any) -> Iterator[SourceRecord]:
        if not file_path:
            return
        p = Path(file_path)
        if not p.exists():
            raise FileNotFoundError(f"GSI source file not found: {p}")
        with p.open("r", encoding="utf-8") as fh:
            data = json.load(fh)

        features = data.get("features") if isinstance(data, dict) else data
        if not features:
            return

        for feat in features:
            geom = feat.get("geometry") or {}
            if geom.get("type") != "Point":
                continue
            coords = geom.get("coordinates") or []
            if len(coords) < 2:
                continue
            lng, lat = float(coords[0]), float(coords[1])
            props = feat.get("properties") or {}
            name = props.get("name") or props.get("feature_name")
            if not name:
                continue
            object_id = feat.get("id") or f"gsi:{props.get('feature_id', f'{lat:.5f},{lng:.5f}')}"

            yield SourceRecord(
                source_type="gsi",
                source_object_id=str(object_id),
                name=str(name),
                lat=lat,
                lng=lng,
                address=props.get("address"),
                prefecture=props.get("prefecture"),
                raw={"properties": props},
                confidence_hint=self.default_confidence,
            )

    def health_check(self) -> tuple[bool, str]:
        return True, "file-based source (provide file_path at sync time)"


registry.register(GsiSource())
