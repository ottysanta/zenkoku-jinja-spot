import type { Metadata } from "next";
import DiagnoseClient from "./DiagnoseClient";

// ─── デフォルトメタデータ ─────────────────────────────────────────────────
const DEFAULT_META = {
  title: "守護神社診断 — 生年月と今の悩みから縁深い神社を見つける",
  description:
    "生まれ年・月から干支と五行属性を導き出し、仕事・恋愛・家族・自分自身の悩みに答えを持つ守護神社をご紹介。守護神からの具体的なメッセージと参拝ガイド付き。全国46,000社のデータから、あなただけの守護神社を。",
} as const;

// ─── 動的 OGP（URLに結果パラメータが含まれる場合） ────────────────────────
type SearchParams = Promise<{
  y?: string; m?: string; w?: string;
  t?: string; mod?: string; el?: string; em?: string;
}>;

export async function generateMetadata(
  { searchParams }: { searchParams: SearchParams }
): Promise<Metadata> {
  const p = await searchParams;

  // 結果パラメータが揃っている場合だけ動的 OGP を生成
  if (p.t && p.el) {
    const ogUrl = `/api/og/diagnose?type=${encodeURIComponent(p.t)}&mod=${encodeURIComponent(p.mod ?? "")}&el=${encodeURIComponent(p.el)}&em=${encodeURIComponent(p.em ?? "⛩")}&worry=${encodeURIComponent(p.w ?? "")}`;
    return {
      title: `「${p.t}」— 守護神社診断結果`,
      description: `${p.el}属性 ${p.mod ?? ""}。あなたの守護タイプは「${p.t}」。守護神社診断で自分に縁深い神社を見つけよう。`,
      openGraph: {
        title: `あなたの守護タイプ：「${p.t}」`,
        description: `${p.el}属性 ${p.mod ?? ""}`,
        type: "website",
        images: [{ url: ogUrl, width: 1200, height: 630, alt: `守護タイプ：${p.t}` }],
      },
      twitter: {
        card: "summary_large_image",
        title: `あなたの守護タイプ：「${p.t}」`,
        description: `${p.el}属性 ${p.mod ?? ""}`,
        images: [ogUrl],
      },
    };
  }

  return {
    ...DEFAULT_META,
    openGraph: {
      title: "守護神社診断 — あなたの守護タイプと縁深い神社を",
      description: "生年月と今の悩みから「守護タイプ名」「守護神のメッセージ」「参拝すべき神社3社」をお伝えします。",
      type: "website",
    },
  };
}

// ─── ページ ───────────────────────────────────────────────────────────────
export default async function DiagnosePage(
  { searchParams }: { searchParams: SearchParams }
) {
  const p = await searchParams;

  // URL に結果パラメータがあれば DiagnoseClient に渡して自動表示
  const initialParams = (p.y && p.m && p.w)
    ? { year: p.y, month: p.m, worry: p.w as "work" | "love" | "family" | "self" }
    : undefined;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      {/* 背景装飾 */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-vermilion/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-moss/5 blur-3xl" />
      </div>

      <DiagnoseClient initialParams={initialParams} />
    </main>
  );
}
