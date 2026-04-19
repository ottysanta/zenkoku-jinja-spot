import { NextResponse } from "next/server";
import { extractCity } from "@/lib/shrine-db";
// @ts-ignore experimental
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveDbPath(): string {
  const candidates = [
    process.env.SHRINE_DB_PATH,
    path.resolve(process.cwd(), "../api/data/shrine_spots.db"),
    path.resolve(process.cwd(), "apps/api/data/shrine_spots.db"),
  ].filter(Boolean) as string[];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error("shrine_spots.db not found");
}

/** /api/admin/backfill-city — 全 spot の address から city を抽出して UPDATE */
export async function POST() {
  const db = new DatabaseSync(resolveDbPath());
  try { db.exec("PRAGMA journal_mode=WAL"); } catch {}
  // city 列が無ければ追加
  const cols = new Set(
    (db.prepare("PRAGMA table_info(spots)").all() as { name: string }[]).map((r) => r.name),
  );
  if (!cols.has("city")) db.exec("ALTER TABLE spots ADD COLUMN city TEXT");

  const rows = db
    .prepare(
      "SELECT id, prefecture, address FROM spots WHERE address IS NOT NULL AND address != ''",
    )
    .all() as Array<{ id: number; prefecture: string | null; address: string | null }>;
  const update = db.prepare("UPDATE spots SET city = ? WHERE id = ? AND (city IS NULL OR city = '')");
  let updated = 0;
  let skipped = 0;
  db.exec("BEGIN");
  for (const r of rows) {
    const c = extractCity(r.address, r.prefecture);
    if (!c) { skipped++; continue; }
    const info = update.run(c, r.id);
    if ((info.changes ?? 0) > 0) updated++;
  }
  db.exec("COMMIT");
  const withCity = (db.prepare("SELECT COUNT(*) AS n FROM spots WHERE city IS NOT NULL AND city != ''").get() as { n: number }).n;
  db.close();
  return NextResponse.json({
    processed: rows.length,
    updated,
    skipped,
    with_city: withCity,
  });
}
