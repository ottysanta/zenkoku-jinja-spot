"use client";

import {
  useRef, useState, useEffect,
  type ReactNode, type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Image paths (canonical names only) ──────────────────────────────────────
const IMG = {
  heroDesktop:    "/images/guardian/assets/guardian-hero-desktop.webp",
  heroMobile:     "/images/guardian/assets/guardian-hero-mobile.webp",
  logicBg:        "/images/guardian/assets/guardian-logic-bg.webp",
  definitionBg:   "/images/guardian/assets/guardian-definition-bg.webp",
  finalCtaBg:     "/images/guardian/assets/guardian-final-cta-bg.webp",
  formBg:         "/images/guardian/assets/guardian-form-bg.webp",
  threeShrineBg:  "/images/guardian/assets/guardian-three-shrines-bg.webp",
  introBg:        "/images/guardian/assets/guardian-intro-bg.webp",
  quotePanelBg:   "/images/guardian/assets/guardian-quote-panel-bg.webp",
  testimonialsBg: "/images/guardian/assets/guardian-testimonials-bg.webp",
} as const;

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          "#04060b",
  bgNavy:      "#060910",
  bgWarm:      "#090709",
  gold:        "#C99B4D",
  goldLight:   "#E8C87C",
  goldFaint:   "rgba(201,155,77,0.07)",
  goldBorder:  "rgba(201,155,77,0.20)",
  goldB2:      "rgba(201,155,77,0.35)",
  goldGlow:    "rgba(201,155,77,0.10)",
  amber:       "#C07840",
  amberGlow:   "rgba(192,120,64,0.14)",
  green:       "#5a9a78",
  greenFaint:  "rgba(90,154,120,0.08)",
  greenBorder: "rgba(90,154,120,0.24)",
  cream:       "#f5efe2",
  creamDim:    "rgba(245,239,226,0.72)",
  creamMute:   "rgba(245,239,226,0.40)",
  line:        "#06C755",
  card:        "linear-gradient(145deg,rgba(12,16,24,.94),rgba(7,9,14,.97))",
  cardWarm:    "linear-gradient(145deg,rgba(16,11,8,.94),rgba(9,7,5,.97))",
} as const;

const Fd = "'Cormorant Garamond', Georgia, serif";
const Fs = "'Shippori Mincho B1','Hiragino Mincho ProN','Yu Mincho',serif";
const PX = "clamp(18px, 5vw, 72px)";

// ─── Data ─────────────────────────────────────────────────────────────────────

const WORRIES = [
  { icon: "縁", color: "#7a94c0", text: "初詣くらいしか神社に行かないが、「自分に縁の深い神社」というものをよく知らないまま何十年も過ごしてきた" },
  { icon: "惑", color: "#C99B4D", text: "転職・結婚・引越しなど大切な決断の前に、どこかに手を合わせたいと思いながら、どこへ行けばいいかわからなかった" },
  { icon: "根", color: "#6aab8a", text: "産土神・氏神という言葉は聞いたことがあるが、自分とどんな関係があるのかよく知らないままにしてきた" },
  { icon: "問", color: "#c07840", text: "特に信心深いわけではないが、もし自分と縁の深い場所があるなら、一度は知ってみたいと思っている" },
  { icon: "迷", color: "#9870b0", text: "有名なパワースポットや話題の神社に行くが、それが本当に自分に合うのかどうかよく分からないまま参拝している" },
  { icon: "祈", color: "#a08840", text: "神社で手を合わせるとき、自分が誰に何を届けているのか、なんとなく分からないまま帰ることがある" },
];

const SHRINES = [
  {
    name: "産土神社", reading: "うぶすなじんじゃ", icon: "産",
    accent: "#6aab8a",
    meaning: "魂の根と、生まれた縁を守る",
    desc: "あなたが生まれた土地と深く結びつく神社。持って生まれた性質、魂の出発点、人生の根っこを象徴します。どれだけ遠く離れても、この縁は一生続くとされています。",
    detail: "引越しや移住をしても変わらない、最も根源的な縁。",
  },
  {
    name: "氏神神社", reading: "うじがみじんじゃ", icon: "氏",
    accent: "#C99B4D",
    meaning: "家系と家族の縁を守る",
    desc: "家系や地域のつながりを見守る神社。家族運、人間関係、先祖から受け継いできた流れを象徴します。「家の縁」が気になるときに思い出したい守護神社です。",
    detail: "先祖・家族・血縁に関わる縁を司る神社。",
  },
  {
    name: "鎮守神社", reading: "ちんじゅじんじゃ", icon: "鎮",
    accent: "#7090c0",
    meaning: "今の暮らしと場所の縁を守る",
    desc: "今いる土地での日々の暮らしを見守る神社。仕事、健康、現在の環境との相性を象徴します。引越しや転職など、「今の場所」との縁が変わるタイミングで特に重要とされています。",
    detail: "今この場所での日常・仕事・暮らしを守る縁。",
  },
];

const ELEMENTS = [
  { kanji: "木", name: "木", en: "Wood", color: "#4a8a5a", bg: "rgba(74,138,90,.18)", label: "生年月日" },
  { kanji: "火", name: "火", en: "Fire",  color: "#c04030", bg: "rgba(192,64,48,.18)", label: "陰陽五行" },
  { kanji: "土", name: "土", en: "Earth", color: "#c09030", bg: "rgba(192,144,48,.18)", label: "地域との縁" },
  { kanji: "金", name: "金", en: "Metal", color: "#9098b8", bg: "rgba(144,152,184,.18)", label: "神社データ" },
  { kanji: "水", name: "水", en: "Water", color: "#3480c0", bg: "rgba(52,128,192,.18)", label: "AI解析" },
];

const DIAG = [
  { no:"01", kanji:"縁", title:"守護神社",          desc:"全国31,247社から縁の深さ順に神社を特定します" },
  { no:"02", kanji:"質", title:"生まれ持った性質",   desc:"五行属性と生年月日から本来の気質を読み解きます" },
  { no:"03", kanji:"運", title:"今の運気の流れ",     desc:"現在の運気の傾向と意識するとよい方向性" },
  { no:"04", kanji:"参", title:"参拝タイミング",     desc:"属性に合った参拝に適した時期・時間帯の目安" },
  { no:"05", kanji:"願", title:"願いごとの方向性",   desc:"どの神社でどのような願いを届けると縁が深いか" },
  { no:"06", kanji:"縁", title:"人間関係・仕事のヒント", desc:"今の環境で意識するとよい視点と向き合い方" },
  { no:"07", kanji:"法", title:"参拝の作法と心得",   desc:"拝礼・時間帯・方角など、知って行く参拝の基礎" },
  { no:"08", kanji:"開", title:"開運アクション",     desc:"属性と縁に合わせた日常で取り入れやすい習慣" },
];

const BENEFITS_LIST = [
  "自分の性質と、進みやすい方向性が分かる",
  "縁のある神社への参拝が、より意味を持つようになる",
  "大切な決断の前に、立ち寄るべき場所が明確になる",
  "毎日の生活に、静かな根拠と安心感が生まれる",
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
    label: "30代 女性", job: "仕事の転機に悩んでいた",
    pull: "参拝してみると気持ちが整理された",
    text: "最近、仕事を続けるべきか迷っていました。診断で出てきた神社が、昔から気になっていた場所で驚きました。参拝してみると気持ちが整理され、今やるべきことが少し見えた気がします。",
  },
  {
    label: "40代 女性", job: "家族関係に悩んでいた",
    pull: "何かが静かに腑に落ちた感覚",
    text: "家族との関係に疲れていた時期に診断しました。氏神神社という考え方を知り、自分の家系や土地とのつながりを改めて考えるきっかけになりました。大げさな「変化」ではないけれど、何かが静かに腑に落ちた感覚があります。",
  },
  {
    label: "40代 男性", job: "なんとなく気になって試した",
    pull: "こんな考え方があるんだと素直に驚いた",
    text: "占いは信じないタイプですが、文化・歴史的な話として読んだら面白かった。産土神社という考え方は知らなかったし、診断で出てきた場所は確かに地元にある神社でした。こんな考え方があるんだと素直に驚きました。",
  },
  {
    label: "50代 男性", job: "人生の節目に",
    pull: "静かに背中を押してくれるような内容",
    text: "退職後の暮らし方を考えていた時に利用しました。大げさな占いではなく、静かに背中を押してくれるような内容で、素直に受け取れました。地元の神社に改めて足を運ぶようになり、心が少し軽くなりました。",
  },
];

