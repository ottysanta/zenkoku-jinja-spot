import json
import shutil
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, Header, Query, Depends, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from config import (
    DEFAULT_SEARCH_RADIUS_M,
    MAX_NEARBY_RESULTS,
    CHECKIN_MAX_DISTANCE_M,
    CHECKIN_MIN_ACCURACY_M,
    CHECKIN_COOLDOWN_SEC,
)
from database import init_db, get_db
from models import (
    Spot, UserPost, SpotSubmission, Checkin,
    User, AuthIdentity,
    Review, Reaction, Follow, Notification, Report,
    OfferingItem, Offering, Campaign, CampaignContribution,
    ShrineBookmark,
)
from schemas import (
    SpotOut,
    SpotWithDistance,
    ShrineFacetResponse,
    UserPostOut,
    SpotSubmissionOut,
    CheckinIn,
    CheckinOut,
    CheckinStats,
    UserOut,
    SessionIssueIn,
    SessionIssueOut,
    ReviewIn,
    ReviewOut,
    ReviewAggregate,
    ReactionIn,
    ReactionOut,
    NotificationOut,
    ReportIn,
    OfferingItemOut,
    OfferingCheckoutIn,
    OfferingCheckoutOut,
    OfferingOut,
    BookmarkIn,
    BookmarkOut,
    BookmarkStatusMap,
)
from services.geo import haversine
from auth import (
    create_session,
    get_current_user,
    get_current_user_optional,
    require_bridge_secret,
    revoke_session_by_token,
)

UPLOADS_DIR = Path(__file__).parent / "uploads"
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    UPLOADS_DIR.mkdir(exist_ok=True)
    init_db()
    yield


app = FastAPI(
    title="全国神社スポット API",
    description="神社参拝・現在地連動マップ",
    version="1.0.0",
    lifespan=lifespan,
)

