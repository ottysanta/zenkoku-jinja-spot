"use client";

/**
 * マイページ: client_id ベースで登録した「行きたい / 保存 / 行った」神社を一覧表示。
 *
 * - 認証不要。`getClientId()` を使って `/me/bookmarks` から取得。
 * - 3 タブでステータス切替。各カードから詳細ページへリンク、削除可能。
 * - サーバーコンポーネントでは localStorage の client_id を得られないためクライアント。
 */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, spotSlug, type Bookmark, type BookmarkStatus } from "@/lib/api";
import { getClientId } from "@/lib/client-id";

type TabDef = { key: BookmarkStatus; label: string };

const TABS: ReadonlyArray<TabDef> = [
  { key: "want", label: "行きたい" },
  { key: "saved", label: "保存" },
  { key: "visited", label: "行った" },
];

export default function MyPage() {
  const [active, setActive] = useState<BookmarkStatus>("want");
  const [clientId, setClientId] = useState<string>("");
  const [items, setItems] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClientId(getClientId());
  }, []);

  const load = useCallback(
    async (cid: string, status: BookmarkStatus) => {
      setLoading(true);
      setError(null);
      try {
        const list = await api.listMyBookmarks({ client_id: cid, status });
        setItems(list);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "取得に失敗しました");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!clientId) return;
    load(clientId, active);
  }, [clientId, active, load]);

  const handleDelete = useCallback(
    async (id: number) => {
      if (!clientId) return;
      const prev = items;
      setItems((xs) => xs.filter((x) => x.id !== id));
      try {
        await api.deleteBookmark(id, clientId);
      } catch {
        setItems(prev);
      }
    },
    [clientId, items],
  );

  const counts = useMemo(() => items.length, [items]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <header className="mb-6">
        <h1 className="font-serif text-3xl md:text-4xl">マイページ</h1>
        <p className="mt-2 text-sm text-sumi/70">
          保存した神社の一覧。ログイン不要で、この端末での記録を表示しています。
        </p>
      </header>

      <nav className="mb-6 flex gap-2" role="tablist" aria-label="保存状態フィルタ">
        {TABS.map((t) => {
          const selected = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(t.key)}
              className={[
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                selected
                  ? "border-vermilion bg-vermilion text-white"
                  : "border-border bg-washi text-sumi/80 hover:bg-kinari",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      {loading ? (
        <p className="text-sm text-sumi/60">読み込み中...</p>
      ) : error ? (
        <p className="text-sm text-vermilion">{error}</p>
      ) : counts === 0 ? (
        <div className="rounded-md border border-border bg-washi p-6 text-center">
          <p className="mb-4 text-sm text-sumi/70">
            まだ登録された神社はありません
          </p>
          <Link
            href="/map"
            className="inline-block rounded-md border border-vermilion bg-vermilion px-4 py-2 text-sm font-medium text-white hover:bg-vermilion-deep"
          >
            地図から探す
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((b) => (
            <li
              key={b.id}
              className="flex gap-3 rounded-md border border-border bg-kinari p-3"
            >
              {b.spot?.photo_url ? (
                // next/image を使わず素の img に留める（外部ドメイン多数・軽量優先）
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.spot.photo_url}
                  alt=""
                  className="h-20 w-20 flex-none rounded-md object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-20 w-20 flex-none rounded-md bg-washi" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-serif text-lg">
                  {b.spot ? (
                    <Link
                      href={`/shrines/${spotSlug(b.spot)}`}
                      className="hover:underline"
                    >
                      {b.spot.name}
                    </Link>
                  ) : (
                    <span>（削除された神社）</span>
                  )}
                </h2>
                {b.spot?.prefecture ? (
                  <p className="text-xs text-sumi/60">{b.spot.prefecture}</p>
                ) : null}
                {b.note ? (
                  <p className="mt-1 line-clamp-2 text-xs text-sumi/70">
                    {b.note}
                  </p>
                ) : null}
                <p className="mt-1 text-[10px] text-sumi/40">
                  登録: {new Date(b.created_at).toLocaleDateString("ja-JP")}
                </p>
              </div>
              <div className="flex flex-none flex-col justify-between">
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  className="text-xs text-sumi/50 hover:text-vermilion"
                  aria-label="この登録を削除"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
