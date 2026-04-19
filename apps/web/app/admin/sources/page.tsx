import { api, type SourceInfo, type SourceImportRow, type FreshnessSummary } from "@/lib/api";
import SyncTriggerButton from "@/components/admin/SyncTriggerButton";

export const metadata = { title: "ソース管理", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Admin: マルチソース神社データ管理ダッシュボード。
 *
 * - 登録済みソースの優先度・健全性・件数・最終同期を一覧
 * - 直近のインポート履歴（source_imports）
 * - 鮮度サマリ（fresh/aging/stale）
 * - 手動 sync トリガ（Client Component 側で行う）
 */
export default async function AdminSourcesPage() {
  const [sources, imports, freshness] = await Promise.all([
    api.listSources().catch((): SourceInfo[] => []),
    api.listSourceImports({ limit: 30 }).catch((): SourceImportRow[] => []),
    api.getFreshnessSummary().catch((): FreshnessSummary | null => null),
  ]);

  return (
    <main>
      <h1 className="mb-4 font-serif text-2xl">ソース管理</h1>
      <p className="mb-6 text-xs text-sumi/60">
        複数の外部データソース（OSM / Wikidata / MLIT / GSI / 文化庁 / Places 等）を統合し、
        神社マスタを継続更新します。高優先ソース（manual → bunka → jinjacho → mlit → gsi）の値が
        低優先（wikidata / osm / places）を上書きできます。Places 由来データは規約に従い永続化しません。
      </p>

      {freshness ? (
        <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="総数" value={freshness.total} />
          <StatCard label="fresh" value={freshness.fresh} tone="ok" />
          <StatCard label="aging" value={freshness.aging} tone="warn" />
          <StatCard label="stale" value={freshness.stale} tone="alert" />
          <StatCard label="unknown" value={freshness.unknown} />
        </section>
      ) : null}

      <section className="mb-10">
        <h2 className="mb-3 font-serif text-lg">登録ソース</h2>
        <div className="overflow-x-auto rounded-md border border-border bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-border bg-washi text-left text-xs text-sumi/60">
              <tr>
                <th className="px-3 py-2">ソース</th>
                <th className="px-3 py-2">優先度</th>
                <th className="px-3 py-2">信頼度</th>
                <th className="px-3 py-2">件数</th>
                <th className="px-3 py-2">ヘルス</th>
                <th className="px-3 py-2">最終同期</th>
                <th className="px-3 py-2">結果</th>
                <th className="px-3 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.source_type} className="border-b border-border/40 last:border-0 align-top">
                  <td className="px-3 py-2">
                    <div className="font-medium">{s.display_name}</div>
                    <div className="font-mono text-[10px] text-sumi/50">{s.source_type}</div>
                    {s.non_persistable_raw ? (
                      <div className="mt-0.5 text-[10px] text-vermilion">raw 永続化不可（TOS）</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{s.priority}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.default_confidence}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.record_count.toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs">
                    <span className={s.health_ok ? "text-moss" : "text-vermilion"}>
                      {s.health_ok ? "OK" : "NG"}
                    </span>
                    <div className="text-[10px] text-sumi/50">{s.health_message}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-sumi/70">
                    {s.last_import_at ? (
                      <>
                        <div>{new Date(s.last_import_at).toLocaleString("ja-JP")}</div>
                        <div className="text-[10px] text-sumi/50">{s.last_import_status}</div>
                      </>
                    ) : (
                      <span className="text-sumi/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {s.last_inserted != null || s.last_updated != null ? (
                      <div className="font-mono">
                        +{s.last_inserted ?? 0} / ~{s.last_updated ?? 0}
                        {(s.last_failed ?? 0) > 0 ? (
                          <span className="ml-1 text-vermilion">!{s.last_failed}</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-sumi/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <SyncTriggerButton sourceType={s.source_type} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg">直近のインポート履歴</h2>
        <div className="overflow-x-auto rounded-md border border-border bg-white">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b border-border bg-washi text-left text-xs text-sumi/60">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">ソース</th>
                <th className="px-3 py-2">開始</th>
                <th className="px-3 py-2">終了</th>
                <th className="px-3 py-2">状態</th>
                <th className="px-3 py-2">差分</th>
                <th className="px-3 py-2">実行元</th>
              </tr>
            </thead>
            <tbody>
              {imports.length === 0 ? (
                <tr><td className="px-3 py-4 text-xs text-sumi/50" colSpan={7}>履歴なし</td></tr>
              ) : imports.map((r) => (
                <tr key={r.id} className="border-b border-border/40 last:border-0 align-top">
                  <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.source_type}</td>
                  <td className="px-3 py-2 text-xs">{new Date(r.started_at).toLocaleString("ja-JP")}</td>
                  <td className="px-3 py-2 text-xs">{r.finished_at ? new Date(r.finished_at).toLocaleString("ja-JP") : "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    +{r.inserted} / ~{r.updated} / -{r.skipped}
                    {r.failed > 0 ? <span className="ml-1 text-vermilion">!{r.failed}</span> : null}
                  </td>
                  <td className="px-3 py-2 text-xs text-sumi/70">{r.triggered_by ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" | "alert" }) {
  const color = tone === "ok" ? "text-moss" : tone === "warn" ? "text-amber-700" : tone === "alert" ? "text-vermilion" : "text-sumi";
  return (
    <div className="rounded-md border border-border bg-white px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-sumi/50">{label}</div>
      <div className={`font-mono text-xl ${color}`}>{value.toLocaleString()}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    completed: "bg-moss/10 text-moss",
    running: "bg-blue-100 text-blue-700",
    queued: "bg-blue-50 text-blue-600",
    failed: "bg-vermilion/10 text-vermilion",
    cancelled: "bg-sumi/10 text-sumi/60",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${tone[status] ?? "bg-sumi/10 text-sumi/60"}`}>
      {status}
    </span>
  );
}
