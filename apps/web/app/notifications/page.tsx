import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { api, type Notification } from "@/lib/api";
import { markAllNotificationsRead } from "@/components/reviews/actions";

export const metadata = { title: "通知", robots: { index: false } };
export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  reaction: "リアクション",
  follow: "フォロー",
  review_reply: "コメント",
  offering_receipt: "奉納",
  system: "お知らせ",
};

function summarize(n: Notification): string {
  try {
    const p = n.payload ? JSON.parse(n.payload) : {};
    if (n.kind === "reaction") return `レビューに「${p.kind}」のリアクションが付きました`;
    if (n.kind === "follow") return `フォローされました`;
    return KIND_LABELS[n.kind] || n.kind;
  } catch {
    return KIND_LABELS[n.kind] || n.kind;
  }
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.apiToken) {
    redirect("/signin?callbackUrl=/notifications");
  }

  const items = await api.listNotifications(session.apiToken!);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-2xl">通知</h1>
        <form action={markAllNotificationsRead}>
          <button
            type="submit"
            className="rounded-md border border-border bg-washi px-3 py-1.5 text-xs hover:bg-kinari"
          >
            すべて既読にする
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-sumi/60">新しい通知はありません。</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={
                "rounded-md border border-border bg-white p-3 text-sm " +
                (n.is_read ? "opacity-70" : "")
              }
            >
              <div className="flex items-center justify-between text-xs text-sumi/60">
                <span>{KIND_LABELS[n.kind] || n.kind}</span>
                <time dateTime={n.created_at}>
                  {new Date(n.created_at).toLocaleString("ja-JP")}
                </time>
              </div>
              <p className="mt-1">{summarize(n)}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
