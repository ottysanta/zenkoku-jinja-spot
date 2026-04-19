"""Wikidata SPARQL ソース（Q845945: Shinto shrine）。"""
from __future__ import annotations

from typing import Any, Iterator

import httpx

from .base import ShrineSource, SourceRecord, registry


SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "JohnnyShrinePlatform/1.0 (contact: admin@example.invalid)"

SPARQL_TEMPLATE = """
SELECT ?shrine ?shrineLabel ?coord ?article WHERE {{
  ?shrine wdt:P31/wdt:P279* wd:Q845945.
  ?shrine wdt:P625 ?coord.
  OPTIONAL {{
    ?article schema:about ?shrine ;
             schema:isPartOf <https://ja.wikipedia.org/> .
  }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "ja,en". }}
}}
LIMIT {limit} OFFSET {offset}
"""


def _parse_point(wkt: str) -> tuple[float, float] | None:
    # "Point(139.7 35.6)" -> (139.7, 35.6)
    if not wkt or not wkt.startswith("Point("):
        return None
    body = wkt[6:-1].strip()
    parts = body.split()
    if len(parts) != 2:
        return None
    try:
        return float(parts[0]), float(parts[1])
    except ValueError:
        return None


class WikidataSource(ShrineSource):
    source_type = "wikidata"
    display_name = "Wikidata"
    default_confidence = 50
    allow_persist = True

    def fetch(self, *, limit: int = 1000, offset: int = 0, **_: Any) -> Iterator[SourceRecord]:
        query = SPARQL_TEMPLATE.format(limit=limit, offset=offset)
        headers = {"Accept": "application/sparql-results+json", "User-Agent": USER_AGENT}
        with httpx.Client(timeout=120.0, headers=headers) as client:
            res = client.get(SPARQL_ENDPOINT, params={"query": query})
            res.raise_for_status()
            data = res.json()

        for binding in data.get("results", {}).get("bindings", []):
            qid_url = binding.get("shrine", {}).get("value", "")
            qid = qid_url.rsplit("/", 1)[-1] if qid_url else None
            if not qid:
                continue
            label = binding.get("shrineLabel", {}).get("value") or qid
            coord = _parse_point(binding.get("coord", {}).get("value", ""))
            if coord is None:
                continue
            lng, lat = coord
            article = binding.get("article", {}).get("value")
            yield SourceRecord(
                source_type="wikidata",
                source_object_id=f"wd:{qid}",
                name=label,
                lat=lat,
                lng=lng,
                url=article or qid_url,
                raw={"qid": qid, "wikipedia_ja": article},
                confidence_hint=self.default_confidence,
            )


registry.register(WikidataSource())
