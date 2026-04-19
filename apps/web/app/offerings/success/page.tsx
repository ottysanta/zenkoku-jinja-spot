import Link from "next/link";
import { auth } from "@/auth";
import { api, ApiError, type Offering } from "@/lib/api";

export const metadata = { title: "奉納ありがとうございました", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Stripe Checkout からの戻り先。
 * - Webhook が到達していれば status=paid。まだなら pending のまま。
 * - URL 直叩きや他人の offering_id へのアクセスは FastAPI 側で 403。
 */
export default async function OfferingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ offering_id?: string; session_id?: string }>;
}) {
  const sp = await searchParams;
  const offeringId = sp.offering_id ? parseInt(sp.offering_id, 10) : null;
  const sessionId = sp.session_id || null;
  const session = await auth();

  let offering: Offering | null = null;
  if (offeringId) {
    try {
      offering = await api.getOffering(
        offeringId,
        session?.apiToken ?? null,
        sessionId,
      );
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12 text-center">
      <h1 className="font-serif text-3xl">奉納ありがとうございました</h1>
      <p className="mt-3 text-sm text-sumi/70">
        ご奉納を受け付けました。Stripe からの決済完了通知が届くと、状態が確定します。
      </p>

      {offering ? (
        <dl className="mx-auto mt-6 max-w-sm rounded-md border border-border bg-washi p-4 text-left text-sm">
          <div className="flex justify-between">
            <dt className="text-sumi/60">受付番号</dt>
            <dd className="font-mono">#{offering.id}</dd>
          </div>
          <div className="mt-1 flex justify-between">
            <dt className="text-sumi/60">金額</dt>
            <dd className="font-mono">¥{offering.amount_jpy.toLocaleString()}</dd>
          </div>
          <div className="mt-1 flex justify-between">
            <dt className="text-sumi/60">状態</dt>
            <dd>
              {offering.status === "paid" ? (
                <span className="text-moss">完了</span>
              ) : offering.status === "failed" ? (
                <span className="text-vermilion">失敗</span>
              ) : (
                <span className="text-sumi/70">処理中…</span>
              )}
            </dd>
          </div>
          {offering.paid_at ? (
            <div className="mt-1 flex justify-between">
              <dt className="text-sumi/60">決済完了</dt>
              <dd className="text-xs">
                {new Date(offering.paid_at).toLocaleString("ja-JP")}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="mt-8">
        <Link
          href="/map"
          className="rounded-md border border-border bg-washi px-4 py-2 text-xs hover:bg-white"
        >
          地図へ戻る
        </Link>
      </div>
    </main>
  );
}
