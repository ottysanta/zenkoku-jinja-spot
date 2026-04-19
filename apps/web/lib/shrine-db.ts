/**
 * Next.js Route Handler から SQLite を直接読み書きするためのラッパ。
 * - node:sqlite（Node.js 22+ built-in、experimental）を使用
 * - FastAPI の再起動に依存せず spots テーブルの新カラムを即時返せる
 * - 書き込みは trusted な admin ルートからのみ呼ぶ
 */
// @ts-ignore node:sqlite is experimental and not typed in older @types/node
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

export type ShrineRow = {
  id: number;
  name: string;
  slug: string | null;
  address: string | null;
  lat: number;
  lng: number;
  shrine_type: string | null;
  deity: string | null;
  benefits: string | null;
  shrine_rank: string | null;
  founded: string | null;
  goshuin_available: number | null;
  goshuin_info: string | null;
  juyohin_info: string | null;
  prefecture: string | null;
  city: string | null;
  accepts_offerings: number | null;
  website: string | null;
  external_id: string | null;
  source_layer: string | null;
  access_info: string | null;
  source_url: string | null;
  photo_url: string | null;
  photo_attribution: string | null;
  description: string | null;
  history: string | null;
  highlights: string | null;
  wikipedia_title: string | null;
  wikipedia_url: string | null;
};

/**
 * 住所文字列から「〜市」「〜区」「〜町」「〜村」「〜郡〜町」を抽出。
 * 都道府県プレフィックスを剥がしてから最初の該当語までを city とする。
 * 例) 「島根県出雲市大社町杵築東195」→「出雲市」
 * 例) 「東京都千代田区神田神保町」→「千代田区」
 * 例) 「鹿児島県姶良郡湧水町」→「姶良郡湧水町」
 */
export function extractCity(
  address: string | null | undefined,
  prefecture: string | null | undefined,
): string | null {
  if (!address) return null;
  let rest = address.trim();
  if (prefecture && rest.startsWith(prefecture)) rest = rest.slice(prefecture.length);
  rest = rest.replace(/^(?:都|道|府|県)/, ""); // Safety strip if prefix was weird

  // 郡がある場合は「〜郡〜(町|村)」まで拾う
  const gunMatch = rest.match(/^([^\s0-9一二三四五六七八九十０-９]+?郡[^\s0-9一二三四五六七八九十０-９]+?(?:町|村))/);
  if (gunMatch) return gunMatch[1];
  // 通常の市・区・町・村
  const m = rest.match(/^([^\s0-9一二三四五六七八九十０-９]+?(?:市|区|町|村))/);
  if (m) return m[1];
  return null;
}

let _db: InstanceType<typeof DatabaseSync> | null = null;

function resolveDbPath(): string {
  // apps/web から見た相対 + Vercel サーバーレスの可能性のあるパス + /tmp fallback
  const candidates = [
    process.env.SHRINE_DB_PATH,
    path.resolve(process.cwd(), "../api/data/shrine_spots.db"),
    path.resolve(process.cwd(), "apps/api/data/shrine_spots.db"),
    "/var/task/apps/api/data/shrine_spots.db",
    "/var/task/api/data/shrine_spots.db",
    "/tmp/shrine_spots.db",
  ].filter(Boolean) as string[];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  // Fallback: download from SHRINE_DB_URL to /tmp (Vercel serverless cold-start path)
  const url = process.env.SHRINE_DB_URL;
  if (url) {
    const dest = "/tmp/shrine_spots.db";
    try {
      const { execSync } = require("node:child_process");
      console.log(`[shrine-db] downloading ${url} -> ${dest}`);
      execSync(`curl -sL --max-time 60 -o "${dest}" "${url}"`, { stdio: "ignore" });
      if (fs.existsSync(dest)) {
        const size = fs.statSync(dest).size;
        console.log(`[shrine-db] downloaded ${(size/1024/1024).toFixed(1)}MB`);
        return dest;
      }
    } catch (e) {
      console.error("[shrine-db] fallback download failed:", e);
    }
  }
  throw new Error("shrine_spots.db not found. Set SHRINE_DB_PATH or SHRINE_DB_URL env.");
}

