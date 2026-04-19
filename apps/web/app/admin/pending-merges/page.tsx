import { api, type PendingMergeRow } from "@/lib/api";
import MergeDecisionButtons from "@/components/admin/MergeDecisionButtons";

export const metadata = { title: "マージ候補レビュー", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Admin: pending_merges のレビュー UI。
 *
 * 自動マージが境界値（60m 以内だが名称が違う等）で保留された候補を、
 * 管理者が人手で approve / reject する。approve すると candidate の
 * source_records が primary に付け替えられ、candidate は published_status=merged に。
 */
export default async function PendingMergesPage() {
  const pending: PendingMergeRow[] = await api.listPendingMerges("pending", 100).catch(() => []);

  return (
    <main>
      <h1 className="mb-4 font-serif text-2xl">マージ候補レビュー</h1>
      <p className="mb-6 text-xs text-sumi/60">
        自動判定で境界値だった神社マージ候補です。座標距離・名称類似度を確認して承認/却下してください。
      </p>

      {pending.length === 0 ? (
        <div className="rounded-md border border-border bg-washi p-6 text-center text-sm text-sumi/60">
          レビュー待ちはありません。
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((p) => (
            <article key={p.id} className="rounded-md border border-border bg-white p-4">
              <header className="mb-2 flex items-baseline justify-between">
                <div className="text-xs text-sumi/50">
                  候補 #{p.id} · score {(p.match_score * 100).toFixed(0)}% ·{" "}
                  {new Date(p.created_at).toLocaleString("ja-JP")}
                </div>
              </header>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded border border-border bg-washi p-2">
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-sumi/50">
                    primary (保持される側) · id={p.primary_shrine_id}
                  </div>
                  <div className="font-medium">{p.primary_name}</div>
                </div>
                <div className="rounded border border-border bg-washi p-2">
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-sumi/50">
                    candidate (マージされる側) · id={p.candidate_shrine_id}
                  </div>
                  <div className="font-medium">{p.candidate_name}</div>
                </div>
              </div>
              {p.match_reasons ? (
                <pre className="mt-2 overflow-x-auto rounded border border-border/50 bg-kinari/30 p-2 text-[10px]">
                  {formatReasons(p.match_reasons)}
                </pre>
              ) : null}
              <MergeDecisionButtons mergeId={p.id} />
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function formatReasons(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
