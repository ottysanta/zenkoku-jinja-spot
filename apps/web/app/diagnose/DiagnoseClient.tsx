"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DiagnoseResult, WorryKey } from "@/app/api/diagnose/route";
import { trackDiagnosisComplete, trackShareClick, trackLineCta } from "@/lib/analytics";

const LINE_REGISTER_URL = "https://s.lmes.jp/landing-qr/2001537229-95RWxAqY?uLand=BQcXql";

// ─── 五行カラーマッピング ──────────────────────────────────────────────────
const ELEMENT_COLORS: Record<string, { from: string; to: string; text: string; light: string; border: string }> = {
  木: { from: "#16a34a", to: "#15803d", text: "#14532d", light: "#f0fdf4", border: "#86efac" },
  火: { from: "#ea580c", to: "#b91c1c", text: "#7c2d12", light: "#fff7ed", border: "#fdba74" },
  土: { from: "#d97706", to: "#b45309", text: "#78350f", light: "#fffbeb", border: "#fcd34d" },
  金: { from: "#475569", to: "#334155", text: "#1e293b", light: "#f8fafc", border: "#94a3b8" },
  水: { from: "#0284c7", to: "#0c4a6e", text: "#0c4a6e", light: "#f0f9ff", border: "#7dd3fc" },
};

// ─── 悩みカテゴリー ────────────────────────────────────────────────────────
const WORRY_OPTIONS: { key: WorryKey; label: string; sublabel: string; icon: string }[] = [
  { key: "work",   label: "仕事・職場",   sublabel: "人間関係・キャリア・職場環境",  icon: "💼" },
  { key: "love",   label: "恋愛・縁",     sublabel: "出会い・パートナーシップ",       icon: "💑" },
  { key: "family", label: "家族・夫婦",   sublabel: "家庭・夫婦・親子関係",           icon: "🏡" },
  { key: "self",   label: "自分自身",     sublabel: "自己信頼・将来・内面の悩み",     icon: "🪞" },
];

