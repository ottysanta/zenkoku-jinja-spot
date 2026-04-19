import Link from "next/link";

export const metadata = {
  title: "気持ちを届ける — 奉納の仕組み",
  description:
    "遠方からでも神社へ感謝や決意を届けられる、オンライン志納（奉納）の仕組み。受付可能神社の条件や送金の流れを公開しています。",
};

/**
 * /offerings — 奉納の仕組み案内ページ（Phase 2 刷新版）。
 *
 * 方針:
 * - 決済事業者名（Stripe など）は前面に出さない
 * - 「弊社がお金を預かるの？」という懸念に対して流れを率直に説明
 * - すべての神社が受付対象ではないことを明記（宗教法人登録・口座の有無など）
 * - 透明性のため、手数料・到着時期・返金の可否を開示
 */

const HOW_IT_WORKS_STEPS = [
  {
    no: "01",
    title: "神社を選んで志納を申し込む",
    body: "受付対応の神社詳細ページから金額と気持ち（感謝・決意・節目・お礼）を添えて申し込みます。お名前やメッセージは任意です。",
  },
  {
    no: "02",
    title: "当サイトが一時的にお預かり",
    body: "申込みと同時に、決済ネットワーク経由で志納金をお預かりします。個別のカード情報を当サイトが保持することはありません。返金はできない旨を含めた規約にご同意いただいた上での申込となります。",
  },
  {
    no: "03",
    title: "月に一度まとめて神社へお届け",
    body: "宗教法人として登録されている神社、かつ当サイト経由での受付にご同意いただいている神社に対して、月次または一定額到達時に銀行振込・郵便振替で送金します。振込名義・明細書は神社側でも確認できます。",
  },
  {
    no: "04",
    title: "お届け完了の報告",
    body: "神社側で受領が確認できた段階で、マイページの「参拝・奉納履歴」に完了表示が出ます（通常 2〜6 週間）。神社名の後ろに「受領済」バッジが付きます。",
  },
] as const;

const WHY_US = [
  {
    title: "遠方の神社にも真心を届けたい",
    body: "引越し・出張・旅行で訪れた神社、先祖代々ゆかりのある神社、歳を重ねて参拝が難しくなった神社。そうした「気持ちのある場所」に、物理的距離を超えて志を届けるための仕組みです。",
  },
  {
    title: "神社側の負担を増やさない",
    body: "個別送金はまとめて月次で処理し、神社側には支払調書・受納明細をひとまとめで送付します。紙の郵送・現金書留のような手間を掛けず、運営負担を最小化しています。",
  },
  {
    title: "透明性のある運営",
    body: "当サイトは志納金の「取り次ぎ」を行う立場で、志納金を事業収益として扱うことはありません。運営原資はサイトの別機能（広告・企業スポンサー等）で賄う方針です。手数料の料率・内訳は本ページ下部に明記しています。",
  },
] as const;

const ACCEPTED_CONDITIONS = [
  "神社が宗教法人として登録されており、振込先の法人口座がある",
  "神社側から「オンライン受付に同意する」の正式な書面・電子署名を頂いている",
  "当サイト規約（返金不可・公益目的・個人情報の扱い）に同意いただいている",
] as const;

const NOT_ACCEPTED_REASONS = [
  "地域住民による管理で宗教法人化していない小祠・村社・無社格",
  "法人口座を持たず個人口座のみで運営されている場合",
  "既に公式サイトや別事業者で受付を行っており重複する場合",
  "連絡先が不明で同意確認が取れない場合",
] as const;

const FAQS = [
  {
    q: "これは寄付金控除の対象になりますか？",
    a: "寄付金控除の対象にはなりません。本サービスは各神社への志納金の「取り次ぎ」であり、当サイトから神社への寄付ではないためです。税務上の取り扱いが必要な場合は神社の公式窓口に直接ご相談ください。",
  },
  {
    q: "キャンセル・返金はできますか？",
    a: "決済完了後のキャンセル・返金は原則できません。金額・宛先神社をご確認の上、ご申込みください。重複申込や明らかな誤操作については個別にご相談に応じます。",
  },
  {
    q: "いつ神社に届きますか？",
    a: "通常は申込みから 2〜6 週間で神社側の受領が確認できます。月次の一括送金とするため、申込時点では即時届くわけではありません。",
  },
  {
    q: "受付対象でない神社への志納はできますか？",
    a: "現状は受付対象神社のみへの取り次ぎとなります。受付対象外の神社については、詳細ページから公式サイト・現地参拝先の連絡先をご案内しています。",
  },
  {
    q: "匿名で奉納できますか？",
    a: "はい、ニックネームやメッセージを省略して匿名で申込みできます。ただし決済処理上のお名前は当サイト内部で保持されます（神社側には開示されません）。",
  },
  {
    q: "運営会社は志納金の中から手数料を取っていますか？",
    a: "現在はサイト運営経費・決済ネットワーク手数料の原価分のみ控除しています。控除率は今後変動する可能性があるため、申込画面と本ページで最新を明記します。",
  },
] as const;

