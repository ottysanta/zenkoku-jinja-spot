import json
import shutil
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, Query, Depends, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from config import (
    DEFAULT_SEARCH_RADIUS_M,
    MAX_NEARBY_RESULTS,
    CHECKIN_MAX_DISTANCE_M,
    CHECKIN_MIN_ACCURACY_M,
    CHECKIN_COOLDOWN_SEC,
)
from database import init_db, get_db
from models import Spot, UserPost, SpotSubmission, Checkin
from schemas import (
    SpotOut,
    SpotWithDistance,
    ShrineFacetResponse,
    UserPostOut,
    SpotSubmissionOut,
    CheckinIn,
    CheckinOut,
    CheckinStats,
)
from services.geo import haversine

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
    db: Session = Depends(get_db),
):
    query = _apply_filters(db.query(Spot), prefecture, shrine_type, benefit, rank, goshuin)
    return query.all()


@app.get("/spots/{spot_id}", response_model=SpotOut)
def get_spot(spot_id: int, db: Session = Depends(get_db)):
    spot = db.query(Spot).filter(Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    return spot


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


@app.get("/")
def index():
    frontend = Path(__file__).parent.parent / "frontend" / "index.html"
    return FileResponse(str(frontend))
