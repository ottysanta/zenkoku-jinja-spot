import { NextResponse, type NextRequest } from "next/server";
import { listSpots } from "@/lib/shrine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** /api/spots — 詳細フィールドを含む spot 一覧。bbox と limit に対応。 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(sp.get("limit") ?? 5000), 1), 50000);
  const featuredOnly = sp.get("featured_only") === "true";
  const prefecture = sp.get("prefecture") ?? undefined;
  let bbox: [number, number, number, number] | undefined;
  const bboxStr = sp.get("bbox");
  if (bboxStr) {
    const parts = bboxStr.split(",").map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      bbox = parts as [number, number, number, number];
    }
  }
  const rows = listSpots({ bbox, limit, featuredOnly, prefecture });
  return NextResponse.json(rows);
}
