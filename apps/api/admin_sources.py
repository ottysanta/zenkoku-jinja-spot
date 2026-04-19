"""Admin API: マルチソース神社データ管理。

エンドポイント:
  GET  /admin/sources                    - 登録ソース一覧（priority/health/last run）
  POST /admin/sources/{type}/sync        - 手動同期トリガ
  GET  /admin/source-imports             - 直近のインポート履歴
  GET  /admin/pending-merges             - 人手レビュー待ちマージ候補
  POST /admin/pending-merges/{id}/decision - approve/reject
  GET  /admin/shrines/{shrine_id}/sources - 神社1件の全ソースレコード
  PATCH /admin/shrines/{shrine_id}/publish - published_status の変更
  GET  /admin/freshness-summary          - 鮮度サマリ（fresh/aging/stale件数）

設計方針:
  - 大量処理は BackgroundTasks で逃がす（Places 等の remote 呼出が長い）
  - 書込は必ず SourceImport ログに紐付けて監査できる状態にする
  - 手動同期は triggered_by="admin" で記録
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session

from database import get_db
from models import (
    Spot,
    ShrineSourceRecord,
    SourceImport,
    PendingMerge,
    StatsReference,
)
from services.sources import registry
from services.sources.source_priority import PRIORITY, NON_PERSISTABLE
from services.sources.repository import ShrineRepository
from services.sources.sync_runner import run_import


log = logging.getLogger("admin.sources")
router = APIRouter(prefix="/admin", tags=["admin:sources"])


# ---------- Schemas ----------

class SourceInfo(BaseModel):
    source_type: str
    display_name: str
    priority: int
    default_confidence: int
    allow_persist: bool
    non_persistable_raw: bool
    health_ok: bool
    health_message: str
    last_import_at: str | None = None
    last_import_status: str | None = None
    last_inserted: int | None = None
    last_updated: int | None = None
    last_failed: int | None = None
    record_count: int


class SourceImportOut(BaseModel):
    id: int
    source_type: str
    started_at: str
    finished_at: str | None
    status: str
    inserted: int
    updated: int
    skipped: int
    failed: int
    error_message: str | None
    triggered_by: str | None


class SyncTriggerIn(BaseModel):
    # OSM は bbox 必須、MLIT/GSI/Jinjacho は file_path、Places は query+lat/lng
    bbox: tuple[float, float, float, float] | None = None
    file_path: str | None = None
    query: str | None = None
    lat: float | None = None
    lng: float | None = None
    radius_m: float | None = None
    limit: int | None = None
    triggered_by: str = "admin"


class SyncTriggerOut(BaseModel):
    source_type: str
    status: Literal["queued"] = "queued"
    source_import_id: int


class PendingMergeOut(BaseModel):
    id: int
    primary_shrine_id: int
    primary_name: str
    candidate_shrine_id: int
    candidate_name: str
    match_score: float
    match_reasons: str | None
    status: str
    created_at: str
    reviewed_at: str | None


class MergeDecisionIn(BaseModel):
    decision: Literal["approve", "reject"]
    reviewer_user_id: int | None = None


class ShrineSourceRecordOut(BaseModel):
    id: int
    source_type: str
    source_object_id: str | None
    source_name: str | None
    source_address: str | None
    source_lat: float | None
    source_lng: float | None
    source_url: str | None
    fetched_at: str | None
    match_status: str
    match_score: float | None
    # raw は places 等 NON_PERSISTABLE では None


class PublishIn(BaseModel):
    published_status: Literal["published", "draft", "hidden", "merged"]


class FreshnessSummary(BaseModel):
    total: int
    fresh: int
    aging: int
    stale: int
    unknown: int
    last_synced_p50: str | None
    last_synced_p99: str | None


class StatsReferenceOut(BaseModel):
    id: int
    source_name: str
    source_url: str | None
    reference_year: int
    reference_as_of: str | None
    metric_key: str
    metric_value: int
    note: str | None
    published_at: str | None


# ---------- Helpers ----------

def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _latest_import(db: Session, source_type: str) -> SourceImport | None:
    stmt = (
        select(SourceImport)
        .where(SourceImport.source_type == source_type)
        .order_by(desc(SourceImport.started_at))
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none()


def _count_records(db: Session, source_type: str) -> int:
    stmt = (
        select(func.count(ShrineSourceRecord.id))
        .where(ShrineSourceRecord.source_type == source_type)
    )
    return int(db.execute(stmt).scalar() or 0)


# ---------- Endpoints ----------

@router.get("/sources", response_model=list[SourceInfo])
def list_sources(db: Session = Depends(get_db)) -> list[SourceInfo]:
    """登録済みソースの一覧。優先度・健全性・最終同期状態を返す。"""
    out: list[SourceInfo] = []
    for src in registry.list():
        ok, msg = src.health_check()
        last = _latest_import(db, src.source_type)
        out.append(
            SourceInfo(
                source_type=src.source_type,
                display_name=src.display_name,
                priority=PRIORITY.get(src.source_type, 0),
                default_confidence=src.default_confidence,
                allow_persist=src.allow_persist,
                non_persistable_raw=src.source_type in NON_PERSISTABLE,
                health_ok=ok,
                health_message=msg,
                last_import_at=last.started_at if last else None,
                last_import_status=last.status if last else None,
                last_inserted=last.inserted if last else None,
                last_updated=last.updated if last else None,
                last_failed=last.failed if last else None,
                record_count=_count_records(db, src.source_type),
            )
        )
    # priority desc で並べる
    out.sort(key=lambda x: -x.priority)
    return out


@router.post("/sources/{source_type}/sync", response_model=SyncTriggerOut)
def trigger_sync(
    source_type: str,
    body: SyncTriggerIn,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
) -> SyncTriggerOut:
    """手動同期トリガ。BackgroundTasks で非同期実行し、
    source_imports 行を先に作って ID を返す。進捗は /admin/source-imports で追跡。"""
    if not registry.has(source_type):
        raise HTTPException(status_code=404, detail=f"unknown source: {source_type}")

    # 前もって "running" ログを作成（実行本体は background で継続書き込み）
    placeholder = SourceImport(
        source_type=source_type,
        started_at=_now(),
        status="queued",
        triggered_by=body.triggered_by or "admin",
    )
    db.add(placeholder)
    db.commit()
    db.refresh(placeholder)
    placeholder_id = placeholder.id

    kwargs: dict[str, Any] = {}
    if body.bbox is not None:
        kwargs["bbox"] = body.bbox
    if body.file_path:
        kwargs["file_path"] = body.file_path
    if body.query is not None:
        kwargs["query"] = body.query
    if body.lat is not None:
        kwargs["lat"] = body.lat
    if body.lng is not None:
        kwargs["lng"] = body.lng
    if body.radius_m is not None:
        kwargs["radius_m"] = body.radius_m
    if body.limit is not None:
        kwargs["limit"] = body.limit

    def _runner(placeholder_id: int, kwargs: dict[str, Any]) -> None:
        # BackgroundTasks 内では新しい DB セッションを作って明示制御する
        from database import SessionLocal  # type: ignore
        sess = SessionLocal()
        try:
            # 既存 placeholder を削除してから本番の run_import に任せる
            old = sess.get(SourceImport, placeholder_id)
            if old is not None:
                sess.delete(old)
                sess.commit()
            run_import(sess, source_type, triggered_by=body.triggered_by or "admin", **kwargs)
        except Exception as e:  # pragma: no cover (背景タスクの last-resort)
            log.exception("sync failed: source=%s err=%s", source_type, e)
        finally:
            sess.close()

    background.add_task(_runner, placeholder_id, kwargs)
    return SyncTriggerOut(source_type=source_type, source_import_id=placeholder_id)


@router.get("/source-imports", response_model=list[SourceImportOut])
def list_source_imports(
    source_type: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[SourceImportOut]:
    stmt = select(SourceImport).order_by(desc(SourceImport.started_at)).limit(limit)
    if source_type:
        stmt = stmt.where(SourceImport.source_type == source_type)
    if status:
        stmt = stmt.where(SourceImport.status == status)
    rows = list(db.execute(stmt).scalars())
    return [
        SourceImportOut(
            id=r.id,
            source_type=r.source_type,
            started_at=r.started_at,
            finished_at=r.finished_at,
            status=r.status,
            inserted=r.inserted,
            updated=r.updated,
            skipped=r.skipped,
            failed=r.failed,
            error_message=r.error_message,
            triggered_by=r.triggered_by,
        )
        for r in rows
    ]


@router.get("/pending-merges", response_model=list[PendingMergeOut])
def list_pending_merges(
    status: str = Query("pending"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[PendingMergeOut]:
    stmt = (
        select(PendingMerge)
        .where(PendingMerge.status == status)
        .order_by(desc(PendingMerge.match_score), desc(PendingMerge.created_at))
        .limit(limit)
    )
    rows = list(db.execute(stmt).scalars())
    if not rows:
        return []
    ids = {r.primary_shrine_id for r in rows} | {r.candidate_shrine_id for r in rows}
    spots = {s.id: s for s in db.execute(select(Spot).where(Spot.id.in_(ids))).scalars()}
    return [
        PendingMergeOut(
            id=r.id,
            primary_shrine_id=r.primary_shrine_id,
            primary_name=spots[r.primary_shrine_id].name if r.primary_shrine_id in spots else "(missing)",
            candidate_shrine_id=r.candidate_shrine_id,
            candidate_name=spots[r.candidate_shrine_id].name if r.candidate_shrine_id in spots else "(missing)",
            match_score=r.match_score,
            match_reasons=r.match_reasons,
            status=r.status,
            created_at=r.created_at,
            reviewed_at=r.reviewed_at,
        )
        for r in rows
    ]


@router.post("/pending-merges/{merge_id}/decision")
def decide_pending_merge(
    merge_id: int,
    body: MergeDecisionIn,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    row = db.get(PendingMerge, merge_id)
    if not row:
        raise HTTPException(status_code=404, detail="pending merge not found")
    if row.status != "pending":
        raise HTTPException(status_code=400, detail=f"already decided: {row.status}")

    row.status = "approved" if body.decision == "approve" else "rejected"
    row.reviewer_user_id = body.reviewer_user_id
    row.reviewed_at = _now()

    if body.decision == "approve":
        # candidate の source records を primary に付け替え、candidate を merged に。
        # canonical 値は primary を優先のまま（高優先 source が取り込まれた際に自動更新される）。
        db.execute(
            ShrineSourceRecord.__table__.update()
            .where(ShrineSourceRecord.shrine_id == row.candidate_shrine_id)
            .values(shrine_id=row.primary_shrine_id, match_status="matched")
        )
        cand = db.get(Spot, row.candidate_shrine_id)
        if cand is not None:
            cand.published_status = "merged"
    db.commit()
    return {"id": merge_id, "status": row.status}


@router.get("/shrines/{shrine_id}/sources", response_model=list[ShrineSourceRecordOut])
def list_shrine_sources(
    shrine_id: int,
    db: Session = Depends(get_db),
) -> list[ShrineSourceRecordOut]:
    if not db.get(Spot, shrine_id):
        raise HTTPException(status_code=404, detail="shrine not found")
    repo = ShrineRepository(db)
    records = repo.list_source_records(shrine_id)
    return [
        ShrineSourceRecordOut(
            id=r.id,
            source_type=r.source_type,
            source_object_id=r.source_object_id,
            source_name=r.source_name,
            source_address=r.source_address,
            source_lat=r.source_lat,
            source_lng=r.source_lng,
            source_url=r.source_url,
            fetched_at=r.fetched_at,
            match_status=r.match_status,
            match_score=r.match_score,
        )
        for r in records
    ]


@router.patch("/shrines/{shrine_id}/publish")
def patch_publish_status(
    shrine_id: int,
    body: PublishIn,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    spot = db.get(Spot, shrine_id)
    if not spot:
        raise HTTPException(status_code=404, detail="shrine not found")
    spot.published_status = body.published_status
    db.commit()
    return {"id": shrine_id, "published_status": spot.published_status}


@router.get("/freshness-summary", response_model=FreshnessSummary)
def freshness_summary(db: Session = Depends(get_db)) -> FreshnessSummary:
    total = db.query(func.count(Spot.id)).scalar() or 0
    counts: dict[str, int] = {"fresh": 0, "aging": 0, "stale": 0, "unknown": 0}
    for status, n in db.query(Spot.data_freshness_status, func.count(Spot.id)).group_by(Spot.data_freshness_status):
        key = status or "unknown"
        counts[key if key in counts else "unknown"] += int(n)
    # p50 / p99 はざっくり median / 99p を ORDER BY で算出
    synced = [r[0] for r in db.query(Spot.last_synced_at).filter(Spot.last_synced_at.isnot(None)).order_by(Spot.last_synced_at).all()]
    p50 = synced[len(synced) // 2] if synced else None
    p99 = synced[max(0, int(len(synced) * 0.99) - 1)] if synced else None
    return FreshnessSummary(
        total=int(total),
        fresh=counts["fresh"],
        aging=counts["aging"],
        stale=counts["stale"],
        unknown=counts["unknown"],
        last_synced_p50=p50,
        last_synced_p99=p99,
    )


# ---------- 公開: stats references ----------

public_router = APIRouter(tags=["stats"])


@public_router.get("/stats/references", response_model=list[StatsReferenceOut])
def list_stats_references(db: Session = Depends(get_db)) -> list[StatsReferenceOut]:
    rows = list(
        db.execute(
            select(StatsReference).order_by(desc(StatsReference.reference_year), StatsReference.metric_key)
        ).scalars()
    )
    return [
        StatsReferenceOut(
            id=r.id,
            source_name=r.source_name,
            source_url=r.source_url,
            reference_year=r.reference_year,
            reference_as_of=r.reference_as_of,
            metric_key=r.metric_key,
            metric_value=r.metric_value,
            note=r.note,
            published_at=r.published_at,
        )
        for r in rows
    ]
