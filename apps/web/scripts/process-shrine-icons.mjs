/**
 * GPT生成アイコン画像の白背景を除去して透過PNGを生成するスクリプト。
 * root の node_modules/sharp を使用。
 * 実行: node apps/web/scripts/process-shrine-icons.mjs
 */
import sharp from "sharp";
import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "../public/assets/shrine/icons");

const files = (await readdir(iconsDir)).filter(
  (f) => f.endsWith(".png") && !f.startsWith("proc_")
);

console.log(`Processing ${files.length} icon files…`);

for (const file of files) {
  const inputPath = join(iconsDir, file);
  const outputPath = join(iconsDir, "proc_" + file);

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const buf = Buffer.from(data);

  for (let i = 0; i < buf.length; i += 4) {
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    const a = buf[i + 3];

    if (a < 10) continue; // すでに透明

    // 彩度チェック: 金色は R >> B (高彩度), 白/グレーは R≈G≈B (低彩度)
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const saturation = maxC > 0 ? (maxC - minC) / maxC : 0;

    // 白・薄グレー（明度高 + 彩度低）→ 透明化
    if (r > 235 && g > 235 && b > 235 && saturation < 0.12) {
      buf[i + 3] = 0;
    } else if (r > 215 && g > 215 && b > 215 && saturation < 0.08) {
      // エッジ部分: 半透明でなめらかに
      const brightness = (r + g + b) / (3 * 255);
      buf[i + 3] = Math.round(a * Math.max(0, 1 - brightness * 2));
    }
  }

  await sharp(buf, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);

  console.log(`  ✓ proc_${file}`);
}

console.log("Done.");
