/**
 * 画像最適化スクリプト
 * - proc_*.png アイコン → WebP 256×256 (透過保持)
 * - ChatGPT 生成ヒーロー PNG → WebP 1920px max (高品質維持)
 *
 * 実行: node apps/web/scripts/optimize-images.mjs
 */
import sharp from "sharp";
import { readdir, stat } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "../public");
const iconsDir = join(publicDir, "assets/shrine/icons");
const shrineDir = join(publicDir, "assets/shrine");

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

let totalSaved = 0;

async function convertIcon(file) {
  const inputPath = join(iconsDir, file);
  const outputPath = join(iconsDir, file.replace(".png", ".webp"));
  const inStat = await stat(inputPath);

  await sharp(inputPath)
    .resize(256, 256, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 90, effort: 6, alphaQuality: 90 })
    .toFile(outputPath);

  const outStat = await stat(outputPath);
  const saved = inStat.size - outStat.size;
  totalSaved += saved;
  console.log(`  ✓ ${file} → ${file.replace(".png", ".webp")}  (${fmtKB(inStat.size)} → ${fmtKB(outStat.size)}, -${fmtKB(saved)})`);
}

async function convertHero(file) {
  const inputPath = join(shrineDir, file);
  const outputPath = join(shrineDir, file.replace(".png", ".webp"));
  const inStat = await stat(inputPath);

  await sharp(inputPath)
    .resize(1920, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 })
    .toFile(outputPath);

  const outStat = await stat(outputPath);
  const saved = inStat.size - outStat.size;
  totalSaved += saved;
  console.log(`  ✓ ${file} → ${file.replace(".png", ".webp")}  (${fmtKB(inStat.size)} → ${fmtKB(outStat.size)}, -${fmtKB(saved)})`);
}

// 1. アイコン: proc_*.png → WebP
console.log("\n【1. アイコン変換 proc_*.png → WebP 256×256】");
const iconFiles = (await readdir(iconsDir)).filter(
  (f) => f.startsWith("proc_") && f.endsWith(".png")
);
for (const f of iconFiles) await convertIcon(f);

// 2. ヒーロー画像: *.png → WebP
console.log("\n【2. ヒーロー画像変換 *.png → WebP 1920px】");
const allShrineFiles = await readdir(shrineDir);
const heroFiles = allShrineFiles.filter(
  (f) => f.endsWith(".png") && !f.includes("/")
);
for (const f of heroFiles) await convertHero(f);

console.log(`\n✅ 完了！ 合計削減: ${fmtKB(totalSaved)} (${(totalSaved / 1024 / 1024).toFixed(1)} MB)\n`);
