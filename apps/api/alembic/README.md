# Alembic マイグレーション

`apps/api/` をカレントにして実行します。接続先は `DATABASE_URL` 環境変数（未設定時は SQLite `data/shrine_spots.db`）。

## よく使うコマンド

```bash
cd apps/api

# 現在のリビジョン確認
alembic current

# マイグレーションを最新まで適用
alembic upgrade head

# 新しいマイグレーションを自動生成（モデル変更後）
alembic revision --autogenerate -m "add reviews"

# 空のマイグレーションを作成
alembic revision -m "manual data backfill"

# 1 段ロールバック
alembic downgrade -1
```

## 方針

- `alembic/versions/` に時系列でリビジョン。
- SQLite でもある程度 ALTER できるよう `render_as_batch` を有効化。
- 本番は Postgres 16 + PostGIS 前提（`ops/postgres/init/00-extensions.sql` で拡張を有効化）。
- 破壊的変更は新しいリビジョンとして追加し、既存リビジョンは編集しない。
