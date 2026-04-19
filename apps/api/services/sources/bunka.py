"""文化庁 宗教年鑑ソース。

宗教年鑑は神社ごとの座標付き詳細リストではなく、都道府県別の法人登録数
などを年次で公表している統計資料。そのため本ソースの主目的は:

  1. `stats_references` テーブルの年次更新（登録神社数などの参考値）
  2. 将来、法人名簿 CSV が整備された場合のインポート口

座標付き神社マスタとしての用途は想定していない（fetch は基本的に空）。
統計の更新は `upsert_yearbook_stat()` をヘルパとして公開し、
管理画面や scripts から直接呼ぶ。
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterator

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import StatsReference
from .base import ShrineSource, SourceRecord, registry


SOURCE_URL = "https://www.bunka.go.jp/tokei_hakusho_shuppan/hakusho_nenjihokokusho/shukyo_nenkan/"


class BunkaSource(ShrineSource):
    source_type = "bunka"
    display_name = "文化庁 宗教年鑑（統計）"
    default_confidence = 80
    # 統計参照が主。shrine 単体の raw は保存しない運用。
    allow_persist = False

    def fetch(self, **_: Any) -> Iterator[SourceRecord]:
        # 神社単体の座標データは宗教年鑑から得られないので空返し。
        return
        yield  # type: ignore[unreachable]

    def health_check(self) -> tuple[bool, str]:
        return True, "stats-only source (use upsert_yearbook_stat)"


registry.register(BunkaSource())


def upsert_yearbook_stat(
    db: Session,
    *,
    reference_year: int,
    metric_key: str,
    metric_value: int,
    reference_as_of: str | None = None,
    note: str | None = None,
    published_at: str | None = None,
) -> StatsReference:
    """文化庁 宗教年鑑の統計値を stats_references に upsert。

    UI には「文化庁 宗教年鑑 / 対象年 / 対象時点」をセットで表示することで、
    固定文言の埋め込み（バージョン固着）を避ける。
    """
    stmt = select(StatsReference).where(
        StatsReference.source_name == "文化庁 宗教年鑑",
        StatsReference.reference_year == reference_year,
        StatsReference.metric_key == metric_key,
    )
    existing = db.execute(stmt).scalar_one_or_none()
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    if existing is not None:
        existing.metric_value = metric_value
        if reference_as_of:
            existing.reference_as_of = reference_as_of
        if note is not None:
            existing.note = note
        if published_at:
            existing.published_at = published_at
        existing.source_url = SOURCE_URL
        db.flush()
        return existing

    row = StatsReference(
        source_name="文化庁 宗教年鑑",
        source_url=SOURCE_URL,
        reference_year=reference_year,
        reference_as_of=reference_as_of or f"{reference_year}-12-31",
        metric_key=metric_key,
        metric_value=metric_value,
        note=note,
        published_at=published_at or now,
    )
    db.add(row)
    db.flush()
    return row
