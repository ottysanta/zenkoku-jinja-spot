import Link from "next/link";

export const metadata = {
  title: "祭神を知る",
  description:
    "天照大御神・八幡神・稲荷大神など、日本全国で祀られる主要な祭神とご神格を紹介。",
};

/**
 * /learn/deities — 主要祭神のまとめ（Phase 0b スケルトン）
 * Phase 2 で deity マスタと紐づけて shrines_i18n を横断検索できるようにする予定。
 */
const DEITIES = [
  {
    name: "天照大御神",
    reading: "あまてらすおおみかみ",
    blessing: "国家安泰・家内安全・開運",
    body:
      "日本神話における最高神。太陽の女神で、皇祖神とされる。伊勢神宮 内宮（皇大神宮）のご祭神。",
  },
  {
    name: "八幡神（応神天皇）",
    reading: "はちまんしん",
    blessing: "必勝祈願・出世開運・武運長久",
    body:
      "全国に約4万社あるとされる八幡信仰の中心。宇佐神宮（大分）・石清水八幡宮（京都）・鶴岡八幡宮（神奈川）が有名。",
  },
  {
    name: "稲荷大神（宇迦之御魂神）",
    reading: "いなりのおおかみ（うかのみたまのかみ）",
    blessing: "五穀豊穣・商売繁盛・家内安全",
    body:
      "全国に約3万社。総本宮は伏見稲荷大社（京都）。お稲荷さんの愛称で親しまれ、朱塗りの千本鳥居が象徴。",
  },
  {
    name: "大国主大神",
    reading: "おおくにぬしのおおかみ",
    blessing: "縁結び・医療・産業",
    body:
      "国づくりの神。出雲大社（島根）のご祭神。良縁の神様として全国から参拝者が集まる。",
  },
  {
    name: "菅原道真公（天満大自在天神）",
    reading: "すがわらのみちざね",
    blessing: "学問・受験合格・文筆",
    body:
      "平安時代の学者・政治家。没後に天神として祀られる。総本社は太宰府天満宮（福岡）・北野天満宮（京都）。",
  },
  {
    name: "須佐之男命",
    reading: "すさのおのみこと",
    blessing: "厄除け・病気平癒・縁結び",
    body:
      "八岐大蛇（やまたのおろち）退治で知られる荒ぶる神。八坂神社（京都）・氷川神社（埼玉）などに祀られる。",
  },
  {
    name: "木花開耶姫命",
    reading: "このはなのさくやひめのみこと",
    blessing: "安産・子授け・火難除け",
    body:
      "富士山を御神体とする浅間神社系のご祭神。桜の花のように美しい女神とされる。",
  },
] as const;

export default function DeitiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <nav className="mb-4 text-xs text-sumi/60">
        <Link href="/learn" className="hover:underline">
          神社を学ぶ
        </Link>
        <span className="mx-2">/</span>
        <span>祭神を知る</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl">祭神を知る</h1>
        <p className="mt-2 text-sm text-sumi/70">
          参拝する神社がどんな神様を祀っているのかを知ると、参拝がぐっと深くなります。
        </p>
      </header>

      <ul className="space-y-4">
        {DEITIES.map((d) => (
          <li
            key={d.name}
            className="rounded-md border border-border bg-washi p-5"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-serif text-lg">{d.name}</h2>
              <span className="text-xs text-sumi/60">{d.reading}</span>
            </div>
            <p className="mt-1 text-xs text-vermilion-deep">
              主なご利益：{d.blessing}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-sumi/80">{d.body}</p>
          </li>
        ))}
      </ul>

      <p className="mt-8 rounded-md border border-dashed border-border p-4 text-xs text-sumi/60">
        ※ 本ページは代表的な祭神の紹介です。同じ神様でも神社によって表記・読みが異なる場合があります。Phase 2 では神社マスタと連携し、ご祭神名から神社を横断検索できるようにする予定です。
      </p>

      <footer className="mt-12 flex items-center justify-between border-t border-border pt-6 text-xs text-sumi/60">
        <Link href="/learn/etiquette" className="hover:underline">
          ← 参拝の作法
        </Link>
        <Link href="/learn/goshuin" className="hover:underline">
          次: 御朱印の世界 →
        </Link>
      </footer>
    </main>
  );
}
