export const metadata = { title: "申請レビュー", robots: { index: false } };

/**
 * Phase 2: spot_submissions の一覧と承認/却下。
 * - 現時点ではスケルトン。`GET /spot-submissions?status=pending` + approve/reject 相当は未実装。
 */
export default function AdminSubmissionsPage() {
  return (
    <main>
      <h1 className="mb-4 font-serif text-2xl">新規神社申請</h1>
      <p className="text-sm text-sumi/70">
        申請の承認・却下 UI は Phase 2 で実装予定です。
      </p>
    </main>
  );
}
