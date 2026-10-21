import { auth } from "@/auth";
import { guardRequest } from "./policy";

export function requireAdmin(req: Request) {
  return guardRequest(req, auth);
}

/** Preserve the existing submission-review roles and server-configured email allowlist. */
export async function requireSubmissionReviewer(req: Request) {
  const guard = await guardRequest(req, auth, false);
  if ("response" in guard) return guard;
  const email = guard.session.user?.email?.trim().toLowerCase();
  const allowed = (process.env.ADMIN_EMAILS ?? "").split(",").map(v => v.trim().toLowerCase()).filter(Boolean);
  if (guard.session.role === "admin" || guard.session.role === "moderator" || (email && allowed.includes(email))) return guard;
  return { response: Response.json({ error: "forbidden" }, { status: 403 }) };
}
