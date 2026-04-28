"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { trackOmikujiDraw, trackShareClick, trackLineCta } from "@/lib/analytics";
import PushNotificationButton from "@/components/PushNotificationButton";

const LINE_REGISTER_URL = "https://s.lmes.jp/landing-qr/2001537229-95RWxAqY?uLand=BQcXql";

type ElementKey = "木" | "火" | "土" | "金" | "水";
type FortuneKey = "大吉" | "吉" | "中吉" | "小吉" | "末吉" | "凶";

// ─── おみくじ結果データ ────────────────────────────────────────────────────
const FORTUNES: Record<FortuneKey, {
  emoji: string;
  color: string;
  bgFrom: string;
  bgTo: string;
  message: string;
  deityVoice: string;   // 神様からの言葉（引用形式）
  advice: string;
  doToday: string[];    // 今日すること3つ
  luckyColor: string;
  luckyNumber: string;
  luckyDirection: string;
  luckyItem: string;
  shrineAdvice: string; // 参拝するなら
}> = {
  大吉: {
    emoji: "🌟",
    color: "#b45309",
    bgFrom: "#fffbeb",
    bgTo: "#fef3c7",
    message: "大きな幸運があなたの前に開かれています。今日は積極的に動くことで、思いがけない縁と喜びが舞い込んでくるでしょう。温めてきた想い、ずっと躊躇っていた一歩——今日こそそれを外に出す日です。神様があなたの背中を力強く押しています。",
    deityVoice: "「今日のあなたには、失敗する余白すらない。迷わず動け。」",
    advice: "今こそ迷わず一歩を踏み出すとき。長い間温めていた想いを行動に移してください。自信がなくても、今日の行動は必ず何かにつながります。誰かに感謝の言葉を直接伝えると、さらに縁が開きます。",
    doToday: ["温めていた計画を一つ動かす", "気になっていた人に連絡する", "鏡の前で「今日もありがとう」と自分に言う"],
    luckyColor: "朱色・金色",
    luckyNumber: "1・8",
    luckyDirection: "南",
    luckyItem: "赤いもの・金のアクセサリー",
    shrineAdvice: "天照大神・八幡系の神社へ。拝殿の前で「この縁に感謝します」と宣言するように伝えると吉。",
  },
  吉: {
    emoji: "✨",
    color: "#15803d",
    bgFrom: "#f0fdf4",
    bgTo: "#dcfce7",
    message: "穏やかで確かな幸運が続いています。急がず焦らず、今日の縁を大切に積み重ねることで、望む未来が着実に近づいてきます。今日出会う人、今日交わす言葉——そのひとつひとつに丁寧でいてください。大きな花は、小さな水やりの積み重ねで咲くものです。",
    deityVoice: "「急ぐことはない。あなたの歩みは確かに前へ進んでいる。」",
    advice: "人との対話を大切に。今日出会う人があなたの転機のきっかけになるかもしれません。褒め言葉を素直に受け取ること、感謝を言葉にして伝えること——これが今日の最大の吉行動です。",
    doToday: ["誰かに「ありがとう」を直接言う", "今進めていることを一歩前に進める", "自然の中を少し歩く"],
    luckyColor: "緑・白",
    luckyNumber: "3・6",
    luckyDirection: "東",
    luckyItem: "植物・木のもの",
    shrineAdvice: "大国主命・春日大社系が縁が深い日。参拝後に境内をゆっくり歩く時間を取ること。",
  },
  中吉: {
    emoji: "🌸",
    color: "#0284c7",
    bgFrom: "#f0f9ff",
    bgTo: "#e0f2fe",
    message: "今日は平穏な中に小さな喜びが散りばめられています。派手な出来事はないかもしれませんが、身近な幸せに気づく感性こそが今日の宝物。誰かの笑顔、温かい食事、ふと見た空の青さ——それらに心を向けることが、今日の幸運を最大に受け取るコツです。",
    deityVoice: "「目の前にある小さなものを、見落とすなよ。そこに答えが宿っている。」",
    advice: "感謝の気持ちを言葉にして伝えることが吉。日常の中に宝物が隠れています。無理に大きなことをしなくていい。今日は「受け取る日」です。",
    doToday: ["今日出会ったものの中に「良かった」を3つ見つける", "好きな飲み物を丁寧に飲む", "近くの神社に立ち寄る"],
    luckyColor: "水色・白",
    luckyNumber: "5",
    luckyDirection: "北東",
    luckyItem: "水色のもの・透明なもの",
    shrineAdvice: "水辺の神社・弁財天系が吉。「今日あった良いことへの感謝」を伝えるのが最良の参拝。",
  },
  小吉: {
    emoji: "🍀",
    color: "#7c3aed",
    bgFrom: "#faf5ff",
    bgTo: "#ede9fe",
    message: "小さな幸運が静かに積み重なっています。目立たないけれど確実な前進の日。今日の一歩一歩が、明日の大きな喜びへの礎になります。「小さい」を侮らないでください。大木も最初は小さな種です。あなたが今日丁寧にやることが、やがて誰かの心を動かす大きな実になります。",
    deityVoice: "「焦るな。小さな一歩を、ただ丁寧に踏め。それでいい。」",
    advice: "焦りは禁物。丁寧に、誠実に、今の自分にできることをするのが一番の吉。誰かのために何か小さなことをすると、巡り巡ってあなたに返ってきます。",
    doToday: ["今日やるべきことを紙に書いて一つずつ消す", "誰かのために小さなことをする", "就寝前に今日の良かったことを思い出す"],
    luckyColor: "紫・白",
    luckyNumber: "4・7",
    luckyDirection: "西",
    luckyItem: "白いもの・シンプルなもの",
    shrineAdvice: "氏神様（産土神）への参拝が特に吉。「丁寧に生きます」という宣言が縁を整えます。",
  },
  末吉: {
    emoji: "🌿",
    color: "#64748b",
    bgFrom: "#f8fafc",
    bgTo: "#f1f5f9",
    message: "今日は少し立ち止まり、内側に向き合う日かもしれません。表面に見えることより、心の奥にある本当の望みを確かめる時間を持ちましょう。「末吉」は「まだこれから」のサイン。種は土の中でじっと力を蓄えてから芽吹きます。今日の静けさは、明日の跳躍のための充電です。",
    deityVoice: "「今日は動くより、聴く日だ。自分の内側の声に耳を澄ませよ。」",
    advice: "無理な行動は避け、今日はゆっくりと英気を養うことが吉。神社でのお参りが心を整えてくれます。今日感じる「モヤモヤ」を紙に書き出すと、明日への道が見えてきます。",
    doToday: ["今感じていることをノートに書き出す", "いつもより早めに休む", "神社に参拝してお気持ちを整える"],
    luckyColor: "グレー・深緑",
    luckyNumber: "2",
    luckyDirection: "北",
    luckyItem: "落ち着いた色のもの・お茶",
    shrineAdvice: "静かな神社や森の中の神社が吉。「今日も守っていただいてありがとうございます」とだけ伝える参拝が心を軽くします。",
  },
  凶: {
    emoji: "🌑",
    color: "#991b1b",
    bgFrom: "#fff7ed",
    bgTo: "#fee2e2",
    message: "今日は慎重さが必要な日。ただ「凶」は終わりではありません——「注意を促す神様のメッセージ」です。嵐の後に晴れ間が来るように、この時期を誠実に過ごすことで、大きな飛躍への地盤が整います。今日という日に何かを失うより、何かを学ぶつもりでいてください。",
    deityVoice: "「立ち止まれ。今日は進む日ではなく、整える日だ。」",
    advice: "衝動的な判断や新しい挑戦は今日は控えめに。参拝してお祓いを受けることが最善の吉転策。もし何か嫌なことがあっても「これは浄化だ」と受け取ると、エネルギーが変わります。",
    doToday: ["新しいことは今日は一時停止", "神社に参拝してお祓いをお願いする", "今日の経験から学べることを一つ見つける"],
    luckyColor: "白・黒",
    luckyNumber: "9",
    luckyDirection: "南西",
    luckyItem: "お清めの塩・神社のお守り",
    shrineAdvice: "祓戸大神・厄除けで有名な神社への参拝が最も吉。「今日の穢れを祓ってください」と真剣にお願いすることで、明日からの運気が好転します。",
  },
};

