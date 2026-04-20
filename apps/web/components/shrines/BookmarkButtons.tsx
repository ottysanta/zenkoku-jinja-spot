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

  useEffect(() => {
    let alive = true;
    const clientId = getClientId();
    fetch(`/api/bookmarks?spot_id=${spotId}&client_id=${encodeURIComponent(clientId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: State | null) => {
        if (alive && data) setState(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [spotId]);

  function toggle(kind: "want" | "like") {
    if (!state) return;
    const isActive = state[kind];
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
      : "border-border bg-white text-sumi hover:bg-kinari ") +
    (pending ? "opacity-70" : "");

  return (
    <div
      className={compact ? "flex items-center gap-2" : "my-3 flex flex-wrap items-center gap-2"}
      role="group"
      aria-label="この神社の保存状態"
    >
      <button
        type="button"
        onClick={() => toggle("want")}
        disabled={pending || !state}
        aria-pressed={state?.want ?? false}
        className={btn(state?.want ?? false)}
        title="行きたい（後で参拝したい）"
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
      >
        <span aria-hidden="true">{state?.like ? "❤" : "♡"}</span>
        <span>いいね</span>
        {state ? (
          <span className="ml-0.5 text-[10px] opacity-80">{state.counts.like}</span>
        ) : null}
      </button>
    </div>
  );
}
