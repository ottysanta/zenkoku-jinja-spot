/**
 * ルート全体のローディング画面。
 * Next.js App Router: 各ページが server で解決される間、この loading.tsx が自動表示される。
 * これによりユーザーは「今ロード中」という視覚的フィードバックを得られる。
 */
export default function RootLoading() {
  return (
    <main className="flex min-h-[calc(100dvh-2.5rem)] flex-col items-center justify-center bg-washi px-6 py-10 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* 鳥居のアウトライン (パルスアニメーション) */}
        <svg
          viewBox="0 0 64 64"
          className="absolute inset-0 h-24 w-24 animate-pulse"
          aria-hidden="true"
        >
          <g fill="#C9302C">
            <path d="M6 14 L58 14 L54 10 L10 10 Z" />
            <rect x="10" y="16" width="44" height="4" />
            <rect x="14" y="26" width="36" height="3.5" />
            <path d="M17 20 L17 54 L15 58 L22 58 L22 20 Z" />
            <path d="M47 20 L47 54 L49 58 L42 58 L42 20 Z" />
          </g>
        </svg>
        {/* 回転スピナー */}
        <span
          className="relative inline-block h-12 w-12 animate-spin rounded-full border-[3px] border-vermilion/20 border-t-vermilion-deep"
          role="status"
          aria-label="読み込み中"
        />
      </div>
      <h2 className="mt-6 font-serif text-lg font-semibold text-sumi">
        NOW LOADING...
      </h2>
      <p className="mt-2 text-sm text-sumi/70">神社データを読み込んでいます</p>
      <p className="mt-1 text-xs text-sumi/50">
        全国 46,000 社のデータを扱っているため、初回は少し時間がかかります
      </p>
      <div className="mt-6 w-48 overflow-hidden rounded-full bg-washi/60">
        {/* 疑似プログレスバー (アニメーション) */}
        <div
          className="h-1 w-1/3 animate-[progress_1.5s_ease-in-out_infinite] rounded-full bg-vermilion"
          style={{
            animation: "progress 1.5s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </main>
  );
}
