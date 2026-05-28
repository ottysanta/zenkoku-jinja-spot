"use client";

import {
  useRef, useState, useEffect,
  type ReactNode, type CSSProperties,
} from "react";
import Link from "next/link";

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:          "#05070d",
  bgNavy:      "#06090e",
  bgWarm:      "#090709",
  bgDeep:      "#020308",
  gold:        "#C99B4D",
  goldLight:   "#E8C87C",
  goldFaint:   "rgba(201,155,77,0.07)",
  goldBorder:  "rgba(201,155,77,0.18)",
  goldB2:      "rgba(201,155,77,0.32)",
  goldGlow:    "rgba(201,155,77,0.09)",
  amber:       "#C07840",
  amberGlow:   "rgba(192,120,64,0.14)",
  green:       "#5a9a78",
  greenFaint:  "rgba(90,154,120,0.07)",
  greenBorder: "rgba(90,154,120,0.22)",
  cream:       "#f5efe2",
  creamDim:    "rgba(245,239,226,0.70)",
  creamMute:   "rgba(245,239,226,0.38)",
  warn:        "rgba(200,80,60,0.08)",
  warnBorder:  "rgba(200,80,60,0.18)",
  line:        "#06C755",
} as const;

const Fd = "'Cormorant Garamond', Georgia, serif";
const Fs = "'Shippori Mincho B1','Hiragino Mincho ProN','Yu Mincho',serif";
const PX = "clamp(20px, 5vw, 72px)";

// ─── Data ─────────────────────────────────────────────────────────────────────

const WORRIES = [
  "初詣くらいしか神社に行かないが、「自分に縁の深い神社」というものをよく知らないまま、何十年も過ごしてきた",
  "転職・結婚・引越しなど大切な決断の前に、どこかに手を合わせたいと思いながら、どこへ行けばいいかわからなかった",
  "産土神・氏神という言葉は聞いたことがあるが、自分とどんな関係があるのかよく知らないままにしてきた",
  "特に信心深いわけではないが、もし自分と縁の深い場所があるなら、一度知ってみたいと思っている",
  "有名なパワースポットや話題の神社に行くが、それが本当に自分に合うのかどうかわからないまま参拝している",
  "神社で手を合わせるとき、誰に何を届けているのか、なんとなく分からないまま帰ることがある",
  "「なんとなく気になる神社」と「本当に自分に縁のある神社」の違いを知らないまま、何年も過ぎた",
];

const SHRINES = [
  {
    name: "産土神社", reading: "うぶすなじんじゃ", icon: "産",
    accent: "#6aab8a",
    meaning: "魂の根と、生まれた縁を守る",
    desc: "あなたが生まれた土地と深く結びつく神社。持って生まれた性質、魂の出発点、人生の根っこを象徴します。どれだけ遠く離れても、この縁は一生続くとされています。",
  },
  {
    name: "氏神神社", reading: "うじがみじんじゃ", icon: "氏",
    accent: "#C99B4D",
    meaning: "家系と家族の縁を守る",
    desc: "家系や地域のつながりを見守る神社。家族運、人間関係、先祖から受け継いできた流れを象徴します。「家の縁」が気になるときに思い出したい守護神社です。",
  },
  {
    name: "鎮守神社", reading: "ちんじゅじんじゃ", icon: "鎮",
    accent: "#7090c0",
    meaning: "今の暮らしと場所の縁を守る",
    desc: "今いる土地での日々の暮らしを見守る神社。仕事、健康、現在の環境との相性を象徴します。引越しや転職など、「今の場所」との縁が変わるタイミングで特に重要とされています。",
  },
];

const DIAG = [
  { no:"01", title:"あなたと縁の深い守護神社",    desc:"全国31,247社から縁の深さ順に特定します。候補神社名・ご祭神・特徴をお伝えします。" },
  { no:"02", title:"生まれ持った性質と五行属性",   desc:"生年月日から本来の気質・強み・弱みを読み解きます。陰陽五行の観点から分析します。" },
  { no:"03", title:"今の運気の流れ",              desc:"現在の運気の傾向と、意識するとよい方向性・時期をお伝えします。" },
  { no:"04", title:"相性の良い参拝タイミング",     desc:"あなたの属性に合った参拝に適した時期・曜日・時間帯の目安をご案内します。" },
  { no:"05", title:"願いごとの方向性",            desc:"どの守護神社でどのような願いを届けると縁が深いかを整理します。" },
  { no:"06", title:"人間関係・仕事・家庭のヒント", desc:"今の環境で意識すると良い視点と、神社との向き合い方をお伝えします。" },
  { no:"07", title:"参拝の作法と心得",            desc:"拝礼の仕方・最適な時間帯・方角など、知って行く参拝のための基礎知識。" },
  { no:"08", title:"開運アクション",              desc:"あなたの属性と縁に合わせた、日常で取り入れやすい習慣をお伝えします。" },
];

const LOGIC = [
  { no:"01", title:"生年月日",   desc:"持って生まれた性質や運気の傾向を読み解きます。陰陽・干支・数秘術の考え方を組み合わせて解析します。" },
  { no:"02", title:"陰陽五行",   desc:"木・火・土・金・水のバランスからあなたの傾向を分析。どの神様のエネルギーと相性が深いかを判定します。" },
  { no:"03", title:"地域との縁", desc:"生まれた土地・現在地・生活圏との関係性を考慮。産土の縁・氏神の縁・鎮守の縁を丁寧に整理します。" },
  { no:"04", title:"神社データ", desc:"全国31,247社のご祭神・地域性・歴史・参拝目的などをもとに候補を整理。縁の深さで優先順位をつけます。" },
  { no:"05", title:"AI解析",     desc:"複数の要素を組み合わせ、あなたに合う守護神社の候補を導き出します。参拝先選びのヒントとしてご活用ください。" },
];

const VOICES = [
  {
    label: "30代女性 / 仕事の転機に悩んでいた",
    pull:  "参拝してみると気持ちが整理された",
    text:  "最近、仕事を続けるべきか迷っていました。診断で出てきた神社が、昔から気になっていた場所で驚きました。参拝してみると気持ちが整理され、今やるべきことが少し見えた気がします。「守護神社」という概念を知ってから、参拝の仕方が変わりました。",
  },
  {
    label: "40代女性 / 家族関係に悩んでいた",
    pull:  "何かが静かに腑に落ちた感覚",
    text:  "家族との関係に疲れていた時期に診断しました。氏神神社という考え方を知り、自分の家系や土地とのつながりを改めて考えるきっかけになりました。大げさな「変化」ではないけれど、何かが静かに腑に落ちた感覚があります。",
  },
  {
    label: "50代男性 / 人生の節目に",
    pull:  "静かに背中を押してくれるような内容",
    text:  "退職後の暮らし方を考えていた時に利用しました。大げさな占いではなく、静かに背中を押してくれるような内容で、素直に受け取れました。地元の神社に改めて足を運ぶようになり、心が少し軽くなりました。",
  },
];

