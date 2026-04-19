"use client";
/**
 * シンプルな写真ライトボックス（Comfy の画像カルーセル参考）。
 * - 単一画像のみ対応（Phase 2 で複数枚対応に拡張）
 * - Esc で閉じる、背景クリックで閉じる、× ボタン
 * - 写真は画面の中心に max-h-[90vh] でフィット表示
 */
import { useEffect } from "react";

type Props = {
  src: string;
  alt: string;
  caption?: string;
  open: boolean;
  onClose: () => void;
};

export default function PhotoLightbox({ src, alt, caption, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // スクロール固定
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="閉じる"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-xl text-white hover:bg-white/20"
      >
        ✕
      </button>
      <div
        className="relative flex max-h-full max-w-full flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-full rounded-md object-contain shadow-2xl"
        />
        {caption ? (
          <p className="mt-3 max-w-xl text-center text-xs text-white/80">{caption}</p>
        ) : null}
      </div>
    </div>
  );
}
