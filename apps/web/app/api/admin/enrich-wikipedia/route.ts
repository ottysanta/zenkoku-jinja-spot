import { NextResponse } from "next/server";
import { upsertEnrichment, type ShrineEnrichment } from "@/lib/shrine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST body: { items: ShrineEnrichment[] }
 *  - external_id 必須。description/photo_url など一部だけでも可 */
export async function POST(req: Request) {
  let body: { items?: ShrineEnrichment[] };
  try {
    body = (await req.json()) as { items?: ShrineEnrichment[] };
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return NextResponse.json({ updated: 0, missing: 0 });
  const result = upsertEnrichment(items);
  return NextResponse.json(result);
}
