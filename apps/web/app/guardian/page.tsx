"use client";

import {
  useRef, useState, useEffect,
  type ReactNode, type CSSProperties,
} from "react";
import Link from "next/link";

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:          "#05070d",
  bgNavy:      "#06090f",
  bgWarm:      "#090806",
  bgDeep:      "#030408",
  gold:        "#C99B4D",
  goldLight:   "#E4C278",
  goldFaint:   "rgba(201,155,77,0.06)",
  goldBorder:  "rgba(201,155,77,0.16)",
  goldGlow:    "rgba(201,155,77,0.09)",
  amber:       "#C07840",
  amberGlow:   "rgba(192,120,64,0.11)",
  green:       "#5a9a78",
  greenFaint:  "rgba(90,154,120,0.07)",
  greenBorder: "rgba(90,154,120,0.18)",
  cream:       "#f5efe2",
  creamDim:    "rgba(245,239,226,0.66)",
  creamMute:   "rgba(245,239,226,0.3)",
  card:        "linear-gradient(145deg,rgba(14,18,28,0.9),rgba(7,9,16,0.95))",
  cardWarm:    "linear-gradient(145deg,rgba(18,13,8,0.9),rgba(10,8,6,0.95))",
  line:        "#06C755",
} as const;

const display = "'Cormorant Garamond', Georgia, serif";
const serif   = "'Shippori Mincho B1','Hiragino Mincho ProN','Yu Mincho',serif";
const PX      = "clamp(24px, 6vw, 96px)";

// ─── Data ─────────────────────────────────────────────────────────────────────

const WORRIES = [
  "毎年初詣に行くのに、なんとなく気持ちが晴れないまま年を越している",
  "神社は好きで定期的に参拝しているのに、「何かが足りない」という感覚が抜けない",
  "有名なパワースポットを巡っているのに、生活の流れが変わらないと感じている",
  "転職・結婚・引越しなど大切な決断の前に、どこへ手を合わせればよいかわからなかった",
  "みんなと同じ有名な神社か、近所の神社か。参拝先を選ぶ基準が見つからない",
  "神社で手を合わせるとき、自分が誰に何を届けているのか、よくわからないことがある",
  "「なんとなく気になる神社」と「本当に自分に合う神社」の違いを知らないまま、何年も過ぎた",
];

const SHRINES = [
  {
    name: "産土神社", reading: "うぶすなじんじゃ", icon: "産",
    accent: "#6aab8a", meaning: "魂の根と生まれた縁を守る",
    desc: "あなたが生まれた土地と深く結びつく神社。人生の根っこ、魂の出発点、持って生まれた性質を象徴します。",
  },
  {
    name: "氏神神社", reading: "うじがみじんじゃ", icon: "氏",
    accent: "#C99B4D", meaning: "家系と家族の縁を守る",
    desc: "家系や地域のつながりを見守る神社。家族運、人間関係、受け継いできた流れを象徴します。",
  },
  {
    name: "鎮守神社", reading: "ちんじゅじんじゃ", icon: "鎮",
    accent: "#7090c0", meaning: "今の暮らしと場所の縁を守る",
    desc: "今いる土地での日々を見守る神社。仕事、暮らし、現在の環境との相性を象徴します。",
  },
];

const DIAGNOSIS_ITEMS = [
  { icon: "縁", title: "あなたと縁の深い守護神社",    desc: "全国31,247社から縁の深さ順に神社を特定します" },
  { icon: "質", title: "生まれ持った性質",              desc: "五行属性と生年月日から本来の気質と特性を読み解きます" },
  { icon: "運", title: "今の運気の流れ",                desc: "現在の運気の傾向と意識すると良い方向性をお伝えします" },
  { icon: "参", title: "相性の良い参拝タイミング",      desc: "あなたの属性に合った参拝に適した時期・時間帯の目安をご案内します" },
  { icon: "願", title: "願いごとの方向性",              desc: "どの神社でどのような願いを届けると縁が深いかを整理します" },
  { icon: "人", title: "人間関係・仕事・家庭のヒント",  desc: "今の環境で意識すると良い視点と神社との向き合い方をお伝えします" },
  { icon: "法", title: "参拝の作法と心得",              desc: "拝礼・最適な時間帯・方角など、知って行く参拝のための基礎知識" },
  { icon: "開", title: "開運アクション",                desc: "あなたの属性と縁に合わせた日常で取り入れやすい習慣" },
];

const LOGIC_CARDS = [
  { no: "01", title: "生年月日",    desc: "持って生まれた性質や運気の傾向を読み解きます。陰陽・干支・数秘術の考え方を組み合わせて解析します。" },
  { no: "02", title: "陰陽五行",    desc: "木・火・土・金・水のバランスからあなたの傾向を分析。どの神様のエネルギーと相性が深いかを判定します。" },
  { no: "03", title: "地域との縁",  desc: "生まれた土地・現在地・生活圏との関係性を考慮。産土の縁・氏神の縁・鎮守の縁を丁寧に整理します。" },
  { no: "04", title: "神社データ",  desc: "全国31,247社のご祭神・地域性・歴史・参拝目的などをもとに候補を整理。縁の深さで優先順位をつけます。" },
  { no: "05", title: "AI解析",      desc: "複数の要素を組み合わせ、あなたに合う守護神社の候補を導き出します。断定ではなく参拝先選びのヒントとしてご活用ください。" },
];

