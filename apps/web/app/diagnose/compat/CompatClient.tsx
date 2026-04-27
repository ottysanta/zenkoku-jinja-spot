"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type ElementKey = "木" | "火" | "土" | "金" | "水";

const ELEMENTS: ElementKey[] = ["木", "火", "土", "金", "水"];

const ELEMENT_LABELS: Record<ElementKey, { emoji: string; reading: string; color: string; light: string }> = {
  木: { emoji: "🌿", reading: "もく", color: "#16a34a", light: "#f0fdf4" },
  火: { emoji: "🔥", reading: "か",   color: "#ea580c", light: "#fff7ed" },
  土: { emoji: "⛰️", reading: "ど",   color: "#d97706", light: "#fffbeb" },
  金: { emoji: "⚔️", reading: "こん", color: "#475569", light: "#f8fafc" },
  水: { emoji: "💧", reading: "すい", color: "#0284c7", light: "#f0f9ff" },
};

// ─── 五行相生相克 相性マトリクス ──────────────────────────────────────────
type CompatType = "ideal" | "good" | "equal" | "tension" | "challenge";

interface CompatInfo {
  type: CompatType;
  stars: number;
  label: string;
  headline: string;
  description: string;
  advice: string;
  strength: string;   // この関係が輝く場面
  caution: string;    // 気をつけること
  shrineTip: string;  // 一緒に参拝するなら
  prayTogether: string; // 一緒に伝える言葉
}

