"use client";
/**
 * マイページ（/me）
 *
 * - 認証導入前なので localStorage の client_id に紐付く「匿名の自分のデータ」を表示する。
 * - 閲覧履歴 (直近詳細表示) / ブックマーク / 参拝チェックイン履歴 の 3 タブ。
 * - ブックマーク・チェックインは FastAPI に寄せている既存エンドポイントがあるが、
 *   稼働状況に関係なく UI だけは崩れないよう全部 try/catch で握る。
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getClientId } from "@/lib/client-id";
import { api, spotSlug, type Spot } from "@/lib/api";

type RecentItem = {
  id: number;
  name: string;
  slug: string | null;
  prefecture: string | null;
  shrine_type: string | null;
  photo_url: string | null;
  visited_at: string;
};

const RECENT_KEY = "ssp_recent_shrines";

/** 閲覧履歴を LocalStorage に保持 */
export function addRecent(spot: {
  id: number;
  name: string;
  slug: string | null;
  prefecture: string | null;
  shrine_type: string | null;
  photo_url?: string | null;
}) {
  try {
    const raw = localStorage.getItem(RECENT_KEY) ?? "[]";
    const arr: RecentItem[] = JSON.parse(raw);
    const filtered = arr.filter((x) => x.id !== spot.id);
    filtered.unshift({
      id: spot.id,
      name: spot.name,
      slug: spot.slug,
      prefecture: spot.prefecture,
      shrine_type: spot.shrine_type,
      photo_url: spot.photo_url ?? null,
      visited_at: new Date().toISOString(),
    });
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, 30)));
  } catch {}
}