function getDb() {
  if (_db) return _db;
  const p = resolveDbPath();
  _db = new DatabaseSync(p);
  // パフォーマンス: WAL モード
  try { _db.exec("PRAGMA journal_mode=WAL"); } catch {}
  // 新カラムが存在することを保証（無ければ追加）
  const existing = new Set(
    (_db.prepare("PRAGMA table_info(spots)").all() as { name: string }[]).map(
      (r) => r.name,
    ),
  );
  const needed: Array<[string, string]> = [
    ["photo_url", "TEXT"],
    ["photo_attribution", "TEXT"],
    ["description", "TEXT"],
    ["history", "TEXT"],
    ["highlights", "TEXT"],
    ["wikipedia_title", "TEXT"],
    ["wikipedia_url", "TEXT"],
    // Phase 2d: 市区町村・ユーザー反応
    ["city", "TEXT"],
    ["reaction_count", "INTEGER"],
    // Phase 2e: 志納受付対応フラグ (宗教法亻登録・口座・同意確認済み神社のみ true)
    ["accepts_offerings", "INTEGER"],
  ];
  for (const [col, typ] of needed) {
    if (!existing.has(col)) {
      try {
        _db.exec(`ALTER TABLE spots ADD COLUMN ${col} ${typ}`);
      } catch {}
    }
  }
  return _db;
}

export function listSpots(opts: {
  bbox?: [number, number, number, number];
  limit?: number;
  featuredOnly?: boolean;
  prefecture?: string;
}): ShrineRow[] {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.bbox) {
    where.push("lng BETWEEN ? AND ? AND lat BETWEEN ? AND ?");
    params.push(opts.bbox[0], opts.bbox[2], opts.bbox[1], opts.bbox[3]);
  }
  if (opts.featuredOnly) where.push("source_layer = 'manual'");
  if (opts.prefecture) {
    where.push("prefecture = ?");
    params.push(opts.prefecture);
  }
  const sql = `
    SELECT * FROM spots
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY
      CASE source_layer WHEN 'manual' THEN 0 WHEN 'wikidata' THEN 1 ELSE 2 END,
      id
    LIMIT ?
  `;
  params.push(opts.limit ?? 5000);
  return db.prepare(sql).all(...params) as ShrineRow[];
}

// ======================================================================
// 検索（Comfy 参考の「条件(N) | 件数」を返すのに十分な関数群）
// ======================================================================

/** ご利益ヒント: benefits が埋まっていない OSM 神社にも効くよう祭神名/神社名パターンで拡張。 */
const BENEFIT_HINTS: Record<string, string[]> = {
  商売繁盛: ["稲荷", "宇迦", "恵比寿", "大黒", "蛭子"],
  金運: ["稲荷", "大黒", "弁財天", "市杵島"],
  縁結び: ["大国主", "出雲", "氷川", "八重垣", "大神"],
  恋愛成就: ["大国主", "出雲", "八重垣"],
  夫婦円満: ["伊弉諾", "伊弉冉", "白山"],
  子宝: ["木花咲耶", "浅間"],
  安産: ["木花咲耶", "水天宮", "浅間"],
  合格祈願: ["天満", "天神", "菅原道真"],
  学業成就: ["天満", "天神", "菅原道真"],
  技芸上達: ["弁財天", "市杵島"],
  健康: ["少彦名", "薬"],
  病気平癒: ["少彦名", "薬師"],
  長寿: ["少彦名"],
  厄除け: ["八坂", "素戔嗚", "須佐之男", "牛頭"],
  災難除け: ["八坂", "素戔嗚", "猿田彦"],
  交通安全: ["猿田彦", "道祖神"],
  旅行安全: ["猿田彦", "金刀比羅", "金毘羅"],
  勝負運: ["八幡", "諏訪", "鹿島", "香取"],
  必勝祈願: ["八幡", "鹿島", "香取"],
  出世: ["八幡", "愛宕"],
  仕事運: ["稲荷", "八幡"],
  家内安全: ["産土", "氏神"],
  五穀豊穣: ["稲荷", "宇迦", "豊受"],
  海上安全: ["住吉", "金刀比羅", "金毘羅", "宗像"],
  防火: ["愛宕", "秋葉", "火産霊"],
};

