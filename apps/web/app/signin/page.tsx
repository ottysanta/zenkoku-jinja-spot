import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "サインイン | 全国神社スポット" };

/**
 * 最小サインイン画面。Google（設定時）と Email magic link（Resend 設定時）を表示。
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  const next = callbackUrl || "/";
  if (session?.userId) {
    redirect(next);
  }

  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );
  const emailEnabled = Boolean(process.env.AUTH_RESEND_KEY);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-2xl font-serif">サインイン</h1>
      <p className="mb-8 text-sm text-sumi/70">
        参拝記録や奉納履歴を安全に保存するためにサインインします。
      </p>

      <div className="space-y-3">
        {googleEnabled ? (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: next });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-md border border-border bg-washi px-4 py-3 text-sm font-medium hover:bg-kinari"
            >
              Google でサインイン
            </button>
          </form>
        ) : null}

        {emailEnabled ? (
          <form
            action={async (formData) => {
              "use server";
              const email = String(formData.get("email") || "");
              if (!email) return;
              await signIn("resend", { email, redirectTo: next });
            }}
            className="space-y-2"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="w-full rounded-md border border-border bg-washi px-4 py-3 text-sm font-medium hover:bg-kinari"
            >
              メールでリンクを受け取る
            </button>
          </form>
        ) : null}

        {!googleEnabled && !emailEnabled ? (
          <p className="rounded-md border border-border bg-washi p-4 text-xs text-sumi/60">
            プロバイダが未設定です。<code>AUTH_GOOGLE_ID</code> または{" "}
            <code>AUTH_RESEND_KEY</code> を設定してください。
          </p>
        ) : null}
      </div>
    </main>
  );
}
