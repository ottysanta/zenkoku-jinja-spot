"use client";
/**
 * 神社詳細 / SpotDetailPanel に差し込む「行きたい / いいね」トグル。
 *
 * - Google ログインしている場合は認証セッションの providerKey を owner_key とする
 * - 未ログイン時は端末の client_id を owner_key とし、ログイン後も同じデータが
 *   移行できる想定（移行バッチは将来対応）。
 * - API: /api/bookmarks (GET で状態 + カウント, POST で追加/削除)
 */
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { getClientId } from "@/lib/client-id";

type State = {
  want: boolean;
  like: boolean;
  counts: { want: number; like: number };
};

export default function BookmarkButtons({
  spotId,
  compact,
}: {
  spotId: number;
  compact?: boolean;
}) {
  const [state, setState] = useState<State | null>(null);
  const [pending, startTransition] = useTransition();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    let alive = true;
    const clientId = getClientId();
    fetch(`/api/bookmarks?spot_id=${spotId}&client_id=${encodeURIComponent(clientId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: State | null) => {
        if (alive && data) setState(data);
      })
      .catch(() => {});
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => { if (alive) setLoggedIn(Boolean(d?.user?.email)); })
      .catch(() => { if (alive) setLoggedIn(false); });
    return () => { alive = false; };
  }, [spotId]);

  function toggle(kind: "want" | "like") {
    if (!state) return;
    const isActive = state[kind];
    if (!isActive && loggedIn === false) setShowNudge(true);
    // optimistic
    setState((prev) =>
      prev
        ? {
            ...prev,
            [kind]: !isActive,
            counts: {
              ...prev.counts,
              [kind]: Math.max(0, prev.counts[kind] + (isActive ? -1 : 1)),
            },
          }
        : prev,
    );
    startTransition(async () => {
      try {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            spot_id: spotId,
            kind,
            remove: isActive,
            client_id: getClientId(),
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as State;
          setState(data);
        }
      } catch {
        // 失敗時は次回 GET で正しい値に戻る
      }
    });
  }

  const btn = (active: boolean) =>
    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
    (active
      ? "border-vermilion-deep bg-vermilion-deep text-white hover:opacity-90 "
      : "border-shrine-gold/30 text-kinari/80 hover:border-shrine-gold/55 ") +
    (pending ? "opacity-70" : "");

  return (
    <div
      className={compact ? "flex items-center gap-2" : "my-3 flex flex-col gap-2"}
      role="group"
      aria-label="この神社の保存状態"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => toggle("want")}
          disabled={pending || !state}
          aria-pressed={state?.want ?? false}
          className={btn(state?.want ?? false)}
          title="行きたい（後で参拝したい）"
          style={!(state?.want) ? { background: "rgba(28,17,8,0.6)", borderColor: "rgba(201,155,77,0.3)" } : {}}
        >
          <span aria-hidden="true">{state?.want ? "📌" : "📍"}</span>
          <span>行きたい</span>
          {state ? (
            <span className="ml-0.5 text-[10px] opacity-80">{state.counts.want}</span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => toggle("like")}
          disabled={pending || !state}
          aria-pressed={state?.like ?? false}
          className={btn(state?.like ?? false)}
          title="いいね（気になった・保存）"
          style={!(state?.like) ? { background: "rgba(28,17,8,0.6)", borderColor: "rgba(201,155,77,0.3)" } : {}}
        >
          <span aria-hidden="true">{state?.like ? "❤" : "♡"}</span>
          <span>いいね</span>
          {state ? (
            <span className="ml-0.5 text-[10px] opacity-80">{state.counts.like}</span>
          ) : null}
        </button>
      </div>

      {/* ログイン誘導ナッジ（初回ブックマーク後・未ログイン時） */}
      {showNudge && (
        <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
          style={{ background: "rgba(201,155,77,0.08)", border: "1px solid rgba(201,155,77,0.3)" }}>
          <p className="text-[11px]" style={{ color: "rgba(220,202,168,0.75)" }}>
            📱 ログインするとどの端末でも確認できます
          </p>
          <Link
            href="/signin?callbackUrl=/me"
            className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition hover:opacity-90"
            style={{ background: "rgba(201,155,77,0.2)", border: "1px solid rgba(201,155,77,0.5)", color: "#C99B4D" }}
          >
            ログイン
          </Link>
        </div>
      )}
    </div>
  );
}
