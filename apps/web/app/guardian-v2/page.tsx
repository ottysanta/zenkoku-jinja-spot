"use client";

import {
  useRef, useState, useEffect,
  type ReactNode, type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ── Image map ───────────────────────────────────────────────────────────── */
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
  // Raw images — used for shrine cards and accent sections
  raw01: "/images/guardian/assets/raw-01.webp",
  raw02: "/images/guardian/assets/raw-02.webp",
  raw03: "/images/guardian/assets/raw-03.webp",
  raw04: "/images/guardian/assets/raw-04.webp",
  raw05: "/images/guardian/assets/raw-05.webp",
  raw06: "/images/guardian/assets/raw-06.webp",
  raw07: "/images/guardian/assets/raw-07.webp",
  raw08: "/images/guardian/assets/raw-08.webp",
  raw09: "/images/guardian/assets/raw-09.webp",
  raw10: "/images/guardian/assets/raw-10.webp",
  raw11: "/images/guardian/assets/raw-11.webp",
  raw12: "/images/guardian/assets/raw-12.webp",
  raw13: "/images/guardian/assets/raw-13.webp",
  raw14: "/images/guardian/assets/raw-14.webp",
  raw15: "/images/guardian/assets/raw-15.webp",
  raw16: "/images/guardian/assets/raw-16.webp",
  raw17: "/images/guardian/assets/raw-17.webp",
  raw18: "/images/guardian/assets/raw-18.webp",
  raw19: "/images/guardian/assets/raw-19.webp",
  raw20: "/images/guardian/assets/raw-20.webp",
} as const;

/* ── Color tokens ────────────────────────────────────────────────────────── */
const C = {
  ink:    "#03050a",
  dark2:  "#060408",
  gold:   "#C99B4D",
  goldL:  "#E8C87C",
  goldD:  "#A07830",
  gFaint: "rgba(201,155,77,0.07)",
  gBd:    "rgba(201,155,77,0.22)",
  gBd2:   "rgba(201,155,77,0.45)",
  gGlow:  "rgba(201,155,77,0.18)",
  emBd:   "rgba(74,138,104,0.30)",
  emFg:   "#4a8a68",
  cream:  "#f5efe2",
  crDim:  "rgba(245,239,226,0.75)",
  crMut:  "rgba(245,239,226,0.38)",
} as const;

const Fd = "'Cormorant Garamond', Georgia, serif";
const Fs = "'Shippori Mincho B1','Hiragino Mincho ProN','Yu Mincho',serif";
const PX = "clamp(20px,5.5vw,72px)";

/* ── Static data ─────────────────────────────────────────────────────────── */
const WORRIES = [
  { n:"一", c:"#7a94c0", t:"何となく運気が滞っている気がする", sub:"初詣くらいしか神社に行かないが、「自分に縁の深い神社」というものをよく知らないまま何十年も過ごしてきた。" },
  { n:"二", c:"#C99B4D", t:"自分の進むべき道に迷いを感じる", sub:"転職・結婚・引越しなど大切な決断の前に、どこかに手を合わせたいと思いながら、どこへ行けばいいか分からなかった。" },
  { n:"三", c:"#6aab8a", t:"神社に行ってもピンとこないことが多い", sub:"産土神・氏神という言葉は聞いたことがあるが、自分とどんな関係があるのか、よく知らないままにしてきた。" },
  { n:"四", c:"#c07840", t:"なかなか決断のときに自信が持てない", sub:"信心深いわけではないが、もし自分と縁の深い場所があるなら、一度は知ってみたいと思っている。" },
  { n:"五", c:"#9870b0", t:"大切な決断のときに背中を押してほしい", sub:"有名なパワースポットや話題の神社に行くが、それが本当に自分に合うかどうか分からないまま参拝している。" },
  { n:"六", c:"#a08840", t:"家族や気の縁のつながりを感じたい", sub:"神社で手を合わせるとき、自分が誰に何を届けているのか、なんとなく分からないまま帰ることがある。" },
];

const SHRINES = [
  { name:"産土神社", rd:"うぶすなじんじゃ", icon:"産", ac:"#6aab8a", img: IMG.raw03,
    tag:"魂の根と、生まれた縁を守る",
    desc:"あなたが生まれた土地と深く結びつく神社。どれだけ遠く離れても、この縁は一生続くとされています。" },
  { name:"氏神神社", rd:"うじがみじんじゃ", icon:"氏", ac:"#C99B4D", img: IMG.raw05,
    tag:"家系と家族の縁を守る",
    desc:"家系や地域のつながりを見守る神社。先祖から受け継いできた流れを象徴します。" },
  { name:"鎮守神社", rd:"ちんじゅじんじゃ", icon:"鎮", ac:"#7090c0", img: IMG.raw09,
    tag:"今の暮らしと場所の縁を守る",
    desc:"今いる土地での日々の暮らしを見守る神社。仕事・健康・現在の環境との相性を象徴します。" },
];

const WHY_UNKNOWN = {
  body: [
    "現代では、生まれた場所と家系のつながりが薄れ、「自分を主に見守る神様がいる」という感覚を持ちにくい時代になっています。",
    "また、情報が多すぎて、本質的なことに向き合う余裕が少なくなっていることも、その理由のひとつです。",
    "守護神社が分からないでいる人が多いのは、正しく教えてくれる機会がないからです。本来、「自分を主に見守る神様のいる場所」を知ることが、人生の根拠になるはずです。その「縁」を知ることで、人生の見え方が静かに変わります。",
  ],
  quote: "守護神社は、あなたの人生を静かに見守り、導いてくれる最も身近な神様のいる場所です。",
};

const WHY_HINT = {
  lead: "守護神社を知ると、自分分析や幸運を呼び込む行動を具体的に取れるようになります。あなたに合った神社を知ることで、こんな変化が起きます",
  benefits: [
    "自分の性格や流れを客観的に知れるようになる",
    "運気の流れを前もってつかめるようになる",
    "人間関係や仕事がスムーズになる",
    "毎日の生活に安心感と自信が生まれる",
  ],
};

const DIAGNOSIS_ITEMS = [
  { icon:"鳥", c:"#C99B4D", t:"縁の濃い神社",      d:"あなたに縁の深い守護神社がわかります" },
  { icon:"地", c:"#6aab8a", t:"生まれた地の縁",    d:"出生地との縁と守護エネルギーを読みます" },
  { icon:"風", c:"#7a94c0", t:"今の運気",          d:"現在の運気の流れとその傾向がわかります" },
  { icon:"暦", c:"#c07840", t:"参拝のタイミング",  d:"運気が上がる最適な参拝タイミングを特定" },
  { icon:"願", c:"#9870b0", t:"願いごとの方向性",  d:"叶えやすい願いごとの方向性がわかります" },
  { icon:"開", c:"#C99B4D", t:"開運アクション",    d:"今日からできる具体的な開運アクション" },
  { icon:"神", c:"#6aab8a", t:"相性の良い神様",    d:"あなたと縁が深い神様と神社がわかります" },
  { icon:"！", c:"#c07840", t:"注意すべきポイント", d:"今の自分の弱みや注意点がわかります" },
];

const ELEMENTS = [
  { k:"木", c:"#4a8a5a", s:"0 0 28px rgba(74,138,90,.4)"   },
  { k:"火", c:"#c04030", s:"0 0 28px rgba(192,64,48,.4)"   },
  { k:"土", c:"#c09030", s:"0 0 28px rgba(192,144,48,.4)"  },
  { k:"金", c:"#9098b8", s:"0 0 28px rgba(144,152,184,.4)" },
  { k:"水", c:"#3480c0", s:"0 0 28px rgba(52,128,192,.4)"  },
];

const VOICES = [
  { label:"30代 女性", pull:"参拝してみると、気持ちが整理された",
    text:"診断で出てきた神社が、昔から気になっていた場所で驚きました。参拝してみると気持ちが整理され、今やるべきことが少し見えた気がします。" },
  { label:"40代 女性", pull:"何かが静かに腑に落ちた感覚",
    text:"氏神神社という考え方を知り、自分の家系や土地とのつながりを改めて考えるきっかけになりました。大げさな変化ではないけれど、静かに腑に落ちた感覚があります。" },
  { label:"40代 男性", pull:"こんな考え方があるんだと、素直に驚いた",
    text:"占いは信じないタイプですが、文化・歴史的な話として読んだら面白かった。産土神社という考え方は知らなかったし、診断で出てきた場所は確かに地元の神社でした。" },
  { label:"50代 男性", pull:"静かに背中を押してくれるような内容",
    text:"大げさな占いではなく、静かに背中を押してくれるような内容で素直に受け取れました。地元の神社に改めて足を運ぶようになり、心が少し軽くなりました。" },
];

