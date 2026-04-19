import { NextResponse } from "next/server";
import { getSpot } from "@/lib/shrine-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isFinite(n)) {
    return NextResponse.json({ detail: "bad id" }, { status: 400 });
  }
  const row = getSpot(n);
  if (!row) return NextResponse.json({ detail: "not found" }, { status: 404 });
  return NextResponse.json(row);
}