export default function MyPageClient() {
  const [tab, setTab] = useState<"recent" | "bookmarks" | "checkins">("recent");
  const [clientId, setClientId] = useState<string>("");
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Spot[] | null>(null);
  const [checkins, setCheckins] = useState<
    Array<{ spot_id: number; name: string | null; created_at: string; wish_type: string | null; comment: string | null }>
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClientId(getClientId());
    try {
      const raw = localStorage.getItem(RECENT_KEY) ?? "[]";
      setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  const loadBookmarks = useCallback(async () => {
    try {
      const rs = await api.listMyBookmarks({ client_id: clientId });
      // Bookmark[] は spot_id を持つが Spot 型ではない。spot を別途取得して詰め直す。
      const spots: Spot[] = [];
      for (const b of rs ?? []) {
        try {
          const s = await api.getSpot(b.spot_id);
          spots.push(s);
        } catch {}
      }
      setBookmarks(spots);
    } catch {
      setBookmarks([]);
      setError("ブックマークの取得に失敗しました（サーバー停止中の可能性）");
    }
  }, [clientId]);

  const loadCheckins = useCallback(async () => {
    try {
      const rs = await api.listMyCheckins(clientId);
      setCheckins(
        (rs ?? []).map((c) => ({
          spot_id: c.spot_id,
          name: c.name ?? null,
          created_at: c.created_at,
          wish_type: c.wish_type ?? null,
          comment: c.comment ?? null,
        })),
      );
    } catch {
      setCheckins([]);
      setError("参拝履歴の取得に失敗しました（サーバー停止中の可能性）");
    }
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    if (tab === "bookmarks" && bookmarks === null) void loadBookmarks();
    if (tab === "checkins" && checkins === null) void loadCheckins();
  }, [tab, clientId, bookmarks, checkins, loadBookmarks, loadCheckins]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:py-8">
      <header className="mb-4">
        <h1 className="font-serif text-2xl md:text-3xl">マイページ</h1>
        <p className="mt-1 text-xs text-sumi/60">
          閲覧履歴やブックマーク、参拝記録をまとめて確認できます。匿名アカウント (端末紐付け) として動作します。
        </p>
        {clientId ? (
          <p className="mt-1 text-[10px] font-mono text-sumi/40">
            client_id: {clientId.slice(0, 14)}…
          </p>
        ) : null}
      </header>

      {/* タブ */}
      <nav className="mb-4 flex gap-1 border-b border-border">
        {(
          [
            { key: "recent", label: "閲覧履歴", icon: "🕘" },
            { key: "bookmarks", label: "ブックマーク", icon: "🔖" },
            { key: "checkins", label: "参拝履歴", icon: "⛩" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              "flex items-center gap-1 border-b-2 px-3 py-2 text-sm transition " +
              (tab === t.key
                ? "border-vermilion bg-vermilion/5 font-semibold text-vermilion-deep"
                : "border-transparent text-sumi/70 hover:text-sumi")
            }
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {error ? (
        <div className="mb-3 rounded-md border border-border bg-kinari px-3 py-2 text-xs text-sumi/80">
          {error}
        </div>
      ) : null}

      {tab === "recent" ? (
        recent.length === 0 ? (
          <EmptyState text="まだ閲覧した神社はありません。神社の詳細ページを開くと、ここに履歴が残ります。" />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((r) => (
              <li key={r.id}>
                <ShrineCard
                  href={`/shrines/${spotSlug({ id: r.id, slug: r.slug })}`}
                  name={r.name}
                  meta={[r.prefecture, r.shrine_type].filter(Boolean).join(" / ")}
                  photoUrl={r.photo_url}
                  subtle={formatRelative(r.visited_at)}
                />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "bookmarks" ? (
        bookmarks === null ? (
          <LoadingState />
        ) : bookmarks.length === 0 ? (
          <EmptyState text="ブックマークした神社はまだありません。神社ページの「行きたい / 保存」でブックマークできます。" />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((s) => (
              <li key={s.id}>
                <ShrineCard
                  href={`/shrines/${spotSlug(s)}`}
                  name={s.name}
                  meta={[s.prefecture, s.shrine_type].filter(Boolean).join(" / ")}
                  photoUrl={s.photo_url ?? null}
                />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "checkins" ? (
        checkins === null ? (
          <LoadingState />
        ) : checkins.length === 0 ? (
          <EmptyState text="参拝記録はまだありません。地図ページで境内 300m 以内に入ると記録できます。" />
        ) : (
          <ul className="space-y-2">
            {checkins.map((c, i) => (
              <li
                key={c.spot_id + "-" + i}
                className="flex items-start justify-between gap-3 rounded-md border border-border bg-washi p-3 text-sm"
              >
                <div className="min-w-0">
                  <Link
                    href={`/shrines/spot-${c.spot_id}`}
                    className="font-semibold text-sumi hover:underline"
                  >
                    {c.name || `神社 #${c.spot_id}`}
                  </Link>
                  {c.comment ? (
                    <p className="mt-1 whitespace-pre-wrap text-[12px] text-sumi/80">
                      {c.comment}
                    </p>
                  ) : null}
                  {c.wish_type ? (
                    <span className="mt-1 inline-block rounded-full border border-vermilion/40 bg-vermilion/10 px-2 py-0.5 text-[10px] text-vermilion-deep">
                      {wishLabel(c.wish_type)}
                    </span>
                  ) : null}
                </div>
                <span className="shrink-0 text-[11px] text-sumi/50">
                  {formatRelative(c.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : null}

      <aside className="mt-10 rounded-md border border-dashed border-border bg-washi/60 p-4 text-xs text-sumi/70">
        <p>
          ※ 現在は端末に紐づく匿名アカウントです。将来的には SSO（Google / Apple）で
          端末をまたいでデータを引き継げるようにします。
        </p>
      </aside>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-washi/60 p-6 text-center text-sm text-sumi/70">
      {text}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center rounded-md border border-border bg-washi/60 p-8 text-xs text-sumi/60">
      <span
        className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-vermilion/40 border-t-vermilion-deep"
        role="status"
      />
      読み込み中…
    </div>
  );
}

function ShrineCard({
  href,
  name,
  meta,
  photoUrl,
  subtle,
}: {
  href: string;
  name: string;
  meta: string;
  photoUrl: string | null;
  subtle?: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-washi transition hover:shadow-md"
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} loading="lazy" className="h-28 w-full object-cover" />
      ) : (
        <div className="flex h-16 w-full items-center justify-center bg-kinari text-[10px] text-sumi/40">
          ⛩ 写真なし
        </div>
      )}
      <div className="flex-1 p-3">
        <p className="line-clamp-1 text-sm font-semibold text-sumi">{name}</p>
        {meta ? (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-sumi/60">{meta}</p>
        ) : null}
        {subtle ? (
          <p className="mt-1 text-[10px] text-sumi/40">{subtle}</p>
        ) : null}
      </div>
    </Link>
  );
}

function wishLabel(key: string): string {
  return (
    ({ gratitude: "感謝", vow: "決意", milestone: "節目", thanks: "お礼", other: "その他" } as Record<
      string,
      string
    >)[key] || key
  );
}

function formatRelative(iso: string): string {
  try {
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "たった今";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} 分前`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} 時間前`;
    const d = Math.floor(hr / 24);
    if (d < 30) return `${d} 日前`;
    return new Date(iso).toLocaleDateString("ja-JP");
  } catch {
    return iso;
  }
}
