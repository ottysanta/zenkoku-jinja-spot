import Link from "next/link";

export const metadata = { title: "奉納をキャンセルしました", robots: { index: false } };

export default function OfferingCancelPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12 text-center">
      <h1 className="font-serif text-2xl">奉納をキャンセルしました</h1>
      <p className="mt-3 text-sm text-sumi/70">
        決済は行われていません。再度奉納される場合は神社詳細から操作してください。
      </p>
      <div className="mt-6">
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
