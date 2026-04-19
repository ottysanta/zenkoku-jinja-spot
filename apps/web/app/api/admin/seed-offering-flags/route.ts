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

/**
 * manual source_layer の 31 社を「オンライン志納 対応」にマークする。
 * 実運用では宗教法人登録・口座確認・書面同意をもって個別に true にしていく想定。
 * ここはデモ用のシード。
 */
export async function POST() {
  const db = new DatabaseSync(resolveDbPath());
  try { db.exec("PRAGMA journal_mode=WAL"); } catch {}
  const cols = new Set(
    (db.prepare("PRAGMA table_info(spots)").all() as { name: string }[]).map((r) => r.name),
  );
  if (!cols.has("accepts_offerings")) {
    db.exec("ALTER TABLE spots ADD COLUMN accepts_offerings INTEGER");
  }
  const info = db
    .prepare(
      "UPDATE spots SET accepts_offerings = 1 WHERE source_layer = 'manual' AND (accepts_offerings IS NULL OR accepts_offerings = 0)",
    )
    .run();
  const total = (db.prepare("SELECT COUNT(*) AS n FROM spots WHERE accepts_offerings = 1").get() as { n: number }).n;
  db.close();
  return NextResponse.json({ updated: info.changes, total_accepting: total });
}
