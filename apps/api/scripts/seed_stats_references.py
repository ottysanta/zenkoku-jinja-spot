"""`stats_references` テーブルの初期シード。

/learn/stats ページが参照する2つの代表的メトリクスを投入する:

  1. registered_shinto_shrines
     - 文化庁『宗教年鑑』令和5年版 で公表された神道系「神社」の宗教法人登録数。
  2. estimated_total_shrines_including_hokora
     - 境内社・祠・屋敷神を含めた全国の神社の慣習的な推計値（約20万社）。

実行:
    cd apps/api
    py -m scripts.seed_stats_references

`metric_key` を upsert キーとして用いるため、複数回実行しても同じ行が更新される。
"""
from __future__ import annotations

import sys
from pathlib import Path

# `apps/api` をモジュール解決のルートに追加（`py -m scripts.seed_stats_references`
# でも、直接実行でも動くようにする）。
_API_ROOT = Path(__file__).resolve().parents[1]
if str(_API_ROOT) not in sys.path:
    sys.path.insert(0, str(_API_ROOT))

from sqlalchemy import select
from sqlalchemy.orm import Session

from database import SessionLocal
from models import StatsReference


# ---------------------------------------------------------------------------
# シード定義
# ---------------------------------------------------------------------------
# 値は task 仕様どおり（推計値も含めて固定）。年鑑側が更新されたら本ファイルを
# 書き換えて再実行する想定。
SEED_ROWS: list[dict] = [
    {
        "metric_key": "registered_shinto_shrines",
        "metric_value": 80608,
        "reference_year": 2023,
        "reference_as_of": "2022-12-31",
        "source_name": "文化庁『宗教年鑑』令和5年版",
        "source_url": (
            "https://www.bunka.go.jp/tokei_hakusho_shuppan/"
            "hakusho_nenjihokokusho/shukyo_nenkan/"
        ),
        "published_at": "2023-12-27",
        "note": (
            "神道系の『神社』として宗教法人登録されている法人数。"
            "境内社や登録外の小祠は含まない。"
        ),
    },
    {
        "metric_key": "estimated_total_shrines_including_hokora",
        "metric_value": 200000,
        "reference_year": 2024,
        "reference_as_of": None,
        "source_name": "推計（境内社・祠・屋敷神を含む）",
        "source_url": None,
        "published_at": None,
        "note": (
            "研究者や神社関係書籍で慣習的に用いられる推計値。"
            "小規模な祠や屋敷神を含めると全国で約20万社との試算。"
        ),
    },
]


def _upsert_stats_reference(db: Session, row: dict) -> tuple[StatsReference, str]:
    """`metric_key` をキーに upsert。(row, action) を返す。action は 'inserted'/'updated'."""
    stmt = select(StatsReference).where(StatsReference.metric_key == row["metric_key"])
    existing = db.execute(stmt).scalar_one_or_none()

    if existing is not None:
        existing.metric_value = row["metric_value"]
        existing.reference_year = row["reference_year"]
        existing.reference_as_of = row["reference_as_of"]
        existing.source_name = row["source_name"]
        existing.source_url = row["source_url"]
        existing.published_at = row["published_at"]
        existing.note = row["note"]
        db.flush()
        return existing, "updated"

    obj = StatsReference(**row)
    db.add(obj)
    db.flush()
    return obj, "inserted"


def main() -> None:
    db = SessionLocal()
    try:
        for row in SEED_ROWS:
            obj, action = _upsert_stats_reference(db, row)
            # metric_value は 80608 や 200000 のようにカンマ区切りの方が読みやすい。
            print(
                f"[{action}] {obj.metric_key} = {obj.metric_value:,} "
                f"(year={obj.reference_year}, source={obj.source_name})"
            )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
