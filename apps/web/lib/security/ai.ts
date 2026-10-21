import { auth } from "@/auth";
import { guardRequest } from "./policy";
import { reserveAiRequest } from "./ai-quota";

export async function requireAiRequest(req: Request) {
  const guard = await guardRequest(req, auth, false);
  if ("response" in guard) return guard;
  const dbPath = process.env.AI_USAGE_DB_PATH;
  // Enabling paid processing is an explicit deployment decision. Ephemeral stores fail closed.
  if (process.env.AI_FEATURES_ENABLED !== "true" || !dbPath ||
      process.env.AI_USAGE_STORAGE_MODE !== "single-host-durable" ||
      process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ||
      !process.env.OPENAI_API_KEY) {
    return { response: Response.json({ error: "AI service temporarily unavailable" }, { status: 503 }) };
  }
  const length = Number(req.headers.get("content-length"));
  const limit = req.url.includes("/palm") ? 11 * 1024 * 1024 : 4096;
  if (!Number.isSafeInteger(length) || length <= 0 || length > limit) {
    return { response: Response.json({ error: "invalid request size" }, { status: 413 }) };
  }
  const owner = guard.session.userId ? `user:${guard.session.userId}` :
    guard.session.providerKey || `email:${guard.session.user!.email!.toLowerCase()}`;
  try {
    const release = reserveAiRequest(dbPath, owner);
    if (!release) return { response: Response.json({ error: "AI usage limit reached" }, { status: 429, headers: { "Retry-After": "300" } }) };
    return { release };
  } catch {
    return { response: Response.json({ error: "AI usage protection unavailable" }, { status: 503 }) };
  }
}