// ─── ステップ表示 ──────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  const steps = ["生年月日", "悩み", "結果"];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex flex-col items-center ${i + 1 <= step ? "opacity-100" : "opacity-30"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${i + 1 < step ? "bg-vermilion text-white" :
                i + 1 === step ? "bg-vermilion text-white ring-4 ring-vermilion/20" :
                "bg-sumi/10 text-sumi/50"}`}>
              {i + 1 < step ? "✓" : i + 1}
            </div>
            <span className={`text-[10px] mt-1 ${i + 1 === step ? "text-vermilion font-semibold" : "text-sumi/40"}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-px mb-4 ${i + 1 < step ? "bg-vermilion" : "bg-sumi/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

type InitialParams = { year: string; month: string; day: string; worry: WorryKey };

function getDaysInMonth(year: string, month: string): number {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

// ─── メイン ────────────────────────────────────────────────────────────────
export default function DiagnoseClient({ initialParams }: { initialParams?: InitialParams }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1924 + 1 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const [step, setStep]     = useState<"birth" | "worry" | "loading" | "result">("birth");
  const [year, setYear]     = useState<string>(initialParams?.year ?? "");
  const [month, setMonth]   = useState<string>(initialParams?.month ?? "");
  const [day, setDay]       = useState<string>(initialParams?.day ?? "");
  const [worry, setWorry]   = useState<WorryKey | null>(initialParams?.worry ?? null);
  const [result, setResult] = useState<DiagnoseResult | null>(null);
  const [error, setError]   = useState<string | null>(null);

  // URLに結果パラメータがあれば自動フェッチ
  useEffect(() => {
    if (initialParams?.year && initialParams?.month && initialParams?.day && initialParams?.worry) {
      void fetchResult(initialParams.year, initialParams.month, initialParams.day, initialParams.worry);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchResult(y: string, m: string, d: string, w: WorryKey) {
    setStep("loading");
    setError(null);
    try {
      const res = await fetch(`/api/diagnose?year=${y}&month=${m}&day=${d}&worry=${w}`);
      if (!res.ok) throw new Error();
      const data: DiagnoseResult = await res.json();
      setResult(data);
      setStep("result");
      trackDiagnosisComplete({ element: data.element, typeName: data.typeName, worry: w });
      // 属性・干支をlocalStorageに保存（おみくじ・相性診断で利用）
      localStorage.setItem("guardian_element", data.element);
      localStorage.setItem("guardian_zodiac",  data.zodiac.emoji);
      // URLを結果パラメータ付きで更新（シェア用）
      const params = new URLSearchParams({
        y, m, d, w,
        t: data.typeName,
        mod: data.typeModifier,
        el: data.element,
        em: data.zodiac.emoji,
        lp: String(data.lifePathNumber),
      });
      window.history.replaceState(null, "", `/diagnose?${params.toString()}`);
    } catch {
      setError("診断中にエラーが発生しました。もう一度お試しください。");
      setStep("worry");
    }
  }

  async function handleDiagnose(selectedWorry: WorryKey) {
    setWorry(selectedWorry);
    await fetchResult(year, month, day, selectedWorry);
  }

  function reset() {
    setStep("birth");
    setResult(null);
    setYear("");
    setMonth("");
    setDay("");
    setWorry(null);
    setError(null);
    window.history.replaceState(null, "", "/diagnose");
  }

  // ── STEP 1: 生年月 ────────────────────────────────────────────────────────
  if (step === "birth") {
    return (
      <div className="space-y-8">
        <StepIndicator step={1} />

        <div className="text-center">
          <p className="text-[11px] tracking-[0.3em] text-vermilion-deep font-semibold mb-3">
            ⛩ SHRINE DIAGNOSIS
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-sumi mb-4">守護神社診断</h1>
          <p className="text-sumi/65 text-sm max-w-sm mx-auto leading-relaxed">
            生まれ年・月から干支と五行属性を導き出し、
            今の悩みに答えを持つ守護神社をお伝えします。
          </p>
        </div>

        <div className="max-w-sm mx-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-sumi/60 mb-1.5 text-center tracking-wide">
              生まれた年
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-xl border-2 border-border bg-white px-4 py-3.5 text-base text-sumi focus:border-vermilion focus:outline-none transition"
            >
              <option value="">── 年を選ぶ ──</option>
              {years.map((y) => <option key={y} value={y}>{y}年（{currentYear - y}歳）</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-sumi/60 mb-1.5 text-center tracking-wide">
              生まれた月
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {months.map((m) => (
                <button
                  key={m}
                  onClick={() => { setMonth(String(m)); setDay(""); }}
                  className={`rounded-lg py-2.5 text-sm font-semibold transition
                    ${month === String(m)
                      ? "bg-vermilion text-white shadow"
                      : "bg-washi border border-border text-sumi/70 hover:border-vermilion/40"}`}
                >
                  {m}月
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-sumi/60 mb-1.5 text-center tracking-wide">
              生まれた日
            </label>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1).map((d) => (
                <button
                  key={d}
                  onClick={() => setDay(String(d))}
                  className={`rounded-lg py-2 text-sm font-semibold transition
                    ${day === String(d)
                      ? "bg-vermilion text-white shadow"
                      : "bg-washi border border-border text-sumi/70 hover:border-vermilion/40"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep("worry")}
            disabled={!year || !month || !day}
            className="w-full min-h-[52px] rounded-xl bg-vermilion px-6 py-3 text-base font-bold text-white shadow-lg transition hover:bg-vermilion-deep disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            次へ → 悩みを選ぶ
          </button>
          <p className="text-[11px] text-sumi/40 text-center">生年月のみ使用します。個人情報は取得しません。</p>
        </div>
      </div>
    );
  }

  // ── STEP 2: 悩み選択 ──────────────────────────────────────────────────────
  if (step === "worry") {
    return (
      <div className="space-y-8">
        <StepIndicator step={2} />

        <div className="text-center">
          <h2 className="font-serif text-2xl text-sumi mb-2">今一番の悩みは？</h2>
          <p className="text-sumi/60 text-sm">
            選んだテーマに合わせて、守護神からのメッセージが届きます
          </p>
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          {WORRY_OPTIONS.map(({ key, label, sublabel, icon }) => (
            <button
              key={key}
              onClick={() => handleDiagnose(key)}
              className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-washi p-5 text-center transition hover:border-vermilion/50 hover:bg-vermilion/5 hover:shadow-md active:scale-95"
            >
              <span className="text-3xl">{icon}</span>
              <span className="font-bold text-sumi text-sm">{label}</span>
              <span className="text-[11px] text-sumi/50 leading-tight">{sublabel}</span>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button onClick={() => setStep("birth")} className="text-sm text-sumi/40 underline hover:text-sumi/70">
            ← 生年月を変更する
          </button>
        </div>
      </div>
    );
  }

  // ── ローディング ───────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-vermilion/20 border-t-vermilion animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-3xl">⛩</span>
        </div>
        <div className="text-center">
          <p className="font-serif text-xl text-sumi">神様に問い合わせています…</p>
          <p className="text-sm text-sumi/50 mt-2">あなたとの縁を確かめています</p>
        </div>
        <div className="flex gap-1 mt-2">
          {["木","火","土","金","水"].map((el, i) => (
            <span key={el} className="text-lg opacity-60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>
              {el}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── 結果 ──────────────────────────────────────────────────────────────────
  if (!result) return null;
  const { zodiac, stem, sexagenary, element, elementData, typeName, typeModifier, worryLabel, shrines, lifePathNumber, numerologyData } = result;
  const elColor = ELEMENT_COLORS[element] ?? ELEMENT_COLORS["水"];

  const shareText = `守護神社診断：私は「${typeName}」${element}属性${zodiac.emoji} × ライフパス${lifePathNumber}「${numerologyData.name}」。守護神は${elementData.guardian}。あなたの守護タイプは？`;
  // URLには結果パラメータが入っているので、現在のURLをそのまま使う
  const shareUrl  = typeof window !== "undefined" ? window.location.href : "";
  const xShare    = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const lineShare = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  return (
    <div className="space-y-6">

      {/* ── ① タイプ名バナー ─────────────────────────────────────────────── */}
      <section
        className="rounded-2xl overflow-hidden shadow-lg"
        style={{ background: `linear-gradient(135deg, ${elColor.from}, ${elColor.to})` }}
      >
        <div className="p-6 text-white">
          <p className="text-[10px] tracking-[0.35em] text-white/60 mb-1">YOUR GUARDIAN TYPE</p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-1 leading-snug">{typeName}</h2>
          <p className="text-white/70 text-sm mb-4">{typeModifier}</p>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-5xl mb-1 drop-shadow">{zodiac.emoji}</div>
              <div className="text-white/70 text-xs">{zodiac.reading}年生まれ</div>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl font-serif font-bold">{sexagenary}</span>
                <span className="text-white/60 text-sm">（{stem.reading}・{zodiac.reading}）</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
                <span className="text-lg">{element}</span>
                <span className="text-white/80">（{elementData.reading}）属性</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 text-xs text-white/50 border-t border-white/10 flex items-center gap-1.5">
          <span>守護神：{elementData.guardian}</span>
          <span>·</span>
          <span>キーワード：{elementData.keyword}</span>
        </div>
      </section>

      {/* ── ② 本質・属性 ─────────────────────────────────────────────────── */}
      <section className="rounded-2xl border-2 p-5" style={{ borderColor: elColor.border, backgroundColor: elColor.light }}>
        <p className="text-[11px] tracking-[0.25em] text-sumi/50 mb-3">あなたの本質</p>
        <p className="text-sm text-sumi/85 leading-relaxed mb-4">{elementData.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/80 border border-green-200 p-4">
            <p className="text-[10px] font-bold tracking-wider text-green-700 mb-2">✦ あなたの強み</p>
            <p className="text-xs text-sumi/80 leading-relaxed">{elementData.strength}</p>
          </div>
          <div className="rounded-xl bg-white/80 border border-amber-200 p-4">
            <p className="text-[10px] font-bold tracking-wider text-amber-700 mb-2">△ 気をつけたい点</p>
            <p className="text-xs text-sumi/80 leading-relaxed">{elementData.weakness}</p>
          </div>
        </div>
      </section>

      {/* ── ③ 数秘ライフパス ─────────────────────────────────────────────── */}
      <section className="rounded-2xl border-2 border-sumi/15 bg-gradient-to-br from-sumi/5 to-sumi/2 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-sumi/10 flex items-center justify-center text-lg font-serif font-bold text-sumi shrink-0">
            {lifePathNumber}
          </div>
          <div>
            <p className="text-[10px] tracking-[0.3em] text-sumi/45 mb-0.5">
              {lifePathNumber === 11 || lifePathNumber === 22 || lifePathNumber === 33
                ? "✦ 数秘ライフパス — マスターナンバー"
                : "✦ 数秘ライフパス"}
            </p>
            <p className="font-serif text-lg font-bold text-sumi leading-tight">
              ライフパス{lifePathNumber}「{numerologyData.name}」
            </p>
            <p className="text-[11px] text-sumi/50 mt-0.5">{numerologyData.keyword}</p>
          </div>
        </div>

        <p className="text-sm text-sumi/80 leading-[1.9] mb-4">{numerologyData.essence}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-white/70 border border-sumi/10 p-3.5">
            <p className="text-[10px] font-bold tracking-wider text-emerald-700 mb-2">✦ 魂の才能</p>
            <p className="text-xs text-sumi/80 leading-relaxed">{numerologyData.talent}</p>
          </div>
          <div className="rounded-xl bg-white/70 border border-sumi/10 p-3.5">
            <p className="text-[10px] font-bold tracking-wider text-amber-700 mb-2">△ 向き合う課題</p>
            <p className="text-xs text-sumi/80 leading-relaxed">{numerologyData.shadow}</p>
          </div>
        </div>

        <div className="rounded-xl bg-white/60 border border-sumi/10 p-3.5">
          <p className="text-[10px] font-bold tracking-wider text-sumi/50 mb-1.5">あなたの人生テーマ</p>
          <p className="text-xs text-sumi/75 leading-relaxed italic">「{numerologyData.lifeTheme}」</p>
        </div>
      </section>

      {/* ── ④ 悩み別アドバイス ───────────────────────────────────────────── */}
      <section className="rounded-2xl overflow-hidden border border-vermilion/25">
        <div className="bg-vermilion/8 px-5 py-3 border-b border-vermilion/15">
          <p className="text-[10px] tracking-[0.3em] text-vermilion-deep font-bold">
            ✦ 守護神からのメッセージ
          </p>
          <p className="text-xs text-sumi/60 mt-0.5">悩み：{worryLabel}</p>
        </div>
        <div className="bg-white p-5">
          <p className="text-sm text-sumi/85 leading-[1.9]">{elementData.worryAdvice[result.worry]}</p>
          <div className="mt-4 pt-4 border-t border-sumi/8">
            <p className="text-xs text-sumi/55 italic leading-relaxed">
              「{elementData.deityGuideMessage}」
            </p>
            <p className="text-[11px] text-sumi/35 mt-1">─ {elementData.guardian}</p>
          </div>
        </div>
      </section>

      {/* ── ⑤ 参拝ガイド ─────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-washi/60 p-5">
        <p className="text-[11px] tracking-[0.25em] text-sumi/50 mb-3">あなたへの参拝ガイド</p>
        <p className="text-sm text-sumi/80 leading-relaxed">{elementData.monthlyGuide}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {elementData.benefits.map((b) => (
            <span key={b} className="rounded-full border border-vermilion/30 bg-vermilion/8 px-2.5 py-1 text-[11px] text-vermilion-deep font-medium">
              {b}
            </span>
          ))}
        </div>
      </section>

      {/* ── ⑥ 守護神社 ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-[11px] tracking-[0.25em] text-sumi/50">あなたに縁深い守護神社</p>
          <p className="text-[11px] text-sumi/40">{shrines.length}社</p>
        </div>

        {shrines.length === 0 ? (
          <div className="rounded-xl border border-border bg-washi/40 p-6 text-center text-sm text-sumi/50">
            現在データを準備中です。近日公開予定。
          </div>
        ) : (
          <ul className="space-y-3">
            {shrines.map((shrine, idx) => (
              <li key={shrine.id}>
                <Link
                  href={`/shrines/${shrine.slug}`}
                  className="group flex overflow-hidden rounded-xl border border-border bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* 写真 */}
                  <div className="relative w-24 sm:w-32 flex-shrink-0">
                    {shrine.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={shrine.photo_url}
                        alt={shrine.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center gap-1 text-3xl"
                        style={{ backgroundColor: elColor.light }}>
                        ⛩
                      </div>
                    )}
                    <div className="absolute top-2 left-2 rounded-full bg-black/50 w-5 h-5 flex items-center justify-center text-[10px] text-white font-bold">
                      {idx + 1}
                    </div>
                  </div>

                  {/* 情報 */}
                  <div className="flex-1 p-3 flex flex-col gap-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-bold text-sm text-sumi line-clamp-1">{shrine.name}</p>
                    </div>
                    <p className="text-[11px] text-sumi/50">
                      {shrine.prefecture ?? "—"}
                      {shrine.shrine_type ? ` · ${shrine.shrine_type}` : ""}
                    </p>
                    <div className="inline-flex items-center gap-1 rounded-full bg-vermilion/8 px-2 py-0.5 w-fit">
                      <span className="text-[10px] text-vermilion-deep font-semibold">{shrine.reasonLabel}</span>
                    </div>
                    {shrine.description && (
                      <p className="text-[11px] text-sumi/65 line-clamp-2 mt-0.5 leading-relaxed">{shrine.description}</p>
                    )}
                    {shrine.benefits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-auto pt-1">
                        {shrine.benefits.map((b) => (
                          <span key={b} className="rounded-full border border-sumi/15 bg-washi px-1.5 py-0.5 text-[10px] text-sumi/60">
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
        )}
      </section>

      {/* ── ⑦ 相性タイプ ─────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-washi/60 p-4 flex items-center gap-3">
        <span className="text-2xl">🔄</span>
        <div className="flex-1">
          <p className="text-xs font-semibold text-sumi/60 mb-0.5">相性の良い属性タイプ</p>
          <p className="text-sm font-bold text-sumi">{elementData.compatibleType}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-sumi/40">友達に試させてみよう</p>
          <Link href="/diagnose" className="text-[11px] text-vermilion-deep underline">
            診断を共有 →
          </Link>
        </div>
      </section>

      {/* ── ⑧ シェア ─────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-washi/60 p-5">
        <p className="text-xs font-bold text-sumi/60 mb-1 text-center tracking-wide">結果をシェアする</p>
        <p className="text-[11px] text-sumi/45 text-center mb-4">
          「私は{typeName}でした！あなたは？」
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href={xShare} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-sumi active:scale-95">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Xでシェア
          </a>
          <a href={lineShare} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#05a648] active:scale-95">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINEで送る
          </a>
          <button type="button"
            onClick={() => { navigator.clipboard?.writeText(`${shareText} ${shareUrl}`); trackShareClick("diagnosis"); }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-sumi shadow-sm transition hover:bg-washi active:scale-95">
            📋 コピー
          </button>
        </div>
      </section>

      {/* ── ⑨ LINE CTA ──────────────────────────────────────────────────── */}
      <section className="rounded-2xl overflow-hidden shadow-lg"
        style={{ background: `linear-gradient(135deg, #1c1917, #292524)` }}>
        <div className="p-6 text-white text-center">
          <p className="text-[10px] tracking-[0.35em] text-white/40 mb-3">SPECIAL OFFER</p>
          <h3 className="font-serif text-xl mb-2">
            {element}属性・{zodiac.kanji}年生まれの方へ
          </h3>
          <p className="text-sm text-white/75 leading-relaxed mb-2 max-w-xs mx-auto">
            LINE登録で
            <span className="text-white font-bold">「{elementData.keyword}を整える7つの知恵」</span>
            を無料でお届けします。
          </p>
          <ul className="text-left text-[12px] text-white/60 max-w-xs mx-auto mb-5 space-y-1.5">
            <li>✦ 職場・家族・恋愛の縁を整える神道的な視点</li>
            <li>✦ {element}属性に合った参拝の作法・タイミング</li>
            <li>✦ 守護神様からの毎週のメッセージ</li>
          </ul>
          <a href={LINE_REGISTER_URL} target="_blank" rel="noopener noreferrer"
            onClick={() => trackLineCta("diagnosis")}
            className="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#05a648] active:scale-95">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINEで無料登録する
          </a>
          <p className="text-[10px] text-white/30 mt-3">登録無料・いつでも解除できます</p>
        </div>
      </section>

      {/* ── ⑩ 関連コンテンツ ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-washi/60 p-5">
        <p className="text-xs font-semibold text-sumi/50 mb-3 text-center tracking-wide">次にやること</p>
        <div className="grid grid-cols-1 gap-2">
          <Link href="/omikuji"
            className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 transition hover:border-vermilion/30 hover:bg-vermilion/5">
            <span className="text-2xl">📜</span>
            <div>
              <p className="text-sm font-bold text-sumi">今日のおみくじ</p>
              <p className="text-[11px] text-sumi/50">{element}属性の今日のメッセージを受け取る</p>
            </div>
            <span className="ml-auto text-sumi/30 text-sm">→</span>
          </Link>
          <Link href="/diagnose/compat"
            className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 transition hover:border-vermilion/30 hover:bg-vermilion/5">
            <span className="text-2xl">🔄</span>
            <div>
              <p className="text-sm font-bold text-sumi">五行相性診断</p>
              <p className="text-[11px] text-sumi/50">気になる相手との縁の深さを読み解く</p>
            </div>
            <span className="ml-auto text-sumi/30 text-sm">→</span>
          </Link>
          <Link href="/musubu"
            className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 transition hover:border-vermilion/30 hover:bg-vermilion/5">
            <span className="text-2xl">📖</span>
            <div>
              <p className="text-sm font-bold text-sumi">縁の法則を読む</p>
              <p className="text-[11px] text-sumi/50">神社が教えてくれた「縁」の深い話</p>
            </div>
            <span className="ml-auto text-sumi/30 text-sm">→</span>
          </Link>
        </div>
      </div>

      <div className="text-center">
        <button onClick={reset} className="text-sm text-sumi/40 underline hover:text-sumi/70">
          もう一度診断する
        </button>
      </div>

    </div>
  );
}
