import Link from "next/link";

export const metadata = {
  title: "参拝の作法",
  description:
    "鳥居のくぐり方・手水・二礼二拍手一礼まで、神社参拝の基本作法を分かりやすく解説。",
};

/**
 * /learn/etiquette — 参拝作法の解説ページ（Phase 0b スケルトン）
 * Phase 2 で learning_contents テーブル駆動に差し替え予定。
 */
const STEPS = [
  {
    step: "01",
    title: "鳥居をくぐる",
    body:
      "鳥居は聖域への入口。一礼してから端を通るのが基本。中央は神様の通り道とされる「正中（せいちゅう）」なので避けるのが丁寧です。",
  },
  {
    step: "02",
    title: "参道を歩く",
    body:
      "参道も中央を避けて左右どちらかを歩きます。境内では走ったり大声を出したりせず、静かな所作で進みます。",
  },
  {
    step: "03",
    title: "手水舎で清める",
    body:
      "右手で柄杓を取り左手を清め、次に左手で柄杓を持ち替えて右手を清め、もう一度右手に持ち替え左の手のひらに水を受けて口をすすぎます。最後に柄杓を立てて柄を洗い元に戻します。",
  },
  {
    step: "04",
    title: "拝殿で拝礼",
    body:
      "賽銭を静かに入れ、鈴があれば鳴らします。二礼二拍手一礼が基本。心の中で感謝と願いを伝えます（お願いより先に感謝を）。",
  },
  {
    step: "05",
    title: "帰るときも一礼",
    body:
      "鳥居を出るときも、本殿の方へ向き直って一礼。日常へ戻る切り替えの所作です。",
  },
] as const;

const TIPS = [
  "服装は特に決まりはないが、肌の露出が多い服や派手なものは避けるのが無難。",
  "お賽銭は金額より気持ち。ご縁（5円）にこだわる必要はありません。",
  "写真撮影は拝殿内やご神体方向への撮影は控えます。境内の掲示に従ってください。",
  "ペット連れは神社ごとにルールが異なります。基本は境内への持ち込みは避けます。",
] as const;

export default function EtiquettePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <nav className="mb-4 text-xs text-sumi/60">
        <Link href="/learn" className="hover:underline">
          神社を学ぶ
        </Link>
        <span className="mx-2">/</span>
        <span>参拝の作法</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl">参拝の作法</h1>
        <p className="mt-2 text-sm text-sumi/70">
          鳥居のくぐり方・手水・二礼二拍手一礼まで。現地で迷わないための基本。
        </p>
      </header>

      <ol className="space-y-4">
        {STEPS.map((s) => (
          <li
            key={s.step}
            className="rounded-md border border-border bg-washi p-5"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-vermilion-deep">
                {s.step}
              </span>
              <h2 className="font-serif text-lg">{s.title}</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-sumi/80">{s.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-10">
        <h2 className="font-serif text-xl">よくある質問・ちょっとした豆知識</h2>
        <ul className="mt-3 space-y-2 text-sm text-sumi/80">
          {TIPS.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="text-vermilion-deep">・</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-12 flex items-center justify-between border-t border-border pt-6 text-xs text-sumi/60">
        <Link href="/learn" className="hover:underline">
          ← 神社を学ぶ トップへ
        </Link>
        <Link href="/learn/deities" className="hover:underline">
          次: 祭神を知る →
        </Link>
      </footer>
    </main>
  );
}
