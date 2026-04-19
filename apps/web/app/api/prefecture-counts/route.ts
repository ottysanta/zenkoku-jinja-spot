import { NextResponse } from "next/server";
import { prefectureCounts } from "@/lib/shrine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** /api/prefecture-counts — 都道府県 → 件数のリスト。ヒートマップ用。 */
export async function GET() {
  return NextResponse.json(prefectureCounts());
}
