/**
 * Auth.js (NextAuth v5) 設定。
 *
 * - providers: Google（任意）+ Resend 経由の Email magic link（任意）。
 *   環境変数が未設定なら該当 provider は無効化する（雛形として置いておく）。
 * - signIn 時に FastAPI の /auth/sessions を叩いて API トークンを取得し、
 *   JWT に載せる（session から lib/api.ts で参照）。
 * - session strategy は jwt（DB アダプタは使わず、ユーザーデータは FastAPI 側で管理）。
 */
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

type ApiSession = {
  token: string;
  expires_at: string;
  user: {
    id: number;
    email?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    locale?: string | null;
    role: string;
  };
};

async function issueApiSession(input: {
  provider: string;
  providerAccountId: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  locale?: string | null;
}): Promise<ApiSession | null> {
  const base = process.env.API_BASE_URL_INTERNAL || process.env.NEXT_PUBLIC_API_BASE;
  const bridge = process.env.AUTH_BRIDGE_SECRET;
  if (!base || !bridge) {
    console.warn("[auth] API_BASE_URL_INTERNAL / AUTH_BRIDGE_SECRET not set — skipping API session issue");
    return null;
  }
  const res = await fetch(`${base}/auth/sessions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-auth-bridge": bridge,
    },
    body: JSON.stringify({
      provider: input.provider,
      provider_account_id: input.providerAccountId,
      email: input.email ?? null,
      display_name: input.displayName ?? null,
      avatar_url: input.avatarUrl ?? null,
      locale: input.locale ?? "ja",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("[auth] issueApiSession failed", res.status, await res.text().catch(() => ""));
    return null;
  }
  return (await res.json()) as ApiSession;
}

const providers: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (process.env.AUTH_RESEND_KEY) {
  providers.push(
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_EMAIL_FROM || "no-reply@example.com",
    }),
  );
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // 初回サインイン時のみ FastAPI にセッションを発行してもらう
      if (account && account.providerAccountId) {
        const api = await issueApiSession({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          email: (profile as { email?: string } | null)?.email ?? token.email ?? null,
          displayName:
            (profile as { name?: string } | null)?.name ??
            (token.name as string | undefined) ??
            null,
          avatarUrl:
            (profile as { picture?: string; image?: string } | null)?.picture ??
            (profile as { image?: string } | null)?.image ??
            (token.picture as string | undefined) ??
            null,
          locale: "ja",
        });
        if (api) {
          token.apiToken = api.token;
          token.apiExpiresAt = api.expires_at;
          token.userId = api.user.id;
          token.role = api.user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // クライアントから参照できるよう必要最小限だけ載せる（token 自体はサーバー経由で使う想定）
      if (token.apiToken) session.apiToken = token.apiToken as string;
      if (token.apiExpiresAt) session.apiExpiresAt = token.apiExpiresAt as string;
      if (token.userId) session.userId = token.userId as number;
      if (token.role) session.role = token.role as string;
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
