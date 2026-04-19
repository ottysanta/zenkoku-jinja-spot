"""ソース同期ランナー。

単一ソースに対し fetch → 既存との照合 → upsert → ログ確定までを駆動する。

マージ判定の方針:
  - 30m 以内 かつ 名称類似度 ≥ 0.85 → 自動マージ（matched）
  - 30m 以内 かつ 名称類似度 < 0.85 → pending_merges に積む
  - 30-150m かつ 名称類似度 ≥ 0.90 → pending_merges に積む
  - それ以外 → 新規 canonical 作成
  - 完全一致の external_id があれば迷わず更新

名称類似度は SequenceMatcher（Python 標準）で 0.0-1.0 を算出。
「○○神社」「○○神宮」「○○大社」の表記ゆれを吸収するため、末尾の
社格呼称を正規化してから比較する。
"""
from __future__ import annotations

import math
import re
import unicodedata
from dataclasses import dataclass
from difflib import SequenceMatcher

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Spot
from .base import SourceRecord
from .repository import ShrineRepository, SourceImportLog
from . import registry


EARTH_R_M = 6_371_000.0

# 名称末尾の単純呼称のみ除去（「○○稲荷神社」→「○○稲荷」のような過剰剥離を避けるため、
# "稲荷神社" "八幡宮" 等の複合形は入れない）。
_SUFFIXES = ("神宮", "大社", "神社", "天満宮", "八幡", "稲荷", "宮", "社")

# 自動マージ / 候補積みの閾値
AUTO_MERGE_RADIUS_M = 30.0
AUTO_MERGE_NAME_SIM = 0.85
PENDING_RADIUS_M = 150.0
PENDING_NAME_SIM = 0.70
STRONG_NAME_SIM = 0.90


def haversine_m(a_lat: float, a_lng: float, b_lat: float, b_lng: float) -> float:
    phi1 = math.radians(a_lat)
    phi2 = math.radians(b_lat)
    dphi = math.radians(b_lat - a_lat)
    dl = math.radians(b_lng - a_lng)
    s = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_R_M * math.asin(math.sqrt(s))


# 旧字体→新字体の最小マッピング（神社名で頻出するもののみ）
_KYUUJI_MAP = str.maketrans({
    "國": "国", "會": "会", "澤": "沢", "豐": "豊", "來": "来",
    "榮": "栄", "濱": "浜", "廣": "広", "藝": "芸", "圓": "円",
    "萬": "万", "舊": "旧", "德": "徳",
})


def _normalize_name(name: str) -> str:
    """「○○神社」「○○神宮」等の表記ゆれを吸収するための正規化。

    - Unicode NFKC 正規化（全角英数・半角カナ等を標準形に）
    - 旧字体→新字体変換（国/國, 沢/澤, 豊/豐 等）
    - 全角・半角スペースを除去
    - 末尾の括弧書きを除去
    - 末尾の社格呼称を除去（神宮/大社/神社/天満宮/宮/社 等）
    """
    if not name:
        return ""
    n = unicodedata.normalize("NFKC", name)
    n = n.translate(_KYUUJI_MAP)
    n = re.sub(r"\s+", "", n)
    n = re.sub(r"[（(][^）)]*[)）]$", "", n)
    # 最長マッチで末尾を剥がす
    for suf in sorted(_SUFFIXES, key=len, reverse=True):
        if n.endswith(suf) and len(n) > len(suf):
            n = n[: -len(suf)]
            break
    return n


def name_similarity(a: str, b: str) -> float:
    """0.0-1.0 の名称類似度。表記ゆれ吸収した上で SequenceMatcher。"""
    na = _normalize_name(a)
    nb = _normalize_name(b)
    if not na or not nb:
        return 0.0
    if na == nb:
        return 1.0
    return SequenceMatcher(None, na, nb).ratio()


@dataclass
class SyncCounts:
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    pending: int = 0
    failed: int = 0


@dataclass
class _NearbyHit:
    spot: Spot
    distance_m: float
    name_sim: float

    @property
    def score(self) -> float:
        # 距離を 0-1 正規化（150m で 0、0m で 1）し、名称類似度と平均
        dist_component = max(0.0, 1.0 - self.distance_m / PENDING_RADIUS_M)
        return 0.4 * dist_component + 0.6 * self.name_sim


def _find_nearby_candidates(
    db: Session, rec: SourceRecord, radius_m: float = PENDING_RADIUS_M
) -> list[_NearbyHit]:
    """バウンディングボックスで候補を引き、各候補の距離・名称類似度を返す。"""
    dlat = radius_m / 111_111.0
    dlng = radius_m / (111_111.0 * max(0.1, math.cos(math.radians(rec.lat))))
    stmt = (
        select(Spot)
        .where(
            Spot.lat >= rec.lat - dlat,
            Spot.lat <= rec.lat + dlat,
            Spot.lng >= rec.lng - dlng,
            Spot.lng <= rec.lng + dlng,
            Spot.published_status != "merged",
        )
        .limit(50)
    )
    hits: list[_NearbyHit] = []
    for spot in db.execute(stmt).scalars():
        d = haversine_m(rec.lat, rec.lng, spot.lat, spot.lng)
        if d > radius_m:
            continue
        sim = name_similarity(rec.name, spot.canonical_name or spot.name)
        hits.append(_NearbyHit(spot=spot, distance_m=d, name_sim=sim))
    hits.sort(key=lambda h: h.score, reverse=True)
    return hits


