import { NextResponse, type NextRequest } from "next/server";
import { listBookmarksForOwner, ownerKeyFor } from "@/lib/shrine-db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/me/bookmarks?kind=want|like&client_id=UUID
 * → ShrineRow[] + bookmark_kind + bookmarked_at
 */
export async function GET(req: NextRequest) {
  const session = await auth().catch(() => null);
  const providerKey = session?.providerKey ?? null;
  const email = session?.user?.email ?? null;
  const clientId = req.nextUrl.searchParams.get("client_id");
  const kindQ = req.nextUrl.searchParams.get("kind");
  const kind =
    kindQ === "want" || kindQ === "like" ? (kindQ as "want" | "like") : undefined;

  let ownerKey: string | null = null;
  if (providerKey) ownerKey = `auth:${providerKey}`;
  else if (email) ownerKey = `email:${email.toLowerCase()}`;
  else ownerKey = ownerKeyFor({ clientId });
  if (!ownerKey) {
    return NextResponse.json({ rows: [] });
  }

  const rows = listBookmarksForOwner(ownerKey, kind);
  return NextResponse.json({ rows, ownerKey });
}
