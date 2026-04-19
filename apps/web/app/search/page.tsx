/**
 * 神社検索ページ。
 *
 * - Server component: searchParams を受け取り SSR で検索結果を取得
 * - /search?q=...&benefit=...&deity=...&prefecture=...
 * - 空条件時は「該当なし」ではなく導線を出す
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { spotSlug, type Spot } from "@/lib/api";
import SearchBar from "@/components/search/SearchBar";
import {
  searchSpots,
  facetCountsForBenefits,
  facetCountsForShrineType,
  facetCountsForPrefecture,
  facetCountsForCity,
} from "@/lib/shrine-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "神社を探す",
  description: "神社名・ご利益・祭神・都道府県で全国の神社を検索できます。",
  robots: { index: true, follow: true },
};

type SearchParams = {
  q?: string;
  benefit?: string;
  deity?: string;
  prefecture?: string;
  city?: string;
  shrine_type?: string;
  accepts?: string; // "1" のとき accepts_offerings=true で絞り込み
  page?: string;   // 1始まり (default 1)
};

// SearchBar に載せるプリセット + ファセット候補
const BENEFIT_PRESETS_FACET = [
  "縁結び",
  "商売繁盛",
  "合格祈願",
  "健康",
  "厄除け",
  "金運",
  "交通安全",
  "勝負運",
  "学業成就",
  "家内安全",
  "安産",
  "五穀豊穣",
  "開運",
  "病気平癒",
];

function parseBenefits(json?: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const PAGE_SIZE = 48;

// SSR 用: FastAPI を介さず SQLite を直接読む
function runSearchSSR(params: SearchParams & { accepts_offerings?: boolean; page: number }): {
  rows: Spot[];
  total: number;
} {
  try {
    const offset = Math.max(0, (params.page - 1) * PAGE_SIZE);
    const { rows, total } = searchSpots({
      q: params.q,
      benefit: params.benefit,
      deity: params.deity,
      prefecture: params.prefecture,
      city: params.city,
      shrine_type: params.shrine_type,
      accepts_offerings: params.accepts_offerings,
      limit: PAGE_SIZE,
      offset,
    });
    return { rows: rows as unknown as Spot[], total };
  } catch {
    return { rows: [], total: 0 };
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const benefit = (sp.benefit ?? "").trim();
  const deity = (sp.deity ?? "").trim();
  const prefecture = (sp.prefecture ?? "").trim();
  const city = (sp.city ?? "").trim();
  const shrine_type = (sp.shrine_type ?? "").trim();
  const acceptsOnly = sp.accepts === "1";
  const page = Math.max(1, Number(sp.page ?? 1));
  const hasQuery = !!(
    q || benefit || deity || prefecture || city || shrine_type || acceptsOnly
  );
  const { rows: results, total: totalCount } = runSearchSSR({
    q,
    benefit,
    deity,
    prefecture,
    city,
    shrine_type,
    accepts_offerings: acceptsOnly,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  // Comfy 風ファセット: 各候補と件数
  const benefitFacets = hasQuery
    ? facetCountsForBenefits(
        { q, deity, prefecture, shrine_type },
        BENEFIT_PRESETS_FACET,
      )
    : facetCountsForBenefits({}, BENEFIT_PRESETS_FACET);
  const shrineTypeFacets = facetCountsForShrineType(
    hasQuery ? { q, benefit, deity, prefecture } : {},
  );
  const prefectureFacets = facetCountsForPrefecture(
    hasQuery ? { q, benefit, deity, shrine_type } : {},
  );
  // 市区町村ファセット（prefecture 絞り込み中のみ意味あり）
  const cityFacets = prefecture
    ? facetCountsForCity({ q, benefit, deity, prefecture, shrine_type })
    : [];
  const t = await getTranslations("search");
  const tc = await getTranslations("common");

  // 適用中のフィルタを chip で見せる（UX 上「何で絞り込んでいるか」を明示）。
  // Comfy 参考で「個別に × で解除」できるようにする。
  const paramKeys = ["q", "benefit", "deity", "prefecture", "city", "shrine_type"] as const;
  function removeHref(omitKey: (typeof paramKeys)[number]): string {
    const qs = new URLSearchParams();
    if (q && omitKey !== "q") qs.set("q", q);
    if (benefit && omitKey !== "benefit") qs.set("benefit", benefit);
    if (deity && omitKey !== "deity") qs.set("deity", deity);
    if (prefecture && omitKey !== "prefecture") qs.set("prefecture", prefecture);
    if (city && omitKey !== "city") qs.set("city", city);
    if (shrine_type && omitKey !== "shrine_type")
      qs.set("shrine_type", shrine_type);
    const s = qs.toString();
    return `/search${s ? `?${s}` : ""}`;
  }
  // 条件を追加して絞り込むためのリンク
  function addHref(add: Partial<Record<(typeof paramKeys)[number], string>>): string {
    const qs = new URLSearchParams();
    const merged: Record<string, string> = { q, benefit, deity, prefecture, city, shrine_type };
    for (const [k, v] of Object.entries(add)) if (v != null) merged[k] = v;
    // 都道府県を変えたら city はクリア
    if (add.prefecture !== undefined && add.prefecture !== prefecture) merged.city = "";
    for (const [k, v] of Object.entries(merged)) if (v) qs.set(k, v);
    const s = qs.toString();
    return `/search${s ? `?${s}` : ""}`;
  }
  const activeFilters: Array<{
    key: (typeof paramKeys)[number];
    label: string;
    value: string;
  }> = [];
  if (q) activeFilters.push({ key: "q", label: tc("search"), value: q });
  if (benefit) activeFilters.push({ key: "benefit", label: t("benefits"), value: benefit });
  if (deity) activeFilters.push({ key: "deity", label: t("deity"), value: deity });
  if (prefecture) activeFilters.push({ key: "prefecture", label: t("prefecture"), value: prefecture });
  if (city) activeFilters.push({ key: "city", label: "市区町村", value: city });
  if (shrine_type) activeFilters.push({ key: "shrine_type", label: "神社形式", value: shrine_type });

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-md border border-border bg-washi px-2.5 py-1.5 text-xs text-sumi hover:bg-kinari"
              aria-label="トップへ戻る"
            >
              ← トップ
            </Link>
            <h1 className="text-xl font-bold text-sumi sm:text-2xl">神社を探す</h1>
          </div>
          {/* 地図/一覧 ビュートグル（Comfy 参考）*/}
          <div className="inline-flex overflow-hidden rounded-md border border-border bg-washi text-xs shadow-sm">
            <Link
              href={(() => {
                const qs = new URLSearchParams();
                if (q) qs.set("q", q);
                if (benefit) qs.set("benefit", benefit);
                if (deity) qs.set("deity", deity);
                if (prefecture) qs.set("prefecture", prefecture);
                const s = qs.toString();
                return `/map${s ? `?${s}` : ""}`;
              })()}
              className="px-3 py-1.5 text-sumi hover:bg-kinari"
            >
              🗺 地図
            </Link>
            <span className="bg-vermilion px-3 py-1.5 font-semibold text-white">
              ≣ 一覧
            </span>
          </div>
        </div>
        <SearchBar
          defaultQuery={q}
          defaultBenefit={benefit}
          defaultDeity={deity}
          defaultPrefecture={prefecture}
        />
        {/* 受付対応 トグル */}
        <div className="flex items-center gap-2 text-xs">
          <Link
            href={(() => {
              const qs = new URLSearchParams();
              if (q) qs.set("q", q);
              if (benefit) qs.set("benefit", benefit);
              if (deity) qs.set("deity", deity);
              if (prefecture) qs.set("prefecture", prefecture);
              if (city) qs.set("city", city);
              if (shrine_type) qs.set("shrine_type", shrine_type);
              if (!acceptsOnly) qs.set("accepts", "1");
              const s = qs.toString();
              return `/search${s ? `?${s}` : ""}`;
            })()}
            className={
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium " +
              (acceptsOnly
                ? "border-moss bg-moss text-white"
                : "border-border bg-white text-sumi/80 hover:bg-kinari")
            }
            title="オンライン志納に対応している神社のみ表示"
          >
            {acceptsOnly ? "✓" : "◻︎"} 🙏 オンライン志納 受付中のみ
          </Link>
          {acceptsOnly ? (
            <span className="text-sumi/50">
              （宗教法人登録・受付同意が確認できた神社）
            </span>
          ) : null}
        </div>
        {/* 条件数 + 結果件数（Comfy 風の動的バッジ）*/}
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-washi/70 px-3 py-2 text-xs">
          <span className="inline-flex items-center rounded-full border border-border bg-white px-2 py-0.5 text-sumi/80">
            条件 <b className="ml-1 text-sumi">({activeFilters.length})</b>
          </span>
          <span className="text-sumi/60">|</span>
          <span className="text-vermilion-deep font-bold tabular-nums">
            {totalCount.toLocaleString()}
          </span>
          <span className="text-sumi/70">件</span>
          {activeFilters.length > 0 ? (
            <>
              <span className="ml-2 text-sumi/40">—</span>
              {activeFilters.map((f) => (
                <Link
                  key={`${f.key}:${f.value}`}
                  href={removeHref(f.key)}
                  aria-label={`${f.label}「${f.value}」を解除`}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-vermilion/40 bg-vermilion/10 px-2.5 py-0.5 text-vermilion hover:bg-vermilion/20"
                >
                  <span className="text-[10px] text-vermilion/70">{f.label}</span>
                  <span className="font-semibold">{f.value}</span>
                  <span className="ml-0.5 rounded-full bg-vermilion/20 px-1 text-[10px] leading-none text-vermilion group-hover:bg-vermilion/40">
                    ×
                  </span>
                </Link>
              ))}
              <Link
                href="/search"
                className="ml-1 text-[11px] text-sumi/50 underline hover:text-sumi/80"
              >
                すべて解除
              </Link>
            </>
          ) : null}
        </div>
      </header>

      {/* 市区町村ファセット: 都道府県が絞られている場合のみ */}
      {prefecture && cityFacets.length > 0 ? (
        <section className="mb-6 rounded-md border border-border bg-washi/60 p-3">
          <div className="mb-2 flex items-center justify-between border-b border-vermilion/30 pb-1.5">
            <h2 className="text-xs font-semibold text-vermilion-deep">
              {prefecture} の市区町村
            </h2>
            {city ? (
              <Link href={removeHref("city")} className="text-[10px] text-sumi/60 hover:underline">
                解除
              </Link>
            ) : null}
          </div>
          {(() => {
            const maxV = Math.max(1, ...cityFacets.map((r) => r.count));
            return (
              <ul className="grid grid-cols-2 gap-1 text-[11px] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {cityFacets.slice(0, 48).map((r) => {
                  const active = r.value === city;
                  const pct = Math.round((r.count / maxV) * 100);
                  const href = active ? removeHref("city") : addHref({ city: r.value });
                  return (
                    <li key={r.value}>
                      <Link
                        href={href}
                        className={
                          "relative block rounded px-1.5 py-1 " +
                          (active ? "bg-vermilion text-white" : "text-sumi/90 hover:bg-kinari")
                        }
                      >
                        <span
                          aria-hidden="true"
                          className={
                            "absolute inset-y-0 left-0 rounded " +
                            (active ? "bg-white/20" : "bg-vermilion/10")
                          }
                          style={{ width: `${pct}%` }}
                        />
                        <span className="relative flex items-center justify-between gap-1.5">
                          <span className="truncate">
                            {active ? "☑︎" : "◻︎"} {r.value}
                          </span>
                          <span
                            className={
                              "tabular-nums " + (active ? "text-white/80" : "text-sumi/50")
                            }
                          >
                            [{r.count}]
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            );
          })()}
        </section>
      ) : null}

      {/* Phase B-1/B-2: 件数付きファセット + ヒストグラム風バー（Comfy 風） */}
      {(() => {
        return null;
      })()}
      {(() => {
        return null;
      })()}
      <aside className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* ご利益 */}
        <section className="rounded-md border border-border bg-washi/60 p-3">
          <div className="mb-2 flex items-center justify-between border-b border-vermilion/30 pb-1.5">
            <h2 className="text-xs font-semibold text-vermilion-deep">ご利益</h2>
            {benefit ? (
              <Link
                href={removeHref("benefit")}
                className="text-[10px] text-sumi/60 hover:underline"
              >
                解除
              </Link>
            ) : null}
          </div>
          {(() => {
            const maxBenefit = Math.max(
              1,
              ...BENEFIT_PRESETS_FACET.map((b) => benefitFacets[b] ?? 0),
            );
            return (
              <ul className="grid grid-cols-2 gap-y-1 text-[11px]">
                {BENEFIT_PRESETS_FACET.map((b) => {
                  const count = benefitFacets[b] ?? 0;
                  const active = b === benefit;
                  const disabled = count === 0 && !active;
                  const href = active
                    ? removeHref("benefit")
                    : addHref({ benefit: b });
                  const pct = Math.round((count / maxBenefit) * 100);
                  return (
                    <li key={b}>
                      {disabled ? (
                        <span className="relative flex items-center justify-between gap-1 rounded px-1 py-0.5 text-sumi/30">
                          <span>◻︎ {b}</span>
                          <span className="tabular-nums">[0]</span>
                        </span>
                      ) : (
                        <Link
                          href={href}
                          className={
                            "relative block rounded px-1 py-0.5 " +
                            (active
                              ? "bg-vermilion text-white"
                              : "text-sumi/90 hover:bg-kinari")
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={
                              "absolute inset-y-0 left-0 rounded " +
                              (active ? "bg-white/20" : "bg-vermilion/10")
                            }
                            style={{ width: `${pct}%` }}
                          />
                          <span className="relative flex items-center justify-between gap-1">
                            <span>
                              {active ? "☑︎" : "◻︎"} {b}
                            </span>
                            <span
                              className={
                                "tabular-nums " +
                                (active ? "text-white/80" : "text-sumi/50")
                              }
                            >
                              [{count.toLocaleString()}]
                            </span>
                          </span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            );
          })()}
        </section>

        {/* 神社形式 */}
        <section className="rounded-md border border-border bg-washi/60 p-3">
          <div className="mb-2 flex items-center justify-between border-b border-vermilion/30 pb-1.5">
            <h2 className="text-xs font-semibold text-vermilion-deep">神社形式</h2>
            {shrine_type ? (
              <Link
                href={removeHref("shrine_type")}
                className="text-[10px] text-sumi/60 hover:underline"
              >
                解除
              </Link>
            ) : null}
          </div>
          {(() => {
            const topN = shrineTypeFacets.slice(0, 20);
            const maxV = Math.max(1, ...topN.map((r) => r.count));
            return (
              <ul className="max-h-40 space-y-0.5 overflow-y-auto text-[11px]">
                {topN.length === 0 ? (
                  <li className="text-sumi/40">— 該当なし —</li>
                ) : (
                  topN.map((r) => {
                    const active = r.value === shrine_type;
                    const href = active
                      ? removeHref("shrine_type")
                      : addHref({ shrine_type: r.value });
                    const pct = Math.round((r.count / maxV) * 100);
                    return (
                      <li key={r.value}>
                        <Link
                          href={href}
                          className={
                            "relative block rounded px-1 py-0.5 " +
                            (active
                              ? "bg-vermilion text-white"
                              : "text-sumi/90 hover:bg-kinari")
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={
                              "absolute inset-y-0 left-0 rounded " +
                              (active ? "bg-white/20" : "bg-vermilion/10")
                            }
                            style={{ width: `${pct}%` }}
                          />
                          <span className="relative flex items-center justify-between gap-1">
                            <span className="truncate">
                              {active ? "☑︎" : "◻︎"} {r.value}
                            </span>
                            <span
                              className={
                                "tabular-nums " +
                                (active ? "text-white/80" : "text-sumi/50")
                              }
                            >
                              [{r.count.toLocaleString()}]
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
            );
          })()}
        </section>

        {/* 都道府県 */}
        <section className="rounded-md border border-border bg-washi/60 p-3">
          <div className="mb-2 flex items-center justify-between border-b border-vermilion/30 pb-1.5">
            <h2 className="text-xs font-semibold text-vermilion-deep">都道府県</h2>
            {prefecture ? (
              <Link
                href={removeHref("prefecture")}
                className="text-[10px] text-sumi/60 hover:underline"
              >
                解除
              </Link>
            ) : null}
          </div>
          {(() => {
            const topN = prefectureFacets.slice(0, 20);
            const maxV = Math.max(1, ...topN.map((r) => r.count));
            return (
              <ul className="max-h-40 space-y-0.5 overflow-y-auto text-[11px]">
                {topN.length === 0 ? (
                  <li className="text-sumi/40">— 該当なし —</li>
                ) : (
                  topN.map((r) => {
                    const active = r.value === prefecture;
                    const href = active
                      ? removeHref("prefecture")
                      : addHref({ prefecture: r.value });
                    const pct = Math.round((r.count / maxV) * 100);
                    return (
                      <li key={r.value}>
                        <Link
                          href={href}
                          className={
                            "relative block rounded px-1 py-0.5 " +
                            (active
                              ? "bg-vermilion text-white"
                              : "text-sumi/90 hover:bg-kinari")
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={
                              "absolute inset-y-0 left-0 rounded " +
                              (active ? "bg-white/20" : "bg-vermilion/10")
                            }
                            style={{ width: `${pct}%` }}
                          />
                          <span className="relative flex items-center justify-between gap-1">
                            <span className="truncate">
                              {active ? "☑︎" : "◻︎"} {r.value}
                            </span>
                            <span
                              className={
                                "tabular-nums " +
                                (active ? "text-white/80" : "text-sumi/50")
                              }
                            >
                              [{r.count.toLocaleString()}]
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
            );
          })()}
        </section>
      </aside>

      {!hasQuery ? (
        <section className="rounded-md border border-dashed border-border bg-washi/60 p-6 text-center text-sm text-sumi/70">
          検索語・ご利益・祭神・都道府県のいずれかを指定してください。
        </section>
      ) : results.length === 0 ? (
        <section className="rounded-md border border-dashed border-border bg-washi/60 p-6 text-center text-sm text-sumi/70">
          {t("noResults")}
        </section>
      ) : (
        <section>
          <div className="mb-3 flex items-center justify-between text-xs text-sumi/60">
            <p>
              全 <b className="text-vermilion-deep tabular-nums">{totalCount.toLocaleString()}</b> 件中{" "}
              <b className="text-sumi tabular-nums">
                {((page - 1) * PAGE_SIZE + 1).toLocaleString()}〜
                {Math.min(page * PAGE_SIZE, totalCount).toLocaleString()}
              </b>{" "}
              件を表示
            </p>
            <p className="text-sumi/50">
              ページ {page} / {totalPages}
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((s) => {
              const benefits = parseBenefits(s.benefits);
              const summary = (s.description || s.history || "").slice(0, 90);
              return (
                <li key={s.id}>
                  <Link
                    href={`/shrines/${spotSlug(s)}`}
                    className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-washi shadow-sm transition hover:shadow-md"
                  >
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.photo_url}
                        alt={s.name}
                        className="h-36 w-full object-cover sm:h-40"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-16 w-full items-center justify-center bg-kinari text-[10px] text-sumi/40 sm:h-20">
                        写真なし
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <div className="flex items-center gap-1.5">
                        <h2 className="line-clamp-1 flex-1 text-sm font-semibold text-sumi">
                          {s.canonical_name || s.name}
                        </h2>
                        {s.accepts_offerings ? (
                          <span
                            title="オンライン志納 受付中"
                            className="shrink-0 rounded-full bg-moss px-1.5 py-0.5 text-[9px] font-semibold text-white"
                          >
                            ✓ 受付
                          </span>
                        ) : null}
                      </div>
                      <p className="line-clamp-1 text-[11px] text-sumi/60">
                        {[
                          [s.prefecture, s.city].filter(Boolean).join(" "),
                          s.shrine_type,
                          s.shrine_rank,
                        ]
                          .filter(Boolean)
                          .join(" / ") || "—"}
                      </p>
                      {s.deity ? (
                        <p className="line-clamp-1 text-[11px] text-sumi/70">
                          御祭神: {s.deity}
                        </p>
                      ) : null}
                      {s.address ? (
                        <p className="line-clamp-1 text-[11px] text-sumi/60">
                          {s.address}
                        </p>
                      ) : null}
                      {summary ? (
                        <p className="line-clamp-2 text-[11px] text-sumi/70">
                          {summary}
                          {summary.length >= 90 ? "…" : ""}
                        </p>
                      ) : null}
                      {benefits.length > 0 ? (
                        <div className="mt-auto flex flex-wrap gap-1 pt-2">
                          {benefits.slice(0, 5).map((b) => (
                            <span
                              key={b}
                              className="rounded-full border border-vermilion/40 bg-vermilion/10 px-2 py-0.5 text-[10px] text-vermilion"
                            >
                              {b}
                            </span>
                          ))}
                          {benefits.length > 5 ? (
                            <span className="text-[10px] text-sumi/50">+{benefits.length - 5}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ページネーション */}
          {totalPages > 1 ? (
            <nav
              className="mt-6 flex items-center justify-center gap-1 text-xs"
              aria-label="ページネーション"
            >
              {(() => {
                function pageHref(p: number): string {
                  const qs = new URLSearchParams();
                  if (q) qs.set("q", q);
                  if (benefit) qs.set("benefit", benefit);
                  if (deity) qs.set("deity", deity);
                  if (prefecture) qs.set("prefecture", prefecture);
                  if (city) qs.set("city", city);
                  if (shrine_type) qs.set("shrine_type", shrine_type);
                  if (acceptsOnly) qs.set("accepts", "1");
                  if (p > 1) qs.set("page", String(p));
                  const s = qs.toString();
                  return `/search${s ? `?${s}` : ""}`;
                }
                const pagesToShow: Array<number | "…"> = [];
                const add = (p: number) => pagesToShow.push(p);
                add(1);
                if (page > 3) pagesToShow.push("…");
                for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) add(p);
                if (page < totalPages - 2) pagesToShow.push("…");
                if (totalPages > 1) add(totalPages);
                const dedup = Array.from(new Set(pagesToShow));
                return (
                  <>
                    {page > 1 ? (
                      <Link
                        href={pageHref(page - 1)}
                        className="rounded-md border border-border bg-white px-3 py-1.5 text-sumi hover:bg-kinari"
                      >
                        ← 前へ
                      </Link>
                    ) : (
                      <span className="rounded-md border border-border bg-kinari px-3 py-1.5 text-sumi/40">
                        ← 前へ
                      </span>
                    )}
                    {dedup.map((p, i) =>
                      p === "…" ? (
                        <span key={"d" + i} className="px-2 text-sumi/40">…</span>
                      ) : (
                        <Link
                          key={p}
                          href={pageHref(p)}
                          className={
                            "rounded-md px-3 py-1.5 border " +
                            (p === page
                              ? "border-vermilion bg-vermilion text-white"
                              : "border-border bg-white text-sumi hover:bg-kinari")
                          }
                          aria-current={p === page ? "page" : undefined}
                        >
                          {p}
                        </Link>
                      ),
                    )}
                    {page < totalPages ? (
                      <Link
                        href={pageHref(page + 1)}
                        className="rounded-md border border-border bg-white px-3 py-1.5 text-sumi hover:bg-kinari"
                      >
                        次へ →
                      </Link>
                    ) : (
                      <span className="rounded-md border border-border bg-kinari px-3 py-1.5 text-sumi/40">
                        次へ →
                      </span>
                    )}
                  </>
                );
              })()}
            </nav>
          ) : null}
        </section>
      )}
    </main>
  );
}