const FAQS = [
  { q:"本当に無料ですか？",                       a:"はい、完全無料です。診断の利用・結果の閲覧・すべて無料でご利用いただけます。有料オプションや課金は一切ありません。" },
  { q:"登録は必要ですか？",                        a:"診断自体は登録不要です。メールアドレスや会員登録なしで診断を受けられます。LINEへの登録は任意で、診断には必要ありません。" },
  { q:"神社に詳しくなくても大丈夫ですか？",        a:"はい。産土神社・氏神神社・鎮守神社の考え方から丁寧に解説しますので、神社への知識は必要ありません。初めて知る方にこそ新しい気づきをお届けできると思っています。" },
  { q:"生年月日以外に必要な情報はありますか？",    a:"生年月日のみで診断を開始できます。悩みカテゴリは任意項目で、入力するとより詳細な結果が得られますが必須ではありません。" },
  { q:"診断結果はどのように決まりますか？",        a:"生年月日から導き出される陰陽五行の属性、産土信仰の考え方、地域性、全国の神社データを組み合わせて提案します。数千年の歴史を持つ思想体系に基づいていますが現代科学とは異なります。参拝先選びのヒントとしてご活用ください。" },
  { q:"宗教的な勧誘はありますか？",                a:"ありません。このサービスは特定の宗教・宗派・宗教法人とは無関係に運営されています。神社情報の普及と日本文化の継承を目的としたプラットフォームです。" },
  { q:"個人情報は安全に扱われますか？",            a:"入力いただく情報は生年月日と任意項目のみです。氏名・住所・メールアドレスなどの個人情報は診断には不要です。第三者への提供は行いません。" },
  { q:"診断結果を保存できますか？",               a:"診断結果はLINEに登録することで保存・再確認できます。LINEへの登録は任意です。" },
];

const THEMES = ["恋愛・縁結び","仕事・事業","家族・家庭","健康・心身","人間関係","将来・転機"];

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.08) {
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function FadeUp({ children, delay = 0, style: sx = {} }: {
  children: ReactNode; delay?: number; style?: CSSProperties;
}) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(26px)",
      transition: `opacity 0.85s ease ${delay}s, transform 0.85s ease ${delay}s`,
      ...sx,
    }}>
      {children}
    </div>
  );
}

function Tag({ text, color = C.gold }: { text: string; color?: string }) {
  return (
    <div style={{ display:"flex", justifyContent:"center", marginBottom:"12px" }}>
      <span style={{
        fontFamily:Fd, fontSize:"0.57rem", letterSpacing:"0.58em",
        color, borderBottom:`1px solid ${color}30`, paddingBottom:"5px",
        textTransform:"uppercase" as const,
      }}>{text}</span>
    </div>
  );
}

function H2({ children, style: sx = {} }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <h2 style={{
      fontSize:"clamp(1.72rem,4.2vw,2.5rem)", fontWeight:800,
      lineHeight:1.5, marginBottom:"18px", fontFamily:Fs,
      ...sx,
    }}>{children}</h2>
  );
}

function Body({ children, style: sx = {} }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p style={{
      color:C.creamDim, fontSize:"clamp(1rem,2vw,1.08rem)",
      lineHeight:2.15, ...sx,
    }}>{children}</p>
  );
}

function PullQuote({ children }: { children: ReactNode }) {
  return (
    <div style={{
      borderLeft:`3px solid ${C.goldB2}`, paddingLeft:"22px",
      margin:"28px 0",
    }}>
      <p style={{
        color:C.creamDim, fontStyle:"italic",
        fontSize:"clamp(1rem,2vw,1.1rem)", lineHeight:2.2,
      }}>{children}</p>
    </div>
  );
}

