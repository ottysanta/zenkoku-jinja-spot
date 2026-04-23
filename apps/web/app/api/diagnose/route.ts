import { NextRequest, NextResponse } from "next/server";
import { searchSpots } from "@/lib/shrine-db";
import { spotSlug } from "@/lib/api";

// 十二支（地支）インデックス: (year + 8) % 12
// 検証: 2024(辰)→(2024+8)%12=4, 2025(巳)→5 ✓
const ZODIAC = [
  { kanji: "子", reading: "ね", animal: "ねずみ", emoji: "🐭", element: "水" },
  { kanji: "丑", reading: "うし", animal: "うし", emoji: "🐄", element: "土" },
  { kanji: "寅", reading: "とら", animal: "とら", emoji: "🐯", element: "木" },
  { kanji: "卯", reading: "う", animal: "うさぎ", emoji: "🐰", element: "木" },
  { kanji: "辰", reading: "たつ", animal: "りゅう", emoji: "🐲", element: "土" },
  { kanji: "巳", reading: "み", animal: "へび", emoji: "🐍", element: "火" },
  { kanji: "午", reading: "うま", animal: "うま", emoji: "🐴", element: "火" },
  { kanji: "未", reading: "ひつじ", animal: "ひつじ", emoji: "🐑", element: "土" },
  { kanji: "申", reading: "さる", animal: "さる", emoji: "🐒", element: "金" },
  { kanji: "酉", reading: "とり", animal: "とり", emoji: "🐓", element: "金" },
  { kanji: "戌", reading: "いぬ", animal: "いぬ", emoji: "🐕", element: "土" },
  { kanji: "亥", reading: "い", animal: "いのしし", emoji: "🐗", element: "水" },
] as const;

// 十干（天干）インデックス: (year + 6) % 10
// 検証: 2024(甲辰)→(2024+6)%10=0→甲 ✓, 2025(乙巳)→1→乙 ✓
const STEMS = [
  { kanji: "甲", reading: "きのえ", element: "木", yin: false },
  { kanji: "乙", reading: "きのと", element: "木", yin: true },
  { kanji: "丙", reading: "ひのえ", element: "火", yin: false },
  { kanji: "丁", reading: "ひのと", element: "火", yin: true },
  { kanji: "戊", reading: "つちのえ", element: "土", yin: false },
  { kanji: "己", reading: "つちのと", element: "土", yin: true },
  { kanji: "庚", reading: "かのえ", element: "金", yin: false },
  { kanji: "辛", reading: "かのと", element: "金", yin: true },
  { kanji: "壬", reading: "みずのえ", element: "水", yin: false },
  { kanji: "癸", reading: "みずのと", element: "水", yin: true },
] as const;

export type ElementKey = "木" | "火" | "土" | "金" | "水";

