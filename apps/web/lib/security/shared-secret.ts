import { timingSafeEqual } from "node:crypto";

/** Missing configuration must never disable authentication. */
export function matchesSecret(actual: unknown, expected: string | undefined): boolean {
  if (!expected || typeof actual !== "string" || !actual) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
