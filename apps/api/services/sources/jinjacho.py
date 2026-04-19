"""神社庁（都道府県神社庁）ソース。

各都道府県の神社庁が公式サイトで神社一覧を公開しているが、統一 API は無く
スクレイピング前提。そのため本ソースも MLIT/GSI と同じく、事前に整形済の
ローカル JSON / CSV を読み込む口にしておく。

期待ファイル形式（.json）:
    [
      {
        "name": "...",
        "lat": 35.xx,
        "lng": 139.xx,
        "prefecture": "東京都",
        "shrine_rank": "別表神社",
        "address": "...",
        "url": "...",
        "jinjacho_id": "tokyo_jinja_12345"
      },
      ...
    ]
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterator

from .base import ShrineSource, SourceRecord, registry


class JinjachoSource(ShrineSource):
    source_type = "jinjacho"
    display_name = "神社庁（都道府県）"
    default_confidence = 75
    allow_persist = True

    def fetch(self, *, file_path: str | None = None, **_: Any) -> Iterator[SourceRecord]:
        if not file_path:
            return
        p = Path(file_path)
        if not p.exists():
            raise FileNotFoundError(f"Jinjacho source file not found: {p}")
        with p.open("r", encoding="utf-8") as fh:
            items = json.load(fh)
        if isinstance(items, dict):
            items = items.get("items") or items.get("data") or []

        for it in items:
            name = it.get("name") or it.get("canonical_name")
            lat = it.get("lat")
            lng = it.get("lng")
            if not name or lat is None or lng is None:
                continue
            jid = it.get("jinjacho_id") or it.get("id") or f"{name}:{lat:.5f},{lng:.5f}"
            yield SourceRecord(
                source_type="jinjacho",
                source_object_id=f"jinjacho:{jid}",
                name=str(name),
                lat=float(lat),
                lng=float(lng),
                address=it.get("address"),
                prefecture=it.get("prefecture"),
                url=it.get("url"),
                shrine_rank=it.get("shrine_rank"),
                shrine_type=it.get("shrine_type"),
                deity=it.get("deity"),
                founded=it.get("founded"),
                raw=it,
                confidence_hint=self.default_confidence,
            )

    def health_check(self) -> tuple[bool, str]:
        return True, "file-based source (provide file_path at sync time)"


registry.register(JinjachoSource())
