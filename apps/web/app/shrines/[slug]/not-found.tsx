import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="mb-3 font-serif text-2xl">神社が見つかりません</h1>
      <p className="mb-6 text-sm text-sumi/70">
        URL が間違っているか、データベースに登録されていない可能性があります。
      </p>
      <Link
        href="/map"
        className="inline-block rounded-md border border-border bg-washi px-4 py-2 text-sm hover:bg-kinari"
      >
        地図から探す
      </Link>
    </main>
  );
}
