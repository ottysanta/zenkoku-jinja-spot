import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "サインイン | 全国神社スポット" };

/**
 * サインイン画面。
 *
 * - Google（AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET 設定時に有効）
 * - Email magic link（AUTH_RESEND_KEY 設定時に有効）
 *
 * 認証後はマイページ（/me）で自分のブックマーク・参拝履歴が端末をまたいで同期される。
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;
  const next = callbackUrl || "/me";
  // userId は FastAPI ブリッジがあるときのみ入る。無ければ email でログイン判定。
  if (session?.userId || session?.user?.email) {
    redirect(next);
  }

  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );
  const emailEnabled = Boolean(process.env.AUTH_RESEND_KEY);

  return (
    <main className="mx-auto max-w-md px-6 py-12 md:py-16">
      <div className="mb-8 text-center">
        <span className="text-4xl" aria-hidden="true">⛩</span>
        <h1 className="mt-2 font-serif text-2xl">サインイン</h1>
        <p className="mt-2 text-sm text-sumi/70">
          ブックマーク（行きたい / いいね）・参拝履歴を端末をまたいで同期できます。
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          サインインに失敗しました: {error}
        </div>
      ) : null}

      <div className="space-y-3 rounded-lg border border-border bg-white p-6 shadow-sm">
        {googleEnabled ? (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: next });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-white px-4 py-3 text-sm font-medium shadow-sm hover:bg-kinari"
            >
              <GoogleGlyph />
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
            className="space-y-2 border-t border-border pt-3"
          >
            <label className="block text-xs text-sumi/70">メールアドレス</label>
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
              メールでサインインリンクを受け取る
            </button>
          </form>
        ) : null}

        {!googleEnabled && !emailEnabled ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-xs text-sumi/80">
            <p className="font-semibold text-amber-800">サインインプロバイダが未設定です</p>
            <p className="mt-1 leading-relaxed">
              デプロイ環境の環境変数に、<code className="rounded bg-white px-1">AUTH_GOOGLE_ID</code>
              {" "}と <code className="rounded bg-white px-1">AUTH_GOOGLE_SECRET</code>
              {" "}（Google Cloud Console で OAuth クライアントを発行）、または
              <code className="rounded bg-white px-1">AUTH_RESEND_KEY</code>（Resend API
              キー）を設定してください。
              <br />
              NextAuth v5 は <code className="rounded bg-white px-1">AUTH_SECRET</code>{" "}
              (任意文字列 32byte 以上) も必須です。
            </p>
          </div>
        ) : null}
      </div>

      <p className="mt-6 text-center text-xs text-sumi/60">
        サインインしない場合でも、端末内にブックマーク・履歴は保存されます。
      </p>
    </main>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.71-1.57 2.68-3.9 2.68-6.61z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