const FAQS = [
  { q:"診断に料金はかかりますか？",              a:"かかりません。診断の利用・結果の閲覧はすべて完全無料です。有料オプションや課金は一切ありません。" },
  { q:"登録や個人情報の入力は必要ですか？",      a:"不要です。メールアドレスや氏名などの個人情報は診断には必要ありません。LINEへの登録は任意です。" },
  { q:"生年月日以外に必要な情報はありますか？",  a:"生年月日のみで診断できます。都道府県・性別は任意項目で、入力するとより詳細な結果が得られます。" },
  { q:"診断結果はどこで受け取れますか？",        a:"診断終了後にWebページで確認できます。LINEに登録すると結果の保存・再確認が可能です。" },
  { q:"複数の神社が表示されるのはなぜですか？",  a:"産土・氏神・鎮守という3種類の守護神社がそれぞれ導き出されるためです。縁の深さに応じて複数提案します。" },
  { q:"本当に自分に合った神社が分かりますか？",  a:"数千年にわたって継承されてきた思想体系に基づいていますが、現代科学とは異なります。参拝先選びのヒントとしてご活用ください。" },
  { q:"占いやスピリチュアルとは違うのですか？",  a:"西洋占星術やスピリチュアル系とは異なります。日本古来の産土信仰・五行・神社情報DBに基づく文化的な診断です。" },
  { q:"スマートフォンからでも診断できますか？",  a:"できます。生年月日を入力するだけで、スマートフォンでも約30秒で診断結果が確認できます。" },
];

