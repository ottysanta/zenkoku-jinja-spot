export const metadata = {
  title: "奉納キャンペーン",
  description: "屋根の葺き替え・文化財修繕など、目標金額付きの奉納キャンペーン一覧。",
};
export const dynamic = "force-dynamic";

/**
 * Phase 2: 神社ごとの目標付き奉納キャンペーン一覧。
 * - campaigns テーブル（migration 005）＋ campaign_contributions で進捗集計。
 * - 現時点では API 未実装なのでスケルトンのみ。
 */
export default function CampaignsIndexPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <header className="mb-6">
        <h1 className="font-serif text-3xl md:text-4xl">奉納キャンペーン</h1>
        <p className="mt-2 text-sm text-sumi/70">
          屋根の葺き替え、文化財修繕、復興事業など、目標金額つきの奉納プロジェクト。
        </p>
      </header>

      <div className="rounded-md border border-border bg-washi p-6 text-center text-sm text-sumi/70">
        <p>現在募集中のキャンペーンはありません。</p>
        <p className="mt-1 text-xs">
          神社の方はお問い合わせページよりキャンペーン掲載のご依頼ができます。
        </p>
      </div>
    </main>
  );
}