function buildSearchWhere(opts: {
  q?: string;
  benefit?: string;
  deity?: string;
  prefecture?: string;
  city?: string;
  shrine_type?: string;
  accepts_offerings?: boolean;
}): { sql: string; params: unknown[] } {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.q) {
    const like = `%${opts.q}%`;
    where.push(
      "(COALESCE(name,'') LIKE ? OR COALESCE(address,'') LIKE ? OR COALESCE(deity,'') LIKE ?)",
    );
    params.push(like, like, like);
  }
  if (opts.benefit) {
    // benefits 直接マッチ + ヒント語(祭神/神社名)
    const like = `%${opts.benefit}%`;
    const orParts = ["COALESCE(benefits,'') LIKE ?"];
    const orParams: unknown[] = [like];
    const hints = BENEFIT_HINTS[opts.benefit] ?? [];
    for (const h of hints) {
      orParts.push("COALESCE(deity,'') LIKE ?");
      orParts.push("COALESCE(name,'') LIKE ?");
      orParams.push(`%${h}%`, `%${h}%`);
    }
    where.push("(" + orParts.join(" OR ") + ")");
    params.push(...orParams);
  }
  if (opts.deity) {
    where.push("COALESCE(deity,'') LIKE ?");
    params.push(`%${opts.deity}%`);
  }
  if (opts.prefecture) {
    where.push("prefecture = ?");
    params.push(opts.prefecture);
  }
  if (opts.city) {
    where.push("city = ?");
    params.push(opts.city);
  }
  if (opts.shrine_type) {
    where.push("shrine_type = ?");
    params.push(opts.shrine_type);
  }
  if (opts.accepts_offerings) {
    where.push("accepts_offerings = 1");
  }
  return {
    sql: where.length ? "WHERE " + where.join(" AND ") : "",
    params,
  };
}

export function searchSpots(opts: {
  q?: string;
  benefit?: string;
  deity?: string;
  prefecture?: string;
  city?: string;
  shrine_type?: string;
  accepts_offerings?: boolean;
  limit?: number;
  offset?: number;
}): { rows: ShrineRow[]; total: number } {
  const db = getDb();
  const { sql: whereSql, params } = buildSearchWhere(opts);
  const total =
    (db.prepare(`SELECT COUNT(*) AS n FROM spots ${whereSql}`).get(...params) as {
      n: number;
    }).n;
  const rowsSql = `
    SELECT * FROM spots ${whereSql}
    ORDER BY
      CASE source_layer WHEN 'manual' THEN 0 WHEN 'wikidata' THEN 1 ELSE 2 END,
      id
    LIMIT ? OFFSET ?
  `;
  const rows = db
    .prepare(rowsSql)
    .all(...params, opts.limit ?? 200, opts.offset ?? 0) as ShrineRow[];
  return { rows, total };
}

/**
 * Comfy の「件数付きチェックボックス」用のファセット集計。
 * 現在の検索条件を維持しつつ、ある単一次元(ご利益/形式/都道府県)の値別件数を返す。
 * 「ご利益=縁結び が選ばれた状態で "神社形式" の選択肢を出すときの件数」を計算するため、
 * 対象次元のフィルタだけ除外して他は維持するのが正しい UX。
 */
export function facetCountsForBenefits(
  opts: { q?: string; deity?: string; prefecture?: string; shrine_type?: string },
  keys: string[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const b of keys) {
    const { rows: _rows, total } = searchSpots({
      ...opts,
      benefit: b,
      limit: 1,
      offset: 0,
    });
    void _rows;
    out[b] = total;
  }
  return out;
}

export function facetCountsForShrineType(opts: {
  q?: string;
  benefit?: string;
  deity?: string;
  prefecture?: string;
}): Array<{ value: string; count: number }> {
  const db = getDb();
  const { sql: whereSql, params } = buildSearchWhere(opts);
  const rows = db
    .prepare(
      `SELECT COALESCE(shrine_type,'') AS v, COUNT(*) AS n FROM spots ${whereSql}
       GROUP BY v ORDER BY n DESC LIMIT 50`,
    )
    .all(...params) as { v: string; n: number }[];
  return rows.filter((r) => r.v).map((r) => ({ value: r.v, count: r.n }));
}

