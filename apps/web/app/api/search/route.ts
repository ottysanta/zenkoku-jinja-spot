import { NextResponse, type NextRequest } from "next/server";
import { searchSpots } from "@/lib/shrine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** /api/search — FastAPI 非依存の検索エンドポイント。{rows, total} を返す。 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") || undefined;
  const benefit = sp.get("benefit") || undefined;
  const deity = sp.get("deity") || undefined;
  const prefecture = sp.get("prefecture") || undefined;
  const shrine_type = sp.get("shrine_type") || undefined;
  const limit = Math.min(Math.max(Number(sp.get("limit") ?? 200), 1), 1000);
  const offset = Math.max(Number(sp.get("offset") ?? 0), 0);
  const format = sp.get("format");

  const { rows, total } = searchSpots({
    q,
    benefit,
    deity,
    prefecture,
    shrine_type,
    limit,
    offset,
  });

  // 既存の searchShrines クライアントが単純配列を期待しているので、
  // ?format=full のときだけ {rows,total} 形式で返す。
  if (format === "full") {
    return NextResponse.json({ rows, total });
  }
  return NextResponse.json(rows);
}
