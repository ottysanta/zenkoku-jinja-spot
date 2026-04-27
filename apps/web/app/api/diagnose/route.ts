import { NextRequest, NextResponse } from "next/server";
import { searchSpots, type ShrineRow } from "@/lib/shrine-db";
import { spotSlug } from "@/lib/api";

// ─── 十二支 ──────────────────────────────────────────────────────────────────
const ZODIAC = [
  { kanji: "子", reading: "ね",   animal: "ねずみ", emoji: "🐭", element: "水" },
  { kanji: "丑", reading: "うし", animal: "うし",   emoji: "🐄", element: "土" },
  { kanji: "寅", reading: "とら", animal: "とら",   emoji: "🐯", element: "木" },
  { kanji: "卯", reading: "う",   animal: "うさぎ", emoji: "🐰", element: "木" },
  { kanji: "辰", reading: "たつ", animal: "りゅう", emoji: "🐲", element: "土" },
  { kanji: "巳", reading: "み",   animal: "へび",   emoji: "🐍", element: "火" },
  { kanji: "午", reading: "うま", animal: "うま",   emoji: "🐴", element: "火" },
  { kanji: "未", reading: "ひつじ", animal: "ひつじ", emoji: "🐑", element: "土" },
  { kanji: "申", reading: "さる", animal: "さる",   emoji: "🐒", element: "金" },
  { kanji: "酉", reading: "とり", animal: "とり",   emoji: "🐓", element: "金" },
  { kanji: "戌", reading: "いぬ", animal: "いぬ",   emoji: "🐕", element: "土" },
  { kanji: "亥", reading: "い",   animal: "いのしし", emoji: "🐗", element: "水" },
] as const;

// ─── 十干 ──────────────────────────────────────────────────────────────────
const STEMS = [
  { kanji: "甲", reading: "きのえ",   element: "木", yin: false },
  { kanji: "乙", reading: "きのと",   element: "木", yin: true  },
  { kanji: "丙", reading: "ひのえ",   element: "火", yin: false },
  { kanji: "丁", reading: "ひのと",   element: "火", yin: true  },
  { kanji: "戊", reading: "つちのえ", element: "土", yin: false },
  { kanji: "己", reading: "つちのと", element: "土", yin: true  },
  { kanji: "庚", reading: "かのえ",   element: "金", yin: false },
  { kanji: "辛", reading: "かのと",   element: "金", yin: true  },
  { kanji: "壬", reading: "みずのえ", element: "水", yin: false },
  { kanji: "癸", reading: "みずのと", element: "水", yin: true  },
] as const;

// 天干タイプ名（10パターン） — 干支60通りの上位名
const STEM_ARCHETYPES = [
  "天命の先駆者",  // 甲
  "柔和の縁紡ぎ",  // 乙
  "光の道照らし",  // 丙
  "静炎の内省者",  // 丁
  "大地の守護者",  // 戊
  "豊穣の育て手",  // 己
  "鋼の清廉者",    // 庚
  "純白の磨き人",  // 辛
  "大海の受容者",  // 壬
  "清流の知恵者",  // 癸
] as const;

// 地支修飾語（12パターン）— タイプ名に個性を加える
const ZODIAC_MODIFIERS = [
  "〜水の始まり〜",   // 子
  "〜地の積み重ね〜", // 丑
  "〜木の覚醒〜",     // 寅
  "〜花の開花〜",     // 卯
  "〜天地の結び〜",   // 辰
  "〜炎の変容〜",     // 巳
  "〜陽の頂点〜",     // 午
  "〜穏やかな土〜",   // 未
  "〜金の知恵〜",     // 申
  "〜秋の結実〜",     // 酉
  "〜誠実な守り〜",   // 戌
  "〜水の終わり〜",   // 亥
] as const;

export type ElementKey = "木" | "火" | "土" | "金" | "水";
export type WorryKey   = "work" | "love" | "family" | "self";

