/**
 * サーバーコンポーネント / server action 向け API ラッパ。
 * Auth.js セッションから apiToken を取り出して付与する。
 */
import "server-only";
import { auth } from "@/auth";
import { api, type RequestOptions } from "@/lib/api";

export async function apiTokenFromSession(): Promise<string | null> {
  const session = await auth();
  return session?.apiToken ?? null;
}

/** Authorization 必須のエンドポイント用。未ログインなら null を返す。 */
export async function withAuth<T>(
  fn: (token: string) => Promise<T>,
): Promise<T | null> {
  const token = await apiTokenFromSession();
  if (!token) return null;
  return fn(token);
}

/** 汎用ヘルパ: request に token を自動で載せる薄いラッパ。 */
export async function authedOptions(
  extra?: RequestOptions,
): Promise<RequestOptions> {
  const token = await apiTokenFromSession();
  return { ...extra, token };
}

export { api };
