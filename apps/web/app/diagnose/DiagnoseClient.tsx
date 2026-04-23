"use client";

import { useState } from "react";
import Link from "next/link";
import type { DiagnoseResult } from "@/app/api/diagnose/route";

// ─── LINE登録URL（エルメのURL or LINE公式アカウントURL）───────────────────
// TODO: あなたのエルメ友だち追加URLに差し替えてください
const LINE_REGISTER_URL = "https://s.lmes.jp/landing-qr/2001537229-95RWxAqY?uLand=BQcXql";

// ─── 五行 SVGイラスト ─────────────────────────────────────────────────────
function ElementIllustration({ element }: { element: string }) {
  if (element === "木") return (
    <svg viewBox="0 0 120 140" className="w-24 h-24 mx-auto" aria-hidden="true">
      <g opacity="0.15" fill="#166534">
        <ellipse cx="60" cy="40" rx="38" ry="28" />
        <ellipse cx="60" cy="62" rx="30" ry="22" />
      </g>
      <ellipse cx="60" cy="38" rx="36" ry="26" fill="#16a34a" />
      <ellipse cx="60" cy="60" rx="28" ry="20" fill="#22c55e" />
      <ellipse cx="60" cy="80" rx="20" ry="15" fill="#4ade80" />
      <rect x="55" y="88" width="10" height="30" rx="3" fill="#92400e" />
      <rect x="50" y="110" width="20" height="4" rx="2" fill="#78350f" />
      {/* 竹の節 */}
      <line x1="55" y1="100" x2="65" y2="100" stroke="#b45309" strokeWidth="1.5" />
      <line x1="55" y1="108" x2="65" y2="108" stroke="#b45309" strokeWidth="1.5" />
      {/* 小枝 */}
      <line x1="60" y1="50" x2="40" y2="38" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
      <line x1="60" y1="50" x2="80" y2="38" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  if (element === "火") return (
    <svg viewBox="0 0 120 140" className="w-24 h-24 mx-auto" aria-hidden="true">
      {/* 外炎 */}
      <path d="M60 20 C40 40 25 60 30 85 C32 95 38 105 48 112 C44 98 50 88 60 82 C70 88 76 98 72 112 C82 105 88 95 90 85 C95 60 80 40 60 20Z" fill="#f97316" />
      {/* 中炎 */}
      <path d="M60 38 C48 52 40 68 44 85 C46 92 52 100 60 104 C68 100 74 92 76 85 C80 68 72 52 60 38Z" fill="#fb923c" />
      {/* 内炎 */}
      <path d="M60 55 C54 65 52 75 55 86 C57 92 60 96 60 96 C60 96 63 92 65 86 C68 75 66 65 60 55Z" fill="#fde68a" />
      {/* 台座 */}
      <ellipse cx="60" cy="116" rx="22" ry="6" fill="#92400e" opacity="0.4" />
      <rect x="48" y="112" width="24" height="6" rx="2" fill="#78350f" />
    </svg>
  );

  if (element === "土") return (
    <svg viewBox="0 0 120 140" className="w-24 h-24 mx-auto" aria-hidden="true">
      {/* 富士山シルエット */}
      <path d="M60 15 L18 100 L102 100Z" fill="#d97706" />
      <path d="M60 15 L38 60 L82 60Z" fill="#fef3c7" opacity="0.7" />
      {/* 雪線 */}
      <path d="M60 15 L46 48 Q60 52 74 48Z" fill="white" opacity="0.85" />
      {/* 山肌 */}
      <path d="M60 15 L18 100 L40 100 L60 55 L80 100 L102 100Z" fill="none" stroke="#b45309" strokeWidth="1" opacity="0.4"/>
      {/* 地面 */}
      <rect x="10" y="100" width="100" height="10" rx="2" fill="#92400e" opacity="0.5" />
      <ellipse cx="60" cy="100" rx="50" ry="5" fill="#d97706" opacity="0.3" />
      {/* 雲 */}
      <ellipse cx="25" cy="75" rx="10" ry="5" fill="white" opacity="0.5" />
      <ellipse cx="95" cy="68" rx="8" ry="4" fill="white" opacity="0.5" />
    </svg>
  );

  if (element === "金") return (
    <svg viewBox="0 0 120 140" className="w-24 h-24 mx-auto" aria-hidden="true">
      {/* 刀身 */}
      <path d="M60 12 L68 98 L60 108 L52 98Z" fill="#94a3b8" />
      <path d="M60 12 L64 70 L60 78 L56 70Z" fill="#e2e8f0" />
      {/* 刃文（波紋） */}
      <path d="M56 78 Q58 84 60 80 Q62 84 64 78" fill="none" stroke="#cbd5e1" strokeWidth="1" />
      <path d="M55 88 Q57 94 60 90 Q63 94 65 88" fill="none" stroke="#cbd5e1" strokeWidth="1" />
      {/* 鍔（つば） */}
      <ellipse cx="60" cy="108" rx="16" ry="6" fill="#b45309" />
      <ellipse cx="60" cy="107" rx="14" ry="5" fill="#d97706" />
      <ellipse cx="60" cy="106" rx="12" ry="4" fill="#fbbf24" />
      {/* 柄（つか） */}
      <rect x="53" y="112" width="14" height="18" rx="3" fill="#78350f" />
      <line x1="53" y1="115" x2="67" y2="115" stroke="#92400e" strokeWidth="1.5" />
      <line x1="53" y1="119" x2="67" y2="119" stroke="#92400e" strokeWidth="1.5" />
      <line x1="53" y1="123" x2="67" y2="123" stroke="#92400e" strokeWidth="1.5" />
      {/* 輝き */}
      <line x1="60" y1="12" x2="50" y2="22" stroke="#f8fafc" strokeWidth="1.5" opacity="0.7" />
      <line x1="60" y1="12" x2="70" y2="22" stroke="#f8fafc" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );

  // 水
  return (
    <svg viewBox="0 0 120 140" className="w-24 h-24 mx-auto" aria-hidden="true">
      {/* 波紋（外） */}
      <ellipse cx="60" cy="75" rx="46" ry="20" fill="none" stroke="#93c5fd" strokeWidth="1.5" opacity="0.5" />
      <ellipse cx="60" cy="75" rx="36" ry="15" fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.6" />
      <ellipse cx="60" cy="75" rx="26" ry="11" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.7" />
      {/* 水滴 */}
      <path d="M60 22 C54 35 44 50 44 62 C44 75 51 84 60 84 C69 84 76 75 76 62 C76 50 66 35 60 22Z" fill="#3b82f6" />
      <path d="M60 30 C56 40 52 52 52 62 C52 70 55 78 60 81 C62 78 66 72 67 65" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
      {/* 光沢 */}
      <ellipse cx="53" cy="48" rx="4" ry="7" fill="white" opacity="0.35" transform="rotate(-20 53 48)" />
      {/* 水面 */}
      <path d="M14 75 Q25 68 36 75 Q47 82 58 75 Q69 68 80 75 Q91 82 102 75 L106 82 Q95 89 84 82 Q73 75 62 82 Q51 89 40 82 Q29 75 18 82Z" fill="#bfdbfe" opacity="0.6" />
    </svg>
  );
}

// ─── 干支アニメーション ────────────────────────────────────────────────────
function ZodiacDisplay({ zodiac }: { zodiac: DiagnoseResult["zodiac"] }) {
  return (
    <div className="text-center">
      <div className="text-6xl mb-2 animate-bounce">{zodiac.emoji}</div>
      <div className="text-4xl font-serif text-sumi font-bold">{zodiac.kanji}</div>
      <div className="text-sm text-sumi/60 mt-1">
        {zodiac.reading}年生まれ・{zodiac.animal}
      </div>
    </div>
  );
}

// ─── メインコンポーネント ──────────────────────────────────────────────────
export default function DiagnoseClient() {
  const [year, setYear] = useState<string>("");
  const [step, setStep] = useState<"input" | "loading" | "result">("input");
  const [result, setResult] = useState<DiagnoseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  // 1900年〜今年まで（幅広い年代に対応）
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

  async function handleDiagnose() {
    if (!year) return;
    setStep("loading");
    setError(null);
    try {
      const res = await fetch(`/api/diagnose?year=${year}`);
      if (!res.ok) throw new Error("診断に失敗しました");
      const data: DiagnoseResult = await res.json();
      setResult(data);
      setStep("result");
    } catch {
      setError("診断中にエラーが発生しました。もう一度お試しください。");
      setStep("input");
    }
  }

  // ── 入力フォーム ──────────────────────────────────────────────────────────
  if (step === "input") {
    return (
      <div className="space-y-8">
        {/* タイトル */}
        <div className="text-center">
          <p className="text-[11px] tracking-[0.3em] text-vermilion-deep font-semibold mb-3">
            ⛩ SHRINE DIAGNOSIS
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-sumi mb-4">
            守護神社診断
          </h1>
          <p className="text-sumi/70 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            生まれ年から干支と五行属性を導き出し、<br className="hidden md:block" />
            あなたと縁の深い守護神社をお伝えします。
          </p>
        </div>

        {/* 5属性プレビュー */}
        <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto">
          {(["木", "火", "土", "金", "水"] as const).map((el) => (
            <div key={el} className="text-center">
              <div className="text-2xl font-serif text-sumi/40">{el}</div>
              <div className="text-[9px] text-sumi/30 mt-0.5">
                {{ 木: "もく", 火: "か", 土: "ど", 金: "こん", 水: "すい" }[el]}
              </div>
            </div>
          ))}
        </div>

        {/* 入力フォーム */}
        <div className="max-w-sm mx-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-sumi mb-2 text-center">
              生まれ年を選んでください
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-4 py-3 text-base text-sumi focus:border-vermilion focus:outline-none focus:ring-1 focus:ring-vermilion"
            >
              <option value="">── 年を選ぶ ──</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <button
            onClick={handleDiagnose}
            disabled={!year}
            className="w-full min-h-[52px] rounded-md bg-vermilion px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-vermilion-deep disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ⛩ 守護神社を診断する
          </button>

          <p className="text-[11px] text-sumi/50 text-center">
            生まれ年のみを使用します。個人情報は取得しません。
          </p>
        </div>

        {/* 人間関係の悩みへの共感コピー */}
        <div className="max-w-md mx-auto rounded-md border border-border bg-washi/60 p-5 text-sm text-sumi/80 leading-relaxed">
          <p className="font-semibold text-sumi mb-2">こんな悩みはありませんか？</p>
          <ul className="space-y-1.5 text-[13px]">
            <li>💼 職場の人間関係に疲れ、毎日が重く感じる</li>
            <li>👨‍👩‍👧 家族や夫婦の間に、なんとなく距離がある</li>
            <li>💑 恋愛がうまくいかず、同じパターンを繰り返す</li>
            <li>🤝 友人と表面的な付き合いしかできていない気がする</li>
            <li>🪞 自分に自信が持てず、いつも他人の目が気になる</li>
          </ul>
          <p className="mt-3 text-[12px] text-sumi/60">
            神社には、こうした「縁」の悩みに答えを持つ神様が宿っています。
            あなたの干支に縁深い神様からのメッセージをお届けします。
          </p>
        </div>
      </div>
    );
  }

  // ── ローディング ──────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] space-y-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-vermilion/20 border-t-vermilion animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">⛩</span>
        </div>
        <div className="text-center">
          <p className="font-serif text-lg text-sumi">神様に問い合わせています…</p>
          <p className="text-sm text-sumi/50 mt-1">あなたとの縁を確かめています</p>
        </div>
      </div>
    );
  }

  // ── 結果表示 ──────────────────────────────────────────────────────────────
  if (!result) return null;
  const { zodiac, stem, sexagenary, element, elementData, shrines } = result;
  const theme = elementData.theme;

  // シェア文言
  const shareText = `守護神社診断：私は「${sexagenary}」${element}属性。守護神は${elementData.guardian}。あなたの守護神社は？`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/diagnose` : "https://example.com/diagnose";
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  return (
    <div className="space-y-8">

      {/* ── セクション1: 干支（天干＋地支） ── */}
      <section className={`rounded-2xl border-2 ${theme.border} ${theme.bg} p-6 text-center`}>
        <p className="text-[11px] tracking-[0.25em] text-sumi/50 mb-4">あなたの干支（えと）</p>
        <ZodiacDisplay zodiac={zodiac} />
        <div className="mt-5 inline-flex items-baseline gap-1">
          <span className={`text-4xl font-serif font-bold ${theme.accent}`}>{sexagenary}</span>
        </div>
        <p className="mt-2 text-sm text-sumi/70">
          {result.year}年生まれ・<span className="font-semibold">{stem.kanji}{zodiac.kanji}</span>
          （{stem.reading}・{zodiac.reading}）
        </p>
        <p className="mt-1 text-xs text-sumi/55">
          天干「{stem.kanji}」{stem.yin ? "（陰）" : "（陽）"} × 地支「{zodiac.kanji}」
        </p>
      </section>

      {/* ── セクション2: 五行属性 ── */}
      <section className={`rounded-2xl border-2 ${theme.border} ${theme.bg} p-6`}>
        <p className="text-[11px] tracking-[0.25em] text-sumi/50 mb-4 text-center">あなたの属性</p>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <ElementIllustration element={element} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-baseline gap-2 justify-center md:justify-start mb-2">
              <span className={`text-5xl font-serif font-bold ${theme.accent}`}>{element}</span>
              <span className="text-lg text-sumi/60">（{elementData.reading}）</span>
            </div>
            <p className={`text-sm font-semibold ${theme.accent} mb-2`}>
              {elementData.keyword}
            </p>
            <p className="text-sm text-sumi/80 leading-relaxed">
              {elementData.description}
            </p>
            <p className="mt-2 text-xs text-sumi/60">
              守護神：{elementData.guardian}
            </p>
          </div>
        </div>
      </section>

      {/* ── セクション3: 人間関係メッセージ ── */}
      <section className="rounded-2xl border border-vermilion/20 bg-vermilion/5 p-6">
        <p className="text-[11px] tracking-[0.25em] text-vermilion-deep mb-3">
          ✦ 守護神からのメッセージ ─ 人間関係について
        </p>
        <p className="text-sm text-sumi/85 leading-relaxed mb-4">
          {elementData.relationshipMessage}
        </p>
        <div className="border-t border-vermilion/15 pt-4">
          <p className="text-xs text-sumi/60 italic leading-relaxed">
            「{elementData.deityGuideMessage}」
          </p>
          <p className="text-xs text-sumi/40 mt-1">─ {elementData.guardian}</p>
        </div>
      </section>

      {/* ── セクション4: おすすめ守護神社 ── */}
      {shrines.length > 0 && (
        <section>
          <p className="text-[11px] tracking-[0.25em] text-sumi/50 mb-4 text-center">
            あなたに縁深い守護神社
          </p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {shrines.map((shrine) => (
              <li key={shrine.id}>
                <Link
                  href={`/shrines/${shrine.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-washi shadow-sm transition hover:shadow-md"
                >
                  {shrine.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shrine.photo_url}
                      alt={shrine.name}
                      loading="lazy"
                      className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`h-32 w-full flex items-center justify-center ${theme.bg} text-4xl`}>
                      ⛩
                    </div>
                  )}
                  <div className="p-3 flex-1 flex flex-col gap-1">
                    <p className="font-semibold text-sm text-sumi line-clamp-1">{shrine.name}</p>
                    <p className="text-[11px] text-sumi/55">{shrine.prefecture ?? "—"}{shrine.shrine_type ? ` · ${shrine.shrine_type}` : ""}</p>
                    {shrine.description && (
                      <p className="text-[11px] text-sumi/70 line-clamp-2 mt-1">{shrine.description}</p>
                    )}
                    {shrine.benefits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-auto pt-2">
                        {shrine.benefits.map((b) => (
                          <span key={b} className="rounded-full border border-vermilion/30 bg-vermilion/8 px-1.5 py-0.5 text-[10px] text-vermilion-deep">
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── シェアボタン ── */}
      <section className="rounded-2xl border border-border bg-washi/60 p-5">
        <p className="text-[11px] tracking-[0.25em] text-sumi/50 mb-3 text-center">
          結果をシェアする
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={xShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-sumi active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Xでシェア
          </a>
          <a
            href={lineShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#05a648] active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINEで送る
          </a>
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-sumi shadow-sm transition hover:bg-washi"
          >
            📋 リンクをコピー
          </button>
        </div>
      </section>

      {/* ── セクション5: LINE登録CTA ── */}
      <section className="rounded-2xl bg-gradient-to-br from-sumi to-sumi/80 p-6 text-white text-center">
        <p className="text-[10px] tracking-[0.3em] text-white/50 mb-3">SPECIAL OFFER</p>
        <h2 className="font-serif text-xl mb-2">
          あなたの縁を、もっと深く知りませんか？
        </h2>
        <p className="text-sm text-white/80 leading-relaxed mb-2 max-w-sm mx-auto">
          LINE登録で、{element}属性・{zodiac.kanji}年生まれの方への
          <br />
          <span className="text-white font-semibold">「人間関係を整える7つの守護の知恵」</span>
          <br />
          を無料でお届けします。
        </p>
        <ul className="text-left text-[12px] text-white/70 max-w-xs mx-auto mb-5 space-y-1">
          <li>✦ 職場・家族・恋愛…縁を整える神道的な視点</li>
          <li>✦ あなたの属性に合った参拝の作法</li>
          <li>✦ 守護神様からの毎週のメッセージ</li>
        </ul>
        <a
          href={LINE_REGISTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#05a648] active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          LINEで無料登録する
        </a>
        <p className="text-[10px] text-white/40 mt-3">
          登録無料・いつでも解除できます
        </p>
      </section>

      {/* ── 深掘りリンク ── */}
      <div className="rounded-xl border border-border bg-washi/60 p-5 text-center">
        <p className="text-sm text-sumi/70 mb-3 leading-relaxed">
          縁と人間関係について、もっと深く知りたい方へ
        </p>
        <Link
          href="/musubu"
          className="inline-flex items-center gap-1.5 rounded-full border border-vermilion/40 bg-vermilion/8 px-5 py-2.5 text-sm font-semibold text-vermilion-deep transition hover:bg-vermilion/15"
        >
          神社が教えてくれた「縁の法則」を読む →
        </Link>
      </div>

      {/* ── もう一度診断 ── */}
      <div className="text-center">
        <button
          onClick={() => { setStep("input"); setResult(null); setYear(""); }}
          className="text-sm text-sumi/50 underline hover:text-sumi/80"
        >
          もう一度診断する
        </button>
      </div>
    </div>
  );
}
