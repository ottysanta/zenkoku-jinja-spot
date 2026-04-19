"""定期的な神社データ同期バッチ。

cron / GitHub Actions / Render Cron Job から呼び出す想定。

使用例:
    # 全ソース（無引数を許容するもののみ）を実行
    python -m scripts.sync_sources --all

    # 個別ソース
    python -m scripts.sync_sources --source osm --bbox 35.5,139.5,35.8,139.9
    python -m scripts.sync_sources --source wikidata --limit 500 --offset 0
    python -m scripts.sync_sources --source mlit --file shrine_data/raw/mlit_shrines.geojson

    # stale マーク（30日超過を aging に降格）
    python -m scripts.sync_sources --mark-stale 30

推奨 cron:
    毎週月曜 03:00 JST:
      - wikidata 差分取得
      - mlit / gsi（ファイルがある場合）
      - --mark-stale 14

注意:
  - OSM は重いので日本全域ではなく都道府県単位で bbox 分割推奨
  - Google Places は API キー費用がかさむのでスケジュール起動しない
"""
from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

# apps/api をパスに追加
_API_DIR = Path(__file__).resolve().parent.parent
if str(_API_DIR) not in sys.path:
    sys.path.insert(0, str(_API_DIR))

from database import SessionLocal  # noqa: E402
from services.sources import registry  # noqa: E402
from services.sources.sync_runner import run_import  # noqa: E402
from services.sources.repository import ShrineRepository  # noqa: E402


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("sync_sources")


def _parse_bbox(s: str) -> tuple[float, float, float, float]:
    parts = s.split(",")
    if len(parts) != 4:
        raise argparse.ArgumentTypeError("bbox must be south,west,north,east")
    return tuple(float(x) for x in parts)  # type: ignore[return-value]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", help="source_type (osm/wikidata/mlit/gsi/jinjacho/google_places/bunka/manual)")
    parser.add_argument("--bbox", type=_parse_bbox, help="south,west,north,east (OSM)")
    parser.add_argument("--file", help="file_path (MLIT/GSI/Jinjacho)")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--offset", type=int)
    parser.add_argument("--query", help="Places text query")
    parser.add_argument("--lat", type=float)
    parser.add_argument("--lng", type=float)
    parser.add_argument("--radius-m", type=float, dest="radius_m")
    parser.add_argument("--all", action="store_true", help="全ソースを順番に実行（引数不要なもののみ）")
    parser.add_argument("--mark-stale", type=int, dest="mark_stale",
                        help="指定日数より古い last_synced_at を aging に降格")
    parser.add_argument("--triggered-by", default="cron", dest="triggered_by")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.mark_stale:
            repo = ShrineRepository(db)
            n = repo.mark_stale_older_than(args.mark_stale)
            db.commit()
            log.info("marked aging: %d rows (threshold=%d days)", n, args.mark_stale)

        if args.all:
            # 引数不要で健全に動けるのは wikidata のみ。
            # OSM は bbox、MLIT/GSI/Jinjacho は file、Places は kwargs 必須。
            candidates = ["wikidata"]
            for st in candidates:
                try:
                    log.info("syncing %s ...", st)
                    counts = run_import(db, st, triggered_by=args.triggered_by,
                                        limit=args.limit or 500,
                                        offset=args.offset or 0)
                    log.info("  → inserted=%d updated=%d skipped=%d failed=%d",
                             counts.inserted, counts.updated, counts.skipped, counts.failed)
                except Exception:
                    log.exception("sync failed: %s", st)

        if args.source:
            if not registry.has(args.source):
                log.error("unknown source: %s", args.source)
                return 2
            kwargs: dict = {}
            if args.bbox:
                kwargs["bbox"] = args.bbox
            if args.file:
                kwargs["file_path"] = args.file
            if args.limit is not None:
                kwargs["limit"] = args.limit
            if args.offset is not None:
                kwargs["offset"] = args.offset
            if args.query:
                kwargs["query"] = args.query
            if args.lat is not None:
                kwargs["lat"] = args.lat
            if args.lng is not None:
                kwargs["lng"] = args.lng
            if args.radius_m is not None:
                kwargs["radius_m"] = args.radius_m

            log.info("syncing %s (%s)...", args.source, kwargs)
            counts = run_import(db, args.source, triggered_by=args.triggered_by, **kwargs)
            log.info("done: inserted=%d updated=%d skipped=%d failed=%d",
                     counts.inserted, counts.updated, counts.skipped, counts.failed)

        if not args.all and not args.source and not args.mark_stale:
            parser.print_help()
            return 1
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
