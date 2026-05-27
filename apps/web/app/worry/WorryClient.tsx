"use client";

import { useState } from "react";
import Link from "next/link";
import type { WorryKey, WorryResult } from "@/app/api/worry/route";

const LINE_REGISTER_URL =
  "https://s.lmes.jp/landing-qr/2001537229-95RWxAqY?uLand=BQcXql";

const WORRY_KEYS: WorryKey[] = [
  "work",
  "love",
  "family",
  "health",
  "money",
  "study",
  "yakuyoke",
];

const WORRY_DISPLAY: Record<
  WorryKey,
  { label: string; sub: string; emoji: string; ringClass: string; bgClass: string }
> = {
  work: {
    label: "職場・仕事",
    sub: "人間関係・出世・転職",
    emoji: "💼",
    ringClass: "ring-slate-400",
    bgClass: "bg-slate-50",
  },
  love: {
    label: "恋愛・縁結び",
    sub: "出会い・別れ・結婚",
    emoji: "💑",
    ringClass: "ring-rose-400",
    bgClass: "bg-rose-50",
  },
  family: {
    label: "家族・家庭",
    sub: "夫婦・親子・子育て",
    emoji: "👨‍👩‍👧",
    ringClass: "ring-orange-400",
    bgClass: "bg-orange-50",
  },
  health: {
    label: "健康・心身",
    sub: "病気・不調・メンタル",
    emoji: "🌿",
    ringClass: "ring-emerald-400",
    bgClass: "bg-emerald-50",
  },
  money: {
    label: "金運・商売",
    sub: "収入・借金・独立",
    emoji: "💰",
    ringClass: "ring-amber-400",
    bgClass: "bg-amber-50",
  },
  study: {
    label: "学業・試験",
    sub: "受験・資格・集中力",
    emoji: "📚",
    ringClass: "ring-indigo-400",
    bgClass: "bg-indigo-50",
  },
  yakuyoke: {
    label: "厄除け・転機",
    sub: "厄年・方位・節目",
    emoji: "✨",
    ringClass: "ring-violet-400",
    bgClass: "bg-violet-50",
  },
};

