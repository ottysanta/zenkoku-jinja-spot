import Link from "next/link";
import { api, spotSlug } from "@/lib/api";

export const metadata = { title: "神社管理", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Phase 2: 管理者用の神社一覧。
 * - 現時点では /shrines を叩いて上位 200 件を返すだけのスケルトン。
 * - 編集フォーム、i18n 翻訳管理、承認フロー等は Phase 2 後半で実装。
 */
export default async function AdminShrinesPage() {
  const shrines = await api.listShrines(200, 0);

  return (
    <main>
      <h1 className="mb-4 font-serif text-2xl">神社</h1>
      <p className="mb-4 text-xs text-sumi/60">
        {shrines.length} 件（最新 200 件を表示）
      </p>
      <div className="overflow-hidden rounded-md border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-washi text-left text-xs text-sumi/60">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">名称</th>
              <th className="px-3 py-2">都道府県</th>
              <th className="px-3 py-2">社格</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {shrines.map((s) => (
              <tr key={s.id} className="border-b border-border/40 last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{s.id}</td>
                <td className="px-3 py-2">{s.name}</td>
                <td className="px-3 py-2 text-xs text-sumi/70">{s.prefecture ?? "—"}</td>
                <td className="px-3 py-2 text-xs text-sumi/70">{s.shrine_rank ?? "—"}</td>
                <td className="px-3 py-2 text-xs">
                  <Link
                    href={`/shrines/${spotSlug(s)}`}
                    className="text-moss underline"
                  >
                    表示
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
