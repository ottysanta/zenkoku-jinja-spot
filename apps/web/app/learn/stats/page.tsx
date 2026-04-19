import { api, type StatsReferenceRow } from "@/lib/api";

export const metadata = {
  title: "神社数の参考統計",
  description:
    "文化庁『宗教年鑑』に基づく神社登録数の参考値と、祠を含めた推計総数について。",
};
export const revalidate = 86400; // 1日

/**
 * ユーザー向けの「神社数の見方」説明ページ。
 *
 * 数値は stats_references テーブル（文化庁 宗教年鑑 + 推計値）から取得し、
 * 年度・対象時点・出典リンクをセットで表示する。固定文言で数値を埋め込まない
 * ことで、翌年の年鑑公開時に値だけ差し替えられる。
 */
export default async function StatsReferencePage() {
  const stats: StatsReferenceRow[] = await api.listStatsReferences().catch(() => []);

  const registered = stats.find((s) => s.metric_key === "registered_shinto_shrines");
  const estimated = stats.find((s) => s.metric_key === "estimated_total_shrines_including_hokora");

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-3 font-serif text-3xl">神社数の参考統計</h1>
      <p className="mb-8 text-sm text-sumi/70">
        「日本にある神社の数」は、どの定義で数えるかで大きく変わります。
        本ページでは <strong>宗教法人として登録された神社数</strong> と、
        <strong>小規模な祠・屋敷神を含めた推計総数</strong> の 2 つを、出典と対象時点をつけて示します。
      </p>

      {registered ? (
        <article className="mb-6 rounded-md border border-border bg-white p-5">
          <h2 className="mb-2 font-serif text-xl">宗教法人登録神社数</h2>
          <p className="mb-2 font-mono text-3xl text-vermilion-deep">
            {registered.metric_value.toLocaleString()} 社
          </p>
          <dl className="mb-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-sumi/70">
            <dt>出典</dt>
            <dd>
              {registered.source_url ? (
                <a
                  href={registered.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-moss underline"
                >
                  {registered.source_name}
                </a>
              ) : (
                registered.source_name
              )}
            </dd>
            <dt>対象年</dt>
            <dd>{registered.reference_year}</dd>
            <dt>対象時点</dt>
            <dd>{registered.reference_as_of ?? "—"}</dd>
            {registered.published_at ? (
              <>
                <dt>公開</dt>
                <dd>{registered.published_at}</dd>
              </>
            ) : null}
          </dl>
          {registered.note ? (
            <p className="text-xs leading-relaxed text-sumi/60">{registered.note}</p>
          ) : null}
        </article>
      ) : null}

      {estimated ? (
        <article className="mb-6 rounded-md border border-border bg-white p-5">
          <h2 className="mb-2 font-serif text-xl">推計総数（祠含む）</h2>
          <p className="mb-2 font-mono text-3xl text-sumi">
            約 {estimated.metric_value.toLocaleString()} 社
          </p>
          <dl className="mb-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-sumi/70">
            <dt>性質</dt>
            <dd>参考推計値</dd>
            <dt>対象時点</dt>
            <dd>{estimated.reference_as_of ?? "—"}</dd>
          </dl>
          {estimated.note ? (
            <p className="text-xs leading-relaxed text-sumi/60">{estimated.note}</p>
          ) : null}
        </article>
      ) : null}

      <aside className="rounded-md border border-border/50 bg-kinari/40 p-4 text-xs leading-relaxed text-sumi/60">
        <p>
          このサイトのマップに表示される神社は、OpenStreetMap / Wikidata / 国土数値情報 /
          国土地理院 / 神社庁 / 管理者手動登録 を統合したデータを元に生成されます。
          したがって掲載数と文化庁統計の値は一致しません。掲載数は継続更新されます。
        </p>
      </aside>
    </main>
  );
}
