"use client";

import { useState } from "react";
import Link from "next/link";

// ── 九星気学 ────────────────────────────────────────────────────
// 本命星: (11 - (生まれ年の各桁の和 mod 9)) mod 9、ただし0→9
function getHonmeisei(year: number): number {
  let sum = 0;
  let y = year;
  while (y > 0) { sum += y % 10; y = Math.floor(y / 10); }
  while (sum > 9) { let s = 0; let n = sum; while (n > 0) { s += n % 10; n = Math.floor(n / 10); } sum = s; }
  const star = ((11 - sum) % 9 + 9) % 9;
  return star === 0 ? 9 : star;
}

const STARS: Record<number, { name: string; element: string; color: string; trait: string }> = {
  1: { name: "一白水星", element: "水", color: "#6aabcc", trait: "柔軟・流れに乗る・人脈運" },
  2: { name: "二黒土星", element: "土", color: "#a87c4a", trait: "勤勉・縁の下の力持ち・育成力" },
  3: { name: "三碧木星", element: "木", color: "#6aab6a", trait: "行動力・向上心・コミュニケーション" },
  4: { name: "四緑木星", element: "木", color: "#4a9a7a", trait: "信頼・調和・縁結び・旅運" },
  5: { name: "五黄土星", element: "土", color: "#C99B4D", trait: "強い運命力・カリスマ・波乱万丈" },
  6: { name: "六白金星", element: "金", color: "#b0b0d0", trait: "正義感・リーダーシップ・向上心" },
  7: { name: "七赤金星", element: "金", color: "#c07060", trait: "社交的・金運・弁舌爽やか" },
  8: { name: "八白土星", element: "土", color: "#9a8060", trait: "変革・努力・不動産運・逆転力" },
  9: { name: "九紫火星", element: "火", color: "#c06080", trait: "直感・美意識・名誉運・華やか" },
};

// 2026年の吉方位テーブル（本命星ごと）
// 九星気学の年盤は毎年変わる。2026年（丙午年）の定盤に基づく。
const KICHI_2026: Record<number, { kichi: string[]; daikichi: string; kyo: string[] }> = {
  1: { daikichi: "北", kichi: ["東南", "南"], kyo: ["西", "北西"] },
  2: { daikichi: "南西", kichi: ["北東", "西"], kyo: ["東", "東南"] },
  3: { daikichi: "東", kichi: ["南東", "北"], kyo: ["西", "南西"] },
  4: { daikichi: "東南", kichi: ["南", "東"], kyo: ["北西", "西"] },
  5: { daikichi: "中央", kichi: ["北東", "南西"], kyo: ["東", "西"] },
  6: { daikichi: "北西", kichi: ["西", "北東"], kyo: ["南", "東南"] },
  7: { daikichi: "西", kichi: ["北西", "南西"], kyo: ["東", "北"] },
  8: { daikichi: "北東", kichi: ["北", "西"], kyo: ["南", "東南"] },
  9: { daikichi: "南", kichi: ["東", "南東"], kyo: ["北", "北西"] },
};

const DIR_EMOJI: Record<string, string> = {
  "北": "⬆️", "北東": "↗️", "東": "➡️", "東南": "↘️",
  "南": "⬇️", "南西": "↙️", "西": "⬅️", "北西": "↖️", "中央": "🎯",
};

