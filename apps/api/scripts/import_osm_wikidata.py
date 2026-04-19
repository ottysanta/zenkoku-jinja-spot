"""
Phase 3: Upsert OSM + Wikidata JSONL into shrine_spots.db.

Rules:
- dedupe via external_id
- never overwrite source_layer='manual' records
- Wikidata fills in empty fields on existing OSM rows (merge)
- commit every 1000 ops, progress every 10%
"""
from __future__ import annotations

import json
import re
import sqlite3
import sys
import time
import unicodedata
from pathlib import Path
from typing import Any, Dict, Iterable, Iterator, List, Optional

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except Exception:
    pass

HERE = Path(__file__).resolve().parent
API_DIR = HERE.parent
DB_PATH = API_DIR / "data" / "shrine_spots.db"
RAW_DIR = API_DIR / "shrine_data" / "raw"
OSM_JSONL = RAW_DIR / "osm_full.jsonl"
WD_JSONL = RAW_DIR / "wikidata_shrines.jsonl"

COMMIT_EVERY = 1000

PREF_KEYWORDS = {
    "北海道": "北海道",
    "青森": "青森県", "岩手": "岩手県", "宮城": "宮城県", "秋田": "秋田県",
    "山形": "山形県", "福島": "福島県", "茨城": "茨城県", "栃木": "栃木県",
    "群馬": "群馬県", "埼玉": "埼玉県", "千葉": "千葉県", "東京": "東京都",
    "神奈川": "神奈川県", "新潟": "新潟県", "富山": "富山県", "石川": "石川県",
    "福井": "福井県", "山梨": "山梨県", "長野": "長野県", "岐阜": "岐阜県",
    "静岡": "静岡県", "愛知": "愛知県", "三重": "三重県", "滋賀": "滋賀県",
    "京都": "京都府", "大阪": "大阪府", "兵庫": "兵庫県", "奈良": "奈良県",
    "和歌山": "和歌山県", "鳥取": "鳥取県", "島根": "島根県", "岡山": "岡山県",
    "広島": "広島県", "山口": "山口県", "徳島": "徳島県", "香川": "香川県",
    "愛媛": "愛媛県", "高知": "高知県", "福岡": "福岡県", "佐賀": "佐賀県",
    "長崎": "長崎県", "熊本": "熊本県", "大分": "大分県", "宮崎": "宮崎県",
    "鹿児島": "鹿児島県", "沖縄": "沖縄県",
}


def guess_prefecture(address: Optional[str]) -> Optional[str]:
    if not address:
        return None
    for key, full in PREF_KEYWORDS.items():
        if key in address:
            return full
    return None


def guess_shrine_type(name: str) -> Optional[str]:
    if not name:
        return None
    if "神宮" in name:
        return "神宮"
    if "大社" in name:
        return "大社"
    if "稲荷" in name:
        return "稲荷"
    if "八幡" in name:
        return "八幡"
    if "天神" in name or "天満" in name:
        return "天神"
    if "神社" in name:
        return "神社"
    return None


def slugify(name: str, eid: str) -> str:
    base = unicodedata.normalize("NFKC", name or "").strip()
    base = re.sub(r"\s+", "-", base)
    base = re.sub(r"[^\w\-一-龠ぁ-んァ-ヴー]", "", base, flags=re.UNICODE)
    tail = eid.replace(":", "-").replace("/", "-")
    candidate = f"{base}-{tail}" if base else tail
    return candidate[:190]


def iter_jsonl(path: Path) -> Iterator[Dict[str, Any]]:
    if not path.exists():
        return
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except Exception:
                continue


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA busy_timeout=10000")
    conn.execute("PRAGMA journal_mode=WAL")
    conn.row_factory = sqlite3.Row
    return conn


def load_existing_index(conn: sqlite3.Connection) -> Dict[str, Dict[str, Any]]:
    cur = conn.execute(
        "SELECT id, external_id, source_layer, name, address, prefecture, "
        "website, wikipedia_title, wikipedia_url, description, deity, founded, shrine_type "
        "FROM spots WHERE external_id IS NOT NULL"
    )
    out: Dict[str, Dict[str, Any]] = {}
    for row in cur:
        out[row["external_id"]] = dict(row)
    return out


def load_used_slugs(conn: sqlite3.Connection) -> set[str]:
    cur = conn.execute("SELECT slug FROM spots WHERE slug IS NOT NULL")
    return {r[0] for r in cur}


def unique_slug(base: str, used: set[str]) -> str:
    if base and base not in used:
        used.add(base)
        return base
    i = 2
    while True:
        cand = f"{base}-{i}"
        if cand not in used:
            used.add(cand)
            return cand
        i += 1