// 属性別補足メッセージ（充実版）
const ELEMENT_SUPPLEMENT: Record<ElementKey, {
  message: string;
  deity: string;
  prayer: string;
  todayFocus: string;
}> = {
  木: {
    message: "木属性のあなたは「縁を結ぶ力」が本質。今日のおみくじの結果は、あなたの人間関係と縁の糸に特に作用します。今日出会う人、今日交わす言葉——そのひとつひとつが木の根のように、地中で深く繋がっています。大国主命と素戔嗚尊があなたを見守っています。",
    deity: "大国主命・素戔嗚尊",
    prayer: "「大国主命様、今日出会う縁をどうか豊かなものとしてください。」",
    todayFocus: "人との繋がり・縁を大切にする",
  },
  火: {
    message: "火属性のあなたは「浄化と変革のエネルギー」が本質。今日のおみくじは、あなたの情熱と行動力に特に強く作用します。不要なものを燃やし、新しい光を照らす——今日あなたが感じる「変えたい」という衝動は正しい直感です。天照大神と稲荷大神があなたを照らしています。",
    deity: "天照大神・稲荷大神",
    prayer: "「天照大神様、今日の私の一歩に光を与えてください。」",
    todayFocus: "行動・変革・情熱を表に出す",
  },
  土: {
    message: "土属性のあなたは「安定と豊かさを育む力」が本質。今日のおみくじは、あなたの積み重ねと継続力に特に深く響きます。地道に耕した土から豊かな実りが生まれるように、今日の丁寧な一歩が確かな未来を作ります。稲荷大神と大地の神々があなたを支えています。",
    deity: "稲荷大神・豊受大御神",
    prayer: "「今日も豊かな一日を与えてくださることへの感謝を申し上げます。」",
    todayFocus: "地道な積み重ね・感謝・安定",
  },
  金: {
    message: "金属性のあなたは「判断力と清廉さ」が本質。今日のおみくじは、あなたの決断力と洞察力に特に作用します。迷いが晴れる日、答えが見える瞬間——今日のあなたには鋭い直感が宿っています。八幡大神と天手力男命があなたの判断を後押ししています。",
    deity: "八幡大神・天手力男命",
    prayer: "「八幡大神様、今日正しい選択ができるよう、明晰な心をお授けください。」",
    todayFocus: "決断・誠実さ・本質を見抜く",
  },
  水: {
    message: "水属性のあなたは「深い感受性と直感」が本質。今日のおみくじは、あなたの心の流れと感情の動きに特に強く作用します。水が低いところに流れるように、今日感じる自然な「引き寄せ」に従ってください。弁財天と住吉大神があなたの感覚を澄み渡らせています。",
    deity: "弁財天・住吉大神",
    prayer: "「弁財天様、今日の私の直感を清らかに研ぎ澄ましてください。」",
    todayFocus: "直感・感受性・心の声を聴く",
  },
};

