# ⛩️ 全国神社スポット

自分に合う神社を見つけ・学び・訪れ・支える、神社プラットフォーム（モノレポ構成）。

- **地図**: Leaflet / OpenStreetMap（現行）→ MapLibre GL へ移行中
- **API**: FastAPI + SQLAlchemy 2.0 + SQLite（→ Phase 1a で Postgres + PostGIS）
- **Web**: Next.js 15 App Router + Tailwind CSS + next-intl
- **認証**: Auth.js（Google / Apple / Email magic link）— Phase 1b
- **決済**: Stripe（単発奉納 / 月次まとめ精算）— Phase 1f

現在の進捗と設計方針は [`MIGRATION.md`](./MIGRATION.md) を参照してください。

---

## モノレポ構成

```
03johnny/
├── apps/
│   ├── api/               # FastAPI backend
│   │   ├── main.py
│   │   ├── models.py / schemas.py / database.py / config.py
│   │   ├── services/       geo.py
│   │   ├── data/           shrine_spots.db (SQLite 開発)
│   │   ├── uploads/        参拝記録の画像
│   │   ├── shrine_data/    シードJSON / lookup
│   │   ├── legacy-static/  旧 index.html（/map が iframe で暫定利用）
│   │   └── requirements.txt
│   └── web/               # Next.js 15
│       ├── app/
│       │   ├── layout.tsx / page.tsx
│       │   └── map/page.tsx
│       ├── lib/            api.ts / client-id.ts / geo.ts
│       └── styles/         globals.css
├── packages/
│   └── types/              # 共有型（OpenAPI 自動生成予定）
├── ops/postgres/init/      # DB 起動時の拡張有効化
├── docker-compose.yml      # Postgres 16 + PostGIS + pgAdmin
├── .env.example            # 全環境変数のテンプレート
├── package.json            # npm workspaces ルート
├── Procfile / render.yaml  # Render / Heroku デプロイ
└── MIGRATION.md
```

---

## セットアップ

### 1. 依存関係

```bash
# API (Python)
cd apps/api
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Web (Node)
cd ../..
npm install                         # workspace 全体
```

### 2. シードデータ投入（初回のみ）

```bash
cd apps/api
python import_seed.py
```

### 3. 起動

```bash
# ターミナル1: API
cd apps/api && uvicorn main:app --reload --port 8000

# ターミナル2: Web
npm run dev:web                     # http://localhost:3000

# （オプション）Postgres
npm run db:up
```

### 4. 暫定導線

Phase 0b 時点では `/map` は旧 `index.html` を iframe で表示します。
ブラウザから `http://localhost:3000/map` を開けば既存機能（現在地検索・参拝チェックインなど）がすぐ使えます。

---

## API エンドポイント（抜粋）

| Method | Path | 説明 |
|---|---|---|
| GET  | `/health` | ヘルスチェック |
| GET  | `/spots` | 全神社取得（フィルタ可） |
| GET  | `/spots/nearby` | 現在地から距離順 |
| GET  | `/spots/{id}` | 神社詳細 |
| GET  | `/shrine-facets` | ファセット（都道府県 / タイプ / ご利益 / 社格） |
| GET  | `/spots/{id}/posts` | 参拝記録一覧 |
| POST | `/spots/{id}/posts` | 参拝記録投稿（画像+コメント） |
| POST | `/spots/{id}/checkins` | **参拝チェックイン**（GPS 検証） |
| GET  | `/spots/{id}/checkins` | 最近の参拝者 |
| GET  | `/spots/{id}/checkin-stats` | 累計 / 今月 / ユニーク |
| GET  | `/me/checkins?client_id=` | 自分の参拝ログ |
| POST | `/spot-submissions` | 新規神社申請 |

### 参拝チェックインの検証ルール（サーバー側）

| ルール | 値 | 目的 |
|---|---|---|
| 最大距離 | 300m | 境内外からの偽装を防止 |
| GPS 精度上限 | 200m | 極端に粗い測位を拒否 |
| クールダウン | 20 時間 | 同日重複ログ防止 |

実体は [`apps/api/main.py`](./apps/api/main.py) の `create_checkin` を参照。

---

## フェーズ

| Phase | 状態 | 内容 |
|---|---|---|
| 0a  | ✅ | プロトタイプ（index.html + FastAPI + SQLite） |
| 0b  | ✅ | モノレポ化 / Next.js 雛形 / docker-compose / .env.example |
| 1a  | ✅ | Postgres 移行 + Alembic 001〜005（baseline / auth / reviews / i18n / offerings） |
| 1b  | ✅ | Auth.js (Google/Email) + FastAPI セッション発行 + /me |
| 1c  | ✅ | /map を MapLibre + React で本実装（iframe 撤去） |
| 1d  | ✅ | /shrines/[slug] 詳細 (ISR / OpenGraph / JSON-LD / sitemap) |
| 1e  | ✅ | レビュー / リアクション / フォロー / 通知 / 通報 |
| 1f  | ✅ | 単発奉納（Stripe Checkout + Webhook） |
| 2   | 🔄 | **i18n routing / `/learn` / `/campaigns` / `/admin` スケルトン** |

---

## 設計ドキュメント

- [`MIGRATION.md`](./MIGRATION.md) — モノレポ移行の詳細
- `.env.example` — 全環境変数のテンプレート
- `apps/web/README.md` — Web アプリ個別 README
