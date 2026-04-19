import Link from "next/link";

export const metadata = {
  title: "式内社・社格",
  description:
    "延喜式神名帳・官幣社・別表神社など、神社の格式と歴史の読み方を解説。",
};

/**
 * /learn/history — 社格・式内社の解説（Phase 0b スケルトン）
 * Phase 2 で神社マスタの shikinaisha フラグや kanpei_rank と連携する予定。
 */
const RANKS = [
  {
    name: "式内社",
    reading: "しきないしゃ",
    body:
      "延長5年（927年）に編纂された『延喜式』神名帳に記載された全国 2,861社・3,132座の神社。平安時代までに朝廷から公に認められていたことを意味し、格式の高い証とされる。",
  },
  {
    name: "一宮",
    reading: "いちのみや",
    body:
      "令制国（旧国）ごとに最も社格の高い神社。出雲国の出雲大社、武蔵国の氷川神社、越前国の気比神宮など。現在も「国内で最も崇敬を集めた神社」の目安となる。",
  },
  {
    name: "官幣社・国幣社",
    reading: "かんぺいしゃ・こくへいしゃ",
    body:
      "明治時代に定められた近代社格制度における国家が奉幣する神社。官幣大社・官幣中社・官幣小社、国幣大社・国幣中社・国幣小社の区別があった。1946年に制度は廃止された。",
  },
  {
    name: "別表神社",
    reading: "べっぴょうじんじゃ",
    body:
      "戦後、神社本庁が特に由緒ある神社を「役職員進退に関する規程」の別表に記したもの。現在約 350社。事実上の格付けとして参照されることが多い。",
  },
  {
    name: "総本社・総本宮",
    reading: "そうほんしゃ・そうほんぐう",
    body:
      "同一祭神を祀る全国の神社の大元となる神社。伏見稲荷大社、宇佐神宮、日吉大社、春日大社など。分霊（わけみたま）が勧請されて各地に広がった。",
  },
] as const;

const TIMELINE = [
  {
    era: "古代",
    body:
      "ご神体は山・岩・滝など自然物そのもの。常設の社殿はなく、祭りのときだけ神を迎える「祭祀場」だった。",
  },
  {
    era: "奈良〜平安",
    body:
      "朝廷による神祇制度が整備され、延喜式神名帳（927年）に官社が列挙される。神仏習合も進む。",
  },
  {
    era: "中世〜近世",
    body:
      "武家政権・庶民信仰の広がりとともに、八幡・稲荷・天神信仰が全国へ広がる。講・伊勢参りなど民衆参詣が隆盛。",
  },
  {
    era: "明治〜戦前",
    body:
      "神仏分離令・国家神道のもと、官国幣社などの近代社格制度が整備される。",
  },
  {
    era: "戦後〜現在",
    body:
      "政教分離により国家管理から離れ、多くが神社本庁の包括下へ。別表神社制度や氏子制度で地域に根づいている。",
  },
] as const;

export default function HistoryPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <nav className="mb-4 text-xs text-sumi/60">
        <Link href="/learn" className="hover:underline">
          神社を学ぶ
        </Link>
        <span className="mx-2">/</span>
        <span>式内社・社格</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl">式内社・社格</h1>
        <p className="mt-2 text-sm text-sumi/70">
          神社の格式・歴史の読み方。延喜式・一宮・別表神社など、案内板でよく見る言葉を整理します。
        </p>
      </header>

      <section>
        <h2 className="font-serif text-xl">主な社格</h2>
        <ul className="mt-3 space-y-4">
          {RANKS.map((r) => (
            <li
              key={r.name}
              className="rounded-md border border-border bg-washi p-5"
            >
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h3 className="font-serif text-lg">{r.name}</h3>
                <span className="text-xs text-sumi/60">{r.reading}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-sumi/80">
                {r.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl">神社史のざっくりタイムライン</h2>
        <ol className="mt-3 border-l border-border pl-4">
          {TIMELINE.map((t) => (
            <li key={t.era} className="mb-4 last:mb-0">
              <div className="text-xs font-semibold text-vermilion-deep">
                {t.era}
              </div>
              <p className="mt-1 text-sm text-sumi/80">{t.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-12 flex items-center justify-between border-t border-border pt-6 text-xs text-sumi/60">
        <Link href="/learn/goshuin" className="hover:underline">
          ← 御朱印の世界
        </Link>
        <Link href="/learn" className="hover:underline">
          神社を学ぶ トップへ →
        </Link>
      </footer>
    </main>
  );
}
