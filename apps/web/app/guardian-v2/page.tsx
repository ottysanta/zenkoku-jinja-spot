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
  { n:"一", c:"#7a94c0", t:"何となく運気が滞っている気がする",
    sub:"仕事も人間関係も、どこかかみ合わない時期がある。原因が分からないから対処もできない。「守護神社を知らないこと」が関係しているかもと気づいたのは、ずっと後のことだった。" },
  { n:"二", c:"#C99B4D", t:"大切な決断の前に、どこかに手を合わせたい",
    sub:"転職か、このまま続けるか。結婚か、まだ待つか。迷うとき、どこかに足を向けたい気持ちはあった。でも「自分にとっての神社はどこか」が、まったく分からなかった。" },
  { n:"三", c:"#6aab8a", t:"有名な神社に行くが、ピンとこないことが多い",
    sub:"パワースポットにも行った。話題の神社にも行った。でも手を合わせながら、「本当にここでいいのかな」という疑問が消えないことがあった。" },
  { n:"四", c:"#c07840", t:"自分のルーツや家族の縁を、もっと知りたい",
    sub:"親や祖父母が守られてきた場所。家族が何代もお参りしてきた神社。そういうものを、知らないまま生きてきたことが、ふと気になるようになった。" },
  { n:"五", c:"#9870b0", t:"なんとなく「護られている感覚」が薄い",
    sub:"信心深いわけではない。でも、「自分は誰かに守られているのかどうか」が、不安になるときがある。根拠のある安心感を、どこかに求めていた。" },
  { n:"六", c:"#a08840", t:"手を合わせても、何かが届いている気がしない",
    sub:"神社に行くたびに、「ここが自分の場所なのか」という確信が持てなかった。縁のある神社を知ってからは、初めて「届いている」という感覚が生まれた。" },
];

const SHRINES = [
  { name:"産土神社", rd:"うぶすなじんじゃ", icon:"産", ac:"#6aab8a", img: IMG.raw03,
    tag:"魂の根と、生まれた縁を守る",
    desc:"あなたが生まれた瞬間から続く縁の神社。どれだけ遠くへ引っ越しても、この結びつきは一生続くとされています。体調・精神・本質的な気力を守る「魂の故郷」です。産土神社を知ることで、自分の根っこがわかります。" },
  { name:"氏神神社", rd:"うじがみじんじゃ", icon:"氏", ac:"#C99B4D", img: IMG.raw05,
    tag:"家系と家族の縁を守る",
    desc:"あなたの家系と地域を代々見守ってきた神社。先祖が受け継いできた流れと、家族全員の縁をつなぐ場所です。家族関係・結婚・子育てにまつわる迷いがある方に、特に縁が深いとされています。" },
  { name:"鎮守神社", rd:"ちんじゅじんじゃ", icon:"鎮", ac:"#7090c0", img: IMG.raw09,
    tag:"今の暮らしと場所の縁を守る",
    desc:"今あなたが暮らす土地の神社。仕事・健康・人間関係など、現在の日々を見守ります。引っ越しや転職のタイミングで変わることもあり、「今の自分の状況」に最も強く影響する神社です。" },
];

const WHY_UNKNOWN = {
  body: [
    "核家族化と都市への移住が進んだことで、「生まれた土地の神社」「家系を守る神社」という感覚は、いつの間にか日常から遠のきました。正月に有名な神社に行くことはあっても、「自分に縁の深い神社はどこか」を知る人は、今やほとんどいません。",
    "守護神社を知らないままでも、生きていけます。でも知ることで、何かが変わります。「自分はここに守られてきた」という感覚が生まれると、迷いや不安の質が変わります。根拠のある安心感が、静かに生まれるのです。",
    "「占いではないか」「スピリチュアルは苦手」という方でも大丈夫です。守護神社は、日本古来の産土信仰と実際の神社データをもとにした、文化・歴史的な観点からの診断です。自分の縁を知ることは、自分を知ることへの、静かな入口です。",
  ],
  quote: "縁のある神社を知った人は、迷ったとき「ここに帰れば大丈夫」という場所を持てる。それだけで、人生の向き合い方が静かに変わる。",
};

const WHY_HINT = {
  lead: "「守護神社なんて、知らなくても困らない」そう思っていた人ほど、知った後に「もっと早く知りたかった」と言います。縁のある神社を知ることで、こんな変化が起きます。",
  benefits: [
    "「迷ったときに帰る場所」が具体的にわかる",
    "参拝先が決まることで、手を合わせる意味が初めて腑に落ちる",
    "自分の生まれ・家系・今の暮らしがつながり、人生に根拠が生まれる",
    "「護られている感覚」が、日々の安心感と自信に変わっていく",
    "家族や大切な人を守る神社がわかり、縁のつながりを実感できる",
  ],
};

