import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuideBySlug } from "@/lib/guide-content";
import { searchSpots } from "@/lib/shrine-db";
import type { ShrineRow } from "@/lib/shrine-db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://zenkokujinjyaspot.com";

// ─── 静的パス生成 ─────────────────────────────────────────────────────────────
export async function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

// ─── メタデータ ───────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};

  return {
    title: guide.title,
    description: guide.metaDescription,
    keywords: guide.keywords,
    openGraph: {
      title: guide.title,
      description: guide.metaDescription,
      type: "article",
      publishedTime: guide.published,
      modifiedTime: guide.updated,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.metaDescription,
    },
    alternates: {
      canonical: `${SITE_URL}/guide/${slug}`,
    },
  };
}

// ─── 関連神社取得（サーバーサイド） ──────────────────────────────────────────
function fetchRelatedShrines(guide: ReturnType<typeof getGuideBySlug>): ShrineRow[] {
  if (!guide) return [];
  const seen = new Set<number>();
  const results: ShrineRow[] = [];

  for (const key of guide.shrineSearchKeys) {
    if (results.length >= 6) break;
    try {
      const { rows } = searchSpots({ ...key, limit: 3 });
      for (const r of rows) {
        if (!seen.has(r.id)) {
          seen.add(r.id);
          results.push(r);
        }
      }
    } catch {
      // DB 未接続（ビルド時など）は無視
    }
  }
  return results.slice(0, 6);
}

// ─── JSON-LD Schema ───────────────────────────────────────────────────────────
function buildSchema(guide: NonNullable<ReturnType<typeof getGuideBySlug>>) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${SITE_URL}/guide/${guide.slug}#article`,
        "headline": guide.title,
        "description": guide.metaDescription,
        "datePublished": guide.published,
        "dateModified": guide.updated,
        "inLanguage": "ja",
        "author": {
          "@type": "Organization",
          "name": "全国神社スポット",
          "url": SITE_URL,
        },
        "publisher": {
          "@type": "Organization",
          "name": "全国神社スポット",
          "url": SITE_URL,
        },
        "mainEntityOfPage": { "@id": `${SITE_URL}/guide/${guide.slug}` },
        "keywords": guide.keywords.join(", "),
      },
      {
        "@type": "FAQPage",
        "mainEntity": guide.faqs.map((f) => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "ホーム", "item": SITE_URL },
          { "@type": "ListItem", "position": 2, "name": "ガイド", "item": `${SITE_URL}/guide` },
          { "@type": "ListItem", "position": 3, "name": guide.title, "item": `${SITE_URL}/guide/${guide.slug}` },
        ],
      },
    ],
  };
}

// ─── カテゴリバッジ ───────────────────────────────────────────────────────────
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

