# @shrine-spots/types

`apps/api` (FastAPI) の OpenAPI スキーマから自動生成した TypeScript 型を、
モノレポ内の全 TS アプリ (`apps/web` など) で共有するための内部パッケージ。

## 中身

- `src/openapi.d.ts` … **自動生成ファイル。手で編集しないこと。**
  `openapi-typescript` が `paths` / `components` / `operations` を吐く。
- `src/index.ts` … 再エクスポートと `SpotDto` などの便利エイリアス。

## 再生成手順

### 1. API サーバが起動している場合（推奨）

```bash
# 別ターミナルで
npm run dev:api          # uvicorn が :8000 で起動

# 本パッケージの generate スクリプトを叩く
npm -w @shrine-spots/types run generate
```

内部的には `http://localhost:8000/openapi.json` を fetch して
`src/openapi.d.ts` に書き出す。

### 2. オフライン（サーバを起動できない／CI 等）

API 側の export スクリプトで `apps/api/openapi.json` を作り、
それをソースに `openapi-typescript` を走らせる。

```bash
# repo root で一発
npm run types:generate
```

これは以下と等価:

```bash
cd apps/api && py scripts/export_openapi.py
npm -w @shrine-spots/types run generate:file
```

手動で OpenAPI JSON だけ書き出したい場合:

```bash
cd apps/api
python -c "import json; from main import app; print(json.dumps(app.openapi()))" > openapi.json
```

## 利用側の規約

- `openapi.d.ts` は **絶対に手編集しない**。差分が出たら再生成する。
- 生成済みファイルは現状 Git にコミットする運用（利用側の `tsc` が通るように）。
- 型の追加は必ず API 側の Pydantic スキーマ (`apps/api/schemas.py`) で行い、
  本パッケージを再生成して取り込む。

## `apps/web` の移行方針

現在 `apps/web/lib/api.ts` に手書きの DTO (`Spot`, `Review` 等) が散在している。
段階的に以下へ置き換える:

```ts
// Before
import type { Spot } from "./api";

// After
import type { SpotDto } from "@shrine-spots/types";
```

移行ステップ:

1. まずは `@shrine-spots/types` を `apps/web/package.json` の `dependencies`
   に `"@shrine-spots/types": "*"` として追加（npm workspaces が解決する）。
2. 新規に書くコードから `SpotDto` / `ReviewDto` 等を使う。
3. 既存の手書き型は互換性を保つためしばらく残し、インポート元を順次
   `@shrine-spots/types` に差し替える。
4. 全置換が終わったら `apps/web/lib/api.ts` の型定義を削除。
