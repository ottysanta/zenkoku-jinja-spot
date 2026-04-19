import { NextResponse, type NextRequest } from "next/server";
import { listEnrichmentCandidates } from "@/lib/shrine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** /api/admin/enrichment-candidates?limit=200
 * description 未充填 + wikipedia_title あり の spot リスト。
 */
export async function GET(req: NextRequest) {
  const limit = Math.min(
    Math.max(Number(req.nextUrl.searchParams.get("limit") ?? 300), 1),
    3000,
  );
  return NextResponse.json(listEnrichmentCandidates(limit));
}