export default function KihogakuPage() {
  const [year, setYear] = useState("");
  const [result, setResult] = useState<{
    star: number; starInfo: typeof STARS[1]; kichi: typeof KICHI_2026[1];
  } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const y = Number(year);
    const star = getHonmeisei(y);
    setResult({ star, starInfo: STARS[star], kichi: KICHI_2026[star] });
  }

  const currentYear = new Date().getFullYear();

  return (
    <div style={{ background: "linear-gradient(180deg, #050302 0%, #120905 50%, #050302 100%)", minHeight: "100vh" }}>
      <div className="mx-auto max-w-[680px] px-5 py-12">

        <Link href="/diagnose" style={{ color: "rgba(201,155,77,0.7)", fontSize: "0.78rem", textDecoration: "none" }}>
          ← 診断トップに戻る
        </Link>

        <div className="mt-6 mb-10 text-center">
          <p style={{ color: "#C99B4D", fontSize: "0.6rem", letterSpacing: "0.5em", fontWeight: 700, marginBottom: "12px" }}>KIHOGAKU</p>
          <h1 className="font-serif" style={{ color: "#fff7e6", fontSize: "clamp(1.8rem, 5vw, 2.4rem)", letterSpacing: "0.06em", marginBottom: "14px" }}>
            吉方位診断
          </h1>
          <p style={{ color: "rgba(220,202,168,0.6)", fontSize: "0.84rem", lineHeight: 1.8 }}>
            九星気学をもとに、{currentYear}年のあなたの<br />
            吉方位・凶方位を算出します。
          </p>
          <div style={{ marginTop: "16px", height: "1px", background: "linear-gradient(to right, transparent, rgba(201,155,77,0.6), transparent)" }} />
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} style={{
          background: "linear-gradient(145deg, #1e1108, #170d06)",
          border: "1px solid rgba(201,155,77,0.28)",
          borderRadius: "20px", padding: "32px 28px", marginBottom: "28px",
        }}>
          <div className="mb-7">
            <p style={{ color: "rgba(201,155,77,0.8)", fontSize: "0.7rem", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "10px" }}>生まれ年</p>
            <div className="flex items-center gap-2">
              <input
                type="number" value={year} onChange={(e) => setYear(e.target.value)}
                placeholder="1990" min={1900} max={currentYear} required
                style={{ width: "110px", padding: "10px 12px", borderRadius: "8px", background: "rgba(28,17,8,0.8)", border: "1px solid rgba(201,155,77,0.22)", color: "#fff7e6", fontSize: "1rem", outline: "none" }}
              />
              <span style={{ color: "rgba(220,202,168,0.5)", fontSize: "0.85rem" }}>年生まれ</span>
            </div>
            <p style={{ marginTop: "8px", fontSize: "0.72rem", color: "rgba(220,202,168,0.4)" }}>
              ※ 九星気学は生まれ年のみで算出します（月日は不要）
            </p>
          </div>

          <button type="submit" style={{
            width: "100%", padding: "14px",
            background: "linear-gradient(135deg, #1a3a6a, #2a5a9a)",
            border: "none", borderRadius: "10px",
            color: "#fff7e6", fontSize: "0.95rem", fontWeight: 700,
            letterSpacing: "0.08em", cursor: "pointer",
          }}>
            吉方位を調べる
          </button>
        </form>

        {/* 結果 */}
        {result && (
          <div>
            {/* 本命星 */}
            <div style={{
              padding: "28px", borderRadius: "20px", textAlign: "center",
              background: "linear-gradient(145deg, #1e1108, #170d06)",
              border: "1px solid rgba(201,155,77,0.28)", marginBottom: "20px",
            }}>
              <p style={{ color: "rgba(201,155,77,0.6)", fontSize: "0.65rem", letterSpacing: "0.4em", marginBottom: "10px" }}>あなたの本命星</p>
              <div style={{ fontSize: "clamp(1.6rem, 6vw, 2.4rem)", fontFamily: "serif", fontWeight: 700, color: result.starInfo.color, marginBottom: "8px" }}>
                {result.starInfo.name}
              </div>
              <div style={{ display: "inline-block", padding: "4px 16px", borderRadius: "20px", background: `${result.starInfo.color}20`, border: `1px solid ${result.starInfo.color}40`, color: result.starInfo.color, fontSize: "0.78rem", marginBottom: "12px" }}>
                {result.starInfo.element}の気
              </div>
              <p style={{ color: "rgba(220,202,168,0.72)", fontSize: "0.84rem", lineHeight: 1.7 }}>{result.starInfo.trait}</p>
            </div>

            {/* 吉方位 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              {/* 大吉 */}
              <div style={{ padding: "20px", background: "rgba(74,120,90,0.12)", border: "1px solid rgba(74,120,90,0.3)", borderRadius: "14px", gridColumn: "1 / -1" }}>
                <p style={{ color: "#6aab8a", fontSize: "0.65rem", letterSpacing: "0.35em", fontWeight: 700, marginBottom: "10px" }}>大吉方位</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "2.2rem" }}>{DIR_EMOJI[result.kichi.daikichi] ?? "🎯"}</span>
                  <div>
                    <p style={{ color: "#fff7e6", fontSize: "1.5rem", fontFamily: "serif", fontWeight: 700 }}>{result.kichi.daikichi}</p>
                    <p style={{ color: "rgba(220,202,168,0.6)", fontSize: "0.75rem" }}>この方角への旅行・引越しが特に吉</p>
                  </div>
                </div>
              </div>

              {/* 吉方位 */}
              {result.kichi.kichi.map((dir) => (
                <div key={dir} style={{ padding: "16px", background: "rgba(106,171,138,0.08)", border: "1px solid rgba(106,171,138,0.2)", borderRadius: "12px" }}>
                  <p style={{ color: "#6aab8a", fontSize: "0.62rem", letterSpacing: "0.3em", marginBottom: "6px" }}>吉</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1.4rem" }}>{DIR_EMOJI[dir]}</span>
                    <p style={{ color: "#fff7e6", fontSize: "1.1rem", fontFamily: "serif", fontWeight: 600 }}>{dir}</p>
                  </div>
                </div>
              ))}

              {/* 凶方位 */}
              {result.kichi.kyo.map((dir) => (
                <div key={dir} style={{ padding: "16px", background: "rgba(139,30,39,0.08)", border: "1px solid rgba(139,30,39,0.2)", borderRadius: "12px" }}>
                  <p style={{ color: "#d97070", fontSize: "0.62rem", letterSpacing: "0.3em", marginBottom: "6px" }}>要注意</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1.4rem" }}>{DIR_EMOJI[dir]}</span>
                    <p style={{ color: "rgba(220,202,168,0.7)", fontSize: "1.1rem", fontFamily: "serif", fontWeight: 600 }}>{dir}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "14px 18px", background: "rgba(28,17,8,0.5)", border: "1px solid rgba(201,155,77,0.15)", borderRadius: "10px", marginBottom: "20px" }}>
              <p style={{ color: "rgba(220,202,168,0.6)", fontSize: "0.78rem", lineHeight: 1.75 }}>
                吉方位への参拝・旅行・引越しが運気を高めるとされています。特に大吉方位への神社参拝は効果的です。
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href={`/map`}
                style={{
                  display: "block", padding: "16px", textAlign: "center",
                  background: "linear-gradient(135deg, #1a3a6a, #2a5a9a)",
                  borderRadius: "12px", color: "#fff7e6", fontSize: "0.9rem",
                  fontWeight: 700, textDecoration: "none",
                }}
              >
                地図で吉方位の神社を探す →
              </Link>
              <Link
                href="/diagnose/unmei"
                style={{
                  display: "block", padding: "14px", textAlign: "center",
                  border: "1px solid rgba(201,155,77,0.35)", borderRadius: "12px",
                  color: "#C99B4D", fontSize: "0.85rem", textDecoration: "none",
                }}
              >
                運命鑑定（AI）も試してみる →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
