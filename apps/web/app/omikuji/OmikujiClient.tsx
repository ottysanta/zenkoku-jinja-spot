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
  advice: string;
  luckyItem: string;
}> = {
  大吉: {
    emoji: "🌟",
    color: "#b45309",
    bgFrom: "#fffbeb",
    bgTo: "#fef3c7",
    message: "大きな幸運があなたの前に開かれています。今日は積極的に動くことで、思いがけない縁と喜びが舞い込んでくるでしょう。神様があなたの背中を力強く押しています。",
    advice: "今こそ迷わず一歩を踏み出すとき。長い間温めていた想いを行動に移してください。",
    luckyItem: "朱色のもの・南向きの参拝",
  },
  吉: {
    emoji: "✨",
    color: "#15803d",
    bgFrom: "#f0fdf4",
    bgTo: "#dcfce7",
    message: "穏やかで確かな幸運が続いています。急がず焦らず、今日の縁を大切に積み重ねることで、望む未来が着実に近づいてきます。",
    advice: "人との対話を大切に。今日出会う人があなたの転機のきっかけになるかもしれません。",
    luckyItem: "緑色のもの・東向きの参拝",
  },
  中吉: {
    emoji: "🌸",
    color: "#0284c7",
    bgFrom: "#f0f9ff",
    bgTo: "#e0f2fe",
    message: "今日は平穏な中に小さな喜びが散りばめられています。派手な出来事はないかもしれませんが、身近な幸せに気づく感性を大切にしてください。",
    advice: "感謝の気持ちを言葉にして伝えることが吉。日常の中に宝物が隠れています。",
    luckyItem: "水色のもの・水辺の参拝",
  },
  小吉: {
    emoji: "🍀",
    color: "#7c3aed",
    bgFrom: "#faf5ff",
    bgTo: "#ede9fe",
    message: "小さな幸運が静かに積み重なっています。目立たないけれど確実な前進の日。今日の一歩一歩が、明日の大きな喜びへの礎になります。",
    advice: "焦りは禁物。丁寧に、誠実に、今の自分にできることをするのが一番の吉。",
    luckyItem: "白いもの・朝の参拝",
  },
  末吉: {
    emoji: "🌿",
    color: "#64748b",
    bgFrom: "#f8fafc",
    bgTo: "#f1f5f9",
    message: "今日は少し立ち止まり、内側に向き合う日かもしれません。表面に見えることより、心の奥にある本当の望みを確かめる時間を持ちましょう。",
    advice: "無理な行動は避け、今日はゆっくりと英気を養うことが吉。神社でのお参りが心を整えてくれます。",
    luckyItem: "落ち着いた色のもの・静かな参拝",
  },
  凶: {
    emoji: "🌑",
    color: "#991b1b",
    bgFrom: "#fff7ed",
    bgTo: "#fee2e2",
    message: "今日は慎重さが必要な日。ただ「凶」は停滞や試練を知らせるもの。嵐の後に晴れ間が来るように、この時期を誠実に過ごすことで、大きな飛躍への地盤が整います。",
    advice: "衝動的な判断や新しい挑戦は今日は控えめに。参拝してお祓いを受けることが最善の吉転策。",
    luckyItem: "神社参拝・お祓い",
  },
};

// 属性別補足メッセージ
const ELEMENT_SUPPLEMENT: Record<ElementKey, string> = {
  木: "縁を結ぶ力が高まっています。今日出会う人との繋がりを大切に。大国主命があなたの縁を守っています。",
  火: "浄化のエネルギーが満ちています。不要なものを手放し、新しい光を迎え入れる日。天照大神が照らしています。",
  土: "安定と豊かさのエネルギーが満ちています。地道な積み重ねが実を結ぶ予感。稲荷大神の加護を感じてください。",
  金: "判断力と洞察力が鋭くなっています。迷っていることへの答えが見えてくる日。八幡大神の力を借りてください。",
  水: "直感が冴えています。心の声を大切にし、流れに身を任せることで道が開けます。弁財天の清らかな水があなたを導きます。",
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
    ? `今日のおみくじ：${fortune}！${fortuneData?.advice ?? ""} #神社おみくじ`
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

      {/* アドバイス */}
      <section className="rounded-xl border border-vermilion/20 bg-vermilion/5 p-5">
        <p className="text-[10px] tracking-[0.3em] text-vermilion-deep font-bold mb-2">今日のアドバイス</p>
        <p className="text-sm text-sumi/80 leading-relaxed">{fortuneData.advice}</p>
        <p className="text-xs text-sumi/55 mt-2">
          <span className="font-semibold">ラッキーアイテム：</span>{fortuneData.luckyItem}
        </p>
      </section>

      {/* 属性別メッセージ */}
      {element && (
        <section className="rounded-xl border border-border bg-washi/60 p-5">
          <p className="text-[10px] tracking-[0.25em] text-sumi/50 mb-2">
            {element}属性・守護神からのメッセージ
          </p>
          <p className="text-sm text-sumi/80 leading-relaxed">
            {ELEMENT_SUPPLEMENT[element]}
          </p>
        </section>
      )}

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
        <p className="font-serif text-lg mb-2">毎日のメッセージをLINEで受け取る</p>
        <p className="text-sm text-white/70 mb-4">
          あなたの属性に合わせた守護神からの言葉を、毎週お届けします。
        </p>
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
