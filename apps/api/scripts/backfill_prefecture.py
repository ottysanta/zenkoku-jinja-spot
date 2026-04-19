"""緯度経度から都道府県を逆引きして spots.prefecture を埋めるスクリプト."""
from __future__ import annotations

import os
# BLAS 系のスレッドを抑制してメモリ枯渇を回避
for _v in ("OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "OMP_NUM_THREADS",
           "NUMEXPR_NUM_THREADS", "VECLIB_MAXIMUM_THREADS"):
    os.environ.setdefault(_v, "1")

import json
import sqlite3
import sys
import time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.prepared import prep

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "shrine_spots.db"
GEOJSON_PATH = ROOT / "shrine_data" / "lookup" / "japan_prefectures.geojson"

JP_LNG = (122.0, 154.0)
JP_LAT = (24.0, 46.0)

_PREFS: list[tuple[str, object, tuple[float, float, float, float]]] = []


def _load_prefs():
    with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
        gj = json.load(f)
    prefs = []
    for feat in gj["features"]:
        name = feat["properties"].get("nam_ja") or feat["properties"].get("nam")
        geom = shape(feat["geometry"])
        bounds = geom.bounds
        prefs.append((name, prep(geom), bounds, geom))
    return prefs


def _init_worker():
    global _PREFS
    for _v in ("OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "OMP_NUM_THREADS"):
        os.environ.setdefault(_v, "1")
    with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
        gj = json.load(f)
    prefs = []
    for feat in gj["features"]:
        name = feat["properties"].get("nam_ja") or feat["properties"].get("nam")
        geom = shape(feat["geometry"])
        prefs.append((name, prep(geom), geom.bounds))
    _PREFS = prefs


def _classify_chunk(chunk):
    results = []
    for sid, lat, lng in chunk:
        if lat is None or lng is None:
            continue
        if not (JP_LNG[0] <= lng <= JP_LNG[1] and JP_LAT[0] <= lat <= JP_LAT[1]):
            continue
        pt = Point(lng, lat)
        hit = None
        for name, prep_geom, (minx, miny, maxx, maxy) in _PREFS:
            if lng < minx or lng > maxx or lat < miny or lat > maxy:
                continue
            if prep_geom.contains(pt):
                hit = name
                break
        if hit is None:
            # バウンディングで擦った候補の中から最近傍を探す（海岸部対策）
            nearest = None
            nearest_d = 0.2  # 約 22km 以内なら採用
            for name, _pg, (minx, miny, maxx, maxy) in _PREFS:
                if lng < minx - 0.2 or lng > maxx + 0.2 or lat < miny - 0.2 or lat > maxy + 0.2:
                    continue
                # 簡易距離: 矩形までの距離
                dx = max(minx - lng, 0.0, lng - maxx)
                dy = max(miny - lat, 0.0, lat - maxy)
                d = (dx * dx + dy * dy) ** 0.5
                if d < nearest_d:
                    nearest_d = d
                    nearest = name
            if nearest is not None:
                hit = nearest
        if hit is not None:
            results.append((sid, hit))
    return results


def _chunks(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i : i + n]


def main() -> int:
    if not DB_PATH.exists():
        print(f"[ERR] DB が見つかりません: {DB_PATH}", file=sys.stderr)
        return 1
    if not GEOJSON_PATH.exists():
        print(f"[ERR] GeoJSON が見つかりません: {GEOJSON_PATH}", file=sys.stderr)
        return 1

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA busy_timeout=10000")
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM spots")
    total = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM spots WHERE prefecture IS NULL OR prefecture = ''")
    before_null = cur.fetchone()[0]
    print(f"[INFO] 全件={total} / prefecture 未設定={before_null}")

    cur.execute(
        "SELECT id, lat, lng FROM spots WHERE prefecture IS NULL OR prefecture = ''"
    )
    rows = cur.fetchall()
    print(f"[INFO] 対象行を読み込み: {len(rows)} 件")

    # 日本バウンディング外はスキップ
    in_rows = [r for r in rows if r[1] is not None and r[2] is not None
               and JP_LNG[0] <= r[2] <= JP_LNG[1] and JP_LAT[0] <= r[1] <= JP_LAT[1]]
    skipped = len(rows) - len(in_rows)
    print(f"[INFO] 日本領域内={len(in_rows)} / 範囲外スキップ={skipped}")

    env_workers = os.environ.get("BACKFILL_WORKERS")
    if env_workers:
        workers = max(1, int(env_workers))
    else:
        workers = min(4, max(1, (os.cpu_count() or 4) - 1))
    chunk_size = max(100, len(in_rows) // (workers * 8) or 1)
    print(f"[INFO] ワーカー数={workers} / チャンクサイズ={chunk_size}")

    started = time.time()
    updates: list[tuple[str, int]] = []
    per_pref: dict[str, int] = {}

    chunks = list(_chunks(in_rows, chunk_size))
    with ProcessPoolExecutor(max_workers=workers, initializer=_init_worker) as ex:
        done = 0
        for res in ex.map(_classify_chunk, chunks, chunksize=1):
            done += 1
            for sid, pref in res:
                updates.append((pref, sid))
                per_pref[pref] = per_pref.get(pref, 0) + 1
            if done % 10 == 0 or done == len(chunks):
                print(f"[INFO] 進捗 {done}/{len(chunks)} チャンク / 判定済 {len(updates)}")

    elapsed = time.time() - started
    print(f"[INFO] 判定完了: {len(updates)} 件 / 所要 {elapsed:.1f}s")

    # バッチ UPDATE
    print("[INFO] DB 更新を開始")
    BATCH = 1000
    wrote = 0
    for i in range(0, len(updates), BATCH):
        batch = updates[i : i + BATCH]
        cur.executemany("UPDATE spots SET prefecture = ? WHERE id = ?", batch)
        conn.commit()
        wrote += len(batch)
        if (i // BATCH) % 10 == 0:
            print(f"[INFO] 更新 {wrote}/{len(updates)}")
    print(f"[INFO] 全更新コミット: {wrote}")

    cur.execute("SELECT COUNT(*) FROM spots WHERE prefecture IS NULL OR prefecture = ''")
    after_null = cur.fetchone()[0]
    print("")
    print("=== サマリ ===")
    print(f"before null: {before_null}")
    print(f"after  null: {after_null}")
    print(f"更新件数  : {wrote}")
    print("都道府県別 追加件数 TOP20:")
    for name, cnt in sorted(per_pref.items(), key=lambda x: -x[1])[:20]:
        print(f"  {name}: {cnt}")

    cur.execute(
        "SELECT COALESCE(NULLIF(prefecture, ''), '(null)'), COUNT(*) FROM spots GROUP BY 1 ORDER BY 2 DESC"
    )
    print("")
    print("全体分布:")
    for name, cnt in cur.fetchall():
        print(f"  {name}: {cnt}")

    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
