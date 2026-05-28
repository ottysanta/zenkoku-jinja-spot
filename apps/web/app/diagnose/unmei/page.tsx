"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const SECTIONS = [
  { key: "1", label: "宿命・本質" },
  { key: "2", label: "性格の怖いほど当たる特徴" },
  { key: "3", label: "恋愛・結婚" },
  { key: "4", label: "仕事・お金" },
  { key: "5", label: "今後3〜5年の運気" },
  { key: "6", label: "人生で気をつけること" },
  { key: "7", label: "最後にズバッと総評" },
];

export default function UnmeiPage() {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [done, setDone] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult("");
    setDone(false);

    const res = await fetch("/api/unmei", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: Number(year), month: Number(month), day: Number(day), gender }),
    });

    if (!res.ok || !res.body) {
      setResult("鑑定に失敗しました。もう一度お試しください。");
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";

    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);

    while (true) {
      const { done: d, value } = await reader.read();
      if (d) break;
      text += decoder.decode(value, { stream: true });
      setResult(text);
    }

    setDone(true);
    setLoading(false);
  }

  // Markdown-like section rendering
  function renderResult(text: string) {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let key = 0;

    for (const line of lines) {
      if (line.startsWith("## ")) {
        const title = line.replace("## ", "").trim();
        const sectionNum = title.match(/^(\d+)\./)?.[1];
        const sectionInfo = SECTIONS.find((s) => s.key === sectionNum);
        elements.push(
          <div key={key++} className="mt-8 mb-3 flex items-center gap-3">
            {sectionInfo && (
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #8B1E27, #C94040)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.7rem", fontWeight: 700, color: "#fff7e6",
              }}>
                {sectionInfo.key}
              </div>
            )}
            <h3 style={{ color: "#C99B4D", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.05em" }}>
              {title}
            </h3>
          </div>
        );
      } else if (line.startsWith("・") || line.startsWith("•")) {
        elements.push(
          <p key={key++} style={{ color: "rgba(220,202,168,0.85)", fontSize: "0.92rem", lineHeight: 1.9, paddingLeft: "1em", marginBottom: "4px" }}>
            {line}
          </p>
        );
      } else if (line.trim()) {
        elements.push(
          <p key={key++} style={{ color: "rgba(220,202,168,0.88)", fontSize: "0.92rem", lineHeight: 1.9, marginBottom: "8px" }}>
            {line}
          </p>
        );
      }
    }
    return elements;
  }

  const currentYear = new Date().getFullYear();

  return (
    <div style={{ background: "linear-gradient(180deg, #050302 0%, #120905 50%, #050302 100%)", minHeight: "100vh" }}>
      <div className="mx-auto max-w-[720px] px-5 py-12">

        {/* 戻る */}
        <Link href="/diagnose" style={{ color: "rgba(201,155,77,0.7)", fontSize: "0.78rem", textDecoration: "none" }}>
          ← 診断トップに戻る
        </Link>

        {/* ヘッダー */}
        <div className="mt-6 mb-10 text-center">
          <p style={{ color: "#C99B4D", fontSize: "0.6rem", letterSpacing: "0.5em", fontWeight: 700, marginBottom: "12px" }}>
            UNMEI KANDOU
          </p>
          <h1 className="font-serif" style={{ color: "#fff7e6", fontSize: "clamp(1.8rem, 5vw, 2.4rem)", letterSpacing: "0.06em", lineHeight: 1.3, marginBottom: "16px" }}>
            運命鑑定
          </h1>
          <p style={{ color: "rgba(220,202,168,0.65)", fontSize: "0.85rem", lineHeight: 1.8 }}>
            生年月日から、あなたの宿命・性格・運気を<br />
            容赦なく、でも愛情を持って鑑定します。
          </p>
          <div style={{ marginTop: "16px", height: "1px", background: "linear-gradient(to right, transparent, rgba(201,155,77,0.6), transparent)" }} />
        </div>

        {/* フォーム */}
        {!result && (
          <form onSubmit={handleSubmit} style={{
            background: "linear-gradient(145deg, #1e1108, #170d06)",
            border: "1px solid rgba(201,155,77,0.3)",
            borderRadius: "20px",
            padding: "36px 32px",
          }}>
            {/* 性別 */}
            <div className="mb-6">
              <p style={{ color: "rgba(201,155,77,0.8)", fontSize: "0.72rem", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "12px" }}>
                性別
              </p>
              <div className="flex gap-3">
                {(["female", "male"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    style={{
                      padding: "10px 28px",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: gender === g ? "#C99B4D" : "rgba(201,155,77,0.25)",
                      background: gender === g ? "rgba(201,155,77,0.15)" : "rgba(28,17,8,0.6)",
                      color: gender === g ? "#fff7e6" : "rgba(220,202,168,0.6)",
                      fontSize: "0.88rem",
                      fontWeight: gender === g ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {g === "female" ? "女性" : "男性"}
                  </button>
                ))}
              </div>
            </div>

            {/* 生年月日 */}
            <div className="mb-8">
              <p style={{ color: "rgba(201,155,77,0.8)", fontSize: "0.72rem", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "12px" }}>
                生年月日
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number" value={year} onChange={(e) => setYear(e.target.value)}
                  placeholder="1990" min={1900} max={currentYear}
                  required
                  style={{
                    width: "100px", padding: "10px 12px", borderRadius: "8px",
                    background: "rgba(28,17,8,0.8)", border: "1px solid rgba(201,155,77,0.25)",
                    color: "#fff7e6", fontSize: "0.95rem", outline: "none",
                  }}
                />
                <span style={{ color: "rgba(220,202,168,0.5)", fontSize: "0.85rem" }}>年</span>
                <input
                  type="number" value={month} onChange={(e) => setMonth(e.target.value)}
                  placeholder="1" min={1} max={12}
                  required
                  style={{
                    width: "66px", padding: "10px 12px", borderRadius: "8px",
                    background: "rgba(28,17,8,0.8)", border: "1px solid rgba(201,155,77,0.25)",
                    color: "#fff7e6", fontSize: "0.95rem", outline: "none",
                  }}
                />
                <span style={{ color: "rgba(220,202,168,0.5)", fontSize: "0.85rem" }}>月</span>
                <input
                  type="number" value={day} onChange={(e) => setDay(e.target.value)}
                  placeholder="1" min={1} max={31}
                  required
                  style={{
                    width: "66px", padding: "10px 12px", borderRadius: "8px",
                    background: "rgba(28,17,8,0.8)", border: "1px solid rgba(201,155,77,0.25)",
                    color: "#fff7e6", fontSize: "0.95rem", outline: "none",
                  }}
                />
                <span style={{ color: "rgba(220,202,168,0.5)", fontSize: "0.85rem" }}>日</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "16px",
                background: "linear-gradient(135deg, #8B1E27, #C94040)",
                border: "none", borderRadius: "12px",
                color: "#fff7e6", fontSize: "1rem", fontWeight: 700,
                letterSpacing: "0.1em", cursor: "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "鑑定中…しばらくお待ちください" : "運命を鑑定する"}
            </button>

            <p style={{ marginTop: "12px", textAlign: "center", fontSize: "0.72rem", color: "rgba(220,202,168,0.4)" }}>
              ※ AIによる占いです。エンターテイメントとしてお楽しみください。
            </p>
          </form>
        )}

        {/* 結果 */}
        {result && (
          <div ref={resultRef}>
            {/* 鑑定中バナー */}
            {loading && (
              <div style={{
                textAlign: "center", padding: "16px", marginBottom: "24px",
                background: "rgba(139,30,39,0.12)", border: "1px solid rgba(139,30,39,0.3)",
                borderRadius: "12px",
              }}>
                <p style={{ color: "#C94040", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
                  ▶ 鑑定中です…
                </p>
              </div>
            )}

            {/* 結果ヘッダー */}
            <div style={{
              padding: "24px 28px 20px",
              background: "linear-gradient(145deg, #1e1108, #170d06)",
              border: "1px solid rgba(201,155,77,0.3)",
              borderRadius: "20px 20px 0 0",
              borderBottom: "none",
              textAlign: "center",
            }}>
              <p style={{ color: "#C99B4D", fontSize: "0.6rem", letterSpacing: "0.45em", marginBottom: "8px" }}>READING</p>
              <h2 className="font-serif" style={{ color: "#fff7e6", fontSize: "1.3rem" }}>
                {year}年{month}月{day}日生まれ・{gender === "female" ? "女性" : "男性"}の運命鑑定
              </h2>
            </div>

            {/* 本文 */}
            <div style={{
              padding: "8px 28px 36px",
              background: "linear-gradient(145deg, #1a0e06, #140c05)",
              border: "1px solid rgba(201,155,77,0.3)",
              borderRadius: "0 0 20px 20px",
              borderTop: "none",
            }}>
              {renderResult(result)}

              {/* カーソル */}
              {loading && (
                <span style={{ display: "inline-block", width: "2px", height: "18px", background: "#C99B4D", animation: "pulse 1s infinite", marginLeft: "4px" }} />
              )}
            </div>

            {/* 完了後のアクション */}
            {done && (
              <div style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  onClick={() => { setResult(""); setDone(false); }}
                  style={{
                    width: "100%", padding: "14px",
                    background: "transparent",
                    border: "1px solid rgba(201,155,77,0.35)",
                    borderRadius: "12px",
                    color: "#C99B4D", fontSize: "0.88rem", cursor: "pointer",
                  }}
                >
                  別の生年月日で鑑定する
                </button>
                <Link
                  href="/diagnose"
                  style={{
                    display: "block", padding: "14px", textAlign: "center",
                    background: "linear-gradient(135deg, #8B1E27, #C94040)",
                    borderRadius: "12px",
                    color: "#fff7e6", fontSize: "0.88rem", fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  他の診断も試す →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
