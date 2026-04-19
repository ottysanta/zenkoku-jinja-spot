from sqlalchemy import Column, Integer, String, Float, Text, Boolean
from database import Base


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
    external_id = Column(String, unique=True, index=True)  # manual:... / wd:Q... / osm:node/...
    source_layer = Column(String, index=True)        # manual / wikidata / osm
    # 共通
    access_info = Column(Text)                        # アクセス情報
    source_url = Column(String)                       # 情報ソースURL