const THEMES = ["全般","仕事・事業","恋愛・縁結び","金運","健康","人間関係","家族のこと","その他"];
const PREFS  = [
  "選択しない","北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県",
  "三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

/* ── Hooks / utilities ───────────────────────────────────────────────────── */
function useInView(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, set] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { set(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, v };
}

function FadeUp({ children, delay=0, style: sx={} }: { children:ReactNode; delay?:number; style?:CSSProperties }) {
  const { ref, v } = useInView();
  return (
    <div ref={ref} style={{
      opacity: v?1:0, transform: v?"translateY(0)":"translateY(32px)",
      transition:`opacity .9s ease ${delay}s, transform .9s ease ${delay}s`, ...sx,
    }}>{children}</div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════════════════════════ */
export default function GuardianV2() {
  const router  = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const [faq,  setFaq]  = useState<number|null>(null);
  const [bday, setBday] = useState("");
  const [pref, setPref] = useState("選択しない");
  const [gen,  setGen]  = useState("");
  const [thm,  setThm]  = useState("全般");

  const W: CSSProperties = { maxWidth:"980px", margin:"0 auto", width:"100%" };

  /* load fonts + shared keyframes */
  useEffect(() => {
    const lk = document.createElement("link");
    lk.rel="stylesheet";
    lk.href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Shippori+Mincho+B1:wght@400;700;800&display=swap";
    document.head.appendChild(lk);

    const st = document.createElement("style");
    st.setAttribute("data-gv2","1");
    st.textContent = `
      @keyframes gvZoom    { from{transform:scale(1.07)} to{transform:scale(1)} }
      @keyframes gvBreathe { 0%,100%{opacity:.02;transform:scale(1)} 50%{opacity:.06;transform:scale(1.012)} }
      @keyframes gvGlow    { 0%,100%{opacity:.06} 50%{opacity:.22} }
      @keyframes gvPulse   { 0%,100%{transform:scale(1);opacity:.82} 50%{transform:scale(1.09);opacity:1} }
      @keyframes gvFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      @keyframes gvShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
      @keyframes gvScroll  { 0%,100%{opacity:.3;transform:translateX(-50%) translateY(0)} 50%{opacity:.8;transform:translateX(-50%) translateY(8px)} }
      @keyframes gvPart    { 0%{transform:translateY(0) translateX(0);opacity:0} 20%{opacity:.6} 80%{opacity:.3} 100%{transform:translateY(-100px) translateX(22px);opacity:0} }
      @keyframes gvRotate  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes gvFade    { 0%,100%{opacity:.15} 50%{opacity:.45} }

      .g-gold {
        background:linear-gradient(135deg,#6a4a10,#8a6220,#c99b4d,#8a6220,#6a4a10);
        background-size:200% 100%;
        position:relative; overflow:hidden; cursor:pointer;
        transition:transform .15s, box-shadow .2s, background-position .4s;
        border:none;
      }
      .g-gold::after {
        content:''; position:absolute; inset:0;
        background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
        background-size:200% 100%;
        animation:gvShimmer 3.2s ease-in-out infinite;
      }
      .g-gold:hover { background-position:100% 0; box-shadow:0 14px 52px rgba(0,0,0,.8),0 0 44px rgba(201,155,77,.36)!important; }
      .g-gold:active { transform:scale(.97)!important; }

      .g-line {
        background:linear-gradient(135deg,#143020,#1d4530,#143020);
        cursor:pointer; transition:transform .15s, box-shadow .2s;
      }
      .g-line:hover { background:linear-gradient(135deg,#1d4530,#2a5038,#1d4530); box-shadow:0 12px 48px rgba(0,0,0,.7),0 0 32px rgba(74,138,104,.35)!important; }
      .g-line:active { transform:scale(.97)!important; }

      .g-hover { transition:transform .3s, box-shadow .3s; }
      .g-hover:hover { transform:translateY(-6px); box-shadow:0 20px 60px rgba(0,0,0,.7),0 0 28px rgba(201,155,77,.14)!important; }

      .g-shrine { transition:transform .35s, box-shadow .35s; cursor:default; }
      .g-shrine:hover { transform:translateY(-10px); box-shadow:0 24px 64px rgba(0,0,0,.8),0 0 32px rgba(201,155,77,.18)!important; }

      .g-orb { animation:gvPulse 3.5s ease-in-out infinite; cursor:default; }
      .g-orb:hover { transform:scale(1.14)!important; }

      .g-faq-body { max-height:0; overflow:hidden; opacity:0; transition:max-height .5s cubic-bezier(.4,0,.2,1), opacity .4s; }
      .g-faq-body.open { max-height:320px; opacity:1; }

      .g-input { transition:border-color .2s, box-shadow .2s; }
      .g-input:focus { border-color:rgba(201,155,77,.6)!important; box-shadow:0 0 0 3px rgba(201,155,77,.15); outline:none; }

      .g-diag-card { transition:transform .3s, box-shadow .3s, border-color .3s; }
      .g-diag-card:hover { transform:translateY(-4px); border-color:rgba(201,155,77,.4)!important; box-shadow:0 12px 40px rgba(0,0,0,.5)!important; }

      /* worries grid cards */
      .g-worry { transition:transform .25s, box-shadow .25s; }
      .g-worry:hover { transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,.55)!important; }

      .g-sticky { display:none; }
      @media(max-width:768px){
        .g-sticky { display:flex; }
        .g-def-img { display:none!important; }
        .g-hero-desk { display:none!important; }
        .g-why-img { display:none!important; }
      }
      @media(min-width:769px){
        .g-hero-mob { background-image:none!important; }
      }
      @media(prefers-reduced-motion:reduce){ *{ animation-duration:.01ms!important; transition-duration:.01ms!important; } }
    `;
    document.head.appendChild(st);
    return () => {
      try{document.head.removeChild(lk);}catch{}
      const s=document.querySelector("style[data-gv2]"); if(s)try{document.head.removeChild(s);}catch{}
    };
  }, []);

  function toForm() { formRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }); }
  function diagnose() {
    const p = new URLSearchParams();
    if(bday){ const[y,m,d]=bday.split("-"); if(y)p.set("year",y); if(m)p.set("month",m); if(d)p.set("day",d); }
    router.push(`/diagnose?${p}`);
  }

  /* ── Reusable micro-components ─────────────────────────────────────────── */
  const Torii = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M3 9h18"/><path d="M5 9V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
      <path d="M12 5V3"/><path d="M7 9v12"/><path d="M17 9v12"/><path d="M9 21h6"/>
    </svg>
  );

  const Tag = ({t, c=C.gold}: {t:string; c?:string}) => (
    <p style={{
      fontFamily:Fd, fontSize:"0.57rem", letterSpacing:"0.55em", color:c,
      textTransform:"uppercase", textAlign:"center", marginBottom:"16px",
      borderBottom:`1px solid ${c}28`, display:"inline-block", paddingBottom:"6px",
      left:"50%", position:"relative", transform:"translateX(-50%)",
    }}>{t}</p>
  );

  const SH2 = ({children, sx={}}: {children:ReactNode; sx?:CSSProperties}) => (
    <h2 style={{
      fontFamily:Fs, fontSize:"clamp(1.9rem,5vw,3rem)", fontWeight:800,
      lineHeight:1.5, wordBreak:"keep-all", ...sx,
    }}>{children}</h2>
  );

  /* Gold divider line */
  const GoldLine = () => (
    <div style={{
      width:"100%", height:"1px",
      background:`linear-gradient(to right,transparent,${C.gBd},${C.goldL},${C.gBd},transparent)`,
      opacity:.5,
    }}/>
  );

  /* Diamond separator */
  const DiamondSep = () => (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"8px 0",gap:"12px"}}>
      <div style={{flex:1,height:"1px",background:`linear-gradient(to right,transparent,${C.gBd})`}}/>
      <div style={{
        width:"8px",height:"8px",border:`1px solid ${C.gold}`,
        transform:"rotate(45deg)",background:`${C.gold}22`,
      }}/>
      <div style={{flex:1,height:"1px",background:`linear-gradient(to left,transparent,${C.gBd})`}}/>
    </div>
  );

  /* Check icon */
  const Check = ({color=C.emFg}: {color?:string}) => (
    <div style={{
      width:"20px",height:"20px",borderRadius:"50%",flexShrink:0,
      background:`${color}18`, border:`1.5px solid ${color}55`,
      display:"flex",alignItems:"center",justifyContent:"center",
    }}>
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d="M1.5 5l2.5 2.5 4.5-5" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background:C.ink, color:C.cream, minHeight:"100vh", fontFamily:Fs, WebkitFontSmoothing:"antialiased" }}>

      {/* ── Sticky mobile CTA ──────────────────────────────────────────── */}
      <div className="g-sticky" style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:50,
        padding:"10px 16px 14px",
        background:"rgba(3,5,10,.97)", borderTop:`1px solid ${C.gBd}`,
        alignItems:"center",
      }}>
        <button onClick={toForm} className="g-gold" style={{
          width:"100%", padding:"15px", borderRadius:"10px",
          color:"#fff", fontSize:"0.97rem", fontWeight:800, letterSpacing:"0.1em", fontFamily:Fs,
          display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
          boxShadow:"0 4px 24px rgba(0,0,0,.75)",
        }}><Torii/>今すぐ無料で守護神社を調べる</button>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          S01  HERO
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", minHeight:"100svh", display:"flex", alignItems:"center", overflow:"hidden" }}>

        {/* Desktop BG */}
        <div className="g-hero-desk" style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.heroDesktop}')`,
          backgroundSize:"cover", backgroundPosition:"58% center",
          animation:"gvZoom 2.4s ease-out forwards",
        }}/>
        <div className="g-hero-desk" style={{
          position:"absolute", inset:0,
          background:"linear-gradient(105deg,rgba(3,5,10,.96) 0%,rgba(3,5,10,.88) 38%,rgba(3,5,10,.38) 60%,rgba(3,5,10,.04) 100%)",
        }}/>

        {/* Mobile BG */}
        <div className="g-hero-mob" style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.heroMobile}')`,
          backgroundSize:"cover", backgroundPosition:"center 18%",
        }}/>
        <div className="g-hero-mob" style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(3,5,10,.88) 0%,rgba(3,5,10,.42) 45%,rgba(3,5,10,.90) 100%)",
        }}/>

        {/* Ambient glows */}
        <div style={{
          position:"absolute", top:"10%", left:"2%",
          width:"700px", height:"700px", borderRadius:"50%",
          background:`radial-gradient(ellipse,${C.gGlow} 0%,transparent 60%)`,
          pointerEvents:"none", animation:"gvGlow 9s ease-in-out infinite",
        }}/>
        <div style={{
          position:"absolute", bottom:"5%", right:"8%",
          width:"400px", height:"400px", borderRadius:"50%",
          background:`radial-gradient(ellipse,rgba(100,80,180,.08) 0%,transparent 65%)`,
          pointerEvents:"none", animation:"gvGlow 12s ease-in-out 2s infinite",
        }}/>

        {/* Floating gold particles */}
        {[...Array(12)].map((_,i)=>(
          <div key={i} style={{
            position:"absolute",
            left:`${4+i*7.5}%`, bottom:`${12+((i*17)%38)}%`,
            width:`${2+i%2}px`, height:`${2+i%2}px`, borderRadius:"50%",
            background:C.gold, opacity:0,
            animation:`gvPart ${4+i*.55}s ease-in ${i*.42}s infinite`,
          }}/>
        ))}

        <div style={{ position:"relative", padding:`100px ${PX} 96px`, ...W }}>
          <div style={{ maxWidth:"580px" }}>
            <FadeUp delay={0.04}>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:"8px",
                padding:"5px 18px 5px 12px",
                background:"rgba(201,155,77,.09)", border:`1px solid ${C.gBd}`,
                borderRadius:"30px", marginBottom:"30px",
              }}>
                <Torii/>
                <span style={{ fontFamily:Fd, fontSize:"0.57rem", letterSpacing:"0.44em", color:C.gold, fontWeight:600 }}>守護神社診断</span>
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 style={{
                fontFamily:Fs, fontWeight:800, wordBreak:"keep-all",
                fontSize:"clamp(2.4rem,7.5vw,4.6rem)",
                lineHeight:1.42, letterSpacing:"0.01em", marginBottom:"30px",
              }}>
                あなたと最も縁の深い<br/>
                <span style={{ color:C.goldL }}>「守護神社」</span>を<br/>知っていますか？
              </h1>
            </FadeUp>

            <FadeUp delay={0.18}>
              <p style={{
                color:C.crDim, lineHeight:2.1, marginBottom:"34px",
                fontSize:"clamp(1rem,2.2vw,1.1rem)", maxWidth:"480px",
              }}>
                生まれた場所、家系、今の住まい。<br/>
                あなたの生年月日をもとに、縁のある守護神社をお伝えします。
              </p>
            </FadeUp>

            <FadeUp delay={0.24}>
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"38px" }}>
                {["完全無料","登録不要","生年月日だけ","約30秒で完了"].map(t=>(
                  <span key={t} style={{
                    padding:"5px 14px", fontSize:"0.63rem", fontFamily:Fd,
                    color:C.gold, letterSpacing:"0.04em",
                    background:"rgba(3,5,10,.75)", border:`1px solid ${C.gBd}`,
                    borderRadius:"6px", backdropFilter:"blur(10px)",
                  }}>{t}</span>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={0.32}>
              <button onClick={toForm} className="g-gold" style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
                padding:"21px 36px", borderRadius:"12px",
                color:"#fff", fontSize:"clamp(1rem,2.5vw,1.12rem)",
                fontWeight:800, letterSpacing:"0.12em", fontFamily:Fs,
                width:"100%", maxWidth:"440px",
                boxShadow:"0 8px 48px rgba(0,0,0,.75),0 0 36px rgba(201,155,77,.22)",
              }}><Torii/>今すぐ無料で守護神社を調べる</button>
              <p style={{ marginTop:"12px", color:C.crMut, fontSize:"0.76rem", letterSpacing:"0.04em" }}>
                登録不要・完全無料・いつでも解除OK
              </p>
            </FadeUp>
          </div>
        </div>

        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:"180px",
          background:`linear-gradient(to top,${C.ink},transparent)`, pointerEvents:"none",
        }}/>
        <div style={{ position:"absolute", bottom:"32px", left:"50%", animation:"gvScroll 2.6s ease-in-out infinite" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"6px" }}>
            <div style={{ width:"1px", height:"48px", background:`linear-gradient(to bottom,transparent,${C.gBd})` }}/>
            <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:C.gold, opacity:.45 }}/>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          S02  悩み — 2×3 グリッド
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ background:C.dark2, padding:`clamp(72px,10vw,120px) ${PX}` }}>
        <div style={W}>
          <FadeUp>
            <Tag t="Does This Sound Familiar"/>
            <SH2 sx={{ textAlign:"center", marginBottom:"18px" }}>
              こんなことを感じたことは<br/>ありませんか？
            </SH2>
            <p style={{
              color:C.crDim, textAlign:"center", lineHeight:2, marginBottom:"60px",
              fontSize:"clamp(1rem,2vw,1.05rem)",
            }}>
              神社への関心の有無は関係ありません。<br/>
              一つでも当てはまることがあれば、この先を読み進めてください。
            </p>
          </FadeUp>

          {/* 2-column grid */}
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",
            gap:"18px",
          }}>
            {WORRIES.map((w,i)=>(
              <FadeUp key={i} delay={i*.07}>
                <div className="g-worry" style={{
                  padding:"28px 26px",
                  background:"rgba(3,5,10,.75)",
                  border:`1px solid rgba(201,155,77,.12)`,
                  borderTop:`2.5px solid ${w.c}88`,
                  borderRadius:"14px",
                  boxShadow:"0 6px 32px rgba(0,0,0,.45)",
                  position:"relative", overflow:"hidden",
                }}>
                  {/* accent corner glow */}
                  <div style={{
                    position:"absolute", top:0, left:0,
                    width:"120px", height:"120px",
                    background:`radial-gradient(ellipse at top left,${w.c}12 0%,transparent 70%)`,
                    pointerEvents:"none",
                  }}/>
                  <div style={{
                    display:"flex", alignItems:"center", gap:"12px", marginBottom:"14px",
                  }}>
                    <div style={{
                      width:"40px", height:"40px", borderRadius:"50%",
                      background:`${w.c}15`, border:`1.5px solid ${w.c}55`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:Fd, fontSize:"1.2rem", fontWeight:700, color:w.c,
                      flexShrink:0,
                    }}>{w.n}</div>
                    <p style={{
                      fontFamily:Fs, fontSize:"clamp(0.95rem,2vw,1rem)", fontWeight:700,
                      color:C.cream, lineHeight:1.5,
                    }}>{w.t}</p>
                  </div>
                  <p style={{
                    color:C.crDim, fontSize:"clamp(0.88rem,1.8vw,0.94rem)", lineHeight:1.9,
                  }}>{w.sub}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp>
            <div style={{
              marginTop:"56px", padding:"28px 36px",
              background:C.gFaint, border:`1px solid ${C.gBd}`,
              borderRadius:"14px", textAlign:"center",
            }}>
              <p style={{ fontSize:"clamp(1.05rem,2.4vw,1.18rem)", lineHeight:2.1, color:C.cream, wordBreak:"keep-all" }}>
                その答えは、あなたに縁の深い<strong style={{ color:C.goldL }}>「守護神社」</strong>が<br/>
                鍵かもしれません。
              </p>
            </div>
          </FadeUp>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          S02.5  なぜ今、自分の守護神社を知る人が少ないのか
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ background:C.ink, overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"stretch", flexWrap:"wrap" }}>

          {/* Text column */}
          <div style={{ flex:"1 1 360px", padding:`clamp(64px,9vw,100px) ${PX}`, display:"flex", alignItems:"center" }}>
            <div style={{ maxWidth:"520px" }}>
              <FadeUp>
                <Tag t="Why So Few People Know"/>
                <SH2 sx={{ marginBottom:"28px" }}>
                  なぜ今、自分の守護神社を<br/>知る人が少ないのか
                </SH2>
              </FadeUp>
              {WHY_UNKNOWN.body.map((p,i)=>(
                <FadeUp key={i} delay={i*.09}>
                  <p style={{
                    color:C.crDim, lineHeight:2.15, marginBottom:"20px",
                    fontSize:"clamp(1rem,2vw,1.06rem)",
                  }}>{p}</p>
                </FadeUp>
              ))}
            </div>
          </div>

          {/* Image column */}
          <div className="g-why-img" style={{
            flex:"0 0 42%", minHeight:"clamp(420px,55vw,640px)",
            position:"relative", overflow:"hidden",
          }}>
            <img src={IMG.raw07} alt="" style={{
              width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", display:"block",
            }}/>
            {/* left-edge fade */}
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(to right,rgba(3,5,10,.92) 0%,rgba(3,5,10,.2) 40%,transparent 100%)",
            }}/>
            {/* Quote overlay card */}
            <div style={{
              position:"absolute", bottom:"10%", left:"10%", right:"10%",
              padding:"24px 28px",
              background:"rgba(3,5,10,.88)",
              border:`1px solid ${C.gBd2}`,
              borderLeft:`4px solid ${C.gold}`,
              borderRadius:"0 12px 12px 0",
              backdropFilter:"blur(12px)",
            }}>
              <p style={{
                fontFamily:Fs, fontSize:"clamp(0.95rem,2vw,1.05rem)", lineHeight:1.9,
                color:C.cream, wordBreak:"keep-all",
              }}>
                「{WHY_UNKNOWN.quote}」
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          PANORAMA STRIP  — ultra-wide raw-18 を全幅に
      ════════════════════════════════════════════════════════════════ */}
      <div style={{ position:"relative", height:"clamp(220px,32vw,400px)", overflow:"hidden" }}>
        <img src={IMG.introBg} alt="" style={{
          width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 32%", display:"block",
        }}/>
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom,rgba(3,5,10,.78) 0%,rgba(3,5,10,.18) 45%,rgba(3,5,10,.78) 100%)",
        }}/>
        <div style={{
          position:"absolute", inset:0,
          display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"16px",
        }}>
          <FadeUp>
            <p style={{
              fontFamily:Fd, fontSize:"clamp(0.78rem,2vw,1rem)",
              letterSpacing:"0.5em", color:C.gold, textAlign:"center",
              textTransform:"uppercase",
            }}>Discover Your Guardian Shrine</p>
            <p style={{
              fontFamily:Fs, fontSize:"clamp(1.4rem,4.5vw,2.8rem)", fontWeight:800,
              textAlign:"center", color:C.cream, marginTop:"10px",
              textShadow:"0 2px 32px rgba(0,0,0,.8)", wordBreak:"keep-all",
            }}>
              縁の深い神社を<br className="g-sp-br"/>知ることで、何かが変わる。
            </p>
          </FadeUp>
        </div>
      </div>


      {/* ════════════════════════════════════════════════════════════════
          S03  守護神社とは — 画像を左に大きく
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ background:C.ink, overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"stretch", flexWrap:"wrap" }}>

          {/* Image — 46% wide */}
          <div className="g-def-img" style={{
            flex:"0 0 46%", minHeight:"clamp(480px,58vw,680px)",
            position:"relative", overflow:"hidden",
          }}>
            <img src={IMG.definitionBg} alt="守護神社" style={{
              width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", display:"block",
            }}/>
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(to right,transparent 50%,rgba(3,5,10,.95) 100%)",
            }}/>
          </div>

          {/* Text */}
          <div style={{ flex:"1 1 320px", padding:`clamp(56px,9vw,96px) ${PX}`, display:"flex", alignItems:"center" }}>
            <div style={{ maxWidth:"480px" }}>
              <FadeUp>
                <Tag t="What Is It"/>
                <SH2 sx={{ marginBottom:"26px" }}>
                  守護神社とは、<br/>何ですか？
                </SH2>
              </FadeUp>
              <FadeUp delay={0.08}>
                <p style={{ color:C.crDim, lineHeight:2.1, marginBottom:"22px", fontSize:"clamp(1rem,2vw,1.06rem)" }}>
                  守護神社とは、あなたの生まれ・家系・現在地に縁のある神社のことです。有名な神社や話題のパワースポットではなく、あなた自身と深くつながっているとされる場所です。
                </p>
              </FadeUp>
              <FadeUp delay={0.14}>
                <p style={{ color:C.crDim, lineHeight:2.1, marginBottom:"30px", fontSize:"clamp(1rem,2vw,1.06rem)" }}>
                  産土・氏神・鎮守の3種の守護神社が、あなたの魂の根・家系・そして今の暮らしをそれぞれ守るとされています。
                </p>
              </FadeUp>
              <FadeUp delay={0.2}>
                <div style={{
                  padding:"22px 24px",
                  borderLeft:`3px solid ${C.gBd2}`,
                  background:C.gFaint, borderRadius:"0 10px 10px 0",
                }}>
                  <p style={{
                    fontFamily:Fs, fontSize:"clamp(1rem,2.2vw,1.1rem)", lineHeight:1.9,
                    color:C.cream, wordBreak:"keep-all",
                  }}>
                    「縁のある神社を知って参拝することで、<br/>
                    日常の中に静かな根拠と安心感が生まれる。」
                  </p>
                </div>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          S04  三守護神社 — 画像背景カード
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden", padding:`clamp(72px,10vw,120px) ${PX}` }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.threeShrineBg}')`,
          backgroundSize:"cover", backgroundPosition:"center",
        }}/>
        <div style={{ position:"absolute", inset:0, background:"rgba(3,5,10,.52)" }}/>

        <div style={{ ...W, position:"relative" }}>
          <FadeUp>
            <Tag t="Three Types"/>
            <SH2 sx={{ textAlign:"center", marginBottom:"18px" }}>
              あなたを見守る神社は、<br/>ひとつとは限りません。
            </SH2>
            <p style={{
              color:C.crDim, textAlign:"center", lineHeight:2, marginBottom:"60px",
              fontSize:"clamp(1rem,2vw,1.05rem)",
            }}>
              守護神社には3種類あり、それぞれ異なる役割を持っています。
            </p>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"24px" }}>
            {SHRINES.map((s,i)=>(
              <FadeUp key={i} delay={i*.12}>
                <div className="g-shrine" style={{
                  position:"relative", overflow:"hidden",
                  borderRadius:"18px",
                  border:`1px solid ${s.ac}40`,
                  boxShadow:"0 10px 48px rgba(0,0,0,.65)",
                  minHeight:"380px",
                  display:"flex", flexDirection:"column",
                }}>
                  {/* Image background */}
                  <div style={{
                    position:"absolute", inset:0,
                    backgroundImage:`url('${s.img}')`,
                    backgroundSize:"cover", backgroundPosition:"center",
                  }}/>
                  {/* Gradient overlay */}
                  <div style={{
                    position:"absolute", inset:0,
                    background:`linear-gradient(to bottom,rgba(3,5,10,.35) 0%,rgba(3,5,10,.72) 50%,rgba(3,5,10,.92) 100%)`,
                  }}/>
                  {/* Accent top border glow */}
                  <div style={{
                    position:"absolute", top:0, left:0, right:0, height:"3px",
                    background:`linear-gradient(to right,transparent,${s.ac},transparent)`,
                  }}/>
                  {/* Content */}
                  <div style={{ position:"relative", padding:"28px", flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                    <div style={{
                      width:"56px", height:"56px", borderRadius:"50%",
                      background:`${s.ac}22`, border:`2px solid ${s.ac}66`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:Fs, fontSize:"1.4rem", fontWeight:800, color:s.ac,
                      marginBottom:"16px",
                      boxShadow:`0 0 20px ${s.ac}33`,
                    }}>{s.icon}</div>
                    <div style={{ fontFamily:Fs, fontSize:"clamp(1.25rem,3vw,1.6rem)", fontWeight:800, marginBottom:"4px" }}>{s.name}</div>
                    <div style={{ fontSize:"0.7rem", color:C.crMut, letterSpacing:"0.14em", marginBottom:"10px" }}>{s.rd}</div>
                    <p style={{ fontSize:"0.78rem", color:s.ac, letterSpacing:"0.06em", marginBottom:"16px", fontFamily:Fd }}>{s.tag}</p>
                    <p style={{ color:C.crDim, fontSize:"clamp(0.92rem,1.9vw,1rem)", lineHeight:1.95 }}>{s.desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:"120px",
          background:`linear-gradient(to top,${C.ink},transparent)`, pointerEvents:"none",
        }}/>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          S04.5  なぜ守護神社を知ることが人生のヒントになるのか
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ background:C.dark2, padding:`clamp(72px,10vw,120px) ${PX}` }}>
        <div style={{ ...W }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"clamp(40px,7vw,80px)", alignItems:"center" }}>

            {/* Left: text */}
            <div>
              <FadeUp>
                <Tag t="Why It Matters"/>
                <SH2 sx={{ marginBottom:"22px" }}>
                  なぜ、守護神社を知ることが<br/>人生のヒントになるのか
                </SH2>
              </FadeUp>
              <FadeUp delay={0.08}>
                <p style={{ color:C.crDim, lineHeight:2.15, fontSize:"clamp(1rem,2vw,1.06rem)", marginBottom:"0" }}>
                  {WHY_HINT.lead}
                </p>
              </FadeUp>
            </div>

            {/* Right: checklist */}
            <FadeUp delay={0.1}>
              <div style={{
                padding:"36px 32px",
                background:"rgba(3,5,10,.82)",
                border:`1px solid ${C.gBd}`,
                borderRadius:"16px",
                boxShadow:"0 8px 48px rgba(0,0,0,.55)",
              }}>
                <p style={{
                  fontFamily:Fd, fontSize:"0.6rem", letterSpacing:"0.4em",
                  color:C.gold, textTransform:"uppercase", marginBottom:"24px",
                }}>守護神社を知ると、こんな変化が起きます</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"18px" }}>
                  {WHY_HINT.benefits.map((b,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"14px" }}>
                      <Check color={C.gold}/>
                      <span style={{ color:C.cream, fontSize:"clamp(0.95rem,2vw,1.03rem)", lineHeight:1.7, fontWeight:700 }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          S04.6  この診断でわかること — 8アイテムグリッド
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden", padding:`clamp(72px,10vw,120px) ${PX}` }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.raw10}')`,
          backgroundSize:"cover", backgroundPosition:"center",
        }}/>
        <div style={{ position:"absolute", inset:0, background:"rgba(3,5,10,.72)" }}/>

        <div style={{ ...W, position:"relative" }}>
          <FadeUp>
            <Tag t="What You'll Discover" c={C.goldL}/>
            <SH2 sx={{ textAlign:"center", marginBottom:"18px" }}>
              この診断でわかること
            </SH2>
            <p style={{
              color:C.crDim, textAlign:"center", lineHeight:2, marginBottom:"56px",
              fontSize:"clamp(1rem,2vw,1.05rem)",
            }}>
              生年月日と神社データをもとに、あなただけの守護神社を詳しく読み解きます。
            </p>
          </FadeUp>

          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
            gap:"16px",
          }}>
            {DIAGNOSIS_ITEMS.map((item,i)=>(
              <FadeUp key={i} delay={i*.06}>
                <div className="g-diag-card" style={{
                  padding:"22px 20px",
                  background:"rgba(3,5,10,.88)",
                  border:`1px solid rgba(201,155,77,.14)`,
                  borderRadius:"12px",
                  boxShadow:"0 6px 28px rgba(0,0,0,.5)",
                  position:"relative", overflow:"hidden",
                }}>
                  <div style={{
                    position:"absolute", top:0, right:0,
                    fontFamily:Fs, fontSize:"4rem", fontWeight:800,
                    color:item.c, opacity:.04, lineHeight:1,
                    pointerEvents:"none",
                  }}>{item.icon}</div>
                  <div style={{
                    width:"44px", height:"44px", borderRadius:"10px",
                    background:`${item.c}15`, border:`1px solid ${item.c}44`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:Fs, fontSize:"1.15rem", fontWeight:800, color:item.c,
                    marginBottom:"14px",
                  }}>{item.icon}</div>
                  <div style={{
                    fontFamily:Fs, fontSize:"clamp(0.95rem,2vw,1rem)", fontWeight:800,
                    color:C.cream, marginBottom:"8px",
                  }}>{item.t}</div>
                  <p style={{ color:C.crDim, fontSize:"0.83rem", lineHeight:1.75 }}>{item.d}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:"100px",
          background:`linear-gradient(to top,${C.dark2},transparent)`, pointerEvents:"none",
        }}/>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          S05  Quote panel
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden", padding:`clamp(96px,14vw,160px) ${PX}` }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.quotePanelBg}')`,
          backgroundSize:"cover", backgroundPosition:"center",
        }}/>
        <div style={{ position:"absolute", inset:0, background:"rgba(3,5,10,.55)" }}/>
        {/* gold shine bar */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:"2px",
          background:`linear-gradient(to right,transparent,${C.gBd2},transparent)`,
        }}/>
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:"2px",
          background:`linear-gradient(to right,transparent,${C.gBd2},transparent)`,
        }}/>

        <div style={{ ...W, position:"relative", textAlign:"center" }}>
          <FadeUp>
            {/* large decorative opening quote */}
            <div style={{
              fontFamily:Fd, fontSize:"clamp(4rem,10vw,8rem)", color:C.gold,
              opacity:.18, lineHeight:.8, marginBottom:"-0.2em", userSelect:"none",
            }}>"</div>
            <p style={{
              fontFamily:Fd, fontSize:"clamp(1.3rem,3.8vw,2.2rem)",
              letterSpacing:"0.06em", color:C.goldL, marginBottom:"30px",
              fontStyle:"italic", lineHeight:1.65, maxWidth:"680px", margin:"0 auto 30px",
            }}>
              縁のある神社を知る人と、知らない人では<br/>
              人生の向き合い方が、静かに変わってゆく
            </p>
            <div style={{ width:"80px", height:"1px", background:C.gBd2, margin:"0 auto 26px" }}/>
            <p style={{
              color:C.crDim, fontSize:"clamp(0.95rem,2vw,1.05rem)", lineHeight:2.1,
              maxWidth:"540px", margin:"0 auto", wordBreak:"keep-all",
            }}>
              あなたに縁の深い神社は、すでにそこに存在しています。あとは、知るか知らないか、その違いだけです。
            </p>
          </FadeUp>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          S06  五行ロジック
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden", padding:`clamp(72px,10vw,120px) ${PX}` }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.logicBg}')`,
          backgroundSize:"cover", backgroundPosition:"center",
        }}/>
        <div style={{ position:"absolute", inset:0, background:"rgba(3,5,10,.55)" }}/>

        <div style={{ ...W, position:"relative" }}>
          <FadeUp>
            <Tag t="The Logic Behind It" c={C.goldL}/>
            <SH2 sx={{ textAlign:"center", marginBottom:"16px" }}>
              生年月日と神社データをもとに、<br/>あなたのご縁を一挙に読み解きます。
            </SH2>
            <p style={{
              color:C.crDim, textAlign:"center", lineHeight:2, marginBottom:"64px",
              fontSize:"clamp(1rem,2vw,1.05rem)",
            }}>
              5つの要素を組み合わせて、あなただけの守護神社を導き出します。
            </p>
          </FadeUp>

          {/* 五行 element orbs */}
          <FadeUp delay={0.08}>
            <div style={{
              display:"flex", justifyContent:"center",
              gap:"clamp(12px,3vw,34px)", flexWrap:"wrap", marginBottom:"16px",
            }}>
              {ELEMENTS.map((el,i)=>(
                <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"10px" }}>
                  <div className="g-orb" style={{
                    width:"clamp(72px,13vw,110px)", height:"clamp(72px,13vw,110px)",
                    borderRadius:"50%",
                    background:`radial-gradient(circle at 35% 35%,${el.c}65 0%,${el.c}28 50%,${el.c}08 100%)`,
                    border:`2px solid ${el.c}66`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:Fs, fontSize:"clamp(1.7rem,4.2vw,2.5rem)", fontWeight:800, color:el.c,
                    boxShadow:el.s,
                    animationDelay:`${i*.55}s`,
                  }}>{el.k}</div>
                </div>
              ))}
            </div>
          </FadeUp>

          {/* 5 logic factor labels */}
          <FadeUp delay={0.14}>
            <div style={{
              display:"flex", justifyContent:"center",
              gap:"clamp(12px,3vw,34px)", flexWrap:"wrap", marginBottom:"60px",
            }}>
              {[
                {el:"木",c:"#4a8a5a",t:"生年月日"},
                {el:"火",c:"#c04030",t:"陰陽五行"},
                {el:"土",c:"#c09030",t:"地域との縁"},
                {el:"金",c:"#9098b8",t:"神社データ"},
                {el:"水",c:"#3480c0",t:"AI解析"},
              ].map((l,i)=>(
                <div key={i} style={{
                  textAlign:"center",
                  width:"clamp(72px,13vw,110px)",
                }}>
                  <p style={{
                    fontFamily:Fs, fontSize:"0.75rem", fontWeight:700,
                    color:l.c, letterSpacing:"0.06em",
                  }}>{l.t}</p>
                </div>
              ))}
            </div>
          </FadeUp>

          {/* Detail cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:"16px" }}>
            {[
              {el:"木",c:"#4a8a5a",t:"生年月日",d:"陰陽・干支・数秘術を組み合わせて、持って生まれた性質や運気の傾向を読み解きます。"},
              {el:"火",c:"#c04030",t:"陰陽五行",d:"木・火・土・金・水のバランスから、どの神様のエネルギーと相性が深いかを判定します。"},
              {el:"土",c:"#c09030",t:"地域との縁",d:"生まれた土地・現在地・生活圏との関係性を考慮し、産土・氏神・鎮守の縁を整理します。"},
              {el:"金",c:"#9098b8",t:"神社データ",d:"全国31,247社のご祭神・地域性・歴史をもとに縁の深さで優先順位をつけます。"},
              {el:"水",c:"#3480c0",t:"AI解析",d:"複数の要素を組み合わせ、あなたに最も縁の深い守護神社の候補を導き出します。"},
            ].map((l,i)=>(
              <FadeUp key={i} delay={i*.07}>
                <div style={{
                  padding:"22px 22px",
                  background:"rgba(3,5,10,.86)",
                  border:`1px solid ${l.c}33`, borderLeft:`3px solid ${l.c}`,
                  borderRadius:"10px",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
                    <span style={{ fontFamily:Fs, fontSize:"1.1rem", fontWeight:800, color:l.c }}>{l.el}</span>
                    <span style={{ fontFamily:Fs, fontSize:"clamp(0.95rem,2vw,1.03rem)", fontWeight:800, color:C.cream }}>{l.t}</span>
                  </div>
                  <p style={{ color:C.crDim, fontSize:"0.89rem", lineHeight:1.9 }}>{l.d}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:"100px",
          background:`linear-gradient(to top,${C.dark2},transparent)`, pointerEvents:"none",
        }}/>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          S07  体験者の声 — testimonialsBg を背景に
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden", padding:`clamp(72px,10vw,120px) ${PX}` }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.testimonialsBg}')`,
          backgroundSize:"cover", backgroundPosition:"center",
        }}/>
        <div style={{ position:"absolute", inset:0, background:"rgba(3,5,10,.75)" }}/>

        <div style={{ ...W, position:"relative" }}>
          <FadeUp>
            <Tag t="Voices"/>
            <SH2 sx={{ textAlign:"center", marginBottom:"56px" }}>守護神社診断を使った方の声</SH2>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"22px" }}>
            {VOICES.map((v,i)=>(
              <FadeUp key={i} delay={i*.1}>
                <div className="g-hover" style={{
                  padding:"30px 26px",
                  background:"rgba(3,5,10,.90)",
                  border:`1px solid ${C.gBd}`,
                  borderRadius:"16px",
                  boxShadow:"0 8px 40px rgba(0,0,0,.6)",
                }}>
                  {/* Avatar placeholder + label */}
                  <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
                    <div style={{
                      width:"42px", height:"42px", borderRadius:"50%",
                      background:C.gFaint, border:`1px solid ${C.gBd}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:Fs, fontSize:"0.75rem", color:C.gold,
                    }}>⛩</div>
                    <span style={{ fontFamily:Fd, fontSize:"0.72rem", letterSpacing:"0.12em", color:C.gold }}>{v.label}</span>
                  </div>
                  <div style={{
                    padding:"14px 18px",
                    background:C.gFaint, borderLeft:`3px solid ${C.gBd2}`,
                    borderRadius:"0 8px 8px 0", marginBottom:"18px",
                  }}>
                    <p style={{ color:C.goldL, fontFamily:Fs, fontSize:"clamp(0.95rem,2vw,1.02rem)", lineHeight:1.75, fontWeight:700 }}>
                      「{v.pull}」
                    </p>
                  </div>
                  <p style={{ color:C.crDim, fontSize:"clamp(0.92rem,1.9vw,0.98rem)", lineHeight:1.95 }}>{v.text}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Stats */}
          <FadeUp delay={0.1}>
            <div style={{
              display:"flex", justifyContent:"center", gap:"clamp(24px,5vw,72px)",
              flexWrap:"wrap", marginTop:"60px",
              padding:"32px 24px",
              border:`1px solid ${C.gBd}`, borderRadius:"16px",
              background:"rgba(3,5,10,.82)",
            }}>
              {[["31,247社","全国神社データ"],["247,832名","累計診断人数"],["98.3%","満足度"]].map(([n,l])=>(
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:Fd, fontSize:"clamp(1.8rem,4vw,2.5rem)", fontWeight:700, color:C.goldL }}>{n}</div>
                  <div style={{ fontSize:"0.74rem", color:C.crMut, letterSpacing:"0.1em", marginTop:"5px" }}>{l}</div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:"100px",
          background:`linear-gradient(to top,${C.ink},transparent)`, pointerEvents:"none",
        }}/>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          S08  FORM — formBg を背景に
      ════════════════════════════════════════════════════════════════ */}
      <section ref={formRef} style={{ position:"relative", overflow:"hidden", padding:`clamp(72px,10vw,120px) ${PX}` }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.formBg}')`,
          backgroundSize:"cover", backgroundPosition:"center 38%",
        }}/>
        <div style={{ position:"absolute", inset:0, background:"rgba(3,5,10,.74)" }}/>

        <div style={{ ...W, position:"relative" }}>
          <FadeUp>
            <Tag t="Start Your Diagnosis" c={C.goldL}/>
            <SH2 sx={{ textAlign:"center", marginBottom:"22px" }}>
              あなたのご縁を、<br/>今すぐ無料で調べる
            </SH2>
          </FadeUp>
          <FadeUp delay={0.08}>
            <p style={{
              color:C.crDim, textAlign:"center", lineHeight:2.1,
              fontSize:"clamp(1rem,2vw,1.06rem)", maxWidth:"520px", margin:"0 auto 52px",
            }}>
              生年月日を入力するだけで、あなたに縁の深い守護神社を診断できます。<br/><br/>
              それは未来を決めつけるものではありません。<br/>
              自分がどんな土地に支えられてきたのか。<br/>
              どんな場所に心を向けると、前に進みやすいのか。<br/><br/>
              そのヒントを受け取るための、小さな入口です。
            </p>
          </FadeUp>

          <FadeUp delay={0.14}>
            <div style={{
              maxWidth:"560px", margin:"0 auto",
              padding:"clamp(32px,5vw,52px)",
              background:"rgba(3,5,10,.94)",
              border:`1px solid ${C.gBd}`,
              borderRadius:"20px",
              boxShadow:"0 20px 72px rgba(0,0,0,.8),0 0 48px rgba(201,155,77,.10)",
            }}>
              <div style={{ marginBottom:"22px" }}>
                <label style={{ display:"block", fontSize:"0.77rem", color:C.gold, letterSpacing:"0.12em", marginBottom:"8px", fontFamily:Fd }}>
                  生年月日 *
                </label>
                <input
                  type="date" className="g-input" value={bday} onChange={e=>setBday(e.target.value)}
                  style={{
                    width:"100%", padding:"14px 16px", boxSizing:"border-box",
                    background:"rgba(255,255,255,.04)", border:`1px solid ${C.gBd}`,
                    borderRadius:"8px", color:C.cream, fontSize:"1rem", fontFamily:Fs, colorScheme:"dark",
                  }}
                />
              </div>
              <div style={{ marginBottom:"22px" }}>
                <label style={{ display:"block", fontSize:"0.77rem", color:C.gold, letterSpacing:"0.12em", marginBottom:"8px", fontFamily:Fd }}>
                  現在の都道府県（任意）
                </label>
                <select
                  className="g-input" value={pref} onChange={e=>setPref(e.target.value)}
                  style={{
                    width:"100%", padding:"14px 16px", boxSizing:"border-box",
                    background:"rgba(3,5,10,.92)", border:`1px solid ${C.gBd}`,
                    borderRadius:"8px", color:C.cream, fontSize:"1rem", fontFamily:Fs,
                  }}
                >
                  {PREFS.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:"22px" }}>
                <label style={{ display:"block", fontSize:"0.77rem", color:C.gold, letterSpacing:"0.12em", marginBottom:"12px", fontFamily:Fd }}>
                  性別（任意）
                </label>
                <div style={{ display:"flex", gap:"16px" }}>
                  {["男性","女性","選択しない"].map(g=>(
                    <label key={g} style={{ display:"flex", alignItems:"center", gap:"7px", cursor:"pointer" }}>
                      <input type="radio" name="gen" value={g} checked={gen===g} onChange={()=>setGen(g)}
                        style={{ accentColor:C.gold }}/>
                      <span style={{ color:C.crDim, fontSize:"0.93rem" }}>{g}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:"32px" }}>
                <label style={{ display:"block", fontSize:"0.77rem", color:C.gold, letterSpacing:"0.12em", marginBottom:"12px", fontFamily:Fd }}>
                  相談テーマ（任意・複数選択可）
                </label>
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  {THEMES.map(t=>(
                    <button key={t} onClick={()=>setThm(t)} style={{
                      padding:"7px 15px", cursor:"pointer",
                      background: thm===t?`${C.gold}1e`:"transparent",
                      border:`1px solid ${thm===t?C.gBd2:C.gBd}`,
                      borderRadius:"20px",
                      color:thm===t?C.goldL:C.crMut,
                      fontSize:"0.82rem", fontFamily:Fs,
                      transition:"all .2s",
                    }}>{t}</button>
                  ))}
                </div>
              </div>
              <button onClick={diagnose} className="g-gold" style={{
                width:"100%", padding:"21px", borderRadius:"12px",
                color:"#fff", fontSize:"clamp(1rem,2.4vw,1.12rem)", fontWeight:800,
                letterSpacing:"0.12em", fontFamily:Fs,
                boxShadow:"0 8px 40px rgba(0,0,0,.7),0 0 28px rgba(201,155,77,.22)",
              }}>
                <Torii/>　無料で守護神社を診断する
              </button>
              <p style={{ textAlign:"center", marginTop:"12px", color:C.crMut, fontSize:"0.74rem", letterSpacing:"0.06em" }}>
                完全無料・登録不要・約30秒
              </p>
            </div>
          </FadeUp>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          S09  FAQ
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ background:C.dark2, padding:`clamp(72px,10vw,120px) ${PX}` }}>
        <div style={W}>
          <FadeUp>
            <Tag t="FAQ"/>
            <SH2 sx={{ textAlign:"center", marginBottom:"56px" }}>よくあるご質問</SH2>
          </FadeUp>
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",
            gap:"12px", maxWidth:"860px", margin:"0 auto",
          }}>
            {FAQS.map((f,i)=>(
              <FadeUp key={i} delay={i*.05}>
                <div style={{
                  border:`1px solid ${faq===i?C.gBd:"rgba(201,155,77,.11)"}`,
                  borderRadius:"12px", overflow:"hidden",
                  background:"rgba(3,5,10,.60)",
                  transition:"border-color .2s",
                }}>
                  <button
                    onClick={()=>setFaq(faq===i?null:i)}
                    style={{
                      width:"100%", padding:"18px 20px", background:"none", border:"none", cursor:"pointer",
                      display:"flex", justifyContent:"space-between", alignItems:"center", gap:"12px", textAlign:"left",
                    }}
                  >
                    <span style={{ color:C.cream, fontSize:"clamp(0.88rem,1.9vw,0.96rem)", fontFamily:Fs, fontWeight:700, lineHeight:1.5 }}>{f.q}</span>
                    <span style={{
                      flexShrink:0, width:"24px", height:"24px", borderRadius:"50%",
                      background:C.gFaint, border:`1px solid ${C.gBd}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:C.gold, fontSize:"0.9rem",
                      transition:"transform .3s", transform:faq===i?"rotate(45deg)":"none",
                    }}>+</span>
                  </button>
                  <div className={`g-faq-body${faq===i?" open":""}`}>
                    <p style={{ padding:"0 20px 18px", color:C.crDim, fontSize:"clamp(0.87rem,1.8vw,0.93rem)", lineHeight:2 }}>{f.a}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          S10  LINE
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ background:C.ink, padding:`clamp(72px,10vw,120px) ${PX}` }}>
        <div style={W}>
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",
            gap:"clamp(36px,6vw,72px)", alignItems:"center",
          }}>
            {/* Phone mockup */}
            <FadeUp delay={0.05}>
              <div style={{ display:"flex", justifyContent:"center" }}>
                <div style={{ animation:"gvFloat 5.5s ease-in-out infinite", width:"210px" }}>
                  <div style={{
                    background:"rgba(8,10,16,.98)",
                    border:"2.5px solid rgba(201,155,77,.32)",
                    borderRadius:"36px", overflow:"hidden",
                    boxShadow:"0 28px 80px rgba(0,0,0,.85),0 0 52px rgba(201,155,77,.12)",
                    padding:"10px 0",
                  }}>
                    <div style={{ width:"64px", height:"14px", background:"#000", borderRadius:"8px", margin:"0 auto 10px" }}/>
                    <div style={{ background:"#06C755", padding:"10px 14px", display:"flex", alignItems:"center", gap:"8px" }}>
                      <div style={{
                        width:"28px", height:"28px", borderRadius:"50%",
                        background:"rgba(255,255,255,.2)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:"0.7rem",
                      }}>⛩</div>
                      <span style={{ color:"#fff", fontSize:"0.7rem", fontWeight:700 }}>守護神社診断</span>
                    </div>
                    <div style={{ padding:"14px 10px", display:"flex", flexDirection:"column", gap:"8px" }}>
                      {["診断結果が届きました","あなたの守護神社は\n3社特定できました✨","参拝ガイドも\n確認できます📋"].map((msg,i)=>(
                        <div key={i}>
                          <div style={{
                            background:"#fff", color:"#1a1a1a",
                            padding:"7px 10px", borderRadius:"0 10px 10px 10px",
                            fontSize:"0.62rem", lineHeight:1.6,
                            maxWidth:"80%", whiteSpace:"pre-line",
                            boxShadow:"0 2px 8px rgba(0,0,0,.15)",
                          }}>{msg}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ width:"52px", height:"4px", background:"rgba(255,255,255,.15)", borderRadius:"2px", margin:"8px auto 4px" }}/>
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* Copy */}
            <div>
              <FadeUp>
                <Tag t="Get Results on LINE" c={C.emFg}/>
                <SH2 sx={{ marginBottom:"22px", wordBreak:"keep-all" }}>
                  診断結果をLINEで受け取ると、<br/>
                  さらに詳しく確認できます。
                </SH2>
              </FadeUp>
              <FadeUp delay={0.08}>
                <p style={{ color:C.crDim, lineHeight:2.1, marginBottom:"28px", fontSize:"clamp(1rem,2vw,1.06rem)" }}>
                  あなたに縁の深い守護神社は、一度見て終わりではありません。<br/><br/>
                  参拝のタイミング。<br/>
                  願いごとの向き合い方。<br/>
                  今月意識したい開運アクション。<br/><br/>
                  LINEで受け取ることで、診断結果を保存しながら、あなたの暮らしの中で少しずつ活かせます。
                </p>
              </FadeUp>
              <FadeUp delay={0.14}>
                <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginBottom:"32px" }}>
                  {["診断結果をいつでも見返せる","参拝のタイミングと作法がわかる","今月の開運アクションが届く","必要なければいつでも解除できる"].map((b,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                      <Check color={C.emFg}/>
                      <span style={{ color:C.crDim, fontSize:"clamp(0.93rem,1.9vw,1rem)" }}>{b}</span>
                    </div>
                  ))}
                </div>
              </FadeUp>
              <FadeUp delay={0.2}>
                <a href="https://lin.ee/placeholder" className="g-line" style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
                  padding:"18px 28px", border:`1px solid ${C.emBd}`, borderRadius:"12px",
                  color:"#fff", fontSize:"clamp(1rem,2.3vw,1.06rem)", fontWeight:800,
                  letterSpacing:"0.08em", textDecoration:"none", fontFamily:Fs,
                  boxShadow:"0 6px 40px rgba(0,0,0,.65)", maxWidth:"380px",
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="#06C755">
                    <path d="M10 2C5.58 2 2 5.13 2 9c0 2.38 1.27 4.5 3.24 5.84l-.52 1.94c-.08.3.22.56.5.41L8.06 16c.62.1 1.27.15 1.94.15C14.42 16.15 18 13.02 18 9c0-3.87-3.58-7-8-7z"/>
                  </svg>
                  LINEで診断結果を受け取る
                </a>
                <p style={{ marginTop:"10px", color:C.crMut, fontSize:"0.74rem", letterSpacing:"0.06em" }}>
                  無料・いつでも解除OK・診断結果を保存できます
                </p>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          S11  FINAL CTA
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden", padding:`clamp(96px,14vw,160px) ${PX}` }}>
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url('${IMG.finalCtaBg}')`,
          backgroundSize:"cover", backgroundPosition:"center 28%",
        }}/>
        <div style={{ position:"absolute", inset:0, background:"rgba(3,5,10,.52)" }}/>

        {/* decorative watermark */}
        <div style={{
          position:"absolute", right:"1%", top:"50%", transform:"translateY(-50%)",
          fontFamily:Fs, fontSize:"clamp(220px,38vw,480px)", fontWeight:800,
          color:C.gold, opacity:.025, lineHeight:1, pointerEvents:"none",
          animation:"gvBreathe 12s ease-in-out infinite",
        }}>守</div>
        {/* horizontal gold line */}
        <div style={{
          position:"absolute", top:"50%", left:0, right:0,
          height:"1px", background:`linear-gradient(to right,transparent,${C.gBd},transparent)`,
          opacity:.35, pointerEvents:"none",
        }}/>

        <div style={{ ...W, position:"relative", textAlign:"center" }}>
          <FadeUp>
            <Tag t="Begin Here" c={C.goldL}/>
            <h2 style={{
              fontFamily:Fs, fontWeight:800, wordBreak:"keep-all",
              fontSize:"clamp(2.2rem,6vw,3.9rem)",
              lineHeight:1.45, marginBottom:"26px",
            }}>
              神社との縁は、<br/>気づいた瞬間から始まります。
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p style={{
              color:C.crDim, lineHeight:2.2,
              fontSize:"clamp(1rem,2.2vw,1.1rem)",
              maxWidth:"520px", margin:"0 auto 56px",
            }}>
              生まれた土地。<br/>
              家族が受け継いできた土地。<br/>
              今、あなたが暮らしている場所。<br/><br/>
              そのすべてが、あなたの人生と<br/>
              静かにつながっているかもしれません。<br/><br/>
              まずは無料診断で、あなたと縁の深い<br/>
              守護神社を知ることから始めてみませんか。
            </p>
          </FadeUp>
          <FadeUp delay={0.18}>
            <button onClick={toForm} className="g-gold" style={{
              display:"inline-flex", alignItems:"center", gap:"10px",
              padding:"24px 56px", borderRadius:"12px",
              color:"#fff", fontSize:"clamp(1.05rem,2.5vw,1.15rem)",
              fontWeight:800, letterSpacing:"0.14em", fontFamily:Fs,
              boxShadow:"0 10px 60px rgba(0,0,0,.85),0 0 48px rgba(201,155,77,.32)",
              marginBottom:"16px",
            }}><Torii/>今すぐ無料で守護神社を調べる</button>
            <p style={{ color:C.crMut, fontSize:"0.76rem", letterSpacing:"0.06em" }}>完全無料・登録不要・約30秒</p>
          </FadeUp>

          {/* P.S. */}
          <FadeUp delay={0.26}>
            <div style={{
              marginTop:"60px", padding:"28px 36px",
              background:"rgba(201,155,77,.05)", border:`1px solid ${C.gBd}`,
              borderRadius:"14px", maxWidth:"560px", margin:"60px auto 0", textAlign:"left",
            }}>
              <p style={{ fontFamily:Fd, fontSize:"0.73rem", color:C.gold, letterSpacing:"0.2em", marginBottom:"12px" }}>P.S.</p>
              <p style={{ color:C.crDim, fontSize:"clamp(0.93rem,1.9vw,1rem)", lineHeight:2.1 }}>
                縁のある守護神社に気づかないまま、時間だけが過ぎていくことがあります。今日ここで生年月日を入力するだけで、その縁に気づくことができます。所要時間は約30秒です。
              </p>
            </div>
          </FadeUp>
        </div>

        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:"120px",
          background:`linear-gradient(to top,${C.ink},transparent)`, pointerEvents:"none",
        }}/>
      </section>


      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ background:C.ink, padding:`28px ${PX}`, borderTop:`1px solid rgba(201,155,77,.12)` }}>
        <div style={{
          maxWidth:"980px", margin:"0 auto",
          display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <Torii/>
            <span style={{ fontFamily:Fd, fontSize:"0.66rem", letterSpacing:"0.32em", color:C.gold }}>守護神社診断</span>
          </div>
          <div style={{ display:"flex", gap:"22px", flexWrap:"wrap" }}>
            {[["利用規約","#"],["プライバシーポリシー","#"],["お問い合わせ","#"]].map(([l,h])=>(
              <Link key={l} href={h} style={{ fontSize:"0.73rem", color:C.crMut, textDecoration:"none", letterSpacing:"0.04em" }}>{l}</Link>
            ))}
          </div>
          <p style={{ fontSize:"0.68rem", color:C.crMut }}>© 2026 全国神社スポット</p>
        </div>
      </footer>
    </div>
  );
}
