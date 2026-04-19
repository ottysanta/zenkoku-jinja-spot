import { NextResponse, type NextRequest } from "next/server";
// @ts-expect-error experimental
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 全数ループで秒〜十秒かかるのでタイムアウトを少し長く
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
 * city が埋まっていない spot について、同じ都道府県内で最近傍の「city を持つ spot」の city をコピーする。
 * - 50km 以上離れていたらスキップ（過推定を避ける）
 * - O(n*m) 同県内。日本のどの県でも city-有 spot が数百以内なので問題なし
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const maxKm = Number(url.searchParams.get("max_km") ?? 15);
  const db = new DatabaseSync(resolveDbPath());
  try { db.exec("PRAGMA journal_mode=WAL"); } catch {}

  type Row = { id: number; prefecture: string | null; lat: number; lng: number; city: string | null };
  const all = db
    .prepare("SELECT id, prefecture, lat, lng, city FROM spots")
    .all() as Row[];
  // 県別にバケツ分け
  const byPref = new Map<string, { anchors: Row[]; targets: Row[] }>();
  for (const r of all) {
    const key = r.prefecture ?? "_unknown";
    const group = byPref.get(key) ?? { anchors: [], targets: [] };
    if (r.city && r.city.trim()) group.anchors.push(r);
    else group.targets.push(r);
    byPref.set(key, group);
  }

  function distKm(a: Row, b: Row): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const la1 = (a.lat * Math.PI) / 180;
    const la2 = (b.lat * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  const update = db.prepare("UPDATE spots SET city = ? WHERE id = ? AND (city IS NULL OR city = '')");
  let updated = 0;
  let tooFar = 0;
  let noAnchors = 0;

  db.exec("BEGIN");
  for (const [_pref, group] of byPref) {
    void _pref;
    if (group.anchors.length === 0) { noAnchors += group.targets.length; continue; }
    for (const t of group.targets) {
      // 最近傍検索（県内だけ）
      let best: { d: number; city: string } | null = null;
      for (const a of group.anchors) {
        const d = distKm(t, a);
        if (d > maxKm) continue;
        if (!best || d < best.d) best = { d, city: a.city! };
      }
      if (!best) { tooFar++; continue; }
      update.run(best.city, t.id);
      updated++;
    }
  }
  db.exec("COMMIT");

  const withCity = (db.prepare("SELECT COUNT(*) AS n FROM spots WHERE city IS NOT NULL AND city != ''").get() as { n: number }).n;
  db.close();
  return NextResponse.json({
    updated,
    too_far_skip: tooFar,
    no_anchors_skip: noAnchors,
    with_city: withCity,
    max_km: maxKm,
  });
}
