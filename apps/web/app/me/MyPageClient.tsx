"use client";
/**
 * マイページ（/me）
 *
 * - Google でサインインしていれば providerKey ベースでブックマークが同期される
 * - 未ログインでも client_id 単位で履歴・ブックマーク・参拝が閲覧できる
 * - ブックマークと参拝履歴は Next.js の /api/me/* 経由で SQLite を直接読む
 *   （FastAPI 停止中でも動作する）
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getClientId } from "@/lib/client-id";
import { spotSlug } from "@/lib/api";

type SessionUser = {
  email: string;
  name: string | null;
  image: string | null;
} | null;

type RecentItem = {
  id: number;
  name: string;
  slug: string | null;
  prefecture: string | null;
  shrine_type: string | null;
  photo_url: string | null;
  visited_at: string;
};

type BookmarkRow = {
  id: number;
  name: string;
  slug: string | null;
  prefecture: string | null;
  shrine_type: string | null;
  photo_url: string | null;
  bookmark_kind: "want" | "like";
  bookmarked_at: string;
};

type CheckinRow = {
  id: number;
  spot_id: number;
  spot_name: string | null;
  prefecture: string | null;
  slug: string | null;
  photo_url: string | null;
  comment: string | null;
  wish_type: string | null;
  created_at: string;
};

const RECENT_KEY = "ssp_recent_shrines";

const ELEMENT_STYLE: Record<string, { bg: string }> = {
  木: { bg: "bg-emerald-500" },
  火: { bg: "bg-orange-500" },
  土: { bg: "bg-amber-500" },
  金: { bg: "bg-slate-500" },
  水: { bg: "bg-blue-500" },
};

const FORTUNE_META: Record<string, { emoji: string; colorClass: string }> = {
  大吉: { emoji: "🌟", colorClass: "text-amber-400" },
  吉:   { emoji: "✨", colorClass: "text-green-400" },
  中吉: { emoji: "🌸", colorClass: "text-blue-400" },
  小吉: { emoji: "🍀", colorClass: "text-purple-400" },
  末吉: { emoji: "🌿", colorClass: "text-slate-400" },
  凶:   { emoji: "🌑", colorClass: "text-red-400" },
};

/** 閲覧履歴を LocalStorage に保持（既存の Export を維持する） */
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

type Tab = "recent" | "want" | "like" | "checkins" | "omikuji";

type GuardianProfile = { element: string; zodiac: string } | null;
type OmikujiRecord = { date: string; fortune: string };

