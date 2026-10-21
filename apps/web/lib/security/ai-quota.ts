import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { randomUUID } from "node:crypto";

/** A single durable SQLite store, shared by ALL app workers on one host.
 * Never use per-instance /tmp storage in a serverless or multi-host deployment.
 */
export function reserveAiRequest(dbPath: string, owner: string, now = Date.now()) {
  if (!path.isAbsolute(dbPath)) throw new Error("Absolute durable quota database path required");
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA busy_timeout=5000");
  db.exec(`CREATE TABLE IF NOT EXISTS ai_usage (day TEXT, owner TEXT, count INTEGER NOT NULL, PRIMARY KEY(day, owner));
    CREATE TABLE IF NOT EXISTS ai_leases (id TEXT PRIMARY KEY, owner TEXT NOT NULL, expires INTEGER NOT NULL);`);
  const day = new Date(now).toISOString().slice(0, 10);
  const id = randomUUID();
  try {
    db.exec("BEGIN IMMEDIATE");
    db.prepare("DELETE FROM ai_leases WHERE expires <= ?").run(now);
    const total = db.prepare("SELECT COALESCE(SUM(count),0) AS n FROM ai_usage WHERE day=?").get(day) as { n: number };
    const mine = db.prepare("SELECT count AS n FROM ai_usage WHERE day=? AND owner=?").get(day, owner) as { n: number } | undefined;
    const active = db.prepare("SELECT COUNT(*) AS n FROM ai_leases").get() as { n: number };
    const myActive = db.prepare("SELECT COUNT(*) AS n FROM ai_leases WHERE owner=?").get(owner) as { n: number };
    // Conservative hard limits, not browser-controlled; failures still consume a request.
    if (total.n >= 100 || (mine?.n ?? 0) >= 3 || active.n >= 3 || myActive.n >= 1) {
      db.exec("ROLLBACK");
      return null;
    }
    db.prepare("INSERT INTO ai_usage VALUES (?,?,1) ON CONFLICT(day,owner) DO UPDATE SET count=count+1").run(day, owner);
    db.prepare("INSERT INTO ai_leases VALUES (?,?,?)").run(id, owner, now + 5 * 60_000);
    db.exec("COMMIT");
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch {}
    throw error;
  } finally { db.close(); }
  return () => {
    const cleanup = new DatabaseSync(dbPath);
    try { cleanup.exec("PRAGMA busy_timeout=5000"); cleanup.prepare("DELETE FROM ai_leases WHERE id=?").run(id); }
    finally { cleanup.close(); }
  };
}
