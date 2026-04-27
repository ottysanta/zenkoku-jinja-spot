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
    deityMessage: string;   // 神様からの深いメッセージ（2〜3文）
    prayerGuide: string;    // 参拝の仕方・心がまえ
    praySentence: string;   // 祈る言葉（一言）
    shrineTip: string;      // どんな神社を選ぶべきか
    visitTime: string;      // 参拝に適した時間帯・季節
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
    deityMessage:
      "あなたが感じるプレッシャーは、まだ使われていない力の重さです。八幡大神は「勝つ」ことより「正しく動く」ことに宿る勝利を教えてくれます。今の苦しさは、次の段階へ進む前の静かな蓄積。恐れず、自分の芯を持ち続けてください。",
    prayerGuide:
      "拝殿の前で、背筋をまっすぐ伸ばして立ちましょう。今の悩みを正直に言葉にして心の中で伝えてください。「助けてほしい」よりも「正しく進む力をください」という姿勢で臨むと、八幡大神とのご縁が深まります。",
    praySentence: "正しき道をまっすぐに進む力と、迷わぬ心をお授けください",
    shrineTip:
      "八幡宮・春日大社系の神社が特に適しています。武神系の社は「決断・前進・誠実」のご縁が強く、転職や昇進の節目に参拝する人も多い場所です。",
    visitTime: "朝6〜9時の清々しい時間帯がベスト。特に月初・年始・新しい案件が始まる前日が吉。",
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
    deityMessage:
      "大国主命は、縁を「結ぶ」神であると同時に「解く」神でもあります。うまくいかない縁は、あなたをより深い出会いへ導くための通過点。自分自身を愛せる量だけ、相手を愛せます。今は相手を探すより、自分を満たす時間として神社に来てみてください。",
    prayerGuide:
      "縁結びの神社では、一人で静かに参拝するのが最もご縁が繋がりやすいと言われています。「○○さんと結ばれたい」より「最善の縁をお引き合わせください」と伝えると、神様に届きやすくなります。境内の木や石に触れながらゆっくり歩くと良いでしょう。",
    praySentence: "わたしにふさわしい、魂が喜ぶ縁をお引き合わせください",
    shrineTip:
      "出雲系・大神神社系・熊野大社系の縁結び社が特に力強いご縁を持っています。恋愛だけでなく、友人・仕事の縁にも通じる神様です。",
    visitTime: "日の出から昼前が縁結び参拝の黄金時間。春分・秋分前後は特に縁が動きやすい時期とされています。",
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
    deityMessage:
      "家族との摩擦は「愛の言い方」がすれ違っているサインです。天照大神は「光を分かち合うこと」を本質とする神。あなたが先に光を放つとき、家族は自然と温かくなります。誰かを変えようとするより、自分の内側を明るく保つことを神様は勧めています。",
    prayerGuide:
      "家族全員の名前と年齢を心の中で思い浮かべながら参拝しましょう。「この人たちが幸せでありますように」と伝えると、天照大神の御加護が家全体に広がります。代理参拝も心が込もっていれば届きます。",
    praySentence: "この家に、温かい光と安らぎが満ちますように",
    shrineTip:
      "伊勢神宮（内宮）・諏訪大社・住吉大社系の社が家庭の守護に強いご縁を持っています。地元の産土神（氏神様）への参拝も、家の守護として非常に大切です。",
    visitTime: "家族の誕生日・結婚記念日・子供の入学・卒業などの節目参拝が特に効果的。朝の清らかな時間帯が吉。",
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
    deityMessage:
      "不調は「止まれ」という体からのメッセージです。少彦名神は小さくとも知恵と癒しを宿す神。薬や治療と並行して、心を静める時間を持つことが回復の鍵になります。あなたの体は敵ではなく、あなたを守ろうとしているのです。",
    prayerGuide:
      "病気平癒の参拝では、不調の部位や状態を正直に神様に報告するつもりで伝えましょう。「○○が辛いです、回復の力をください」と具体的に伝える方が届きやすいとされています。参拝後はゆっくり境内を歩き、自然のエネルギーを感じてください。",
    praySentence: "わたしの体と心が本来の健やかさを取り戻せますように",
    shrineTip:
      "三輪山・大神神社・飛鳥坐神社・薬師系の神社が医薬・病気平癒に特に深いご縁を持ちます。温泉地近くの神社も心身の回復に良いとされています。",
    visitTime: "体調が比較的良い時間帯（午前中）に無理せず参拝を。春の芽吹きの時期（3〜4月）は回復エネルギーが高まります。",
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
    deityMessage:
      "稲荷大神は「与えるほど豊かになる」という循環の理を司ります。お金の不足を感じるとき、人は受け取ることに必死になりがちですが、神様が勧めるのは「先に感謝して動く」こと。小さな親切・感謝の言葉・誠実な仕事が、豊かさの水路を開きます。",
    prayerGuide:
      "稲荷系の神社では、参拝前に境内を一周して空気を感じてみましょう。「今あるものへの感謝」を最初に伝えてから、願いを述べると受け取られやすいとされています。商売の場合は屋号や事業内容を伝えると、より具体的なご縁が結ばれます。",
    praySentence: "今あるご縁と恵みに感謝し、さらなる豊かさを循環させてください",
    shrineTip:
      "伏見稲荷・豊川稲荷・三峯神社・恵比寿系の神社が商売・金運に特に強い力を持ちます。ビジネスの独立や新事業の立ち上げには、地元の稲荷社への報告参拝も大切です。",
    visitTime: "己巳（つちのとみ）の日は金運参拝の吉日。月始め・新月の日も新しい豊かさを招くとされています。朝の早い時間が最吉。",
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
    deityMessage:
      "菅原道真公はご自身の生涯を通じて「不当な扱いにも学び続けること」を示しました。結果が出なくても、諦めずに積み重ねた努力は必ず花開きます。合格は「通過点」であり、学ぶことそのものに価値があると道真公は伝えています。焦らず、一問一問を丁寧に。",
    prayerGuide:
      "天神様（天満宮）への参拝では、今取り組んでいる勉強や試験の内容を具体的に伝えましょう。「○○の試験に合格できますよう」と日程も添えると良いとされています。絵馬に願いを書く際は、合格後の自分の姿をイメージしながら書くと強く念が込められます。",
    praySentence: "努力を正しく積み重ねる力と、試験当日に実力を発揮できる心の安定をください",
    shrineTip:
      "全国の天満宮（北野天満宮・太宰府天満宮など）が最も適しています。合格祈願の鉛筆や守り札も境内で手に入ることが多く、お守りを机に置くと精神的な安定にも繋がります。",
    visitTime: "試験の1〜2ヶ月前・模試の前・新学期の始まりが参拝の好機。朝の澄んだ空気の中での参拝が集中力を高めます。",
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
    deityMessage:
      "厄とは「悪いもの」ではなく、「古い自分が脱ぎ捨てられるとき」のエネルギーです。祓戸大神は清めの神として、あなたの中の滞りを流し去ってくれます。転機の年は恐れるのではなく、自分が生まれ変わる年として迎えてください。節目を丁寧に祓うことで、次の段階がスムーズに開きます。",
    prayerGuide:
      "厄除け参拝では、まず手水舎で丁寧に手と口を清めることが重要です。「本厄・前厄・後厄」どれにあたるかを伝え、「清めて、新しい一年を歩ませてください」と祈りましょう。できれば年初（1〜3月）に参拝し、祈祷を受けるとより深く祓われます。",
    praySentence: "古いものを清めて手放し、新しい自分として次の季節へ踏み出す力をください",
    shrineTip:
      "成田山新勝寺・川崎大師・西新井大師などの三大大師、また各地の諏訪大社・熊野神社系が厄除けに強いご縁を持ちます。引越し・方位除けには北極星を祀る妙見系の社も適しています。",
    visitTime: "年初（元旦〜節分）が最も厄除けの力が強いとされる参拝期。厄年の誕生月前後の参拝も効果的です。",
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
