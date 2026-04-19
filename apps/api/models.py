from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, ForeignKey, Integer, String, Float, Text, Boolean, UniqueConstraint, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class User(Base):
    """サービス利用者。Auth.js provider 経由で作成される。"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)    # magic link 未使用時は NULL
    display_name = Column(String)
    avatar_url = Column(String)
    locale = Column(String, default="ja")
    role = Column(String, nullable=False, default="user", index=True)
    is_suspended = Column(Boolean, nullable=False, default=False)
    created_at = Column(String, nullable=False)
    updated_at = Column(String)


class AuthIdentity(Base):
    """provider (google/apple/email) ごとの外部アカウント紐付け。"""
    __tablename__ = "auth_identities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String, nullable=False)
    provider_account_id = Column(String, nullable=False)
    created_at = Column(String, nullable=False)


class Session(Base):
    """API セッション。token の SHA-256 ハッシュのみ保持する。"""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String, unique=True, nullable=False)
    expires_at = Column(String, nullable=False, index=True)
    created_at = Column(String, nullable=False)
    last_seen_at = Column(String)
    user_agent = Column(String)
    ip_hash = Column(String)


class UserPost(Base):
    __tablename__ = "user_posts"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, nullable=False, index=True)
    image_path = Column(String, nullable=False)   # /uploads/filename.jpg
    media_title = Column(String)                   # 参拝メモ見出し（流用）
    description = Column(Text)                     # 参拝の詳細メモ
    nickname = Column(String)                      # 省略時はNone → 表示は「匿名さん」
    created_at = Column(String)                    # ISO datetime string


class SpotSubmission(Base):
    """ユーザーから申請された新規神社（審査待ち）"""
    __tablename__ = "spot_submissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)     # 神社名（必須）
    address = Column(String)                   # 住所（任意）
    shrine_type = Column(String)              # 稲荷/八幡/天神 等
    description = Column(Text)               # 説明・祭神・ご利益など
    image_path = Column(String)              # /uploads/filename.jpg（任意）
    nickname = Column(String)                # 投稿者名
    created_at = Column(String)
    status = Column(String, default="pending")  # pending / approved / rejected


class Checkin(Base):
    """GPS検証済みの参拝記録（軽量・匿名可）"""
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, nullable=False, index=True)
    # 認証導入前の匿名識別子（localStorage の UUID 等）。将来は user_id に移行
    client_id = Column(String, nullable=False, index=True)
    user_id = Column(Integer, nullable=True, index=True)  # 将来の認証連携用
    # 参拝時の測位値（監査・距離検証のため保存）
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    accuracy_m = Column(Float)
    distance_m = Column(Float, nullable=False)  # サーバーで再計算した確定距離
    # 任意のメタ情報
    wish_type = Column(String)   # gratitude / vow / milestone / thanks / other
    comment = Column(Text)       # 短いひとこと（任意）
    nickname = Column(String)    # 任意・非必須
    created_at = Column(String, nullable=False, index=True)  # ISO datetime


class Review(Base):
    """構造化レビュー（1 user × 1 spot = 1 review）"""
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    score_atmosphere = Column(Float)
    score_manners = Column(Float)
    score_access = Column(Float)
    score_facilities = Column(Float)
    score_overall = Column(Float)
    body = Column(Text)
    visited_at = Column(String)
    locale = Column(String, default="ja")
    is_hidden = Column(Boolean, nullable=False, default=False)
    created_at = Column(String, nullable=False, index=True)
    updated_at = Column(String)


class ReviewPhoto(Base):
    __tablename__ = "review_photos"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    image_path = Column(String, nullable=False)
    caption = Column(String)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(String, nullable=False)


class Reaction(Base):
    __tablename__ = "reactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_type = Column(String, nullable=False)   # review / user_post / checkin
    target_id = Column(Integer, nullable=False)
    kind = Column(String, nullable=False)          # gratitude / helpful / peaceful / inspiring
    created_at = Column(String, nullable=False)


class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    followee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(String, nullable=False)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(String, nullable=False)
    payload = Column(Text)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(String, nullable=False, index=True)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    reporter_client_id = Column(String)
    target_type = Column(String, nullable=False)
    target_id = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    detail = Column(Text)
    status = Column(String, nullable=False, default="open")
    created_at = Column(String, nullable=False)
    resolved_at = Column(String)


class OfferingItem(Base):
    """神社側の奉納メニュー（初穂料・絵馬・お守り等）。金額は整数円。"""
    __tablename__ = "offering_items"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(String, nullable=False)        # hatsuhoryo / ema / omamori / donation
    title = Column(String, nullable=False)
    description = Column(Text)
    amount_jpy = Column(Integer, nullable=False) # 整数円
    is_active = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(String, nullable=False)
    updated_at = Column(String)


class Offering(Base):
    """奉納トランザクション。Stripe Checkout で決済。"""
    __tablename__ = "offerings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    offering_item_id = Column(Integer, ForeignKey("offering_items.id", ondelete="SET NULL"))
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="SET NULL"))
    amount_jpy = Column(Integer, nullable=False)
    currency = Column(String, nullable=False, default="jpy")
    status = Column(String, nullable=False, default="pending", index=True)  # pending/paid/failed/refunded
    provider = Column(String, nullable=False, default="stripe")
    provider_session_id = Column(String, index=True)
    provider_payment_intent = Column(String, index=True)
    message = Column(Text)             # 任意の願意・ひとこと
    anonymous = Column(Boolean, nullable=False, default=False)
    created_at = Column(String, nullable=False, index=True)
    paid_at = Column(String)


class Campaign(Base):
    """神社の目標設定つき奉納キャンペーン（例: 屋根修繕）"""
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    goal_jpy = Column(Integer, nullable=False)
    starts_at = Column(String)
    ends_at = Column(String, index=True)
    status = Column(String, nullable=False, default="active", index=True)
    created_at = Column(String, nullable=False)


class CampaignContribution(Base):
    """キャンペーンと Offering の紐付け（表示用集計の高速化）。

    offering_id で UNIQUE を張り、Webhook 重複配信時の二重計上を防ぐ。
    """
    __tablename__ = "campaign_contributions"
    __table_args__ = (
        UniqueConstraint("offering_id", name="uq_campaign_contrib_offering"),
    )

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    offering_id = Column(Integer, ForeignKey("offerings.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_jpy = Column(Integer, nullable=False)
    created_at = Column(String, nullable=False)


class Spot(Base):
    __tablename__ = "spots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)           # 神社名
    address = Column(String)                         # 住所
    lat = Column(Float, nullable=False)              # 緯度
    lng = Column(Float, nullable=False)              # 経度
    # 神社特有
    shrine_type = Column(String, index=True)         # 稲荷/八幡/天神/熊野/諏訪/神宮/大社/その他
    deity = Column(Text)                              # 祭神（複数はカンマ区切り）
    benefits = Column(Text)                           # JSON配列: ["縁結び","商売繁盛"]
    shrine_rank = Column(String, index=True)         # 式内社/官幣大社/別表神社/郷社/村社 等
    founded = Column(String)                          # "紀元前660年"/"1920"/"平安時代"
    goshuin_available = Column(Boolean)              # NULL=不明
    goshuin_info = Column(Text)                       # 初穂料/授与時間/デザイン等
    juyohin_info = Column(Text)                       # お守り・絵馬等
    prefecture = Column(String, index=True)          # 都道府県
    website = Column(String)
    slug = Column(String, unique=True, index=True)   # /shrines/{slug} 用 URL 識別子
    external_id = Column(String, unique=True, index=True)  # manual:... / wd:Q... / osm:node/...
    source_layer = Column(String, index=True)        # manual / wikidata / osm
    # 共通
    access_info = Column(Text)                        # アクセス情報
    source_url = Column(String)                       # 情報ソースURL
    # 詳細/画像（Phase 1d 追加）
    photo_url = Column(String)                        # 代表写真URL（Wikipedia/自前アップロード）
    photo_attribution = Column(String)                # 写真の出典・著作者
    description = Column(Text)                        # 神社の説明・由緒（1-3 段落）
    history = Column(Text)                            # 歴史の詳細
    highlights = Column(Text)                         # 見どころ（JSON 配列）
    wikipedia_title = Column(String)                   # ja.wikipedia タイトル
    wikipedia_url = Column(String)                     # ja.wikipedia URL
    # --- canonical 運用（migration 008）---
    canonical_name = Column(String)                    # 正式名（重複統合後の代表名）
    primary_source = Column(String, index=True)        # manual / bunka / mlit / gsi / wikidata / osm / google_places
    confidence_score = Column(Integer)                 # 0-100: 複数ソース一致度・手動承認で加点
    official_status = Column(String)                   # registered_ranked / registered_religious_corp / unregistered / unknown
    published_status = Column(String, nullable=False, default="published", index=True)  # published / draft / hidden / merged
    last_synced_at = Column(String)                    # 最新ソース同期時刻 ISO
    data_freshness_status = Column(String, index=True) # fresh / aging / stale / unknown


class ShrineSourceRecord(Base):
    """各ソース（OSM/Wikidata/MLIT/GSI/文化庁/Places/Manual）の raw レコード。

    canonical spot (spots.id) に対して 1:N で紐づき、マージ処理の原データとして保持。
    同一 (source_type, source_object_id) は重複を禁止。
    """
    __tablename__ = "shrine_source_records"
    __table_args__ = (
        UniqueConstraint("source_type", "source_object_id", name="uq_ssr_source_type_obj"),
    )

    id = Column(Integer, primary_key=True, index=True)
    shrine_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    source_type = Column(String, nullable=False, index=True)   # osm/wikidata/mlit/gsi/bunka/places/manual/jinjacho
    source_object_id = Column(String, index=True)              # osm:node/XXX, wd:QXXX, mlit:..., places:ChIJ...
    source_name = Column(String)                                # ソース側の神社名
    source_address = Column(String)
    source_lat = Column(Float)
    source_lng = Column(Float)
    source_url = Column(String)
    fetched_at = Column(String)                                 # ISO datetime
    raw_payload_json = Column(Text)                             # 生 JSON（再マージ/監査用）
    match_status = Column(String, nullable=False, default="matched", index=True)  # matched/pending/rejected/orphan
    match_score = Column(Float)                                 # 0.0-1.0


class ShrineMetadata(Base):
    """spot に対する 1:1 の運用メタ情報。検証状態・御朱印情報など。"""
    __tablename__ = "shrine_metadata"

    shrine_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), primary_key=True)
    goshuin_supported = Column(Boolean)                         # NULL=不明
    parking = Column(String)                                    # yes/limited/no/unknown
    barrier_free = Column(Boolean)
    foreign_language_support = Column(String)                   # ja_only / en / multi
    opening_hours_note = Column(Text)
    access_note = Column(Text)
    photography_policy = Column(String)                         # allowed / restricted / prohibited
    last_verified_at = Column(String)
    verification_method = Column(String)                        # admin_review / on_site_visit / official_reply


class ShrineTranslation(Base):
    """spot に対する多言語翻訳。language_code ごと 1 レコード。"""
    __tablename__ = "shrine_translations"
    __table_args__ = (
        UniqueConstraint("shrine_id", "language_code", name="uq_shrine_translations_lang"),
    )

    id = Column(Integer, primary_key=True, index=True)
    shrine_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    language_code = Column(String, nullable=False, index=True)  # en / zh-Hans / zh-Hant / ko / ...
    translated_name = Column(String)
    summary = Column(Text)
    access_guide = Column(Text)
    etiquette_guide = Column(Text)
    updated_at = Column(String)


class SourceImport(Base):
    """ソースごとのバッチ取り込み履歴。管理UIで表示・監視用。"""
    __tablename__ = "source_imports"

    id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String, nullable=False, index=True)
    started_at = Column(String, nullable=False, index=True)
    finished_at = Column(String)
    status = Column(String, nullable=False, default="running")  # running/completed/failed/cancelled
    inserted = Column(Integer, nullable=False, default=0)
    updated = Column(Integer, nullable=False, default=0)
    skipped = Column(Integer, nullable=False, default=0)
    failed = Column(Integer, nullable=False, default=0)
    error_message = Column(Text)
    metadata_json = Column(Text)                                # JSON: 絞り込み条件・範囲など
    triggered_by = Column(String)                               # cron / manual / admin:user_id


class PendingMerge(Base):
    """自動マージで confidence が境界値の候補。管理者が人手レビューする。"""
    __tablename__ = "pending_merges"
    __table_args__ = (
        UniqueConstraint("primary_shrine_id", "candidate_shrine_id", name="uq_pending_merges_pair"),
    )

    id = Column(Integer, primary_key=True, index=True)
    primary_shrine_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_shrine_id = Column(Integer, ForeignKey("spots.id", ondelete="CASCADE"), nullable=False, index=True)
    match_score = Column(Float, nullable=False)
    match_reasons = Column(Text)                                # JSON: {"coord_dist_m": 23, "name_sim": 0.92}
    status = Column(String, nullable=False, default="pending", index=True)  # pending/approved/rejected
    reviewer_user_id = Column(Integer)
    reviewed_at = Column(String)
    created_at = Column(String, nullable=False)


class StatsReference(Base):
    """文化庁年鑑などの統計値。UI に年度・対象時点つきで参考表示する。"""
    __tablename__ = "stats_references"
    __table_args__ = (
        UniqueConstraint("source_name", "reference_year", "metric_key", name="uq_stats_refs"),
    )

    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String, nullable=False)                # "文化庁 宗教年鑑"
    source_url = Column(String)
    reference_year = Column(Integer, nullable=False)            # 2022
    reference_as_of = Column(String)                            # "2022-12-31"
    metric_key = Column(String, nullable=False)                 # "registered_shinto_shrines"
    metric_value = Column(Integer, nullable=False)
    note = Column(Text)
    published_at = Column(String)


class ShrineBookmark(Base):
    """client_id ベースの軽量お気に入り/ウィッシュリスト。

    既存 Checkin は GPS 検証付きの「参拝記録」であるのに対し、こちらは
    「行きたい / 保存 / 行った」の 3 状態で位置検証なしに記録する軽量機能。
    認証導入前の匿名識別子 (localStorage の UUID) で紐付ける。
    同一 client × spot × status は 1 件まで（UniqueConstraint）。
    """
    __tablename__ = "shrine_bookmarks"
    __table_args__ = (
        UniqueConstraint("client_id", "spot_id", "status", name="uq_bookmark_client_spot_status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[str] = mapped_column(String(64), index=True)
    spot_id: Mapped[int] = mapped_column(ForeignKey("spots.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(16))  # 'want' | 'saved' | 'visited'
    note: Mapped[Optional[str]] = mapped_column(String(280), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
