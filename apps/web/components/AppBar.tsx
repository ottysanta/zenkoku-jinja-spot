"use client";
/**
 * 全域で使う細身のアプリバー。右上は「マイページ」+「言語切替」のドロップダウン。
 * - /map では MapView 側が h-[calc(100dvh-var(--app-bar-h))] を使う
 * - ドロップダウン内に主要リンクもまとめる（モバイルのナビとしても機能）
 */
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { routing } from "../i18n/routing";
import TextSizeSwitcher from "./TextSizeSwitcher";

const NAV_ITEMS: Array<{ href: "/" | "/map" | "/search" | "/learn" | "/offerings" | "/me" | "/submit-shrine"; label: string; icon: string }> = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/map", label: "地図", icon: "🗺" },
  { href: "/search", label: "一覧", icon: "≣" },
  { href: "/learn", label: "学ぶ", icon: "📖" },
  { href: "/offerings", label: "奉納", icon: "🙏" },
  { href: "/me", label: "マイページ", icon: "👤" },
  { href: "/submit-shrine", label: "神社の掲載申請", icon: "📝" },
];

export default function AppBar() {
  const locale = useLocale();
  const t = useTranslations("locale");
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return; // メニューが閉じているときは outside-click ハンドラ不要
    // 開いた直後の同じ tap が closer になるのを防ぐため 1 tick 遅らせる
    let active = false;
    const armTimer = setTimeout(() => { active = true; }, 300);
    const onDown = (e: Event) => {
      if (!active) return;
      if (!menuRef.current) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      clearTimeout(armTimer);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [menuOpen]);

  // パス変更時は閉じる
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function changeLocale(next: string) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    startTransition(() => router.refresh());
  }

  return (
    <header
      className="fixed inset-x-0 top-0 z-[60] flex h-10 items-center justify-between border-b border-border bg-washi/95 px-3 backdrop-blur"
      style={{ ["--app-bar-h" as string]: "40px" }}
    >
      <Link href="/" className="flex items-center gap-2 text-sm">
        <span className="text-base">⛩</span>
        <span className="font-serif font-bold text-sumi">全国神社スポット</span>
      </Link>

      <div className="flex items-center gap-2">
        {/* 文字サイズ: デスクトップでは常設、モバイルはメニュー内 */}
        <div className="hidden md:block">
          <TextSizeSwitcher />
        </div>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="flex min-h-[32px] items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs text-sumi hover:bg-kinari active:bg-kinari"
          style={{ touchAction: "manipulation" }}
        >
          <span aria-hidden="true">☰</span>
          <span>メニュー</span>
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-md border border-border bg-white shadow-lg"
          >
            <ul className="py-1 text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      "flex items-center gap-2 px-3 py-2 text-sumi hover:bg-kinari " +
                      (pathname === item.href ? "bg-kinari/60 font-semibold" : "")
                    }
                  >
                    <span className="w-5 text-center" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {/* モバイル向け: メニュー内に文字サイズ切替 */}
            <div className="border-t border-border px-3 py-2 md:hidden">
              <p className="mb-1 text-[11px] text-sumi/70">文字サイズ</p>
              <TextSizeSwitcher />
            </div>
            <div className="border-t border-border px-3 py-2">
              <label className="flex items-center justify-between gap-2 text-[11px] text-sumi/70">
                <span>🌐 言語</span>
                <select
                  value={locale}
                  onChange={(e) => changeLocale(e.target.value)}
                  className="rounded border border-border bg-white px-2 py-1 text-xs text-sumi outline-none"
                >
                  {routing.locales.map((loc) => (
                    <option key={loc} value={loc}>
                      {t(loc)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : null}
      </div>
      </div>
    </header>
  );
}
