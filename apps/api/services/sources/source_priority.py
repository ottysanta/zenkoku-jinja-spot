"""ソースの優先度テーブル。マージ時の field-level 上書き判定に使う。

優先度が高いソースの値は、低いソースの値を上書きできる。
逆は禁止（confidence_score は加算的に扱える）。
"""
from __future__ import annotations

#: 数値が大きいほど高優先度。
PRIORITY: dict[str, int] = {
    "manual": 100,        # 管理者が手動登録/検証
    "bunka": 80,          # 文化庁 宗教法人名簿（予定）
    "jinjacho": 75,       # 神社庁（都道府県神社庁 公式）
    "mlit": 70,           # MLIT 国土数値情報
    "gsi": 65,            # 国土地理院 基盤地図
    "wikidata": 50,       # Wikidata Q845945
    "osm": 40,            # OpenStreetMap
    "google_places": 30,  # Places は補助のみ（永続化不可ポリシー）
    "unknown": 10,
}


def priority_of(source_type: str | None) -> int:
    if not source_type:
        return 0
    return PRIORITY.get(source_type, 0)


def is_higher(candidate: str | None, existing: str | None) -> bool:
    """candidate が existing より高優先なら True。同等は False（上書きしない）。"""
    return priority_of(candidate) > priority_of(existing)


#: 永続化禁止のソース（TOS 上 DB に長期保存できないもの）。
NON_PERSISTABLE: frozenset[str] = frozenset({"google_places"})
