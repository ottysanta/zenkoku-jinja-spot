"""
Phase 2: Fetch Shinto shrine data from Wikidata SPARQL endpoint.

Writes JSONL to apps/api/shrine_data/raw/wikidata_shrines.jsonl.
"""
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, Iterable, List

import requests

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
except Exception:
    pass

HERE = Path(__file__).resolve().parent
API_DIR = HERE.parent
RAW_DIR = API_DIR / "shrine_data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = RAW_DIR / "wikidata_shrines.jsonl"

ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "SanpaiTechDev/1.0 (https://github.com/local)"

SPARQL = """
SELECT ?item ?itemLabel ?itemLabel_ja ?coord ?prefecture ?prefectureLabel_ja
       ?deity ?deityLabel_ja ?founded ?website ?wikipedia_ja
WHERE {
  ?item wdt:P31/wdt:P279* wd:Q845945 .
  ?item wdt:P625 ?coord .
  OPTIONAL { ?item wdt:P131 ?prefecture . }
  OPTIONAL { ?item wdt:P140 ?deity . }
  OPTIONAL { ?item wdt:P571 ?founded . }
  OPTIONAL { ?item wdt:P856 ?website . }
  OPTIONAL {
    ?wikipedia_ja schema:about ?item ;
                  schema:isPartOf <https://ja.wikipedia.org/> .
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "ja,en".
    ?item rdfs:label ?itemLabel .
    ?item rdfs:label ?itemLabel_ja .
    ?prefecture rdfs:label ?prefectureLabel_ja .
    ?deity rdfs:label ?deityLabel_ja .
  }
}
LIMIT 20000
"""

POINT_RE = re.compile(r"Point\(([-+0-9.eE]+)\s+([-+0-9.eE]+)\)")


def parse_point(wkt: str) -> tuple[float, float] | None:
    m = POINT_RE.match(wkt or "")
    if not m:
        return None
    lon = float(m.group(1))
    lat = float(m.group(2))
    return lat, lon


def q_id(iri: str) -> str | None:
    if not iri:
        return None
    if iri.startswith("http://www.wikidata.org/entity/"):
        return iri.rsplit("/", 1)[-1]
    return iri


def fetch_sparql() -> Dict[str, Any]:
    last_exc: Exception | None = None
    for attempt in range(3):
        try:
            r = requests.post(
                ENDPOINT,
                data={"query": SPARQL},
                headers={
                    "Accept": "application/sparql-results+json",
                    "User-Agent": USER_AGENT,
                },
                timeout=300,
            )
            if r.status_code != 200:
                raise RuntimeError(f"HTTP {r.status_code}: {r.text[:300]}")
            return r.json()
        except Exception as e:  # noqa: BLE001
            last_exc = e
            wait = [10, 30, 60][attempt]
            print(
                f"  [retry] wikidata attempt={attempt+1} err={type(e).__name__}: {str(e)[:150]} — sleeping {wait}s",
                flush=True,
            )
            time.sleep(wait)
    raise RuntimeError(f"SPARQL failed: {last_exc}")


def group_rows(bindings: List[Dict[str, Any]]) -> Iterable[Dict[str, Any]]:
    """Group rows by Q-id (one shrine may have multiple deities, etc)."""
    by_q: Dict[str, Dict[str, Any]] = {}
    for b in bindings:
        item_iri = (b.get("item") or {}).get("value")
        qid = q_id(item_iri)
        if not qid:
            continue
        coord = (b.get("coord") or {}).get("value")
        ll = parse_point(coord or "")
        if ll is None:
            continue
        lat, lng = ll
        prev = by_q.get(qid)
        if prev is None:
            prev = {
                "qid": qid,
                "external_id": f"wd:{qid}",
                "name": (b.get("itemLabel_ja") or b.get("itemLabel") or {}).get("value") or qid,
                "lat": lat,
                "lng": lng,
                "prefecture": (b.get("prefectureLabel_ja") or {}).get("value"),
                "deities": set(),
                "founded": (b.get("founded") or {}).get("value"),
                "website": (b.get("website") or {}).get("value"),
                "wikipedia_ja": (b.get("wikipedia_ja") or {}).get("value"),
            }
            by_q[qid] = prev
        deity = (b.get("deityLabel_ja") or {}).get("value")
        if deity:
            prev["deities"].add(deity)

    for rec in by_q.values():
        rec["deity"] = "、".join(sorted(rec["deities"])) if rec["deities"] else None
        del rec["deities"]
        wp = rec.get("wikipedia_ja")
        if wp:
            # extract title from URL
            try:
                from urllib.parse import unquote
                title = unquote(wp.rsplit("/", 1)[-1]).replace("_", " ")
                rec["wikipedia_title"] = title
                rec["wikipedia_url"] = wp
            except Exception:  # noqa: BLE001
                pass
        yield rec


def main() -> None:
    t0 = time.time()
    print(f"[wikidata] querying {ENDPOINT}...", flush=True)
    data = fetch_sparql()
    bindings = (data.get("results") or {}).get("bindings") or []
    print(f"[wikidata] raw bindings={len(bindings)} elapsed={int(time.time()-t0)}s", flush=True)

    count = 0
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        for rec in group_rows(bindings):
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            count += 1
    print(f"[DONE] wrote {count} unique shrines -> {OUT_PATH}", flush=True)


if __name__ == "__main__":
    main()
