export const metadata = { title: "通報対応", robots: { index: false } };

/**
 * Phase 2: reports の一覧と解決フロー。
 * - `GET /admin/reports` + is_hidden トグル、ユーザー停止などは Phase 2 で実装予定。
 */
export default function AdminReportsPage() {
  return (
    <main>
      <h1 className="mb-4 font-serif text-2xl">通報</h1>
      <p className="text-sm text-sumi/70">
        通報キュー UI は Phase 2 で実装予定です。
      </p>
    </main>
  );
}
