"use client";

import {
  useRef, useState, useEffect,
  type ReactNode, type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Image paths (canonical only) ───────────────────────────────────────────
const IMG = {
  heroDesktop:   "/images/guardian/assets/guardian-hero-desktop.webp",
  heroMobile:    "/images/guardian/assets/guardian-hero-mobile.webp",
  logicBg:       "/images/guardian/assets/guardian-logic-bg.webp",
  definitionBg:  "/images/guardian/assets/guardian-definition-bg.webp",
  finalCtaBg:    "/images/guardian/assets/guardian-final-cta-bg.webp",
  formBg:        "/images/guardian/assets/guardian-form-bg.webp",
  threeShrineBg: "/images/guardian/assets/guardian-three-shrines-bg.webp",
  introBg:       "/images/guardian/assets/guardian-intro-bg.webp",
  quotePanelBg:  "/images/guardian/assets/guardian-quote-panel-bg.webp",
  testimonialsBg:"/images/guardian/assets/guardian-testimonials-bg.webp",
} as const;

// ─── Tokens ──────────────────────────────────────────────────────────────────
const C = {
  ink:           "#04060b",
  deep:          "#020307",
  warmDark:      "#060407",
  gold:          "#C99B4D",
  goldLight:     "#E8C87C",
  goldFaint:     "rgba(201,155,77,0.06)",
  goldBorder:    "rgba(201,155,77,0.22)",
  goldB2:        "rgba(201,155,77,0.42)",
  goldGlow:      "rgba(201,155,77,0.14)",
  emerald:       "#4a8a68",
  emeraldBorder: "rgba(74,138,104,0.28)",
  lineGreen:     "#06C755",
  cream:         "#f5efe2",
  creamDim:      "rgba(245,239,226,0.72)",
  creamMute:     "rgba(245,239,226,0.36)",
} as const;

const Fd = "'Cormorant Garamond', Georgia, serif";
const Fs = "'Shippori Mincho B1','Hiragino Mincho ProN','Yu Mincho',serif";
const PX = "clamp(22px,5.5vw,80px)";

// ─── Data ─────────────────────────────────────────────────────────────────────
const WORRIES = [
  { n:"一", color:"#7a94c0", text:"初詣くらいしか神社に行かないが、「自分に縁の深い神社」というものをよく知らないまま何十年も過ごしてきた。" },
  { n:"二", color:"#C99B4D", text:"転職・結婚・引越しなど大切な決断の前に、どこかに手を合わせたいと思いながら、どこへ行けばいいか分からなかった。" },
  { n:"三", color:"#6aab8a", text:"産土神・氏神という言葉は聞いたことがあるが、自分とどんな関係があるのか、よく知らないままにしてきた。" },
  { n:"四", color:"#c07840", text:"信心深いわけではないが、もし自分と縁の深い場所があるなら、一度は知ってみたいと思っている。" },
  { n:"五", color:"#9870b0", text:"有名なパワースポットや話題の神社に行くが、それが本当に自分に合うかどうか分からないまま参拝している。" },
  { n:"六", color:"#a08840", text:"神社で手を合わせるとき、自分が誰に何を届けているのか、なんとなく分からないまま帰ることがある。" },
];

const SHRINES = [
  {
    name:"産土神社", reading:"うぶすなじんじゃ", icon:"産",
    accent:"#6aab8a",
    meaning:"魂の根と、生まれた縁を守る",
    desc:"あなたが生まれた土地と深く結びつく神社。持って生まれた性質、魂の出発点を象徴します。どれだけ遠く離れても、この縁は一生続くとされています。",
  },
  {
    name:"氏神神社", reading:"うじがみじんじゃ", icon:"氏",
    accent:"#C99B4D",
    meaning:"家系と家族の縁を守る",
    desc:"家系や地域のつながりを見守る神社。家族運、人間関係、先祖から受け継いできた流れを象徴します。「家の縁」が気になるときに思い出したい守護神社です。",
  },
  {
    name:"鎮守神社", reading:"ちんじゅじんじゃ", icon:"鎮",
    accent:"#7090c0",
    meaning:"今の暮らしと場所の縁を守る",
    desc:"今いる土地での日々の暮らしを見守る神社。仕事・健康・現在の環境との相性を象徴します。引越しや転職など、「今の場所」との縁が変わるタイミングで特に重要とされています。",
  },
];

const ELEMENTS = [
  { kanji:"木", color:"#4a8a5a", border:"rgba(74,138,90,.35)" },
  { kanji:"火", color:"#c04030", border:"rgba(192,64,48,.35)" },
  { kanji:"土", color:"#c09030", border:"rgba(192,144,48,.35)" },
  { kanji:"金", color:"#9098b8", border:"rgba(144,152,184,.35)" },
  { kanji:"水", color:"#3480c0", border:"rgba(52,128,192,.35)" },
];

const LOGIC = [
  { el:"木", color:"#4a8a5a", title:"生年月日", desc:"陰陽・干支・数秘術を組み合わせて、持って生まれた性質や運気の傾向を読み解きます。" },
  { el:"火", color:"#c04030", title:"陰陽五行", desc:"木・火・土・金・水のバランスから、どの神様のエネルギーと相性が深いかを判定します。" },
  { el:"土", color:"#c09030", title:"地域との縁", desc:"生まれた土地・現在地・生活圏との関係性を考慮。産土・氏神・鎮守の縁を丁寧に整理します。" },
  { el:"金", color:"#9098b8", title:"神社データ", desc:"全国31,247社のご祭神・地域性・歴史・参拝目的をもとに候補を整理。縁の深さで優先順位をつけます。" },
  { el:"水", color:"#3480c0", title:"AI解析", desc:"複数の要素を組み合わせ、あなたに最も縁の深い守護神社の候補を導き出します。" },
];

const VOICES = [
  {
    label:"30代 女性", job:"仕事の転機に悩んでいた",
    pull:"参拝してみると、気持ちが整理された",
    text:"最近、仕事を続けるべきか迷っていました。診断で出てきた神社が、昔から気になっていた場所で驚きました。参拝してみると気持ちが整理され、今やるべきことが少し見えた気がします。",
  },
  {
    label:"40代 女性", job:"家族関係に悩んでいた",
    pull:"何かが静かに腑に落ちた感覚",
    text:"家族との関係に疲れていた時期に診断しました。氏神神社という考え方を知り、自分の家系や土地とのつながりを改めて考えるきっかけになりました。大げさな変化ではないけれど、何かが静かに腑に落ちた感覚があります。",
  },
  {
    label:"40代 男性", job:"なんとなく気になって試した",
    pull:"こんな考え方があるんだと、素直に驚いた",
    text:"占いは信じないタイプですが、文化・歴史的な話として読んだら面白かった。産土神社という考え方は知らなかったし、診断で出てきた場所は確かに地元にある神社でした。",
  },
  {
    label:"50代 男性", job:"人生の節目に",
    pull:"静かに背中を押してくれるような内容",
    text:"退職後の暮らし方を考えていた時に利用しました。大げさな占いではなく、静かに背中を押してくれるような内容で素直に受け取れました。地元の神社に改めて足を運ぶようになり、心が少し軽くなりました。",
  },
];

const DIAG = [
  { no:"01", title:"縁の深い守護神社",      desc:"全国31,247社から縁の深さ順に神社を特定" },
  { no:"02", title:"生まれ持った性質",      desc:"五行属性と生年月日から本来の気質を読み解く" },
  { no:"03", title:"今の運気の流れ",        desc:"現在の運気の傾向と意識するとよい方向性" },
  { no:"04", title:"参拝のタイミング",      desc:"属性に合った参拝に適した時期・時間帯の目安" },
  { no:"05", title:"願いごとの方向性",      desc:"どの神社でどのような願いを届けると縁が深いか" },
  { no:"06", title:"人間関係・仕事のヒント",desc:"今の環境で意識するとよい視点と向き合い方" },
  { no:"07", title:"参拝の作法と心得",      desc:"拝礼・時間帯・方角など、知って行く参拝の基礎" },
  { no:"08", title:"開運アクション",        desc:"属性と縁に合わせた日常で取り入れやすい習慣" },
];

const FAQS = [
  { q:"診断に料金はかかりますか？",              a:"かかりません。診断の利用・結果の閲覧はすべて完全無料です。有料オプションや課金は一切ありません。" },
  { q:"登録や個人情報の入力は必要ですか？",      a:"不要です。メールアドレスや氏名などの個人情報は診断には必要ありません。LINEへの登録は任意です。" },
  { q:"生年月日以外に必要な情報はありますか？",  a:"生年月日のみで診断を開始できます。都道府県・性別は任意項目で、入力するとより詳細な結果が得られます。" },
  { q:"診断結果はどこで受け取れますか？",        a:"診断終了後にWebページで確認できます。LINEに登録すると結果の保存・再確認が可能です。" },
  { q:"複数の神社が表示されるのはなぜですか？",  a:"産土・氏神・鎮守という3種類の守護神社がそれぞれ導き出されるためです。縁の深さに応じて複数提案します。" },
  { q:"本当に自分に合った神社が分かりますか？",  a:"数千年にわたって継承されてきた思想体系に基づいていますが、現代科学とは異なります。参拝先選びのヒントとしてご活用ください。" },
  { q:"占いやスピリチュアルとは違うのですか？",  a:"西洋占星術やスピリチュアル系とは異なります。日本古来の産土信仰・五行・神社情報データベースに基づく文化的な診断です。" },
  { q:"スマートフォンからでも診断できますか？",  a:"できます。生年月日を入力するだけで、スマートフォンでも約30秒で診断結果が確認できます。" },
];

const THEMES = ["全般","仕事・事業","恋愛・縁結び","金運","家族・家庭","健康","人間関係","その他"];

const PREFECTURES = [
  "選択しない","北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県",
  "三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

// ─── Hook ─────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.07) {
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
      transform: inView ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.9s ease ${delay}s, transform 0.9s ease ${delay}s`,
      ...sx,
    }}>
      {children}
    </div>
  );
}

function SectionTag({ text, color = C.gold }: { text: string; color?: string }) {
  return (
    <div style={{ display:"flex", justifyContent:"center", marginBottom:"16px" }}>
      <span style={{
        fontFamily:Fd, fontSize:"0.58rem", letterSpacing:"0.55em",
        color, textTransform:"uppercase" as const,
        borderBottom:`1px solid ${color}30`, paddingBottom:"5px",
      }}>{text}</span>
    </div>
  );
}

function GoldLine() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"14px", margin:"0 auto 0", maxWidth:"320px" }}>
      <div style={{ flex:1, height:"1px", background:`linear-gradient(to right,transparent,${C.goldBorder})` }} />
      <svg width="22" height="22" viewBox="0 0 22 22">
        <rect x="7" y="7" width="8" height="8" fill="none" stroke={C.gold} strokeWidth="0.7" opacity="0.4" transform="rotate(45 11 11)" />
        <circle cx="11" cy="11" r="1.5" fill={C.gold} opacity="0.25" />
      </svg>
      <div style={{ flex:1, height:"1px", background:`linear-gradient(to left,transparent,${C.goldBorder})` }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GuardianV2() {
  const router  = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const [openFaq,     setOpenFaq]     = useState<number | null>(null);
  const [birthdate,   setBirthdate]   = useState("");
  const [prefecture,  setPrefecture]  = useState("選択しない");
  const [gender,      setGender]      = useState("");
  const [theme,       setTheme]       = useState("全般");

  const maxW: CSSProperties = { maxWidth:"960px", margin:"0 auto", width:"100%" };
  const SP: CSSProperties   = { padding:`clamp(72px,10vw,128px) ${PX}` };

  // ── CSS injection ──────────────────────────────────────────────────────────
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Shippori+Mincho+B1:wght@400;700;800&display=swap";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.setAttribute("data-gv2", "1");
    style.textContent = `
      @keyframes gv-zoom {
        from { transform: scale(1.07); }
        to   { transform: scale(1.0); }
      }
      @keyframes gv-breathe {
        0%,100% { opacity:.018; transform:scale(1); }
        50%     { opacity:.042; transform:scale(1.015); }
      }
      @keyframes gv-glow {
        0%,100% { opacity:.06; }
        50%     { opacity:.18; }
      }
      @keyframes gv-pulse {
        0%,100% { transform:scale(1);   opacity:.82; box-shadow:0 0 0   0px currentColor; }
        50%     { transform:scale(1.07);opacity:1;   box-shadow:0 0 20px 4px currentColor; }
      }
      @keyframes gv-float {
        0%,100% { transform:translateY(0px); }
        50%     { transform:translateY(-10px); }
      }
      @keyframes gv-shimmer {
        0%   { background-position: 200% center; }
        100% { background-position:-200% center; }
      }
      @keyframes gv-scroll-dot {
        0%,100% { opacity:.3; transform:translateX(-50%) translateY(0); }
        50%     { opacity:.7; transform:translateX(-50%) translateY(7px); }
      }
      @keyframes gv-particle {
        0%   { transform:translateY(0) translateX(0); opacity:0; }
        20%  { opacity:.55; }
        80%  { opacity:.25; }
        100% { transform:translateY(-90px) translateX(18px); opacity:0; }
      }
      @keyframes gv-light-sweep {
        0%   { opacity:0; transform:translateX(-30%); }
        50%  { opacity:.08; }
        100% { opacity:0; transform:translateX(130%); }
      }

      .gv-gold-btn {
        background: linear-gradient(135deg,#6a4a10,#8a6220,#6a4a10);
        cursor: pointer; position: relative; overflow: hidden;
        transition: transform .15s ease, box-shadow .2s ease;
      }
      .gv-gold-btn::after {
        content: '';
        position: absolute; inset: 0;
        background: linear-gradient(90deg,transparent 0%,rgba(255,255,255,.13) 50%,transparent 100%);
        background-size: 200% 100%;
        animation: gv-shimmer 3.2s ease-in-out infinite;
      }
      .gv-gold-btn:hover {
        background: linear-gradient(135deg,#7a5818,#9a7228,#7a5818);
        box-shadow: 0 10px 44px rgba(0,0,0,.7), 0 0 32px rgba(201,155,77,.25) !important;
      }
      .gv-gold-btn:active { transform: scale(.98) !important; }

      .gv-green-btn {
        background: linear-gradient(135deg,#143020,#1d4530,#143020);
        cursor: pointer; position: relative; overflow: hidden;
        transition: transform .15s ease, box-shadow .2s ease;
      }
      .gv-green-btn:hover {
        background: linear-gradient(135deg,#1d4530,#264838,#1d4530);
        box-shadow: 0 10px 44px rgba(0,0,0,.7), 0 0 28px rgba(74,138,104,.28) !important;
      }
      .gv-green-btn:active { transform: scale(.98) !important; }

      .gv-card-hover {
        transition: transform .3s ease, box-shadow .3s ease;
      }
      .gv-card-hover:hover {
        transform: translateY(-5px);
        box-shadow: 0 16px 48px rgba(0,0,0,.65), 0 0 22px rgba(201,155,77,.10) !important;
      }

      .gv-shrine-card {
        transition: transform .3s ease, border-color .3s ease;
      }
      .gv-shrine-card:hover {
        transform: translateY(-6px);
      }

      .gv-orb {
        transition: transform .3s ease;
        animation: gv-pulse 3.5s ease-in-out infinite;
      }
      .gv-orb:hover { transform: scale(1.12) !important; }

      .gv-faq-body { max-height:0; overflow:hidden; opacity:0; transition:max-height .5s cubic-bezier(.4,0,.2,1),opacity .4s ease; }
      .gv-faq-body.open { max-height:300px; opacity:1; }

      .gv-input {
        transition: border-color .2s ease, box-shadow .2s ease;
      }
      .gv-input:focus {
        border-color: rgba(201,155,77,.55) !important;
        box-shadow: 0 0 0 3px rgba(201,155,77,.12);
        outline: none;
      }

      .gv-sticky { display: none; }
      @media (max-width: 768px) {
        .gv-sticky { display: flex; }
        .gv-hero-desktop-img { display: none !important; }
        .gv-def-img { display: none !important; }
      }
      @media (min-width: 769px) {
        .gv-hero-mobile-bg { background-image: none !important; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: .01ms !important;
          transition-duration: .01ms !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      try { document.head.removeChild(link); } catch {}
      const s = document.querySelector("style[data-gv2]");
      if (s) try { document.head.removeChild(s); } catch {}
    };
  }, []);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleDiagnose() {
    const params = new URLSearchParams();
    if (birthdate) {
      const [y, m, d] = birthdate.split("-");
      if (y) params.set("year",  y);
      if (m) params.set("month", m);
      if (d) params.set("day",   d);
    }
    router.push(`/diagnose?${params.toString()}`);
  }

  const ToriiIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M3 9h18"/><path d="M5 9V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
      <path d="M12 5V3"/><path d="M7 9v12"/><path d="M17 9v12"/><path d="M9 21h6"/>
    </svg>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background:C.ink, color:C.cream, minHeight:"100vh", fontFamily:Fs, WebkitFontSmoothing:"antialiased" }}>

      {/* ── Mobile sticky CTA ──────────────────────────────────────────────── */}
      <div className="gv-sticky" style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:50,
        padding:"10px 16px 12px",
        background:"rgba(4,6,11,.97)",
        borderTop:`1px solid ${C.goldBorder}`,
        alignItems:"center",
      }}>
        <button onClick={scrollToForm} className="gv-gold-btn" style={{
          flex:1, width:"100%",
          display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
          padding:"14px 20px", border:"none", borderRadius:"10px",
          color:"#fff", fontSize:"0.95rem", fontWeight:800,
          letterSpacing:"0.1em", fontFamily:Fs,
          boxShadow:"0 4px 24px rgba(0,0,0,.7)",
        }}>
          <ToriiIcon />
          今すぐ無料で守護神社を調べる
        </button>
      </div>


      {/* ═══════════════════════════════════════════════════════════
          S01  HERO
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", minHeight:"100svh", display:"flex", alignItems:"center", overflow:"hidden" }}>

        {/* Desktop BG image — shrine visible on right */}
        <div className="gv-hero-desktop-img" style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.heroDesktop}')`,
          backgroundSize:"cover", backgroundPosition:"60% center",
          animation:"gv-zoom 2.2s ease-out forwards",
        }} />
        {/* Desktop overlay: left dark for text, right lighter for shrine visibility */}
        <div className="gv-hero-desktop-img" style={{
          position:"absolute", inset:0,
          background:"linear-gradient(100deg,rgba(4,6,11,.98) 0%,rgba(4,6,11,.92) 38%,rgba(4,6,11,.52) 62%,rgba(4,6,11,.18) 100%)",
        }} />

        {/* Mobile BG image */}
        <div className="gv-hero-mobile-bg" style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.heroMobile}')`,
          backgroundSize:"cover", backgroundPosition:"center 20%",
        }} />
        <div className="gv-hero-mobile-bg" style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(4,6,11,.82) 0%,rgba(4,6,11,.55) 40%,rgba(4,6,11,.88) 100%)",
        }} />

        {/* Amber glow */}
        <div style={{
          position:"absolute", top:"20%", left:"6%",
          width:"500px", height:"500px", borderRadius:"50%",
          background:`radial-gradient(ellipse,${C.goldGlow} 0%,transparent 65%)`,
          pointerEvents:"none", animation:"gv-glow 9s ease-in-out infinite",
        }} />

        {/* Floating particles */}
        {[...Array(7)].map((_,i)=>(
          <div key={i} style={{
            position:"absolute",
            left:`${6+i*11}%`, bottom:`${18+i*4}%`,
            width:"2.5px", height:"2.5px", borderRadius:"50%",
            background:C.gold, opacity:0,
            animation:`gv-particle ${4.2+i*.6}s ease-in ${i*.55}s infinite`,
          }} />
        ))}

        {/* Text block */}
        <div style={{ position:"relative", padding:`100px ${PX} 90px`, ...maxW }}>
          <div style={{ maxWidth:"560px" }}>

            <FadeUp delay={0.05}>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:"8px",
                padding:"5px 16px 5px 12px",
                background:"rgba(201,155,77,.08)", border:`1px solid ${C.goldBorder}`,
                borderRadius:"30px", marginBottom:"28px",
              }}>
                <ToriiIcon />
                <span style={{ fontFamily:Fd, fontSize:"0.58rem", letterSpacing:"0.44em", color:C.gold, fontWeight:600 }}>
                  守護神社診断
                </span>
              </div>
            </FadeUp>

            <FadeUp delay={0.12}>
              <h1 style={{
                fontSize:"clamp(2.1rem,6.5vw,3.8rem)",
                fontWeight:800, fontFamily:Fs,
                lineHeight:1.44, letterSpacing:"0.02em",
                marginBottom:"28px",
                wordBreak:"keep-all",
              }}>
                あなたと最も縁の深い<br />
                <span style={{ color:C.goldLight }}>「守護神社」</span>を知っていますか？
              </h1>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p style={{
                color:C.creamDim,
                fontSize:"clamp(1rem,2.2vw,1.08rem)",
                lineHeight:2.1, marginBottom:"32px",
                maxWidth:"480px",
              }}>
                生まれた場所、家系、今の住まい。<br />
                生年月日をもとに、あなたの人生に<br className="gv-sp-br" />縁のある守護神社をお伝えします。
              </p>
            </FadeUp>

            {/* Badges */}
            <FadeUp delay={0.27}>
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"36px" }}>
                {["完全無料","登録不要","生年月日だけ","約30秒"].map(t=>(
                  <div key={t} style={{
                    padding:"5px 13px",
                    background:"rgba(4,6,11,.75)", border:`1px solid ${C.goldBorder}`,
                    borderRadius:"6px", backdropFilter:"blur(8px)",
                  }}>
                    <span style={{ fontFamily:Fd, fontSize:"0.63rem", color:C.gold, letterSpacing:"0.04em" }}>{t}</span>
                  </div>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={0.34}>
              <button onClick={scrollToForm} className="gv-gold-btn" style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
                padding:"20px 32px", border:"none", borderRadius:"10px",
                color:"#fff", fontSize:"clamp(1rem,2.4vw,1.1rem)",
                fontWeight:800, letterSpacing:"0.12em",
                fontFamily:Fs, width:"100%", maxWidth:"420px",
                boxShadow:"0 6px 40px rgba(0,0,0,.7),0 0 24px rgba(201,155,77,.18)",
              }}>
                <ToriiIcon />
                今すぐ無料で守護神社を調べる
              </button>
              <p style={{ marginTop:"12px", color:C.creamMute, fontSize:"0.78rem", letterSpacing:"0.04em" }}>
                登録不要・完全無料・いつでも解除OK
              </p>
            </FadeUp>
          </div>
        </div>

        {/* Bottom fade */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"160px", background:`linear-gradient(to top,${C.ink},transparent)`, pointerEvents:"none" }} />
        {/* Scroll indicator */}
        <div style={{ position:"absolute", bottom:"30px", left:"50%", animation:"gv-scroll-dot 2.6s ease-in-out infinite" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"5px" }}>
            <div style={{ width:"1px", height:"44px", background:`linear-gradient(to bottom,transparent,${C.goldBorder})` }} />
            <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:C.gold, opacity:.4 }} />
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          S02  共感・悩み — TAIYO 感情曲線 開始
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.warmDark }}>
        <div style={maxW}>
          <FadeUp>
            <SectionTag text="Does This Sound Familiar" />
            <h2 style={{
              fontSize:"clamp(1.8rem,4.5vw,2.8rem)", fontWeight:800, fontFamily:Fs,
              lineHeight:1.5, textAlign:"center", marginBottom:"16px",
              wordBreak:"keep-all",
            }}>
              こんなことを感じたことは<br />ありませんか？
            </h2>
            <p style={{ color:C.creamDim, textAlign:"center", lineHeight:2, marginBottom:"56px", fontSize:"clamp(1rem,2vw,1.06rem)" }}>
              神社への関心の有無は関係ありません。<br />一つでも当てはまることがあれば、この先を読み進めてください。
            </p>
          </FadeUp>

          {/* Large numbered list */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0" }}>
            {WORRIES.map((w, i) => (
              <FadeUp key={i} delay={i * 0.07}>
                <div style={{
                  display:"flex", alignItems:"flex-start", gap:"28px",
                  padding:"28px 0",
                  borderBottom: i < WORRIES.length - 1 ? `1px solid rgba(201,155,77,.10)` : "none",
                }}>
                  {/* Big kanji number */}
                  <div style={{
                    flexShrink:0,
                    fontFamily:Fd, fontSize:"clamp(2.6rem,6vw,3.8rem)",
                    fontWeight:700, color:w.color, opacity:.7,
                    lineHeight:1, minWidth:"50px", textAlign:"center",
                  }}>{w.n}</div>
                  {/* Text */}
                  <p style={{
                    color:C.creamDim, fontSize:"clamp(1rem,2.2vw,1.08rem)",
                    lineHeight:1.95, paddingTop:"6px",
                    wordBreak:"keep-all",
                  }}>{w.text}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp>
            <div style={{ marginTop:"48px", textAlign:"center" }}>
              <div style={{
                display:"inline-block",
                padding:"24px 36px",
                background:"rgba(201,155,77,.06)", border:`1px solid ${C.goldBorder}`,
                borderRadius:"12px",
              }}>
                <p style={{ fontSize:"clamp(1.05rem,2.4vw,1.18rem)", lineHeight:2, color:C.cream, wordBreak:"keep-all" }}>
                  その答えは、あなたに縁の深い<strong style={{ color:C.goldLight }}>「守護神社」</strong>が<br />
                  鍵かもしれません。
                </p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          PANORAMA BAND — intro-bg as visible atmospheric strip
      ═══════════════════════════════════════════════════════════ */}
      <div style={{
        position:"relative", height:"clamp(180px,28vw,320px)", overflow:"hidden",
      }}>
        <img src={IMG.introBg} alt="" style={{
          width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 40%",
          display:"block",
        }} />
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(4,6,11,.85) 0%,rgba(4,6,11,.35) 45%,rgba(4,6,11,.85) 100%)",
        }} />
        <div style={{
          position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <FadeUp>
            <p style={{
              fontFamily:Fd, fontSize:"clamp(1rem,2.8vw,1.6rem)",
              letterSpacing:"0.35em", color:C.gold, textAlign:"center",
              opacity:.9,
            }}>
              Discover Your Guardian Shrine
            </p>
          </FadeUp>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════
          S03  守護神社とは — DEFINITION  (Image + Text split)
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ background:C.ink, overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"stretch", flexWrap:"wrap" }}>

          {/* Image side — 45% on desktop, hidden on mobile */}
          <div className="gv-def-img" style={{
            flex:"0 0 45%", position:"relative", minHeight:"560px", overflow:"hidden",
          }}>
            <img src={IMG.definitionBg} alt="守護神社" style={{
              width:"100%", height:"100%", objectFit:"cover", objectPosition:"center",
              display:"block",
            }} />
            {/* subtle right-edge fade to blend into text */}
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(to right,transparent 50%,rgba(4,6,11,.95) 100%)",
            }} />
          </div>

          {/* Text side */}
          <div style={{ flex:"1 1 340px", padding:`clamp(56px,9vw,100px) ${PX}`, display:"flex", alignItems:"center" }}>
            <div style={{ maxWidth:"500px" }}>
              <FadeUp>
                <SectionTag text="What Is It" />
                <h2 style={{
                  fontSize:"clamp(1.8rem,4.5vw,2.8rem)", fontWeight:800, fontFamily:Fs,
                  lineHeight:1.5, marginBottom:"24px", wordBreak:"keep-all",
                }}>
                  守護神社とは、<br />何ですか？
                </h2>
              </FadeUp>
              <FadeUp delay={0.08}>
                <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:2.1, marginBottom:"24px" }}>
                  守護神社とは、あなたの生まれ・家系・現在地に縁のある神社のことです。有名な神社や話題のパワースポットではなく、あなた自身と深くつながっているとされる場所です。
                </p>
              </FadeUp>
              <FadeUp delay={0.14}>
                <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:2.1, marginBottom:"32px" }}>
                  産土（うぶすな）・氏神（うじがみ）・鎮守（ちんじゅ）の3種の守護神社が、あなたの魂の根、家系、そして今の暮らしをそれぞれ守るとされています。
                </p>
              </FadeUp>
              <FadeUp delay={0.2}>
                <div style={{
                  padding:"20px 24px",
                  borderLeft:`3px solid ${C.goldB2}`,
                  background:C.goldFaint,
                  borderRadius:"0 8px 8px 0",
                }}>
                  <p style={{ fontFamily:Fs, fontSize:"clamp(1rem,2.2vw,1.1rem)", lineHeight:1.9, color:C.cream, wordBreak:"keep-all" }}>
                    「縁のある神社を知って参拝することで、<br />
                    日常の中に静かな根拠と安心感が生まれる。」
                  </p>
                </div>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          S04  三守護神社 — THREE SHRINES
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden", ...SP }}>
        {/* BG image more visible */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.threeShrineBg}')`,
          backgroundSize:"cover", backgroundPosition:"center",
        }} />
        <div style={{
          position:"absolute", inset:0,
          background:"rgba(4,6,11,.70)",
        }} />

        <div style={{ ...maxW, position:"relative" }}>
          <FadeUp>
            <SectionTag text="Three Types" />
            <h2 style={{
              fontSize:"clamp(1.8rem,4.5vw,2.8rem)", fontWeight:800, fontFamily:Fs,
              lineHeight:1.5, textAlign:"center", marginBottom:"16px",
              wordBreak:"keep-all",
            }}>
              3つの守護神社が、<br />あなたを守っている
            </h2>
            <p style={{ color:C.creamDim, textAlign:"center", lineHeight:2, marginBottom:"56px", fontSize:"clamp(1rem,2vw,1.06rem)" }}>
              守護神社には3種類あり、それぞれ異なる役割を持っています。
            </p>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"20px" }}>
            {SHRINES.map((s, i) => (
              <FadeUp key={i} delay={i * 0.12}>
                <div className="gv-shrine-card" style={{
                  padding:"36px 28px",
                  background:"rgba(4,6,11,.88)",
                  border:`1px solid ${s.accent}44`,
                  borderTop:`3px solid ${s.accent}`,
                  borderRadius:"14px",
                  boxShadow:"0 8px 40px rgba(0,0,0,.5)",
                }}>
                  {/* Icon */}
                  <div style={{
                    width:"60px", height:"60px", borderRadius:"50%",
                    background:`${s.accent}18`, border:`1.5px solid ${s.accent}55`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:Fs, fontSize:"1.5rem", fontWeight:800, color:s.accent,
                    marginBottom:"20px",
                  }}>{s.icon}</div>
                  {/* Names */}
                  <div style={{ marginBottom:"8px" }}>
                    <span style={{ fontFamily:Fs, fontSize:"clamp(1.2rem,3vw,1.5rem)", fontWeight:800, color:C.cream }}>{s.name}</span>
                    <span style={{ display:"block", fontSize:"0.72rem", color:C.creamMute, letterSpacing:"0.12em", marginTop:"3px" }}>{s.reading}</span>
                  </div>
                  <p style={{ fontSize:"0.78rem", color:s.accent, letterSpacing:"0.06em", marginBottom:"18px", fontFamily:Fd }}>{s.meaning}</p>
                  <p style={{ color:C.creamDim, fontSize:"clamp(0.93rem,1.9vw,1rem)", lineHeight:1.95 }}>{s.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>

        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"100px", background:`linear-gradient(to top,${C.ink},transparent)`, pointerEvents:"none" }} />
      </section>


      {/* ═══════════════════════════════════════════════════════════
          S05  なぜ大切か — WHY IMPORTANT
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.warmDark }}>
        <div style={maxW}>
          <FadeUp>
            <SectionTag text="Why It Matters" />
            <h2 style={{
              fontSize:"clamp(1.8rem,4.5vw,2.8rem)", fontWeight:800, fontFamily:Fs,
              lineHeight:1.5, textAlign:"center", marginBottom:"56px",
              wordBreak:"keep-all",
            }}>
              守護神社を知ることで、<br />何が変わるのか
            </h2>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"24px" }}>
            {[
              { no:"01", title:"迷う時間が減る", desc:"大切な決断の前、どこに手を合わせればいいかが明確になります。" },
              { no:"02", title:"参拝の意味が深まる", desc:"縁のある神社への参拝が、漠然とした習慣から、意味を持つ時間に変わります。" },
              { no:"03", title:"自分の根が分かる", desc:"どんな土地に支えられてきたのかを知ることで、静かな自己理解が生まれます。" },
              { no:"04", title:"日常に安心感が生まれる", desc:"縁のある場所を知るだけで、日々の生活に小さな根拠と安心感が芽生えます。" },
            ].map((b, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div className="gv-card-hover" style={{
                  padding:"28px 26px",
                  background:"rgba(201,155,77,.04)", border:`1px solid ${C.goldBorder}`,
                  borderRadius:"12px",
                  boxShadow:"0 4px 24px rgba(0,0,0,.4)",
                }}>
                  <div style={{ fontFamily:Fd, fontSize:"0.6rem", letterSpacing:"0.4em", color:C.gold, marginBottom:"14px" }}>{b.no}</div>
                  <h3 style={{ fontSize:"clamp(1.05rem,2.5vw,1.2rem)", fontWeight:800, fontFamily:Fs, marginBottom:"12px", color:C.cream }}>{b.title}</h3>
                  <p style={{ color:C.creamDim, fontSize:"clamp(0.93rem,1.9vw,1rem)", lineHeight:1.95 }}>{b.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          S06  診断でわかること — WHAT YOU'LL LEARN
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.ink }}>
        <div style={maxW}>
          <FadeUp>
            <SectionTag text="What You'll Learn" />
            <h2 style={{
              fontSize:"clamp(1.8rem,4.5vw,2.8rem)", fontWeight:800, fontFamily:Fs,
              lineHeight:1.5, textAlign:"center", marginBottom:"56px",
              wordBreak:"keep-all",
            }}>
              この診断でわかること
            </h2>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"14px" }}>
            {DIAG.map((d, i) => (
              <FadeUp key={i} delay={i * 0.06}>
                <div style={{
                  display:"flex", gap:"14px", alignItems:"flex-start",
                  padding:"18px 18px",
                  border:`1px solid rgba(201,155,77,.12)`,
                  borderRadius:"10px",
                }}>
                  <div style={{
                    flexShrink:0, fontFamily:Fd, fontSize:"0.68rem", letterSpacing:"0.1em",
                    color:C.gold, opacity:.6, paddingTop:"3px",
                  }}>{d.no}</div>
                  <div>
                    <div style={{ fontWeight:800, fontFamily:Fs, fontSize:"clamp(0.95rem,2vw,1.03rem)", marginBottom:"5px", color:C.cream }}>{d.title}</div>
                    <div style={{ color:C.creamMute, fontSize:"0.85rem", lineHeight:1.8 }}>{d.desc}</div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          S07  診断ロジック / 五行 — LOGIC & ELEMENTS (視覚山場②)
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden", ...SP }}>
        {/* BG image — more visible */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.logicBg}')`,
          backgroundSize:"cover", backgroundPosition:"center",
        }} />
        <div style={{
          position:"absolute", inset:0,
          background:"rgba(4,6,11,.65)",
        }} />

        <div style={{ ...maxW, position:"relative" }}>
          <FadeUp>
            <SectionTag text="The Logic Behind It" color={C.goldLight} />
            <h2 style={{
              fontSize:"clamp(1.8rem,4.5vw,2.8rem)", fontWeight:800, fontFamily:Fs,
              lineHeight:1.5, textAlign:"center", marginBottom:"16px",
              wordBreak:"keep-all",
            }}>
              なぜ生年月日で<br />守護神社が分かるのか
            </h2>
            <p style={{ color:C.creamDim, textAlign:"center", lineHeight:2, marginBottom:"56px", fontSize:"clamp(1rem,2vw,1.06rem)" }}>
              5つの要素を組み合わせて、あなただけの守護神社を導き出します。
            </p>
          </FadeUp>

          {/* Five Element Orbs — 視覚山場 */}
          <FadeUp delay={0.1}>
            <div style={{ display:"flex", justifyContent:"center", gap:"clamp(12px,3vw,28px)", flexWrap:"wrap", marginBottom:"56px" }}>
              {ELEMENTS.map((el, i) => (
                <div key={i} className="gv-orb" style={{
                  width:"clamp(72px,12vw,96px)", height:"clamp(72px,12vw,96px)",
                  borderRadius:"50%",
                  background:`radial-gradient(circle at 35% 35%, ${el.color}55 0%, ${el.color}22 50%, ${el.color}08 100%)`,
                  border:`2px solid ${el.border}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:Fs, fontSize:"clamp(1.6rem,4vw,2.2rem)", fontWeight:800,
                  color:el.color,
                  boxShadow:`0 0 28px ${el.color}22, inset 0 0 14px ${el.color}18`,
                  animationDelay:`${i * 0.55}s`,
                  cursor:"default",
                }}>
                  {el.kanji}
                </div>
              ))}
            </div>
          </FadeUp>

          {/* Logic cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:"16px" }}>
            {LOGIC.map((l, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div style={{
                  padding:"22px 22px",
                  background:"rgba(4,6,11,.86)",
                  border:`1px solid ${l.color}33`,
                  borderLeft:`3px solid ${l.color}`,
                  borderRadius:"10px",
                }}>
                  <div style={{
                    display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px",
                  }}>
                    <span style={{ fontFamily:Fs, fontSize:"1.1rem", fontWeight:800, color:l.color }}>{l.el}</span>
                    <span style={{ fontFamily:Fs, fontSize:"clamp(0.95rem,2vw,1.03rem)", fontWeight:800, color:C.cream }}>{l.title}</span>
                  </div>
                  <p style={{ color:C.creamDim, fontSize:"0.89rem", lineHeight:1.9 }}>{l.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>

        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"100px", background:`linear-gradient(to top,${C.warmDark},transparent)`, pointerEvents:"none" }} />
      </section>


      {/* ═══════════════════════════════════════════════════════════
          S08  体験者の声 — TESTIMONIALS (視覚山場③)
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden", ...SP, background:C.warmDark }}>
        {/* BG image */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.testimonialsBg}')`,
          backgroundSize:"cover", backgroundPosition:"center",
          opacity:.22,
        }} />

        <div style={{ ...maxW, position:"relative" }}>
          <FadeUp>
            <SectionTag text="Voices" />
            <h2 style={{
              fontSize:"clamp(1.8rem,4.5vw,2.8rem)", fontWeight:800, fontFamily:Fs,
              lineHeight:1.5, textAlign:"center", marginBottom:"56px",
              wordBreak:"keep-all",
            }}>
              守護神社診断を受けた方の声
            </h2>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"20px" }}>
            {VOICES.map((v, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="gv-card-hover" style={{
                  padding:"30px 26px",
                  background:"rgba(4,6,11,.90)",
                  border:`1px solid ${C.goldBorder}`,
                  borderRadius:"14px",
                  boxShadow:"0 6px 32px rgba(0,0,0,.5)",
                }}>
                  {/* Pull quote */}
                  <div style={{
                    padding:"14px 18px",
                    background:C.goldFaint, borderLeft:`3px solid ${C.goldB2}`,
                    borderRadius:"0 8px 8px 0", marginBottom:"20px",
                  }}>
                    <p style={{ color:C.goldLight, fontFamily:Fs, fontSize:"clamp(0.95rem,2vw,1.02rem)", lineHeight:1.75, fontWeight:700 }}>
                      「{v.pull}」
                    </p>
                  </div>
                  {/* Body */}
                  <p style={{ color:C.creamDim, fontSize:"clamp(0.92rem,1.9vw,0.98rem)", lineHeight:1.95, marginBottom:"20px" }}>{v.text}</p>
                  {/* Attribution */}
                  <div style={{ borderTop:`1px solid rgba(201,155,77,.12)`, paddingTop:"14px" }}>
                    <span style={{ fontFamily:Fd, fontSize:"0.7rem", letterSpacing:"0.12em", color:C.gold }}>{v.label}</span>
                    <span style={{ fontSize:"0.78rem", color:C.creamMute, marginLeft:"10px" }}>— {v.job}</span>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Stats */}
          <FadeUp delay={0.1}>
            <div style={{
              display:"flex", justifyContent:"center", gap:"clamp(24px,5vw,64px)",
              flexWrap:"wrap", marginTop:"56px",
              padding:"28px 24px",
              border:`1px solid ${C.goldBorder}`, borderRadius:"14px",
              background:"rgba(201,155,77,.04)",
            }}>
              {[
                { num:"31,247社", label:"全国神社データベース" },
                { num:"247,832名", label:"累計診断人数" },
                { num:"98.3%", label:"満足度" },
              ].map((s, i) => (
                <div key={i} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:Fd, fontSize:"clamp(1.8rem,4vw,2.4rem)", fontWeight:700, color:C.goldLight }}>{s.num}</div>
                  <div style={{ fontSize:"0.75rem", color:C.creamMute, letterSpacing:"0.1em", marginTop:"4px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          S09  FORM — 診断フォーム (視覚山場④)
      ═══════════════════════════════════════════════════════════ */}
      <section ref={formRef} style={{ position:"relative", overflow:"hidden", ...SP }}>
        {/* BG image — atmospheric */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.formBg}')`,
          backgroundSize:"cover", backgroundPosition:"center 40%",
        }} />
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(4,6,11,.88),rgba(4,6,11,.82) 50%,rgba(4,6,11,.92))",
        }} />

        <div style={{ ...maxW, position:"relative" }}>
          <FadeUp>
            <SectionTag text="Start Your Diagnosis" color={C.goldLight} />
            <h2 style={{
              fontSize:"clamp(1.8rem,4.5vw,2.8rem)", fontWeight:800, fontFamily:Fs,
              lineHeight:1.5, textAlign:"center", marginBottom:"20px",
              wordBreak:"keep-all",
            }}>
              あなたのご縁を、<br />今ここで確かめてみませんか。
            </h2>
          </FadeUp>

          <FadeUp delay={0.08}>
            <p style={{ color:C.creamDim, textAlign:"center", lineHeight:2.1, marginBottom:"48px", fontSize:"clamp(1rem,2vw,1.06rem)", maxWidth:"520px", margin:"0 auto 48px" }}>
              生年月日を入力するだけで、あなたに縁の深い守護神社を診断できます。<br /><br />
              それは未来を決めつけるものではありません。<br />
              自分がどんな土地に支えられてきたのか。<br />
              どんな場所に心を向けると、前に進みやすいのか。<br /><br />
              そのヒントを受け取るための、小さな入口です。
            </p>
          </FadeUp>

          {/* Form panel */}
          <FadeUp delay={0.14}>
            <div style={{
              maxWidth:"560px", margin:"0 auto",
              padding:"clamp(32px,5vw,52px)",
              background:"rgba(4,6,11,.92)",
              border:`1px solid ${C.goldBorder}`,
              borderRadius:"18px",
              boxShadow:"0 12px 60px rgba(0,0,0,.7),0 0 40px rgba(201,155,77,.08)",
            }}>
              {/* Birthdate */}
              <div style={{ marginBottom:"20px" }}>
                <label style={{ display:"block", fontSize:"0.78rem", color:C.gold, letterSpacing:"0.12em", marginBottom:"8px", fontFamily:Fd }}>
                  生年月日 *
                </label>
                <input
                  type="date"
                  className="gv-input"
                  value={birthdate}
                  onChange={e => setBirthdate(e.target.value)}
                  style={{
                    width:"100%", padding:"14px 16px", boxSizing:"border-box",
                    background:"rgba(255,255,255,.04)", border:`1px solid ${C.goldBorder}`,
                    borderRadius:"8px", color:C.cream, fontSize:"1rem", fontFamily:Fs,
                    colorScheme:"dark",
                  }}
                />
              </div>

              {/* Prefecture */}
              <div style={{ marginBottom:"20px" }}>
                <label style={{ display:"block", fontSize:"0.78rem", color:C.gold, letterSpacing:"0.12em", marginBottom:"8px", fontFamily:Fd }}>
                  お住まいの都道府県（任意）
                </label>
                <select
                  className="gv-input"
                  value={prefecture}
                  onChange={e => setPrefecture(e.target.value)}
                  style={{
                    width:"100%", padding:"14px 16px", boxSizing:"border-box",
                    background:"rgba(4,6,11,.9)", border:`1px solid ${C.goldBorder}`,
                    borderRadius:"8px", color:C.cream, fontSize:"1rem", fontFamily:Fs,
                  }}
                >
                  {PREFECTURES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              {/* Gender */}
              <div style={{ marginBottom:"20px" }}>
                <label style={{ display:"block", fontSize:"0.78rem", color:C.gold, letterSpacing:"0.12em", marginBottom:"10px", fontFamily:Fd }}>
                  性別（任意）
                </label>
                <div style={{ display:"flex", gap:"12px" }}>
                  {["男性","女性","その他"].map(g => (
                    <label key={g} style={{ display:"flex", alignItems:"center", gap:"7px", cursor:"pointer" }}>
                      <input type="radio" name="gender" value={g}
                        checked={gender===g} onChange={()=>setGender(g)}
                        style={{ accentColor:C.gold }}
                      />
                      <span style={{ color:C.creamDim, fontSize:"0.92rem" }}>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div style={{ marginBottom:"30px" }}>
                <label style={{ display:"block", fontSize:"0.78rem", color:C.gold, letterSpacing:"0.12em", marginBottom:"10px", fontFamily:Fd }}>
                  気になるご縁のテーマ（任意）
                </label>
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  {THEMES.map(t => (
                    <button key={t} onClick={()=>setTheme(t)} style={{
                      padding:"6px 14px",
                      background: theme===t ? `${C.gold}1a` : "transparent",
                      border: `1px solid ${theme===t ? C.goldB2 : C.goldBorder}`,
                      borderRadius:"20px", cursor:"pointer",
                      color: theme===t ? C.goldLight : C.creamMute,
                      fontSize:"0.82rem", fontFamily:Fs,
                      transition:"all .2s ease",
                    }}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button onClick={handleDiagnose} className="gv-gold-btn" style={{
                width:"100%", padding:"20px", border:"none", borderRadius:"10px",
                color:"#fff", fontSize:"clamp(1rem,2.4vw,1.1rem)", fontWeight:800,
                letterSpacing:"0.12em", fontFamily:Fs,
                boxShadow:"0 6px 36px rgba(0,0,0,.65),0 0 24px rgba(201,155,77,.18)",
              }}>
                無料で守護神社を診断する
              </button>

              <p style={{ textAlign:"center", marginTop:"12px", color:C.creamMute, fontSize:"0.76rem", letterSpacing:"0.06em" }}>
                完全無料 ・ 登録不要 ・ 約30秒で完了
              </p>
            </div>
          </FadeUp>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          S10  FAQ
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.warmDark }}>
        <div style={maxW}>
          <FadeUp>
            <SectionTag text="FAQ" />
            <h2 style={{
              fontSize:"clamp(1.8rem,4.5vw,2.8rem)", fontWeight:800, fontFamily:Fs,
              lineHeight:1.5, textAlign:"center", marginBottom:"56px",
              wordBreak:"keep-all",
            }}>
              よくあるご質問
            </h2>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"12px", maxWidth:"840px", margin:"0 auto" }}>
            {FAQS.map((f, i) => (
              <FadeUp key={i} delay={i * 0.05}>
                <div style={{
                  border:`1px solid ${openFaq===i ? C.goldBorder : "rgba(201,155,77,.10)"}`,
                  borderRadius:"10px", overflow:"hidden",
                  transition:"border-color .2s ease",
                  background:"rgba(4,6,11,.6)",
                }}>
                  <button
                    onClick={() => setOpenFaq(openFaq===i ? null : i)}
                    style={{
                      width:"100%", padding:"18px 20px",
                      background:"none", border:"none", cursor:"pointer",
                      display:"flex", justifyContent:"space-between", alignItems:"center", gap:"12px",
                      textAlign:"left",
                    }}
                  >
                    <span style={{ color:C.cream, fontSize:"clamp(0.9rem,1.9vw,0.97rem)", fontFamily:Fs, fontWeight:700, lineHeight:1.5 }}>{f.q}</span>
                    <span style={{
                      flexShrink:0, width:"22px", height:"22px",
                      borderRadius:"50%", background:C.goldFaint, border:`1px solid ${C.goldBorder}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:C.gold, fontSize:"0.85rem",
                      transition:"transform .3s ease",
                      transform: openFaq===i ? "rotate(45deg)" : "none",
                    }}>+</span>
                  </button>
                  <div className={`gv-faq-body${openFaq===i ? " open" : ""}`}>
                    <p style={{ padding:"0 20px 18px", color:C.creamDim, fontSize:"clamp(0.88rem,1.8vw,0.94rem)", lineHeight:1.95 }}>{f.a}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          S11  LINE 登録 — Updated copy
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.ink }}>
        <div style={maxW}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"clamp(32px,6vw,72px)", alignItems:"center" }}>

            {/* Phone mockup */}
            <FadeUp delay={0.05}>
              <div style={{ display:"flex", justifyContent:"center" }}>
                <div style={{
                  animation:"gv-float 5s ease-in-out infinite",
                  width:"200px", position:"relative",
                }}>
                  {/* Phone frame */}
                  <div style={{
                    background:"rgba(12,14,18,.98)", border:"2.5px solid rgba(201,155,77,.30)",
                    borderRadius:"36px", overflow:"hidden",
                    boxShadow:"0 24px 72px rgba(0,0,0,.8),0 0 40px rgba(201,155,77,.10)",
                    padding:"10px 0",
                  }}>
                    {/* Notch */}
                    <div style={{ width:"64px", height:"14px", background:"#000", borderRadius:"8px", margin:"0 auto 10px" }} />
                    {/* LINE header */}
                    <div style={{ background:"#06C755", padding:"10px 14px", display:"flex", alignItems:"center", gap:"8px" }}>
                      <div style={{ width:"26px", height:"26px", borderRadius:"50%", background:"rgba(255,255,255,.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ fontSize:"0.65rem" }}>⛩</span>
                      </div>
                      <span style={{ color:"#fff", fontSize:"0.7rem", fontWeight:700 }}>守護神社診断</span>
                    </div>
                    {/* Chat bubbles */}
                    <div style={{ padding:"14px 10px", display:"flex", flexDirection:"column", gap:"8px" }}>
                      {[
                        { msg:"診断結果が届きました", from:"bot" },
                        { msg:"あなたの守護神社は\n3社特定できました✨", from:"bot" },
                        { msg:"参拝ガイドも\n確認できます📋", from:"bot" },
                      ].map((b, i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"flex-start" }}>
                          <div style={{
                            background:"#fff", color:"#1a1a1a",
                            padding:"7px 10px", borderRadius:"0 10px 10px 10px",
                            fontSize:"0.62rem", lineHeight:1.6, maxWidth:"80%",
                            whiteSpace:"pre-line",
                            boxShadow:"0 2px 8px rgba(0,0,0,.15)",
                          }}>{b.msg}</div>
                        </div>
                      ))}
                    </div>
                    {/* Home bar */}
                    <div style={{ width:"50px", height:"4px", background:"rgba(255,255,255,.15)", borderRadius:"2px", margin:"8px auto 4px" }} />
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* Copy */}
            <div>
              <FadeUp>
                <SectionTag text="Get Your Results on LINE" color={C.emerald} />
                <h2 style={{
                  fontSize:"clamp(1.7rem,4vw,2.5rem)", fontWeight:800, fontFamily:Fs,
                  lineHeight:1.55, marginBottom:"24px", wordBreak:"keep-all",
                }}>
                  診断結果をLINEで受け取ると、<br />
                  あとから何度でも見返せます。
                </h2>
              </FadeUp>
              <FadeUp delay={0.08}>
                <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:2.1, marginBottom:"28px" }}>
                  あなたに縁の深い守護神社は、<br />
                  一度見て終わりではありません。<br /><br />
                  参拝のタイミング。<br />
                  願いごとの向き合い方。<br />
                  今月意識したい開運アクション。<br /><br />
                  LINEで受け取ることで、診断結果を保存しながら、<br />
                  あなたの暮らしの中で少しずつ活かせます。
                </p>
              </FadeUp>

              <FadeUp delay={0.14}>
                <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"32px" }}>
                  {[
                    "診断結果をいつでも見返せる",
                    "参拝のタイミングと作法がわかる",
                    "今月の開運アクションが届く",
                    "必要なければいつでも解除できる",
                  ].map((b, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <div style={{ width:"18px", height:"18px", borderRadius:"50%", background:"rgba(74,138,104,.18)", border:`1px solid ${C.emeraldBorder}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-5" stroke={C.emerald} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                      </div>
                      <span style={{ color:C.creamDim, fontSize:"clamp(0.93rem,1.9vw,1rem)" }}>{b}</span>
                    </div>
                  ))}
                </div>
              </FadeUp>

              <FadeUp delay={0.2}>
                <a href="https://lin.ee/placeholder" className="gv-green-btn" style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
                  padding:"18px 28px", border:`1px solid ${C.emeraldBorder}`, borderRadius:"10px",
                  color:"#fff", fontSize:"clamp(1rem,2.3vw,1.06rem)", fontWeight:800,
                  letterSpacing:"0.08em", textDecoration:"none", fontFamily:Fs,
                  boxShadow:"0 6px 36px rgba(0,0,0,.65)",
                  maxWidth:"380px",
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill={C.lineGreen}><path d="M10 2C5.58 2 2 5.13 2 9c0 2.38 1.27 4.5 3.24 5.84l-.52 1.94c-.08.3.22.56.5.41L8.06 16c.62.1 1.27.15 1.94.15C14.42 16.15 18 13.02 18 9c0-3.87-3.58-7-8-7z"/></svg>
                  LINEで診断結果を受け取る
                </a>
                <p style={{ marginTop:"10px", color:C.creamMute, fontSize:"0.76rem", letterSpacing:"0.06em" }}>
                  無料 ・ いつでも解除OK ・ 診断結果を保存できます
                </p>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          S12  FINAL CTA — Updated copy, prominent image
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden", ...SP }}>
        {/* BG image — very visible */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.finalCtaBg}')`,
          backgroundSize:"cover", backgroundPosition:"center 30%",
        }} />
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(4,6,11,.92) 0%,rgba(4,6,11,.62) 40%,rgba(4,6,11,.80) 100%)",
        }} />

        {/* Gold light sweep */}
        <div style={{
          position:"absolute", top:"30%", left:0, right:0, height:"2px",
          background:`linear-gradient(to right,transparent,${C.goldBorder},transparent)`,
          animation:"gv-light-sweep 8s ease-in-out infinite",
          pointerEvents:"none",
        }} />

        {/* "守" watermark */}
        <div style={{
          position:"absolute", right:"5%", top:"50%", transform:"translateY(-50%)",
          fontFamily:Fs, fontSize:"clamp(200px,35vw,380px)", fontWeight:800,
          color:C.gold, opacity:.025, lineHeight:1, pointerEvents:"none",
          animation:"gv-breathe 12s ease-in-out infinite",
        }}>守</div>

        <div style={{ ...maxW, position:"relative", textAlign:"center" }}>
          <FadeUp>
            <SectionTag text="Begin Here" color={C.goldLight} />
            <h2 style={{
              fontSize:"clamp(2rem,5.5vw,3.4rem)", fontWeight:800, fontFamily:Fs,
              lineHeight:1.5, marginBottom:"24px", wordBreak:"keep-all",
            }}>
              神社との縁は、<br />気づいた瞬間から始まります。
            </h2>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2.2vw,1.1rem)", lineHeight:2.2, marginBottom:"48px", maxWidth:"520px", margin:"0 auto 48px" }}>
              生まれた土地。<br />
              家族が受け継いできた土地。<br />
              今、あなたが暮らしている場所。<br /><br />
              そのすべてが、あなたの人生と<br />
              静かにつながっているかもしれません。<br /><br />
              まずは無料診断で、あなたと縁の深い<br />
              守護神社を知ることから始めてみませんか。
            </p>
          </FadeUp>

          <FadeUp delay={0.18}>
            <button onClick={scrollToForm} className="gv-gold-btn" style={{
              display:"inline-flex", alignItems:"center", gap:"10px",
              padding:"22px 48px", border:"none", borderRadius:"10px",
              color:"#fff", fontSize:"clamp(1.05rem,2.5vw,1.15rem)",
              fontWeight:800, letterSpacing:"0.14em", fontFamily:Fs,
              boxShadow:"0 8px 48px rgba(0,0,0,.8),0 0 36px rgba(201,155,77,.25)",
              marginBottom:"14px",
            }}>
              <ToriiIcon />
              今すぐ無料で守護神社を調べる
            </button>
            <p style={{ color:C.creamMute, fontSize:"0.78rem", letterSpacing:"0.06em" }}>完全無料 ・ 登録不要 ・ 約30秒</p>
          </FadeUp>

          {/* P.S. */}
          <FadeUp delay={0.26}>
            <div style={{
              marginTop:"56px",
              padding:"28px 32px",
              background:"rgba(201,155,77,.05)", border:`1px solid ${C.goldBorder}`,
              borderRadius:"12px", maxWidth:"560px", margin:"56px auto 0",
              textAlign:"left",
            }}>
              <p style={{ fontFamily:Fd, fontSize:"0.75rem", color:C.gold, letterSpacing:"0.2em", marginBottom:"12px" }}>P.S.</p>
              <p style={{ color:C.creamDim, fontSize:"clamp(0.93rem,1.9vw,1rem)", lineHeight:2 }}>
                縁のある守護神社に気づかないまま、時間だけが過ぎていくことがあります。今日ここで生年月日を入力するだけで、その縁に気づくことができます。所要時間は約30秒です。
              </p>
            </div>
          </FadeUp>
        </div>

        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"120px", background:`linear-gradient(to top,${C.ink},transparent)`, pointerEvents:"none" }} />
      </section>


      {/* Footer */}
      <footer style={{ background:C.ink, padding:`28px ${PX}`, borderTop:`1px solid rgba(201,155,77,.10)` }}>
        <div style={{ maxWidth:"960px", margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <ToriiIcon />
            <span style={{ fontFamily:Fd, fontSize:"0.68rem", letterSpacing:"0.32em", color:C.gold }}>守護神社診断</span>
          </div>
          <div style={{ display:"flex", gap:"20px", flexWrap:"wrap" }}>
            {[["利用規約","#"],["プライバシーポリシー","#"],["お問い合わせ","#"]].map(([l,h])=>(
              <Link key={l} href={h} style={{ fontSize:"0.75rem", color:C.creamMute, textDecoration:"none", letterSpacing:"0.04em" }}>{l}</Link>
            ))}
          </div>
          <p style={{ fontSize:"0.68rem", color:C.creamMute }}>© 2026 全国神社スポット</p>
        </div>
      </footer>

    </div>
  );
}
