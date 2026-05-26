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
  try {
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
  } catch {
    return [];
  }
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
      <section
        className="relative mb-10 overflow-hidden rounded-2xl border border-shrine-gold/25 p-6 md:p-14"
        style={{
          backgroundColor: "#0D0A07",
          backgroundImage: "linear-gradient(to bottom, rgba(10,6,3,0.5) 0%, rgba(10,6,3,0.72) 60%, rgba(10,6,3,0.92) 100%), url('/assets/shrine/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8826%E6%97%A5%2019_31_07%20(1).png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* 装飾: 金の角枠 */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-shrine-gold/40 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-shrine-gold/40 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-shrine-gold/40 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-shrine-gold/40 rounded-br-2xl pointer-events-none" />
        {/* 装飾: 底部の赤いグロー */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_110%,rgba(139,30,39,0.25)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative text-center">
          <p className="text-[0.72rem] tracking-[0.32em] text-shrine-gold font-semibold uppercase mb-4">
            本当の自分で生きたい方へ
          </p>
          <h1 className="text-3xl font-serif text-kinari mb-4 md:text-5xl leading-snug drop-shadow-lg">
            あなたの守護神社を<br className="md:hidden" />見つける
          </h1>
          <p className="text-kinari/65 leading-relaxed text-sm md:text-base max-w-lg mx-auto mb-8">
            生年月日から五行属性・干支・誕生数を診断。<br className="hidden md:block" />
            縁深い守護神社と、神様からのメッセージをお届けします。
          </p>

          {/* 主 CTA */}
          <Link
            href="/diagnose"
            className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-shrine-red px-8 py-3 text-base font-bold text-white shadow-lg shadow-shrine-red/40 hover:bg-shrine-red-light transition active:scale-95"
          >
            ⛩ 守護神社診断を受ける（無料）
          </Link>

          {/* サブ CTA */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/omikuji"
              className="inline-flex min-h-[38px] items-center rounded-full border-2 border-shrine-gold/60 bg-night-card px-4 py-1.5 text-sm font-semibold text-shrine-gold hover:bg-night-100 transition"
            >
              📜 今日のおみくじ
            </Link>
            <Link
              href="/map"
              className="inline-flex min-h-[38px] items-center rounded-full border border-shrine-gold/25 bg-night-card px-4 py-1.5 text-sm font-semibold text-kinari hover:bg-night-100 transition"
            >
              🗺 地図で探す
            </Link>
          </div>

          {/* サマリバッジ */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-shrine-gold/30 bg-night-card/80 px-3 py-1 text-kinari/70">
              <b className="tabular-nums text-shrine-gold">{total.toLocaleString()}</b>
              <span>社収録</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-shrine-gold/30 bg-night-card/80 px-3 py-1 text-kinari/70">
              <b className="tabular-nums text-shrine-gold">{totalPref}</b>
              <span>/ 47 都道府県</span>
            </span>
          </div>
        </div>
      </section>

      {/* 1.2) コンテンツ三本柱 */}
      <section className="mb-10">
        <div className="mb-4 flex items-baseline justify-between border-b border-shrine-gold/20 pb-3">
          <h2 className="font-serif text-xl text-kinari">⛩ 神社体験コンテンツ</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/diagnose"
            className="group relative block overflow-hidden rounded-xl border border-shrine-red/40 bg-gradient-to-br from-shrine-red/10 via-night-card to-night p-5 shadow-sm transition hover:shadow-lg hover:border-shrine-red/60"
          >
            <div className="mb-3 flex gap-1">
              {(["木", "火", "土", "金", "水"] as const).map((el, i) => (
                <span key={el} className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${["bg-emerald-600","bg-orange-600","bg-amber-600","bg-slate-500","bg-blue-600"][i]}`}>{el}</span>
              ))}
            </div>
            <p className="text-[10px] tracking-[0.2em] text-shrine-gold font-semibold mb-1">SHRINE DIAGNOSIS</p>
            <h3 className="font-serif text-lg text-kinari mb-1">守護神社診断</h3>
            <p className="text-xs text-kinari/55 leading-relaxed mb-3">生年月・お悩みから五行属性と干支タイプを診断。縁深い守護神社を3社ご紹介します。</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-shrine-red px-4 py-1.5 text-xs font-semibold text-white transition group-hover:bg-shrine-red-light">
              無料で診断 →
            </span>
          </Link>

          <Link
            href="/omikuji"
            className="group relative block overflow-hidden rounded-xl border border-shrine-gold/30 bg-gradient-to-br from-shrine-gold/8 via-night-card to-night p-5 shadow-sm transition hover:shadow-lg hover:border-shrine-gold/50"
          >
            <div className="mb-3 text-3xl">📜</div>
            <p className="text-[10px] tracking-[0.2em] text-shrine-gold font-semibold mb-1">DAILY OMIKUJI</p>
            <h3 className="font-serif text-lg text-kinari mb-1">今日のおみくじ</h3>
            <p className="text-xs text-kinari/55 leading-relaxed mb-3">1日1回引ける守護神からのメッセージ。五行属性に合わせた今日の運勢をお届けします。</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-shrine-gold px-4 py-1.5 text-xs font-semibold text-night transition group-hover:bg-shrine-gold-light">
              おみくじを引く →
            </span>
          </Link>

          <Link
            href="/palm"
            className="group relative block overflow-hidden rounded-xl border border-purple-800/40 bg-gradient-to-br from-purple-900/20 via-night-card to-night p-5 shadow-sm transition hover:shadow-lg hover:border-purple-700/50"
          >
            <div className="mb-3 text-3xl">✋</div>
            <p className="text-[10px] tracking-[0.2em] text-purple-400 font-semibold mb-1">AI PALM READING</p>
            <h3 className="font-serif text-lg text-kinari mb-1">AI手相鑑定</h3>
            <p className="text-xs text-kinari/55 leading-relaxed mb-3">手のひら写真をアップするだけで、AIが生命線・知能線・感情線・運命線を鑑定。無料3回。</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-700 px-4 py-1.5 text-xs font-semibold text-white transition group-hover:bg-purple-600">
              手相を鑑定する →
            </span>
          </Link>

          <Link
            href="/diagnose/compat"
            className="group relative block overflow-hidden rounded-xl border border-blue-800/40 bg-gradient-to-br from-blue-900/20 via-night-card to-night p-5 shadow-sm transition hover:shadow-lg hover:border-blue-700/50"
          >
            <div className="mb-3 text-3xl">🔄</div>
            <p className="text-[10px] tracking-[0.2em] text-blue-400 font-semibold mb-1">COMPATIBILITY</p>
            <h3 className="font-serif text-lg text-kinari mb-1">五行相性診断</h3>
            <p className="text-xs text-kinari/55 leading-relaxed mb-3">木・火・土・金・水の五行属性から、相生・相克でふたりの縁と相性を読み解きます。</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-700 px-4 py-1.5 text-xs font-semibold text-white transition group-hover:bg-blue-600">
              相性を診断 →
            </span>
          </Link>

          <Link
            href="/worry"
            className="group relative block overflow-hidden rounded-xl border border-emerald-800/40 bg-gradient-to-br from-emerald-900/20 via-night-card to-night p-5 shadow-sm transition hover:shadow-lg hover:border-emerald-700/50"
          >
            <div className="mb-3 text-3xl">🙏</div>
            <p className="text-[10px] tracking-[0.2em] text-emerald-500 font-semibold mb-1">WORRY DIAGNOSIS</p>
            <h3 className="font-serif text-lg text-kinari mb-1">悩み別 神社診断</h3>
            <p className="text-xs text-kinari/55 leading-relaxed mb-3">職場・恋愛・家族・健康・金運…今のあなたの悩みに縁深い神様と神社をご紹介します。</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white transition group-hover:bg-emerald-600">
              悩みで探す →
            </span>
          </Link>
        </div>
      </section>

      {/* 1.5) 注目神社（ランダム 4 枚、訪問毎に違う） */}
      {spotlight.length > 0 ? (
        <section className="mb-10">
          <div className="mb-4 flex items-baseline justify-between border-b border-shrine-gold/20 pb-3">
            <h2 className="font-serif text-xl text-kinari">✨ 注目の神社</h2>
            <span className="text-xs text-kinari/40">訪問ごとに更新</span>
          </div>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {spotlight.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-xl border border-shrine-gold/20 shadow-md"
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
        <section className="mb-10 rounded-xl border border-shrine-gold/25 bg-gradient-to-br from-night-50 to-night p-5">
          <div className="mb-3 flex items-baseline justify-between border-b border-shrine-gold/20 pb-3">
            <h2 className="font-serif text-xl text-kinari">
              🙏 オンライン志納 受付中
              <span className="ml-2 align-middle rounded-full bg-emerald-800 px-2 py-0.5 text-[11px] font-semibold text-kinari">
                {offeringShrineCount} 社
              </span>
            </h2>
            <Link
              href="/offerings/shrines"
              className="text-xs text-shrine-gold underline hover:text-shrine-gold-light"
            >
              すべて見る →
            </Link>
          </div>
          <p className="mb-3 text-xs text-kinari/60">
            全国 {total.toLocaleString()} 社のうち、宗教法人登録・受付同意が確認できた
            <b className="text-shrine-gold"> {offeringShrineCount} 社</b> のみオンライン志納に対応しています。
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {offeringShrines.slice(0, 6).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                  className="block overflow-hidden rounded-xl border border-shrine-gold/20 bg-night-card transition hover:border-shrine-gold/40 hover:shadow-md"
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
                    <p className="line-clamp-1 text-[12px] font-semibold text-kinari">
                      {s.name}
                    </p>
                    <p className="line-clamp-1 text-[10px] text-kinari/50">
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
      <section
        className="mb-10 -mx-4 overflow-hidden px-6 py-8 md:mx-0 md:rounded-2xl md:px-8"
        style={{
          backgroundColor: "#6A151B",
          backgroundImage: "linear-gradient(135deg,rgba(90,10,18,0.92)0%,rgba(120,20,30,0.88)50%,rgba(80,10,20,0.92)100%),url('/assets/shrine/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8826%E6%97%A5%2019_31_08%20(2).png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-serif text-xl text-kinari">ご利益から探す</h2>
          <Link href="/search" className="text-xs text-shrine-gold-light underline hover:text-shrine-gold">
            詳しく探す →
          </Link>
        </div>
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {BENEFIT_PRESETS.map((b) => (
            <li key={b.name}>
              <Link
                href={`/search?benefit=${encodeURIComponent(b.name)}`}
                className="group flex flex-col items-center gap-2 rounded-full border-2 border-shrine-gold/50 bg-shrine-red-deep/60 px-2 py-4 text-center transition hover:border-shrine-gold hover:bg-shrine-red-deep/80"
              >
                <div className="text-2xl">{b.emoji}</div>
                <div className="text-[11px] font-medium text-kinari leading-tight">{b.name}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 3) 特集神社カード */}
      {featured.length > 0 ? (
        <section className="mb-10">
          <div className="mb-4 flex items-baseline justify-between border-b border-shrine-gold/20 pb-3">
            <h2 className="font-serif text-xl text-kinari">特集神社</h2>
            <Link href="/search" className="text-xs text-shrine-gold underline hover:text-shrine-gold-light">
              もっと見る →
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-shrine-gold/20 bg-night-card shadow-md transition hover:border-shrine-gold/40 hover:shadow-lg"
                >
                  {s.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <div className="relative overflow-hidden">
                      <img
                        src={s.photo_url}
                        alt={s.name}
                        className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-night/60 to-transparent" />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <h3 className="line-clamp-1 text-sm font-semibold text-kinari">
                      {s.name}
                    </h3>
                    <p className="line-clamp-1 text-[11px] text-kinari/50">
                      {[s.prefecture, s.shrine_type, s.shrine_rank]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                    </p>
                    {s.description ? (
                      <p className="line-clamp-2 text-[11px] text-kinari/60">
                        {s.description.slice(0, 70)}
                        {s.description.length > 70 ? "…" : ""}
                      </p>
                    ) : null}
                    {s.benefits.length > 0 ? (
                      <div className="mt-auto flex flex-wrap gap-1 pt-2">
                        {s.benefits.slice(0, 4).map((b) => (
                          <span
                            key={b}
                            className="rounded-full border border-shrine-gold/40 bg-shrine-gold/10 px-2 py-0.5 text-[10px] text-shrine-gold"
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
        <div className="mb-4 flex items-baseline justify-between border-b border-shrine-gold/20 pb-3">
          <h2 className="font-serif text-xl text-kinari">都道府県から探す</h2>
          <Link href="/map" className="text-xs text-shrine-gold underline hover:text-shrine-gold-light">
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
                      className="group relative block overflow-hidden rounded-md border border-shrine-gold/20 bg-night-card px-2.5 py-2 hover:border-shrine-gold/40 hover:bg-night-50"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 bg-shrine-red/20"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="relative flex items-center justify-between gap-1.5 text-[13px]">
                        <span className="truncate font-medium text-kinari">
                          {r.prefecture}
                        </span>
                        <span className="shrink-0 tabular-nums text-[11px] text-shrine-gold">
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
        <p className="mt-2 text-[11px] text-kinari/40">
          全 {totalPref} 都道府県 / {total.toLocaleString()} 社をカバー
        </p>
      </section>

      {/* 4.4) 注目ユーザー */}
      {topUsers.length > 0 ? (
        <section className="mb-10">
          <div className="mb-4 flex items-baseline justify-between border-b border-shrine-gold/20 pb-3">
            <h2 className="font-serif text-xl text-kinari">⭐ 注目の参拝者</h2>
            <span className="text-xs text-kinari/40">コメントに「いいね」「参考になった」が多い方</span>
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {topUsers.map((u, i) => (
              <li
                key={u.client_id}
                className="flex items-start gap-3 rounded-xl border border-shrine-gold/20 bg-night-card p-3"
              >
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-shrine-gold/50 bg-shrine-gold/10 text-base font-bold text-shrine-gold"
                  title={`ランク ${i + 1}`}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2 text-sm font-semibold text-kinari">
                    {u.nickname}
                    <span className="rounded-full border border-shrine-gold/40 bg-shrine-gold/10 px-1.5 py-0.5 text-[10px] text-shrine-gold">
                      {u.total_reactions} reactions
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-kinari/50">
                    参拝 {u.checkin_count} 回 · 最近: {u.recent_spot_name}
                  </p>
                  {u.recent_comment ? (
                    <p className="mt-1 line-clamp-2 text-[12px] text-kinari/70">
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
          <div className="mb-4 flex items-baseline justify-between border-b border-shrine-gold/20 pb-3">
            <h2 className="font-serif text-xl text-kinari">💬 最近の参拝コメント</h2>
            <span className="text-xs text-kinari/40">参拝者の声</span>
          </div>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {recentComments.map((r) => (
              <li
                key={r.id}
                className="flex items-start justify-between gap-2 rounded-xl border border-shrine-gold/20 bg-night-card p-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/shrines/${spotSlug({ id: r.spot_id, slug: r.spot_slug })}`}
                    className="line-clamp-1 text-sm font-semibold text-kinari hover:text-shrine-gold hover:underline"
                  >
                    {r.spot_name}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-kinari/45">
                    {r.spot_prefecture ? <span>{r.spot_prefecture}</span> : null}
                    {r.wish_type ? (
                      <span className="inline-block rounded-full border border-shrine-gold/40 bg-shrine-gold/10 px-2 py-0.5 text-[10px] text-shrine-gold">
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
                    <p className="mt-1 line-clamp-2 text-[12px] text-kinari/70">
                      「{r.comment}」
                    </p>
                  ) : (
                    <p className="mt-1 text-[12px] text-kinari/45">
                      {r.nickname || "匿名さん"} が参拝しました
                    </p>
                  )}
                  <div className="mt-1.5">
                    <ReactionButtons checkinId={r.id} compact />
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-kinari/40">
                  {formatRel(r.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="mb-10">
          <div className="mb-4 flex items-baseline justify-between border-b border-shrine-gold/20 pb-3">
            <h2 className="font-serif text-xl text-kinari">💬 最近の参拝コメント</h2>
          </div>
          <p className="rounded-xl border border-dashed border-shrine-gold/20 bg-night-card p-4 text-xs text-kinari/50">
            まだ参拝コメントがありません。<Link href="/map" className="text-shrine-gold underline">地図</Link>から参拝した神社にチェックインしてみましょう。
          </p>
        </section>
      )}

      {/* 4.7) 新着神社 */}
      {latest.length > 0 ? (
        <section className="mb-10">
          <div className="mb-4 flex items-baseline justify-between border-b border-shrine-gold/20 pb-3">
            <h2 className="font-serif text-xl text-kinari">🆕 新しく追加された神社</h2>
            <span className="text-xs text-kinari/40">全 {total.toLocaleString()} 社の中から</span>
          </div>
          <ul className="flex gap-3 overflow-x-auto pb-2">
            {latest.map((s) => (
              <li key={s.id} className="w-40 shrink-0">
                <Link
                  href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                  className="block overflow-hidden rounded-xl border border-shrine-gold/20 bg-night-card shadow-md hover:border-shrine-gold/40 hover:shadow-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.photo_url ?? ""}
                    alt={s.name}
                    loading="lazy"
                    className="h-24 w-full object-cover"
                  />
                  <div className="p-2">
                    <p className="line-clamp-1 text-[12px] font-semibold text-kinari">
                      {s.name}
                    </p>
                    <p className="line-clamp-1 text-[10px] text-kinari/50">
                      {s.prefecture ?? "—"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 5) 学ぶ / 気持ちを届ける */}
      <section className="mb-10 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Link
          href="/learn"
          className="group block rounded-xl border border-shrine-gold/25 bg-night-card px-6 py-6 shadow-md transition hover:-translate-y-0.5 hover:border-shrine-gold/50 hover:shadow-lg"
        >
          <div className="text-xs tracking-[0.2em] text-shrine-gold font-bold mb-3">
            📖 LEARN
          </div>
          <div className="font-serif text-lg text-kinari mb-2">神社を学ぶ</div>
          <p className="text-xs text-kinari/55">
            参拝マナー・御朱印・祭神系譜・社格などの基礎知識。
          </p>
        </Link>
        <Link
          href="/offerings"
          className="group block rounded-xl border border-shrine-gold/25 bg-night-card px-6 py-6 shadow-md transition hover:-translate-y-0.5 hover:border-shrine-gold/50 hover:shadow-lg"
        >
          <div className="text-xs tracking-[0.2em] text-shrine-gold font-bold mb-3">
            🙏 OFFERINGS
          </div>
          <div className="font-serif text-lg text-kinari mb-2">気持ちを届ける</div>
          <p className="text-xs text-kinari/55">
            遠方からでも神社に感謝・決意を届けられるオンライン奉納。
          </p>
        </Link>
      </section>

      {/* 金の区切り線画像 */}
      <div
        className="my-10 h-6 w-full opacity-60"
        style={{
          backgroundImage: "url('/assets/shrine/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8826%E6%97%A5%2019_31_08%20(3).png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden="true"
      />

      <footer className="border-t border-shrine-gold/15 pt-6 pb-8 text-center text-xs text-kinari/35">
        <p>Shrine Map of Japan · 参拝の記録と支援の場</p>
      </footer>
    </main>
  );
}
