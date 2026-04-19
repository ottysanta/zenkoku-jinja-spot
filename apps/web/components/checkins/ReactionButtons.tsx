"use client";
/**
 * 参拝コメント（チェックイン）に対する「いいね」「参考になった」ボタン。
 * - 匿名 client_id ベース。同 client から同種の重複はサーバー側で弾く
 * - 楽観的 UI で即時反映、失敗時にロールバック
 */
import { useCallback, useEffect, useState } from "react";
import { getClientId } from "@/lib/client-id";

type Counts = { like: number; helpful: number };

type Props = {
  checkinId: number;
  initialCounts?: Partial<Counts>;
  compact?: boolean;
};

const STORAGE_PREFIX = "ssp_reacted_";

function loadReacted(checkinId: number): Record<"like" | "helpful", boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + checkinId) ?? "{}";
    const obj = JSON.parse(raw);
    return { like: !!obj.like, helpful: !!obj.helpful };
  } catch {
    return { like: false, helpful: false };
  }
}

function saveReacted(checkinId: number, state: Record<"like" | "helpful", boolean>) {
  try {
    localStorage.setItem(STORAGE_PREFIX + checkinId, JSON.stringify(state));
  } catch {}
}

export default function ReactionButtons({ checkinId, initialCounts, compact }: Props) {
  const [counts, setCounts] = useState<Counts>({
    like: initialCounts?.like ?? 0,
    helpful: initialCounts?.helpful ?? 0,
  });
  const [reacted, setReacted] = useState<Record<"like" | "helpful", boolean>>({
    like: false,
    helpful: false,
  });

  useEffect(() => {
    setReacted(loadReacted(checkinId));
    // 最新カウントも取得
    fetch("/api/checkin-reactions?checkin_id=" + checkinId)
      .then((r) => r.json())
      .then((j) => setCounts({ like: j.like ?? 0, helpful: j.helpful ?? 0 }))
      .catch(() => {});
  }, [checkinId]);

  const toggle = useCallback(
    async (r: "like" | "helpful") => {
      const clientId = getClientId();
      const active = reacted[r];
      // 楽観的
      const nextReacted = { ...reacted, [r]: !active };
      const nextCounts = {
        ...counts,
        [r]: Math.max(0, counts[r] + (active ? -1 : 1)),
      };
      setReacted(nextReacted);
      setCounts(nextCounts);
      saveReacted(checkinId, nextReacted);
      try {
        const resp = await fetch("/api/checkin-reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkin_id: checkinId,
            client_id: clientId,
            reaction: r,
            remove: active ? true : false,
          }),
        });
        if (!resp.ok) throw new Error("req failed");
        const j = (await resp.json()) as Partial<Counts>;
        setCounts({ like: j.like ?? nextCounts.like, helpful: j.helpful ?? nextCounts.helpful });
      } catch {
        // ロールバック
        setReacted(reacted);
        setCounts(counts);
        saveReacted(checkinId, reacted);
      }
    },
    [checkinId, counts, reacted],
  );

  return (
    <div className={"flex items-center gap-1 " + (compact ? "" : "mt-1")}>
      <button
        type="button"
        onClick={() => toggle("like")}
        aria-pressed={reacted.like}
        className={
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition " +
          (reacted.like
            ? "border-vermilion bg-vermilion text-white"
            : "border-border bg-white text-sumi/80 hover:bg-kinari")
        }
      >
        <span>❤︎</span>
        <span>いいね</span>
        <span className="tabular-nums opacity-70">{counts.like}</span>
      </button>
      <button
        type="button"
        onClick={() => toggle("helpful")}
        aria-pressed={reacted.helpful}
        className={
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition " +
          (reacted.helpful
            ? "border-moss bg-moss text-white"
            : "border-border bg-white text-sumi/80 hover:bg-kinari")
        }
      >
        <span>💡</span>
        <span>参考になった</span>
        <span className="tabular-nums opacity-70">{counts.helpful}</span>
      </button>
    </div>
  );
}
