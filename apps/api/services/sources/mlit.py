"""MLIT 国土数値情報ソース。

国土交通省が GIS データを Shapefile/GeoJSON で提供している。
神社直結のデータセットは公式には提供されていないため、本実装は
「国土数値情報の公共施設データ（P02 等）から religious_category が
 'shrine' 相当のものを抽出」または「事前に自前変換した GeoJSON を
 ローカルファイルとして読み込む」パターンを採る。

使い方:
    runner.run_import(db, "mlit", file_path="shrine_data/raw/mlit_shrines.geojson")

ファイル形式（期待）:
    {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "id": "mlit:P02-12345",
          "geometry": {"type": "Point", "coordinates": [lng, lat]},
          "properties": {
            "name": "...",
            "prefecture": "東京都",
            "address": "...",
            "category_code": "...",
            "source_year": 2024
          }
        }
      ]
    }
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterator

from .base import ShrineSource, SourceRecord, registry


class MlitSource(ShrineSource):
    source_type = "mlit"
    display_name = "国土交通省 国土数値情報"
    default_confidence = 70
    allow_persist = True

    def fetch(self, *, file_path: str | None = None, **_: Any) -> Iterator[SourceRecord]:
        if not file_path:
            # ファイル未指定なら何も返さない（健全な no-op）。
            # 本番運用では scripts/fetch_mlit.py で GeoJSON を落としてから実行する。
            return
        p = Path(file_path)
        if not p.exists():
            raise FileNotFoundError(f"MLIT source file not found: {p}")
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
            name = props.get("name") or props.get("shisetsu_name")
            if not name:
                continue
            # MLIT id は P02 分類コード等を含めて安定化
            object_id = feat.get("id") or props.get("id") or f"mlit:{props.get('category_code','')}:{lat:.5f},{lng:.5f}"

            yield SourceRecord(
                source_type="mlit",
                source_object_id=str(object_id),
                name=str(name),
                lat=lat,
                lng=lng,
                address=props.get("address"),
                prefecture=props.get("prefecture"),
                url=props.get("url"),
                raw={"properties": props, "source_year": props.get("source_year")},
                confidence_hint=self.default_confidence,
            )

    def health_check(self) -> tuple[bool, str]:
        # ファイルベースなので常に OK（ファイル存在判定は fetch 側で実施）
        return True, "file-based source (provide file_path at sync time)"


registry.register(MlitSource())
