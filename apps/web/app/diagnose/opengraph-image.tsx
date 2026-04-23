import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "守護神社診断 — あなたと縁深い神社を見つける";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #fef7ed 0%, #fffdf7 50%, #ecfdf5 100%)",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* 装飾円 */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(220, 80, 45, 0.08)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -120,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(22, 101, 52, 0.08)",
            display: "flex",
          }}
        />

        {/* タグ */}
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 8,
            color: "#b91c1c",
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          ⛩ SHRINE DIAGNOSIS
        </div>

        {/* タイトル */}
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 700,
            color: "#1c1917",
            letterSpacing: 4,
            marginBottom: 32,
          }}
        >
          守護神社診断
        </div>

        {/* サブタイトル */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#44403c",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.5,
            marginBottom: 48,
          }}
        >
          生まれ年から干支・五行属性を導き出し、
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#44403c",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.5,
            marginBottom: 48,
          }}
        >
          あなたと縁深い守護神社をご紹介します。
        </div>

        {/* 五行シンボル */}
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { el: "木", color: "#16a34a" },
            { el: "火", color: "#f97316" },
            { el: "土", color: "#d97706" },
            { el: "金", color: "#64748b" },
            { el: "水", color: "#3b82f6" },
          ].map(({ el, color }) => (
            <div
              key={el}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: color,
                color: "white",
                fontSize: 40,
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              {el}
            </div>
          ))}
        </div>

        {/* ベース */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 32,
            fontSize: 20,
            color: "#78716c",
            letterSpacing: 2,
          }}
        >
          全国46,000社のデータから、あなただけの守護神社を。
        </div>
      </div>
    ),
    { ...size }
  );
}
