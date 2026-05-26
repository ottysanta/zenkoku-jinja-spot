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

/* ─── 共通スタイル定数 ─── */
const C = {
  heading:   "#fff7e6",
  body:      "#d8c7a5",
  sub:       "rgba(216,199,165,0.55)",
  gold:      "#C99B4D",
  goldBorder:"rgba(201,155,77,0.35)",
  card:      "#1b1009",
  cardHover: "#241309",
  red:       "#8B1E27",
  redLight:  "#a82531",
  pageBg:    "linear-gradient(160deg,#080604 0%,#0e0804 45%,#160d08 100%)",
  sectionBg: "#0f0904",
};

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
    <div style={{ background: C.pageBg, minHeight: "100vh" }}>
      {/* ══════════════════════════════════════
          1) ヒーロー
      ══════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          minHeight: "560px",
          backgroundColor: "#080604",
          backgroundImage: [
            /* 左側テキストエリアを暗く、右に向かって透明に */
            "linear-gradient(to right, rgba(8,6,4,0.95) 0%, rgba(8,6,4,0.82) 38%, rgba(8,6,4,0.45) 65%, rgba(8,6,4,0.2) 100%)",
            /* 下部を暗く（文字読みやすさ確保） */
            "linear-gradient(to top, rgba(8,6,4,0.85) 0%, transparent 40%)",
            /* 神社写真 */
            "url('/assets/shrine/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8826%E6%97%A5%2019_31_07%20(1).png')",
          ].join(","),
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
        }}
      >
        {/* 金の細枠装飾（上端のみ） */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${C.gold}66, transparent)` }}
        />

        {/* コンテンツ左寄せ */}
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <div className="flex flex-col justify-center py-16 md:py-24 md:max-w-[52%]">

            {/* 小見出し */}
            <p
              className="text-[0.65rem] tracking-[0.4em] font-semibold uppercase mb-5"
              style={{ color: C.gold }}
            >
              本当の自分で生きたい方へ
            </p>

            {/* メインコピー */}
            <h1
              className="font-serif leading-[1.25] mb-4"
              style={{ color: C.heading, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
            >
              あなたの守護神社を<br />見つける
            </h1>

            {/* 金の装飾ライン */}
            <div
              className="mb-5"
              style={{
                width: "64px",
                height: "2px",
                background: `linear-gradient(to right, ${C.gold}, transparent)`,
              }}
            />

            {/* サブコピー */}
            <p
              className="text-sm leading-[1.9] mb-10 font-light"
              style={{ color: C.body, fontWeight: 300 }}
            >
              生年月日から五行属性・干支・誕生数を診断。<br />
              縁深い守護神社と、神様からのメッセージをお届けします。
            </p>

            {/* 主 CTA */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                href="/diagnose"
                className="inline-flex min-h-[52px] items-center gap-2 px-8 py-3 text-sm font-bold text-white transition active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${C.red} 0%, #6a1520 100%)`,
                  border: `1px solid rgba(201,155,77,0.4)`,
                  borderRadius: "4px",
                  boxShadow: "0 4px 24px rgba(139,30,39,0.45)",
                }}
              >
                ⛩ 守護神社診断を受ける（無料）
              </Link>

              <Link
                href="/omikuji"
                className="inline-flex min-h-[52px] items-center gap-2 px-6 py-3 text-sm font-semibold transition hover:bg-white/5"
                style={{
                  border: `1px solid ${C.gold}`,
                  borderRadius: "4px",
                  color: C.gold,
                  background: "rgba(8,6,4,0.6)",
                }}
              >
                📜 今日のおみくじ
              </Link>
            </div>

            {/* サマリバッジ */}
            <div className="flex flex-wrap gap-3 text-xs">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5"
                style={{
                  border: `1px solid ${C.goldBorder}`,
                  borderRadius: "4px",
                  background: "rgba(27,16,9,0.7)",
                  color: C.body,
                }}
              >
                <b style={{ color: C.gold }}>{total.toLocaleString()}</b> 社収録
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5"
                style={{
                  border: `1px solid ${C.goldBorder}`,
                  borderRadius: "4px",
                  background: "rgba(27,16,9,0.7)",
                  color: C.body,
                }}
              >
                <b style={{ color: C.gold }}>{totalPref}</b> / 47 都道府県
              </span>
            </div>
          </div>
        </div>

        {/* 下端の金ライン */}
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${C.gold}44, transparent)` }}
        />
      </section>

      {/* ページ本体 */}
      <main className="mx-auto max-w-6xl px-4 md:px-6">

        {/* ══════════════════════════════════════
            1.2) 神社体験コンテンツ（5カード横並び）
        ══════════════════════════════════════ */}
        <section className="py-16 md:py-20">
          {/* セクションヘッダー */}
          <div className="mb-8">
            <p className="text-[0.6rem] tracking-[0.35em] mb-2 font-semibold" style={{ color: C.gold }}>CONTENTS</p>
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-2xl" style={{ color: C.heading }}>神社体験コンテンツ</h2>
            </div>
            <div className="mt-3 h-px" style={{ background: `linear-gradient(to right, ${C.gold}55, transparent)` }} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                href: "/diagnose",
                label: "SHRINE DIAGNOSIS",
                title: "守護神社診断",
                desc: "生年月・お悩みから五行属性と干支タイプを診断。縁深い守護神社を3社ご紹介します。",
                cta: "無料で診断 →",
                icon: (
                  <div className="flex gap-0.5">
                    {(["木","火","土","金","水"] as const).map((el, i) => (
                      <span key={el} className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${["bg-emerald-600","bg-orange-600","bg-amber-600","bg-slate-500","bg-blue-600"][i]}`}>{el}</span>
                    ))}
                  </div>
                ),
                accentColor: C.red,
              },
              {
                href: "/omikuji",
                label: "DAILY OMIKUJI",
                title: "今日のおみくじ",
                desc: "1日1回引ける守護神からのメッセージ。五行属性に合わせた今日の運勢をお届けします。",
                cta: "おみくじを引く →",
                icon: <span className="text-2xl">📜</span>,
                accentColor: C.gold,
              },
              {
                href: "/palm",
                label: "AI PALM READING",
                title: "AI手相鑑定",
                desc: "手のひら写真をアップするだけで、AIが生命線・知能線・感情線・運命線を鑑定。無料3回。",
                cta: "手相を鑑定する →",
                icon: <span className="text-2xl">✋</span>,
                accentColor: "#7c3aed",
              },
              {
                href: "/diagnose/compat",
                label: "COMPATIBILITY",
                title: "五行相性診断",
                desc: "木・火・土・金・水の五行属性から、相生・相克でふたりの縁と相性を読み解きます。",
                cta: "相性を診断 →",
                icon: <span className="text-2xl">🔄</span>,
                accentColor: "#1d4ed8",
              },
              {
                href: "/worry",
                label: "WORRY DIAGNOSIS",
                title: "悩み別神社診断",
                desc: "職場・恋愛・家族・健康・金運…今のあなたの悩みに縁深い神様と神社をご紹介します。",
                cta: "悩みで探す →",
                icon: <span className="text-2xl">🙏</span>,
                accentColor: "#065f46",
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group flex flex-col p-5 transition-all duration-300"
                style={{
                  background: C.card,
                  border: `1px solid ${C.goldBorder}`,
                  borderRadius: "12px",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.border = `1px solid rgba(201,155,77,0.65)`;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px rgba(0,0,0,0.5), 0 0 20px rgba(201,155,77,0.08)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.border = `1px solid ${C.goldBorder}`;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.4)";
                }}
              >
                {/* アイコン背景 */}
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: `${card.accentColor}22`, border: `1px solid ${card.accentColor}44` }}
                >
                  {card.icon}
                </div>
                <p className="text-[9px] tracking-[0.25em] mb-2 font-semibold" style={{ color: C.gold }}>{card.label}</p>
                <h3 className="font-serif text-base mb-2" style={{ color: C.heading }}>{card.title}</h3>
                <p className="text-[11px] leading-relaxed mb-4 flex-1" style={{ color: C.sub }}>{card.desc}</p>
                <span
                  className="inline-flex items-center text-[11px] font-semibold"
                  style={{ color: card.accentColor === C.gold ? C.gold : "white",
                    background: card.accentColor === C.gold ? "transparent" : card.accentColor + "cc",
                    border: card.accentColor === C.gold ? `1px solid ${C.gold}66` : "none",
                    borderRadius: "4px",
                    padding: "4px 12px",
                    width: "fit-content",
                  }}
                >
                  {card.cta}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════
            1.5) 注目の神社（ランダム 4 枚）
        ══════════════════════════════════════ */}
        {spotlight.length > 0 ? (
          <section className="py-4 pb-16 md:pb-20">
            <div className="mb-8">
              <p className="text-[0.6rem] tracking-[0.35em] mb-2 font-semibold" style={{ color: C.gold }}>SPOTLIGHT</p>
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-2xl" style={{ color: C.heading }}>✨ 注目の神社</h2>
                <span className="text-xs" style={{ color: C.sub }}>訪問ごとに更新</span>
              </div>
              <div className="mt-3 h-px" style={{ background: `linear-gradient(to right, ${C.gold}55, transparent)` }} />
            </div>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {spotlight.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                    className="group relative block aspect-[3/4] overflow-hidden"
                    style={{ borderRadius: "14px", border: `1px solid ${C.goldBorder}` }}
                  >
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.photo_url}
                        alt={s.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                        style={{ transition: "transform 0.7s ease" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : null}
                    {/* 画像なしフォールバック */}
                    {!s.photo_url && (
                      <div
                        className="h-full w-full"
                        style={{ background: `linear-gradient(135deg, #1b1009 0%, #2e1912 50%, #1b1009 100%)` }}
                      >
                        <div className="flex h-full items-center justify-center text-4xl opacity-30">⛩</div>
                      </div>
                    )}
                    {/* 下部グラデーション + テキスト */}
                    <div
                      className="absolute inset-x-0 bottom-0 p-3"
                      style={{ background: "linear-gradient(to top, rgba(8,6,4,0.92) 0%, rgba(8,6,4,0.6) 50%, transparent 100%)" }}
                    >
                      <p className="font-semibold text-sm drop-shadow" style={{ color: C.heading }}>{s.name}</p>
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

        {/* ══════════════════════════════════════
            1.8) オンライン志納 受付中
        ══════════════════════════════════════ */}
        {offeringShrines.length > 0 ? (
          <section
            className="mb-16 md:mb-20 p-6 md:p-8"
            style={{ background: C.card, border: `1px solid ${C.goldBorder}`, borderRadius: "16px" }}
          >
            <div className="mb-5 flex items-baseline justify-between pb-4" style={{ borderBottom: `1px solid ${C.goldBorder}` }}>
              <h2 className="font-serif text-xl" style={{ color: C.heading }}>
                🙏 オンライン志納 受付中
                <span
                  className="ml-2 align-middle text-[11px] font-semibold px-2 py-0.5"
                  style={{ background: "#1a4a2a", color: "#6ee7a0", borderRadius: "4px" }}
                >
                  {offeringShrineCount} 社
                </span>
              </h2>
              <Link href="/offerings/shrines" className="text-xs underline" style={{ color: C.gold }}>
                すべて見る →
              </Link>
            </div>
            <p className="mb-5 text-xs" style={{ color: C.sub }}>
              全国 {total.toLocaleString()} 社のうち、宗教法人登録・受付同意が確認できた
              <b style={{ color: C.gold }}> {offeringShrineCount} 社</b> のみオンライン志納に対応しています。
            </p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {offeringShrines.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                    className="block overflow-hidden transition hover:opacity-90"
                    style={{ background: "#24130b", border: `1px solid ${C.goldBorder}`, borderRadius: "10px" }}
                  >
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photo_url} alt={s.name} loading="lazy" className="h-20 w-full object-cover" />
                    ) : (
                      <div className="h-20 w-full flex items-center justify-center text-2xl opacity-20" style={{ background: "#1b1009" }}>⛩</div>
                    )}
                    <div className="p-2">
                      <p className="line-clamp-1 text-[12px] font-semibold" style={{ color: C.heading }}>{s.name}</p>
                      <p className="line-clamp-1 text-[10px]" style={{ color: C.sub }}>{s.prefecture ?? "—"}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      {/* ══════════════════════════════════════
          2) ご利益カテゴリ（フルブリード赤帯）
      ══════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundColor: "#4a0e14",
          backgroundImage: [
            "linear-gradient(to bottom, rgba(8,6,4,0.85) 0%, transparent 20%, transparent 80%, rgba(8,6,4,0.85) 100%)",
            "linear-gradient(135deg, rgba(80,10,18,0.97) 0%, rgba(110,18,28,0.93) 50%, rgba(80,10,18,0.97) 100%)",
            "url('/assets/shrine/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8826%E6%97%A5%2019_31_08%20(2).png')",
          ].join(","),
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* 上下の金ライン */}
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${C.gold}44, transparent)` }} />
        <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${C.gold}44, transparent)` }} />

        <div className="mx-auto max-w-6xl px-6 md:px-10 py-16 md:py-20">
          <div className="mb-8">
            <p className="text-[0.6rem] tracking-[0.35em] mb-2 font-semibold" style={{ color: "#E4C76A" }}>BENEFITS</p>
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
                  className="group flex flex-col items-center gap-2 py-5 px-2 text-center transition-all duration-300"
                  style={{
                    borderRadius: "50%",
                    border: "1.5px solid rgba(201,155,77,0.5)",
                    background: "rgba(20,8,12,0.65)",
                    aspectRatio: "1",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.border = "1.5px solid rgba(201,155,77,0.9)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(30,10,15,0.8)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(201,155,77,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.border = "1.5px solid rgba(201,155,77,0.5)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(20,8,12,0.65)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div className="text-xl">{b.emoji}</div>
                  <div className="text-[10px] font-medium leading-tight" style={{ color: "#f0e0c0" }}>{b.name}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 md:px-6">

        {/* ══════════════════════════════════════
            3) 特集神社カード
        ══════════════════════════════════════ */}
        {featured.length > 0 ? (
          <section className="py-16 md:py-20">
            <div className="mb-8">
              <p className="text-[0.6rem] tracking-[0.35em] mb-2 font-semibold" style={{ color: C.gold }}>FEATURED</p>
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-2xl" style={{ color: C.heading }}>特集神社</h2>
                <Link href="/search" className="text-xs underline" style={{ color: C.gold }}>もっと見る →</Link>
              </div>
              <div className="mt-3 h-px" style={{ background: `linear-gradient(to right, ${C.gold}55, transparent)` }} />
            </div>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                    className="group flex h-full flex-col overflow-hidden transition-all duration-300"
                    style={{
                      background: C.card,
                      border: `1px solid ${C.goldBorder}`,
                      borderRadius: "14px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.border = `1px solid rgba(201,155,77,0.6)`;
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 36px rgba(0,0,0,0.55)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.border = `1px solid ${C.goldBorder}`;
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.4)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                  >
                    {/* 写真エリア */}
                    <div className="relative overflow-hidden" style={{ height: "180px" }}>
                      {s.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.photo_url}
                          alt={s.name}
                          className="h-full w-full object-cover transition-transform duration-700"
                          style={{ transition: "transform 0.7s ease" }}
                          loading="lazy"
                          onMouseEnter={(e) => { (e.target as HTMLImageElement).style.transform = "scale(1.06)"; }}
                          onMouseLeave={(e) => { (e.target as HTMLImageElement).style.transform = "scale(1)"; }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-5xl opacity-20" style={{ background: "#24130b" }}>⛩</div>
                      )}
                      {/* 写真下グラデーション */}
                      <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: "linear-gradient(to top, rgba(27,16,9,1) 0%, transparent 100%)" }} />
                      {/* 神社名オーバーレイ */}
                      <div className="absolute inset-x-0 bottom-0 px-3 pb-2">
                        <h3 className="line-clamp-1 text-sm font-semibold" style={{ color: C.heading }}>{s.name}</h3>
                      </div>
                    </div>

                    {/* テキストエリア */}
                    <div
                      className="flex flex-1 flex-col gap-1 p-3 pt-2"
                      style={{ borderTop: `1px solid ${C.goldBorder}` }}
                    >
                      <p className="line-clamp-1 text-[11px]" style={{ color: C.sub }}>
                        {[s.prefecture, s.shrine_type, s.shrine_rank].filter(Boolean).join(" / ") || "—"}
                      </p>
                      {s.description ? (
                        <p className="line-clamp-2 text-[11px] leading-relaxed" style={{ color: "rgba(216,199,165,0.65)" }}>
                          {s.description.slice(0, 70)}{s.description.length > 70 ? "…" : ""}
                        </p>
                      ) : null}
                      {s.benefits.length > 0 ? (
                        <div className="mt-auto flex flex-wrap gap-1 pt-2">
                          {s.benefits.slice(0, 4).map((b) => (
                            <span
                              key={b}
                              className="text-[10px] px-2 py-0.5"
                              style={{
                                background: "rgba(139,30,39,0.25)",
                                border: "1px solid rgba(201,155,77,0.35)",
                                borderRadius: "4px",
                                color: C.gold,
                              }}
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

        {/* ══════════════════════════════════════
            4) 都道府県 47 全部
        ══════════════════════════════════════ */}
        <section className="pb-16 md:pb-20">
          <div className="mb-8">
            <p className="text-[0.6rem] tracking-[0.35em] mb-2 font-semibold" style={{ color: C.gold }}>PREFECTURE</p>
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-2xl" style={{ color: C.heading }}>都道府県から探す</h2>
              <Link href="/map" className="text-xs underline" style={{ color: C.gold }}>地図で見る →</Link>
            </div>
            <div className="mt-3 h-px" style={{ background: `linear-gradient(to right, ${C.gold}55, transparent)` }} />
          </div>
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
                        className="group relative block overflow-hidden px-3 py-2.5 transition-all"
                        style={{
                          background: C.card,
                          border: `1px solid ${C.goldBorder}`,
                          borderRadius: "8px",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "#2e1812";
                          (e.currentTarget as HTMLElement).style.border = `1px solid rgba(201,155,77,0.55)`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = C.card;
                          (e.currentTarget as HTMLElement).style.border = `1px solid ${C.goldBorder}`;
                        }}
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0"
                          style={{ width: `${pct}%`, background: "rgba(139,30,39,0.18)", borderRadius: "8px 0 0 8px" }}
                        />
                        <span className="relative flex items-center justify-between gap-1.5 text-[13px]">
                          <span className="truncate font-medium" style={{ color: C.body }}>{r.prefecture}</span>
                          <span className="shrink-0 tabular-nums text-[11px] font-semibold" style={{ color: C.gold }}>
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
          <p className="mt-3 text-[11px]" style={{ color: C.sub }}>
            全 {totalPref} 都道府県 / {total.toLocaleString()} 社をカバー
          </p>
        </section>

        {/* ══════════════════════════════════════
            4.4) 注目ユーザー
        ══════════════════════════════════════ */}
        {topUsers.length > 0 ? (
          <section className="pb-16 md:pb-20">
            <div className="mb-8">
              <p className="text-[0.6rem] tracking-[0.35em] mb-2 font-semibold" style={{ color: C.gold }}>COMMUNITY</p>
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-2xl" style={{ color: C.heading }}>⭐ 注目の参拝者</h2>
                <span className="text-xs" style={{ color: C.sub }}>コメントに「いいね」「参考になった」が多い方</span>
              </div>
              <div className="mt-3 h-px" style={{ background: `linear-gradient(to right, ${C.gold}55, transparent)` }} />
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {topUsers.map((u, i) => (
                <li
                  key={u.client_id}
                  className="flex items-start gap-3 p-4"
                  style={{ background: C.card, border: `1px solid ${C.goldBorder}`, borderRadius: "12px" }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold"
                    style={{ border: `1px solid rgba(201,155,77,0.5)`, background: "rgba(201,155,77,0.1)", color: C.gold }}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-2 text-sm font-semibold" style={{ color: C.heading }}>
                      {u.nickname}
                      <span
                        className="text-[10px] px-1.5 py-0.5"
                        style={{ border: `1px solid ${C.goldBorder}`, background: "rgba(201,155,77,0.08)", color: C.gold, borderRadius: "4px" }}
                      >
                        {u.total_reactions} reactions
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px]" style={{ color: C.sub }}>参拝 {u.checkin_count} 回 · 最近: {u.recent_spot_name}</p>
                    {u.recent_comment ? (
                      <p className="mt-1 line-clamp-2 text-[12px]" style={{ color: "rgba(216,199,165,0.7)" }}>「{u.recent_comment}」</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ══════════════════════════════════════
            4.5) 最近の参拝コメント
        ══════════════════════════════════════ */}
        {recentComments.length > 0 ? (
          <section className="pb-16 md:pb-20">
            <div className="mb-8">
              <p className="text-[0.6rem] tracking-[0.35em] mb-2 font-semibold" style={{ color: C.gold }}>VOICES</p>
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-2xl" style={{ color: C.heading }}>💬 最近の参拝コメント</h2>
                <span className="text-xs" style={{ color: C.sub }}>参拝者の声</span>
              </div>
              <div className="mt-3 h-px" style={{ background: `linear-gradient(to right, ${C.gold}55, transparent)` }} />
            </div>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {recentComments.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-2 p-4"
                  style={{ background: C.card, border: `1px solid ${C.goldBorder}`, borderRadius: "12px" }}
                >
                  <div className="min-w-0">
                    <Link
                      href={`/shrines/${spotSlug({ id: r.spot_id, slug: r.spot_slug })}`}
                      className="line-clamp-1 text-sm font-semibold hover:underline"
                      style={{ color: C.heading }}
                    >
                      {r.spot_name}
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]" style={{ color: C.sub }}>
                      {r.spot_prefecture ? <span>{r.spot_prefecture}</span> : null}
                      {r.wish_type ? (
                        <span
                          className="text-[10px] px-2 py-0.5"
                          style={{ border: `1px solid ${C.goldBorder}`, background: "rgba(201,155,77,0.08)", color: C.gold, borderRadius: "4px" }}
                        >
                          {({ gratitude: "感謝", vow: "決意", milestone: "節目", thanks: "お礼", other: "その他" } as Record<string, string>)[r.wish_type] || r.wish_type}
                        </span>
                      ) : null}
                    </p>
                    {r.comment ? (
                      <p className="mt-1 line-clamp-2 text-[12px]" style={{ color: "rgba(216,199,165,0.7)" }}>「{r.comment}」</p>
                    ) : (
                      <p className="mt-1 text-[12px]" style={{ color: C.sub }}>{r.nickname || "匿名さん"} が参拝しました</p>
                    )}
                    <div className="mt-1.5">
                      <ReactionButtons checkinId={r.id} compact />
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px]" style={{ color: C.sub }}>{formatRel(r.created_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="pb-16 md:pb-20">
            <div className="mb-8">
              <p className="text-[0.6rem] tracking-[0.35em] mb-2 font-semibold" style={{ color: C.gold }}>VOICES</p>
              <h2 className="font-serif text-2xl" style={{ color: C.heading }}>💬 最近の参拝コメント</h2>
              <div className="mt-3 h-px" style={{ background: `linear-gradient(to right, ${C.gold}55, transparent)` }} />
            </div>
            <p
              className="p-5 text-xs"
              style={{ border: `1px dashed ${C.goldBorder}`, background: C.card, borderRadius: "12px", color: C.sub }}
            >
              まだ参拝コメントがありません。<Link href="/map" style={{ color: C.gold }} className="underline">地図</Link>から参拝した神社にチェックインしてみましょう。
            </p>
          </section>
        )}

        {/* ══════════════════════════════════════
            4.7) 新着神社
        ══════════════════════════════════════ */}
        {latest.length > 0 ? (
          <section className="pb-16 md:pb-20">
            <div className="mb-8">
              <p className="text-[0.6rem] tracking-[0.35em] mb-2 font-semibold" style={{ color: C.gold }}>NEW</p>
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-2xl" style={{ color: C.heading }}>🆕 新しく追加された神社</h2>
                <span className="text-xs" style={{ color: C.sub }}>全 {total.toLocaleString()} 社の中から</span>
              </div>
              <div className="mt-3 h-px" style={{ background: `linear-gradient(to right, ${C.gold}55, transparent)` }} />
            </div>
            <ul className="flex gap-4 overflow-x-auto pb-3">
              {latest.map((s) => (
                <li key={s.id} className="w-44 shrink-0">
                  <Link
                    href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                    className="block overflow-hidden transition hover:opacity-90"
                    style={{ background: C.card, border: `1px solid ${C.goldBorder}`, borderRadius: "12px" }}
                  >
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photo_url ?? ""} alt={s.name} loading="lazy" className="h-28 w-full object-cover" />
                    ) : (
                      <div className="h-28 w-full flex items-center justify-center text-3xl opacity-20" style={{ background: "#24130b" }}>⛩</div>
                    )}
                    <div className="p-2.5">
                      <p className="line-clamp-1 text-[12px] font-semibold" style={{ color: C.heading }}>{s.name}</p>
                      <p className="line-clamp-1 text-[10px]" style={{ color: C.sub }}>{s.prefecture ?? "—"}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ══════════════════════════════════════
            5) 学ぶ / 気持ちを届ける
        ══════════════════════════════════════ */}
        <section className="pb-16 md:pb-20 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { href: "/learn", label: "📖 LEARN", title: "神社を学ぶ", desc: "参拝マナー・御朱印・祭神系譜・社格などの基礎知識。" },
            { href: "/offerings", label: "🙏 OFFERINGS", title: "気持ちを届ける", desc: "遠方からでも神社に感謝・決意を届けられるオンライン奉納。" },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="block px-7 py-7 transition-all duration-300"
              style={{
                background: C.card,
                border: `1px solid ${C.goldBorder}`,
                borderRadius: "14px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.border = `1px solid rgba(201,155,77,0.6)`;
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.border = `1px solid ${C.goldBorder}`;
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div className="text-[10px] tracking-[0.3em] font-bold mb-3" style={{ color: C.gold }}>{card.label}</div>
              <div className="font-serif text-lg mb-2" style={{ color: C.heading }}>{card.title}</div>
              <p className="text-xs" style={{ color: C.sub }}>{card.desc}</p>
            </Link>
          ))}
        </section>

        {/* ══════════════════════════════════════
            フッター
        ══════════════════════════════════════ */}
        <footer
          className="pb-8 pt-6 text-center text-xs"
          style={{ borderTop: `1px solid ${C.goldBorder}`, color: C.sub }}
        >
          <p>Shrine Map of Japan · 参拝の記録と支援の場</p>
        </footer>
      </main>
    </div>
  );
}
