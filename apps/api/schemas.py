from pydantic import BaseModel
from typing import Optional


class SpotOut(BaseModel):
    id: int
    name: str
    slug: Optional[str] = None              # None のとき Web は 'spot-{id}' を使う
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
    # 詳細/画像（Phase 1d）
    photo_url: Optional[str] = None
    photo_attribution: Optional[str] = None
    description: Optional[str] = None
    history: Optional[str] = None
    highlights: Optional[str] = None
    wikipedia_title: Optional[str] = None
    wikipedia_url: Optional[str] = None
    # canonical 運用 (migration 008 / マルチソース統合)
    canonical_name: Optional[str] = None
    primary_source: Optional[str] = None          # manual / bunka / jinjacho / mlit / gsi / wikidata / osm / google_places
    confidence_score: Optional[int] = None        # 0-100
    official_status: Optional[str] = None         # registered_ranked / registered_religious_corp / unregistered / unknown
    published_status: Optional[str] = None        # published / draft / hidden / merged
    last_synced_at: Optional[str] = None
    data_freshness_status: Optional[str] = None   # fresh / aging / stale / unknown

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


# ===== 認証 / ユーザー =====

class UserOut(BaseModel):
    id: int
    email: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    locale: Optional[str] = "ja"
    role: str = "user"

    model_config = {"from_attributes": True}


class SessionIssueIn(BaseModel):
    """Next.js (Auth.js) から呼ばれ、provider 認証済のユーザーを受け取る。"""
    provider: str                       # google / apple / email
    provider_account_id: str            # provider 側の一意 ID
    email: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    locale: Optional[str] = "ja"


class SessionIssueOut(BaseModel):
    token: str                           # 平文は発行時のみ返却。以降は Authorization: Bearer で送る
    expires_at: str                      # ISO
    user: UserOut


# ===== Review =====

class ReviewIn(BaseModel):
    score_atmosphere: Optional[float] = None
    score_manners: Optional[float] = None
    score_access: Optional[float] = None
    score_facilities: Optional[float] = None
    score_overall: Optional[float] = None
    body: Optional[str] = None
    visited_at: Optional[str] = None
    locale: Optional[str] = "ja"


class ReviewOut(BaseModel):
    id: int
    user_id: int
    spot_id: int
    score_atmosphere: Optional[float] = None
    score_manners: Optional[float] = None
    score_access: Optional[float] = None
    score_facilities: Optional[float] = None
    score_overall: Optional[float] = None
    body: Optional[str] = None
    visited_at: Optional[str] = None
    locale: Optional[str] = "ja"
    created_at: str
    updated_at: Optional[str] = None
    # 非正規化して返す（一覧表示用）
    author_name: Optional[str] = None
    author_avatar: Optional[str] = None

    model_config = {"from_attributes": True}


class ReviewAggregate(BaseModel):
    count: int
    avg_atmosphere: Optional[float] = None
    avg_manners: Optional[float] = None
    avg_access: Optional[float] = None
    avg_facilities: Optional[float] = None
    avg_overall: Optional[float] = None


# ===== Reaction =====

class ReactionIn(BaseModel):
    target_type: str        # review / user_post / checkin
    target_id: int
    kind: str               # gratitude / helpful / peaceful / inspiring


class ReactionOut(BaseModel):
    id: int
    target_type: str
    target_id: int
    kind: str
    created_at: str

    model_config = {"from_attributes": True}


# ===== Follow =====

class FollowOut(BaseModel):
    follower_id: int
    followee_id: int
    created_at: str


# ===== Notification =====

class NotificationOut(BaseModel):
    id: int
    kind: str
    payload: Optional[str] = None
    is_read: bool
    created_at: str

    model_config = {"from_attributes": True}


# ===== Report =====

class ReportIn(BaseModel):
    target_type: str    # review / user_post / checkin / user / spot
    target_id: int
    reason: str         # spam / harassment / misinformation / inappropriate / other
    detail: Optional[str] = None
    reporter_client_id: Optional[str] = None


# ===== Offering / Stripe =====

class OfferingItemOut(BaseModel):
    id: int
    spot_id: int
    kind: str
    title: str
    description: Optional[str] = None
    amount_jpy: int
    is_active: bool
    sort_order: int

    model_config = {"from_attributes": True}


class OfferingCheckoutIn(BaseModel):
    """任意金額または offering_item_id のどちらかを指定。"""
    offering_item_id: Optional[int] = None
    amount_jpy: Optional[int] = None         # offering_item_id 未指定時の任意金額（100円以上）
    message: Optional[str] = None
    anonymous: bool = False
    campaign_id: Optional[int] = None


class OfferingCheckoutOut(BaseModel):
    offering_id: int
    checkout_url: str
    session_id: str


class OfferingOut(BaseModel):
    id: int
    spot_id: int
    offering_item_id: Optional[int] = None
    campaign_id: Optional[int] = None
    amount_jpy: int
    status: str
    message: Optional[str] = None
    anonymous: bool
    created_at: str
    paid_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ===== Bookmarks (client_id ベース お気に入り / ウィッシュリスト) =====

# 'want' = 行きたい / 'saved' = 保存 / 'visited' = 行った
BookmarkStatusLiteral = str  # Pydantic v2 では実際の enum 制約は endpoint 側で検証


class BookmarkIn(BaseModel):
    client_id: str
    spot_id: int
    status: str                       # want / saved / visited
    note: Optional[str] = None


class BookmarkOut(BaseModel):
    id: int
    client_id: str
    spot_id: int
    status: str
    note: Optional[str] = None
    created_at: str                   # ISO-8601 文字列として返す
    updated_at: str
    spot: Optional[SpotOut] = None    # マイページ一覧用に JOIN 結果を載せる

    model_config = {"from_attributes": True}


class BookmarkStatusMap(BaseModel):
    """/me/bookmarks/status レスポンス。UI のトグル押下状態に直接マップする。"""
    want: bool
    saved: bool
    visited: bool
