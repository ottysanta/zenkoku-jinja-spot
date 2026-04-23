/**
 * トップページ（Phase 1d 刷新）。
 *
 * 情報の見せ方（Comfy / 不動産ポータル参考）:
 *   1. ヒーロー: サービスの主旨 + 主要 CTA (地図 / 検索)
 *   2. サマリバッジ: 登録件数・都道府県カバー数
 *   3. 特集神社カード: 写真付きの代表神社 8 件
 *   4. ご利益別の導線: 縁結び/商売繁盛/合格祈願… のカテゴリカード
 *   5. 都道府県別 TOP5: 神社の多い県へのリンク
 *   6. 学ぶ / 気持ちを届ける の副導線
 */
import Link from "next/link";
import type { Metadata } from "next";
import {
  searchSpots,
  prefectureCounts,
  totalSpots,
  randomFeaturedSpots,
  recentlyAddedSpots,
  recentCheckins,
  featuredUsers,
  listOfferingShrines,
  countOfferingShrines,
  type RecentCheckin,
  type FeaturedUser,
} from "@/lib/shrine-db";
import { spotSlug } from "@/lib/api";
import ReactionButtons from "@/components/checkins/ReactionButtons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "全国神社スポット — Shrine Map of Japan",
  description:
    "27,000社を超える全国の神社を、写真・ご利益・祭神・社格などから検索できる。参拝チェックイン・奉納まで一貫してサポート。",
};

const BENEFIT_PRESETS = [
  { name: "縁結び", emoji: "💕" },
  { name: "商売繁盛", emoji: "💰" },
  { name: "合格祈願", emoji: "📚" },
  { name: "健康", emoji: "🌿" },
  { name: "厄除け", emoji: "🧿" },
  { name: "金運", emoji: "🪙" },
  { name: "交通安全", emoji: "🚙" },
  { name: "勝負運", emoji: "⚔" },
];

type FeaturedCard = {
  id: number;
  name: string;
  slug: string | null;
  prefecture: string | null;
  shrine_type: string | null;
  shrine_rank: string | null;
  photo_url: string | null;
  description: string | null;
  benefits: string[];
};

function parseBenefits(json?: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr)
      ? arr.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function loadFeatured(limit = 8): FeaturedCard[] {
  // manual source_layer を優先、photo_url があるものを上位に
  const { rows } = searchSpots({ limit: 100 });
  const withPhoto = rows.filter((r) => r.photo_url && r.description);
  return withPhoto.slice(0, limit).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    prefecture: r.prefecture,
    shrine_type: r.shrine_type,
    shrine_rank: r.shrine_rank,
    photo_url: r.photo_url,
    description: r.description,
    benefits: parseBenefits(r.benefits),
  }));
}

function formatRel(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${Math.max(1, min)} 分前`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} 時間前`;
    const d = Math.floor(hr / 24);
    if (d < 30) return `${d} 日前`;
    return new Date(iso).toLocaleDateString("ja-JP");
  } catch {
    return iso;
  }
}

