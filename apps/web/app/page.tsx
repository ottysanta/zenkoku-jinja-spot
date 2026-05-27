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

/* ── セクションヘッダー共通コンポーネント ── */
function SectionLabel({ en, ja, right }: { en: string; ja: string; right?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p style={{ color: "#C99B4D", fontSize: "0.6rem", letterSpacing: "0.35em", fontWeight: 600, marginBottom: "6px" }}>{en}</p>
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl" style={{ color: "#fff7e6" }}>{ja}</h2>
        {right}
      </div>
      <div className="mt-3" style={{ height: "1px", background: "linear-gradient(to right, rgba(201,155,77,0.55), transparent)" }} />
    </div>
  );
}

/* コンテンツカードデータ */
const CONTENT_CARDS = [
  {
    href: "/diagnose" as const,
    label: "SHRINE DIAGNOSIS",
    title: "守護神社診断",
    desc: "生年月・お悩みから五行属性と干支タイプを診断。縁深い守護神社を3社ご紹介します。",
    cta: "無料で診断 →",
    accent: "#8B1E27",
    iconBg: "rgba(139,30,39,0.2)",
    iconBorder: "rgba(139,30,39,0.4)",
    iconContent: "gogyou" as const,
  },
  {
    href: "/omikuji" as const,
    label: "DAILY OMIKUJI",
    title: "今日のおみくじ",
    desc: "1日1回引ける守護神からのメッセージ。五行属性に合わせた今日の運勢をお届けします。",
    cta: "おみくじを引く →",
    accent: "#C99B4D",
    iconBg: "rgba(201,155,77,0.15)",
    iconBorder: "rgba(201,155,77,0.4)",
    iconContent: "📜",
  },
  {
    href: "/palm" as const,
    label: "AI PALM READING",
    title: "AI手相鑑定",
    desc: "手のひら写真をアップするだけで、AIが生命線・知能線・感情線・運命線を鑑定。無料3回。",
    cta: "手相を鑑定する →",
    accent: "#7c3aed",
    iconBg: "rgba(124,58,237,0.15)",
    iconBorder: "rgba(124,58,237,0.4)",
    iconContent: "✋",
  },
  {
    href: "/diagnose/compat" as const,
    label: "COMPATIBILITY",
    title: "五行相性診断",
    desc: "木・火・土・金・水の五行属性から、相生・相克でふたりの縁と相性を読み解きます。",
    cta: "相性を診断 →",
    accent: "#1d4ed8",
    iconBg: "rgba(29,78,216,0.15)",
    iconBorder: "rgba(29,78,216,0.4)",
    iconContent: "🔄",
  },
  {
    href: "/worry" as const,
    label: "WORRY DIAGNOSIS",
    title: "悩み別神社診断",
    desc: "職場・恋愛・家族・健康・金運…今のあなたの悩みに縁深い神様と神社をご紹介します。",
    cta: "悩みで探す →",
    accent: "#065f46",
    iconBg: "rgba(6,95,70,0.15)",
    iconBorder: "rgba(6,95,70,0.4)",
    iconContent: "🙏",
  },
] as const;

