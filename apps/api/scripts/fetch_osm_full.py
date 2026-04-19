"""
Phase 1: Fetch shrine data from OSM Overpass API.

Fetches node/way/relation across all 47 prefectures, plus a broader name-based
query, and writes JSONL to apps/api/shrine_data/raw/osm_full.jsonl.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, Iterable, List

import aiohttp

# Force UTF-8 stdout on Windows so Japanese prints never raise cp932 errors.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except Exception:
    pass

HERE = Path(__file__).resolve().parent
API_DIR = HERE.parent
RAW_DIR = API_DIR / "shrine_data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = RAW_DIR / "osm_full.jsonl"

ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

USER_AGENT = "SanpaiTechDev/1.0 (https://github.com/local)"

# 47 prefectures (official names, used as area["name"])
PREFECTURES = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
]

MAX_CONCURRENCY = 3
TIMEOUT_SEC = 180
RETRIES = 3
BACKOFFS = [5, 15, 45]

SHRINE_NAME_REGEX = "神社|神宮|宮|稲荷|八幡|天神"


def build_query_religion(prefecture: str) -> str:
    # amenity=place_of_worship + religion=shinto across node/way/relation
    return f"""
[out:json][timeout:150];
area["admin_level"="4"]["name"="{prefecture}"]->.a;
(
  node["amenity"="place_of_worship"]["religion"="shinto"](area.a);
  way["amenity"="place_of_worship"]["religion"="shinto"](area.a);
  relation["amenity"="place_of_worship"]["religion"="shinto"](area.a);
);
out center tags;
"""


def build_query_broad(prefecture: str) -> str:
    # broader name-based lookup for elements that are shrines but missing religion=shinto
    return f"""
