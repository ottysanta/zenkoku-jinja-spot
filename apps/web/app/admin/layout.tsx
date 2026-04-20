import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";

/**
 * 管理者レイアウト。
 *
 * - 認可優先度:
 *   1. ADMIN_EMAILS 環境変数 (カンマ区切り) に email が含まれていれば OK。
 *      FastAPI 無しでも動くスタンドアロン管理用に用意。
 *   2. session.role が admin / moderator (FastAPI ブリッジ経由) なら OK。
 * - それ以外は権限なし。
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() ?? null;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const role = session?.role;
  const isEnvAdmin = email && adminEmails.includes(email);
  const isRoleAdmin = role === "admin" || role === "moderator";

  if (!session) {
    redirect("/signin?callbackUrl=/admin/submissions");
  }
  if (!isEnvAdmin && !isRoleAdmin) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl">権限がありません</h1>
        <p className="mt-2 text-sm text-sumi/70">
          このページは管理者のみ利用できます。
          {email ? (
            <>
              <br />
              <span className="font-mono text-xs text-sumi/50">login: {email}</span>
            </>
          ) : null}
        </p>
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
