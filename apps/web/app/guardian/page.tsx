"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

// ── Color system ──────────────────────────────────────────────
const C = {
  dark:        "#06080f",
  dark2:       "#090e1c",
  gold:        "#C99B4D",
  goldFaint:   "rgba(201,155,77,0.07)",
  goldBorder:  "rgba(201,155,77,0.18)",
  goldGlow:    "rgba(201,155,77,0.1)",
  green:       "#6aab8a",
  greenFaint:  "rgba(106,171,138,0.07)",
  greenBorder: "rgba(106,171,138,0.2)",
  cream:       "#f5efe2",
  creamDim:    "rgba(245,239,226,0.62)",
  creamMute:   "rgba(245,239,226,0.28)",
  line:        "#06C755",
  card:        "linear-gradient(145deg, rgba(14,20,32,0.85), rgba(8,12,24,0.95))",
} as const;

// ── Data ──────────────────────────────────────────────────────
const WORRIES = [
  "毎年欠かさず初詣に行くのに、なんとなく気持ちが晴れないまま年を越している",
  "神社は好きで定期的に参拝しているのに、「何かが足りない」という感覚が抜けない",
  "有名なパワースポットを巡っているのに、生活の流れが変わらないと感じている",
  "転職・結婚・引越しなど大切な決断の前に、どこへ手を合わせればいいかわからなかった",
  "みんなと同じ有名な神社か、近所の神社か。参拝先を選ぶ基準がない",
  "神社で手を合わせるとき、自分が誰に何を届けているのか、よくわからないことがある",
  "「なんとなく気になる神社」と「本当に自分に合う神社」の違いを知らないまま、何年も過ぎた",
];

const SHRINES = [
  {
    name: "産土神社", reading: "うぶすなじんじゃ", accent: C.green,
    desc: "あなたが生まれた土地の神様。生まれた瞬間から死後まで、あなたの魂を見守り続けるとされる最も根源的な守護神社です。",
  },
  {
    name: "氏神神社", reading: "うじがみじんじゃ", accent: C.gold,
    desc: "あなたの家系・血筋を代々守ってきた神様。先祖から受け継いだ縁のある神社で、家族全体の守護と深く関わります。",
  },
  {
    name: "鎮守神社", reading: "ちんじゅじんじゃ", accent: "#7090c0",
    desc: "今あなたが暮らす土地の神様。現在の生活・仕事・人間関係を護る神社です。引越しのたびに変わることもあります。",
  },
];

const ELEMENTS = [
  { kanji: "木", color: "#6aab6a", desc: "成長・向上・行動力" },
  { kanji: "火", color: "#c07060", desc: "情熱・直感・名誉" },
  { kanji: "土", color: "#C99B4D", desc: "安定・育成・誠実" },
  { kanji: "金", color: "#a8b8d0", desc: "正義・収穫・決断" },
  { kanji: "水", color: "#6aabcc", desc: "柔軟・知恵・流れ" },
];

const DIAGNOSIS_ITEMS = [
  { no: "01", title: "あなたの五行属性", desc: "木・火・土・金・水の属性と気質・性格傾向の詳細解説" },
  { no: "02", title: "守護神社 3社の特定", desc: "全国データベースから縁の深さ順に3社を特定。ご祭神・由緒・ご利益を詳しく解説" },
  { no: "03", title: "ライフパスナンバー解説", desc: "生年月日から導く数秘術の数字による本質的な気質と人生テーマの解説" },
  { no: "04", title: "今の悩みに対応するご利益", desc: "縁結び・仕事・家内安全・健康など、現在のあなたに対応するご祭神のいる神社を提案" },
  { no: "05", title: "参拝の作法と心得", desc: "拝礼の順序・参拝に最適な時間帯・方角など、知って行く参拝のための基礎知識" },
];

const FEATURES = [
  { title: "全国31,247社のデータベースから特定", desc: "地方在住でも自宅から通える守護神社が見つかります。有名・無名を問わず縁の深さで選定します。" },
  { title: "陰陽五行 × 数秘術の複合診断", desc: "「なんとなく合いそう」ではなく、数千年の歴史を持つ思想体系に基づいた根拠のある縁を知ることができます。" },
  { title: "今の悩みに対応した神社を提案", desc: "縁結び・仕事・家内安全・健康など、現在のあなたに必要なご利益と対応するご祭神の神社を整理します。" },
  { title: "生年月日のみ、個人情報不要", desc: "名前・住所・メールアドレスは一切不要。プライバシーを守りながら今すぐ診断を受けられます。" },
];

