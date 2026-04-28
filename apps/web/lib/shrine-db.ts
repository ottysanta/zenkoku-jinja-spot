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
import { execSync } from "node:child_process";

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
  // 起動時に日本外の神社を削除 (台湾・朝鮮半島・中国本土・ロシア等)
  try {
    const JP_BBOX = { minLat: 20, maxLat: 46, minLng: 122, maxLng: 154 };
    _db.exec(`DELETE FROM spots WHERE lat < ${JP_BBOX.minLat} OR lat > ${JP_BBOX.maxLat} OR lng < ${JP_BBOX.minLng} OR lng > ${JP_BBOX.maxLng}`);
    // 地理ルール: 緯度と経度から日本外を検出
    // lat > 34 かつ lng < 128 → 朝鮮半島・満州・中国北部 (九州 lat < 34 なので誤削除なし)
    _db.exec(`DELETE FROM spots WHERE lat > 34 AND lng < 128`);
    // lat > 46 (稚内以北) or lat < 20 (沖ノ鳥島以南)
    _db.exec(`DELETE FROM spots WHERE lat > 46 OR lat < 20`);
    // 台湾 (20-27N, 119-123E)
    _db.exec(`DELETE FROM spots WHERE lat BETWEEN 20 AND 26.5 AND lng BETWEEN 119 AND 123.5`);
    // 名前ベースの外国神社削除 (植民地時代の地名含む)
    const foreignKeywords = ['平壌','京城','釜山','ソウル','朝鮮神宮','朝鮮総督','台湾神社','樺太','関東神宮','北京','上海','満洲','満州','マニラ','南洋','パラオ','シンガポール','香港','花蓮','台北','高雄','奉天','新京','旅順','大連','哈爾浜','ハルビン','長春','承徳','フィリピン','ジャワ','ボルネオ','サイパン','ミクロネシア','マーシャル','グアム','スラバヤ','バンコク','クアラルンプール','ビルマ'];
    for (const kw of foreignKeywords) {
      try { _db.exec(`DELETE FROM spots WHERE name LIKE '%${kw}%'`); } catch {}
    }
    // 不正な prefecture (日本県名でないもの) は NULL 化
    _db.exec(`UPDATE spots SET prefecture = NULL WHERE prefecture IS NOT NULL AND prefecture NOT IN ('北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県')`);
  } catch (e) { console.warn('[shrine-db] foreign cleanup failed', e); }
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

// ============================== simple memoization ==============================
// 検索ページで ~20 回呼ばれる facet count 関数を 5 分キャッシュ。
// 各関数の第1引数 (opts object) を JSON.stringify してキーにする。
type CacheVal<T> = { v: T; exp: number };
const _memo = new Map<string, CacheVal<unknown>>();
const MEMO_TTL = 5 * 60 * 1000;
function memoize<T>(prefix: string, keyObj: unknown, fn: () => T): T {
  const k = prefix + ":" + JSON.stringify(keyObj || {});
  const now = Date.now();
  const hit = _memo.get(k);
  if (hit && hit.exp > now) return hit.v as T;
  const v = fn();
  _memo.set(k, { v, exp: now + MEMO_TTL });
  return v;
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

/**
 * 異体字（旧字体 → 新字体）マップ。
 * ユーザーが「眞名井」と検索しても DB に「真名井」として入っているケースをカバーする。
 * 双方向に展開して OR 検索する。
 */
const OLD_TO_NEW: Record<string, string> = {
  眞: "真", 澤: "沢", 齋: "斎", 齊: "斉", 國: "国", 邉: "辺", 邊: "辺",
  廣: "広", 會: "会", 圓: "円", 縣: "県", 學: "学", 壽: "寿",
  來: "来", 實: "実", 禮: "礼", 豐: "豊", 惠: "恵", 假: "仮",
  傳: "伝", 佛: "仏", 氣: "気", 嶋: "島", 靜: "静", 雜: "雑",
  萬: "万", 舊: "旧", 藝: "芸", 辯: "弁", 驛: "駅", 龍: "竜",
  櫻: "桜", 濱: "浜", 瀧: "滝", 龜: "亀", 繪: "絵", 黑: "黒",
  戀: "恋", 劍: "剣", 聲: "声", 變: "変", 獸: "獣", 舉: "挙",
  續: "続", 淨: "浄", 寶: "宝", 亂: "乱", 拂: "払", 舍: "舎",
  齡: "齢", 觀: "観", 醫: "医", 彥: "彦", 拜: "拝", 祕: "秘",
};
const NEW_TO_OLD: Record<string, string[]> = (() => {
  const m: Record<string, string[]> = {};
  for (const [o, n] of Object.entries(OLD_TO_NEW)) {
    (m[n] ||= []).push(o);
  }
  return m;
})();

function normalizeKanji(s: string): string {
  let out = "";
  for (const ch of s) out += OLD_TO_NEW[ch] ?? ch;
  return out;
}

/**
 * 1 つのクエリから SQL LIKE で照合すべき候補文字列を生成する。
 * - 元のクエリ（旧字体そのまま）
 * - 新字体に正規化したもの
 * - 新字体クエリに対して既知の旧字体に戻したもの
 * 組み合わせ爆発を防ぐため、上限 8 件にクランプ。
 */
function kanjiVariants(s: string): string[] {
  const set = new Set<string>();
  set.add(s);
  const normalized = normalizeKanji(s);
  set.add(normalized);
  // 新字体 → 旧字体の単一置換（1 文字ずつ試す）
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    const olds = NEW_TO_OLD[ch];
    if (!olds) continue;
    for (const o of olds) {
      set.add(normalized.slice(0, i) + o + normalized.slice(i + 1));
      if (set.size >= 8) break;
    }
    if (set.size >= 8) break;
  }
  return Array.from(set);
}

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
    // 異体字（旧字体/新字体）を展開して OR 検索
    const variants = kanjiVariants(opts.q);
    const orParts: string[] = [];
    for (const v of variants) {
      const like = `%${v}%`;
      orParts.push(
        "(COALESCE(name,'') LIKE ? OR COALESCE(address,'') LIKE ? OR COALESCE(deity,'') LIKE ?)",
      );
      params.push(like, like, like);
    }
    where.push("(" + orParts.join(" OR ") + ")");
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
  return memoize("benefit", { opts, keys }, () => {
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
  });
}

