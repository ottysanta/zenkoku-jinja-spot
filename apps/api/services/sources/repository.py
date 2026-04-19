"""Shrine Repository。

canonical spots テーブルと shrine_source_records / shrine_metadata への
アクセスを集約する。API 層はここだけを呼び、直接 ORM を叩かない。

設計原則:
  - upsert 系は全て「source 別 raw を記録 + canonical を再計算」の 2 段階
  - canonical 値は priority に従い、高優先ソースが低優先を上書き
  - 手動検証された値（source_type='manual'）は外部ソースでは上書き不可
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from models import (
    Spot,
    ShrineSourceRecord,
    ShrineMetadata,
    SourceImport,
    PendingMerge,
)
from .base import SourceRecord
from .source_priority import priority_of, is_higher, NON_PERSISTABLE


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@dataclass
class UpsertOutcome:
    action: str          # "inserted" | "updated" | "skipped" | "pending_merge"
    shrine_id: int | None
    source_record_id: int | None


class ShrineRepository:
    """Unit-of-work 境界はメソッド単位（commit は呼び出し側で制御）。"""

    def __init__(self, db: Session) -> None:
        self.db = db

    # --- 取得 ---

    def get_by_id(self, shrine_id: int) -> Spot | None:
        return self.db.get(Spot, shrine_id)

    def get_by_external_id(self, external_id: str) -> Spot | None:
        stmt = select(Spot).where(Spot.external_id == external_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def find_source_record(self, source_type: str, source_object_id: str) -> ShrineSourceRecord | None:
        stmt = select(ShrineSourceRecord).where(
            ShrineSourceRecord.source_type == source_type,
            ShrineSourceRecord.source_object_id == source_object_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_source_records(self, shrine_id: int) -> list[ShrineSourceRecord]:
        stmt = select(ShrineSourceRecord).where(ShrineSourceRecord.shrine_id == shrine_id)
        return list(self.db.execute(stmt).scalars())

    # --- 書き込み ---

    def record_raw(self, shrine_id: int, rec: SourceRecord, *, match_status: str = "matched",
                   match_score: float | None = None) -> ShrineSourceRecord:
        """shrine_source_records への 1 レコード upsert。

        permitted source のみ raw_payload_json を保存。
        Places 等 NON_PERSISTABLE では raw は保存せずメタのみ残す。
        """
        existing = self.find_source_record(rec.source_type, rec.source_object_id)
        payload_json: str | None = None
        if rec.source_type not in NON_PERSISTABLE and rec.raw:
            import json
            payload_json = json.dumps(rec.raw, ensure_ascii=False)

        if existing is not None:
            existing.shrine_id = shrine_id
            existing.source_name = rec.name
            existing.source_address = rec.address
            existing.source_lat = rec.lat
            existing.source_lng = rec.lng
            existing.source_url = rec.url
            existing.fetched_at = _now_iso()
            existing.raw_payload_json = payload_json
            existing.match_status = match_status
            existing.match_score = match_score
            self.db.flush()
            return existing

        created = ShrineSourceRecord(
            shrine_id=shrine_id,
            source_type=rec.source_type,
            source_object_id=rec.source_object_id,
            source_name=rec.name,
            source_address=rec.address,
            source_lat=rec.lat,
            source_lng=rec.lng,
            source_url=rec.url,
            fetched_at=_now_iso(),
            raw_payload_json=payload_json,
            match_status=match_status,
            match_score=match_score,
        )
        self.db.add(created)
        self.db.flush()
        return created

    def create_canonical(self, rec: SourceRecord) -> Spot:
        """新規 canonical spot を作成。外部キー永続化は呼び出し側で flush 済みを期待。"""
        spot = Spot(
            name=rec.name,
            canonical_name=rec.name,
            address=rec.address,
            lat=rec.lat,
            lng=rec.lng,
            shrine_type=rec.shrine_type,
            deity=rec.deity,
            shrine_rank=rec.shrine_rank,
            founded=rec.founded,
            prefecture=rec.prefecture,
            website=rec.url,
            external_id=rec.source_object_id,
            source_layer=rec.source_type,
            primary_source=rec.source_type,
            confidence_score=rec.confidence_hint,
            published_status="published",
            last_synced_at=_now_iso(),
            data_freshness_status="fresh",
        )
        self.db.add(spot)
        self.db.flush()
        # 1:1 metadata を同時作成
        md = ShrineMetadata(shrine_id=spot.id)
        self.db.add(md)
        return spot

    def update_canonical_from_source(self, spot: Spot, rec: SourceRecord) -> bool:
        """priority に従い canonical を更新。変更があれば True。

        manual は絶対優先。同一 priority では既存値を保持。
        """
        changed = False
        # manual が既に入っていれば、他ソースでは canonical を書き換えない
        if spot.primary_source == "manual" and rec.source_type != "manual":
            pass  # raw は別途記録済み、canonical は触らない
        elif is_higher(rec.source_type, spot.primary_source):
            # 高優先ソースで完全に上書き
            spot.canonical_name = rec.name
            spot.primary_source = rec.source_type
            spot.confidence_score = max(spot.confidence_score or 0, rec.confidence_hint)
            if rec.address:
                spot.address = rec.address
            if rec.shrine_type:
                spot.shrine_type = rec.shrine_type
            if rec.shrine_rank:
                spot.shrine_rank = rec.shrine_rank
            if rec.deity:
                spot.deity = rec.deity
            if rec.founded:
                spot.founded = rec.founded
            if rec.prefecture:
                spot.prefecture = rec.prefecture
            changed = True
        else:
            # 同一/低優先: 欠損フィールドのみ補完
            if not spot.address and rec.address:
                spot.address = rec.address
                changed = True
            if not spot.shrine_type and rec.shrine_type:
                spot.shrine_type = rec.shrine_type
                changed = True
            if not spot.prefecture and rec.prefecture:
                spot.prefecture = rec.prefecture
                changed = True
            # confidence は複数ソース一致で加点
            bonus = min(5, priority_of(rec.source_type) // 10)
            new_conf = min(100, (spot.confidence_score or 0) + bonus)
            if new_conf != spot.confidence_score:
                spot.confidence_score = new_conf
                changed = True

        spot.last_synced_at = _now_iso()
        spot.data_freshness_status = "fresh"
        return changed

    def queue_pending_merge(self, primary_id: int, candidate_id: int,
                             score: float, reasons: dict) -> PendingMerge:
        """境界スコアの候補は pending_merges に積み、管理者レビューに回す。"""
        import json
        existing = self.db.execute(
            select(PendingMerge).where(
                PendingMerge.primary_shrine_id == primary_id,
                PendingMerge.candidate_shrine_id == candidate_id,
            )
        ).scalar_one_or_none()
        if existing is not None:
            existing.match_score = max(existing.match_score, score)
            existing.match_reasons = json.dumps(reasons, ensure_ascii=False)
            return existing
        row = PendingMerge(
            primary_shrine_id=primary_id,
            candidate_shrine_id=candidate_id,
            match_score=score,
            match_reasons=json.dumps(reasons, ensure_ascii=False),
            status="pending",
            created_at=_now_iso(),
        )
        self.db.add(row)
        self.db.flush()
        return row

    # --- 鮮度マーク ---

    def mark_stale_older_than(self, days: int) -> int:
        """最後の同期から days 経過したレコードを stale に更新。返り値は更新件数。"""
        from datetime import timedelta
        threshold = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat(timespec="seconds")
        stmt = (
            update(Spot)
            .where(Spot.last_synced_at < threshold, Spot.data_freshness_status == "fresh")
            .values(data_freshness_status="aging")
        )
        result = self.db.execute(stmt)
        return result.rowcount or 0


class SourceImportLog:
    """バッチ実行 1 回分のライフサイクル管理。with 文で使う。"""

    def __init__(self, db: Session, source_type: str, triggered_by: str = "manual") -> None:
        self.db = db
        self.source_type = source_type
        self.triggered_by = triggered_by
        self.row: SourceImport | None = None

    def __enter__(self) -> SourceImport:
        self.row = SourceImport(
            source_type=self.source_type,
            started_at=_now_iso(),
            status="running",
            triggered_by=self.triggered_by,
        )
        self.db.add(self.row)
        self.db.flush()
        return self.row

    def __exit__(self, exc_type, exc, tb) -> None:
        assert self.row is not None
        self.row.finished_at = _now_iso()
        if exc is not None:
            self.row.status = "failed"
            self.row.error_message = f"{exc_type.__name__}: {exc}"[:2000]
        elif self.row.status == "running":
            self.row.status = "completed"
        self.db.commit()