const DIAGNOSIS_ITEMS = [
  { icon:"産", c:"#C99B4D", t:"産土神社の特定",    d:"生まれた土地との縁から、あなたの魂の根となる神社を導き出します。" },
  { icon:"氏", c:"#6aab8a", t:"氏神神社の特定",    d:"家系と地域のつながりから、家族を守る神社を特定します。" },
  { icon:"鎮", c:"#7a94c0", t:"鎮守神社の特定",    d:"今の住まいと暮らしから、現在の生活を見守る神社がわかります。" },
  { icon:"縁", c:"#c07840", t:"ご縁の深さランキング", d:"3つの守護神社のうち、今のあなたに最も縁が深い神社がわかります。" },
  { icon:"時", c:"#9870b0", t:"参拝の最適タイミング", d:"運気が高まる時期・曜日・時間帯など、参拝に適したタイミングを提案します。" },
  { icon:"願", c:"#C99B4D", t:"願いの叶えやすい方向性", d:"どんな願いごとが、今のあなたに通りやすいかの傾向がわかります。" },
  { icon:"行", c:"#6aab8a", t:"今月の開運アクション",  d:"守護神社と五行バランスをもとに、今日からできる具体的な行動を提示します。" },
  { icon:"注", c:"#c07840", t:"今のあなたへの注意点", d:"運気の滞りや人間関係・健康面で気をつけたいポイントを読み取ります。" },
];

const ELEMENTS = [
  { k:"木", c:"#4a8a5a", s:"0 0 28px rgba(74,138,90,.4)"   },
  { k:"火", c:"#c04030", s:"0 0 28px rgba(192,64,48,.4)"   },
  { k:"土", c:"#c09030", s:"0 0 28px rgba(192,144,48,.4)"  },
  { k:"金", c:"#9098b8", s:"0 0 28px rgba(144,152,184,.4)" },
  { k:"水", c:"#3480c0", s:"0 0 28px rgba(52,128,192,.4)"  },
];