// =====================================================================
// 注目ユーザー機能（チェックインへの reaction）
// =====================================================================

function ensureCheckinReactionTable() {
  const db = getDb();
  try {
    db.exec(
      `CREATE TABLE IF NOT EXISTS checkin_reactions (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         checkin_id INTEGER NOT NULL,
         client_id TEXT NOT NULL,
         reaction TEXT NOT NULL,  -- like / helpful
         created_at TEXT NOT NULL,
         UNIQUE(checkin_id, client_id, reaction)
       )`,
    );
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_checkin_reactions_checkin ON checkin_reactions(checkin_id)",
    );
  } catch {}
}

export type ReactionKind = "like" | "helpful";

export function addReaction(
  checkinId: number,
  clientId: string,
  reaction: ReactionKind,
): { created: boolean } {
  ensureCheckinReactionTable();
  const db = getDb();
  try {
    const info = db
      .prepare(
        "INSERT OR IGNORE INTO checkin_reactions (checkin_id, client_id, reaction, created_at) VALUES (?, ?, ?, ?)",
      )
      .run(checkinId, clientId, reaction, new Date().toISOString());
    return { created: (info.changes ?? 0) > 0 };
  } catch {
    return { created: false };
  }
}

export function removeReaction(
  checkinId: number,
  clientId: string,
  reaction: ReactionKind,
): { removed: boolean } {
  ensureCheckinReactionTable();
  const db = getDb();
  const info = db
    .prepare(
      "DELETE FROM checkin_reactions WHERE checkin_id = ? AND client_id = ? AND reaction = ?",
    )
    .run(checkinId, clientId, reaction);
  return { removed: (info.changes ?? 0) > 0 };
}

export function reactionCountsFor(checkinId: number): {
  like: number;
  helpful: number;
} {
  ensureCheckinReactionTable();
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT reaction, COUNT(*) AS n FROM checkin_reactions WHERE checkin_id = ? GROUP BY reaction",
    )
    .all(checkinId) as { reaction: string; n: number }[];
  const map = { like: 0, helpful: 0 };
  for (const r of rows) {
    if (r.reaction === "like") map.like = r.n;
    else if (r.reaction === "helpful") map.helpful = r.n;
  }
  return map;
}

/** チェックインをした参拝者を「いいね」「参考になった」の合計で並べる。
 *  注目ユーザー（端末匿名の client_id ベース）ランキング。 */
export type FeaturedUser = {
  client_id: string;
  nickname: string;
  total_reactions: number;
  checkin_count: number;
  recent_spot_name: string;
  recent_comment: string | null;
  recent_created_at: string;
};

export function featuredUsers(limit: number): FeaturedUser[] {
  ensureCheckinReactionTable();
  const db = getDb();
  try {
    const rows = db
      .prepare(
        `SELECT
            c.client_id,
            COALESCE(MAX(c.nickname), '匿名さん') AS nickname,
            COUNT(DISTINCT c.id) AS checkin_count,
            COALESCE((SELECT COUNT(*) FROM checkin_reactions r
                      WHERE r.checkin_id IN (SELECT id FROM checkins c2 WHERE c2.client_id = c.client_id)), 0) AS total_reactions,
            (SELECT s.name FROM spots s WHERE s.id = c.spot_id ORDER BY c.created_at DESC LIMIT 1) AS recent_spot_name,
            (SELECT c3.comment FROM checkins c3 WHERE c3.client_id = c.client_id ORDER BY c3.created_at DESC LIMIT 1) AS recent_comment,
            (SELECT c3.created_at FROM checkins c3 WHERE c3.client_id = c.client_id ORDER BY c3.created_at DESC LIMIT 1) AS recent_created_at
          FROM checkins c
          GROUP BY c.client_id
          ORDER BY total_reactions DESC, checkin_count DESC, recent_created_at DESC
          LIMIT ?`,
      )
      .all(limit) as FeaturedUser[];
    return rows.filter((r) => r.recent_spot_name);
  } catch {
    return [];
  }
}

/** 最近のチェックイン（コメント or ニックネームあり）を取得。
 *  FastAPI 停止時でも SQLite 直読で動作する。 */
