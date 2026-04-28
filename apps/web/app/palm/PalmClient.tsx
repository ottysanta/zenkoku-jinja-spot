"use client";

import { useRef, useState } from "react";
import Link from "next/link";

const FREE_LIMIT = 3;
const STORAGE_KEY = "palm_count";
const LINE_URL = "https://s.lmes.jp/landing-qr/2001537229-95RWxAqY?uLand=BQcXql";

type LineResult = {
  rating: string;
  summary: string;
  good: string;
  caution: string;
};

type Analysis = {
  is_valid: boolean;
  lines: {
    life: LineResult;
    head: LineResult;
    heart: LineResult;
    fate: LineResult;
  };
  overall: { headline: string; body: string };
  hints: string[];
  shrine_advice: string;
};

type Result = {
  analysis: Analysis;
  annotatedImageUrl: string | null;
};

const LINE_LABELS: Record<string, string> = {
  life: "生命線",
  head: "知能線",
  heart: "感情線",
  fate: "運命線",
};

const LINE_COLORS: Record<string, string> = {
  life: "bg-red-50 border-red-200",
  head: "bg-blue-50 border-blue-200",
  heart: "bg-amber-50 border-amber-200",
  fate: "bg-green-50 border-green-200",
};

const LINE_BADGE: Record<string, string> = {
  life: "bg-red-100 text-red-700",
  head: "bg-blue-100 text-blue-700",
  heart: "bg-amber-100 text-amber-700",
  fate: "bg-green-100 text-green-700",
};

const HINT_ICONS = ["📅", "📝", "🤝"];

function getRemainingCount(): number {
  if (typeof window === "undefined") return FREE_LIMIT;
  const used = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
  return Math.max(0, FREE_LIMIT - used);
}

function incrementCount(): void {
  const used = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
  localStorage.setItem(STORAGE_KEY, String(used + 1));
}

