import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const EL_COLORS: Record<string, { from: string; to: string; badge: string }> = {
  木: { from: "#16a34a", to: "#15803d", badge: "#f0fdf4" },
  火: { from: "#ea580c", to: "#b91c1c", badge: "#fff7ed" },
  土: { from: "#d97706", to: "#b45309", badge: "#fffbeb" },
  金: { from: "#475569", to: "#334155", badge: "#f8fafc" },
  水: { from: "#0284c7", to: "#0c4a6e", badge: "#f0f9ff" },
};

const WORRY_LABEL: Record<string, string> = {
  work: "仕事・職場の人間関係",
  love: "恋愛・縁",
  family: "家族・夫婦関係",
  self: "自分自身・自己信頼",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const typeName  = searchParams.get("type")  ?? "守護タイプ診断";
  const modifier  = searchParams.get("mod")   ?? "";
  const element   = searchParams.get("el")    ?? "水";
  const emoji     = searchParams.get("em")    ?? "⛩";
  const worry     = searchParams.get("worry") ?? "";

  const el = EL_COLORS[element] ?? EL_COLORS["水"];
  const worryLabel = worry ? WORRY_LABEL[worry] : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${el.from} 0%, ${el.to} 100%)`,
          padding: "60px 72px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景装飾円 */}
        <div style={{
          position: "absolute", top: -120, right: -120,
          width: 400, height: 400, borderRadius: "50%",
          background: "rgba(255,255,255,0.07)", display: "flex",
        }} />
        <div style={{
          position: "absolute", bottom: -80, left: -80,
          width: 300, height: 300, borderRadius: "50%",
          background: "rgba(0,0,0,0.1)", display: "flex",
        }} />

        {/* タグ行 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 32,
        }}>
          <div style={{
            fontSize: 18, letterSpacing: 6, color: "rgba(255,255,255,0.6)",
            fontWeight: 700,
          }}>
            ⛩ SHRINE DIAGNOSIS
          </div>
          {worryLabel && (
            <div style={{
              fontSize: 16, color: "rgba(255,255,255,0.5)",
              borderLeft: "1px solid rgba(255,255,255,0.3)",
              paddingLeft: 12,
            }}>
              悩み：{worryLabel}
            </div>
          )}
        </div>

        {/* メインコンテンツ */}
        <div style={{ display: "flex", alignItems: "center", gap: 48, flex: 1 }}>

          {/* 左: 絵文字 */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 180, height: 180,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            fontSize: 100,
            flexShrink: 0,
          }}>
            {emoji}
          </div>

          {/* 右: テキスト */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            <div style={{
              fontSize: 20, color: "rgba(255,255,255,0.65)",
              letterSpacing: 3, fontWeight: 600,
            }}>
              YOUR GUARDIAN TYPE
            </div>
            <div style={{
              fontSize: 60, color: "white", fontWeight: 800,
              lineHeight: 1.1, letterSpacing: 2,
            }}>
              {typeName}
            </div>
            <div style={{
              fontSize: 26, color: "rgba(255,255,255,0.7)",
              letterSpacing: 2,
            }}>
              {modifier}
            </div>

            {/* 属性バッジ */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginTop: 8,
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 40, padding: "8px 20px",
              }}>
                <span style={{ fontSize: 28, color: "white", fontWeight: 800 }}>{element}</span>
                <span style={{ fontSize: 18, color: "rgba(255,255,255,0.8)" }}>属性</span>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 20, marginTop: 24,
        }}>
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.5)" }}>
            全国46,000社のデータから、あなたの守護神社を
          </div>
          <div style={{
            fontSize: 18, color: "rgba(255,255,255,0.6)",
            fontWeight: 600,
          }}>
            神社マップ
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