export type RecentCheckin = {
  id: number;
  spot_id: number;
  nickname: string | null;
  comment: string | null;
  wish_type: string | null;
  created_at: string;
  spot_name: string;
  spot_prefecture: string | null;
  spot_slug: string | null;
};

export function recentCheckins(limit: number): RecentCheckin[] {
  const db = getDb();
  // checkins テーブルがそもそも無いケースもあるので try/catch
  try {
    const rows = db
      .prepare(
        `SELECT c.id, c.spot_id, c.nickname, c.comment, c.wish_type, c.created_at,
                s.name AS spot_name, s.prefecture AS spot_prefecture, s.slug AS spot_slug
           FROM checkins c JOIN spots s ON s.id = c.spot_id
          ORDER BY c.id DESC LIMIT ?`,
      )
      .all(limit) as RecentCheckin[];
    return rows;
  } catch {
    return [];
  }
}

/** 志納受付対応の神社一覧（写真付きを優先）。 */
export function listOfferingShrines(limit: number): ShrineRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM spots WHERE accepts_offerings = 1
       ORDER BY
         CASE WHEN photo_url IS NOT NULL AND photo_url != '' THEN 0 ELSE 1 END,
         CASE source_layer WHEN 'manual' THEN 0 WHEN 'wikidata' THEN 1 ELSE 2 END,
         id
       LIMIT ?`,
    )
    .all(limit) as ShrineRow[];
}

export function countOfferingShrines(): number {
  const db = getDb();
  const r = db
    .prepare("SELECT COUNT(*) AS n FROM spots WHERE accepts_offerings = 1")
    .get() as { n: number };
  return r.n;
}

/** 写真+概要がある spot をランダムに返す（トップの「注目神社」用） */
export function randomFeaturedSpots(limit: number): ShrineRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM spots
       WHERE photo_url IS NOT NULL AND photo_url != ''
         AND description IS NOT NULL AND description != ''
       ORDER BY RANDOM() LIMIT ?`,
    )
    .all(limit) as ShrineRow[];
}

/** 新しく登録された spot を id 降順で返す（「新着神社」用） */
export function recentlyAddedSpots(limit: number): ShrineRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM spots
       WHERE photo_url IS NOT NULL AND photo_url != ''
       ORDER BY id DESC LIMIT ?`,
    )
    .all(limit) as ShrineRow[];
}

/** wikipedia_title が埋まっているが description 未充填の spot 一覧（エンリッチ候補） */
export function listEnrichmentCandidates(limit: number): Array<{
  id: number;
  external_id: string | null;
  name: string;
  wikipedia_title: string | null;
  source_url: string | null;
}> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, external_id, name, wikipedia_title, source_url FROM spots
       WHERE (wikipedia_title IS NOT NULL AND wikipedia_title != '')
         AND (description IS NULL OR description = '')
       ORDER BY id LIMIT ?`,
    )
    .all(limit) as Array<{
      id: number;
      external_id: string | null;
      name: string;
      wikipedia_title: string | null;
      source_url: string | null;
    }>;
  return rows;
}

/** 検索結果内での市区町村ごと件数（ファセット用）。prefecture が絞られている時だけ意味のある値。 */
export function facetCountsForCity(opts: {
  q?: string;
  benefit?: string;
  deity?: string;
  prefecture?: string;
  shrine_type?: string;
}): Array<{ value: string; count: number }> {
  const db = getDb();
  const { sql: whereSql, params } = buildSearchWhere(opts);
  const cityClause = "city IS NOT NULL AND city != ''";
  const combinedWhere = whereSql
    ? `${whereSql} AND ${cityClause}`
    : `WHERE ${cityClause}`;
  const rows = db
    .prepare(
      `SELECT city AS v, COUNT(*) AS n FROM spots ${combinedWhere}
       GROUP BY city ORDER BY n DESC LIMIT 200`,
    )
    .all(...params) as { v: string; n: number }[];
  return rows.map((r) => ({ value: r.v, count: r.n }));
}

