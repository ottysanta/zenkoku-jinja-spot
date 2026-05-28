"use client";

import { useState } from "react";
import Link from "next/link";

type YakuResult = {
  kazoeAge: number;
  mainYaku: { gender: "male" | "female"; age: number; label: string }[];
  status: "hon" | "mae" | "ato" | "safe";
  currentYaku: string | null;
  nearestYaku: { label: string; yearsUntil: number } | null;
  element: string;
  zodiac: string;
};

const MALE_YAKU = [
  { age: 25, label: "前厄", main: false },
  { age: 26, label: "本厄（大厄手前）", main: true },
  { age: 27, label: "後厄", main: false },
  { age: 41, label: "前厄", main: false },
  { age: 42, label: "本厄（大厄）", main: true },
  { age: 43, label: "後厄", main: false },
  { age: 60, label: "前厄", main: false },
  { age: 61, label: "本厄", main: true },
  { age: 62, label: "後厄", main: false },
];

const FEMALE_YAKU = [
  { age: 18, label: "前厄", main: false },
  { age: 19, label: "本厄", main: true },
  { age: 20, label: "後厄", main: false },
  { age: 32, label: "前厄", main: false },
  { age: 33, label: "本厄（大厄）", main: true },
  { age: 34, label: "後厄", main: false },
  { age: 36, label: "前厄", main: false },
  { age: 37, label: "本厄", main: true },
  { age: 38, label: "後厄", main: false },
  { age: 60, label: "前厄", main: false },
  { age: 61, label: "本厄", main: true },
  { age: 62, label: "後厄", main: false },
];

const ZODIAC_LIST = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ELEMENTS = ["金", "水", "木", "木", "土", "火", "火", "土", "金", "金", "土", "水"];
// 1900 = 子年 (index 0 of 12-cycle starting 1900)
function getZodiac(year: number) {
  const idx = ((year - 1900) % 12 + 12) % 12;
  return { zodiac: ZODIAC_LIST[idx], element: ELEMENTS[idx] };
}

function calcYaku(birthYear: number, birthMonth: number, birthDay: number, gender: "male" | "female"): YakuResult {
  const today = new Date();
  const currentYear = today.getFullYear();
  // 数え年 = 今年 - 生まれ年 + 1
  const kazoeAge = currentYear - birthYear + 1;
  const yakuList = gender === "male" ? MALE_YAKU : FEMALE_YAKU;
  const hit = yakuList.find((y) => y.age === kazoeAge);
  const { zodiac, element } = getZodiac(birthYear);

  let status: YakuResult["status"] = "safe";
  let currentYaku: string | null = null;
  if (hit) {
    currentYaku = hit.label;
    if (hit.label.startsWith("本厄")) status = "hon";
    else if (hit.label.startsWith("前厄")) status = "mae";
    else status = "ato";
  }

  // 次の厄年
  let nearestYaku: YakuResult["nearestYaku"] = null;
  for (const y of yakuList) {
    if (y.age > kazoeAge) {
      nearestYaku = { label: y.label, yearsUntil: y.age - kazoeAge };
      break;
    }
  }

  return { kazoeAge, mainYaku: [], status, currentYaku, nearestYaku, element, zodiac };
}

const STATUS_INFO = {
  hon: {
    label: "本厄",
    color: "#C94040",
    bg: "rgba(139,30,39,0.15)",
    border: "rgba(139,30,39,0.4)",
    message: "今年は本厄です。大切なことへの注意が必要な年。焦らず、慎重に行動しましょう。厄除け参拝をおすすめします。",
  },
  mae: {
    label: "前厄",
    color: "#d97070",
    bg: "rgba(139,30,39,0.1)",
    border: "rgba(139,30,39,0.3)",
    message: "今年は前厄。来年の本厄に備え、生活を整える準備の年です。早めの厄除け参拝が吉。",
  },
  ato: {
    label: "後厄",
    color: "#C99B4D",
    bg: "rgba(201,155,77,0.1)",
    border: "rgba(201,155,77,0.3)",
    message: "今年は後厄。厄の影響が残る時期。油断せず、引き続き神社でお祓いを受けると安心です。",
  },
  safe: {
    label: "厄年ではありません",
    color: "#6aab8a",
    bg: "rgba(74,120,90,0.12)",
    border: "rgba(74,120,90,0.3)",
    message: "今年は厄年にあたりません。安心して前向きに過ごしましょう。日々の感謝参拝もおすすめです。",
  },
};