export default async function HomePage() {
  const total = totalSpots();
  const prefCounts = prefectureCounts();
  const totalPref = prefCounts.length;
  // Phase 2: 全 47 都道府県を一覧表示する（TOP6 だけでは情報不足、というユーザーFB反映）
  const allPrefs = prefCounts;
  const featured = loadFeatured(8);
  // 「注目神社」写真付き神社からランダム 4 件（訪問毎に違うリフレッシュ感）
  const spotlight = randomFeaturedSpots(4).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    prefecture: r.prefecture,
    shrine_type: r.shrine_type,
    shrine_rank: r.shrine_rank,
    photo_url: r.photo_url,
    description: r.description,
  }));
  // 「新着追加」id 降順から写真付きの 6 件
  const latest = recentlyAddedSpots(6).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    prefecture: r.prefecture,
    photo_url: r.photo_url,
  }));
  // SQLite 直読みで最近のチェックインを取得（FastAPI 停止時も動作）
  const recentComments: RecentCheckin[] = recentCheckins(8);
  // 注目ユーザー（いいね・参考になったの累計）
  const topUsers: FeaturedUser[] = featuredUsers(6);
  // オンライン志納 受付中の神社 + 総数
  const offeringShrines = listOfferingShrines(6);
  const offeringShrineCount = countOfferingShrines();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      {/* 1) ヒーロー */}
      <section className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-washi p-6 md:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-vermilion/5 via-transparent to-moss/5 pointer-events-none" />
        <div className="relative text-center">
          <p className="text-[0.72rem] tracking-[0.28em] text-ink-sub uppercase mb-2">
            Shrine Map of Japan
          </p>
          <h1 className="text-3xl font-serif text-sumi mb-3 md:text-5xl">
            全国神社スポット
          </h1>
          <p className="text-sumi/75 leading-relaxed text-sm md:text-base max-w-xl mx-auto">
            自分に合う神社を見つけ、学び、訪れ、支える。
            <br className="hidden md:block" />
            気持ちを込めた参拝を、ここから。
          </p>

          {/* サマリバッジ */}
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-sumi/80">
              <span className="text-sumi/55">登録</span>
              <b className="tabular-nums text-vermilion-deep">{total.toLocaleString()}</b>
              <span>社</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-sumi/80">
              <span className="text-sumi/55">カバー</span>
              <b className="tabular-nums text-vermilion-deep">{totalPref}</b>
              <span>/ 47 都道府県</span>
            </span>
          </div>

          {/* 主 CTA */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href="/map"
              className="inline-flex min-h-[44px] items-center rounded-md border border-vermilion bg-vermilion px-5 py-2 text-sm font-semibold text-white shadow hover:bg-vermilion-deep"
            >
              🗺 地図で探す
            </Link>
            <Link
              href="/search"
              className="inline-flex min-h-[44px] items-center rounded-md border border-border bg-white px-5 py-2 text-sm font-semibold text-sumi shadow hover:bg-kinari"
            >
              ≣ 一覧で探す
            </Link>
          </div>
        </div>
      </section>

      {/* 1.5) 注目神社（ランダム 4 枚、訪問毎に違う） */}
      {spotlight.length > 0 ? (
        <section className="mb-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-xl">✨ 注目の神社</h2>
            <span className="text-xs text-sumi/50">訪問ごとに更新</span>
          </div>
          <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {spotlight.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-md border border-border shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.photo_url ?? ""}
                    alt={s.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
                    <p className="line-clamp-1 text-[13px] font-semibold text-white drop-shadow">
                      {s.name}
                    </p>
                    <p className="text-[10px] text-white/80">
                      {[s.prefecture, s.shrine_type].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 1.8) オンライン志納 受付中 */}
      {offeringShrines.length > 0 ? (
        <section className="mb-10 rounded-md border border-moss/30 bg-moss/5 p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-xl">
              🙏 オンライン志納 受付中
              <span className="ml-2 align-middle rounded-full bg-moss px-2 py-0.5 text-[11px] font-semibold text-white">
                {offeringShrineCount} 社
              </span>
            </h2>
            <Link
              href="/offerings/shrines"
              className="text-xs text-moss underline hover:text-moss/80"
            >
              すべて見る →
            </Link>
          </div>
          <p className="mb-3 text-xs text-sumi/70">
            全国 {total.toLocaleString()} 社のうち、宗教法人登録・受付同意が確認できた
            <b className="text-moss"> {offeringShrineCount} 社</b> のみオンライン志納に対応しています。
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {offeringShrines.slice(0, 6).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
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

      {/* 2) ご利益カテゴリ */}
      <section className="mb-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-serif text-xl">ご利益から探す</h2>
          <Link href="/search" className="text-xs text-sumi/60 underline hover:text-sumi">
            詳しく探す →
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {BENEFIT_PRESETS.map((b) => (
            <li key={b.name}>
              <Link
                href={`/search?benefit=${encodeURIComponent(b.name)}`}
                className="group block rounded-md border border-border bg-washi px-3 py-3 text-center transition hover:border-vermilion/50 hover:bg-kinari"
              >
                <div className="text-2xl">{b.emoji}</div>
                <div className="mt-1 text-xs font-medium text-sumi">{b.name}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 3) 特集神社カード */}
      {featured.length > 0 ? (
        <section className="mb-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-xl">特集神社</h2>
            <Link href="/search" className="text-xs text-sumi/60 underline hover:text-sumi">
              もっと見る →
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                  className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-washi shadow-sm transition hover:shadow-md"
                >
                  {s.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.photo_url}
                      alt={s.name}
                      className="h-36 w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <h3 className="line-clamp-1 text-sm font-semibold text-sumi">
                      {s.name}
                    </h3>
                    <p className="line-clamp-1 text-[11px] text-sumi/60">
                      {[s.prefecture, s.shrine_type, s.shrine_rank]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                    </p>
                    {s.description ? (
                      <p className="line-clamp-2 text-[11px] text-sumi/70">
                        {s.description.slice(0, 70)}
                        {s.description.length > 70 ? "…" : ""}
                      </p>
                    ) : null}
                    {s.benefits.length > 0 ? (
                      <div className="mt-auto flex flex-wrap gap-1 pt-2">
                        {s.benefits.slice(0, 4).map((b) => (
                          <span
                            key={b}
                            className="rounded-full border border-vermilion/40 bg-vermilion/10 px-2 py-0.5 text-[10px] text-vermilion"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 4) 都道府県 47 全部 */}
      <section className="mb-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-serif text-xl">都道府県から探す</h2>
          <Link href="/map" className="text-xs text-sumi/60 underline hover:text-sumi">
            地図で見る →
          </Link>
        </div>
        {(() => {
          const maxCount = allPrefs[0]?.count ?? 1;
          return (
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {allPrefs.map((r) => {
                const pct = Math.round((r.count / maxCount) * 100);
                return (
                  <li key={r.prefecture}>
                    <Link
                      href={`/search?prefecture=${encodeURIComponent(r.prefecture)}`}
                      className="group relative block overflow-hidden rounded-md border border-border bg-white px-2.5 py-2 hover:bg-kinari"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 bg-vermilion/10"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="relative flex items-center justify-between gap-1.5 text-[13px]">
                        <span className="truncate font-medium text-sumi">
                          {r.prefecture}
                        </span>
                        <span className="shrink-0 tabular-nums text-[11px] text-vermilion-deep">
                          {r.count.toLocaleString()}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          );
        })()}
        <p className="mt-2 text-[11px] text-sumi/50">
          全 {totalPref} 都道府県 / {total.toLocaleString()} 社をカバー
        </p>
      </section>

      {/* 4.4) 注目ユーザー */}
      {topUsers.length > 0 ? (
        <section className="mb-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-xl">⭐ 注目の参拝者</h2>
            <span className="text-xs text-sumi/50">コメントに「いいね」「参考になった」が多い方</span>
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {topUsers.map((u, i) => (
              <li
                key={u.client_id}
                className="flex items-start gap-3 rounded-md border border-border bg-washi p-3"
              >
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-vermilion/40 bg-vermilion/10 text-base font-bold text-vermilion-deep"
                  title={`ランク ${i + 1}`}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2 text-sm font-semibold text-sumi">
                    {u.nickname}
                    <span className="rounded-full border border-vermilion/40 bg-vermilion/10 px-1.5 py-0.5 text-[10px] text-vermilion-deep">
                      {u.total_reactions} reactions
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-sumi/60">
                    参拝 {u.checkin_count} 回 · 最近: {u.recent_spot_name}
                  </p>
                  {u.recent_comment ? (
                    <p className="mt-1 line-clamp-2 text-[12px] text-sumi/80">
                      「{u.recent_comment}」
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 4.5) 最近の参拝コメント（SQLite 直読） */}
      {recentComments.length > 0 ? (
        <section className="mb-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-xl">💬 最近の参拝コメント</h2>
            <span className="text-xs text-sumi/50">参拝者の声</span>
          </div>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {recentComments.map((r) => (
              <li
                key={r.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border bg-washi p-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/shrines/${spotSlug({ id: r.spot_id, slug: r.spot_slug })}`}
                    className="line-clamp-1 text-sm font-semibold text-sumi hover:underline"
                  >
                    {r.spot_name}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-sumi/55">
                    {r.spot_prefecture ? <span>{r.spot_prefecture}</span> : null}
                    {r.wish_type ? (
                      <span className="inline-block rounded-full border border-vermilion/40 bg-vermilion/10 px-2 py-0.5 text-[10px] text-vermilion-deep">
                        {(
                          {
                            gratitude: "感謝",
                            vow: "決意",
                            milestone: "節目",
                            thanks: "お礼",
                            other: "その他",
                          } as Record<string, string>
                        )[r.wish_type] || r.wish_type}
                      </span>
                    ) : null}
                  </p>
                  {r.comment ? (
                    <p className="mt-1 line-clamp-2 text-[12px] text-sumi/80">
                      「{r.comment}」
                    </p>
                  ) : (
                    <p className="mt-1 text-[12px] text-sumi/50">
                      {r.nickname || "匿名さん"} が参拝しました
                    </p>
                  )}
                  <div className="mt-1.5">
                    <ReactionButtons checkinId={r.id} compact />
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-sumi/50">
                  {formatRel(r.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="mb-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-xl">💬 最近の参拝コメント</h2>
          </div>
          <p className="rounded-md border border-dashed border-border bg-washi/60 p-4 text-xs text-sumi/60">
            まだ参拝コメントがありません。<Link href="/map" className="text-moss underline">地図</Link>から参拝した神社にチェックインしてみましょう。
          </p>
        </section>
      )}

      {/* 4.7) 新着神社 */}
      {latest.length > 0 ? (
        <section className="mb-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-xl">🆕 新しく追加された神社</h2>
            <span className="text-xs text-sumi/50">全 {total.toLocaleString()} 社の中から</span>
          </div>
          <ul className="flex gap-2 overflow-x-auto pb-2">
            {latest.map((s) => (
              <li key={s.id} className="w-40 shrink-0">
                <Link
                  href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                  className="block overflow-hidden rounded-md border border-border bg-washi shadow-sm hover:shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.photo_url ?? ""}
                    alt={s.name}
                    loading="lazy"
                    className="h-24 w-full object-cover"
                  />
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

      {/* 4.9) 守護神社診断バナー */}
      <section className="mb-10">
        <Link
          href="/diagnose"
          className="group relative block overflow-hidden rounded-2xl border-2 border-vermilion/30 bg-gradient-to-br from-vermilion/8 via-washi to-moss/8 p-6 shadow-sm transition hover:shadow-md hover:border-vermilion/50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-vermilion/5 to-transparent pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-center gap-5">
            {/* 五行シンボル */}
            <div className="flex-shrink-0 grid grid-cols-5 gap-1.5 text-center">
              {(["木", "火", "土", "金", "水"] as const).map((el, i) => (
                <div key={el} className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-serif font-bold text-white shadow ${
                  ["bg-emerald-500", "bg-orange-500", "bg-amber-500", "bg-slate-500", "bg-blue-500"][i]
                }`}>{el}</div>
              ))}
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-[10px] tracking-[0.28em] text-vermilion-deep font-semibold mb-1">⛩ SHRINE DIAGNOSIS</p>
              <h2 className="font-serif text-xl text-sumi mb-1">守護神社診断</h2>
              <p className="text-sm text-sumi/70 leading-relaxed">
                生まれ年から干支・五行属性を導き出し、<br className="hidden md:block"/>
                職場・家族・恋愛の悩みに縁深い守護神社をご紹介します。
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-vermilion px-5 py-2.5 text-sm font-semibold text-white shadow transition group-hover:bg-vermilion-deep">
                無料で診断する →
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* 5) 学ぶ / 気持ちを届ける */}
      <section className="mb-10 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Link
          href="/learn"
          className="block rounded-md border border-border bg-paper px-5 py-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
        >
          <div className="text-xs tracking-[0.2em] text-vermilion-deep font-bold mb-2">
            📖 LEARN
          </div>
          <div className="font-serif text-lg text-sumi mb-1">神社を学ぶ</div>
          <p className="text-xs text-ink-sub">
            参拝マナー・御朱印・祭神系譜・社格などの基礎知識。
          </p>
        </Link>
        <Link
          href="/offerings"
          className="block rounded-md border border-border bg-paper px-5 py-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
        >
          <div className="text-xs tracking-[0.2em] text-vermilion-deep font-bold mb-2">
            🙏 OFFERINGS
          </div>
          <div className="font-serif text-lg text-sumi mb-1">気持ちを届ける</div>
          <p className="text-xs text-ink-sub">
            遠方からでも神社に感謝・決意を届けられるオンライン奉納。
          </p>
        </Link>
      </section>

      <footer className="mt-12 border-t border-border-soft pt-4 text-center text-xs text-ink-mute">
        <p>Shrine Map of Japan · 参拝の記録と支援の場</p>
      </footer>
    </main>
  );
}