// ─── 五行データ ───────────────────────────────────────────────────────────────
const ELEMENTS: Record<ElementKey, {
  reading: string;
  keyword: string;
  guardian: string;
  description: string;
  strength: string;
  weakness: string;
  worryAdvice: Record<WorryKey, string>;
  monthlyGuide: string;
  compatibleType: string;
  deityGuideMessage: string;
  benefits: string[];
  deityHints: string[];
  theme: { bg: string; border: string; accent: string; gradient: string; badge: string };
}> = {
  木: {
    reading: "もく",
    keyword: "縁結び・成長・橋渡し",
    guardian: "大国主命・素戔嗚尊",
    description: "大地に根を張り天へと伸びる樹木のように、人と人を繋ぐ縁の橋渡しがあなたの本質。春の息吹のような生命力で、出会いと成長を司ります。",
    strength: "あなたの最大の強みは「縁を紡ぐ力」。自然と人が集まり、気づけば誰かの支えになっている。新しい環境への適応力も高く、人間関係の潤滑油として場を和ませる天賦の才があります。積み重ねた信頼はやがて大きな森になります。",
    weakness: "気を遣いすぎて自分の本音を押し込めることがあります。「NOと言えない」という場面で蓄積した疲労が、ある日一気に溢れることも。自分の縁を守るためにも、境界線を引く勇気が必要です。",
    worryAdvice: {
      work: "大国主命は「縁を結ぶ者は、まず自分の立ち位置を知れ」と伝えています。今の職場でどんな縁を育てたいか、紙に書き出してみてください。良い縁は「求める」より「育てる」ことで引き寄せられます。人間関係の改善は、あなたの強みである「橋渡し」を意識的に使うことから始まります。",
      love: "木属性は縁結びの神様に最も愛される属性。ただし「縁」は急かすほど遠ざかります。出雲大社系の神社に参拝し、自分が「どんな人と、どんな関係を築きたいか」を神様に伝えてください。受け身ではなく、自分から縁の種を蒔く行動が吉。",
      family: "木の根のように、家族の絆は「見えない部分」で繋がっています。直接言葉にするのが難しいなら、共に食事をする・同じ場所を訪れるなど「行動」で縁を育ててください。素戔嗚尊ゆかりの神社への参拝が家族の絆を深めます。",
      self: "他者への気遣いで自分の感覚が鈍くなっているだけです。神社で一人の静かな時間を持ち、「自分は何が好きで、何が嫌なのか」を聞き直してください。木が天へ向かって伸びるように、あなたの成長に終わりはありません。",
    },
    monthlyGuide: "春の早朝、東向きの神社との相性が抜群。境内の緑豊かな神域で深呼吸することで縁の引き寄せが強まります。参拝は午前中がベスト。縁結び・縁起のお守りを授かることも効果的です。",
    compatibleType: "水属性・金属性",
    deityGuideMessage: "新しい出会いが運命を動かす時期です。偶然の縁を大切に。",
    benefits: ["縁結び", "家内安全", "健康", "開運"],
    deityHints: ["大国主", "出雲", "春日", "住吉"],
    theme: {
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      accent: "text-emerald-700",
      gradient: "from-emerald-700 to-green-600",
      badge: "bg-emerald-100 text-emerald-800",
    },
  },
  火: {
    reading: "か",
    keyword: "浄化・情熱・照らす力",
    guardian: "天照大神・火之迦具土神",
    description: "燃える炎のように周囲を照らし、不浄を払う浄化の力。情熱と誠意で人を引き寄せ、闇の中に道を示す存在です。あなたの輝きは太陽のように周囲を温めます。",
    strength: "あなたの最大の強みは「場を変える存在感」。その場に入るだけで空気が変わり、人々が自然と前向きになれる。情熱と誠意の高さは他の追随を許さず、一度決めたことへの推進力は圧倒的です。",
    weakness: "燃えすぎると周囲を疲れさせることがあります。完璧主義な面から自分にも他者にも高い基準を求めがち。外部の評価に感情が振り回される場面も。「休む勇気」を持つことが長く輝き続ける秘訣です。",
    worryAdvice: {
      work: "天照大神は「光は柔らかく照らすとき、最も遠くまで届く」と教えています。今の職場で全力を燃やすのではなく、光を絞って必要な場所だけを照らす戦略が長期的に最大の成果を生みます。まず自分の火を守ることを最優先に。",
      love: "火属性の情熱は相手に「重い」と感じさせることがあります。愛情表現は相手のペースに合わせ、じっくりと温める静かな炎のように。太陽神系の神社参拝で、与えることと受け取ることのバランスを整えてください。",
      family: "あなたの情熱が家族のプレッシャーになっている可能性があります。「こうあるべき」という家族像を少し緩め、相手の在り方をそのまま受け入れる参拝を。伊勢神宮や天照大神をお祀りする神社への参拝が特に効果的です。",
      self: "天照大神が岩戸に隠れたように、一度「自分の中に引きこもる」時間を作ることで内なる光を再発見できます。外の評価ではなく、自分が「何のために燃えているか」という問いに正直に向き合う時間を作ってください。",
    },
    monthlyGuide: "夏・正午頃・南向きの神社との相性が抜群。太陽が高い時間帯の参拝で浄化のエネルギーが最大化されます。朱色の鳥居が印象的な神社が特に縁深く、勝負事の前の参拝に最適。",
    compatibleType: "木属性・土属性",
    deityGuideMessage: "あなたの情熱が道を切り開く時期です。正直な気持ちを大切に。",
    benefits: ["厄除け", "勝負運", "出世", "開運"],
    deityHints: ["天照", "伊勢", "稲荷", "住吉"],
    theme: {
      bg: "bg-orange-50",
      border: "border-orange-300",
      accent: "text-orange-700",
      gradient: "from-orange-700 to-red-600",
      badge: "bg-orange-100 text-orange-800",
    },
  },
  土: {
    reading: "ど",
    keyword: "安定・豊穣・包容力",
    guardian: "稲荷大神・豊受大神",
    description: "大地のように揺るぎない安定感と、万物を育む包容力。すべてを受け止め、豊かさへと変える力があなたの本質です。",
    strength: "あなたの最大の強みは「安心感を与える力」。そばにいるだけで人が落ち着き、深く信頼される。長期的な積み重ねへの忍耐力と、誰も見捨てない包容力は周囲から深く頼りにされています。",
    weakness: "支えすぎて自分が疲弊しやすい面があります。「断れない」「自分より他者を優先してしまう」というパターンで、知らぬ間にエネルギーを消耗。変化への適応に時間がかかり、環境の急変がストレスになることも。",
    worryAdvice: {
      work: "稲荷大神は「豊かな土地は、まず自分自身が養われているとき」と伝えています。今のあなたに必要なのは「与える前に、受け取る」こと。一つお願いを断ってみる勇気が、職場の縁を健全に整えます。自分への投資が周囲への最大の貢献になります。",
      love: "土属性は縁の「土台」を作る人。焦らず時間をかけて信頼関係を育てることが最も幸せな縁への近道です。「縁結び」より「縁を育てる」神社への参拝が効果的。豊受大神にゆかりの神社で、豊かな縁の土台を整えてください。",
      family: "あなたは家族の「大黒柱」として頑張りすぎているかもしれません。今一度、あなた自身が家族から「受け取ること」を練習してみてください。稲荷神社への参拝が家族全体の豊かさを引き寄せます。",
      self: "大地は動かない強さを持ちますが、それは「鈍い」のではなく「深い根を持つ」から。あなたの慎重さと誠実さは、人生において最大の財産です。焦らなくていい。神社で「今の自分でいい」という確信を受け取ってください。",
    },
    monthlyGuide: "季節の変わり目・午前中・稲荷系・豊作系の神社との相性が抜群。土用の時期（年4回）が特にパワーが高まります。赤い鳥居が連なる稲荷系神社での参拝が金運・仕事運を整えます。",
    compatibleType: "火属性・金属性",
    deityGuideMessage: "地道な積み重ねが実りの季節を呼びます。焦らず一歩一歩。",
    benefits: ["商売繁盛", "金運", "家内安全", "五穀豊穣"],
    deityHints: ["稲荷", "豊受", "大国主", "八幡"],
    theme: {
      bg: "bg-amber-50",
      border: "border-amber-300",
      accent: "text-amber-700",
      gradient: "from-amber-700 to-yellow-600",
      badge: "bg-amber-100 text-amber-800",
    },
  },
  金: {
    reading: "こん",
    keyword: "決断・清廉・本質を見抜く",
    guardian: "八幡大神・鹿島大神",
    description: "刃のような鋭い決断力と、本質を見抜く明晰さ。曲がったものを正す強さと、清廉さへの揺るぎないこだわりがあなたの本質です。",
    strength: "あなたの最大の強みは「判断力と誠実さ」。本質を瞬時に見抜き、正しいことに一切の妥協をしない。その清廉さと決断の速さは困難な場面でこそ輝きます。信頼される理由はこの真摯さにあります。",
    weakness: "高すぎる基準が人間関係の摩擦を生むことがあります。「なぜこれがわからないのか」というストレスを感じやすく、完璧さを求めるあまり孤独になることも。「強さとは許す力の中にある」というメッセージを受け取ってください。",
    worryAdvice: {
      work: "八幡大神は「すべてを正そうとする者は、最終的に自分を傷つける」と伝えています。今の職場で変えられること・変えられないことを明確に分け、変えられないことへのエネルギーを手放す決断が必要です。戦略的に「諦める」ことが、最高の知恵です。",
      love: "金属性の高い基準は「理想の相手像」が厳しすぎることも。鹿島神宮参拝で「正しいこと」と「好きなこと」のバランスを整えてみてください。「完璧な相手」ではなく「一緒に成長できる相手」を探す視点の転換が縁を引き寄せます。",
      family: "あなたの正義感は正しいですが、家族は「正しさ」より「温かさ」を求めていることが多いです。今一度、正すより「共にいる」時間を増やしてみてください。八幡宮での参拝で家族の絆を守る力を授かってください。",
      self: "あなたが自分を責めるのは、高い理想を持っているから。その理想は宝物です。ただ、今日の自分に「今日もよく頑張った」と一言かけてあげることが、本当の意味での強さへの近道です。自分への清廉さも大切に。",
    },
    monthlyGuide: "秋・夕方前・西向きの武神系神社との相性が抜群。鹿島神宮・香取神宮・八幡宮での参拝で決断力と清廉さが研ぎ澄まされます。勝負事や転機の前に参拝するのが特に効果的。",
    compatibleType: "土属性・水属性",
    deityGuideMessage: "迷いを断ち切る決断の時が来ています。信念を持って前へ。",
    benefits: ["勝負運", "必勝祈願", "仕事運", "厄除け"],
    deityHints: ["八幡", "鹿島", "春日", "諏訪"],
    theme: {
      bg: "bg-slate-50",
      border: "border-slate-300",
      accent: "text-slate-700",
      gradient: "from-slate-700 to-zinc-600",
      badge: "bg-slate-100 text-slate-800",
    },
  },
  水: {
    reading: "すい",
    keyword: "浄化・直感・深い感受性",
    guardian: "弁財天・住吉大神",
    description: "水のように自在に流れ、すべてを洗い清める力。深い直感と感受性で、言葉にならない真実を感じ取る力があなたの本質です。",
    strength: "あなたの最大の強みは「場の空気を読む力と深い共感性」。他者が気づかないサインをキャッチし、言葉にならない感情を理解する。その洞察力と柔軟性はどんな環境でも活きていきます。",
    weakness: "感受性の高さゆえに傷つきやすい面があります。他人の感情を引き受けすぎて消耗したり、「なんとなく嫌な感じ」が続いて原因が特定できずモヤモヤすることも。定期的な「心の浄化」の時間が必要です。",
    worryAdvice: {
      work: "弁財天は「清らかな水は、どんな器にも美しく収まる」と伝えています。今の職場環境があなたに合っているかを見極める時期です。水は自然な道を選ぶように、今の状況が「流れに逆らっている」のかを静かに感じてみてください。",
      love: "水属性は相手の感情に敏感すぎて、自分の気持ちを後回しにしがちです。「私はどうしたいのか」を先に決め、その上で相手と向き合う順番が大切。縁結びと技芸の神・弁財天に正直な気持ちを伝えてください。",
      family: "水は表面には見えなくても、深いところでつながっています。無理に会話しなくても、同じ空間にいることを続けることで、水面下の縁は育ちます。住吉大社参拝で清浄な家族の縁を整えてください。",
      self: "あなたが感じる「なんとなく不安」は直感からのメッセージです。その感覚を日記に書き出すことで、水の如く澄み渡る心が戻ってきます。水辺のある神社での参拝が特に効果的。自分の直感を信頼してください。",
    },
    monthlyGuide: "冬・早朝・北向き・水辺に近い神社との相性が抜群。川や海のそばの神社での参拝で、直感と感受性が澄み渡ります。弁財天をお祀りする神社は水属性の方に特に縁が深いです。",
    compatibleType: "金属性・木属性",
    deityGuideMessage: "直感を信じて、流れに身を任せてください。清らかな縁が近づいています。",
    benefits: ["技芸上達", "健康", "縁結び", "浄化"],
    deityHints: ["弁財天", "住吉", "出雲", "水神"],
    theme: {
      bg: "bg-blue-50",
      border: "border-blue-300",
      accent: "text-blue-700",
      gradient: "from-blue-700 to-cyan-600",
      badge: "bg-blue-100 text-blue-800",
    },
  },
};

