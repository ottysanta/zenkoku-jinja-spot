"use client";
/**
 * 単一の spot_submission 行を表示・承認/却下するカード。
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: number;
  name: string;
  name_kana?: string | null;
  address?: string | null;
  prefecture?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  deity?: string | null;
  shrine_type?: string | null;
  website?: string | null;
  photo_url?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_role?: string | null;
  evidence_url?: string | null;
  note?: string | null;
  submitted_by_email?: string | null;
  status: string;
  review_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_spot_id?: number | null;
  created_at: string;
};

export default function SubmissionReviewer({ row }: { row: Row }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState<string>(row.review_note ?? "");
  const done = row.status !== "pending" && row.status !== "needs_more_info";

  function act(kind: "approve" | "reject" | "need_info") {
    setErr(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/submissions/${row.id}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: kind, review_note: reviewNote }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setErr(body.error || `HTTP ${res.status}`);
          return;
        }
        router.refresh();
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] text-sumi/60">
            #{row.id} · {new Date(row.created_at).toLocaleString("ja-JP")} ·{" "}
            <StatusBadge status={row.status} />
          </p>
          <h3 className="mt-1 font-serif text-lg text-sumi">
            {row.name}
            {row.name_kana ? (
              <span className="ml-2 text-[11px] text-sumi/50">({row.name_kana})</span>
            ) : null}
          </h3>
          <p className="text-[12px] text-sumi/70">
            {[row.prefecture, row.city, row.address].filter(Boolean).join(" / ") || "住所未記入"}
          </p>
          {typeof row.lat === "number" && typeof row.lng === "number" ? (
            <p className="text-[11px] text-sumi/60">
              lat: {row.lat.toFixed(5)} / lng: {row.lng.toFixed(5)}{" "}
              <a
                href={`https://www.google.com/maps?q=${row.lat},${row.lng}`}
                target="_blank"
                rel="noreferrer"
                className="ml-2 text-vermilion-deep underline"
              >
                地図で確認
              </a>
            </p>
          ) : (
            <p className="text-[11px] text-amber-700">⚠ 緯度経度未記入 — 承認前に補記が必要</p>
          )}
        </div>
        {row.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.photo_url}
            alt={row.name}
            className="h-20 w-28 rounded object-cover"
            loading="lazy"
          />
        ) : null}
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-[12px] sm:grid-cols-2">
        {row.deity ? <Row2 label="御祭神" value={row.deity} /> : null}
        {row.shrine_type ? <Row2 label="形式" value={row.shrine_type} /> : null}
        {row.website ? <Row2 label="公式サイト" value={<ExtLink href={row.website} />} /> : null}
        {row.evidence_url ? <Row2 label="証憑" value={<ExtLink href={row.evidence_url} />} /> : null}
        <Row2
          label="連絡先"
          value={
            <>
              {row.contact_name} {row.contact_role ? `(${row.contact_role})` : null}
              <br />
              <span className="font-mono text-[11px] text-sumi/70">
                {row.contact_email}
                {row.contact_phone ? ` / ${row.contact_phone}` : ""}
              </span>
            </>
          }
        />
        {row.submitted_by_email ? (
          <Row2 label="ログイン" value={row.submitted_by_email} />
        ) : null}
      </dl>

      {row.note ? (
        <details className="mt-2 rounded border border-border bg-washi/50 p-2 text-[12px]">
          <summary className="cursor-pointer text-sumi/70">メッセージを表示</summary>
          <p className="mt-2 whitespace-pre-wrap text-sumi/90">{row.note}</p>
        </details>
      ) : null}

      {done ? (
        <div className="mt-3 rounded border border-dashed border-border bg-kinari/40 px-3 py-2 text-[12px] text-sumi/80">
          {row.reviewed_at ? new Date(row.reviewed_at).toLocaleString("ja-JP") : ""}
          {" · "}
          {row.reviewed_by ?? "reviewer"}
          {row.review_note ? (
            <p className="mt-1 whitespace-pre-wrap">{row.review_note}</p>
          ) : null}
          {row.created_spot_id ? (
            <p className="mt-1">
              spot #{row.created_spot_id} として掲載されました。
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="レビューコメント（却下・要追加情報の理由、申請者への返信）"
            rows={2}
            className="mt-3 w-full rounded border border-border bg-washi px-2 py-1.5 text-[12px]"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => act("approve")}
              disabled={pending}
              className="rounded bg-moss px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              承認して spots に追加
            </button>
            <button
              type="button"
              onClick={() => act("need_info")}
              disabled={pending}
              className="rounded border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
            >
              追加情報を要請
            </button>
            <button
              type="button"
              onClick={() => act("reject")}
              disabled={pending}
              className="rounded border border-border bg-white px-3 py-1 text-xs font-medium hover:bg-washi disabled:opacity-50"
            >
              却下
            </button>
            {err ? <span className="text-xs text-red-600">{err}</span> : null}
          </div>
        </>
      )}
    </div>
  );
}

function Row2({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-sumi/50">{label}</dt>
      <dd className="text-sumi">{value}</dd>
    </>
  );
}

function ExtLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="break-all text-vermilion-deep underline"
    >
      {href}
    </a>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    pending: { label: "承認待ち", cls: "bg-amber-100 text-amber-800" },
    needs_more_info: { label: "追加情報待ち", cls: "bg-sky-100 text-sky-800" },
    approved: { label: "承認済", cls: "bg-emerald-100 text-emerald-800" },
    rejected: { label: "却下", cls: "bg-rose-100 text-rose-800" },
  };
  const c = cfg[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${c.cls}`}>{c.label}</span>
  );
}