const VOICES = [
  {
    label: "30代女性 / 仕事の転機に悩んでいた",
    text: "最近、仕事を続けるべきか迷っていました。診断で出てきた神社が、昔から気になっていた場所で驚きました。参拝してみると気持ちが整理され、今やるべきことが少し見えた気がします。「守護神社」という概念を知ってから、参拝の仕方が変わりました。",
  },
  {
    label: "40代女性 / 家族関係に悩んでいた",
    text: "家族との関係に疲れていた時期に診断しました。氏神神社という考え方を知り、自分の家系や土地とのつながりを改めて考えるきっかけになりました。大げさな「変化」ではないけれど、何かが静かに腑に落ちた感覚があります。",
  },
  {
    label: "50代男性 / 人生の節目に",
    text: "退職後の暮らし方を考えていた時に利用しました。大げさな占いではなく、静かに背中を押してくれるような内容で、素直に受け取れました。地元の神社に改めて足を運ぶようになり、心が少し軽くなりました。",
  },
];

const FAQS = [
  { q: "本当に無料で利用できますか？",             a: "はい、完全無料です。診断の利用、結果の閲覧、すべて無料でご利用いただけます。有料オプションや課金は一切ありません。" },
  { q: "登録は必要ですか？",                        a: "登録不要です。メールアドレスや会員登録なしで診断を受けられます。LINEへの登録は任意で、診断自体には必要ありません。" },
  { q: "生年月日以外に必要な情報はありますか？",    a: "生年月日のみで診断を開始できます。悩みカテゴリは任意項目で、入力するとより詳細な結果が得られますが必須ではありません。" },
  { q: "診断結果はどのように決まりますか？",        a: "生年月日から導き出される陰陽五行の属性、産土信仰の考え方、地域性、全国の神社データを組み合わせて提案します。数千年の歴史を持つ思想体系に基づいていますが現代科学とは異なります。参拝先選びのヒントとしてご活用ください。" },
  { q: "宗教的な勧誘はありますか？",                a: "ありません。このサービスは特定の宗教・宗派・宗教法人とは無関係に運営されています。神社情報の普及と日本文化の継承を目的としたプラットフォームです。" },
  { q: "個人情報は安全に扱われますか？",            a: "入力いただく情報は生年月日と任意項目のみです。氏名・住所・メールアドレスなどの個人情報は診断には不要です。第三者への提供は行いません。" },
  { q: "診断結果を保存できますか？",                a: "診断結果はLINEに登録することで保存・再確認できます。LINEへの登録は任意です。" },
  { q: "神社に詳しくなくても大丈夫ですか？",        a: "はい。産土神社・氏神神社・鎮守神社の考え方から丁寧に解説しますので、神社への知識は必要ありません。初めて知る方にこそ新しい気づきをお届けできると思っています。" },
];

const THEMES = ["恋愛・縁結び", "仕事・事業", "家族・家庭", "健康・心身", "人間関係", "将来・転機"];

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Components ───────────────────────────────────────────────────────────────

