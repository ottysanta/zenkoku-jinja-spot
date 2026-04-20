import { NextResponse, type NextRequest } from "next/server";
import { approveSubmission, rejectSubmission } from "@/lib/shrine-db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/submissions/[id]
 *
 * body: { action: "approve" | "reject" | "need_info", review_note?: string }
 *
 * 認可:
 *   - session.role が admin/moderator (FastAPI 由来) か
 *   - ADMIN_EMAILS env に email が含まれていること
 *   どちらかを満たす必要あり。
 */
type Body = { action?: "approve" | "reject" | "need_info"; review_note?: string };

async function isAdmin(): Promise<{ ok: true; reviewer: string } | { ok: false }> {
  const session = await auth().catch(() => null);
  if (!session) return { ok: false };
  const email = session.user?.email?.toLowerCase() ?? null;
  const role = session.role;
  if (role === "admin" || role === "moderator") {
    return { ok: true, reviewer: email ?? `role:${role}` };
  }
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (email && adminEmails.includes(email)) {
    return { ok: true, reviewer: email };
  }
  return { ok: false };
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await isAdmin();
  if (!guard.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

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
