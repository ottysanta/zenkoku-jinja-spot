"use client";

/**
 * 神社詳細ページ用の 3 状態トグル（行きたい / 保存 / 行った）。
 *
 * - 認証不要。`getClientId()` の匿名識別子をキーに `/me/bookmarks` へ POST / DELETE。
 * - マウント時に `getBookmarkStatusForSpot` で押下状態を取得し、
 *   クリックでオプティミスティックに反転（失敗時は revert）。
 * - 既存押下時は該当 bookmark を特定するため listMyBookmarks で id を逆引きする
 *   （status エンドポイントは bool だけで id を返さないため）。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Bookmark, type BookmarkStatus } from "@/lib/api";
import { getClientId } from "@/lib/client-id";

type Props = {
  spotId: number;
};

type ButtonDef = {
  key: BookmarkStatus;
  label: string;
  /** 未押下時の縁・文字色（tailwind クラス） */
  idle: string;
  /** 押下時（active）の背景・文字色 */
  active: string;
};

const BUTTONS: ReadonlyArray<ButtonDef> = [
  {
    key: "want",
    label: "行きたい",
    idle: "border-gold/60 text-gold hover:bg-gold/10",
    active: "border-gold bg-gold text-white",
  },
  {
    key: "saved",
    label: "保存",
    idle: "border-moss/60 text-moss hover:bg-moss/10",
    active: "border-moss bg-moss text-white",
  },
  {
    key: "visited",
    label: "行った",
    idle: "border-vermilion/60 text-vermilion hover:bg-vermilion/10",
    active: "border-vermilion bg-vermilion text-white",
  },
];

type State = {
  pressed: Record<BookmarkStatus, boolean>;
  // 押下中の bookmark id を保持（DELETE で使う）。未押下は undefined
  ids: Partial<Record<BookmarkStatus, number>>;
  loading: Record<BookmarkStatus, boolean>;
};

const initialState = (): State => ({
  pressed: { want: false, saved: false, visited: false },
  ids: {},
  loading: { want: false, saved: false, visited: false },
});

export default function BookmarkButtons({ spotId }: Props) {
  const [state, setState] = useState<State>(initialState);
  const [ready, setReady] = useState(false);
  const clientIdRef = useRef<string>("");

  useEffect(() => {
    clientIdRef.current = getClientId();
    const cid = clientIdRef.current;
    let cancelled = false;
    (async () => {
      try {
        const status = await api.getBookmarkStatusForSpot(cid, spotId);
        // 押下済みのものだけ、id の逆引きのため list を叩く
        const needIds = (["want", "saved", "visited"] as BookmarkStatus[]).filter(
          (k) => status[k],
        );
        const idMap: Partial<Record<BookmarkStatus, number>> = {};
        await Promise.all(
          needIds.map(async (s) => {
            try {
              const list = await api.listMyBookmarks({ client_id: cid, status: s });
              const hit = list.find((b: Bookmark) => b.spot_id === spotId);
              if (hit) idMap[s] = hit.id;
            } catch {
              /* 個別失敗は無視、トグルOFF操作は POST で再生成される */
            }
          }),
        );
        if (cancelled) return;
        setState({
          pressed: { want: status.want, saved: status.saved, visited: status.visited },
          ids: idMap,
          loading: { want: false, saved: false, visited: false },
        });
        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spotId]);

  const toggle = useCallback(
    async (key: BookmarkStatus) => {
      const cid = clientIdRef.current;
      if (!cid) return;
      const wasPressed = state.pressed[key];
      const prevId = state.ids[key];

      // Optimistic update
      setState((s) => ({
        pressed: { ...s.pressed, [key]: !wasPressed },
        ids: { ...s.ids, [key]: wasPressed ? undefined : s.ids[key] },
        loading: { ...s.loading, [key]: true },
      }));

      try {
        if (wasPressed) {
          if (prevId !== undefined) {
            await api.deleteBookmark(prevId, cid);
          }
          setState((s) => ({
            ...s,
            ids: { ...s.ids, [key]: undefined },
            loading: { ...s.loading, [key]: false },
          }));
        } else {
          const created = await api.createBookmark({
            client_id: cid,
            spot_id: spotId,
            status: key,
          });
          setState((s) => ({
            ...s,
            ids: { ...s.ids, [key]: created.id },
            loading: { ...s.loading, [key]: false },
          }));
        }
      } catch {
        // revert
        setState((s) => ({
          pressed: { ...s.pressed, [key]: wasPressed },
          ids: { ...s.ids, [key]: prevId },
          loading: { ...s.loading, [key]: false },
        }));
      }
    },
    [spotId, state],
  );

  return (
    <div
      className="my-4 inline-flex flex-wrap gap-2"
      role="group"
      aria-label="この神社の保存状態"
    >
      {BUTTONS.map((btn) => {
        const pressed = state.pressed[btn.key];
        const loading = state.loading[btn.key];
        const disabled = !ready || loading;
        return (
          <button
            key={btn.key}
            type="button"
            aria-pressed={pressed}
            disabled={disabled}
            onClick={() => toggle(btn.key)}
            className={[
              "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              pressed ? btn.active : `bg-washi ${btn.idle}`,
            ].join(" ")}
          >
            {btn.label}
          </button>
        );
      })}
    </div>
  );
}
