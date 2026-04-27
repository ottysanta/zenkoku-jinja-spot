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

// ─── 数秘術（ライフパスナンバー）────────────────────────────────────────────
export type NumerologyData = {
  number: number;
  name: string;
  keyword: string;
  essence: string;
  talent: string;
  shadow: string;
  shrineMessage: string;
  lifeTheme: string;
};

const NUMEROLOGY: Record<number, NumerologyData> = {
  1: {
    number: 1,
    name: "先駆者",
    keyword: "独立・創始・強い意志",
    essence: "あなたは「はじめの一歩」を踏み出す魂の持ち主です。誰も歩いていない道を切り拓き、新しい世界を創ることに使命感を感じます。他者の目や評価よりも、自分の内なる確信に従って行動できる稀有な存在。リーダーとして周囲を引っ張る力は、生まれながらに備わっています。",
    talent: "独自のアイデアを形にする開拓精神。周囲が躊躇する場面でも一番乗りで踏み出せる勇気と、誰もやっていないことを恐れずに始められる行動力。",
    shadow: "「自分でやった方が早い」という思考が孤独を生みやすい。協力を求めることを弱さと感じ、プライドの高さが柔軟性を奪う場合があります。",
    shrineMessage: "新しい道は、まず踏み出した者だけが見ることができる。あなたの意志が神々への最高の祈りです。",
    lifeTheme: "自らの足で新しい道を切り拓き、後に続く人たちのための光となる人生。",
  },
  2: {
    number: 2,
    name: "調和の人",
    keyword: "協調・受容・繊細な感受性",
    essence: "あなたは「人と人の間に橋をかける」魂の持ち主です。場の空気を敏感に読み取り、誰かが傷ついていることに誰より先に気づきます。表舞台よりも縁の下の力持ちとして輝き、その存在があるだけで場が安心に包まれます。縁結びの神様に最も愛されるタイプです。",
    talent: "相手の感情を瞬時に読み取る直感力。対立する人々の間を取り持つ調停力。深く聴き、相手が言葉にできない本音を引き出す力。",
    shadow: "自分の意見や気持ちを後回しにしすぎて知らぬ間に疲弊していることがある。優しさに付け込まれやすく、境界線を引くことが苦手な面も。",
    shrineMessage: "縁は強引に結ぶものではなく、やさしく育てるもの。あなたの穏やかさが最も深い縁を引き寄せます。",
    lifeTheme: "縁を紡ぎ、対立を溶かし、すべての人が安心できる場を創る人生。",
  },
  3: {
    number: 3,
    name: "表現者",
    keyword: "創造・喜び・言葉の力",
    essence: "あなたは「言葉と表現で世界を変える」魂の持ち主です。伝えることへの情熱と才能が生まれながらに備わっており、あなたの言葉は人の心に直接届きます。笑顔と明るさで場を照らし、周囲に喜びと活力を与える天性の才があります。神様から「伝えよ」という使命を受けています。",
    talent: "人の心を動かす言葉の選び方。難しい物事をわかりやすく伝える表現力。アイデアの豊かさと、それを形にする創造性。",
    shadow: "気持ちが乗らないと始められない気分屋な面がある。表現への恐れや批判への敏感さから、才能を眠らせてしまうことも。",
    shrineMessage: "あなたの言葉一つで誰かの人生が変わる。その力を恐れず、ただ真正直に伝えなさい。",
    lifeTheme: "才能と言葉を解き放ち、世界に喜びと美をもたらす人生。",
  },
  4: {
    number: 4,
    name: "礎の人",
    keyword: "安定・誠実・揺るぎない土台",
    essence: "あなたは「揺るぎない礎を築く」魂の持ち主です。地道な積み重ねの中にこそ価値を見出し、コツコツと一歩一歩を大切にする誠実さが最大の武器です。派手さはなくても、あなたが作ったものは100年の風雪に耐えます。神様は最も信頼できる仕事をあなたに託しています。",
    talent: "計画を最後まで実行する持続力と責任感。細部への注意力と手を抜かない誠実さ。長期にわたって信頼関係を築く安定感。",
    shadow: "変化への抵抗感が機会を逃すことがある。「正しい方法」にこだわりすぎて融通が利かない面も。完璧主義が自分と周囲を縛ることも。",
    shrineMessage: "土台が深ければ深いほど、高い塔が建てられる。あなたの着実さは、天へ続く道です。",
    lifeTheme: "誠実さと忍耐で世界に確かなものを残し、後の世代の礎となる人生。",
  },
  5: {
    number: 5,
    name: "自由の魂",
    keyword: "変化・冒険・枠を超える力",
    essence: "あなたは「常識の枠を超えていく」魂の持ち主です。同じ場所に留まることへの根本的な拒否感を持ち、変化と冒険の中にこそ生命力を感じます。多様な経験と人々との出会いがあなたを形成し、その豊富な経験知が人を助ける力になります。風の神様に愛される自由な魂です。",
    talent: "どんな環境にも素早く適応する柔軟性。新しい視点をもたらす発想力と行動力。人の縁を繋ぐ社交性と場を動かすエネルギー。",
    shadow: "「自由でいたい」という衝動が責任から逃げる方向に向くことがある。飽きっぽさと忍耐力の不足が途中で手放す原因になることも。",
    shrineMessage: "風は止まることなく吹き続けることで大気を浄化する。あなたの動きが世界に新鮮な息吹を届けます。",
    lifeTheme: "自由に風のように世界を旅し、どこへ行っても場に活力をもたらす人生。",
  },
  6: {
    number: 6,
    name: "愛の守護者",
    keyword: "愛情・責任・家族への献身",
    essence: "あなたは「愛で世界を包む」魂の持ち主です。家族・仲間・コミュニティへの深い愛情と責任感が、生きる原動力になっています。誰かのために尽くすことに喜びを感じ、その無条件の愛は周囲の人の心の安全基地になっています。神様から「愛を体現せよ」という使命を授かっています。",
    talent: "無条件の愛情と誰も見捨てない包容力。人の痛みに寄り添い癒しをもたらす力。責任感の強さとコミュニティの調和を守る力。",
    shadow: "愛情が過剰になり「してあげる」が期待に変わることがある。自分を犠牲にしすぎて燃え尽きることも。",
    shrineMessage: "真の愛は与えながら自分自身も満たされている状態から生まれます。まず自分への愛を忘れずに。",
    lifeTheme: "愛を循環させ、すべての縁の中に温かさをもたらす人生。",
  },
  7: {
    number: 7,
    name: "真理の探究者",
    keyword: "内省・神秘・見えない世界への感応",
    essence: "あなたは「見えない世界の真理を探る」魂の持ち主です。表面的な現象の奥にある本質を見抜く洞察力と、神秘的なものへの鋭い感応性を持っています。一人で深く思索する時間が魂の栄養であり、神社や聖地で感じ取るものが特別に深い、最もスピリチュアルなナンバーです。",
    talent: "物事の本質を見抜く洞察力。直感と分析の両方を使いこなす知性。神聖な場所でのエネルギーを感じ取る霊的な感受性。",
    shadow: "他者と距離を置きすぎて孤独になりやすい。完璧な答えを求めすぎて行動に移せないことも。内側に引きこもることで縁を遠ざけてしまうことがある。",
    shrineMessage: "神様はあなたに特別なアンテナを授けました。その感覚を信じ、直感の声に従って行動してください。",
    lifeTheme: "見えない世界の智恵を探り続け、その叡智で人々の道を照らす人生。",
  },
  8: {
    number: 8,
    name: "達成の人",
    keyword: "豊かさ・力・大いなる実現",
    essence: "あなたは「大きなものを現実に引き寄せる」魂の持ち主です。豊かさと力への追求は単なる欲ではなく使命感から来ています。目標に向かう推進力と、困難を力に変える精神的強さが際立ちます。神様から「豊かさを体現し、周囲に恵みを与えよ」という使命を授かっています。",
    talent: "目標を設定し現実に変える実現力。困難な状況でも諦めない精神的タフネス。組織や計画を動かすリーダーシップ。",
    shadow: "「成功」「結果」への執着が人間関係を壊すことがある。勝ち負けにこだわりすぎて過程の大切さを見失うことも。",
    shrineMessage: "真の豊かさは手に入れるものではなく流れるものです。受け取り、そして次の人へ渡す流れの中にこそ無限の恵みがあります。",
    lifeTheme: "力と豊かさを手にし、それを惜しみなく世界に循環させる人生。",
  },
  9: {
    number: 9,
    name: "完成の賢者",
    keyword: "奉仕・叡智・すべてを包む愛",
    essence: "あなたは「すべてを完成へと導く」魂の持ち主です。数秘術で最も大きな数であるライフパス9は、多くの経験と魂の成長を経てきた古い魂の証です。個人の利益を超えてより大きな視点で人々に貢献することに真の喜びを感じます。手放すことの美しさを知っている稀有な存在です。",
    talent: "大局を見渡す広い視野と深い人間理解。自分の経験を他者への知恵として与える力。執着を手放し流れに乗る精神的成熟。",
    shadow: "あまりにも多くを抱えすぎて疲弊することがある。「完璧な奉仕」を求めるあまり自分の人生を後回しにすることも。",
    shrineMessage: "すべての経験は意味を持ち、すべての出会いには魂の約束がある。あなたの人生そのものが神様への最大の奉仕です。",
    lifeTheme: "すべての経験を叡智に変え、人々が本来の輝きを取り戻す手助けをする人生。",
  },
  11: {
    number: 11,
    name: "光の使者",
    keyword: "直感・啓示・マスターナンバー",
    essence: "あなたは数秘術最高位のマスターナンバー11を持つ「光をもたらす使者」です。普通の人が見えないものを感じ取り、未来の流れを直感で把握する力を持っています。人生においてより高い使命を持ち、その敏感さと洞察力で多くの人に気づきと光をもたらすことを求められています。",
    talent: "他者の感情・状況・未来の流れを感じ取る卓越した直感力。インスピレーションを通じて人々に気づきをもたらす力。精神的な深さと場の本質を見抜く霊的な感受性。",
    shadow: "その感受性の強さゆえに精神的な疲弊や不安が起きやすい。高い理想と現実のギャップに苦しむことも。",
    shrineMessage: "あなたの感じる「なんとなく」は神様からのメッセージです。その声を信じ、光のある方向へ一歩を踏み出してください。",
    lifeTheme: "直感と霊感を磨き、人々の内なる光を呼び覚ます使者としての人生。",
  },
  22: {
    number: 22,
    name: "偉大なる建築家",
    keyword: "大いなる計画・現実化・社会変革",
    essence: "あなたは数秘術最高位のマスターナンバー22を持つ「大いなる計画を現実にする建築家」です。壮大なビジョンを具体的な形へと変える力を持ち、社会全体を動かすような大きなプロジェクトに関わることを求められます。夢想家であると同時に最も現実的な実行者です。",
    talent: "壮大なビジョンを具体的な計画に落とし込む力。大きなプロジェクトを推進するカリスマ性と実行力。社会システムや組織の仕組みを変革する力。",
    shadow: "その重大な使命感がプレッシャーとなり行動を止めることがある。完璧主義と高すぎる理想がスタートを遅らせる原因にもなる。",
    shrineMessage: "大きな使命は一人で背負うものではありません。神様は必要な時に必要な縁を繋いでくれます。まず一歩踏み出す勇気を持ってください。",
    lifeTheme: "世界を変える大きな計画を現実に変え、後世に続く偉大な礎を築く人生。",
  },
  33: {
    number: 33,
    name: "無条件の愛の体現者",
    keyword: "奉仕・癒し・無条件の愛",
    essence: "あなたは数秘術最高位のマスターナンバー33を持つ「無条件の愛を体現する師」です。ライフパス33は最も稀少なマスターナンバーであり、深い癒しと愛を世界にもたらすために生まれてきた魂です。条件なく愛する力と誰の痛みにも寄り添える共感力は人間の限界を超えています。",
    talent: "条件なく愛し受け入れる癒しの力。人の痛みに深く共鳴し癒しをもたらす存在感。精神的な師として人々の道を照らす叡智。",
    shadow: "その溢れる愛情ゆえに境界線を引けず自己犠牲が極限に達することも。他者の苦しみを自分のものとして背負いすぎることで消耗しやすい。",
    shrineMessage: "あなたが世界にもたらすべき最大の愛は、まず自分自身を愛することから始まります。",
    lifeTheme: "無条件の愛で人々を包み、この世界そのものを癒す光となる人生。",
  },
};