function OrnamentLine() {
  return (
    <div style={{
      display:"flex", alignItems:"center",
      maxWidth:"520px", margin:"0 auto",
      padding:`0 ${PX}`,
    }}>
      <div style={{ flex:1, height:"1px", background:`linear-gradient(to right,transparent,${C.goldBorder})` }} />
      <svg width="30" height="30" viewBox="0 0 30 30" style={{ flexShrink:0, margin:"0 14px" }}>
        <rect x="11" y="11" width="8" height="8" fill="none" stroke={C.gold} strokeWidth="0.8" opacity="0.32" transform="rotate(45 15 15)" />
        <circle cx="15" cy="15" r="1.8" fill={C.gold} opacity="0.20" />
      </svg>
      <div style={{ flex:1, height:"1px", background:`linear-gradient(to left,transparent,${C.goldBorder})` }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuardianLP() {
  const formRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const maxW: CSSProperties = { maxWidth:"960px", margin:"0 auto", width:"100%" };
  const SP: CSSProperties   = { padding:`clamp(72px,9vw,128px) ${PX}` };

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Shippori+Mincho+B1:wght@400;700;800&display=swap";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.setAttribute("data-guardian","1");
    style.textContent = `
      @keyframes g-breathe{0%,100%{opacity:.022;transform:scale(1)}50%{opacity:.05;transform:scale(1.014)}}
      @keyframes g-glow{0%,100%{opacity:.07}50%{opacity:.18}}
      @keyframes g-float{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-9px)}}
      @keyframes g-shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
      .g-faq{max-height:0;overflow:hidden;opacity:0;transition:max-height .45s cubic-bezier(.4,0,.2,1),opacity .35s ease}
      .g-faq.open{max-height:440px;opacity:1}
      .g-btn{transition:transform .15s ease,box-shadow .2s ease}
      .g-btn:active{transform:scale(.98)!important}
      .g-green{background:linear-gradient(135deg,#163021,#1d4530,#163021);cursor:pointer}
      .g-green:hover{background:linear-gradient(135deg,#1d4530,#26553e,#1d4530);box-shadow:0 10px 48px rgba(0,0,0,.7),0 0 32px rgba(90,154,120,.24)!important}
      .g-shrine-card:hover{transform:translateY(-4px);transition:transform .3s ease}
    `;
    document.head.appendChild(style);

    return () => {
      try { document.head.removeChild(link); } catch {}
      const s = document.querySelector("style[data-guardian]");
      if (s) try { document.head.removeChild(s); } catch {}
    };
  }, []);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  return (
    <div style={{ background:C.bg, color:C.cream, minHeight:"100vh", fontFamily:Fs, WebkitFontSmoothing:"antialiased" }}>

      {/* ══════════════════════════════════════════════════════
          S01  HERO — 視覚的山場①
      ══════════════════════════════════════════════════════ */}
      <section style={{
        position:"relative", minHeight:"100svh",
        display:"flex", flexDirection:"column", justifyContent:"center",
        overflow:"hidden",
      }}>
        {/* Background image */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:"url('/images/guardian-hero.webp')",
          backgroundSize:"cover", backgroundPosition:"center 38%",
          backgroundRepeat:"no-repeat",
        }} />
        {/* Left-to-right dark overlay: left text side dark, right image shows */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to right,rgba(5,7,13,.97) 0%,rgba(5,7,13,.93) 40%,rgba(5,7,13,.60) 65%,rgba(5,7,13,.15) 100%)",
        }} />
        {/* Top + bottom fade */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(5,7,13,.88) 0%,transparent 18%,transparent 78%,rgba(5,7,13,.99) 100%)",
        }} />
        {/* Amber lantern glow */}
        <div style={{
          position:"absolute", top:"28%", left:"6%",
          width:"360px", height:"360px", borderRadius:"50%",
          background:`radial-gradient(ellipse,${C.amberGlow} 0%,transparent 65%)`,
          pointerEvents:"none", animation:"g-glow 8s ease-in-out infinite",
        }} />

        <div style={{ position:"relative", padding:`90px ${PX} 80px`, ...maxW }}>
          <div style={{ maxWidth:"600px" }}>

            {/* Badge */}
            <FadeUp delay={0.04}>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:"8px",
                padding:"5px 16px 5px 12px",
                background:C.goldFaint, border:`1px solid ${C.goldBorder}`, borderRadius:"30px",
                marginBottom:"30px",
              }}>
                <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:C.gold, opacity:.85 }} />
                <span style={{ fontFamily:Fd, fontSize:"0.6rem", letterSpacing:"0.44em", color:C.gold, fontWeight:600 }}>
                  守護神社診断 — 完全無料
                </span>
              </div>
            </FadeUp>

            {/* H1 */}
            <FadeUp delay={0.12}>
              <h1 style={{
                fontSize:"clamp(2.1rem,6.8vw,3.7rem)", lineHeight:1.4,
                letterSpacing:"0.03em", marginBottom:"30px",
                fontWeight:800, fontFamily:Fs,
              }}>
                あなたと最も縁の深い<br />
                <span style={{ color:C.goldLight }}>「守護神社」</span>を<br />
                知っていますか？
              </h1>
            </FadeUp>

            {/* Poem */}
            <FadeUp delay={0.22}>
              <div style={{
                marginBottom:"28px", paddingLeft:"18px",
                borderLeft:`2px solid ${C.goldB2}`,
              }}>
                <p style={{
                  color:C.creamDim, fontSize:"clamp(0.97rem,2vw,1.05rem)",
                  lineHeight:2.3, fontStyle:"italic",
                }}>
                  生まれた土地。<br />
                  家族が受け継いできた土地。<br />
                  今、あなたが暮らしている土地。<br /><br />
                  そのすべてには、あなたを静かに見守る<br />
                  <em style={{ color:C.cream, fontStyle:"normal" }}>"ご縁"</em>があるかもしれません。
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.29}>
              <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:2, marginBottom:"36px" }}>
                「守護神社」とは、生まれ・家系・土地との縁から導き出される、あなただけの神社。<br />
                生年月日をもとに、全国31,247社の中から無料で診断します。
              </p>
            </FadeUp>

            {/* Stats */}
            <FadeUp delay={0.35}>
              <div style={{ display:"flex", gap:"10px", marginBottom:"36px", flexWrap:"wrap" }}>
                {[["31,247社","収録神社"],["87,341件","累計診断"],["47都道府県","全国対応"]].map(([n,l])=>(
                  <div key={l} style={{
                    padding:"9px 16px",
                    background:"rgba(5,7,13,.75)", border:`1px solid ${C.goldBorder}`,
                    borderRadius:"8px", backdropFilter:"blur(8px)",
                  }}>
                    <p style={{ fontFamily:Fd, fontSize:"0.95rem", fontWeight:700, color:C.gold, lineHeight:1.1 }}>{n}</p>
                    <p style={{ fontSize:"0.6rem", color:C.creamMute, marginTop:"2px", letterSpacing:"0.06em" }}>{l}</p>
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* CTA */}
            <FadeUp delay={0.42}>
              <button
                onClick={scrollToForm}
                className="g-btn g-green"
                style={{
                  display:"block", width:"100%", maxWidth:"440px",
                  padding:"21px 24px",
                  border:`1px solid ${C.greenBorder}`, borderRadius:"12px",
                  color:C.cream, fontSize:"clamp(1rem,2.5vw,1.1rem)",
                  fontWeight:800, letterSpacing:"0.1em",
                  boxShadow:"0 4px 32px rgba(0,0,0,.6)",
                  fontFamily:Fs, marginBottom:"16px",
                }}
              >
                今すぐ無料で守護神社を調べる
              </button>
              <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
                {["完全無料","登録不要","生年月日だけ","約30秒で完了"].map(t=>(
                  <span key={t} style={{ fontSize:"0.72rem", color:C.creamMute, display:"flex", alignItems:"center", gap:"4px" }}>
                    <span style={{ color:C.green, fontSize:"0.6rem" }}>✓</span> {t}
                  </span>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>

        {/* Bottom fade */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"130px", background:`linear-gradient(to top,${C.bg},transparent)`, pointerEvents:"none" }} />
        {/* Scroll indicator */}
        <div style={{ position:"absolute", bottom:"30px", left:"50%", animation:"g-float 3.5s ease-in-out infinite" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"6px" }}>
            <div style={{ width:"1px", height:"42px", background:`linear-gradient(to bottom,transparent,${C.goldBorder})` }} />
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
            <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", textAlign:"center", lineHeight:2.1, marginBottom:"8px" }}>
              神社への関心の有無は関係ありません。
            </p>
            <p style={{ color:C.creamMute, fontSize:"clamp(0.9rem,1.8vw,0.97rem)", textAlign:"center", lineHeight:1.9, marginBottom:"52px" }}>
              一つでも思い当たることがあれば、この先を読み進めてください。
            </p>
          </FadeUp>

          <div style={{ maxWidth:"720px", margin:"0 auto" }}>
            {WORRIES.map((w,i)=>(
              <FadeUp key={i} delay={i*.05}>
                <div style={{
                  display:"flex", gap:"22px", alignItems:"flex-start",
                  padding:"22px 0",
                  borderBottom:`1px solid ${C.goldBorder}`,
                }}>
                  <span style={{
                    fontFamily:Fd, fontSize:"2.1rem", fontWeight:700,
                    color:C.gold, opacity:0.18, lineHeight:1,
                    minWidth:"48px", textAlign:"right", flexShrink:0,
                    paddingTop:"2px",
                  }}>
                    {String(i+1).padStart(2,"0")}
                  </span>
                  <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:1.98 }}>{w}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp>
            <div style={{
              maxWidth:"720px", margin:"40px auto 0",
              padding:"26px 28px",
              background:"rgba(100,25,25,.09)", border:"1px solid rgba(180,80,60,.18)",
              borderLeft:"3px solid rgba(200,100,80,.25)",
              borderRadius:"12px",
            }}>
              <p style={{ color:"rgba(240,215,200,.85)", fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:2.15 }}>
                これらに共通するのは、<strong style={{ color:C.cream }}>「自分と縁の深い神社を知らないまま」</strong>過ごしてきたことかもしれません。<br />
                知らなかったのは、あなたのせいではありません。
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
        <div style={{
          position:"absolute", top:"35%", right:"3%",
          width:"460px", height:"380px", borderRadius:"50%",
          background:`radial-gradient(ellipse,${C.amberGlow} 0%,transparent 65%)`,
          pointerEvents:"none", animation:"g-glow 10s ease-in-out infinite",
        }} />

        <div style={{ ...maxW, position:"relative" }}>
          <FadeUp>
            <Tag text="What Is Guardian Shrine" />
            <H2 style={{ textAlign:"center" }}>守護神社とは、何ですか？</H2>
          </FadeUp>

          <div style={{ maxWidth:"720px", margin:"0 auto" }}>
            <FadeUp delay={0.07}>
              <Body style={{ marginBottom:"22px" }}>
                多くの方は「神社はどこも同じ場所」だと思っています。もちろん、どの神社も尊い場所です。
              </Body>
              <Body style={{ marginBottom:"22px" }}>
                しかし日本には古くから、こんな考え方があります。
              </Body>
            </FadeUp>

            <FadeUp delay={0.12}>
              <PullQuote>
                「人は生まれた土地、家系が受け継いできた土地、今いる土地それぞれに深い縁があり、<br />
                その縁を見守る神様がいる」
              </PullQuote>
            </FadeUp>

            <FadeUp delay={0.17}>
              <Body style={{ marginBottom:"22px" }}>
                これが「守護神社」の根本にある考え方です。
              </Body>
              <Body style={{ marginBottom:"22px" }}>
                有名な神社、話題のパワースポット、友人に勧められた場所。どこも尊い場所ですが、それはあなた自身の縁とは別のものです。
              </Body>
              <Body style={{ marginBottom:"32px" }}>
                あなたに縁の深い神社は、全国31,247社の中に、静かに存在しているかもしれません。
              </Body>
            </FadeUp>

            <FadeUp delay={0.22}>
              <div style={{
                padding:"28px 30px",
                background:`linear-gradient(135deg,rgba(20,14,8,.92),rgba(12,9,5,.96))`,
                border:`1px solid ${C.goldBorder}`, borderLeft:`3px solid ${C.gold}`,
                borderRadius:"14px",
              }}>
                <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:2.3, fontStyle:"italic" }}>
                  「なぜか心が落ち着く神社がある」<br />
                  「人生の節目に、不思議と引き寄せられる場所がある」<br /><br />
                  そうした感覚は、守護神社との縁によるものかもしれません。
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S04  なぜ知る人が少ないのか
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bg, position:"relative", overflow:"hidden" }}>
        {/* 忘 watermark */}
        <div style={{
          position:"absolute", top:"50%", right:"-20px", transform:"translateY(-50%)",
          fontSize:"clamp(200px,44vw,380px)", color:C.gold, opacity:.022,
          fontFamily:Fs, fontWeight:800, lineHeight:1,
          pointerEvents:"none", userSelect:"none",
          animation:"g-breathe 12s ease-in-out infinite",
        }}>忘</div>

        <div style={{ ...maxW, position:"relative" }}>
          <FadeUp>
            <Tag text="A Lost Connection" />
            <H2 style={{ textAlign:"center" }}>なぜ今、自分の守護神社を<br />知る人が少なくなったのか</H2>
          </FadeUp>

          <div style={{ maxWidth:"720px", margin:"0 auto" }}>
            <FadeUp delay={0.07}>
              <Body style={{ marginBottom:"22px" }}>
                「産土神社を知っていますか？」——この問いにすぐ答えられる人は、今の日本にほとんどいません。<br />
                でも100年前は違いました。
              </Body>
              <Body style={{ marginBottom:"22px" }}>
                産土神社・氏神神社・鎮守神社という考え方は、もともと日本人の生活に深く根づいていました。生まれた土地の神様に見守られながら育ち、家系が受け継いできた縁を大切にし、今いる場所の神様に日々を支えてもらう。それは信仰というよりも、生活の中に溶け込んだ「当たり前の感覚」でした。
              </Body>
            </FadeUp>

            {/* Before / After visual */}
            <FadeUp delay={0.13}>
              <div style={{ display:"flex", gap:"0", marginBottom:"32px" }}>
                <div style={{
                  flex:1, padding:"20px 22px",
                  background:C.goldFaint, border:`1px solid ${C.goldBorder}`,
                  borderRadius:"12px 0 0 12px",
                }}>
                  <p style={{ fontFamily:Fd, fontSize:"0.58rem", letterSpacing:"0.45em", color:C.gold, marginBottom:"10px" }}>過去</p>
                  <p style={{ color:C.cream, fontSize:"clamp(0.9rem,1.8vw,0.97rem)", lineHeight:1.85, fontWeight:700 }}>
                    産土・氏神・鎮守が<br />生活に溶け込んでいた
                  </p>
                </div>
                <div style={{
                  display:"flex", alignItems:"center", justifyContent:"center",
                  width:"44px", flexShrink:0,
                  background:C.bg,
                }}>
                  <span style={{ color:C.gold, opacity:.45, fontSize:"1.4rem" }}>→</span>
                </div>
                <div style={{
                  flex:1, padding:"20px 22px",
                  background:C.warn, border:`1px solid ${C.warnBorder}`,
                  borderRadius:"0 12px 12px 0",
                }}>
                  <p style={{ fontFamily:Fd, fontSize:"0.58rem", letterSpacing:"0.45em", color:"#c07878", marginBottom:"10px" }}>現在</p>
                  <p style={{ color:C.creamDim, fontSize:"clamp(0.9rem,1.8vw,0.97rem)", lineHeight:1.85 }}>
                    ほとんどの人が<br />守護神社を知らない
                  </p>
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0.18}>
              <Body style={{ marginBottom:"16px" }}>
                明治以降の近代化、戦後の急速な都市化と核家族化が進む中で、地域と家系のつながりは急速に薄れていきました。
              </Body>
              <div style={{ paddingLeft:"18px", borderLeft:`2px solid rgba(201,155,77,.15)`, marginBottom:"28px" }}>
                {["生まれた土地を離れ、都市に移住する","親の故郷を知らずに育つ","近所の神社の名前すら知らない暮らし"].map((item,i)=>(
                  <p key={i} style={{ color:C.creamMute, fontSize:"clamp(0.93rem,1.9vw,1rem)", lineHeight:1.85, marginBottom:i<2?"6px":"0" }}>
                    — {item}
                  </p>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={0.23}>
              <div style={{
                padding:"26px 28px",
                background:C.goldFaint, border:`1px solid ${C.goldBorder}`,
                borderRadius:"12px",
              }}>
                <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:2.15 }}>
                  知らなくなったのは、あなたのせいではありません。<br />
                  時代の変化が、その知識を届けにくくしたのです。<br /><br />
                  でも今は、その縁を取り戻せる時代でもあります。
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S05  三つの守護神社 — 視覚的山場②
      ══════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden" }}>
        {/* Background image */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:"url('/images/guardian-three-shrines.webp')",
          backgroundSize:"cover", backgroundPosition:"center 40%",
          backgroundRepeat:"no-repeat",
        }} />
        {/* Dark overlay: top and bottom dark, center lighter to show image */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(5,7,13,.98) 0%,rgba(5,7,13,.78) 28%,rgba(5,7,13,.55) 52%,rgba(5,7,13,.75) 72%,rgba(5,7,13,.98) 100%)",
        }} />

        <div style={{ position:"relative", ...SP }}>
          <div style={maxW}>
            <FadeUp>
              <Tag text="Three Guardian Shrines" />
              <H2 style={{ textAlign:"center" }}>あなたを見守る神社は、<br />ひとつとは限りません。</H2>
              <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", textAlign:"center", lineHeight:2.15, maxWidth:"660px", margin:"0 auto 56px" }}>
                古くから日本では、人と土地の間には深い縁があると考えられてきました。生まれた土地、家系が守り続けてきた土地、そして今暮らしている土地。それぞれに、あなたの人生を静かに支える「守り」があります。
              </p>
            </FadeUp>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(275px,1fr))", gap:"18px" }}>
              {SHRINES.map((s,i)=>(
                <FadeUp key={i} delay={i*.1}>
                  <div
                    className="g-shrine-card"
                    style={{
                      padding:"34px 28px",
                      background:"rgba(5,7,13,.84)",
                      backdropFilter:"blur(18px)",
                      border:`1px solid ${s.accent}38`,
                      borderTop:`3px solid ${s.accent}`,
                      borderRadius:"16px",
                      position:"relative", overflow:"hidden",
                    }}
                  >
                    {/* Icon watermark */}
                    <div style={{
                      position:"absolute", bottom:"10px", right:"16px",
                      fontSize:"5.5rem", color:s.accent, opacity:.055,
                      fontFamily:Fs, fontWeight:800, lineHeight:1, pointerEvents:"none",
                    }}>{s.icon}</div>
                    <p style={{ fontFamily:Fd, fontSize:"0.58rem", letterSpacing:"0.34em", color:s.accent, marginBottom:"8px", opacity:.82 }}>{s.reading}</p>
                    <h3 style={{ fontSize:"clamp(1.15rem,2.6vw,1.32rem)", fontWeight:800, color:C.cream, marginBottom:"6px", fontFamily:Fs }}>{s.name}</h3>
                    <p style={{ fontFamily:Fd, fontSize:"0.72rem", color:s.accent, opacity:.75, marginBottom:"18px", letterSpacing:"0.06em" }}>{s.meaning}</p>
                    <p style={{ color:C.creamDim, fontSize:"clamp(0.95rem,1.9vw,1.02rem)", lineHeight:2 }}>{s.desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S06  なぜ知ることが人生のヒントになるのか
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bgNavy, position:"relative", overflow:"hidden" }}>
        <div style={{
          position:"absolute", top:"50%", right:"-30px", transform:"translateY(-50%)",
          fontSize:"clamp(200px,44vw,380px)", color:C.gold, opacity:.023,
          fontFamily:Fs, fontWeight:800, lineHeight:1,
          pointerEvents:"none", userSelect:"none",
          animation:"g-breathe 11s ease-in-out infinite",
        }}>縁</div>

        <div style={{ ...maxW, position:"relative" }}>
          <FadeUp>
            <Tag text="Why It Matters" />
            <H2 style={{ textAlign:"center" }}>なぜ、守護神社を知ることが<br />人生のヒントになるのか</H2>
          </FadeUp>

          <div style={{ maxWidth:"720px", margin:"0 auto" }}>
            <FadeUp delay={0.07}>
              <Body style={{ marginBottom:"22px" }}>
                守護神社を知ることは、未来を占うことではありません。
              </Body>
              <Body style={{ marginBottom:"22px" }}>
                自分のルーツ、土地との縁、今いる場所との関係性を整理することで、自分という人間をもう少し深く理解するための<strong style={{ color:C.cream }}>「地図」</strong>を手に入れることです。
              </Body>
            </FadeUp>

            <FadeUp delay={0.12}>
              <div style={{
                padding:"28px 28px",
                background:C.goldFaint, border:`1px solid ${C.goldBorder}`,
                borderRadius:"14px", marginBottom:"28px",
              }}>
                <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:2.3 }}>
                  「今なぜかうまくいかない」「大切な決断を前に迷っている」「何かに引っかかったまま前に進めない」<br /><br />
                  そういうとき、自分のルーツや縁を見直すことで、意外な視点が生まれることがあります。
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.17}>
              <PullQuote>
                守護神社を知るのは、あなたの人生を決めつけることではありません。<br />
                自分がどんな流れの中にいて、どんな場所と縁が深く、どこに意識を向けると前に進みやすいのかを知るための、ひとつの視点です。
              </PullQuote>
            </FadeUp>

            <FadeUp delay={0.22}>
              <Body>
                有名だから、話題だから、友人に勧められたから。そういった理由で参拝先を選ぶことは、<strong style={{ color:C.cream }}>「他の人の処方箋で書かれた薬を、自分の診断なしに飲み続けること」</strong>に似ているかもしれません。
              </Body>
            </FadeUp>
          </div>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S07  診断でわかること
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bg }}>
        <div style={maxW}>
          <FadeUp>
            <Tag text="What You'll Discover" />
            <H2 style={{ textAlign:"center" }}>この診断でわかること</H2>
            <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", textAlign:"center", lineHeight:2, marginBottom:"52px" }}>
              生年月日と今のあなたの状況から、8つのことをお伝えします。
            </p>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:"14px" }}>
            {DIAG.map((item,i)=>(
              <FadeUp key={i} delay={i*.04}>
                <div style={{
                  padding:"24px 22px",
                  background:`linear-gradient(145deg,rgba(12,16,26,.92),rgba(7,9,16,.96))`,
                  border:`1px solid ${C.goldBorder}`, borderRadius:"14px",
                  position:"relative", overflow:"hidden", height:"100%",
                }}>
                  <p style={{ fontFamily:Fd, fontSize:"0.58rem", letterSpacing:"0.38em", color:C.gold, marginBottom:"10px", opacity:.65 }}>{item.no}</p>
                  <h3 style={{ color:C.cream, fontSize:"clamp(0.95rem,1.9vw,1.02rem)", fontWeight:700, marginBottom:"10px", lineHeight:1.5 }}>{item.title}</h3>
                  <p style={{ color:C.creamMute, fontSize:"clamp(0.88rem,1.7vw,0.94rem)", lineHeight:1.85 }}>{item.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S08  診断ロジック — 視覚的山場③
      ══════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden" }}>
        {/* Background image */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:"url('/images/guardian-elements.webp')",
          backgroundSize:"cover", backgroundPosition:"center center",
          backgroundRepeat:"no-repeat",
        }} />
        {/* Strong overlay — mystical, trust-building */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(3,4,8,.96) 0%,rgba(3,4,8,.88) 50%,rgba(3,4,8,.97) 100%)",
        }} />
        {/* Subtle center glow */}
        <div style={{
          position:"absolute", top:"40%", left:"50%", transform:"translate(-50%,-50%)",
          width:"700px", height:"500px", borderRadius:"50%",
          background:`radial-gradient(ellipse,${C.goldGlow} 0%,transparent 60%)`,
          pointerEvents:"none",
        }} />

        <div style={{ position:"relative", ...SP }}>
          <div style={maxW}>
            <FadeUp>
              <Tag text="Diagnosis Logic" />
              <H2 style={{ textAlign:"center" }}>生年月日と神社データをもとに、<br />あなたのご縁を丁寧に読み解きます。</H2>
              <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", textAlign:"center", lineHeight:2.1, maxWidth:"660px", margin:"0 auto 52px" }}>
                本診断では、生年月日から読み取れる運気の傾向に加え、陰陽五行の考え方、地域との縁、全国の神社データを組み合わせて、あなたに縁の深い守護神社を導き出します。
              </p>
            </FadeUp>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(268px,1fr))", gap:"16px" }}>
              {LOGIC.map((card,i)=>(
                <FadeUp key={i} delay={i*.08}>
                  <div style={{
                    padding:"28px 24px",
                    background:"rgba(5,7,13,.86)",
                    backdropFilter:"blur(14px)",
                    border:`1px solid ${C.goldBorder}`, borderRadius:"14px",
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"16px" }}>
                      <span style={{ fontFamily:Fd, fontSize:"0.7rem", color:C.gold, fontWeight:700, opacity:.7, minWidth:"22px" }}>{card.no}</span>
                      <div style={{ flex:1, height:"1px", background:C.goldBorder }} />
                    </div>
                    <h3 style={{ color:C.cream, fontSize:"clamp(1rem,2.1vw,1.1rem)", fontWeight:700, marginBottom:"11px" }}>{card.title}</h3>
                    <p style={{ color:C.creamDim, fontSize:"clamp(0.92rem,1.8vw,0.98rem)", lineHeight:1.95 }}>{card.desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>

            <FadeUp>
              <p style={{ color:C.creamMute, fontSize:"0.8rem", textAlign:"center", marginTop:"30px", lineHeight:1.8 }}>
                ※ 本診断は数千年にわたって継承されてきた思想体系に基づいていますが、現代科学とは異なります。<br />
                断定的な予言はせず、参拝先選びのヒントとしてご活用ください。
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S09  体験者の声
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bgWarm }}>
        <div style={maxW}>
          <FadeUp>
            <Tag text="Voices" />
            <H2 style={{ textAlign:"center" }}>守護神社診断を使った方の声</H2>
            <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", textAlign:"center", lineHeight:2, marginBottom:"52px" }}>
              「大きく変わった」という話ではなく、<br />
              静かに腑に落ちた方の声をご紹介します。
            </p>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"22px" }}>
            {VOICES.map((v,i)=>(
              <FadeUp key={i} delay={i*.09}>
                <div style={{
                  padding:"32px 26px",
                  background:`linear-gradient(145deg,rgba(14,11,8,.92),rgba(8,7,5,.96))`,
                  border:`1px solid ${C.goldBorder}`, borderRadius:"16px",
                  display:"flex", flexDirection:"column",
                }}>
                  {/* Pull quote highlight */}
                  <div style={{
                    padding:"10px 16px",
                    background:C.goldFaint, border:`1px solid ${C.goldBorder}`,
                    borderRadius:"8px", marginBottom:"20px",
                  }}>
                    <p style={{ fontFamily:Fd, fontSize:"0.68rem", letterSpacing:"0.04em", color:C.gold, lineHeight:1.7 }}>
                      「{v.pull}」
                    </p>
                  </div>
                  <div style={{ fontFamily:Fd, fontSize:"4rem", color:C.gold, opacity:.09, lineHeight:.7, marginBottom:"12px", fontWeight:700 }}>&ldquo;</div>
                  <p style={{ color:C.creamDim, fontSize:"clamp(0.95rem,1.9vw,1.02rem)", lineHeight:2.1, flex:1, marginBottom:"22px" }}>{v.text}</p>
                  <div style={{ borderTop:`1px solid ${C.goldBorder}`, paddingTop:"14px" }}>
                    <p style={{ color:C.creamMute, fontSize:"0.78rem", letterSpacing:"0.04em" }}>{v.label}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S10  無料診断フォーム（CTA）— 視覚的山場④前
      ══════════════════════════════════════════════════════ */}
      <section ref={formRef} id="diagnose" style={{ ...SP, background:C.bgNavy, position:"relative", overflow:"hidden" }}>
        <div style={{
          position:"absolute", top:"40%", left:"50%", transform:"translate(-50%,-50%)",
          width:"700px", height:"700px", borderRadius:"50%",
          background:`radial-gradient(ellipse,${C.goldGlow} 0%,transparent 60%)`,
          pointerEvents:"none",
        }} />

        <div style={{ ...maxW, position:"relative" }}>
          <FadeUp>
            <Tag text="Free Diagnosis" />
            <H2 style={{ textAlign:"center" }}>あなたのご縁を、<br />今すぐ無料で調べる</H2>
            <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", textAlign:"center", lineHeight:2.1, maxWidth:"600px", margin:"0 auto 48px" }}>
              生年月日を入力するだけで、あなたに縁の深い守護神社を診断できます。<br />
              難しい知識は一切不要。神社への関心がなくても診断できます。
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div style={{ maxWidth:"680px", margin:"0 auto" }}>
              <div style={{
                background:`linear-gradient(145deg,rgba(10,14,22,.92),rgba(6,8,14,.96))`,
                border:`1px solid ${C.goldBorder}`, borderRadius:"22px",
                padding:"clamp(28px,5vw,52px)",
              }}>
                {/* Theme selector */}
                <div style={{ marginBottom:"30px" }}>
                  <p style={{ fontFamily:Fd, fontSize:"0.6rem", letterSpacing:"0.42em", color:C.gold, marginBottom:"14px", opacity:.78 }}>
                    相談テーマ（任意・タップして診断へ）
                  </p>
                  <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                    {THEMES.map(theme=>(
                      <Link key={theme} href="/diagnose" style={{
                        padding:"9px 16px", background:C.goldFaint,
                        border:`1px solid ${C.goldBorder}`, borderRadius:"22px",
                        color:C.creamDim, fontSize:"clamp(0.85rem,1.6vw,0.92rem)",
                        textDecoration:"none", display:"inline-block",
                      }}>{theme}</Link>
                    ))}
                  </div>
                </div>

                {/* Steps */}
                <div style={{ display:"flex", marginBottom:"32px" }}>
                  {[{n:"01",l:"生年月日を入力"},{n:"02",l:"悩みを選択"},{n:"03",l:"守護神社を確認"}].map((step,i)=>(
                    <div key={step.n} style={{ flex:1, textAlign:"center", position:"relative" }}>
                      {i<2 && <div style={{ position:"absolute", top:"14px", right:0, width:"50%", height:"1px", background:`linear-gradient(to right,${C.goldBorder},transparent)` }} />}
                      <div style={{
                        width:"28px", height:"28px", borderRadius:"50%",
                        background:C.goldFaint, border:`1px solid ${C.goldBorder}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontFamily:Fd, fontSize:"0.6rem", color:C.gold, fontWeight:700,
                        margin:"0 auto 8px",
                      }}>{step.n}</div>
                      <p style={{ color:C.creamDim, fontSize:"clamp(0.75rem,1.4vw,0.82rem)", lineHeight:1.4 }}>{step.l}</p>
                    </div>
                  ))}
                </div>

                <Link href="/diagnose" className="g-btn g-green" style={{
                  display:"block", width:"100%",
                  padding:"22px 24px", border:`1px solid ${C.greenBorder}`,
                  borderRadius:"14px", color:C.cream,
                  fontSize:"clamp(1rem,2.5vw,1.1rem)",
                  fontWeight:800, letterSpacing:"0.1em",
                  textAlign:"center", textDecoration:"none",
                  boxShadow:"0 6px 36px rgba(0,0,0,.55)",
                  fontFamily:Fs, marginBottom:"16px",
                }}>
                  無料で守護神社を診断する
                </Link>

                <div style={{ display:"flex", justifyContent:"center", gap:"20px", flexWrap:"wrap" }}>
                  {["完全無料","登録不要","約30秒で完了"].map(t=>(
                    <span key={t} style={{ fontSize:"0.72rem", color:C.creamMute, display:"flex", alignItems:"center", gap:"4px" }}>
                      <span style={{ color:C.green, fontSize:"0.6rem" }}>✓</span> {t}
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
          S11  FAQ
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bg }}>
        <div style={maxW}>
          <FadeUp>
            <Tag text="FAQ" />
            <H2 style={{ textAlign:"center" }}>よくある質問</H2>
            <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", textAlign:"center", lineHeight:1.9, marginBottom:"48px" }}>
              ご不明な点はこちらでご確認いただけます。
            </p>
          </FadeUp>

          <div style={{ maxWidth:"720px", margin:"0 auto", display:"flex", flexDirection:"column", gap:"10px" }}>
            {FAQS.map((faq,i)=>(
              <FadeUp key={i} delay={i*.03}>
                <div style={{
                  background:`linear-gradient(145deg,rgba(10,14,22,.9),rgba(6,8,14,.94))`,
                  border:`1px solid ${C.goldBorder}`, borderRadius:"14px", overflow:"hidden",
                }}>
                  <button
                    onClick={()=>setOpenFaq(openFaq===i?null:i)}
                    style={{
                      width:"100%", padding:"18px 24px",
                      background:"transparent", border:"none", cursor:"pointer",
                      color:C.cream, fontSize:"clamp(0.95rem,1.9vw,1.03rem)", fontWeight:600,
                      textAlign:"left", display:"flex", justifyContent:"space-between",
                      alignItems:"center", gap:"16px", fontFamily:Fs, lineHeight:1.55,
                    }}
                  >
                    <span>Q. {faq.q}</span>
                    <span style={{
                      color:C.gold, fontSize:"1.2rem", flexShrink:0,
                      transition:"transform .3s ease",
                      transform:openFaq===i?"rotate(45deg)":"none",
                      display:"inline-block", opacity:.72,
                    }}>+</span>
                  </button>
                  <div className={`g-faq${openFaq===i?" open":""}`}>
                    <div style={{ padding:"0 24px 20px", borderTop:`1px solid rgba(201,155,77,.07)` }}>
                      <p style={{ color:C.creamDim, fontSize:"clamp(0.93rem,1.8vw,1rem)", lineHeight:2, paddingTop:"16px" }}>
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

      <OrnamentLine />

      {/* ══════════════════════════════════════════════════════
          S12  LINE 登録
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bgNavy }}>
        <div style={maxW}>
          <FadeUp>
            <Tag text="LINE Offer" color={C.green} />
            <H2 style={{ textAlign:"center" }}>診断結果をLINEで受け取ると、<br />さらに詳しく見られます。</H2>
            <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", textAlign:"center", lineHeight:2.1, maxWidth:"640px", margin:"0 auto 36px" }}>
              無料診断では守護神社の候補を確認できます。LINEで受け取ると、参拝のポイント、願いごとの方向性、今月意識したい開運アクションまで確認できます。
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div style={{ maxWidth:"580px", margin:"0 auto" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"10px", marginBottom:"26px" }}>
                {["診断結果の保存と再確認","参拝タイミングの案内","願いごとの方向性","今月の開運アクション"].map((item,i)=>(
                  <div key={i} style={{
                    display:"flex", gap:"12px",
                    padding:"15px 18px",
                    background:C.greenFaint, border:`1px solid ${C.greenBorder}`,
                    borderRadius:"12px", alignItems:"center",
                  }}>
                    <div style={{ flexShrink:0, width:"6px", height:"6px", borderRadius:"50%", background:C.green, opacity:.78 }} />
                    <p style={{ color:C.creamDim, fontSize:"clamp(0.9rem,1.7vw,0.96rem)", lineHeight:1.6 }}>{item}</p>
                  </div>
                ))}
              </div>

              <div style={{
                padding:"14px 18px",
                background:"rgba(5,7,13,.78)", border:`1px solid ${C.goldBorder}`,
                borderRadius:"10px", textAlign:"center", marginBottom:"24px",
              }}>
                <p style={{ color:C.creamMute, fontSize:"clamp(0.78rem,1.5vw,0.84rem)", lineHeight:1.85 }}>
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
                  width:"100%", padding:"20px 20px",
                  background:C.line, borderRadius:"14px",
                  color:"#fff", fontSize:"clamp(1rem,2.1vw,1.06rem)", fontWeight:800,
                  letterSpacing:"0.08em", textDecoration:"none",
                  boxShadow:"0 4px 28px rgba(6,199,85,.28)",
                  fontFamily:Fs, marginBottom:"10px",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 5.92 2 10.75c0 2.68 1.37 5.07 3.52 6.69-.16.56-.55 1.94-.63 2.24-.1.37.14.37.29.27.12-.08 1.91-1.26 2.68-1.77.64.1 1.3.15 1.97.15 5.52 0 10-3.92 10-8.75C22 5.92 17.52 2 12 2z"/>
                </svg>
                LINEで診断結果を受け取る
              </a>
              <p style={{ textAlign:"center", color:C.creamMute, fontSize:"0.7rem" }}>登録後、いつでも退会可能です</p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          S13  最終CTA — 視覚的山場④
      ══════════════════════════════════════════════════════ */}
      <section style={{
        padding:`clamp(100px,13vw,160px) ${PX} clamp(120px,15vw,180px)`,
        background:C.bg, borderTop:`1px solid ${C.goldBorder}`,
        position:"relative", overflow:"hidden",
      }}>
        {/* 守 watermark */}
        <div style={{
          position:"absolute", bottom:"-60px", left:"50%", transform:"translateX(-50%)",
          fontSize:"clamp(220px,58vw,420px)", color:C.gold, opacity:.021,
          fontFamily:Fs, fontWeight:800, lineHeight:1,
          pointerEvents:"none", userSelect:"none",
          animation:"g-breathe 13s ease-in-out infinite",
        }}>守</div>
        {/* Ambient center glow */}
        <div style={{
          position:"absolute", top:"40%", left:"50%", transform:"translate(-50%,-50%)",
          width:"800px", height:"600px", borderRadius:"50%",
          background:`radial-gradient(ellipse,${C.goldGlow} 0%,transparent 62%)`,
          pointerEvents:"none",
        }} />

        <div style={{ ...maxW, textAlign:"center", position:"relative" }}>
          <FadeUp>
            <div style={{
              display:"inline-block", padding:"5px 22px",
              background:C.goldFaint, border:`1px solid ${C.goldBorder}`,
              borderRadius:"30px", marginBottom:"36px",
            }}>
              <p style={{ fontFamily:Fd, fontSize:"0.58rem", letterSpacing:"0.46em", color:C.gold, fontWeight:600 }}>完全無料 ／ 登録不要</p>
            </div>

            <h2 style={{
              fontSize:"clamp(2rem,5.5vw,3.2rem)", marginBottom:"32px",
              lineHeight:1.45, fontWeight:800, fontFamily:Fs,
            }}>
              神社との縁は、<br />気づいた瞬間から始まります。
            </h2>

            <div style={{ maxWidth:"640px", margin:"0 auto 48px" }}>
              <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.08rem)", lineHeight:2.35, marginBottom:"22px", fontStyle:"italic" }}>
                あなたが生まれた場所。<br />
                今、暮らしている場所。<br />
                なぜか心惹かれる場所。
              </p>
              <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.08rem)", lineHeight:2.25 }}>
                そのすべてが、あなたの人生と静かにつながっているかもしれません。<br />
                まずは無料診断で、あなたに縁の深い守護神社を知ることから始めてみませんか。
              </p>
            </div>

            <Link href="/diagnose" className="g-btn g-green" style={{
              display:"block", width:"100%", maxWidth:"460px",
              margin:"0 auto 18px",
              padding:"24px 28px", border:`1px solid ${C.greenBorder}`,
              borderRadius:"16px", color:C.cream,
              fontSize:"clamp(1.05rem,2.6vw,1.18rem)",
              fontWeight:800, letterSpacing:"0.1em",
              textAlign:"center", textDecoration:"none",
              boxShadow:"0 8px 48px rgba(0,0,0,.6)",
              fontFamily:Fs,
            }}>
              今すぐ無料で守護神社を調べる
            </Link>

            <p style={{ color:C.creamMute, fontSize:"0.72rem", marginBottom:"72px", letterSpacing:"0.08em" }}>
              生年月日を入力するだけ ／ 所要時間 約30秒 ／ 全国31,247社対応
            </p>

            {/* P.S. */}
            <div style={{
              maxWidth:"560px", margin:"0 auto",
              padding:"30px 28px",
              background:C.goldFaint, border:`1px solid ${C.goldBorder}`,
              borderRadius:"18px", textAlign:"left",
            }}>
              <p style={{ fontFamily:Fd, fontSize:"0.58rem", letterSpacing:"0.46em", color:C.gold, fontWeight:600, marginBottom:"16px" }}>P.S.</p>
              <p style={{ color:C.creamDim, fontSize:"clamp(0.95rem,1.9vw,1.02rem)", lineHeight:2.25 }}>
                毎年、初詣に行くたびに「今年こそ」と思う。なんとなく神社が気になって、でも何かが足りないと感じる。<br /><br />
                それが、縁の深い神社との出会いを知らなかったことが理由の一つだとしたら。<br /><br />
                今日、あなたがここにたどり着いたことが、その縁の始まりかもしれません。
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding:`28px ${PX} 52px`,
        textAlign:"center",
        borderTop:`1px solid ${C.goldBorder}`,
        background:C.bg,
      }}>
        <div style={{ display:"flex", justifyContent:"center", gap:"32px", flexWrap:"wrap" }}>
          {[
            { href:"/",         label:"トップページ" },
            { href:"/diagnose", label:"守護神社診断" },
            { href:"/map",      label:"神社マップ" },
          ].map(l=>(
            <Link key={l.href} href={l.href} style={{
              color:C.creamMute, fontSize:"0.78rem",
              textDecoration:"none", letterSpacing:"0.1em",
            }}>{l.label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
