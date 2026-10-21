/** Bound the actual stream, not a caller-controlled Content-Length header. */
export async function readLimitedBody(req: Request, maxBytes: number): Promise<Response> {
  if (!req.body) throw new Error("Missing body");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new Error("Body too large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new Response(bytes, { headers: { "content-type": req.headers.get("content-type") || "application/octet-stream" } });
}