export default function OfferingsIndexPage() {
  // FAQ は JSON-LD で構造化（LLMO / 検索エンジン対策）
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="mb-8 border-b border-border pb-6">
        <p className="mb-2 text-[0.72rem] tracking-[0.28em] text-vermilion-deep">
          OFFERINGS
        </p>
        <h1 className="font-serif text-3xl md:text-4xl">気持ちを届ける</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sumi/75">
          遠方からでも、神社へ感謝や決意を届けたい。この想いに応えるために、当サイトでは
          「志納金の取り次ぎサービス」を運営しています。弊社が事業収益として受け取るので
          はなく、皆さまからお預かりした志納金は、受付対応の神社へまとめてお届けする仕組みです。
        </p>
      </header>

      {/* なぜ取り次ぐのか */}
      <section className="mb-10">
        <h2 className="mb-3 font-serif text-xl">なぜオンライン取り次ぎをするのか</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {WHY_US.map((c) => (
            <div
              key={c.title}
              className="rounded-md border border-border bg-washi p-4"
            >
              <h3 className="font-serif text-base">{c.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-sumi/80">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* お金の流れ */}
      <section className="mb-10 rounded-md border border-vermilion/30 bg-vermilion/5 p-5">
        <h2 className="mb-1 font-serif text-xl text-vermilion-deep">
          志納金の流れ（お金の透明性）
        </h2>
        <p className="mb-4 text-xs text-sumi/70">
          「当サイトがお金を集めて終わり」ではなく、神社へ届くまでの全工程を公開します。
        </p>
        <ol className="space-y-3">
          {HOW_IT_WORKS_STEPS.map((s) => (
            <li
              key={s.no}
              className="rounded-md border border-border bg-white p-4"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-vermilion-deep">{s.no}</span>
                <h3 className="font-serif text-base">{s.title}</h3>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-sumi/80">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 受付対象条件 */}
      <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-md border border-moss/30 bg-moss/5 p-4">
          <h2 className="mb-2 font-serif text-base text-moss">受付対象の条件</h2>
          <ul className="space-y-1.5 text-[13px] text-sumi/90">
            {ACCEPTED_CONDITIONS.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="text-moss">✓</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-border bg-kinari p-4">
          <h2 className="mb-2 font-serif text-base text-sumi">受付対象外となるケース</h2>
          <ul className="space-y-1.5 text-[13px] text-sumi/90">
            {NOT_ACCEPTED_REASONS.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="text-sumi/50">—</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-sumi/60">
            ※ 受付対象外の神社でも、詳細ページから公式サイトや現地参拝先のご案内を行っています。
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mb-10 rounded-md border border-border bg-washi p-5">
        <h2 className="mb-2 font-serif text-base">まず神社を探す</h2>
        <p className="mb-4 text-[13px] text-sumi/80">
          志納は、神社を決めてから詳細ページで手続きいただく流れです。全国 27,000 社以上の神社が検索できます。
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/map"
            className="inline-flex min-h-[40px] items-center rounded-md border border-vermilion bg-vermilion px-5 py-2 text-sm font-semibold text-white hover:bg-vermilion-deep"
          >
            🗺 地図で探す
          </Link>
          <Link
            href="/search"
            className="inline-flex min-h-[40px] items-center rounded-md border border-border bg-white px-5 py-2 text-sm font-semibold text-sumi hover:bg-kinari"
          >
            ≣ 一覧で探す
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="mb-3 font-serif text-xl">よくあるご質問</h2>
        <dl className="space-y-3">
          {FAQS.map((f) => (
            <div
              key={f.q}
              className="rounded-md border border-border bg-white p-4"
            >
              <dt className="font-serif text-[14px] text-sumi">Q. {f.q}</dt>
              <dd className="mt-1.5 text-[13px] leading-relaxed text-sumi/80">
                A. {f.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 神社関係者向け */}
      <section className="mb-10 rounded-md border border-dashed border-border bg-washi/60 p-5 text-[13px] text-sumi/80">
        <h2 className="mb-2 font-serif text-base text-sumi">神社関係者の方へ</h2>
        <p className="leading-relaxed">
          当サイトに掲載の神社で、オンライン受付の開設・情報訂正・削除をご希望の場合は、
          掲載情報の訂正申請フォームまたは運営連絡先までご連絡ください。受付対応は
          <b>宗教法人登録 + 法人口座 + 書面同意</b>のセットを確認した上で開始します。
        </p>
      </section>

      <footer className="border-t border-border pt-4 text-[11px] text-sumi/50">
        本ページの仕組み・料率は予告なく更新されることがあります。最新の条件は申込画面および
        利用規約をご確認ください。本サイトは志納金の「取り次ぎ」に徹し、収益化を目的とした
        集金は行いません。
      </footer>
    </main>
  );
}
