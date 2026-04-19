import { NextResponse } from "next/server";
import { bulkImport, type BulkShrineIn } from "@/lib/shrine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST body: { shrines: BulkShrineIn[], source_layer?: string } */
export async function POST(req: Request) {
  let body: { shrines?: BulkShrineIn[]; source_layer?: string };
  try {
    body = (await req.json()) as { shrines?: BulkShrineIn[]; source_layer?: string };
  } catch {
    return NextResponse.json({ detail: "invalid json" }, { status: 400 });
  }
  const shrines = Array.isArray(body.shrines) ? body.shrines : [];
  if (!shrines.length) return NextResponse.json({ inserted: 0, updated: 0 });
  const result = bulkImport(shrines, body.source_layer ?? "osm");
  return NextResponse.json(result);
}
