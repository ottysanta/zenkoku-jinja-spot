import { NextResponse } from "next/server";
import { listSpots } from "@/lib/shrine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/spots/geojson — 全 spot を軽量な GeoJSON FeatureCollection で返す。
 *
 * MapLibre の cluster source に直接渡すため、clustering に不要なフィールドは除外。
 * 25k+ 件を想定（≈ 数 MB、gzip 後は 500KB 程度）。
 */
// 神社の規模を一般ユーザー向けの 4 段階にまとめる。
// 優先順:
//   0. shrine_type が「祠 / 末社 / 摂社 / 境内社」→ hokora（手前に出す小さな社）
//   1. manual（編集部セレクト） → large
//   2. confidence_score（存在すれば） 0-100
//   3. shrine_rank（別表神社 / 官幣大社 / 国幣大社 は large）
//   4. photo_url 有り → medium
//   5. それ以外 → small
const LARGE_RANK_KEYWORDS = ["別表神社", "官幣大社", "国幣大社"];
const HOKORA_TYPE_RE = /祠|末社|摂社|境内社/;

function deriveRankClass(r: {
  source_layer: string | null;
  shrine_rank: string | null;
  shrine_type: string | null;
  photo_url: string | null;
  confidence_score?: number | null;
}): "large" | "medium" | "small" | "hokora" {
  // 祠・末社は他の判定より優先（manual に混ざっていても小さく表示するのが自然）
  if (r.shrine_type && HOKORA_TYPE_RE.test(r.shrine_type)) return "hokora";
  if (r.source_layer === "manual") return "large";
  const score = typeof r.confidence_score === "number" ? r.confidence_score : null;
  if (score != null) {
    if (score >= 80) return "large";
    if (score >= 60) return "medium";
    return "small";
  }
  if (r.shrine_rank && LARGE_RANK_KEYWORDS.some((k) => r.shrine_rank!.includes(k))) {
    return "large";
  }
  if (r.photo_url) return "medium";
  return "small";
}

export async function GET() {
  const rows = listSpots({ limit: 50000 });
  const features = rows
    .filter((r) => typeof r.lat === "number" && typeof r.lng === "number")
    .map((r) => ({
      type: "Feature" as const,
      id: r.id,
      geometry: {
        type: "Point" as const,
        coordinates: [r.lng, r.lat],
      },
      properties: {
        id: r.id,
        name: r.name,
        source_layer: r.source_layer,
        prefecture: r.prefecture,
        featured: r.source_layer === "manual" ? 1 : 0,
        rank_class: deriveRankClass(
          r as unknown as {
            source_layer: string | null;
            shrine_rank: string | null;
            shrine_type: string | null;
            photo_url: string | null;
            confidence_score?: number | null;
          },
        ),
      },
    }));
  return NextResponse.json(
    { type: "FeatureCollection", features },
    {
      headers: {
        // ブラウザキャッシュ 1 分、CDN キャッシュ 5 分（データ更新は低頻度）
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    },
  );
}
