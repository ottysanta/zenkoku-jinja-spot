import { NextResponse, type NextRequest } from "next/server";
import { addReaction, removeReaction, reactionCountsFor } from "@/lib/shrine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/checkin-reactions
 *   body: { checkin_id, client_id, reaction: "like"|"helpful", remove?: true }
 *
 * GET /api/checkin-reactions?checkin_id=N
 *   → { like: n, helpful: n }
 */
export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("checkin_id") ?? 0);
  if (!id) return NextResponse.json({ like: 0, helpful: 0 });
  return NextResponse.json(reactionCountsFor(id));
}

export async function POST(req: NextRequest) {
  let body: {
    checkin_id?: number;
    client_id?: string;
    reaction?: "like" | "helpful";
    remove?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const id = Number(body.checkin_id ?? 0);
  const client = (body.client_id ?? "").trim();
  const reaction =
    body.reaction === "like" || body.reaction === "helpful" ? body.reaction : null;
  if (!id || !client || !reaction) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (body.remove) {
    const r = removeReaction(id, client, reaction);
    const counts = reactionCountsFor(id);
    return NextResponse.json({ ...counts, removed: r.removed });
  }
  const r = addReaction(id, client, reaction);
  const counts = reactionCountsFor(id);
  return NextResponse.json({ ...counts, created: r.created });
}