/** 近くの神社を距離でソートして返す（詳細ページの「関連神社」用）。 */
export function nearbySpots(
  lat: number,
  lng: number,
  limit: number,
  excludeId?: number,
): Array<ShrineRow & { distance_m: number }> {
  const db = getDb();
  // bbox で粗く絞ってから距離で並べ替え（全件 SELECT を避ける）
  const DEG_PER_KM = 1 / 111;
  const searchKm = 30;
  const latDelta = searchKm * DEG_PER_KM;
  const lngDelta = searchKm * DEG_PER_KM / Math.cos((lat * Math.PI) / 180);
  const where: string[] = [
    "lat BETWEEN ? AND ?",
    "lng BETWEEN ? AND ?",
  ];
  const params: unknown[] = [lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta];
  if (excludeId != null) {
    where.push("id != ?");
    params.push(excludeId);
  }
  const rows = db
    .prepare(
      `SELECT * FROM spots WHERE ${where.join(" AND ")} LIMIT 400`,
    )
    .all(...params) as ShrineRow[];
  const withDist = rows.map((r) => {
    const dLat = ((r.lat - lat) * Math.PI) / 180;
    const dLng = ((r.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((r.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const d = 2 * 6371_000 * Math.asin(Math.min(1, Math.sqrt(a)));
    return { ...r, distance_m: d };
  });
  withDist.sort((a, b) => a.distance_m - b.distance_m);
  return withDist.slice(0, limit);
}

/** 同じ祭神を祀る他の神社（関連）。deity 文字列の LIKE マッチで簡易。 */
export function spotsBySameDeity(deity: string, excludeId: number, limit: number): ShrineRow[] {
  const db = getDb();
  // deity は「天照大御神、豊受大御神」など複合の場合もあるので先頭の 1 神格だけ使う
  const first = deity.split(/[、,・\s]/).map((s) => s.trim()).filter(Boolean)[0] ?? "";
  if (!first) return [];
  return db
    .prepare(
      `SELECT * FROM spots WHERE deity LIKE ? AND id != ?
         AND photo_url IS NOT NULL AND photo_url != ''
         ORDER BY CASE source_layer WHEN 'manual' THEN 0 ELSE 1 END, id LIMIT ?`,
    )
    .all(`%${first}%`, excludeId, limit) as ShrineRow[];
}

/** 都道府県ごとの spot 件数（地図ヒートマップ用）。全件 SELECT。 */
export function prefectureCounts(): Array<{ prefecture: string; count: number }> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT COALESCE(prefecture,'') AS prefecture, COUNT(*) AS count FROM spots
       WHERE prefecture IS NOT NULL AND prefecture != ''
       GROUP BY prefecture ORDER BY count DESC`,
    )
    .all() as { prefecture: string; count: number }[];
  return rows;
}

export function facetCountsForPrefecture(opts: {
  q?: string;
  benefit?: string;
  deity?: string;
  shrine_type?: string;
}): Array<{ value: string; count: number }> {
  const db = getDb();
  const { sql: whereSql, params } = buildSearchWhere(opts);
  const rows = db
    .prepare(
      `SELECT COALESCE(prefecture,'') AS v, COUNT(*) AS n FROM spots ${whereSql}
       GROUP BY v ORDER BY n DESC LIMIT 60`,
    )
    .all(...params) as { v: string; n: number }[];
  return rows.filter((r) => r.v).map((r) => ({ value: r.v, count: r.n }));
}

export function getSpot(id: number): ShrineRow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM spots WHERE id = ?").get(id) as
    | ShrineRow
    | undefined;
  return row ?? null;
}

/** /shrines/[slug] 用。slug か spot-{id} フォールバックを両方扱う。 */
export function getSpotBySlug(slug: string): ShrineRow | null {
  const db = getDb();
  const bySlug = db.prepare("SELECT * FROM spots WHERE slug = ?").get(slug) as
    | ShrineRow
    | undefined;
  if (bySlug) return bySlug;
  const m = /^spot-(\d+)$/.exec(slug);
  if (m) return getSpot(Number(m[1]));
  return null;
}

export function totalSpots(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) AS n FROM spots").get() as { n: number };
  return row.n;
}

export function statsBySourceLayer(): Record<string, number> {
  const db = getDb();
  const rows = db.prepare("SELECT source_layer, COUNT(*) AS n FROM spots GROUP BY source_layer").all() as { source_layer: string | null; n: number }[];
  const out: Record<string, number> = {};
  for (const r of rows) out[r.source_layer ?? "unknown"] = r.n;
  return out;
}

export function withPhotoCount(): number {
  const db = getDb();
  const r = db.prepare("SELECT COUNT(*) AS n FROM spots WHERE photo_url IS NOT NULL AND photo_url != ''").get() as { n: number };
  return r.n;
}

export function withDescriptionCount(): number {
  const db = getDb();
  const r = db.prepare("SELECT COUNT(*) AS n FROM spots WHERE description IS NOT NULL AND description != ''").get() as { n: number };
  return r.n;
}

export type ShrineEnrichment = {
  external_id: string;
  description?: string | null;
  history?: string | null;
  highlights?: string | null;
  photo_url?: string | null;
  photo_attribution?: string | null;
  wikipedia_title?: string | null;
  wikipedia_url?: string | null;
};

export function upsertEnrichment(items: ShrineEnrichment[]): { updated: number; missing: number } {
  const db = getDb();
  const update = db.prepare(`
    UPDATE spots SET
      description       = COALESCE(?, description),
      history           = COALESCE(?, history),
      highlights        = COALESCE(?, highlights),
      photo_url         = COALESCE(?, photo_url),
      photo_attribution = COALESCE(?, photo_attribution),
      wikipedia_title   = COALESCE(?, wikipedia_title),
      wikipedia_url     = COALESCE(?, wikipedia_url)
    WHERE external_id = ?
  `);
  let updated = 0;
  let missing = 0;
  for (const r of items) {
    const info = update.run(
      r.description ?? null,
      r.history ?? null,
      r.highlights ?? null,
      r.photo_url ?? null,
      r.photo_attribution ?? null,
      r.wikipedia_title ?? null,
      r.wikipedia_url ?? null,
      r.external_id,
    );
    if ((info.changes ?? 0) > 0) updated++;
    else missing++;
  }
  return { updated, missing };
}

export type BulkShrineIn = {
  external_id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string | null;
  prefecture?: string | null;
  shrine_type?: string | null;
  website?: string | null;
  wikipedia_title?: string | null;
  source_url?: string | null;
};

export function bulkImport(
  items: BulkShrineIn[],
  sourceLayer: string = "osm",
): { inserted: number; updated: number; total: number } {
  const db = getDb();
  let inserted = 0;
  let updated = 0;
  const findByExternal = db.prepare("SELECT id, source_layer FROM spots WHERE external_id = ?");
  const updateStmt = db.prepare(`
    UPDATE spots SET
      name = COALESCE(?, name),
      lat = ?, lng = ?,
      address = COALESCE(?, address),
      prefecture = COALESCE(?, prefecture),
      shrine_type = COALESCE(?, shrine_type),
      website = COALESCE(?, website),
      wikipedia_title = COALESCE(?, wikipedia_title),
      source_url = COALESCE(?, source_url),
      source_layer = CASE WHEN source_layer = 'manual' THEN source_layer ELSE ? END
    WHERE external_id = ?
  `);
  const insertStmt = db.prepare(`
    INSERT INTO spots (external_id, name, lat, lng, address, prefecture, shrine_type, website, wikipedia_title, source_url, source_layer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // node:sqlite は better-sqlite3 のような db.transaction(fn) を持たないので
  // 手動で BEGIN/COMMIT をまとめる
  db.exec("BEGIN");
  try {
    for (const s of items) {
      if (!s.external_id || !s.name || typeof s.lat !== "number" || typeof s.lng !== "number") continue;
      const ex = findByExternal.get(s.external_id) as { id: number; source_layer: string } | undefined;
      if (ex) {
        updateStmt.run(
          s.name ?? null, s.lat, s.lng,
          s.address ?? null, s.prefecture ?? null, s.shrine_type ?? null,
          s.website ?? null, s.wikipedia_title ?? null, s.source_url ?? null,
          sourceLayer, s.external_id,
        );
        updated++;
      } else {
        insertStmt.run(
          s.external_id, s.name, s.lat, s.lng,
          s.address ?? null, s.prefecture ?? null, s.shrine_type ?? null,
          s.website ?? null, s.wikipedia_title ?? null, s.source_url ?? null,
          sourceLayer,
        );
        inserted++;
      }
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return { inserted, updated, total: totalSpots() };
}
