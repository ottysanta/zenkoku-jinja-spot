from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Query, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from config import DEFAULT_SEARCH_RADIUS_M, MAX_NEARBY_RESULTS
from database import init_db, get_db
from models import Spot
from schemas import SpotOut, SpotWithDistance, TalentListResponse
from services.geo import haversine


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Princess Pineapple Paws API",
    description="STARTO聖地巡礼・現在地連動マップ",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "app": "Princess Pineapple Paws"}


@app.get("/spots/nearby", response_model=list[SpotWithDistance])
def nearby_spots(
    lat: float = Query(..., description="現在地 緯度"),
    lng: float = Query(..., description="現在地 経度"),
    radius: float = Query(DEFAULT_SEARCH_RADIUS_M, description="検索半径 (メートル)"),
    talent: Optional[str] = Query(None),
    group: Optional[str] = Query(None),
    media: Optional[str] = Query(None),
    freshness: Optional[str] = Query(None, description="fresh / ripe / dry"),
    db: Session = Depends(get_db),
):
    query = db.query(Spot)
    if talent:
        query = query.filter(Spot.talent_name.ilike(f"%{talent}%"))
    if group:
        query = query.filter(Spot.group_name.ilike(f"%{group}%"))
    if media:
        query = query.filter(Spot.media_type == media)
    if freshness:
        query = query.filter(Spot.freshness_visual == freshness)

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
    talent: Optional[str] = Query(None),
    group: Optional[str] = Query(None),
    media: Optional[str] = Query(None),
    freshness: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Spot)
    if talent:
        query = query.filter(Spot.talent_name.ilike(f"%{talent}%"))
    if group:
        query = query.filter(Spot.group_name.ilike(f"%{group}%"))
    if media:
        query = query.filter(Spot.media_type == media)
    if freshness:
        query = query.filter(Spot.freshness_visual == freshness)
    return query.all()


@app.get("/spots/{spot_id}", response_model=SpotOut)
def get_spot(spot_id: int, db: Session = Depends(get_db)):
    spot = db.query(Spot).filter(Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    return spot


@app.get("/talents", response_model=TalentListResponse)
def list_talents(db: Session = Depends(get_db)):
    rows = db.query(Spot.talent_name, Spot.group_name).distinct().all()
    talents = sorted({r.talent_name for r in rows if r.talent_name})
    groups = sorted({r.group_name for r in rows if r.group_name})
    return TalentListResponse(talents=talents, groups=groups)


@app.get("/")
def index():
    from pathlib import Path
    frontend = Path(__file__).parent.parent / "frontend" / "index.html"
    return FileResponse(str(frontend))
