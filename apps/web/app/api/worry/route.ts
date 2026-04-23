import { NextRequest, NextResponse } from "next/server";
import { searchSpots } from "@/lib/shrine-db";
import { spotSlug } from "@/lib/api";

export type WorryKey =
  | "work"
  | "love"
  | "family"
  | "health"
  | "money"
  | "study"
  | "yakuyoke";

export const WORRIES: Record<
  WorryKey,
  {
    label: string;
    sub: string;
    emoji: string;
    benefits: string[]; // DBのご利益キーワード候補（順に試行）
    message: string;
    deityHint: string;
    accent: string; // tailwind色
  }
> = {
  work: {
    label: "職場・仕事の悩み",
    sub: "人間関係、出世、転職、プレッシャー",
    emoji: "💼",
    benefits: ["仕事運", "出世", "勝負運"],
    message:
      "職場の悩みは「自分と他者の境界」が揺らいでいるサイン。八幡大神は強さと正しさをもって道を切り開く力を授けてくれます。",
    deityHint: "八幡",
    accent: "slate",
  },
  love: {
    label: "恋愛・パートナーシップ",
    sub: "出会い、別れ、片思い、結婚",
    emoji: "💑",
    benefits: ["縁結び", "恋愛成就"],
    message:
      "恋の悩みは「自分を愛する度合い」の鏡。大国主命は、まずあなた自身との縁を深めることで、外の縁が整うと伝えています。",
    deityHint: "大国主",
    accent: "rose",
  },
  family: {
    label: "家族・家庭の悩み",
    sub: "夫婦、親子、嫁姑、子育て",
    emoji: "👨‍👩‍👧",
    benefits: ["家内安全", "子授け", "安産"],
    message:
      "家の悩みは血縁の歴史と深く結びつきます。天照大神の光が、家族に流れる見えない糸を柔らかく照らしてくれます。",
    deityHint: "天照",
    accent: "orange",
  },
  health: {
    label: "健康・心身の悩み",
    sub: "病気、不調、メンタル、回復",
    emoji: "🌿",
    benefits: ["健康", "病気平癒"],
    message:
      "身体の声は、心が置き去りにしたものを教えてくれます。少彦名神は医薬の神として、回復への小さな一歩を後押しします。",
    deityHint: "少彦名",
    accent: "emerald",
  },
  money: {
    label: "金運・商売の悩み",
    sub: "収入、借金、独立、ビジネス",
    emoji: "💰",
    benefits: ["金運", "商売繁盛", "五穀豊穣"],
    message:
      "お金の悩みは「循環」の詰まり。稲荷大神は稔りを与える神。まず感謝の循環を作ることから、豊かさは巡り始めます。",
    deityHint: "稲荷",
    accent: "amber",
  },
  study: {
    label: "学業・試験",
    sub: "受験、資格、研究、集中力",
    emoji: "📚",
    benefits: ["学業成就", "合格祈願"],
    message:
      "学ぶことは「天と繋がる行為」。菅原道真公は、真摯に努力する者の背中を押してくださる学問の神です。",
    deityHint: "天満",
    accent: "indigo",
  },
  yakuyoke: {
    label: "厄除け・人生の転機",
    sub: "厄年、方位、引越し、人生の節目",
    emoji: "✨",
    benefits: ["厄除け", "方除け"],
    message:
      "転機は「脱皮」の時。祓戸大神は流れを清め、新しいあなたで次の季節を迎えさせてくれます。",
    deityHint: "八幡",
    accent: "violet",
  },
};

export type WorryResult = {
  worry: WorryKey;
  data: (typeof WORRIES)[WorryKey];
  shrines: Array<{
    id: number;
    name: string;
    slug: string;
    prefecture: string | null;
    photo_url: string | null;
    description: string | null;
    benefits: string[];
    shrine_type: string | null;
  }>;
};

function parseBenefits(json?: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("worry") as WorryKey | null;
  if (!key || !(key in WORRIES)) {
    return NextResponse.json({ error: "invalid worry" }, { status: 400 });
  }
  const data = WORRIES[key];

  // 複数ご利益を順に試行し、写真付きを優先
  const pool: Array<ReturnType<typeof searchSpots>["rows"][number]> = [];
  const seen = new Set<number>();
  for (const b of data.benefits) {
    const { rows } = searchSpots({ benefit: b, limit: 30 });
    for (const r of rows) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        pool.push(r);
      }
    }
    if (pool.length >= 30) break;
  }

  // deityHintでフォールバック
  if (pool.length < 6) {
    const { rows } = searchSpots({ deity: data.deityHint, limit: 20 });
    for (const r of rows) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        pool.push(r);
      }
    }
  }

  const withPhoto = pool.filter((r) => r.photo_url);
  const withoutPhoto = pool.filter((r) => !r.photo_url);
  const ordered = [...withPhoto, ...withoutPhoto].slice(0, 12);
  const shuffled = ordered.sort(() => Math.random() - 0.5).slice(0, 6);

  const shrines = shuffled.map((r) => ({
    id: r.id,
    name: r.name,
    slug: spotSlug({ id: r.id, slug: r.slug }),
    prefecture: r.prefecture,
    photo_url: r.photo_url,
    description: r.description ? r.description.slice(0, 80) + "…" : null,
    benefits: parseBenefits(r.benefits).slice(0, 4),
    shrine_type: r.shrine_type,
  }));

  return NextResponse.json({ worry: key, data, shrines } satisfies WorryResult);
}
