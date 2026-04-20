import type { Metadata } from "next";
import { listSubmissions, submissionCountsByStatus } from "@/lib/shrine-db";
import SubmissionReviewer from "@/components/admin/SubmissionReviewer";

export const metadata: Metadata = {
  title: "申請レビュー",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string }>;

/**
 * /admin/submissions
 *
 * spot_submissions の一覧と承認/却下/追加情報要望の UI。
 * status クエリ: pending (既定) / approved / rejected / needs_more_info / all
 */
export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const statusQ = (sp?.status ?? "pending").toLowerCase();
  const counts = submissionCountsByStatus();
  const status =
    statusQ === "approved" || statusQ === "rejected" || statusQ === "needs_more_info"
      ? (statusQ as "approved" | "rejected" | "needs_more_info")
      : statusQ === "all"
        ? undefined
        : ("pending" as const);
  const { rows, total } = listSubmissions({ status, limit: 100 });

  const tabs: Array<{ key: string; label: string; count: number }> = [
    { key: "pending", label: "承認待ち", count: counts.pending ?? 0 },
    { key: "needs_more_info", label: "追加情報要請中", count: counts.needs_more_info ?? 0 },
    { key: "approved", label: "承認済み", count: counts.approved ?? 0 },
    { key: "rejected", label: "却下", count: counts.rejected ?? 0 },
    {
      key: "all",
      label: "すべて",
      count:
        (counts.pending ?? 0) +
        (counts.approved ?? 0) +
        (counts.rejected ?? 0) +
        (counts.needs_more_info ?? 0),
    },
  ];

  return (
    <main>
      <h1 className="mb-2 font-serif text-2xl">新規神社申請</h1>
      <p className="mb-4 text-xs text-sumi/60">
        /submit-shrine から送られた掲載リクエストです。承認すると即時 spots テーブルへ追加され、地図・検索に反映されます。
      </p>

      <nav className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/admin/submissions?status=${t.key}`}
            className={
              "rounded-full border px-3 py-1 text-xs transition " +
              (statusQ === t.key
                ? "border-vermilion-deep bg-vermilion-deep text-white"
                : "border-border bg-white text-sumi hover:bg-kinari")
            }
          >
            {t.label}
            <span className="ml-1 text-[10px] opacity-80">({t.count})</span>
          </a>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-washi/60 p-8 text-center text-sm text-sumi/70">
          該当する申請はありません。
        </div>
      ) : (
        <p className="mb-3 text-xs text-sumi/60">{total} 件</p>
      )}

      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id}>
            <SubmissionReviewer row={row} />
          </li>
        ))}
      </ul>
    </main>
  );
}