const FAQS_L = [
  { q:"診断に料金はかかりますか？",              a:"かかりません。診断の利用・結果の閲覧はすべて完全無料です。有料オプションや課金は一切ありません。" },
  { q:"登録や個人情報の入力は必要ですか？",      a:"不要です。メールアドレスや氏名などの個人情報は診断には必要ありません。LINEへの登録は任意です。" },
  { q:"生年月日以外に必要な情報はありますか？",  a:"生年月日のみで診断を開始できます。都道府県や性別は任意項目で、入力するとより詳細な結果が得られます。" },
  { q:"診断結果はどこで受け取れますか？",        a:"診断終了後にWebページで確認できます。LINEに登録すると結果の保存・再確認が可能です。" },
];
const FAQS_R = [
  { q:"複数の神社が表示されるのはなぜですか？",  a:"産土・氏神・鎮守という3種類の守護神社がそれぞれ導き出されるためです。あなたの縁の深さに応じて複数提案します。" },
  { q:"結果の内容はどうやって活用できますか？",  a:"参拝先の選び方、願いごとの方向性、参拝のタイミングなど、日常の神社との向き合い方に活用できます。" },
  { q:"本当に自分に合った神社が分かりますか？",  a:"数千年にわたって継承されてきた思想体系に基づいていますが、現代科学とは異なります。参拝先選びのヒントとしてご活用ください。" },
  { q:"占いやスピリチュアルとは違うのですか？",  a:"西洋占星術やスピリチュアル系とは異なります。日本古来の産土信仰・五行・神社情報データベースに基づく文化的な診断です。" },
];

const LINE_BENEFITS = [
  { icon: "📋", title: "診断結果ガイド",    desc: "神社へのアクセスやご祭神の詳細情報をお届けします" },
  { icon: "🧭", title: "参拝ガイド",        desc: "参拝のタイミング・作法・方角を丁寧にご案内します" },
  { icon: "📅", title: "開運カレンダー",    desc: "今月の縁のよい日・方角を毎月お届けします" },
  { icon: "✨", title: "限定コンテンツ",    desc: "LINE限定の開運情報・コンテンツを定期配信します" },
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
      transform: inView ? "translateY(0)" : "translateY(28px)",
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
        color, borderBottom:`1px solid ${color}32`, paddingBottom:"5px",
        textTransform:"uppercase" as const,
      }}>{text}</span>
    </div>
  );
}

function H2({ children, style: sx = {} }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <h2 style={{
      fontSize:"clamp(1.7rem,4vw,2.5rem)", fontWeight:800,
      lineHeight:1.5, marginBottom:"18px", fontFamily:Fs,
      ...sx,
    }}>{children}</h2>
  );
}