# マルチソース管理 API（Phase 1a+）を登録
from admin_sources import router as _admin_sources_router, public_router as _stats_public_router  # noqa: E402
app.include_router(_admin_sources_router)
app.include_router(_stats_public_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


def _apply_filters(query, prefecture, shrine_type, benefit, rank, goshuin):
    if prefecture:
        query = query.filter(Spot.prefecture == prefecture)
    if shrine_type:
        query = query.filter(Spot.shrine_type == shrine_type)
    if benefit:
        # benefits は JSON 配列文字列。LIKE で簡易フィルタ
        query = query.filter(Spot.benefits.ilike(f"%{benefit}%"))
    if rank:
        query = query.filter(Spot.shrine_rank == rank)
    if goshuin is not None:
        query = query.filter(Spot.goshuin_available == goshuin)
    return query


@app.get("/health")
def health():
    return {"status": "ok", "app": "全国神社スポット"}


@app.get("/spots/nearby", response_model=list[SpotWithDistance])
def nearby_spots(
    lat: float = Query(..., description="現在地 緯度"),
    lng: float = Query(..., description="現在地 経度"),
    radius: float = Query(DEFAULT_SEARCH_RADIUS_M, description="検索半径 (メートル)"),
    prefecture: Optional[str] = Query(None),
    shrine_type: Optional[str] = Query(None),
    benefit: Optional[str] = Query(None),
    rank: Optional[str] = Query(None),
    goshuin: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    query = _apply_filters(db.query(Spot), prefecture, shrine_type, benefit, rank, goshuin)

    results: list[SpotWithDistance] = []
    for spot in query.all():
        dist = haversine(lat, lng, spot.lat, spot.lng)
        if dist <= radius:
            s = SpotWithDistance.model_validate(spot)
            s.distance_meters = round(dist)
            results.append(s)

    results.sort(key=lambda x: x.distance_meters or 0)
    return results[:MAX_NEARBY_RESULTS]


@app.get("/spots", response_model=list[SpotOut])
def all_spots(
    prefecture: Optional[str] = Query(None),
    shrine_type: Optional[str] = Query(None),
    benefit: Optional[str] = Query(None),
    rank: Optional[str] = Query(None),
    goshuin: Optional[bool] = Query(None),
    bbox: Optional[str] = Query(
        None, description="ビューポート min_lng,min_lat,max_lng,max_lat"
    ),
    limit: int = Query(5000, le=50000, ge=1),
    featured_only: bool = Query(
        False, description="True なら source_layer=manual のみ（全景表示用）"
    ),
    db: Session = Depends(get_db),
):
    query = _apply_filters(db.query(Spot), prefecture, shrine_type, benefit, rank, goshuin)
    if featured_only:
        query = query.filter(Spot.source_layer == "manual")
    if bbox:
        try:
            min_lng, min_lat, max_lng, max_lat = [float(x) for x in bbox.split(",")]
            query = query.filter(
                Spot.lng >= min_lng, Spot.lng <= max_lng,
                Spot.lat >= min_lat, Spot.lat <= max_lat,
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="bbox format error")
    # 優先: manual（詳細あり） → wikidata → osm、その後 id 順
    from sqlalchemy import case
    priority = case(
        (Spot.source_layer == "manual", 0),
        (Spot.source_layer == "wikidata", 1),
        else_=2,
    )
    query = query.order_by(priority, Spot.id)
    return query.limit(limit).all()


# ---------------------------------------------------------------------------
# 管理用（ローカル開発のみ使用）: 一括インポート & Wikipedia エンリッチ
# ---------------------------------------------------------------------------
from pydantic import BaseModel as _PydanticBaseModel
from typing import List as _List
import urllib.parse as _urlparse
import urllib.request as _urlreq
import urllib.error as _urlerr


class _BulkShrineIn(_PydanticBaseModel):
    external_id: str
    name: str
    lat: float
    lng: float
    address: Optional[str] = None
    prefecture: Optional[str] = None
    shrine_type: Optional[str] = None
    website: Optional[str] = None
    wikipedia_title: Optional[str] = None
    source_url: Optional[str] = None


class _BulkImportIn(_PydanticBaseModel):
    shrines: _List[_BulkShrineIn]
    source_layer: str = "osm"


@app.post("/admin/bulk-import-shrines")
def bulk_import_shrines(body: _BulkImportIn, db: Session = Depends(get_db)):
    """OSM など外部ソースから取得した神社を一括投入。
    既存 external_id は UPDATE、無ければ INSERT。
    開発用ローカル運用前提で認証なし（本番デプロイ前に要ガード）。
    """
    inserted = 0
    updated = 0
    for s in body.shrines:
        payload = dict(
            external_id=s.external_id,
            name=s.name,
            lat=s.lat,
            lng=s.lng,
            address=s.address,
            prefecture=s.prefecture,
            shrine_type=s.shrine_type,
            website=s.website,
            wikipedia_title=s.wikipedia_title,
            source_url=s.source_url,
            source_layer=body.source_layer,
        )
        existing = db.query(Spot).filter(Spot.external_id == s.external_id).first()
        if existing:
            for k, v in payload.items():
                # 既存の manual データを osm で上書きしないように source_layer が優先度低なら skip
                if existing.source_layer == "manual" and body.source_layer != "manual":
                    continue
                if v is None and getattr(existing, k, None):
                    continue
                setattr(existing, k, v)
            updated += 1
        else:
            db.add(Spot(**payload))
            inserted += 1
    db.commit()
    total = db.query(Spot).count()
    return {"inserted": inserted, "updated": updated, "total_spots": total}


def _extract_wiki_title(source_url: Optional[str]) -> Optional[str]:
    if not source_url:
        return None
    if "wikipedia.org/wiki/" not in source_url:
        return None
    try:
        path = source_url.split("/wiki/", 1)[1].split("#", 1)[0].split("?", 1)[0]
        return _urlparse.unquote(path)
    except Exception:
        return None


def _fetch_wikipedia_summary(title: str, lang: str = "ja") -> Optional[dict]:
    url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{_urlparse.quote(title, safe='')}"
    req = _urlreq.Request(url, headers={
        "User-Agent": "ZenkokuJinjaSpot/0.1 (https://github.com/local-dev) Python-urllib",
        "Accept": "application/json",
    })
    try:
        with _urlreq.urlopen(req, timeout=15) as r:
            import json as _json
            return _json.loads(r.read().decode("utf-8"))
    except _urlerr.HTTPError as e:
        if e.code == 404:
            return None
        return None
    except Exception:
        return None


@app.post("/admin/enrich-wikipedia")
def enrich_wikipedia(
    limit: int = Query(200, le=2000),
    only_missing: bool = Query(True, description="True: description が無い spot だけ対象"),
    db: Session = Depends(get_db),
):
    """各 spot の source_url または name から ja.wikipedia を引いて description/photo_url 等を充填。"""
    q = db.query(Spot)
    if only_missing:
        q = q.filter((Spot.description == None) | (Spot.description == ""))  # noqa: E711
    q = q.order_by(Spot.source_layer, Spot.id).limit(limit)

    enriched = 0
    skipped = 0
    for spot in q.all():
        title = spot.wikipedia_title or _extract_wiki_title(spot.source_url) or spot.name
        if not title:
            skipped += 1
            continue
        data = _fetch_wikipedia_summary(title)
        if not data or data.get("type") in ("disambiguation",):
            skipped += 1
            continue
        extract = data.get("extract") or ""
        thumb = (data.get("thumbnail") or {}).get("source")
        originalimage = (data.get("originalimage") or {}).get("source")
        content_urls = data.get("content_urls") or {}
        page_url = (content_urls.get("desktop") or {}).get("page") or f"https://ja.wikipedia.org/wiki/{_urlparse.quote(title)}"

        if extract:
            spot.description = extract
        if thumb and not spot.photo_url:
            spot.photo_url = originalimage or thumb
            spot.photo_attribution = "Wikipedia / Wikimedia Commons"
        spot.wikipedia_title = title
        spot.wikipedia_url = page_url
        enriched += 1
    db.commit()
    return {"enriched": enriched, "skipped": skipped}


@app.get("/admin/db-stats")
def admin_db_stats(db: Session = Depends(get_db)):
    total = db.query(Spot).count()
    by_layer: dict[str, int] = {}
    for row in db.query(Spot.source_layer).all():
        k = row[0] or "unknown"
        by_layer[k] = by_layer.get(k, 0) + 1
    with_photo = db.query(Spot).filter(Spot.photo_url != None, Spot.photo_url != "").count()  # noqa: E711
    with_desc = db.query(Spot).filter(Spot.description != None, Spot.description != "").count()  # noqa: E711
    return {
        "total": total,
        "by_source_layer": by_layer,
        "with_photo": with_photo,
        "with_description": with_desc,
    }


@app.get("/spots/{spot_id}", response_model=SpotOut)
def get_spot(spot_id: int, db: Session = Depends(get_db)):
    spot = db.query(Spot).filter(Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    return spot


# ===== 検索（神社名 / ご利益 / 祭神） =====

@app.get("/search", response_model=list[SpotOut])
def search_shrines(
    q: Optional[str] = Query(None, description="神社名・住所の部分一致（大小文字無視）"),
    benefit: Optional[str] = Query(None, description="ご利益の部分一致（benefits JSON 内）"),
    deity: Optional[str] = Query(None, description="祭神の部分一致"),
    prefecture: Optional[str] = Query(None, description="都道府県完全一致"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """神社名・ご利益・祭神で横断検索する。

    - q / benefit / deity のいずれも指定されていない場合は空配列を返す（全件ダンプ防止）。
    - merged 状態の spot は除外。
    - ORDER BY: confidence_score DESC NULLS LAST, id ASC
    """
    if not (q or benefit or deity):
        return []

    from sqlalchemy import func, or_, case

    query = db.query(Spot).filter(
        (Spot.published_status == None) | (Spot.published_status != "merged")  # noqa: E711
    )

    if q:
        # 一部 DB (SQLite) で ILIKE が無いため lower+contains で揃える
        ql = q.lower()
        query = query.filter(
            or_(
                func.lower(func.coalesce(Spot.name, "")).contains(ql),
                func.lower(func.coalesce(Spot.canonical_name, "")).contains(ql),
                func.lower(func.coalesce(Spot.address, "")).contains(ql),
            )
        )
    if benefit:
        # benefits は手入力 31 社しか埋まっていないので、
        # 「ご利益で探す」ボタンが大きな神社しか返さなくならないよう、
        # 祭神 / 神社名 のパターンからも推定する。
        benefit_hints: dict[str, list[str]] = {
            "商売繁盛": ["稲荷", "宇迦", "恵比寿", "大黒", "蛭子"],
            "金運": ["稲荷", "大黒", "弁財天", "市杵島"],
            "縁結び": ["大国主", "出雲", "大神", "八重垣", "氷川"],
            "恋愛成就": ["大国主", "出雲", "八重垣"],
            "夫婦円満": ["伊弉諾", "伊弉冉", "白山"],
            "子宝": ["木花咲耶", "浅間"],
            "安産": ["木花咲耶", "水天宮", "浅間"],
            "合格祈願": ["天満", "天神", "菅原道真"],
            "学業成就": ["天満", "天神", "菅原道真"],
            "技芸上達": ["弁財天", "市杵島", "芸能"],
            "健康": ["少彦名", "薬"],
            "病気平癒": ["少彦名", "薬師", "医療"],
            "長寿": ["少彦名", "老"],
            "厄除け": ["八坂", "素戔嗚", "須佐之男", "牛頭"],
            "災難除け": ["八坂", "素戔嗚", "猿田彦"],
            "交通安全": ["猿田彦", "道祖神", "塞"],
            "旅行安全": ["猿田彦", "金刀比羅", "金毘羅"],
            "勝負運": ["八幡", "諏訪", "鹿島", "香取"],
            "必勝祈願": ["八幡", "鹿島", "香取"],
            "出世": ["八幡", "愛宕"],
            "仕事運": ["稲荷", "八幡"],
            "家内安全": ["産土", "氏神"],
            "方位除け": ["方位", "八将神"],
            "五穀豊穣": ["稲荷", "宇迦", "豊受"],
            "海上安全": ["住吉", "金刀比羅", "金毘羅", "宗像"],
            "防火": ["愛宕", "秋葉", "火産霊"],
        }
        hints = benefit_hints.get(benefit, [])
        # benefits JSON に直接含む OR deity/name に関連キーワードを含む
        conds = [Spot.benefits.contains(benefit)]
        for h in hints:
            conds.append(Spot.deity.contains(h))
            conds.append(Spot.name.contains(h))
            conds.append(Spot.canonical_name.contains(h))
        query = query.filter(or_(*conds))
    if deity:
        query = query.filter(Spot.deity.contains(deity))
    if prefecture:
        query = query.filter(Spot.prefecture == prefecture)

    # ORDER BY:
    #   - q (神社名検索) のみ: confidence_score DESC（関連性優先）で有名神社を先頭に
    #   - benefit / deity / prefecture 等のカテゴリ検索: id ASC（有名神社に偏らず多様な結果）
    #     → ユーザーが「ご利益で探す」と押した時、大きな神社ばかり出るのを避ける。
    if q and not (benefit or deity):
        null_rank = case((Spot.confidence_score == None, 1), else_=0)  # noqa: E711
        query = query.order_by(null_rank.asc(), Spot.confidence_score.desc(), Spot.id.asc())
    else:
        query = query.order_by(Spot.id.asc())

    return query.offset(offset).limit(limit).all()


# ===== 公開詳細ページ（/shrines/{slug}） =====

@app.get("/shrines", response_model=list[SpotOut])
def list_shrines_for_ssg(
    limit: int = Query(500, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """SSG / sitemap 用の一覧。slug が無い spots も含めて返す（Web 側で spot-{id} に落ちる）。"""
    return (
        db.query(Spot)
        .order_by(Spot.id.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@app.get("/shrines/{slug}", response_model=SpotOut)
def get_shrine_by_slug(slug: str, db: Session = Depends(get_db)):
    """slug で神社を取得。slug='spot-{id}' という暗黙フォールバックにも対応。"""
    spot = db.query(Spot).filter(Spot.slug == slug).first()
    if spot:
        return spot
    if slug.startswith("spot-"):
        try:
            sid = int(slug[len("spot-"):])
        except ValueError:
            sid = None
        if sid is not None:
            spot = db.query(Spot).filter(Spot.id == sid).first()
            if spot:
                return spot
    raise HTTPException(status_code=404, detail="Shrine not found")


# ===== ユーザー投稿 =====

@app.get("/spots/{spot_id}/posts", response_model=list[UserPostOut])
def get_spot_posts(spot_id: int, db: Session = Depends(get_db)):
    return (
        db.query(UserPost)
        .filter(UserPost.spot_id == spot_id)
        .order_by(UserPost.id.desc())
        .all()
    )


@app.post("/spots/{spot_id}/posts", response_model=UserPostOut)
async def create_spot_post(
    spot_id: int,
    file: UploadFile = File(...),
    comment: str = Form(""),
    nickname: str = Form(""),
    db: Session = Depends(get_db),
):
    if not db.query(Spot).filter(Spot.id == spot_id).first():
        raise HTTPException(status_code=404, detail="Spot not found")

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail="画像ファイル（jpg/png/gif/webp）のみアップロード可能です")

    filename = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOADS_DIR / filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    post = UserPost(
        spot_id=spot_id,
        image_path=f"/uploads/{filename}",
        description=comment.strip() or None,
        nickname=nickname.strip() or None,
        created_at=datetime.now().isoformat(),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


# ===== 新規神社申請 =====

@app.post("/spot-submissions", response_model=SpotSubmissionOut)
async def create_spot_submission(
    name: str = Form(...),
    address: str = Form(""),
    shrine_type: str = Form(""),
    description: str = Form(""),
    nickname: str = Form(""),
    file: Optional[UploadFile] = File(default=None),
    db: Session = Depends(get_db),
):
    image_path = None
    if file and file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTS:
            raise HTTPException(status_code=400, detail="画像ファイル（jpg/png/gif/webp）のみアップロード可能です")
        filename = f"sub_{uuid.uuid4().hex}{ext}"
        dest = UPLOADS_DIR / filename
        with dest.open("wb") as f:
            shutil.copyfileobj(file.file, f)
        image_path = f"/uploads/{filename}"

    sub = SpotSubmission(
        name=name.strip(),
        address=address.strip() or None,
        shrine_type=shrine_type.strip() or None,
        description=description.strip() or None,
        image_path=image_path,
        nickname=nickname.strip() or None,
        created_at=datetime.now().isoformat(),
        status="pending",
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


# ===== 参拝チェックイン =====

WISH_TYPES = {"gratitude", "vow", "milestone", "thanks", "other"}


@app.post("/spots/{spot_id}/checkins", response_model=CheckinOut)
def create_checkin(spot_id: int, payload: CheckinIn, db: Session = Depends(get_db)):
    spot = db.query(Spot).filter(Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    if not payload.client_id or len(payload.client_id) < 8:
        raise HTTPException(status_code=400, detail="client_id が不正です")

    # GPS精度の検証（無限大・極端に粗い測位を弾く）
    if payload.accuracy_m is not None and payload.accuracy_m > CHECKIN_MIN_ACCURACY_M:
        raise HTTPException(
            status_code=400,
            detail=f"GPS精度が不十分です（{int(payload.accuracy_m)}m）。空の見える場所で再度お試しください。",
        )

    # サーバー側で距離を再計算（クライアント値は信用しない）
    dist = haversine(payload.lat, payload.lng, spot.lat, spot.lng)
    if dist > CHECKIN_MAX_DISTANCE_M:
        raise HTTPException(
            status_code=400,
            detail=f"神社から {int(dist)}m 離れています。境内に近づいてから再度お試しください。",
        )

    # クールダウン（同一 client × 同一神社の連続チェックイン防止）
    since = (datetime.now() - timedelta(seconds=CHECKIN_COOLDOWN_SEC)).isoformat()
    recent = (
        db.query(Checkin)
        .filter(
            Checkin.spot_id == spot_id,
            Checkin.client_id == payload.client_id,
            Checkin.created_at >= since,
        )
        .first()
    )
    if recent:
        raise HTTPException(status_code=409, detail="本日は既にこの神社で参拝を記録されています。")

    # 願いタイプのバリデーション
    wish = payload.wish_type if payload.wish_type in WISH_TYPES else None

    ci = Checkin(
        spot_id=spot_id,
        client_id=payload.client_id.strip(),
        lat=payload.lat,
        lng=payload.lng,
        accuracy_m=payload.accuracy_m,
        distance_m=round(dist, 2),
        wish_type=wish,
        comment=(payload.comment or "").strip()[:280] or None,
        nickname=(payload.nickname or "").strip()[:30] or None,
        created_at=datetime.now().isoformat(),
    )
    db.add(ci)
    db.commit()
    db.refresh(ci)
    return ci


@app.get("/spots/{spot_id}/checkins", response_model=list[CheckinOut])
def list_spot_checkins(spot_id: int, limit: int = 20, db: Session = Depends(get_db)):
    limit = max(1, min(limit, 100))
    return (
        db.query(Checkin)
        .filter(Checkin.spot_id == spot_id)
        .order_by(Checkin.id.desc())
        .limit(limit)
        .all()
    )


@app.get("/spots/{spot_id}/checkin-stats", response_model=CheckinStats)
def spot_checkin_stats(spot_id: int, db: Session = Depends(get_db)):
    q = db.query(Checkin).filter(Checkin.spot_id == spot_id)
    total = q.count()
    month_prefix = datetime.now().strftime("%Y-%m")
    month = q.filter(Checkin.created_at.like(f"{month_prefix}%")).count()
    unique_visitors = (
        db.query(Checkin.client_id)
        .filter(Checkin.spot_id == spot_id)
        .distinct()
        .count()
    )
    last = q.order_by(Checkin.id.desc()).first()
    return CheckinStats(
        total=total,
        month=month,
        unique_visitors=unique_visitors,
        last_at=last.created_at if last else None,
    )


@app.get("/me/checkins", response_model=list[CheckinOut])
def my_checkins(client_id: str = Query(..., min_length=8), limit: int = 50, db: Session = Depends(get_db)):
    limit = max(1, min(limit, 200))
    return (
        db.query(Checkin)
        .filter(Checkin.client_id == client_id)
        .order_by(Checkin.id.desc())
        .limit(limit)
        .all()
    )


@app.get("/shrine-facets", response_model=ShrineFacetResponse)
def list_shrine_facets(db: Session = Depends(get_db)):
    rows = db.query(Spot.prefecture, Spot.shrine_type, Spot.shrine_rank, Spot.benefits).all()
    prefectures: set[str] = set()
    shrine_types: set[str] = set()
    ranks: set[str] = set()
    benefits: set[str] = set()
    for pref, stype, rank, benefits_json in rows:
        if pref:
            prefectures.add(pref)
        if stype:
            shrine_types.add(stype)
        if rank:
            ranks.add(rank)
        if benefits_json:
            try:
                arr = json.loads(benefits_json)
                if isinstance(arr, list):
                    for b in arr:
                        if isinstance(b, str) and b.strip():
                            benefits.add(b.strip())
            except (ValueError, TypeError):
                pass
    return ShrineFacetResponse(
        prefectures=sorted(prefectures),
        shrine_types=sorted(shrine_types),
        benefits=sorted(benefits),
        ranks=sorted(ranks),
    )


# ===================== 認証 =====================

@app.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    """ログイン中のユーザー情報。未ログインは 401。"""
    return current


@app.post("/auth/sessions", response_model=SessionIssueOut)
def issue_api_session(
    payload: SessionIssueIn,
    _: None = Depends(require_bridge_secret),
    db: Session = Depends(get_db),
):
    """Next.js (Auth.js) から呼ばれ、provider 認証済のユーザーに対して API 用セッションを発行する。

    - auth_identities を (provider, provider_account_id) で upsert
    - 対応する users を作成 or 取得
    - セッショントークンを発行（平文は 1 度だけ返す）
    """
    now_iso = datetime.utcnow().isoformat() + "Z"

    identity = (
        db.query(AuthIdentity)
        .filter(
            AuthIdentity.provider == payload.provider,
            AuthIdentity.provider_account_id == payload.provider_account_id,
        )
        .first()
    )

    if identity:
        user = db.query(User).filter(User.id == identity.user_id).first()
        if not user:
            raise HTTPException(status_code=500, detail="orphan auth identity")
        # プロフィール情報は「空 → 新値」「明示的に変わった」時のみ更新
        changed = False
        if payload.display_name and payload.display_name != user.display_name:
            user.display_name = payload.display_name
            changed = True
        if payload.avatar_url and payload.avatar_url != user.avatar_url:
            user.avatar_url = payload.avatar_url
            changed = True
        if payload.email and not user.email:
            user.email = payload.email
            changed = True
        if payload.locale and payload.locale != user.locale:
            user.locale = payload.locale
            changed = True
        if changed:
            user.updated_at = now_iso
            db.commit()
    else:
        # email 重複（別 provider で既登録）があればそちらに紐付ける
        user = None
        if payload.email:
            user = db.query(User).filter(User.email == payload.email).first()
        if not user:
            user = User(
                email=payload.email,
                display_name=payload.display_name,
                avatar_url=payload.avatar_url,
                locale=payload.locale or "ja",
                role="user",
                is_suspended=False,
                created_at=now_iso,
            )
            db.add(user)
            db.flush()
        identity = AuthIdentity(
            user_id=user.id,
            provider=payload.provider,
            provider_account_id=payload.provider_account_id,
            created_at=now_iso,
        )
        db.add(identity)
        db.commit()
        db.refresh(user)

    if user.is_suspended:
        raise HTTPException(status_code=403, detail="account suspended")

    raw_token, sess = create_session(db, user)
    return SessionIssueOut(
        token=raw_token,
        expires_at=sess.expires_at,
        user=UserOut.model_validate(user),
    )


@app.delete("/auth/sessions", status_code=204)
def revoke_api_session(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    """現在の Authorization: Bearer トークンを失効させる。未ログインでも 204（冪等）。"""
    if not authorization:
        return
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return
    revoke_session_by_token(db, parts[1].strip())
    return


# ===================== レビュー =====================

REACTION_KINDS = {"gratitude", "helpful", "peaceful", "inspiring"}
REACTION_TARGETS = {"review", "user_post", "checkin"}
REPORT_TARGETS = {"review", "user_post", "checkin", "user", "spot"}
REPORT_REASONS = {"spam", "harassment", "misinformation", "inappropriate", "other"}


def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _decorate_review(r: Review, user: Optional[User]) -> ReviewOut:
    return ReviewOut(
        id=r.id,
        user_id=r.user_id,
        spot_id=r.spot_id,
        score_atmosphere=r.score_atmosphere,
        score_manners=r.score_manners,
        score_access=r.score_access,
        score_facilities=r.score_facilities,
        score_overall=r.score_overall,
        body=r.body,
        visited_at=r.visited_at,
        locale=r.locale,
        created_at=r.created_at,
        updated_at=r.updated_at,
        author_name=(user.display_name if user else None) or (f"ユーザー#{r.user_id}"),
        author_avatar=user.avatar_url if user else None,
    )


@app.get("/spots/{spot_id}/reviews", response_model=list[ReviewOut])
def list_reviews(
    spot_id: int,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Review)
        .filter(Review.spot_id == spot_id, Review.is_hidden.is_(False))
        .order_by(Review.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    if not rows:
        return []
    authors = {
        u.id: u for u in db.query(User).filter(User.id.in_({r.user_id for r in rows})).all()
    }
    return [_decorate_review(r, authors.get(r.user_id)) for r in rows]


@app.get("/spots/{spot_id}/review-aggregate", response_model=ReviewAggregate)
def review_aggregate(spot_id: int, db: Session = Depends(get_db)):
    from sqlalchemy import func
    q = (
        db.query(
            func.count(Review.id),
            func.avg(Review.score_atmosphere),
            func.avg(Review.score_manners),
            func.avg(Review.score_access),
            func.avg(Review.score_facilities),
            func.avg(Review.score_overall),
        )
        .filter(Review.spot_id == spot_id, Review.is_hidden.is_(False))
    ).one()
    count, atm, man, acc, fac, ovr = q
    return ReviewAggregate(
        count=count or 0,
        avg_atmosphere=float(atm) if atm is not None else None,
        avg_manners=float(man) if man is not None else None,
        avg_access=float(acc) if acc is not None else None,
        avg_facilities=float(fac) if fac is not None else None,
        avg_overall=float(ovr) if ovr is not None else None,
    )


@app.post("/spots/{spot_id}/reviews", response_model=ReviewOut)
def upsert_review(
    spot_id: int,
    payload: ReviewIn,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.query(Spot).filter(Spot.id == spot_id).first():
        raise HTTPException(status_code=404, detail="Spot not found")

    # スコアは 0〜5 範囲
    for label, v in [
        ("atmosphere", payload.score_atmosphere),
        ("manners", payload.score_manners),
        ("access", payload.score_access),
        ("facilities", payload.score_facilities),
        ("overall", payload.score_overall),
    ]:
        if v is not None and (v < 0 or v > 5):
            raise HTTPException(status_code=422, detail=f"score_{label} must be between 0 and 5")

    existing = (
        db.query(Review)
        .filter(Review.user_id == current.id, Review.spot_id == spot_id)
        .first()
    )
    now = _now_iso()
    if existing:
        existing.score_atmosphere = payload.score_atmosphere
        existing.score_manners = payload.score_manners
        existing.score_access = payload.score_access
        existing.score_facilities = payload.score_facilities
        existing.score_overall = payload.score_overall
        existing.body = (payload.body or "").strip() or None
        existing.visited_at = payload.visited_at
        existing.locale = payload.locale or "ja"
        existing.updated_at = now
        db.commit()
        db.refresh(existing)
        return _decorate_review(existing, current)

    row = Review(
        user_id=current.id,
        spot_id=spot_id,
        score_atmosphere=payload.score_atmosphere,
        score_manners=payload.score_manners,
        score_access=payload.score_access,
        score_facilities=payload.score_facilities,
        score_overall=payload.score_overall,
        body=(payload.body or "").strip() or None,
        visited_at=payload.visited_at,
        locale=payload.locale or "ja",
        is_hidden=False,
        created_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _decorate_review(row, current)


@app.delete("/reviews/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(Review).filter(Review.id == review_id).first()
    if not row:
        return
    if row.user_id != current.id and current.role not in {"moderator", "admin"}:
        raise HTTPException(status_code=403, detail="forbidden")
    db.delete(row)
    db.commit()
    return


# ===================== リアクション =====================

@app.post("/reactions", response_model=ReactionOut)
def add_reaction(
    payload: ReactionIn,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.target_type not in REACTION_TARGETS:
        raise HTTPException(status_code=422, detail="invalid target_type")
    if payload.kind not in REACTION_KINDS:
        raise HTTPException(status_code=422, detail="invalid kind")
    # 重複は冪等 (user × target × kind の一意制約)
    existing = (
        db.query(Reaction)
        .filter(
            Reaction.user_id == current.id,
            Reaction.target_type == payload.target_type,
            Reaction.target_id == payload.target_id,
            Reaction.kind == payload.kind,
        )
        .first()
    )
    if existing:
        return existing
    row = Reaction(
        user_id=current.id,
        target_type=payload.target_type,
        target_id=payload.target_id,
        kind=payload.kind,
        created_at=_now_iso(),
    )
    db.add(row)
    # 通知: 対象が review なら作者に通知
    if payload.target_type == "review":
        rv = db.query(Review).filter(Review.id == payload.target_id).first()
        if rv and rv.user_id != current.id:
            db.add(Notification(
                user_id=rv.user_id,
                kind="reaction",
                payload=json.dumps({
                    "target_type": "review",
                    "target_id": rv.id,
                    "kind": payload.kind,
                    "from_user_id": current.id,
                }, ensure_ascii=False),
                is_read=False,
                created_at=_now_iso(),
            ))
    db.commit()
    db.refresh(row)
    return row


@app.delete("/reactions", status_code=204)
def remove_reaction(
    target_type: str = Query(...),
    target_id: int = Query(...),
    kind: str = Query(...),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = (
        db.query(Reaction)
        .filter(
            Reaction.user_id == current.id,
            Reaction.target_type == target_type,
            Reaction.target_id == target_id,
            Reaction.kind == kind,
        )
        .first()
    )
    if row:
        db.delete(row)
        db.commit()
    return


# ===================== フォロー =====================

@app.post("/follows/{user_id}", status_code=204)
def follow_user(
    user_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_id == current.id:
        raise HTTPException(status_code=422, detail="cannot follow yourself")
    if not db.query(User).filter(User.id == user_id).first():
        raise HTTPException(status_code=404, detail="user not found")
    existing = (
        db.query(Follow)
        .filter(Follow.follower_id == current.id, Follow.followee_id == user_id)
        .first()
    )
    if existing:
        return
    db.add(Follow(follower_id=current.id, followee_id=user_id, created_at=_now_iso()))
    db.add(Notification(
        user_id=user_id,
        kind="follow",
        payload=json.dumps({"from_user_id": current.id}, ensure_ascii=False),
        is_read=False,
        created_at=_now_iso(),
    ))
    db.commit()
    return


@app.delete("/follows/{user_id}", status_code=204)
def unfollow_user(
    user_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Follow).filter(
        Follow.follower_id == current.id,
        Follow.followee_id == user_id,
    ).delete(synchronize_session=False)
    db.commit()
    return


# ===================== 通知 =====================

@app.get("/notifications", response_model=list[NotificationOut])
def list_notifications(
    limit: int = Query(50, ge=1, le=200),
    unread_only: bool = False,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Notification).filter(Notification.user_id == current.id)
    if unread_only:
        q = q.filter(Notification.is_read.is_(False))
    return q.order_by(Notification.created_at.desc()).limit(limit).all()


@app.post("/notifications/read-all", status_code=204)
def mark_all_read(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == current.id,
        Notification.is_read.is_(False),
    ).update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return


@app.post("/notifications/{nid}/read", status_code=204)
def mark_read(
    nid: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(Notification).filter(
        Notification.id == nid,
        Notification.user_id == current.id,
    ).first()
    if row and not row.is_read:
        row.is_read = True
        db.commit()
    return


# ===================== 通報 =====================

@app.post("/reports", status_code=201)
def create_report(
    payload: ReportIn,
    current: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    if payload.target_type not in REPORT_TARGETS:
        raise HTTPException(status_code=422, detail="invalid target_type")
    if payload.reason not in REPORT_REASONS:
        raise HTTPException(status_code=422, detail="invalid reason")
    db.add(Report(
        reporter_user_id=current.id if current else None,
        reporter_client_id=payload.reporter_client_id,
        target_type=payload.target_type,
        target_id=payload.target_id,
        reason=payload.reason,
        detail=payload.detail,
        status="open",
        created_at=_now_iso(),
    ))
    db.commit()
    return {"ok": True}


# ===================== 奉納 (Offering / Stripe Checkout) =====================

OFFERING_MIN_JPY = 100
OFFERING_MAX_JPY = 1_000_000
OFFERING_ITEM_KINDS = {"hatsuhoryo", "ema", "omamori", "donation"}


@app.get("/spots/{spot_id}/offering-items", response_model=list[OfferingItemOut])
def list_offering_items(spot_id: int, db: Session = Depends(get_db)):
    return (
        db.query(OfferingItem)
        .filter(OfferingItem.spot_id == spot_id, OfferingItem.is_active.is_(True))
        .order_by(OfferingItem.sort_order.asc(), OfferingItem.id.asc())
        .all()
    )


@app.post("/spots/{spot_id}/offerings/checkout", response_model=OfferingCheckoutOut)
def create_offering_checkout(
    spot_id: int,
    payload: OfferingCheckoutIn,
    current: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Stripe Checkout セッションを発行し、Offering を pending で作成する。

    - 認証は任意（未ログインでも奉納可能だが匿名扱い）。
    - offering_item_id を指定した場合はそのアイテムの金額を使用。
    - そうでなければ payload.amount_jpy を使用（100〜1,000,000 JPY）。
    """
    spot = db.query(Spot).filter(Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    item: Optional[OfferingItem] = None
    if payload.offering_item_id is not None:
        item = (
            db.query(OfferingItem)
            .filter(
                OfferingItem.id == payload.offering_item_id,
                OfferingItem.spot_id == spot_id,
                OfferingItem.is_active.is_(True),
            )
            .first()
        )
        if not item:
            raise HTTPException(status_code=404, detail="offering item not found")
        amount = int(item.amount_jpy)
        product_name = f"{spot.name} - {item.title}"
        description = item.description
    else:
        if payload.amount_jpy is None:
            raise HTTPException(status_code=422, detail="amount_jpy or offering_item_id is required")
        amount = int(payload.amount_jpy)
        product_name = f"{spot.name} への奉納"
        description = None

    if amount < OFFERING_MIN_JPY or amount > OFFERING_MAX_JPY:
        raise HTTPException(
            status_code=422,
            detail=f"amount_jpy must be between {OFFERING_MIN_JPY} and {OFFERING_MAX_JPY}",
        )

    campaign = None
    if payload.campaign_id is not None:
        campaign = (
            db.query(Campaign)
            .filter(
                Campaign.id == payload.campaign_id,
                Campaign.spot_id == spot_id,
                Campaign.status == "active",
            )
            .first()
        )
        if not campaign:
            raise HTTPException(status_code=404, detail="campaign not found")

    now = _now_iso()
    # まず Offering.id を確保するためだけに INSERT → flush（commit はしない）。
    # Stripe 呼び出しが失敗 or DB 書き込みが失敗したら rollback して行ごと消す。
    offering = Offering(
        user_id=current.id if current else None,
        spot_id=spot_id,
        offering_item_id=item.id if item else None,
        campaign_id=campaign.id if campaign else None,
        amount_jpy=amount,
        currency="jpy",
        status="pending",
        provider="stripe",
        message=(payload.message or "").strip()[:500] or None,
        anonymous=bool(payload.anonymous),
        created_at=now,
    )
    db.add(offering)
    db.flush()   # offering.id を採番させる（commit はしない）

    try:
        from services import stripe_client
        session = stripe_client.create_checkout_session(
            amount_jpy=amount,
            product_name=product_name,
            description=description,
            offering_id=offering.id,
            customer_email=(current.email if current and not payload.anonymous else None),
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=502, detail=f"stripe error: {e}")

    # Stripe セッションが取れたので provider_session_id まで含めて単一トランザクションで commit
    offering.provider_session_id = session.id
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        # Stripe 側にはセッションが残るが expire するまで放置。自前 DB には痕跡なし。
        raise HTTPException(status_code=500, detail=f"db commit failed: {e}")

    return OfferingCheckoutOut(
        offering_id=offering.id,
        checkout_url=session.url,
        session_id=session.id,
    )


@app.post("/stripe/webhook", status_code=200)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Stripe からの Webhook。署名検証し、Offering.status を更新する。

    対応イベント:
    - checkout.session.completed: Offering を paid へ
    - checkout.session.expired / async_payment_failed: Offering を failed へ
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    try:
        from services import stripe_client
        event = stripe_client.construct_event(payload, sig_header)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid signature: {e}")

    etype = event.get("type") if isinstance(event, dict) else getattr(event, "type", None)
    data = (event.get("data") if isinstance(event, dict) else event.data) or {}
    obj = (data.get("object") if isinstance(data, dict) else data.object) or {}

    session_id = obj.get("id") if isinstance(obj, dict) else getattr(obj, "id", None)
    metadata = obj.get("metadata") if isinstance(obj, dict) else getattr(obj, "metadata", {})
    offering_id = None
    try:
        offering_id = int((metadata or {}).get("offering_id"))
    except (TypeError, ValueError):
        offering_id = None

    offering: Optional[Offering] = None
    if offering_id:
        offering = db.query(Offering).filter(Offering.id == offering_id).first()
    if not offering and session_id:
        offering = db.query(Offering).filter(Offering.provider_session_id == session_id).first()
    if not offering:
        # 自前の Offering が紐づかないイベントは無視（重複や別システムの可能性）
        return {"ok": True, "ignored": True}

    payment_intent = obj.get("payment_intent") if isinstance(obj, dict) else getattr(obj, "payment_intent", None)
    if payment_intent:
        offering.provider_payment_intent = str(payment_intent)

    if etype == "checkout.session.completed":
        if offering.status != "paid":
            offering.status = "paid"
            offering.paid_at = _now_iso()
            # キャンペーン寄与を記録（offering_id は UNIQUE なので物理的に重複不可。
            # 念のためクエリでも既存チェックし、競合レースで UNIQUE 違反になった場合は無視）
            if offering.campaign_id:
                existing_contrib = (
                    db.query(CampaignContribution)
                    .filter(CampaignContribution.offering_id == offering.id)
                    .first()
                )
                if not existing_contrib:
                    db.add(CampaignContribution(
                        campaign_id=offering.campaign_id,
                        offering_id=offering.id,
                        amount_jpy=offering.amount_jpy,
                        created_at=_now_iso(),
                    ))
            # 受領者通知（神社管理者への通知は将来実装。今は奉納者本人への完了通知）
            if offering.user_id:
                db.add(Notification(
                    user_id=offering.user_id,
                    kind="offering_receipt",
                    payload=json.dumps({
                        "offering_id": offering.id,
                        "spot_id": offering.spot_id,
                        "amount_jpy": offering.amount_jpy,
                    }, ensure_ascii=False),
                    is_read=False,
                    created_at=_now_iso(),
                ))
            try:
                db.commit()
            except IntegrityError:
                # 競合 (Webhook の同時到着等) で UNIQUE 違反が起きた場合は既に paid 済
                db.rollback()
    elif etype in ("checkout.session.expired", "checkout.session.async_payment_failed"):
        if offering.status == "pending":
            offering.status = "failed"
            db.commit()

    return {"ok": True}


@app.get("/offerings/{offering_id}", response_model=OfferingOut)
def get_offering(
    offering_id: int,
    session_id: Optional[str] = Query(
        default=None,
        description="Stripe Checkout session id。ゲスト奉納の本人確認に使う。",
    ),
    current: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """奉納の詳細（success / cancel ページ表示用）。

    認可ルール:
    - `o.user_id` が本人なら OK
    - ゲスト奉納 (`user_id IS NULL`) は `session_id` クエリが一致したときのみ OK
    - いずれにも該当しなければ 404（存在も秘匿する）
    """
    o = db.query(Offering).filter(Offering.id == offering_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="offering not found")

    if o.user_id is not None:
        if not current or current.id != o.user_id:
            raise HTTPException(status_code=404, detail="offering not found")
    else:
        # ゲスト奉納: Stripe の Checkout Session ID を知っている本人のみに開示
        if not session_id or not o.provider_session_id:
            raise HTTPException(status_code=404, detail="offering not found")
        import secrets as _secrets
        if not _secrets.compare_digest(session_id, o.provider_session_id):
            raise HTTPException(status_code=404, detail="offering not found")

    return o


@app.get("/me/offerings", response_model=list[OfferingOut])
def my_offerings(
    limit: int = Query(50, ge=1, le=200),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Offering)
        .filter(Offering.user_id == current.id)
        .order_by(Offering.created_at.desc())
        .limit(limit)
        .all()
    )


# ===== Shrine Bookmarks (client_id ベースの軽量お気に入り / ウィッシュリスト) =====

_BOOKMARK_STATUSES = ("want", "saved", "visited")


def _bookmark_to_out(b: ShrineBookmark, spot: Optional[Spot] = None) -> dict:
    """ShrineBookmark + 任意の Spot を BookmarkOut 互換 dict に変換する。

    created_at/updated_at は datetime(tz) を ISO 文字列化して返す。
    """
    def _iso(dt):
        if dt is None:
            return None
        if isinstance(dt, str):
            return dt
        return dt.isoformat()
    return {
        "id": b.id,
        "client_id": b.client_id,
        "spot_id": b.spot_id,
        "status": b.status,
        "note": b.note,
        "created_at": _iso(b.created_at) or "",
        "updated_at": _iso(b.updated_at) or "",
        "spot": SpotOut.model_validate(spot) if spot is not None else None,
    }


@app.post("/me/bookmarks", response_model=BookmarkOut)
def create_bookmark(payload: BookmarkIn, db: Session = Depends(get_db)):
    """「行きたい / 保存 / 行った」を登録（upsert）する。

    (client_id, spot_id, status) が既に存在する場合は note のみ更新して既存レコードを返す。
    """
    if payload.status not in _BOOKMARK_STATUSES:
        raise HTTPException(status_code=400, detail="invalid status")
    if not payload.client_id or len(payload.client_id) < 8:
        raise HTTPException(status_code=400, detail="invalid client_id")
    if payload.note is not None and len(payload.note) > 280:
        raise HTTPException(status_code=400, detail="note too long")

    spot = db.query(Spot).filter(Spot.id == payload.spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="spot not found")

    existing = (
        db.query(ShrineBookmark)
        .filter(
            ShrineBookmark.client_id == payload.client_id,
            ShrineBookmark.spot_id == payload.spot_id,
            ShrineBookmark.status == payload.status,
        )
        .first()
    )
    if existing:
        # note の差分があれば更新（updated_at は onupdate で自動更新）
        if payload.note is not None and existing.note != payload.note:
            existing.note = payload.note
            db.commit()
            db.refresh(existing)
        return _bookmark_to_out(existing, spot)

    b = ShrineBookmark(
        client_id=payload.client_id,
        spot_id=payload.spot_id,
        status=payload.status,
        note=payload.note,
    )
    db.add(b)
    try:
        db.commit()
    except IntegrityError:
        # 並列作成で UNIQUE が当たった場合は既存を返す
        db.rollback()
        existing = (
            db.query(ShrineBookmark)
            .filter(
                ShrineBookmark.client_id == payload.client_id,
                ShrineBookmark.spot_id == payload.spot_id,
                ShrineBookmark.status == payload.status,
            )
            .first()
        )
        if existing:
            return _bookmark_to_out(existing, spot)
        raise HTTPException(status_code=409, detail="bookmark conflict")
    db.refresh(b)
    return _bookmark_to_out(b, spot)


@app.delete("/me/bookmarks/{bookmark_id}", status_code=204)
def delete_bookmark(
    bookmark_id: int,
    client_id: str = Query(..., min_length=8),
    db: Session = Depends(get_db),
):
    """client_id 一致を確認した上で bookmark を削除する。"""
    b = db.query(ShrineBookmark).filter(ShrineBookmark.id == bookmark_id).first()
    if not b:
        # 情報漏洩防止のため 404 を返す（別 client のものも 404）
        raise HTTPException(status_code=404, detail="bookmark not found")
    if b.client_id != client_id:
        raise HTTPException(status_code=404, detail="bookmark not found")
    db.delete(b)
    db.commit()
    # 204 は body 不要
    return None


@app.get("/me/bookmarks", response_model=list[BookmarkOut])
def list_my_bookmarks(
    client_id: str = Query(..., min_length=8),
    status: Optional[str] = Query(default=None),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """マイページ一覧。Spot を JOIN して BookmarkOut.spot に詰めて返す。"""
    if status is not None and status not in _BOOKMARK_STATUSES:
        raise HTTPException(status_code=400, detail="invalid status")

    q = (
        db.query(ShrineBookmark, Spot)
        .join(Spot, Spot.id == ShrineBookmark.spot_id)
        .filter(ShrineBookmark.client_id == client_id)
    )
    if status:
        q = q.filter(ShrineBookmark.status == status)
    rows = (
        q.order_by(ShrineBookmark.id.desc())
        .limit(limit)
        .all()
    )
    return [_bookmark_to_out(b, sp) for (b, sp) in rows]


@app.get("/me/bookmarks/status", response_model=BookmarkStatusMap)
def bookmark_status_for_spot(
    client_id: str = Query(..., min_length=8),
    spot_id: int = Query(..., ge=1),
    db: Session = Depends(get_db),
):
    """特定 spot × client における want/saved/visited のトグル押下状態を返す。"""
    rows = (
        db.query(ShrineBookmark.status)
        .filter(
            ShrineBookmark.client_id == client_id,
            ShrineBookmark.spot_id == spot_id,
        )
        .all()
    )
    statuses = {r[0] for r in rows}
    return BookmarkStatusMap(
        want=("want" in statuses),
        saved=("saved" in statuses),
        visited=("visited" in statuses),
    )


@app.get("/")
def index():
    # Phase 0b: legacy-static に index.html を同梱
    # （Next.js への移植が終われば apps/web に切替）
    frontend = Path(__file__).parent / "legacy-static" / "index.html"
    if not frontend.exists():
        # 後方互換: 旧 frontend/ が残っている場合はそちらを使う
        frontend = Path(__file__).parent.parent.parent / "frontend" / "index.html"
    return FileResponse(str(frontend))
