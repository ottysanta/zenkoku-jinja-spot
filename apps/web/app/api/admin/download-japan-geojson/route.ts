import { NextResponse } from "next/server";
import { writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TARGET = path.resolve(process.cwd(), "public/japan-prefectures.geojson");

// 候補を順に試して最初に成功したものを使う。
// 各 URL はサイズ目安をコメント：gzipで更に 1/3〜1/4 になる。
const CANDIDATES = [
  process.env.JAPAN_GEOJSON_URL,
  // ~300KB, 都道府県ポリゴンを簡略化した版
  "https://raw.githubusercontent.com/piuccio/open-data-jp-prefectures-geojson/master/prefectures.geojson",
  // ~5MB, geojson （重め）
  "https://raw.githubusercontent.com/niiyz/JapanCityGeoJson/master/geojson/prefectures/prefectures.geojson",
  // ~13MB, 最大精度
  "https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson",
].filter(Boolean) as string[];

/**
 * 日本の都道府県 GeoJSON を public/ にダウンロードする管理用エンドポイント。
 * - 既にファイルがあって sizeHint 以上ならスキップ（force=true で再取得）
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";
  try {
    if (!force) {
      try {
        const st = await stat(TARGET);
        if (st.size > 10_000 && st.size < 2_000_000) {
          // 既に小さめの版が落ちていれば skip
          return NextResponse.json({ skipped: true, size: st.size, path: TARGET });
        }
      } catch {}
    }
    const maxBytes = Number(url.searchParams.get("max_bytes") ?? 1_500_000);
    const errors: Array<{ source: string; reason: string }> = [];
    for (const source of CANDIDATES) {
      try {
        const r = await fetch(source, {
          headers: { "User-Agent": "ZenkokuJinjaSpot/0.1" },
        });
        if (!r.ok) {
          errors.push({ source, reason: `status ${r.status}` });
          continue;
        }
        const text = await r.text();
        if (text.length > maxBytes) {
          errors.push({ source, reason: `too-large ${text.length}` });
          continue;
        }
        try {
          JSON.parse(text);
        } catch {
          errors.push({ source, reason: "invalid json" });
          continue;
        }
        await mkdir(path.dirname(TARGET), { recursive: true });
        await writeFile(TARGET, text, "utf8");
        return NextResponse.json({
          ok: true,
          bytes: Buffer.byteLength(text, "utf8"),
          source,
          path: TARGET,
          tried: errors,
        });
      } catch (e) {
        errors.push({
          source,
          reason: e instanceof Error ? e.message : String(e),
        });
      }
    }
    return NextResponse.json({ error: "no source succeeded", tried: errors }, { status: 502 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const st = await stat(TARGET);
    return NextResponse.json({ exists: true, size: st.size, path: TARGET });
  } catch {
    return NextResponse.json({ exists: false, path: TARGET });
  }
}