function calcLifePath(year: number, month: number, day: number): number {
  const digits = `${year}${month}${day}`.split("").map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split("").map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

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
  day: number;
  zodiac: (typeof ZODIAC)[number];
  stem: (typeof STEMS)[number];
  sexagenary: string;
  element: ElementKey;
  elementData: (typeof ELEMENTS)[ElementKey];
  typeName: string;
  typeModifier: string;
  lifePathNumber: number;
  numerologyData: NumerologyData;
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
  const day   = Number(req.nextUrl.searchParams.get("day")   ?? "1");
  const worry = (req.nextUrl.searchParams.get("worry") ?? "self") as WorryKey;

  const currentYear = new Date().getFullYear();
  if (!year || year < 1900 || year > currentYear) {
    return NextResponse.json({ error: "invalid year" }, { status: 400 });
  }
  if (!month || month < 1 || month > 12) {
    return NextResponse.json({ error: "invalid month" }, { status: 400 });
  }
  if (!day || day < 1 || day > 31) {
    return NextResponse.json({ error: "invalid day" }, { status: 400 });
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

  const lifePathNumber = calcLifePath(year, month, day);
  const numerologyData = NUMEROLOGY[lifePathNumber] ?? NUMEROLOGY[9];

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
    year, month, day, zodiac, stem, sexagenary,
    element, elementData,
    typeName, typeModifier,
    lifePathNumber, numerologyData,
    worry, worryLabel: WORRY_LABELS[worry],
    shrines,
  } satisfies DiagnoseResult);
}
