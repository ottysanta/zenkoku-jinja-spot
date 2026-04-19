import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";

/**
 * 管理者レイアウト。
 * - session.user.role が admin / moderator 以外は拒否。
 * - サブメニュー: 神社 / 申請 / 通報。
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.role;
  if (!session?.apiToken) {
    redirect("/signin?callbackUrl=/admin/shrines");
  }
  if (role !== "admin" && role !== "moderator") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl">権限がありません</h1>
        <p className="mt-2 text-sm text-sumi/70">このページは管理者のみ利用できます。</p>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-6 flex flex-wrap gap-3 border-b border-border pb-3 text-sm">
        <Link href="/admin/shrines" className="hover:underline">神社</Link>
        <Link href="/admin/sources" className="hover:underline">ソース</Link>
        <Link href="/admin/pending-merges" className="hover:underline">マージ候補</Link>
        <Link href="/admin/submissions" className="hover:underline">申請</Link>
        <Link href="/admin/reports" className="hover:underline">通報</Link>
      </nav>
      {children}
    </div>
  );
}
