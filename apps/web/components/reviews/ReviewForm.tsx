import { auth, signIn } from "@/auth";
import { submitReview } from "./actions";

const CATEGORIES = [
  { key: "score_overall", label: "総合" },
  { key: "score_atmosphere", label: "雰囲気" },
  { key: "score_manners", label: "参拝マナー" },
  { key: "score_access", label: "アクセス" },
  { key: "score_facilities", label: "設備" },
] as const;

/**
 * レビュー投稿フォーム。サーバーコンポーネントで session を確認し、
 * 未ログインならサインイン導線を出す。
 */
export default async function ReviewForm({ spotId }: { spotId: number }) {
  const session = await auth();

  if (!session?.apiToken) {
    return (
      <div className="mt-4 rounded-md border border-border bg-kinari/50 p-4 text-sm">
        <p className="mb-2">レビューの投稿にはサインインが必要です。</p>
        <form
          action={async () => {
            "use server";
            await signIn(undefined, { redirectTo: `/shrines` });
          }}
        >
          <button
            type="submit"
            className="rounded-md border border-border bg-washi px-3 py-1.5 text-xs hover:bg-white"
          >
            サインインする
          </button>
        </form>
      </div>
    );
  }

  return (
    <form
      action={submitReview.bind(null, spotId)}
      className="mt-4 space-y-3 rounded-md border border-border bg-washi p-4 text-sm"
    >
      <p className="text-xs text-sumi/70">
        1 神社あたり 1 件まで。再投稿すると上書きされます。
      </p>
      {CATEGORIES.map((c) => (
        <label key={c.key} className="flex items-center gap-3">
          <span className="w-24 text-xs text-sumi/70">{c.label}</span>
          <select
            name={c.key}
            defaultValue=""
            className="rounded border border-border bg-white px-2 py-1 text-xs"
          >
            <option value="">—</option>
            {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5].map((v) => (
              <option key={v} value={v}>{v.toFixed(1)}</option>
            ))}
          </select>
        </label>
      ))}
      <textarea
        name="body"
        rows={4}
        maxLength={1000}
        placeholder="参拝したときに感じたこと（任意・1000字まで）"
        className="w-full rounded border border-border bg-white px-2 py-1 text-sm"
      />
      <input
        type="date"
        name="visited_at"
        className="rounded border border-border bg-white px-2 py-1 text-xs"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          className="rounded-md border border-vermilion bg-vermilion px-4 py-1.5 text-xs font-medium text-white hover:bg-vermilion-deep"
        >
          レビューを投稿
        </button>
      </div>
    </form>
  );
}