// ─── ページ ───────────────────────────────────────────────────────────────────
export default async function GuidePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const shrines = fetchRelatedShrines(guide);
  const related = GUIDES.filter((g) => guide.relatedSlugs.includes(g.slug));

  const schema = buildSchema(guide);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* パンくず */}
      <nav className="mb-6 text-sm text-stone-400 flex items-center gap-1.5">
        <Link href="/" className="hover:text-stone-600">ホーム</Link>
        <span>/</span>
        <Link href="/guide" className="hover:text-stone-600">ガイド</Link>
        <span>/</span>
        <span className="text-stone-600">{guide.title.slice(0, 20)}…</span>
      </nav>

      {/* ヘッダー */}
      <header className="mb-8">
        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-3 ${CATEGORY_COLOR[guide.category] ?? "bg-stone-100 text-stone-600"}`}>
          {CATEGORY_LABEL[guide.category] ?? guide.category}
        </span>
        <h1 className="text-2xl md:text-3xl font-bold text-stone-800 leading-snug mb-4">
          {guide.heading}
        </h1>
        <p className="text-stone-600 leading-relaxed text-base">{guide.lead}</p>
        <p className="mt-3 text-xs text-stone-400">
          公開: {guide.published} / 更新: {guide.updated}
        </p>
      </header>

      {/* 本文セクション */}
      <article className="prose prose-stone max-w-none">
        {guide.sections.map((sec, i) => (
          <section key={i} className="mb-8">
            <h2 className="text-xl font-bold text-stone-800 mb-3 pb-2 border-b border-stone-200">
              {sec.heading}
            </h2>
            {sec.body.split("\n\n").map((para, j) => (
              <p key={j} className="text-stone-700 leading-relaxed mb-3">{para}</p>
            ))}
          </section>
        ))}
      </article>

      {/* 関連神社カード */}
      {shrines.length > 0 && (
        <section className="mt-10 mb-10">
          <h2 className="text-lg font-bold text-stone-800 mb-4">縁深い神社を探す</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shrines.map((s) => (
              <Link
                key={s.id}
                href={`/shrines/${s.slug ?? s.id}`}
                className="flex gap-3 items-center p-3 rounded-xl border border-stone-200 hover:border-vermilion/40 hover:bg-vermilion/5 transition-colors"
              >
                {s.photo_url ? (
                  <img
                    src={s.photo_url}
                    alt={s.name}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-stone-100 flex items-center justify-center text-2xl shrink-0">
                    ⛩
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-stone-800 text-sm truncate">{s.name}</p>
                  {s.address && (
                    <p className="text-xs text-stone-400 truncate">{s.prefecture ?? ""}{s.city ?? ""}</p>
                  )}
                  {s.benefits && (
                    <p className="text-xs text-moss mt-0.5 truncate">{s.benefits.split(/[,、]/)[0]}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-sm text-stone-400 text-center">
            <Link href={`/search?${guide.shrineSearchKeys[0]?.benefit ? `benefit=${encodeURIComponent(guide.shrineSearchKeys[0].benefit)}` : guide.shrineSearchKeys[0]?.deity ? `q=${encodeURIComponent(guide.shrineSearchKeys[0].deity)}` : ""}`} className="text-vermilion hover:underline">
              もっと神社を探す →
            </Link>
          </p>
        </section>
      )}

      {/* FAQ */}
      {guide.faqs.length > 0 && (
        <section className="mt-10 mb-10">
          <h2 className="text-lg font-bold text-stone-800 mb-4">よくある質問</h2>
          <div className="space-y-4">
            {guide.faqs.map((faq, i) => (
              <details key={i} className="border border-stone-200 rounded-xl overflow-hidden group">
                <summary className="cursor-pointer px-4 py-3 font-medium text-stone-700 list-none flex items-center justify-between hover:bg-stone-50">
                  <span>Q. {faq.q}</span>
                  <span className="text-stone-400 ml-2 shrink-0 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-4 py-3 text-stone-600 text-sm leading-relaxed border-t border-stone-100 bg-stone-50">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* 診断 CTA */}
      <section className="mt-10 mb-10 rounded-2xl bg-gradient-to-br from-vermilion/10 to-moss/10 border border-vermilion/20 p-6 text-center">
        <p className="text-sm text-stone-500 mb-1">あなただけの守護神社を知りたい方へ</p>
        <h3 className="text-xl font-bold text-stone-800 mb-3">{guide.ctaLabel}</h3>
        <p className="text-sm text-stone-600 mb-5">
          生年月日・悩みを入力するだけで、五行属性×ライフパスナンバーから縁深い神社を診断します。
        </p>
        <Link
          href="/diagnose"
          className="inline-block bg-vermilion text-white font-bold px-8 py-3 rounded-full hover:bg-vermilion/90 transition-colors text-sm shadow-md"
        >
          無料で守護神社診断を受ける
        </Link>
      </section>

      {/* LINE 誘導 */}
      <section className="mb-10 rounded-2xl bg-[#06C755]/10 border border-[#06C755]/30 p-5 text-center">
        <p className="text-sm font-medium text-stone-700 mb-1">毎月の参拝タイミングを LINE でお知らせ</p>
        <p className="text-xs text-stone-500 mb-4">吉日・属性別の縁起情報・特集記事を LINE で配信中</p>
        <a
          href="https://lin.ee/YOUR_LINE_ID"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#06C755] text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-[#06C755]/90 transition-colors"
        >
          LINE 公式アカウントを友だち追加
        </a>
      </section>

      {/* 関連記事 */}
      {related.length > 0 && (
        <section className="mt-4">
          <h2 className="text-lg font-bold text-stone-800 mb-4">関連ガイド</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {related.map((g) => (
              <Link
                key={g.slug}
                href={`/guide/${g.slug}`}
                className="p-4 rounded-xl border border-stone-200 hover:border-vermilion/40 hover:bg-vermilion/5 transition-colors"
              >
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${CATEGORY_COLOR[g.category] ?? ""}`}>
                  {CATEGORY_LABEL[g.category]}
                </span>
                <p className="mt-1.5 font-medium text-stone-800 text-sm leading-snug">{g.heading}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