export default function MyPageClient({ user }: { user?: SessionUser }) {
  const [tab, setTab] = useState<Tab>("recent");
  const [clientId, setClientId] = useState<string>("");
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [want, setWant] = useState<BookmarkRow[] | null>(null);
  const [like, setLike] = useState<BookmarkRow[] | null>(null);
  const [checkins, setCheckins] = useState<CheckinRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<GuardianProfile>(null);
  const [omikujiHistory, setOmikujiHistory] = useState<OmikujiRecord[]>([]);

  useEffect(() => {
    setClientId(getClientId());
    try {
      const raw = localStorage.getItem(RECENT_KEY) ?? "[]";
      setRecent(JSON.parse(raw));
    } catch {}
    // 守護タイプ
    const el = localStorage.getItem("guardian_element");
    const zo = localStorage.getItem("guardian_zodiac");
    if (el) setProfile({ element: el, zodiac: zo ?? "" });
    // おみくじ履歴（全 omikuji_* キー）
    const hist: OmikujiRecord[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("omikuji_")) {
        const fortune = localStorage.getItem(key);
        if (fortune) hist.push({ date: key.replace("omikuji_", ""), fortune });
      }
    }
    hist.sort((a, b) => b.date.localeCompare(a.date));
    setOmikujiHistory(hist);
  }, []);

  const loadBookmarks = useCallback(
    async (kind: "want" | "like") => {
      try {
        const url = `/api/me/bookmarks?kind=${kind}&client_id=${encodeURIComponent(clientId)}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { rows: BookmarkRow[] };
        if (kind === "want") setWant(body.rows ?? []);
        else setLike(body.rows ?? []);
      } catch (e) {
        if (kind === "want") setWant([]);
        else setLike([]);
        setError(
          `ブックマークの取得に失敗しました: ${(e as Error).message}`,
        );
      }
    },
    [clientId],
  );

  const loadCheckins = useCallback(async () => {
    try {
      const url = `/api/me/checkins?client_id=${encodeURIComponent(clientId)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { rows: CheckinRow[] };
      setCheckins(body.rows ?? []);
    } catch (e) {
      setCheckins([]);
      setError(`参拝履歴の取得に失敗しました: ${(e as Error).message}`);
    }
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    if (tab === "want" && want === null) void loadBookmarks("want");
    if (tab === "like" && like === null) void loadBookmarks("like");
    if (tab === "checkins" && checkins === null) void loadCheckins();
  }, [tab, clientId, want, like, checkins, loadBookmarks, loadCheckins]);

  const loggedIn = Boolean(user?.email);
  const displayName = user?.name || user?.email || null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:py-8">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl" style={{ color: "#fff7e6" }}>マイページ</h1>
          <p className="mt-1 text-xs" style={{ color: "rgba(220,202,168,0.6)" }}>
            閲覧履歴・行きたい・いいね・参拝記録をまとめて確認できます。
          </p>
          {loggedIn ? (
            <p className="mt-1 text-[12px]" style={{ color: "#6ee7a0" }}>
              ✓ <b>{displayName}</b> でサインイン中
              <span className="ml-2 text-[10px]" style={{ color: "rgba(220,202,168,0.45)" }}>
                （端末をまたいでデータが同期されます）
              </span>
            </p>
          ) : (
            <p className="mt-1 text-[12px]" style={{ color: "rgba(220,202,168,0.65)" }}>
              端末紐付けの匿名アカウントで表示中。
              <Link
                href="/signin?callbackUrl=/me"
                className="ml-1 underline"
                style={{ color: "#e07070" }}
              >
                Google でサインインする
              </Link>
              とデータを引き継げます。
            </p>
          )}
          {clientId && !loggedIn ? (
            <p className="mt-1 text-[10px] font-mono" style={{ color: "rgba(220,202,168,0.35)" }}>
              client_id: {clientId.slice(0, 14)}…
            </p>
          ) : null}
        </div>
      </header>

      {/* 守護タイプバッジ */}
      {profile ? (
        <div className="mb-5 flex items-center gap-3 rounded-xl px-4 py-3" style={{ border: "1px solid rgba(139,30,39,0.35)", background: "rgba(139,30,39,0.1)" }}>
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold text-white shadow ${ELEMENT_STYLE[profile.element]?.bg ?? "bg-sumi/40"}`}>
            {profile.zodiac || profile.element}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] tracking-[0.2em] font-semibold" style={{ color: "#e07070" }}>守護属性</p>
            <p className="text-sm font-semibold" style={{ color: "#fff7e6" }}>{profile.element}属性</p>
          </div>
          <Link href="/diagnose" className="shrink-0 text-xs underline hover:no-underline" style={{ color: "#e07070" }}>
            再診断 →
          </Link>
        </div>
      ) : (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ border: "1px dashed rgba(201,155,77,0.3)", background: "rgba(28,17,8,0.5)" }}>
          <p className="text-xs" style={{ color: "rgba(220,202,168,0.58)" }}>守護神社診断をするとあなたの属性・タイプが表示されます</p>
          <Link href="/diagnose" className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, #9b2029, #7a1520)" }}>
            診断する →
          </Link>
        </div>
      )}

      {/* タブ */}
      <nav className="mb-4 flex flex-wrap gap-1" style={{ borderBottom: "1px solid rgba(201,155,77,0.2)" }}>
        {(
          [
            { key: "recent", label: "閲覧履歴", icon: "🕘" },
            { key: "want", label: "行きたい", icon: "📌" },
            { key: "like", label: "いいね", icon: "❤" },
            { key: "checkins", label: "参拝履歴", icon: "⛩" },
            { key: "omikuji", label: "おみくじ", icon: "📜" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1 border-b-2 px-3 py-2 text-sm transition"
            style={tab === t.key
              ? { borderColor: "#9b2029", background: "rgba(139,30,39,0.08)", fontWeight: 600, color: "#e07070" }
              : { borderColor: "transparent", color: "rgba(220,202,168,0.6)" }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {error ? (
        <div className="mb-3 rounded-md px-3 py-2 text-xs" style={{ border: "1px solid rgba(139,30,39,0.4)", background: "rgba(139,30,39,0.1)", color: "rgba(220,202,168,0.78)" }}>
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

      {tab === "want" ? (
        want === null ? (
          <LoadingState />
        ) : want.length === 0 ? (
          <EmptyState text="行きたい神社はまだありません。神社ページや地図の詳細パネルで「📍 行きたい」をタップして保存できます。" />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {want.map((b) => (
              <li key={b.id}>
                <ShrineCard
                  href={`/shrines/${spotSlug({ id: b.id, slug: b.slug })}`}
                  name={b.name}
                  meta={[b.prefecture, b.shrine_type].filter(Boolean).join(" / ")}
                  photoUrl={b.photo_url}
                  subtle={`保存: ${formatRelative(b.bookmarked_at)}`}
                />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "like" ? (
        like === null ? (
          <LoadingState />
        ) : like.length === 0 ? (
          <EmptyState text="いいねした神社はまだありません。気になった神社に「♡ いいね」をタップして記録できます。" />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {like.map((b) => (
              <li key={b.id}>
                <ShrineCard
                  href={`/shrines/${spotSlug({ id: b.id, slug: b.slug })}`}
                  name={b.name}
                  meta={[b.prefecture, b.shrine_type].filter(Boolean).join(" / ")}
                  photoUrl={b.photo_url}
                  subtle={`❤ ${formatRelative(b.bookmarked_at)}`}
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
            {checkins.map((c) => (
              <li
                key={c.id}
                className="flex items-start justify-between gap-3 rounded-md p-3 text-sm"
                style={{ border: "1px solid rgba(201,155,77,0.2)", background: "linear-gradient(145deg, #1e1108, #170d06)" }}
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/shrines/${spotSlug({ id: c.spot_id, slug: c.slug })}`}
                    className="font-semibold hover:underline"
                    style={{ color: "#fff7e6" }}
                  >
                    {c.spot_name || `神社 #${c.spot_id}`}
                  </Link>
                  {c.prefecture ? (
                    <span className="ml-2 text-[11px]" style={{ color: "rgba(220,202,168,0.55)" }}>{c.prefecture}</span>
                  ) : null}
                  {c.comment ? (
                    <p className="mt-1 whitespace-pre-wrap text-[12px]" style={{ color: "rgba(220,202,168,0.78)" }}>
                      {c.comment}
                    </p>
                  ) : null}
                  {c.wish_type ? (
                    <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px]" style={{ border: "1px solid rgba(201,155,77,0.3)", background: "rgba(139,30,39,0.18)", color: "#C99B4D" }}>
                      {wishLabel(c.wish_type)}
                    </span>
                  ) : null}
                </div>
                <span className="shrink-0 text-[11px]" style={{ color: "rgba(220,202,168,0.45)" }}>
                  {formatRelative(c.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "omikuji" ? (
        omikujiHistory.length === 0 ? (
          <div className="rounded-md p-6 text-center" style={{ border: "1px dashed rgba(201,155,77,0.3)", background: "rgba(28,17,8,0.5)" }}>
            <p className="mb-3 text-sm" style={{ color: "rgba(220,202,168,0.65)" }}>まだおみくじの記録がありません。</p>
            <Link
              href="/omikuji"
              className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #b8861a, #9a6e10)" }}
            >
              📜 今日のおみくじを引く
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: "rgba(220,202,168,0.45)" }}>過去 {omikujiHistory.length} 件の記録</p>
              <Link href="/omikuji" className="text-xs underline hover:no-underline" style={{ color: "#e07070" }}>今日のおみくじ →</Link>
            </div>
            <ul className="space-y-2">
              {omikujiHistory.map((r) => {
                const meta = FORTUNE_META[r.fortune] ?? { emoji: "📜", colorClass: "text-slate-400" };
                return (
                  <li key={r.date} className="flex items-center gap-3 rounded-md px-4 py-3" style={{ border: "1px solid rgba(201,155,77,0.2)", background: "linear-gradient(145deg, #1e1108, #170d06)" }}>
                    <span className="text-2xl">{meta.emoji}</span>
                    <div className="flex-1">
                      <p className={`text-lg font-bold font-serif ${meta.colorClass}`}>{r.fortune}</p>
                      <p className="text-[11px]" style={{ color: "rgba(220,202,168,0.45)" }}>{r.date}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )
      ) : null}

      <aside className="mt-10 rounded-md p-4 text-xs" style={{ border: "1px dashed rgba(201,155,77,0.25)", background: "rgba(28,17,8,0.5)", color: "rgba(220,202,168,0.6)" }}>
        <p>
          ※ 現在はブックマーク・参拝は端末（またはサインインしたアカウント）単位で保存されます。
          別端末で同じ Google アカウントにサインインすると、行きたい・いいねは同期されます。
        </p>
      </aside>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md p-6 text-center text-sm" style={{ border: "1px dashed rgba(201,155,77,0.3)", background: "rgba(28,17,8,0.5)", color: "rgba(220,202,168,0.62)" }}>
      {text}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center rounded-md p-8 text-xs" style={{ border: "1px solid rgba(201,155,77,0.2)", background: "rgba(28,17,8,0.5)", color: "rgba(220,202,168,0.55)" }}>
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
      className="shrine-card flex h-full flex-col overflow-hidden rounded-md transition"
      style={{ border: "1px solid rgba(201,155,77,0.2)", background: "linear-gradient(145deg, #1e1108, #170d06)", textDecoration: "none" }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} loading="lazy" className="h-28 w-full object-cover" />
      ) : (
        <div className="flex h-16 w-full items-center justify-center text-[10px]" style={{ background: "#241309", color: "rgba(220,202,168,0.35)" }}>
          ⛩ 写真なし
        </div>
      )}
      <div className="flex-1 p-3">
        <p className="line-clamp-1 text-sm font-semibold" style={{ color: "#fff7e6" }}>{name}</p>
        {meta ? (
          <p className="mt-0.5 line-clamp-1 text-[11px]" style={{ color: "rgba(220,202,168,0.58)" }}>{meta}</p>
        ) : null}
        {subtle ? (
          <p className="mt-1 text-[10px]" style={{ color: "rgba(220,202,168,0.38)" }}>{subtle}</p>
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
