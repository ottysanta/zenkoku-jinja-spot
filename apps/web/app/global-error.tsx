"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: "sans-serif", padding: "2rem", background: "#fdf9f0" }}>
        <h1 style={{ color: "#c0392b" }}>サーバーエラーが発生しました</h1>
        <p>Digest: <code>{error.digest}</code></p>
        <p>Message: <code>{error.message}</code></p>
        <button onClick={reset} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
          再試行
        </button>
      </body>
    </html>
  );
}
