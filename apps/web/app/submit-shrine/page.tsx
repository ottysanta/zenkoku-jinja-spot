import type { Metadata } from "next";
import Link from "next/link";
import SubmitShrineForm from "./SubmitShrineForm";

export const metadata: Metadata = {
  title: "神社の掲載申請",
  description:
    "全国神社スポットへの掲載をご希望の神社様・関係者様向けの申請フォームです。ご提供いただいた内容を編集部で確認のうえ掲載いたします。",
};

/**
 * /submit-shrine — 神社の自己申請（新規掲載リクエスト）フォーム。
 *
 * 対象: 宮司・禰宜・総代・管理者、愛好家からの掲載リクエストも受け付けるが、
 *   宗教法人登録などの証憑がない場合は一旦「要追加情報」ステータスで
 *   編集部より連絡させていただく方針。
 */
export default function SubmitShrinePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <header className="mb-6">
        <p className="text-xs text-sumi/60">掲載リクエスト</p>
        <h1 className="font-serif text-2xl md:text-3xl">神社の掲載申請</h1>
        <p className="mt-2 text-sm leading-relaxed text-sumi/80">
          「全国神社スポット」に新しく神社を掲載したい方は、以下のフォームからご申請ください。
          編集部で内容確認のうえ、公開対応いたします（通常 3〜7 営業日）。
          既に掲載されている神社の情報修正・写真差し替えは
          各神社ページの「情報修正リクエスト」からお送りください。
        </p>
      </header>

      <section className="mb-6 rounded-lg border border-vermilion/30 bg-vermilion/5 p-4 text-sm text-sumi/90">
        <p className="font-semibold">
          ※ 申請はどなたでも送信可能ですが、以下に該当する場合は優先的にご連絡いたします。
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px]">
          <li>宮司・禰宜・総代など、神社の運営にかかわる方</li>
          <li>宗教法人として登録されている神社（法人番号・登記情報など）</li>
          <li>地域の氏子会・崇敬会などで神社を管理されている方</li>
        </ul>
      </section>

      <SubmitShrineForm />

      <aside className="mt-8 rounded-md border border-dashed border-border bg-washi/60 p-4 text-xs text-sumi/70">
        <p className="mb-2">
          ご入力いただいた情報は掲載審査および、必要に応じて掲載内容のご確認連絡のために利用いたします。
          メールアドレスを伴うダイレクトマーケティング目的の第三者提供は行いません。
        </p>
        <p>
          既に掲載されている神社をお探しの方は{" "}
          <Link href="/search" className="underline hover:text-vermilion-deep">
            神社を検索
          </Link>{" "}
          / <Link href="/map" className="underline hover:text-vermilion-deep">地図で探す</Link>
          {" "}からどうぞ。
        </p>
      </aside>
    </main>
  );
}