def upsert_osm(
    conn: sqlite3.Connection,
    index: Dict[str, Dict[str, Any]],
    used_slugs: set[str],
) -> Dict[str, int]:
    stats = {"inserted": 0, "updated": 0, "skipped_manual": 0, "skipped_dup": 0, "total": 0}
    if not OSM_JSONL.exists():
        print(f"[osm] {OSM_JSONL} not found, skipping", flush=True)
        return stats

    records = list(iter_jsonl(OSM_JSONL))
    total = len(records)
    stats["total"] = total
    print(f"[osm] upserting {total} records", flush=True)

    last_pct = -1
    ops = 0
    t0 = time.time()
    for i, rec in enumerate(records, 1):
        eid = rec.get("external_id")
        name = rec.get("name")
        lat = rec.get("lat")
        lng = rec.get("lng")
        if not eid or not name or lat is None or lng is None:
            continue

        address = rec.get("address")
        website = rec.get("website")
        prefecture = guess_prefecture(address)
        shrine_type = guess_shrine_type(name)
        wikipedia_title = rec.get("wikipedia_title")
        wikipedia_url = rec.get("wikipedia_url")
        source_url = f"https://www.openstreetmap.org/{rec.get('osm_type')}/{rec.get('osm_id')}"

        existing = index.get(eid)
        if existing:
            if existing.get("source_layer") == "manual":
                stats["skipped_manual"] += 1
            else:
                # fill missing fields only; never overwrite existing non-null
                updates: Dict[str, Any] = {}
                if not existing.get("address") and address:
                    updates["address"] = address
                if not existing.get("prefecture") and prefecture:
                    updates["prefecture"] = prefecture
                if not existing.get("website") and website:
                    updates["website"] = website
                if not existing.get("wikipedia_title") and wikipedia_title:
                    updates["wikipedia_title"] = wikipedia_title
                if not existing.get("wikipedia_url") and wikipedia_url:
                    updates["wikipedia_url"] = wikipedia_url
                if not existing.get("shrine_type") and shrine_type:
                    updates["shrine_type"] = shrine_type
                if updates:
                    cols = ", ".join(f"{k}=?" for k in updates)
                    vals = list(updates.values()) + [existing["id"]]
                    conn.execute(f"UPDATE spots SET {cols} WHERE id=?", vals)
                    stats["updated"] += 1
                    ops += 1
                else:
                    stats["skipped_dup"] += 1
        else:
            slug = unique_slug(slugify(name, eid), used_slugs)
            conn.execute(
                """
                INSERT INTO spots
                  (name, address, lat, lng, shrine_type, prefecture, website,
                   external_id, source_layer, source_url, slug,
                   wikipedia_title, wikipedia_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'osm', ?, ?, ?, ?)
                """,
                (
                    name, address, lat, lng, shrine_type, prefecture, website,
                    eid, source_url, slug, wikipedia_title, wikipedia_url,
                ),
            )
            stats["inserted"] += 1
            ops += 1
            # update local index so later merge-wikidata sees it
            index[eid] = {
                "id": None, "external_id": eid, "source_layer": "osm",
                "name": name, "address": address, "prefecture": prefecture,
                "website": website, "wikipedia_title": wikipedia_title,
                "wikipedia_url": wikipedia_url, "description": None,
                "deity": None, "founded": None, "shrine_type": shrine_type,
            }

        if ops and ops % COMMIT_EVERY == 0:
            conn.commit()

        pct = int(i * 100 / total)
        if pct // 10 != last_pct // 10:
            last_pct = pct
            print(
                f"  [osm {pct:3d}%] {i}/{total} inserted={stats['inserted']} updated={stats['updated']} "
                f"skipped_manual={stats['skipped_manual']} elapsed={int(time.time()-t0)}s",
                flush=True,
            )

    conn.commit()
    return stats


