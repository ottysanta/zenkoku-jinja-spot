import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guide-content";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://zenkokujinjyaspot.com";

export const metadata: Metadata = {
  title: "神社ガイド — ライフパス・五行属性・干支別の参拝ガイド完全版",
  description: "数秘術ライフパスナンバー別・五行属性別・干支別の神社参拝ガイド。自分の数字・属性・生まれ年に合った縁深い神社の選び方を解説します。",
  openGraph: {
    title: "神社ガイド — ライフパス・五行属性・干支別",
    description: "あなたの数字・属性に合った神社の選び方を徹底解説",
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/guide`,
  },
};

const CATEGORY_LABEL: Record<string, string> = {
  lifepath: "ライフパス別",
  element: "五行属性別",
  zodiac: "干支別",
  special: "特集",
  worry: "悩み別",
};
const CATEGORY_COLOR: Record<string, string> = {
  lifepath: "bg-violet-100 text-violet-700",
  element: "bg-emerald-100 text-emerald-700",
  zodiac: "bg-amber-100 text-amber-700",
  special: "bg-rose-100 text-rose-700",
  worry: "bg-sky-100 text-sky-700",
};
const CATEGORY_ORDER = ["special", "lifepath", "element", "zodiac", "worry"] as const;

export default function GuidePage() {
  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof GUIDES>>(
    (acc, cat) => {
      acc[cat] = GUIDES.filter((g) => g.category === cat);
      return acc;
    },
    {}
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      {/* パンくず */}
      <nav className="mb-6 text-sm text-stone-400 flex items-center gap-1.5">
        <Link href="/" className="hover:text-stone-600">ホーム</Link>
        <span>/</span>
        <span className="text-stone-600">ガイド</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-stone-800 mb-3">
          神社参拝ガイド
        </h1>
        <p className="text-stone-600 leading-relaxed">
          生年月日から導き出されるライフパスナンバー・五行属性・干支によって、縁深い神社は異なります。
          自分の数字・属性を知り、最も縁深い神社への参拝でより深いご縁を結びましょう。
        </p>
        <div className="mt-4">
          <Link
            href="/diagnose"
            className="inline-block bg-vermilion text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-vermilion/90 transition-colors"
          >
            まず守護神社診断を受ける →
          </Link>
        </div>
      </header>

      {CATEGORY_ORDER.map((cat) => {
        const guides = grouped[cat];
        if (!guides || guides.length === 0) return null;
        return (
          <section key={cat} className="mb-12">
            <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[cat]}`}>
                {CATEGORY_LABEL[cat]}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/guide/${g.slug}`}
                  className="group p-4 rounded-xl border border-stone-200 hover:border-vermilion/40 hover:bg-vermilion/5 transition-colors"
                >
                  <p className="font-semibold text-stone-800 text-sm leading-snug group-hover:text-vermilion transition-colors mb-1">
                    {g.heading}
                  </p>
                  <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                    {g.metaDescription}
                  </p>
                  <p className="mt-2 text-xs text-stone-400">{g.updated}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* 診断 CTA */}
      <section className="mt-4 rounded-2xl bg-gradient-to-br from-vermilion/10 to-moss/10 border border-vermilion/20 p-6 text-center">
        <h3 className="text-lg font-bold text-stone-800 mb-2">自分のタイプが分からない方へ</h3>
        <p className="text-sm text-stone-600 mb-4">
          生年月日を入力するだけで、ライフパスナンバー・五行属性・干支から守護タイプと縁深い神社を診断します。
        </p>
        <Link
          href="/diagnose"
          className="inline-block bg-vermilion text-white font-bold px-8 py-3 rounded-full hover:bg-vermilion/90 transition-colors text-sm"
        >
          無料で守護神社診断を受ける
        </Link>
      </section>
    </main>
  );
}
