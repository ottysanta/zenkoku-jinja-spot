import { api, ApiError, type OfferingItem } from "@/lib/api";
import { startOfferingCheckout } from "./actions";

/**
 * 神社詳細ページに配置する奉納セクション。
 * - 登録メニュー（初穂料・お守り等）があれば選択、無ければ任意金額フォームのみ。
 * - Stripe Checkout へ遷移する Server Action。
 */
export default async function OfferingSection({ spotId }: { spotId: number }) {
  let items: OfferingItem[] = [];
  try {
    items = await api.listOfferingItems(spotId);
  } catch (e) {
    // FastAPI ダウン時も詳細ページを壊さない（奉納メニューは空扱い）
    void e;
    void ApiError;
  }

  return (
    <section className="mt-8 rounded-md border border-border bg-kinari/50 p-4">
      <h2 className="mb-2 font-serif text-xl">気持ちを届ける（志納）</h2>
      <div className="mb-3 rounded-md border border-border bg-white/70 p-3 text-[12px] text-sumi/80">
        <p className="leading-relaxed">
          この神社へ感謝や決意を届けたい方のための「志納金の取り次ぎ」です。
          お預かりした志納金は、宗教法人として登録され、当サイトでの受付にご同意いただいている
          神社に限り、月次で一括して銀行振込・郵便振替にてお届けします。
        </p>
        <p className="mt-2 text-[11px] text-sumi/60">
          ※ 本サービスは弊社が志納金を収益として受け取るものではありません。
          受付条件・お届けまでの流れ・返金可否は <a href="/offerings" className="text-moss underline">奉納の仕組み</a> をご確認ください。
        </p>
      </div>

      <form action={startOfferingCheckout.bind(null, spotId)} className="space-y-3">
        {items.length > 0 ? (
          <fieldset className="space-y-2 text-sm">
            <legend className="mb-1 text-xs text-sumi/70">メニューを選ぶ</legend>
            {items.map((it) => (
              <label
                key={it.id}
                className="flex items-center gap-3 rounded border border-border bg-white p-2"
              >
                <input
                  type="radio"
                  name="offering_item_id"
                  value={it.id}
                  className="shrink-0"
                />
                <span className="flex-1">
                  <span className="font-medium">{it.title}</span>
                  {it.description ? (
                    <span className="ml-2 text-xs text-sumi/60">{it.description}</span>
                  ) : null}
                </span>
                <span className="font-mono text-sm">
                  ¥{it.amount_jpy.toLocaleString()}
                </span>
              </label>
            ))}
            <label className="flex items-center gap-3 rounded border border-border bg-white p-2">
              <input type="radio" name="offering_item_id" value="" defaultChecked />
              <span className="flex-1 text-sm">任意の金額で奉納する</span>
            </label>
          </fieldset>
        ) : null}

        <label className="block text-sm">
          <span className="mb-1 block text-xs text-sumi/70">任意金額（円）</span>
          <input
            type="number"
            name="amount_jpy"
            min={100}
            max={1_000_000}
            step={100}
            placeholder="1000"
            className="w-40 rounded border border-border bg-white px-2 py-1"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs text-sumi/70">願意・ひとこと（任意・500字）</span>
          <textarea
            name="message"
            rows={2}
            maxLength={500}
            className="w-full rounded border border-border bg-white px-2 py-1"
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-sumi/70">
          <input type="checkbox" name="anonymous" />
          匿名で奉納する
        </label>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="rounded-md border border-vermilion bg-vermilion px-4 py-2 text-xs font-medium text-white hover:bg-vermilion-deep"
          >
            🙏 志納を申し込む
          </button>
        </div>
      </form>
    </section>
  );
}
