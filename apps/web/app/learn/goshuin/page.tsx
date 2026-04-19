import Link from "next/link";

export const metadata = {
  title: "御朱印の世界",
  description:
    "初穂料・授与時間・巡礼札所の見方など、御朱印をいただくときの基本マナー。",
};

/**
 * /learn/goshuin — 御朱印の基礎解説（Phase 0b スケルトン）
 * Phase 2 で神社マスタの goshuin_available / price フィールドと連携予定。
 */
const MANNERS = [
  {
    title: "先に参拝する",
    body:
      "御朱印は参拝の証。必ず拝殿で参拝を済ませてから授与所でいただきます。コレクション感覚は避けましょう。",
  },
  {
    title: "御朱印帳を用意する",
    body:
      "授与所で御朱印帳を購入できる神社も多いです。紙の書置きを受け取って後で貼るのも可。",
  },
  {
    title: "初穂料を準備",
    body:
      "一般的に300円〜500円。「お気持ちで」とされる場合もありますが、できるだけ小銭で準備しておきます。",
  },
  {
    title: "静かに待つ",
    body:
      "一つひとつ手書きで授与する神社が多いので、しばらく待つこともあります。",
  },
] as const;

const TIPS = [
  "授与時間は多くの場合 9:00〜16:30。祭事日や混雑日は変動します。",
  "書置き（紙）と直書きで初穂料が異なる神社があります。",
  "霊場巡礼（四国八十八ヶ所・西国三十三所など）は専用の納経帳を使うのが一般的。",
  "御朱印帳は表裏どちらから使っても構いません。迷ったら宮司さんに聞いて OK。",
] as const;

export default function GoshuinPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <nav className="mb-4 text-xs text-sumi/60">
        <Link href="/learn" className="hover:underline">
          神社を学ぶ
        </Link>
        <span className="mx-2">/</span>
        <span>御朱印の世界</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl">御朱印の世界</h1>
        <p className="mt-2 text-sm text-sumi/70">
          参拝の証として授かる神社の墨書き印。コレクションではなく「参拝の記録」として向き合います。
        </p>
      </header>

      <section>
        <h2 className="font-serif text-xl">基本マナー</h2>
        <ol className="mt-3 space-y-3">
          {MANNERS.map((m, i) => (
            <li
              key={m.title}
              className="rounded-md border border-border bg-washi p-4"
            >
              <h3 className="font-serif text-base">
                <span className="mr-2 font-mono text-xs text-vermilion-deep">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {m.title}
              </h3>
              <p className="mt-1 text-sm text-sumi/80">{m.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl">知っておくと便利</h2>
        <ul className="mt-3 space-y-2 text-sm text-sumi/80">
          {TIPS.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="text-vermilion-deep">・</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 rounded-md border border-dashed border-border p-4 text-xs text-sumi/60">
        ※ 御朱印の有無・初穂料・授与時間は神社ごとに異なります。訪問前に神社の公式情報で最新の状況をご確認ください。
      </p>

      <footer className="mt-12 flex items-center justify-between border-t border-border pt-6 text-xs text-sumi/60">
        <Link href="/learn/deities" className="hover:underline">
          ← 祭神を知る
        </Link>
        <Link href="/learn/history" className="hover:underline">
          次: 式内社・社格 →
        </Link>
      </footer>
    </main>
  );
}
