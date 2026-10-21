import { NextResponse, type NextRequest } from "next/server";
import { approveSubmission, rejectSubmission } from "@/lib/shrine-db";
import { requireSubmissionReviewer } from "@/lib/security/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/submissions/[id]
 *
 * body: { action: "approve" | "reject" | "need_info", review_note?: string }
 *
 * 認可:
 *   - 認証済み admin / moderator または既存 ADMIN_EMAILS の担当者であること。
 */
type Body = { action?: "approve" | "reject" | "need_info"; review_note?: string };

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireSubmissionReviewer(req);
  if ("response" in guard) return guard.response;

  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const note = (body.review_note ?? "").trim() || null;

  if (body.action === "approve") {
    const r = approveSubmission(id, guard.reviewer, note);
    if (!r.ok) {
      return NextResponse.json({ error: r.reason ?? "approve failed" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, spot_id: r.spot_id });
  }
  if (body.action === "reject" || body.action === "need_info") {
    if (!note) {
      return NextResponse.json(
        { error: "review_note は必須です" },
        { status: 400 },
      );
    }
    const nextStatus = body.action === "need_info" ? "needs_more_info" : "rejected";
    const r = rejectSubmission(id, guard.reviewer, note, nextStatus);
    if (!r.ok) {
      return NextResponse.json({ error: r.reason ?? "reject failed" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
