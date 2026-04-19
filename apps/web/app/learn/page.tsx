import Link from "next/link";

export const metadata = {
  title: "神社を学ぶ",
  description: "神道・参拝作法・祭神・御朱印などの基礎知識。",
};

/**
 * Phase 2: 学びページのトップ。
 * - 記事本体は shrines_i18n / learning_contents テーブル（Phase 2 マイグレーション）へ移行予定。
 * - 現時点では静的カードのみのスケルトン。
 */
const SECTIONS = [
  {
    href: "/learn/etiquette",
    title: "参拝の作法",
    description: "鳥居のくぐり方・手水・二礼二拍手一礼の基本を写真つきで解説。",
  },
  {
    href: "/learn/deities",
    title: "祭神を知る",
    description: "天照大御神・八幡神・稲荷大神など、主要な祭神の系譜と性格。",
  },
  {
    href: "/learn/goshuin",
    title: "御朱印の世界",
    description: "初穂料・授与時間・巡礼札所の見方。マナーと記帳のコツ。",
  },
  {
    href: "/learn/history",
    title: "式内社・社格",
    description: "延喜式神名帳・官幣社・別表神社など、格式と歴史の読み方。",
  },
] as const;

export default function LearnIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <header className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl">神社を学ぶ</h1>
        <p className="mt-2 text-sm text-sumi/70">
          参拝の作法、祭神、御朱印、歴史。現地でより深く参拝できる知識を少しずつ。
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="block rounded-md border border-border bg-washi p-4 hover:bg-kinari"
            >
              <h2 className="font-serif text-lg">{s.title}</h2>
              <p className="mt-1 text-xs text-sumi/70">{s.description}</p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-sumi/50">
        各記事は順次公開予定です。Phase 2 で多言語版（EN/ZH）にも展開します。
      </p>
    </main>
  );
}