[out:json][timeout:150];
area["admin_level"="4"]["name"="{prefecture}"]->.a;
(
  node["name"~"{SHRINE_NAME_REGEX}"]["amenity"="place_of_worship"](area.a);
  way["name"~"{SHRINE_NAME_REGEX}"]["amenity"="place_of_worship"](area.a);
  relation["name"~"{SHRINE_NAME_REGEX}"]["amenity"="place_of_worship"](area.a);
  node["name:ja"~"{SHRINE_NAME_REGEX}"]["amenity"="place_of_worship"](area.a);
  way["name:ja"~"{SHRINE_NAME_REGEX}"]["amenity"="place_of_worship"](area.a);
  relation["name:ja"~"{SHRINE_NAME_REGEX}"]["amenity"="place_of_worship"](area.a);
);
out center tags;
"""


async def fetch_once(session: aiohttp.ClientSession, endpoint: str, query: str) -> Dict[str, Any]:
    async with session.post(
        endpoint,
        data={"data": query},
        headers={"User-Agent": USER_AGENT},
        timeout=aiohttp.ClientTimeout(total=TIMEOUT_SEC),
    ) as resp:
        if resp.status != 200:
            text = await resp.text()
            raise RuntimeError(f"HTTP {resp.status} from {endpoint}: {text[:200]}")
        return await resp.json()


async def fetch_with_retry(
    session: aiohttp.ClientSession,
    query: str,
    prefecture: str,
    kind: str,
    endpoint_picker,
) -> Dict[str, Any]:
    last_exc: Exception | None = None
    for attempt in range(RETRIES):
        endpoint = endpoint_picker()
        try:
            return await fetch_once(session, endpoint, query)
        except Exception as e:  # noqa: BLE001
            last_exc = e
            wait = BACKOFFS[min(attempt, len(BACKOFFS) - 1)]
            err_msg = str(e)[:120].encode("ascii", errors="replace").decode("ascii")
            print(
                f"  [retry] {prefecture} {kind} attempt={attempt+1} err={type(e).__name__}: {err_msg} - sleeping {wait}s",
                flush=True,
            )
            await asyncio.sleep(wait)
    raise RuntimeError(f"Failed after {RETRIES} retries: {last_exc}")


def extract_element(el: Dict[str, Any]) -> Dict[str, Any] | None:
    tags = el.get("tags") or {}
    name = tags.get("name:ja") or tags.get("name")
    if not name:
        return None
    if el["type"] == "node":
        lat, lon = el.get("lat"), el.get("lon")
    else:
        center = el.get("center") or {}
        lat, lon = center.get("lat"), center.get("lon")
    if lat is None or lon is None:
        return None

    addr_parts = [
        tags.get("addr:prefecture"),
        tags.get("addr:city"),
        tags.get("addr:street"),
        tags.get("addr:full"),
    ]
    address = " ".join(p for p in addr_parts if p)

    wikipedia = tags.get("wikipedia")
    wikipedia_title = None
    wikipedia_url = None
    if wikipedia:
        # format is "ja:Title"
        if ":" in wikipedia:
            lang, title = wikipedia.split(":", 1)
            wikipedia_title = title
            wikipedia_url = f"https://{lang}.wikipedia.org/wiki/{title.replace(' ', '_')}"
        else:
            wikipedia_title = wikipedia

    return {
        "osm_type": el["type"],
        "osm_id": el["id"],
        "external_id": f"osm:{el['type']}/{el['id']}",
        "name": name,
        "lat": lat,
        "lng": lon,
        "address": address or None,
        "website": tags.get("website"),
        "wikipedia": wikipedia,
        "wikipedia_title": wikipedia_title,
        "wikipedia_url": wikipedia_url,
        "wikidata": tags.get("wikidata"),
        "religion": tags.get("religion"),
        "tags": tags,
    }


async def run() -> None:
    t0 = time.time()
    seen: Dict[str, Dict[str, Any]] = {}

    # round-robin endpoint picker
    rr = {"i": 0}

    def next_endpoint() -> str:
        ep = ENDPOINTS[rr["i"] % len(ENDPOINTS)]
        rr["i"] += 1
        return ep

    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)

    async with aiohttp.ClientSession() as session:

        async def fetch_one(prefecture: str, kind: str) -> List[Dict[str, Any]]:
            query = (
                build_query_religion(prefecture)
                if kind == "religion"
                else build_query_broad(prefecture)
            )
            async with semaphore:
                try:
                    data = await fetch_with_retry(
                        session, query, prefecture, kind, next_endpoint
                    )
                except Exception as e:  # noqa: BLE001
                    err_msg = str(e)[:200].encode("ascii", errors="replace").decode("ascii")
                    print(
                        f"  [FAIL] {prefecture} {kind}: {err_msg}",
                        flush=True,
                    )
                    return []
                elements = data.get("elements") or []
                out: List[Dict[str, Any]] = []
                for el in elements:
                    rec = extract_element(el)
                    if rec is None:
                        continue
                    out.append(rec)
                return out

        tasks = []
        for pref in PREFECTURES:
            tasks.append(("religion", pref, asyncio.create_task(fetch_one(pref, "religion"))))
        for pref in PREFECTURES:
            tasks.append(("broad", pref, asyncio.create_task(fetch_one(pref, "broad"))))

        total_tasks = len(tasks)
        done = 0
        last_pct_mark = -1
        for kind, pref, task in tasks:
            recs = await task
            done += 1
            added = 0
            for r in recs:
                eid = r["external_id"]
                if eid in seen:
                    # merge: keep address if missing, prefer religion==shinto record
                    prev = seen[eid]
                    if not prev.get("address") and r.get("address"):
                        prev["address"] = r["address"]
                    if not prev.get("wikidata") and r.get("wikidata"):
                        prev["wikidata"] = r["wikidata"]
                    continue
                seen[eid] = r
                added += 1
            pct = int(done * 100 / total_tasks)
            if pct // 10 != last_pct_mark // 10:
                last_pct_mark = pct
                print(
                    f"[{pct:3d}%] {done}/{total_tasks} last={pref}({kind}) new={added} total_unique={len(seen)} elapsed={int(time.time()-t0)}s",
                    flush=True,
                )

    # write JSONL
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        for rec in seen.values():
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    by_type: Dict[str, int] = {}
    for r in seen.values():
        by_type[r["osm_type"]] = by_type.get(r["osm_type"], 0) + 1
    print(
        f"[DONE] wrote {len(seen)} records -> {OUT_PATH} "
        f"(by type: {by_type}) elapsed={int(time.time()-t0)}s",
        flush=True,
    )


if __name__ == "__main__":
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run())
