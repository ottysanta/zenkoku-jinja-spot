"use client";
/**
 * 神社横断検索のための共通 SearchBar。
 *
 * - 神社名 / 住所の自由入力に加え、ご利益プリセットチップを選択可能
 * - 入力中はデバウンス付きで top5 サジェストをフローティング表示
 * - サジェストクリック: /shrines/{slug} へ遷移
 * - Submit: /search?q=...&benefit=... へ遷移
 *
 * 色: vermilion / kinari / washi / sumi を使用（shrine color palette）
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api, spotSlug, type Spot } from "@/lib/api";
import { PREFECTURES } from "@/lib/prefectures";

/** マップ左上に置くコンパクト表示用のご利益プリセット */
const BENEFIT_PRESETS = [
  "縁結び",
  "商売繁盛",
  "合格祈願",
  "健康",
  "厄除け",
  "金運",
  "交通安全",
];

export type SearchBarProps = {
  /** 初期値（検索結果ページで URL を反映させたい時に使う） */
  defaultQuery?: string;
  defaultBenefit?: string;
  defaultDeity?: string;
  defaultPrefecture?: string;
  /** 表示サイズ: compact はマップ左上用の小型表示 */
  variant?: "default" | "compact";
  /** 追加 class */
  className?: string;
  /** 送信時に遷移するパス（既定: /search） */
  targetPath?: string;
};

export default function SearchBar({
  defaultQuery = "",
  defaultBenefit = "",
  defaultDeity = "",
  defaultPrefecture = "",
  variant = "default",
  className = "",
  targetPath = "/search",
}: SearchBarProps) {
  const router = useRouter();
  const t = useTranslations("search");
  const [query, setQuery] = useState(defaultQuery);
  const [benefit, setBenefit] = useState(defaultBenefit);
  const [deity, setDeity] = useState(defaultDeity);
  const [prefecture, setPrefecture] = useState(defaultPrefecture);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 型字中の top5 サジェスト（デバウンス 250ms）
  useEffect(() => {
    const term = query.trim();
    if (term.length < 1) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const rows = await api.searchShrines({ q: term, limit: 5 });
        if (!cancelled) setSuggestions(rows);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query]);

  // 外側クリックで閉じる
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const submit = useCallback(
    (overrides?: { q?: string; benefit?: string; deity?: string; prefecture?: string }) => {
      const q = overrides?.q ?? query;
      const b = overrides?.benefit ?? benefit;
      const d = overrides?.deity ?? deity;
      const p = overrides?.prefecture ?? prefecture;
      const qs = new URLSearchParams();
      if (q.trim()) qs.set("q", q.trim());
      if (b.trim()) qs.set("benefit", b.trim());
      if (d.trim()) qs.set("deity", d.trim());
      if (p.trim()) qs.set("prefecture", p.trim());
      router.push(`${targetPath}${qs.toString() ? `?${qs.toString()}` : ""}`);
      setOpen(false);
    },
    [query, benefit, deity, prefecture, router, targetPath],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      submit();
    },
    [submit],
  );

  const compact = variant === "compact";
  const widthClass = compact ? "w-full md:w-[280px]" : "w-full";

  const chipList = useMemo(
    () => (
      <div className="flex flex-wrap gap-1">
        {BENEFIT_PRESETS.map((b) => {
          const active = b === benefit;
          return (
            <button
              key={b}
              type="button"
              onClick={() => {
                const next = active ? "" : b;
                setBenefit(next);
                // チップクリックで即検索（UX 的に素直）
                submit({ benefit: next });
              }}
              className={
                "rounded-full border px-2 py-0.5 text-[11px] transition " +
                (active
                  ? "border-vermilion bg-vermilion text-white"
                  : "border-border bg-washi text-sumi/80 hover:bg-kinari")
              }
            >
              {b}
            </button>
          );
        })}
      </div>
    ),
    [benefit, submit],
  );

  return (
    <div
      ref={containerRef}
      className={`${widthClass} ${className}`}
    >
      <form
        onSubmit={onSubmit}
        className="relative rounded-md border border-border bg-washi/95 shadow-sm"
      >
        <div className="flex items-center gap-1 p-1">
          <input
            type="search"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            placeholder={t("placeholder")}
            className="flex-1 rounded bg-transparent px-2 py-2 text-sm text-sumi placeholder:text-sumi/40 focus:outline-none"
            aria-label={t("submit")}
          />
          <button
            type="submit"
            className="rounded bg-vermilion px-3 py-2 text-xs font-semibold text-white hover:bg-vermilion/90"
          >
            {t("submit")}
          </button>
        </div>

        {/* compact ではご利益チップのみ（スクロール可能）。default では更に都道府県・祭神フィルタを並べる */}
        <div className="border-t border-border/60 px-2 py-1">
          {chipList}
        </div>
        {!compact ? (
          <div className="grid grid-cols-1 gap-2 border-t border-border/60 p-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-[11px] text-sumi/70">
              <span className="w-20 shrink-0">{t("prefecture")}</span>
              <select
                value={prefecture}
                onChange={(e) => {
                  const v = e.target.value;
                  setPrefecture(v);
                  submit({ prefecture: v });
                }}
                className="flex-1 rounded border border-border bg-white px-2 py-1.5 text-xs text-sumi"
              >
                <option value="">—</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[11px] text-sumi/70">
              <span className="w-20 shrink-0">{t("deity")}</span>
              <input
                type="search"
                value={deity}
                onChange={(e) => setDeity(e.target.value)}
                onBlur={() => submit()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="例: 天照大御神"
                className="flex-1 rounded border border-border bg-white px-2 py-1.5 text-xs text-sumi"
              />
            </label>
          </div>
        ) : null}

        {/* サジェスト */}
        {open && (suggestions.length > 0 || loading) ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-md border border-border bg-white shadow-lg">
            {loading ? (
              <div className="px-3 py-2 text-xs text-sumi/60">検索中…</div>
            ) : null}
            <ul>
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/shrines/${spotSlug(s)}`);
                      setOpen(false);
                    }}
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-xs hover:bg-kinari"
                  >
                    <span className="font-semibold text-sumi">{s.name}</span>
                    <span className="text-[11px] text-sumi/60">
                      {[s.prefecture, s.shrine_type].filter(Boolean).join(" / ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </form>
    </div>
  );
}
