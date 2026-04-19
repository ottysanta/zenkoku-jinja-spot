/**
 * 認証導入前の匿名識別子。localStorage に UUID を保持し、
 * サーバ側の Checkin.client_id / UserPost 等に渡す。
 * 認証実装後も、未ログインの記録を後でアカウントに紐付ける「下敷き」として残す。
 */
const KEY = 'ssp_client_id';

export function getClientId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id =
      'c_' +
      (globalThis.crypto?.randomUUID?.() ??
        `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return `c_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
}
