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
  y?: string; m?: string; d?: string; w?: string;
  t?: string; mod?: string; el?: string; em?: string; lp?: string;
}>;

export async function generateMetadata(
  { searchParams }: { searchParams: SearchParams }
): Promise<Metadata> {
  const p = await searchParams;

  // 結果パラメータが揃っている場合だけ動的 OGP を生成
  if (p.t && p.el) {
    const ogUrl = `/api/og/diagnose?type=${encodeURIComponent(p.t)}&mod=${encodeURIComponent(p.mod ?? "")}&el=${encodeURIComponent(p.el)}&em=${encodeURIComponent(p.em ?? "⛩")}&worry=${encodeURIComponent(p.w ?? "")}&lp=${encodeURIComponent(p.lp ?? "")}`;
    const lpLabel = p.lp ? ` × ライフパス${p.lp}` : "";
    return {
      title: `「${p.t}」${lpLabel}— 守護神社診断結果`,
      description: `${p.el}属性${lpLabel}。あなたの守護タイプは「${p.t}」。守護神社診断で自分に縁深い神社を見つけよう。`,
      openGraph: {
        title: `守護タイプ「${p.t}」${lpLabel}`,
        description: `${p.el}属性 ${p.mod ?? ""}${lpLabel}`,
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

// ─── 構造化データ（FAQPage + WebApplication）────────────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://zenkokujinjyaspot.com";

const diagnoseSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "name": "守護神社診断",
      "url": `${SITE_URL}/diagnose`,
      "description": "生年月日と今の悩みから、五行属性・干支・数秘ライフパスナンバーを導き出し、あなたに縁深い守護神社を診断するツール。全国46,000社以上のデータベースから最適な神社を提案。",
      "applicationCategory": "LifestyleApplication",
      "inLanguage": "ja",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "守護神社診断とは何ですか？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "守護神社診断は、生年月日（十干十二支・五行属性）と数秘術ライフパスナンバー、今抱えている悩みを組み合わせて、あなたに縁深い守護神社を特定するオリジナルの診断システムです。全国46,000社以上のデータベースから、あなたの属性とご利益が一致する神社を紹介します。"
          }
        },
        {
          "@type": "Question",
          "name": "五行属性（木・火・土・金・水）と神社の相性はどう決まりますか？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "五行思想では木・火・土・金・水のそれぞれに対応する神様と神社があります。木属性なら大国主命・素戔嗚尊をお祀りする神社、火属性なら天照大神・稲荷系の神社、水属性なら弁財天・住吉大神をお祀りする神社との相性が特に深くなります。生まれ年の十干から属性が決まり、その属性に合った神社を参拝することで運気が整いやすくなるとされています。"
          }
        },
        {
          "@type": "Question",
          "name": "数秘術ライフパスナンバーと神社参拝の関係は？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "数秘術のライフパスナンバーは生年月日の全桁を1桁に還元した数字（1〜9、マスターナンバー11・22・33）で、その人の魂の特質と人生テーマを示します。ライフパス7（真理の探究者）なら七の数に縁深い神社や霊験あらたかな神秘的な聖地との相性が深く、ライフパス1（先駆者）なら開拓・創始を象徴する神様をお祀りする神社との縁が強くなります。"
          }
        },
        {
          "@type": "Question",
          "name": "干支で守護神社は変わりますか？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "はい、干支（十二支）によって縁深い神使（眷属）や祭神が変わります。子年生まれなら大黒天・大国主命との縁が深く、午年生まれなら馬を神使とする神社（駒形神社・藤森神社など）との相性が強くなります。十干十二支の組み合わせ（甲子・乙丑など60通り）でさらに細かい守護タイプが決まります。"
          }
        },
        {
          "@type": "Question",
          "name": "仕事運・恋愛運・家族運・金運、それぞれに向いた神社はどこですか？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "ご利益別では、仕事運・勝負運なら八幡宮・鹿島神宮系、恋愛・縁結びなら出雲大社系・月読神社系、家族・夫婦円満なら住吉大社系、金運・商売繁盛なら稲荷系神社（伏見稲荷など）が代表的です。ただし最適な神社はあなたの五行属性・ライフパスナンバーによっても変わるため、守護神社診断で個人に合った神社を確認することをお勧めします。"
          }
        },
        {
          "@type": "Question",
          "name": "2026年（丙午）に特に相性の良い神社はどこですか？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "2026年は丙午（ひのえうま）の年で、60年に一度の強い火のエネルギーを持つ年です。火属性を高める天照大神・稲荷系の神社（伏見稲荷大社・豊川稲荷など）、馬にゆかりの深い藤森神社・駒形神社・多度大社への参拝が特に縁深いとされています。午年生まれの方はもちろん、変化・決断・新しい挑戦を祈願したい方に強いエネルギーを与えてくれる年回りです。"
          }
        }
      ]
    }
  ]
};

// ─── ページ ───────────────────────────────────────────────────────────────
export default async function DiagnosePage(
  { searchParams }: { searchParams: SearchParams }
) {
  const p = await searchParams;

  // URL に結果パラメータがあれば DiagnoseClient に渡して自動表示
  const initialParams = (p.y && p.m && p.d && p.w)
    ? { year: p.y, month: p.m, day: p.d, worry: p.w as "work" | "love" | "family" | "self" }
    : undefined;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(diagnoseSchema) }}
      />
      {/* 背景装飾 */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-vermilion/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-moss/5 blur-3xl" />
      </div>

      <DiagnoseClient initialParams={initialParams} />
    </main>
  );
}
