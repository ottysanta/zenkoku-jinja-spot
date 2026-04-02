from pydantic import BaseModel
from typing import Optional


class SpotOut(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    lat: float
    lng: float
    talent_name: Optional[str] = None
    group_name: Optional[str] = None
    media_type: Optional[str] = None
    media_title: Optional[str] = None
    broadcast_date: Optional[str] = None
    menu_items: Optional[str] = None
    access_info: Optional[str] = None
    source_url: Optional[str] = None
    pineapple_score: int = 50
    freshness_visual: str = "ripe"

    model_config = {"from_attributes": True}


class SpotWithDistance(SpotOut):
    distance_meters: Optional[float] = None


class TalentListResponse(BaseModel):
    talents: list[str]
    groups: list[str]
