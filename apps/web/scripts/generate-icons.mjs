// PWAアイコン生成スクリプト
// 実行: node apps/web/scripts/generate-icons.mjs (ルートから)
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

// 鳥居 SVG（朱色ベース）
function makeSvg(size) {
  const s = size;
  const r = Math.round(s * 0.15); // 角丸
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 100 100">
  <!-- 背景 -->
  <rect width="100" height="100" fill="#b91c1c" rx="${Math.round(r * 100 / s)}"/>
  <!-- 鳥居 笠木（上の横棒） -->
  <rect x="10" y="22" width="80" height="9" rx="3" fill="white"/>
  <!-- 島木（2本目） -->
  <rect x="16" y="36" width="68" height="7" rx="2" fill="white"/>
  <!-- 左柱 -->
  <rect x="22" y="43" width="11" height="43" rx="3" fill="white"/>
  <!-- 右柱 -->
  <rect x="67" y="43" width="11" height="43" rx="3" fill="white"/>
  <!-- 左柱 足元 -->
  <rect x="18" y="82" width="19" height="5" rx="2" fill="rgba(255,255,255,0.6)"/>
  <!-- 右柱 足元 -->
  <rect x="63" y="82" width="19" height="5" rx="2" fill="rgba(255,255,255,0.6)"/>
  <!-- 笠木の反り（左） -->
  <path d="M10 22 Q8 17 12 16" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- 笠木の反り（右） -->
  <path d="M90 22 Q92 17 88 16" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;
}

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "shortcut-diagnose.png", size: 96 },
  { name: "shortcut-map.png", size: 96 },
];

for (const { name, size } of sizes) {
  const svg = Buffer.from(makeSvg(size));
  await sharp(svg).resize(size, size).png().toFile(join(outDir, name));
  console.log(`✓ ${name} (${size}x${size})`);
}

// Screenshots フォルダ用のプレースホルダー
const ssDir = join(__dirname, "../public/screenshots");
mkdirSync(ssDir, { recursive: true });
console.log("✓ icons generated");