export default function PalmClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(getRemainingCount);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }

  async function handleSubmit() {
    if (!fileRef.current?.files?.[0]) return;
    if (remaining <= 0) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append("image", fileRef.current.files[0]);

      const res = await fetch("/api/palm", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
        return;
      }

      incrementCount();
      setRemaining(getRemainingCount());
      setResult(data);
    } catch {
      setError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  const isLimitReached = remaining <= 0 && !result;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
      {/* ヘッダー */}
      <div className="text-center">
        <p className="text-[10px] tracking-[0.3em] text-vermilion-deep font-bold mb-2">AI PALM READING</p>
        <h1 className="font-serif text-3xl text-sumi mb-2">手相鑑定</h1>
        <p className="text-sm text-sumi/65 leading-relaxed">
          手のひらの写真をアップロードするだけで、<br />
          AIが生命線・知能線・感情線・運命線を鑑定します。
        </p>
      </div>

      {/* 残り回数バッジ */}
      <div className="flex justify-center">
        {remaining > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-vermilion/30 bg-vermilion/8 px-4 py-1.5 text-sm font-semibold text-vermilion-deep">
            無料鑑定 残り <strong>{remaining}</strong> 回
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-stone-100 px-4 py-1.5 text-sm font-semibold text-stone-500">
            無料鑑定 0回（LINE登録で追加）
          </span>
        )}
      </div>

      {/* 上限到達 */}
      {isLimitReached && (
        <section className="rounded-2xl bg-gradient-to-br from-sumi to-sumi/80 p-6 text-white text-center">
          <p className="font-serif text-lg mb-2">無料鑑定の回数を使い切りました</p>
          <p className="text-sm text-white/70 mb-5 leading-relaxed">
            LINE登録で<strong className="text-white">3回分を追加プレゼント</strong>します。<br />
            守護神からのメッセージも毎週届きます。
          </p>
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-8 py-3 text-sm font-bold text-white shadow transition hover:bg-[#05a648] active:scale-95"
          >
            LINEで無料登録して続ける
          </a>
        </section>
      )}

      {/* スキャンアニメーション（鑑定中） */}
      {loading && (
        <>
          <style>{`
            @keyframes palmScan {
              0%   { top: 0%; }
              50%  { top: calc(100% - 3px); }
              100% { top: 0%; }
            }
            @keyframes palmPulse {
              0%, 100% { opacity: 0.15; }
              50%       { opacity: 0.35; }
            }
            .palm-scan-line { animation: palmScan 2s ease-in-out infinite; }
            .palm-overlay   { animation: palmPulse 2s ease-in-out infinite; }
          `}</style>
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-2xl border-2 border-vermilion/60 shadow-lg shadow-vermilion/10">
              {preview && (
                <img
                  src={preview}
                  alt="スキャン中"
                  className="max-h-[300px] w-full object-contain opacity-75"
                />
              )}
              {/* スキャンライン */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  className="palm-scan-line absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-vermilion to-transparent"
                  style={{ boxShadow: "0 0 12px 4px rgba(201,48,44,0.5)", top: 0 }}
                />
                <div className="palm-overlay absolute inset-0 bg-vermilion" />
              </div>
              {/* 四隅のブラケット */}
              <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-vermilion pointer-events-none" />
              <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-vermilion pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-vermilion pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-vermilion pointer-events-none" />
            </div>
            <div className="text-center space-y-2">
              <div className="flex justify-center gap-1.5 flex-wrap">
                {(["生命線", "知能線", "感情線", "運命線"] as const).map((line, i) => (
                  <span key={line} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    ["bg-red-100 text-red-600","bg-blue-100 text-blue-600","bg-amber-100 text-amber-600","bg-green-100 text-green-600"][i]
                  }`}>{line}</span>
                ))}
              </div>
              <p className="text-sm font-semibold text-sumi/70">AIが手相を解析しています…</p>
              <p className="text-xs text-sumi/45">20〜40秒かかります</p>
            </div>
          </div>
        </>
      )}

      {/* アップロードエリア */}
      {!isLimitReached && !loading && (
        <div className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-vermilion/30 bg-vermilion/4 transition hover:bg-vermilion/8"
          >
            {preview ? (
              <img
                src={preview}
                alt="プレビュー"
                className="max-h-[300px] w-full rounded-2xl object-contain p-2"
              />
            ) : (
              <>
                <p className="text-4xl mb-3">✋</p>
                <p className="text-sm font-semibold text-sumi/70">タップして手のひら写真を選ぶ</p>
                <p className="text-xs text-sumi/45 mt-1">JPG / PNG / HEIC 対応</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* 撮影ガイド */}
          <div className="rounded-xl border border-border bg-washi/60 p-4">
            <p className="text-xs font-bold text-sumi/60 mb-2">きれいに撮るコツ</p>
            <ul className="space-y-1 text-xs text-sumi/55">
              <li>• 手のひらを広げ、指を自然に伸ばす</li>
              <li>• 明るい場所（自然光が最適）で撮影する</li>
              <li>• 手全体がフレームに収まるように</li>
              <li>• ピントが合っていることを確認</li>
            </ul>
          </div>

          {preview && (
            <button
              onClick={handleSubmit}
              className="w-full rounded-full bg-vermilion py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-vermilion/90 active:scale-95"
            >
              この手相を鑑定する
            </button>
          )}

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 text-center">
              {error}
            </p>
          )}
        </div>
      )}

      {/* 結果表示 */}
      {result && (
        <div className="space-y-5">
          {/* 注釈入り手のひら画像（大きく表示） */}
          <div className="rounded-2xl overflow-hidden border border-border shadow-md">
            <img
              src={result.annotatedImageUrl ?? preview ?? ""}
              alt="手相鑑定結果"
              className="w-full"
            />
            <div className="bg-washi/80 px-4 py-2 flex gap-3 flex-wrap text-[11px] font-semibold">
              <span className="text-red-500">① 生命線</span>
              <span className="text-blue-500">② 知能線</span>
              <span className="text-amber-500">③ 感情線</span>
              <span className="text-green-600">④ 運命線</span>
              {result.analysis.hand && (
                <span className="ml-auto text-sumi/50">{result.analysis.hand}</span>
              )}
            </div>
          </div>

          {/* 各線の鑑定 */}
          <section className="rounded-2xl border border-border bg-white p-5 space-y-4">
            <p className="text-[10px] tracking-[0.3em] text-sumi/50 font-bold">主要な線の見方</p>
            {(["life", "head", "heart", "fate"] as const).map((key, i) => {
              const line = result.analysis.lines[key];
              return (
                <div key={key} className={`rounded-xl border p-4 ${LINE_COLORS[key]}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                        ["bg-red-400","bg-blue-400","bg-amber-400","bg-green-500"][i]
                      }`}>{i + 1}</span>
                      <span className="font-bold text-stone-800">{LINE_LABELS[key]}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${LINE_BADGE[key]}`}>
                      評価：{line.rating}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed mb-2">{line.summary}</p>
                  <div className="space-y-1">
                    <p className="text-[11px] text-stone-500"><span className="text-amber-500 mr-1">✦</span>良い点：{line.good}</p>
                    <p className="text-[11px] text-stone-500"><span className="text-stone-400 mr-1">▲</span>注意点：{line.caution}</p>
                  </div>
                </div>
              );
            })}
          </section>

          {/* 総合鑑定 */}
          <section className="rounded-2xl border border-vermilion/20 bg-gradient-to-br from-vermilion/8 to-washi p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✦</span>
              <p className="text-[10px] tracking-[0.2em] text-vermilion-deep font-bold">総合鑑定結果</p>
            </div>
            <h2 className="font-serif text-xl text-sumi mb-3 leading-snug">
              {result.analysis.overall.headline}
            </h2>
            <p className="text-sm text-sumi/70 leading-relaxed">
              {result.analysis.overall.body}
            </p>
          </section>

          {/* 開運ヒント */}
          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <span>🗝</span>
              <p className="text-[10px] tracking-[0.2em] text-sumi/50 font-bold">開運ヒント</p>
            </div>
            <ul className="space-y-2">
              {result.analysis.hints.map((hint, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-sumi/70">
                  <span className="text-base">{HINT_ICONS[i] ?? "✦"}</span>
                  {hint}
                </li>
              ))}
            </ul>
          </section>

          {/* 神社参拝アドバイス */}
          <section className="rounded-xl border border-moss/30 bg-moss/5 p-4">
            <p className="text-[10px] tracking-[0.2em] text-moss font-bold mb-2">⛩ 神社参拝アドバイス</p>
            <p className="text-sm text-sumi/70 leading-relaxed">{result.analysis.shrine_advice}</p>
            <div className="mt-3 text-center">
              <Link href="/diagnose" className="text-xs text-vermilion-deep underline">
                守護神社診断も受けてみる →
              </Link>
            </div>
          </section>

          {/* 残り回数 or LINE CTA */}
          {remaining > 0 ? (
            <div className="text-center">
              <button
                onClick={() => { setResult(null); setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="rounded-full border border-border bg-white px-6 py-2.5 text-sm font-semibold text-sumi transition hover:bg-washi"
              >
                別の手相を鑑定する（残り{remaining}回）
              </button>
            </div>
          ) : (
            <section className="rounded-2xl bg-gradient-to-br from-sumi to-sumi/80 p-6 text-white text-center">
              <p className="font-serif text-lg mb-2">無料鑑定を使い切りました</p>
              <p className="text-sm text-white/70 mb-5 leading-relaxed">
                LINE登録で<strong className="text-white">3回分を追加プレゼント</strong>。<br />
                守護神からのメッセージも毎週届きます。
              </p>
              <a
                href={LINE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-8 py-3 text-sm font-bold text-white shadow transition hover:bg-[#05a648] active:scale-95"
              >
                LINEで無料登録して続ける
              </a>
            </section>
          )}

          <p className="text-center text-[10px] text-sumi/35">
            ※手相は占いとしての見方であり、医学的・科学的な診断ではありません。
          </p>
        </div>
      )}
    </div>
  );
}
