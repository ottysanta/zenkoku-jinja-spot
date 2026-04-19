"""Manual ソース。管理者 UI から直接登録された神社用。

fetch は何も返さない（プッシュ型）。登録は API ルート経由で
repository.create_canonical / record_raw を直接呼ぶ想定。
registry に存在することで priority 比較と DB 表現の対称性を得るのが目的。
"""
from __future__ import annotations

from typing import Any, Iterator

from .base import ShrineSource, SourceRecord, registry


class ManualSource(ShrineSource):
    source_type = "manual"
    display_name = "Manual (admin)"
    default_confidence = 100
    allow_persist = True

    def fetch(self, **_: Any) -> Iterator[SourceRecord]:
        # manual はプッシュ型なので常に空 iterator
        return
        yield  # type: ignore[unreachable]


registry.register(ManualSource())