export default function WorryClient() {
  const [result, setResult] = useState<WorryResult | null>(null);
  const [selected, setSelected] = useState<WorryKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(key: WorryKey) {
    setSelected(key);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/worry?worry=${key}`);
      if (!res.ok) throw new Error("failed");
      const data: WorryResult = await res.json();
      setResult(data);
    } catch {
      setError("神社の検索中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* タイトル */}
      <div className="text-center">
        <p className="text-[11px] tracking-[0.3em] text-vermilion-deep font-semibold mb-3">
          ⛩ WORRY NAVIGATOR
        </p>
        <h1 className="font-serif text-3xl md:text-4xl mb-4" style={{ color: "#fff7e6" }}>
          悩み別 神社診断
        </h1>
        <p className="text-sm md:text-base max-w-md mx-auto leading-relaxed" style={{ color: "rgba(220,202,168,0.75)" }}>
          いま、あなたの心にある悩みを選んでください。
          <br className="hidden md:block" />
          その悩みに寄り添う神様をお繋ぎします。
        </p>
      </div>

      {/* 悩みカテゴリ選択 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {WORRY_KEYS.map((key) => {
          const d = WORRY_DISPLAY[key];
          const isActive = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              disabled={loading}
              className={`group rounded-xl p-4 text-left transition shadow-sm hover:shadow-md disabled:opacity-50 ${
                isActive ? `${d.bgClass} border-transparent ring-2 ${d.ringClass} border` : ""
              }`}
              style={!isActive ? { background: "linear-gradient(145deg, #1e1108, #170d06)", border: "1px solid rgba(201,155,77,0.2)" } : {}}
            >
              <div className="text-3xl mb-2">{d.emoji}</div>
              <div className="font-semibold text-sm" style={isActive ? { color: "#1C1613" } : { color: "#fff7e6" }}>{d.label}</div>
              <div className="text-[11px] mt-0.5" style={isActive ? { color: "rgba(28,22,19,0.6)" } : { color: "rgba(220,202,168,0.6)" }}>{d.sub}</div>
            </button>
          );
        })}
      </div>

      {/* エラー */}
      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}

      {/* ローディング */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-vermilion/20 border-t-vermilion animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-xl">⛩</span>
          </div>
          <p className="font-serif" style={{ color: "rgba(220,202,168,0.75)" }}>神様を探しています…</p>
        </div>
      )}

      {/* 結果 */}
      {!loading && result && (
        <div className="space-y-6">
          {/* 神様からの深いメッセージ */}
          <section className="rounded-2xl p-6" style={{ border: "1px solid rgba(139,30,39,0.3)", background: "rgba(139,30,39,0.1)" }}>
            <p className="text-[11px] tracking-[0.25em] text-vermilion-deep font-bold mb-3">
              ✦ 神様からのメッセージ
            </p>
            <p className="font-serif text-base leading-loose mb-4" style={{ color: "rgba(240,226,198,0.92)" }}>
              {result.data.deityMessage ?? result.data.message}
            </p>
            <div className="border-t pt-3" style={{ borderColor: "rgba(139,30,39,0.2)" }}>
              <p className="text-[10px] tracking-[0.2em] text-vermilion-deep/70 mb-1.5">祈る言葉</p>
              <p className="text-sm italic" style={{ color: "rgba(220,202,168,0.82)" }}>
                「{result.data.praySentence ?? ""}」
              </p>
            </div>
          </section>

          {/* 参拝ガイド & タイミング */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <section className="rounded-xl p-4" style={{ border: "1px solid rgba(201,155,77,0.2)", background: "linear-gradient(145deg, #1e1108, #170d06)" }}>
              <p className="text-[10px] tracking-[0.2em] font-bold mb-2" style={{ color: "rgba(201,155,77,0.8)" }}>参拝の心がまえ</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(220,202,168,0.82)" }}>{result.data.prayerGuide ?? ""}</p>
            </section>
            <section className="rounded-xl p-4" style={{ border: "1px solid rgba(201,155,77,0.2)", background: "linear-gradient(145deg, #1e1108, #170d06)" }}>
              <p className="text-[10px] tracking-[0.2em] font-bold mb-2" style={{ color: "rgba(201,155,77,0.8)" }}>参拝に適した時期</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(220,202,168,0.82)" }}>{result.data.visitTime ?? ""}</p>
            </section>
          </div>

          {/* どんな神社を選ぶか */}
          <section className="rounded-xl p-4" style={{ border: "1px solid rgba(201,155,77,0.2)", background: "linear-gradient(145deg, #1e1108, #170d06)" }}>
            <p className="text-[10px] tracking-[0.2em] font-bold mb-2" style={{ color: "rgba(201,155,77,0.8)" }}>どんな神社を選ぶべきか</p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(220,202,168,0.82)" }}>{result.data.shrineTip ?? ""}</p>
          </section>

          {/* 神社リスト */}
          {result.shrines.length > 0 ? (
            <section>
              <p className="text-[11px] tracking-[0.25em] mb-4 text-center" style={{ color: "rgba(220,202,168,0.55)" }}>
                {result.data.label}に寄り添う神社
              </p>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {result.shrines.map((shrine) => (
                  <li key={shrine.id}>
                    <Link
                      href={`/shrines/${shrine.slug}`}
                      className="group flex flex-col overflow-hidden rounded-xl shadow-sm transition hover:shadow-md"
                      style={{ border: "1px solid rgba(201,155,77,0.2)", background: "linear-gradient(145deg, #1e1108, #170d06)" }}
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
                        <div className="h-32 w-full flex items-center justify-center bg-vermilion/5 text-4xl">
                          ⛩
                        </div>
                      )}
                      <div className="p-3 flex-1 flex flex-col gap-1">
                        <p className="font-semibold text-sm line-clamp-1" style={{ color: "#fff7e6" }}>
                          {shrine.name}
                        </p>
                        <p className="text-[11px]" style={{ color: "rgba(220,202,168,0.55)" }}>
                          {shrine.prefecture ?? "—"}
                          {shrine.shrine_type ? ` · ${shrine.shrine_type}` : ""}
                        </p>
                        {shrine.description && (
                          <p className="text-[11px] line-clamp-2 mt-1" style={{ color: "rgba(220,202,168,0.7)" }}>
                            {shrine.description}
                          </p>
                        )}
                        {shrine.benefits.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-auto pt-2">
                            {shrine.benefits.map((b) => (
                              <span
                                key={b}
                                className="rounded-full border border-vermilion/30 bg-vermilion/8 px-1.5 py-0.5 text-[10px] text-vermilion-deep"
                              >
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
          ) : (
            <p className="text-center text-sm" style={{ color: "rgba(220,202,168,0.6)" }}>
              該当する神社が見つかりませんでした。
            </p>
          )}

          {/* LINE CTA */}
          <section className="rounded-2xl bg-gradient-to-br from-sumi to-sumi/80 p-6 text-white text-center">
            <p className="text-[10px] tracking-[0.3em] text-white/50 mb-3">
              SPECIAL OFFER
            </p>
            <h2 className="font-serif text-xl mb-2">
              悩みを、もう一歩深く整えませんか？
            </h2>
            <p className="text-sm text-white/80 leading-relaxed mb-5 max-w-sm mx-auto">
              LINE登録で、あなたの悩みに寄り添う
              <br />
              <span className="text-white font-semibold">
                「神様からの7日間のメッセージ」
              </span>
              <br />
              を無料でお届けします。
            </p>
            <a
              href={LINE_REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#05a648] active:scale-95"
            >
              LINEで無料登録する
            </a>
          </section>

          {/* 守護神社診断への導線 */}
          <div className="rounded-xl p-5 text-center" style={{ border: "1px solid rgba(201,155,77,0.2)", background: "rgba(28,17,8,0.5)" }}>
            <p className="text-sm mb-3 leading-relaxed" style={{ color: "rgba(220,202,168,0.72)" }}>
              あなた本来の属性から、守護神社を探したい方へ
            </p>
            <Link
              href="/diagnose"
              className="inline-flex items-center gap-1.5 rounded-full border border-vermilion/40 bg-vermilion/8 px-5 py-2.5 text-sm font-semibold text-vermilion-deep transition hover:bg-vermilion/15"
            >
              ⛩ 守護神社診断を受ける →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
