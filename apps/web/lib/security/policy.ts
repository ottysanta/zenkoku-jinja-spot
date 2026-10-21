/** Pure authorization policy. Never accepts roles or identity from request bodies. */
export type Principal = {
  user?: { email?: string | null };
  userId?: number;
  providerKey?: string;
  role?: string;
};

export function isAuthenticated(session: Principal | null | undefined): session is Principal {
  return !!session && !!(session.userId || session.providerKey || session.user?.email);
}

export function isAdmin(session: Principal | null | undefined): boolean {
  return isAuthenticated(session) && session.role === "admin";
}

export function checkOrigin(req: Request): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return true;
  if (req.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true; // Non-browser clients still require a valid server session.
  try { return new URL(origin).origin === new URL(req.url).origin; }
  catch { return false; }
}

export async function guardRequest(
  req: Request,
  loadSession: () => Promise<Principal | null>,
  adminOnly = true,
): Promise<{ session: Principal; reviewer: string } | { response: Response }> {
  if (!checkOrigin(req)) return { response: Response.json({ error: "forbidden" }, { status: 403 }) };
  let session: Principal | null;
  try { session = await loadSession(); }
  catch { return { response: Response.json({ error: "authentication unavailable" }, { status: 503 }) }; }
  if (!isAuthenticated(session)) return { response: Response.json({ error: "authentication required" }, { status: 401 }) };
  if (adminOnly && !isAdmin(session)) return { response: Response.json({ error: "forbidden" }, { status: 403 }) };
  return { session, reviewer: session.user?.email || session.providerKey || `user:${session.userId}` };
}
