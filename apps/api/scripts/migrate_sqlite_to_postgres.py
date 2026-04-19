"""SQLite (apps/api/data/shrine_spots.db) から Postgres へ現行データを移送する。

使い方:
  # 1) 先に Alembic で Postgres 側のスキーマを作る
  cd apps/api
  export DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/shrine_spots"
  alembic upgrade head

  # 2) 本スクリプトで SQLite からコピー
  python scripts/migrate_sqlite_to_postgres.py \\
      --sqlite data/shrine_spots.db \\
      --dest "$DATABASE_URL"

前提:
- 宛先の Postgres テーブルは空（PK 衝突を避けるため）。
- 対象テーブル: spots / user_posts / spot_submissions / checkins。
  レビュー・奉納等は本スクリプトの対象外（当面 Postgres 側の新規データとして始める）。
- 既存 ID を維持するため、コピー後に各テーブルの sequence を最大 id に合わせる。
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Iterable

from sqlalchemy import MetaData, Table, create_engine, select
from sqlalchemy.engine import Engine

# 移送対象と依存関係順（親→子）
TABLES_IN_ORDER = [
    "spots",
    "user_posts",
    "spot_submissions",
    "checkins",
]

BATCH_SIZE = 500


def _reflect_table(engine: Engine, name: str) -> Table:
    md = MetaData()
    return Table(name, md, autoload_with=engine)


def _copy_table(src: Engine, dst: Engine, name: str) -> int:
    src_table = _reflect_table(src, name)
    dst_table = _reflect_table(dst, name)

    # カラムは宛先側の定義を正とし、両方に存在するものだけコピー
    common_cols = [c.name for c in dst_table.columns if c.name in src_table.columns]

    total = 0
    with src.connect() as sconn, dst.begin() as dconn:
        rows = sconn.execute(select(*[src_table.c[c] for c in common_cols]))
        batch: list[dict] = []
        for row in rows:
            batch.append(dict(zip(common_cols, row)))
            if len(batch) >= BATCH_SIZE:
                dconn.execute(dst_table.insert(), batch)
                total += len(batch)
                batch.clear()
        if batch:
            dconn.execute(dst_table.insert(), batch)
            total += len(batch)
    return total


def _fix_sequence(dst: Engine, name: str) -> None:
    """Postgres の連番を現在の max(id) に合わせる。SQLite 宛は no-op。"""
    if not dst.url.drivername.startswith("postgresql"):
        return
    with dst.begin() as conn:
        # table_id_seq 命名規則（Alembic の PK では通常 {table}_id_seq）
        conn.exec_driver_sql(
            f"SELECT setval("
            f"pg_get_serial_sequence('{name}', 'id'), "
            f"COALESCE((SELECT MAX(id) FROM {name}), 1), "
            f"(SELECT MAX(id) IS NOT NULL FROM {name})"
            f")"
        )


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sqlite",
        default=str(Path(__file__).resolve().parent.parent / "data" / "shrine_spots.db"),
        help="コピー元 SQLite のパス",
    )
    parser.add_argument(
        "--dest",
        required=True,
        help="コピー先 SQLAlchemy URL（例: postgresql+psycopg://user:pass@host/db）",
    )
    args = parser.parse_args(argv)

    sqlite_path = Path(args.sqlite)
    if not sqlite_path.exists():
        print(f"[error] SQLite file not found: {sqlite_path}", file=sys.stderr)
        return 1

    src = create_engine(f"sqlite:///{sqlite_path}")
    dst = create_engine(args.dest)

    print(f"[info] source: sqlite:///{sqlite_path}")
    print(f"[info] dest  : {dst.url.render_as_string(hide_password=True)}")

    for name in TABLES_IN_ORDER:
        try:
            count = _copy_table(src, dst, name)
        except Exception as e:
            print(f"[error] failed to copy {name}: {e}", file=sys.stderr)
            return 2
        _fix_sequence(dst, name)
        print(f"[ok]   {name}: {count} rows copied")

    print("[done] migration completed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
