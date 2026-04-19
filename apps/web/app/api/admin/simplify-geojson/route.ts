import { NextResponse } from "next/server";
import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * public/japan-prefectures.geojson (dataofjapan 版・約 13MB) を、
 * 素朴な距離しきい値＋間引きで ~1MB 未満に圧縮する。
 *
 * - Douglas-Peucker を短く自作: (連続点の距離が threshold 未満なら削除)
 * - properties は nam_ja（都道府県名）と nam（ENG）だけ残す
 * - 結果を public/japan-prefectures-simplified.geojson に書く
 */
const SOURCE = path.resolve(
  process.cwd(),
  "public/japan-prefectures.geojson",
);
const TARGET = path.resolve(
  process.cwd(),
  "public/japan-prefectures-simplified.geojson",
);

type Ring = [number, number][];

function simplifyRing(ring: Ring, tol: number): Ring {
  if (ring.length <= 4) return ring;
  const out: Ring = [ring[0]];
  let prev = ring[0];
  for (let i = 1; i < ring.length - 1; i++) {
    const [x, y] = ring[i];
    const dx = x - prev[0];
    const dy = y - prev[1];
    if (dx * dx + dy * dy >= tol * tol) {
      out.push(ring[i]);
      prev = ring[i];
    }
  }
  out.push(ring[ring.length - 1]);
  // GeoJSON polygon ring は最初と最後が同じである必要がある
  if (
    out.length > 0 &&
    (out[0][0] !== out[out.length - 1][0] ||
      out[0][1] !== out[out.length - 1][1])
  ) {
    out.push(out[0]);
  }
  return out;
}

type PolygonCoords = Ring[]; // Polygon = [outer, ...holes]
type MultiPolygonCoords = Ring[][];

function simplifyGeometry(
  geom:
    | { type: "Polygon"; coordinates: PolygonCoords }
    | { type: "MultiPolygon"; coordinates: MultiPolygonCoords }
    | { type: string; coordinates: unknown },
  tol: number,
) {
  if (geom.type === "Polygon") {
    const p = geom as { type: "Polygon"; coordinates: PolygonCoords };
    return {
      type: "Polygon",
      coordinates: p.coordinates.map((ring) => simplifyRing(ring as Ring, tol)),
    };
  }
  if (geom.type === "MultiPolygon") {
    const mp = geom as { type: "MultiPolygon"; coordinates: MultiPolygonCoords };
    return {
      type: "MultiPolygon",
      coordinates: mp.coordinates.map((poly) =>
        poly.map((ring) => simplifyRing(ring as Ring, tol)),
      ),
    };
  }
  return geom;
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const tol = Number(url.searchParams.get("tol") ?? 0.02);
    const s = await stat(SOURCE);
    if (s.size < 10_000) {
      return NextResponse.json(
        { error: "source too small", size: s.size },
        { status: 400 },
      );
    }
    const raw = await readFile(SOURCE, "utf8");
    const fc = JSON.parse(raw) as {
      type: "FeatureCollection";
      features: Array<{
        type: "Feature";
        properties: Record<string, unknown>;
        geometry: {
          type: "Polygon" | "MultiPolygon";
          coordinates: unknown;
        };
      }>;
    };
    const keepProps = ["nam_ja", "nam", "name", "name_ja", "pref_code", "id"];
    const outFeatures = fc.features.map((f) => {
      const nextProps: Record<string, unknown> = {};
      for (const k of keepProps) if (k in f.properties) nextProps[k] = f.properties[k];
      // 名前が無ければ抽出を試みる
      if (!nextProps.nam_ja && f.properties["nam"]) nextProps.name = f.properties["nam"];
      return {
        type: "Feature",
        properties: nextProps,
        geometry: simplifyGeometry(
          f.geometry as { type: "Polygon"; coordinates: PolygonCoords },
          tol,
        ),
      };
    });
    const simplified = { type: "FeatureCollection", features: outFeatures };
    const text = JSON.stringify(simplified);
    await writeFile(TARGET, text, "utf8");
    return NextResponse.json({
      ok: true,
      input_bytes: s.size,
      output_bytes: Buffer.byteLength(text, "utf8"),
      features: outFeatures.length,
      tolerance: tol,
      path: TARGET,
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 500 },
    );
  }
}