def ingest_record(db: Session, rec: SourceRecord, counts: SyncCounts) -> None:
    """1 レコードを取り込み。counts を更新。

    判定ロジック:
      1. external_id 完全一致 → 既存を更新
      2. 近接候補 (≤150m) を取得
      3. ベスト候補が 30m 以内 AND 名称類似度 ≥0.85 → 自動マージ
      4. ベスト候補が 150m 以内 AND 名称類似度 ≥0.90 → 自動マージ（遠めだが名前強一致）
      5. 候補が 150m 以内 AND 名称類似度 ≥0.70 → pending_merges に積んだ上で新規作成
      6. 該当なし → 新規 canonical 作成
    """
    repo = ShrineRepository(db)

    # 1. external_id 完全一致
    existing = repo.get_by_external_id(rec.source_object_id)
    if existing is not None:
        changed = repo.update_canonical_from_source(existing, rec)
        repo.record_raw(existing.id, rec, match_status="matched", match_score=1.0)
        counts.updated += 1 if changed else 0
        counts.skipped += 0 if changed else 1
        return

    # 2. 近接候補
    hits = _find_nearby_candidates(db, rec)
    best = hits[0] if hits else None

    # 3-4. 自動マージ条件
    if best is not None:
        auto_merge = (
            (best.distance_m <= AUTO_MERGE_RADIUS_M and best.name_sim >= AUTO_MERGE_NAME_SIM)
            or (best.distance_m <= PENDING_RADIUS_M and best.name_sim >= STRONG_NAME_SIM)
        )
        if auto_merge:
            repo.update_canonical_from_source(best.spot, rec)
            repo.record_raw(
                best.spot.id, rec, match_status="matched", match_score=best.score,
            )
            counts.updated += 1
            return

    # 5-6. 新規作成してから、境界帯候補は pending_merges に積む
    spot = repo.create_canonical(rec)
    repo.record_raw(spot.id, rec, match_status="matched", match_score=1.0)
    counts.inserted += 1

    # 境界帯（自動マージにはならなかったが怪しい距離/類似度）
    # キュー条件: 30m 以内（名前無関係）OR 150m 以内 AND 名称類似度≥0.5
    for hit in hits[:3]:  # ベスト3まで
        if hit.spot.id == spot.id:
            continue
        is_close = hit.distance_m <= AUTO_MERGE_RADIUS_M
        is_name_match = hit.name_sim >= 0.5 and hit.distance_m <= PENDING_RADIUS_M
        if not (is_close or is_name_match):
            continue
        # canonical 側を primary、今作った新規を candidate として積む
        # （primary は通常 confidence が高い既存。今作ったのは後から来た同一説）
        primary = hit.spot if (hit.spot.confidence_score or 0) >= (spot.confidence_score or 0) else spot
        candidate = spot if primary.id == hit.spot.id else hit.spot
        if primary.id == candidate.id:
            continue
        repo.queue_pending_merge(
            primary_id=primary.id,
            candidate_id=candidate.id,
            score=hit.score,
            reasons={
                "coord_dist_m": round(hit.distance_m, 1),
                "name_sim": round(hit.name_sim, 3),
                "primary_name": primary.canonical_name or primary.name,
                "candidate_name": candidate.canonical_name or candidate.name,
                "primary_source_type": primary.primary_source,
                "candidate_source_type": candidate.primary_source,
            },
        )
        counts.pending += 1


def run_import(db: Session, source_type: str, *, triggered_by: str = "manual",
               **fetch_kwargs) -> SyncCounts:
    """指定ソースから fetch → DB 反映。SourceImport ログを自動記録。"""
    source = registry.get(source_type)
    counts = SyncCounts()
    with SourceImportLog(db, source_type=source_type, triggered_by=triggered_by) as log:
        try:
            for rec in source.fetch(**fetch_kwargs):
                try:
                    ingest_record(db, rec, counts)
                except Exception as e:  # 1 レコード失敗で全体を止めない
                    counts.failed += 1
                    log.error_message = (log.error_message or "") + f"{e}\n"
                    if counts.failed > 50:
                        raise
            log.inserted = counts.inserted
            log.updated = counts.updated
            log.skipped = counts.skipped
            log.failed = counts.failed
            log.status = "completed"
        except Exception:
            log.status = "failed"
            raise
    return counts