const VOICES = [
  {
    name: "K.Mさん（44歳・東京都・会社員）",
    before: "参拝するとき、いつも「これでよかったのかな」という薄い後ろめたさがありました",
    after: "診断を受けて初めて「ここが自分の神社なんだ」という感覚で手を合わせることができました。何が変わったというより、自分の中の何かが腑に落ちた感じです。",
  },
  {
    name: "T.Yさん（38歳・大阪府・フリーランス）",
    before: "転職を決断する直前、どこに参拝しようか迷っていました",
    after: "診断で出た神社が職場の近くにあることを知り、初めてそこに行きました。祈るというより「報告しに来た」という感覚になって、不思議と覚悟が固まりました。",
  },
  {
    name: "N.Aさん（52歳・愛知県・主婦）",
    before: "産土神という言葉すら知りませんでした",
    after: "生まれた土地の神様が今も自分を見守っていると知って、久しぶりに帰省したとき地元の神社に立ち寄れたのが、なぜかとても嬉しかったです。",
  },
  {
    name: "O.Rさん（47歳・神奈川県・教員）",
    before: "スピリチュアルなものは少し苦手で、半信半疑で試しました",
    after: "五行属性の解説が「水の気」と出て、自分の性格や仕事の向き不向きとすごく重なっていて驚きました。占いというより、自己理解のツールとして面白かったです。",
  },
];

const FAQS = [
  {
    q: "宗教への勧誘はありませんか？",
    a: "ありません。このサービスは特定の宗教・宗派・宗教法人とは無関係に運営されています。神社情報の普及と日本文化の継承を目的としたプラットフォームです。有料商材のセールスも行いません。",
  },
  {
    q: "診断結果は科学的な根拠があるものですか？",
    a: "陰陽五行思想と産土信仰は、中国・日本で数千年にわたって継承されてきた思想体系です。現代科学とは異なりますが、日本の歴史・文化・医学・建築に深く根付いた知恵に基づいています。絶対的な保証はせず、参拝先選びのヒントとしてご活用ください。",
  },
  {
    q: "近所の神社でも守護神社になりますか？",
    a: "はい。日常的に参拝できる氏神様・鎮守様との縁はとても大切にされています。遠くの有名神社より、日々手を合わせられる近くの神社の方がご縁が深い場合も多くあります。",
  },
  {
    q: "LINEへの登録は必須ですか？",
    a: "守護神社診断自体はLINE登録なしで無料でご利用いただけます。診断後にLINEにご登録いただくと、月ごとの開運情報・吉方位・縁深い神社の最新情報をお届けしています。登録は任意です。",
  },
  {
    q: "血液型がわからなくても診断できますか？",
    a: "はい。生年月日のみで診断を完了できます。出生時刻・出生地・血液型などの追加情報は不要です。",
  },
  {
    q: "個人情報は収集されますか？",
    a: "入力いただく情報は生年月日と悩みカテゴリのみです。氏名・住所・メールアドレスなどの個人情報は診断には一切必要ありません。",
  },
  {
    q: "診断は何度でも使えますか？",
    a: "はい、無料で何度でもご利用いただけます。家族や友人の守護神社を調べることも可能です。",
  },
];

// ── IntersectionObserver hook ─────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── Sub-components ────────────────────────────────────────────

function FadeUp({ children, delay = 0, style: extraStyle = {} }: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      ...extraStyle,
    }}>
      {children}
    </div>
  );
}

