import { NextResponse, type NextRequest } from "next/server";
import {
  addBookmark,
  removeBookmark,
  bookmarkStateFor,
  bookmarkCountsFor,
  ownerKeyFor,
} from "@/lib/shrine-db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Kind = "want" | "like";

/**
 * 現在のリクエストに紐づくブックマークの owner_key を決定する。
 * - セッションがあれば provider:sub の providerKey を優先
 * - 無ければ client_id（端末紐付け）でフォールバック
 */
async function resolveOwnerKey(clientId: string | null): Promise<string | null> {
  const session = await auth().catch(() => null);
  const provider = session?.providerKey ?? null;
  const email = session?.user?.email ?? null;
  if (provider) return `auth:${provider}`;
  if (email) return `email:${email.toLowerCase()}`;
  return ownerKeyFor({ clientId });
}

/**
 * GET /api/bookmarks?spot_id=N[&client_id=UUID]
 *   → { want: bool, like: bool, counts: { want, like } }
 */
export async function GET(req: NextRequest) {
  const spotId = Number(req.nextUrl.searchParams.get("spot_id") ?? 0);
  if (!spotId) return NextResponse.json({ error: "missing spot_id" }, { status: 400 });
  const clientId = req.nextUrl.searchParams.get("client_id");
  const ownerKey = await resolveOwnerKey(clientId);
  const state = ownerKey ? bookmarkStateFor(spotId, ownerKey) : { want: false, like: false };
  const counts = bookmarkCountsFor(spotId);
  return NextResponse.json({ ...state, counts });
}

/**
 * POST /api/bookmarks
 *   body: { spot_id, kind: "want"|"like", remove?: boolean, client_id?: string }
 *   → 200 { want, like, counts }
 */
export async function POST(req: NextRequest) {
  let body: {
    spot_id?: number;
    kind?: Kind;
    remove?: boolean;
    client_id?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const spotId = Number(body.spot_id ?? 0);
  const kind: Kind | null =
    body.kind === "want" || body.kind === "like" ? body.kind : null;
  if (!spotId || !kind) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  const ownerKey = await resolveOwnerKey(body.client_id ?? null);
  if (!ownerKey) {
    return NextResponse.json(
      { error: "client_id が必要です（または Google でサインインしてください）" },
      { status: 400 },
    );
  }
  if (body.remove) {
    removeBookmark(spotId, ownerKey, kind);
  } else {
    addBookmark(spotId, ownerKey, kind);
  }
  const state = bookmarkStateFor(spotId, ownerKey);
  const counts = bookmarkCountsFor(spotId);
  return NextResponse.json({ ...state, counts });
}
