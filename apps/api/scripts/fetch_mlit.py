"""国土数値情報 (MLIT) から神社データを取り出して標準 GeoJSON に変換する。

国土数値情報の公式ダウンロード URL:
  https://nlftp.mlit.go.jp/ksj/index.html

神社を直接扱う専用データセットはないが、以下のどれかを使う:
  - 「P02 公共施設」: 大分類コード=宗教施設(03) など
  - 「A22 緊急避難場所」: 多くの神社が該当（指定緊急避難場所としての神社）
  - 「A37 観光資源」: 観光地点としての神社
  - 「P04 市区町村役場」: 参考（神社は直接含まれない）

このスクリプトは:
  1. ユーザーが MLIT のページから DL した Shapefile または GeoJSON を受け取り
  2. 「神社」「神宮」「大社」を名称に含む Point を抽出し
  3. `services/sources/mlit.py` が期待するスキーマで出力する

Shapefile 対応には pyshp が必要（pip install pyshp）。未インストールなら
GeoJSON のみ対応。

使用例:
    # GeoJSON 入力
    python -m scripts.fetch_mlit \\
        --input shrine_data/raw/P02-14.geojson \\
        --output shrine_data/raw/mlit_shrines.geojson \\
        --prefecture "神奈川県"

    # Shapefile 入力
    python -m scripts.fetch_mlit \\
        --input shrine_data/raw/P02-14_14.shp \\
        --output shrine_data/raw/mlit_shrines.geojson
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Any, Iterable

_API_DIR = Path(__file__).resolve().parent.parent
if str(_API_DIR) not in sys.path:
    sys.path.insert(0, str(_API_DIR))


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("fetch_mlit")


SHRINE_KEYWORDS = ("神社", "神宮", "大社", "天満宮", "稲荷", "八幡")
EXCLUDE_KEYWORDS = ("寺", "仏閣", "教会", "幼稚園", "保育")


def is_shrine_name(name: str) -> bool:
    if not name:
        return False
    if any(k in name for k in EXCLUDE_KEYWORDS):
        return False
    return any(k in name for k in SHRINE_KEYWORDS)


def iter_geojson_points(geojson: dict[str, Any]) -> Iterable[dict[str, Any]]:
    for feat in geojson.get("features", []) or []:
        geom = feat.get("geometry") or {}
        if geom.get("type") != "Point":
            continue
        coords = geom.get("coordinates") or []
        if len(coords) < 2:
            continue
        yield feat


def iter_shapefile_points(path: Path) -> Iterable[dict[str, Any]]:
    try:
        import shapefile  # type: ignore  # pyshp
    except ImportError:
        raise RuntimeError(
            "shapefile reader requires pyshp. install: pip install pyshp"
        )
    reader = shapefile.Reader(str(path), encoding="cp932")
    field_names = [f[0] for f in reader.fields[1:]]
    for rec, shp in zip(reader.records(), reader.shapes()):
        if shp.shapeType != shapefile.POINT:
            continue
        if not shp.points:
            continue
        lng, lat = shp.points[0]
        props = {k: v for k, v in zip(field_names, list(rec))}
        yield {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lng, lat]},
            "properties": props,
        }


# MLIT P02 の名称カラム候補
NAME_KEYS = ["P02_004", "P02_003", "name", "shisetsu_name", "name_ja", "名称", "P29_001", "A22_002"]
PREF_KEYS = ["P02_001", "prefecture", "都道府県", "PREF"]


def _extract_name(props: dict[str, Any]) -> str | None:
    for k in NAME_KEYS:
        v = props.get(k)
        if v and isinstance(v, str):
            return v.strip()
    return None


def _extract_prefecture(props: dict[str, Any]) -> str | None:
    for k in PREF_KEYS:
        v = props.get(k)
        if v and isinstance(v, str):
            return v.strip()
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="MLIT GeoJSON または Shapefile (.shp)")
    ap.add_argument("--output", required=True, help="出力 GeoJSON パス")
    ap.add_argument("--prefecture", help="フィルタ: 都道府県（完全一致）")
    ap.add_argument("--source-year", type=int, help="元データ年度（メタに記録）")
    args = ap.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        log.error("input not found: %s", in_path)
        return 1

    if in_path.suffix.lower() in {".geojson", ".json"}:
        with in_path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
        feats_iter = iter_geojson_points(data)
    elif in_path.suffix.lower() == ".shp":
        feats_iter = iter_shapefile_points(in_path)
    else:
        log.error("unsupported input format: %s", in_path.suffix)
        return 1

    out_features: list[dict[str, Any]] = []
    skipped_not_shrine = 0
    skipped_pref = 0
    for feat in feats_iter:
        props = feat.get("properties") or {}
        name = _extract_name(props)
        if not is_shrine_name(name or ""):
            skipped_not_shrine += 1
            continue
        pref = _extract_prefecture(props)
        if args.prefecture and pref != args.prefecture:
            skipped_pref += 1
            continue

        coords = feat["geometry"]["coordinates"]
        feature_id = feat.get("id") or props.get("id") or f"mlit:{name}:{coords[1]:.5f},{coords[0]:.5f}"
        out_features.append({
            "type": "Feature",
            "id": f"mlit:{feature_id}" if not str(feature_id).startswith("mlit:") else str(feature_id),
            "geometry": {"type": "Point", "coordinates": [float(coords[0]), float(coords[1])]},
            "properties": {
                "name": name,
                "prefecture": pref,
                "source_year": args.source_year,
                "category_code": props.get("P02_002") or props.get("category_code"),
                "mlit_raw": props,  # 監査用に完全に残す（filesize 大きめ）
            },
        })

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as fh:
        json.dump({"type": "FeatureCollection", "features": out_features}, fh, ensure_ascii=False, indent=2)

    log.info(
        "done: written=%d non_shrine_skipped=%d prefecture_skipped=%d output=%s",
        len(out_features), skipped_not_shrine, skipped_pref, out_path,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