export function facetCountsForShrineType(opts: {
  q?: string;
  benefit?: string;
  deity?: string;
  prefecture?: string;
}): Array<{ value: string; count: number }> {
  return memoize("shrine_type", opts, () => {
    const db = getDb();
    const { sql: whereSql, params } = buildSearchWhere(opts);
    const rows = db
      .prepare(
        `SELECT COALESCE(shrine_type,'') AS v, COUNT(*) AS n FROM spots ${whereSql}
         GROUP BY v ORDER BY n DESC LIMIT 50`,
      )
      .all(...params) as { v: string; n: number }[];
    return rows.filter((r) => r.v).map((r) => ({ value: r.v, count: r.n }));
  });
}

// =====================================================================
// 注目ユーザー機能（チェックインへの reaction）
// =====================================================================

function ensureCheckinReactionTable() {
  try {
    const db = getDb();
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
  try {
    ensureCheckinReactionTable();
    const db = getDb();
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
  try {
    const db = getDb();
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
  try {
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
  } catch {
    return [];
  }
}

export function countOfferingShrines(): number {
  try {
    const db = getDb();
    const r = db
      .prepare("SELECT COUNT(*) AS n FROM spots WHERE accepts_offerings = 1")
      .get() as { n: number };
    return r.n;
  } catch {
    return 0;
  }
}

/** 写真+概要がある spot をランダムに返す（トップの「注目神社」用） */
export function randomFeaturedSpots(limit: number): ShrineRow[] {
  try {
    const db = getDb();
    return db
      .prepare(
        `SELECT * FROM spots
         WHERE photo_url IS NOT NULL AND photo_url != ''
           AND description IS NOT NULL AND description != ''
         ORDER BY RANDOM() LIMIT ?`,
      )
      .all(limit) as ShrineRow[];
  } catch {
    return [];
  }
}

/** 新しく登録された spot を id 降順で返す（「新着神社」用） */
export function recentlyAddedSpots(limit: number): ShrineRow[] {
  try {
    const db = getDb();
    return db
      .prepare(
        `SELECT * FROM spots
         WHERE photo_url IS NOT NULL AND photo_url != ''
         ORDER BY id DESC LIMIT ?`,
      )
      .all(limit) as ShrineRow[];
  } catch {
    return [];
  }
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
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT COALESCE(prefecture,'') AS prefecture, COUNT(*) AS count FROM spots
         WHERE prefecture IS NOT NULL AND prefecture != ''
         GROUP BY prefecture ORDER BY count DESC`,
      )
      .all() as { prefecture: string; count: number }[];
    return rows;
  } catch {
    return [];
  }
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
  try {
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) AS n FROM spots").get() as { n: number };
    return row.n;
  } catch {
    return 0;
  }
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

// =====================================================================
// 神社自己申請（spot_submissions）
// =====================================================================

function ensureSubmissionTable() {
  const db = getDb();
  try {
    db.exec(
      `CREATE TABLE IF NOT EXISTS spot_submissions (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         name TEXT NOT NULL,
         name_kana TEXT,
         address TEXT,
         prefecture TEXT,
         city TEXT,
         lat REAL,
         lng REAL,
         deity TEXT,
         shrine_type TEXT,
         website TEXT,
         photo_url TEXT,
         contact_name TEXT,
         contact_email TEXT,
         contact_phone TEXT,
         contact_role TEXT,
         evidence_url TEXT,
         note TEXT,
         client_id TEXT,
         user_id INTEGER,
         submitted_by_email TEXT,
         status TEXT NOT NULL DEFAULT 'pending',
         review_note TEXT,
         reviewed_by TEXT,
         reviewed_at TEXT,
         created_spot_id INTEGER,
         created_at TEXT NOT NULL,
         updated_at TEXT NOT NULL
       )`,
    );
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_spot_submissions_status ON spot_submissions(status)",
    );
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_spot_submissions_created_at ON spot_submissions(created_at DESC)",
    );
  } catch {}
}

export type SpotSubmissionIn = {
  name: string;
  name_kana?: string | null;
  address?: string | null;
  prefecture?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  deity?: string | null;
  shrine_type?: string | null;
  website?: string | null;
  photo_url?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_role?: string | null;
  evidence_url?: string | null;
  note?: string | null;
  client_id?: string | null;
  user_id?: number | null;
  submitted_by_email?: string | null;
};

export type SpotSubmissionRow = SpotSubmissionIn & {
  id: number;
  status: "pending" | "approved" | "rejected" | "needs_more_info";
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_spot_id: number | null;
  created_at: string;
  updated_at: string;
};

export function createSubmission(input: SpotSubmissionIn): SpotSubmissionRow {
  ensureSubmissionTable();
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO spot_submissions (
         name, name_kana, address, prefecture, city, lat, lng,
         deity, shrine_type, website, photo_url,
         contact_name, contact_email, contact_phone, contact_role,
         evidence_url, note, client_id, user_id, submitted_by_email,
         status, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    )
    .run(
      input.name,
      input.name_kana ?? null,
      input.address ?? null,
      input.prefecture ?? null,
      input.city ?? null,
      input.lat ?? null,
      input.lng ?? null,
      input.deity ?? null,
      input.shrine_type ?? null,
      input.website ?? null,
      input.photo_url ?? null,
      input.contact_name ?? null,
      input.contact_email ?? null,
      input.contact_phone ?? null,
      input.contact_role ?? null,
      input.evidence_url ?? null,
      input.note ?? null,
      input.client_id ?? null,
      input.user_id ?? null,
      input.submitted_by_email ?? null,
      now,
      now,
    );
  const id = Number(info.lastInsertRowid);
  return db
    .prepare("SELECT * FROM spot_submissions WHERE id = ?")
    .get(id) as SpotSubmissionRow;
}

export function listSubmissions(opts: {
  status?: "pending" | "approved" | "rejected" | "needs_more_info";
  limit?: number;
  offset?: number;
}): { rows: SpotSubmissionRow[]; total: number } {
  ensureSubmissionTable();
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.status) {
    where.push("status = ?");
    params.push(opts.status);
  }
  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
  const total = (db
    .prepare(`SELECT COUNT(*) AS n FROM spot_submissions ${whereSql}`)
    .get(...params) as { n: number }).n;
  const rows = db
    .prepare(
      `SELECT * FROM spot_submissions ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, opts.limit ?? 50, opts.offset ?? 0) as SpotSubmissionRow[];
  return { rows, total };
}

export function getSubmission(id: number): SpotSubmissionRow | null {
  ensureSubmissionTable();
  const db = getDb();
  return (db
    .prepare("SELECT * FROM spot_submissions WHERE id = ?")
    .get(id) as SpotSubmissionRow | undefined) ?? null;
}

/**
 * 申請を承認。spots に INSERT して status=approved に更新する。
 * 既に同名 & 近接の神社があっても強制的に追加するのではなく、レビュアー判断に任せる。
 */
export function approveSubmission(
  id: number,
  reviewer: string,
  reviewNote?: string | null,
): { ok: boolean; spot_id?: number; reason?: string } {
  ensureSubmissionTable();
  const db = getDb();
  const s = getSubmission(id);
  if (!s) return { ok: false, reason: "not_found" };
  if (s.status !== "pending" && s.status !== "needs_more_info") {
    return { ok: false, reason: "already_reviewed" };
  }
  if (typeof s.lat !== "number" || typeof s.lng !== "number") {
    return { ok: false, reason: "missing_coords" };
  }
  const now = new Date().toISOString();
  db.exec("BEGIN");
  try {
    const info = db
      .prepare(
        `INSERT INTO spots (
           name, address, lat, lng, prefecture, city,
           shrine_type, deity, website, photo_url, source_layer, source_url
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submission', ?)`,
      )
      .run(
        s.name,
        s.address ?? null,
        s.lat,
        s.lng,
        s.prefecture ?? null,
        s.city ?? null,
        s.shrine_type ?? null,
        s.deity ?? null,
        s.website ?? null,
        s.photo_url ?? null,
        s.evidence_url ?? null,
      );
    const spotId = Number(info.lastInsertRowid);
    db.prepare(
      `UPDATE spot_submissions SET status = 'approved',
         review_note = ?, reviewed_by = ?, reviewed_at = ?,
         created_spot_id = ?, updated_at = ? WHERE id = ?`,
    ).run(reviewNote ?? null, reviewer, now, spotId, now, id);
    db.exec("COMMIT");
    return { ok: true, spot_id: spotId };
  } catch (e) {
    db.exec("ROLLBACK");
    return { ok: false, reason: (e as Error).message };
  }
}

export function rejectSubmission(
  id: number,
  reviewer: string,
  reviewNote: string,
  nextStatus: "rejected" | "needs_more_info" = "rejected",
): { ok: boolean; reason?: string } {
  ensureSubmissionTable();
  const db = getDb();
  const s = getSubmission(id);
  if (!s) return { ok: false, reason: "not_found" };
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE spot_submissions SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ?`,
  ).run(nextStatus, reviewNote, reviewer, now, now, id);
  return { ok: true };
}

export function submissionCountsByStatus(): Record<string, number> {
  ensureSubmissionTable();
  const db = getDb();
  try {
    const rows = db
      .prepare("SELECT status, COUNT(*) AS n FROM spot_submissions GROUP BY status")
      .all() as { status: string; n: number }[];
    const out: Record<string, number> = { pending: 0, approved: 0, rejected: 0, needs_more_info: 0 };
    for (const r of rows) out[r.status] = r.n;
    return out;
  } catch {
    return { pending: 0, approved: 0, rejected: 0, needs_more_info: 0 };
  }
}

// =====================================================================
// ブックマーク（行きたい / いいね）
// =====================================================================

function ensureBookmarkTable() {
  const db = getDb();
  try {
    db.exec(
      `CREATE TABLE IF NOT EXISTS bookmarks (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         spot_id INTEGER NOT NULL,
         owner_key TEXT NOT NULL,           -- user_id:<n> か client:<uuid>
         kind TEXT NOT NULL,                 -- 'want' (行きたい) / 'like' (いいね)
         note TEXT,
         created_at TEXT NOT NULL,
         UNIQUE(spot_id, owner_key, kind)
       )`,
    );
    db.exec("CREATE INDEX IF NOT EXISTS idx_bookmarks_owner ON bookmarks(owner_key)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_bookmarks_spot ON bookmarks(spot_id)");
  } catch {}
}

export type BookmarkKind = "want" | "like";

export function ownerKeyFor(input: {
  userId?: number | null;
  clientId?: string | null;
}): string | null {
  if (input.userId) return `user:${input.userId}`;
  if (input.clientId && input.clientId.trim()) return `client:${input.clientId.trim()}`;
  return null;
}

export function addBookmark(
  spotId: number,
  ownerKey: string,
  kind: BookmarkKind,
  note?: string | null,
): { created: boolean } {
  ensureBookmarkTable();
  const db = getDb();
  try {
    const info = db
      .prepare(
        "INSERT OR IGNORE INTO bookmarks (spot_id, owner_key, kind, note, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(spotId, ownerKey, kind, note ?? null, new Date().toISOString());
    return { created: (info.changes ?? 0) > 0 };
  } catch {
    return { created: false };
  }
}

export function removeBookmark(
  spotId: number,
  ownerKey: string,
  kind: BookmarkKind,
): { removed: boolean } {
  ensureBookmarkTable();
  const db = getDb();
  const info = db
    .prepare("DELETE FROM bookmarks WHERE spot_id = ? AND owner_key = ? AND kind = ?")
    .run(spotId, ownerKey, kind);
  return { removed: (info.changes ?? 0) > 0 };
}

export function listBookmarksForOwner(
  ownerKey: string,
  kind?: BookmarkKind,
): Array<ShrineRow & { bookmark_kind: BookmarkKind; bookmarked_at: string }> {
  ensureBookmarkTable();
  const db = getDb();
  const params: unknown[] = [ownerKey];
  let sql =
    `SELECT s.*, b.kind AS bookmark_kind, b.created_at AS bookmarked_at
       FROM bookmarks b JOIN spots s ON s.id = b.spot_id
       WHERE b.owner_key = ?`;
  if (kind) {
    sql += " AND b.kind = ?";
    params.push(kind);
  }
  sql += " ORDER BY b.created_at DESC LIMIT 500";
  try {
    return db.prepare(sql).all(...params) as Array<
      ShrineRow & { bookmark_kind: BookmarkKind; bookmarked_at: string }
    >;
  } catch {
    return [];
  }
}

export function bookmarkStateFor(
  spotId: number,
  ownerKey: string,
): { want: boolean; like: boolean } {
  ensureBookmarkTable();
  const db = getDb();
  try {
    const rows = db
      .prepare(
        "SELECT kind FROM bookmarks WHERE spot_id = ? AND owner_key = ?",
      )
      .all(spotId, ownerKey) as { kind: string }[];
    const state = { want: false, like: false };
    for (const r of rows) {
      if (r.kind === "want") state.want = true;
      else if (r.kind === "like") state.like = true;
    }
    return state;
  } catch {
    return { want: false, like: false };
  }
}

export function bookmarkCountsFor(spotId: number): { want: number; like: number } {
  ensureBookmarkTable();
  const db = getDb();
  try {
    const rows = db
      .prepare(
        "SELECT kind, COUNT(*) AS n FROM bookmarks WHERE spot_id = ? GROUP BY kind",
      )
      .all(spotId) as { kind: string; n: number }[];
    const out = { want: 0, like: 0 };
    for (const r of rows) {
      if (r.kind === "want") out.want = r.n;
      else if (r.kind === "like") out.like = r.n;
    }
    return out;
  } catch {
    return { want: 0, like: 0 };
  }
}

/** 指定 owner の直近のチェックイン履歴を spots 名前と一緒に返す。 */
export type CheckinForOwner = {
  id: number;
  spot_id: number;
  spot_name: string | null;
  prefecture: string | null;
  slug: string | null;
  photo_url: string | null;
  comment: string | null;
  wish_type: string | null;
  created_at: string;
};

export function listCheckinsForClient(
  clientId: string,
  limit: number = 100,
): CheckinForOwner[] {
  const db = getDb();
  try {
    return db
      .prepare(
        `SELECT c.id, c.spot_id, c.created_at, c.comment, c.wish_type,
                s.name AS spot_name, s.prefecture, s.slug, s.photo_url
           FROM checkins c LEFT JOIN spots s ON s.id = c.spot_id
           WHERE c.client_id = ?
           ORDER BY c.created_at DESC
           LIMIT ?`,
      )
      .all(clientId, limit) as CheckinForOwner[];
  } catch {
    return [];
  }
}

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

// ─── Push Subscriptions ──────────────────────────────────────────────────────

function ensurePushTable() {
  const db = getDb();
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      client_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
  } catch {}
}

export function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
  clientId?: string;
}): void {
  ensurePushTable();
  const db = getDb();
  db.prepare(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth, client_id)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh, auth=excluded.auth`,
  ).run(sub.endpoint, sub.p256dh, sub.auth, sub.clientId ?? null);
}

export function deletePushSubscription(endpoint: string): void {
  ensurePushTable();
  getDb().prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint);
}

export function listPushSubscriptions(): Array<{
  endpoint: string;
  p256dh: string;
  auth: string;
}> {
  ensurePushTable();
  try {
    return getDb()
      .prepare("SELECT endpoint, p256dh, auth FROM push_subscriptions")
      .all() as Array<{ endpoint: string; p256dh: string; auth: string }>;
  } catch {
    return [];
  }
}
