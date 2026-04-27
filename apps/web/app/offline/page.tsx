export default function OfflinePage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-20 text-center">
      <div className="text-6xl mb-6">⛩</div>
      <h1 className="font-serif text-2xl text-sumi mb-3">オフラインです</h1>
      <p className="text-sumi/60 text-sm leading-relaxed mb-6">
        ネットワークに接続されていません。
        <br />
        前回の診断結果や閲覧した神社情報はそのままご覧いただけます。
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-full bg-vermilion px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-vermilion-deep"
      >
        再読み込みする
      </button>
    </main>
  );
}
