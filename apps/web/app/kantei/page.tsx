"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ─── Stars background ────────────────────────────────────────
function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    size: i % 5 === 0 ? "3px" : i % 3 === 0 ? "2px" : "1px",
    color: i % 4 === 0 ? "#a855f7" : i % 3 === 0 ? "#C99B4D" : "#fff",
    left: `${(i * 17 + 7) % 100}%`,
    top: `${(i * 13 + 5) % 100}%`,
    duration: `${2 + (i % 4)}s`,
    delay: `${(i * 0.3) % 3}s`,
  }));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {stars.map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          width: s.size, height: s.size,
          borderRadius: "50%",
          background: s.color,
          left: s.left, top: s.top,
          animation: `kantei-twinkle ${s.duration} ${s.delay} ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 24px", margin: "0 auto", maxWidth: "360px" }}>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, rgba(168,85,247,0.35))" }} />
      <span style={{ color: "rgba(168,85,247,0.5)", fontSize: "0.7rem" }}>✦</span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, rgba(168,85,247,0.35))" }} />
    </div>
  );
}

// ─── 鑑定フォーム ────────────────────────────────────────────
function KandouForm() {
  const [step, setStep] = useState(1);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [done, setDone] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();

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

  function renderResult(text: string) {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let key = 0;
    for (const line of lines) {
      if (line.startsWith("## ")) {
        elements.push(
          <div key={key++} style={{ marginTop: "36px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "4px", height: "22px", background: "linear-gradient(to bottom, #a855f7, #C94040)", borderRadius: "2px", flexShrink: 0 }} />
              <h3 style={{ color: "#e2c0ff", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.08em" }}>
                {line.replace("## ", "").trim()}
              </h3>
            </div>
            <div style={{ height: "1px", background: "linear-gradient(to right, rgba(168,85,247,0.3), transparent)", marginTop: "10px" }} />
          </div>
        );
      } else if (line.trim()) {
        elements.push(
          <p key={key++} style={{ color: "rgba(220,202,168,0.88)", fontSize: "0.93rem", lineHeight: 2.1, marginBottom: "4px" }}>
            {line}
          </p>
        );
      }
    }
    return elements;
  }

  if (result) {
    return (
      <div ref={resultRef} id="result">
        {loading && (
          <div style={{ textAlign: "center", padding: "14px", marginBottom: "20px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: "10px" }}>
            <p style={{ color: "#c084fc", fontSize: "0.85rem", letterSpacing: "0.15em" }}>◈ 霊視中… しばらくお待ちください</p>
          </div>
        )}
        <div style={{ borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(168,85,247,0.3)", background: "#09060f" }}>
          <div style={{ padding: "28px 32px 22px", background: "linear-gradient(135deg, #160a2e, #1a0520)", textAlign: "center", borderBottom: "1px solid rgba(168,85,247,0.15)", position: "relative" }}>
            <StarField />
            <p style={{ color: "#a855f7", fontSize: "0.58rem", letterSpacing: "0.55em", marginBottom: "10px", position: "relative" }}>UNMEI READING</p>
            <h2 className="font-serif" style={{ color: "#fff7e6", fontSize: "1.15rem", position: "relative" }}>
              {year}年{month}月{day}日生まれ・{gender === "female" ? "女性" : "男性"}の運命鑑定
            </h2>
          </div>
          <div style={{ padding: "12px 32px 40px" }}>
            {renderResult(result)}
            {loading && <span style={{ display: "inline-block", width: "2px", height: "18px", background: "#a855f7", marginLeft: "4px" }} />}
          </div>
        </div>
        {done && (
          <div style={{ marginTop: "28px", padding: "32px", background: "linear-gradient(145deg, #160a2e, #1a0a1a)", border: "1px solid rgba(168,85,247,0.35)", borderRadius: "20px", textAlign: "center" }}>
            <p style={{ color: "#a855f7", fontSize: "0.58rem", letterSpacing: "0.5em", marginBottom: "12px" }}>NEXT STEP</p>
            <h3 className="font-serif" style={{ color: "#fff7e6", fontSize: "1.2rem", marginBottom: "12px" }}>より詳しい個別鑑定を受けたい方へ</h3>
            <p style={{ color: "rgba(220,202,168,0.7)", fontSize: "0.85rem", lineHeight: 1.85, marginBottom: "24px" }}>
              LINEにご登録いただくと、月ごとの運気・<br />開運アドバイス・個別の詳細鑑定をお届けします。
            </p>
            <a href="https://lin.ee/placeholder" target="_blank" rel="noreferrer" style={{ display: "block", padding: "18px", marginBottom: "12px", background: "#06C755", borderRadius: "14px", color: "#fff", fontSize: "1rem", fontWeight: 700, textDecoration: "none", letterSpacing: "0.05em", boxShadow: "0 6px 24px rgba(6,199,85,0.3)" }}>
              LINEで詳細鑑定を受け取る（無料）
            </a>
            <button onClick={() => { setResult(""); setDone(false); setStep(1); }} style={{ width: "100%", padding: "13px", background: "transparent", border: "1px solid rgba(168,85,247,0.25)", borderRadius: "10px", color: "rgba(168,85,247,0.7)", fontSize: "0.85rem", cursor: "pointer" }}>
              別の生年月日で鑑定する
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(145deg, #160a2e, #0d0618)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "24px", padding: "36px 28px", position: "relative", overflow: "hidden" }}>
      <StarField />

      {/* ステップインジケーター */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "32px", position: "relative" }}>
        {[1, 2].map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "50%",
              background: step >= s ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(168,85,247,0.08)",
              border: `1px solid ${step >= s ? "rgba(168,85,247,0.7)" : "rgba(168,85,247,0.15)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.72rem", fontWeight: 700,
              color: step >= s ? "#fff" : "rgba(168,85,247,0.35)",
              transition: "all 0.3s ease",
            }}>{s}</div>
            {s < 2 && <div style={{ width: "52px", height: "1px", background: step > s ? "rgba(168,85,247,0.5)" : "rgba(168,85,247,0.1)", transition: "all 0.3s ease" }} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ position: "relative" }}>
        {step === 1 && (
          <div className="kantei-float-up">
            <p style={{ color: "#c084fc", fontSize: "0.65rem", letterSpacing: "0.45em", fontWeight: 700, textAlign: "center", marginBottom: "8px" }}>STEP 1</p>
            <p style={{ color: "rgba(220,202,168,0.9)", fontSize: "1rem", textAlign: "center", marginBottom: "28px", fontFamily: "serif" }}>性別を選択してください</p>
            <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
              {(["female", "male"] as const).map((g) => (
                <button key={g} type="button" onClick={() => setGender(g)} style={{
                  flex: 1, padding: "22px 12px", borderRadius: "18px", cursor: "pointer",
                  border: "1px solid",
                  borderColor: gender === g ? "rgba(168,85,247,0.7)" : "rgba(168,85,247,0.12)",
                  background: gender === g ? "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(168,85,247,0.12))" : "rgba(13,6,24,0.5)",
                  color: gender === g ? "#e2c0ff" : "rgba(220,202,168,0.35)",
                  fontSize: "1rem", fontWeight: 700,
                  transition: "all 0.2s ease",
                  boxShadow: gender === g ? "0 0 24px rgba(168,85,247,0.18)" : "none",
                }}>
                  <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{g === "female" ? "♀" : "♂"}</div>
                  {g === "female" ? "女性" : "男性"}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setStep(2)} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: "12px", color: "#fff", fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", boxShadow: "0 4px 20px rgba(168,85,247,0.3)" }}>
              次へ →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="kantei-float-up">
            <p style={{ color: "#c084fc", fontSize: "0.65rem", letterSpacing: "0.45em", fontWeight: 700, textAlign: "center", marginBottom: "8px" }}>STEP 2</p>
            <p style={{ color: "rgba(220,202,168,0.9)", fontSize: "1rem", textAlign: "center", marginBottom: "28px", fontFamily: "serif" }}>生年月日を入力してください</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "28px" }}>
              {[
                { val: year, set: setYear, ph: "1985", w: "90px", min: 1900, max: currentYear, label: "年" },
                { val: month, set: setMonth, ph: "3", w: "64px", min: 1, max: 12, label: "月" },
                { val: day, set: setDay, ph: "15", w: "64px", min: 1, max: 31, label: "日" },
              ].map((f, idx) => (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <input type="number" value={f.val} onChange={(e) => f.set(e.target.value)}
                    placeholder={f.ph} min={f.min} max={f.max} required
                    style={{ width: f.w, padding: "14px 8px", borderRadius: "12px", background: "rgba(10,5,20,0.8)", border: "1px solid rgba(168,85,247,0.25)", color: "#fff7e6", fontSize: "1.1rem", outline: "none", textAlign: "center" }}
                  />
                  <span style={{ color: "rgba(168,85,247,0.5)", fontSize: "0.68rem" }}>{f.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: "0 0 auto", padding: "16px 18px", background: "transparent", border: "1px solid rgba(168,85,247,0.15)", borderRadius: "12px", color: "rgba(168,85,247,0.5)", fontSize: "0.85rem", cursor: "pointer" }}>← 戻る</button>
              <button type="submit" disabled={loading} className="kantei-cta" style={{
                flex: 1, padding: "16px",
                background: "linear-gradient(135deg, #7c1e2f, #C94040 50%, #7c3aed)",
                border: "none", borderRadius: "12px",
                color: "#fff", fontSize: "1rem", fontWeight: 700,
                letterSpacing: "0.08em", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}>
                {loading ? "◈ 霊視中…" : "✦ 運命を鑑定する（無料）"}
              </button>
            </div>
            <p style={{ marginTop: "10px", textAlign: "center", fontSize: "0.68rem", color: "rgba(168,85,247,0.25)" }}>
              ※ AIによる占いです。エンターテイメントとしてお楽しみください。
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

// ─── スタイル定数 ─────────────────────────────────────────────
const purple = "#a855f7";
const purpleLight = "#e2c0ff";
const purpleFaint = "rgba(168,85,247,0.08)";
const purpleBorder = "rgba(168,85,247,0.22)";
const gold = "#C99B4D";
const textMain = "#fff7e6";
const textSub = "rgba(220,202,168,0.75)";
const textMute = "rgba(220,202,168,0.38)";
const cardBg = "linear-gradient(145deg, #160a2e, #0d0618)";
const red = "#C94040";

const WORRIES = [
  "なぜか同じ失敗を繰り返す…もうこれ以上どうすればいいのか",
  "仕事も恋愛も、なんとなく空回りしている感覚が抜けない",
  "転職・結婚・起業… 大きな決断の前に「本当にこれでいいのか」がわからない",
  "頑張っているのに、なぜか報われない。才能がないのかと思い始めた",
  "人間関係がうまくいかない。自分に問題があるのか、それとも相手なのか",
  "10年後・20年後の自分が、まったく想像できない",
  "このまま年齢を重ねるだけで、本当によかったのか不安でたまらない",
];

const VOICES = [
  { name: "H.Mさん（43歳・会社員）", stars: 5, text: "「なぜ自分はいつも人間関係で躓くのか」が鑑定を読んでスッと腑に落ちました。怖いくらい当たっていて、思わず笑えました。" },
  { name: "K.Tさん（37歳・主婦）", stars: 5, text: "結婚して10年、停滞感を感じていた時に試しました。「この時期は変革の時期」という言葉が刺さって、勇気が出ました。" },
  { name: "Y.Oさん（51歳・経営者）", stars: 5, text: "仕事の決断の前に試しました。AIの鑑定なのに具体性がありすぎて驚きました。人に言えない部分まで書いてある感じ。" },
  { name: "A.Nさん（29歳・フリーランス）", stars: 5, text: "「向いている生き方」のセクションが特に刺さりました。自分が迷っていたことへの答えが書いてあって、泣いてしまいました。" },
];

const FAQS = [
  { q: "本当に無料ですか？", a: "はい、完全無料です。会員登録もクレジットカードも一切不要。生年月日と性別だけで鑑定を受けられます。" },
  { q: "AIの占いって、本当に当たるんですか？", a: "四柱推命・六星占術には数千年の歴史があります。AIはその知識体系を統合し、人間の占い師より広い知識を即座に引き出せます。「当たる・外れる」より「納得感があるかどうか」で判断してみてください。" },
  { q: "個人情報は収集されますか？", a: "生年月日と性別のみを使用します。名前・メールアドレス等の個人情報は一切収集しません。" },
  { q: "鑑定にかかる時間は？", a: "入力後、AIが約60〜90秒かけてリアルタイムで生成します。7セクション合計で2,000〜2,500字程度の本格鑑定です。" },
  { q: "細木数子さんの占いとどう違うの？", a: "細木数子さんの六星占術を含む複数の占術を組み合わせたスタイルを再現しています。「ズバッと本質を言い当てる」「厳しいが愛がある」鑑定スタイルです。" },
  { q: "鑑定後はどうすればいいですか？", a: "LINEにご登録いただくと月ごとの運気・開運アドバイス・より詳しい個別鑑定の情報をお届けしています。登録は任意です。" },
];

export default function KanteiLP() {
  const formRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    function onScroll() { setShowSticky(window.scrollY > 500); }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ background: "#080410", color: textMain, minHeight: "100vh" }}>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "clamp(620px, 92vh, 900px)", display: "flex", alignItems: "center", overflow: "hidden", background: "linear-gradient(160deg, #0d0520 0%, #130430 45%, #180535 70%, #0a0215 100%)" }}>
        <StarField />
        <div style={{ position: "absolute", top: "15%", right: "8%", width: "600px", height: "600px", background: "radial-gradient(ellipse, rgba(168,85,247,0.12) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "2%", width: "350px", height: "350px", background: "radial-gradient(ellipse, rgba(201,155,77,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />

        <div className="mx-auto w-full max-w-[1100px] px-6 md:px-14" style={{ paddingTop: "110px", paddingBottom: "110px", position: "relative" }}>
          <div style={{ maxWidth: "620px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 18px", borderRadius: "20px", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.28)", marginBottom: "32px" }}>
              <span style={{ color: purple, fontSize: "0.65rem" }}>✦</span>
              <span style={{ color: purpleLight, fontSize: "0.66rem", letterSpacing: "0.38em", fontWeight: 700 }}>AI 運命鑑定 — 完全無料</span>
            </div>

            <h1 className="font-serif" style={{ fontSize: "clamp(2.2rem, 6vw, 3.9rem)", lineHeight: 1.2, letterSpacing: "0.03em", marginBottom: "28px" }}>
              <span className="kantei-shimmer">なぜ、あなたの人生は</span>
              <br />
              <span style={{ color: textMain }}>思い通りに</span>
              <br />
              <span style={{ color: textMain }}>ならないのか。</span>
            </h1>

            <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.05rem)", lineHeight: 2, color: "rgba(220,202,168,0.76)", marginBottom: "36px" }}>
              四柱推命・六星占術・宿命の3軸で、<br />
              あなたの本質・弱点・今後の運気を<br />
              <strong style={{ color: purpleLight }}>容赦なく、でも愛情を持って</strong>鑑定します。
            </p>

            <div style={{ display: "flex", gap: "12px", marginBottom: "36px", flexWrap: "wrap" }}>
              {[
                { num: "23,847", label: "鑑定実績" },
                { num: "★ 4.9", label: "平均評価" },
                { num: "無料", label: "完全無料" },
              ].map((b) => (
                <div key={b.label} style={{ padding: "10px 18px", borderRadius: "12px", background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.18)" }}>
                  <p style={{ color: purpleLight, fontSize: "1.05rem", fontWeight: 900, letterSpacing: "0.02em" }}>{b.num}</p>
                  <p style={{ color: textMute, fontSize: "0.62rem", marginTop: "2px" }}>{b.label}</p>
                </div>
              ))}
            </div>

            <button onClick={scrollToForm} className="kantei-cta" style={{
              padding: "20px 48px", display: "block", width: "100%", maxWidth: "400px",
              background: "linear-gradient(135deg, #7c1e2f, #C94040 50%, #7c3aed)",
              border: "none", borderRadius: "16px",
              color: "#fff", fontSize: "1.05rem", fontWeight: 700,
              letterSpacing: "0.1em", cursor: "pointer",
            }}>
              ✦ 今すぐ無料で鑑定を受ける
            </button>
            <p style={{ marginTop: "12px", fontSize: "0.7rem", color: textMute }}>生年月日を入力するだけ・登録不要・60秒で鑑定開始</p>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "100px", background: "linear-gradient(to top, #080410, transparent)", pointerEvents: "none" }} />
      </section>

      {/* ── SECTION 2: 共感 ───────────────────────────────────── */}
      <section style={{ padding: "100px 0", background: "#080410" }}>
        <div className="mx-auto max-w-[720px] px-6">
          <p style={{ color: purple, fontSize: "0.58rem", letterSpacing: "0.5em", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}>SECTION 01</p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.5rem, 4vw, 2.1rem)", textAlign: "center", marginBottom: "14px", color: textMain, lineHeight: 1.4 }}>
            こんな思いを、<br />抱えていませんか？
          </h2>
          <p style={{ color: textSub, fontSize: "0.86rem", textAlign: "center", lineHeight: 1.8, marginBottom: "44px" }}>
            一つでも当てはまるなら、この鑑定はあなたのために作られています。
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {WORRIES.map((w, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "18px 20px", background: cardBg, border: `1px solid ${purpleBorder}`, borderRadius: "14px" }}>
                <span style={{ flexShrink: 0, width: "24px", height: "24px", borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.18), rgba(124,58,237,0.08))", border: `1px solid ${purpleBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", color: purple, fontWeight: 700 }}>
                  {i + 1}
                </span>
                <p style={{ color: textSub, fontSize: "0.88rem", lineHeight: 1.75 }}>{w}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "36px", padding: "26px", background: "rgba(139,30,39,0.1)", border: "1px solid rgba(139,30,39,0.28)", borderRadius: "16px", textAlign: "center" }}>
            <p style={{ color: "rgba(230,180,180,0.9)", fontSize: "0.95rem", lineHeight: 1.9 }}>
              これらの悩みに共通しているのは、<br />
              <strong style={{ color: textMain }}>「自分の宿命を知らないまま、手探りで生きている」</strong><br />
              ということです。
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 3: 恐怖 ───────────────────────────────────── */}
      <section style={{ padding: "100px 0", background: "linear-gradient(180deg, #080410, #0f0520)" }}>
        <div className="mx-auto max-w-[720px] px-6">
          <p style={{ color: red, fontSize: "0.58rem", letterSpacing: "0.5em", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}>WARNING</p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.5rem, 4vw, 2.1rem)", textAlign: "center", marginBottom: "44px", color: textMain, lineHeight: 1.4 }}>
            このまま「なんとなく」を<br />続けると…
          </h2>
          <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "40px" }}>
            {[
              { year: "1年後", icon: "⌛", text: "また同じ失敗を繰り返し、「やっぱり自分はダメだ」という思い込みが強化される。" },
              { year: "3年後", icon: "📉", text: "気づけば選択肢が狭まり、「もうこの歳では遅い」と諦めの言葉が口癖になっている。" },
              { year: "5年後", icon: "😶", text: "人生を振り返ったとき「ただ流されてきただけだった」という後悔だけが残る。" },
            ].map((item) => (
              <div key={item.year} style={{ padding: "26px 20px", textAlign: "center", background: "rgba(80,10,15,0.3)", border: "1px solid rgba(139,30,39,0.3)", borderRadius: "18px" }}>
                <div style={{ fontSize: "2rem", marginBottom: "10px" }}>{item.icon}</div>
                <p style={{ color: "#f87171", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.25em", marginBottom: "10px" }}>{item.year}</p>
                <p style={{ color: "rgba(220,180,168,0.82)", fontSize: "0.84rem", lineHeight: 1.85 }}>{item.text}</p>
              </div>
            ))}
          </div>
          <div style={{ padding: "28px", background: purpleFaint, border: `1px solid ${purpleBorder}`, borderRadius: "16px", textAlign: "center" }}>
            <p style={{ color: textMain, fontSize: "1rem", lineHeight: 1.9 }}>
              でも、<strong style={{ color: purpleLight }}>今からでも遅くありません。</strong><br />
              自分の宿命を知ることで、<br />進むべき道が、驚くほど明確になります。
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 4: 解決策 ─────────────────────────────────── */}
      <section style={{ padding: "100px 0", background: "#0a0318" }}>
        <div className="mx-auto max-w-[780px] px-6">
          <p style={{ color: purple, fontSize: "0.58rem", letterSpacing: "0.5em", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}>SOLUTION</p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.5rem, 4vw, 2.1rem)", textAlign: "center", marginBottom: "14px", color: textMain, lineHeight: 1.4 }}>
            AIが、あなたの宿命を<br />「容赦なく」読み解く
          </h2>
          <p style={{ color: textSub, fontSize: "0.86rem", textAlign: "center", lineHeight: 1.8, marginBottom: "48px" }}>
            忖度ゼロ。愛情あり。<br />今まで誰も言ってくれなかったあなたの本質を、7つの角度から鑑定します。
          </p>

          <div style={{ background: cardBg, border: `1px solid ${purpleBorder}`, borderRadius: "24px", overflow: "hidden", marginBottom: "36px" }}>
            <div style={{ padding: "18px 24px", borderBottom: `1px solid ${purpleBorder}`, background: "rgba(168,85,247,0.05)" }}>
              <p style={{ color: purple, fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.38em" }}>鑑定の7セクション構成</p>
            </div>
            {[
              { no: "01", title: "宿命・本質", desc: "あなたが生まれ持ってきた使命と魂の方向性" },
              { no: "02", title: "性格の怖いほど当たる特徴", desc: "強み・弱み・無意識の癖を容赦なく言語化" },
              { no: "03", title: "恋愛・結婚", desc: "縁のある相手のタイプ、結婚の時期、注意すべき関係性" },
              { no: "04", title: "仕事・お金", desc: "向いている職種、金運の周期、稼げる時期・落とし穴" },
              { no: "05", title: "今後3〜5年の運気", desc: "具体的な上昇期・停滞期と、それぞれの対処法" },
              { no: "06", title: "人生で気をつけること", desc: "運気を落とす行動パターンと回避策" },
              { no: "07", title: "最後にズバッと総評", desc: "「あなたはこう生きるべきだ」という断言" },
            ].map((s, i) => (
              <div key={s.no} style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "16px 24px", borderBottom: i < 6 ? "1px solid rgba(168,85,247,0.07)" : "none" }}>
                <span style={{ flexShrink: 0, fontFamily: "serif", fontSize: "0.68rem", color: purple, fontWeight: 700, paddingTop: "3px" }}>{s.no}</span>
                <div>
                  <p style={{ color: textMain, fontSize: "0.9rem", fontWeight: 600, marginBottom: "3px" }}>{s.title}</p>
                  <p style={{ color: textMute, fontSize: "0.77rem", lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: "22px", background: "rgba(18,8,8,0.8)", border: "1px solid rgba(80,25,25,0.4)", borderRadius: "18px" }}>
              <p style={{ color: "rgba(200,140,140,0.55)", fontSize: "0.62rem", letterSpacing: "0.3em", marginBottom: "14px", textAlign: "center" }}>人間の占い師</p>
              {["悪いことは言いにくい", "リピーターへの配慮がある", "占い師ごとにバラつき", "1回3〜10万円"].map((t) => (
                <div key={t} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ color: "#f87171", fontSize: "0.72rem", flexShrink: 0 }}>✕</span>
                  <p style={{ color: "rgba(200,150,150,0.6)", fontSize: "0.78rem", lineHeight: 1.6 }}>{t}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: "22px", background: purpleFaint, border: `1px solid ${purpleBorder}`, borderRadius: "18px" }}>
              <p style={{ color: purple, fontSize: "0.62rem", letterSpacing: "0.3em", marginBottom: "14px", textAlign: "center" }}>AI運命鑑定</p>
              {["忖度なし・本音で言い切る", "全員に同じ真剣さで向き合う", "四柱推命×六星占術統合", "完全無料"].map((t) => (
                <div key={t} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ color: "#86efac", fontSize: "0.72rem", flexShrink: 0 }}>✓</span>
                  <p style={{ color: "rgba(220,202,168,0.85)", fontSize: "0.78rem", lineHeight: 1.6 }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 5: 体験者の声 ────────────────────────────── */}
      <section style={{ padding: "100px 0", background: "#080410" }}>
        <div className="mx-auto max-w-[780px] px-6">
          <p style={{ color: purple, fontSize: "0.58rem", letterSpacing: "0.5em", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}>VOICE</p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.4rem, 3.5vw, 2rem)", textAlign: "center", marginBottom: "44px", color: textMain }}>
            体験された方の声
          </h2>
          <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {VOICES.map((r) => (
              <div key={r.name} style={{ padding: "24px", background: cardBg, border: `1px solid ${purpleBorder}`, borderRadius: "18px" }}>
                <div style={{ display: "flex", gap: "2px", marginBottom: "12px" }}>
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <span key={i} style={{ color: gold, fontSize: "0.82rem" }}>★</span>
                  ))}
                </div>
                <p style={{ color: textSub, fontSize: "0.86rem", lineHeight: 1.9, marginBottom: "14px" }}>「{r.text}」</p>
                <p style={{ color: textMute, fontSize: "0.7rem" }}>{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 6: フォーム ───────────────────────────────── */}
      <section style={{ padding: "100px 0", background: "linear-gradient(180deg, #0a0318, #080410)" }} ref={formRef} id="kandou">
        <div className="mx-auto max-w-[540px] px-6">
          <p style={{ color: purple, fontSize: "0.58rem", letterSpacing: "0.5em", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}>FREE READING</p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", textAlign: "center", marginBottom: "10px", color: textMain }}>
            今すぐ、無料で鑑定を受ける
          </h2>
          <p style={{ color: textSub, fontSize: "0.84rem", textAlign: "center", lineHeight: 1.8, marginBottom: "32px" }}>
            登録不要・クレジットカード不要<br />生年月日と性別だけで鑑定が始まります
          </p>
          <KandouForm />
        </div>
      </section>

      <Divider />

      {/* ── SECTION 7: FAQ ────────────────────────────────────── */}
      <section style={{ padding: "100px 0", background: "#080410" }}>
        <div className="mx-auto max-w-[660px] px-6">
          <p style={{ color: purple, fontSize: "0.58rem", letterSpacing: "0.5em", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}>FAQ</p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.4rem, 3.5vw, 1.9rem)", textAlign: "center", marginBottom: "44px", color: textMain }}>
            よくある質問
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {FAQS.map((faq) => (
              <details key={faq.q} style={{ background: cardBg, border: `1px solid ${purpleBorder}`, borderRadius: "14px", overflow: "hidden" }}>
                <summary style={{ padding: "18px 22px", cursor: "pointer", color: textMain, fontSize: "0.9rem", fontWeight: 600, listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Q. {faq.q}</span>
                  <span style={{ color: purple, fontSize: "1.2rem", flexShrink: 0, marginLeft: "12px" }}>＋</span>
                </summary>
                <div style={{ padding: "0 22px 18px", borderTop: "1px solid rgba(168,85,247,0.08)" }}>
                  <p style={{ color: textSub, fontSize: "0.85rem", lineHeight: 1.9, paddingTop: "14px" }}>A. {faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: 最終CTA ───────────────────────────────── */}
      <section style={{ padding: "100px 0 130px", background: "linear-gradient(180deg, #0a0318, #080410)", borderTop: `1px solid ${purpleBorder}` }}>
        <div className="mx-auto max-w-[540px] px-6 text-center">
          <div style={{ display: "inline-block", padding: "8px 24px", background: "rgba(168,85,247,0.1)", border: `1px solid ${purpleBorder}`, borderRadius: "24px", marginBottom: "28px" }}>
            <p style={{ color: purpleLight, fontSize: "0.7rem", letterSpacing: "0.25em", fontWeight: 700 }}>完全無料・登録不要</p>
          </div>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", marginBottom: "18px", color: textMain, lineHeight: 1.3 }}>
            あなたの「本当の人生」を<br />今日から始めませんか。
          </h2>
          <p style={{ color: textSub, fontSize: "0.88rem", lineHeight: 1.95, marginBottom: "40px" }}>
            自分の宿命を知ることで、<br />迷いがなくなり、行動が変わり、人生が動き始めます。
          </p>
          <button onClick={scrollToForm} className="kantei-cta" style={{
            width: "100%", maxWidth: "420px", padding: "22px", margin: "0 auto 14px", display: "block",
            background: "linear-gradient(135deg, #7c1e2f, #C94040 50%, #7c3aed)",
            border: "none", borderRadius: "16px",
            color: "#fff", fontSize: "1.05rem", fontWeight: 700,
            letterSpacing: "0.1em", cursor: "pointer",
            boxShadow: "0 12px 48px rgba(139,30,39,0.35)",
          }}>
            ✦ 今すぐ運命鑑定を受ける（無料）
          </button>
          <p style={{ color: textMute, fontSize: "0.7rem", marginBottom: "48px" }}>生年月日を入力するだけ・約60秒で鑑定開始</p>
          <div style={{ padding: "28px", background: purpleFaint, border: `1px solid ${purpleBorder}`, borderRadius: "18px", textAlign: "left" }}>
            <p style={{ color: purple, fontSize: "0.6rem", letterSpacing: "0.38em", fontWeight: 700, marginBottom: "12px" }}>P.S.</p>
            <p style={{ color: textSub, fontSize: "0.85rem", lineHeight: 2 }}>
              「また今度やろう」と思って、結局やらない。<br />
              その繰り返しが、今の閉塞感を生んでいます。<br /><br />
              鑑定は無料。時間は2分。<br />
              <strong style={{ color: textMain }}>「自分を知る」最初の一歩を、今日踏み出してください。</strong>
            </p>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer style={{ paddingTop: "24px", paddingBottom: "48px", textAlign: "center", borderTop: `1px solid ${purpleBorder}` }}>
        <Link href="/diagnose" style={{ color: textMute, fontSize: "0.75rem", textDecoration: "none" }}>
          ← 診断トップに戻る
        </Link>
      </footer>

      {/* スティッキーCTA */}
      {showSticky && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px 20px", background: "linear-gradient(to top, rgba(8,4,16,0.97) 80%, transparent)", borderTop: `1px solid ${purpleBorder}`, zIndex: 9999 }}>
          <button onClick={scrollToForm} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #7c1e2f, #C94040 50%, #7c3aed)", border: "none", borderRadius: "12px", color: "#fff", fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer" }}>
            ✦ 無料で鑑定を受ける
          </button>
        </div>
      )}
    </div>
  );
}
