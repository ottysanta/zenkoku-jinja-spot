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

function resolveGeoJsonPath(): string {
  return path.resolve(process.cwd(), "public/japan-prefectures-simplified.geojson");
}

type Ring = [number, number][]; // [lng, lat]
type PolyFeature = {
  type: "Feature";
  properties: { nam_ja?: string; nam?: string; name?: string };
  geometry:
    | { type: "Polygon"; coordinates: Ring[] }
    | { type: "MultiPolygon"; coordinates: Ring[][] };
};

function pointInRing(x: number, y: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(x: number, y: number, rings: Ring[]): boolean {
  if (rings.length === 0) return false;
  if (!pointInRing(x, y, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) if (pointInRing(x, y, rings[i])) return false;
  return true;
}

function ringBbox(ring: Ring): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

/** /api/admin/fix-prefectures-by-coords
 *  全 spot の (lat,lng) をポリゴンで判定し、正しい prefecture に更新。
 */
export async function POST() {
  const raw = await fs.promises.readFile(resolveGeoJsonPath(), "utf8");
  const fc = JSON.parse(raw) as { features: PolyFeature[] };
  // 県ごとの MultiPolygon 化 (bbox キャッシュ付き)
  type Pref = {
    name: string;
    polys: Array<{ rings: Ring[]; bbox: [number, number, number, number] }>;
    bbox: [number, number, number, number];
  };
  const prefs: Pref[] = [];
  for (const f of fc.features) {
    const name =
      f.properties.nam_ja || f.properties.name || "";
    if (!name) continue;
    const polys: Array<{ rings: Ring[]; bbox: [number, number, number, number] }> = [];
    if (f.geometry.type === "Polygon") {
      polys.push({ rings: f.geometry.coordinates as Ring[], bbox: ringBbox((f.geometry.coordinates as Ring[])[0]) });
    } else {
      for (const p of f.geometry.coordinates as Ring[][]) {
        polys.push({ rings: p as Ring[], bbox: ringBbox(p[0] as Ring) });
      }
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of polys) {
      if (p.bbox[0] < minX) minX = p.bbox[0];
      if (p.bbox[1] < minY) minY = p.bbox[1];
      if (p.bbox[2] > maxX) maxX = p.bbox[2];
      if (p.bbox[3] > maxY) maxY = p.bbox[3];
    }
    prefs.push({ name, polys, bbox: [minX, minY, maxX, maxY] });
  }

  function classify(lng: number, lat: number): string | null {
    for (const pref of prefs) {
      if (lng < pref.bbox[0] || lng > pref.bbox[2] || lat < pref.bbox[1] || lat > pref.bbox[3]) continue;
      for (const p of pref.polys) {
        if (lng < p.bbox[0] || lng > p.bbox[2] || lat < p.bbox[1] || lat > p.bbox[3]) continue;
        if (pointInPolygon(lng, lat, p.rings)) return pref.name;
      }
    }
    return null;
  }

  const db = new DatabaseSync(resolveDbPath());
  try { db.exec("PRAGMA journal_mode=WAL"); } catch {}
  const rows = db.prepare("SELECT id, lat, lng, prefecture FROM spots").all() as Array<{
    id: number; lat: number; lng: number; prefecture: string | null;
  }>;
  const update = db.prepare("UPDATE spots SET prefecture = ? WHERE id = ?");
  let corrected = 0;
  let unchanged = 0;
  let unknown = 0;
  db.exec("BEGIN");
  for (const r of rows) {
    const correct = classify(r.lng, r.lat);
    if (!correct) { unknown++; continue; }
    if (r.prefecture !== correct) {
      update.run(correct, r.id);
      corrected++;
    } else {
      unchanged++;
    }
  }
  db.exec("COMMIT");
  db.close();

  return NextResponse.json({ processed: rows.length, corrected, unchanged, unknown });
}