// 相生: 木→火→土→金→水→木
// 相克: 木→土→水→火→金→木
const COMPAT: Record<ElementKey, Record<ElementKey, CompatInfo>> = {
  木: {
    木: { type: "equal", stars: 3, label: "同属性", headline: "深い共鳴の関係", description: "同じ「縁結び・成長」のエネルギーを持つ者同士。価値観や感性が似ており、自然と打ち解けられます。ただし似すぎると互いの欠点を増幅させることも。", advice: "相手に自分の映し鏡を見るつもりで接すると、共に大きく成長できます。", strength: "新しいことへの挑戦・人脈を広げる場面で最高のチームになれる。", caution: "互いの「変化したい」エネルギーが衝突すると方向性が分かれやすい。定期的に目標をすり合わせて。", shrineTip: "大国主命を祀る出雲系・縁結び系の神社。二人で参拝すると縁がさらに深まる。", prayTogether: "「共に成長し、互いの縁を豊かに育てられますように。」" },
    火: { type: "good",  stars: 4, label: "相生（木→火）", headline: "あなたが相手を輝かせる関係", description: "木は火を燃やす燃料になります。あなたの縁結び・サポート力が相手の情熱を引き出し、輝かせる理想的な役割分担です。", advice: "あなたは縁の陰の立役者。相手が輝くほど、あなたの役割は深まります。", strength: "相手が「やる気を失った時」にあなたが自然に支えられる。挑戦的なプロジェクトで真価を発揮。", caution: "あなたが与えすぎて疲弊することがある。自分のエネルギーも大切に。", shrineTip: "天照系・稲荷系の神社。「この縁が互いを高め合えますように」と二人で祈願。", prayTogether: "「私たちそれぞれの役割を全うし、共に輝けますように。」" },
    土: { type: "tension", stars: 2, label: "相克（木→土）", headline: "あなたが相手を揺さぶる関係", description: "木の根は土を割って伸びます。あなたの成長志向が、相手の「安定・現状維持」を揺さぶる緊張が生まれやすいです。", advice: "相手の安定を壊すのではなく、その土壌をより豊かにする関わり方を意識して。", strength: "あなたが変化を起こし、相手がそれを安定させる役割分担ができれば最強の組み合わせになれる。", caution: "相手が「このままでいい」と思っているとき、あなたが変化を促しすぎると摩擦が生まれる。ペースを合わせて。", shrineTip: "稲荷系・豊受大御神系の神社で「この縁の摩擦をご縁に変えてください」と祈る。", prayTogether: "「互いの違いを力に変え、共により豊かな関係を育てられますように。」" },
    金: { type: "challenge", stars: 2, label: "相克（金→木）", headline: "相手の鋭さがあなたを試す関係", description: "金（刃）は木を切り落とします。相手の決断力・批判的視点があなたの繊細さを傷つけることがあります。", advice: "相手の鋭さを「剪定」と受け取れば、あなたはより美しく成長できます。", strength: "相手の鋭い指摘があなたの曖昧さを整理してくれる。論理と感性のバランスが取れると強いチームに。", caution: "相手の言葉がストレートすぎて傷つくことがある。「指摘は成長のため」と受け取る練習を。", shrineTip: "八幡系・鹿島神宮系の神社。「この縁が互いを強くしてくれますように」と二人で参拝。", prayTogether: "「互いの鋭さと柔らかさが、ひとつの強さになりますように。」" },
    水: { type: "ideal", stars: 5, label: "相生（水→木）", headline: "相手があなたを育てる理想の関係", description: "水は木を育てます。相手の深い感受性と包容力があなたの成長を最大に引き出す、最も相性の良い組み合わせです。", advice: "この縁を大切に。相手はあなたにとって「育て手」。素直に受け取ることが大切。", strength: "相手がいるだけであなたの能力が最大化される。長期的なパートナーシップ・人生の伴侶として最上の縁。", caution: "あなたが成長するにつれ、相手を「追い越した」と感じることがあるかもしれない。感謝を忘れずに。", shrineTip: "出雲大社・縁結び系の神社が最もこの縁を深める。二人で参拝することで縁が完成する。", prayTogether: "「この縁をいつまでも大切に育て、互いの最高を引き出し合えますように。」" },
  },
  火: {
    木: { type: "ideal",   stars: 5, label: "相生（木→火）", headline: "相手があなたを燃やす理想の関係", description: "木があなたの炎に燃料を与えます。相手の縁結び・サポート力があなたの情熱をさらに輝かせる最高の組み合わせ。", advice: "相手の支えを受け取ることで、あなたの可能性は無限に広がります。", strength: "新しいチャレンジ・ビジネス・クリエイティブな挑戦で二人の力が最大化される。", caution: "相手の支えに甘えすぎないこと。相手も感謝を必要としている。", shrineTip: "天照系・稲荷系の神社で二人の縁を深める参拝。「共に燃え続けられますように」と祈る。", prayTogether: "「この縁が私たちを共に高め合い、輝き続けられますように。」" },
    火: { type: "equal",   stars: 3, label: "同属性", headline: "燃え上がる共鳴の関係", description: "情熱と誠意が共鳴し、共にいると大きなエネルギーが生まれます。ただし二つの炎は燃え上がりすぎて互いを消耗させることも。", advice: "お互いの炎を競わず、同じ方向を照らすことで無限の可能性が生まれます。", strength: "共通の目標があるときに最強。同じビジョンに向かう二人は誰も止められない。", caution: "意見が衝突すると「火花」が散りやすい。感情が高ぶったら一度距離を置いて。", shrineTip: "天照系・伏見稲荷のような火のエネルギーが強い神社。「共に同じ方向に燃えられますように」と祈る。", prayTogether: "「私たちの情熱が、互いを傷つけることなく、共に前を照らしますように。」" },
    土: { type: "good",    stars: 4, label: "相生（火→土）", headline: "あなたが相手を豊かにする関係", description: "燃えた後の灰が土になるように、あなたの情熱が相手の豊かさを育みます。あなたが積極的に動くことで関係が深まります。", advice: "あなたのエネルギーが相手の安定を支えています。遠慮なく輝いて。", strength: "あなたが動いて相手が安定させる。スタートアップ的な挑戦から長期的な安定への変換が得意な関係。", caution: "あなたの変化スピードに相手がついて来られないことがある。「待つ」優しさも大切に。", shrineTip: "稲荷系・豊受大御神系。「私たちの縁が豊かな実りをもたらしますように」と参拝。", prayTogether: "「私たちの情熱が、やがて豊かな安定と実りになりますように。」" },
    金: { type: "tension", stars: 2, label: "相克（火→金）", headline: "あなたが相手の鋭さを溶かす関係", description: "火は金属を溶かします。あなたの情熱・感情が相手の論理的・清廉な部分を崩す摩擦が生まれやすいです。", advice: "相手の清廉さをリスペクトしつつ、自分の炎を制御することで関係が整います。", strength: "あなたの情熱が相手の「完璧主義の鎧」を柔らかくし、人間的なつながりを生み出せる。", caution: "相手がルールや論理を大切にするとき、あなたの感情的なアプローチが摩擦を生む。まず聴くこと。", shrineTip: "八幡系の神社でバランスを整える参拝。「私たちの違いを強さに変えてください」と祈る。", prayTogether: "「情熱と清廉さが調和して、より深い縁になれますように。」" },
    水: { type: "challenge", stars: 2, label: "相克（水→火）", headline: "相手の深さがあなたの炎を試す", description: "水は火を消します。相手の冷静な洞察や感情の深さが、あなたの情熱の空回りを指摘することがあります。", advice: "相手の冷静さをあなたの過熱を鎮める「恵みの雨」として受け取ると関係が深まります。", strength: "あなたの情熱に相手の深い洞察が加わると、「行動と戦略」が揃った最強のペアになれる。", caution: "あなたが感情的になるとき、相手の冷静さが「無関心」に見えることがある。言葉で気持ちを確認して。", shrineTip: "弁財天系・水の神様を祀る神社。「私たちの炎と水が調和できますように」と祈る。", prayTogether: "「熱さと深さが混ざり合い、共にひとつの流れを作れますように。」" },
  },
  土: {
    木: { type: "challenge", stars: 2, label: "相克（木→土）", headline: "相手の成長があなたを揺さぶる", description: "木の根があなたの安定を揺さぶります。相手の変化志向・新しい縁の追求が、あなたの「変わらないこと」への価値観と摩擦を生みます。", advice: "相手の変化をあなたの土壌を豊かにする「根」として受け入れることが鍵。", strength: "相手の変化に対してあなたの安定した土台が「地に足のついた実行力」をもたらせる。", caution: "相手の変化スピードにプレッシャーを感じやすい。「変わることへの恐れ」を正直に話すと関係が深まる。", shrineTip: "大国主命系の神社。「変化と安定が調和できますように」と祈る。", prayTogether: "「私たちの変化と安定が、共に豊かな実りをもたらしますように。」" },
    火: { type: "ideal",   stars: 5, label: "相生（火→土）", headline: "相手があなたを豊かにする理想の関係", description: "火の情熱がやがて豊かな土になります。相手のエネルギーがあなたの安定と豊かさをさらに深める最良の組み合わせ。", advice: "相手の情熱を受け取ることで、あなたの大地はより肥沃になります。", strength: "相手の動きにあなたの安定が加わると、「挑戦と継続」が揃った最強ペアに。長期的なビジョンに特に強い。", caution: "相手の動きに付き合いすぎて消耗しないよう、自分のペースを守ること。", shrineTip: "稲荷系・伊勢系の神社が最もこの縁を高める。「共に豊かな実りを育めますように」と二人で参拝。", prayTogether: "「この縁が私たちに豊かさと情熱をいつまでももたらしますように。」" },
    土: { type: "equal",   stars: 3, label: "同属性", headline: "揺るぎない安定の関係", description: "同じ「安定・包容力」のエネルギーが共鳴します。非常に安定した関係ですが、変化や刺激が少なくなりがちです。", advice: "互いの「支え合い」を言葉にして確認することで、関係がさらに深まります。", strength: "長期的な信頼関係・家族的なつながりに最強。一緒にいると安心できる存在同士。", caution: "安定すぎて「惰性」になりやすい。定期的に「新しい体験」を一緒にすることで縁が活性化する。", shrineTip: "住吉大社系・家内安全の神社。「この安定した縁がずっと続きますように」と二人で参拝。", prayTogether: "「この揺るぎない縁が、これからもずっと共に豊かでありますように。」" },
    金: { type: "good",   stars: 4, label: "相生（土→金）", headline: "あなたが相手を輝かせる関係", description: "土の中から金が生まれるように、あなたの積み重ねと安定が相手の判断力・清廉さをさらに輝かせます。", advice: "相手を育てる「地盤」として自分の役割に誇りを持って。", strength: "あなたの安定した支えが相手の能力を最大化させる。長期的なパートナーシップで最強の組み合わせ。", caution: "あなたが縁の下に回りすぎて存在感が薄まることがある。自分の功績を正直に伝えて。", shrineTip: "八幡系・春日大社系の神社。「この縁が互いを高め合いますように」と参拝。", prayTogether: "「私たちの安定と輝きが、共により大きな実りをもたらしますように。」" },
    水: { type: "tension", stars: 2, label: "相克（土→水）", headline: "あなたが相手の流れを止める関係", description: "堤防（土）が水の流れを止めるように、あなたの安定志向が相手の自由な感受性・流れを制限することがあります。", advice: "相手の「流れ」を止めるのではなく、安全な水路を作る役割を意識して。", strength: "あなたが器（堤防）になることで、相手の感受性が深く美しい湖になれる。", caution: "相手の自由な感情の動きを「不安定」と感じて制限してしまいがち。相手のペースを尊重して。", shrineTip: "弁財天・住吉系の神社。「私たちの安定と流れが調和できますように」と祈る。", prayTogether: "「安定と流れが共鳴して、美しいひとつの縁になりますように。」" },
  },
  金: {
    木: { type: "tension", stars: 2, label: "相克（金→木）", headline: "あなたの鋭さが相手を試す", description: "刃（金）が木を切るように、あなたの決断力・批判的視点が相手の繊細な縁結びの感性を傷つけることがあります。", advice: "剪定は木を美しくします。あなたの鋭さを「相手の成長のため」に使うと関係が整います。", strength: "あなたの明確な指摘が相手の「ぼんやりした可能性」を形にする手助けになれる。", caution: "ストレートな物言いが相手を傷つけやすい。一言添える優しさが縁を守る。", shrineTip: "大国主命・縁結び系の神社。「私たちの鋭さと柔らかさが調和しますように」と祈る。", prayTogether: "「互いの強さと繊細さが、美しい縁として咲きますように。」" },
    火: { type: "challenge", stars: 2, label: "相克（火→金）", headline: "相手の情熱があなたを溶かそうとする", description: "炎が金属を溶かすように、相手の感情的・情熱的なアプローチがあなたの清廉さ・論理性を崩しに来ることがあります。", advice: "相手の熱量をあなたの「再鍛造」の機会として受け取ることで、さらに強くなれます。", strength: "相手の情熱があなたの「固すぎる部分」を柔らかくし、人間的な魅力が増す。", caution: "相手の感情的なアプローチを「非論理的」と切り捨てると関係が冷える。感情も一つの情報と受け取って。", shrineTip: "八幡系・春日大社系の神社。「情熱と清廉さが調和できますように」と二人で参拝。", prayTogether: "「私たちの炎と輝きが、溶け合ってより強い縁になりますように。」" },
    土: { type: "ideal",   stars: 5, label: "相生（土→金）", headline: "相手があなたを輝かせる理想の関係", description: "土の中から金が生まれます。相手の安定・積み重ね・包容力があなたの判断力をさらに研ぎ澄ます最高の組み合わせ。", advice: "相手の安定した支えを素直に受け取ることで、あなたの能力は最大に輝きます。", strength: "相手の安定した基盤があって初めてあなたの本来の輝きが出る。長期的な信頼関係に最高の組み合わせ。", caution: "相手の「安定してほしい」という期待にプレッシャーを感じることがある。感謝を伝えながら自分のペースも守って。", shrineTip: "稲荷系・春日大社系が最もこの縁を深める神社。「この縁が最高の輝きをもたらしますように」と二人で参拝。", prayTogether: "「支えてくれる縁に感謝し、共に最高の輝きを目指しますように。」" },
    金: { type: "equal",   stars: 3, label: "同属性", headline: "鋭い共鳴の関係", description: "同じ「決断・清廉」のエネルギーが共鳴します。互いをリスペクトできれば最強のチームになれますが、意地の張り合いにも注意。", advice: "「正しさ」より「共に歩むこと」を優先すると、最強の関係になれます。", strength: "互いの判断力が共鳴するとき、誰も止められない最強ペアになれる。ビジネス・目標達成に最高。", caution: "「どちらが正しいか」の争いが起きやすい。「二人で勝つ」ことを最優先に置くことが鍵。", shrineTip: "鹿島神宮・八幡系の神社。「共に正しい道を歩めますように」と二人で祈る。", prayTogether: "「私たちの判断力と清廉さが、共に正しい道を照らしますように。」" },
    水: { type: "good",   stars: 4, label: "相生（金→水）", headline: "あなたが相手を清める関係", description: "金から清らかな水が生まれます。あなたの清廉さ・決断力が相手の感受性・直感をさらに澄み渡らせます。", advice: "あなたが誠実であり続けることが、相手の深い力を最大に引き出します。", strength: "あなたの明確さが相手の曖昧な感受性を「言葉」にする助けをする。クリエイティブなペアに最高。", caution: "あなたがリードしすぎると相手の自由な流れを制限してしまうことがある。方向だけ示して、あとは委ねて。", shrineTip: "弁財天・住吉系の神社。「この縁が清らかに流れますように」と二人で参拝。", prayTogether: "「清廉さと感受性が出会い、より澄んだ縁になりますように。」" },
  },
  水: {
    木: { type: "good",    stars: 4, label: "相生（水→木）", headline: "あなたが相手を育てる関係", description: "水が木を育てるように、あなたの感受性・包容力が相手の縁結び・成長の力をさらに引き出します。", advice: "相手の可能性を信じて見守ることが、あなたの最大の貢献です。", strength: "相手の才能があなたの深い愛情で開花する。育てる・支える関係に最高の組み合わせ。", caution: "与えすぎて自分が空っぽになることがある。あなた自身を補充する時間も必要。", shrineTip: "大国主命・縁結び系の神社。「この縁が豊かに育ちますように」と二人で参拝。", prayTogether: "「私の感受性が、あなたの可能性を最大に育てられますように。」" },
    火: { type: "tension", stars: 2, label: "相克（水→火）", headline: "あなたの深さが相手の炎を試す", description: "水は火を消します。あなたの冷静な洞察や感情の深さが、相手の情熱の空回りを鎮める場面があります。", advice: "相手の炎を「消す」のではなく「方向づける」関わり方で関係が整います。", strength: "相手の情熱があなたの深い洞察と合わさると「行動×戦略」の最強ペアになれる。", caution: "あなたの静けさが相手に「冷たい」と受け取られやすい。言葉で温かさを伝える意識を。", shrineTip: "弁財天・天照系の神社。「情熱と深さが調和できますように」と祈る。", prayTogether: "「私たちの深さと情熱が、互いを高め合えますように。」" },
    土: { type: "challenge", stars: 2, label: "相克（土→水）", headline: "相手の安定があなたの流れを止める", description: "堤防（土）が水の流れを制限するように、相手の安定志向・現状維持があなたの自由な感受性・流れを制限することがあります。", advice: "相手の堤防をあなたを守る器として受け取ることで、深く美しい湖になれます。", strength: "相手の安定がある中でこそ、あなたの感受性が最大の深さを持てる。守られることで本来の力を発揮。", caution: "「自由でいたい」という本能と相手の安定志向の間で窮屈さを感じやすい。正直に伝えることが大切。", shrineTip: "住吉大社系の神社。「流れと安定が共鳴できますように」と二人で祈る。", prayTogether: "「自由と安定が共に在って、深い縁が育ちますように。」" },
    金: { type: "ideal",   stars: 5, label: "相生（金→水）", headline: "相手があなたを清める理想の関係", description: "金から清らかな水が生まれます。相手の清廉さ・決断力があなたの感受性・直感をさらに澄み渡らせる最高の組み合わせ。", advice: "相手の誠実さを受け取ることで、あなたの直感はさらに研ぎ澄まされます。", strength: "相手の明確さがあなたの「感じるけど言葉にできない」ものを言語化してくれる。最高の相互補完関係。", caution: "相手の論理性があなたの直感を否定するように感じることがある。あなたの感覚も立派な「情報」と伝えて。", shrineTip: "弁財天・住吉系の神社が最もこの縁を高める。「この縁が清らかに澄み渡りますように」と二人で参拝。", prayTogether: "「清廉さと感受性が出会い、最高に澄んだ縁が育ちますように。」" },
    水: { type: "equal",   stars: 3, label: "同属性", headline: "深く静かな共鳴の関係", description: "同じ「直感・感受性」のエネルギーが共鳴します。深いところで理解し合えますが、二人とも流されやすい面があるので注意。", advice: "互いの感情を言葉にして確認し合うことで、深い信頼関係が育ちます。", strength: "言葉を超えた深い理解が生まれる。スピリチュアルな探求・創造的な表現を共にする縁に最高。", caution: "二人とも「流れに任せたい」性質のため、大切な決断を先送りしやすい。定期的に言葉で確認を。", shrineTip: "弁財天・住吉大社系の神社。「深い共鳴の縁がいつまでも続きますように」と二人で参拝。", prayTogether: "「深いところで響き合うこの縁が、これからもずっと清らかに続きますように。」" },
  },
};

