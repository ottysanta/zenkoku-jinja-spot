import { NextResponse } from "next/server";
import { prefectureCounts } from "@/lib/shrine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// メモリキャッシュ 5 分
let cache: { body: string; expires: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (!cache || cache.expires < now) {
    const rows = prefectureCounts();
    cache = { body: JSON.stringify(rows), expires: now + TTL_MS };
  }
  return new NextResponse(cache.body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
