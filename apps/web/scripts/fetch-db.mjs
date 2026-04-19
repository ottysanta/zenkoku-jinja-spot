/**
 * Vercel / Render のビルド時に実行され、環境変数 SHRINE_DB_URL から
 * shrine_spots.db をダウンロードして apps/api/data/ に配置する。
 *
 * 利用例:
 *   SHRINE_DB_URL=https://github.com/<USER>/<REPO>/releases/download/v1/shrine_spots.db
 *
 * env が未設定なら何もせず exit 0 (ローカル開発を壊さない)。
 */
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const DB_URL = process.env.SHRINE_DB_URL;
const TARGET = path.resolve(process.cwd(), "../api/data/shrine_spots.db");

async function ensureDir(p) {
  await mkdir(path.dirname(p), { recursive: true });
}

async function main() {
  if (!DB_URL) {
    console.log("[fetch-db] SHRINE_DB_URL not set, skipping");
    return;
  }
  // 既にローカルに DB があるなら再取得しない（CI/ローカル両対応）
  try {
    const s = await stat(TARGET);
    if (s.size > 1_000_000) {
      console.log(
        `[fetch-db] DB already exists (${(s.size / 1024 / 1024).toFixed(1)}MB), skipping`,
      );
      return;
    }
  } catch {}

  console.log(`[fetch-db] downloading ${DB_URL} -> ${TARGET}`);
  const r = await fetch(DB_URL, {
    headers: { "User-Agent": "fetch-db-script/0.1" },
  });
  if (!r.ok) {
    throw new Error(`[fetch-db] failed: HTTP ${r.status}`);
  }
  const buf = Buffer.from(await r.arrayBuffer());
  await ensureDir(TARGET);
  await writeFile(TARGET, buf);
  console.log(
    `[fetch-db] saved ${(buf.length / 1024 / 1024).toFixed(1)}MB`,
  );
}

main().catch((e) => {
  console.error("[fetch-db] error:", e);
  process.exit(1);
});