export type DiagnoseResult = {
  year: number;
  month: number;
  zodiac: (typeof ZODIAC)[number];
  stem: (typeof STEMS)[number];
  sexagenary: string;
  element: ElementKey;
  elementData: (typeof ELEMENTS)[ElementKey];
  typeName: string;
  typeModifier: string;
  worry: WorryKey;
  worryLabel: string;
  shrines: Array<{
    id: number;
    name: string;
    slug: string;
    prefecture: string | null;
    photo_url: string | null;
    description: string | null;
    benefits: string[];
    shrine_type: string | null;
    reasonLabel: string;
  }>;
};

function parseBenefits(json?: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
}

const WORRY_LABELS: Record<WorryKey, string> = {
  work:   "仕事・職場の人間関係",
  love:   "恋愛・縁",
  family: "家族・夫婦関係",
  self:   "自分自身・自己信頼",
};

const WORRY_REASON: Record<WorryKey, string> = {
  work:   "仕事運・縁起向上",
  love:   "縁結び・恋愛成就",
  family: "家内安全・縁深め",
  self:   "開運・心の浄化",
};

export async function GET(req: NextRequest) {
  const year  = Number(req.nextUrl.searchParams.get("year")  ?? "");
  const month = Number(req.nextUrl.searchParams.get("month") ?? "0");
  const worry = (req.nextUrl.searchParams.get("worry") ?? "self") as WorryKey;

  const currentYear = new Date().getFullYear();
  if (!year || year < 1900 || year > currentYear) {
    return NextResponse.json({ error: "invalid year" }, { status: 400 });
  }
  if (!month || month < 1 || month > 12) {
    return NextResponse.json({ error: "invalid month" }, { status: 400 });
  }
  if (!["work", "love", "family", "self"].includes(worry)) {
    return NextResponse.json({ error: "invalid worry" }, { status: 400 });
  }

  const zodiacIndex = (year + 8) % 12;
  const stemIndex   = (year + 6) % 10;
  const zodiac      = ZODIAC[zodiacIndex];
  const stem        = STEMS[stemIndex];
  const sexagenary  = `${stem.kanji}${zodiac.kanji}`;
  const element     = stem.element as ElementKey;
  const elementData = ELEMENTS[element];

  const typeName    = STEM_ARCHETYPES[stemIndex];
  const typeModifier = ZODIAC_MODIFIERS[zodiacIndex];

  // ─── 神社検索: 複数キーワードで3社を確保 ────────────────────────────────
  const seen = new Set<number>();
  const pool: ShrineRow[] = [];

  const addRows = (rows: ShrineRow[]) => {
    for (const r of rows) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        pool.push(r);
      }
    }
  };

  // 1st: 属性に紐づく守護神キーワードで検索
  for (const hint of elementData.deityHints) {
    if (pool.length >= 9) break;
    addRows(searchSpots({ deity: hint, limit: 10 }).rows);
  }

  // 2nd: まだ3社未満なら御利益キーワードで補完
  if (pool.length < 3) {
    for (const benefit of elementData.benefits) {
      if (pool.length >= 9) break;
      addRows(searchSpots({ benefit, limit: 10 }).rows);
    }
  }

  // 写真付き優先でシャッフルして3社選ぶ
  const withPhoto    = pool.filter((r) => r.photo_url);
  const withoutPhoto = pool.filter((r) => !r.photo_url);
  const candidates   = [...withPhoto, ...withoutPhoto].slice(0, 9);
  const selected     = candidates.sort(() => Math.random() - 0.5).slice(0, 3);

  const shrines = selected.map((r) => ({
    id:          r.id,
    name:        r.name,
    slug:        spotSlug({ id: r.id, slug: r.slug }),
    prefecture:  r.prefecture,
    photo_url:   r.photo_url,
    description: r.description ? r.description.slice(0, 100) + "…" : null,
    benefits:    parseBenefits(r.benefits).slice(0, 4),
    shrine_type: r.shrine_type,
    reasonLabel: WORRY_REASON[worry],
  }));

  return NextResponse.json({
    year, month, zodiac, stem, sexagenary,
    element, elementData,
    typeName, typeModifier,
    worry, worryLabel: WORRY_LABELS[worry],
    shrines,
  } satisfies DiagnoseResult);
}
