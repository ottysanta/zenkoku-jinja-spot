import type { Metadata } from "next";
import Link from "next/link";
import {
  listOfferingShrines,
  countOfferingShrines,
  totalSpots,
} from "@/lib/shrine-db";
import { spotSlug } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "オンライン志納 対応神社一覧",
  description:
    "当サイトからオンラインで志納（奉納）を申し込める神社の一覧。宗教法人登録と受付同意が確認できた神社のみを掲載しています。",
};

function parseBenefits(json?: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function OfferingShrinesPage() {
  const shrines = listOfferingShrines(200);
  const accepting = countOfferingShrines();
  const total = totalSpots();

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <nav className="mb-3 text-xs text-sumi/60">
        <Link href="/" className="hover:underline">
          ホーム
        </Link>
        <span className="mx-1">›</span>
        <Link href="/offerings" className="hover:underline">
          気持ちを届ける
        </Link>
        <span className="mx-1">›</span>
        <span>対応神社一覧</span>
      </nav>

      <header className="mb-6 border-b border-border pb-5">
        <h1 className="font-serif text-2xl md:text-3xl">オンライン志納 対応神社</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sumi/75">
          当サイトからオンラインで志納金をお届けできるのは、
          <b>宗教法人として登録され、法人口座をお持ちで、当サイト経由での受付に同意いただいた神社</b>
          に限ります。下記の神社では{" "}
          <span className="inline-flex items-center gap-1 rounded-full bg-moss px-2 py-0.5 text-[11px] font-semibold text-white">
            ✓ 受付中
          </span>{" "}
          バッジが表示され、詳細ページから申込みが可能です。
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-sumi/80">
            <span className="text-sumi/55">受付対応</span>
            <b className="tabular-nums text-moss">{accepting.toLocaleString()}</b>
            <span>社</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-sumi/80">
            <span className="text-sumi/55">掲載全体</span>
            <b className="tabular-nums text-sumi">{total.toLocaleString()}</b>
            <span>社</span>
          </span>
        </div>
      </header>

      <aside className="mb-6 rounded-md border border-vermilion/30 bg-vermilion/5 p-4 text-xs text-sumi/80">
        <p>
          <b className="text-vermilion-deep">⚠ 全ての神社が対応している訳ではありません。</b>
          {" "}
          対応外の神社については、参拝は現地または神社公式のご案内に従ってください。
          神社関係者の方で受付開設をご希望の場合は、
          <Link href="/offerings" className="ml-1 text-moss underline">
            奉納の仕組み
          </Link>
          をご確認の上、運営までご連絡ください。
        </p>
      </aside>

      {shrines.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-washi/60 p-6 text-center text-sm text-sumi/60">
          現在、オンライン志納に対応している神社はまだ登録されていません。
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shrines.map((s) => {
            const benefits = parseBenefits(s.benefits);
            return (
              <li key={s.id}>
                <Link
                  href={`/shrines/${spotSlug(s)}`}
                  className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-washi shadow-sm transition hover:shadow-md"
                >
                  {s.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.photo_url}
                      alt={s.name}
                      className="h-36 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center bg-kinari text-xs text-sumi/40">
                      ⛩ 写真なし
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <div className="flex items-center gap-2">
                      <h2 className="line-clamp-1 text-sm font-semibold text-sumi">
                        {s.name}
                      </h2>
                      <span className="shrink-0 rounded-full bg-moss px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        ✓ 受付
                      </span>
                    </div>
                    <p className="line-clamp-1 text-[11px] text-sumi/60">
                      {[
                        [s.prefecture, s.city].filter(Boolean).join(" "),
                        s.shrine_type,
                        s.shrine_rank,
                      ]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                    </p>
                    {s.deity ? (
                      <p className="line-clamp-1 text-[11px] text-sumi/70">
                        御祭神: {s.deity}
                      </p>
                    ) : null}
                    {benefits.length > 0 ? (
                      <div className="mt-auto flex flex-wrap gap-1 pt-2">
                        {benefits.slice(0, 4).map((b) => (
                          <span
                            key={b}
                            className="rounded-full border border-vermilion/40 bg-vermilion/10 px-2 py-0.5 text-[10px] text-vermilion"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
