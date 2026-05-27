/**
 * トップページ（高級和風ダークLP）
 * 中身・文章・機能・データ構造は変更しない。デザインのみ刷新。
 */
import Link from "next/link";
import type { Metadata } from "next";
import {
  Compass,
  ScrollText,
  ScanLine,
  RefreshCw,
  HelpCircle,
  BookOpen,
  Send,
} from "lucide-react";
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

/* ─── ご利益データ（emoji フィールドは変更しない、描画には使わない） ─── */
const BENEFIT_PRESETS = [
  { name: "縁結び",   emoji: "💕" },
  { name: "商売繁盛", emoji: "💰" },
  { name: "合格祈願", emoji: "📚" },
  { name: "健康",     emoji: "🌿" },
  { name: "厄除け",   emoji: "🧿" },
  { name: "金運",     emoji: "🪙" },
  { name: "交通安全", emoji: "🚙" },
  { name: "勝負運",   emoji: "⚔" },
];

/* ご利益 → GPT生成アイコン画像のマッピング */
const BENEFIT_IMG: Record<string, string> = {
  "縁結び":   "/assets/shrine/icons/57efda59-2701-44b0-98a0-0590eeada950.png",
  "商売繁盛": "/assets/shrine/icons/f65e1cc4-3b43-4d8a-8762-9c6042c4e57a.png",
  "合格祈願": "/assets/shrine/icons/c8012f0f-36e7-4b51-ab89-2535f2c189cf.png",
  "健康":     "/assets/shrine/icons/95ee1947-1fcb-4fa0-9b6c-9bf2e3cc57ec.png",
  "厄除け":   "/assets/shrine/icons/98569539-627a-488c-8369-d5a19b20f9fe.png",
  "金運":     "/assets/shrine/icons/b8a8bb71-8a6a-47c0-b754-dd0f26dbca8c.png",
  "交通安全": "/assets/shrine/icons/1f359d9c-8344-4f3a-adeb-4c45653153f5.png",
  "勝負運":   "/assets/shrine/icons/c74f512b-c102-4961-baaf-84cfacfa5e81.png",
};

/* ─── 型定義 ─── */
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
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
}

function loadFeatured(limit = 8): FeaturedCard[] {
  try {
    const { rows } = searchSpots({ limit: 100 });
    const withPhoto = rows.filter((r) => r.photo_url && r.description);
    return withPhoto.slice(0, limit).map((r) => ({
      id: r.id, name: r.name, slug: r.slug, prefecture: r.prefecture,
      shrine_type: r.shrine_type, shrine_rank: r.shrine_rank,
      photo_url: r.photo_url, description: r.description,
      benefits: parseBenefits(r.benefits),
    }));
  } catch { return []; }
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
  } catch { return iso; }
}

/* ─── 鳥居 SVG（フォールバック用） ─── */
function ToriiSVG({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path d="M3 11 C10 7, 26 7, 33 11" stroke="rgba(201,155,77,0.45)" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="6" y="15" width="24" height="2.2" rx="1.1" fill="rgba(201,155,77,0.38)"/>
      <rect x="10.5" y="17.2" width="2.8" height="16" rx="1.4" fill="rgba(201,155,77,0.38)"/>
      <rect x="22.7" y="17.2" width="2.8" height="16" rx="1.4" fill="rgba(201,155,77,0.38)"/>
    </svg>
  );
}

