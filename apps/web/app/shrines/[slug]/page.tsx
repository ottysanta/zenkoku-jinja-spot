/**
 * 神社詳細ページ（Comfy 物件詳細を参考に刷新）。
 *
 * 情報ヒエラルキー:
 *   1. フルワイドのヒーロー写真 + 神社名オーバーレイ
 *   2. ご利益 / 社格 / 創建 / 祭神 ピル (1 行スペック)
 *   3. 概要 (Wikipedia 抜粋)
 *   4. サイドバー: 住所・アクセス・公式サイト・御朱印などのクイック情報
 *   5. CTA バー: 地図で開く・奉納・ブックマーク
 *   6. 本文: 歴史 / 詳細
 *   7. 奉納・レビュー (FastAPI 接続機能)
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { spotSlug, type Spot } from "@/lib/api";
import ReviewList from "@/components/reviews/ReviewList";
import OfferingSection from "@/components/offerings/OfferingSection";
import DataProvenance from "@/components/shrines/DataProvenance";
import BookmarkButtons from "@/components/shrines/BookmarkButtons";
import TrackRecentVisit from "@/components/shrines/TrackRecentVisit";
import ShrineHero from "@/components/shrines/ShrineHero";
import ReactionButtons from "@/components/checkins/ReactionButtons";
import {
  getSpotBySlug,
  nearbySpots,
  spotsBySameDeity,
  recentCheckins,
} from "@/lib/shrine-db";

export const dynamic = "force-dynamic";

type RouteParams = { slug: string };

function fetchShrine(slug: string): Spot | null {
  // Next.js Route Handler ではなく直接 SQLite を読む（FastAPI 依存を外す）
  const row = getSpotBySlug(slug);
  if (!row) return null;
  return row as unknown as Spot;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shrine = fetchShrine(slug);
  if (!shrine) {
    return { title: "神社が見つかりません", robots: { index: false } };
  }
  const title = `${shrine.name}${shrine.prefecture ? `（${shrine.prefecture}）` : ""}`;
  const description = buildDescription(shrine);
  const canonical = `/shrines/${spotSlug(shrine)}`;
  const ogImage = shrine.photo_url || undefined;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: "全国神社スポット",
      locale: "ja_JP",
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

function buildDescription(shrine: Spot): string {
  if (shrine.description) return shrine.description.slice(0, 160);
  const parts: string[] = [];
  if (shrine.shrine_type) parts.push(shrine.shrine_type);
  if (shrine.shrine_rank) parts.push(shrine.shrine_rank);
  if (shrine.deity) parts.push(`祭神: ${shrine.deity}`);
  if (shrine.address) parts.push(shrine.address);
  return parts.join(" / ").slice(0, 160);
}

function parseBenefits(json?: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function parseHighlights(json?: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function placeJsonLd(shrine: Spot): string {
  const obj: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "PlaceOfWorship",
    name: shrine.name,
    geo: {
      "@type": "GeoCoordinates",
      latitude: shrine.lat,
      longitude: shrine.lng,
    },
  };
  if (shrine.address) {
    obj.address = {
      "@type": "PostalAddress",
      streetAddress: shrine.address,
      addressRegion: shrine.prefecture ?? undefined,
      addressCountry: "JP",
    };
  }
  if (shrine.website) obj.url = shrine.website;
  if (shrine.photo_url) obj.image = shrine.photo_url;
  if (shrine.description) obj.description = shrine.description;
  const keywords: string[] = [];
  if (shrine.shrine_type) keywords.push(shrine.shrine_type);
  if (shrine.shrine_rank) keywords.push(shrine.shrine_rank);
  const benefits = parseBenefits(shrine.benefits);
  keywords.push(...benefits);
  if (keywords.length) obj.keywords = keywords.join(",");
  return JSON.stringify(obj);
}

export default async function ShrineDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const shrine = fetchShrine(slug);
  if (!shrine) notFound();

  const benefits = parseBenefits(shrine.benefits);
  const highlights = parseHighlights(shrine.highlights);
  const specs: Array<{ label: string; value: string }> = [];
  if (shrine.shrine_type) specs.push({ label: "区分", value: shrine.shrine_type });
  if (shrine.shrine_rank) specs.push({ label: "社格", value: shrine.shrine_rank });
  if (shrine.founded) specs.push({ label: "創建", value: shrine.founded });
  if (shrine.prefecture) {
    specs.push({
      label: "所在",
      value: [shrine.prefecture, shrine.city].filter(Boolean).join(" "),
    });
  }

  // 関連神社の情報: 同祭神 + 近く
  const sameDeity = shrine.deity
    ? (spotsBySameDeity(shrine.deity, shrine.id, 4) as unknown as Spot[])
    : [];
  const nearby = nearbySpots(shrine.lat, shrine.lng, 6, shrine.id) as unknown as Array<
    Spot & { distance_m: number }
  >;
  // 神社単位の最近のチェックインコメント（表示用）
  const allRecent = recentCheckins(30);
  const thisCheckins = allRecent.filter((c) => c.spot_id === shrine.id).slice(0, 3);

  // FAQ 構造化データ（LLMO / SEO）
  const faqEntries: Array<{ q: string; a: string }> = [];
  if (shrine.shrine_type || shrine.shrine_rank || shrine.prefecture) {
    faqEntries.push({
      q: `${shrine.name}はどのような神社ですか？`,
      a: `${shrine.name}は${[shrine.prefecture, shrine.shrine_type, shrine.shrine_rank]
        .filter(Boolean)
        .join(" / ")} に分類される神社です${
        shrine.description ? `。${shrine.description.slice(0, 140)}` : "。"
      }`,
    });
  }
  if (shrine.deity) {
    faqEntries.push({
      q: `${shrine.name}の御祭神はどなたですか？`,
      a: `${shrine.name}の御祭神は「${shrine.deity}」です。`,
    });
  }
  if (benefits.length > 0) {
    faqEntries.push({
      q: `${shrine.name}のご利益は何ですか？`,
      a: `主なご利益は ${benefits.join("、")} とされます。参拝時はご利益の内容を心に留めて祈願されることをおすすめします。`,
    });
  }
  if (shrine.goshuin_available != null) {
    faqEntries.push({
      q: "御朱印は授与されていますか？",
      a: shrine.goshuin_available
        ? `授与されています${shrine.goshuin_info ? `。${shrine.goshuin_info}` : "。訪問前に時間帯を神社公式情報で確認するのが安全です。"}`
        : "当サイトの記録では授与情報は確認できていません。参拝予定の場合は神社公式窓口で最新情報をご確認ください。",
    });
  }
  if (shrine.access_info) {
    faqEntries.push({
      q: "アクセス方法は？",
      a: shrine.access_info,
    });
  }
  faqEntries.push({
    q: `${shrine.name}で志納（奉納）はできますか？`,
    a: "当サイトから直接志納が受けられるのは、宗教法人登録と受付同意が確認できた神社のみです。受付可否は本ページの「気持ちを届ける」ボタンの有無でご確認ください。受付対象外の場合、公式サイトから直接参拝・奉納をお願いします。",
  });

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqEntries.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: placeJsonLd(shrine) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* 閲覧履歴を LocalStorage に記録（マイページで確認できる） */}
      <TrackRecentVisit
        spot={{
          id: shrine.id,
          name: shrine.name,
          slug: shrine.slug ?? null,
          prefecture: shrine.prefecture ?? null,
          shrine_type: shrine.shrine_type ?? null,
          photo_url: shrine.photo_url ?? null,
        }}
      />

      {/* ヒーロー: Wikipedia → Commons → SVG placeholder の多段フォールバック */}
      <ShrineHero
        name={shrine.name}
        lat={shrine.lat}
        lng={shrine.lng}
        prefecture={shrine.prefecture ?? null}
        shrineType={shrine.shrine_type ?? null}
        address={shrine.address ?? null}
        photoUrl={shrine.photo_url ?? null}
        photoAttribution={shrine.photo_attribution ?? null}
      />

      <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
        {/* スペックピル (Comfy 風の 1 行) */}
        {(specs.length > 0 || benefits.length > 0) ? (
          <section className="mb-5 flex flex-wrap items-center gap-1.5 text-[12px]">
            {specs.map((s) => (
              <span
                key={s.label + s.value}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-washi px-2.5 py-0.5"
              >
                <span className="text-sumi/55">{s.label}</span>
                <span className="font-semibold text-sumi">{s.value}</span>
              </span>
            ))}
            {benefits.slice(0, 8).map((b) => (
              <Link
                key={b}
                href={`/search?benefit=${encodeURIComponent(b)}`}
                className="inline-flex items-center rounded-full border border-vermilion/40 bg-vermilion/10 px-2.5 py-0.5 text-vermilion-deep hover:bg-vermilion/20"
              >
                {b}
              </Link>
            ))}
          </section>
        ) : null}

        {/* 受付対応バッジ */}
        <section className="mb-4">
          {shrine.accepts_offerings ? (
            <div className="flex flex-wrap items-start gap-3 rounded-md border border-moss/40 bg-moss/5 p-3 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-moss px-2.5 py-1 text-[11px] font-semibold text-white">
                ✓ オンライン志納 受付中
              </span>
              <span className="flex-1 text-sumi/80">
                当サイト経由で{shrine.name}への志納（奉納）を受け付けています。遠方からでも感謝や決意を届けられます。
                <Link href="/offerings" className="ml-1 text-moss underline">
                  仕組みを見る
                </Link>
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-start gap-3 rounded-md border border-border bg-kinari/40 p-3 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-sumi/60 px-2.5 py-1 text-[11px] font-semibold text-white">
                — オンライン志納 未対応
              </span>
              <span className="flex-1 text-sumi/80">
                {shrine.name}は現在オンラインでの志納受付に対応していません。直接参拝または
                {shrine.website ? (
                  <>
                    <a href={shrine.website} target="_blank" rel="noopener noreferrer" className="ml-1 text-moss underline">公式サイト</a>
                    からのご案内にしたがってください。
                  </>
                ) : (
                  "現地でのご案内に従ってください。"
                )}
                <Link href="/offerings" className="ml-1 text-moss underline">
                  対応条件を見る
                </Link>
              </span>
            </div>
          )}
        </section>

        {/* CTA バー (Comfy 問い合わせ風) */}
        <section className="mb-6 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="rounded-md border border-border bg-white px-3 py-2 text-xs text-sumi/80">
            <p>
              このページでは{shrine.name}の基本情報を公開しています。参拝予定の方は、
              地図で現在地から見る・奉納する・レビューを読むなどが可能です。
            </p>
          </div>
          <Link
            href={`/map?spot=${shrine.id}`}
            className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-border bg-washi px-3 text-xs font-medium text-sumi hover:bg-kinari"
          >
            🗺 地図で開く
          </Link>
          {shrine.website ? (
            <a
              href={shrine.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-border bg-washi px-3 text-xs font-medium text-sumi hover:bg-kinari"
            >
              🔗 公式サイト
            </a>
          ) : null}
          {shrine.accepts_offerings ? (
            <Link
              href="#offering"
              className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-vermilion bg-vermilion px-3 text-xs font-semibold text-white hover:bg-vermilion-deep"
            >
              🙏 志納を申し込む
            </Link>
          ) : (
            <span
              className="inline-flex min-h-[40px] cursor-not-allowed items-center justify-center rounded-md border border-border bg-kinari px-3 text-xs font-medium text-sumi/50"
              title="現在、オンライン志納未対応"
            >
              🙏 志納未対応
            </span>
          )}
        </section>

        {/* 本文 + サイドバー */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_280px]">
          <div className="min-w-0">
            {/* 概要 */}
            {shrine.description ? (
              <section className="mb-6 rounded-md border border-border bg-washi/70 p-4">
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-vermilion-deep">
                  概要
                </h2>
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-sumi/90">
                  {shrine.description}
                </p>
                {shrine.wikipedia_url ? (
                  <p className="mt-2 text-[11px] text-sumi/60">
                    出典:{" "}
                    <a
                      href={shrine.wikipedia_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-moss underline"
                    >
                      Wikipedia
                    </a>
                  </p>
                ) : null}
              </section>
            ) : null}

            {/* 歴史 */}
            {shrine.history ? (
              <section className="mb-6 rounded-md border border-border bg-white p-4">
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-vermilion-deep">
                  歴史
                </h2>
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-sumi/90">
                  {shrine.history}
                </p>
              </section>
            ) : null}

            {/* 見どころ */}
            {highlights.length > 0 ? (
              <section className="mb-6 rounded-md border border-border bg-white p-4">
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-vermilion-deep">
                  見どころ
                </h2>
                <ul className="list-disc space-y-1 pl-5 text-[14px] text-sumi/90">
                  {highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* 祭神 */}
            {shrine.deity ? (
              <section className="mb-6 rounded-md border border-border bg-white p-4">
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-vermilion-deep">
                  御祭神
                </h2>
                <p className="whitespace-pre-wrap text-[14px] text-sumi/90">
                  {shrine.deity}
                </p>
              </section>
            ) : null}

            {/* 最近の参拝コメント（SQLite 直読） */}
            {thisCheckins.length > 0 ? (
              <section className="mb-6 rounded-md border border-border bg-white p-4">
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-vermilion-deep">
                  参拝者の声
                </h2>
                <ul className="space-y-2">
                  {thisCheckins.map((c) => (
                    <li key={c.id} className="rounded-md bg-washi/80 p-3 text-[13px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sumi">
                          {c.nickname || "匿名さん"}
                        </span>
                        <span className="text-[10px] text-sumi/50">
                          {new Date(c.created_at).toLocaleDateString("ja-JP")}
                        </span>
                      </div>
                      {c.wish_type ? (
                        <span className="mt-1 inline-block rounded-full border border-vermilion/40 bg-vermilion/10 px-2 py-0.5 text-[10px] text-vermilion-deep">
                          {(
                            {
                              gratitude: "感謝",
                              vow: "決意",
                              milestone: "節目",
                              thanks: "お礼",
                              other: "その他",
                            } as Record<string, string>
                          )[c.wish_type] || c.wish_type}
                        </span>
                      ) : null}
                      {c.comment ? (
                        <p className="mt-1 text-sumi/80">「{c.comment}」</p>
                      ) : null}
                      <div className="mt-2">
                        <ReactionButtons checkinId={c.id} compact />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* 同じ祭神を祀る神社 */}
            {sameDeity.length > 0 ? (
              <section className="mb-6">
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-vermilion-deep">
                  同じ御祭神を祀る神社
                </h2>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {sameDeity.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/shrines/${spotSlug(s)}`}
                        className="block overflow-hidden rounded-md border border-border bg-washi transition hover:shadow"
                      >
                        {s.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.photo_url}
                            alt={s.name}
                            loading="lazy"
                            className="h-20 w-full object-cover"
                          />
                        ) : null}
                        <div className="p-2">
                          <p className="line-clamp-1 text-[12px] font-semibold text-sumi">
                            {s.name}
                          </p>
                          <p className="line-clamp-1 text-[10px] text-sumi/60">
                            {s.prefecture ?? "—"}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* 近くの神社 */}
            {nearby.length > 0 ? (
              <section className="mb-6">
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-vermilion-deep">
                  近くの神社（30km 以内）
                </h2>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {nearby.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/shrines/${spotSlug(s)}`}
                        className="group flex items-center gap-2 rounded-md border border-border bg-washi p-2 text-[12px] transition hover:bg-kinari"
                      >
                        {s.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.photo_url}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded bg-kinari text-xs text-sumi/60">
                            ⛩
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 font-medium text-sumi">{s.name}</p>
                          <p className="text-[10px] text-sumi/60">
                            {s.prefecture ?? "—"} ·{" "}
                            {(s.distance_m / 1000).toFixed(
                              s.distance_m < 1000 ? 2 : 1,
                            )}{" "}
                            km
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* FAQ（LLMO / SEO 向け。構造化データは head に仕込み済み） */}
            {faqEntries.length > 0 ? (
              <section className="mb-6 rounded-md border border-border bg-white p-4">
                <h2 className="mb-3 text-xs font-semibold tracking-wide text-vermilion-deep">
                  よくある質問
                </h2>
                <dl className="space-y-3">
                  {faqEntries.map((f) => (
                    <div key={f.q}>
                      <dt className="text-[13px] font-semibold text-sumi">
                        Q. {f.q}
                      </dt>
                      <dd className="mt-1 text-[13px] leading-relaxed text-sumi/80">
                        A. {f.a}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {/* データ出所 */}
            <DataProvenance shrine={shrine} />
          </div>

          {/* サイドバー */}
          <aside className="min-w-0">
            <div className="sticky top-4 space-y-3">
              <section className="rounded-md border border-border bg-white p-3 text-[13px]">
                <h2 className="mb-2 border-b border-border pb-1 text-[11px] font-semibold text-sumi/70">
                  基本情報
                </h2>
                <dl className="space-y-1.5">
                  {shrine.prefecture || shrine.city ? (
                    <div className="flex gap-2">
                      <dt className="w-14 shrink-0 text-sumi/55">所在地</dt>
                      <dd className="flex flex-wrap gap-1 text-sumi/90">
                        {shrine.prefecture ? (
                          <Link
                            href={`/search?prefecture=${encodeURIComponent(shrine.prefecture)}`}
                            className="hover:underline"
                          >
                            {shrine.prefecture}
                          </Link>
                        ) : null}
                        {shrine.city ? (
                          <Link
                            href={`/search?prefecture=${encodeURIComponent(shrine.prefecture ?? "")}&city=${encodeURIComponent(shrine.city)}`}
                            className="text-vermilion-deep hover:underline"
                          >
                            {shrine.city}
                          </Link>
                        ) : null}
                      </dd>
                    </div>
                  ) : null}
                  {shrine.address ? (
                    <div className="flex gap-2">
                      <dt className="w-14 shrink-0 text-sumi/55">住所</dt>
                      <dd className="break-all text-sumi/90">{shrine.address}</dd>
                    </div>
                  ) : null}
                  {shrine.access_info ? (
                    <div className="flex gap-2">
                      <dt className="w-14 shrink-0 text-sumi/55">アクセス</dt>
                      <dd className="whitespace-pre-wrap text-sumi/90">
                        {shrine.access_info}
                      </dd>
                    </div>
                  ) : null}
                  {shrine.founded ? (
                    <div className="flex gap-2">
                      <dt className="w-14 shrink-0 text-sumi/55">創建</dt>
                      <dd className="text-sumi/90">{shrine.founded}</dd>
                    </div>
                  ) : null}
                  {shrine.shrine_rank ? (
                    <div className="flex gap-2">
                      <dt className="w-14 shrink-0 text-sumi/55">社格</dt>
                      <dd className="text-sumi/90">{shrine.shrine_rank}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              {/* 御朱印 */}
              {(shrine.goshuin_available != null || shrine.goshuin_info) ? (
                <section className="rounded-md border border-border bg-white p-3 text-[13px]">
                  <h2 className="mb-1.5 border-b border-border pb-1 text-[11px] font-semibold text-sumi/70">
                    御朱印
                  </h2>
                  <p className="text-sumi/90">
                    {shrine.goshuin_available === true
                      ? "授与あり"
                      : shrine.goshuin_available === false
                        ? "授与情報なし"
                        : "—"}
                  </p>
                  {shrine.goshuin_info ? (
                    <p className="mt-1 text-[12px] text-sumi/70">
                      {shrine.goshuin_info}
                    </p>
                  ) : null}
                </section>
              ) : null}

              {/* 授与品 */}
              {shrine.juyohin_info ? (
                <section className="rounded-md border border-border bg-white p-3 text-[13px]">
                  <h2 className="mb-1.5 border-b border-border pb-1 text-[11px] font-semibold text-sumi/70">
                    授与品
                  </h2>
                  <p className="whitespace-pre-wrap text-sumi/90">
                    {shrine.juyohin_info}
                  </p>
                </section>
              ) : null}

              <BookmarkButtons spotId={shrine.id} />
            </div>
          </aside>
        </div>

        {/* 奉納: 受付対応神社のみ */}
        {shrine.accepts_offerings ? (
          <div id="offering" className="mt-10">
            <OfferingSection spotId={shrine.id} />
          </div>
        ) : (
          <div className="mt-10 rounded-md border border-dashed border-border bg-washi/60 p-5 text-center text-sm text-sumi/70">
            <p>
              この神社はオンライン志納未対応です。参拝・奉納は現地または
              {shrine.website ? (
                <a href={shrine.website} target="_blank" rel="noopener noreferrer" className="text-moss underline">公式サイト</a>
              ) : "神社公式のご案内"}
              から直接お願いいたします。
            </p>
            <Link
              href="/offerings/shrines"
              className="mt-3 inline-block rounded-md border border-border bg-white px-4 py-2 text-xs hover:bg-kinari"
            >
              オンライン志納 対応神社の一覧を見る
            </Link>
          </div>
        )}

        {/* レビュー */}
        <ReviewList spotId={shrine.id} />
      </div>
    </main>
  );
}
