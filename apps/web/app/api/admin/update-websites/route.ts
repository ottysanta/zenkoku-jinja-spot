import { NextResponse } from "next/server";
// @ts-expect-error experimental
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveDbPath(): string {
  const cands = [
    process.env.SHRINE_DB_PATH,
    path.resolve(process.cwd(), "../api/data/shrine_spots.db"),
    path.resolve(process.cwd(), "apps/api/data/shrine_spots.db"),
  ].filter(Boolean) as string[];
  for (const p of cands) if (fs.existsSync(p)) return p;
  throw new Error("shrine_spots.db not found");
}

export async function POST(req: Request) {
  let body: { items?: Array<{ external_id: string; website: string }> };
  try { body = (await req.json()) as typeof body; } catch { return NextResponse.json({error:"invalid body"}, {status:400}); }
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return NextResponse.json({ updated: 0 });
  const db = new DatabaseSync(resolveDbPath());
  try { db.exec("PRAGMA journal_mode=WAL"); } catch {}
  const stmt = db.prepare("UPDATE spots SET website = COALESCE(website, ?) WHERE external_id = ?");
  let updated = 0;
  db.exec("BEGIN");
  for (const it of items) {
    if (!it.external_id || !it.website) continue;
    const info = stmt.run(it.website, it.external_id);
    if ((info.changes ?? 0) > 0) updated++;
  }
  db.exec("COMMIT");
  db.close();
  return NextResponse.json({ updated });
}
