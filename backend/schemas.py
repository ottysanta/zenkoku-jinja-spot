from pydantic import BaseModel
from typing import Optional


class SpotOut(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    lat: float
    lng: float
    shrine_type: Optional[str] = None
    deity: Optional[str] = None
    benefits: Optional[str] = None          # JSON配列文字列
    shrine_rank: Optional[str] = None
    founded: Optional[str] = None
    goshuin_available: Optional[bool] = None
    goshuin_info: Optional[str] = None
    juyohin_info: Optional[str] = None
    prefecture: Optional[str] = None
    website: Optional[str] = None
    external_id: Optional[str] = None
    source_layer: Optional[str] = None
    access_info: Optional[str] = None
    source_url: Optional[str] = None

    model_config = {"from_attributes": True}


class SpotWithDistance(SpotOut):
    distance_meters: Optional[float] = None


class UserPostOut(BaseModel):
    id: int
    spot_id: int
    image_path: str
    media_title: Optional[str] = None
    description: Optional[str] = None
    nickname: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}


class SpotSubmissionOut(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    shrine_type: Optional[str] = None
    description: Optional[str] = None
    image_path: Optional[str] = None
    nickname: Optional[str] = None
    created_at: str
    status: str = "pending"

    model_config = {"from_attributes": True}


class ShrineFacetResponse(BaseModel):
    prefectures: list[str]
    shrine_types: list[str]
    benefits: list[str]
    ranks: list[str]


# ===== 参拝チェックイン =====

class CheckinIn(BaseModel):
    """クライアント→サーバー: 参拝チェックインの申請"""
    client_id: str
    lat: float
    lng: float
    accuracy_m: Optional[float] = None
    wish_type: Optional[str] = None  # gratitude / vow / milestone / thanks / other
    comment: Optional[str] = None
    nickname: Optional[str] = None


class CheckinOut(BaseModel):
    id: int
    spot_id: int
    distance_m: float
    wish_type: Optional[str] = None
    comment: Optional[str] = None
    nickname: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}


class CheckinStats(BaseModel):
    total: int
    month: int       # 今月の件数
    unique_visitors: int  # ユニーク client 数
    last_at: Optional[str] = None
