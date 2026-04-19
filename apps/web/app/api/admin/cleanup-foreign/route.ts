import { NextResponse } from "next/server";
// @ts-ignore experimental
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

const JP_PREFS = new Set([
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県",
  "埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県",
  "佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
]);

// 日本の緩めの外接 bbox (西: 与那国島, 東: 南鳥島, 南: 沖ノ鳥島, 北: 択捉島)
// 南鳥島 153.98 / 沖ノ鳥島 136.08(緯度 20.42) / 与那国島 122.93 / 択捉 148, 45.55
const JP_BBOX = { minLng: 122.0, maxLng: 154.0, minLat: 20.0, maxLat: 46.0 };

/** POST /api/admin/cleanup-foreign
 *  海外(非日本)に誤って登録された神社を削除。
 *  1) 緯度経度が日本のbbox外
 *  2) prefecture が 47都道府県名と一致せず、かつ 日本のbbox外
 *  3) prefecture に台湾・韓国・パラオ等の既知地名を含むもの
 */
export async function POST() {
  const db = new DatabaseSync(resolveDbPath());
  try { db.exec("PRAGMA journal_mode=WAL"); } catch {}

  // 1) bbox外は無条件で削除
  const bboxDel = db
    .prepare(
      "DELETE FROM spots WHERE lat < ? OR lat > ? OR lng < ? OR lng > ?",
    )
    .run(JP_BBOX.minLat, JP_BBOX.maxLat, JP_BBOX.minLng, JP_BBOX.maxLng);
  const deletedOutOfBbox = Number(bboxDel.changes ?? 0);

  // 2) prefecture が非47都道府県 → NULL に戻し再分類候補にする (削除はしない)
  const rows = db
    .prepare("SELECT id, prefecture FROM spots WHERE prefecture IS NOT NULL AND prefecture != ''")
    .all() as Array<{ id: number; prefecture: string }>;
  const clearStmt = db.prepare("UPDATE spots SET prefecture = NULL WHERE id = ?");
  let clearedPref = 0;
  db.exec("BEGIN");
  for (const r of rows) {
    if (!JP_PREFS.has(r.prefecture)) {
      clearStmt.run(r.id);
      clearedPref++;
    }
  }
  db.exec("COMMIT");

  // 3) source_layer='wikidata' で prefecture=NULL になったものの中で、
  //    日本bbox外縁で怪しいもの(韓国半島・台湾島)を削除。
  //    韓国半島: 124-131 lng, 33-39 lat で JPの九州以外
  //    台湾: 119-122 lng, 21-25 lat
  //    → これらは JP_BBOX の下限外になるので 1) で既に消えているはずだが、
  //       与那国島周辺など bbox 内でも「台湾扱い」の神社があるので追加削除
  const suspicious = db.prepare(
    `DELETE FROM spots WHERE source_layer = 'wikidata'
       AND prefecture IS NULL
       AND (
         (lat BETWEEN 21 AND 26 AND lng BETWEEN 120 AND 123)    -- 台湾北部
         OR (lat BETWEEN 33 AND 39 AND lng BETWEEN 126 AND 131 AND NOT (
             lat BETWEEN 33.0 AND 35.6 AND lng BETWEEN 128.0 AND 131.0  -- 九州西部
         ))
       )`
  ).run();

  const total = (db.prepare("SELECT COUNT(*) AS n FROM spots").get() as { n: number }).n;
  db.close();
  return NextResponse.json({
    deleted_out_of_bbox: deletedOutOfBbox,
    cleared_non_jp_pref: clearedPref,
    deleted_suspicious_asia: Number(suspicious.changes ?? 0),
    remaining_total: total,
  });
}
