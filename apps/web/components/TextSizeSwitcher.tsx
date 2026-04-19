"use client";
/**
 * 文字サイズ切替 (A- / A / A+ / A++)。
 * - html[data-text-size] を書き換えて rem ベースで全体が追従
 * - localStorage に保存して次回訪問時も復元
 * - 年配ユーザー向けのアクセシビリティ標準機能として AppBar 内に常設
 */
import { useEffect, useState } from "react";

const OPTIONS = [
  { key: "small", label: "小", font: "0.85rem" },
  { key: "normal", label: "中", font: "1rem" },
  { key: "large", label: "大", font: "1.15rem" },
  { key: "xlarge", label: "特大", font: "1.25rem" },
] as const;

type SizeKey = (typeof OPTIONS)[number]["key"];

const STORAGE_KEY = "ssp_text_size";

export default function TextSizeSwitcher() {
  const [size, setSize] = useState<SizeKey>("normal");

  // 起動時に LS から復元
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SizeKey | null;
      if (saved && OPTIONS.some((o) => o.key === saved)) {
        setSize(saved);
        document.documentElement.dataset.textSize = saved;
      } else {
        document.documentElement.dataset.textSize = "normal";
      }
    } catch {}
  }, []);

  function change(next: SizeKey) {
    setSize(next);
    document.documentElement.dataset.textSize = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  return (
    <div
      role="group"
      aria-label="文字サイズ"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-white p-0.5 text-[11px] shadow-sm"
    >
      <span className="px-1.5 text-sumi/55" aria-hidden="true">
        文字
      </span>
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => change(o.key)}
          aria-pressed={size === o.key}
          title={`文字サイズを「${o.label}」に`}
          className={
            "rounded-full px-2 py-0.5 font-semibold leading-none transition " +
            (size === o.key
              ? "bg-vermilion text-white"
              : "text-sumi/80 hover:bg-kinari")
          }
          style={{ fontSize: o.font }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
