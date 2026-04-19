"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function MergeDecisionButtons({ mergeId }: { mergeId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<null | string>(null);
  const [err, setErr] = useState<string | null>(null);

  const decide = (decision: "approve" | "reject") => {
    setErr(null);
    startTransition(async () => {
      try {
        const r = await api.decidePendingMerge(mergeId, decision);
        setDone(r.status);
        router.refresh();
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  };

  if (done) {
    return <div className="mt-2 text-xs text-moss">決定済み: {done}</div>;
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        onClick={() => decide("approve")}
        disabled={pending}
        className="rounded-md bg-moss px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        承認してマージ
      </button>
      <button
        onClick={() => decide("reject")}
        disabled={pending}
        className="rounded-md border border-border bg-white px-3 py-1 text-xs font-medium hover:bg-washi disabled:opacity-50"
      >
        却下（別の神社）
      </button>
      {err ? <span className="text-xs text-vermilion">{err}</span> : null}
    </div>
  );
}
