/**
 * `@shrine-spots/types` のエントリポイント。
 *
 * 実体は `./openapi.d.ts`（openapi-typescript による自動生成）にある。
 * 初回はスタブのため、必ず以下のどちらかを実行してから利用すること:
 *
 *   - サーバ起動中:   `npm -w @shrine-spots/types run generate`
 *   - オフライン:      `npm run types:generate`  (repo root)
 *
 * 手書き型の追加は本ファイル末尾の「Convenience aliases」セクションにのみ行う。
 * `openapi.d.ts` は絶対に直接編集しないこと。
 */

export type { paths, components, operations } from "./openapi.d.ts";

import type { components } from "./openapi.d.ts";

// ---------------------------------------------------------------------------
// Convenience aliases
// ---------------------------------------------------------------------------
// `components["schemas"]["..."]` でのアクセスを省略するためのエイリアス。
// 初回生成前は `components["schemas"]` が `Record<string, unknown>` なので
// いずれも `unknown` になる。生成後に本来の型へ解決される。
// ---------------------------------------------------------------------------

type Schemas = components["schemas"];

/** スポット詳細 (`/spots/{id}` などの戻り値) */
export type SpotDto = Schemas extends { SpotOut: infer T } ? T : unknown;

/** レビュー (`/spots/{id}/reviews` などの戻り値) */
export type ReviewDto = Schemas extends { ReviewOut: infer T } ? T : unknown;
