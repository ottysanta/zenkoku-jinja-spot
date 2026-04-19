import { api, type Review, type ReviewAggregate, ApiError } from "@/lib/api";
import ReviewForm from "./ReviewForm";

const LABELS: Record<string, string> = {
  atmosphere: "雰囲気",
  manners: "参拝マナー",
  access: "アクセス",
  facilities: "設備",
  overall: "総合",
};

function Stars({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-sumi/40">—</span>;
  const rounded = Math.round(value * 2) / 2;
  const full = Math.floor(rounded);
  const half = rounded - full === 0.5;
  return (
    <span className="text-gold" aria-label={`${value.toFixed(1)} / 5`}>
      {"★".repeat(full)}
      {half ? "☆" : ""}
      <span className="ml-1 text-xs text-sumi/60">{value.toFixed(1)}</span>
    </span>
  );
}

export default async function ReviewList({
  spotId,
}: {
  spotId: number;
}) {
  let reviews: Review[] = [];
  let agg: ReviewAggregate | null = null;
  try {
    [reviews, agg] = await Promise.all([
      api.listReviews(spotId, 20),
      api.reviewAggregate(spotId),
    ]);
  } catch (e) {
    // FastAPI ダウン時など（fetch failed / ApiError）も詳細ページを壊さない
    if (!(e instanceof ApiError) && !(e instanceof TypeError)) {
      // それ以外は静かに握りつぶす（詳細ページは基本情報のみで表示継続）
    }
  }

  return (
    <section className="mt-10 border-t border-border pt-6">
      <h2 className="mb-3 font-serif text-xl">参拝者のレビュー</h2>

      {agg && agg.count > 0 ? (
        <div className="mb-4 rounded-md border border-border bg-washi p-3 text-sm">
          <p className="mb-2 text-sumi/70">
            {agg.count} 件のレビュー
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs md:grid-cols-5">
            <div><span className="text-sumi/60">{LABELS.overall}:</span> <Stars value={agg.avg_overall} /></div>
            <div><span className="text-sumi/60">{LABELS.atmosphere}:</span> <Stars value={agg.avg_atmosphere} /></div>
            <div><span className="text-sumi/60">{LABELS.manners}:</span> <Stars value={agg.avg_manners} /></div>
            <div><span className="text-sumi/60">{LABELS.access}:</span> <Stars value={agg.avg_access} /></div>
            <div><span className="text-sumi/60">{LABELS.facilities}:</span> <Stars value={agg.avg_facilities} /></div>
          </div>
        </div>
      ) : null}

      <ReviewForm spotId={spotId} />

      {reviews.length === 0 ? (
        <p className="mt-6 text-sm text-sumi/60">まだレビューはありません。</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-md border border-border bg-white p-4">
              <div className="mb-1 flex items-center justify-between text-xs text-sumi/60">
                <span className="font-medium text-sumi">
                  {r.author_name || `ユーザー#${r.user_id}`}
                </span>
                <time dateTime={r.created_at}>
                  {new Date(r.created_at).toLocaleDateString("ja-JP")}
                </time>
              </div>
              <div className="mb-2 text-sm">
                <Stars value={r.score_overall ?? null} />
              </div>
              {r.body ? (
                <p className="whitespace-pre-wrap text-sm leading-6">{r.body}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
