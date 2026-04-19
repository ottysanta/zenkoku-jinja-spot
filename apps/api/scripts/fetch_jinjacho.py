"""都道府県神社庁サイトから取得した一覧を、`services/sources/jinjacho.py` が
期待する正規化 JSON に変換するスクリプト。

神社庁には統一 API が無く、各都道府県の神社庁サイトも構造が全くバラバラ
（HTML テーブル / 手書き CSV / PDF など）である。スクレイピング条件は各所で
異なるため、本スクリプトは以下の方針を取る:

  - ユーザーが手動または個別スクリプトで取得した「生データ」を受け取る
  - 入力は CSV / TSV / JSON の 3 形式に対応
  - name / lat / lng / prefecture を必須キーにし、他は任意
  - 緯度経度が無い行は Geocoding を後段（同期ランナー側）に委譲するため
    そのまま落とす。Geocoder API を呼ぶかは利用者の判断に任せる。
  - `jinjacho_id` を原則として `{pref_slug}:{source_row_hash}` の形で生成
    （external_id の安定化）

入力 CSV の想定ヘッダ例:
    name,lat,lng,prefecture,address,shrine_rank,url
    明治神宮,35.6764,139.6993,東京都,"渋谷区代々木神園町1-1",別表神社,https://...

出力:
    [
      {
        "jinjacho_id": "tokyo:abcd1234",
        "name": "明治神宮",
        "lat": 35.6764,
        "lng": 139.6993,
        "prefecture": "東京都",
        "shrine_rank": "別表神社",
        "address": "渋谷区代々木神園町1-1",
        "url": "https://..."
      },
      ...
    ]

使用例:
    python -m scripts.fetch_jinjacho \\
        --input shrine_data/raw/tokyo_jinjacho.csv \\
        --output shrine_data/raw/jinjacho_tokyo.json \\
        --prefecture 東京都 \\
        --pref-slug tokyo
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import logging
import sys
from pathlib import Path
from typing import Any, Iterable

_API_DIR = Path(__file__).resolve().parent.parent
if str(_API_DIR) not in sys.path:
    sys.path.insert(0, str(_API_DIR))


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("fetch_jinjacho")


# 入力フィールドの別名マップ（日英混在対策）
NAME_KEYS = ("name", "神社名", "名称", "shrine_name")
LAT_KEYS = ("lat", "latitude", "緯度")
LNG_KEYS = ("lng", "lon", "longitude", "経度")
PREF_KEYS = ("prefecture", "都道府県", "pref")
ADDR_KEYS = ("address", "所在地", "住所")
RANK_KEYS = ("shrine_rank", "rank", "社格", "別表")
URL_KEYS = ("url", "link", "URL")
DEITY_KEYS = ("deity", "祭神", "主祭神")
FOUNDED_KEYS = ("founded", "創建", "由緒")
TYPE_KEYS = ("shrine_type", "type", "種別")


def _pick(row: dict[str, Any], keys: Iterable[str]) -> Any:
    for k in keys:
        v = row.get(k)
        if v not in (None, "", " "):
            return v
    return None


def _safe_float(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(str(v).strip())
    except ValueError:
        return None


def _row_hash(row: dict[str, Any]) -> str:
    """欠落 ID 用の安定ハッシュ。name + lat + lng の 8 hex bytes。"""
    src = f"{row.get('name', '')}|{row.get('lat', '')}|{row.get('lng', '')}"
    return hashlib.sha1(src.encode("utf-8")).hexdigest()[:10]


def load_rows(path: Path) -> list[dict[str, Any]]:
    sfx = path.suffix.lower()
    if sfx == ".json":
        with path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
        if isinstance(data, dict):
            data = data.get("items") or data.get("data") or []
        if not isinstance(data, list):
            raise ValueError("JSON must be list or {items:[...]}")
        return data
    if sfx in (".csv", ".tsv"):
        delim = "\t" if sfx == ".tsv" else ","
        with path.open("r", encoding="utf-8-sig", newline="") as fh:
            return list(csv.DictReader(fh, delimiter=delim))
    raise ValueError(f"unsupported input format: {sfx}")


def normalize(row: dict[str, Any], pref_slug: str, default_pref: str | None) -> dict[str, Any] | None:
    name = _pick(row, NAME_KEYS)
    lat = _safe_float(_pick(row, LAT_KEYS))
    lng = _safe_float(_pick(row, LNG_KEYS))
    if not name or lat is None or lng is None:
        return None
    pref = _pick(row, PREF_KEYS) or default_pref
    jid = row.get("jinjacho_id") or row.get("id") or f"{pref_slug}:{_row_hash({'name': name, 'lat': lat, 'lng': lng})}"
    return {
        "jinjacho_id": str(jid),
        "name": str(name).strip(),
        "lat": lat,
        "lng": lng,
        "prefecture": pref.strip() if isinstance(pref, str) else pref,
        "shrine_rank": _pick(row, RANK_KEYS),
        "shrine_type": _pick(row, TYPE_KEYS),
        "address": _pick(row, ADDR_KEYS),
        "url": _pick(row, URL_KEYS),
        "deity": _pick(row, DEITY_KEYS),
        "founded": _pick(row, FOUNDED_KEYS),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="元データ CSV / TSV / JSON")
    ap.add_argument("--output", required=True, help="出力 JSON パス（Jinjacho source が読み込む形式）")
    ap.add_argument("--pref-slug", required=True, help="ID プレフィクス (例: tokyo, osaka)")
    ap.add_argument("--prefecture", help="行に都道府県が無い場合のデフォルト値")
    args = ap.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        log.error("input not found: %s", in_path)
        return 1

    rows = load_rows(in_path)
    out: list[dict[str, Any]] = []
    dropped = 0
    for r in rows:
        norm = normalize(r, args.pref_slug, args.prefecture)
        if norm is None:
            dropped += 1
            continue
        out.append(norm)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)

    log.info(
        "done: written=%d dropped=%d (missing name/lat/lng) output=%s",
        len(out), dropped, out_path,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