def upsert_wikidata(
    conn: sqlite3.Connection,
    index: Dict[str, Dict[str, Any]],
    used_slugs: set[str],
) -> Dict[str, int]:
    stats = {"inserted": 0, "merged_to_osm": 0, "updated_wd": 0, "skipped_manual": 0, "total": 0}
    if not WD_JSONL.exists():
        print(f"[wikidata] {WD_JSONL} not found, skipping", flush=True)
        return stats

    records = list(iter_jsonl(WD_JSONL))
    total = len(records)
    stats["total"] = total
    print(f"[wikidata] upserting {total} records", flush=True)

    # Build a coordinate-based lookup for OSM rows so we can merge wikidata info
    # onto OSM rows when qid matches the wikidata tag on OSM element.
    osm_by_qid: Dict[str, Dict[str, Any]] = {}
    # We don't have wikidata Q tag in index; we only know osm external_id.
    # For merge, we'll match by wd:Qxxx directly (if that record already in DB as wikidata)
    # and also attempt to merge onto existing OSM rows whose wikipedia_title matches.

    last_pct = -1
    ops = 0
    t0 = time.time()
    for i, rec in enumerate(records, 1):
        eid = rec.get("external_id")
        qid = rec.get("qid")
        name = rec.get("name")
        lat = rec.get("lat")
        lng = rec.get("lng")
        if not eid or not name or lat is None or lng is None:
            continue

        prefecture = rec.get("prefecture")
        website = rec.get("website")
        deity = rec.get("deity")
        founded = rec.get("founded")
        wikipedia_title = rec.get("wikipedia_title")
        wikipedia_url = rec.get("wikipedia_url")
        source_url = f"https://www.wikidata.org/wiki/{qid}" if qid else None
        shrine_type = guess_shrine_type(name)

        existing = index.get(eid)
        if existing:
            if existing.get("source_layer") == "manual":
                stats["skipped_manual"] += 1
            else:
                updates: Dict[str, Any] = {}
                if not existing.get("deity") and deity:
                    updates["deity"] = deity
                if not existing.get("founded") and founded:
                    updates["founded"] = founded
                if not existing.get("website") and website:
                    updates["website"] = website
                if not existing.get("wikipedia_title") and wikipedia_title:
                    updates["wikipedia_title"] = wikipedia_title
                if not existing.get("wikipedia_url") and wikipedia_url:
                    updates["wikipedia_url"] = wikipedia_url
                if not existing.get("prefecture") and prefecture:
                    updates["prefecture"] = prefecture
                if updates:
                    cols = ", ".join(f"{k}=?" for k in updates)
                    vals = list(updates.values()) + [existing["id"]]
                    conn.execute(f"UPDATE spots SET {cols} WHERE id=?", vals)
                    stats["updated_wd"] += 1
                    ops += 1
        else:
            # try merge onto an OSM row by wikipedia_title match
            merge_target: Optional[Dict[str, Any]] = None
            if wikipedia_title:
                for row in index.values():
                    if (
                        row.get("source_layer") == "osm"
                        and row.get("wikipedia_title") == wikipedia_title
                    ):
                        merge_target = row
                        break

            if merge_target is not None and merge_target.get("id"):
                updates = {}
                if not merge_target.get("deity") and deity:
                    updates["deity"] = deity
                if not merge_target.get("founded") and founded:
                    updates["founded"] = founded
                if not merge_target.get("website") and website:
                    updates["website"] = website
                if not merge_target.get("wikipedia_url") and wikipedia_url:
                    updates["wikipedia_url"] = wikipedia_url
                if not merge_target.get("prefecture") and prefecture:
                    updates["prefecture"] = prefecture
                if updates:
                    cols = ", ".join(f"{k}=?" for k in updates)
                    vals = list(updates.values()) + [merge_target["id"]]
                    conn.execute(f"UPDATE spots SET {cols} WHERE id=?", vals)
                    stats["merged_to_osm"] += 1
                    ops += 1
            else:
                slug = unique_slug(slugify(name, eid), used_slugs)
                conn.execute(
                    """
                    INSERT INTO spots
                      (name, lat, lng, shrine_type, prefecture, website,
                       deity, founded, external_id, source_layer, source_url, slug,
                       wikipedia_title, wikipedia_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'wikidata', ?, ?, ?, ?)
                    """,
                    (
                        name, lat, lng, shrine_type, prefecture, website,
                        deity, founded, eid, source_url, slug,
                        wikipedia_title, wikipedia_url,
                    ),
                )
                stats["inserted"] += 1
                ops += 1
                index[eid] = {
                    "id": None, "external_id": eid, "source_layer": "wikidata",
                    "name": name,
                }

        if ops and ops % COMMIT_EVERY == 0:
            conn.commit()

        pct = int(i * 100 / total)
        if pct // 10 != last_pct // 10:
            last_pct = pct
            print(
                f"  [wd {pct:3d}%] {i}/{total} inserted={stats['inserted']} merged={stats['merged_to_osm']} "
                f"updated_wd={stats['updated_wd']} elapsed={int(time.time()-t0)}s",
                flush=True,
            )

    conn.commit()
    return stats


def main() -> None:
    if not DB_PATH.exists():
        print(f"DB not found: {DB_PATH}", file=sys.stderr)
        sys.exit(1)

    conn = connect()
    try:
        before = {
            r[0]: r[1]
            for r in conn.execute("SELECT source_layer, COUNT(*) FROM spots GROUP BY 1")
        }
        total_before = conn.execute("SELECT COUNT(*) FROM spots").fetchone()[0]
        print(f"[before] total={total_before} by_layer={before}", flush=True)

        index = load_existing_index(conn)
        used_slugs = load_used_slugs(conn)
        print(f"[load] indexed external_ids={len(index)} slugs={len(used_slugs)}", flush=True)

        osm_stats = upsert_osm(conn, index, used_slugs)
        print(f"[osm stats] {osm_stats}", flush=True)

        wd_stats = upsert_wikidata(conn, index, used_slugs)
        print(f"[wd stats] {wd_stats}", flush=True)

        after = {
            r[0]: r[1]
            for r in conn.execute("SELECT source_layer, COUNT(*) FROM spots GROUP BY 1")
        }
        total_after = conn.execute("SELECT COUNT(*) FROM spots").fetchone()[0]
        print(f"[after] total={total_after} by_layer={after}", flush=True)
        print(f"[delta] +{total_after - total_before} rows", flush=True)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
