import { requireAdmin } from "@/lib/security/admin";
import { NextResponse } from "next/server";
import { totalSpots, statsBySourceLayer, withPhotoCount, withDescriptionCount } from "@/lib/shrine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("response" in guard) return guard.response;
  return NextResponse.json({
    total: totalSpots(),
    by_source_layer: statsBySourceLayer(),
    with_photo: withPhotoCount(),
    with_description: withDescriptionCount(),
  });
}
