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
}

// 相生: 木→火→土→金→水→木
// 相克: 木→土→水→火→金→木
const COMPAT: Record<ElementKey, Record<ElementKey, CompatInfo>> = {
  木: {
    木: { type: "equal", stars: 3, label: "同属性", headline: "深い共鳴の関係", description: "同じ「縁結び・成長」のエネルギーを持つ者同士。価値観や感性が似ており、自然と打ち解けられます。ただし似すぎると互いの欠点を増幅させることも。", advice: "相手に自分の映し鏡を見るつもりで接すると、共に大きく成長できます。" },
    火: { type: "good",  stars: 4, label: "相生（木→火）", headline: "あなたが相手を輝かせる関係", description: "木は火を燃やす燃料になります。あなたの縁結び・サポート力が相手の情熱を引き出し、輝かせる理想的な役割分担です。", advice: "あなたは縁の陰の立役者。相手が輝くほど、あなたの役割は深まります。" },
    土: { type: "tension", stars: 2, label: "相克（木→土）", headline: "あなたが相手を揺さぶる関係", description: "木の根は土を割って伸びます。あなたの成長志向が、相手の「安定・現状維持」を揺さぶる緊張が生まれやすいです。", advice: "相手の安定を壊すのではなく、その土壌をより豊かにする関わり方を意識して。" },
    金: { type: "challenge", stars: 2, label: "相克（金→木）", headline: "相手の鋭さがあなたを試す関係", description: "金（刃）は木を切り落とします。相手の決断力・批判的視点があなたの繊細さを傷つけることがあります。", advice: "相手の鋭さを「剪定」と受け取れば、あなたはより美しく成長できます。" },
    水: { type: "ideal", stars: 5, label: "相生（水→木）", headline: "相手があなたを育てる理想の関係", description: "水は木を育てます。相手の深い感受性と包容力があなたの成長を最大に引き出す、最も相性の良い組み合わせです。", advice: "この縁を大切に。相手はあなたにとって「育て手」。素直に受け取ることが大切。" },
  },
  火: {
    木: { type: "ideal",   stars: 5, label: "相生（木→火）", headline: "相手があなたを燃やす理想の関係", description: "木があなたの炎に燃料を与えます。相手の縁結び・サポート力があなたの情熱をさらに輝かせる最高の組み合わせ。", advice: "相手の支えを受け取ることで、あなたの可能性は無限に広がります。" },
    火: { type: "equal",   stars: 3, label: "同属性", headline: "燃え上がる共鳴の関係", description: "情熱と誠意が共鳴し、共にいると大きなエネルギーが生まれます。ただし二つの炎は燃え上がりすぎて互いを消耗させることも。", advice: "お互いの炎を競わず、同じ方向を照らすことで無限の可能性が生まれます。" },
    土: { type: "good",    stars: 4, label: "相生（火→土）", headline: "あなたが相手を豊かにする関係", description: "燃えた後の灰が土になるように、あなたの情熱が相手の豊かさを育みます。あなたが積極的に動くことで関係が深まります。", advice: "あなたのエネルギーが相手の安定を支えています。遠慮なく輝いて。" },
    金: { type: "tension", stars: 2, label: "相克（火→金）", headline: "あなたが相手の鋭さを溶かす関係", description: "火は金属を溶かします。あなたの情熱・感情が相手の論理的・清廉な部分を崩す摩擦が生まれやすいです。", advice: "相手の清廉さをリスペクトしつつ、自分の炎を制御することで関係が整います。" },
    水: { type: "challenge", stars: 2, label: "相克（水→火）", headline: "相手の深さがあなたの炎を試す", description: "水は火を消します。相手の冷静な洞察や感情の深さが、あなたの情熱の空回りを指摘することがあります。", advice: "相手の冷静さをあなたの過熱を鎮める「恵みの雨」として受け取ると関係が深まります。" },
  },
  土: {
    木: { type: "challenge", stars: 2, label: "相克（木→土）", headline: "相手の成長があなたを揺さぶる", description: "木の根があなたの安定を揺さぶります。相手の変化志向・新しい縁の追求が、あなたの「変わらないこと」への価値観と摩擦を生みます。", advice: "相手の変化をあなたの土壌を豊かにする「根」として受け入れることが鍵。" },
    火: { type: "ideal",   stars: 5, label: "相生（火→土）", headline: "相手があなたを豊かにする理想の関係", description: "火の情熱がやがて豊かな土になります。相手のエネルギーがあなたの安定と豊かさをさらに深める最良の組み合わせ。", advice: "相手の情熱を受け取ることで、あなたの大地はより肥沃になります。" },
    土: { type: "equal",   stars: 3, label: "同属性", headline: "揺るぎない安定の関係", description: "同じ「安定・包容力」のエネルギーが共鳴します。非常に安定した関係ですが、変化や刺激が少なくなりがちです。", advice: "互いの「支え合い」を言葉にして確認することで、関係がさらに深まります。" },
    金: { type: "good",   stars: 4, label: "相生（土→金）", headline: "あなたが相手を輝かせる関係", description: "土の中から金が生まれるように、あなたの積み重ねと安定が相手の判断力・清廉さをさらに輝かせます。", advice: "相手を育てる「地盤」として自分の役割に誇りを持って。" },
    水: { type: "tension", stars: 2, label: "相克（土→水）", headline: "あなたが相手の流れを止める関係", description: "堤防（土）が水の流れを止めるように、あなたの安定志向が相手の自由な感受性・流れを制限することがあります。", advice: "相手の「流れ」を止めるのではなく、安全な水路を作る役割を意識して。" },
  },
  金: {
    木: { type: "tension", stars: 2, label: "相克（金→木）", headline: "あなたの鋭さが相手を試す", description: "刃（金）が木を切るように、あなたの決断力・批判的視点が相手の繊細な縁結びの感性を傷つけることがあります。", advice: "剪定は木を美しくします。あなたの鋭さを「相手の成長のため」に使うと関係が整います。" },
    火: { type: "challenge", stars: 2, label: "相克（火→金）", headline: "相手の情熱があなたを溶かそうとする", description: "炎が金属を溶かすように、相手の感情的・情熱的なアプローチがあなたの清廉さ・論理性を崩しに来ることがあります。", advice: "相手の熱量をあなたの「再鍛造」の機会として受け取ることで、さらに強くなれます。" },
    土: { type: "ideal",   stars: 5, label: "相生（土→金）", headline: "相手があなたを輝かせる理想の関係", description: "土の中から金が生まれます。相手の安定・積み重ね・包容力があなたの判断力をさらに研ぎ澄ます最高の組み合わせ。", advice: "相手の安定した支えを素直に受け取ることで、あなたの能力は最大に輝きます。" },
    金: { type: "equal",   stars: 3, label: "同属性", headline: "鋭い共鳴の関係", description: "同じ「決断・清廉」のエネルギーが共鳴します。互いをリスペクトできれば最強のチームになれますが、意地の張り合いにも注意。", advice: "「正しさ」より「共に歩むこと」を優先すると、最強の関係になれます。" },
    水: { type: "good",   stars: 4, label: "相生（金→水）", headline: "あなたが相手を清める関係", description: "金から清らかな水が生まれます。あなたの清廉さ・決断力が相手の感受性・直感をさらに澄み渡らせます。", advice: "あなたが誠実であり続けることが、相手の深い力を最大に引き出します。" },
  },
  水: {
    木: { type: "good",    stars: 4, label: "相生（水→木）", headline: "あなたが相手を育てる関係", description: "水が木を育てるように、あなたの感受性・包容力が相手の縁結び・成長の力をさらに引き出します。", advice: "相手の可能性を信じて見守ることが、あなたの最大の貢献です。" },
    火: { type: "tension", stars: 2, label: "相克（水→火）", headline: "あなたの深さが相手の炎を試す", description: "水は火を消します。あなたの冷静な洞察や感情の深さが、相手の情熱の空回りを鎮める場面があります。", advice: "相手の炎を「消す」のではなく「方向づける」関わり方で関係が整います。" },
    土: { type: "challenge", stars: 2, label: "相克（土→水）", headline: "相手の安定があなたの流れを止める", description: "堤防（土）が水の流れを制限するように、相手の安定志向・現状維持がんあなたの自由な感受性・流れを制限することがあります。", advice: "相手の堤防をあなたを守る器として受け取ることで、深く美しい湖になれます。" },
    金: { type: "ideal",   stars: 5, label: "相生（金→水）", headline: "相手があなたを清める理想の関係", description: "金から清らかな水が生まれます。相手の清廉さ・決断力があなたの感受性・直感をさらに澄み渡らせる最高の組み合わせ。", advice: "相手の誠実さを受け取ることで、あなたの直感はさらに研ぎ澄まされます。" },
    水: { type: "equal",   stars: 3, label: "同属性", headline: "深く静かな共鳴の関係", description: "同じ「直感・感受性」のエネルギーが共鳴します。深いところで理解し合えますが、二人とも流されやすい面があるので注意。", advice: "互いの感情を言葉にして確認し合うことで、深い信頼関係が育ちます。" },
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

          {/* アドバイス */}
          <section className="rounded-xl border border-vermilion/20 bg-vermilion/5 p-5">
            <p className="text-[10px] tracking-[0.25em] text-vermilion-deep font-bold mb-2">
              ✦ この縁を活かすアドバイス
            </p>
            <p className="text-sm text-sumi/80 leading-relaxed">{compat.advice}</p>
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