function Ornament() {
  return (
    <div style={{ display:"flex", alignItems:"center", maxWidth:"480px", margin:"0 auto", padding:`0 ${PX}` }}>
      <div style={{ flex:1, height:"1px", background:`linear-gradient(to right,transparent,${C.goldBorder})` }} />
      <svg width="28" height="28" viewBox="0 0 28 28" style={{ flexShrink:0, margin:"0 12px" }}>
        <rect x="10" y="10" width="8" height="8" fill="none" stroke={C.gold} strokeWidth="0.8" opacity="0.35" transform="rotate(45 14 14)" />
        <circle cx="14" cy="14" r="1.8" fill={C.gold} opacity="0.22" />
      </svg>
      <div style={{ flex:1, height:"1px", background:`linear-gradient(to left,transparent,${C.goldBorder})` }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuardianV2() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const [openFaqL, setOpenFaqL] = useState<number | null>(null);
  const [openFaqR, setOpenFaqR] = useState<number | null>(null);
  const [birthdate, setBirthdate] = useState("");
  const [prefecture, setPrefecture] = useState("選択しない");
  const [gender, setGender] = useState("");
  const [theme, setTheme] = useState("全般");

  const maxW: CSSProperties = { maxWidth:"960px", margin:"0 auto", width:"100%" };
  const SP: CSSProperties   = { padding:`clamp(68px,9vw,120px) ${PX}` };

  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Shippori+Mincho+B1:wght@400;700;800&display=swap";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.setAttribute("data-gv2","1");
    style.textContent = `
      @keyframes gv-breathe{0%,100%{opacity:.022;transform:scale(1)}50%{opacity:.048;transform:scale(1.013)}}
      @keyframes gv-glow{0%,100%{opacity:.07}50%{opacity:.19}}
      @keyframes gv-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
      @keyframes gv-hero-zoom{from{transform:scale(1.06)}to{transform:scale(1.0)}}
      @keyframes gv-orb-pulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.06);opacity:1}}
      @keyframes gv-shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
      @keyframes gv-scroll{0%,100%{opacity:.3;transform:translateX(-50%) translateY(0)}50%{opacity:.7;transform:translateX(-50%) translateY(6px)}}
      @keyframes gv-particle{0%{transform:translateY(0) translateX(0);opacity:0}20%{opacity:.6}80%{opacity:.3}100%{transform:translateY(-80px) translateX(20px);opacity:0}}

      .gv-faq{max-height:0;overflow:hidden;opacity:0;transition:max-height .45s cubic-bezier(.4,0,.2,1),opacity .35s ease}
      .gv-faq.open{max-height:280px;opacity:1}
      .gv-btn{transition:transform .15s ease,box-shadow .2s ease}
      .gv-btn:active{transform:scale(.98)!important}
      .gv-gold-btn{
        background:linear-gradient(135deg,#6a4a10,#8a6220,#6a4a10);
        cursor:pointer;
        position:relative;
        overflow:hidden;
      }
      .gv-gold-btn::after{
        content:'';
        position:absolute;
        top:0;left:0;right:0;bottom:0;
        background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.12) 50%,transparent 100%);
        background-size:200% 100%;
        animation:gv-shimmer 3s ease-in-out infinite;
      }
      .gv-gold-btn:hover{background:linear-gradient(135deg,#7a5a18,#9a7228,#7a5a18);box-shadow:0 8px 40px rgba(0,0,0,.65),0 0 28px rgba(201,155,77,.22)!important}
      .gv-green-btn{background:linear-gradient(135deg,#163021,#1d4530,#163021);cursor:pointer}
      .gv-green-btn:hover{background:linear-gradient(135deg,#1d4530,#264838,#1d4530);box-shadow:0 8px 40px rgba(0,0,0,.65),0 0 28px rgba(90,154,120,.24)!important}
      .gv-card{transition:transform .25s ease,box-shadow .25s ease}
      .gv-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.6),0 0 20px rgba(201,155,77,.08)!important}
      .gv-shrine-card{transition:transform .25s ease}
      .gv-shrine-card:hover{transform:translateY(-5px)}
      .gv-sticky{display:none}
      @media(max-width:768px){.gv-sticky{display:flex}}
      @media(max-width:768px){.gv-hero-text{max-width:100%!important}}
      @media(max-width:768px){.gv-hero-desktop{display:none!important}}
      @media(min-width:769px){.gv-hero-mobile-bg{background-image:none!important}}
      @prefers-reduced-motion: reduce {
        *{animation-duration:.01ms!important;transition-duration:.01ms!important}
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
    formRef.current?.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  function handleDiagnose() {
    const params = new URLSearchParams();
    if (birthdate) {
      const [y, m, d] = birthdate.split("-");
      if (y) params.set("year", y);
      if (m) params.set("month", m);
      if (d) params.set("day", d);
    }
    router.push(`/diagnose?${params.toString()}`);
  }

  // Torii SVG icon for buttons
  const ToriiIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M3 9h18"/><path d="M5 9V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
      <path d="M12 5V3"/><path d="M7 9v12"/><path d="M17 9v12"/><path d="M9 21h6"/>
    </svg>
  );

  return (
    <div style={{ background:C.bg, color:C.cream, minHeight:"100vh", fontFamily:Fs, WebkitFontSmoothing:"antialiased" }}>

      {/* ── Mobile sticky CTA ──────────────────────────── */}
      <div className="gv-sticky" style={{
        position:"fixed", bottom:0, left:0, right:0,
        zIndex:50, padding:"10px 16px 10px",
        background:"rgba(4,6,11,.96)",
        borderTop:`1px solid ${C.goldBorder}`,
        alignItems:"center", gap:"10px",
      }}>
        <Link href="/diagnose" className="gv-btn gv-green-btn" style={{
          flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"7px",
          padding:"13px 20px", borderRadius:"10px",
          border:`1px solid ${C.greenBorder}`,
          color:C.cream, fontSize:"0.92rem", fontWeight:800,
          letterSpacing:"0.08em", textDecoration:"none",
          boxShadow:"0 4px 24px rgba(0,0,0,.6)",
          fontFamily:Fs,
        }}>
          <ToriiIcon />
          無料で守護神社を調べる
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════
          S01  HERO — 視覚的山場①
      ══════════════════════════════════════════════════════ */}
      <section style={{
        position:"relative", minHeight:"100svh",
        display:"flex", flexDirection:"column", justifyContent:"center",
        overflow:"hidden",
      }}>
        {/* Desktop: hero image right side */}
        <div className="gv-hero-desktop" style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.heroDesktop}')`,
          backgroundSize:"cover", backgroundPosition:"center right",
          backgroundRepeat:"no-repeat",
          animation:"gv-hero-zoom 1.8s ease-out forwards",
        }} />
        {/* Left-to-right dark overlay */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to right,rgba(4,6,11,.99) 0%,rgba(4,6,11,.97) 38%,rgba(4,6,11,.65) 60%,rgba(4,6,11,.18) 100%)",
        }} />
        {/* Mobile: portrait image as full bg */}
        <div className="gv-hero-mobile-bg" style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.heroMobile}')`,
          backgroundSize:"cover", backgroundPosition:"center 25%",
          backgroundRepeat:"no-repeat",
        }} />
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(4,6,11,.88) 0%,rgba(4,6,11,.0) 18%,rgba(4,6,11,.0) 78%,rgba(4,6,11,.99) 100%)",
        }} />
        {/* Amber glow */}
        <div style={{
          position:"absolute", top:"28%", left:"8%",
          width:"380px", height:"380px", borderRadius:"50%",
          background:`radial-gradient(ellipse,${C.amberGlow} 0%,transparent 65%)`,
          pointerEvents:"none", animation:"gv-glow 8s ease-in-out infinite",
        }} />
        {/* Floating particles */}
        {[...Array(8)].map((_,i)=>(
          <div key={i} style={{
            position:"absolute",
            left:`${8+i*9}%`,
            bottom:`${15+i*5}%`,
            width:"3px", height:"3px",
            borderRadius:"50%",
            background:C.gold,
            opacity:0,
            animation:`gv-particle ${4+i*.7}s ease-in ${i*.5}s infinite`,
          }} />
        ))}

        <div style={{ position:"relative", padding:`88px ${PX} 80px`, ...maxW }}>
          <div className="gv-hero-text" style={{ maxWidth:"560px" }}>

            {/* Label */}
            <FadeUp delay={0.04}>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:"8px",
                padding:"4px 16px 4px 10px",
                background:"rgba(201,155,77,.08)", border:`1px solid ${C.goldBorder}`, borderRadius:"30px",
                marginBottom:"26px",
              }}>
                <ToriiIcon />
                <span style={{ fontFamily:Fd, fontSize:"0.6rem", letterSpacing:"0.42em", color:C.gold, fontWeight:600 }}>
                  守護神社診断
                </span>
              </div>
            </FadeUp>

            {/* H1 */}
            <FadeUp delay={0.1}>
              <h1 style={{
                fontSize:"clamp(2rem,6.5vw,3.6rem)", lineHeight:1.38,
                letterSpacing:"0.03em", marginBottom:"26px",
                fontWeight:800, fontFamily:Fs,
              }}>
                あなたと最も縁の深い<br />
                <span style={{ color:C.goldLight }}>「守護神社」</span>を<br />
                知っていますか？
              </h1>
            </FadeUp>

            {/* Sub */}
            <FadeUp delay={0.18}>
              <p style={{
                color:C.creamDim, fontSize:"clamp(0.97rem,2vw,1.05rem)",
                lineHeight:2.2, marginBottom:"28px",
              }}>
                生まれた場所、家系、今の住まい。<br />
                あなたの人生に縁のある神社を、生年月日をもとに、<br />
                本当に縁の深い神社をお伝えします。
              </p>
            </FadeUp>

            {/* Stats badges */}
            <FadeUp delay={0.24}>
              <div style={{ display:"flex", gap:"8px", marginBottom:"34px", flexWrap:"wrap" }}>
                {["完全無料","登録不要","生年月日だけ","約30秒で完了"].map(t=>(
                  <div key={t} style={{
                    padding:"6px 12px",
                    background:"rgba(4,6,11,.8)", border:`1px solid ${C.goldBorder}`,
                    borderRadius:"6px", backdropFilter:"blur(8px)",
                  }}>
                    <span style={{ fontFamily:Fd, fontSize:"0.65rem", color:C.gold, letterSpacing:"0.04em" }}>{t}</span>
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* CTA */}
            <FadeUp delay={0.3}>
              <button
                onClick={scrollToForm}
                className="gv-btn gv-gold-btn"
                style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
                  width:"100%", maxWidth:"420px",
                  padding:"20px 28px",
                  border:"none", borderRadius:"10px",
                  color:"#fff", fontSize:"clamp(1rem,2.5vw,1.08rem)",
                  fontWeight:800, letterSpacing:"0.12em",
                  boxShadow:"0 6px 40px rgba(0,0,0,.65),0 0 24px rgba(201,155,77,.15)",
                  fontFamily:Fs, marginBottom:"10px",
                }}
              >
                <ToriiIcon />
                今すぐ無料で守護神社を調べる
              </button>
            </FadeUp>
          </div>
        </div>

        {/* Bottom fade */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"140px", background:`linear-gradient(to top,${C.bg},transparent)`, pointerEvents:"none" }} />
        {/* Scroll indicator */}
        <div style={{ position:"absolute", bottom:"28px", left:"50%", animation:"gv-scroll 2.5s ease-in-out infinite" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"5px" }}>
            <div style={{ width:"1px", height:"40px", background:`linear-gradient(to bottom,transparent,${C.goldBorder})` }} />
            <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:C.gold, opacity:.38 }} />
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════
          S02  共感・悩み
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bgNavy }}>
        <div style={maxW}>
          <FadeUp>
            <Tag text="Does This Sound Familiar" />
            <H2 style={{ textAlign:"center" }}>こんなことを感じたことは<br />ありませんか？</H2>
            <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", textAlign:"center", lineHeight:2, marginBottom:"48px" }}>
              神社への関心の有無は関係ありません。一つでも当てはまることがあれば、この先を読み進めてください。
            </p>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"14px" }}>
            {WORRIES.map((w,i)=>(
              <FadeUp key={i} delay={i*.05}>
                <div className="gv-card" style={{
                  display:"flex", gap:"16px", alignItems:"flex-start",
                  padding:"20px 20px",
                  background:C.card, border:`1px solid ${C.goldBorder}`,
                  borderLeft:`3px solid ${w.color}44`,
                  borderRadius:"12px",
                }}>
                  {/* Icon circle */}
                  <div style={{
                    flexShrink:0,
                    width:"40px", height:"40px", borderRadius:"50%",
                    background:`${w.color}18`, border:`1px solid ${w.color}44`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:Fs, fontSize:"0.95rem", fontWeight:800, color:w.color,
                  }}>{w.icon}</div>
                  <p style={{ color:C.creamDim, fontSize:"clamp(0.92rem,1.8vw,0.98rem)", lineHeight:1.9 }}>{w.text}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp>
            <div style={{
              marginTop:"36px", padding:"22px 26px",
              background:"rgba(80,18,18,.10)", border:"1px solid rgba(160,60,50,.20)",
              borderLeft:"3px solid rgba(200,90,70,.28)",
              borderRadius:"12px", textAlign:"center",
            }}>
              <p style={{ color:"rgba(240,215,200,.88)", fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:2 }}>
                その答えは、あなたに深くご縁を持つ<strong style={{ color:C.cream }}>「守護神社」</strong>が鍵かもしれません。
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      <Ornament />

      {/* ══════════════════════════════════════════════════════
          S03  なぜ今、知る人が少ないのか
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bg, position:"relative", overflow:"hidden" }}>
        <div style={{
          position:"absolute", top:"45%", right:"-10px", transform:"translateY(-50%)",
          fontSize:"clamp(180px,40vw,360px)", color:C.gold, opacity:.02,
          fontFamily:Fs, fontWeight:800, lineHeight:1,
          pointerEvents:"none", userSelect:"none",
          animation:"gv-breathe 12s ease-in-out infinite",
        }}>忘</div>

        <div style={{ ...maxW, position:"relative" }}>
          <FadeUp>
            <Tag text="A Lost Connection" />
            <H2 style={{ textAlign:"center" }}>なぜ今、自分の守護神社を<br />知る人が少ないのか</H2>
          </FadeUp>

          {/* Two-column layout */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"32px", alignItems:"start" }}>
            <FadeUp delay={0.06}>
              <div>
                <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:2.2, marginBottom:"18px" }}>
                  「産土神社を知っていますか？」——この問いにすぐ答えられる人は、今の日本にほとんどいません。でも100年前は違いました。
                </p>
                <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:2.2, marginBottom:"18px" }}>
                  産土・氏神・鎮守という考え方は、もともと日本人の生活に深く根づいていました。生まれた土地の神様に見守られながら育ち、家系が受け継いできた縁を大切にし、今いる場所の神様に日々を支えてもらう。
                </p>
                <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:2.2 }}>
                  しかし明治以降の近代化、戦後の都市化と核家族化が進むにつれ、地域と家系のつながりは急速に薄れていきました。<br />
                  <strong style={{ color:C.cream }}>知らなくなったのは、あなたのせいではありません。</strong>
                </p>
              </div>
            </FadeUp>

            <FadeUp delay={0.12}>
              <div style={{
                padding:"30px 28px",
                backgroundImage:`url('${IMG.quotePanelBg}')`,
                backgroundSize:"cover", backgroundPosition:"center",
                border:`1px solid ${C.goldBorder}`, borderRadius:"16px",
                position:"relative", overflow:"hidden",
              }}>
                {/* Dark overlay */}
                <div style={{
                  position:"absolute", inset:0,
                  background:"linear-gradient(135deg,rgba(4,6,11,.88),rgba(4,6,11,.80))",
                  borderRadius:"16px",
                }} />
                <div style={{ position:"relative" }}>
                  <div style={{ fontFamily:Fd, fontSize:"3.5rem", color:C.gold, opacity:.12, lineHeight:.7, marginBottom:"14px" }}>&ldquo;</div>
                  <p style={{ color:C.cream, fontSize:"clamp(1rem,2vw,1.1rem)", lineHeight:2.3, fontWeight:700, marginBottom:"16px" }}>
                    守護神社は、あなたの人生を<br />
                    静かに見守り、導いてくれる<br />
                    最も身近な神様のいる場所です。
                  </p>
                  <div style={{ height:"1px", background:C.goldBorder, marginBottom:"16px" }} />
                  <p style={{ color:C.creamMute, fontSize:"clamp(0.88rem,1.7vw,0.94rem)", lineHeight:1.85 }}>
                    今は、生年月日をもとに<br />自分の守護神社を調べることができます。
                  </p>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      <Ornament />

      {/* ══════════════════════════════════════════════════════
          S04  守護神社とは何か — 視覚的山場②
      ══════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden" }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.definitionBg}')`,
          backgroundSize:"cover", backgroundPosition:"center 35%",
        }} />
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(4,6,11,.97) 0%,rgba(4,6,11,.82) 30%,rgba(4,6,11,.72) 60%,rgba(4,6,11,.96) 100%)",
        }} />
        {/* Ambient glow */}
        <div style={{
          position:"absolute", top:"45%", left:"50%", transform:"translate(-50%,-50%)",
          width:"700px", height:"500px", borderRadius:"50%",
          background:`radial-gradient(ellipse,${C.amberGlow} 0%,transparent 60%)`,
          pointerEvents:"none", animation:"gv-glow 10s ease-in-out infinite",
        }} />

        <div style={{ position:"relative", ...SP }}>
          <div style={{ ...maxW, maxWidth:"720px" }}>
            <FadeUp>
              <Tag text="What Is Guardian Shrine" />
              <H2 style={{ textAlign:"center" }}>守護神社とは、何ですか？</H2>
            </FadeUp>

            <FadeUp delay={0.08}>
              <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.07rem)", lineHeight:2.25, textAlign:"center", marginBottom:"24px" }}>
                生まれた土地や家系、地域のつながりによって、あなたを静かに見守る神社のことです。古くから日本人は、人生の節目に縁のある神社に手を合わせることを大切にしてきました。
              </p>
              <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.07rem)", lineHeight:2.25, textAlign:"center", marginBottom:"32px" }}>
                あなたの守護神社を知ることは、自分のルーツを知り、人生の向かうべき方向性を見つめ直す第一歩です。
              </p>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div style={{
                padding:"26px 28px",
                background:"rgba(4,6,11,.78)", backdropFilter:"blur(12px)",
                border:`1px solid ${C.goldB2}`, borderLeft:`3px solid ${C.gold}`,
                borderRadius:"14px", textAlign:"center",
              }}>
                <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.07rem)", lineHeight:2.3, fontStyle:"italic" }}>
                  「なぜか心が落ち着く神社がある」<br />
                  「人生の節目に、不思議と引き寄せられる場所がある」<br /><br />
                  そうした感覚は、守護神社との縁によるものかもしれません。
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      <Ornament />

      {/* ══════════════════════════════════════════════════════
          S05  三つの守護神社
      ══════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden" }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.threeShrineBg}')`,
          backgroundSize:"cover", backgroundPosition:"center 40%",
        }} />
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(4,6,11,.98) 0%,rgba(4,6,11,.78) 32%,rgba(4,6,11,.62) 55%,rgba(4,6,11,.80) 78%,rgba(4,6,11,.98) 100%)",
        }} />

        <div style={{ position:"relative", ...SP }}>
          <div style={maxW}>
            <FadeUp>
              <Tag text="Three Guardian Shrines" />
              <H2 style={{ textAlign:"center" }}>あなたを見守る神社は、<br />ひとつとは限りません。</H2>
              <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", textAlign:"center", lineHeight:2.1, maxWidth:"640px", margin:"0 auto 52px" }}>
                古くから日本では、人と土地の間には深い縁があると考えられてきました。生まれた土地、家系が守り続けてきた土地、今暮らしている土地。それぞれに、あなたを静かに支える「守り」があります。
              </p>
            </FadeUp>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(275px,1fr))", gap:"18px" }}>
              {SHRINES.map((s,i)=>(
                <FadeUp key={i} delay={i*.09}>
                  <div className="gv-shrine-card" style={{
                    padding:"34px 26px",
                    background:"rgba(4,6,11,.84)", backdropFilter:"blur(20px)",
                    border:`1px solid ${s.accent}40`, borderTop:`3px solid ${s.accent}`,
                    borderRadius:"16px", position:"relative", overflow:"hidden",
                    height:"100%",
                  }}>
                    {/* Watermark */}
                    <div style={{ position:"absolute", bottom:"8px", right:"14px", fontSize:"5rem", color:s.accent, opacity:.055, fontFamily:Fs, fontWeight:800, lineHeight:1, pointerEvents:"none" }}>{s.icon}</div>
                    <p style={{ fontFamily:Fd, fontSize:"0.58rem", letterSpacing:"0.34em", color:s.accent, marginBottom:"8px", opacity:.82 }}>{s.reading}</p>
                    <h3 style={{ fontSize:"clamp(1.15rem,2.6vw,1.32rem)", fontWeight:800, color:C.cream, marginBottom:"6px", fontFamily:Fs }}>{s.name}</h3>
                    <p style={{ fontFamily:Fd, fontSize:"0.7rem", color:s.accent, opacity:.75, marginBottom:"16px", letterSpacing:"0.06em" }}>{s.meaning}</p>
                    <p style={{ color:C.creamDim, fontSize:"clamp(0.95rem,1.9vw,1.02rem)", lineHeight:2, marginBottom:"14px" }}>{s.desc}</p>
                    <div style={{ padding:"8px 14px", background:`${s.accent}12`, border:`1px solid ${s.accent}28`, borderRadius:"8px" }}>
                      <p style={{ color:s.accent, fontSize:"0.82rem", opacity:.85 }}>{s.detail}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Ornament />

      {/* ══════════════════════════════════════════════════════
          S06  なぜ守護神社を知ることが大切か
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bgNavy, position:"relative", overflow:"hidden" }}>
        <div style={{ ...maxW }}>
          <FadeUp>
            <Tag text="Why It Matters" />
            <H2 style={{ textAlign:"center" }}>なぜ、守護神社を知ることが<br />人生のヒントになるのか</H2>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"32px", alignItems:"start" }}>
            <FadeUp delay={0.06}>
              <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:2.25, marginBottom:"18px" }}>
                守護神社を知ることは、未来を占うことではありません。自分のルーツ、土地との縁、今いる場所との関係性を整理することで、自分という人間をもう少し深く理解するための<strong style={{ color:C.cream }}>「地図」</strong>を手に入れることです。
              </p>
              <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", lineHeight:2.25 }}>
                有名だから、話題だから、友人に勧められたから。そういった理由で参拝先を選ぶことは、<strong style={{ color:C.cream }}>「他の人の処方箋を自分の診断なしに飲み続けること」</strong>に似ているかもしれません。
              </p>
            </FadeUp>

            <FadeUp delay={0.12}>
              <div style={{
                padding:"28px 26px",
                background:C.goldFaint, border:`1px solid ${C.goldBorder}`,
                borderRadius:"16px",
              }}>
                <p style={{ fontFamily:Fd, fontSize:"0.58rem", letterSpacing:"0.44em", color:C.gold, marginBottom:"18px", opacity:.72 }}>守護神社を知ると、こんな変化が起こります</p>
                {BENEFITS_LIST.map((b,i)=>(
                  <div key={i} style={{
                    display:"flex", gap:"12px", alignItems:"flex-start",
                    marginBottom: i<BENEFITS_LIST.length-1 ? "14px" : "0",
                  }}>
                    <div style={{
                      flexShrink:0, width:"18px", height:"18px", borderRadius:"4px",
                      background:`${C.gold}22`, border:`1px solid ${C.goldBorder}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      marginTop:"3px",
                    }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5 4-4" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p style={{ color:C.creamDim, fontSize:"clamp(0.95rem,1.9vw,1.02rem)", lineHeight:1.85 }}>{b}</p>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      <Ornament />

      {/* ══════════════════════════════════════════════════════
          S07  この診断でわかること
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

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:"12px" }}>
            {DIAG.map((item,i)=>(
              <FadeUp key={i} delay={i*.04}>
                <div className="gv-card" style={{
                  padding:"22px 18px",
                  background:C.card, border:`1px solid ${C.goldBorder}`,
                  borderRadius:"14px", height:"100%",
                  display:"flex", flexDirection:"column", gap:"10px",
                }}>
                  {/* Icon circle */}
                  <div style={{
                    width:"44px", height:"44px", borderRadius:"50%",
                    background:C.goldFaint, border:`1px solid ${C.goldBorder}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:Fs, fontSize:"1.1rem", fontWeight:800, color:C.gold,
                    flexShrink:0,
                  }}>{item.kanji}</div>
                  <div>
                    <p style={{ fontFamily:Fd, fontSize:"0.58rem", letterSpacing:"0.36em", color:C.gold, marginBottom:"6px", opacity:.6 }}>{item.no}</p>
                    <h3 style={{ color:C.cream, fontSize:"clamp(0.9rem,1.8vw,0.97rem)", fontWeight:700, marginBottom:"8px", lineHeight:1.45 }}>{item.title}</h3>
                    <p style={{ color:C.creamMute, fontSize:"clamp(0.82rem,1.5vw,0.88rem)", lineHeight:1.78 }}>{item.desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <Ornament />

      {/* ══════════════════════════════════════════════════════
          S08  診断ロジック（五行） — 視覚的山場③
      ══════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden" }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.logicBg}')`,
          backgroundSize:"cover", backgroundPosition:"center center",
        }} />
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(4,6,11,.97) 0%,rgba(4,6,11,.88) 50%,rgba(4,6,11,.97) 100%)",
        }} />
        <div style={{
          position:"absolute", top:"40%", left:"50%", transform:"translate(-50%,-50%)",
          width:"800px", height:"600px", borderRadius:"50%",
          background:`radial-gradient(ellipse,${C.goldGlow} 0%,transparent 62%)`,
          pointerEvents:"none",
        }} />

        <div style={{ position:"relative", ...SP }}>
          <div style={maxW}>
            <FadeUp>
              <Tag text="Diagnosis Logic" />
              <H2 style={{ textAlign:"center" }}>生年月日と神社データをもとに、<br />あなたのご縁を丁寧に読み解きます。</H2>
              <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", textAlign:"center", lineHeight:2.1, maxWidth:"640px", margin:"0 auto 48px" }}>
                本診断では、5つの要素を組み合わせて、あなたに縁の深い守護神社を導き出します。
              </p>
            </FadeUp>

            {/* Five Elements Orbs */}
            <FadeUp delay={0.08}>
              <div style={{ display:"flex", justifyContent:"center", gap:"clamp(12px,3vw,28px)", marginBottom:"40px", flexWrap:"wrap" }}>
                {ELEMENTS.map((el,i)=>(
                  <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"10px" }}>
                    <div style={{
                      width:"clamp(68px,10vw,90px)", height:"clamp(68px,10vw,90px)",
                      borderRadius:"50%",
                      background:el.bg, border:`2px solid ${el.color}55`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:Fs, fontSize:"clamp(1.6rem,3vw,2.1rem)", fontWeight:800, color:el.color,
                      boxShadow:`0 0 24px ${el.color}28`,
                      animation:`gv-orb-pulse ${3+i*.4}s ease-in-out ${i*.3}s infinite`,
                    }}>{el.kanji}</div>
                    <p style={{ fontFamily:Fd, fontSize:"0.6rem", letterSpacing:"0.06em", color:el.color, opacity:.78 }}>{el.en}</p>
                  </div>
                ))}
              </div>
              {/* Connecting line */}
              <div style={{ display:"flex", justifyContent:"center", marginBottom:"36px" }}>
                <div style={{ width:"100%", maxWidth:"540px", height:"1px", background:`linear-gradient(to right,transparent,${C.goldBorder},transparent)` }} />
              </div>
            </FadeUp>

            {/* Logic cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"14px" }}>
              {LOGIC.map((card,i)=>(
                <FadeUp key={i} delay={i*.07}>
                  <div style={{
                    padding:"24px 22px",
                    background:"rgba(4,6,11,.85)", backdropFilter:"blur(14px)",
                    border:`1px solid ${ELEMENTS[i]?.color ?? C.goldBorder}38`,
                    borderTop:`2px solid ${ELEMENTS[i]?.color ?? C.gold}`,
                    borderRadius:"12px",
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"14px" }}>
                      <span style={{ fontFamily:Fd, fontSize:"0.68rem", color:ELEMENTS[i]?.color ?? C.gold, fontWeight:700, opacity:.72, minWidth:"22px" }}>{card.no}</span>
                      <div style={{ flex:1, height:"1px", background:`${ELEMENTS[i]?.color ?? C.gold}28` }} />
                      <span style={{ fontFamily:Fs, fontSize:"1rem", fontWeight:800, color:ELEMENTS[i]?.color ?? C.gold }}>{ELEMENTS[i]?.kanji}</span>
                    </div>
                    <h3 style={{ color:C.cream, fontSize:"clamp(0.97rem,2vw,1.05rem)", fontWeight:700, marginBottom:"10px" }}>{card.title}</h3>
                    <p style={{ color:C.creamDim, fontSize:"clamp(0.9rem,1.7vw,0.96rem)", lineHeight:1.92 }}>{card.desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>

            <FadeUp>
              <p style={{ color:C.creamMute, fontSize:"0.78rem", textAlign:"center", marginTop:"26px", lineHeight:1.8 }}>
                ※ 本診断は数千年にわたって継承されてきた思想体系に基づいていますが、現代科学とは異なります。参拝先選びのヒントとしてご活用ください。
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      <Ornament />

      {/* ══════════════════════════════════════════════════════
          S09  体験者の声
      ══════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden" }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.testimonialsBg}')`,
          backgroundSize:"cover", backgroundPosition:"center",
        }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(4,6,11,.90)" }} />

        <div style={{ position:"relative", ...SP }}>
          <div style={maxW}>
            <FadeUp>
              <Tag text="Voices" />
              <H2 style={{ textAlign:"center" }}>守護神社診断を使った方の声</H2>
              <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", textAlign:"center", lineHeight:2, marginBottom:"48px" }}>
                「大きく変わった」という話ではなく、静かに腑に落ちた方の声をご紹介します。
              </p>
            </FadeUp>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))", gap:"18px" }}>
              {VOICES.map((v,i)=>(
                <FadeUp key={i} delay={i*.07}>
                  <div className="gv-card" style={{
                    padding:"26px 22px",
                    background:C.card, border:`1px solid ${C.goldBorder}`,
                    borderRadius:"14px",
                  }}>
                    {/* Avatar + label */}
                    <div style={{ display:"flex", gap:"12px", alignItems:"center", marginBottom:"16px" }}>
                      <div style={{
                        width:"40px", height:"40px", borderRadius:"50%",
                        background:C.goldFaint, border:`1px solid ${C.goldBorder}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontFamily:Fs, fontSize:"1.1rem", fontWeight:800, color:C.gold, flexShrink:0,
                      }}>人</div>
                      <div>
                        <p style={{ color:C.cream, fontSize:"0.85rem", fontWeight:700 }}>{v.label}</p>
                        <p style={{ color:C.creamMute, fontSize:"0.75rem" }}>{v.job}</p>
                      </div>
                    </div>
                    {/* Pull quote */}
                    <div style={{
                      padding:"8px 14px", marginBottom:"14px",
                      background:C.goldFaint, border:`1px solid ${C.goldBorder}`, borderRadius:"8px",
                    }}>
                      <p style={{ fontFamily:Fd, fontSize:"0.72rem", color:C.gold, letterSpacing:"0.04em" }}>「{v.pull}」</p>
                    </div>
                    <p style={{ color:C.creamDim, fontSize:"clamp(0.9rem,1.7vw,0.97rem)", lineHeight:2 }}>{v.text}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Ornament />

      {/* ══════════════════════════════════════════════════════
          S10  診断フォーム — 視覚的山場④
      ══════════════════════════════════════════════════════ */}
      <section ref={formRef} id="diagnose" style={{ position:"relative", overflow:"hidden" }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.formBg}')`,
          backgroundSize:"cover", backgroundPosition:"center",
        }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(4,6,11,.88)" }} />
        <div style={{
          position:"absolute", top:"40%", left:"50%", transform:"translate(-50%,-50%)",
          width:"700px", height:"600px", borderRadius:"50%",
          background:`radial-gradient(ellipse,rgba(201,155,77,.06) 0%,transparent 60%)`,
          pointerEvents:"none",
        }} />

        <div style={{ position:"relative", ...SP }}>
          <div style={maxW}>
            <FadeUp>
              <Tag text="Free Diagnosis" />
              <H2 style={{ textAlign:"center" }}>あなたのご縁を、<br />今すぐ無料で調べる</H2>
              <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", textAlign:"center", lineHeight:2, maxWidth:"580px", margin:"0 auto 40px" }}>
                生年月日を入力するだけで、あなたに縁の深い守護神社を診断できます。
              </p>
            </FadeUp>

            <FadeUp delay={0.1}>
              <div style={{ maxWidth:"680px", margin:"0 auto" }}>
                <div style={{
                  background:"rgba(4,6,11,.92)", backdropFilter:"blur(16px)",
                  border:`1px solid ${C.goldBorder}`, borderRadius:"20px",
                  padding:"clamp(26px,5vw,48px)",
                }}>
                  {/* Form fields */}
                  <div style={{ marginBottom:"22px" }}>
                    <label style={{ display:"block", fontFamily:Fd, fontSize:"0.6rem", letterSpacing:"0.4em", color:C.gold, marginBottom:"8px", opacity:.78 }}>
                      生年月日（必須）
                    </label>
                    <input
                      type="date"
                      value={birthdate}
                      onChange={e=>setBirthdate(e.target.value)}
                      style={{
                        width:"100%", padding:"12px 16px",
                        background:"rgba(4,6,11,.8)", border:`1px solid ${C.goldBorder}`,
                        borderRadius:"10px", color:C.cream, fontSize:"1rem",
                        fontFamily:Fs, outline:"none",
                        boxSizing:"border-box" as const,
                      }}
                    />
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"16px", marginBottom:"22px" }}>
                    <div>
                      <label style={{ display:"block", fontFamily:Fd, fontSize:"0.6rem", letterSpacing:"0.4em", color:C.gold, marginBottom:"8px", opacity:.78 }}>
                        現在の都道府県（任意）
                      </label>
                      <select
                        value={prefecture}
                        onChange={e=>setPrefecture(e.target.value)}
                        style={{
                          width:"100%", padding:"12px 16px",
                          background:"rgba(4,6,11,.8)", border:`1px solid ${C.goldBorder}`,
                          borderRadius:"10px", color:C.cream, fontSize:"0.97rem",
                          fontFamily:Fs, outline:"none",
                          boxSizing:"border-box" as const,
                        }}
                      >
                        {PREFECTURES.map(p=><option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display:"block", fontFamily:Fd, fontSize:"0.6rem", letterSpacing:"0.4em", color:C.gold, marginBottom:"12px", opacity:.78 }}>
                        性別（任意）
                      </label>
                      <div style={{ display:"flex", gap:"12px" }}>
                        {["男性","女性","選択しない"].map(g=>(
                          <label key={g} style={{ display:"flex", alignItems:"center", gap:"6px", cursor:"pointer" }}>
                            <input
                              type="radio" name="gender" value={g}
                              checked={gender===g}
                              onChange={()=>setGender(g)}
                              style={{ accentColor:C.gold }}
                            />
                            <span style={{ color:C.creamDim, fontSize:"0.92rem" }}>{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom:"28px" }}>
                    <label style={{ display:"block", fontFamily:Fd, fontSize:"0.6rem", letterSpacing:"0.4em", color:C.gold, marginBottom:"10px", opacity:.78 }}>
                      相談テーマ（任意・複数選択可）
                    </label>
                    <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                      {THEMES.map(t=>(
                        <button key={t} onClick={()=>setTheme(t)} style={{
                          padding:"7px 14px",
                          background: theme===t ? C.goldFaint : "rgba(4,6,11,.7)",
                          border:`1px solid ${theme===t ? C.goldB2 : C.goldBorder}`,
                          borderRadius:"20px",
                          color: theme===t ? C.gold : C.creamMute,
                          fontSize:"0.85rem", cursor:"pointer", fontFamily:Fs,
                        }}>{t}</button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleDiagnose}
                    className="gv-btn gv-gold-btn"
                    style={{
                      display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
                      width:"100%", padding:"20px 24px",
                      border:"none", borderRadius:"12px",
                      color:"#fff", fontSize:"clamp(1rem,2.5vw,1.1rem)",
                      fontWeight:800, letterSpacing:"0.12em",
                      boxShadow:"0 6px 36px rgba(0,0,0,.6),0 0 24px rgba(201,155,77,.15)",
                      fontFamily:Fs, marginBottom:"14px",
                    }}
                  >
                    <ToriiIcon />
                    無料で守護神社を診断する
                  </button>

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
        </div>
      </section>

      <Ornament />

      {/* ══════════════════════════════════════════════════════
          S11  FAQ — 2列
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bg }}>
        <div style={maxW}>
          <FadeUp>
            <Tag text="FAQ" />
            <H2 style={{ textAlign:"center" }}>よくある質問</H2>
            <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.06rem)", textAlign:"center", lineHeight:1.9, marginBottom:"48px" }}>
              ご不明な点はこちらでご確認ください。
            </p>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"10px" }}>
            {/* Left column */}
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {FAQS_L.map((faq,i)=>(
                <FadeUp key={i} delay={i*.04}>
                  <div style={{ background:C.card, border:`1px solid ${C.goldBorder}`, borderRadius:"12px", overflow:"hidden" }}>
                    <button
                      onClick={()=>setOpenFaqL(openFaqL===i?null:i)}
                      style={{
                        width:"100%", padding:"16px 20px",
                        background:"transparent", border:"none", cursor:"pointer",
                        color:C.cream, fontSize:"clamp(0.92rem,1.8vw,0.98rem)", fontWeight:600,
                        textAlign:"left", display:"flex", justifyContent:"space-between",
                        alignItems:"center", gap:"12px", fontFamily:Fs, lineHeight:1.5,
                      }}
                    >
                      <span>Q. {faq.q}</span>
                      <span style={{ color:C.gold, fontSize:"1.15rem", flexShrink:0, transition:"transform .3s ease", transform:openFaqL===i?"rotate(45deg)":"none", display:"inline-block", opacity:.72 }}>+</span>
                    </button>
                    <div className={`gv-faq${openFaqL===i?" open":""}`}>
                      <div style={{ padding:"0 20px 16px", borderTop:`1px solid rgba(201,155,77,.07)` }}>
                        <p style={{ color:C.creamDim, fontSize:"clamp(0.9rem,1.7vw,0.96rem)", lineHeight:1.95, paddingTop:"14px" }}>A. {faq.a}</p>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
            {/* Right column */}
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {FAQS_R.map((faq,i)=>(
                <FadeUp key={i} delay={i*.04+.1}>
                  <div style={{ background:C.card, border:`1px solid ${C.goldBorder}`, borderRadius:"12px", overflow:"hidden" }}>
                    <button
                      onClick={()=>setOpenFaqR(openFaqR===i?null:i)}
                      style={{
                        width:"100%", padding:"16px 20px",
                        background:"transparent", border:"none", cursor:"pointer",
                        color:C.cream, fontSize:"clamp(0.92rem,1.8vw,0.98rem)", fontWeight:600,
                        textAlign:"left", display:"flex", justifyContent:"space-between",
                        alignItems:"center", gap:"12px", fontFamily:Fs, lineHeight:1.5,
                      }}
                    >
                      <span>Q. {faq.q}</span>
                      <span style={{ color:C.gold, fontSize:"1.15rem", flexShrink:0, transition:"transform .3s ease", transform:openFaqR===i?"rotate(45deg)":"none", display:"inline-block", opacity:.72 }}>+</span>
                    </button>
                    <div className={`gv-faq${openFaqR===i?" open":""}`}>
                      <div style={{ padding:"0 20px 16px", borderTop:`1px solid rgba(201,155,77,.07)` }}>
                        <p style={{ color:C.creamDim, fontSize:"clamp(0.9rem,1.7vw,0.96rem)", lineHeight:1.95, paddingTop:"14px" }}>A. {faq.a}</p>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Ornament />

      {/* ══════════════════════════════════════════════════════
          S12  LINE 受け取り導線
      ══════════════════════════════════════════════════════ */}
      <section style={{ ...SP, background:C.bgNavy }}>
        <div style={maxW}>
          <FadeUp>
            <Tag text="LINE Offer" color={C.green} />
            <H2 style={{ textAlign:"center" }}>診断結果をLINEで受け取ると、<br />さらに詳しく見られます。</H2>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"40px", alignItems:"center" }}>
            {/* Benefits */}
            <FadeUp delay={0.06}>
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"12px", marginBottom:"28px" }}>
                  {LINE_BENEFITS.map((item,i)=>(
                    <div key={i} style={{
                      display:"flex", gap:"14px", alignItems:"flex-start",
                      padding:"16px 18px",
                      background:C.greenFaint, border:`1px solid ${C.greenBorder}`,
                      borderRadius:"12px",
                    }}>
                      <span style={{ fontSize:"1.4rem", flexShrink:0 }}>{item.icon}</span>
                      <div>
                        <p style={{ color:C.cream, fontSize:"0.92rem", fontWeight:700, marginBottom:"4px" }}>{item.title}</p>
                        <p style={{ color:C.creamMute, fontSize:"0.82rem", lineHeight:1.65 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding:"12px 16px", background:"rgba(4,6,11,.75)", border:`1px solid ${C.goldBorder}`, borderRadius:"10px", marginBottom:"20px", textAlign:"center" }}>
                  <p style={{ color:C.creamMute, fontSize:"0.78rem", lineHeight:1.85 }}>
                    LINEへの登録は任意です。費用は発生しません。いつでも退会可能。<br />
                    個人情報の第三者提供は行いません。
                  </p>
                </div>

                <a
                  href="https://lin.ee/placeholder"
                  target="_blank"
                  rel="noreferrer"
                  className="gv-btn"
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
                    width:"100%", padding:"18px 20px",
                    background:C.line, borderRadius:"12px",
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

            {/* Phone mockup */}
            <FadeUp delay={0.12}>
              <div style={{ display:"flex", justifyContent:"center" }}>
                <div style={{
                  width:"200px", animation:"gv-float 4s ease-in-out infinite",
                  filter:`drop-shadow(0 20px 40px rgba(6,199,85,.18))`,
                }}>
                  {/* Phone frame */}
                  <div style={{
                    borderRadius:"28px", padding:"14px 10px",
                    background:"linear-gradient(145deg,#1a2030,#0d1020)",
                    border:"2px solid rgba(201,155,77,.25)",
                    boxShadow:"0 20px 60px rgba(0,0,0,.6)",
                  }}>
                    {/* Notch */}
                    <div style={{ width:"70px", height:"6px", background:"rgba(0,0,0,.9)", borderRadius:"3px", margin:"0 auto 10px", border:"1px solid rgba(255,255,255,.05)" }} />
                    {/* Screen */}
                    <div style={{ borderRadius:"14px", overflow:"hidden", background:"#0a0f1a" }}>
                      {/* LINE header */}
                      <div style={{ background:"#06C755", padding:"10px 12px", display:"flex", alignItems:"center", gap:"8px" }}>
                        <div style={{ width:"24px", height:"24px", borderRadius:"50%", background:"rgba(255,255,255,.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px" }}>⛩</div>
                        <div>
                          <p style={{ color:"#fff", fontSize:"10px", fontWeight:700, lineHeight:1.2 }}>守護神社診断</p>
                          <p style={{ color:"rgba(255,255,255,.7)", fontSize:"8px" }}>オンライン</p>
                        </div>
                      </div>
                      {/* Messages */}
                      <div style={{ padding:"12px 8px", display:"flex", flexDirection:"column", gap:"8px", minHeight:"180px" }}>
                        {[
                          { me:false, text:"診断結果が届きました" },
                          { me:false, text:"あなたの守護神社は..." },
                          { me:true,  text:"ありがとうございます！" },
                        ].map((msg,i)=>(
                          <div key={i} style={{ display:"flex", justifyContent:msg.me?"flex-end":"flex-start" }}>
                            <div style={{
                              maxWidth:"130px", padding:"7px 10px", borderRadius:msg.me?"12px 4px 12px 12px":"4px 12px 12px 12px",
                              background:msg.me?"#06C755":"rgba(255,255,255,.1)",
                              color:msg.me?"#fff":C.creamDim, fontSize:"9px", lineHeight:1.5,
                            }}>{msg.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Home button */}
                    <div style={{ width:"50px", height:"4px", background:"rgba(255,255,255,.15)", borderRadius:"2px", margin:"10px auto 0" }} />
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          S13  最終CTA — 視覚的山場④
      ══════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden" }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.finalCtaBg}')`,
          backgroundSize:"cover", backgroundPosition:"center",
        }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(4,6,11,.90)" }} />
        {/* 守 watermark */}
        <div style={{
          position:"absolute", bottom:"-60px", left:"50%", transform:"translateX(-50%)",
          fontSize:"clamp(220px,58vw,420px)", color:C.gold, opacity:.02,
          fontFamily:Fs, fontWeight:800, lineHeight:1,
          pointerEvents:"none", userSelect:"none",
          animation:"gv-breathe 14s ease-in-out infinite",
        }}>守</div>
        {/* Glow */}
        <div style={{
          position:"absolute", top:"40%", left:"50%", transform:"translate(-50%,-50%)",
          width:"800px", height:"600px", borderRadius:"50%",
          background:`radial-gradient(ellipse,${C.goldGlow} 0%,transparent 62%)`,
          pointerEvents:"none",
        }} />

        <div style={{ position:"relative", padding:`clamp(96px,13vw,160px) ${PX} clamp(110px,14vw,160px)` }}>
          <div style={{ ...maxW, textAlign:"center" }}>
            <FadeUp>
              <div style={{ display:"inline-block", padding:"5px 22px", background:C.goldFaint, border:`1px solid ${C.goldBorder}`, borderRadius:"30px", marginBottom:"32px" }}>
                <p style={{ fontFamily:Fd, fontSize:"0.58rem", letterSpacing:"0.46em", color:C.gold, fontWeight:600 }}>完全無料 ／ 登録不要</p>
              </div>

              <h2 style={{ fontSize:"clamp(2rem,5.5vw,3.2rem)", marginBottom:"28px", lineHeight:1.45, fontWeight:800, fontFamily:Fs }}>
                神社との縁は、<br />気づいた瞬間から始まります。
              </h2>

              <div style={{ maxWidth:"640px", margin:"0 auto 44px" }}>
                <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.08rem)", lineHeight:2.35, marginBottom:"20px", fontStyle:"italic" }}>
                  あなたが生まれた場所。今、暮らしている場所。なぜか心惹かれる場所。
                </p>
                <p style={{ color:C.creamDim, fontSize:"clamp(1rem,2vw,1.08rem)", lineHeight:2.25 }}>
                  そのすべてが、あなたの人生と静かにつながっているかもしれません。<br />
                  まずは無料診断で、縁の深い守護神社を知ることから始めてみませんか。
                </p>
              </div>

              {/* Stats row */}
              <div style={{ display:"flex", justifyContent:"center", gap:"28px", marginBottom:"40px", flexWrap:"wrap" }}>
                {[["31,247社","収録神社"],["87,341件","累計診断"],["47都道府県","全国対応"]].map(([n,l])=>(
                  <div key={l} style={{ textAlign:"center" }}>
                    <p style={{ fontFamily:Fd, fontSize:"1.2rem", fontWeight:700, color:C.gold }}>{n}</p>
                    <p style={{ fontSize:"0.65rem", color:C.creamMute, marginTop:"2px" }}>{l}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={scrollToForm}
                className="gv-btn gv-gold-btn"
                style={{
                  display:"inline-flex", alignItems:"center", gap:"10px",
                  padding:"22px 44px",
                  border:"none", borderRadius:"14px",
                  color:"#fff", fontSize:"clamp(1.05rem,2.6vw,1.2rem)",
                  fontWeight:800, letterSpacing:"0.12em",
                  boxShadow:"0 8px 48px rgba(0,0,0,.65),0 0 32px rgba(201,155,77,.18)",
                  fontFamily:Fs, marginBottom:"14px",
                }}
              >
                <ToriiIcon />
                今すぐ無料で守護神社を調べる
              </button>

              <p style={{ color:C.creamMute, fontSize:"0.72rem", letterSpacing:"0.08em" }}>
                生年月日を入力するだけ ／ 所要時間 約30秒 ／ 全国31,247社対応
              </p>
            </FadeUp>

            {/* P.S. */}
            <FadeUp>
              <div style={{
                maxWidth:"540px", margin:"60px auto 0",
                padding:"28px 26px",
                background:C.goldFaint, border:`1px solid ${C.goldBorder}`,
                borderRadius:"16px", textAlign:"left",
              }}>
                <p style={{ fontFamily:Fd, fontSize:"0.58rem", letterSpacing:"0.46em", color:C.gold, fontWeight:600, marginBottom:"14px" }}>P.S.</p>
                <p style={{ color:C.creamDim, fontSize:"clamp(0.95rem,1.9vw,1.02rem)", lineHeight:2.25 }}>
                  毎年、初詣に行くたびに「今年こそ」と思う。神社が好きで、参拝を続けてきた。それなのになぜか、何かが変わらないと感じている。<br /><br />
                  もしそれが、縁の深い神社との出会いを知らなかったことが理由の一つだとしたら。<br /><br />
                  今日、あなたがここにたどり着いたことが、その縁の始まりかもしれません。
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding:`26px ${PX} 80px`,
        textAlign:"center",
        borderTop:`1px solid ${C.goldBorder}`,
        background:C.bg,
      }}>
        <div style={{ display:"flex", justifyContent:"center", gap:"28px", flexWrap:"wrap" }}>
          {[
            { href:"/",         label:"トップページ" },
            { href:"/diagnose", label:"守護神社診断" },
            { href:"/guardian", label:"守護神社LP" },
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