function SectionTag({ text, color = C.gold }: { text: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
      <span style={{
        fontFamily: "'Cormorant Garamond', 'IM Fell English', Georgia, serif",
        fontSize: "0.6rem",
        letterSpacing: "0.52em",
        color,
        borderBottom: `1px solid ${color}35`,
        paddingBottom: "4px",
        textTransform: "uppercase" as const,
      }}>{text}</span>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 40px", maxWidth: "260px", margin: "0 auto" }}>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, transparent, ${C.goldBorder})` }} />
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ margin: "0 10px", flexShrink: 0 }}>
        <circle cx="9" cy="9" r="2.5" stroke={C.gold} strokeWidth="1" opacity="0.35" />
        <line x1="9" y1="1" x2="9" y2="5" stroke={C.gold} strokeWidth="1" opacity="0.3" />
        <line x1="9" y1="13" x2="9" y2="17" stroke={C.gold} strokeWidth="1" opacity="0.3" />
        <line x1="1" y1="9" x2="5" y2="9" stroke={C.gold} strokeWidth="1" opacity="0.3" />
        <line x1="13" y1="9" x2="17" y2="9" stroke={C.gold} strokeWidth="1" opacity="0.3" />
      </svg>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(to left, transparent, ${C.goldBorder})` }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function GuardianLP() {
  const formRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    // Load fonts
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Noto+Serif+JP:wght@400;600;700&display=swap";
    document.head.appendChild(link);

    // Inject keyframes & utility classes
    const style = document.createElement("style");
    style.setAttribute("data-guardian", "1");
    style.textContent = `
      @keyframes guardian-breathe {
        0%, 100% { opacity: 0.03; transform: scale(1); }
        50%       { opacity: 0.055; transform: scale(1.015); }
      }
      @keyframes guardian-glow-pulse {
        0%, 100% { opacity: 0.07; }
        50%       { opacity: 0.14; }
      }
      @keyframes guardian-float {
        0%, 100% { transform: translateX(-50%) translateY(0); }
        50%       { transform: translateX(-50%) translateY(-6px); }
      }
      .guardian-btn:active { transform: scale(0.98); }
      .guardian-faq-body {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease;
        opacity: 0;
      }
      .guardian-faq-body.open {
        max-height: 320px;
        opacity: 1;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      const s = document.querySelector("style[data-guardian]");
      if (s) document.head.removeChild(s);
    };
  }, []);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const serif = "'Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', serif";
  const display = "'Cormorant Garamond', Georgia, serif";

  return (
    <div style={{ background: C.dark, color: C.cream, minHeight: "100vh", fontFamily: serif, WebkitFontSmoothing: "antialiased" }}>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "88px 24px 80px",
        overflow: "hidden",
        background: [
          "linear-gradient(185deg, rgba(6,8,15,0.97) 0%, rgba(6,8,15,0.78) 55%, rgba(6,8,15,0.96) 100%)",
          "url('/images/guardian-hero.webp') 65% center / cover",
        ].join(", "),
      }}>
        {/* Ambient gold glow */}
        <div style={{
          position: "absolute", top: "28%", left: "8%",
          width: "380px", height: "380px", borderRadius: "50%",
          background: `radial-gradient(ellipse, ${C.goldGlow} 0%, transparent 68%)`,
          pointerEvents: "none",
          animation: "guardian-glow-pulse 7s ease-in-out infinite",
        }} />

        {/* Watermark kanji — 縁 */}
        <div style={{
          position: "absolute", top: "50%", right: "-30px",
          transform: "translateY(-50%)",
          fontSize: "clamp(220px, 58vw, 400px)",
          color: C.gold, opacity: 0.04,
          fontFamily: serif, fontWeight: 700, lineHeight: 1,
          pointerEvents: "none", userSelect: "none",
          animation: "guardian-breathe 9s ease-in-out infinite",
        }}>縁</div>

        {/* Content */}
        <div style={{ position: "relative", maxWidth: "460px", margin: "0 auto", width: "100%" }}>

          {/* Badge */}
          <FadeUp delay={0.1}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "5px 14px 5px 10px",
              background: C.goldFaint,
              border: `1px solid ${C.goldBorder}`,
              borderRadius: "30px",
              marginBottom: "28px",
            }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: C.gold, opacity: 0.8 }} />
              <span style={{ fontFamily: display, fontSize: "0.6rem", letterSpacing: "0.42em", color: C.gold, fontWeight: 600 }}>
                守護神社診断 — 完全無料
              </span>
            </div>
          </FadeUp>

          {/* H1 */}
          <FadeUp delay={0.22}>
            <h1 style={{
              fontSize: "clamp(2rem, 7.5vw, 3rem)",
              lineHeight: 1.45,
              letterSpacing: "0.04em",
              marginBottom: "22px",
              fontWeight: 700,
              color: C.cream,
            }}>
              あなたが今まで<br />
              参拝してきた神社は、<br />
              本当に「あなたの神社」<br />
              でしたか。
            </h1>
          </FadeUp>

          {/* Sub */}
          <FadeUp delay={0.34}>
            <p style={{ fontSize: "0.87rem", lineHeight: 2.05, color: C.creamDim, marginBottom: "32px" }}>
              産土神・氏神・鎮守神。<br />
              日本古来の三つの守護を生年月日から導き出す無料診断。<br />
              全国31,247社から、あなたと縁の深い神社を特定します。
            </p>
          </FadeUp>

          {/* Stats pills */}
          <FadeUp delay={0.44}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "32px", flexWrap: "wrap" }}>
              {[["31,247", "収録神社"], ["87,341", "累計診断"], ["全47都道府県", "対応"]]
                .map(([num, label]) => (
                  <div key={label} style={{
                    padding: "8px 12px",
                    background: "rgba(6,8,15,0.65)",
                    border: `1px solid ${C.goldBorder}`,
                    borderRadius: "8px",
                    backdropFilter: "blur(6px)",
                  }}>
                    <p style={{ fontFamily: display, fontSize: "0.88rem", fontWeight: 700, color: C.gold, lineHeight: 1.2 }}>{num}</p>
                    <p style={{ fontSize: "0.58rem", color: C.creamMute, marginTop: "2px", letterSpacing: "0.06em" }}>{label}</p>
                  </div>
                ))}
            </div>
          </FadeUp>

          {/* CTA */}
          <FadeUp delay={0.52}>
            <button
              onClick={scrollToForm}
              className="guardian-btn"
              style={{
                display: "block", width: "100%",
                padding: "18px 20px",
                background: "linear-gradient(135deg, #173325, #1f4a33, #173325)",
                border: `1px solid ${C.greenBorder}`,
                borderRadius: "12px",
                color: C.cream,
                fontSize: "0.93rem", fontWeight: 700, letterSpacing: "0.12em",
                cursor: "pointer",
                boxShadow: "0 4px 28px rgba(0,0,0,0.5)",
                fontFamily: serif,
                marginBottom: "10px",
                transition: "transform 0.15s ease",
              }}
            >
              今すぐ無料で守護神社を調べる
            </button>
            <p style={{ fontSize: "0.67rem", color: C.creamMute, textAlign: "center" }}>
              所要時間 約2分 ／ 登録不要 ／ 全国31,247社対応
            </p>
          </FadeUp>
        </div>

        {/* Bottom fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "100px",
          background: `linear-gradient(to top, ${C.dark}, transparent)`,
          pointerEvents: "none",
        }} />

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: "28px", left: "50%",
          animation: "guardian-float 3.5s ease-in-out infinite",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
        }}>
          <div style={{ width: "1px", height: "36px", background: `linear-gradient(to bottom, transparent, ${C.goldBorder})` }} />
          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: C.gold, opacity: 0.4 }} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — 共感
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "88px 24px", background: C.dark }}>
        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          <FadeUp>
            <SectionTag text="Does This Sound Familiar" />
            <h2 style={{ fontSize: "clamp(1.4rem, 5.5vw, 1.9rem)", textAlign: "center", marginBottom: "12px", lineHeight: 1.55, fontWeight: 700 }}>
              こんなことを感じたことは<br />ありませんか
            </h2>
            <p style={{ color: C.creamDim, fontSize: "0.84rem", textAlign: "center", lineHeight: 1.9, marginBottom: "36px" }}>
              一つでも思い当たることがあるなら、<br />この先を読み進めてください。
            </p>
          </FadeUp>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {WORRIES.map((w, i) => (
              <FadeUp key={i} delay={i * 0.05}>
                <div style={{
                  display: "flex", gap: "14px", alignItems: "flex-start",
                  padding: "15px 18px",
                  background: C.card,
                  border: `1px solid ${C.goldBorder}`,
                  borderLeft: `3px solid rgba(201,155,77,0.25)`,
                  borderRadius: "10px",
                }}>
                  <span style={{
                    flexShrink: 0, fontFamily: display,
                    fontSize: "0.7rem", color: C.gold,
                    fontWeight: 700, opacity: 0.65,
                    paddingTop: "2px", minWidth: "18px",
                  }}>{String(i + 1).padStart(2, "0")}</span>
                  <p style={{ color: C.creamDim, fontSize: "0.85rem", lineHeight: 1.85 }}>{w}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp>
            <div style={{
              marginTop: "28px", padding: "22px 20px",
              background: "rgba(100,30,30,0.09)",
              border: "1px solid rgba(160,80,60,0.18)",
              borderRadius: "12px", textAlign: "center",
            }}>
              <p style={{ color: "rgba(235,210,200,0.85)", fontSize: "0.9rem", lineHeight: 1.95 }}>
                これらの悩みに共通していることがあります。<br />
                <strong style={{ color: C.cream }}>
                  自分と縁の深い神社を「知らないまま」<br />参拝し続けているということです。
                </strong>
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — WHY IT MATTERS
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "88px 24px", background: `linear-gradient(180deg, ${C.dark}, ${C.dark2})` }}>
        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          <FadeUp>
            <SectionTag text="Why It Matters" />
            <h2 style={{ fontSize: "clamp(1.4rem, 5.5vw, 1.9rem)", textAlign: "center", marginBottom: "14px", lineHeight: 1.55, fontWeight: 700 }}>
              なぜ、守護神社を知ることが<br />大切なのか
            </h2>
            <p style={{ color: C.creamDim, fontSize: "0.85rem", lineHeight: 1.95, textAlign: "center", marginBottom: "32px" }}>
              日本古来の神道において、<br />人と神社の縁は「偶然」ではありません。<br />
              あなたには、生まれながらに三つの守護神社が存在します。
            </p>
          </FadeUp>

          {/* Three shrine types */}
          <div style={{ display: "flex", flexDirection: "column", gap: "11px", marginBottom: "32px" }}>
            {SHRINES.map((shrine, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div style={{
                  padding: "20px 18px",
                  background: C.card,
                  border: `1px solid ${C.goldBorder}`,
                  borderLeft: `3px solid ${shrine.accent}`,
                  borderRadius: "12px",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", right: "12px", top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "3.2rem", color: shrine.accent,
                    opacity: 0.055, fontFamily: serif, fontWeight: 700,
                    lineHeight: 1, pointerEvents: "none",
                  }}>{shrine.name.charAt(0)}</div>
                  <p style={{ fontFamily: display, fontSize: "0.58rem", letterSpacing: "0.28em", color: shrine.accent, marginBottom: "5px", opacity: 0.8 }}>
                    {shrine.reading}
                  </p>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.cream, marginBottom: "9px" }}>{shrine.name}</h3>
                  <p style={{ color: C.creamDim, fontSize: "0.81rem", lineHeight: 1.88 }}>{shrine.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Five elements */}
          <FadeUp>
            <div style={{ padding: "24px 18px", background: C.card, border: `1px solid ${C.goldBorder}`, borderRadius: "14px", marginBottom: "24px" }}>
              <p style={{ fontFamily: display, fontSize: "0.58rem", letterSpacing: "0.4em", color: C.gold, fontWeight: 600, marginBottom: "12px", textAlign: "center" }}>
                陰陽五行思想とは
              </p>
              <p style={{ color: C.creamDim, fontSize: "0.81rem", lineHeight: 1.9, marginBottom: "16px" }}>
                中国に起源を持ち、日本の神道・暦・医学・建築に深く取り入れられてきた思想体系です。万物を五つのエネルギーに分類し、その相互作用で宇宙と人間の関係を読み解きます。
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                {ELEMENTS.map((el) => (
                  <div key={el.kanji} style={{
                    padding: "10px 4px", textAlign: "center",
                    background: `${el.color}12`,
                    border: `1px solid ${el.color}28`,
                    borderRadius: "8px",
                  }}>
                    <p style={{ fontSize: "1.3rem", fontFamily: serif, color: el.color, fontWeight: 700, lineHeight: 1 }}>{el.kanji}</p>
                    <p style={{ fontSize: "0.55rem", color: C.creamMute, marginTop: "4px", lineHeight: 1.5 }}>{el.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Analogy */}
          <FadeUp>
            <div style={{ padding: "22px 18px", background: "rgba(8,5,2,0.7)", border: `1px solid ${C.goldBorder}`, borderRadius: "12px", textAlign: "center" }}>
              <p style={{ color: C.creamDim, fontSize: "0.88rem", lineHeight: 2.05 }}>
                有名だから、話題だから、友人に勧められたから。<br />
                そういった理由で参拝先を選ぶことは、<br />
                <strong style={{ color: C.cream }}>
                  他の人の処方箋で書かれた薬を、<br />
                  自分の診断なしに飲み続けること
                </strong><br />
                に似ているかもしれません。
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — SOLUTION
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "88px 24px", background: C.dark }}>
        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          <FadeUp>
            <SectionTag text="Solution" />
            <h2 style={{ fontSize: "clamp(1.4rem, 5.5vw, 1.9rem)", textAlign: "center", marginBottom: "12px", lineHeight: 1.55, fontWeight: 700 }}>
              守護神社診断が、<br />
              本来の「帰る場所」を教えます
            </h2>
            <p style={{ color: C.creamDim, fontSize: "0.84rem", textAlign: "center", lineHeight: 1.9, marginBottom: "36px" }}>
              生年月日を入力するだけで、陰陽五行思想と産土信仰に基づいた体系的な分析により、縁の深い神社を全国31,247社のデータベースから特定します。
            </p>
          </FadeUp>

          {/* Diagnosis items */}
          <FadeUp>
            <div style={{ border: `1px solid ${C.goldBorder}`, borderRadius: "14px", overflow: "hidden", background: C.card, marginBottom: "24px" }}>
              <div style={{ padding: "13px 20px", background: C.goldFaint, borderBottom: `1px solid ${C.goldBorder}` }}>
                <p style={{ fontFamily: display, fontSize: "0.58rem", letterSpacing: "0.38em", color: C.gold, fontWeight: 600 }}>診断でわかること</p>
              </div>
              {DIAGNOSIS_ITEMS.map((item, i) => (
                <div key={item.no} style={{
                  display: "flex", gap: "14px", padding: "15px 20px",
                  borderBottom: i < DIAGNOSIS_ITEMS.length - 1 ? "1px solid rgba(201,155,77,0.07)" : "none",
                  alignItems: "flex-start",
                }}>
                  <span style={{ fontFamily: display, fontSize: "0.68rem", color: C.gold, fontWeight: 700, opacity: 0.75, flexShrink: 0, paddingTop: "2px", minWidth: "18px" }}>
                    {item.no}
                  </span>
                  <div>
                    <p style={{ color: C.cream, fontSize: "0.87rem", fontWeight: 600, marginBottom: "3px" }}>{item.title}</p>
                    <p style={{ color: C.creamMute, fontSize: "0.75rem", lineHeight: 1.7 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>

          {/* Feature cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            {FEATURES.map((f, i) => (
              <FadeUp key={i} delay={i * 0.06}>
                <div style={{
                  display: "flex", gap: "14px", padding: "16px 18px",
                  background: C.card, border: `1px solid ${C.goldBorder}`,
                  borderRadius: "10px", alignItems: "flex-start",
                }}>
                  <div style={{
                    flexShrink: 0, width: "26px", height: "26px", borderRadius: "50%",
                    background: C.goldFaint, border: `1px solid ${C.goldBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: display, fontSize: "0.6rem", color: C.gold, fontWeight: 700,
                  }}>{String(i + 1).padStart(2, "0")}</div>
                  <div>
                    <h3 style={{ color: C.cream, fontSize: "0.87rem", fontWeight: 700, marginBottom: "5px" }}>{f.title}</h3>
                    <p style={{ color: C.creamDim, fontSize: "0.79rem", lineHeight: 1.85 }}>{f.desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 — 実績
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "88px 24px", background: `linear-gradient(180deg, ${C.dark}, ${C.dark2})`, position: "relative", overflow: "hidden" }}>
        {/* Editorial number backdrop */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: display, fontSize: "clamp(130px, 38vw, 240px)",
          color: C.gold, opacity: 0.022, fontWeight: 700, lineHeight: 1,
          pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap",
        }}>87,341</div>

        <div style={{ maxWidth: "520px", margin: "0 auto", position: "relative" }}>
          <FadeUp>
            <SectionTag text="Track Record" />
            <h2 style={{ fontSize: "clamp(1.4rem, 5.5vw, 1.9rem)", textAlign: "center", marginBottom: "40px", lineHeight: 1.55, fontWeight: 700 }}>
              このサービスが支持される理由
            </h2>
          </FadeUp>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
            {[
              { num: "31,247", unit: "社", label: "収録神社数" },
              { num: "87,341", unit: "件", label: "累計診断件数" },
              { num: "47", unit: "都道府県", label: "全国対応" },
              { num: "2,847", unit: "件", label: "参拝レポート掲載" },
            ].map((s, i) => (
              <FadeUp key={s.label} delay={i * 0.07}>
                <div style={{ padding: "22px 14px", textAlign: "center", background: C.card, border: `1px solid ${C.goldBorder}`, borderRadius: "12px" }}>
                  <p style={{ fontFamily: display, fontSize: "1.75rem", fontWeight: 700, color: C.gold, lineHeight: 1.1 }}>
                    {s.num}<span style={{ fontSize: "0.72rem", marginLeft: "3px", fontWeight: 400 }}>{s.unit}</span>
                  </p>
                  <p style={{ color: C.creamMute, fontSize: "0.6rem", marginTop: "5px", letterSpacing: "0.07em" }}>{s.label}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp>
            <div style={{ padding: "18px 16px", background: C.greenFaint, border: `1px solid ${C.greenBorder}`, borderRadius: "12px", textAlign: "center" }}>
              <p style={{ color: C.green, fontSize: "0.58rem", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "7px" }}>運営について</p>
              <p style={{ color: C.creamDim, fontSize: "0.79rem", lineHeight: 1.88 }}>
                神社情報の普及と日本の精神文化の継承を目的として運営しています。特定の宗教法人への帰属はなく、特定の宗派・宗教団体への誘導は一切行いません。
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════
          SECTION 6 — 体験者の声（チャット形式）
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "88px 24px", background: C.dark }}>
        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          <FadeUp>
            <SectionTag text="Voices" />
            <h2 style={{ fontSize: "clamp(1.4rem, 5.5vw, 1.9rem)", textAlign: "center", marginBottom: "44px", lineHeight: 1.55, fontWeight: 700 }}>
              守護神社診断を使った方の声
            </h2>
          </FadeUp>

          {/* Chat bubble testimonials */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {VOICES.map((v, i) => (
              <FadeUp key={i} delay={i * 0.07}>
                <div>
                  <p style={{ color: C.creamMute, fontSize: "0.68rem", textAlign: "center", marginBottom: "12px", letterSpacing: "0.06em" }}>
                    {v.name}
                  </p>
                  {/* Before — received bubble (left) */}
                  <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "8px" }}>
                    <div style={{ maxWidth: "88%" }}>
                      <div style={{
                        padding: "12px 15px",
                        background: "rgba(255,255,255,0.044)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "4px 14px 14px 14px",
                      }}>
                        <p style={{ fontSize: "0.57rem", color: C.creamMute, marginBottom: "5px", letterSpacing: "0.1em" }}>診断前</p>
                        <p style={{ color: C.creamDim, fontSize: "0.82rem", lineHeight: 1.82, fontStyle: "italic" }}>「{v.before}」</p>
                      </div>
                    </div>
                  </div>
                  {/* After — sent bubble (right) */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ maxWidth: "90%" }}>
                      <div style={{
                        padding: "13px 15px",
                        background: "linear-gradient(135deg, rgba(25,52,38,0.7), rgba(18,40,28,0.85))",
                        border: `1px solid ${C.greenBorder}`,
                        borderRadius: "14px 4px 14px 14px",
                      }}>
                        <p style={{ fontSize: "0.57rem", color: C.green, marginBottom: "5px", letterSpacing: "0.1em", opacity: 0.8 }}>診断後</p>
                        <p style={{ color: C.creamDim, fontSize: "0.83rem", lineHeight: 1.88 }}>{v.after}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════
          SECTION 7 — CTA（診断へ）
      ══════════════════════════════════════════════════════ */}
      <section ref={formRef} id="diagnose" style={{ padding: "88px 24px", background: `linear-gradient(180deg, ${C.dark}, ${C.dark2})` }}>
        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          <FadeUp>
            <SectionTag text="Free Diagnosis" />
            <h2 style={{ fontSize: "clamp(1.5rem, 5.5vw, 2rem)", textAlign: "center", marginBottom: "10px", lineHeight: 1.5, fontWeight: 700 }}>
              今すぐ、守護神社を知る
            </h2>
            <p style={{ color: C.creamDim, fontSize: "0.84rem", textAlign: "center", lineHeight: 1.9, marginBottom: "32px" }}>
              登録不要・完全無料・生年月日のみで診断開始
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div style={{ background: C.card, border: `1px solid ${C.goldBorder}`, borderRadius: "16px", padding: "26px 20px" }}>
              {/* Step indicators */}
              <div style={{ display: "flex", marginBottom: "26px" }}>
                {[
                  { n: "01", label: "生年月日を入力" },
                  { n: "02", label: "悩みカテゴリを選択" },
                  { n: "03", label: "守護神社3社を確認" },
                ].map((step, i) => (
                  <div key={step.n} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                    {i < 2 && (
                      <div style={{
                        position: "absolute", top: "13px", right: 0, width: "50%", height: "1px",
                        background: `linear-gradient(to right, ${C.goldBorder}, transparent)`,
                      }} />
                    )}
                    <div style={{
                      width: "27px", height: "27px", borderRadius: "50%",
                      background: C.goldFaint, border: `1px solid ${C.goldBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: display, fontSize: "0.6rem", color: C.gold, fontWeight: 700,
                      margin: "0 auto 7px",
                    }}>{step.n}</div>
                    <p style={{ color: C.creamDim, fontSize: "0.68rem", lineHeight: 1.4 }}>{step.label}</p>
                  </div>
                ))}
              </div>

              <Link href="/diagnose" className="guardian-btn" style={{
                display: "block", width: "100%",
                padding: "18px 20px",
                background: "linear-gradient(135deg, #173325, #1f4a33)",
                border: `1px solid ${C.greenBorder}`,
                borderRadius: "12px",
                color: C.cream, fontSize: "0.93rem", fontWeight: 700,
                letterSpacing: "0.12em", textAlign: "center", textDecoration: "none",
                boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
                fontFamily: serif, marginBottom: "10px",
                transition: "transform 0.15s ease",
              }}>
                今すぐ無料で守護神社を調べる
              </Link>
              <p style={{ textAlign: "center", color: C.creamMute, fontSize: "0.66rem" }}>
                所要時間 約2分 ／ 登録不要 ／ 全国31,247社対応
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════
          SECTION 8 — FAQ
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "88px 24px", background: C.dark }}>
        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          <FadeUp>
            <SectionTag text="FAQ" />
            <h2 style={{ fontSize: "clamp(1.4rem, 5.5vw, 1.9rem)", textAlign: "center", marginBottom: "40px", lineHeight: 1.55, fontWeight: 700 }}>
              よくある質問
            </h2>
          </FadeUp>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {FAQS.map((faq, i) => (
              <FadeUp key={i} delay={i * 0.04}>
                <div style={{ background: C.card, border: `1px solid ${C.goldBorder}`, borderRadius: "12px", overflow: "hidden" }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: "100%", padding: "15px 18px",
                      background: "transparent", border: "none", cursor: "pointer",
                      color: C.cream, fontSize: "0.87rem", fontWeight: 600,
                      textAlign: "left", display: "flex", justifyContent: "space-between",
                      alignItems: "center", gap: "12px", fontFamily: serif,
                    }}
                  >
                    <span style={{ lineHeight: 1.55 }}>Q. {faq.q}</span>
                    <span style={{
                      color: C.gold, fontSize: "1.1rem", flexShrink: 0,
                      transition: "transform 0.3s ease",
                      transform: openFaq === i ? "rotate(45deg)" : "none",
                      display: "inline-block", opacity: 0.75,
                    }}>+</span>
                  </button>
                  <div className={`guardian-faq-body${openFaq === i ? " open" : ""}`}>
                    <div style={{ padding: "0 18px 15px", borderTop: "1px solid rgba(201,155,77,0.07)" }}>
                      <p style={{ color: C.creamDim, fontSize: "0.82rem", lineHeight: 1.92, paddingTop: "13px" }}>
                        A. {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════
          SECTION 9 — LINE 登録オファー
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "88px 24px", background: `linear-gradient(180deg, ${C.dark}, ${C.dark2})` }}>
        <div style={{ maxWidth: "520px", margin: "0 auto" }}>
          <FadeUp>
            <SectionTag text="LINE Offer" color={C.green} />
            <h2 style={{ fontSize: "clamp(1.4rem, 5.5vw, 1.9rem)", textAlign: "center", marginBottom: "12px", lineHeight: 1.55, fontWeight: 700 }}>
              診断後、LINEに登録すると届くもの
            </h2>
            <p style={{ color: C.creamDim, fontSize: "0.84rem", textAlign: "center", lineHeight: 1.9, marginBottom: "30px" }}>
              守護神社を知ることは、スタートです。<br />
              LINEでは、あなたの属性に合わせた情報を継続してお届けします。
            </p>
          </FadeUp>

          <FadeUp delay={0.08}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              {[
                "毎月の開運情報と、あなたの属性に合った吉方位カレンダー",
                "全国の守護神社スポット情報・参拝レポートの最新情報",
                "二十四節気に合わせた参拝の心得と開運の習慣",
                "あなたの属性ごとの縁深い神社の祭事・特別参拝情報",
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", gap: "12px", padding: "13px 16px",
                  background: C.greenFaint, border: `1px solid ${C.greenBorder}`,
                  borderRadius: "10px", alignItems: "flex-start",
                }}>
                  <div style={{ flexShrink: 0, marginTop: "7px", width: "5px", height: "5px", borderRadius: "50%", background: C.green, opacity: 0.7 }} />
                  <p style={{ color: C.creamDim, fontSize: "0.83rem", lineHeight: 1.8 }}>{item}</p>
                </div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.14}>
            <div style={{ padding: "14px 16px", background: "rgba(6,8,15,0.7)", border: `1px solid ${C.goldBorder}`, borderRadius: "10px", textAlign: "center", marginBottom: "20px" }}>
              <p style={{ color: C.creamMute, fontSize: "0.74rem", lineHeight: 1.82 }}>
                LINEへの登録は任意です。費用は発生しません。<br />
                いつでも退会可能です。個人情報の第三者提供は行いません。
              </p>
            </div>

            <a
              href="https://lin.ee/placeholder"
              target="_blank"
              rel="noreferrer"
              className="guardian-btn"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                width: "100%", padding: "17px 20px",
                background: C.line,
                borderRadius: "12px",
                color: "#fff", fontSize: "0.93rem", fontWeight: 700,
                letterSpacing: "0.1em", textDecoration: "none",
                boxShadow: "0 4px 22px rgba(6,199,85,0.28)",
                fontFamily: serif, marginBottom: "10px",
                transition: "transform 0.15s ease",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 5.92 2 10.75c0 2.68 1.37 5.07 3.52 6.69-.16.56-.55 1.94-.63 2.24-.1.37.14.37.29.27.12-.08 1.91-1.26 2.68-1.77.64.1 1.3.15 1.97.15 5.52 0 10-3.92 10-8.75C22 5.92 17.52 2 12 2z" />
              </svg>
              LINEで開運情報を受け取る（無料）
            </a>
            <p style={{ textAlign: "center", color: C.creamMute, fontSize: "0.66rem" }}>
              登録後、いつでも退会可能です
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 10 — 最終CTA
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "96px 24px 120px", background: C.dark, borderTop: `1px solid ${C.goldBorder}`, position: "relative", overflow: "hidden" }}>
        {/* Watermark — 守 */}
        <div style={{
          position: "absolute", bottom: "-60px", left: "50%",
          transform: "translateX(-50%)",
          fontSize: "clamp(180px, 52vw, 300px)",
          color: C.gold, opacity: 0.025,
          fontFamily: serif, fontWeight: 700, lineHeight: 1,
          pointerEvents: "none", userSelect: "none",
        }}>守</div>

        <div style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          <FadeUp>
            <div style={{
              display: "inline-block", padding: "5px 18px",
              background: C.goldFaint, border: `1px solid ${C.goldBorder}`,
              borderRadius: "30px", marginBottom: "28px",
            }}>
              <p style={{ fontFamily: display, fontSize: "0.58rem", letterSpacing: "0.4em", color: C.gold, fontWeight: 600 }}>
                完全無料 ／ 登録不要
              </p>
            </div>

            <h2 style={{ fontSize: "clamp(1.65rem, 6vw, 2.3rem)", marginBottom: "18px", lineHeight: 1.45, fontWeight: 700 }}>
              神社との縁は、<br />
              気づいた瞬間から始まります。
            </h2>

            <p style={{ color: C.creamDim, fontSize: "0.87rem", lineHeight: 2.05, marginBottom: "40px" }}>
              知ることは、変えることの第一歩です。<br />
              あなたと縁の深い神様の存在を知ったとき、<br />
              次に訪れる神社への一歩は、<br />これまでと違うものになるはずです。
            </p>

            <Link href="/diagnose" className="guardian-btn" style={{
              display: "block", width: "100%", maxWidth: "400px",
              margin: "0 auto 12px",
              padding: "19px 20px",
              background: "linear-gradient(135deg, #173325, #1f4a33)",
              border: `1px solid ${C.greenBorder}`,
              borderRadius: "14px",
              color: C.cream, fontSize: "0.93rem", fontWeight: 700,
              letterSpacing: "0.12em", textAlign: "center", textDecoration: "none",
              boxShadow: "0 6px 32px rgba(0,0,0,0.5)",
              fontFamily: serif,
              transition: "transform 0.15s ease",
            }}>
              今すぐ無料で守護神社を調べる
            </Link>

            <p style={{ color: C.creamMute, fontSize: "0.66rem", marginBottom: "52px" }}>
              生年月日を入力するだけ ／ 所要時間 約2分 ／ 全国31,247社対応
            </p>

            {/* P.S. */}
            <div style={{ padding: "24px 20px", background: C.goldFaint, border: `1px solid ${C.goldBorder}`, borderRadius: "14px", textAlign: "left" }}>
              <p style={{ fontFamily: display, fontSize: "0.58rem", letterSpacing: "0.4em", color: C.gold, fontWeight: 600, marginBottom: "12px" }}>P.S.</p>
              <p style={{ color: C.creamDim, fontSize: "0.83rem", lineHeight: 2.05 }}>
                毎年、初詣に行くたびに「今年こそ」と思う。神社が好きで、参拝を続けてきた。
                それなのになぜか、何かが変わらないと感じている。<br /><br />
                もしそれが、縁の深い神社との出会いを知らなかったことが理由の一つだとしたら。<br /><br />
                今日、あなたがここにたどり着いたことが、その縁の始まりかもしれません。
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "26px 24px 48px", textAlign: "center", borderTop: `1px solid ${C.goldBorder}`, background: C.dark }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "28px", flexWrap: "wrap" }}>
          {[
            { href: "/", label: "トップページ" },
            { href: "/diagnose", label: "守護神社診断" },
            { href: "/map", label: "神社マップ" },
          ].map((l) => (
            <Link key={l.href} href={l.href} style={{ color: C.creamMute, fontSize: "0.72rem", textDecoration: "none", letterSpacing: "0.1em" }}>
              {l.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