export default async function HomePage() {
  const total = totalSpots();
  const prefCounts = prefectureCounts();
  const totalPref = prefCounts.length;
  const allPrefs = prefCounts;
  const featured = loadFeatured(8);
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
  const latest = recentlyAddedSpots(6).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    prefecture: r.prefecture,
    photo_url: r.photo_url,
  }));
  const recentComments: RecentCheckin[] = recentCheckins(8);
  const topUsers: FeaturedUser[] = featuredUsers(6);
  const offeringShrines = listOfferingShrines(6);
  const offeringShrineCount = countOfferingShrines();

  return (
    <div style={{ background: "linear-gradient(160deg,#080604 0%,#0e0804 45%,#160d08 100%)", minHeight: "100vh" }}>

      {/* ══════════════════════════════
          1) ヒーロー
      ══════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          minHeight: "clamp(420px, 60vh, 640px)",
          backgroundColor: "#080604",
          backgroundImage: [
            "linear-gradient(to right, rgba(8,6,4,0.96) 0%, rgba(8,6,4,0.85) 35%, rgba(8,6,4,0.42) 62%, rgba(8,6,4,0.18) 100%)",
            "linear-gradient(to top, rgba(8,6,4,0.80) 0%, transparent 35%)",
            "url('/assets/shrine/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8826%E6%97%A5%2019_31_07%20(1).png')",
          ].join(","),
          backgroundSize: "cover",
          backgroundPosition: "center 25%",
        }}
      >
        {/* 上端 金ライン */}
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(201,155,77,0.5), transparent)" }} />

        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="flex flex-col justify-center py-16 md:py-24" style={{ maxWidth: "560px" }}>

            <p style={{ color: "#C99B4D", fontSize: "0.62rem", letterSpacing: "0.42em", fontWeight: 600, marginBottom: "20px", textTransform: "uppercase" }}>
              本当の自分で生きたい方へ
            </p>

            <h1
              className="font-serif"
              style={{ color: "#fff7e6", fontSize: "clamp(1.9rem, 4.5vw, 3.2rem)", lineHeight: 1.28, marginBottom: "16px" }}
            >
              あなたの守護神社を<br />見つける
            </h1>

            {/* 金の装飾ライン */}
            <div style={{ width: "56px", height: "2px", background: "linear-gradient(to right, #C99B4D, transparent)", marginBottom: "20px" }} />

            <p style={{ color: "rgba(216,199,165,0.82)", fontSize: "0.88rem", lineHeight: 1.9, fontWeight: 300, marginBottom: "36px" }}>
              生年月日から五行属性・干支・誕生数を診断。<br />
              縁深い守護神社と、神様からのメッセージをお届けします。
            </p>

            {/* CTAボタン群 */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                href="/diagnose"
                className="inline-flex items-center gap-2 font-bold text-white transition-opacity hover:opacity-90 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #9b2029 0%, #6a1520 100%)",
                  border: "1px solid rgba(201,155,77,0.45)",
                  borderRadius: "4px",
                  padding: "14px 28px",
                  fontSize: "0.9rem",
                  boxShadow: "0 4px 24px rgba(139,30,39,0.5)",
                  minHeight: "52px",
                }}
              >
                ⛩ 守護神社診断を受ける（無料）
              </Link>

              <Link
                href="/omikuji"
                className="inline-flex items-center gap-2 font-semibold transition-opacity hover:opacity-80"
                style={{
                  border: "1px solid #C99B4D",
                  borderRadius: "4px",
                  padding: "14px 22px",
                  fontSize: "0.88rem",
                  color: "#C99B4D",
                  background: "rgba(8,6,4,0.65)",
                  minHeight: "52px",
                }}
              >
                📜 今日のおみくじ
              </Link>
            </div>

            {/* サマリバッジ */}
            <div className="flex flex-wrap gap-3 text-xs">
              {[
                { val: total.toLocaleString(), unit: "社収録" },
                { val: String(totalPref), unit: "/ 47 都道府県" },
              ].map(({ val, unit }) => (
                <span
                  key={unit}
                  className="inline-flex items-center gap-1.5"
                  style={{
                    border: "1px solid rgba(201,155,77,0.32)",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    background: "rgba(27,16,9,0.7)",
                    color: "rgba(216,199,165,0.8)",
                  }}
                >
                  <b style={{ color: "#C99B4D" }}>{val}</b>{unit}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 下端 金ライン */}
        <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(201,155,77,0.4), transparent)" }} />
      </section>

      {/* ページ本体 */}
      <main className="mx-auto max-w-6xl px-4 md:px-6">

        {/* ══════════════════════════════
            1.2) 神社体験コンテンツ
        ══════════════════════════════ */}
        <section className="py-16 md:py-20">
          <SectionLabel en="CONTENTS" ja="神社体験コンテンツ" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CONTENT_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="shrine-card flex flex-col p-5"
                style={{
                  background: "#1b1009",
                  border: "1px solid rgba(201,155,77,0.35)",
                  borderRadius: "12px",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
                }}
              >
                {/* アイコン */}
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: card.iconBg, border: `1px solid ${card.iconBorder}` }}
                >
                  {card.iconContent === "gogyou" ? (
                    <div className="flex gap-0.5">
                      {(["木","火","土","金","水"] as const).map((el, i) => (
                        <span key={el} className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ${["bg-emerald-600","bg-orange-600","bg-amber-600","bg-slate-500","bg-blue-600"][i]}`}>{el}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xl">{card.iconContent}</span>
                  )}
                </div>

                <p style={{ color: "#C99B4D", fontSize: "9px", letterSpacing: "0.25em", fontWeight: 600, marginBottom: "6px" }}>{card.label}</p>
                <h3 className="font-serif text-base mb-2" style={{ color: "#fff7e6" }}>{card.title}</h3>
                <p className="text-[11px] leading-relaxed mb-4 flex-1" style={{ color: "rgba(216,199,165,0.55)" }}>{card.desc}</p>
                <span
                  className="inline-flex items-center text-[11px] font-semibold"
                  style={{
                    background: card.accent === "#C99B4D" ? "transparent" : `${card.accent}cc`,
                    border: card.accent === "#C99B4D" ? "1px solid rgba(201,155,77,0.5)" : "none",
                    color: card.accent === "#C99B4D" ? "#C99B4D" : "white",
                    borderRadius: "4px",
                    padding: "5px 12px",
                    width: "fit-content",
                  }}
                >
                  {card.cta}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════
            1.5) 注目の神社
        ══════════════════════════════ */}
        {spotlight.length > 0 ? (
          <section className="pb-16 md:pb-20">
            <SectionLabel
              en="SPOTLIGHT"
              ja="✨ 注目の神社"
              right={<span style={{ fontSize: "0.7rem", color: "rgba(216,199,165,0.5)" }}>訪問ごとに更新</span>}
            />
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {spotlight.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                    className="shrine-card-sm group relative block overflow-hidden"
                    style={{ aspectRatio: "3/4", borderRadius: "14px", border: "1px solid rgba(201,155,77,0.32)" }}
                  >
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.photo_url}
                        alt={s.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-4xl" style={{ background: "linear-gradient(135deg,#1b1009,#2e1912,#1b1009)", opacity: 0.4 }}>⛩</div>
                    )}
                    <div
                      className="absolute inset-x-0 bottom-0 p-3"
                      style={{ background: "linear-gradient(to top, rgba(8,6,4,0.92) 0%, rgba(8,6,4,0.55) 55%, transparent 100%)" }}
                    >
                      <p className="font-semibold text-sm drop-shadow" style={{ color: "#fff7e6" }}>{s.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(216,199,165,0.7)" }}>
                        {[s.prefecture, s.shrine_type].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ══════════════════════════════
            1.8) オンライン志納
        ══════════════════════════════ */}
        {offeringShrines.length > 0 ? (
          <section
            className="mb-16 md:mb-20 p-6 md:p-8"
            style={{ background: "#1b1009", border: "1px solid rgba(201,155,77,0.35)", borderRadius: "16px" }}
          >
            <div className="mb-5 flex items-baseline justify-between pb-4" style={{ borderBottom: "1px solid rgba(201,155,77,0.25)" }}>
              <h2 className="font-serif text-xl" style={{ color: "#fff7e6" }}>
                🙏 オンライン志納 受付中
                <span className="ml-2 align-middle text-[11px] font-semibold px-2 py-0.5" style={{ background: "#1a4a2a", color: "#6ee7a0", borderRadius: "4px" }}>
                  {offeringShrineCount} 社
                </span>
              </h2>
              <Link href="/offerings/shrines" className="text-xs underline" style={{ color: "#C99B4D" }}>すべて見る →</Link>
            </div>
            <p className="mb-5 text-xs" style={{ color: "rgba(216,199,165,0.55)" }}>
              全国 {total.toLocaleString()} 社のうち、宗教法人登録・受付同意が確認できた
              <b style={{ color: "#C99B4D" }}> {offeringShrineCount} 社</b> のみオンライン志納に対応しています。
            </p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {offeringShrines.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                    className="shrine-sub-card block overflow-hidden"
                    style={{ background: "#24130b", border: "1px solid rgba(201,155,77,0.3)", borderRadius: "10px" }}
                  >
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photo_url} alt={s.name} loading="lazy" className="h-20 w-full object-cover" />
                    ) : (
                      <div className="h-20 w-full flex items-center justify-center text-2xl" style={{ background: "#1b1009", opacity: 0.3 }}>⛩</div>
                    )}
                    <div className="p-2">
                      <p className="line-clamp-1 text-[12px] font-semibold" style={{ color: "#fff7e6" }}>{s.name}</p>
                      <p className="line-clamp-1 text-[10px]" style={{ color: "rgba(216,199,165,0.5)" }}>{s.prefecture ?? "—"}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      {/* ══════════════════════════════
          2) ご利益カテゴリ（フルブリード赤帯）
      ══════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundColor: "#4a0e14",
          backgroundImage: [
            "linear-gradient(to bottom, rgba(8,6,4,0.88) 0%, transparent 18%, transparent 82%, rgba(8,6,4,0.88) 100%)",
            "linear-gradient(135deg, rgba(75,10,18,0.96) 0%, rgba(108,18,28,0.92) 50%, rgba(75,10,18,0.96) 100%)",
            "url('/assets/shrine/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8826%E6%97%A5%2019_31_08%20(2).png')",
          ].join(","),
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(201,155,77,0.4), transparent)" }} />
        <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(201,155,77,0.4), transparent)" }} />

        <div className="mx-auto max-w-6xl px-6 md:px-10 py-16 md:py-20">
          <div className="mb-8">
            <p style={{ color: "#E4C76A", fontSize: "0.6rem", letterSpacing: "0.35em", fontWeight: 600, marginBottom: "6px" }}>BENEFITS</p>
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-2xl" style={{ color: "#fff7e6" }}>ご利益から探す</h2>
              <Link href="/search" className="text-xs underline" style={{ color: "#E4C76A" }}>詳しく探す →</Link>
            </div>
          </div>

          <ul className="grid grid-cols-4 gap-4 lg:grid-cols-8">
            {BENEFIT_PRESETS.map((b) => (
              <li key={b.name}>
                <Link
                  href={`/search?benefit=${encodeURIComponent(b.name)}`}
                  className="shrine-benefit-btn flex flex-col items-center justify-center gap-2 text-center"
                  style={{
                    borderRadius: "50%",
                    border: "1.5px solid rgba(201,155,77,0.45)",
                    background: "rgba(18,6,10,0.68)",
                    aspectRatio: "1",
                    padding: "12px 8px",
                  }}
                >
                  <div style={{ fontSize: "1.2rem" }}>{b.emoji}</div>
                  <div style={{ fontSize: "10px", fontWeight: 500, color: "#f0e0c0", lineHeight: 1.2 }}>{b.name}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 md:px-6">

        {/* ══════════════════════════════
            3) 特集神社カード
        ══════════════════════════════ */}
        {featured.length > 0 ? (
          <section className="py-16 md:py-20">
            <SectionLabel
              en="FEATURED"
              ja="特集神社"
              right={<Link href="/search" className="text-xs underline" style={{ color: "#C99B4D" }}>もっと見る →</Link>}
            />
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                    className="shrine-card group flex h-full flex-col overflow-hidden"
                    style={{ background: "#1b1009", border: "1px solid rgba(201,155,77,0.35)", borderRadius: "14px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
                  >
                    {/* 写真エリア */}
                    <div className="relative overflow-hidden" style={{ height: "180px" }}>
                      {s.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.photo_url}
                          alt={s.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-4xl" style={{ background: "#24130b", opacity: 0.3 }}>⛩</div>
                      )}
                      <div className="absolute inset-x-0 bottom-0" style={{ height: "55%", background: "linear-gradient(to top, rgba(27,16,9,1) 0%, transparent 100%)" }} />
                      <div className="absolute inset-x-0 bottom-0 px-3 pb-2">
                        <h3 className="line-clamp-1 text-sm font-semibold" style={{ color: "#fff7e6" }}>{s.name}</h3>
                      </div>
                    </div>

                    {/* テキストエリア */}
                    <div className="flex flex-1 flex-col gap-1 p-3 pt-2" style={{ borderTop: "1px solid rgba(201,155,77,0.22)" }}>
                      <p className="line-clamp-1 text-[11px]" style={{ color: "rgba(216,199,165,0.5)" }}>
                        {[s.prefecture, s.shrine_type, s.shrine_rank].filter(Boolean).join(" / ") || "—"}
                      </p>
                      {s.description ? (
                        <p className="line-clamp-2 text-[11px] leading-relaxed" style={{ color: "rgba(216,199,165,0.62)" }}>
                          {s.description.slice(0, 70)}{s.description.length > 70 ? "…" : ""}
                        </p>
                      ) : null}
                      {s.benefits.length > 0 ? (
                        <div className="mt-auto flex flex-wrap gap-1 pt-2">
                          {s.benefits.slice(0, 4).map((b) => (
                            <span
                              key={b}
                              className="text-[10px] px-2 py-0.5"
                              style={{ background: "rgba(139,30,39,0.28)", border: "1px solid rgba(201,155,77,0.32)", borderRadius: "4px", color: "#C99B4D" }}
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

        {/* ══════════════════════════════
            4) 都道府県 47 全部
        ══════════════════════════════ */}
        <section className="pb-16 md:pb-20">
          <SectionLabel
            en="PREFECTURE"
            ja="都道府県から探す"
            right={<Link href="/map" className="text-xs underline" style={{ color: "#C99B4D" }}>地図で見る →</Link>}
          />
          {(() => {
            const maxCount = allPrefs[0]?.count ?? 1;
            return (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {allPrefs.map((r) => {
                  const pct = Math.round((r.count / maxCount) * 100);
                  return (
                    <li key={r.prefecture}>
                      <Link
                        href={`/search?prefecture=${encodeURIComponent(r.prefecture)}`}
                        className="shrine-pref-item group relative block overflow-hidden px-3 py-2.5"
                        style={{ background: "#1b1009", border: "1px solid rgba(201,155,77,0.32)", borderRadius: "8px" }}
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0"
                          style={{ width: `${pct}%`, background: "rgba(139,30,39,0.18)", borderRadius: "8px 0 0 8px" }}
                        />
                        <span className="relative flex items-center justify-between gap-1.5 text-[13px]">
                          <span className="truncate font-medium" style={{ color: "#d8c7a5" }}>{r.prefecture}</span>
                          <span className="shrink-0 tabular-nums text-[11px] font-semibold" style={{ color: "#C99B4D" }}>
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
          <p className="mt-3 text-[11px]" style={{ color: "rgba(216,199,165,0.45)" }}>
            全 {totalPref} 都道府県 / {total.toLocaleString()} 社をカバー
          </p>
        </section>

        {/* ══════════════════════════════
            4.4) 注目ユーザー
        ══════════════════════════════ */}
        {topUsers.length > 0 ? (
          <section className="pb-16 md:pb-20">
            <SectionLabel
              en="COMMUNITY"
              ja="⭐ 注目の参拝者"
              right={<span style={{ fontSize: "0.7rem", color: "rgba(216,199,165,0.5)" }}>「いいね」「参考になった」が多い方</span>}
            />
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {topUsers.map((u, i) => (
                <li
                  key={u.client_id}
                  className="flex items-start gap-3 p-4"
                  style={{ background: "#1b1009", border: "1px solid rgba(201,155,77,0.32)", borderRadius: "12px" }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold"
                    style={{ border: "1px solid rgba(201,155,77,0.45)", background: "rgba(201,155,77,0.1)", color: "#C99B4D" }}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-2 text-sm font-semibold" style={{ color: "#fff7e6" }}>
                      {u.nickname}
                      <span className="text-[10px] px-1.5 py-0.5" style={{ border: "1px solid rgba(201,155,77,0.32)", background: "rgba(201,155,77,0.08)", color: "#C99B4D", borderRadius: "4px" }}>
                        {u.total_reactions} reactions
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px]" style={{ color: "rgba(216,199,165,0.52)" }}>参拝 {u.checkin_count} 回 · 最近: {u.recent_spot_name}</p>
                    {u.recent_comment ? (
                      <p className="mt-1 line-clamp-2 text-[12px]" style={{ color: "rgba(216,199,165,0.7)" }}>「{u.recent_comment}」</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ══════════════════════════════
            4.5) 最近の参拝コメント
        ══════════════════════════════ */}
        {recentComments.length > 0 ? (
          <section className="pb-16 md:pb-20">
            <SectionLabel
              en="VOICES"
              ja="💬 最近の参拝コメント"
              right={<span style={{ fontSize: "0.7rem", color: "rgba(216,199,165,0.5)" }}>参拝者の声</span>}
            />
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {recentComments.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-2 p-4"
                  style={{ background: "#1b1009", border: "1px solid rgba(201,155,77,0.32)", borderRadius: "12px" }}
                >
                  <div className="min-w-0">
                    <Link
                      href={`/shrines/${spotSlug({ id: r.spot_id, slug: r.spot_slug })}`}
                      className="line-clamp-1 text-sm font-semibold hover:underline"
                      style={{ color: "#fff7e6" }}
                    >
                      {r.spot_name}
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]" style={{ color: "rgba(216,199,165,0.52)" }}>
                      {r.spot_prefecture ? <span>{r.spot_prefecture}</span> : null}
                      {r.wish_type ? (
                        <span className="text-[10px] px-2 py-0.5" style={{ border: "1px solid rgba(201,155,77,0.32)", background: "rgba(201,155,77,0.08)", color: "#C99B4D", borderRadius: "4px" }}>
                          {({ gratitude: "感謝", vow: "決意", milestone: "節目", thanks: "お礼", other: "その他" } as Record<string, string>)[r.wish_type] || r.wish_type}
                        </span>
                      ) : null}
                    </p>
                    {r.comment ? (
                      <p className="mt-1 line-clamp-2 text-[12px]" style={{ color: "rgba(216,199,165,0.7)" }}>「{r.comment}」</p>
                    ) : (
                      <p className="mt-1 text-[12px]" style={{ color: "rgba(216,199,165,0.45)" }}>{r.nickname || "匿名さん"} が参拝しました</p>
                    )}
                    <div className="mt-1.5">
                      <ReactionButtons checkinId={r.id} compact />
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px]" style={{ color: "rgba(216,199,165,0.45)" }}>{formatRel(r.created_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="pb-16 md:pb-20">
            <SectionLabel en="VOICES" ja="💬 最近の参拝コメント" />
            <p className="p-5 text-xs" style={{ border: "1px dashed rgba(201,155,77,0.28)", background: "#1b1009", borderRadius: "12px", color: "rgba(216,199,165,0.5)" }}>
              まだ参拝コメントがありません。<Link href="/map" style={{ color: "#C99B4D" }} className="underline">地図</Link>から参拝した神社にチェックインしてみましょう。
            </p>
          </section>
        )}

        {/* ══════════════════════════════
            4.7) 新着神社
        ══════════════════════════════ */}
        {latest.length > 0 ? (
          <section className="pb-16 md:pb-20">
            <SectionLabel
              en="NEW"
              ja="🆕 新しく追加された神社"
              right={<span style={{ fontSize: "0.7rem", color: "rgba(216,199,165,0.5)" }}>全 {total.toLocaleString()} 社の中から</span>}
            />
            <ul className="flex gap-4 overflow-x-auto pb-3">
              {latest.map((s) => (
                <li key={s.id} className="w-44 shrink-0">
                  <Link
                    href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                    className="shrine-sub-card block overflow-hidden"
                    style={{ background: "#1b1009", border: "1px solid rgba(201,155,77,0.32)", borderRadius: "12px" }}
                  >
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photo_url} alt={s.name} loading="lazy" className="h-28 w-full object-cover" />
                    ) : (
                      <div className="h-28 w-full flex items-center justify-center text-3xl" style={{ background: "#24130b", opacity: 0.25 }}>⛩</div>
                    )}
                    <div className="p-2.5">
                      <p className="line-clamp-1 text-[12px] font-semibold" style={{ color: "#fff7e6" }}>{s.name}</p>
                      <p className="line-clamp-1 text-[10px]" style={{ color: "rgba(216,199,165,0.5)" }}>{s.prefecture ?? "—"}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ══════════════════════════════
            5) 学ぶ / 気持ちを届ける
        ══════════════════════════════ */}
        <section className="pb-16 md:pb-20 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { href: "/learn" as const, label: "📖 LEARN", title: "神社を学ぶ", desc: "参拝マナー・御朱印・祭神系譜・社格などの基礎知識。" },
            { href: "/offerings" as const, label: "🙏 OFFERINGS", title: "気持ちを届ける", desc: "遠方からでも神社に感謝・決意を届けられるオンライン奉納。" },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="shrine-sub-card block px-7 py-7"
              style={{ background: "#1b1009", border: "1px solid rgba(201,155,77,0.35)", borderRadius: "14px" }}
            >
              <div style={{ fontSize: "10px", letterSpacing: "0.3em", fontWeight: 700, color: "#C99B4D", marginBottom: "10px" }}>{card.label}</div>
              <div className="font-serif text-lg mb-2" style={{ color: "#fff7e6" }}>{card.title}</div>
              <p className="text-xs" style={{ color: "rgba(216,199,165,0.55)" }}>{card.desc}</p>
            </Link>
          ))}
        </section>

        {/* フッター */}
        <footer className="pb-8 pt-6 text-center text-xs" style={{ borderTop: "1px solid rgba(201,155,77,0.2)", color: "rgba(216,199,165,0.4)" }}>
          <p>Shrine Map of Japan · 参拝の記録と支援の場</p>
        </footer>
      </main>
    </div>
  );
}