const TYPE_COLORS: Record<CompatType, { bg: string; text: string; border: string }> = {
  ideal:     { bg: "#fef9c3", text: "#b45309", border: "#fcd34d" },
  good:      { bg: "#f0fdf4", text: "#15803d", border: "#86efac" },
  equal:     { bg: "#f8fafc", text: "#475569", border: "#cbd5e1" },
  tension:   { bg: "#fff7ed", text: "#c2410c", border: "#fdba74" },
  challenge: { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" },
};

// ─── メイン ────────────────────────────────────────────────────────────────
export default function CompatClient() {
  const [myElement,    setMyElement]    = useState<ElementKey | null>(null);
  const [theirElement, setTheirElement] = useState<ElementKey | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("guardian_element") as ElementKey | null;
    if (stored && ELEMENTS.includes(stored)) setMyElement(stored);
  }, []);

  const compat = (myElement && theirElement) ? COMPAT[myElement][theirElement] : null;
  const typeColor = compat ? TYPE_COLORS[compat.type] : null;

  const shareText = (compat && myElement && theirElement)
    ? `五行相性診断：${myElement}属性×${theirElement}属性の相性は「${compat.label}」★${compat.stars}/5。${compat.headline} #神社診断`
    : "";
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  if (!mounted) return null;

  return (
    <div className="space-y-7">
      <div className="text-center">
        <p className="text-[11px] tracking-[0.3em] text-vermilion-deep font-semibold mb-3">
          ⛩ COMPATIBILITY
        </p>
        <h1 className="font-serif text-3xl text-sumi mb-2">五行相性診断</h1>
        <p className="text-sumi/60 text-sm max-w-xs mx-auto">
          五行の「相生・相克」の関係からふたりの縁を読み解きます
        </p>
      </div>

      {/* 属性選択 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 自分 */}
        <div>
          <p className="text-xs font-semibold text-sumi/60 mb-2 text-center">あなたの属性</p>
          <div className="grid grid-cols-1 gap-1.5">
            {ELEMENTS.map((el) => {
              const info = ELEMENT_LABELS[el];
              return (
                <button
                  key={el}
                  onClick={() => setMyElement(el)}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition
                    ${myElement === el
                      ? "border-current shadow-sm"
                      : "border-border bg-washi hover:border-sumi/20"}`}
                  style={myElement === el ? { borderColor: info.color, backgroundColor: info.light } : {}}
                >
                  <span className="text-xl">{info.emoji}</span>
                  <div>
                    <span className="font-bold text-sm" style={myElement === el ? { color: info.color } : {}}>
                      {el}
                    </span>
                    <span className="text-[10px] text-sumi/50 ml-1">（{info.reading}）</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 相手 */}
        <div>
          <p className="text-xs font-semibold text-sumi/60 mb-2 text-center">相手の属性</p>
          <div className="grid grid-cols-1 gap-1.5">
            {ELEMENTS.map((el) => {
              const info = ELEMENT_LABELS[el];
              return (
                <button
                  key={el}
                  onClick={() => setTheirElement(el)}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition
                    ${theirElement === el
                      ? "border-current shadow-sm"
                      : "border-border bg-washi hover:border-sumi/20"}`}
                  style={theirElement === el ? { borderColor: info.color, backgroundColor: info.light } : {}}
                >
                  <span className="text-xl">{info.emoji}</span>
                  <div>
                    <span className="font-bold text-sm" style={theirElement === el ? { color: info.color } : {}}>
                      {el}
                    </span>
                    <span className="text-[10px] text-sumi/50 ml-1">（{info.reading}）</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 結果 */}
      {compat && typeColor && myElement && theirElement && (
        <div className="space-y-4">
          {/* スコアバナー */}
          <section
            className="rounded-2xl p-5 text-center border-2"
            style={{ backgroundColor: typeColor.bg, borderColor: typeColor.border }}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="text-3xl">{ELEMENT_LABELS[myElement].emoji}</div>
              <span className="text-sumi/40 text-xl">×</span>
              <div className="text-3xl">{ELEMENT_LABELS[theirElement].emoji}</div>
            </div>
            <div className="flex justify-center gap-0.5 mb-2">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={`text-xl ${i < compat.stars ? "" : "opacity-20"}`}
                  style={i < compat.stars ? { color: typeColor.text } : {}}>★</span>
              ))}
            </div>
            <p className="text-xs font-semibold tracking-wide mb-1" style={{ color: typeColor.text }}>
              {compat.label}
            </p>
            <p className="font-serif text-xl font-bold text-sumi">{compat.headline}</p>
          </section>

          {/* 関係の説明 */}
          <section className="rounded-xl border border-border bg-white p-5">
            <p className="text-[10px] tracking-[0.25em] text-sumi/50 mb-2">関係の本質</p>
            <p className="text-sm text-sumi/80 leading-relaxed">{compat.description}</p>
          </section>

          {/* 輝く場面 & 気をつけること */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <section className="rounded-xl border border-moss/30 bg-moss/5 p-4">
              <p className="text-[10px] tracking-[0.2em] text-moss font-bold mb-2">🌿 この関係が輝く場面</p>
              <p className="text-sm text-sumi/80 leading-relaxed">{compat.strength}</p>
            </section>
            <section className="rounded-xl border border-amber-300/40 bg-amber-50/60 p-4">
              <p className="text-[10px] tracking-[0.2em] text-amber-700 font-bold mb-2">⚠ 気をつけること</p>
              <p className="text-sm text-sumi/80 leading-relaxed">{compat.caution}</p>
            </section>
          </div>

          {/* アドバイス */}
          <section className="rounded-xl border border-vermilion/20 bg-vermilion/5 p-5">
            <p className="text-[10px] tracking-[0.25em] text-vermilion-deep font-bold mb-2">
              ✦ この縁を活かすアドバイス
            </p>
            <p className="text-sm text-sumi/80 leading-relaxed">{compat.advice}</p>
          </section>

          {/* 一緒に参拝するなら */}
          <section className="rounded-xl border border-stone-200 bg-stone-50 p-5">
            <p className="text-[10px] tracking-[0.2em] text-stone-500 font-bold mb-2">⛩ 一緒に参拝するなら</p>
            <p className="text-sm text-sumi/80 leading-relaxed mb-3">{compat.shrineTip}</p>
            <div className="mt-3 rounded-lg bg-white border border-stone-200 px-4 py-3">
              <p className="text-[10px] tracking-[0.2em] text-stone-400 mb-1.5">二人で伝える言葉</p>
              <p className="text-sm text-sumi font-medium italic leading-relaxed">「{compat.prayTogether}」</p>
            </div>
          </section>

          {/* シェア */}
          <div className="flex flex-wrap justify-center gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-bold text-white transition hover:bg-sumi active:scale-95"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              相性をシェア
            </a>
            <button
              onClick={() => navigator.clipboard?.writeText(`${shareText} ${shareUrl}`)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-sumi transition hover:bg-washi active:scale-95"
            >
              📋 コピー
            </button>
          </div>

          {/* 逆パターンも見る */}
          {myElement !== theirElement && (
            <div className="text-center text-xs text-sumi/50">
              逆（{theirElement}×{myElement}）も確認できます
              <button
                onClick={() => { const tmp = myElement; setMyElement(theirElement); setTheirElement(tmp); }}
                className="ml-2 text-vermilion-deep underline"
              >
                入れ替える
              </button>
            </div>
          )}
        </div>
      )}

      {/* 未選択時のガイド */}
      {(!myElement || !theirElement) && (
        <div className="rounded-xl border border-border bg-washi/60 p-4 text-center text-sm text-sumi/55">
          {!myElement && !theirElement && "両方の属性を選ぶと相性が表示されます"}
          {myElement && !theirElement && "相手の属性を選んでください"}
          {!myElement && theirElement && "あなたの属性を選んでください"}
        </div>
      )}

      {/* 守護神社診断へ */}
      {!myElement && (
        <div className="rounded-xl border border-vermilion/20 bg-vermilion/5 p-4 text-center">
          <p className="text-xs text-sumi/60 mb-2">自分の属性がわからない方は</p>
          <Link href="/diagnose" className="text-sm font-semibold text-vermilion-deep underline">
            守護神社診断で属性を調べる →
          </Link>
        </div>
      )}

      <div className="flex justify-center gap-4 text-sm pt-2">
        <Link href="/diagnose" className="text-vermilion-deep underline hover:no-underline">守護神社診断</Link>
        <Link href="/omikuji"  className="text-vermilion-deep underline hover:no-underline">今日のおみくじ</Link>
      </div>
    </div>
  );
}
