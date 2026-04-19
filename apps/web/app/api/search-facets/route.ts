import { NextResponse, type NextRequest } from "next/server";
import {
  facetCountsForBenefits,
  facetCountsForShrineType,
  facetCountsForPrefecture,
  searchSpots,
} from "@/lib/shrine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/search-facets — Comfy 風「件数付きチェックボックス」のためのファセット集計。
 * クエリは検索条件(q/benefit/deity/prefecture/shrine_type)を受け取り、
 * 各次元の候補値 → 件数 と、現在の総件数を返す。
 */
const BENEFIT_PRESETS = [
  "縁結び",
  "商売繁盛",
  "合格祈願",
  "健康",
  "厄除け",
  "金運",
  "交通安全",
  "勝負運",
  "学業成就",
  "家内安全",
  "安産",
  "五穀豊穣",
  "開運",
  "病気平癒",
];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") || undefined;
  const benefit = sp.get("benefit") || undefined;
  const deity = sp.get("deity") || undefined;
  const prefecture = sp.get("prefecture") || undefined;
  const shrine_type = sp.get("shrine_type") || undefined;

  // 現在条件での総件数（条件ピル下に表示する "X 件"）
  const { total } = searchSpots({
    q,
    benefit,
    deity,
    prefecture,
    shrine_type,
    limit: 1,
    offset: 0,
  });

  const benefits = facetCountsForBenefits(
    { q, deity, prefecture, shrine_type },
    BENEFIT_PRESETS,
  );
  const shrineTypes = facetCountsForShrineType({ q, benefit, deity, prefecture });
  const prefectures = facetCountsForPrefecture({ q, benefit, deity, shrine_type });

  return NextResponse.json({
    total,
    benefits, // Record<string, number>
    shrine_types: shrineTypes, // [{value,count}]
    prefectures, // [{value,count}]
  });
}