function FadeUp({ children, delay = 0, style: sx = {} }: {
  children: ReactNode; delay?: number; style?: CSSProperties;
}) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(22px)",
      transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`,
      ...sx,
    }}>
      {children}
    </div>
  );
}

function Tag({ text, color = C.gold }: { text: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
      <span style={{
        fontFamily: display, fontSize: "0.58rem", letterSpacing: "0.55em",
        color, borderBottom: `1px solid ${color}28`, paddingBottom: "4px",
        textTransform: "uppercase" as const,
      }}>{text}</span>
    </div>
  );
}

function H2({ children, style: sx = {} }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <h2 style={{
      fontSize: "clamp(1.65rem, 3.8vw, 2.3rem)", fontWeight: 800,
      lineHeight: 1.5, marginBottom: "14px", fontFamily: serif,
      ...sx,
    }}>{children}</h2>
  );
}

function Lead({ children }: { children: ReactNode }) {
  return (
    <p style={{
      color: C.creamDim,
      fontSize: "clamp(0.93rem, 1.9vw, 1.05rem)",
      lineHeight: 2.1, marginBottom: "40px",
    }}>{children}</p>
  );
}

function OrnamentLine() {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: `0 ${PX}`, maxWidth: "300px", margin: "0 auto" }}>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right,transparent,${C.goldBorder})` }} />
      <svg width="22" height="22" viewBox="0 0 22 22" style={{ flexShrink: 0, margin: "0 10px" }}>
        <circle cx="11" cy="11" r="2.2" fill="none" stroke={C.gold} strokeWidth="0.8" opacity="0.38" />
        <line x1="11" y1="2" x2="11" y2="7"  stroke={C.gold} strokeWidth="0.8" opacity="0.28" />
        <line x1="11" y1="15" x2="11" y2="20" stroke={C.gold} strokeWidth="0.8" opacity="0.28" />
        <line x1="2"  y1="11" x2="7"  y2="11" stroke={C.gold} strokeWidth="0.8" opacity="0.28" />
        <line x1="15" y1="11" x2="20" y2="11" stroke={C.gold} strokeWidth="0.8" opacity="0.28" />
      </svg>
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(to left,transparent,${C.goldBorder})` }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuardianLP() {
  const formRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const maxW: CSSProperties = { maxWidth: "960px", margin: "0 auto", width: "100%" };
  const SP: CSSProperties    = { padding: `clamp(80px,10vw,120px) ${PX}` };

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Shippori+Mincho+B1:wght@400;700;800&display=swap";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.setAttribute("data-g", "1");
    style.textContent = `
      @keyframes g-breathe{0%,100%{opacity:.024;transform:scale(1)}50%{opacity:.05;transform:scale(1.01)}}
      @keyframes g-glow{0%,100%{opacity:.06}50%{opacity:.14}}
      @keyframes g-float{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-7px)}}
      .g-faq{max-height:0;overflow:hidden;opacity:0;transition:max-height .4s cubic-bezier(.4,0,.2,1),opacity .3s ease}
      .g-faq.open{max-height:360px;opacity:1}
      .g-btn{transition:transform .15s ease,box-shadow .2s ease}
      .g-btn:active{transform:scale(.98)!important}
      .g-green{background:linear-gradient(135deg,#163021,#1d4530,#163021)}
      .g-green:hover{background:linear-gradient(135deg,#1d4530,#234d38,#1d4530);box-shadow:0 8px 36px rgba(0,0,0,.65),0 0 22px rgba(90,154,120,.18)!important}
    `;
    document.head.appendChild(style);

    return () => {
      try { document.head.removeChild(link); } catch {}
      const s = document.querySelector("style[data-g]");
      if (s) try { document.head.removeChild(s); } catch {}
    };
  }, []);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ background: C.bg, color: C.cream, minHeight: "100vh", fontFamily: serif, WebkitFontSmoothing: "antialiased" }}>

      {/* ══════════════════════════════════════════════════════
          S01  HERO
      ══════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative", minHeight: "100svh",
        display: "flex", flexDirection: "column", justifyContent: "center",
        overflow: "hidden",
        background: [
          "linear-gradient(to right,rgba(5,7,13,.97) 0%,rgba(5,7,13,.92) 42%,rgba(5,7,13,.55) 68%,rgba(5,7,13,.08) 100%)",
          "linear-gradient(to bottom,rgba(5,7,13,.85) 0%,rgba(5,7,13,.02) 18%,rgba(5,7,13,.02) 82%,rgba(5,7,13,.99) 100%)",
          "url('/images/guardian-hero.webp') center 38% / cover",
        ].join(","),
      }}>
        {/* Lantern glow */}
        <div style={{
          position:"absolute", top:"32%", left:"8%",
          width:"380px", height:"380px", borderRadius:"50%",
          background:`radial-gradient(ellipse,${C.amberGlow} 0%,transparent 65%)`,
          pointerEvents:"none", animation:"g-glow 9s ease-in-out infinite",
        }} />

        <div style={{ position:"relative", padding:`88px ${PX} 80px`, ...maxW }}>
          <div style={{ maxWidth:"580px" }}>

            {/* Badge */}
            <FadeUp delay={0.05}>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:"8px",
                padding:"5px 16px 5px 10px",
                background:C.goldFaint, border:`1px solid ${C.goldBorder}`, borderRadius:"30px",
                marginBottom:"26px",
              }}>
                <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:C.gold, opacity:.85 }} />
                <span style={{ fontFamily:display, fontSize:"0.6rem", letterSpacing:"0.42em", color:C.gold, fontWeight:600 }}>
                  守護神社診断 — 完全無料
                </span>
              </div>
            </FadeUp>

            {/* H1 */}
            <FadeUp delay={0.14}>
              <h1 style={{
                fontSize:"clamp(2rem,6.5vw,3.5rem)", lineHeight:1.42,
                letterSpacing:"0.04em", marginBottom:"28px",
                fontWeight:800, fontFamily:serif,
              }}>
                あなたと最も縁の深い<br />
                <span style={{ color:C.goldLight }}>「守護神社」</span>を<br />
                知っていますか？
              </h1>
            </FadeUp>

            {/* Poem */}
            <FadeUp delay={0.24}>
              <div style={{
                marginBottom:"28px", paddingLeft:"16px",
                borderLeft:`2px solid ${C.goldBorder}`,
              }}>
                <p style={{
                  color:C.creamDim, fontSize:"clamp(0.9rem,1.9vw,1.02rem)",
                  lineHeight:2.2, fontStyle:"italic",
                }}>
                  生まれた土地。<br />
                  受け継いだ家系。<br />
                  いま暮らしている場所。<br /><br />
                  そのすべてには、あなたを静かに支えてきた<br />
                  <em style={{ color:C.cream, fontStyle:"normal" }}>「見えないご縁」</em>があります。
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.31}>
              <p style={{ color:C.creamDim, fontSize:"clamp(0.92rem,1.9vw,1.02rem)", lineHeight:1.95, marginBottom:"34px" }}>
                生年月日から、あなたに縁の深い神社を無料で診断します。
              </p>
            </FadeUp>

            {/* Stats */}
            <FadeUp delay={0.37}>
              <div style={{ display:"flex", gap:"10px", marginBottom:"34px", flexWrap:"wrap" }}>
                {[["31,247","収録神社"],["87,341","累計診断"],["全47都道府県","対応"]].map(([n,l])=>(
                  <div key={l} style={{
                    padding:"8px 14px",
                    background:"rgba(5,7,13,.72)", border:`1px solid ${C.goldBorder}`,
                    borderRadius:"8px", backdropFilter:"blur(6px)",
                  }}>
                    <p style={{ fontFamily:display, fontSize:"0.9rem", fontWeight:700, color:C.gold, lineHeight:1.1 }}>{n}</p>
                    <p style={{ fontSize:"0.58rem", color:C.creamMute, marginTop:"2px" }}>{l}</p>
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* CTA */}
            <FadeUp delay={0.44}>
              <button
                onClick={scrollToForm}
                className="g-btn g-green"
                style={{
                  display:"block", width:"100%", maxWidth:"420px",
                  padding:"20px 24px",
                  border:`1px solid ${C.greenBorder}`, borderRadius:"12px",
                  color:C.cream, fontSize:"clamp(.95rem,2.5vw,1.05rem)",
                  fontWeight:800, letterSpacing:"0.1em",
                  cursor:"pointer", boxShadow:"0 4px 30px rgba(0,0,0,.55)",
                  fontFamily:serif, marginBottom:"14px",
                }}
              >
                今すぐ守護神社を調べる
              </button>
              <div style={{ display:"flex", gap:"14px", flexWrap:"wrap" }}>
                {["登録不要","完全無料","生年月日だけ","約30秒で完了"].map(t=>(
                  <span key={t} style={{ fontSize:"0.69rem", color:C.creamMute, display:"flex", alignItems:"center", gap:"4px" }}>
                    <span style={{ color:C.green, fontSize:"0.58rem" }}>✓</span> {t}
                  </span>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>

        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"120px", background:`linear-gradient(to top,${C.bg},transparent)`, pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"28px", left:"50%", animation:"g-float 3.5s ease-in-out infinite" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"6px" }}>
            <div style={{ width:"1px", height:"38px", background:`linear-gradient(to bottom,transparent,${C.goldBorder})` }} />
            <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:C.gold, opacity:.4 }} />
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════
          S02  共感
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bgNavy }}>
        <div style={maxW}>
          <FadeUp>
            <Tag text="Does This Sound Familiar" />
            <H2 style={{ textAlign:"center" }}>こんなことを感じたことは<br />ありませんか？</H2>
            <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", textAlign:"center", lineHeight:2, marginBottom:"10px" }}>
              神社への想いはあるのに、なぜか満たされない。<br />
              その感覚には、理由があるかもしれません。
            </p>
            <p style={{ color:C.creamMute, fontSize:"0.84rem", textAlign:"center", lineHeight:1.8, marginBottom:"44px" }}>
              一つでも思い当たることがあるなら、この先を読み進めてください。
            </p>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"10px" }}>
            {WORRIES.map((w,i)=>(
              <FadeUp key={i} delay={i*.04}>
                <div style={{
                  display:"flex", gap:"14px", alignItems:"flex-start",
                  padding:"17px 20px", background:C.card,
                  border:`1px solid ${C.goldBorder}`,
                  borderLeft:`3px solid rgba(201,155,77,.22)`,
                  borderRadius:"10px",
                }}>
                  <span style={{ fontFamily:display, fontSize:"0.7rem", color:C.gold, fontWeight:700, opacity:.55, paddingTop:"3px", flexShrink:0, minWidth:"18px" }}>
                    {String(i+1).padStart(2,"0")}
                  </span>
                  <p style={{ color:C.creamDim, fontSize:"clamp(.87rem,1.7vw,.96rem)", lineHeight:1.88 }}>{w}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp>
            <div style={{ marginTop:"32px", padding:"24px 24px", background:"rgba(100,30,30,.08)", border:"1px solid rgba(160,80,60,.17)", borderRadius:"14px", textAlign:"center" }}>
              <p style={{ color:"rgba(240,215,200,.85)", fontSize:"clamp(.92rem,1.9vw,1rem)", lineHeight:2 }}>
                これらに共通するのは、<br />
                <strong style={{ color:C.cream }}>「自分と縁の深い神社を知らないまま」参拝し続けていること</strong><br />
                かもしれません。
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S03  守護神社とは何か
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bgWarm, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"40%", right:"5%", width:"480px", height:"380px", borderRadius:"50%", background:`radial-gradient(ellipse,${C.amberGlow} 0%,transparent 65%)`, pointerEvents:"none", animation:"g-glow 11s ease-in-out infinite" }} />

        <div style={{ ...maxW, position:"relative" }}>
          <FadeUp>
            <Tag text="What Is Guardian Shrine" />
            <H2 style={{ textAlign:"center" }}>守護神社とは、何ですか？</H2>
          </FadeUp>

          <div style={{ maxWidth:"720px", margin:"0 auto" }}>
            <FadeUp delay={0.08}>
              <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", lineHeight:2.15, marginBottom:"22px" }}>
                私たちは生まれた瞬間から、様々な土地や人の縁の中に生きています。<br />
                日本古来の信仰には、その縁ひとつひとつに「見守る神様」がいるという考え方があります。
              </p>
              <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", lineHeight:2.15, marginBottom:"22px" }}>
                有名な神社、話題のパワースポット、友人に勧められた神社。<br />
                どこも尊い場所ですが、<strong style={{ color:C.cream }}>「あなたにとって最も縁の深い神社」</strong>は別にあるかもしれません。
              </p>
              <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", lineHeight:2.15, marginBottom:"32px" }}>
                守護神社とは、あなたの生まれ・家系・暮らす土地と深くつながり、<br />
                あなたの人生を静かに支えてくれているとされる神社のことです。
              </p>
            </FadeUp>

            <FadeUp delay={0.14}>
              <div style={{ padding:"26px 28px", background:`linear-gradient(135deg,rgba(20,14,8,.88),rgba(12,9,5,.92))`, border:`1px solid ${C.goldBorder}`, borderLeft:`3px solid ${C.gold}`, borderRadius:"12px" }}>
                <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", lineHeight:2.2, fontStyle:"italic" }}>
                  「なぜか心が落ち着く神社がある」<br />
                  「人生の節目に、不思議と導かれる場所がある」<br /><br />
                  そうした感覚は、守護神社との縁によるものかもしれません。
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S04  三つの守護神社
      ══════════════════════════════════════════════════════ */}
      <section style={{
        ...SP, position:"relative", overflow:"hidden",
        background:[
          "linear-gradient(to bottom,rgba(5,7,13,.94) 0%,rgba(5,7,13,.87) 50%,rgba(5,7,13,.96) 100%)",
          "url('/images/guardian-three-shrines.webp') center/cover",
          C.bgNavy,
        ].join(","),
      }}>
        <div style={{ ...maxW, position:"relative" }}>
          <FadeUp>
            <Tag text="Three Guardian Shrines" />
            <H2 style={{ textAlign:"center" }}>あなたを見守る神社は、<br />ひとつとは限りません。</H2>
            <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", textAlign:"center", lineHeight:2.1, maxWidth:"640px", margin:"0 auto 48px" }}>
              古くから日本では、人と土地には深い縁があると考えられてきました。<br />
              生まれた土地、家系が受け継いできた土地、そして今暮らしている土地。<br />
              それぞれに、あなたの人生を静かに支える "守り" があります。
            </p>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(265px,1fr))", gap:"16px" }}>
            {SHRINES.map((s,i)=>(
              <FadeUp key={i} delay={i*.09}>
                <div style={{
                  padding:"30px 24px",
                  background:`linear-gradient(145deg,rgba(10,14,24,.93),rgba(6,8,16,.97))`,
                  border:`1px solid ${C.goldBorder}`,
                  borderTop:`3px solid ${s.accent}`,
                  borderRadius:"14px",
                  position:"relative", overflow:"hidden",
                  backdropFilter:"blur(12px)",
                }}>
                  <div style={{ position:"absolute", bottom:"8px", right:"12px", fontSize:"5rem", color:s.accent, opacity:.055, fontFamily:serif, fontWeight:800, lineHeight:1, pointerEvents:"none" }}>{s.icon}</div>
                  <p style={{ fontFamily:display, fontSize:"0.58rem", letterSpacing:"0.3em", color:s.accent, marginBottom:"7px", opacity:.8 }}>{s.reading}</p>
                  <h3 style={{ fontSize:"clamp(1.1rem,2.5vw,1.28rem)", fontWeight:800, color:C.cream, marginBottom:"5px", fontFamily:serif }}>{s.name}</h3>
                  <p style={{ fontFamily:display, fontSize:"0.7rem", color:s.accent, opacity:.72, marginBottom:"16px", letterSpacing:"0.06em" }}>{s.meaning}</p>
                  <p style={{ color:C.creamDim, fontSize:"clamp(.87rem,1.7vw,.95rem)", lineHeight:1.92 }}>{s.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S05  なぜ知ることが大切か
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bgNavy, position:"relative", overflow:"hidden" }}>
        <div style={{
          position:"absolute", top:"50%", right:"-40px", transform:"translateY(-50%)",
          fontSize:"clamp(200px,42vw,360px)", color:C.gold, opacity:.024,
          fontFamily:serif, fontWeight:800, lineHeight:1,
          pointerEvents:"none", userSelect:"none",
          animation:"g-breathe 11s ease-in-out infinite",
        }}>縁</div>

        <div style={{ ...maxW, position:"relative" }}>
          <FadeUp>
            <Tag text="Why It Matters" />
            <H2 style={{ textAlign:"center" }}>なぜ、守護神社を知ることが<br />人生のヒントになるのか。</H2>
          </FadeUp>

          <div style={{ maxWidth:"700px", margin:"0 auto" }}>
            <FadeUp delay={0.08}>
              <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", lineHeight:2.2, marginBottom:"22px" }}>
                人は、自分ひとりで生きているようでいて、<br />
                実はたくさんの土地や人の縁に支えられています。
              </p>
              <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", lineHeight:2.2, marginBottom:"22px" }}>
                なぜか心が落ち着く場所。<br />
                何度も足を運びたくなる神社。<br />
                人生の節目に不思議と導かれる土地。<br /><br />
                そうした感覚には、あなた自身の運気やご縁が関係しているかもしれません。
              </p>
            </FadeUp>

            <FadeUp delay={0.14}>
              <div style={{ padding:"28px 26px", background:C.goldFaint, border:`1px solid ${C.goldBorder}`, borderRadius:"14px", marginBottom:"24px" }}>
                <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", lineHeight:2.2 }}>
                  守護神社を知ることは、未来を決めつけることではありません。<br /><br />
                  自分がどんな流れの中にいて、どんな場所と相性がよく、<br />
                  どこに意識を向けると前に進みやすいのかを知るための、<br />
                  <strong style={{ color:C.cream }}>ひとつの "地図" です。</strong>
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", lineHeight:2.2 }}>
                有名だから、話題だから、友人に勧められたから。<br />
                そういった理由で参拝先を選ぶことは、<br />
                <strong style={{ color:C.cream }}>他の人の処方箋で書かれた薬を、自分の診断なしに飲み続けること</strong><br />
                に似ているかもしれません。
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S06  診断でわかること
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bg }}>
        <div style={maxW}>
          <FadeUp>
            <Tag text="What You'll Discover" />
            <H2 style={{ textAlign:"center" }}>この診断でわかること</H2>
            <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", textAlign:"center", lineHeight:1.95, marginBottom:"48px" }}>
              生年月日と、今のあなたの状況から、8つのことをお伝えします。
            </p>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))", gap:"12px" }}>
            {DIAGNOSIS_ITEMS.map((item,i)=>(
              <FadeUp key={i} delay={i*.04}>
                <div style={{ padding:"22px 20px", background:C.card, border:`1px solid ${C.goldBorder}`, borderRadius:"12px", position:"relative", overflow:"hidden", height:"100%" }}>
                  <div style={{ position:"absolute", top:"10px", right:"14px", fontFamily:serif, fontSize:"1.9rem", color:C.gold, opacity:.055, fontWeight:800, lineHeight:1 }}>{item.icon}</div>
                  <p style={{ fontFamily:display, fontSize:"0.58rem", letterSpacing:"0.36em", color:C.gold, marginBottom:"8px", opacity:.65 }}>{String(i+1).padStart(2,"0")}</p>
                  <h3 style={{ color:C.cream, fontSize:"clamp(.88rem,1.8vw,.96rem)", fontWeight:700, marginBottom:"8px", lineHeight:1.45 }}>{item.title}</h3>
                  <p style={{ color:C.creamMute, fontSize:"clamp(.8rem,1.5vw,.86rem)", lineHeight:1.78 }}>{item.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S07  診断ロジック（山場）
      ══════════════════════════════════════════════════════ */}
      <section style={{
        ...SP, position:"relative", overflow:"hidden",
        background:[
          "linear-gradient(to bottom,rgba(3,4,8,.93) 0%,rgba(3,4,8,.86) 50%,rgba(3,4,8,.95) 100%)",
          "url('/images/guardian-elements.webp') center/cover",
          C.bgDeep,
        ].join(","),
      }}>
        <div style={{ ...maxW, position:"relative" }}>
          <FadeUp>
            <Tag text="Diagnosis Logic" />
            <H2 style={{ textAlign:"center" }}>生年月日と神社データをもとに、<br />あなたのご縁を丁寧に読み解きます。</H2>
            <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", textAlign:"center", lineHeight:2, maxWidth:"640px", margin:"0 auto 52px" }}>
              本診断では、生年月日から読み取れる運気の傾向に加え、陰陽五行の考え方、地域との関係性、神社データを組み合わせて、あなたに縁の深い守護神社を導き出します。
            </p>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(265px,1fr))", gap:"14px" }}>
            {LOGIC_CARDS.map((card,i)=>(
              <FadeUp key={i} delay={i*.07}>
                <div style={{
                  padding:"26px 22px",
                  background:`linear-gradient(145deg,rgba(8,11,20,.93),rgba(5,7,12,.97))`,
                  border:`1px solid ${C.goldBorder}`, borderRadius:"12px",
                  backdropFilter:"blur(10px)",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"14px" }}>
                    <span style={{ fontFamily:display, fontSize:"0.68rem", color:C.gold, fontWeight:700, opacity:.68, minWidth:"22px" }}>{card.no}</span>
                    <div style={{ flex:1, height:"1px", background:C.goldBorder }} />
                  </div>
                  <h3 style={{ color:C.cream, fontSize:"clamp(.95rem,2vw,1.05rem)", fontWeight:700, marginBottom:"10px" }}>{card.title}</h3>
                  <p style={{ color:C.creamDim, fontSize:"clamp(.84rem,1.6vw,.92rem)", lineHeight:1.9 }}>{card.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp>
            <p style={{ color:C.creamMute, fontSize:"0.78rem", textAlign:"center", marginTop:"28px", lineHeight:1.75 }}>
              ※ 本診断は数千年にわたって継承されてきた思想体系に基づいていますが、現代科学とは異なります。<br />
              断定的な予言はせず、参拝先選びのヒントとしてご活用ください。
            </p>
          </FadeUp>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S08  体験者の声
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bgWarm }}>
        <div style={maxW}>
          <FadeUp>
            <Tag text="Voices" />
            <H2 style={{ textAlign:"center" }}>守護神社診断を使った方の声</H2>
            <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", textAlign:"center", lineHeight:1.95, marginBottom:"48px" }}>
              「大きく変わった」という話ではなく、<br />
              静かに腑に落ちた方の声をご紹介します。
            </p>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"20px" }}>
            {VOICES.map((v,i)=>(
              <FadeUp key={i} delay={i*.08}>
                <div style={{ padding:"28px 24px", background:C.card, border:`1px solid ${C.goldBorder}`, borderRadius:"14px" }}>
                  <div style={{ fontFamily:display, fontSize:"4.5rem", color:C.gold, opacity:.09, lineHeight:.7, marginBottom:"10px", fontWeight:700 }}>&ldquo;</div>
                  <p style={{ color:C.creamDim, fontSize:"clamp(.89rem,1.7vw,.97rem)", lineHeight:2.05, marginBottom:"20px" }}>{v.text}</p>
                  <div style={{ borderTop:`1px solid ${C.goldBorder}`, paddingTop:"14px" }}>
                    <p style={{ color:C.creamMute, fontSize:"0.75rem", letterSpacing:"0.04em" }}>{v.label}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S09  診断CTA（フォーム）
      ══════════════════════════════════════════════════════ */}
      <section ref={formRef} id="diagnose" style={{ ...SP, background:C.bgNavy, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"40%", left:"50%", transform:"translate(-50%,-50%)", width:"640px", height:"640px", borderRadius:"50%", background:`radial-gradient(ellipse,${C.goldGlow} 0%,transparent 62%)`, pointerEvents:"none" }} />

        <div style={{ ...maxW, position:"relative" }}>
          <FadeUp>
            <Tag text="Free Diagnosis" />
            <H2 style={{ textAlign:"center" }}>あなたのご縁を、<br />今すぐ無料で調べる</H2>
            <Lead>
              生年月日を入力するだけで、あなたと縁の深い守護神社を診断できます。
            </Lead>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div style={{ maxWidth:"680px", margin:"0 auto" }}>
              <div style={{ background:C.card, border:`1px solid ${C.goldBorder}`, borderRadius:"20px", padding:"clamp(28px,5vw,48px)" }}>

                {/* Theme selector */}
                <div style={{ marginBottom:"28px" }}>
                  <p style={{ fontFamily:display, fontSize:"0.6rem", letterSpacing:"0.4em", color:C.gold, marginBottom:"14px", opacity:.78 }}>
                    相談テーマ（任意・タップして診断へ）
                  </p>
                  <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                    {THEMES.map(theme=>(
                      <Link key={theme} href="/diagnose" style={{
                        padding:"8px 15px", background:C.goldFaint,
                        border:`1px solid ${C.goldBorder}`, borderRadius:"20px",
                        color:C.creamDim, fontSize:"clamp(.8rem,1.5vw,.88rem)",
                        textDecoration:"none", display:"inline-block",
                      }}>{theme}</Link>
                    ))}
                  </div>
                </div>

                {/* Steps */}
                <div style={{ display:"flex", marginBottom:"30px" }}>
                  {[{n:"01",l:"生年月日を入力"},{n:"02",l:"悩みを選択"},{n:"03",l:"守護神社を確認"}].map((step,i)=>(
                    <div key={step.n} style={{ flex:1, textAlign:"center", position:"relative" }}>
                      {i<2 && <div style={{ position:"absolute", top:"13px", right:0, width:"50%", height:"1px", background:`linear-gradient(to right,${C.goldBorder},transparent)` }} />}
                      <div style={{ width:"27px", height:"27px", borderRadius:"50%", background:C.goldFaint, border:`1px solid ${C.goldBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:display, fontSize:"0.6rem", color:C.gold, fontWeight:700, margin:"0 auto 7px" }}>{step.n}</div>
                      <p style={{ color:C.creamDim, fontSize:"clamp(.7rem,1.4vw,.78rem)", lineHeight:1.4 }}>{step.l}</p>
                    </div>
                  ))}
                </div>

                <Link href="/diagnose" className="g-btn g-green" style={{
                  display:"block", width:"100%",
                  padding:"20px 24px", border:`1px solid ${C.greenBorder}`,
                  borderRadius:"12px", color:C.cream,
                  fontSize:"clamp(.95rem,2.5vw,1.05rem)",
                  fontWeight:800, letterSpacing:"0.1em",
                  textAlign:"center", textDecoration:"none",
                  boxShadow:"0 4px 28px rgba(0,0,0,.5)",
                  fontFamily:serif, marginBottom:"14px",
                }}>
                  無料で守護神社を診断する
                </Link>

                <div style={{ display:"flex", justifyContent:"center", gap:"20px", flexWrap:"wrap" }}>
                  {["登録不要","完全無料","約30秒で完了"].map(t=>(
                    <span key={t} style={{ fontSize:"0.7rem", color:C.creamMute, display:"flex", alignItems:"center", gap:"4px" }}>
                      <span style={{ color:C.green, fontSize:"0.58rem" }}>✓</span> {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S10  FAQ
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bg }}>
        <div style={maxW}>
          <FadeUp>
            <Tag text="FAQ" />
            <H2 style={{ textAlign:"center" }}>よくある質問</H2>
            <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", textAlign:"center", lineHeight:1.9, marginBottom:"44px" }}>
              ご不明な点はこちらでご確認いただけます。
            </p>
          </FadeUp>

          <div style={{ maxWidth:"720px", margin:"0 auto", display:"flex", flexDirection:"column", gap:"8px" }}>
            {FAQS.map((faq,i)=>(
              <FadeUp key={i} delay={i*.03}>
                <div style={{ background:C.card, border:`1px solid ${C.goldBorder}`, borderRadius:"12px", overflow:"hidden" }}>
                  <button
                    onClick={()=>setOpenFaq(openFaq===i?null:i)}
                    style={{
                      width:"100%", padding:"17px 22px",
                      background:"transparent", border:"none", cursor:"pointer",
                      color:C.cream, fontSize:"clamp(.88rem,1.8vw,.96rem)", fontWeight:600,
                      textAlign:"left", display:"flex", justifyContent:"space-between",
                      alignItems:"center", gap:"14px", fontFamily:serif, lineHeight:1.5,
                    }}
                  >
                    <span>Q. {faq.q}</span>
                    <span style={{ color:C.gold, fontSize:"1.15rem", flexShrink:0, transition:"transform .3s ease", transform:openFaq===i?"rotate(45deg)":"none", display:"inline-block", opacity:.72 }}>+</span>
                  </button>
                  <div className={`g-faq${openFaq===i?" open":""}`}>
                    <div style={{ padding:"0 22px 18px", borderTop:"1px solid rgba(201,155,77,.07)" }}>
                      <p style={{ color:C.creamDim, fontSize:"clamp(.86rem,1.7vw,.94rem)", lineHeight:1.95, paddingTop:"14px" }}>A. {faq.a}</p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S11  LINE 登録
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bgNavy }}>
        <div style={maxW}>
          <FadeUp>
            <Tag text="LINE Offer" color={C.green} />
            <H2 style={{ textAlign:"center" }}>診断結果をLINEで受け取ると、<br />さらに詳しく見られます。</H2>
            <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1rem)", textAlign:"center", lineHeight:2.05, marginBottom:"36px" }}>
              無料診断では、あなたに縁の深い守護神社の候補を確認できます。<br />
              LINEで受け取ると、参拝のポイント、願いごとの方向性、<br />
              今月意識したい開運アクションまで確認できます。
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div style={{ maxWidth:"580px", margin:"0 auto" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"10px", marginBottom:"26px" }}>
                {["診断結果の保存と再確認","参拝タイミングの案内","願いごとの方向性","今月の開運アクション"].map((item,i)=>(
                  <div key={i} style={{ display:"flex", gap:"10px", padding:"14px 16px", background:C.greenFaint, border:`1px solid ${C.greenBorder}`, borderRadius:"10px", alignItems:"center" }}>
                    <div style={{ flexShrink:0, width:"6px", height:"6px", borderRadius:"50%", background:C.green, opacity:.72 }} />
                    <p style={{ color:C.creamDim, fontSize:"clamp(.84rem,1.6vw,.92rem)", lineHeight:1.6 }}>{item}</p>
                  </div>
                ))}
              </div>

              <div style={{ padding:"14px 18px", background:"rgba(5,7,13,.72)", border:`1px solid ${C.goldBorder}`, borderRadius:"10px", textAlign:"center", marginBottom:"22px" }}>
                <p style={{ color:C.creamMute, fontSize:"clamp(.76rem,1.5vw,.82rem)", lineHeight:1.82 }}>
                  LINEへの登録は任意です。費用は発生しません。いつでも退会可能。<br />
                  個人情報の第三者提供は行いません。
                </p>
              </div>

              <a
                href="https://lin.ee/placeholder"
                target="_blank"
                rel="noreferrer"
                className="g-btn"
                style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
                  width:"100%", padding:"18px 20px",
                  background:C.line, borderRadius:"12px",
                  color:"#fff", fontSize:"clamp(.92rem,2vw,1rem)", fontWeight:800,
                  letterSpacing:"0.08em", textDecoration:"none",
                  boxShadow:"0 4px 24px rgba(6,199,85,.28)",
                  fontFamily:serif, marginBottom:"10px",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 5.92 2 10.75c0 2.68 1.37 5.07 3.52 6.69-.16.56-.55 1.94-.63 2.24-.1.37.14.37.29.27.12-.08 1.91-1.26 2.68-1.77.64.1 1.3.15 1.97.15 5.52 0 10-3.92 10-8.75C22 5.92 17.52 2 12 2z"/>
                </svg>
                LINEで診断結果を受け取る
              </a>
              <p style={{ textAlign:"center", color:C.creamMute, fontSize:"0.68rem" }}>登録後、いつでも退会可能です</p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          S12  最終CTA
      ══════════════════════════════════════════════════════ */}
      <section style={{
        padding:`clamp(96px,12vw,140px) ${PX} clamp(120px,14vw,160px)`,
        background:C.bg, borderTop:`1px solid ${C.goldBorder}`,
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", bottom:"-80px", left:"50%", transform:"translateX(-50%)", fontSize:"clamp(200px,52vw,380px)", color:C.gold, opacity:.022, fontFamily:serif, fontWeight:800, lineHeight:1, pointerEvents:"none", userSelect:"none" }}>守</div>

        <div style={{ ...maxW, textAlign:"center", position:"relative" }}>
          <FadeUp>
            <div style={{ display:"inline-block", padding:"5px 20px", background:C.goldFaint, border:`1px solid ${C.goldBorder}`, borderRadius:"30px", marginBottom:"32px" }}>
              <p style={{ fontFamily:display, fontSize:"0.58rem", letterSpacing:"0.44em", color:C.gold, fontWeight:600 }}>完全無料 ／ 登録不要</p>
            </div>

            <h2 style={{ fontSize:"clamp(1.85rem,5vw,2.9rem)", marginBottom:"24px", lineHeight:1.45, fontWeight:800, fontFamily:serif }}>
              神社との縁は、<br />気づいた瞬間から始まります。
            </h2>

            <div style={{ maxWidth:"620px", margin:"0 auto 44px" }}>
              <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1.02rem)", lineHeight:2.25, marginBottom:"20px" }}>
                あなたが生まれた場所。<br />
                今、暮らしている場所。<br />
                なぜか心惹かれる場所。
              </p>
              <p style={{ color:C.creamDim, fontSize:"clamp(.92rem,1.9vw,1.02rem)", lineHeight:2.25 }}>
                そのすべてが、あなたの人生と静かにつながっているかもしれません。<br />
                まずは無料診断で、あなたに縁の深い守護神社を知ることから始めてみませんか。
              </p>
            </div>

            <Link href="/diagnose" className="g-btn g-green" style={{
              display:"block", width:"100%", maxWidth:"440px",
              margin:"0 auto 14px",
              padding:"22px 24px", border:`1px solid ${C.greenBorder}`,
              borderRadius:"14px", color:C.cream,
              fontSize:"clamp(1rem,2.5vw,1.1rem)",
              fontWeight:800, letterSpacing:"0.1em",
              textAlign:"center", textDecoration:"none",
              boxShadow:"0 6px 40px rgba(0,0,0,.55)",
              fontFamily:serif,
            }}>
              今すぐ無料で守護神社を調べる
            </Link>

            <p style={{ color:C.creamMute, fontSize:"0.7rem", marginBottom:"64px" }}>
              生年月日を入力するだけ ／ 所要時間 約30秒 ／ 全国31,247社対応
            </p>

            {/* P.S. */}
            <div style={{ maxWidth:"560px", margin:"0 auto", padding:"28px 26px", background:C.goldFaint, border:`1px solid ${C.goldBorder}`, borderRadius:"16px", textAlign:"left" }}>
              <p style={{ fontFamily:display, fontSize:"0.58rem", letterSpacing:"0.44em", color:C.gold, fontWeight:600, marginBottom:"14px" }}>P.S.</p>
              <p style={{ color:C.creamDim, fontSize:"clamp(.87rem,1.7vw,.95rem)", lineHeight:2.15 }}>
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
      <footer style={{ padding:`26px ${PX} 48px`, textAlign:"center", borderTop:`1px solid ${C.goldBorder}`, background:C.bg }}>
        <div style={{ display:"flex", justifyContent:"center", gap:"28px", flexWrap:"wrap" }}>
          {[{href:"/",label:"トップページ"},{href:"/diagnose",label:"守護神社診断"},{href:"/map",label:"神社マップ"}].map(l=>(
            <Link key={l.href} href={l.href} style={{ color:C.creamMute, fontSize:"0.75rem", textDecoration:"none", letterSpacing:"0.1em" }}>{l.label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