// シード付き乱数（日付 + 属性で決定論的）
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) / 2147483647;
}

function drawFortune(dateStr: string, element: string): FortuneKey {
  const rand = seededRandom(dateStr + element);
  if (rand < 0.10) return "大吉";
  if (rand < 0.35) return "吉";
  if (rand < 0.65) return "中吉";
  if (rand < 0.85) return "小吉";
  if (rand < 0.95) return "末吉";
  return "凶";
}

function todayStr(): string {
  return new Date().toLocaleDateString("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });
}

const FORTUNE_ORDER: FortuneKey[] = ["大吉", "吉", "中吉", "小吉", "末吉", "凶"];

// ─── メイン ────────────────────────────────────────────────────────────────
export default function OmikujiClient() {
  const [phase, setPhase]         = useState<"idle" | "drawing" | "result">("idle");
  const [fortune, setFortune]     = useState<FortuneKey | null>(null);
  const [element, setElement]     = useState<ElementKey | null>(null);
  const [alreadyDrawn, setAlreadyDrawn] = useState(false);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    setMounted(true);
    // localStorage から属性と今日のおみくじを取得
    const storedElement = localStorage.getItem("guardian_element") as ElementKey | null;
    setElement(storedElement);

    const today = todayStr();
    const storedFortune = localStorage.getItem(`omikuji_${today}`) as FortuneKey | null;
    if (storedFortune) {
      setFortune(storedFortune);
      setAlreadyDrawn(true);
      setPhase("result");
    }
  }, []);

  function handleDraw() {
    setPhase("drawing");
    const today = todayStr();
    const el = element ?? "水";
    const result = drawFortune(today, el);

    setTimeout(() => {
      setFortune(result);
      localStorage.setItem(`omikuji_${today}`, result);
      trackOmikujiDraw(result);
      setPhase("result");
    }, 1800);
  }

  const fortuneData = fortune ? FORTUNES[fortune] : null;
  const fortuneIndex = fortune ? FORTUNE_ORDER.indexOf(fortune) : -1;
  const stars = fortune ? Math.max(1, 6 - fortuneIndex) : 0;

  const shareText = fortune
    ? `今日のおみくじ：${fortune}！${fortuneData?.advice ?? ""} あなたの属性も診断してみて👇 #神社おみくじ`
    : "";
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/omikuji` : "";

  if (!mounted) return null;

  // ── 引く前 ──────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <p className="text-[11px] tracking-[0.3em] text-vermilion-deep font-semibold mb-3">
            ⛩ DAILY OMIKUJI
          </p>
          <h1 className="font-serif text-3xl text-sumi mb-3">今日のおみくじ</h1>
          <p className="text-sumi/60 text-sm max-w-xs mx-auto leading-relaxed">
            1日1回、守護神様からの今日のメッセージを受け取りましょう。
            {element && <span className="block mt-1 text-xs text-sumi/45">あなたの属性：<strong className="text-sumi/70">{element}属性</strong></span>}
          </p>
        </div>

        {/* おみくじ筒 */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-vermilion/10 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-vermilion/15 flex items-center justify-center">
                <span className="text-6xl">📜</span>
              </div>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-vermilion flex items-center justify-center text-white text-xs font-bold animate-pulse">
              今日
            </div>
          </div>

          <button
            onClick={handleDraw}
            className="min-w-[200px] rounded-full bg-vermilion px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-vermilion-deep hover:shadow-xl active:scale-95"
          >
            おみくじを引く
          </button>
          <p className="text-[11px] text-sumi/40">本日の結果は1日1回まで</p>
          <PushNotificationButton />
        </div>

        {/* 守護診断への誘導 */}
        {!element && (
          <div className="rounded-xl border border-border bg-washi/60 p-4 text-center">
            <p className="text-xs text-sumi/60 mb-2">
              守護神社診断をすると、属性別のメッセージが届きます
            </p>
            <Link href="/diagnose"
              className="text-sm font-semibold text-vermilion-deep underline hover:no-underline">
              守護神社診断を受ける →
            </Link>
          </div>
        )}
      </div>
    );
  }

  // ── 引いている最中 ────────────────────────────────────────────────────────
  if (phase === "drawing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-vermilion/10 animate-ping absolute inset-0" />
          <div className="w-28 h-28 rounded-full bg-vermilion/20 flex items-center justify-center relative">
            <span className="text-5xl animate-bounce">🙏</span>
          </div>
        </div>
        <div className="text-center">
          <p className="font-serif text-xl text-sumi">神様に問いかけています…</p>
          <p className="text-sm text-sumi/50 mt-1">今日のあなたへのメッセージを受け取っています</p>
        </div>
      </div>
    );
  }

  // ── 結果 ─────────────────────────────────────────────────────────────────
  if (!fortuneData || !fortune) return null;

  return (
    <div className="space-y-5">
      {/* 結果バナー */}
      <section
        className="rounded-2xl overflow-hidden shadow-lg text-center py-8 px-6"
        style={{ background: `linear-gradient(135deg, ${fortuneData.bgFrom}, ${fortuneData.bgTo})` }}
      >
        {alreadyDrawn && (
          <p className="text-[10px] tracking-[0.3em] text-sumi/40 mb-3">本日のおみくじ結果</p>
        )}
        <div className="text-6xl mb-3">{fortuneData.emoji}</div>
        <div
          className="font-serif text-6xl font-bold mb-2"
          style={{ color: fortuneData.color }}
        >
          {fortune}
        </div>
        <div className="flex justify-center gap-1 mb-4">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`text-lg ${i < stars ? "opacity-100" : "opacity-20"}`}
              style={{ color: fortuneData.color }}>★</span>
          ))}
        </div>
        <p className="text-sm text-sumi/75 max-w-sm mx-auto leading-relaxed">
          {fortuneData.message}
        </p>
      </section>

      {/* 神様からの言葉 */}
      <section className="rounded-xl border-l-4 border-vermilion bg-vermilion/5 px-5 py-4">
        <p className="text-[10px] tracking-[0.3em] text-vermilion-deep font-bold mb-2">神様からの言葉</p>
        <p className="font-serif text-base text-sumi/85 leading-relaxed italic">
          {fortuneData.deityVoice}
        </p>
      </section>

      {/* アドバイス */}
      <section className="rounded-xl border border-vermilion/20 bg-vermilion/5 p-5">
        <p className="text-[10px] tracking-[0.3em] text-vermilion-deep font-bold mb-2">今日のアドバイス</p>
        <p className="text-sm text-sumi/80 leading-relaxed">{fortuneData.advice}</p>
      </section>

      {/* 今日すること */}
      <section className="rounded-xl border border-border bg-white p-5">
        <p className="text-[10px] tracking-[0.3em] text-sumi/50 font-bold mb-3">今日すること</p>
        <ul className="space-y-2">
          {fortuneData.doToday.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-sumi/80">
              <span className="shrink-0 w-5 h-5 rounded-full bg-vermilion/10 text-vermilion-deep text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ラッキー情報 */}
      <section className="rounded-xl border border-border bg-washi/60 p-5">
        <p className="text-[10px] tracking-[0.3em] text-sumi/50 font-bold mb-3">今日のラッキー</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-white p-2.5">
            <p className="text-[10px] text-sumi/45 mb-0.5">色</p>
            <p className="font-semibold text-sumi/80">{fortuneData.luckyColor}</p>
          </div>
          <div className="rounded-lg bg-white p-2.5">
            <p className="text-[10px] text-sumi/45 mb-0.5">数字</p>
            <p className="font-semibold text-sumi/80">{fortuneData.luckyNumber}</p>
          </div>
          <div className="rounded-lg bg-white p-2.5">
            <p className="text-[10px] text-sumi/45 mb-0.5">方位</p>
            <p className="font-semibold text-sumi/80">{fortuneData.luckyDirection}</p>
          </div>
          <div className="rounded-lg bg-white p-2.5">
            <p className="text-[10px] text-sumi/45 mb-0.5">アイテム</p>
            <p className="font-semibold text-sumi/80 text-xs">{fortuneData.luckyItem}</p>
          </div>
        </div>
      </section>

      {/* 属性別メッセージ */}
      {element && (
        <section className="rounded-xl border border-border bg-washi/60 p-5 space-y-3">
          <p className="text-[10px] tracking-[0.25em] text-sumi/50 font-bold">
            {element}属性・{ELEMENT_SUPPLEMENT[element].deity}からのメッセージ
          </p>
          <p className="text-sm text-sumi/80 leading-relaxed">
            {ELEMENT_SUPPLEMENT[element].message}
          </p>
          <div className="rounded-lg bg-vermilion/5 border border-vermilion/15 p-3">
            <p className="text-[10px] text-vermilion-deep font-bold mb-1">今日のフォーカス</p>
            <p className="text-xs text-sumi/75">{ELEMENT_SUPPLEMENT[element].todayFocus}</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-3">
            <p className="text-[10px] text-sumi/50 mb-1">参拝時のおすすめの言葉</p>
            <p className="text-xs text-sumi/70 italic">{ELEMENT_SUPPLEMENT[element].prayer}</p>
          </div>
        </section>
      )}

      {/* 参拝アドバイス */}
      <section className="rounded-xl border border-border bg-white p-5">
        <p className="text-[10px] tracking-[0.3em] text-sumi/50 font-bold mb-2">今日の参拝アドバイス</p>
        <p className="text-sm text-sumi/75 leading-relaxed">{fortuneData.shrineAdvice}</p>
        <div className="mt-3 text-center">
          <Link href="/map" className="text-xs text-vermilion-deep underline">近くの神社を探す →</Link>
        </div>
      </section>

      {/* ガイド記事への誘導 */}
      <section className="rounded-xl border border-vermilion/20 bg-vermilion/5 p-5 text-center">
        <p className="text-[10px] tracking-[0.3em] text-vermilion-deep font-bold mb-2">深く知る</p>
        <p className="text-sm text-sumi/75 leading-relaxed mb-4">
          あなたの守護タイプ・神社との縁をもっと詳しく知りたい方へ
        </p>
        <Link
          href="/guide/lifepath-7"
          className="inline-flex items-center gap-1.5 rounded-full bg-vermilion px-6 py-2.5 text-sm font-bold text-white shadow transition hover:bg-vermilion/90 active:scale-95"
        >
          ⛩ 神社ガイド記事を読む →
        </Link>
      </section>

      {/* シェアボタン */}
      <section className="rounded-xl border border-border bg-white/60 p-4">
        <p className="text-xs text-sumi/50 text-center mb-3">今日の結果をシェアする</p>
        <div className="flex flex-wrap justify-center gap-2">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-bold text-white transition hover:bg-sumi active:scale-95"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Xでシェア
          </a>
          <button
            onClick={() => { navigator.clipboard?.writeText(`${shareText} ${shareUrl}`); trackShareClick("omikuji"); }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-sumi transition hover:bg-washi active:scale-95"
          >
            📋 コピー
          </button>
        </div>
      </section>

      {/* プッシュ通知 */}
      <div className="flex justify-center">
        <PushNotificationButton />
      </div>

      {/* LINE CTA */}
      <section className="rounded-2xl bg-gradient-to-br from-sumi to-sumi/80 p-5 text-white text-center">
        <p className="text-[10px] tracking-[0.3em] text-white/40 mb-2">SPECIAL OFFER</p>
        <p className="font-serif text-lg mb-2">登録後すぐ届く：守護神様からの3つのサイン</p>
        <p className="text-sm text-white/70 mb-1">
          あなたの五行属性に合わせた
        </p>
        <ul className="text-left text-[12px] text-white/60 max-w-xs mx-auto mb-4 space-y-1">
          <li>✦ 今のあなたに起きているサインの読み方</li>
          <li>✦ 属性別・今月の吉日と参拝のタイミング</li>
          <li>✦ 守護神様からの毎週のメッセージ</li>
        </ul>
        <a href={LINE_REGISTER_URL} target="_blank" rel="noopener noreferrer"
          onClick={() => trackLineCta("omikuji")}
          className="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#05a648] active:scale-95">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          LINE登録で毎週メッセージ
        </a>
      </section>

      {/* 他の診断へ */}
      <div className="flex justify-center gap-4 text-sm">
        <Link href="/diagnose" className="text-vermilion-deep underline hover:no-underline">
          守護神社診断 →
        </Link>
        <Link href="/diagnose/compat" className="text-vermilion-deep underline hover:no-underline">
          相性診断 →
        </Link>
      </div>
    </div>
  );
}
