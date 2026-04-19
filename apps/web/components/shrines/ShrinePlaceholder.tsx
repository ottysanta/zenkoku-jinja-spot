/**
 * 神社写真の代替プレースホルダ。
 * - 鳥居 SVG + 神社名 + 形式ラベル
 * - shrine_type でアクセント色を変える（稲荷=朱 / 天神=藍 / 八幡=金 など）
 * - サーバーコンポーネント互換（純粋 SVG+div）
 */
type Props = {
  name: string;
  shrineType?: string | null;
  prefecture?: string | null;
  className?: string;
};

function pickPalette(type: string | null | undefined): {
  bg: string;
  accent: string;
  ink: string;
} {
  switch ((type || "").trim()) {
    case "稲荷":
      return { bg: "#f9e1d8", accent: "#c94a34", ink: "#5b1a10" };
    case "八幡":
      return { bg: "#f5ecd1", accent: "#a07730", ink: "#3c2c10" };
    case "天神":
      return { bg: "#e4e8f2", accent: "#3d5c92", ink: "#1a2a4a" };
    case "熊野":
      return { bg: "#ecdfc8", accent: "#7a4a1f", ink: "#3b2410" };
    case "諏訪":
      return { bg: "#e2ecdc", accent: "#4d7a42", ink: "#1e3520" };
    case "神宮":
      return { bg: "#f4e6d4", accent: "#9c5f2b", ink: "#3c2412" };
    case "大社":
      return { bg: "#f0dfda", accent: "#a43f36", ink: "#3c120e" };
    default:
      return { bg: "#f2e6d8", accent: "#b15842", ink: "#3c1a10" };
  }
}

export default function ShrinePlaceholder({
  name,
  shrineType,
  prefecture,
  className,
}: Props) {
  const p = pickPalette(shrineType);
  return (
    <div
      className={
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden " +
        (className ?? "")
      }
      style={{ background: p.bg }}
      aria-hidden="true"
    >
      {/* 背景の装飾: 斜めストライプ */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.08]"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 100 100"
      >
        <defs>
          <pattern id="stripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="3" height="8" fill={p.ink} />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#stripe)" />
      </svg>

      {/* 鳥居 SVG */}
      <svg
        viewBox="0 0 120 96"
        width="80"
        height="64"
        className="relative drop-shadow-sm"
      >
        {/* 笠木 */}
        <path d="M6 14 Q60 4 114 14 L108 24 Q60 16 12 24 Z" fill={p.accent} />
        {/* 島木 */}
        <rect x="14" y="26" width="92" height="8" fill={p.accent} />
        {/* 額束 */}
        <rect x="54" y="36" width="12" height="12" fill={p.accent} />
        {/* 左柱 */}
        <path d="M22 38 L26 92 L18 92 Z" fill={p.accent} />
        {/* 右柱 */}
        <path d="M98 38 L94 92 L102 92 Z" fill={p.accent} />
        {/* 貫 */}
        <rect x="22" y="50" width="76" height="6" fill={p.accent} opacity="0.85" />
      </svg>

      <div className="relative mt-2 max-w-[90%] px-3 text-center">
        <p
          className="line-clamp-2 text-xs font-semibold"
          style={{ color: p.ink }}
        >
          {name}
        </p>
        {(shrineType || prefecture) ? (
          <p
            className="mt-0.5 text-[10px] opacity-70"
            style={{ color: p.ink }}
          >
            {[prefecture, shrineType].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
