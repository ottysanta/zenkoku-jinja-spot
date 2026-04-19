/**
 * /search のローディング状態。
 * Next.js App Router: ページが解決される間、この loading.tsx が自動表示される。
 * これにより「タップ → すぐスピナー → 数秒後に結果」となりユーザーが「押せてない?」と誤解しない。
 */
export default function SearchLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <span
          className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-vermilion/30 border-t-vermilion"
          role="status"
          aria-label="読み込み中"
        />
        <p className="text-sm text-sumi/70">神社を検索しています...</p>
        <p className="text-xs text-sumi/40">大きなデータを扱っているため最初の 1 回は数秒かかります</p>
      </div>
    </main>
  );
}
