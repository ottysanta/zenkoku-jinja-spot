"use client";

import { useState, useRef } from "react";
import Link from "next/link";

// ─── 鑑定フォーム ────────────────────────────────────────────
function KandouForm() {
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

  function renderResult(text: string) {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let key = 0;
    for (const line of lines) {
      if (line.startsWith("## ")) {
        elements.push(
          <div key={key++} style={{ marginTop: "32px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "3px", height: "24px", background: "linear-gradient(to bottom, #C94040, #8B1E27)", borderRadius: "2px", flexShrink: 0 }} />
            <h3 style={{ color: "#C99B4D", fontSize: "1.05rem", fontWeight: 700, letterSpacing: "0.06em" }}>
              {line.replace("## ", "").trim()}
            </h3>
          </div>
        );
      } else if (line.trim()) {
        elements.push(
          <p key={key++} style={{ color: "rgba(220,202,168,0.88)", fontSize: "0.93rem", lineHeight: 2, marginBottom: "6px" }}>
            {line}
          </p>
        );
      }
    }
    return elements;
  }

  const currentYear = new Date().getFullYear();

  if (result) {
    return (
      <div ref={resultRef} id="result">
        {loading && (
          <div style={{ textAlign: "center", padding: "12px", marginBottom: "20px", background: "rgba(139,30,39,0.12)", border: "1px solid rgba(139,30,39,0.3)", borderRadius: "10px" }}>
            <p style={{ color: "#C94040", fontSize: "0.85rem", letterSpacing: "0.1em" }}>▶ 鑑定中…</p>
          </div>
        )}

        <div style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(201,155,77,0.3)" }}>
          <div style={{ padding: "24px 28px 20px", background: "linear-gradient(135deg, #1e1108, #2a1208)", textAlign: "center", borderBottom: "1px solid rgba(201,155,77,0.2)" }}>
            <p style={{ color: "#C99B4D", fontSize: "0.6rem", letterSpacing: "0.5em", marginBottom: "8px" }}>UNMEI READING</p>
            <h2 className="font-serif" style={{ color: "#fff7e6", fontSize: "1.2rem" }}>
              {year}年{month}月{day}日生まれ・{gender === "female" ? "女性" : "男性"}の運命鑑定
            </h2>
          </div>
          <div style={{ padding: "8px 28px 36px", background: "linear-gradient(180deg, #1a0e06, #140c05)" }}>
            {renderResult(result)}
            {loading && <span style={{ display: "inline-block", width: "2px", height: "18px", background: "#C99B4D", marginLeft: "4px" }} />}
          </div>
        </div>

        {done && (
          <div style={{ marginTop: "28px", padding: "28px", background: "linear-gradient(145deg, #1e1510, #2a1d0e)", border: "1px solid rgba(201,155,77,0.35)", borderRadius: "16px", textAlign: "center" }}>
            <p style={{ color: "#C99B4D", fontSize: "0.65rem", letterSpacing: "0.4em", marginBottom: "10px" }}>NEXT STEP</p>
            <h3 className="font-serif" style={{ color: "#fff7e6", fontSize: "1.2rem", marginBottom: "10px" }}>
              より詳しい鑑定を受けたい方へ
            </h3>
            <p style={{ color: "rgba(220,202,168,0.7)", fontSize: "0.84rem", lineHeight: 1.8, marginBottom: "20px" }}>
              LINEにご登録いただくと、<br />
              個別の詳細鑑定・月運・開運アドバイスをお届けします。
            </p>
            <a
              href="https://lin.ee/placeholder"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block", padding: "16px", marginBottom: "12px",
                background: "#06C755", borderRadius: "12px",
                color: "#fff", fontSize: "1rem", fontWeight: 700,
                textDecoration: "none", letterSpacing: "0.05em",
              }}
            >
              LINEで詳細鑑定を受け取る（無料）
            </a>
            <button
              onClick={() => { setResult(""); setDone(false); }}
              style={{ width: "100%", padding: "13px", background: "transparent", border: "1px solid rgba(201,155,77,0.3)", borderRadius: "10px", color: "rgba(201,155,77,0.8)", fontSize: "0.85rem", cursor: "pointer" }}
            >
              別の生年月日で鑑定する
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} id="form" style={{
      background: "linear-gradient(145deg, #1e1108, #170d06)",
      border: "1px solid rgba(201,155,77,0.35)",
      borderRadius: "20px",
      padding: "36px 32px",
    }}>
      <p style={{ color: "#C99B4D", fontSize: "0.65rem", letterSpacing: "0.45em", fontWeight: 700, textAlign: "center", marginBottom: "20px" }}>
        今すぐ無料で鑑定を受ける
      </p>

      <div style={{ marginBottom: "20px" }}>
        <p style={{ color: "rgba(201,155,77,0.75)", fontSize: "0.7rem", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "10px" }}>性別</p>
        <div style={{ display: "flex", gap: "10px" }}>
          {(["female", "male"] as const).map((g) => (
            <button key={g} type="button" onClick={() => setGender(g)} style={{
              flex: 1, padding: "11px", borderRadius: "8px", cursor: "pointer",
              border: "1px solid", transition: "all 0.15s",
              borderColor: gender === g ? "#C99B4D" : "rgba(201,155,77,0.2)",
              background: gender === g ? "rgba(201,155,77,0.14)" : "rgba(28,17,8,0.6)",
              color: gender === g ? "#fff7e6" : "rgba(220,202,168,0.55)",
              fontSize: "0.9rem", fontWeight: gender === g ? 700 : 400,
            }}>
              {g === "female" ? "女性" : "男性"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p style={{ color: "rgba(201,155,77,0.75)", fontSize: "0.7rem", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "10px" }}>生年月日</p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
            placeholder="1985" min={1900} max={currentYear} required
            style={{ width: "96px", padding: "11px 12px", borderRadius: "8px", background: "rgba(10,6,3,0.8)", border: "1px solid rgba(201,155,77,0.25)", color: "#fff7e6", fontSize: "1rem", outline: "none" }}
          />
          <span style={{ color: "rgba(220,202,168,0.45)", fontSize: "0.82rem" }}>年</span>
          <input type="number" value={month} onChange={(e) => setMonth(e.target.value)}
            placeholder="3" min={1} max={12} required
            style={{ width: "60px", padding: "11px 10px", borderRadius: "8px", background: "rgba(10,6,3,0.8)", border: "1px solid rgba(201,155,77,0.25)", color: "#fff7e6", fontSize: "1rem", outline: "none" }}
          />
          <span style={{ color: "rgba(220,202,168,0.45)", fontSize: "0.82rem" }}>月</span>
          <input type="number" value={day} onChange={(e) => setDay(e.target.value)}
            placeholder="15" min={1} max={31} required
            style={{ width: "60px", padding: "11px 10px", borderRadius: "8px", background: "rgba(10,6,3,0.8)", border: "1px solid rgba(201,155,77,0.25)", color: "#fff7e6", fontSize: "1rem", outline: "none" }}
          />
          <span style={{ color: "rgba(220,202,168,0.45)", fontSize: "0.82rem" }}>日</span>
        </div>
      </div>

      <button type="submit" disabled={loading} style={{
        width: "100%", padding: "18px",
        background: "linear-gradient(135deg, #8B1E27, #C94040)",
        border: "none", borderRadius: "12px",
        color: "#fff7e6", fontSize: "1.05rem", fontWeight: 700,
        letterSpacing: "0.1em", cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
      }}>
        {loading ? "鑑定中…しばらくお待ちください" : "運命を鑑定する（無料）"}
      </button>
      <p style={{ marginTop: "10px", textAlign: "center", fontSize: "0.7rem", color: "rgba(220,202,168,0.35)" }}>
        ※ AIによる占いです。エンターテイメントとしてお楽しみください。
      </p>
    </form>
  );
}

// ─── メインLP ────────────────────────────────────────────────
const gold = "#C99B4D";
const goldFaint = "rgba(201,155,77,0.15)";
const goldBorder = "rgba(201,155,77,0.28)";
const textMain = "#fff7e6";
const textSub = "rgba(220,202,168,0.75)";
const textMute = "rgba(220,202,168,0.45)";
const cardBg = "linear-gradient(145deg, #1e1108, #170d06)";
const red = "#C94040";

const WORRIES = [
  "なぜか同じ失敗を繰り返す…もうこれ以上どうすればいいのか",
  "仕事も恋愛も、なんとなく空回りしている感覚が抜けない",
  "転職・結婚・起業…大きな決断の前に「本当にこれでいいのか」がわからない",
  "頑張っているのに、なぜか報われない。才能がないのかと思い始めた",
  "人間関係がうまくいかない。自分に問題があるのか、それとも相手なのか",
  "10年後・20年後の自分が、まったく想像できない",
  "このまま年齢を重ねるだけで、本当によかったのか不安でたまらない",
];

const FEATURES = [
  {
    num: "01",
    title: "四柱推命 × 六星占術 × 宿命の3軸鑑定",
    desc: "生年月日から算出した四柱推命の命式、六星占術の運命周期、そして宿命的な性格傾向を掛け合わせた本格鑑定。一般的な占いサイトの「生まれ年だけ」の診断とはレベルが違います。",
  },
  {
    num: "02",
    title: "忖度ゼロ・容赦なし。AIだから本音で言い当てる",
    desc: "人間の占い師だと「悪いことは言いにくい」という遠慮が生まれます。AIには忖度がありません。あなたの弱点・運気の落とし穴・人生で気をつけるべきことを、正面からズバッと指摘します。",
  },
  {
    num: "03",
    title: "7つのセクションで人生を立体的に把握",
    desc: "宿命・性格・恋愛・仕事・お金・今後3〜5年の運気・総評と、人生の全方位を網羅。読み終わった後、「そうか、自分はこういう人間だったのか」という納得感があります。",
  },
  {
    num: "04",
    title: "完全無料。今すぐ、この画面から試せる",
    desc: "会員登録不要。クレジットカード不要。生年月日と性別を入力するだけで、約1分で鑑定が始まります。まず試して、自分の目で確かめてください。",
  },
];

const RESULTS = [
  {
    name: "H.Mさん（43歳・会社員）",
    text: "「なぜ自分はいつも人間関係で躓くのか」が、鑑定を読んでスッと腑に落ちました。怖いくらい当たっていて、思わず笑えました。",
  },
  {
    name: "K.Tさん（37歳・主婦）",
    text: "結婚して10年、なんとなく停滞感を感じていた時に試しました。「この時期は変革の時期」という言葉が刺さって、勇気が出ました。",
  },
  {
    name: "Y.Oさん（51歳・経営者）",
    text: "仕事の決断の前に試しました。AIの鑑定なのに、具体性がありすぎて驚きました。人に言えない部分まで書いてある感じ。",
  },
  {
    name: "A.Nさん（29歳・フリーランス）",
    text: "「向いている生き方」のセクションが特に刺さりました。自分が迷っていたことへの答えが書いてあって、泣いてしまいました。",
  },
];

const FAQS = [
  {
    q: "本当に無料ですか？",
    a: "はい、完全無料です。会員登録もクレジットカードも一切不要。生年月日と性別だけで鑑定を受けられます。",
  },
  {
    q: "AIの占いって、本当に当たるんですか？",
    a: "四柱推命・六星占術には数千年の歴史と膨大なデータの蓄積があります。AIはその知識体系を統合し、人間の占い師より広い知識を即座に引き出せます。「当たる・外れる」より「納得感があるかどうか」で判断してみてください。",
  },
  {
    q: "個人情報は収集されますか？",
    a: "生年月日と性別のみを使用します。名前・メールアドレス等の個人情報は一切収集しません。安心してお試しください。",
  },
  {
    q: "鑑定にかかる時間は？",
    a: "入力後、AIが約60〜90秒かけてリアルタイムで鑑定文を生成します。7つのセクション合計で2,000〜2,500字程度の本格鑑定です。",
  },
  {
    q: "細木数子さんの占いとどう違うの？",
    a: "細木数子さんの六星占術を含む複数の占術を組み合わせたスタイルを再現しています。「ズバッと本質を言い当てる」「厳しいが愛がある」という鑑定スタイルを大切にしています。",
  },
  {
    q: "鑑定後はどうすればいいですか？",
    a: "鑑定後、LINEにご登録いただくと月ごとの運気・開運アドバイス・より詳しい個別鑑定の情報をお届けしています。登録は任意です。",
  },
];

export default function UnmeiLPPage() {
  const formRef = useRef<HTMLDivElement>(null);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ background: "#060402", color: textMain, minHeight: "100vh" }}>

      {/* ──────────────────────────────────────────
          SECTION 1: ヒーロー
      ────────────────────────────────────────── */}
      <section style={{
        background: [
          "linear-gradient(160deg, rgba(5,3,2,0.97) 0%, rgba(5,3,2,0.88) 35%, rgba(5,3,2,0.6) 60%, rgba(5,3,2,0.2) 85%)",
          "linear-gradient(to top, rgba(5,3,2,1) 0%, rgba(5,3,2,0.5) 20%, transparent 50%)",
          "url('/assets/shrine/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8826%E6%97%A5%2019_31_07%20(1).webp')",
        ].join(","),
        backgroundSize: "cover",
        backgroundPosition: "65% center",
        minHeight: "clamp(540px, 80vh, 780px)",
        display: "flex",
        alignItems: "center",
        position: "relative",
      }}>
        <div className="mx-auto w-full max-w-[1100px] px-6 md:px-12" style={{ paddingTop: "80px", paddingBottom: "80px" }}>
          <div style={{ maxWidth: "560px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ width: "20px", height: "1px", background: gold }} />
              <p style={{ color: gold, fontSize: "0.58rem", letterSpacing: "0.48em", fontWeight: 700 }}>
                AI 運命鑑定
              </p>
            </div>

            <h1 className="font-serif" style={{
              fontSize: "clamp(2rem, 5.5vw, 3.2rem)",
              lineHeight: 1.25,
              letterSpacing: "0.04em",
              marginBottom: "24px",
              color: textMain,
            }}>
              なぜ、あなたの人生は<br />
              思い通りにならないのか。
            </h1>

            <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.05rem)", lineHeight: 1.9, color: "rgba(220,202,168,0.82)", marginBottom: "32px" }}>
              四柱推命・六星占術・宿命の3軸で、<br />
              あなたの本質・弱点・今後の運気を<br className="hidden md:block" />
              <strong style={{ color: textMain }}>容赦なく、でも愛情を持って</strong>鑑定します。
            </p>

            <button onClick={scrollToForm} style={{
              padding: "18px 40px",
              background: "linear-gradient(135deg, #8B1E27, #C94040)",
              border: "none", borderRadius: "12px",
              color: textMain, fontSize: "1rem", fontWeight: 700,
              letterSpacing: "0.1em", cursor: "pointer",
              boxShadow: "0 8px 32px rgba(139,30,39,0.5)",
            }}>
              今すぐ無料で鑑定を受ける
            </button>

            <p style={{ marginTop: "12px", fontSize: "0.72rem", color: textMute }}>
              生年月日を入力するだけ / 登録不要 / 完全無料
            </p>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          SECTION 2: 共感・問題認識
      ────────────────────────────────────────── */}
      <section style={{ padding: "88px 0", background: "#080604" }}>
        <div className="mx-auto max-w-[780px] px-6">
          <p style={{ color: gold, fontSize: "0.6rem", letterSpacing: "0.45em", fontWeight: 700, textAlign: "center", marginBottom: "14px" }}>SECTION 01</p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", textAlign: "center", marginBottom: "12px", color: textMain, letterSpacing: "0.04em" }}>
            こんな思いを、抱えていませんか？
          </h2>
          <p style={{ color: textSub, fontSize: "0.88rem", textAlign: "center", lineHeight: 1.8, marginBottom: "40px" }}>
            一つでも当てはまるなら、この鑑定はあなたのために作られています。
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {WORRIES.map((w, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: "14px",
                padding: "18px 20px", background: cardBg,
                border: `1px solid ${goldBorder}`, borderRadius: "12px",
              }}>
                <span style={{
                  flexShrink: 0, width: "22px", height: "22px",
                  borderRadius: "50%", background: "rgba(201,155,77,0.15)",
                  border: `1px solid ${goldBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", color: gold, fontWeight: 700, marginTop: "1px",
                }}>
                  {i + 1}
                </span>
                <p style={{ color: textSub, fontSize: "0.88rem", lineHeight: 1.75 }}>{w}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "32px", padding: "24px", background: "rgba(139,30,39,0.08)", border: "1px solid rgba(139,30,39,0.25)", borderRadius: "14px", textAlign: "center" }}>
            <p style={{ color: "rgba(220,180,180,0.9)", fontSize: "0.95rem", lineHeight: 1.85, fontWeight: 500 }}>
              これらの悩みに共通しているのは、<br />
              <strong style={{ color: textMain }}>「自分の宿命を知らないまま、手探りで生きている」</strong><br />
              ということです。
            </p>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          SECTION 3: 問題を放置した未来（恐怖）
      ────────────────────────────────────────── */}
      <section style={{ padding: "88px 0", background: "linear-gradient(180deg, #080604, #0e0503)" }}>
        <div className="mx-auto max-w-[780px] px-6">
          <p style={{ color: red, fontSize: "0.6rem", letterSpacing: "0.45em", fontWeight: 700, textAlign: "center", marginBottom: "14px" }}>WARNING</p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", textAlign: "center", marginBottom: "36px", color: textMain, letterSpacing: "0.04em" }}>
            このまま「なんとなく」を続けると…
          </h2>

          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "36px" }}>
            {[
              { year: "1年後", text: "また同じ失敗を繰り返し、「やっぱり自分はダメだ」という思い込みが強化される。" },
              { year: "3年後", text: "気づけば選択肢が狭まり、「もうこの歳では遅い」と諦めの言葉が口癖になっている。" },
              { year: "5年後", text: "人生を振り返ったとき「ただ流されてきただけだった」という後悔だけが残る。" },
            ].map((item) => (
              <div key={item.year} style={{ padding: "24px 20px", background: "rgba(80,10,15,0.3)", border: "1px solid rgba(139,30,39,0.3)", borderRadius: "14px" }}>
                <p style={{ color: red, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.25em", marginBottom: "10px" }}>{item.year}</p>
                <p style={{ color: "rgba(220,180,168,0.85)", fontSize: "0.85rem", lineHeight: 1.8 }}>{item.text}</p>
              </div>
            ))}
          </div>

          <div style={{ padding: "28px", background: goldFaint, border: `1px solid ${goldBorder}`, borderRadius: "14px", textAlign: "center" }}>
            <p style={{ color: textMain, fontSize: "1rem", lineHeight: 1.85, fontWeight: 500 }}>
              でも、<strong style={{ color: gold }}>今からでも遅くありません。</strong><br />
              自分の宿命を知ることで、<br />
              進むべき道が、驚くほど明確になります。
            </p>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          SECTION 4 & 5: 解決策・サービス紹介
      ────────────────────────────────────────── */}
      <section style={{ padding: "88px 0", background: "#060402" }}>
        <div className="mx-auto max-w-[780px] px-6">
          <p style={{ color: gold, fontSize: "0.6rem", letterSpacing: "0.45em", fontWeight: 700, textAlign: "center", marginBottom: "14px" }}>SOLUTION</p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", textAlign: "center", marginBottom: "12px", color: textMain, letterSpacing: "0.04em" }}>
            AIが、あなたの宿命を<br />「容赦なく」読み解く
          </h2>
          <p style={{ color: textSub, fontSize: "0.88rem", textAlign: "center", lineHeight: 1.8, marginBottom: "48px" }}>
            忖度ゼロ。愛情あり。今まで誰も言ってくれなかった<br />
            あなたの本質を、7つの角度から鑑定します。
          </p>

          {/* 7セクション */}
          <div style={{ background: cardBg, border: `1px solid ${goldBorder}`, borderRadius: "20px", overflow: "hidden", marginBottom: "40px" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${goldBorder}`, background: "rgba(201,155,77,0.07)" }}>
              <p style={{ color: gold, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.3em" }}>鑑定の7セクション</p>
            </div>
            {[
              { no: "01", title: "宿命・本質", desc: "あなたが生まれ持ってきた使命と、魂の方向性" },
              { no: "02", title: "性格の怖いほど当たる特徴", desc: "強み・弱み・無意識の癖を容赦なく言語化" },
              { no: "03", title: "恋愛・結婚", desc: "縁のある相手のタイプ、結婚の時期、注意すべき関係性" },
              { no: "04", title: "仕事・お金", desc: "向いている職種、金運の周期、稼げる時期・落とし穴" },
              { no: "05", title: "今後3〜5年の運気", desc: "具体的な上昇期・停滞期と、それぞれの対処法" },
              { no: "06", title: "人生で気をつけること", desc: "運気を落とす行動パターンと回避策" },
              { no: "07", title: "最後にズバッと総評", desc: "「あなたはこう生きるべきだ」という断言" },
            ].map((s, i) => (
              <div key={s.no} style={{
                display: "flex", alignItems: "flex-start", gap: "16px",
                padding: "16px 24px",
                borderBottom: i < 6 ? `1px solid rgba(201,155,77,0.1)` : "none",
              }}>
                <span style={{
                  flexShrink: 0, fontFamily: "serif", fontSize: "0.75rem",
                  color: gold, fontWeight: 700, letterSpacing: "0.05em",
                  paddingTop: "2px",
                }}>{s.no}</span>
                <div>
                  <p style={{ color: textMain, fontSize: "0.9rem", fontWeight: 600, marginBottom: "3px" }}>{s.title}</p>
                  <p style={{ color: textMute, fontSize: "0.78rem", lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 4つの特徴 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {FEATURES.map((f) => (
              <div key={f.num} style={{ display: "flex", gap: "20px", padding: "24px", background: cardBg, border: `1px solid ${goldBorder}`, borderRadius: "16px", alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, fontFamily: "serif", fontSize: "1.5rem", fontWeight: 900, color: "rgba(201,155,77,0.2)", lineHeight: 1 }}>{f.num}</span>
                <div>
                  <h3 style={{ color: textMain, fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px", lineHeight: 1.4 }}>{f.title}</h3>
                  <p style={{ color: textSub, fontSize: "0.84rem", lineHeight: 1.85 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          SECTION 6: なぜAIなのか
      ────────────────────────────────────────── */}
      <section style={{ padding: "88px 0", background: "linear-gradient(180deg, #080604, #0a0503)" }}>
        <div className="mx-auto max-w-[780px] px-6">
          <p style={{ color: gold, fontSize: "0.6rem", letterSpacing: "0.45em", fontWeight: 700, textAlign: "center", marginBottom: "14px" }}>WHY AI</p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.4rem, 3.5vw, 1.9rem)", textAlign: "center", marginBottom: "40px", color: textMain, lineHeight: 1.4 }}>
            人間の占い師より、<br />AIの方が「本音」を言える理由
          </h2>

          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr", marginBottom: "32px" }}>
            <div style={{ padding: "20px", background: "rgba(30,17,8,0.6)", border: "1px solid rgba(100,50,40,0.4)", borderRadius: "14px" }}>
              <p style={{ color: "rgba(200,160,140,0.6)", fontSize: "0.65rem", letterSpacing: "0.3em", marginBottom: "10px" }}>人間の占い師</p>
              {["悪いことは言いにくい", "リピーターへの配慮がある", "占い師ごとに精度にバラつき", "料金が高い（1回3万〜10万円）"].map((t) => (
                <p key={t} style={{ color: "rgba(200,160,140,0.65)", fontSize: "0.8rem", lineHeight: 1.7, paddingLeft: "14px", position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: "rgba(139,30,39,0.8)" }}>✕</span>{t}
                </p>
              ))}
            </div>
            <div style={{ padding: "20px", background: goldFaint, border: `1px solid ${goldBorder}`, borderRadius: "14px" }}>
              <p style={{ color: gold, fontSize: "0.65rem", letterSpacing: "0.3em", marginBottom: "10px" }}>AI運命鑑定</p>
              {["忖度なし・本音で言い切る", "全員に同じ真剣さで向き合う", "四柱推命・六星占術を統合", "完全無料・今すぐ試せる"].map((t) => (
                <p key={t} style={{ color: "rgba(220,202,168,0.85)", fontSize: "0.8rem", lineHeight: 1.7, paddingLeft: "14px", position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: "#6aab8a" }}>✓</span>{t}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          SECTION 7: 体験者の声
      ────────────────────────────────────────── */}
      <section style={{ padding: "88px 0", background: "#060402" }}>
        <div className="mx-auto max-w-[780px] px-6">
          <p style={{ color: gold, fontSize: "0.6rem", letterSpacing: "0.45em", fontWeight: 700, textAlign: "center", marginBottom: "14px" }}>VOICE</p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.4rem, 3.5vw, 1.9rem)", textAlign: "center", marginBottom: "40px", color: textMain }}>
            体験された方の声
          </h2>

          <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {RESULTS.map((r) => (
              <div key={r.name} style={{ padding: "22px", background: cardBg, border: `1px solid ${goldBorder}`, borderRadius: "14px" }}>
                <p style={{ color: textSub, fontSize: "0.86rem", lineHeight: 1.85, marginBottom: "14px" }}>「{r.text}」</p>
                <p style={{ color: textMute, fontSize: "0.72rem" }}>{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          SECTION 8: 鑑定フォーム（メイン）
      ────────────────────────────────────────── */}
      <section style={{ padding: "88px 0", background: "linear-gradient(180deg, #0a0503, #060402)" }} ref={formRef} id="kandou">
        <div className="mx-auto max-w-[600px] px-6">
          <p style={{ color: gold, fontSize: "0.6rem", letterSpacing: "0.45em", fontWeight: 700, textAlign: "center", marginBottom: "14px" }}>FREE READING</p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", textAlign: "center", marginBottom: "10px", color: textMain }}>
            今すぐ、無料で鑑定を受ける
          </h2>
          <p style={{ color: textSub, fontSize: "0.84rem", textAlign: "center", lineHeight: 1.8, marginBottom: "32px" }}>
            登録不要・クレジットカード不要<br />
            生年月日と性別だけで鑑定が始まります
          </p>
          <KandouForm />
        </div>
      </section>

      {/* ──────────────────────────────────────────
          SECTION 9: FAQ
      ────────────────────────────────────────── */}
      <section style={{ padding: "88px 0", background: "#060402" }}>
        <div className="mx-auto max-w-[720px] px-6">
          <p style={{ color: gold, fontSize: "0.6rem", letterSpacing: "0.45em", fontWeight: 700, textAlign: "center", marginBottom: "14px" }}>FAQ</p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.4rem, 3.5vw, 1.8rem)", textAlign: "center", marginBottom: "40px", color: textMain }}>
            よくある質問
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {FAQS.map((faq) => (
              <details key={faq.q} style={{ background: cardBg, border: `1px solid ${goldBorder}`, borderRadius: "12px", overflow: "hidden" }}>
                <summary style={{
                  padding: "18px 20px", cursor: "pointer",
                  color: textMain, fontSize: "0.9rem", fontWeight: 600,
                  listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span>Q. {faq.q}</span>
                  <span style={{ color: gold, fontSize: "1.1rem", flexShrink: 0, marginLeft: "12px" }}>＋</span>
                </summary>
                <div style={{ padding: "0 20px 18px", borderTop: `1px solid rgba(201,155,77,0.12)` }}>
                  <p style={{ color: textSub, fontSize: "0.85rem", lineHeight: 1.85, paddingTop: "14px" }}>A. {faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          SECTION 10: 最終CTA
      ────────────────────────────────────────── */}
      <section style={{ padding: "88px 0 100px", background: "linear-gradient(180deg, #080604, #050302)", borderTop: "1px solid rgba(201,155,77,0.2)" }}>
        <div className="mx-auto max-w-[600px] px-6 text-center">
          <div style={{ marginBottom: "24px", display: "inline-block", padding: "6px 20px", background: "rgba(139,30,39,0.15)", border: "1px solid rgba(139,30,39,0.35)", borderRadius: "20px" }}>
            <p style={{ color: "#d97070", fontSize: "0.72rem", letterSpacing: "0.25em", fontWeight: 700 }}>完全無料・登録不要</p>
          </div>

          <h2 className="font-serif" style={{ fontSize: "clamp(1.5rem, 4vw, 2.1rem)", marginBottom: "16px", color: textMain, lineHeight: 1.35 }}>
            あなたの「本当の人生」を<br />
            今日から始めませんか。
          </h2>

          <p style={{ color: textSub, fontSize: "0.88rem", lineHeight: 1.9, marginBottom: "36px" }}>
            自分の宿命を知ることで、<br />
            迷いがなくなり、行動が変わり、<br />
            人生が動き始めます。
          </p>

          <button onClick={scrollToForm} style={{
            width: "100%", maxWidth: "400px",
            padding: "20px", marginBottom: "12px",
            background: "linear-gradient(135deg, #8B1E27, #C94040)",
            border: "none", borderRadius: "14px",
            color: textMain, fontSize: "1.05rem", fontWeight: 700,
            letterSpacing: "0.1em", cursor: "pointer",
            boxShadow: "0 10px 40px rgba(139,30,39,0.5)",
          }}>
            今すぐ運命鑑定を受ける（無料）
          </button>

          <p style={{ color: textMute, fontSize: "0.72rem", marginBottom: "40px" }}>
            生年月日を入力するだけ・約60秒で鑑定開始
          </p>

          {/* 追伸 */}
          <div style={{ padding: "24px", background: goldFaint, border: `1px solid ${goldBorder}`, borderRadius: "14px", textAlign: "left" }}>
            <p style={{ color: gold, fontSize: "0.65rem", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "10px" }}>P.S.</p>
            <p style={{ color: textSub, fontSize: "0.84rem", lineHeight: 1.9 }}>
              「また今度やろう」と思って、結局やらない。<br />
              その繰り返しが、今の閉塞感を生んでいます。<br /><br />
              鑑定は無料。時間は2分。<br />
              <strong style={{ color: textMain }}>「自分を知る」最初の一歩を、今日踏み出してください。</strong>
            </p>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer style={{ paddingTop: "24px", paddingBottom: "40px", textAlign: "center", borderTop: "1px solid rgba(201,155,77,0.15)" }}>
        <Link href="/diagnose" style={{ color: textMute, fontSize: "0.75rem", textDecoration: "none" }}>
          ← 診断トップに戻る
        </Link>
      </footer>
    </div>
  );
}
