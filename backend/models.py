from sqlalchemy import Column, Integer, String, Float, Text
from database import Base


class Spot(Base):
    __tablename__ = "spots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)          # 店名・スポット名
    address = Column(String)                        # 住所
    lat = Column(Float, nullable=False)             # 緯度
    lng = Column(Float, nullable=False)             # 経度
    talent_name = Column(String)                    # タレント名
    group_name = Column(String)                     # グループ名
    media_type = Column(String)                     # TV / YouTube / 雑誌 / SNS
    media_title = Column(String)                    # 番組名・メディアタイトル
    broadcast_date = Column(String)                 # 放送・掲載日 (YYYY-MM-DD)
    menu_items = Column(Text)                       # 食べたメニュー
    access_info = Column(Text)                      # アクセス情報
    source_url = Column(String)                     # 情報ソースURL
    pineapple_score = Column(Integer, default=50)   # 鮮度スコア (0-100)
    freshness_visual = Column(String, default="ripe")  # fresh / ripe / dry
