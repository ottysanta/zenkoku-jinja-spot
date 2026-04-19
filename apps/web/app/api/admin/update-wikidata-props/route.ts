import { NextResponse } from "next/server";
// @ts-expect-error experimental
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function resolveDbPath(): string {
  const cands = [
    process.env.SHRINE_DB_PATH,
    path.resolve(process.cwd(), "../api/data/shrine_spots.db"),
    path.resolve(process.cwd(), "apps/api/data/shrine_spots.db"),
  ].filter(Boolean) as string[];
  for (const p of cands) if (fs.existsSync(p)) return p;
  throw new Error("shrine_spots.db not found");
}

/**
 * POST /api/admin/update-wikidata-props
 * body: { items: [{ external_id, deity?, founded?, city?, prefecture?, shrine_rank? }] }
 */
export async function POST(req: Request) {
  let body: { items?: Array<{ external_id: string; deity?: string; founded?: string; city?: string; prefecture?: string; shrine_rank?: string; shrine_type?: string }> };
  try { body = (await req.json()) as typeof body; } catch { return NextResponse.json({error:"invalid body"}, {status:400}); }
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return NextResponse.json({ updated: 0 });

  const db = new DatabaseSync(resolveDbPath());
  try { db.exec("PRAGMA journal_mode=WAL"); } catch {}

  const stmt = db.prepare(`
    UPDATE spots SET
      deity       = COALESCE(?, deity),
      founded     = COALESCE(?, founded),
      city        = COALESCE(?, city),
      prefecture  = COALESCE(?, prefecture),
      shrine_rank = COALESCE(?, shrine_rank),
      shrine_type = COALESCE(?, shrine_type)
    WHERE external_id = ?
  `);
  let updated = 0;
  db.exec("BEGIN");
  for (const it of items) {
    const info = stmt.run(
      it.deity || null,
      it.founded || null,
      it.city || null,
      it.prefecture || null,
      it.shrine_rank || null,
      it.shrine_type || null,
      it.external_id,
    );
    if ((info.changes ?? 0) > 0) updated++;
  }
  db.exec("COMMIT");
  db.close();
  return NextResponse.json({ updated });
}
