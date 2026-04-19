import { NextResponse } from "next/server";
import { listSpots } from "@/lib/shrine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/spots/geojson — 全 spot を軽量な GeoJSON FeatureCollection で返す。
 *
 * パフォーマンス最適化:
 *   - 座標精度は小数4桁 (~11m 精度) にトリム → 文字列を大幅に圧縮
 *   - クラスタリングに不要なフィールド (source_layer/rank_class 等) は省略
 *   - Node プロセスのメモリ内で 5 分キャッシュ → SQLite 再クエリを回避
 *   - HTTP キャッシュ 5 分 / CDN キャッシュ 30 分
 */
type CacheEntry = { body: string; expires: number };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
let cache: CacheEntry | null = null;

function buildBody(): string {
  const rows = listSpots({ limit: 50000 });
  const features: unknown[] = [];
  for (const r of rows) {
    if (typeof r.lat !== "number" || typeof r.lng !== "number") continue;
    // 座標精度を4桁 (~11m) に丸める
    const lng = Math.round(r.lng * 10000) / 10000;
    const lat = Math.round(r.lat * 10000) / 10000;
    features.push({
      type: "Feature",
      id: r.id,
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        id: r.id,
        name: r.name,
        prefecture: r.prefecture || null,
      },
    });
  }
  return JSON.stringify({ type: "FeatureCollection", features });
}

export async function GET() {
  const now = Date.now();
  if (!cache || cache.expires < now) {
    cache = { body: buildBody(), expires: now + CACHE_TTL_MS };
  }
  return new NextResponse(cache.body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
