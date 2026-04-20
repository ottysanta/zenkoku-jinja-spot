import { NextResponse, type NextRequest } from "next/server";
import { listCheckinsForClient } from "@/lib/shrine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/me/checkins?client_id=UUID
 * → checkin のリスト（神社名と一緒に）
 */
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ rows: [] });
  const rows = listCheckinsForClient(clientId, 200);
  return NextResponse.json({ rows });
}
