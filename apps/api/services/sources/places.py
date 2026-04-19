"""Google Places API ソース。

重要なポリシー制約:
  - Google Maps/Places のレスポンスは **補助参照** に限る
  - 本プロジェクトでは allow_persist=True としているが、
    NON_PERSISTABLE に登録されているため raw_payload_json は保存しない
    （repository.record_raw が自動的に raw を drop）
  - Places 由来の座標・名称は canonical を書き換えず、欠損補完のみ
    （source_priority.PRIORITY で 30 に固定、OSM より低い）
  - キャッシュ期間・表示方法は Google の利用規約に従うこと

使い方:
    runner.run_import(db, "google_places", query="神社", lat=..., lng=..., radius_m=...)

環境変数:
    GOOGLE_PLACES_API_KEY が未設定なら fetch は空 iterator を返す。
"""
from __future__ import annotations

import os
from typing import Any, Iterator

import httpx

from .base import ShrineSource, SourceRecord, registry


PLACES_TEXT_SEARCH = "https://places.googleapis.com/v1/places:searchText"
PLACES_NEARBY = "https://places.googleapis.com/v1/places:searchNearby"


class GooglePlacesSource(ShrineSource):
    source_type = "google_places"
    display_name = "Google Places API"
    default_confidence = 30
    # 永続化自体は許可するが raw は保存しない（NON_PERSISTABLE 側で制御）。
    allow_persist = True

    def _api_key(self) -> str | None:
        return os.environ.get("GOOGLE_PLACES_API_KEY")

    def health_check(self) -> tuple[bool, str]:
        if not self._api_key():
            return False, "GOOGLE_PLACES_API_KEY が未設定"
        return True, "ok"

    def fetch(
        self,
        *,
        query: str = "神社",
        lat: float | None = None,
        lng: float | None = None,
        radius_m: float = 5000,
        limit: int = 20,
        **_: Any,
    ) -> Iterator[SourceRecord]:
        api_key = self._api_key()
        if not api_key:
            return

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            # FieldMask で必要最小限に絞る（課金抑制・規約遵守）
            "X-Goog-FieldMask": (
                "places.id,places.displayName,places.formattedAddress,"
                "places.location,places.websiteUri,places.types"
            ),
        }
        body: dict[str, Any] = {"textQuery": query, "pageSize": min(limit, 20)}
        if lat is not None and lng is not None:
            body["locationBias"] = {
                "circle": {
                    "center": {"latitude": lat, "longitude": lng},
                    "radius": float(radius_m),
                }
            }

        with httpx.Client(timeout=30.0, headers=headers) as client:
            res = client.post(PLACES_TEXT_SEARCH, json=body)
            res.raise_for_status()
            data = res.json()

        for place in data.get("places", []):
            pid = place.get("id")
            if not pid:
                continue
            name_obj = place.get("displayName") or {}
            name = name_obj.get("text") if isinstance(name_obj, dict) else name_obj
            if not name:
                continue
            loc = place.get("location") or {}
            plat, plng = loc.get("latitude"), loc.get("longitude")
            if plat is None or plng is None:
                continue
            yield SourceRecord(
                source_type="google_places",
                source_object_id=f"places:{pid}",
                name=name,
                lat=float(plat),
                lng=float(plng),
                address=place.get("formattedAddress"),
                url=place.get("websiteUri"),
                # raw は NON_PERSISTABLE 指定により DB に保存されない。
                # ただし当該バッチ内のマージロジック用に一時的に保持。
                raw={"places_id": pid, "types": place.get("types", [])},
                confidence_hint=self.default_confidence,
            )


registry.register(GooglePlacesSource())