/* ─── セクションヘッダー ─── */
function SectionHeader({
  en, ja, right,
}: { en: string; ja: string; right?: React.ReactNode }) {
  return (
    <div className="mb-10">
      <p style={{ color: "#C99B4D", fontSize: "0.58rem", letterSpacing: "0.42em", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase" }}>
        {en}
      </p>
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif" style={{ color: "#fff7e6", fontSize: "1.45rem", letterSpacing: "0.05em" }}>
          {ja}
        </h2>
        {right}
      </div>
      <div style={{ marginTop: "12px", height: "1px", background: "linear-gradient(to right, rgba(201,155,77,0.6), rgba(201,155,77,0.1) 60%, transparent)" }} />
    </div>
  );
}

/* ─── コンテンツカードデータ（アイコンは lucide-react） ─── */
const CONTENT_CARDS = [
  {
    href: "/diagnose" as const,
    en: "SHRINE DIAGNOSIS",
    ja: "守護神社診断",
    desc: "生年月・お悩みから五行属性と干支タイプを診断。縁深い守護神社を3社ご紹介します。",
    cta: "無料で診断",
    icon: <Compass size={24} strokeWidth={1.4} />,
    iconColor: "#d97070",
  },
  {
    href: "/omikuji" as const,
    en: "DAILY OMIKUJI",
    ja: "今日のおみくじ",
    desc: "1日1回引ける守護神からのメッセージ。五行属性に合わせた今日の運勢をお届けします。",
    cta: "おみくじを引く",
    icon: <ScrollText size={24} strokeWidth={1.4} />,
    iconColor: "#C99B4D",
  },
  {
    href: "/palm" as const,
    en: "AI PALM READING",
    ja: "AI手相鑑定",
    desc: "手のひら写真をアップするだけで、AIが生命線・知能線・感情線・運命線を鑑定します。",
    cta: "手相を鑑定する",
    icon: <ScanLine size={24} strokeWidth={1.4} />,
    iconColor: "#9b7cc4",
  },
  {
    href: "/diagnose/compat" as const,
    en: "COMPATIBILITY",
    ja: "五行相性診断",
    desc: "木・火・土・金・水の五行属性から、相生・相克でふたりの縁と相性を読み解きます。",
    cta: "相性を診断する",
    icon: <RefreshCw size={24} strokeWidth={1.4} />,
    iconColor: "#6a9fc0",
  },
  {
    href: "/worry" as const,
    en: "WORRY DIAGNOSIS",
    ja: "悩み別神社診断",
    desc: "職場・恋愛・家族・健康・金運…今のあなたの悩みに縁深い神様と神社をご紹介します。",
    cta: "悩みで探す",
    icon: <HelpCircle size={24} strokeWidth={1.4} />,
    iconColor: "#6aab8a",
  },
] as const;

export default async function HomePage() {
  const total = totalSpots();
  const prefCounts = prefectureCounts();
  const totalPref = prefCounts.length;
  const allPrefs = prefCounts;
  const featured = loadFeatured(8);
  const spotlight = randomFeaturedSpots(4).map((r) => ({
    id: r.id, name: r.name, slug: r.slug, prefecture: r.prefecture,
    shrine_type: r.shrine_type, shrine_rank: r.shrine_rank,
    photo_url: r.photo_url, description: r.description,
  }));
  const latest = recentlyAddedSpots(6).map((r) => ({
    id: r.id, name: r.name, slug: r.slug, prefecture: r.prefecture, photo_url: r.photo_url,
  }));
  const recentComments: RecentCheckin[] = recentCheckins(8);
  const topUsers: FeaturedUser[] = featuredUsers(6);
  const offeringShrines = listOfferingShrines(6);
  const offeringShrineCount = countOfferingShrines();

  return (
    <div style={{ background: "linear-gradient(175deg,#06040300%,#0c070445%,#150c0780%,#0c0704100%)", minHeight: "100vh" }}>

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          minHeight: "clamp(480px,65vh,660px)",
          backgroundColor: "#06040",
          backgroundImage: [
            /* 左から右への黒グラデ（神社を右に見せる） */
            "linear-gradient(105deg, rgba(6,4,3,0.97) 0%, rgba(6,4,3,0.90) 30%, rgba(6,4,3,0.55) 58%, rgba(6,4,3,0.18) 100%)",
            /* 下部を引き締める */
            "linear-gradient(to top, rgba(6,4,3,0.88) 0%, rgba(6,4,3,0.2) 30%, transparent 60%)",
            /* 神社写真 */
            "url('/assets/shrine/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8826%E6%97%A5%2019_31_07%20(1).png')",
          ].join(","),
          backgroundSize: "cover",
          backgroundPosition: "center 28%",
        }}
      >
        {/* 上端ライン */}
        <div style={{ position: "absolute", inset: "0 0 auto 0", height: "1px", background: "linear-gradient(to right, transparent 0%, rgba(201,155,77,0.55) 40%, rgba(201,155,77,0.55) 60%, transparent 100%)" }} />

        <div className="mx-auto max-w-6xl px-6 md:px-12" style={{ paddingTop: "clamp(80px,12vh,120px)", paddingBottom: "clamp(64px,10vh,100px)" }}>
          <div style={{ maxWidth: "580px" }}>

            {/* キャッチフレーズラベル */}
            <div className="flex items-center gap-3 mb-6">
              <div style={{ width: "24px", height: "1px", background: "#C99B4D" }} />
              <p style={{ color: "#C99B4D", fontSize: "0.6rem", letterSpacing: "0.45em", fontWeight: 700, textTransform: "uppercase" }}>
                本当の自分で生きたい方へ
              </p>
            </div>

            {/* メインコピー */}
            <h1
              className="font-serif"
              style={{
                color: "#fff7e6",
                fontSize: "clamp(2.1rem, 5vw, 3.6rem)",
                lineHeight: 1.22,
                letterSpacing: "0.04em",
                marginBottom: "20px",
              }}
            >
              あなたの守護神社を<br />見つける
            </h1>

            {/* 金の装飾ライン */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "22px", alignItems: "center" }}>
              <div style={{ width: "40px", height: "2px", background: "#C99B4D" }} />
              <div style={{ width: "8px", height: "2px", background: "rgba(201,155,77,0.45)" }} />
              <div style={{ width: "4px", height: "2px", background: "rgba(201,155,77,0.25)" }} />
            </div>

            {/* サブコピー */}
            <p style={{
              color: "rgba(240,226,198,0.85)",
              fontSize: "0.9rem",
              lineHeight: 2.0,
              fontWeight: 300,
              marginBottom: "40px",
              letterSpacing: "0.03em",
            }}>
              生年月日から五行属性・干支・誕生数を診断。<br />
              縁深い守護神社と、神様からのメッセージをお届けします。
            </p>

            {/* CTA ボタン群 */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "36px" }}>
              <Link
                href="/diagnose"
                className="shrine-btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "15px 32px",
                  background: "linear-gradient(135deg, #9b2029 0%, #7a1520 60%, #5e1019 100%)",
                  border: "1px solid rgba(201,155,77,0.5)",
                  borderRadius: "3px",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  boxShadow: "0 4px 28px rgba(139,30,39,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
                  textDecoration: "none",
                  minHeight: "52px",
                }}
              >
                守護神社診断を受ける（無料）
              </Link>

              <Link
                href="/omikuji"
                className="shrine-btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "15px 26px",
                  background: "rgba(6,4,3,0.6)",
                  border: "1px solid rgba(201,155,77,0.75)",
                  borderRadius: "3px",
                  color: "#C99B4D",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textDecoration: "none",
                  minHeight: "52px",
                }}
              >
                今日のおみくじを引く
              </Link>
            </div>

            {/* サマリバッジ */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {[
                { val: total.toLocaleString(), unit: "社収録" },
                { val: String(totalPref), unit: "都道府県カバー" },
              ].map(({ val, unit }) => (
                <span key={unit} style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  border: "1px solid rgba(201,155,77,0.3)",
                  borderRadius: "3px", padding: "5px 14px",
                  background: "rgba(20,12,6,0.65)",
                  color: "rgba(240,226,198,0.75)", fontSize: "0.75rem",
                }}>
                  <b style={{ color: "#C99B4D", fontWeight: 700 }}>{val}</b>{unit}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 下端ライン */}
        <div style={{ position: "absolute", inset: "auto 0 0 0", height: "1px", background: "linear-gradient(to right, transparent, rgba(201,155,77,0.35), transparent)" }} />
      </section>

      {/* ═══════════════════════════════════════════
          ページ本体
      ═══════════════════════════════════════════ */}
      <main className="mx-auto max-w-6xl px-5 md:px-8">

        {/* ─── 神社体験コンテンツ ─── */}
        <section style={{ paddingTop: "80px", paddingBottom: "80px" }}>
          <SectionHeader en="CONTENTS" ja="神社体験コンテンツ" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CONTENT_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="shrine-card flex flex-col"
                style={{
                  padding: "22px 18px",
                  background: "linear-gradient(145deg, #1e1108 0%, #170d06 100%)",
                  border: "1px solid rgba(201,155,77,0.28)",
                  borderRadius: "14px",
                  boxShadow: "0 2px 20px rgba(0,0,0,0.45)",
                  textDecoration: "none",
                }}
              >
                {/* アイコン */}
                <div style={{
                  width: "44px", height: "44px", borderRadius: "10px", marginBottom: "16px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${card.iconColor}18`,
                  border: `1px solid ${card.iconColor}40`,
                  color: card.iconColor,
                }}>
                  {card.icon}
                </div>
                <p style={{ color: "#C99B4D", fontSize: "0.57rem", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "8px" }}>{card.en}</p>
                <h3 className="font-serif" style={{ color: "#fff7e6", fontSize: "1rem", marginBottom: "10px", letterSpacing: "0.04em" }}>{card.ja}</h3>
                <p style={{ color: "rgba(220,202,168,0.6)", fontSize: "0.78rem", lineHeight: 1.8, marginBottom: "16px", flex: 1 }}>{card.desc}</p>
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "5px 14px", borderRadius: "3px", fontSize: "0.75rem", fontWeight: 600,
                  background: "rgba(201,155,77,0.1)", border: "1px solid rgba(201,155,77,0.35)",
                  color: "#C99B4D", width: "fit-content",
                }}>
                  {card.cta} →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── 注目の神社 ─── */}
        {spotlight.length > 0 ? (
          <section style={{ paddingBottom: "80px" }}>
            <SectionHeader
              en="SPOTLIGHT"
              ja="注目の神社"
              right={<span style={{ fontSize: "0.72rem", color: "rgba(220,202,168,0.45)" }}>訪問ごとに更新</span>}
            />
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {spotlight.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                    className="shrine-card-sm group relative block overflow-hidden"
                    style={{ aspectRatio: "3/4", borderRadius: "14px", border: "1px solid rgba(201,155,77,0.28)", display: "block", textDecoration: "none" }}
                  >
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.photo_url}
                        alt={s.name}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s ease" }}
                        className="group-hover:scale-105"
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#1b1009,#2a1710)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ToriiSVG size={48} />
                      </div>
                    )}
                    <div style={{
                      position: "absolute", inset: "auto 0 0 0", padding: "20px 14px 14px",
                      background: "linear-gradient(to top, rgba(6,4,3,0.95) 0%, rgba(6,4,3,0.65) 50%, transparent 100%)",
                    }}>
                      <p style={{ color: "#fff7e6", fontSize: "0.85rem", fontWeight: 600, marginBottom: "2px" }} className="line-clamp-1">{s.name}</p>
                      <p style={{ color: "rgba(220,202,168,0.65)", fontSize: "0.7rem" }}>
                        {[s.prefecture, s.shrine_type].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ─── オンライン志納 ─── */}
        {offeringShrines.length > 0 ? (
          <section style={{
            marginBottom: "80px", padding: "28px 28px",
            background: "linear-gradient(145deg, #1e1108 0%, #170d06 100%)",
            border: "1px solid rgba(201,155,77,0.28)", borderRadius: "16px",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid rgba(201,155,77,0.2)" }}>
              <h2 className="font-serif" style={{ color: "#fff7e6", fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "10px" }}>
                オンライン志納 受付中
                <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "3px 10px", background: "rgba(30,80,50,0.6)", color: "#6ee7a0", borderRadius: "3px", fontFamily: "sans-serif" }}>
                  {offeringShrineCount} 社
                </span>
              </h2>
              <Link href="/offerings/shrines" style={{ fontSize: "0.75rem", color: "#C99B4D", textDecoration: "underline" }}>すべて見る →</Link>
            </div>
            <p style={{ fontSize: "0.8rem", color: "rgba(220,202,168,0.55)", marginBottom: "20px", lineHeight: 1.7 }}>
              全国 {total.toLocaleString()} 社のうち、宗教法人登録・受付同意が確認できた
              <b style={{ color: "#C99B4D" }}> {offeringShrineCount} 社</b> のみオンライン志納に対応しています。
            </p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {offeringShrines.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                    className="shrine-sub-card block overflow-hidden"
                    style={{ background: "#241309", border: "1px solid rgba(201,155,77,0.25)", borderRadius: "10px", textDecoration: "none" }}
                  >
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photo_url} alt={s.name} loading="lazy" style={{ height: "80px", width: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ height: "80px", background: "#1b1009", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ToriiSVG size={32} />
                      </div>
                    )}
                    <div style={{ padding: "8px 10px" }}>
                      <p className="line-clamp-1" style={{ color: "#fff7e6", fontSize: "0.75rem", fontWeight: 600, marginBottom: "2px" }}>{s.name}</p>
                      <p className="line-clamp-1" style={{ color: "rgba(220,202,168,0.45)", fontSize: "0.68rem" }}>{s.prefecture ?? "—"}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      {/* ═══════════════════════════════════════════
          ご利益から探す（フルブリード深紅帯）
      ═══════════════════════════════════════════ */}
      <section
        className="relative"
        style={{
          backgroundColor: "#3a080f",
          backgroundImage: [
            "linear-gradient(to bottom, rgba(6,4,3,0.92) 0%, transparent 15%, transparent 85%, rgba(6,4,3,0.92) 100%)",
            "linear-gradient(135deg, rgba(52,8,14,0.97) 0%, rgba(85,12,22,0.93) 50%, rgba(52,8,14,0.97) 100%)",
            "url('/assets/shrine/ChatGPT%20Image%202026%E5%B9%B45%E6%9C%8826%E6%97%A5%2019_31_08%20(2).png')",
          ].join(","),
          backgroundSize: "cover",
          backgroundPosition: "center",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: "0 0 auto 0", height: "1px", background: "linear-gradient(to right, transparent, rgba(201,155,77,0.35), transparent)" }} />
        <div style={{ position: "absolute", inset: "auto 0 0 0", height: "1px", background: "linear-gradient(to right, transparent, rgba(201,155,77,0.35), transparent)" }} />

        <div className="mx-auto max-w-6xl px-5 md:px-8" style={{ paddingTop: "72px", paddingBottom: "72px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "36px" }}>
            <div>
              <p style={{ color: "#dea84a", fontSize: "0.58rem", letterSpacing: "0.42em", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase" }}>BENEFITS</p>
              <h2 className="font-serif" style={{ color: "#fff7e6", fontSize: "1.45rem", letterSpacing: "0.05em" }}>ご利益から探す</h2>
            </div>
            <Link href="/search" style={{ fontSize: "0.75rem", color: "#dea84a", textDecoration: "underline" }}>詳しく探す →</Link>
          </div>

          {/* アイコングリッド：スマホ2列、タブレット4列、PC 8列 */}
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {BENEFIT_PRESETS.map((b) => (
              <li key={b.name}>
                <Link
                  href={`/search?benefit=${encodeURIComponent(b.name)}`}
                  className="shrine-benefit-btn flex flex-col items-center gap-3"
                  style={{ textDecoration: "none" }}
                >
                  {/* 円形アイコン（GPT生成画像） */}
                  <div style={{
                    width: "72px", height: "72px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "linear-gradient(145deg, rgba(28,8,14,0.92) 0%, rgba(18,5,10,0.95) 100%)",
                    border: "1px solid rgba(201,155,77,0.55)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,155,77,0.12)",
                    flexShrink: 0,
                    overflow: "hidden",
                    position: "relative",
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={BENEFIT_IMG[b.name]}
                      alt={b.name}
                      loading="lazy"
                      style={{
                        width: "58px", height: "58px",
                        objectFit: "contain",
                        objectPosition: "center",
                        filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.4))",
                      }}
                    />
                  </div>
                  <span style={{ color: "rgba(240,220,180,0.88)", fontSize: "0.73rem", fontWeight: 500, letterSpacing: "0.06em", textAlign: "center", lineHeight: 1.4 }}>
                    {b.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 md:px-8">

        {/* ─── 特集神社カード ─── */}
        {featured.length > 0 ? (
          <section style={{ paddingTop: "80px", paddingBottom: "80px" }}>
            <SectionHeader
              en="FEATURED"
              ja="特集神社"
              right={<Link href="/search" style={{ fontSize: "0.75rem", color: "#C99B4D", textDecoration: "underline" }}>もっと見る →</Link>}
            />
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                    className="shrine-card group flex flex-col overflow-hidden h-full"
                    style={{
                      background: "linear-gradient(175deg,#1e1108,#170d06)",
                      border: "1px solid rgba(201,155,77,0.28)",
                      borderRadius: "14px",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                      textDecoration: "none",
                    }}
                  >
                    {/* 写真（大きく） */}
                    <div className="relative overflow-hidden" style={{ height: "200px", flexShrink: 0 }}>
                      {s.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.photo_url}
                          alt={s.name}
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s ease", filter: "brightness(0.92) contrast(1.05)" }}
                          className="group-hover:scale-105"
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "#241309", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ToriiSVG size={56} />
                        </div>
                      )}
                      {/* 写真上の名前オーバーレイ */}
                      <div style={{ position: "absolute", inset: "auto 0 0 0", padding: "28px 14px 12px", background: "linear-gradient(to top, rgba(23,13,6,1) 0%, rgba(23,13,6,0.7) 45%, transparent 100%)" }}>
                        <h3 className="line-clamp-1 font-serif" style={{ color: "#fff7e6", fontSize: "0.95rem", letterSpacing: "0.04em" }}>{s.name}</h3>
                      </div>
                    </div>

                    {/* テキストエリア */}
                    <div style={{ padding: "12px 14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid rgba(201,155,77,0.18)" }}>
                      <p className="line-clamp-1" style={{ color: "rgba(220,202,168,0.5)", fontSize: "0.72rem" }}>
                        {[s.prefecture, s.shrine_type, s.shrine_rank].filter(Boolean).join(" / ") || "—"}
                      </p>
                      {s.description ? (
                        <p className="line-clamp-2" style={{ color: "rgba(220,202,168,0.65)", fontSize: "0.78rem", lineHeight: 1.75 }}>
                          {s.description.slice(0, 65)}{s.description.length > 65 ? "…" : ""}
                        </p>
                      ) : null}
                      {s.benefits.length > 0 ? (
                        <div style={{ marginTop: "auto", display: "flex", flexWrap: "wrap", gap: "5px", paddingTop: "8px" }}>
                          {s.benefits.slice(0, 3).map((b) => (
                            <span key={b} style={{
                              fontSize: "0.68rem", padding: "2px 8px",
                              background: "rgba(139,30,39,0.22)",
                              border: "1px solid rgba(201,155,77,0.3)",
                              borderRadius: "3px", color: "#C99B4D",
                            }}>
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

        {/* ─── 都道府県から探す ─── */}
        <section style={{ paddingBottom: "80px" }}>
          <SectionHeader
            en="PREFECTURE"
            ja="都道府県から探す"
            right={<Link href="/map" style={{ fontSize: "0.75rem", color: "#C99B4D", textDecoration: "underline" }}>地図で見る →</Link>}
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
                        className="shrine-pref-item relative block overflow-hidden"
                        style={{
                          padding: "10px 12px",
                          background: "linear-gradient(145deg,#1e1108,#170d06)",
                          border: "1px solid rgba(201,155,77,0.28)",
                          borderRadius: "8px",
                          textDecoration: "none",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{ position: "absolute", inset: "0 auto 0 0", width: `${pct}%`, background: "rgba(139,30,39,0.16)", borderRadius: "8px 0 0 8px" }}
                        />
                        <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                          <span style={{ color: "#d8c7a5", fontSize: "0.82rem", fontWeight: 500 }} className="truncate">{r.prefecture}</span>
                          <span style={{ color: "#C99B4D", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0 }}>{r.count.toLocaleString()}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            );
          })()}
          <p style={{ marginTop: "12px", fontSize: "0.72rem", color: "rgba(220,202,168,0.38)" }}>
            全 {totalPref} 都道府県 / {total.toLocaleString()} 社をカバー
          </p>
        </section>

        {/* ─── 注目ユーザー ─── */}
        {topUsers.length > 0 ? (
          <section style={{ paddingBottom: "80px" }}>
            <SectionHeader
              en="COMMUNITY"
              ja="注目の参拝者"
              right={<span style={{ fontSize: "0.72rem", color: "rgba(220,202,168,0.4)" }}>いいね・参考になったが多い方</span>}
            />
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {topUsers.map((u, i) => (
                <li key={u.client_id} style={{
                  display: "flex", gap: "12px", padding: "16px",
                  background: "linear-gradient(145deg,#1e1108,#170d06)",
                  border: "1px solid rgba(201,155,77,0.25)", borderRadius: "12px",
                }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid rgba(201,155,77,0.45)", background: "rgba(201,155,77,0.1)",
                    color: "#C99B4D", fontSize: "0.9rem", fontWeight: 700,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "8px", color: "#fff7e6", fontSize: "0.88rem", fontWeight: 600, marginBottom: "4px" }}>
                      {u.nickname}
                      <span style={{ fontSize: "0.68rem", padding: "2px 7px", border: "1px solid rgba(201,155,77,0.28)", background: "rgba(201,155,77,0.08)", color: "#C99B4D", borderRadius: "3px" }}>
                        {u.total_reactions} reactions
                      </span>
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "rgba(220,202,168,0.5)", marginBottom: "4px" }}>参拝 {u.checkin_count} 回 · 最近: {u.recent_spot_name}</p>
                    {u.recent_comment ? (
                      <p className="line-clamp-2" style={{ fontSize: "0.78rem", color: "rgba(220,202,168,0.68)" }}>「{u.recent_comment}」</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ─── 最近の参拝コメント ─── */}
        {recentComments.length > 0 ? (
          <section style={{ paddingBottom: "80px" }}>
            <SectionHeader
              en="VOICES"
              ja="最近の参拝コメント"
              right={<span style={{ fontSize: "0.72rem", color: "rgba(220,202,168,0.4)" }}>参拝者の声</span>}
            />
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {recentComments.map((r) => (
                <li key={r.id} style={{
                  display: "flex", justifyContent: "space-between", gap: "12px", padding: "16px",
                  background: "linear-gradient(145deg,#1e1108,#170d06)",
                  border: "1px solid rgba(201,155,77,0.25)", borderRadius: "12px",
                }}>
                  <div style={{ minWidth: 0 }}>
                    <Link
                      href={`/shrines/${spotSlug({ id: r.spot_id, slug: r.spot_slug })}`}
                      className="line-clamp-1"
                      style={{ color: "#fff7e6", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none" }}
                    >
                      {r.spot_name}
                    </Link>
                    <p style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginTop: "4px", fontSize: "0.72rem", color: "rgba(220,202,168,0.48)" }}>
                      {r.spot_prefecture ? <span>{r.spot_prefecture}</span> : null}
                      {r.wish_type ? (
                        <span style={{ padding: "1px 8px", border: "1px solid rgba(201,155,77,0.28)", background: "rgba(201,155,77,0.08)", color: "#C99B4D", borderRadius: "3px" }}>
                          {({ gratitude: "感謝", vow: "決意", milestone: "節目", thanks: "お礼", other: "その他" } as Record<string, string>)[r.wish_type] || r.wish_type}
                        </span>
                      ) : null}
                    </p>
                    {r.comment ? (
                      <p className="line-clamp-2" style={{ marginTop: "6px", fontSize: "0.8rem", color: "rgba(220,202,168,0.7)", lineHeight: 1.7 }}>「{r.comment}」</p>
                    ) : (
                      <p style={{ marginTop: "6px", fontSize: "0.78rem", color: "rgba(220,202,168,0.42)" }}>{r.nickname || "匿名さん"} が参拝しました</p>
                    )}
                    <div style={{ marginTop: "8px" }}>
                      <ReactionButtons checkinId={r.id} compact />
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, fontSize: "0.68rem", color: "rgba(220,202,168,0.38)" }}>{formatRel(r.created_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section style={{ paddingBottom: "80px" }}>
            <SectionHeader en="VOICES" ja="最近の参拝コメント" />
            <p style={{ padding: "20px", border: "1px dashed rgba(201,155,77,0.25)", background: "linear-gradient(145deg,#1e1108,#170d06)", borderRadius: "12px", fontSize: "0.82rem", color: "rgba(220,202,168,0.45)" }}>
              まだ参拝コメントがありません。<Link href="/map" style={{ color: "#C99B4D", textDecoration: "underline" }}>地図</Link>から参拝した神社にチェックインしてみましょう。
            </p>
          </section>
        )}

        {/* ─── 新着神社 ─── */}
        {latest.length > 0 ? (
          <section style={{ paddingBottom: "80px" }}>
            <SectionHeader
              en="NEW ARRIVALS"
              ja="新しく追加された神社"
              right={<span style={{ fontSize: "0.72rem", color: "rgba(220,202,168,0.4)" }}>全 {total.toLocaleString()} 社の中から</span>}
            />
            <ul className="flex gap-4 overflow-x-auto pb-3">
              {latest.map((s) => (
                <li key={s.id} style={{ width: "168px", flexShrink: 0 }}>
                  <Link
                    href={`/shrines/${spotSlug({ id: s.id, slug: s.slug })}`}
                    className="shrine-sub-card block overflow-hidden"
                    style={{ background: "linear-gradient(145deg,#1e1108,#170d06)", border: "1px solid rgba(201,155,77,0.28)", borderRadius: "12px", textDecoration: "none" }}
                  >
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photo_url} alt={s.name} loading="lazy" style={{ height: "110px", width: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ height: "110px", background: "#241309", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ToriiSVG size={40} />
                      </div>
                    )}
                    <div style={{ padding: "10px 12px" }}>
                      <p className="line-clamp-1" style={{ color: "#fff7e6", fontSize: "0.8rem", fontWeight: 600, marginBottom: "2px" }}>{s.name}</p>
                      <p className="line-clamp-1" style={{ color: "rgba(220,202,168,0.45)", fontSize: "0.7rem" }}>{s.prefecture ?? "—"}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ─── 学ぶ / 気持ちを届ける ─── */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2" style={{ paddingBottom: "80px" }}>
          {[
            { href: "/learn" as const, en: "LEARN", ja: "神社を学ぶ", desc: "参拝マナー・御朱印・祭神系譜・社格などの基礎知識。", icon: <BookOpen size={20} strokeWidth={1.4} /> },
            { href: "/offerings" as const, en: "OFFERINGS", ja: "気持ちを届ける", desc: "遠方からでも神社に感謝・決意を届けられるオンライン奉納。", icon: <Send size={20} strokeWidth={1.4} /> },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="shrine-sub-card block"
              style={{
                padding: "28px 28px",
                background: "linear-gradient(145deg,#1e1108,#170d06)",
                border: "1px solid rgba(201,155,77,0.28)",
                borderRadius: "14px",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <span style={{ color: "#C99B4D" }}>{card.icon}</span>
                <span style={{ fontSize: "0.58rem", letterSpacing: "0.38em", fontWeight: 700, color: "#C99B4D" }}>{card.en}</span>
              </div>
              <div className="font-serif" style={{ color: "#fff7e6", fontSize: "1.15rem", marginBottom: "10px", letterSpacing: "0.04em" }}>{card.ja}</div>
              <p style={{ fontSize: "0.82rem", color: "rgba(220,202,168,0.55)", lineHeight: 1.75 }}>{card.desc}</p>
            </Link>
          ))}
        </section>

        {/* フッター */}
        <footer style={{ paddingTop: "24px", paddingBottom: "40px", textAlign: "center", borderTop: "1px solid rgba(201,155,77,0.18)", color: "rgba(220,202,168,0.35)", fontSize: "0.75rem" }}>
          <p>Shrine Map of Japan · 参拝の記録と支援の場</p>
        </footer>
      </main>
    </div>
  );
}
