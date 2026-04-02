# 🍍 Princess Pineapple Paws

STARTO聖地巡礼・現在地連動・姫系ポップアプリ

## セットアップ

### 1. 依存関係のインストール

```bash
cd backend
pip install -r requirements.txt
```

### 2. 初期データ投入（初回のみ）

```bash
cd backend
python seed.py
```

### 3. サーバー起動

```bash
cd backend
uvicorn main:app --reload --port 8000
```

ブラウザで http://localhost:8000 を開く。

## API エンドポイント

| Method | Path | 説明 |
|--------|------|------|
| GET | /health | ヘルスチェック |
| GET | /spots | 全スポット取得（フィルタ可） |
| GET | /spots/nearby | 現在地から近い順 |
| GET | /spots/{id} | スポット詳細 |
| GET | /talents | タレント・グループ一覧 |

### `/spots/nearby` クエリパラメータ

| パラメータ | 型 | 説明 |
|---|---|---|
| lat | float | 緯度（必須）|
| lng | float | 経度（必須）|
| radius | float | 検索半径（メートル、デフォルト5000）|
| talent | string | タレント名フィルタ |
| group | string | グループ名フィルタ |
| media | string | 媒体フィルタ（TV / YouTube / 雑誌 / SNS）|
| freshness | string | 鮮度フィルタ（fresh / ripe / dry）|

## フレッシュ・パイン スコア

情報の鮮度をパイナップルの見た目で表現：

| 状態 | 日数 | スコア | 表示 |
|------|------|--------|------|
| 🌿 フレッシュ | 〜30日 | 95-100 | 緑の葉がピンと立っている |
| 🍍 完熟 | 31〜365日 | 50-94 | 黄色くて甘そう |
| 🏵️ ドライパイン | 365日〜 | 10-49 | アーカイブ |

## データ構造

```json
{
  "id": 1,
  "name": "猿田彦珈琲 原宿店",
  "address": "東京都渋谷区神宮前6-1-6",
  "lat": 35.6702,
  "lng": 139.7027,
  "talent_name": "赤澤遼太郎",
  "group_name": "SixTONES",
  "media_type": "TV",
  "media_title": "Mステ",
  "broadcast_date": "2026-03-15",
  "menu_items": "エチオピア・ハニー、レモンティラミス",
  "access_info": "JR原宿駅 竹下口から徒歩3分",
  "pineapple_score": 89,
  "freshness_visual": "fresh",
  "distance_meters": 150
}
```

## ディレクトリ構成

```
03johnny/
├── backend/
│   ├── main.py              # FastAPI アプリ
│   ├── config.py            # 設定
│   ├── database.py          # SQLAlchemy セットアップ
│   ├── models.py            # Spot モデル
│   ├── schemas.py           # Pydantic スキーマ
│   ├── seed.py              # 初期データ投入
│   ├── services/
│   │   ├── geo.py           # ハバーサイン距離計算
│   │   └── freshness.py     # パイナップル鮮度スコア
│   └── requirements.txt
├── frontend/
│   └── index.html           # Leaflet地図 + 姫系UI
└── .env
```