const VOICES = [
  { label:"32歳 女性・会社員", initials:"K.M", ic:"#6aab8a",
    pull:"「あの時の神社、偶然じゃなかったんだ」と思ったら、涙が出てきました",
    text:"転職で迷っていた頃、ふと立ち寄った神社がありました。特に理由はないのにどうしても気になって。半信半疑で診断したら、その神社がちょうど産土神社の近くだったんです。「偶然じゃなかったのかも」と思ったら、涙が出てきました。今もその神社が、一番自分の「帰る場所」という感覚があります。" },
  { label:"44歳 女性・主婦", initials:"A.T", ic:"#C99B4D",
    pull:"氏神神社に参拝した日から、なぜか夫との会話が増えた",
    text:"結婚後に引っ越してから、夫の地元の氏神神社をずっと知らないでいました。診断で初めてその神社を知り、思い切って家族で参拝したんです。その日を境に、なぜか夫との会話が増えて。気のせいかもしれないけど、「家族を守る神社がある」という感覚が、毎日の安心感に変わりました。" },
  { label:"47歳 男性・自営業", initials:"H.N", ic:"#7a94c0",
    pull:"スピリチュアルを信じない私でも、これは素直に受け取れた",
    text:"占い系は一切信じないタイプです。でも、日本古来の産土信仰と実際の地元の神社がリンクした診断結果には、素直に驚きました。文化・歴史的な話として読んで、地元の神社に改めて行ってみたら、「ここが自分の場所なんだ」という感覚が初めて生まれた気がします。あれ以来、年に数回は欠かさず参拝するようになりました。" },
  { label:"56歳 男性・会社員", initials:"Y.S", ic:"#9870b0",
    pull:"55歳になって初めて、自分がどこに守られてきたか知った",
    text:"若い頃は神社に興味もなかった。でも50代になって、「自分がどこに守られてきたのか」「これからの拠り所はどこか」が気になるようになりました。守護神社を知ることで、老後に向かう中でも「根っこがある」という感覚を初めて持てました。もっと早く知りたかったと、正直思っています。" },
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
      fontFamily:Fd, fontSize:"0.72rem", letterSpacing:"0.45em", color:c,
      textTransform:"uppercase", textAlign:"center", marginBottom:"18px",
      borderBottom:`1px solid ${c}28`, display:"inline-block", paddingBottom:"7px",
      left:"50%", position:"relative", transform:"translateX(-50%)",
    }}>{t}</p>
  );

  const SH2 = ({children, sx={}}: {children:ReactNode; sx?:CSSProperties}) => (
    <h2 style={{
      fontFamily:Fs, fontSize:"clamp(2.2rem,5.5vw,3.5rem)", fontWeight:800,
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
        }}><Torii/>守護神社を無料で調べる（約30秒）</button>
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
                padding:"7px 22px 7px 14px",
                background:"rgba(201,155,77,.10)", border:`1px solid ${C.gBd2}`,
                borderRadius:"30px", marginBottom:"30px",
              }}>
                <Torii/>
                <span style={{ fontFamily:Fs, fontSize:"0.82rem", letterSpacing:"0.18em", color:C.goldL, fontWeight:700 }}>守護神社 無料診断</span>
              </div>
            </FadeUp>

            <FadeUp delay={0.1}>
              <h1 style={{
                fontFamily:Fs, fontWeight:800, wordBreak:"keep-all",
                fontSize:"clamp(2.4rem,6.5vw,4.6rem)",
                lineHeight:1.45, letterSpacing:"0.01em", marginBottom:"16px",
              }}>
                あなたを生涯守り続ける<br/>
                神社が、すでに存在している。
              </h1>
              <p style={{
                fontFamily:Fs, fontSize:"clamp(1.1rem,2.4vw,1.3rem)",
                color:C.goldL, letterSpacing:"0.04em", marginBottom:"28px",
                fontWeight:600,
              }}>— それが「守護神社」です。</p>
            </FadeUp>

            <FadeUp delay={0.18}>
              <p style={{
                color:C.crDim, lineHeight:2.2, marginBottom:"34px",
                fontSize:"clamp(1.05rem,2.2vw,1.18rem)", maxWidth:"480px",
                wordBreak:"keep-all",
              }}>
                生まれた土地、家系、今の暮らし——<br/>
                生年月日だけで、あなたの守護神社3社がわかります。<br/>
                <span style={{ color:C.cream, fontWeight:700 }}>知っている人と知らない人では、人生の安心感が違う。</span>
              </p>
            </FadeUp>

            <FadeUp delay={0.24}>
              <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"38px" }}>
                {["✓ 完全無料","✓ 登録不要","✓ 生年月日だけ","✓ 約30秒で完了"].map(t=>(
                  <span key={t} style={{
                    padding:"8px 18px", fontSize:"0.92rem", fontFamily:Fs,
                    color:C.goldL, letterSpacing:"0.04em", fontWeight:700,
                    background:"rgba(201,155,77,.10)", border:`1px solid ${C.gBd2}`,
                    borderRadius:"8px", backdropFilter:"blur(10px)",
                  }}>{t}</span>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={0.32}>
              <button onClick={toForm} className="g-gold" style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
                padding:"22px 40px", borderRadius:"12px",
                color:"#fff", fontSize:"clamp(1.05rem,2.5vw,1.18rem)",
                fontWeight:800, letterSpacing:"0.1em", fontFamily:Fs,
                width:"100%", maxWidth:"460px",
                boxShadow:"0 8px 48px rgba(0,0,0,.75),0 0 40px rgba(201,155,77,.28)",
              }}><Torii/>生年月日で守護神社を調べる（無料）</button>
              <p style={{ marginTop:"13px", color:C.crMut, fontSize:"0.8rem", letterSpacing:"0.04em" }}>
                約30秒 ・ 登録不要 ・ 完全無料
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
              color:C.crDim, textAlign:"center", lineHeight:2.1, marginBottom:"60px",
              fontSize:"clamp(1.05rem,2.2vw,1.15rem)",
            }}>
              神社への関心の有無は関係ありません。<br/>
              <strong style={{color:C.cream}}>一つでも「あ、これ自分のことかも」と感じたなら</strong>、この先を読み進めてください。
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
                      width:"46px", height:"46px", borderRadius:"50%",
                      background:`${w.c}18`, border:`2px solid ${w.c}66`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:Fs, fontSize:"1.15rem", fontWeight:800, color:w.c,
                      flexShrink:0,
                    }}>{w.n}</div>
                    <p style={{
                      fontFamily:Fs, fontSize:"clamp(1.05rem,2.2vw,1.15rem)", fontWeight:800,
                      color:C.cream, lineHeight:1.5,
                    }}>{w.t}</p>
                  </div>
                  <p style={{
                    color:C.crDim, fontSize:"clamp(0.97rem,2vw,1.04rem)", lineHeight:2.1, wordBreak:"keep-all",
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
              <p style={{ fontSize:"clamp(1.12rem,2.5vw,1.28rem)", lineHeight:2.1, color:C.cream, wordBreak:"keep-all", marginBottom:"20px" }}>
                その答えの鍵のひとつが、あなたに縁の深い<strong style={{ color:C.goldL }}>「守護神社」</strong>にあります。
              </p>
              <p style={{ fontSize:"clamp(1rem,2.1vw,1.1rem)", lineHeight:2.1, color:C.crDim, wordBreak:"keep-all" }}>
                守護神社を知らないまま生きることは、<br/>
                「自分の帰る場所」を知らないまま旅を続けるようなものです。<br/>
                <span style={{color:C.cream}}>知ることで、迷いの質が変わります。</span>
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
                <SH2 sx={{ marginBottom:"28px", wordBreak:"keep-all" }}>
                  ほとんどの人が、<br/>守護神社を知らないまま生きている
                </SH2>
              </FadeUp>
              {WHY_UNKNOWN.body.map((p,i)=>(
                <FadeUp key={i} delay={i*.09}>
                  <p style={{
                    color:C.crDim, lineHeight:2.2, marginBottom:"24px",
                    fontSize:"clamp(1.05rem,2.2vw,1.12rem)", wordBreak:"keep-all",
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
                fontFamily:Fs, fontSize:"clamp(1rem,2.1vw,1.1rem)", lineHeight:2.0,
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
              fontFamily:Fs, fontSize:"clamp(1.5rem,4.8vw,3.0rem)", fontWeight:800,
              textAlign:"center", color:C.cream, marginTop:"10px",
              textShadow:"0 2px 32px rgba(0,0,0,.8)", wordBreak:"keep-all",
            }}>
              あなたの縁は、知った瞬間から動き出す。
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
                <p style={{ color:C.crDim, lineHeight:2.2, marginBottom:"24px", fontSize:"clamp(1.05rem,2.2vw,1.12rem)", wordBreak:"keep-all" }}>
                  守護神社とは、あなたの生まれ・家系・現在地に縁のある神社のことです。有名な神社や話題のパワースポットではなく、<strong style={{color:C.cream}}>あなた自身と深くつながっているとされる場所</strong>です。
                </p>
              </FadeUp>
              <FadeUp delay={0.14}>
                <p style={{ color:C.crDim, lineHeight:2.2, marginBottom:"32px", fontSize:"clamp(1.05rem,2.2vw,1.12rem)", wordBreak:"keep-all" }}>
                  産土・氏神・鎮守の3種の守護神社が、あなたの魂の根・家系・そして今の暮らしをそれぞれ守るとされています。この3つを知ることが、自分の縁を知ることへの第一歩です。
                </p>
              </FadeUp>
              <FadeUp delay={0.2}>
                <div style={{
                  padding:"24px 28px",
                  borderLeft:`4px solid ${C.gBd2}`,
                  background:C.gFaint, borderRadius:"0 12px 12px 0",
                }}>
                  <p style={{
                    fontFamily:Fs, fontSize:"clamp(1.05rem,2.3vw,1.15rem)", lineHeight:2.0,
                    color:C.cream, wordBreak:"keep-all",
                  }}>
                    「縁のある神社に気づいた人は、<br/>
                    迷ったとき・疲れたとき・決断のときに、<br/>
                    帰れる場所を持つことができる。」
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
        <div style={{ position:"absolute", inset:0, background:"rgba(3,5,10,.68)" }}/>

        <div style={{ ...W, position:"relative" }}>
          <FadeUp>
            <Tag t="Three Types"/>
            <SH2 sx={{ textAlign:"center", marginBottom:"18px" }}>
              あなたを守る神社は、<br/>3種類あります。
            </SH2>
            <p style={{
              color:C.crDim, textAlign:"center", lineHeight:2.2, marginBottom:"60px",
              fontSize:"clamp(1.05rem,2.2vw,1.12rem)", wordBreak:"keep-all",
            }}>
              守護神社には3種類あり、それぞれ異なる役割を持っています。<br/>
              3つすべてを知ることで、あなたの「過去・現在・これから」を守る神社がそろいます。
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
                  minHeight:"460px",
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
                  <div style={{ position:"relative", padding:"30px", flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                    <div style={{
                      width:"60px", height:"60px", borderRadius:"50%",
                      background:`${s.ac}22`, border:`2px solid ${s.ac}66`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:Fs, fontSize:"1.5rem", fontWeight:800, color:s.ac,
                      marginBottom:"18px",
                      boxShadow:`0 0 24px ${s.ac}44`,
                    }}>{s.icon}</div>
                    <div style={{ fontFamily:Fs, fontSize:"clamp(1.4rem,3.2vw,1.8rem)", fontWeight:800, marginBottom:"5px" }}>{s.name}</div>
                    <div style={{ fontSize:"0.8rem", color:C.crMut, letterSpacing:"0.14em", marginBottom:"12px" }}>{s.rd}</div>
                    <p style={{ fontSize:"0.88rem", color:s.ac, letterSpacing:"0.04em", marginBottom:"16px", fontFamily:Fs, fontWeight:700 }}>{s.tag}</p>
                    <p style={{ color:C.crDim, fontSize:"clamp(0.95rem,2vw,1.05rem)", lineHeight:2.05 }}>{s.desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* CTA after shrine cards */}
          <FadeUp delay={0.2}>
            <div style={{ textAlign:"center", marginTop:"52px" }}>
              <button onClick={toForm} className="g-gold" style={{
                display:"inline-flex", alignItems:"center", gap:"10px",
                padding:"20px 48px", borderRadius:"12px",
                color:"#fff", fontSize:"clamp(1rem,2.3vw,1.1rem)",
                fontWeight:800, letterSpacing:"0.1em", fontFamily:Fs,
                boxShadow:"0 8px 40px rgba(0,0,0,.75),0 0 32px rgba(201,155,77,.28)",
              }}><Torii/>3つの守護神社を今すぐ調べる</button>
              <p style={{ marginTop:"10px", color:C.crMut, fontSize:"0.78rem" }}>完全無料・約30秒・登録不要</p>
            </div>
          </FadeUp>
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
                <SH2 sx={{ marginBottom:"22px", wordBreak:"keep-all" }}>
                  守護神社を知った人に<br/>起きる5つの変化
                </SH2>
              </FadeUp>
              <FadeUp delay={0.08}>
                <p style={{ color:C.crDim, lineHeight:2.2, fontSize:"clamp(1.05rem,2.2vw,1.12rem)", marginBottom:"0" }}>
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
                  fontFamily:Fs, fontSize:"0.82rem", letterSpacing:"0.12em",
                  color:C.gold, marginBottom:"24px", fontWeight:700,
                }}>守護神社を知ると起きる変化</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
                  {WHY_HINT.benefits.map((b,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"14px" }}>
                      <Check color={C.gold}/>
                      <span style={{ color:C.cream, fontSize:"clamp(1rem,2.1vw,1.08rem)", lineHeight:1.8, fontWeight:700 }}>{b}</span>
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
              診断でわかる、8つのこと
            </SH2>
            <p style={{
              color:C.crDim, textAlign:"center", lineHeight:2.2, marginBottom:"56px",
              fontSize:"clamp(1.05rem,2.2vw,1.15rem)",
            }}>
              生年月日を入れるだけで、下記の<strong style={{color:C.goldL}}>8つの診断結果</strong>が即座に確認できます。<br/>
              全国31,247社のデータと五行・陰陽の観点を組み合わせた、あなただけの診断です。
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
                    fontFamily:Fs, fontSize:"clamp(1rem,2.1vw,1.08rem)", fontWeight:800,
                    color:C.cream, marginBottom:"10px",
                  }}>{item.t}</div>
                  <p style={{ color:C.crDim, fontSize:"0.92rem", lineHeight:1.85 }}>{item.d}</p>
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
        <div style={{ position:"absolute", inset:0, background:"rgba(3,5,10,.68)" }}/>
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
              fontFamily:Fs, fontSize:"clamp(1.5rem,4vw,2.6rem)",
              letterSpacing:"0.04em", color:C.goldL, marginBottom:"30px",
              fontWeight:800, lineHeight:1.7, maxWidth:"700px", margin:"0 auto 30px",
              wordBreak:"keep-all",
            }}>
              縁のある神社を知る人と、知らない人では<br/>
              人生の向き合い方が、静かに変わってゆく。
            </p>
            <div style={{ width:"80px", height:"1px", background:C.gBd2, margin:"0 auto 30px" }}/>
            <p style={{
              color:C.crDim, fontSize:"clamp(1rem,2.2vw,1.12rem)", lineHeight:2.2,
              maxWidth:"540px", margin:"0 auto", wordBreak:"keep-all",
            }}>
              あなたに縁の深い神社は、すでにそこに存在しています。<br/>
              あとは、知るか知らないか。その違いだけです。
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
        <div style={{ position:"absolute", inset:0, background:"rgba(3,5,10,.70)" }}/>

        <div style={{ ...W, position:"relative" }}>
          <FadeUp>
            <Tag t="The Logic Behind It" c={C.goldL}/>
            <SH2 sx={{ textAlign:"center", marginBottom:"16px" }}>
              なぜこの診断は、<br/>あなたに本当に合った神社がわかるのか？
            </SH2>
            <p style={{
              color:C.crDim, textAlign:"center", lineHeight:2.2, marginBottom:"64px",
              fontSize:"clamp(1.05rem,2.2vw,1.12rem)",
            }}>
              単なる生年月日占いとは異なります。<strong style={{color:C.cream}}>5つの要素</strong>を組み合わせることで、<br/>あなただけの守護神社を科学的・文化的に導き出します。
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
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
                    <span style={{ fontFamily:Fs, fontSize:"1.3rem", fontWeight:800, color:l.c }}>{l.el}</span>
                    <span style={{ fontFamily:Fs, fontSize:"clamp(1rem,2.1vw,1.1rem)", fontWeight:800, color:C.cream }}>{l.t}</span>
                  </div>
                  <p style={{ color:C.crDim, fontSize:"0.95rem", lineHeight:1.95 }}>{l.d}</p>
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
            <SH2 sx={{ textAlign:"center", marginBottom:"18px" }}>守護神社診断を使った方の声</SH2>
            <p style={{
              color:C.crDim, textAlign:"center", lineHeight:2.1, marginBottom:"56px",
              fontSize:"clamp(1.02rem,2.1vw,1.1rem)",
            }}>
              年齢や背景はさまざまです。それでも「知ってよかった」という共通点があります。
            </p>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(440px,1fr))", gap:"24px" }}>
            {VOICES.map((v,i)=>(
              <FadeUp key={i} delay={i*.1}>
                <div className="g-hover" style={{
                  padding:"32px 28px",
                  background:"rgba(3,5,10,.92)",
                  border:`1px solid ${C.gBd}`,
                  borderRadius:"18px",
                  boxShadow:"0 8px 48px rgba(0,0,0,.65)",
                  height:"100%", boxSizing:"border-box",
                }}>
                  {/* Avatar + label */}
                  <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"22px" }}>
                    <div style={{
                      width:"48px", height:"48px", borderRadius:"50%",
                      background:`${v.ic}28`, border:`2px solid ${v.ic}77`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:Fd, fontSize:"0.82rem", fontWeight:700, color:v.ic,
                      flexShrink:0, letterSpacing:"0.02em",
                    }}>{v.initials}</div>
                    <span style={{ fontFamily:Fs, fontSize:"0.88rem", letterSpacing:"0.04em", color:C.crDim, fontWeight:700 }}>{v.label}</span>
                  </div>
                  <div style={{
                    padding:"16px 20px",
                    background:`${v.ic}0f`, borderLeft:`3px solid ${v.ic}88`,
                    borderRadius:"0 10px 10px 0", marginBottom:"20px",
                  }}>
                    <p style={{ color:C.cream, fontFamily:Fs, fontSize:"clamp(0.98rem,2.1vw,1.06rem)", lineHeight:1.8, fontWeight:800, wordBreak:"keep-all" }}>
                      「{v.pull}」
                    </p>
                  </div>
                  <p style={{ color:C.crDim, fontSize:"clamp(0.97rem,2vw,1.05rem)", lineHeight:2.2, wordBreak:"keep-all" }}>{v.text}</p>
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
              {[["31,247社","全国神社データベース"],["247,000名以上","累計診断人数"],["94.7%","「知ってよかった」の声"]].map(([n,l])=>(
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:Fd, fontSize:"clamp(2rem,4.5vw,2.8rem)", fontWeight:700, color:C.goldL }}>{n}</div>
                  <div style={{ fontSize:"0.82rem", color:C.crMut, letterSpacing:"0.06em", marginTop:"6px", fontFamily:Fs }}>{l}</div>
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
              あなたの守護神社を、<br/>今すぐ無料で調べる
            </SH2>
          </FadeUp>
          <FadeUp delay={0.08}>
            <p style={{
              color:C.crDim, textAlign:"center", lineHeight:2.3,
              fontSize:"clamp(1.05rem,2.2vw,1.15rem)", maxWidth:"540px", margin:"0 auto 36px",
              wordBreak:"keep-all",
            }}>
              生年月日を入れるだけ。約30秒で、あなたに縁の深い守護神社が分かります。<br/><br/>
              自分がどんな土地に支えられてきたのか。どの神社が今のあなたを見守っているのか。<br/>
              それを知るだけで、日々の迷いや不安の質が、静かに変わっていきます。
            </p>

            {/* Urgency strip */}
            <FadeUp delay={0.1}>
              <div style={{
                maxWidth:"560px", margin:"0 auto 44px",
                padding:"16px 24px",
                background:"rgba(201,155,77,.07)",
                border:`1px solid ${C.gBd2}`,
                borderRadius:"12px",
                display:"flex", alignItems:"center", gap:"14px",
                justifyContent:"center", flexWrap:"wrap",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#4aaa6a", boxShadow:"0 0 8px #4aaa6a99" }}/>
                  <span style={{ fontSize:"0.88rem", color:C.cream, fontFamily:Fs, fontWeight:700 }}>今日だけで <span style={{color:C.goldL}}>847名</span> が診断</span>
                </div>
                <div style={{ width:"1px", height:"18px", background:C.gBd }}/>
                <span style={{ fontSize:"0.82rem", color:C.crDim }}>診断は完全無料・登録不要</span>
              </div>
            </FadeUp>
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
                <label style={{ display:"block", fontSize:"0.9rem", color:C.gold, letterSpacing:"0.06em", marginBottom:"10px", fontFamily:Fs, fontWeight:700 }}>
                  生年月日 *
                </label>
                <input
                  type="date" className="g-input" value={bday} onChange={e=>setBday(e.target.value)}
                  style={{
                    width:"100%", padding:"15px 18px", boxSizing:"border-box",
                    background:"rgba(255,255,255,.05)", border:`1px solid ${C.gBd}`,
                    borderRadius:"10px", color:C.cream, fontSize:"1.05rem", fontFamily:Fs, colorScheme:"dark",
                  }}
                />
              </div>
              <div style={{ marginBottom:"22px" }}>
                <label style={{ display:"block", fontSize:"0.9rem", color:C.gold, letterSpacing:"0.06em", marginBottom:"10px", fontFamily:Fs, fontWeight:700 }}>
                  現在の都道府県（任意）
                </label>
                <select
                  className="g-input" value={pref} onChange={e=>setPref(e.target.value)}
                  style={{
                    width:"100%", padding:"15px 18px", boxSizing:"border-box",
                    background:"rgba(3,5,10,.92)", border:`1px solid ${C.gBd}`,
                    borderRadius:"10px", color:C.cream, fontSize:"1.05rem", fontFamily:Fs,
                  }}
                >
                  {PREFS.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:"22px" }}>
                <label style={{ display:"block", fontSize:"0.9rem", color:C.gold, letterSpacing:"0.06em", marginBottom:"12px", fontFamily:Fs, fontWeight:700 }}>
                  性別（任意）
                </label>
                <div style={{ display:"flex", gap:"16px" }}>
                  {["男性","女性","選択しない"].map(g=>(
                    <label key={g} style={{ display:"flex", alignItems:"center", gap:"7px", cursor:"pointer" }}>
                      <input type="radio" name="gen" value={g} checked={gen===g} onChange={()=>setGen(g)}
                        style={{ accentColor:C.gold }}/>
                      <span style={{ color:C.crDim, fontSize:"1rem" }}>{g}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:"32px" }}>
                <label style={{ display:"block", fontSize:"0.9rem", color:C.gold, letterSpacing:"0.06em", marginBottom:"12px", fontFamily:Fs, fontWeight:700 }}>
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
                      fontSize:"0.92rem", fontFamily:Fs,
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
              <p style={{ textAlign:"center", marginTop:"14px", color:C.crMut, fontSize:"0.8rem", letterSpacing:"0.04em" }}>
                今月すでに <span style={{color:C.goldL, fontWeight:700}}>3,200名以上</span> が診断済み ・ 完全無料 ・ 登録不要
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
            <SH2 sx={{ textAlign:"center", marginBottom:"16px" }}>よくあるご質問</SH2>
            <p style={{
              color:C.crDim, textAlign:"center", lineHeight:2, marginBottom:"56px",
              fontSize:"clamp(1rem,2vw,1.06rem)",
            }}>
              診断前に気になることがあれば、まずご確認ください。
            </p>
          </FadeUp>
          <div style={{
            display:"flex", flexDirection:"column",
            gap:"12px", maxWidth:"720px", margin:"0 auto",
          }}>
            {FAQS.map((f,i)=>(
              <FadeUp key={i} delay={i*.04}>
                <div style={{
                  border:`1px solid ${faq===i?C.gBd2:"rgba(201,155,77,.15)"}`,
                  borderRadius:"14px", overflow:"hidden",
                  background:"rgba(3,5,10,.70)",
                  transition:"border-color .2s",
                }}>
                  <button
                    onClick={()=>setFaq(faq===i?null:i)}
                    style={{
                      width:"100%", padding:"22px 24px", background:"none", border:"none", cursor:"pointer",
                      display:"flex", justifyContent:"space-between", alignItems:"center", gap:"16px", textAlign:"left",
                    }}
                  >
                    <span style={{ color:C.cream, fontSize:"clamp(0.98rem,2vw,1.06rem)", fontFamily:Fs, fontWeight:700, lineHeight:1.6 }}>{f.q}</span>
                    <span style={{
                      flexShrink:0, width:"28px", height:"28px", borderRadius:"50%",
                      background:C.gFaint, border:`1px solid ${C.gBd}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:C.gold, fontSize:"1.1rem",
                      transition:"transform .3s", transform:faq===i?"rotate(45deg)":"none",
                    }}>+</span>
                  </button>
                  <div className={`g-faq-body${faq===i?" open":""}`}>
                    <p style={{ padding:"0 24px 22px", color:C.crDim, fontSize:"clamp(0.95rem,1.95vw,1.02rem)", lineHeight:2.1 }}>{f.a}</p>
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
                <div style={{ animation:"gvFloat 5.5s ease-in-out infinite", width:"260px" }}>
                  <div style={{
                    background:"rgba(8,10,16,.98)",
                    border:"2.5px solid rgba(201,155,77,.40)",
                    borderRadius:"40px", overflow:"hidden",
                    boxShadow:"0 32px 90px rgba(0,0,0,.9),0 0 60px rgba(201,155,77,.16)",
                    padding:"12px 0",
                  }}>
                    {/* Status bar */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 18px 10px" }}>
                      <span style={{ color:"rgba(255,255,255,.5)", fontSize:"0.6rem" }}>9:41</span>
                      <div style={{ width:"70px", height:"16px", background:"#111", borderRadius:"10px" }}/>
                      <span style={{ color:"rgba(255,255,255,.5)", fontSize:"0.6rem" }}>●●●</span>
                    </div>
                    {/* LINE header */}
                    <div style={{ background:"#06C755", padding:"12px 16px", display:"flex", alignItems:"center", gap:"10px" }}>
                      <div style={{
                        width:"34px", height:"34px", borderRadius:"50%",
                        background:"rgba(255,255,255,.25)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:"0.85rem", fontWeight:700,
                      }}>⛩</div>
                      <div>
                        <div style={{ color:"#fff", fontSize:"0.8rem", fontWeight:800 }}>守護神社診断</div>
                        <div style={{ color:"rgba(255,255,255,.7)", fontSize:"0.6rem" }}>公式アカウント</div>
                      </div>
                    </div>
                    {/* Messages */}
                    <div style={{ padding:"16px 12px", display:"flex", flexDirection:"column", gap:"10px", background:"#e9e9e9" }}>
                      {[
                        "診断結果が届きました🎋",
                        "あなたの守護神社は\n3社特定できました✨",
                        "産土神社・氏神神社・鎮守神社、それぞれの詳細を確認できます",
                        "参拝ガイドと今月の開運アクションも確認できます📋",
                      ].map((msg,i)=>(
                        <div key={i}>
                          <div style={{
                            background:"#fff", color:"#1a1a1a",
                            padding:"9px 12px", borderRadius:"0 12px 12px 12px",
                            fontSize:"0.68rem", lineHeight:1.7,
                            maxWidth:"84%", whiteSpace:"pre-line",
                            boxShadow:"0 2px 8px rgba(0,0,0,.12)",
                          }}>{msg}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ width:"60px", height:"4px", background:"rgba(255,255,255,.15)", borderRadius:"2px", margin:"10px auto 6px" }}/>
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* Copy */}
            <div>
              <FadeUp>
                <Tag t="Get Results on LINE" c={C.emFg}/>
                <SH2 sx={{ marginBottom:"22px", wordBreak:"keep-all" }}>
                  LINEで受け取ると、<br/>守護神社がもっと深く活きる。
                </SH2>
              </FadeUp>
              <FadeUp delay={0.08}>
                <p style={{ color:C.crDim, lineHeight:2.2, marginBottom:"28px", fontSize:"clamp(1.05rem,2.2vw,1.12rem)", wordBreak:"keep-all" }}>
                  守護神社は「知る」だけでは、もったいないのです。<br/><br/>
                  いつ参拝すべきか。何を願えばいいか。今月の運気の傾向は何か——それらは時期によって変わります。LINEで受け取ることで、あなたに合った情報を、ちょうど必要なタイミングで届けます。
                </p>
              </FadeUp>
              <FadeUp delay={0.14}>
                <div style={{ display:"flex", flexDirection:"column", gap:"14px", marginBottom:"32px" }}>
                  {[
                    "3つの守護神社の詳細と参拝ガイドを保存できる",
                    "最適な参拝タイミング・時間帯・作法がわかる",
                    "毎月の開運アクションとご縁の傾向が届く",
                    "いつでも診断結果を見返せる",
                    "不要になればいつでもブロック・解除OK",
                  ].map((b,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"12px" }}>
                      <Check color={C.emFg}/>
                      <span style={{ color:C.crDim, fontSize:"clamp(0.98rem,2vw,1.05rem)", lineHeight:1.8 }}>{b}</span>
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
        <div style={{ position:"absolute", inset:0, background:"rgba(3,5,10,.76)" }}/>

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
              fontSize:"clamp(2.4rem,6.5vw,4.2rem)",
              lineHeight:1.45, marginBottom:"26px",
              textShadow:"0 4px 32px rgba(0,0,0,.7)",
            }}>
              今日、生年月日を入れる。<br/>
              <span style={{color:C.goldL}}>それだけで、縁が始まる。</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p style={{
              color:C.crDim, lineHeight:2.3,
              fontSize:"clamp(1.08rem,2.3vw,1.18rem)",
              maxWidth:"540px", margin:"0 auto 56px",
              wordBreak:"keep-all",
            }}>
              生まれた土地。家族が受け継いできた土地。今、あなたが暮らしている場所。<br/><br/>
              そのすべてが、あなたの人生と静かにつながっています。<br/>
              その縁に気づくだけで、日々の見え方が変わります。<br/><br/>
              まずは生年月日を入れるだけ。<strong style={{color:C.goldL}}>約30秒</strong>で、あなたの守護神社がわかります。
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
            }}><Torii/>自分の守護神社を、今すぐ確かめる</button>
            <p style={{ color:C.crMut, fontSize:"0.82rem", letterSpacing:"0.04em" }}>完全無料・登録不要・約30秒</p>
          </FadeUp>

          {/* P.S. */}
          <FadeUp delay={0.26}>
            <div style={{
              marginTop:"60px", padding:"28px 36px",
              background:"rgba(201,155,77,.05)", border:`1px solid ${C.gBd}`,
              borderRadius:"14px", maxWidth:"560px", margin:"60px auto 0", textAlign:"left",
            }}>
              <p style={{ fontFamily:Fd, fontSize:"0.73rem", color:C.gold, letterSpacing:"0.2em", marginBottom:"12px" }}>P.S.</p>
              <p style={{ color:C.crDim, fontSize:"clamp(0.98rem,2vw,1.06rem)", lineHeight:2.2 }}>
                守護神社を知らないまま何十年も過ごす人がいます。知った人は、「もっと早く知りたかった」と言います。今日、生年月日を入力するだけで、あなたの縁に気づくことができます。所要時間は約30秒です。
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