const ELEMENTS: Record<ElementKey, {
  reading: string;
  keyword: string;
  guardian: string;
  description: string;
  relationshipMessage: string;
  deityGuideMessage: string;
  benefits: string[];
  deityHint: string;
  theme: { bg: string; border: string; text: string; accent: string };
}> = {
  木: {
    reading: "もく",
    keyword: "縁結び・成長",
    guardian: "大国主命・素戔嗚尊",
    description: "人と人を結ぶ縁の力。大地に根を張り、空へと伸びる生命力があなたの本質です。",
    relationshipMessage: "あなたは人と人を繋ぐ「縁の橋渡し役」。職場・家族・恋愛のどの場面でも、あなたの存在が人間関係の潤滑油となっています。ただ、気を遣いすぎて自分を見失うことも。大国主命は「縁を結ぶ者こそ、自分の縁を大切に」と伝えています。",
    deityGuideMessage: "大国主命はあなたの人間関係を守護しています。新しい出会いが運命を動かす時期です。",
    benefits: ["縁結び", "家内安全", "健康"],
    deityHint: "大国主",
    theme: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-900", accent: "text-emerald-600" },
  },
  火: {
    reading: "か",
    keyword: "浄化・情熱",
    guardian: "天照大神・火之迦具土神",
    description: "燃える炎のような情熱と、不浄を払う浄化の力。あなたの輝きが周囲を照らします。",
    relationshipMessage: "あなたは「照らす存在」。その情熱と誠意が人を引き寄せますが、燃えすぎると周囲を疲れさせることも。天照大神は「光は柔らかく照らすとき、最も遠くまで届く」と教えています。職場の人間関係で消耗しているなら、一度立ち止まり自分の火を守ることが先決です。",
    deityGuideMessage: "天照大神の光があなたの道を照らしています。闇に見える状況も、視点を変えれば転機の光です。",
    benefits: ["厄除け", "勝負運", "出世"],
    deityHint: "天照",
    theme: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-900", accent: "text-orange-600" },
  },
  土: {
    reading: "ど",
    keyword: "安定・豊穣",
    guardian: "稲荷大神・豊受大神",
    description: "大地のような揺るぎない安定感と、すべてを育む包容力。豊かさを引き寄せる資質です。",
    relationshipMessage: "あなたは「支える存在」。家族や職場で誰かの支えになっていることが多いはずです。ただ、支えすぎて自分が疲弊していませんか？稲荷大神は「豊かな土地は、まず自分自身が養われているとき」と言います。人間関係で消耗するなら、まず自分への投資を。",
    deityGuideMessage: "稲荷大神の豊かな恵みがあなたを包んでいます。地道な積み重ねが実りの季節を呼びます。",
    benefits: ["商売繁盛", "金運", "五穀豊穣"],
    deityHint: "稲荷",
    theme: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-900", accent: "text-amber-600" },
  },
  金: {
    reading: "こん",
    keyword: "決断・清廉",
    guardian: "八幡大神・鹿島大神",
    description: "刃のような鋭い決断力と、本質を見抜く明晰さ。曲がったものを正す強さがあります。",
    relationshipMessage: "あなたは「正す存在」。不正やずるさに対して誰より敏感で、それが人間関係の摩擦になることも。八幡大神は「強さとは、許す力の中にある」と伝えています。すべてを正そうとするのではなく、自分の信念に従って生きることで、人間関係は自然と整っていきます。",
    deityGuideMessage: "八幡大神の剛毅な力があなたに宿っています。迷いを断ち切る決断の時が来ています。",
    benefits: ["勝負運", "必勝祈願", "仕事運"],
    deityHint: "八幡",
    theme: { bg: "bg-slate-50", border: "border-slate-300", text: "text-slate-900", accent: "text-slate-600" },
  },
  水: {
    reading: "すい",
    keyword: "浄化・直感",
    guardian: "弁財天・住吉大神",
    description: "水のように自在に流れ、すべてを洗い清める力。深い直感と感受性があなたの武器です。",
    relationshipMessage: "あなたは「感じる存在」。他人の感情を敏感に察知し、場の空気を読むのが得意ですが、その分傷つきやすくもあります。弁財天は「清らかな水は、どんな器にも美しく収まる」と伝えています。人間関係で傷ついているなら、まず自分の心を清める時間を作ることが大切です。",
    deityGuideMessage: "弁財天の清らかな水があなたの魂を洗い清めます。直感を信じて、流れに身を任せてみてください。",
    benefits: ["技芸上達", "健康", "縁結び"],
    deityHint: "弁財天",
    theme: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-900", accent: "text-blue-600" },
  },
};

export type DiagnoseResult = {
  year: number;
  zodiac: (typeof ZODIAC)[number];
  stem: (typeof STEMS)[number];
  sexagenary: string; // 干支（例: 甲辰）
  element: ElementKey;
  elementSource: "stem" | "branch"; // 属性の算出元
  elementData: (typeof ELEMENTS)[ElementKey];
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
  } catch { return []; }
}

export async function GET(req: NextRequest) {
  const year = Number(req.nextUrl.searchParams.get("year") ?? "");
  const currentYear = new Date().getFullYear();
  if (!year || year < 1900 || year > currentYear) {
    return NextResponse.json({ error: "invalid year" }, { status: 400 });
  }

  const zodiacIndex = (year + 8) % 12;
  const stemIndex = (year + 6) % 10;
  const zodiac = ZODIAC[zodiacIndex];
  const stem = STEMS[stemIndex];
  const sexagenary = `${stem.kanji}${zodiac.kanji}`;
  // 四柱推命の年柱では天干が年の気を示す。属性は天干を主とする。
  const element = stem.element as ElementKey;
  const elementData = ELEMENTS[element];

  // 守護神タイプに対応する神社を検索（写真付き優先）
  const { rows } = searchSpots({
    deity: elementData.deityHint,
    limit: 20,
  });

  // 写真付きを優先してランダムに3社選ぶ
  const withPhoto = rows.filter((r) => r.photo_url);
  const withoutPhoto = rows.filter((r) => !r.photo_url);
  const pool = [...withPhoto, ...withoutPhoto].slice(0, 9);
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);

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

  return NextResponse.json({
    year,
    zodiac,
    stem,
    sexagenary,
    element,
    elementSource: "stem",
    elementData,
    shrines,
  } satisfies DiagnoseResult);
}