export default function YakudoshiPage() {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [result, setResult] = useState<YakuResult | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const r = calcYaku(Number(year), Number(month), Number(day), gender);
    setResult(r);
  }

  const info = result ? STATUS_INFO[result.status] : null;
  const currentYear = new Date().getFullYear();

  return (
    <div style={{ background: "linear-gradient(180deg, #050302 0%, #120905 50%, #050302 100%)", minHeight: "100vh" }}>
      <div className="mx-auto max-w-[680px] px-5 py-12">

        <Link href="/diagnose" style={{ color: "rgba(201,155,77,0.7)", fontSize: "0.78rem", textDecoration: "none" }}>
          ← 診断トップに戻る
        </Link>

        <div className="mt-6 mb-10 text-center">
          <p style={{ color: "#C99B4D", fontSize: "0.6rem", letterSpacing: "0.5em", fontWeight: 700, marginBottom: "12px" }}>
            YAKUDOSHI CHECK
          </p>
          <h1 className="font-serif" style={{ color: "#fff7e6", fontSize: "clamp(1.8rem, 5vw, 2.4rem)", letterSpacing: "0.06em", marginBottom: "14px" }}>
            厄年チェック
          </h1>
          <p style={{ color: "rgba(220,202,168,0.6)", fontSize: "0.84rem", lineHeight: 1.8 }}>
            生年月日を入力するだけで、今年が厄年かどうかを即判定。<br />
            伝統的な数え年で算出します。
          </p>
          <div style={{ marginTop: "16px", height: "1px", background: "linear-gradient(to right, transparent, rgba(201,155,77,0.6), transparent)" }} />
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} style={{
          background: "linear-gradient(145deg, #1e1108, #170d06)",
          border: "1px solid rgba(201,155,77,0.28)",
          borderRadius: "20px",
          padding: "32px 28px",
          marginBottom: "28px",
        }}>
          <div className="mb-5">
            <p style={{ color: "rgba(201,155,77,0.8)", fontSize: "0.7rem", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "10px" }}>性別</p>
            <div className="flex gap-3">
              {(["female", "male"] as const).map((g) => (
                <button key={g} type="button" onClick={() => setGender(g)} style={{
                  padding: "9px 24px", borderRadius: "8px",
                  border: "1px solid", cursor: "pointer",
                  borderColor: gender === g ? "#C99B4D" : "rgba(201,155,77,0.2)",
                  background: gender === g ? "rgba(201,155,77,0.14)" : "rgba(28,17,8,0.6)",
                  color: gender === g ? "#fff7e6" : "rgba(220,202,168,0.55)",
                  fontSize: "0.88rem", fontWeight: gender === g ? 600 : 400,
                }}>
                  {g === "female" ? "女性" : "男性"}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-7">
            <p style={{ color: "rgba(201,155,77,0.8)", fontSize: "0.7rem", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "10px" }}>生年月日</p>
            <div className="flex items-center gap-2 flex-wrap">
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
                placeholder="1990" min={1900} max={currentYear} required
                style={{ width: "96px", padding: "9px 10px", borderRadius: "8px", background: "rgba(28,17,8,0.8)", border: "1px solid rgba(201,155,77,0.22)", color: "#fff7e6", fontSize: "0.95rem", outline: "none" }}
              />
              <span style={{ color: "rgba(220,202,168,0.5)", fontSize: "0.82rem" }}>年</span>
              <input type="number" value={month} onChange={(e) => setMonth(e.target.value)}
                placeholder="1" min={1} max={12} required
                style={{ width: "62px", padding: "9px 10px", borderRadius: "8px", background: "rgba(28,17,8,0.8)", border: "1px solid rgba(201,155,77,0.22)", color: "#fff7e6", fontSize: "0.95rem", outline: "none" }}
              />
              <span style={{ color: "rgba(220,202,168,0.5)", fontSize: "0.82rem" }}>月</span>
              <input type="number" value={day} onChange={(e) => setDay(e.target.value)}
                placeholder="1" min={1} max={31} required
                style={{ width: "62px", padding: "9px 10px", borderRadius: "8px", background: "rgba(28,17,8,0.8)", border: "1px solid rgba(201,155,77,0.22)", color: "#fff7e6", fontSize: "0.95rem", outline: "none" }}
              />
              <span style={{ color: "rgba(220,202,168,0.5)", fontSize: "0.82rem" }}>日</span>
            </div>
          </div>

          <button type="submit" style={{
            width: "100%", padding: "14px",
            background: "linear-gradient(135deg, #6B1E27, #8B3040)",
            border: "none", borderRadius: "10px",
            color: "#fff7e6", fontSize: "0.95rem", fontWeight: 700,
            letterSpacing: "0.08em", cursor: "pointer",
          }}>
            厄年を確認する
          </button>
        </form>

        {/* 結果 */}
        {result && info && (
          <div>
            {/* メイン判定 */}
            <div style={{
              padding: "32px 28px", borderRadius: "20px", textAlign: "center",
              background: info.bg, border: `1px solid ${info.border}`,
              marginBottom: "20px",
            }}>
              <p style={{ color: info.color, fontSize: "0.7rem", letterSpacing: "0.4em", fontWeight: 700, marginBottom: "12px" }}>
                {currentYear}年 / 数え年 {result.kazoeAge}歳
              </p>
              <div style={{ fontSize: "clamp(1.6rem, 6vw, 2.6rem)", fontWeight: 900, color: info.color, fontFamily: "serif", marginBottom: "16px", letterSpacing: "0.06em" }}>
                {result.currentYaku ?? info.label}
              </div>
              <p style={{ color: "rgba(220,202,168,0.82)", fontSize: "0.88rem", lineHeight: 1.85 }}>
                {info.message}
              </p>
            </div>

            {/* 干支・五行 */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px",
              marginBottom: "20px",
            }}>
              <div style={{ padding: "16px", background: "linear-gradient(145deg,#1e1108,#170d06)", border: "1px solid rgba(201,155,77,0.2)", borderRadius: "12px", textAlign: "center" }}>
                <p style={{ color: "rgba(201,155,77,0.6)", fontSize: "0.65rem", letterSpacing: "0.3em", marginBottom: "6px" }}>干支</p>
                <p style={{ color: "#fff7e6", fontSize: "1.4rem", fontFamily: "serif", fontWeight: 700 }}>{result.zodiac}年</p>
              </div>
              <div style={{ padding: "16px", background: "linear-gradient(145deg,#1e1108,#170d06)", border: "1px solid rgba(201,155,77,0.2)", borderRadius: "12px", textAlign: "center" }}>
                <p style={{ color: "rgba(201,155,77,0.6)", fontSize: "0.65rem", letterSpacing: "0.3em", marginBottom: "6px" }}>五行</p>
                <p style={{ color: "#fff7e6", fontSize: "1.4rem", fontFamily: "serif", fontWeight: 700 }}>{result.element}の気</p>
              </div>
            </div>

            {/* 次の厄年 */}
            {result.nearestYaku && (
              <div style={{ padding: "16px 20px", background: "rgba(28,17,8,0.6)", border: "1px solid rgba(201,155,77,0.15)", borderRadius: "12px", marginBottom: "20px" }}>
                <p style={{ color: "rgba(201,155,77,0.6)", fontSize: "0.68rem", letterSpacing: "0.3em", marginBottom: "6px" }}>次の厄年</p>
                <p style={{ color: "rgba(220,202,168,0.8)", fontSize: "0.88rem" }}>
                  {result.nearestYaku.yearsUntil}年後に <span style={{ color: "#fff7e6", fontWeight: 600 }}>{result.nearestYaku.label}</span> がやってきます
                </p>
              </div>
            )}

            {/* CTAリンク */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href={`/search?benefit=${encodeURIComponent("厄除け")}`}
                style={{
                  display: "block", padding: "16px", textAlign: "center",
                  background: "linear-gradient(135deg, #8B1E27, #C94040)",
                  borderRadius: "12px", color: "#fff7e6", fontSize: "0.9rem",
                  fontWeight: 700, textDecoration: "none", letterSpacing: "0.05em",
                }}
              >
                近くの厄除け神社を探す →
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
