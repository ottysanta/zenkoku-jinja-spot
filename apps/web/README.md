# @shrine-spots/web

全国神社スポットの Next.js 15 (App Router) フロントエンド。

## 現状（Phase 0b）

- `/` ホーム — プレースホルダ（ナビ入口）
- `/map` 地図検索 — **旧プロトタイプを iframe で暫定提供**（機能は完全）
- API は FastAPI (apps/api) に相対パスでプロキシ（`next.config.mjs` の `rewrites`）

## 次に実装するもの（Phase 1c〜）

- `/map` を MapLibre + React で真のネイティブ実装に置き換え
- `/shrines/[slug]` 詳細ページ（ISR / OG / 構造化データ）
- `/review/new` レビュー投稿
- `/me/*` マイページ
- `/offerings/*` 奉納フロー
- i18n ルーティング（`/ja`, `/en`, `/zh-Hans`…）

## 開発

```bash
# 1) 依存インストール（初回のみ）
npm install

# 2) API を別ターミナルで起動
cd ../api
uvicorn main:app --reload --port 8000

# 3) Web 起動
cd ../web
npm run dev
# → http://localhost:3000
```

## 環境変数

`.env.local` を作成（ルートの `.env.example` 参照）:

```
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_LEGACY_MAP_URL=/legacy-map
```
